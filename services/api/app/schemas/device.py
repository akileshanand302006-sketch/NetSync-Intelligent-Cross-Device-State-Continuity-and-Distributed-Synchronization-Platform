"""
Device Schemas
==============
"""

from datetime import datetime
from typing import Any, Dict
from pydantic import BaseModel, ConfigDict


class DeviceCreate(BaseModel):
    device_name: str
    device_type: str = "desktop"
    os: str | None = None
    browser: str | None = None
    ip_address: str | None = None
    port: int = 9100
    metadata_json: Dict[str, Any] | None = None


class DeviceUpdate(BaseModel):
    device_name: str | None = None
    is_online: bool | None = None
    ip_address: str | None = None
    port: int | None = None
    metadata_json: Dict[str, Any] | None = None


class DeviceResponse(BaseModel):
    id: str
    user_id: str
    device_name: str
    device_type: str
    os: str | None = None
    browser: str | None = None
    ip_address: str | None = None
    port: int
    is_online: bool
    is_trusted: bool
    last_seen: datetime
    created_at: datetime
    metadata_json: Dict[str, Any] | None = None

    model_config = ConfigDict(from_attributes=True)


class PairTokenRequest(BaseModel):
    device_id: str


class PairTokenResponse(BaseModel):
    token: str
    expires_in_seconds: int = 300


class PairValidateRequest(BaseModel):
    token: str
    device_name: str
    device_type: str
    os: str | None = None
    browser: str | None = None
    ip_address: str | None = None
    port: int = 9100


class PairValidateResponse(BaseModel):
    status: str
    device: DeviceResponse
    shared_secret: str
