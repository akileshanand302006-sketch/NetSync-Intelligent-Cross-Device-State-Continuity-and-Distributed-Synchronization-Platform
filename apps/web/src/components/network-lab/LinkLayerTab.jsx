import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Layers,
  Radio,
  Play,
  RotateCcw,
  Zap,
  ShieldCheck,
  Activity,
  AlertTriangle,
} from 'lucide-react';
import SpatialGlassSurface from '../design-system/SpatialGlassSurface';
import LiquidGlassButton from '../design-system/LiquidGlassButton';
import ProvenanceBadge from '../design-system/ProvenanceBadge';
import { fetchCsmaCd, fetchCsmaCa } from '../../services/api';

export default function LinkLayerTab() {
  const [cdData, setCdData] = useState(null);
  const [caData, setCaData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [collisions, setCollisions] = useState(4);

  const runSim = async () => {
    setLoading(true);
    const [cd, ca] = await Promise.all([
      fetchCsmaCd(collisions),
      fetchCsmaCa(),
    ]);
    if (cd) setCdData(cd);
    if (ca) setCaData(ca);
    setLoading(false);
  };

  useEffect(() => {
    runSim();
  }, [collisions]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <SpatialGlassSurface glow style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span className="status-indicator-dot online" />
              <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--color-accent)' }}>
                TIER B4 • NETWORK INTELLIGENCE LAB
              </span>
              <ProvenanceBadge provenance="simulated" rfc="IEEE 802.3 / 802.11" tooltip="CSMA/CD backoff and CSMA/CA virtual carrier sensing RTS/CTS" />
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: 700, margin: '0 0 6px 0', color: 'var(--text-primary)' }}>
              Link Layer & Multiple Access Protocols
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, maxWidth: '640px' }}>
              Simulate IEEE 802.3 Ethernet Truncated Binary Exponential Backoff under contention collisions, and 802.11 Wi-Fi RTS/CTS NAV handshake solving the Hidden Terminal problem.
            </p>
          </div>

          <LiquidGlassButton variant="primary" onClick={runSim} loading={loading} icon={<Play size={14} />}>
            Run Contention Sim
          </LiquidGlassButton>
        </div>
      </SpatialGlassSurface>

      {/* CSMA/CD Truncated Binary Exponential Backoff */}
      {cdData && (
        <SpatialGlassSurface style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Layers size={18} style={{ color: 'var(--color-accent)' }} />
              <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                CSMA/CD Truncated Binary Exponential Backoff (IEEE 802.3)
              </span>
            </div>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Slot Time: {cdData.slot_time_us} µs
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {cdData.timeline.map((step, idx) => (
              <div
                key={idx}
                style={{
                  padding: '12px 14px',
                  borderRadius: '10px',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--color-glass-border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '12px',
                }}
              >
                <div>
                  <strong style={{ color: '#ef4444' }}>Collision #{step.collision_count}</strong>
                  <span style={{ margin: '0 8px', color: 'var(--text-muted)' }}>•</span>
                  <span>Range R ∈ {step.contention_window_r_range}</span>
                </div>
                <div>
                  Chosen Slot: <strong style={{ color: 'var(--color-accent)' }}>R = {step.chosen_slot_r}</strong>
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', fontWeight: 600 }}>
                  Wait: {step.wait_time_us} µs
                </div>
              </div>
            ))}
          </div>
        </SpatialGlassSurface>
      )}

      {/* 802.11 RTS/CTS Hidden Terminal Handshake */}
      {caData && (
        <SpatialGlassSurface style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <Radio size={18} style={{ color: '#3b82f6' }} />
            <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
              802.11 CSMA/CA RTS/CTS Virtual Carrier Sensing (Hidden Terminal Solution)
            </span>
          </div>

          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
            {caData.scenario}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {caData.handshake_steps.map((st, idx) => (
              <div
                key={idx}
                style={{
                  padding: '10px 14px',
                  borderRadius: '10px',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--color-glass-border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '12px',
                }}
              >
                <div>
                  <strong style={{ color: 'var(--color-accent)' }}>{st.frame}</strong> ({st.src} → {st.dst})
                  <span style={{ margin: '0 8px', color: 'var(--text-muted)' }}>•</span>
                  <span style={{ color: 'var(--text-secondary)' }}>{st.details}</span>
                </div>
                {st.nav_duration_us > 0 && (
                  <span style={{ fontSize: '11px', color: '#f59e0b', fontWeight: 600 }}>
                    NAV: {st.nav_duration_us} µs
                  </span>
                )}
              </div>
            ))}
          </div>
        </SpatialGlassSurface>
      )}
    </div>
  );
}
