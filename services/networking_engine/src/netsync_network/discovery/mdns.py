"""
NetSync mDNS Discovery
=======================
Uses zeroconf for mDNS/DNS-SD service discovery on local networks.

Limitations documented:
- Guest Wi-Fi networks often block multicast
- Some corporate firewalls filter mDNS
- VPN tunnels may not forward multicast
- Mobile OS background restrictions limit discovery
- Some network switches filter multicast traffic
"""

from __future__ import annotations

import asyncio
import logging
import socket
import time
from dataclasses import dataclass, field
from typing import Callable, Coroutine, Any

from netsync_network.config import DiscoveryConfig, TransportConfig

logger = logging.getLogger(__name__)


@dataclass
class MDNSService:
    """A service discovered via mDNS."""
    name: str
    service_type: str
    host: str
    port: int
    properties: dict[str, str] = field(default_factory=dict)
    discovered_at: float = field(default_factory=time.time)


class MDNSDiscovery:
    """
    mDNS-based service discovery using zeroconf.

    Registers a NetSync service and browses for other instances
    on the local network.
    """

    def __init__(
        self,
        device_id: str,
        device_name: str,
        device_platform: str,
        tcp_port: int,
        config: DiscoveryConfig | None = None,
    ) -> None:
        self.device_id = device_id
        self.device_name = device_name
        self.device_platform = device_platform
        self.tcp_port = tcp_port
        self.config = config or DiscoveryConfig()

        self._zeroconf = None
        self._browser = None
        self._info = None
        self._discovered: dict[str, MDNSService] = {}
        self._on_found: Callable[[MDNSService], Coroutine[Any, Any, None]] | None = None
        self._on_removed: Callable[[MDNSService], Coroutine[Any, Any, None]] | None = None

    @property
    def discovered_services(self) -> dict[str, MDNSService]:
        return dict(self._discovered)

    def on_found(self, func: Callable[[MDNSService], Coroutine[Any, Any, None]]) -> None:
        self._on_found = func

    def on_removed(self, func: Callable[[MDNSService], Coroutine[Any, Any, None]]) -> None:
        self._on_removed = func

    async def start(self) -> None:
        """Start mDNS registration and browsing."""
        try:
            from zeroconf import Zeroconf, ServiceBrowser, ServiceInfo
            from zeroconf import ServiceStateChange
        except ImportError:
            logger.warning("zeroconf not installed — mDNS discovery disabled")
            return

        self._zeroconf = Zeroconf()

        # Register our service
        hostname = socket.gethostname()
        self._info = ServiceInfo(
            self.config.service_type,
            f"{self.device_name}.{self.config.service_type}",
            addresses=[socket.inet_aton(self._get_local_ip())],
            port=self.tcp_port,
            properties={
                "device_id": self.device_id,
                "device_name": self.device_name,
                "platform": self.device_platform,
                "version": "1",
            },
            server=f"{hostname}.local.",
        )

        try:
            await asyncio.get_event_loop().run_in_executor(
                None, self._zeroconf.register_service, self._info
            )
            logger.info("Registered mDNS service: %s", self.device_name)
        except Exception as e:
            logger.warning("Failed to register mDNS service: %s", e)

        # Browse for other services
        class _Listener:
            def __init__(self, parent: MDNSDiscovery):
                self.parent = parent

            def add_service(self, zc: Zeroconf, type_: str, name: str) -> None:
                info = zc.get_service_info(type_, name)
                if info:
                    asyncio.get_event_loop().call_soon_threadsafe(
                        asyncio.ensure_future,
                        self.parent._handle_service_found(info),
                    )

            def remove_service(self, zc: Zeroconf, type_: str, name: str) -> None:
                asyncio.get_event_loop().call_soon_threadsafe(
                    asyncio.ensure_future,
                    self.parent._handle_service_removed(name),
                )

            def update_service(self, zc: Zeroconf, type_: str, name: str) -> None:
                pass

        self._browser = ServiceBrowser(
            self._zeroconf,
            self.config.service_type,
            _Listener(self),
        )

    async def stop(self) -> None:
        """Stop mDNS."""
        if self._zeroconf:
            if self._info:
                await asyncio.get_event_loop().run_in_executor(
                    None, self._zeroconf.unregister_service, self._info
                )
            await asyncio.get_event_loop().run_in_executor(
                None, self._zeroconf.close
            )

    async def _handle_service_found(self, info: Any) -> None:
        """Handle a discovered mDNS service."""
        props = {}
        if info.properties:
            for k, v in info.properties.items():
                key = k.decode("utf-8") if isinstance(k, bytes) else str(k)
                val = v.decode("utf-8") if isinstance(v, bytes) else str(v)
                props[key] = val

        device_id = props.get("device_id", "")
        if device_id == self.device_id:
            return  # Skip ourselves

        addresses = info.parsed_addresses()
        if not addresses:
            return

        service = MDNSService(
            name=info.name,
            service_type=info.type,
            host=addresses[0],
            port=info.port,
            properties=props,
        )
        self._discovered[device_id or info.name] = service

        logger.info("mDNS: Found %s at %s:%d", props.get("device_name", "?"), service.host, service.port)
        if self._on_found:
            await self._on_found(service)

    async def _handle_service_removed(self, name: str) -> None:
        """Handle a removed mDNS service."""
        for did, svc in list(self._discovered.items()):
            if svc.name == name:
                del self._discovered[did]
                logger.info("mDNS: Lost %s", name)
                if self._on_removed:
                    await self._on_removed(svc)
                break

    @staticmethod
    def _get_local_ip() -> str:
        """Get the local IP address (best effort)."""
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.connect(("8.8.8.8", 80))
            ip = s.getsockname()[0]
            s.close()
            return ip
        except Exception:
            return "127.0.0.1"
