import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Activity,
  Play,
  RotateCcw,
  Globe,
  Clock,
  Zap,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import SpatialGlassSurface from '../design-system/SpatialGlassSurface';
import LiquidGlassButton from '../design-system/LiquidGlassButton';
import LiquidGlassInput from '../design-system/LiquidGlassInput';
import ProvenanceBadge from '../design-system/ProvenanceBadge';
import { fetchIcmpDiagnostics } from '../../services/api';

export default function IcmpDiagnosticsTab() {
  const [target, setTarget] = useState('1.1.1.1');
  const [count, setCount] = useState(5);
  const [loading, setLoading] = useState(false);
  const [icmpData, setIcmpData] = useState(null);

  const runPing = async () => {
    setLoading(true);
    const data = await fetchIcmpDiagnostics(target, count);
    if (data) setIcmpData(data);
    setLoading(false);
  };

  useEffect(() => {
    runPing();
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
                TIER C4 • NETWORK INTELLIGENCE LAB
              </span>
              <ProvenanceBadge provenance="simulated" rfc="RFC 792" tooltip="ICMP Echo Request/Reply diagnostics and mdev variance" />
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: 700, margin: '0 0 6px 0', color: 'var(--text-primary)' }}>
              ICMP Network Diagnostics & Latency Engine
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, maxWidth: '640px' }}>
              Measure network round-trip latency statistics (min, avg, max, and mdev mean deviation) using RFC 792 ICMP Echo control messages.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div style={{ width: '180px' }}>
              <LiquidGlassInput
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder="Target Host / IP"
                icon={<Globe size={15} />}
              />
            </div>
            <LiquidGlassButton variant="primary" onClick={runPing} loading={loading} icon={<Play size={14} />}>
              Send ICMP Burst
            </LiquidGlassButton>
          </div>
        </div>
      </SpatialGlassSurface>

      {/* Latency Stats Cards */}
      {icmpData && (
        <SpatialGlassSurface style={{ padding: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '20px' }}>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Min Latency</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>
                {icmpData.rtt_statistics_ms.min} <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>ms</span>
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Average Latency</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-accent)' }}>
                {icmpData.rtt_statistics_ms.avg} <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>ms</span>
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Max Latency</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>
                {icmpData.rtt_statistics_ms.max} <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>ms</span>
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Mean Deviation (mdev)</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#3b82f6' }}>
                {icmpData.rtt_statistics_ms.mdev} <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>ms</span>
              </div>
            </div>
          </div>

          {/* Sample Probes */}
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px' }}>
              ICMP Sequence Log ({icmpData.sample_probes.length} Echo Replies)
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {icmpData.sample_probes.map((pr, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--color-glass-border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '12px',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  <div>
                    64 bytes from {icmpData.target}: icmp_seq={pr.seq} ttl={pr.ttl}
                  </div>
                  <div style={{ color: 'var(--color-accent)', fontWeight: 700 }}>
                    time={pr.time_ms} ms
                  </div>
                </div>
              ))}
            </div>
          </div>
        </SpatialGlassSurface>
      )}
    </div>
  );
}
