"""
Transfer Management Endpoints
=============================
Handles peer-to-peer file transfer session initiation, authorization,
state machine transitions, and transfer audit history.
"""

from datetime import datetime, timezone
import os
import re
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_active_user
from app.models.device import Device
from app.models.transfer import Transfer
from app.models.user import User
from app.schemas.transfer import (
    TransferActionRequest,
    TransferCompleteRequest,
    TransferCreate,
    TransferResponse,
    TransferUpdate,
)
from app.websocket.manager import ws_manager

router = APIRouter()


def sanitize_filename(filename: str) -> str:
    """Sanitize filename to prevent directory traversal and illegal characters."""
    # Strip paths
    basename = os.path.basename(filename)
    # Remove null bytes and control chars
    cleaned = re.sub(r'[\x00-\x1f\x7f/\\]', '', basename).strip()
    # Fallback if empty or relative navigation
    if not cleaned or cleaned in ('.', '..'):
        return f"transfer_{int(datetime.now(timezone.utc).timestamp())}.bin"
    return cleaned[:255]


@router.post("/", response_model=TransferResponse, status_code=status.HTTP_201_CREATED)
async def create_transfer(
    transfer_in: TransferCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Initiate an authorized peer-to-peer file transfer session.
    Validates sender and receiver devices belonging to the user.
    Notifies recipient device via real-time WebSocket invitation.
    """
    # Verify sender and receiver devices
    devices = (
        db.query(Device)
        .filter(
            Device.user_id == current_user.id,
            Device.id.in_([transfer_in.sender_device_id, transfer_in.receiver_device_id]),
        )
        .all()
    )
    device_map = {d.id: d for d in devices}

    if transfer_in.sender_device_id not in device_map:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Sender device does not belong to authorized user.",
        )
    if transfer_in.receiver_device_id not in device_map:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Recipient device does not belong to authorized user.",
        )
    if transfer_in.sender_device_id == transfer_in.receiver_device_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Sender and receiver devices cannot be identical.",
        )

    # Sanitize file name
    clean_name = sanitize_filename(transfer_in.file_name)

    # Bounded chunk size enforcement (default 64 KiB, bounds [16 KiB, 256 KiB])
    chunk_size = transfer_in.chunk_size or 65536
    chunk_size = max(16384, min(chunk_size, 262144))
    total_chunks = max(1, (transfer_in.file_size + chunk_size - 1) // chunk_size)

    transfer = Transfer(
        user_id=current_user.id,
        sender_device_id=transfer_in.sender_device_id,
        receiver_device_id=transfer_in.receiver_device_id,
        file_name=clean_name,
        file_size=transfer_in.file_size,
        mime_type=transfer_in.mime_type or "application/octet-stream",
        chunk_size=chunk_size,
        total_chunks=total_chunks,
        sha256_hash=transfer_in.sha256_hash,
        status="waiting_for_acceptance",
        connection_method=transfer_in.connection_method or "direct_p2p_webrtc",
        metadata_json=transfer_in.metadata_json or {},
    )
    db.add(transfer)
    db.commit()
    db.refresh(transfer)

    # Dispatch real-time WebSocket invitation to recipient device
    invitation_payload = {
        "type": "TRANSFER_INVITATION",
        "transfer_id": transfer.id,
        "sender_device_id": transfer.sender_device_id,
        "sender_device_name": device_map[transfer.sender_device_id].device_name,
        "file_name": transfer.file_name,
        "file_size": transfer.file_size,
        "mime_type": transfer.mime_type,
        "total_chunks": transfer.total_chunks,
        "chunk_size": transfer.chunk_size,
        "sha256_hash": transfer.sha256_hash,
        "created_at": transfer.created_at.isoformat(),
    }
    await ws_manager.send_personal_message(
        message=invitation_payload,
        user_id=current_user.id,
        device_id=transfer.receiver_device_id,
    )

    return transfer


@router.get("/", response_model=List[TransferResponse])
def list_transfers(
    status_filter: Optional[str] = Query(None, alias="status"),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Retrieve transfer session history for the authenticated user."""
    query = db.query(Transfer).filter(Transfer.user_id == current_user.id)
    if status_filter:
        query = query.filter(Transfer.status == status_filter)
    return query.order_by(Transfer.created_at.desc()).limit(limit).all()


@router.get("/{transfer_id}", response_model=TransferResponse)
def get_transfer(
    transfer_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get single transfer session metadata and status."""
    transfer = (
        db.query(Transfer)
        .filter(Transfer.id == transfer_id, Transfer.user_id == current_user.id)
        .first()
    )
    if not transfer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transfer not found.")
    return transfer


@router.post("/{transfer_id}/accept", response_model=TransferResponse)
async def accept_transfer(
    transfer_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Recipient accepts the incoming transfer invitation."""
    transfer = (
        db.query(Transfer)
        .filter(Transfer.id == transfer_id, Transfer.user_id == current_user.id)
        .first()
    )
    if not transfer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transfer not found.")

    if transfer.status not in ("created", "waiting_for_acceptance"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot accept transfer in state '{transfer.status}'.",
        )

    transfer.status = "connecting"
    db.commit()
    db.refresh(transfer)

    # Notify sender that recipient accepted and is ready for WebRTC handshake
    await ws_manager.send_personal_message(
        message={
            "type": "TRANSFER_ACCEPT",
            "transfer_id": transfer.id,
            "receiver_device_id": transfer.receiver_device_id,
        },
        user_id=current_user.id,
        device_id=transfer.sender_device_id,
    )

    return transfer


@router.post("/{transfer_id}/reject", response_model=TransferResponse)
async def reject_transfer(
    transfer_id: str,
    action: Optional[TransferActionRequest] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Recipient rejects the incoming transfer invitation."""
    transfer = (
        db.query(Transfer)
        .filter(Transfer.id == transfer_id, Transfer.user_id == current_user.id)
        .first()
    )
    if not transfer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transfer not found.")

    transfer.status = "rejected"
    if action and action.reason:
        transfer.error_message = action.reason
    transfer.completed_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(transfer)

    # Notify sender
    await ws_manager.send_personal_message(
        message={
            "type": "TRANSFER_REJECT",
            "transfer_id": transfer.id,
            "reason": action.reason if action else "Transfer rejected by recipient.",
        },
        user_id=current_user.id,
        device_id=transfer.sender_device_id,
    )

    return transfer


@router.post("/{transfer_id}/cancel", response_model=TransferResponse)
async def cancel_transfer(
    transfer_id: str,
    action: Optional[TransferActionRequest] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Cancel an active or pending transfer."""
    transfer = (
        db.query(Transfer)
        .filter(Transfer.id == transfer_id, Transfer.user_id == current_user.id)
        .first()
    )
    if not transfer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transfer not found.")

    transfer.status = "cancelled"
    if action and action.reason:
        transfer.error_message = action.reason
    transfer.completed_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(transfer)

    # Notify both endpoints
    cancel_payload = {
        "type": "TRANSFER_CANCEL",
        "transfer_id": transfer.id,
        "reason": action.reason if action else "Transfer cancelled by user.",
    }
    await ws_manager.send_personal_message(
        cancel_payload, user_id=current_user.id, device_id=transfer.sender_device_id
    )
    await ws_manager.send_personal_message(
        cancel_payload, user_id=current_user.id, device_id=transfer.receiver_device_id
    )

    return transfer


@router.post("/{transfer_id}/complete", response_model=TransferResponse)
async def complete_transfer(
    transfer_id: str,
    req: TransferCompleteRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Record verified completion of a file transfer session.
    Persists empirical throughput, duration, and SHA-256 integrity result.
    """
    transfer = (
        db.query(Transfer)
        .filter(Transfer.id == transfer_id, Transfer.user_id == current_user.id)
        .first()
    )
    if not transfer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transfer not found.")

    transfer.status = "completed"
    transfer.bytes_transferred = req.bytes_transferred
    transfer.throughput_mbps = req.throughput_mbps
    transfer.duration_ms = req.duration_ms
    if req.sha256_hash:
        transfer.sha256_hash = req.sha256_hash
    if req.connection_method:
        transfer.connection_method = req.connection_method
    transfer.completed_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(transfer)

    # Notify peer
    await ws_manager.send_personal_message(
        message={
            "type": "TRANSFER_COMPLETED",
            "transfer_id": transfer.id,
            "bytes_transferred": transfer.bytes_transferred,
            "throughput_mbps": transfer.throughput_mbps,
            "sha256_hash": transfer.sha256_hash,
            "connection_method": transfer.connection_method,
        },
        user_id=current_user.id,
        device_id=transfer.sender_device_id,
    )

    return transfer
