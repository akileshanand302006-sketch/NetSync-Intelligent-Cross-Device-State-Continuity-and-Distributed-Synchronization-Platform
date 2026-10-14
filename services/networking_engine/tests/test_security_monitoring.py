"""
NetSync Security and Monitoring Tests
======================================
Tests for PairingManager, LatencyTracker, and ThroughputTracker.
"""

import pytest

from netsync_network.security.pairing import PairingManager
from netsync_network.monitoring.latency import NetworkMonitor, LatencyMeasurement, ThroughputMeasurement


class TestPairingManager:
    """Test pairing token generation, single-use validation, and secret generation."""

    def test_token_generation_and_validation(self):
        manager = PairingManager()
        token_obj = manager.generate_pairing_token(device_id="laptop-1")

        assert len(token_obj.token) == 6
        assert token_obj.token.isdigit()
        assert token_obj.is_valid

        # Successful validation
        assert manager.validate_token(token_obj.token)

        # Single-use: validating again fails
        assert not manager.validate_token(token_obj.token)

    def test_invalid_token_fails(self):
        manager = PairingManager()
        assert not manager.validate_token("000000")

    def test_complete_pairing(self):
        manager = PairingManager()
        device, secret = manager.complete_pairing(
            device_id="phone-1",
            device_name="Pixel 9",
            device_platform="android",
        )

        assert device.device_id == "phone-1"
        assert device.device_name == "Pixel 9"
        assert len(secret) > 0
        assert manager.trusted_device_count == 1
        assert manager.is_trusted("phone-1")


class TestNetworkMonitor:
    """Test application-level RTT latency tracking and throughput calculations."""

    def test_record_and_aggregate_latency(self):
        monitor = NetworkMonitor(max_samples=10)
        monitor.record_latency(12.5, device_id="node-1")
        monitor.record_latency(15.0, device_id="node-1")
        monitor.record_latency(10.0, device_id="node-1")

        stats = monitor.get_latency_stats(device_id="node-1")
        assert stats is not None
        assert stats["sample_count"] == 3
        assert stats["min_ms"] == 10.0
        assert stats["max_ms"] == 15.0
        assert stats["mean_ms"] == pytest.approx(12.5, 0.01)

    def test_record_throughput(self):
        monitor = NetworkMonitor()
        monitor.record_throughput(bytes_transferred=1024 * 1024, duration_seconds=0.5, direction="send")
        
        stats = monitor.get_throughput_stats()
        assert stats["total_bytes"] == 1024 * 1024
        assert stats["sample_count"] == 1
        assert stats["mean_bps"] == pytest.approx(2 * 1024 * 1024, 0.01)
