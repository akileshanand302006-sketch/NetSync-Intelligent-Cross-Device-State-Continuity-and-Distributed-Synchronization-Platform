"""
Clipboard Schemas
=================
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class ClipboardCreate(BaseModel):
    device_id: str
    content: str
    content_type: str = "text/plain"
    is_encrypted: bool = False
    iv_base64: Optional[str] = None
    key_id: Optional[str] = None
    is_sensitive: bool = False
    ttl_seconds: Optional[int] = None


class ClipboardResponse(BaseModel):
    id: str
    user_id: str
    device_id: str
    content: str
    content_type: str
    byte_size: int
    is_encrypted: bool = False
    iv_base64: Optional[str] = None
    key_id: Optional[str] = None
    is_sensitive: bool = False
    ttl_seconds: Optional[int] = None
    expires_at: Optional[datetime] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
