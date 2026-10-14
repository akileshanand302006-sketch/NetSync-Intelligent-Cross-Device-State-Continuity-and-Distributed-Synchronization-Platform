"""
NetSync TCP Server
==================
Asynchronous TCP server with concurrent connection management,
heartbeat monitoring, and frame-based message dispatch.

Uses asyncio for I/O multiplexing — no thread-per-client.
"""

from __future__ import annotations

import asyncio
import logging
import time
import uuid
from dataclasses import dataclass, field
from typing import Any, Callable, Coroutine

from netsync_network.config import TransportConfig
from netsync_network.protocol.codec import MessageCodec
from netsync_network.protocol.frame import (
    Frame,
    FrameError,
    FrameFlags,
    MessageType,
)
from netsync_network.protocol.messages import HeartbeatPayload

logger = logging.getLogger(__name__)


@dataclass
class ClientConnection:
    """Represents a connected client with metadata."""
    connection_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    reader: asyncio.StreamReader | None = None
    writer: asyncio.StreamWriter | None = None
    device_id: int = 0
    device_name: str = ""
    remote_addr: tuple[str, int] = ("", 0)
    connected_at: float = field(default_factory=time.time)
    last_seen: float = field(default_factory=time.time)
    last_heartbeat: float = field(default_factory=time.time)
    authenticated: bool = False
    bytes_received: int = 0
    bytes_sent: int = 0
    messages_received: int = 0
    messages_sent: int = 0

    @property
    def is_alive(self) -> bool:
        """Check if connection is still open."""
        return self.writer is not None and not self.writer.is_closing()


# Type alias for message handlers
MessageHandler = Callable[[ClientConnection, Frame, Any], Coroutine[Any, Any, None]]


