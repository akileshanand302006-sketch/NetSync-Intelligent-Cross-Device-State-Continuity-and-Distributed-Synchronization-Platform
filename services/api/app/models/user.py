"""
User Model
==========
Represents an authenticated NetSync user account.
"""

from datetime import datetime, timezone
import uuid
from sqlalchemy import Boolean, Column, DateTime, String
from sqlalchemy.orm import relationship
from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    devices = relationship("Device", back_populates="user", cascade="all, delete-orphan")
    workspaces = relationship("Workspace", back_populates="user", cascade="all, delete-orphan")
    continuity_sessions = relationship("ContinuitySession", back_populates="user", cascade="all, delete-orphan")
    clipboards = relationship("ClipboardItem", back_populates="user", cascade="all, delete-orphan")
    network_metrics = relationship("NetworkMeasurement", back_populates="user", cascade="all, delete-orphan")
    sync_logs = relationship("SyncEvent", back_populates="user", cascade="all, delete-orphan")
    transfers = relationship("Transfer", back_populates="user", cascade="all, delete-orphan")
