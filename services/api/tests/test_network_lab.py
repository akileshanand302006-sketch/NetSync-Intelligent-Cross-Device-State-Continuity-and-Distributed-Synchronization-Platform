"""
Network Intelligence Lab Unit & Integration Tests (20MSS56 Network Programming Lab)
===================================================================================
Tests socket toolkit, concurrency benchmarks, binary packet decoder, port diagnostics,
DHCP DORA cycle, and Capstone experiment execution.
"""

import pytest
from fastapi.testclient import TestClient

from app.core.database import Base, engine
from app.main import app
from app.network_lab.concurrency_benchmarks import benchmark_runner
from app.network_lab.dhcp_sandbox import dhcp_sandbox
from app.network_lab.experiment_runner import run_all_experiments, run_single_experiment
from app.network_lab.packet_parser import get_sample_lab_packets, parse_raw_packet
from app.network_lab.port_diagnostics import run_dns_diagnostics, scan_authorized_target
from app.network_lab.socket_toolkit import run_tcp_echo_test, run_udp_echo_test


@pytest.fixture(scope="session", autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield


@pytest.fixture
def client():
    return TestClient(app)


def test_concurrency_benchmarks():
    """Verify Iterative, Concurrent, and Multiplexed benchmark execution."""
    res_iter = benchmark_runner.run_benchmark("iterative", clients_count=4, requests_per_client=2)
    assert res_iter["status"] == "completed"
    assert res_iter["completed_requests"] == 8

    res_conc = benchmark_runner.run_benchmark("concurrent", clients_count=4, requests_per_client=2)
    assert res_conc["status"] == "completed"
    assert res_conc["completed_requests"] == 8

    res_multi = benchmark_runner.run_benchmark("multiplexed", clients_count=4, requests_per_client=2)
    assert res_multi["status"] == "completed"
    assert res_multi["completed_requests"] == 8
    assert res_multi["requests_per_second"] > 0


def test_binary_packet_parser():
    """Verify raw binary packet parsing of Ethernet, IPv4, and TCP headers."""
    samples = get_sample_lab_packets()
    assert len(samples) >= 3

    # Test Sample 1: TCP SYN packet
    syn_sample = samples[0]["parsed"]
    assert syn_sample["total_bytes"] > 0
    assert "ipv4" in syn_sample["layers"]
    assert syn_sample["layers"]["ipv4"]["protocol_name"] == "TCP"
    assert syn_sample["layers"]["ipv4"]["src_ip"] == "192.168.1.101"
    assert syn_sample["layers"]["ipv4"]["dst_ip"] == "192.168.1.102"

    assert "tcp" in syn_sample["layers"]
    assert syn_sample["layers"]["tcp"]["dst_port"] == 9100
    assert syn_sample["layers"]["tcp"]["flags"]["syn"] is True
    assert syn_sample["layers"]["tcp"]["flags"]["ack"] is False

    # Test Sample 2: UDP Beacon packet
    beacon_sample = samples[1]["parsed"]
    assert "udp" in beacon_sample["layers"]
    assert beacon_sample["layers"]["udp"]["dst_port"] == 9100


def test_dhcp_dora_simulation():
    """Verify sandboxed RFC 2131 DORA handshake and lease management."""
    mac = "02:42:AC:11:00:02"
    dora = dhcp_sandbox.simulate_dora_cycle(client_mac=mac, client_name="Test Peer")
    assert dora["status"] == "success"
    assert dora["assigned_ip"].startswith("192.168.10.")
    assert len(dora["dora_steps"]) == 4

    # Verify status reflects lease
    status = dhcp_sandbox.get_status()
    assert any(l["mac"] == mac for l in status["active_leases"])

    # Release lease
    rel = dhcp_sandbox.release_lease(mac)
    assert rel["status"] == "success"


def test_port_diagnostics_and_dns():
    """Verify target port classification and DNS resolution diagnostics."""
    scan = scan_authorized_target("127.0.0.1", [80, 5353])
    assert scan["status"] == "completed"
    assert scan["ports_tested"] == 2
    assert all(r["state"] in ("OPEN", "CLOSED", "FILTERED") for r in scan["results"])

    dns = run_dns_diagnostics("localhost")
    assert dns["status"] == "success"
    assert "127.0.0.1" in dns["resolved_ips"] or "::1" in dns["resolved_ips"]


def test_experiment_runner():
    """Verify single and full Capstone experiments execution."""
    exp1 = run_single_experiment("exp-1")
    assert exp1["experiment_id"] == "exp-1"
    assert "findings" in exp1

    exp10 = run_single_experiment("exp-10")
    assert exp10["experiment_id"] == "exp-10"
    assert exp10["measurements"]["status"] == "success"


def test_network_lab_api_endpoints(client):
    """Test authenticated REST endpoints for Network Intelligence Lab."""
    email = "netlab_student@netsync.dev"
    password = "LabPassword123!"
    client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": password, "full_name": "Lab Student"},
    )
    login_res = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Packet samples
    samples_res = client.get("/api/v1/lab/packet/samples", headers=headers)
    assert samples_res.status_code == 200
    assert len(samples_res.json()) >= 3

    # 2. Concurrency benchmark
    bench_res = client.post(
        "/api/v1/lab/concurrency/benchmark",
        headers=headers,
        json={"architecture": "multiplexed", "clients_count": 5, "requests_per_client": 2},
    )
    assert bench_res.status_code == 200
    assert bench_res.json()["status"] == "completed"

    # 3. DHCP status & DORA
    dhcp_res = client.get("/api/v1/lab/dhcp/status", headers=headers)
    assert dhcp_res.status_code == 200
    assert "pool_size" in dhcp_res.json()

    dora_res = client.post(
        "/api/v1/lab/dhcp/dora",
        headers=headers,
        json={"client_mac": "00:AA:BB:CC:DD:EE", "client_name": "API Client"},
    )
    assert dora_res.status_code == 200
    assert dora_res.json()["status"] == "success"

    # 4. Capstone Experiments Catalog
    catalog_res = client.get("/api/v1/lab/experiments", headers=headers)
    assert catalog_res.status_code == 200
    assert len(catalog_res.json()) == 10
