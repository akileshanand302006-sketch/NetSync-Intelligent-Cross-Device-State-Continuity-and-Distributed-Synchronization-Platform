"""
Synchronization Endpoints
=========================
Core state synchronization engine integration:
- Computes deltas vs full payloads
- Resolves concurrent write conflicts
- Records bandwidth transfer savings
"""

from datetime import datetime, timezone
import json
import time
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_active_user
from app.models.sync_log import SyncEvent
from app.models.user import User
from app.models.workspace import Workspace
from app.schemas.sync import (
    ConflictResolveRequest,
    SyncLogResponse,
    SyncPushRequest,
    SyncPushResponse,
)
from app.websocket.manager import ws_manager

from netsync_network.synchronization.delta_engine import DeltaEngine, StateDelta
from netsync_network.synchronization.conflict_resolution import (
    ConflictResolver,
    ConflictStrategy,
)
from netsync_network.synchronization.state_manager import StateSnapshot

router = APIRouter()
delta_engine = DeltaEngine(threshold=0.8)
conflict_resolver = ConflictResolver()


@router.post("/push", response_model=SyncPushResponse)
async def push_state_sync(
    push_req: SyncPushRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Process incoming state sync payload.
    - If delta: applies delta onto current base state
    - If full: checks for concurrent divergence and resolves conflicts
    - Calculates bandwidth savings
    - Broadcasts updated state to connected peer devices
    """
    start_time = time.monotonic()
    conflict_detected = False
    conflict_resolved = False

    # Find target workspace / state
    workspace = db.query(Workspace).filter(
        Workspace.id == push_req.state_id,
        Workspace.user_id == current_user.id,
    ).first()

    server_data = {}
    if workspace:
        server_data = {
            "tabs": workspace.tabs or [],
            "active_tab_id": workspace.active_tab_id or "",
            "cursor": workspace.cursor_positions or {},
            "scroll": workspace.scroll_positions or {},
            "buffers": workspace.editor_buffers or {},
        }

    applied_data = dict(push_req.state_data)
    bytes_transferred = len(json.dumps(push_req.state_data).encode("utf-8"))
    bytes_saved = 0

    if push_req.is_delta and push_req.delta_payload and workspace:
        # Apply field-level delta
        delta = StateDelta.from_dict(push_req.delta_payload)
        applied_data = delta_engine.apply_delta(server_data, delta)
        full_size = len(json.dumps(applied_data).encode("utf-8"))
        bytes_transferred = len(push_req.delta_payload)
        bytes_saved = max(0, full_size - bytes_transferred)
    elif workspace and workspace.version > push_req.base_version:
        # Client pushed older base version -> concurrent edit conflict check
        conflict = conflict_resolver.detect_conflict(
            state_id=push_req.state_id,
            state_type=push_req.state_type,
            server_data=server_data,
            client_data=push_req.state_data,
            server_version=workspace.version,
            client_version=push_req.base_version,
            device_id=push_req.device_id,
        )
        if conflict:
            conflict_detected = True
            # Auto-resolve using FIELD_MERGE
            applied_data = conflict_resolver.resolve(
                conflict=conflict,
                server_data=server_data,
                client_data=push_req.state_data,
                strategy=ConflictStrategy.FIELD_MERGE,
            )
            conflict_resolved = True

    new_hash = StateSnapshot.compute_hash(applied_data)
    new_version = (workspace.version + 1) if workspace else 1

    if workspace:
        workspace.version = new_version
        workspace.state_hash = new_hash
        workspace.tabs = applied_data.get("tabs", workspace.tabs)
        workspace.active_tab_id = applied_data.get("active_tab_id", workspace.active_tab_id)
        workspace.cursor_positions = applied_data.get("cursor", workspace.cursor_positions)
        workspace.scroll_positions = applied_data.get("scroll", workspace.scroll_positions)
        workspace.editor_buffers = applied_data.get("buffers", workspace.editor_buffers)
        workspace.last_modified_by_device = push_req.device_id
        workspace.updated_at = datetime.now(timezone.utc)
    else:
        workspace = Workspace(
            id=push_req.state_id,
            user_id=current_user.id,
            name=f"Workspace {push_req.state_id[:6]}",
            version=new_version,
            state_hash=new_hash,
            tabs=applied_data.get("tabs", []),
            active_tab_id=applied_data.get("active_tab_id", ""),
            cursor_positions=applied_data.get("cursor", {}),
            scroll_positions=applied_data.get("scroll", {}),
            editor_buffers=applied_data.get("buffers", {}),
            last_modified_by_device=push_req.device_id,
        )
        db.add(workspace)

    duration_ms = (time.monotonic() - start_time) * 1000

    # Log sync transaction
    sync_event = SyncEvent(
        user_id=current_user.id,
        device_id=push_req.device_id,
        state_id=push_req.state_id,
        state_type=push_req.state_type,
        version=new_version,
        sync_type="delta" if push_req.is_delta else "full_snapshot",
        delta_used=push_req.is_delta,
        bytes_transferred=bytes_transferred,
        bytes_saved=bytes_saved,
        duration_ms=duration_ms,
        conflict_detected=conflict_detected,
        conflict_strategy="field_merge" if conflict_detected else None,
        details={"state_hash": new_hash},
    )
    db.add(sync_event)
    db.commit()
    db.refresh(workspace)

    # Broadcast state sync to peers
    await ws_manager.broadcast_to_user(
        user_id=current_user.id,
        message={
            "type": "state_sync",
            "state_id": workspace.id,
            "version": workspace.version,
            "state_hash": new_hash,
            "modified_by": push_req.device_id,
            "is_delta": push_req.is_delta,
        },
        exclude_device_id=push_req.device_id,
    )

    return {
        "state_id": workspace.id,
        "version": workspace.version,
        "state_hash": new_hash,
        "delta_applied": push_req.is_delta,
        "conflict_detected": conflict_detected,
        "conflict_resolved": conflict_resolved,
        "bytes_transferred": bytes_transferred,
        "bytes_saved": bytes_saved,
        "state_data": applied_data,
    }


@router.get("/history", response_model=List[SyncLogResponse])
def get_sync_history(
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Retrieve history of state sync operations with byte savings and delta statistics."""
    return (
        db.query(SyncEvent)
        .filter(SyncEvent.user_id == current_user.id)
        .order_by(SyncEvent.timestamp.desc())
        .limit(min(limit, 100))
        .all()
    )
