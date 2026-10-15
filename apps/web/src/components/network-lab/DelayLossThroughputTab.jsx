import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Clock,
  Zap,
  Activity,
  Layers,
  BarChart2,
  TrendingDown,
  ShieldCheck,
  AlertTriangle,
  Play,
} from 'lucide-react';
import SpatialGlassSurface from '../design-system/SpatialGlassSurface';
import LiquidGlassButton from '../design-system/LiquidGlassButton';
import ProvenanceBadge from '../design-system/ProvenanceBadge';
import { calculateNodalDelay } from '../../services/api';

export default function DelayLossThroughputTab() {
  const [packetSize, setPacketSize] = useState(1500);
  const [linkRate, setLinkRate] = useState(100);
  const [distanceKm, setDistanceKm] = useState(500);
  const [queuePackets, setQueuePackets] = useState(25);
  const [unloadedPing, setUnloadedPing] = useState(12);
  const [loadedPing, setLoadedPing] = useState(85);
  const [loading, setLoading] = useState(false);
  const [delayData, setDelayData] = useState(null);

  const calculate = async () => {
    setLoading(true);
    const data = await calculateNodalDelay({
      packet_size_bytes: Number(packetSize),
      link_rate_mbps: Number(linkRate),
      distance_km: Number(distanceKm),
      propagation_speed_km_s: 200000.0,
      processing_delay_us: 10.0,
      current_queue_packets: Number(queuePackets),
      unloaded_ping_ms: Number(unloadedPing),
      loaded_ping_ms: Number(loadedPing),
    });
    if (data) {
      setDelayData(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    calculate();
  }, [packetSize, linkRate, distanceKm, queuePackets, unloadedPing, loadedPing]);

  const decomp = delayData?.nodal_decomposition_ms;
  const bloat = delayData?.bufferbloat;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header & Controls */}
      <SpatialGlassSurface glow style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span className="status-indicator-dot online" />
              <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--color-accent)' }}>
                TIER A6 • NETWORK INTELLIGENCE LAB
              </span>
              <ProvenanceBadge provenance="derived" rfc="RFC 896" tooltip="Nodal delay decomposition & bufferbloat assessment" />
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: 700, margin: '0 0 6px 0', color: 'var(--text-primary)' }}>
              Delay, Loss & Throughput Lab
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, maxWidth: '640px' }}>
              Deconstruct end-to-end packet latency into its four constituent physical components: processing, transmission, propagation, and queueing delays. Detect bufferbloat under load.
            </p>
          </div>

          <LiquidGlassButton variant="primary" onClick={calculate} loading={loading} icon={<Play size={14} />}>
            Recalculate
          </LiquidGlassButton>
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
              <span style={{ color: 'var(--text-secondary)' }}>Packet Size (L)</span>
              <strong style={{ color: 'var(--text-primary)' }}>{packetSize} Bytes</strong>
            </div>
            <input
              type="range"
              min="64"
              max="9000"
              step="64"
              value={packetSize}
              onChange={(e) => setPacketSize(e.target.value)}
              style={{ width: '100%', accentColor: 'var(--color-accent)' }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Link Rate (R)</span>
              <strong style={{ color: 'var(--text-primary)' }}>{linkRate} Mbps</strong>
            </div>
            <input
              type="range"
              min="10"
              max="1000"
              step="10"
              value={linkRate}
              onChange={(e) => setLinkRate(e.target.value)}
              style={{ width: '100%', accentColor: 'var(--color-accent)' }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Fiber Distance (d)</span>
              <strong style={{ color: 'var(--text-primary)' }}>{distanceKm} km</strong>
            </div>
            <input
              type="range"
              min="5"
              max="5000"
              step="50"
              value={distanceKm}
              onChange={(e) => setDistanceKm(e.target.value)}
              style={{ width: '100%', accentColor: 'var(--color-accent)' }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Queue Length (Q)</span>
              <strong style={{ color: 'var(--text-primary)' }}>{queuePackets} pkts</strong>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={queuePackets}
              onChange={(e) => setQueuePackets(e.target.value)}
              style={{ width: '100%', accentColor: 'var(--color-accent)' }}
            />
          </div>
        </div>
      </SpatialGlassSurface>

      {/* Decomposition Breakdown Cards */}
      {decomp && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          {/* Processing Delay */}
          <SpatialGlassSurface style={{ padding: '20px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-accent)', marginBottom: '4px' }}>
              PROCESSING DELAY (d_proc)
            </div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>
              {decomp.processing_delay} <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>ms</span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Router table lookup & error checking
            </div>
          </SpatialGlassSurface>

          {/* Transmission Delay */}
          <SpatialGlassSurface style={{ padding: '20px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#3b82f6', marginBottom: '4px' }}>
              TRANSMISSION DELAY (d_trans = L / R)
            </div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#3b82f6' }}>
              {decomp.transmission_delay} <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>ms</span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Time to push bits onto the wire
            </div>
          </SpatialGlassSurface>

          {/* Propagation Delay */}
          <SpatialGlassSurface style={{ padding: '20px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#8b5cf6', marginBottom: '4px' }}>
              PROPAGATION DELAY (d_prop = d / s)
            </div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#8b5cf6' }}>
              {decomp.propagation_delay} <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>ms</span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Light speed in optical fiber (~200,000 km/s)
            </div>
          </SpatialGlassSurface>

          {/* Queueing Delay */}
          <SpatialGlassSurface style={{ padding: '20px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#f59e0b', marginBottom: '4px' }}>
              QUEUEING DELAY (d_queue)
            </div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#f59e0b' }}>
              {decomp.queueing_delay} <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>ms</span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Buffer waiting time at output port
            </div>
          </SpatialGlassSurface>
        </div>
      )}

      {/* Bufferbloat Grade Card */}
      {bloat && (
        <SpatialGlassSurface style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-accent)' }}>
                  BUFFERBLOAT REPORT CARD
                </span>
                <ProvenanceBadge provenance="derived" rfc="RFC 896" tooltip="Evaluated under loaded vs unloaded saturating conditions" />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 4px 0', color: 'var(--text-primary)' }}>
                {bloat.summary}
              </h3>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Unloaded Ping: {bloat.unloaded_ping_ms} ms • Loaded Ping: {bloat.loaded_ping_ms} ms (+{bloat.latency_increase_ms} ms buffer bloat)
              </div>
            </div>

            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: bloat.grade === 'A+' || bloat.grade === 'A'
                ? 'rgba(16, 185, 129, 0.15)'
                : bloat.grade === 'B' || bloat.grade === 'C'
                ? 'rgba(245, 158, 11, 0.15)'
                : 'rgba(239, 68, 68, 0.15)',
              border: `1px solid ${bloat.grade === 'A+' || bloat.grade === 'A' ? 'var(--color-accent)' : bloat.grade === 'B' || bloat.grade === 'C' ? '#f59e0b' : '#ef4444'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              fontWeight: 800,
              color: bloat.grade === 'A+' || bloat.grade === 'A' ? 'var(--color-accent)' : bloat.grade === 'B' || bloat.grade === 'C' ? '#f59e0b' : '#ef4444',
            }}>
              {bloat.grade}
            </div>
          </div>
        </SpatialGlassSurface>
      )}
    </div>
  );
}
