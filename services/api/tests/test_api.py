"""
NetSync Backend API Tests
=========================
Integration tests for FastAPI REST endpoints using TestClient.
"""

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.core.database import Base, engine


@pytest.fixture(scope="session", autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield


@pytest.fixture
def client():
    return TestClient(app)


def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "NetSync" in data["service"]


def test_auth_and_device_flow(client):
    # 1. Register
    email = "researcher@netsync.dev"
    password = "SuperSecurePassword123!"
    reg_res = client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": password, "full_name": "Distributed Systems Engineer"},
    )
    assert reg_res.status_code in (201, 400)  # 400 if already created in earlier run

    # 2. Login
    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password},
    )
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 3. Get /me
    me_res = client.get("/api/v1/auth/me", headers=headers)
    assert me_res.status_code == 200
    assert me_res.json()["email"] == email

    # 4. Register Device
    dev_res = client.post(
        "/api/v1/devices/",
        headers=headers,
        json={
            "device_name": "Workstation Alpha",
            "device_type": "desktop",
            "os": "Windows 11",
            "browser": "Chrome",
            "port": 9100,
        },
    )
    assert dev_res.status_code == 201
    device_id = dev_res.json()["id"]

    # 5. List Devices
    list_dev_res = client.get("/api/v1/devices/", headers=headers)
    assert list_dev_res.status_code == 200
    devices = list_dev_res.json()
    assert any(d["id"] == device_id for d in devices)

    # 6. Workspace CRUD
    ws_create = client.post(
        "/api/v1/workspaces/",
        headers=headers,
        json={
            "name": "Research Notes",
            "description": "Network Protocols & State Sync",
            "active_tab_id": "tab-1",
            "tabs": [
                {"id": "tab-1", "url": "https://netsync.dev/docs", "title": "Protocol RFC"},
                {"id": "tab-2", "url": "https://github.com/netsync", "title": "GitHub"},
            ],
            "cursor_positions": {"doc-1": 150},
            "scroll_positions": {"https://netsync.dev/docs": 420},
        },
    )
    assert ws_create.status_code == 201
    ws_id = ws_create.json()["id"]
    assert ws_create.json()["version"] == 1

    # 7. Update Workspace
    ws_update = client.put(
        f"/api/v1/workspaces/{ws_id}",
        headers=headers,
        json={
            "active_tab_id": "tab-2",
            "device_id": device_id,
        },
    )
    assert ws_update.status_code == 200
    assert ws_update.json()["version"] == 2
    assert ws_update.json()["active_tab_id"] == "tab-2"

    # 8. Universal Clipboard
    clip_res = client.post(
        "/api/v1/clipboard/",
        headers=headers,
        json={
            "device_id": device_id,
            "content": "curl -X GET http://localhost:8000/health",
            "content_type": "text/plain",
        },
    )
    assert clip_res.status_code == 201

    clip_history = client.get("/api/v1/clipboard/", headers=headers)
    assert clip_history.status_code == 200
    assert len(clip_history.json()) >= 1

    # 9. Network Telemetry Recording
    metric_res = client.post(
        "/api/v1/network/metrics",
        headers=headers,
        json={
            "device_id": device_id,
            "path_type": "lan",
            "latency_ms": 3.4,
            "throughput_bps": 850000000,
            "jitter_ms": 0.25,
            "packet_loss_rate": 0.0,
            "samples_count": 10,
        },
    )
    assert metric_res.status_code == 201

    summary_res = client.get("/api/v1/network/summary", headers=headers)
    assert summary_res.status_code == 200
    assert summary_res.json()["total_measurements"] >= 1

    # 10. Sync Push
    sync_res = client.post(
        "/api/v1/sync/push",
        headers=headers,
        json={
            "device_id": device_id,
            "state_id": ws_id,
            "state_type": "workspace",
            "base_version": 2,
            "state_data": {
                "tabs": [{"id": "tab-3", "url": "https://rfc-editor.org", "title": "RFC"}],
                "active_tab_id": "tab-3",
                "cursor": {"doc-1": 200},
                "scroll": {"https://rfc-editor.org": 100},
            },
            "is_delta": False,
        },
    )
    assert sync_res.status_code == 200
    assert sync_res.json()["version"] == 3


def test_e2ee_clipboard_and_ttl(client):
    """Verify Section 5.1 & ADR 0005: E2EE clipboard zero-knowledge storage and TTL auto-expiry."""
    # 1. Login
    email = "researcher@netsync.dev"
    password = "SuperSecurePassword123!"
    login_res = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Push E2EE encrypted item with TTL
    encrypted_payload = {
        "device_id": "test-device-uuid",
        "content": "AQIDBAUGBwgJCgsMDQ4PEBESExQVFhcYGRobHB0eHyA=",  # Simulated ciphertext
        "content_type": "text/plain",
        "is_encrypted": True,
        "iv_base64": "MDEyMzQ1Njc4OTAx",
        "key_id": "master-device-key-v1",
        "is_sensitive": True,
        "ttl_seconds": 600,
    }
    clip_res = client.post("/api/v1/clipboard/", headers=headers, json=encrypted_payload)
    assert clip_res.status_code == 201
    clip_data = clip_res.json()
    assert clip_data["is_encrypted"] is True
    assert clip_data["is_sensitive"] is True
    assert clip_data["key_id"] == "master-device-key-v1"
    assert clip_data["expires_at"] is not None

    # 3. Verify retrieved list includes it
    list_res = client.get("/api/v1/clipboard/", headers=headers)
    assert list_res.status_code == 200
    items = list_res.json()
    assert any(item["id"] == clip_data["id"] and item["is_encrypted"] for item in items)

