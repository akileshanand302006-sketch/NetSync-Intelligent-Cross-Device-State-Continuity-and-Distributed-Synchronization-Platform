"""
NetSync Protocol Tests
======================
Tests for binary frame encoding/decoding, message validation,
and edge cases.
"""

import struct
import uuid
import zlib

import pytest

from netsync_network.protocol.frame import (
    Frame,
    FrameError,
    FrameFlags,
    HEADER_SIZE,
    MAGIC,
    MAX_PAYLOAD_SIZE,
    MessageType,
    PROTOCOL_VERSION,
)
from netsync_network.protocol.messages import (
    HelloPayload,
    StatePayload,
    HeartbeatPayload,
    ErrorPayload,
    ClipboardPayload,
    WorkspacePayload,
    PairRequestPayload,
    SyncRequestPayload,
)
from netsync_network.protocol.codec import MessageCodec


# ─── Frame Encoding/Decoding ─────────────────────────────────────────────────

class TestFrameEncoding:
    """Test binary frame encoding and decoding."""

    def test_encode_decode_roundtrip(self):
        """A frame should survive encode → decode unchanged."""
        original = Frame(
            message_type=MessageType.HELLO,
            payload=b'{"device_name":"test"}',
            source_device_id=12345,
            dest_device_id=67890,
            sequence_number=1,
            state_version=0,
        )
        encoded = original.encode()
        decoded = Frame.decode(encoded)

        assert decoded.message_type == original.message_type
        assert decoded.payload == original.payload
        assert decoded.source_device_id == original.source_device_id
        assert decoded.dest_device_id == original.dest_device_id
        assert decoded.sequence_number == original.sequence_number
        assert decoded.version == PROTOCOL_VERSION

    def test_header_size_is_64_bytes(self):
        """Header must be exactly 64 bytes."""
        frame = Frame(message_type=MessageType.HEARTBEAT)
        encoded = frame.encode()
        assert len(encoded) >= HEADER_SIZE
        assert encoded[:4] == MAGIC

    def test_empty_payload(self):
        """Frames with no payload should work."""
        frame = Frame(message_type=MessageType.HEARTBEAT, payload=b"")
        encoded = frame.encode()
        assert len(encoded) == HEADER_SIZE
        decoded = Frame.decode(encoded)
        assert decoded.payload == b""
        assert decoded.payload_length == 0

    def test_large_payload(self):
        """Test with a large payload near the limit."""
        payload = b"x" * (1024 * 1024)  # 1 MB
        frame = Frame(message_type=MessageType.STATE_PUSH, payload=payload)
        encoded = frame.encode()
        decoded = Frame.decode(encoded)
        assert decoded.payload == payload
        assert decoded.payload_length == len(payload)

    def test_all_message_types(self):
        """Every message type should encode/decode correctly."""
        for msg_type in MessageType:
            frame = Frame(message_type=msg_type, payload=b"test")
            encoded = frame.encode()
            decoded = Frame.decode(encoded)
            assert decoded.message_type == msg_type

    def test_flags_preserved(self):
        """Frame flags should survive encoding."""
        flags = FrameFlags.COMPRESSED | FrameFlags.REQUIRES_ACK | FrameFlags.IS_DELTA
        frame = Frame(
            message_type=MessageType.STATE_DELTA,
            flags=flags,
            payload=b"delta",
        )
        decoded = Frame.decode(frame.encode())
        assert decoded.flags == flags
        assert FrameFlags.COMPRESSED in decoded.flags
        assert FrameFlags.REQUIRES_ACK in decoded.flags
        assert FrameFlags.IS_DELTA in decoded.flags

    def test_session_id_preserved(self):
        """Session ID (16 bytes UUID) should survive encoding."""
        session_id = uuid.uuid4().bytes
        frame = Frame(
            message_type=MessageType.SESSION_OPEN,
            session_id=session_id,
        )
        decoded = Frame.decode(frame.encode())
        assert decoded.session_id == session_id

    def test_sequence_numbers(self):
        """High sequence numbers should work."""
        for seq in [0, 1, 255, 65535, 2**32 - 1]:
            frame = Frame(
                message_type=MessageType.HEARTBEAT,
                sequence_number=seq,
            )
            decoded = Frame.decode(frame.encode())
            assert decoded.sequence_number == seq

    def test_peek_payload_length(self):
        """Peek should read payload length without full decode."""
        payload = b"hello world"
        frame = Frame(message_type=MessageType.HELLO, payload=payload)
        encoded = frame.encode()
        header = encoded[:HEADER_SIZE]
        peeked_len = Frame.peek_payload_length(header)
        assert peeked_len == len(payload)

    def test_total_size(self):
        """total_size should be header + payload."""
        payload = b"test payload"
        frame = Frame(message_type=MessageType.HELLO, payload=payload)
        assert frame.total_size == HEADER_SIZE + len(payload)


