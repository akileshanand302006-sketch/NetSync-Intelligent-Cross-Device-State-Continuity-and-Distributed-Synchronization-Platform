"""
NetSync Network Monitoring
============================
Measures connection and transfer performance metrics.

Measurement Methodology
────────────────────────
- Latency: Measured as application-level round-trip time (send frame → receive ACK).
  This includes serialization, deserialization, and processing time in addition to
  network latency. It does NOT measure raw ICMP ping latency.
  Sampling: configurable sample count (default 10) at configurable intervals.
  Aggregation: mean, min, max, p50, p95, stddev.

- Jitter: Standard deviation of latency samples. Note: accurate jitter estimation
  requires many samples. Small sample counts give rough estimates only.

- Throughput: Measured as bytes transferred / elapsed wall-clock time during
  actual data transfers. Not a synthetic bandwidth test.

- Connection establishment: Time from connection attempt to first successful
  frame exchange.

All timestamps use time.monotonic() to avoid clock-adjustment artifacts.
"""

from __future__ import annotations

import logging
import math
import statistics
import time
from dataclasses import dataclass, field
from typing import Any

logger = logging.getLogger(__name__)


@dataclass
class LatencyMeasurement:
    """A single latency measurement."""
    rtt_ms: float
    measured_at: float = field(default_factory=time.monotonic)
    device_id: str = ""


@dataclass
class ThroughputMeasurement:
    """A single throughput measurement."""
    bytes_transferred: int
    duration_seconds: float
    direction: str = "send"  # "send" or "receive"
    measured_at: float = field(default_factory=time.monotonic)
    device_id: str = ""

    @property
    def bytes_per_second(self) -> float:
        if self.duration_seconds <= 0:
            return 0.0
        return self.bytes_transferred / self.duration_seconds

    @property
    def mbps(self) -> float:
        return self.bytes_per_second * 8 / 1_000_000


@dataclass
class TransferMetrics:
    """Metrics for a specific transfer operation."""
    transfer_id: str = ""
    bytes_sent: int = 0
    bytes_received: int = 0
    duration_ms: float = 0.0
    retries: int = 0
    success: bool = True
    is_delta: bool = False
    full_state_size: int = 0
    delta_size: int = 0
    source_device: str = ""
    target_device: str = ""
    route: str = ""  # "lan" or "cloud"
    timestamp: float = field(default_factory=time.time)

    @property
    def savings_bytes(self) -> int:
        if self.is_delta and self.full_state_size > 0:
            return self.full_state_size - self.delta_size
        return 0

    @property
    def savings_ratio(self) -> float:
        if self.full_state_size > 0:
            return self.savings_bytes / self.full_state_size
        return 0.0


@dataclass
class ConnectionHealth:
    """Health status of a connection."""
    device_id: str
    connected: bool = False
    last_seen: float = 0.0
    latency_ms: float = 0.0
    jitter_ms: float = 0.0
    packet_loss_estimate: float = 0.0  # Based on retry rate, NOT actual packet loss
    reconnect_count: int = 0
    uptime_seconds: float = 0.0
    bytes_transferred: int = 0
    messages_exchanged: int = 0
    error_count: int = 0
    route: str = ""


