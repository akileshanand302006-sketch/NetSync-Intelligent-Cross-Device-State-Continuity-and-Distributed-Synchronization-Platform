"""
Continuity Schemas
==================
"""

from datetime import datetime
from typing import Any, Dict, Optional
from pydantic import BaseModel, ConfigDict


class ContinuitySessionCreate(BaseModel):
    source_device_id: str
    target_device_id: str
    session_type: str = "handoff"
    state_type: str = "workspace"
    payload: Dict[str, Any]


class ContinuitySessionUpdate(BaseModel):
    status: str  # accepted, completed, rejected, expired


class ContinuitySessionResponse(BaseModel):
    id: str
    user_id: str
    source_device_id: str
    target_device_id: str
    session_type: str
    state_type: str
    payload: Dict[str, Any]
    status: str
    created_at: datetime
    resolved_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
