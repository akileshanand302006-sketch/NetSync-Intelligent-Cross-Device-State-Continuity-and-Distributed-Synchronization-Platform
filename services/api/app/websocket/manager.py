"""
WebSocket Connection Manager
============================
Manages live WebSocket channels grouped by user and device ID.
Facilitates real-time presence updates, state sync broadcasting, and peer notifications.
"""

import json
import logging
from typing import Any, Dict, List
from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ConnectionManager:
    """Tracks active WebSockets partitioned by user ID and device ID."""

    def __init__(self):
        # user_id -> dict[device_id, WebSocket]
        self.active_connections: Dict[str, Dict[str, WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: str, device_id: str):
        """Accept WebSocket connection and register under user and device."""
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = {}
        self.active_connections[user_id][device_id] = websocket
        logger.info("Device %s connected for user %s", device_id, user_id)

        # Notify peers about device coming online
        await self.broadcast_to_user(
            user_id=user_id,
            message={
                "type": "device_status",
                "device_id": device_id,
                "status": "online",
            },
            exclude_device_id=device_id,
        )

    def disconnect(self, user_id: str, device_id: str):
        """Unregister device WebSocket upon disconnection."""
        if user_id in self.active_connections:
            self.active_connections[user_id].pop(device_id, None)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
        logger.info("Device %s disconnected for user %s", device_id, user_id)

    async def send_personal_message(self, message: Dict[str, Any], user_id: str, device_id: str):
        """Send direct targeted JSON message to a specific device."""
        if user_id in self.active_connections and device_id in self.active_connections[user_id]:
            websocket = self.active_connections[user_id][device_id]
            try:
                await websocket.send_text(json.dumps(message))
            except Exception as e:
                logger.warning("Failed to send message to device %s: %s", device_id, e)

    async def broadcast_to_user(
        self,
        user_id: str,
        message: Dict[str, Any],
        exclude_device_id: str | None = None,
    ):
        """Broadcast an event to all connected devices belonging to this user."""
        if user_id not in self.active_connections:
            return

        payload = json.dumps(message)
        for device_id, websocket in list(self.active_connections[user_id].items()):
            if exclude_device_id and device_id == exclude_device_id:
                continue
            try:
                await websocket.send_text(payload)
            except Exception as e:
                logger.warning("Broadcast error to device %s: %s", device_id, e)

    def get_online_devices(self, user_id: str) -> List[str]:
        """Return list of currently active device IDs for a user."""
        if user_id in self.active_connections:
            return list(self.active_connections[user_id].keys())
        return []


ws_manager = ConnectionManager()
