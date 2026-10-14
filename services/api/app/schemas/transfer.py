"""
Transfer Schemas
================
Pydantic schemas for WebRTC file transfer sessions, manifests, and integrity verification.
"""

from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, ConfigDict, Field


class TransferCreate(BaseModel):
    sender_device_id: str
    receiver_device_id: str
    file_name: str
    file_size: int = Field(gt=0, description="File size in bytes")
    mime_type: Optional[str] = "application/octet-stream"
    chunk_size: Optional[int] = 65536  # Default 64 KiB
    total_chunks: Optional[int] = 1
    sha256_hash: Optional[str] = None
    connection_method: Optional[str] = "direct_p2p_webrtc"
    metadata_json: Optional[Dict[str, Any]] = None


class TransferUpdate(BaseModel):
    status: Optional[str] = None
    bytes_transferred: Optional[int] = None
    throughput_mbps: Optional[float] = None
    duration_ms: Optional[int] = None
    error_message: Optional[str] = None
    sha256_hash: Optional[str] = None


class TransferCompleteRequest(BaseModel):
    bytes_transferred: int
    throughput_mbps: Optional[float] = None
    duration_ms: Optional[int] = None
    sha256_hash: Optional[str] = None
    connection_method: Optional[str] = "direct_p2p_webrtc"


class TransferActionRequest(BaseModel):
    reason: Optional[str] = None


class TransferResponse(BaseModel):
    id: str
    user_id: str
    sender_device_id: str
    receiver_device_id: str
    file_name: str
    file_size: int
    mime_type: Optional[str] = None
    chunk_size: int
    total_chunks: int
    sha256_hash: Optional[str] = None
    status: str
    connection_method: str
    bytes_transferred: int
    throughput_mbps: Optional[float] = None
    duration_ms: Optional[int] = None
    error_message: Optional[str] = None
    created_at: datetime
    completed_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
