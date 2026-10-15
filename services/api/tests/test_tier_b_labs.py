"""
NetSync Tier B Network Intelligence Labs API Tests
===================================================
Tests for all Tier B modules:
- B1: Path Observatory & BGP Routing
- B2: Dijkstra Link-State & Bellman-Ford count-to-infinity
- B3: VLSM Subnetting & IPv6 EUI-64
- B4: CSMA/CD Exponential Backoff & CSMA/CA RTS/CTS
- B5: Kademlia XOR metric & k-bucket indexing
- B6: RFC 5905 NTP Marzullo Intersection Algorithm
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app


@pytest.fixture
def client():
    return TestClient(app)


def test_b1_as_path(client):
    res = client.get("/api/v1/lab/tier-b/as-path?destination=1.1.1.1")
    assert res.status_code == 200
    data = res.json()
    assert "as_path" in data
    assert len(data["hops"]) == 5
    assert data["provenance"] == "simulated"


def test_b2_dijkstra_and_count_to_infinity(client):
    res_dijkstra = client.get("/api/v1/lab/tier-b/dijkstra?source=A")
    assert res_dijkstra.status_code == 200
    data_d = res_dijkstra.json()
    assert data_d["source"] == "A"
    assert "routing_table" in data_d
    assert data_d["routing_table"]["F"]["cost"] > 0

    res_bf = client.get("/api/v1/lab/tier-b/count-to-infinity")
    assert res_bf.status_code == 200
    data_bf = res_bf.json()
    assert len(data_bf["rounds"]) >= 5


def test_b3_vlsm_and_eui64(client):
    res_vlsm = client.post(
        "/api/v1/lab/tier-b/vlsm",
        json={"network_cidr": "192.168.1.0/24", "subnet_sizes": [50, 20, 10, 2]},
    )
    assert res_vlsm.status_code == 200
    data_v = res_vlsm.json()
    assert len(data_v["subnets"]) == 4
    assert data_v["subnets"][0]["usable_hosts"] >= 50

    res_eui = client.post(
        "/api/v1/lab/tier-b/eui64",
        json={"mac_address": "3A:8F:C2:59:E0:11", "prefix": "2001:db8:acad::"},
    )
    assert res_eui.status_code == 200
    data_e = res_eui.json()
    assert "fffe" in data_e["interface_identifier"].lower() or "ff:fe" in data_e["interface_identifier"].lower()


def test_b4_link_layer(client):
    res_cd = client.get("/api/v1/lab/tier-b/csmacd?collisions=4")
    assert res_cd.status_code == 200
    assert len(res_cd.json()["timeline"]) == 4

    res_ca = client.get("/api/v1/lab/tier-b/csmaca")
    assert res_ca.status_code == 200
    assert res_ca.json()["collision_prevented"] is True


def test_b5_kademlia(client):
    res = client.post(
        "/api/v1/lab/tier-b/kademlia-distance",
        json={"node_a_hex": "A1B2C3", "node_b_hex": "A1B2D5"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["xor_distance_int"] == (0xA1B2C3 ^ 0xA1B2D5)
    assert "k_bucket_index" in data


def test_b6_marzullo_ntp(client):
    res = client.get("/api/v1/lab/tier-b/marzullo-ntp")
    assert res.status_code == 200
    data = res.json()
    assert len(data["true_chimers"]) >= 3
    assert len(data["false_tickers_excluded"]) == 1
    assert "marzullo_intersection_ms" in data
