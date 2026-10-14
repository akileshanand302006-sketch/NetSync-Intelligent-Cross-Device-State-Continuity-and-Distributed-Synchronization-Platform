"""
NetSync Connection Manager
============================
Orchestrates TCP client connections, discovery, and connection routing.
Manages the decision between LAN direct and cloud relay paths.
"""

from __future__ import annotations

import asyncio
import logging
import time
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Callable, Coroutine

from netsync_network.config import NetSyncConfig
from netsync_network.transport.tcp_client import TCPClient
from netsync_network.transport.tcp_server import TCPServer, ClientConnection
from netsync_network.transport.udp_transport import UDPDiscovery, DiscoveredDevice
from netsync_network.protocol.frame import Frame, MessageType

logger = logging.getLogger(__name__)


class ConnectionRoute(str, Enum):
    """How two devices are connected."""
    LAN_DIRECT = "lan_direct"
    CLOUD_RELAY = "cloud_relay"
    UNKNOWN = "unknown"


@dataclass
class DeviceConnection:
    """Tracks a connection to a specific device."""
    device_id: str
    device_name: str
    route: ConnectionRoute = ConnectionRoute.UNKNOWN
    client: TCPClient | None = None
    server_conn_id: str | None = None  # Connection ID on our server
    lan_host: str | None = None
    lan_port: int | None = None
    connected: bool = False
    last_latency_ms: float = 0.0
    connected_at: float = 0.0
    bytes_transferred: int = 0


