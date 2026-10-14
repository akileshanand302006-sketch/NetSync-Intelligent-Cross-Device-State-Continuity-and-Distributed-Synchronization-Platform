"""
NetSync Reliability Tests
==========================
Tests for AcknowledgementTracker, DuplicateDetector, and IntegrityChecker.
"""

import time
import pytest

from netsync_network.reliability.acknowledgements import (
    AcknowledgementTracker,
    AckStatus,
    DuplicateDetector,
    IntegrityChecker,
)


class TestAcknowledgementTracker:
    """Test message registration, acknowledgement matching, and retry timeout."""

    def test_register_and_acknowledge(self):
        tracker = AcknowledgementTracker(max_retries=3, base_timeout=5.0)
        msg_id = tracker.register(sequence_number=1, message_type=3, payload=b"test-state")

        assert tracker.pending_count == 1
        assert tracker.stats["sent"] == 1
        assert tracker.stats["acked"] == 0

        acked = tracker.acknowledge(sequence_number=1)
        assert acked is not None
        assert acked.message_id == msg_id
        assert acked.status == AckStatus.ACKNOWLEDGED
        assert tracker.pending_count == 0
        assert tracker.stats["acked"] == 1

    def test_acknowledge_unknown_returns_none(self):
        tracker = AcknowledgementTracker()
        assert tracker.acknowledge(sequence_number=999) is None

    def test_timeout_and_retry_increment(self):
        tracker = AcknowledgementTracker(max_retries=2, base_timeout=0.01)
        tracker.register(sequence_number=10, message_type=1, payload=b"data")

        # Sleep enough to expire timeout
        time.sleep(0.02)
        expired = tracker.get_timed_out()

        assert len(expired) == 1
        assert expired[0].sequence_number == 10
        assert expired[0].retry_count == 1
        assert tracker.stats["retries"] == 1

        # Second expiry
        time.sleep(0.03)
        expired2 = tracker.get_timed_out()
        assert len(expired2) == 1
        assert expired2[0].retry_count == 2

        # Exceeding max_retries marks it as failed and removes it from pending
        time.sleep(0.04)
        expired3 = tracker.get_timed_out()
        assert tracker.stats["failed"] == 1
        assert tracker.pending_count == 0


class TestDuplicateDetector:
    """Test duplicate detection and idempotency."""

    def test_first_message_not_duplicate(self):
        detector = DuplicateDetector()
        assert not detector.is_duplicate(sequence_number=1, payload_hash="hash-abc")

    def test_repeated_message_is_duplicate(self):
        detector = DuplicateDetector()
        assert not detector.is_duplicate(sequence_number=1, payload_hash="hash-abc")
        assert detector.is_duplicate(sequence_number=1, payload_hash="hash-abc")

    def test_different_sequence_same_payload_not_duplicate(self):
        detector = DuplicateDetector()
        assert not detector.is_duplicate(sequence_number=1, payload_hash="hash-abc")
        assert not detector.is_duplicate(sequence_number=2, payload_hash="hash-abc")


class TestIntegrityChecker:
    """Test cryptographic SHA-256 integrity verification."""

    def test_compute_and_verify_hash(self):
        payload = b"state continuity data block"
        digest = IntegrityChecker.compute_hash(payload)

        assert isinstance(digest, str)
        assert len(digest) == 64
        assert IntegrityChecker.verify_hash(payload, digest)
        assert not IntegrityChecker.verify_hash(b"tampered", digest)
