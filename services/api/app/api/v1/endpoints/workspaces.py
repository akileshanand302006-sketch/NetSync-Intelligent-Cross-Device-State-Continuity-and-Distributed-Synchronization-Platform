"""
Workspaces Endpoints
====================
Manages synchronizable workspace state (tabs, scroll, cursor, editor layout).
"""

from datetime import datetime, timezone
import hashlib
import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_active_user
from app.models.user import User
from app.models.workspace import Workspace
from app.schemas.workspace import WorkspaceCreate, WorkspaceResponse, WorkspaceUpdate
from app.websocket.manager import ws_manager

router = APIRouter()


def compute_workspace_hash(data: dict) -> str:
    serialized = json.dumps(data, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(serialized.encode("utf-8")).hexdigest()


@router.get("/", response_model=List[WorkspaceResponse])
def list_workspaces(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """List all workspaces belonging to the current user."""
    return db.query(Workspace).filter(Workspace.user_id == current_user.id).all()


@router.post("/", response_model=WorkspaceResponse, status_code=status.HTTP_201_CREATED)
def create_workspace(
    workspace_in: WorkspaceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Create a new workspace."""
    workspace = Workspace(
        user_id=current_user.id,
        name=workspace_in.name,
        description=workspace_in.description,
        version=1,
        active_tab_id=workspace_in.active_tab_id,
        tabs=workspace_in.tabs,
        cursor_positions=workspace_in.cursor_positions,
        scroll_positions=workspace_in.scroll_positions,
        editor_buffers=workspace_in.editor_buffers,
        layout=workspace_in.layout,
    )
    workspace.state_hash = compute_workspace_hash({
        "tabs": workspace.tabs,
        "active_tab_id": workspace.active_tab_id,
        "cursor": workspace.cursor_positions,
        "scroll": workspace.scroll_positions,
    })
    db.add(workspace)
    db.commit()
    db.refresh(workspace)
    return workspace


@router.get("/{workspace_id}", response_model=WorkspaceResponse)
def get_workspace(
    workspace_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Fetch details and current state of a workspace."""
    workspace = db.query(Workspace).filter(
        Workspace.id == workspace_id,
        Workspace.user_id == current_user.id,
    ).first()
    if not workspace:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")
    return workspace


@router.put("/{workspace_id}", response_model=WorkspaceResponse)
async def update_workspace(
    workspace_id: str,
    workspace_update: WorkspaceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Update workspace state (tabs, scroll, cursor) and broadcast real-time sync event."""
    workspace = db.query(Workspace).filter(
        Workspace.id == workspace_id,
        Workspace.user_id == current_user.id,
    ).first()
    if not workspace:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")

    update_dict = workspace_update.model_dump(exclude_unset=True)
    device_id = update_dict.pop("device_id", None)

    for field, value in update_dict.items():
        setattr(workspace, field, value)

    workspace.version += 1
    workspace.last_modified_by_device = device_id
    workspace.updated_at = datetime.now(timezone.utc)
    workspace.state_hash = compute_workspace_hash({
        "tabs": workspace.tabs,
        "active_tab_id": workspace.active_tab_id,
        "cursor": workspace.cursor_positions,
        "scroll": workspace.scroll_positions,
    })

    db.commit()
    db.refresh(workspace)

    # Broadcast state change to all other connected user devices via WebSocket
    await ws_manager.broadcast_to_user(
        user_id=current_user.id,
        message={
            "type": "workspace_updated",
            "workspace_id": workspace.id,
            "version": workspace.version,
            "modified_by": device_id,
            "tabs_count": len(workspace.tabs or []),
            "active_tab_id": workspace.active_tab_id,
        },
        exclude_device_id=device_id,
    )

    return workspace


@router.delete("/{workspace_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_workspace(
    workspace_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Delete a workspace."""
    workspace = db.query(Workspace).filter(
        Workspace.id == workspace_id,
        Workspace.user_id == current_user.id,
    ).first()
    if not workspace:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")
    db.delete(workspace)
    db.commit()
    return None
