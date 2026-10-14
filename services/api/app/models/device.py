"""
Device Model
============
Represents a registered peer device in a user's mesh network.
"""

from datetime import datetime, timezone
import uuid
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base


class Device(Base):
    __tablename__ = "devices"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    device_name = Column(String(128), nullable=False)
    device_type = Column(String(32), default="desktop")  # desktop, laptop, phone, tablet, browser_ext
    os = Column(String(64), nullable=True)                 # Windows, macOS, Linux, iOS, Android
    browser = Column(String(64), nullable=True)            # Chrome, Firefox, Safari, Edge
    ip_address = Column(String(64), nullable=True)
    port = Column(Integer, default=9100)
    is_online = Column(Boolean, default=False)
    is_trusted = Column(Boolean, default=True)
    last_seen = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    pairing_token = Column(String(16), nullable=True)
    public_key = Column(String(512), nullable=True)
    metadata_json = Column(JSON, default=dict)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    user = relationship("User", back_populates="devices")
