"""
NetSync Reliability — Acknowledgements & Retransmission
=========================================================
Application-level acknowledgement tracking, retransmission with
bounded retries, and duplicate detection.

Why application-level ACKs on top of TCP?
─────────────────────────────────────────
TCP guarantees ordered, reliable byte-stream delivery while the connection
is alive. However, TCP ACKs only confirm that bytes reached the remote OS
kernel buffer — not that the application processed and persisted the data.

Application-level acknowledgements confirm that:
1. The message was deserialized and validated by the application.
2. The synchronization operation was applied to local state.
3. The result was persisted to disk/database.
4. The operation can be considered complete.

Without application ACKs:
- A TCP-level success could mask an application crash before persistence.
- Retry logic wouldn't know which operations truly completed.
- Idempotency couldn't be enforced without tracking processed message IDs.

This module also provides duplicate detection so retransmitted messages
(after timeouts) don't cause double-application of operations.
"""

from __future__ import annotations

import asyncio
import hashlib
import logging
import time
import uuid
from dataclasses import dataclass, field
from enum import Enum

logger = logging.getLogger(__name__)


class AckStatus(str, Enum):
    """Status of a pending acknowledgement."""
    PENDING = "pending"
    ACKNOWLEDGED = "acknowledged"
    TIMEOUT = "timeout"
    FAILED = "failed"


@dataclass
class PendingMessage:
    """A message waiting for acknowledgement."""
    message_id: str
    sequence_number: int
    message_type: int
    payload_hash: str
    sent_at: float = field(default_factory=time.time)
    retry_count: int = 0
    max_retries: int = 5
    timeout: float = 10.0
    status: AckStatus = AckStatus.PENDING
    acked_at: float | None = None
    error_message: str | None = None

    @property
    def is_expired(self) -> bool:
        return time.time() - self.sent_at > self.timeout * (self.retry_count + 1)


class AcknowledgementTracker:
    """
    Tracks outgoing messages and their acknowledgements.

    Provides:
    - Message registration with unique IDs
    - ACK matching by sequence number
    - Timeout detection
    - Retry scheduling with bounded retries and exponential backoff
    - Statistics
    """

    def __init__(
        self,
        max_retries: int = 5,
        base_timeout: float = 10.0,
        max_timeout: float = 60.0,
    ) -> None:
        self.max_retries = max_retries
        self.base_timeout = base_timeout
        self.max_timeout = max_timeout
        self._pending: dict[int, PendingMessage] = {}  # by sequence_number
        self._by_id: dict[str, PendingMessage] = {}  # by message_id
        self._stats = {
            "sent": 0,
            "acked": 0,
            "timeouts": 0,
            "retries": 0,
            "failed": 0,
        }

    @property
    def pending_count(self) -> int:
        return len(self._pending)

    @property
    def stats(self) -> dict[str, int]:
        return dict(self._stats)

    def register(
        self,
        sequence_number: int,
        message_type: int,
        payload: bytes,
    ) -> str:
        """
        Register a sent message for ACK tracking.

        Returns:
            A unique message ID for this message.
        """
        message_id = str(uuid.uuid4())
        payload_hash = hashlib.sha256(payload).hexdigest()[:16]

        pending = PendingMessage(
            message_id=message_id,
            sequence_number=sequence_number,
            message_type=message_type,
            payload_hash=payload_hash,
            max_retries=self.max_retries,
            timeout=self.base_timeout,
        )
        self._pending[sequence_number] = pending
        self._by_id[message_id] = pending
        self._stats["sent"] += 1

        return message_id

    def acknowledge(self, sequence_number: int) -> PendingMessage | None:
        """
        Mark a message as acknowledged.

        Returns the PendingMessage if found, None otherwise.
        """
        pending = self._pending.pop(sequence_number, None)
        if pending:
            pending.status = AckStatus.ACKNOWLEDGED
            pending.acked_at = time.time()
            self._stats["acked"] += 1
            logger.debug("ACK received for seq=%d (%.1fms RTT)",
                         sequence_number,
                         (pending.acked_at - pending.sent_at) * 1000)
        return pending

    def get_timed_out(self) -> list[PendingMessage]:
        """Get all messages that have timed out and need retry or failure."""
        timed_out = []
        now = time.time()
        for seq, pending in list(self._pending.items()):
            elapsed = now - pending.sent_at
            timeout = self.base_timeout * (2 ** pending.retry_count)
            timeout = min(timeout, self.max_timeout)

            if elapsed > timeout:
                if pending.retry_count < pending.max_retries:
                    pending.retry_count += 1
                    pending.sent_at = now  # Reset timer for retry
                    self._stats["retries"] += 1
                    timed_out.append(pending)
                    logger.debug(
                        "Timeout for seq=%d, retry %d/%d",
                        seq, pending.retry_count, pending.max_retries,
                    )
                else:
                    pending.status = AckStatus.FAILED
                    self._pending.pop(seq, None)
                    self._stats["failed"] += 1
                    logger.warning(
                        "Message seq=%d failed after %d retries",
                        seq, pending.max_retries,
                    )
        return timed_out

    def clear(self) -> None:
        """Clear all pending messages."""
        self._pending.clear()
        self._by_id.clear()


class DuplicateDetector:
    """
    Detects and filters duplicate messages using a sliding window
    of recently seen message IDs.

    Provides idempotent processing — retransmitted messages after
    timeout won't cause double-application of operations.
    """

    def __init__(self, window_size: int = 10000, ttl: float = 300.0) -> None:
        self.window_size = window_size
        self.ttl = ttl
        self._seen: dict[str, float] = {}  # message_hash -> timestamp

    def is_duplicate(self, sequence_number: int, payload_hash: str) -> bool:
        """
        Check if a message is a duplicate.

        Args:
            sequence_number: Message sequence number.
            payload_hash: Hash of the message payload.

        Returns:
            True if this message was already processed.
        """
        key = f"{sequence_number}:{payload_hash}"

        # Prune old entries periodically
        if len(self._seen) > self.window_size:
            self._prune()

        if key in self._seen:
            return True

        self._seen[key] = time.time()
        return False

    def _prune(self) -> None:
        """Remove entries older than TTL."""
        now = time.time()
        expired = [k for k, t in self._seen.items() if now - t > self.ttl]
        for k in expired:
            del self._seen[k]


class IntegrityChecker:
    """Payload integrity verification utilities."""

    @staticmethod
    def compute_hash(data: bytes) -> str:
        """Compute SHA-256 hash of data."""
        return hashlib.sha256(data).hexdigest()

    @staticmethod
    def verify_hash(data: bytes, expected_hash: str) -> bool:
        """Verify data matches expected hash."""
        return hashlib.sha256(data).hexdigest() == expected_hash
