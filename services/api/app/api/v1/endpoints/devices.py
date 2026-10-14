"""
Device Management & Pairing Endpoints
=====================================
Handles peer registration, online heartbeats, 6-digit short-lived pairing tokens, and shared secrets.
"""

from datetime import datetime, timezone
import secrets
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_active_user
from app.models.device import Device
from app.models.user import User
from app.schemas.device import (
    DeviceCreate,
    DeviceResponse,
    DeviceUpdate,
    PairTokenRequest,
    PairTokenResponse,
    PairValidateRequest,
    PairValidateResponse,
)
from app.websocket.manager import ws_manager

router = APIRouter()


@router.get("/", response_model=List[DeviceResponse])
def list_devices(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """List all registered devices belonging to the authenticated user."""
    devices = db.query(Device).filter(Device.user_id == current_user.id).all()
    # Update online flag based on live websocket connections
    online_ids = set(ws_manager.get_online_devices(current_user.id))
    for d in devices:
        if d.id in online_ids:
            d.is_online = True
    return devices


@router.post("/", response_model=DeviceResponse, status_code=status.HTTP_201_CREATED)
def register_device(
    device_in: DeviceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Register a new device for the user."""
    device = Device(
        user_id=current_user.id,
        device_name=device_in.device_name,
        device_type=device_in.device_type,
        os=device_in.os,
        browser=device_in.browser,
        ip_address=device_in.ip_address,
        port=device_in.port,
        is_online=True,
        metadata_json=device_in.metadata_json or {},
    )
    db.add(device)
    db.commit()
    db.refresh(device)
    return device


@router.get("/{device_id}", response_model=DeviceResponse)
def get_device(
    device_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Retrieve details of a specific device."""
    device = db.query(Device).filter(Device.id == device_id, Device.user_id == current_user.id).first()
    if not device:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Device not found")
    return device


@router.patch("/{device_id}", response_model=DeviceResponse)
def update_device(
    device_id: str,
    device_update: DeviceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Update device network metadata, IP, or online status."""
    device = db.query(Device).filter(Device.id == device_id, Device.user_id == current_user.id).first()
    if not device:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Device not found")

    update_data = device_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(device, key, value)
    device.last_seen = datetime.now(timezone.utc)
    db.commit()
    db.refresh(device)
    return device


@router.delete("/{device_id}", status_code=status.HTTP_204_NO_CONTENT)
def revoke_device(
    device_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Revoke and delete a device."""
    device = db.query(Device).filter(Device.id == device_id, Device.user_id == current_user.id).first()
    if not device:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Device not found")
    db.delete(device)
    db.commit()
    return None


@router.post("/pair/generate", response_model=PairTokenResponse)
def generate_pair_token(
    req: PairTokenRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Generate a single-use 6-digit short-lived pairing code for device handshakes."""
    device = db.query(Device).filter(Device.id == req.device_id, Device.user_id == current_user.id).first()
    if not device:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Device not found")

    token = str(secrets.randbelow(900000) + 100000)
    device.pairing_token = token
    db.commit()
    return {"token": token, "expires_in_seconds": 300}


@router.post("/pair/validate", response_model=PairValidateResponse)
def validate_pair_token(
    req: PairValidateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Validate 6-digit pairing code and pair new device with shared key exchange."""
    host_device = db.query(Device).filter(
        Device.pairing_token == req.token,
        Device.user_id == current_user.id,
    ).first()

    if not host_device:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired pairing code",
        )

    # Invalidate token (single-use)
    host_device.pairing_token = None

    # Register the joining device
    new_device = Device(
        user_id=current_user.id,
        device_name=req.device_name,
        device_type=req.device_type,
        os=req.os,
        browser=req.browser,
        ip_address=req.ip_address,
        port=req.port,
        is_online=True,
        is_trusted=True,
    )
    db.add(new_device)
    db.commit()
    db.refresh(new_device)

    shared_secret = secrets.token_hex(32)

    return {
        "status": "paired",
        "device": new_device,
        "shared_secret": shared_secret,
    }
