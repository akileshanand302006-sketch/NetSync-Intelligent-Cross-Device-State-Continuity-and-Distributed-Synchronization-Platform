"""
NetSync UDP Transport & Discovery
==================================
UDP-based local network device discovery using broadcast messages.

Discovery messages contain:
- Protocol version
- Service identifier
- Ephemeral instance ID (to distinguish restarts)
- Advertised TCP service port
- Short-lived challenge nonce (reduces replay/spoofing risk)

Security notes:
- Discovery broadcasts are UNTRUSTED until pairing completes
- No passwords, tokens, or private keys are placed in discovery messages
- Guest Wi-Fi isolation, firewalls, VPNs, and multicast filtering may prevent discovery
- Mobile OS restrictions may limit background broadcast capability
"""

from __future__ import annotations

import asyncio
import hashlib
import json
import logging
import os
import socket
import struct
import time
from dataclasses import dataclass, field
from typing import Callable, Coroutine, Any

from netsync_network.config import DiscoveryConfig, TransportConfig

logger = logging.getLogger(__name__)


@dataclass
class DiscoveredDevice:
    """A device found via UDP discovery."""
    device_id: str
    device_name: str
    device_platform: str
    host: str
    port: int
    protocol_version: int
    instance_id: str  # Ephemeral — changes on restart
    discovered_at: float = field(default_factory=time.time)
    last_seen: float = field(default_factory=time.time)
    challenge_nonce: str = ""


# Discovery message format:
# JSON payload inside a simple envelope:
# [4 bytes magic "NSDI"] [2 bytes version] [2 bytes payload_len] [payload]
DISCOVERY_MAGIC = b"NSDI"
DISCOVERY_HEADER = "!4sHH"
DISCOVERY_HEADER_SIZE = struct.calcsize(DISCOVERY_HEADER)


