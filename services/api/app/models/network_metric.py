"""
Network Measurement Model
=========================
Stores telemetry metrics: latency RTT, throughput, jitter, and packet loss.
"""

from datetime import datetime, timezone
import uuid
from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base


class NetworkMeasurement(Base):
    __tablename__ = "network_measurements"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    device_id = Column(String(36), nullable=False, index=True)
    peer_device_id = Column(String(36), nullable=True)
    path_type = Column(String(32), default="lan")  # lan, direct_tcp, relay_cloud
    latency_ms = Column(Float, nullable=False)
    throughput_bps = Column(Float, default=0.0)
    jitter_ms = Column(Float, default=0.0)
    packet_loss_rate = Column(Float, default=0.0)
    samples_count = Column(Integer, default=1)
    raw_samples = Column(JSON, default=list)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)

    # Relationships
    user = relationship("User", back_populates="network_metrics")
