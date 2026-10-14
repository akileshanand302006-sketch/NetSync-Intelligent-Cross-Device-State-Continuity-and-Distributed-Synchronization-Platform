"""
NetSync Protocol — Message Payloads
====================================
Structured payload definitions for each message type.
Payloads are serialized to JSON bytes for transport within frames.
"""

from __future__ import annotations

import json
import time
from dataclasses import asdict, dataclass, field
from typing import Any


@dataclass
class HelloPayload:
    """Initial handshake message payload."""
    device_name: str
    device_platform: str  # e.g., "windows", "macos", "linux", "ios", "android"
    protocol_version: int = 1
    capabilities: list[str] = field(default_factory=lambda: [
        "state_sync", "clipboard", "workspace", "delta_sync"
    ])
    timestamp: float = field(default_factory=time.time)

    def to_bytes(self) -> bytes:
        return json.dumps(asdict(self), separators=(",", ":")).encode("utf-8")

    @classmethod
    def from_bytes(cls, data: bytes) -> HelloPayload:
        return cls(**json.loads(data.decode("utf-8")))


@dataclass
class PairRequestPayload:
    """Device pairing request."""
    device_name: str
    device_platform: str
    pairing_token: str  # Short-lived pairing code
    public_key_pem: str | None = None  # For key exchange
    timestamp: float = field(default_factory=time.time)

    def to_bytes(self) -> bytes:
        return json.dumps(asdict(self), separators=(",", ":")).encode("utf-8")

    @classmethod
    def from_bytes(cls, data: bytes) -> PairRequestPayload:
        return cls(**json.loads(data.decode("utf-8")))


@dataclass
class PairResponsePayload:
    """Device pairing response."""
    accepted: bool
    device_name: str
    device_platform: str
    shared_secret_encrypted: str | None = None  # Encrypted with requester's public key
    reason: str | None = None  # Rejection reason
    timestamp: float = field(default_factory=time.time)

    def to_bytes(self) -> bytes:
        return json.dumps(asdict(self), separators=(",", ":")).encode("utf-8")

    @classmethod
    def from_bytes(cls, data: bytes) -> PairResponsePayload:
        return cls(**json.loads(data.decode("utf-8")))


@dataclass
class StatePayload:
    """State push or delta payload."""
    state_type: str  # e.g., "workspace", "session", "clipboard"
    state_id: str
    version: int
    data: dict[str, Any] = field(default_factory=dict)
    is_delta: bool = False
    base_version: int | None = None  # For deltas: which version this is based on
    hash: str | None = None  # SHA-256 of the full state after applying
    timestamp: float = field(default_factory=time.time)

    def to_bytes(self) -> bytes:
        return json.dumps(asdict(self), separators=(",", ":")).encode("utf-8")

    @classmethod
    def from_bytes(cls, data: bytes) -> StatePayload:
        return cls(**json.loads(data.decode("utf-8")))


@dataclass
class SyncRequestPayload:
    """Request to synchronize state."""
    state_type: str
    state_id: str
    current_version: int
    current_hash: str | None = None
    prefer_delta: bool = True
    timestamp: float = field(default_factory=time.time)

    def to_bytes(self) -> bytes:
        return json.dumps(asdict(self), separators=(",", ":")).encode("utf-8")

    @classmethod
    def from_bytes(cls, data: bytes) -> SyncRequestPayload:
        return cls(**json.loads(data.decode("utf-8")))


@dataclass
class HeartbeatPayload:
    """Heartbeat / keep-alive payload."""
    device_uptime: float = 0.0
    pending_sync_count: int = 0
    timestamp: float = field(default_factory=time.time)

    def to_bytes(self) -> bytes:
        return json.dumps(asdict(self), separators=(",", ":")).encode("utf-8")

    @classmethod
    def from_bytes(cls, data: bytes) -> HeartbeatPayload:
        return cls(**json.loads(data.decode("utf-8")))


@dataclass
class ErrorPayload:
    """Error response payload."""
    code: int
    message: str
    details: dict[str, Any] | None = None
    timestamp: float = field(default_factory=time.time)

    def to_bytes(self) -> bytes:
        return json.dumps(asdict(self), separators=(",", ":")).encode("utf-8")

    @classmethod
    def from_bytes(cls, data: bytes) -> ErrorPayload:
        return cls(**json.loads(data.decode("utf-8")))


@dataclass
class ClipboardPayload:
    """Clipboard entry payload."""
    content_type: str  # "text", "url", "code", "image_ref"
    content: str
    source_app: str | None = None
    pinned: bool = False
    expires_at: float | None = None
    timestamp: float = field(default_factory=time.time)

    def to_bytes(self) -> bytes:
        return json.dumps(asdict(self), separators=(",", ":")).encode("utf-8")

    @classmethod
    def from_bytes(cls, data: bytes) -> ClipboardPayload:
        return cls(**json.loads(data.decode("utf-8")))


@dataclass
class WorkspacePayload:
    """Workspace synchronization payload."""
    workspace_id: str
    workspace_name: str
    version: int
    urls: list[str] = field(default_factory=list)
    notes: list[dict[str, str]] = field(default_factory=list)
    tasks: list[dict[str, Any]] = field(default_factory=list)
    clipboard_refs: list[str] = field(default_factory=list)
    reading_positions: list[dict[str, Any]] = field(default_factory=list)
    metadata: dict[str, Any] = field(default_factory=dict)
    timestamp: float = field(default_factory=time.time)

    def to_bytes(self) -> bytes:
        return json.dumps(asdict(self), separators=(",", ":")).encode("utf-8")

    @classmethod
    def from_bytes(cls, data: bytes) -> WorkspacePayload:
        return cls(**json.loads(data.decode("utf-8")))