class TCPServer:
    """
    Asynchronous TCP server for NetSync protocol.

    Manages concurrent client connections using asyncio tasks (not threads).
    Each connection runs in its own coroutine, reading framed messages and
    dispatching them to registered handlers.

    Features:
    - Length-prefixed frame reading (handles partial TCP reads)
    - Per-message-type handler registration
    - Heartbeat monitoring with automatic disconnect
    - Connection lifecycle management
    - Graceful shutdown
    """

    def __init__(self, config: TransportConfig | None = None) -> None:
        self.config = config or TransportConfig()
        self._server: asyncio.Server | None = None
        self._connections: dict[str, ClientConnection] = {}
        self._handlers: dict[MessageType, MessageHandler] = {}
        self._running = False
        self._heartbeat_task: asyncio.Task[None] | None = None
        self._on_connect: Callable[[ClientConnection], Coroutine[Any, Any, None]] | None = None
        self._on_disconnect: Callable[[ClientConnection], Coroutine[Any, Any, None]] | None = None

    @property
    def connections(self) -> dict[str, ClientConnection]:
        """Active connections by connection_id."""
        return dict(self._connections)

    @property
    def connection_count(self) -> int:
        """Number of active connections."""
        return len(self._connections)

    def on_message(self, message_type: MessageType) -> Callable:
        """Decorator to register a handler for a specific message type."""
        def decorator(func: MessageHandler) -> MessageHandler:
            self._handlers[message_type] = func
            return func
        return decorator

    def register_handler(self, message_type: MessageType, handler: MessageHandler) -> None:
        """Register a handler for a message type."""
        self._handlers[message_type] = handler

    def on_connect(self, func: Callable[[ClientConnection], Coroutine[Any, Any, None]]) -> None:
        """Register a callback for new connections."""
        self._on_connect = func

    def on_disconnect(self, func: Callable[[ClientConnection], Coroutine[Any, Any, None]]) -> None:
        """Register a callback for disconnections."""
        self._on_disconnect = func

    async def start(self, host: str | None = None, port: int | None = None) -> None:
        """
        Start the TCP server.

        Args:
            host: Listen address (default from config).
            port: Listen port (default from config).
        """
        host = host or self.config.tcp_host
        port = port or self.config.tcp_port

        self._server = await asyncio.start_server(
            self._handle_connection,
            host=host,
            port=port,
            backlog=self.config.tcp_backlog,
        )
        self._running = True

        # Start heartbeat monitor
        self._heartbeat_task = asyncio.create_task(self._heartbeat_monitor())

        addrs = ", ".join(str(sock.getsockname()) for sock in self._server.sockets)
        logger.info("TCP server listening on %s", addrs)

    async def stop(self) -> None:
        """Gracefully stop the server and all connections."""
        logger.info("Stopping TCP server...")
        self._running = False

        # Cancel heartbeat monitor
        if self._heartbeat_task:
            self._heartbeat_task.cancel()
            try:
                await self._heartbeat_task
            except asyncio.CancelledError:
                pass

        # Close all client connections
        for conn in list(self._connections.values()):
            await self._close_connection(conn, reason="server_shutdown")

        # Stop the server
        if self._server:
            self._server.close()
            await self._server.wait_closed()

        logger.info("TCP server stopped")

    async def send_to(self, connection_id: str, frame_bytes: bytes) -> bool:
        """
        Send a frame to a specific connected client.

        Returns True if sent successfully, False otherwise.
        """
        conn = self._connections.get(connection_id)
        if not conn or not conn.is_alive:
            return False

        try:
            await MessageCodec.write_frame(conn.writer, frame_bytes)
            conn.bytes_sent += len(frame_bytes)
            conn.messages_sent += 1
            return True
        except (ConnectionError, OSError) as e:
            logger.warning("Failed to send to %s: %s", connection_id, e)
            await self._close_connection(conn, reason="send_error")
            return False

    async def broadcast(self, frame_bytes: bytes, exclude: str | None = None) -> int:
        """
        Send a frame to all connected clients.

        Args:
            frame_bytes: Encoded frame to broadcast.
            exclude: Connection ID to exclude from broadcast.

        Returns:
            Number of clients the message was sent to.
        """
        sent_count = 0
        for conn_id, conn in list(self._connections.items()):
            if conn_id != exclude and conn.is_alive:
                if await self.send_to(conn_id, frame_bytes):
                    sent_count += 1
        return sent_count

    def get_connection_by_device(self, device_id: int) -> ClientConnection | None:
        """Find a connection by device ID."""
        for conn in self._connections.values():
            if conn.device_id == device_id:
                return conn
        return None

    # ─── Internal Methods ─────────────────────────────────────────────────────

    async def _handle_connection(
        self,
        reader: asyncio.StreamReader,
        writer: asyncio.StreamWriter,
    ) -> None:
        """Handle a new client connection."""
        peer = writer.get_extra_info("peername")
        conn = ClientConnection(
            reader=reader,
            writer=writer,
            remote_addr=peer or ("unknown", 0),
        )

        # Check connection limit
        if len(self._connections) >= self.config.max_connections:
            logger.warning("Connection limit reached, rejecting %s", peer)
            writer.close()
            await writer.wait_closed()
            return

        self._connections[conn.connection_id] = conn
        logger.info("New connection %s from %s", conn.connection_id[:8], peer)

        if self._on_connect:
            await self._on_connect(conn)

        try:
            await self._read_loop(conn)
        except asyncio.CancelledError:
            pass
        except Exception as e:
            logger.error("Unhandled error in connection %s: %s", conn.connection_id[:8], e)
        finally:
            await self._close_connection(conn, reason="read_loop_ended")

    async def _read_loop(self, conn: ClientConnection) -> None:
        """
        Continuously read frames from a client connection.

        Uses MessageCodec.read_frame() which handles partial TCP reads
        by reading the fixed-size header first, then exactly payload_length bytes.
        """
        while self._running and conn.is_alive:
            try:
                frame = await asyncio.wait_for(
                    MessageCodec.read_frame(conn.reader),
                    timeout=self.config.tcp_read_timeout,
                )
            except asyncio.TimeoutError:
                logger.debug("Read timeout for %s", conn.connection_id[:8])
                continue
            except asyncio.IncompleteReadError:
                logger.info("Connection %s closed by peer", conn.connection_id[:8])
                break
            except FrameError as e:
                logger.warning("Malformed frame from %s: %s", conn.connection_id[:8], e)
                # Send error response and continue — don't drop connection for one bad frame
                error_frame = MessageCodec.encode_message(
                    MessageType.ERROR,
                    b'{"code":400,"message":"Malformed frame"}',
                )
                await self.send_to(conn.connection_id, error_frame)
                continue
            except (ConnectionError, OSError):
                logger.info("Connection %s lost", conn.connection_id[:8])
                break

            # Update connection stats
            conn.last_seen = time.time()
            conn.bytes_received += frame.total_size
            conn.messages_received += 1

            # Handle heartbeats internally
            if frame.message_type == MessageType.HEARTBEAT:
                conn.last_heartbeat = time.time()
                await self._handle_heartbeat(conn, frame)
                continue

            # Dispatch to registered handler
            handler = self._handlers.get(frame.message_type)
            if handler:
                try:
                    _, payload = MessageCodec.decode_frame(
                        frame.encode()
                    )
                    await handler(conn, frame, payload)
                except Exception as e:
                    logger.error(
                        "Handler error for %s from %s: %s",
                        frame.message_type.name,
                        conn.connection_id[:8],
                        e,
                    )
            else:
                logger.debug(
                    "No handler for message type %s",
                    frame.message_type.name,
                )

    async def _handle_heartbeat(self, conn: ClientConnection, frame: Frame) -> None:
        """Respond to a heartbeat with a heartbeat ACK."""
        response = MessageCodec.encode_message(
            MessageType.HEARTBEAT,
            HeartbeatPayload(
                pending_sync_count=0,
            ),
            flags=FrameFlags.NONE,
            sequence_number=frame.sequence_number,
        )
        await self.send_to(conn.connection_id, response)

    async def _heartbeat_monitor(self) -> None:
        """Periodically check for stale connections."""
        while self._running:
            await asyncio.sleep(self.config.heartbeat_interval)

            now = time.time()
            stale = []
            for conn_id, conn in self._connections.items():
                elapsed = now - conn.last_seen
                if elapsed > self.config.heartbeat_timeout:
                    stale.append(conn)
                    logger.info(
                        "Connection %s timed out (%.0fs since last activity)",
                        conn_id[:8], elapsed,
                    )

            for conn in stale:
                await self._close_connection(conn, reason="heartbeat_timeout")

    async def _close_connection(self, conn: ClientConnection, reason: str = "") -> None:
        """Close a client connection and clean up."""
        conn_id = conn.connection_id
        if conn_id not in self._connections:
            return  # Already cleaned up

        del self._connections[conn_id]

        if self._on_disconnect:
            try:
                await self._on_disconnect(conn)
            except Exception as e:
                logger.error("Disconnect callback error: %s", e)

        if conn.writer and not conn.writer.is_closing():
            try:
                conn.writer.close()
                await conn.writer.wait_closed()
            except (ConnectionError, OSError):
                pass

        logger.info(
            "Connection %s closed (reason=%s, rx=%d msgs, tx=%d msgs)",
            conn_id[:8], reason, conn.messages_received, conn.messages_sent,
        )
