"""
API v1 Router
=============
"""

from fastapi import APIRouter

from app.api.v1.endpoints import (
    auth,
    devices,
    workspaces,
    continuity,
    clipboard,
    network,
    sync,
    transfers,
    network_lab,
    ws,
)

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(devices.router, prefix="/devices", tags=["devices"])
api_router.include_router(workspaces.router, prefix="/workspaces", tags=["workspaces"])
api_router.include_router(continuity.router, prefix="/continuity", tags=["continuity"])
api_router.include_router(clipboard.router, prefix="/clipboard", tags=["clipboard"])
api_router.include_router(network.router, prefix="/network", tags=["network"])
api_router.include_router(sync.router, prefix="/sync", tags=["sync"])
api_router.include_router(transfers.router, prefix="/transfers", tags=["transfers"])
api_router.include_router(network_lab.router, prefix="/lab", tags=["network-lab"])
api_router.include_router(ws.router, tags=["websocket"])
