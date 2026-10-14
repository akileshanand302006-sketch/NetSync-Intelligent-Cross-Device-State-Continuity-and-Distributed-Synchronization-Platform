"""
NetSync Protocol — Message Codec
=================================
Higher-level encoding/decoding that combines Frame + typed payload,
and handles the buffered reading of frames from a byte stream.
"""

from __future__ import annotations

import asyncio
import logging
from typing import Any

from netsync_network.protocol.frame import (
    Frame,
    FrameError,
    FrameFlags,
    HEADER_SIZE,
    MessageType,
)
from netsync_network.protocol.messages import (
    ClipboardPayload,
    ErrorPayload,
    HeartbeatPayload,
    HelloPayload,
    PairRequestPayload,
    PairResponsePayload,
    StatePayload,
    SyncRequestPayload,
    WorkspacePayload,
)

logger = logging.getLogger(__name__)

# Map message types to their payload classes
PAYLOAD_REGISTRY: dict[MessageType, type] = {
    MessageType.HELLO: HelloPayload,
    MessageType.PAIR_REQUEST: PairRequestPayload,
    MessageType.PAIR_RESPONSE: PairResponsePayload,
    MessageType.STATE_PUSH: StatePayload,
    MessageType.STATE_DELTA: StatePayload,
    MessageType.STATE_ACK: StatePayload,
    MessageType.SYNC_REQUEST: SyncRequestPayload,
    MessageType.SYNC_RESPONSE: StatePayload,
    MessageType.HEARTBEAT: HeartbeatPayload,
    MessageType.ERROR: ErrorPayload,
    MessageType.CLIPBOARD_PUSH: ClipboardPayload,
    MessageType.WORKSPACE_PUSH: WorkspacePayload,
}


class MessageCodec:
    """
    High-level codec for encoding/decoding NetSync protocol messages.

    Handles:
    - Building frames from typed payloads
    - Decoding frames and extracting typed payloads
    - Buffered reading of frames from async streams (handles partial reads)
    """

    @staticmethod
    def encode_message(
        message_type: MessageType,
        payload: Any,
        *,
        source_device_id: int = 0,
        dest_device_id: int = 0,
        sequence_number: int = 0,
        state_version: int = 0,
        flags: FrameFlags = FrameFlags.NONE,
        session_id: bytes | None = None,
    ) -> bytes:
        """
        Encode a typed payload into a complete frame ready for transmission.

        Args:
            message_type: The protocol message type.
            payload: A payload object with a to_bytes() method, or raw bytes.
            source_device_id: Sender device ID.
            dest_device_id: Target device ID (0 = broadcast).
            sequence_number: Message sequence number.
            state_version: State version for sync messages.
            flags: Frame flags.
            session_id: Session UUID bytes (auto-generated if None).

        Returns:
            Wire-format bytes ready for socket.send().
        """
        if isinstance(payload, bytes):
            payload_bytes = payload
        elif hasattr(payload, "to_bytes") and not isinstance(payload, int):
            payload_bytes = payload.to_bytes()
        else:
            raise TypeError(f"Payload must be bytes or have to_bytes(), got {type(payload)}")

        frame_kwargs: dict[str, Any] = {
            "message_type": message_type,
            "payload": payload_bytes,
            "flags": flags,
            "source_device_id": source_device_id,
            "dest_device_id": dest_device_id,
            "sequence_number": sequence_number,
            "state_version": state_version,
        }
        if session_id is not None:
            frame_kwargs["session_id"] = session_id

        frame = Frame(**frame_kwargs)
        return frame.encode()

    @staticmethod
    def decode_frame(data: bytes) -> tuple[Frame, Any | None]:
        """
        Decode raw bytes into a Frame and optionally a typed payload.

        Args:
            data: Complete frame bytes (header + payload).

        Returns:
            Tuple of (Frame, decoded_payload or None).
        """
        frame = Frame.decode(data)

        payload_cls = PAYLOAD_REGISTRY.get(frame.message_type)
        decoded_payload = None
        if payload_cls and frame.payload:
            try:
                decoded_payload = payload_cls.from_bytes(frame.payload)
            except Exception as e:
                logger.warning(
                    "Failed to decode payload for %s: %s",
                    frame.message_type.name, e
                )
        return frame, decoded_payload

    @staticmethod
    async def read_frame(reader: asyncio.StreamReader) -> Frame:
        """
        Read exactly one complete frame from an async stream.

        This correctly handles partial reads by:
        1. Reading exactly HEADER_SIZE bytes (the fixed header)
        2. Extracting payload_length from the header
        3. Reading exactly payload_length more bytes
        4. Decoding the complete frame

        This is critical for TCP — recv() does NOT guarantee message boundaries.

        Args:
            reader: An asyncio StreamReader connected to a TCP socket.

        Returns:
            A decoded Frame.

        Raises:
            FrameError: If the frame is malformed.
            ConnectionError: If the connection is closed mid-read.
        """
        # Step 1: Read exactly the header
        header_data = await reader.readexactly(HEADER_SIZE)

        # Step 2: Peek at payload length without full decode
        payload_length = Frame.peek_payload_length(header_data)

        # Step 3: Read exactly the payload
        if payload_length > 0:
            payload_data = await reader.readexactly(payload_length)
        else:
            payload_data = b""

        # Step 4: Decode the complete frame
        complete_data = header_data + payload_data
        return Frame.decode(complete_data)

    @staticmethod
    async def write_frame(writer: asyncio.StreamWriter, frame_bytes: bytes) -> None:
        """
        Write a complete frame to an async stream with drain.

        Handles partial writes by relying on asyncio's StreamWriter
        buffering and drain mechanism.

        Args:
            writer: An asyncio StreamWriter connected to a TCP socket.
            frame_bytes: Complete encoded frame bytes.
        """
        writer.write(frame_bytes)
        await writer.drain()
