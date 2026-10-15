"""
Tests for System Capabilities, Feature Flags, and Prometheus Metrics
====================================================================
"""

import os
from fastapi.testclient import TestClient
from app.main import app
from app.core.flags import is_flag_enabled, get_all_feature_flags
from app.core.capabilities import generate_host_capability_matrix
from app.core.metrics import metrics_registry

client = TestClient(app)


def test_system_capabilities_endpoint():
    res = client.get("/api/v1/system/capabilities")
    assert res.status_code == 200
    data = res.json()
    assert "os" in data
    assert "system" in data["os"]
    assert "runtime" in data
    assert "multiplexers" in data["runtime"]
    assert "select" in data["runtime"]["multiplexers"]
    assert "networking" in data
    assert "raw_sockets" in data["networking"]
    assert "provenance_policy" in data


def test_system_flags_endpoints():
    res = client.get("/api/v1/system/flags")
    assert res.status_code == 200
    flags = res.json()
    assert "nsx.tier_a.request_tracer" in flags
    assert "nsx.tier_a.congestion_control" in flags
    assert "nsx.lab.hangman" in flags
    assert flags["nsx.lab.hangman"] is False

    # Check individual flag endpoint
    res_single = client.get("/api/v1/system/flags/nsx.tier_a.request_tracer")
    assert res_single.status_code == 200
    assert res_single.json()["flag"] == "nsx.tier_a.request_tracer"


def test_feature_flag_env_override(monkeypatch):
    monkeypatch.setenv("NSX_TIER_B_PATH_OBSERVATORY", "true")
    assert is_flag_enabled("nsx.tier_b.path_observatory") is True
    all_flags = get_all_feature_flags()
    assert all_flags["nsx.tier_b.path_observatory"] is True


def test_prometheus_metrics_exposition():
    # Make a request to increment counters
    client.get("/health")
    res = client.get("/metrics")
    assert res.status_code == 200
    content = res.text
    assert "netsync_http_requests_total" in content
    assert "netsync_http_request_duration_seconds" in content
