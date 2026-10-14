"""
Universal Clipboard Model
=========================
Stores end-to-end synchronized clipboard items across user devices.
"""

from datetime import datetime, timezone
import uuid
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from app.core.database import Base


class ClipboardItem(Base):
    __tablename__ = "clipboards"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    device_id = Column(String(36), nullable=False)
    content = Column(Text, nullable=False)
    content_type = Column(String(32), default="text/plain")  # text/plain, text/html, image/png, application/json
    byte_size = Column(Integer, default=0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)

    # Relationships
    user = relationship("User", back_populates="clipboards")
