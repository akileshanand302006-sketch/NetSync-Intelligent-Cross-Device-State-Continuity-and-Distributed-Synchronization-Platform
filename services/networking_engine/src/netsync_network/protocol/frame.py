"""
NetSync Binary Protocol — Frame Definition
===========================================
Length-prefixed binary framing for the NetSync application-layer protocol.

Frame Layout (64 bytes header + variable payload):
┌─────────────────────────────────────────────────────────────────┐
│ Offset │ Size │ Field              │ Type      │ Description    │
├────────┼──────┼────────────────────┼───────────┼────────────────┤
│  0     │  4   │ magic              │ bytes     │ b"NSYN"        │
│  4     │  2   │ version            │ uint16    │ Protocol ver   │
│  6     │  2   │ message_type       │ uint16    │ Message type   │
│  8     │  2   │ flags              │ uint16    │ Bit flags      │
│ 10     │  2   │ reserved           │ uint16    │ Future use     │
│ 12     │ 16   │ session_id         │ bytes     │ UUID bytes     │
│ 28     │  8   │ source_device_id   │ uint64    │ Sender device  │
│ 36     │  8   │ dest_device_id     │ uint64    │ Target device  │
│ 44     │  4   │ sequence_number    │ uint32    │ Seq number     │
│ 48     │  4   │ state_version      │ uint32    │ State version  │
│ 52     │  4   │ payload_length     │ uint32    │ Payload bytes  │
│ 56     │  4   │ checksum           │ uint32    │ CRC32 of frame │
│ 60     │  4   │ header_checksum    │ uint32    │ CRC32 of hdr   │
│ 64     │  N   │ payload            │ bytes     │ Message data   │
└─────────────────────────────────────────────────────────────────┘

All multi-byte integers are big-endian (network byte order).
"""

from __future__ import annotations

import struct
import uuid
import zlib
from dataclasses import dataclass, field
from enum import IntEnum, IntFlag
from typing import Self


# ─── Constants ────────────────────────────────────────────────────────────────

MAGIC = b"NSYN"
PROTOCOL_VERSION = 1
HEADER_SIZE = 64
HEADER_FORMAT = "!4sHHHH16sQQIIIII"  # Big-endian, 64 bytes total
MAX_PAYLOAD_SIZE = 16 * 1024 * 1024  # 16 MB


# ─── Message Types ────────────────────────────────────────────────────────────

class MessageType(IntEnum):
    """NetSync protocol message types."""
    HELLO = 0x0001
    DISCOVER = 0x0002
    PAIR_REQUEST = 0x0010
    PAIR_RESPONSE = 0x0011
    AUTH = 0x0020
    SESSION_OPEN = 0x0030
    SESSION_CLOSE = 0x0031
    STATE_PUSH = 0x0040
    STATE_DELTA = 0x0041
    STATE_ACK = 0x0042
    SYNC_REQUEST = 0x0050
    SYNC_RESPONSE = 0x0051
    HEARTBEAT = 0x0060
    CONFLICT = 0x0070
    RESOLVE = 0x0071
    CLIPBOARD_PUSH = 0x0080
    WORKSPACE_PUSH = 0x0090
    ERROR = 0x00FF


# ─── Frame Flags ──────────────────────────────────────────────────────────────

class FrameFlags(IntFlag):
    """Bit flags for frame metadata."""
    NONE = 0x0000
    COMPRESSED = 0x0001
    ENCRYPTED = 0x0002
    REQUIRES_ACK = 0x0004
    IS_RETRY = 0x0008
    IS_DELTA = 0x0010
    URGENT = 0x0020
    FINAL = 0x0040


# ─── Frame Data Structure ────────────────────────────────────────────────────

