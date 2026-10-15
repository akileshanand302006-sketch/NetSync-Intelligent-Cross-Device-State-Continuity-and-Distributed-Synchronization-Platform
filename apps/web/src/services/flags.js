/**
 * NetSync Frontend Feature Flag Client
 * =====================================
 * Implements canonical `nsx.<area>.<feature>` flags.
 * Synchronizes with backend `/api/v1/system/flags` and supports local dev overrides.
 */

import { useState, useEffect } from 'react';

const API_FLAGS_URL = 'http://localhost:8000/api/v1/system/flags';

// Baseline fallback flags matching backend DEFAULT_FEATURE_FLAGS
const DEFAULT_CLIENT_FLAGS = {
  // Core Platform (Section 5)
  'nsx.continuity.crdt_sync': false,
  'nsx.continuity.offline_queue': true,
  'nsx.continuity.hlc_ordering': true,
  'nsx.transfer.resume_bitmap': false,
  'nsx.transfer.transfer_forecaster': true,
  'nsx.transfer.coturn_hmac': false,
  'nsx.crypto.e2ee_clipboard': true,
  'nsx.crypto.x25519_sas_pairing': true,
  'nsx.observability.lttb_downsampling': true,
  'nsx.observability.anomaly_detection': false,
  'nsx.realtime.binary_gateway': false,

  // Tier A Academic Labs / Network Intelligence (Section 6)
  'nsx.tier_a.request_tracer': true,
  'nsx.tier_a.congestion_control': true,
  'nsx.tier_a.reliable_transport': true,
  'nsx.tier_a.impairment_studio': true,
  'nsx.tier_a.dns_studio': true,
  'nsx.tier_a.delay_loss_throughput': true,

  // Tier B & C Modules (Disabled)
  'nsx.tier_b.path_observatory': false,
  'nsx.tier_b.routing_lab': false,
  'nsx.tier_b.address_architect': false,
  'nsx.tier_b.link_layer_lab': false,
  'nsx.tier_b.p2p_swarm_dht': false,
  'nsx.tier_b.time_clock_lab': false,
  'nsx.tier_c.router_architecture': false,
  'nsx.tier_c.datacenter_switching': false,

  // Concept Reference Labs (Disabled per user direction)
  'nsx.lab.hangman': false,
  'nsx.lab.hangman_concurrent': false,
  'nsx.lab.quiz_arena': false,
  'nsx.lab.cat1': false,
  'nsx.lab.cat2': false,
};

let cachedFlags = { ...DEFAULT_CLIENT_FLAGS };
let isFetched = false;

export async function fetchFeatureFlags() {
  try {
    const res = await fetch(API_FLAGS_URL);
    if (res.ok) {
      const serverFlags = await res.json();
      cachedFlags = { ...DEFAULT_CLIENT_FLAGS, ...serverFlags };
      isFetched = true;
      return cachedFlags;
    }
  } catch (e) {
    // Graceful offline fallback
  }
  return cachedFlags;
}

export function isFeatureEnabled(flagName) {
  // Check localStorage dev overrides first
  if (typeof window !== 'undefined' && window.localStorage) {
    const override = localStorage.getItem(`override_${flagName}`);
    if (override !== null) {
      return override === 'true';
    }
  }
  return cachedFlags[flagName] ?? DEFAULT_CLIENT_FLAGS[flagName] ?? false;
}

export function useFeatureFlag(flagName) {
  const [enabled, setEnabled] = useState(() => isFeatureEnabled(flagName));

  useEffect(() => {
    if (!isFetched) {
      fetchFeatureFlags().then((flags) => {
        setEnabled(flags[flagName] ?? false);
      });
    }
  }, [flagName]);

  return enabled;
}
