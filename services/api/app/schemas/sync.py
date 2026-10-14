"""
Synchronization Schemas
=======================
"""

from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict


class SyncPushRequest(BaseModel):
    device_id: str
    state_id: str
    state_type: str = "workspace"
    base_version: int = 0
    target_version: int = 1
    state_data: Dict[str, Any]
    is_delta: bool = False
    delta_payload: Optional[Dict[str, Any]] = None


class SyncPushResponse(BaseModel):
    state_id: str
    version: int
    state_hash: str
    delta_applied: bool
    conflict_detected: bool
    conflict_resolved: bool
    bytes_transferred: int
    bytes_saved: int
    state_data: Dict[str, Any]


class ConflictResolveRequest(BaseModel):
    conflict_id: str
    strategy: str  # server_wins, client_wins, field_merge, manual
    manual_data: Optional[Dict[str, Any]] = None


class SyncLogResponse(BaseModel):
    id: str
    user_id: str
    device_id: str
    state_id: str
    state_type: str
    version: int
    sync_type: str
    delta_used: bool
    bytes_transferred: int
    bytes_saved: int
    duration_ms: float
    conflict_detected: bool
    conflict_strategy: Optional[str] = None
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)
