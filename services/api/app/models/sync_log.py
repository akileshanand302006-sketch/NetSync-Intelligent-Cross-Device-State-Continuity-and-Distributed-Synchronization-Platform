"""
Sync Event Model
================
Records synchronization transactions: deltas vs full payloads, compression, and conflict handling.
"""

from datetime import datetime, timezone
import uuid
from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base


class SyncEvent(Base):
    __tablename__ = "sync_events"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    device_id = Column(String(36), nullable=False)
    state_id = Column(String(64), nullable=False)
    state_type = Column(String(32), default="workspace")
    version = Column(Integer, default=1)
    sync_type = Column(String(32), default="delta")  # delta, full_snapshot, reconciliation
    delta_used = Column(Boolean, default=True)
    bytes_transferred = Column(Integer, default=0)
    bytes_saved = Column(Integer, default=0)
    duration_ms = Column(Float, default=0.0)
    conflict_detected = Column(Boolean, default=False)
    conflict_strategy = Column(String(32), nullable=True)
    details = Column(JSON, default=dict)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)

    # Relationships
    user = relationship("User", back_populates="sync_logs")
