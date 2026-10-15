import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Sliders,
  Play,
  RotateCcw,
  Zap,
  TrendingDown,
  Activity,
  AlertTriangle,
  Clock,
  HardDrive,
  Gauge,
} from 'lucide-react';
import SpatialGlassSurface from '../design-system/SpatialGlassSurface';
import LiquidGlassButton from '../design-system/LiquidGlassButton';
import ProvenanceBadge from '../design-system/ProvenanceBadge';
import { calculateImpairmentImpact } from '../../services/api';

export default function ImpairmentStudioTab() {
  const [addedDelayMs, setAddedDelayMs] = useState(60);
  const [jitterMs, setJitterMs] = useState(15);
  const [lossPercent, setLossPercent] = useState(3.5);
  const [bandwidthCapMbps, setBandwidthCapMbps] = useState(25);
  const [fileSizeMb, setFileSizeMb] = useState(100);
  const [loading, setLoading] = useState(false);
  const [impactData, setImpactData] = useState(null);

  const calculate = async () => {
    setLoading(true);
    const data = await calculateImpairmentImpact({
      base_rtt_ms: 4.0,
      added_delay_ms: Number(addedDelayMs),
      jitter_ms: Number(jitterMs),
      loss_percent: Number(lossPercent),
      bandwidth_cap_mbps: Number(bandwidthCapMbps),
      file_size_mb: Number(fileSizeMb),
    });
    if (data) {
      setImpactData(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    calculate();
  }, [addedDelayMs, jitterMs, lossPercent, bandwidthCapMbps, fileSizeMb]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header & Controls */}
      <SpatialGlassSurface glow style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span className="status-indicator-dot online" />
              <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--color-accent)' }}>
                TIER A4 • NETWORK INTELLIGENCE LAB
              </span>
              <ProvenanceBadge provenance="derived" rfc="RFC 2581" tooltip="Link impairment modeling & Mathis throughput formula" />
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: 700, margin: '0 0 6px 0', color: 'var(--text-primary)' }}>
              Impairment Studio & Link Emulator
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, maxWidth: '640px' }}>
              Simulate harsh real-world WAN conditions. Inject deterministic and stochastic delay, Gaussian jitter, packet loss, and token-bucket bandwidth caps.
            </p>
          </div>

          <LiquidGlassButton variant="primary" onClick={calculate} loading={loading} icon={<Play size={14} />}>
            Recalculate Degradation
          </LiquidGlassButton>
        </div>

        {/* Sliders Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px',
          marginTop: '20px',
          paddingTop: '16px',
          borderTop: '1px solid var(--color-glass-border)',
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Added Delay (One-Way)</span>
              <strong style={{ color: 'var(--text-primary)' }}>+{addedDelayMs} ms</strong>
            </div>
            <input
              type="range"
              min="0"
              max="300"
              value={addedDelayMs}
              onChange={(e) => setAddedDelayMs(e.target.value)}
              style={{ width: '100%', accentColor: 'var(--color-accent)' }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Packet Jitter (Variance)</span>
              <strong style={{ color: 'var(--text-primary)' }}>±{jitterMs} ms</strong>
            </div>
            <input
              type="range"
              min="0"
              max="60"
              value={jitterMs}
              onChange={(e) => setJitterMs(e.target.value)}
              style={{ width: '100%', accentColor: 'var(--color-accent)' }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Packet Drop Rate</span>
              <strong style={{ color: '#ef4444' }}>{lossPercent}%</strong>
            </div>
            <input
              type="range"
              min="0"
              max="25"
              step="0.5"
              value={lossPercent}
              onChange={(e) => setLossPercent(e.target.value)}
              style={{ width: '100%', accentColor: '#ef4444' }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Bandwidth Cap</span>
              <strong style={{ color: 'var(--text-primary)' }}>{bandwidthCapMbps} Mbps</strong>
            </div>
            <input
              type="range"
              min="1"
              max="250"
              value={bandwidthCapMbps}
              onChange={(e) => setBandwidthCapMbps(e.target.value)}
              style={{ width: '100%', accentColor: 'var(--color-accent)' }}
            />
          </div>
        </div>
      </SpatialGlassSurface>

      {/* Degradation Impact Cards */}
      {impactData && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
          {/* Effective RTT Card */}
          <SpatialGlassSurface style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <Clock size={16} style={{ color: 'var(--color-accent)' }} />
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Effective Round-Trip Time
              </span>
            </div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>
              {impactData.effective_rtt_ms} <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-muted)' }}>ms</span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Range: {impactData.rtt_range_ms[0]} ms — {impactData.rtt_range_ms[1]} ms (with jitter)
            </div>
          </SpatialGlassSurface>

          {/* Achieved Throughput Card */}
          <SpatialGlassSurface style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <Gauge size={16} style={{ color: '#3b82f6' }} />
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Achieved TCP Throughput
              </span>
            </div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--color-accent)', marginBottom: '4px' }}>
              {impactData.achieved_throughput_mbps} <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-muted)' }}>Mbps</span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Mathis Cap: {impactData.mathis_theoretical_mbps} Mbps (Loss-limited)
            </div>
          </SpatialGlassSurface>

          {/* Transfer Slowdown Card */}
          <SpatialGlassSurface style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <TrendingDown size={16} style={{ color: '#ef4444' }} />
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Transfer Duration (100 MB)
              </span>
            </div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#ef4444', marginBottom: '4px' }}>
              {impactData.transfer_time_sec} <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-muted)' }}>sec</span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              vs {impactData.unimpaired_time_sec}s Gigabit LAN ({impactData.slowdown_factor}× slower)
            </div>
          </SpatialGlassSurface>
        </div>
      )}
    </div>
  );
}
