"""
NetSync Tier A Network Intelligence Labs API Tests
===================================================
Tests for all 6 Tier A academic labs:
- A1: Life-of-a-Request Tracer
- A2: Congestion Control Observatory (Reno, Cubic, BBR)
- A3: Reliable Transport Lab (Stop-and-Wait, GBN, Selective Repeat)
- A4: Impairment Studio
- A5: DNS Studio (RFC 1035 resolver & cache audit)
- A6: Delay, Loss & Throughput (Nodal delay & Bufferbloat)
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app


@pytest.fixture
def client():
    return TestClient(app)


def test_a1_request_tracer(client):
    res = client.post(
        "/api/v1/lab/tier-a/request-tracer",
        json={
            "url": "https://datatracker.ietf.org/doc/html/rfc9293",
            "client_ip": "192.168.1.105",
            "gateway_ip": "192.168.1.1",
        },
    )
    assert res.status_code == 200
    data = res.json()
    assert data["hostname"] == "datatracker.ietf.org"
    assert len(data["stages"]) == 6
    stage_ids = [s["id"] for s in data["stages"]]
    assert stage_ids == ["dhcp", "arp", "dns", "tcp", "tls", "http"]
    # Verify encapsulation and hex
    for s in data["stages"]:
        assert "encapsulation" in s
        assert "hex_snippet" in s
        assert s["provenance"] in ["simulated", "derived", "measured"]


def test_a2_congestion_simulator(client):
    for algo in ["reno", "cubic", "bbr"]:
        res = client.post(
            "/api/v1/lab/tier-a/congestion-simulator",
            json={
                "algorithm": algo,
                "rtt_ms": 25.0,
                "bandwidth_mbps": 100.0,
                "loss_rate": 0.05,
                "buffer_packets": 40,
                "total_rounds": 30,
            },
        )
        assert res.status_code == 200
        data = res.json()
        assert data["algorithm"] == algo.upper()
        assert len(data["timeline"]) == 30
        assert data["provenance"] == "simulated"
        first_round = data["timeline"][0]
        assert "cwnd" in first_round
        assert "ssthresh" in first_round
        assert "effective_rtt_ms" in first_round


def test_a3_reliable_transport(client):
    for proto in ["stop_and_wait", "go_back_n", "selective_repeat"]:
        res = client.post(
            "/api/v1/lab/tier-a/reliable-transport",
            json={
                "protocol": proto,
                "window_size": 4,
                "total_packets": 10,
                "drop_packets": [2],
                "corrupt_packets": [4] if proto == "stop_and_wait" else [],
            },
        )
        assert res.status_code == 200
        data = res.json()
        assert data["protocol"] == proto.upper()
        assert data["total_transmissions"] >= 10
        assert len(data["events"]) > 0
        assert data["provenance"] == "simulated"


def test_a4_impairment_studio(client):
    res = client.post(
        "/api/v1/lab/tier-a/impairment-studio",
        json={
            "base_rtt_ms": 5.0,
            "added_delay_ms": 50.0,
            "jitter_ms": 10.0,
            "loss_percent": 2.0,
            "bandwidth_cap_mbps": 25.0,
            "file_size_mb": 50.0,
        },
    )
    assert res.status_code == 200
    data = res.json()
    assert data["effective_rtt_ms"] == 55.0
    assert data["achieved_throughput_mbps"] <= 25.0
    assert data["transfer_time_sec"] > 0
    assert data["slowdown_factor"] >= 1.0


def test_a5_dns_studio(client):
    res = client.post(
        "/api/v1/lab/tier-a/dns-studio",
        json={"domain": "netsync.dev"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["domain"] == "netsync.dev"
    assert len(data["hierarchy_steps"]) == 3
    tiers = [s["tier"] for s in data["hierarchy_steps"]]
    assert tiers == ["ROOT_SERVERS", "TLD_SERVERS", "AUTHORITATIVE_SERVERS"]
    assert "security_audit" in data
    assert data["security_audit"]["vulnerable_to_spoofing"] is False


def test_a6_nodal_delay_and_bufferbloat(client):
    res = client.post(
        "/api/v1/lab/tier-a/nodal-delay",
        json={
            "packet_size_bytes": 1500,
            "link_rate_mbps": 100.0,
            "distance_km": 1000.0,
            "propagation_speed_km_s": 200000.0,
            "processing_delay_us": 15.0,
            "current_queue_packets": 20,
            "unloaded_ping_ms": 15.0,
            "loaded_ping_ms": 120.0,
        },
    )
    assert res.status_code == 200
    data = res.json()
    decomp = data["nodal_decomposition_ms"]
    assert decomp["processing_delay"] == 0.015
    assert decomp["transmission_delay"] == 0.12
    assert decomp["propagation_delay"] == 5.0
    assert decomp["queueing_delay"] == 2.4
    assert round(decomp["total_nodal_delay"], 2) == 7.54
    assert data["bufferbloat"]["grade"] == "D"
    assert data["provenance"] == "derived"
