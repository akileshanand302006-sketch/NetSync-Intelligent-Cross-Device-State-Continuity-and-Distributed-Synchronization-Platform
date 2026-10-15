import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Globe,
  Zap,
  Play,
  RotateCcw,
  CheckCircle2,
  TrendingDown,
  Layers,
  Activity,
} from 'lucide-react';
import SpatialGlassSurface from '../design-system/SpatialGlassSurface';
import LiquidGlassButton from '../design-system/LiquidGlassButton';
import ProvenanceBadge from '../design-system/ProvenanceBadge';
import { fetchHttpEvolution } from '../../services/api';

export default function HttpEvolutionTab() {
  const [assetCount, setAssetCount] = useState(50);
  const [rttMs, setRttMs] = useState(40);
  const [lossRate, setLossRate] = useState(2.0);
  const [loading, setLoading] = useState(false);
  const [httpData, setHttpData] = useState(null);

  const runComparison = async () => {
    setLoading(true);
    const data = await fetchHttpEvolution(assetCount, rttMs, lossRate);
    if (data) setHttpData(data);
    setLoading(false);
  };

  useEffect(() => {
    runComparison();
  }, [assetCount, rttMs, lossRate]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <SpatialGlassSurface glow style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span className="status-indicator-dot online" />
              <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--color-accent)' }}>
                TIER C3 • NETWORK INTELLIGENCE LAB
              </span>
              <ProvenanceBadge provenance="derived" rfc="RFC 9114" tooltip="HTTP/1.1 pipeline vs HTTP/2 multiplexing vs HTTP/3 QUIC" />
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: 700, margin: '0 0 6px 0', color: 'var(--text-primary)' }}>
              HTTP Protocol Evolution (HTTP/1.1 vs HTTP/2 vs HTTP/3 QUIC)
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, maxWidth: '640px' }}>
              Compare page load completion under identical latency and packet drop rates across three web generations. Experience the transition from multi-socket HOL blocking to UDP stream independence.
            </p>
          </div>

          <LiquidGlassButton variant="primary" onClick={runComparison} loading={loading} icon={<Play size={14} />}>
            Re-evaluate Load
          </LiquidGlassButton>
        </div>

        {/* Sliders */}
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
              <span style={{ color: 'var(--text-secondary)' }}>Page Assets</span>
              <strong style={{ color: 'var(--text-primary)' }}>{assetCount} files</strong>
            </div>
            <input
              type="range"
              min="10"
              max="150"
              step="5"
              value={assetCount}
              onChange={(e) => setAssetCount(e.target.value)}
              style={{ width: '100%', accentColor: 'var(--color-accent)' }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Server RTT</span>
              <strong style={{ color: 'var(--text-primary)' }}>{rttMs} ms</strong>
            </div>
            <input
              type="range"
              min="10"
              max="200"
              value={rttMs}
              onChange={(e) => setRttMs(e.target.value)}
              style={{ width: '100%', accentColor: 'var(--color-accent)' }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Packet Loss Rate</span>
              <strong style={{ color: '#ef4444' }}>{lossRate}%</strong>
            </div>
            <input
              type="range"
              min="0"
              max="10"
              step="0.5"
              value={lossRate}
              onChange={(e) => setLossRate(e.target.value)}
              style={{ width: '100%', accentColor: '#ef4444' }}
            />
          </div>
        </div>
      </SpatialGlassSurface>

      {/* Protocol Comparison Cards */}
      {httpData && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          {httpData.comparison.map((item, idx) => {
            const isQuic = item.protocol.includes('QUIC');
            return (
              <SpatialGlassSurface
                key={idx}
                glow={isQuic}
                style={{
                  padding: '24px',
                  borderColor: isQuic ? 'var(--color-accent)' : undefined,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: '6px',
                    background: isQuic ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.06)',
                    color: isQuic ? 'var(--color-accent)' : 'var(--text-secondary)',
                  }}>
                    {item.protocol}
                  </span>
                  {isQuic && (
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-accent)' }}>
                      {httpData.speedup_vs_http1}× FASTER
                    </span>
                  )}
                </div>

                <div style={{ fontSize: '28px', fontWeight: 800, color: isQuic ? 'var(--color-accent)' : 'var(--text-primary)', marginBottom: '8px' }}>
                  {item.page_load_ms} <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>ms</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  <div>Transport: <strong style={{ color: 'var(--text-primary)' }}>{item.transport}</strong></div>
                  <div>HOL Blocking: <strong style={{ color: isQuic ? 'var(--color-accent)' : '#ef4444' }}>{item.hol_blocking}</strong></div>
                  <div>Handshake RTT: {item.connection_handshake_rtt} RTT</div>
                </div>
              </SpatialGlassSurface>
            );
          })}
        </div>
      )}
    </div>
  );
}
