"""
Workspace Model
===============
Represents a synchronizable cross-device workspace (browser tabs, editor state, form state).
"""

from datetime import datetime, timezone
import uuid
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base


class Workspace(Base):
    __tablename__ = "workspaces"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(128), nullable=False)
    description = Column(String(255), nullable=True)
    version = Column(Integer, default=1)
    state_hash = Column(String(64), nullable=True)

    # State data payloads
    active_tab_id = Column(String(64), nullable=True)
    tabs = Column(JSON, default=list)                     # list of tab objects
    cursor_positions = Column(JSON, default=dict)         # per-document/file cursor offsets
    scroll_positions = Column(JSON, default=dict)         # url/file -> scroll percentage / px
    editor_buffers = Column(JSON, default=dict)           # in-progress draft edits
    layout = Column(JSON, default=dict)                   # pane split configuration

    last_modified_by_device = Column(String(36), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    user = relationship("User", back_populates="workspaces")
