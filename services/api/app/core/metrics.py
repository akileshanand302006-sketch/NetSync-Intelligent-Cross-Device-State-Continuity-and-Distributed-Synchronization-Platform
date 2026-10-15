"""
NetSync Prometheus / OpenMetrics Metrics Collector
==================================================
Governed by Non-Negotiable Rule 9 ("Observable by construction")
and Section 9.4 ("Prometheus/OpenMetrics counters, gauges, histograms").
Provides metrics for API latency, active WebSockets, transfer throughput,
sync events, and worker errors.
"""

import time
from typing import Dict, List


class MetricsRegistry:
    """Lightweight in-memory Prometheus OpenMetrics collector."""

    def __init__(self):
        # Counters: name -> count
        self.counters: Dict[str, float] = {
            "netsync_http_requests_total": 0.0,
            "netsync_sync_events_total": 0.0,
            "netsync_file_transfers_total": 0.0,
            "netsync_file_transfer_bytes_total": 0.0,
            "netsync_packet_captures_total": 0.0,
            "netsync_ws_messages_total": 0.0,
        }

        # Gauges: name -> current_value
        self.gauges: Dict[str, float] = {
            "netsync_active_ws_connections": 0.0,
            "netsync_online_devices_count": 0.0,
            "netsync_active_transfers_count": 0.0,
            "netsync_memory_rss_bytes": 0.0,
        }

        # Histograms: name -> list of samples
        self.histograms: Dict[str, List[float]] = {
            "netsync_http_request_duration_seconds": [],
            "netsync_p2p_transfer_duration_seconds": [],
            "netsync_rtt_latency_ms": [],
        }

    def inc_counter(self, name: str, value: float = 1.0):
        if name in self.counters:
            self.counters[name] += value
        else:
            self.counters[name] = value

    def set_gauge(self, name: str, value: float):
        self.gauges[name] = value

    def observe_histogram(self, name: str, value: float):
        if name not in self.histograms:
            self.histograms[name] = []
        # Keep sliding window of 1000 observations to bound memory
        self.histograms[name].append(value)
        if len(self.histograms[name]) > 1000:
            self.histograms[name].pop(0)

    def generate_openmetrics_text(self) -> str:
        """Render metrics into standard Prometheus OpenMetrics text exposition format."""
        lines = []

        # Render Counters
        for name, val in self.counters.items():
            lines.append(f"# TYPE {name} counter")
            lines.append(f"{name} {val}")

        # Render Gauges
        for name, val in self.gauges.items():
            lines.append(f"# TYPE {name} gauge")
            lines.append(f"{name} {val}")

        # Render Histograms (count, sum, quantiles p50, p95, p99)
        for name, samples in self.histograms.items():
            lines.append(f"# TYPE {name} summary")
            if samples:
                sorted_s = sorted(samples)
                count = len(sorted_s)
                total_sum = sum(sorted_s)
                p50 = sorted_s[int(count * 0.50)]
                p95 = sorted_s[min(int(count * 0.95), count - 1)]
                p99 = sorted_s[min(int(count * 0.99), count - 1)]

                lines.append(f'{name}{{quantile="0.5"}} {p50:.4f}')
                lines.append(f'{name}{{quantile="0.95"}} {p95:.4f}')
                lines.append(f'{name}{{quantile="0.99"}} {p99:.4f}')
                lines.append(f"{name}_sum {total_sum:.4f}")
                lines.append(f"{name}_count {count}")
            else:
                lines.append(f"{name}_sum 0.0")
                lines.append(f"{name}_count 0")

        return "\n".join(lines) + "\n"


metrics_registry = MetricsRegistry()
