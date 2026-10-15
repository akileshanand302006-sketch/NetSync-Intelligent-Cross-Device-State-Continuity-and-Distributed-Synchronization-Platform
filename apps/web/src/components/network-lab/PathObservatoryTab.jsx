import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Compass,
  Globe,
  Share2,
  ArrowRight,
  Shield,
  Layers,
  Play,
  Server,
  Zap,
} from 'lucide-react';
import SpatialGlassSurface from '../design-system/SpatialGlassSurface';
import LiquidGlassButton from '../design-system/LiquidGlassButton';
import LiquidGlassInput from '../design-system/LiquidGlassInput';
import ProvenanceBadge from '../design-system/ProvenanceBadge';
import { fetchAsPath } from '../../services/api';

export default function PathObservatoryTab() {
  const [destIp, setDestIp] = useState('1.1.1.1');
  const [loading, setLoading] = useState(false);
  const [pathData, setPathData] = useState(null);

  const runTrace = async () => {
    setLoading(true);
    const data = await fetchAsPath(destIp);
    if (data) {
      setPathData(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    runTrace();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header & Query Bar */}
      <SpatialGlassSurface glow style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span className="status-indicator-dot online" />
              <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--color-accent)' }}>
                TIER B1 • NETWORK INTELLIGENCE LAB
              </span>
              <ProvenanceBadge provenance="simulated" rfc="RFC 4271" tooltip="BGP-4 Border Gateway Protocol & Autonomous System traversal" />
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: 700, margin: '0 0 6px 0', color: 'var(--text-primary)' }}>
              Path Observatory & BGP Routing
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, maxWidth: '640px' }}>
              Trace internet AS-level inter-domain routing paths, peering vs transit relationships, BGP attributes (AS_PATH, NEXT_HOP, LOCAL_PREF), and Internet Exchange Point (IXP) interconnects.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div style={{ width: '220px' }}>
              <LiquidGlassInput
                value={destIp}
                onChange={(e) => setDestIp(e.target.value)}
                placeholder="Target IP / Host"
                icon={<Globe size={15} />}
              />
            </div>
            <LiquidGlassButton variant="primary" onClick={runTrace} loading={loading} icon={<Play size={14} />}>
              Trace AS Path
            </LiquidGlassButton>
          </div>
        </div>
      </SpatialGlassSurface>

      {/* AS Hop Sequence */}
      {pathData && (
        <SpatialGlassSurface style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Share2 size={16} style={{ color: 'var(--color-accent)' }} />
              <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Autonomous System Hops ({pathData.hops.length} Network Nodes)
              </span>
            </div>
            <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--color-accent)' }}>
              AS_PATH: {pathData.bgp_attributes.as_path_string}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {pathData.hops.map((hop, idx) => (
              <div
                key={idx}
                style={{
                  padding: '12px 16px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--color-glass-border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: '6px',
                    background: 'rgba(255,255,255,0.06)',
                    color: 'var(--text-secondary)',
                  }}>
                    HOP {hop.hop}
                  </span>
                  <div>
                    <strong style={{ color: 'var(--text-primary)', fontSize: '13px' }}>{hop.as_num}</strong>
                    <span style={{ margin: '0 8px', color: 'var(--text-muted)' }}>•</span>
                    <span style={{ color: 'var(--text-secondary)' }}>{hop.org}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <span style={{
                    fontSize: '10px',
                    textTransform: 'uppercase',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: hop.rel === 'peering' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                    color: hop.rel === 'peering' ? '#3b82f6' : 'var(--color-accent)',
                  }}>
                    {hop.rel}
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', fontWeight: 600 }}>
                    {hop.rtt_ms} ms
                  </span>
                </div>
              </div>
            ))}
          </div>
        </SpatialGlassSurface>
      )}
    </div>
  );
}