class NetworkMonitor:
    """
    Collects and aggregates network performance metrics.

    Provides running statistics for latency, throughput,
    connection health, and transfer performance.
    """

    def __init__(
        self,
        max_samples: int = 1000,
        retention_seconds: float = 3600.0,
    ) -> None:
        self.max_samples = max_samples
        self.retention_seconds = retention_seconds

        self._latency_samples: list[LatencyMeasurement] = []
        self._throughput_samples: list[ThroughputMeasurement] = []
        self._transfer_history: list[TransferMetrics] = []
        self._connection_health: dict[str, ConnectionHealth] = {}
        self._start_time = time.monotonic()

    def record_latency(self, rtt_ms: float, device_id: str = "") -> None:
        """Record a latency measurement."""
        sample = LatencyMeasurement(rtt_ms=rtt_ms, device_id=device_id)
        self._latency_samples.append(sample)
        self._trim_samples()

    def record_throughput(
        self,
        bytes_transferred: int,
        duration_seconds: float,
        direction: str = "send",
        device_id: str = "",
    ) -> None:
        """Record a throughput measurement."""
        sample = ThroughputMeasurement(
            bytes_transferred=bytes_transferred,
            duration_seconds=duration_seconds,
            direction=direction,
            device_id=device_id,
        )
        self._throughput_samples.append(sample)
        self._trim_samples()

    def record_transfer(self, metrics: TransferMetrics) -> None:
        """Record a completed transfer operation."""
        self._transfer_history.append(metrics)
        if len(self._transfer_history) > self.max_samples:
            self._transfer_history.pop(0)

    def update_connection_health(
        self,
        device_id: str,
        **kwargs: Any,
    ) -> ConnectionHealth:
        """Update health status for a device connection."""
        health = self._connection_health.get(device_id)
        if not health:
            health = ConnectionHealth(device_id=device_id)
            self._connection_health[device_id] = health

        for key, value in kwargs.items():
            if hasattr(health, key):
                setattr(health, key, value)

        return health

    def get_latency_stats(self, device_id: str | None = None) -> dict[str, float]:
        """
        Get aggregated latency statistics.

        Returns dict with: mean, min, max, median, p95, stddev, jitter, sample_count
        """
        samples = self._latency_samples
        if device_id:
            samples = [s for s in samples if s.device_id == device_id]

        values = [s.rtt_ms for s in samples]
        if not values:
            return {
                "mean_ms": 0.0, "min_ms": 0.0, "max_ms": 0.0,
                "median_ms": 0.0, "p95_ms": 0.0, "stddev_ms": 0.0,
                "jitter_ms": 0.0, "sample_count": 0,
            }

        sorted_values = sorted(values)
        p95_idx = int(len(sorted_values) * 0.95)

        stddev = statistics.stdev(values) if len(values) > 1 else 0.0

        return {
            "mean_ms": round(statistics.mean(values), 2),
            "min_ms": round(min(values), 2),
            "max_ms": round(max(values), 2),
            "median_ms": round(statistics.median(values), 2),
            "p95_ms": round(sorted_values[min(p95_idx, len(sorted_values) - 1)], 2),
            "stddev_ms": round(stddev, 2),
            "jitter_ms": round(stddev, 2),  # Jitter approximated as stddev of RTT
            "sample_count": len(values),
        }

    def get_throughput_stats(self, device_id: str | None = None) -> dict[str, float]:
        """Get aggregated throughput statistics."""
        samples = self._throughput_samples
        if device_id:
            samples = [s for s in samples if s.device_id == device_id]

        if not samples:
            return {
                "mean_bps": 0.0, "max_bps": 0.0,
                "mean_mbps": 0.0, "max_mbps": 0.0,
                "total_bytes": 0, "sample_count": 0,
            }

        bps_values = [s.bytes_per_second for s in samples]
        total_bytes = sum(s.bytes_transferred for s in samples)

        return {
            "mean_bps": round(statistics.mean(bps_values), 2),
            "max_bps": round(max(bps_values), 2),
            "mean_mbps": round(statistics.mean(bps_values) * 8 / 1_000_000, 4),
            "max_mbps": round(max(bps_values) * 8 / 1_000_000, 4),
            "total_bytes": total_bytes,
            "sample_count": len(samples),
        }

    def get_transfer_summary(self) -> dict[str, Any]:
        """Get summary of transfer operations."""
        if not self._transfer_history:
            return {
                "total_transfers": 0,
                "successful": 0,
                "failed": 0,
                "success_rate": 0.0,
                "total_bytes": 0,
                "total_retries": 0,
                "avg_duration_ms": 0.0,
                "delta_transfers": 0,
                "total_savings_bytes": 0,
            }

        successful = sum(1 for t in self._transfer_history if t.success)
        total = len(self._transfer_history)

        return {
            "total_transfers": total,
            "successful": successful,
            "failed": total - successful,
            "success_rate": round(successful / max(total, 1) * 100, 2),
            "total_bytes": sum(t.bytes_sent + t.bytes_received for t in self._transfer_history),
            "total_retries": sum(t.retries for t in self._transfer_history),
            "avg_duration_ms": round(
                statistics.mean(t.duration_ms for t in self._transfer_history), 2
            ),
            "delta_transfers": sum(1 for t in self._transfer_history if t.is_delta),
            "total_savings_bytes": sum(t.savings_bytes for t in self._transfer_history),
        }

    def get_all_connection_health(self) -> dict[str, ConnectionHealth]:
        """Get health status of all connections."""
        return dict(self._connection_health)

    def export_metrics(self) -> dict[str, Any]:
        """Export all metrics as a serializable dict."""
        return {
            "latency": self.get_latency_stats(),
            "throughput": self.get_throughput_stats(),
            "transfers": self.get_transfer_summary(),
            "connections": {
                did: {
                    "connected": h.connected,
                    "latency_ms": h.latency_ms,
                    "jitter_ms": h.jitter_ms,
                    "route": h.route,
                    "bytes_transferred": h.bytes_transferred,
                    "error_count": h.error_count,
                }
                for did, h in self._connection_health.items()
            },
            "uptime_seconds": round(time.monotonic() - self._start_time, 2),
        }

    def _trim_samples(self) -> None:
        """Remove old samples beyond retention."""
        now = time.monotonic()
        cutoff = now - self.retention_seconds

        self._latency_samples = [
            s for s in self._latency_samples if s.measured_at > cutoff
        ][-self.max_samples:]

        self._throughput_samples = [
            s for s in self._throughput_samples if s.measured_at > cutoff
        ][-self.max_samples:]
