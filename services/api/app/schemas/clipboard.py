"""
Clipboard Schemas
=================
"""

from datetime import datetime
from pydantic import BaseModel, ConfigDict


class ClipboardCreate(BaseModel):
    device_id: str
    content: str
    content_type: str = "text/plain"


class ClipboardResponse(BaseModel):
    id: str
    user_id: str
    device_id: str
    content: str
    content_type: str
    byte_size: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
