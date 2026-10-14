"""
NetSync API Schemas
===================
"""

from app.schemas.auth import Token, TokenPayload, UserRegister, UserLogin, UserResponse
from app.schemas.device import (
    DeviceCreate,
    DeviceUpdate,
    DeviceResponse,
    PairTokenRequest,
    PairTokenResponse,
    PairValidateRequest,
    PairValidateResponse,
)
from app.schemas.workspace import (
    TabItem,
    WorkspaceCreate,
    WorkspaceUpdate,
    WorkspaceResponse,
)
from app.schemas.continuity import (
    ContinuitySessionCreate,
    ContinuitySessionUpdate,
    ContinuitySessionResponse,
)
from app.schemas.clipboard import ClipboardCreate, ClipboardResponse
from app.schemas.network import MetricCreate, MetricResponse, NetworkSummaryResponse
from app.schemas.sync import (
    SyncPushRequest,
    SyncPushResponse,
    ConflictResolveRequest,
    SyncLogResponse,
)
from app.schemas.transfer import (
    TransferCreate,
    TransferUpdate,
    TransferCompleteRequest,
    TransferActionRequest,
    TransferResponse,
)

__all__ = [
    "Token",
    "TokenPayload",
    "UserRegister",
    "UserLogin",
    "UserResponse",
    "DeviceCreate",
    "DeviceUpdate",
    "DeviceResponse",
    "PairTokenRequest",
    "PairTokenResponse",
    "PairValidateRequest",
    "PairValidateResponse",
    "TabItem",
    "WorkspaceCreate",
    "WorkspaceUpdate",
    "WorkspaceResponse",
    "ContinuitySessionCreate",
    "ContinuitySessionUpdate",
    "ContinuitySessionResponse",
    "ClipboardCreate",
    "ClipboardResponse",
    "MetricCreate",
    "MetricResponse",
    "NetworkSummaryResponse",
    "SyncPushRequest",
    "SyncPushResponse",
    "ConflictResolveRequest",
    "SyncLogResponse",
    "TransferCreate",
    "TransferUpdate",
    "TransferCompleteRequest",
    "TransferActionRequest",
    "TransferResponse",
]
