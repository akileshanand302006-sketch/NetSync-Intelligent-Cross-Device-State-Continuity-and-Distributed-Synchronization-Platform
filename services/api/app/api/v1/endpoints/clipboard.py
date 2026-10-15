"""
Universal Clipboard Endpoints
=============================
Cross-device synchronized clipboard history and broadcast.
"""

from datetime import datetime, timezone, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_active_user
from app.models.clipboard import ClipboardItem
from app.models.user import User
from app.schemas.clipboard import ClipboardCreate, ClipboardResponse
from app.websocket.manager import ws_manager

router = APIRouter()


@router.get("/", response_model=List[ClipboardResponse])
def get_clipboard_history(
    limit: int = 25,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get recent active clipboard snippets, automatically excluding expired items."""
    now = datetime.now(timezone.utc)
    return (
        db.query(ClipboardItem)
        .filter(
            ClipboardItem.user_id == current_user.id,
            or_(ClipboardItem.expires_at == None, ClipboardItem.expires_at > now),
        )
        .order_by(ClipboardItem.created_at.desc())
        .limit(min(limit, 100))
        .all()
    )


@router.post("/", response_model=ClipboardResponse, status_code=status.HTTP_201_CREATED)
async def push_clipboard(
    clip_in: ClipboardCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Push newly copied content to universal clipboard.
    Supports end-to-end encrypted payloads (AES-256-GCM) where server stores ciphertext only.
    Applies automatic TTL expiration for sensitive items (OTPs, passwords).
    """
    now = datetime.now(timezone.utc)
    expires_at = None
    if clip_in.ttl_seconds and clip_in.ttl_seconds > 0:
        expires_at = now + timedelta(seconds=clip_in.ttl_seconds)
    elif clip_in.is_sensitive:
        # Default 5-minute TTL for sensitive OTPs/secrets
        expires_at = now + timedelta(minutes=5)

    item = ClipboardItem(
        user_id=current_user.id,
        device_id=clip_in.device_id,
        content=clip_in.content,
        content_type=clip_in.content_type,
        byte_size=len(clip_in.content.encode("utf-8")),
        is_encrypted=1 if clip_in.is_encrypted else 0,
        iv_base64=clip_in.iv_base64,
        key_id=clip_in.key_id,
        is_sensitive=1 if clip_in.is_sensitive else 0,
        ttl_seconds=clip_in.ttl_seconds or (300 if clip_in.is_sensitive else None),
        expires_at=expires_at,
    )
    db.add(item)
    db.commit()
    db.refresh(item)

    # Broadcast to all other devices belonging to this user
    await ws_manager.broadcast_to_user(
        user_id=current_user.id,
        message={
            "type": "clipboard_sync",
            "item_id": item.id,
            "device_id": item.device_id,
            "content": item.content,
            "content_type": item.content_type,
            "is_encrypted": bool(item.is_encrypted),
            "iv_base64": item.iv_base64,
            "key_id": item.key_id,
            "is_sensitive": bool(item.is_sensitive),
            "expires_at": item.expires_at.isoformat() if item.expires_at else None,
        },
        exclude_device_id=clip_in.device_id,
    )

    return item
