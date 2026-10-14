"""
Network Telemetry & Measurement Endpoints
=========================================
Ingests real measurements from devices (latency RTT, throughput bps, jitter, packet loss).
"""

from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from sqlalchemy.sql import func

from app.core.database import get_db
from app.core.deps import get_current_active_user
from app.models.network_metric import NetworkMeasurement
from app.models.user import User
from app.schemas.network import MetricCreate, MetricResponse, NetworkSummaryResponse

router = APIRouter()


@router.post("/metrics", response_model=MetricResponse, status_code=status.HTTP_201_CREATED)
def record_metric(
    metric_in: MetricCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Ingest connection telemetry recorded on a client device."""
    measurement = NetworkMeasurement(
        user_id=current_user.id,
        device_id=metric_in.device_id,
        peer_device_id=metric_in.peer_device_id,
        path_type=metric_in.path_type,
        latency_ms=metric_in.latency_ms,
        throughput_bps=metric_in.throughput_bps or 0.0,
        jitter_ms=metric_in.jitter_ms or 0.0,
        packet_loss_rate=metric_in.packet_loss_rate or 0.0,
        samples_count=metric_in.samples_count,
        raw_samples=metric_in.raw_samples,
    )
    db.add(measurement)
    db.commit()
    db.refresh(measurement)
    return measurement


@router.get("/metrics", response_model=List[MetricResponse])
def get_metrics_history(
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get time-series telemetry measurements."""
    return (
        db.query(NetworkMeasurement)
        .filter(NetworkMeasurement.user_id == current_user.id)
        .order_by(NetworkMeasurement.timestamp.desc())
        .limit(min(limit, 200))
        .all()
    )


@router.get("/summary", response_model=NetworkSummaryResponse)
def get_network_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Compute aggregate statistical summary of network health."""
    metrics = (
        db.query(NetworkMeasurement)
        .filter(NetworkMeasurement.user_id == current_user.id)
        .all()
    )

    if not metrics:
        return {
            "avg_latency_ms": 0.0,
            "min_latency_ms": 0.0,
            "max_latency_ms": 0.0,
            "avg_throughput_mbps": 0.0,
            "avg_jitter_ms": 0.0,
            "packet_loss_rate": 0.0,
            "total_measurements": 0,
            "direct_lan_percentage": 100.0,
        }

    latencies = [m.latency_ms for m in metrics]
    throughputs = [m.throughput_bps for m in metrics]
    jitters = [m.jitter_ms for m in metrics]
    losses = [m.packet_loss_rate for m in metrics]
    lan_count = sum(1 for m in metrics if m.path_type == "lan")

    return {
        "avg_latency_ms": round(sum(latencies) / len(latencies), 2),
        "min_latency_ms": round(min(latencies), 2),
        "max_latency_ms": round(max(latencies), 2),
        "avg_throughput_mbps": round((sum(throughputs) / len(throughputs)) * 8 / 1_000_000, 2),
        "avg_jitter_ms": round(sum(jitters) / len(jitters), 2),
        "packet_loss_rate": round(sum(losses) / len(losses), 4),
        "total_measurements": len(metrics),
        "direct_lan_percentage": round((lan_count / len(metrics)) * 100, 1),
    }
