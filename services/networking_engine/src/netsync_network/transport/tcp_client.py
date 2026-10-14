"""
NetSync TCP Client
==================
Asynchronous TCP client with automatic reconnection,
heartbeat sending, and buffered frame I/O.
"""

from __future__ import annotations

import asyncio
import logging
import time
from dataclasses import dataclass, field
from typing import Any, Callable, Coroutine

from netsync_network.config import TransportConfig
from netsync_network.protocol.codec import MessageCodec
from netsync_network.protocol.frame import Frame, FrameError, FrameFlags, MessageType
from netsync_network.protocol.messages import HeartbeatPayload

logger = logging.getLogger(__name__)

MessageHandler = Callable[[Frame, Any], Coroutine[Any, Any, None]]


@dataclass
class ConnectionStats:
    """Client connection statistics."""
    connected_at: float = 0.0
    disconnected_at: float = 0.0
    bytes_sent: int = 0
    bytes_received: int = 0
    messages_sent: int = 0
    messages_received: int = 0
    reconnect_count: int = 0
    last_latency_ms: float = 0.0


class TCPClient:
    """
    Asynchronous TCP client for connecting to a NetSync server.

    Features:
    - Automatic reconnection with exponential backoff
    - Heartbeat sending
    - Frame-based message reading with partial-read handling
    - Per-message-type handler registration
    - Connection statistics tracking
    """

    def __init__(
        self,
        host: str,
        port: int,
        config: TransportConfig | None = None,
        device_id: int = 0,
    ) -> None:
        self.host = host
        self.port = port
        self.config = config or TransportConfig()
        self.device_id = device_id
        self.stats = ConnectionStats()

        self._reader: asyncio.StreamReader | None = None
        self._writer: asyncio.StreamWriter | None = None
        self._connected = False
        self._running = False
        self._handlers: dict[MessageType, MessageHandler] = {}
        self._read_task: asyncio.Task[None] | None = None
        self._heartbeat_task: asyncio.Task[None] | None = None
        self._sequence_counter = 0
        self._pending_acks: dict[int, asyncio.Future[Frame]] = {}
        self._on_connect: Callable[[], Coroutine[Any, Any, None]] | None = None
        self._on_disconnect: Callable[[], Coroutine[Any, Any, None]] | None = None

    @property
    def connected(self) -> bool:
        """Whether the client is currently connected."""
        return self._connected and self._writer is not None and not self._writer.is_closing()

    def next_sequence(self) -> int:
        """Get the next sequence number."""
        self._sequence_counter += 1
        return self._sequence_counter

    def on_message(self, message_type: MessageType) -> Callable:
        """Decorator to register a handler for a message type."""
        def decorator(func: MessageHandler) -> MessageHandler:
            self._handlers[message_type] = func
            return func
        return decorator

    def register_handler(self, message_type: MessageType, handler: MessageHandler) -> None:
        """Register a handler for a message type."""
        self._handlers[message_type] = handler

    async def connect(self, auto_reconnect: bool = True) -> None:
        """
        Connect to the server.

        Args:
            auto_reconnect: If True, automatically reconnect on connection loss.
        """
        self._running = True
        await self._establish_connection()

        if self._connected:
            self._read_task = asyncio.create_task(self._read_loop(auto_reconnect))
            self._heartbeat_task = asyncio.create_task(self._heartbeat_loop())

    async def disconnect(self) -> None:
        """Gracefully disconnect from the server."""
        self._running = False

        if self._heartbeat_task:
            self._heartbeat_task.cancel()
            try:
                await self._heartbeat_task
            except asyncio.CancelledError:
                pass

        if self._read_task:
            self._read_task.cancel()
            try:
                await self._read_task
            except asyncio.CancelledError:
                pass

        await self._close_connection()

    async def send(
        self,
        message_type: MessageType,
        payload: Any,
        *,
        flags: FrameFlags = FrameFlags.NONE,
        dest_device_id: int = 0,
        state_version: int = 0,
        session_id: bytes | None = None,
    ) -> int:
        """
        Send a message to the server.

        Args:
            message_type: Protocol message type.
            payload: Payload object or raw bytes.
            flags: Frame flags.
            dest_device_id: Target device ID.
            state_version: State version for sync messages.
            session_id: Session UUID bytes.

        Returns:
            The sequence number assigned to this message.

        Raises:
            ConnectionError: If not connected.
        """
        if not self.connected:
            raise ConnectionError("Not connected to server")

        seq = self.next_sequence()
        frame_bytes = MessageCodec.encode_message(
            message_type,
            payload,
            source_device_id=self.device_id,
            dest_device_id=dest_device_id,
            sequence_number=seq,
            state_version=state_version,
            flags=flags,
            session_id=session_id,
        )

        await MessageCodec.write_frame(self._writer, frame_bytes)
        self.stats.bytes_sent += len(frame_bytes)
        self.stats.messages_sent += 1

        return seq

    async def send_and_wait(
        self,
        message_type: MessageType,
        payload: Any,
        *,
        timeout: float = 10.0,
        **kwargs: Any,
    ) -> Frame:
        """
        Send a message and wait for an ACK with the matching sequence number.

        Args:
            message_type: Protocol message type.
            payload: Payload object or raw bytes.
            timeout: Seconds to wait for ACK.
            **kwargs: Additional arguments passed to send().

        Returns:
            The ACK frame.

        Raises:
            asyncio.TimeoutError: If no ACK received within timeout.
        """
        seq = await self.send(message_type, payload, **kwargs)
        future: asyncio.Future[Frame] = asyncio.get_event_loop().create_future()
        self._pending_acks[seq] = future

        try:
            return await asyncio.wait_for(future, timeout=timeout)
        finally:
            self._pending_acks.pop(seq, None)

    # ─── Internal Methods ─────────────────────────────────────────────────────

    async def _establish_connection(self) -> None:
        """Establish a TCP connection to the server."""
        try:
            self._reader, self._writer = await asyncio.wait_for(
                asyncio.open_connection(self.host, self.port),
                timeout=self.config.tcp_connect_timeout,
            )
            self._connected = True
            self.stats.connected_at = time.time()
            logger.info("Connected to %s:%d", self.host, self.port)

            if self._on_connect:
                await self._on_connect()
        except (ConnectionError, OSError, asyncio.TimeoutError) as e:
            self._connected = False
            logger.warning("Failed to connect to %s:%d: %s", self.host, self.port, e)
            raise

    async def _close_connection(self) -> None:
        """Close the TCP connection."""
        self._connected = False
        self.stats.disconnected_at = time.time()

        if self._writer and not self._writer.is_closing():
            try:
                self._writer.close()
                await self._writer.wait_closed()
            except (ConnectionError, OSError):
                pass

        self._writer = None
        self._reader = None

        if self._on_disconnect:
            try:
                await self._on_disconnect()
            except Exception as e:
                logger.error("Disconnect callback error: %s", e)

        logger.info("Disconnected from %s:%d", self.host, self.port)

    async def _read_loop(self, auto_reconnect: bool) -> None:
        """Continuously read frames from the server."""
        while self._running:
            if not self.connected:
                if auto_reconnect:
                    await self._reconnect()
                else:
                    break
                continue

            try:
                frame = await asyncio.wait_for(
                    MessageCodec.read_frame(self._reader),
                    timeout=self.config.tcp_read_timeout,
                )
            except asyncio.TimeoutError:
                continue
            except asyncio.IncompleteReadError:
                logger.info("Server closed connection")
                await self._close_connection()
                continue
            except FrameError as e:
                logger.warning("Malformed frame from server: %s", e)
                continue
            except (ConnectionError, OSError):
                logger.info("Connection to server lost")
                await self._close_connection()
                continue

            self.stats.bytes_received += frame.total_size
            self.stats.messages_received += 1

            # Check for pending ACK
            if frame.sequence_number in self._pending_acks:
                future = self._pending_acks.pop(frame.sequence_number)
                if not future.done():
                    future.set_result(frame)
                continue

            # Dispatch to handler
            handler = self._handlers.get(frame.message_type)
            if handler:
                try:
                    _, payload = MessageCodec.decode_frame(frame.encode())
                    await handler(frame, payload)
                except Exception as e:
                    logger.error("Handler error for %s: %s", frame.message_type.name, e)

    async def _reconnect(self) -> None:
        """Attempt to reconnect with exponential backoff."""
        delay = self.config.reconnect_delay
        for attempt in range(1, self.config.reconnect_max_attempts + 1):
            if not self._running:
                return

            logger.info(
                "Reconnect attempt %d/%d in %.1fs...",
                attempt, self.config.reconnect_max_attempts, delay,
            )
            await asyncio.sleep(delay)

            try:
                await self._establish_connection()
                self.stats.reconnect_count += 1
                logger.info("Reconnected successfully (attempt %d)", attempt)
                return
            except (ConnectionError, OSError, asyncio.TimeoutError):
                delay = min(delay * 2, self.config.reconnect_max_delay)

        logger.error("Failed to reconnect after %d attempts", self.config.reconnect_max_attempts)
        self._running = False

    async def _heartbeat_loop(self) -> None:
        """Periodically send heartbeat frames."""
        while self._running:
            await asyncio.sleep(self.config.heartbeat_interval)
            if self.connected:
                try:
                    await self.send(
                        MessageType.HEARTBEAT,
                        HeartbeatPayload(),
                    )
                except (ConnectionError, OSError):
                    pass
