"""
NetSync Tier C Deep Network Features API Tests
===============================================
Tests for all Tier C modules:
- C1: Router Architecture Simulator (HOL blocking, VOQ, crossbar)
- C2: Datacenter Clos Leaf-Spine Switching Fabric & ECMP
- C3: HTTP Protocol Evolution (HTTP/1.1 vs HTTP/2 vs HTTP/3 QUIC)
- C4: ICMP Echo Diagnostics & Latency Distribution
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app


@pytest.fixture
def client():
    return TestClient(app)


def test_c1_router_architecture(client):
    # Crossbar with HOL blocking
    res_hol = client.get("/api/v1/lab/tier-c/router-architecture?fabric_type=crossbar&enable_voq=false")
    assert res_hol.status_code == 200
    data_hol = res_hol.json()
    assert data_hol["hol_blocking_present"] is True
    assert data_hol["theoretical_max_throughput_pct"] == 58.6

    # Crossbar with VOQ
    res_voq = client.get("/api/v1/lab/tier-c/router-architecture?fabric_type=crossbar&enable_voq=true")
    assert res_voq.status_code == 200
    data_voq = res_voq.json()
    assert data_voq["hol_blocking_present"] is False
    assert data_voq["theoretical_max_throughput_pct"] > 90.0


def test_c2_datacenter_fabric(client):
    res = client.get("/api/v1/lab/tier-c/datacenter-fabric?spines=4&leafs=8&servers=32")
    assert res.status_code == 200
    data = res.json()
    assert data["spine_count"] == 4
    assert data["total_hosts"] == 256
    assert data["bisection_bandwidth_tbps"] > 0
    assert len(data["ecmp_distribution"]) == 4


def test_c3_http_evolution(client):
    res = client.get("/api/v1/lab/tier-c/http-evolution?assets=60&rtt_ms=30.0&loss_rate=1.5")
    assert res.status_code == 200
    data = res.json()
    assert data["fastest_protocol"] == "HTTP/3 QUIC"
    assert len(data["comparison"]) == 3
    # Verify HTTP/3 is faster than HTTP/1.1
    h1 = next(c for c in data["comparison"] if "HTTP/1.1" in c["protocol"])
    h3 = next(c for c in data["comparison"] if "HTTP/3" in c["protocol"])
    assert h1["page_load_ms"] > h3["page_load_ms"]


def test_c4_icmp_diagnostics(client):
    res = client.get("/api/v1/lab/tier-c/icmp-diagnostics?target=1.1.1.1&count=5")
    assert res.status_code == 200
    data = res.json()
    assert data["target"] == "1.1.1.1"
    assert data["packets_transmitted"] == 5
    assert "rtt_statistics_ms" in data
    assert data["rtt_statistics_ms"]["avg"] > 0
