"""
NetSync Feature Flag Management
===============================
Governed by Non-Negotiable Rule 2 & Rule 7:
All new, experimental, or incomplete capabilities must ship behind flags
named according to the canonical pattern: `nsx.<area>.<feature>`.
"""

import os
from typing import Dict


DEFAULT_FEATURE_FLAGS: Dict[str, bool] = {
    # -------------------------------------------------------------
    # Core Platform Features (Section 5)
    # -------------------------------------------------------------
    "nsx.continuity.crdt_sync": False,
    "nsx.continuity.offline_queue": True,
    "nsx.continuity.hlc_ordering": True,
    "nsx.transfer.resume_bitmap": False,
    "nsx.transfer.transfer_forecaster": True,
    "nsx.transfer.coturn_hmac": False,
    "nsx.crypto.e2ee_clipboard": True,
    "nsx.crypto.x25519_sas_pairing": True,
    "nsx.observability.lttb_downsampling": True,
    "nsx.observability.anomaly_detection": False,
    "nsx.realtime.binary_gateway": False,

    # -------------------------------------------------------------
    # Tier A Academic Labs / Network Intelligence (Section 6)
    # -------------------------------------------------------------
    "nsx.tier_a.request_tracer": True,
    "nsx.tier_a.congestion_control": True,
    "nsx.tier_a.reliable_transport": True,
    "nsx.tier_a.impairment_studio": True,
    "nsx.tier_a.dns_studio": True,
    "nsx.tier_a.delay_loss_throughput": True,

    # -------------------------------------------------------------
    # Tier B Network Intelligence Features (Section 6)
    # -------------------------------------------------------------
    "nsx.tier_b.path_observatory": False,
    "nsx.tier_b.routing_lab": False,
    "nsx.tier_b.address_architect": False,
    "nsx.tier_b.link_layer_lab": False,
    "nsx.tier_b.p2p_swarm_dht": False,
    "nsx.tier_b.time_clock_lab": False,

    # -------------------------------------------------------------
    # Tier C Deep Network Features (Section 6)
    # -------------------------------------------------------------
    "nsx.tier_c.router_architecture": False,
    "nsx.tier_c.datacenter_switching": False,
    "nsx.tier_c.email_protocol_lab": False,
    "nsx.tier_c.http_webpage_request": False,
    "nsx.tier_c.mail_lab": False,
    "nsx.tier_c.icmp_network_mgmt": False,

    # -------------------------------------------------------------
    # Concept Reference Labs (Disabled per user direction)
    # -------------------------------------------------------------
    "nsx.lab.hangman": False,
    "nsx.lab.hangman_concurrent": False,
    "nsx.lab.quiz_arena": False,
    "nsx.lab.cat1": False,
    "nsx.lab.cat2": False,
}


def _env_key_for_flag(flag_name: str) -> str:
    """Convert `nsx.area.feature` into `NSX_AREA_FEATURE`."""
    return flag_name.replace(".", "_").upper()


def is_flag_enabled(flag_name: str) -> bool:
    """
    Check if a feature flag is enabled.
    Priority:
    1. Environment variable override (e.g. `NSX_TIER_A_REQUEST_TRACER=true`)
    2. Default feature flag configuration dictionary
    """
    env_var = _env_key_for_flag(flag_name)
    if env_var in os.environ:
        val = os.environ[env_var].strip().lower()
        return val in ("1", "true", "yes", "on")

    return DEFAULT_FEATURE_FLAGS.get(flag_name, False)


def get_all_feature_flags() -> Dict[str, bool]:
    """Retrieve full active feature flag dictionary reflecting environment overrides."""
    active_flags = {}
    for flag_name, default_val in DEFAULT_FEATURE_FLAGS.items():
        env_var = _env_key_for_flag(flag_name)
        if env_var in os.environ:
            val = os.environ[env_var].strip().lower()
            active_flags[flag_name] = val in ("1", "true", "yes", "on")
        else:
            active_flags[flag_name] = default_val
    return active_flags
