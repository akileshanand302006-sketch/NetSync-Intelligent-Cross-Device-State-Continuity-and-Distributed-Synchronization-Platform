import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Activity,
  Sliders,
  Play,
  RotateCcw,
  Zap,
  TrendingDown,
  Layers,
  Cpu,
  ShieldAlert,
} from 'lucide-react';
import SpatialGlassSurface from '../design-system/SpatialGlassSurface';
import LiquidGlassButton from '../design-system/LiquidGlassButton';
import ProvenanceBadge from '../design-system/ProvenanceBadge';
import { simulateCongestion } from '../../services/api';

export default function CongestionControlTab() {
  const [algorithm, setAlgorithm] = useState('reno');
  const [rttMs, setRttMs] = useState(30);
  const [bandwidthMbps, setBandwidthMbps] = useState(100);
  const [lossRate, setLossRate] = useState(0.02);
  const [bufferPackets, setBufferPackets] = useState(50);
  const [loading, setLoading] = useState(false);
  const [simResult, setSimResult] = useState(null);

  const runSim = async (algo = algorithm) => {
    setLoading(true);
    const data = await simulateCongestion({
      algorithm: algo,
      rtt_ms: Number(rttMs),
      bandwidth_mbps: Number(bandwidthMbps),
      loss_rate: Number(lossRate),
      buffer_packets: Number(bufferPackets),
      total_rounds: 40,
    });
    if (data) {
      setSimResult(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    runSim();
  }, [algorithm]);

  // Chart Dimensions
  const chartWidth = 720;
  const chartHeight = 220;
  const padding = 30;

  const timeline = simResult?.timeline || [];
  const maxCwnd = Math.max(10, ...timeline.map((d) => Math.max(d.cwnd, d.ssthresh || 0))) * 1.15;

  const pointsCwnd = timeline.map((d, i) => {
    const x = padding + (i / Math.max(1, timeline.length - 1)) * (chartWidth - padding * 2);
    const y = chartHeight - padding - (d.cwnd / maxCwnd) * (chartHeight - padding * 2);
    return `${x},${y}`;
  }).join(' ');

  const pointsSsthresh = timeline.map((d, i) => {
    const x = padding + (i / Math.max(1, timeline.length - 1)) * (chartWidth - padding * 2);
    const y = chartHeight - padding - (d.ssthresh / maxCwnd) * (chartHeight - padding * 2);
    return `${x},${y}`;
  }).join(' ');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header & Controls */}
      <SpatialGlassSurface glow style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span className="status-indicator-dot online" />
              <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--color-accent)' }}>
                TIER A2 • NETWORK INTELLIGENCE LAB
              </span>
              <ProvenanceBadge provenance="simulated" rfc="RFC 5681" tooltip="TCP Reno, Cubic (RFC 8312), and BBR state machine simulator" />
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: 700, margin: '0 0 6px 0', color: 'var(--text-primary)' }}>
              Congestion Control Observatory
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, maxWidth: '640px' }}>
              Observe AIMD additive increase / multiplicative decrease dynamics, Slow Start exponential ramps, and queue-draining responses under packet loss and buffer limits.
            </p>
          </div>

          {/* Algorithm Toggle */}
          <div style={{ display: 'flex', gap: '8px', background: 'rgba(0,0,0,0.3)', padding: '4px', borderRadius: '12px' }}>
            {[
              { id: 'reno', label: 'TCP Reno (AIMD)' },
              { id: 'cubic', label: 'TCP Cubic (RFC 8312)' },
              { id: 'bbr', label: 'Google BBR (Model-based)' },
            ].map((alg) => (
              <button
                key={alg.id}
                onClick={() => setAlgorithm(alg.id)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: algorithm === alg.id ? 'var(--color-accent)' : 'transparent',
                  color: algorithm === alg.id ? '#000' : 'var(--text-secondary)',
                  transition: 'all 0.15s ease',
                }}
              >
                {alg.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sliders Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '16px',
          marginTop: '20px',
          paddingTop: '16px',
          borderTop: '1px solid var(--color-glass-border)',
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Min RTT</span>
              <strong style={{ color: 'var(--text-primary)' }}>{rttMs} ms</strong>
            </div>
            <input
              type="range"
              min="5"
              max="200"
              value={rttMs}
              onChange={(e) => setRttMs(e.target.value)}
              style={{ width: '100%', accentColor: 'var(--color-accent)' }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Bottleneck Bandwidth</span>
              <strong style={{ color: 'var(--text-primary)' }}>{bandwidthMbps} Mbps</strong>
            </div>
            <input
              type="range"
              min="10"
              max="1000"
              step="10"
              value={bandwidthMbps}
              onChange={(e) => setBandwidthMbps(e.target.value)}
              style={{ width: '100%', accentColor: 'var(--color-accent)' }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Random Loss Rate</span>
              <strong style={{ color: 'var(--text-primary)' }}>{(lossRate * 100).toFixed(1)}%</strong>
            </div>
            <input
              type="range"
              min="0"
              max="0.1"
              step="0.005"
              value={lossRate}
              onChange={(e) => setLossRate(e.target.value)}
              style={{ width: '100%', accentColor: 'var(--color-accent)' }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Router Buffer Size</span>
              <strong style={{ color: 'var(--text-primary)' }}>{bufferPackets} pkts</strong>
            </div>
            <input
              type="range"
              min="10"
              max="200"
              value={bufferPackets}
              onChange={(e) => setBufferPackets(e.target.value)}
              style={{ width: '100%', accentColor: 'var(--color-accent)' }}
            />
          </div>
        </div>

        <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
          <LiquidGlassButton variant="primary" onClick={() => runSim()} loading={loading} icon={<Play size={14} />}>
            Re-run Simulation
          </LiquidGlassButton>
        </div>
      </SpatialGlassSurface>

      {/* Real-Time CWND Sawtooth Graph */}
      <SpatialGlassSurface style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Activity size={18} style={{ color: 'var(--color-accent)' }} />
            <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
              CWND Dynamics & Sawtooth Profile ({algorithm.toUpperCase()})
            </span>
          </div>

          <div style={{ display: 'flex', gap: '16px', fontSize: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }} />
              <span style={{ color: 'var(--text-secondary)' }}>Congestion Window (cwnd)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }} />
              <span style={{ color: 'var(--text-secondary)' }}>ssthresh</span>
            </div>
          </div>
        </div>

        {/* SVG Visualization */}
        <div style={{ width: '100%', overflowX: 'auto' }}>
          <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} style={{ width: '100%', maxHeight: '280px' }}>
            {/* Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
              const y = chartHeight - padding - pct * (chartHeight - padding * 2);
              return (
                <g key={idx}>
                  <line
                    x1={padding}
                    y1={y}
                    x2={chartWidth - padding}
                    y2={y}
                    stroke="rgba(255,255,255,0.06)"
                    strokeDasharray="4 4"
                  />
                  <text
                    x={padding - 6}
                    y={y + 4}
                    textAnchor="end"
                    fill="var(--text-muted)"
                    fontSize="10"
                    fontFamily="monospace"
                  >
                    {Math.round(pct * maxCwnd)}
                  </text>
                </g>
              );
            })}

            {/* ssthresh line */}
            {pointsSsthresh && (
              <polyline
                fill="none"
                stroke="#f59e0b"
                strokeWidth="1.5"
                strokeDasharray="3 3"
                points={pointsSsthresh}
              />
            )}

            {/* cwnd curve */}
            {pointsCwnd && (
              <polyline
                fill="none"
                stroke="#10b981"
                strokeWidth="2.5"
                points={pointsCwnd}
              />
            )}

            {/* Loss event markers */}
            {timeline.map((d, i) => {
              if (!d.loss_event) return null;
              const x = padding + (i / Math.max(1, timeline.length - 1)) * (chartWidth - padding * 2);
              const y = chartHeight - padding - (d.cwnd / maxCwnd) * (chartHeight - padding * 2);
              return (
                <circle
                  key={`drop-${i}`}
                  cx={x}
                  cy={y}
                  r="4"
                  fill="#ef4444"
                  stroke="#fff"
                  strokeWidth="1.5"
                />
              );
            })}
          </svg>
        </div>

        {/* BDP and Pipeline Summary */}
        {simResult && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '12px',
            marginTop: '16px',
            paddingTop: '16px',
            borderTop: '1px solid var(--color-glass-border)',
          }}>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Bandwidth-Delay Product (BDP)</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {simResult.bdp_packets} pkts
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Max Pipe Capacity (BDP + Buf)</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-accent)' }}>
                {simResult.pipe_capacity_packets} pkts
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Latest Effective RTT</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {timeline[timeline.length - 1]?.effective_rtt_ms || 30} ms
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Latest State</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#3b82f6' }}>
                {timeline[timeline.length - 1]?.state || 'Congestion Avoidance'}
              </div>
            </div>
          </div>
        )}
      </SpatialGlassSurface>
    </div>
  );
}
