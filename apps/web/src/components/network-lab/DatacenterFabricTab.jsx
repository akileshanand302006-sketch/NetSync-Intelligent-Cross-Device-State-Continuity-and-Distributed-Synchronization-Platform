import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Server,
  Layers,
  Play,
  RotateCcw,
  Zap,
  Activity,
  Share2,
} from 'lucide-react';
import SpatialGlassSurface from '../design-system/SpatialGlassSurface';
import LiquidGlassButton from '../design-system/LiquidGlassButton';
import ProvenanceBadge from '../design-system/ProvenanceBadge';
import { fetchDatacenterFabric } from '../../services/api';

export default function DatacenterFabricTab() {
  const [spines, setSpines] = useState(4);
  const [leafs, setLeafs] = useState(8);
  const [servers, setServers] = useState(32);
  const [loading, setLoading] = useState(false);
  const [fabricData, setFabricData] = useState(null);

  const runSim = async () => {
    setLoading(true);
    const data = await fetchDatacenterFabric(spines, leafs, servers);
    if (data) setFabricData(data);
    setLoading(false);
  };

  useEffect(() => {
    runSim();
  }, [spines, leafs, servers]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <SpatialGlassSurface glow style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span className="status-indicator-dot online" />
              <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--color-accent)' }}>
                TIER C2 • NETWORK INTELLIGENCE LAB
              </span>
              <ProvenanceBadge provenance="derived" rfc="Clos Fat-Tree" tooltip="2-Tier Clos Leaf-Spine datacenter fabric & ECMP hashing" />
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: 700, margin: '0 0 6px 0', color: 'var(--text-primary)' }}>
              Datacenter Clos Leaf-Spine & ECMP Fabric
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, maxWidth: '640px' }}>
              Model modern hyperscale datacenter fabrics. Evaluate bisection bandwidth, East-West non-blocking oversubscription ratios, and Equal-Cost Multi-Path (ECMP) 5-tuple flow hashing across spine switches.
            </p>
          </div>

          <LiquidGlassButton variant="primary" onClick={runSim} loading={loading} icon={<Play size={14} />}>
            Recalculate Fabric
          </LiquidGlassButton>
        </div>

        {/* Controls */}
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
              <span style={{ color: 'var(--text-secondary)' }}>Spine Switches</span>
              <strong style={{ color: 'var(--text-primary)' }}>{spines}</strong>
            </div>
            <input
              type="range"
              min="2"
              max="16"
              value={spines}
              onChange={(e) => setSpines(e.target.value)}
              style={{ width: '100%', accentColor: 'var(--color-accent)' }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Leaf Switches</span>
              <strong style={{ color: 'var(--text-primary)' }}>{leafs}</strong>
            </div>
            <input
              type="range"
              min="4"
              max="32"
              value={leafs}
              onChange={(e) => setLeafs(e.target.value)}
              style={{ width: '100%', accentColor: 'var(--color-accent)' }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Hosts per Leaf</span>
              <strong style={{ color: 'var(--text-primary)' }}>{servers}</strong>
            </div>
            <input
              type="range"
              min="8"
              max="64"
              step="8"
              value={servers}
              onChange={(e) => setServers(e.target.value)}
              style={{ width: '100%', accentColor: 'var(--color-accent)' }}
            />
          </div>
        </div>
      </SpatialGlassSurface>

      {/* Fabric Metrics Card */}
      {fabricData && (
        <SpatialGlassSurface style={{ padding: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '20px' }}>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Bisection Bandwidth</div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--color-accent)' }}>
                {fabricData.bisection_bandwidth_tbps} <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Tbps</span>
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Oversubscription Ratio</div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: '#3b82f6' }}>
                {fabricData.oversubscription_ratio}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Total Connected Hosts</div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)' }}>
                {fabricData.total_hosts} <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Nodes</span>
              </div>
            </div>
          </div>

          {/* ECMP Spine Flow Distribution */}
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>
              ECMP 5-Tuple Hash Flow Distribution Across Spines ({fabricData.ecmp_paths} Paths)
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px' }}>
              {fabricData.ecmp_distribution.map((spine, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '12px',
                    borderRadius: '10px',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--color-glass-border)',
                    fontSize: '12px',
                  }}
                >
                  <div style={{ fontWeight: 700, color: 'var(--color-accent)', marginBottom: '4px' }}>
                    {spine.spine_id}
                  </div>
                  <div style={{ color: 'var(--text-secondary)' }}>
                    Traffic Share: <strong>{spine.flows_assigned_pct}%</strong>
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '2px' }}>
                    Link Load: {spine.link_utilization_pct}%
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
