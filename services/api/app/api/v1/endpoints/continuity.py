"""
Continuity & Handoff Endpoints
==============================
Facilitates seamless task and state handoffs between specific devices.
"""

from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_active_user
from app.models.continuity import ContinuitySession
from app.models.user import User
from app.schemas.continuity import (
    ContinuitySessionCreate,
    ContinuitySessionResponse,
    ContinuitySessionUpdate,
)
from app.websocket.manager import ws_manager

router = APIRouter()


@router.get("/", response_model=List[ContinuitySessionResponse])
def list_continuity_sessions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """List recent continuity handoff requests for the user."""
    return (
        db.query(ContinuitySession)
        .filter(ContinuitySession.user_id == current_user.id)
        .order_by(ContinuitySession.created_at.desc())
        .limit(50)
        .all()
    )


@router.post("/", response_model=ContinuitySessionResponse, status_code=status.HTTP_201_CREATED)
async def create_continuity_session(
    session_in: ContinuitySessionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Initiate a continuity handoff request from source_device to target_device.
    Instantly alerts target_device over WebSocket.
    """
    session = ContinuitySession(
        user_id=current_user.id,
        source_device_id=session_in.source_device_id,
        target_device_id=session_in.target_device_id,
        session_type=session_in.session_type,
        state_type=session_in.state_type,
        payload=session_in.payload,
        status="pending",
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    # Directly notify target device over its WebSocket connection
    await ws_manager.send_personal_message(
        user_id=current_user.id,
        device_id=session_in.target_device_id,
        message={
            "type": "continuity_handoff_incoming",
            "session_id": session.id,
            "source_device_id": session_in.source_device_id,
            "session_type": session_in.session_type,
            "payload": session_in.payload,
        },
    )

    return session


@router.patch("/{session_id}", response_model=ContinuitySessionResponse)
async def update_continuity_session(
    session_id: str,
    update_in: ContinuitySessionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Update handoff status (e.g. accepted, completed, rejected)."""
    session = db.query(ContinuitySession).filter(
        ContinuitySession.id == session_id,
        ContinuitySession.user_id == current_user.id,
    ).first()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    session.status = update_in.status
    if update_in.status in ("completed", "rejected"):
        session.resolved_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(session)

    # Notify source device of resolution
    await ws_manager.send_personal_message(
        user_id=current_user.id,
        device_id=session.source_device_id,
        message={
            "type": "continuity_handoff_status",
            "session_id": session.id,
            "status": session.status,
        },
    )

    return session
