"""
Transfer API Unit & Integration Tests
====================================
Tests transfer session initiation, authorization validation, state transitions
(accept, reject, cancel, complete), and history retrieval.
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


def test_transfer_lifecycle(client):
    # 1. Register and login test user
    email = "transfer_user@netsync.dev"
    password = "TestPassword456!"
    client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": password, "full_name": "WebRTC Peer Tester"},
    )
    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password},
    )
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Register Sender and Receiver devices
    dev1_res = client.post(
        "/api/v1/devices/",
        headers=headers,
        json={"device_name": "Sender Node", "device_type": "desktop", "os": "macOS", "port": 9100},
    )
    assert dev1_res.status_code == 201
    sender_id = dev1_res.json()["id"]

    dev2_res = client.post(
        "/api/v1/devices/",
        headers=headers,
        json={"device_name": "Receiver Node", "device_type": "laptop", "os": "Linux", "port": 9100},
    )
    assert dev2_res.status_code == 201
    receiver_id = dev2_res.json()["id"]

    # 3. Create Transfer Session (P2P manifest)
    create_res = client.post(
        "/api/v1/transfers/",
        headers=headers,
        json={
            "sender_device_id": sender_id,
            "receiver_device_id": receiver_id,
            "file_name": "../../suspicious_path/firmware_update.iso",
            "file_size": 104857600,  # 100 MB
            "mime_type": "application/x-iso9660-image",
            "chunk_size": 65536,
            "sha256_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
            "connection_method": "direct_p2p_webrtc",
        },
    )
    assert create_res.status_code == 201
    transfer_data = create_res.json()
    transfer_id = transfer_data["id"]

    # Path traversal protection: filename should be sanitized to basename only
    assert transfer_data["file_name"] == "firmware_update.iso"
    assert transfer_data["status"] == "waiting_for_acceptance"
    assert transfer_data["total_chunks"] == 1600  # 100MB / 64KB

    # 4. Get transfer details
    get_res = client.get(f"/api/v1/transfers/{transfer_id}", headers=headers)
    assert get_res.status_code == 200
    assert get_res.json()["id"] == transfer_id

    # 5. Accept transfer
    accept_res = client.post(f"/api/v1/transfers/{transfer_id}/accept", headers=headers)
    assert accept_res.status_code == 200
    assert accept_res.json()["status"] == "connecting"

    # 6. Complete transfer with verified metrics
    comp_res = client.post(
        f"/api/v1/transfers/{transfer_id}/complete",
        headers=headers,
        json={
            "bytes_transferred": 104857600,
            "throughput_mbps": 48.5,
            "duration_ms": 2160,
            "sha256_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
            "connection_method": "direct_p2p_webrtc",
        },
    )
    assert comp_res.status_code == 200
    assert comp_res.json()["status"] == "completed"
    assert comp_res.json()["throughput_mbps"] == 48.5

    # 7. List transfer history
    list_res = client.get("/api/v1/transfers/", headers=headers)
    assert list_res.status_code == 200
    history = list_res.json()
    assert any(t["id"] == transfer_id for t in history)


def test_transfer_rejection_and_cancel(client):
    email = "transfer_user2@netsync.dev"
    password = "TestPassword456!"
    client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": password, "full_name": "Peer 2"},
    )
    login_res = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    dev1 = client.post(
        "/api/v1/devices/",
        headers=headers,
        json={"device_name": "Dev A", "device_type": "desktop"},
    ).json()["id"]
    dev2 = client.post(
        "/api/v1/devices/",
        headers=headers,
        json={"device_name": "Dev B", "device_type": "phone"},
    ).json()["id"]

    # Reject flow
    t1 = client.post(
        "/api/v1/transfers/",
        headers=headers,
        json={
            "sender_device_id": dev1,
            "receiver_device_id": dev2,
            "file_name": "untrusted_archive.tar.gz",
            "file_size": 5000000,
        },
    ).json()

    rej = client.post(
        f"/api/v1/transfers/{t1['id']}/reject",
        headers=headers,
        json={"reason": "User rejected untrusted file."},
    )
    assert rej.status_code == 200
    assert rej.json()["status"] == "rejected"
    assert rej.json()["error_message"] == "User rejected untrusted file."

    # Cancel flow
    t2 = client.post(
        "/api/v1/transfers/",
        headers=headers,
        json={
            "sender_device_id": dev1,
            "receiver_device_id": dev2,
            "file_name": "cancelled_doc.pdf",
            "file_size": 2048,
        },
    ).json()

    cancel = client.post(
        f"/api/v1/transfers/{t2['id']}/cancel",
        headers=headers,
        json={"reason": "Sender aborted transfer."},
    )
    assert cancel.status_code == 200
    assert cancel.json()["status"] == "cancelled"
