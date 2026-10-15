"""
System Diagnostics, Capability Probes & Feature Flags
=====================================================
Exposes host capability matrix, active feature flags, and Prometheus metrics.
"""

from fastapi import APIRouter, Response
from app.core.capabilities import generate_host_capability_matrix
from app.core.flags import get_all_feature_flags, is_flag_enabled
from app.core.metrics import metrics_registry

router = APIRouter()


@router.get("/capabilities", tags=["system"])
def get_system_capabilities():
    """
    Retrieve host operating system and network capability matrix.
    Exposes raw socket permissions, multiplexers, and graceful degradation reasons.
    """
    return generate_host_capability_matrix()


@router.get("/flags", tags=["system"])
def get_system_feature_flags():
    """
    Retrieve full active feature flag dictionary (nsx.<area>.<feature>).
    """
    return get_all_feature_flags()


@router.get("/flags/{flag_name}", tags=["system"])
def check_feature_flag(flag_name: str):
    """
    Query whether a specific feature flag is currently enabled.
    """
    return {"flag": flag_name, "enabled": is_flag_enabled(flag_name)}


@router.get("/metrics", tags=["system"])
def get_prometheus_metrics():
    """
    Expose standard Prometheus / OpenMetrics scrape format.
    """
    return Response(
        content=metrics_registry.generate_openmetrics_text(),
        media_type="text/plain; version=0.0.4",
    )
