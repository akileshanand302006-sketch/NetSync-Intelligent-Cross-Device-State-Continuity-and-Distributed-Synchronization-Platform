"""
Network Telemetry Schemas
=========================
"""

from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict


class MetricCreate(BaseModel):
    device_id: str
    peer_device_id: Optional[str] = None
    path_type: str = "lan"
    latency_ms: float
    throughput_bps: Optional[float] = 0.0
    jitter_ms: Optional[float] = 0.0
    packet_loss_rate: Optional[float] = 0.0
    samples_count: int = 1
    raw_samples: List[float] = []


class MetricResponse(BaseModel):
    id: str
    user_id: str
    device_id: str
    peer_device_id: Optional[str] = None
    path_type: str
    latency_ms: float
    throughput_bps: float
    jitter_ms: float
    packet_loss_rate: float
    samples_count: int
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)


class NetworkSummaryResponse(BaseModel):
    avg_latency_ms: float
    min_latency_ms: float
    max_latency_ms: float
    avg_throughput_mbps: float
    avg_jitter_ms: float
    packet_loss_rate: float
    total_measurements: int
    direct_lan_percentage: float
