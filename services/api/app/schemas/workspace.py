"""
Workspace Schemas
=================
"""

from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict


class TabItem(BaseModel):
    id: str
    url: str
    title: str
    favIconUrl: Optional[str] = None
    pinned: bool = False
    active: bool = False
    scroll_pos: Optional[int] = 0


class WorkspaceCreate(BaseModel):
    name: str
    description: Optional[str] = None
    active_tab_id: Optional[str] = None
    tabs: List[Dict[str, Any]] = []
    cursor_positions: Dict[str, Any] = {}
    scroll_positions: Dict[str, Any] = {}
    editor_buffers: Dict[str, Any] = {}
    layout: Dict[str, Any] = {}


class WorkspaceUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    active_tab_id: Optional[str] = None
    tabs: Optional[List[Dict[str, Any]]] = None
    cursor_positions: Optional[Dict[str, Any]] = None
    scroll_positions: Optional[Dict[str, Any]] = None
    editor_buffers: Optional[Dict[str, Any]] = None
    layout: Optional[Dict[str, Any]] = None
    device_id: Optional[str] = None


class WorkspaceResponse(BaseModel):
    id: str
    user_id: str
    name: str
    description: Optional[str] = None
    version: int
    state_hash: Optional[str] = None
    active_tab_id: Optional[str] = None
    tabs: List[Dict[str, Any]]
    cursor_positions: Dict[str, Any]
    scroll_positions: Dict[str, Any]
    editor_buffers: Dict[str, Any]
    layout: Dict[str, Any]
    last_modified_by_device: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