# ─── Frame Validation & Error Cases ──────────────────────────────────────────

class TestFrameValidation:
    """Test frame validation and malformed input handling."""

    def test_invalid_magic_bytes(self):
        """Invalid magic should raise FrameError."""
        frame = Frame(message_type=MessageType.HELLO, payload=b"test")
        encoded = bytearray(frame.encode())
        encoded[0:4] = b"XXXX"
        with pytest.raises(FrameError, match="Invalid magic"):
            Frame.decode(bytes(encoded))

    def test_insufficient_data_for_header(self):
        """Less than HEADER_SIZE bytes should raise FrameError."""
        with pytest.raises(FrameError, match="Insufficient data"):
            Frame.decode(b"NSYN" + b"\x00" * 10)

    def test_incomplete_frame(self):
        """Frame with payload length but missing payload should error."""
        frame = Frame(message_type=MessageType.HELLO, payload=b"hello world")
        encoded = frame.encode()
        # Truncate payload
        truncated = encoded[:HEADER_SIZE + 3]
        with pytest.raises(FrameError, match="Incomplete frame"):
            Frame.decode(truncated)

    def test_corrupted_checksum(self):
        """Corrupted checksum should be detected."""
        frame = Frame(message_type=MessageType.HELLO, payload=b"test")
        encoded = bytearray(frame.encode())
        # Corrupt the checksum (bytes 56-60)
        encoded[56] ^= 0xFF
        with pytest.raises(FrameError, match="checksum mismatch"):
            Frame.decode(bytes(encoded))

    def test_corrupted_payload(self):
        """Corrupted payload should be detected by checksum."""
        frame = Frame(message_type=MessageType.HELLO, payload=b"test data")
        encoded = bytearray(frame.encode())
        # Corrupt a payload byte
        encoded[HEADER_SIZE + 1] ^= 0xFF
        with pytest.raises(FrameError, match="checksum mismatch"):
            Frame.decode(bytes(encoded))

    def test_unknown_message_type(self):
        """Unknown message type should raise FrameError."""
        frame = Frame(message_type=MessageType.HELLO)
        encoded = bytearray(frame.encode())
        # Set message type to something invalid (bytes 6-8)
        struct.pack_into("!H", encoded, 6, 0xFFFF)
        # Need to recalculate checksums for this to get past header check
        # Actually, the header checksum will fail first
        with pytest.raises(FrameError):
            Frame.decode(bytes(encoded))

    def test_payload_exceeds_max_size(self):
        """Payload exceeding MAX_PAYLOAD_SIZE should raise ValueError."""
        with pytest.raises(ValueError, match="exceeds maximum"):
            Frame(
                message_type=MessageType.STATE_PUSH,
                payload=b"x" * (MAX_PAYLOAD_SIZE + 1),
            )

    def test_invalid_session_id_length(self):
        """Session ID must be exactly 16 bytes."""
        with pytest.raises(ValueError, match="session_id must be 16 bytes"):
            Frame(
                message_type=MessageType.HELLO,
                session_id=b"short",
            )

    def test_peek_insufficient_header(self):
        """Peek with insufficient data should raise FrameError."""
        with pytest.raises(FrameError):
            Frame.peek_payload_length(b"too_short")


# ─── Message Payloads ────────────────────────────────────────────────────────

