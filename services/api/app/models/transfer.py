"""
Transfer Model
==============
Represents a peer-to-peer file transfer session between registered mesh devices.
Tracks session authorization, WebRTC metadata, chunking metrics, and integrity verification.
"""

from datetime import datetime, timezone
import uuid
from sqlalchemy import BigInteger, Column, DateTime, Float, ForeignKey, Integer, String, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base


class Transfer(Base):
    __tablename__ = "transfers"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    sender_device_id = Column(String(36), nullable=False, index=True)
    receiver_device_id = Column(String(36), nullable=False, index=True)
    file_name = Column(String(255), nullable=False)
    file_size = Column(BigInteger, nullable=False)
    mime_type = Column(String(128), default="application/octet-stream")
    chunk_size = Column(Integer, default=65536)  # 64 KiB bounded chunk size
    total_chunks = Column(Integer, default=1)
    sha256_hash = Column(String(64), nullable=True)
    status = Column(
        String(32),
        default="created",
        index=True,
    )  # created, waiting_for_acceptance, connecting, ready, transferring, verifying, completed, rejected, cancelled, failed
    connection_method = Column(String(32), default="direct_p2p_webrtc")  # direct_p2p_webrtc, relay_fallback
    bytes_transferred = Column(BigInteger, default=0)
    throughput_mbps = Column(Float, nullable=True)
    duration_ms = Column(Integer, nullable=True)
    error_message = Column(String(512), nullable=True)
    metadata_json = Column(JSON, default=dict)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    completed_at = Column(DateTime, nullable=True)

    # Relationships
    user = relationship("User", back_populates="transfers")
