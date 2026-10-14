"""
Continuity Model
================
Tracks instant handoff and cross-device continuity requests.
"""

from datetime import datetime, timezone
import uuid
from sqlalchemy import Column, DateTime, ForeignKey, String, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base


class ContinuitySession(Base):
    __tablename__ = "continuity_sessions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    source_device_id = Column(String(36), nullable=False)
    target_device_id = Column(String(36), nullable=False)
    session_type = Column(String(32), default="handoff")  # handoff, workspace_beam, tab_push, media_continue
    state_type = Column(String(32), default="workspace")
    payload = Column(JSON, nullable=False)
    status = Column(String(32), default="pending")        # pending, accepted, completed, expired, rejected
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    resolved_at = Column(DateTime, nullable=True)

    # Relationships
    user = relationship("User", back_populates="continuity_sessions")