class UDPDiscovery:
    """
    UDP broadcast-based device discovery for LAN networks.

    Broadcasts a discovery announcement at regular intervals and
    listens for announcements from other NetSync instances.
    """

    def __init__(
        self,
        device_id: str,
        device_name: str,
        device_platform: str,
        tcp_port: int,
        transport_config: TransportConfig | None = None,
        discovery_config: DiscoveryConfig | None = None,
    ) -> None:
        self.device_id = device_id
        self.device_name = device_name
        self.device_platform = device_platform
        self.tcp_port = tcp_port
        self.transport_config = transport_config or TransportConfig()
        self.discovery_config = discovery_config or DiscoveryConfig()

        self._instance_id = hashlib.sha256(os.urandom(32)).hexdigest()[:16]
        self._discovered: dict[str, DiscoveredDevice] = {}
        self._running = False
        self._broadcast_task: asyncio.Task[None] | None = None
        self._listen_task: asyncio.Task[None] | None = None
        self._sock: socket.socket | None = None
        self._on_device_found: Callable[[DiscoveredDevice], Coroutine[Any, Any, None]] | None = None
        self._on_device_lost: Callable[[DiscoveredDevice], Coroutine[Any, Any, None]] | None = None

    @property
    def discovered_devices(self) -> dict[str, DiscoveredDevice]:
        """Currently discovered devices (by device_id)."""
        return dict(self._discovered)

    def on_device_found(
        self, func: Callable[[DiscoveredDevice], Coroutine[Any, Any, None]]
    ) -> None:
        """Register callback for newly discovered devices."""
        self._on_device_found = func

    def on_device_lost(
        self, func: Callable[[DiscoveredDevice], Coroutine[Any, Any, None]]
    ) -> None:
        """Register callback for devices that stop responding."""
        self._on_device_lost = func

    async def start(self) -> None:
        """Start discovery broadcasting and listening."""
        self._running = True

        # Create UDP socket with broadcast capability
        self._sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        self._sock.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1)
        self._sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        self._sock.setblocking(False)

        try:
            self._sock.bind(("", self.transport_config.udp_broadcast_port))
        except OSError as e:
            logger.warning("Could not bind UDP discovery port: %s", e)
            # Try ephemeral port
            self._sock.bind(("", 0))

        self._broadcast_task = asyncio.create_task(self._broadcast_loop())
        self._listen_task = asyncio.create_task(self._listen_loop())

        logger.info(
            "UDP discovery started (broadcast port %d, instance %s)",
            self.transport_config.udp_broadcast_port,
            self._instance_id[:8],
        )

    async def stop(self) -> None:
        """Stop discovery."""
        self._running = False

        if self._broadcast_task:
            self._broadcast_task.cancel()
            try:
                await self._broadcast_task
            except asyncio.CancelledError:
                pass

        if self._listen_task:
            self._listen_task.cancel()
            try:
                await self._listen_task
            except asyncio.CancelledError:
                pass

        if self._sock:
            self._sock.close()

        logger.info("UDP discovery stopped")

    def _build_announcement(self) -> bytes:
        """Build a discovery announcement message."""
        nonce = hashlib.sha256(os.urandom(16)).hexdigest()[:12]

        payload = json.dumps({
            "service": "netsync",
            "protocol_version": 1,
            "device_id": self.device_id,
            "device_name": self.device_name,
            "device_platform": self.device_platform,
            "tcp_port": self.tcp_port,
            "instance_id": self._instance_id,
            "challenge_nonce": nonce,
            "timestamp": time.time(),
        }, separators=(",", ":")).encode("utf-8")

        header = struct.pack(DISCOVERY_HEADER, DISCOVERY_MAGIC, 1, len(payload))
        return header + payload

    def _parse_announcement(self, data: bytes, addr: tuple[str, int]) -> DiscoveredDevice | None:
        """Parse a received discovery announcement."""
        if len(data) < DISCOVERY_HEADER_SIZE:
            return None

        magic, version, payload_len = struct.unpack(
            DISCOVERY_HEADER, data[:DISCOVERY_HEADER_SIZE]
        )

        if magic != DISCOVERY_MAGIC:
            return None
        if version < 1:
            return None
        if len(data) < DISCOVERY_HEADER_SIZE + payload_len:
            return None

        try:
            payload = json.loads(
                data[DISCOVERY_HEADER_SIZE:DISCOVERY_HEADER_SIZE + payload_len].decode("utf-8")
            )
        except (json.JSONDecodeError, UnicodeDecodeError):
            return None

        if payload.get("service") != "netsync":
            return None

        # Don't discover ourselves
        if payload.get("device_id") == self.device_id:
            return None

        return DiscoveredDevice(
            device_id=payload["device_id"],
            device_name=payload.get("device_name", "Unknown"),
            device_platform=payload.get("device_platform", "unknown"),
            host=addr[0],
            port=payload.get("tcp_port", self.transport_config.tcp_port),
            protocol_version=payload.get("protocol_version", 1),
            instance_id=payload.get("instance_id", ""),
            challenge_nonce=payload.get("challenge_nonce", ""),
        )

    async def _broadcast_loop(self) -> None:
        """Periodically broadcast discovery announcements."""
        loop = asyncio.get_event_loop()
        while self._running:
            try:
                announcement = self._build_announcement()
                await loop.sock_sendto(
                    self._sock,
                    announcement,
                    ("<broadcast>", self.transport_config.udp_broadcast_port),
                )
                logger.debug("Broadcast discovery announcement (%d bytes)", len(announcement))
            except OSError as e:
                logger.debug("Broadcast failed: %s", e)

            await asyncio.sleep(self.discovery_config.broadcast_interval)

    async def _listen_loop(self) -> None:
        """Listen for discovery announcements from other devices."""
        loop = asyncio.get_event_loop()
        while self._running:
            try:
                data, addr = await asyncio.wait_for(
                    loop.sock_recvfrom(self._sock, self.transport_config.udp_buffer_size),
                    timeout=self.discovery_config.broadcast_interval * 2,
                )
            except asyncio.TimeoutError:
                # Check for lost devices
                await self._prune_stale_devices()
                continue
            except OSError as e:
                logger.debug("Listen error: %s", e)
                await asyncio.sleep(1)
                continue

            device = self._parse_announcement(data, addr)
            if device is None:
                continue

            is_new = device.device_id not in self._discovered
            self._discovered[device.device_id] = device

            if is_new:
                logger.info(
                    "Discovered device: %s (%s) at %s:%d",
                    device.device_name, device.device_platform,
                    device.host, device.port,
                )
                if self._on_device_found:
                    await self._on_device_found(device)
            else:
                self._discovered[device.device_id].last_seen = time.time()

    async def _prune_stale_devices(self) -> None:
        """Remove devices that haven't been seen recently."""
        now = time.time()
        timeout = self.discovery_config.discovery_timeout
        stale = [
            did for did, dev in self._discovered.items()
            if now - dev.last_seen > timeout
        ]
        for did in stale:
            device = self._discovered.pop(did)
            logger.info("Device lost: %s (%s)", device.device_name, device.device_id[:8])
            if self._on_device_lost:
                await self._on_device_lost(device)