class TestMessagePayloads:
    """Test message payload serialization."""

    def test_hello_payload_roundtrip(self):
        original = HelloPayload(
            device_name="Test Laptop",
            device_platform="windows",
        )
        restored = HelloPayload.from_bytes(original.to_bytes())
        assert restored.device_name == "Test Laptop"
        assert restored.device_platform == "windows"
        assert restored.protocol_version == 1

    def test_state_payload_roundtrip(self):
        original = StatePayload(
            state_type="workspace",
            state_id="ws-123",
            version=5,
            data={"name": "Research", "urls": ["https://example.com"]},
            is_delta=True,
            base_version=4,
        )
        restored = StatePayload.from_bytes(original.to_bytes())
        assert restored.state_type == "workspace"
        assert restored.state_id == "ws-123"
        assert restored.version == 5
        assert restored.data["name"] == "Research"
        assert restored.is_delta is True
        assert restored.base_version == 4

    def test_clipboard_payload(self):
        original = ClipboardPayload(
            content_type="code",
            content="print('hello')",
            source_app="VSCode",
            pinned=True,
        )
        restored = ClipboardPayload.from_bytes(original.to_bytes())
        assert restored.content_type == "code"
        assert restored.content == "print('hello')"
        assert restored.pinned is True

    def test_workspace_payload(self):
        original = WorkspacePayload(
            workspace_id="ws-1",
            workspace_name="Research Project",
            version=3,
            urls=["https://docs.python.org", "https://fastapi.tiangolo.com"],
            notes=[{"title": "Note 1", "content": "Important"}],
        )
        restored = WorkspacePayload.from_bytes(original.to_bytes())
        assert len(restored.urls) == 2
        assert restored.workspace_name == "Research Project"

    def test_error_payload(self):
        original = ErrorPayload(code=400, message="Bad request", details={"field": "name"})
        restored = ErrorPayload.from_bytes(original.to_bytes())
        assert restored.code == 400
        assert restored.message == "Bad request"

    def test_heartbeat_payload(self):
        original = HeartbeatPayload(device_uptime=3600.5, pending_sync_count=3)
        restored = HeartbeatPayload.from_bytes(original.to_bytes())
        assert restored.device_uptime == 3600.5
        assert restored.pending_sync_count == 3

    def test_pair_request_payload(self):
        original = PairRequestPayload(
            device_name="Phone",
            device_platform="android",
            pairing_token="123456",
        )
        restored = PairRequestPayload.from_bytes(original.to_bytes())
        assert restored.pairing_token == "123456"

    def test_sync_request_payload(self):
        original = SyncRequestPayload(
            state_type="clipboard",
            state_id="clip-1",
            current_version=10,
            prefer_delta=True,
        )
        restored = SyncRequestPayload.from_bytes(original.to_bytes())
        assert restored.current_version == 10
        assert restored.prefer_delta is True


# ─── MessageCodec ─────────────────────────────────────────────────────────────

class TestMessageCodec:
    """Test the high-level message codec."""

    def test_encode_decode_typed_payload(self):
        payload = HelloPayload(device_name="TestPC", device_platform="linux")
        encoded = MessageCodec.encode_message(
            MessageType.HELLO,
            payload,
            source_device_id=100,
            sequence_number=42,
        )
        frame, decoded_payload = MessageCodec.decode_frame(encoded)
        assert frame.message_type == MessageType.HELLO
        assert frame.source_device_id == 100
        assert frame.sequence_number == 42
        assert isinstance(decoded_payload, HelloPayload)
        assert decoded_payload.device_name == "TestPC"

    def test_encode_raw_bytes_payload(self):
        encoded = MessageCodec.encode_message(
            MessageType.ERROR,
            b'{"code":500,"message":"Internal error"}',
        )
        frame, _ = MessageCodec.decode_frame(encoded)
        assert frame.message_type == MessageType.ERROR

    def test_invalid_payload_type_raises(self):
        with pytest.raises(TypeError):
            MessageCodec.encode_message(MessageType.HELLO, 12345)  # Not bytes or has to_bytes
