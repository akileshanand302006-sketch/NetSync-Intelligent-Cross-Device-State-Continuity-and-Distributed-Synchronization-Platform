"""
Universal Clipboard Endpoints
=============================
Cross-device synchronized clipboard history and broadcast.
"""

from typing import List
from fastapi import APIRouter, Depends, status
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
    """Get recent clipboard snippets for the user."""
    return (
        db.query(ClipboardItem)
        .filter(ClipboardItem.user_id == current_user.id)
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
    """Push newly copied content to universal clipboard and broadcast to all other devices."""
    item = ClipboardItem(
        user_id=current_user.id,
        device_id=clip_in.device_id,
        content=clip_in.content,
        content_type=clip_in.content_type,
        byte_size=len(clip_in.content.encode("utf-8")),
    )
    db.add(item)
    db.commit()
    db.refresh(item)

    # Broadcast to all other devices of this user
    await ws_manager.broadcast_to_user(
        user_id=current_user.id,
        message={
            "type": "clipboard_sync",
            "item_id": item.id,
            "device_id": item.device_id,
            "content": item.content,
            "content_type": item.content_type,
        },
        exclude_device_id=clip_in.device_id,
    )

    return item
