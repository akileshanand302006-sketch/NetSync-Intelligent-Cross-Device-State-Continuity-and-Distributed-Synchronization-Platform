import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Clock,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ShieldCheck,
  Server,
} from 'lucide-react';
import SpatialGlassSurface from '../design-system/SpatialGlassSurface';
import LiquidGlassButton from '../design-system/LiquidGlassButton';
import ProvenanceBadge from '../design-system/ProvenanceBadge';
import { fetchMarzulloNtp } from '../../services/api';

export default function TimeClockSyncTab() {
  const [ntpData, setNtpData] = useState(null);
  const [loading, setLoading] = useState(false);

  const runMarzullo = async () => {
    setLoading(true);
    const data = await fetchMarzulloNtp();
    if (data) setNtpData(data);
    setLoading(false);
  };

  useEffect(() => {
    runMarzullo();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <SpatialGlassSurface glow style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span className="status-indicator-dot online" />
              <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--color-accent)' }}>
                TIER B6 • NETWORK INTELLIGENCE LAB
              </span>
              <ProvenanceBadge provenance="derived" rfc="RFC 5905" tooltip="NTPv4 Marzullo intersection algorithm & false ticker pruning" />
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: 700, margin: '0 0 6px 0', color: 'var(--text-primary)' }}>
              Time & Clock Synchronization Lab
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, maxWidth: '640px' }}>
              Simulate RFC 5905 Network Time Protocol (NTPv4) clock intersection filtering. Observe Marzullo's algorithm identify true chimers and discard rogue false-ticker servers.
            </p>
          </div>

          <LiquidGlassButton variant="primary" onClick={runMarzullo} loading={loading} icon={<Play size={14} />}>
            Filter Clocks
          </LiquidGlassButton>
        </div>
      </SpatialGlassSurface>

      {/* NTP Results */}
      {ntpData && (
        <SpatialGlassSurface style={{ padding: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '20px' }}>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Synchronized Offset</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-accent)' }}>
                {ntpData.synchronized_clock_offset_ms} <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>ms</span>
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Intersection Interval</div>
              <div style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                [{ntpData.marzullo_intersection_ms[0]}, {ntpData.marzullo_intersection_ms[1]}] ms
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>True Chimers Accepted</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#10b981' }}>
                {ntpData.true_chimers.length} Servers
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {/* Accepted True Chimers */}
            <div style={{
              padding: '16px',
              borderRadius: '12px',
              background: 'rgba(16, 185, 129, 0.05)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700, color: 'var(--color-accent)', marginBottom: '8px' }}>
                <CheckCircle2 size={16} />
                <span>Accepted True Chimers</span>
              </div>
              <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {ntpData.true_chimers.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>

            {/* Discarded False Tickers */}
            <div style={{
              padding: '16px',
              borderRadius: '12px',
              background: 'rgba(239, 68, 68, 0.05)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700, color: '#ef4444', marginBottom: '8px' }}>
                <AlertTriangle size={16} />
                <span>Pruned False Tickers (Excluded)</span>
              </div>
              <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {ntpData.false_tickers_excluded.map((s, i) => (
                  <li key={i}>{s} (Dispersion outlier)</li>
                ))}
              </ul>
            </div>
          </div>
        </SpatialGlassSurface>
      )}
    </div>
  );
}