class ConnectionManager:
    """
    Manages connections to all known devices.

    Coordinates between:
    - LAN direct connections (TCP via discovered devices)
    - Cloud relay connections (via backend WebSocket)
    - Connection lifecycle (connect, reconnect, disconnect)
    - Route selection (prefer LAN when available)
    """

    def __init__(self, config: NetSyncConfig) -> None:
        self.config = config
        self._server: TCPServer | None = None
        self._discovery: UDPDiscovery | None = None
        self._device_connections: dict[str, DeviceConnection] = {}
        self._running = False
        self._message_handlers: dict[MessageType, list[Callable]] = {}

    @property
    def devices(self) -> dict[str, DeviceConnection]:
        """All known device connections."""
        return dict(self._device_connections)

    @property
    def connected_devices(self) -> list[DeviceConnection]:
        """Currently connected devices."""
        return [d for d in self._device_connections.values() if d.connected]

    async def start(self) -> None:
        """Start the connection manager, TCP server, and discovery."""
        self._running = True

        # Start TCP server
        self._server = TCPServer(self.config.transport)
        self._server.on_connect(self._handle_incoming_connection)
        self._server.on_disconnect(self._handle_incoming_disconnect)

        # Register message forwarding
        for msg_type in MessageType:
            self._server.register_handler(msg_type, self._forward_message)

        await self._server.start()

        # Start UDP discovery
        if self.config.discovery.udp_broadcast_enabled:
            self._discovery = UDPDiscovery(
                device_id=self.config.device_id,
                device_name=self.config.device_name,
                device_platform=self.config.device_platform,
                tcp_port=self.config.transport.tcp_port,
                transport_config=self.config.transport,
                discovery_config=self.config.discovery,
            )
            self._discovery.on_device_found(self._on_device_discovered)
            self._discovery.on_device_lost(self._on_device_lost)
            await self._discovery.start()

        logger.info("Connection manager started")

    async def stop(self) -> None:
        """Stop everything gracefully."""
        self._running = False

        # Disconnect all clients
        for dev_conn in self._device_connections.values():
            if dev_conn.client:
                await dev_conn.client.disconnect()

        if self._discovery:
            await self._discovery.stop()
        if self._server:
            await self._server.stop()

        logger.info("Connection manager stopped")

    async def connect_to_device(
        self,
        device_id: str,
        host: str,
        port: int,
        device_name: str = "",
    ) -> DeviceConnection:
        """
        Establish a direct LAN connection to a device.

        Args:
            device_id: Target device ID.
            host: Target host address.
            port: Target TCP port.
            device_name: Human-readable device name.

        Returns:
            DeviceConnection tracking object.
        """
        dev_conn = self._device_connections.get(device_id)
        if dev_conn and dev_conn.connected:
            return dev_conn

        client = TCPClient(host, port, self.config.transport)

        # Register handlers on client
        for msg_type in MessageType:
            client.register_handler(msg_type, self._make_client_handler(device_id))

        start_time = time.time()
        await client.connect(auto_reconnect=True)
        connect_time = (time.time() - start_time) * 1000

        dev_conn = DeviceConnection(
            device_id=device_id,
            device_name=device_name,
            route=ConnectionRoute.LAN_DIRECT,
            client=client,
            lan_host=host,
            lan_port=port,
            connected=True,
            last_latency_ms=connect_time,
            connected_at=time.time(),
        )
        self._device_connections[device_id] = dev_conn

        logger.info(
            "Connected to device %s at %s:%d (%.1fms)",
            device_name, host, port, connect_time,
        )
        return dev_conn

    async def send_to_device(
        self,
        device_id: str,
        message_type: MessageType,
        payload: Any,
        **kwargs: Any,
    ) -> bool:
        """Send a message to a specific device via the best available route."""
        dev_conn = self._device_connections.get(device_id)
        if not dev_conn or not dev_conn.connected:
            logger.warning("Device %s not connected", device_id)
            return False

        try:
            if dev_conn.client and dev_conn.client.connected:
                await dev_conn.client.send(message_type, payload, **kwargs)
                return True
            elif dev_conn.server_conn_id and self._server:
                from netsync_network.protocol.codec import MessageCodec
                frame_bytes = MessageCodec.encode_message(message_type, payload, **kwargs)
                return await self._server.send_to(dev_conn.server_conn_id, frame_bytes)
        except (ConnectionError, OSError) as e:
            logger.warning("Failed to send to device %s: %s", device_id, e)

        return False

    def on_message(self, message_type: MessageType, handler: Callable) -> None:
        """Register a handler for a message type from any device."""
        self._message_handlers.setdefault(message_type, []).append(handler)

    # ─── Internal ─────────────────────────────────────────────────────────────

    async def _on_device_discovered(self, device: DiscoveredDevice) -> None:
        """Handle a newly discovered device on LAN."""
        if device.device_id not in self._device_connections:
            self._device_connections[device.device_id] = DeviceConnection(
                device_id=device.device_id,
                device_name=device.device_name,
                route=ConnectionRoute.LAN_DIRECT,
                lan_host=device.host,
                lan_port=device.port,
                connected=False,
            )
            logger.info("Device available on LAN: %s", device.device_name)

    async def _on_device_lost(self, device: DiscoveredDevice) -> None:
        """Handle a device disappearing from LAN."""
        dev_conn = self._device_connections.get(device.device_id)
        if dev_conn and dev_conn.route == ConnectionRoute.LAN_DIRECT:
            dev_conn.connected = False
            if dev_conn.client:
                await dev_conn.client.disconnect()
            logger.info("Device lost from LAN: %s", device.device_name)

    async def _handle_incoming_connection(self, conn: ClientConnection) -> None:
        """Handle a new incoming TCP connection."""
        logger.info("Incoming connection from %s", conn.remote_addr)

    async def _handle_incoming_disconnect(self, conn: ClientConnection) -> None:
        """Handle a disconnected incoming TCP connection."""
        for dev_conn in self._device_connections.values():
            if dev_conn.server_conn_id == conn.connection_id:
                dev_conn.connected = False
                dev_conn.server_conn_id = None
                logger.info("Device %s disconnected", dev_conn.device_name)
                break

    async def _forward_message(
        self, conn: ClientConnection, frame: Frame, payload: Any
    ) -> None:
        """Forward incoming messages to registered handlers."""
        handlers = self._message_handlers.get(frame.message_type, [])
        for handler in handlers:
            try:
                await handler(conn, frame, payload)
            except Exception as e:
                logger.error("Message handler error: %s", e)

    def _make_client_handler(self, device_id: str) -> Callable:
        """Create a message handler bound to a specific device."""
        async def handler(frame: Frame, payload: Any) -> None:
            handlers = self._message_handlers.get(frame.message_type, [])
            for h in handlers:
                try:
                    await h(device_id, frame, payload)
                except Exception as e:
                    logger.error("Client handler error: %s", e)
        return handler
