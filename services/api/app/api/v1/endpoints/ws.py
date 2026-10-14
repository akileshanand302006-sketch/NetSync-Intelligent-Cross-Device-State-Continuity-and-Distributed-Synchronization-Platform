"""
WebSocket Endpoint
==================
Real-time full-duplex WebSocket channel for connected devices and browser extensions.
"""

import json
import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.core.security import decode_access_token
from app.models.user import User
from app.websocket.manager import ws_manager

logger = logging.getLogger(__name__)
router = APIRouter()


@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    token: str = Query(...),
    device_id: str = Query(...),
):
    """
    WebSocket connection endpoint.
    Validates user JWT token from query parameter and registers device.
    """
    payload = decode_access_token(token)
    if not payload or not payload.get("sub"):
        await websocket.close(code=4001, reason="Unauthorized")
        return

    user_id = payload["sub"]

    # Connect device to WS manager
    await ws_manager.connect(websocket, user_id=user_id, device_id=device_id)

    try:
        while True:
            raw_text = await websocket.receive_text()
            try:
                data = json.loads(raw_text)
                msg_type = data.get("type")

                if msg_type == "ping":
                    await websocket.send_text(json.dumps({"type": "pong"}))
                elif msg_type in (
                    "OFFER",
                    "ANSWER",
                    "ICE_CANDIDATE",
                    "TRANSFER_REQUEST",
                    "TRANSFER_INVITATION",
                    "TRANSFER_ACCEPT",
                    "TRANSFER_REJECT",
                    "TRANSFER_CANCEL",
                    "TRANSFER_PROGRESS",
                    "TRANSFER_COMPLETED",
                    "PEER_READY",
                    "RELAY_CHUNK",
                ):
                    # WebRTC P2P signaling routing
                    target_device_id = data.get("target_device_id") or data.get("receiver_device_id")
                    data["sender_device_id"] = device_id
                    if target_device_id:
                        await ws_manager.send_personal_message(
                            message=data,
                            user_id=user_id,
                            device_id=target_device_id,
                        )
                    else:
                        await ws_manager.broadcast_to_user(
                            user_id=user_id,
                            message=data,
                            exclude_device_id=device_id,
                        )
                elif msg_type == "broadcast":
                    # Broadcast to user's other devices
                    await ws_manager.broadcast_to_user(
                        user_id=user_id,
                        message=data.get("message", {}),
                        exclude_device_id=device_id,
                    )
            except json.JSONDecodeError:
                pass
    except WebSocketDisconnect:
        ws_manager.disconnect(user_id=user_id, device_id=device_id)
        # Notify peers that this device disconnected
        await ws_manager.broadcast_to_user(
            user_id=user_id,
            message={
                "type": "device_status",
                "device_id": device_id,
                "status": "offline",
            },
        )
    except Exception as e:
        logger.error("WebSocket unexpected exception: %s", e)
        ws_manager.disconnect(user_id=user_id, device_id=device_id)