@dataclass
class Frame:
    """
    A single NetSync protocol frame.

    Represents one complete application-layer message with header metadata
    and an optional payload. Frames are length-prefixed and integrity-checked
    using CRC32 checksums.
    """

    message_type: MessageType
    payload: bytes = b""
    version: int = PROTOCOL_VERSION
    flags: FrameFlags = FrameFlags.NONE
    session_id: bytes = field(default_factory=lambda: uuid.uuid4().bytes)
    source_device_id: int = 0
    dest_device_id: int = 0
    sequence_number: int = 0
    state_version: int = 0

    def __post_init__(self) -> None:
        """Validate frame fields after initialization."""
        if len(self.session_id) != 16:
            raise ValueError(f"session_id must be 16 bytes, got {len(self.session_id)}")
        if len(self.payload) > MAX_PAYLOAD_SIZE:
            raise ValueError(
                f"Payload size {len(self.payload)} exceeds maximum {MAX_PAYLOAD_SIZE}"
            )
        if not isinstance(self.message_type, MessageType):
            self.message_type = MessageType(self.message_type)

    @property
    def payload_length(self) -> int:
        """Length of the payload in bytes."""
        return len(self.payload)

    @property
    def total_size(self) -> int:
        """Total frame size including header and payload."""
        return HEADER_SIZE + self.payload_length

    def encode(self) -> bytes:
        """
        Encode this frame to its binary wire representation.

        Returns:
            Complete frame bytes (header + payload) ready for transmission.
        """
        # Pack the header without checksums first
        header_without_checksums = struct.pack(
            "!4sHHHH16sQQIIII",
            MAGIC,
            self.version,
            self.message_type.value,
            self.flags,
            0,  # reserved
            self.session_id,
            self.source_device_id,
            self.dest_device_id,
            self.sequence_number,
            self.state_version,
            self.payload_length,
            0,  # checksum placeholder
        )

        # Compute header checksum (over header bytes 0-59, excluding last 4)
        header_checksum = zlib.crc32(header_without_checksums) & 0xFFFFFFFF

        # Now compute full frame checksum including payload
        full_checksum = zlib.crc32(header_without_checksums + self.payload) & 0xFFFFFFFF

        # Pack the complete header with both checksums
        header = struct.pack(
            HEADER_FORMAT,
            MAGIC,
            self.version,
            self.message_type.value,
            self.flags,
            0,  # reserved
            self.session_id,
            self.source_device_id,
            self.dest_device_id,
            self.sequence_number,
            self.state_version,
            self.payload_length,
            full_checksum,
            header_checksum,
        )

        return header + self.payload

    @classmethod
    def decode(cls, data: bytes) -> Self:
        """
        Decode a frame from its binary wire representation.

        Args:
            data: Raw bytes containing at least a complete header.

        Returns:
            Decoded Frame instance.

        Raises:
            FrameError: If the frame is malformed, invalid, or fails integrity checks.
        """
        if len(data) < HEADER_SIZE:
            raise FrameError(
                f"Insufficient data for header: need {HEADER_SIZE} bytes, got {len(data)}"
            )

        # Unpack header
        (
            magic,
            version,
            msg_type,
            flags,
            _reserved,
            session_id,
            source_device_id,
            dest_device_id,
            sequence_number,
            state_version,
            payload_length,
            checksum,
            header_checksum,
        ) = struct.unpack(HEADER_FORMAT, data[:HEADER_SIZE])

        # Validate magic bytes
        if magic != MAGIC:
            raise FrameError(f"Invalid magic bytes: expected {MAGIC!r}, got {magic!r}")

        # Version check — forward-compatible: accept same major version
        if version < 1:
            raise FrameError(f"Unsupported protocol version: {version}")

        # Validate message type
        try:
            message_type = MessageType(msg_type)
        except ValueError:
            raise FrameError(f"Unknown message type: 0x{msg_type:04X}")

        # Validate payload length
        if payload_length > MAX_PAYLOAD_SIZE:
            raise FrameError(
                f"Payload length {payload_length} exceeds maximum {MAX_PAYLOAD_SIZE}"
            )

        # Check we have the complete frame
        total_size = HEADER_SIZE + payload_length
        if len(data) < total_size:
            raise FrameError(
                f"Incomplete frame: need {total_size} bytes, got {len(data)}"
            )

        # Verify header checksum
        header_for_check = struct.pack(
            "!4sHHHH16sQQIIII",
            magic, version, msg_type, flags, _reserved,
            session_id, source_device_id, dest_device_id,
            sequence_number, state_version, payload_length, 0,
        )
        expected_header_checksum = zlib.crc32(header_for_check) & 0xFFFFFFFF
        if header_checksum != expected_header_checksum:
            raise FrameError(
                f"Header checksum mismatch: expected 0x{expected_header_checksum:08X}, "
                f"got 0x{header_checksum:08X}"
            )

        payload = data[HEADER_SIZE:total_size]

        # Verify full frame checksum
        expected_checksum = zlib.crc32(header_for_check + payload) & 0xFFFFFFFF
        if checksum != expected_checksum:
            raise FrameError(
                f"Frame checksum mismatch: expected 0x{expected_checksum:08X}, "
                f"got 0x{checksum:08X}"
            )

        return cls(
            message_type=message_type,
            payload=payload,
            version=version,
            flags=FrameFlags(flags),
            session_id=session_id,
            source_device_id=source_device_id,
            dest_device_id=dest_device_id,
            sequence_number=sequence_number,
            state_version=state_version,
        )

    @staticmethod
    def peek_payload_length(header_data: bytes) -> int:
        """
        Read the payload length from a header without fully decoding.
        Useful for buffered reads — read header first, then read exactly
        payload_length more bytes.

        Args:
            header_data: At least HEADER_SIZE bytes of the frame.

        Returns:
            Payload length in bytes.
        """
        if len(header_data) < HEADER_SIZE:
            raise FrameError(f"Need {HEADER_SIZE} bytes for header, got {len(header_data)}")

        # payload_length is at offset 52, 4 bytes, big-endian uint32
        (payload_length,) = struct.unpack("!I", header_data[52:56])
        return payload_length

    def __repr__(self) -> str:
        return (
            f"Frame(type={self.message_type.name}, "
            f"seq={self.sequence_number}, "
            f"ver={self.state_version}, "
            f"flags={self.flags!r}, "
            f"payload={self.payload_length}B)"
        )


# ─── Exceptions ───────────────────────────────────────────────────────────────

class FrameError(Exception):
    """Raised when a frame is malformed, invalid, or fails integrity checks."""
    pass
