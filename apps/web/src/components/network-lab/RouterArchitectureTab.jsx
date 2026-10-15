import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Layers,
  Cpu,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Zap,
} from 'lucide-react';
import SpatialGlassSurface from '../design-system/SpatialGlassSurface';
import LiquidGlassButton from '../design-system/LiquidGlassButton';
import ProvenanceBadge from '../design-system/ProvenanceBadge';
import { fetchRouterArchitecture } from '../../services/api';

export default function RouterArchitectureTab() {
  const [fabricType, setFabricType] = useState('crossbar');
  const [inputPorts, setInputPorts] = useState(4);
  const [enableVoq, setEnableVoq] = useState(false);
  const [loading, setLoading] = useState(false);
  const [routerData, setRouterData] = useState(null);

  const runSim = async (fabric = fabricType, voq = enableVoq) => {
    setLoading(true);
    const data = await fetchRouterArchitecture(fabric, inputPorts, voq);
    if (data) setRouterData(data);
    setLoading(false);
  };

  useEffect(() => {
    runSim();
  }, [fabricType, inputPorts, enableVoq]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <SpatialGlassSurface glow style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span className="status-indicator-dot online" />
              <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--color-accent)' }}>
                TIER C1 • NETWORK INTELLIGENCE LAB
              </span>
              <ProvenanceBadge provenance="derived" rfc="Router Architecture" tooltip="Input queuing, switching fabrics, and Head-of-Line blocking" />
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: 700, margin: '0 0 6px 0', color: 'var(--text-primary)' }}>
              Router Switching Fabric & HOL Blocking
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, maxWidth: '640px' }}>
              Simulate router switching fabrics (Memory, Shared Bus, and Crossbar). Observe Head-of-Line (HOL) blocking capping theoretical throughput at 58.6%, and verify how Virtual Output Queueing (VOQ) restores 99%+ non-blocking line-rate performance.
            </p>
          </div>

          {/* Fabric Switcher */}
          <div style={{ display: 'flex', gap: '8px', background: 'rgba(0,0,0,0.3)', padding: '4px', borderRadius: '12px' }}>
            {['memory', 'bus', 'crossbar'].map((f) => (
              <button
                key={f}
                onClick={() => setFabricType(f)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                  background: fabricType === f ? 'var(--color-accent)' : 'transparent',
                  color: fabricType === f ? '#000' : 'var(--text-secondary)',
                }}
              >
                {f} Fabric
              </button>
            ))}
          </div>
        </div>

        {/* Controls */}
        <div style={{
          display: 'flex',
          gap: '24px',
          alignItems: 'center',
          flexWrap: 'wrap',
          marginTop: '20px',
          paddingTop: '16px',
          borderTop: '1px solid var(--color-glass-border)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Input/Output Ports:</span>
            <input
              type="range"
              min="2"
              max="16"
              value={inputPorts}
              onChange={(e) => setInputPorts(e.target.value)}
              style={{ width: '100px', accentColor: 'var(--color-accent)' }}
            />
            <strong style={{ color: 'var(--text-primary)', fontSize: '13px' }}>{inputPorts}×{inputPorts}</strong>
          </div>

          {fabricType === 'crossbar' && (
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: 'var(--text-primary)' }}>
              <input
                type="checkbox"
                checked={enableVoq}
                onChange={(e) => setEnableVoq(e.target.checked)}
                style={{ accentColor: 'var(--color-accent)' }}
              />
              <span>Enable Virtual Output Queueing (VOQ)</span>
            </label>
          )}

          <div style={{ marginLeft: 'auto' }}>
            <LiquidGlassButton variant="primary" onClick={() => runSim()} loading={loading} icon={<Play size={14} />}>
              Re-simulate
            </LiquidGlassButton>
          </div>
        </div>
      </SpatialGlassSurface>

      {/* Fabric Results Card */}
      {routerData && (
        <SpatialGlassSurface style={{ padding: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '20px' }}>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Throughput Efficiency</div>
              <div style={{
                fontSize: '28px',
                fontWeight: 800,
                color: routerData.theoretical_max_throughput_pct > 80 ? 'var(--color-accent)' : (routerData.hol_blocking_present ? '#ef4444' : '#f59e0b'),
              }}>
                {routerData.theoretical_max_throughput_pct}%
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Head-of-Line (HOL) Blocking</div>
              <div style={{
                fontSize: '18px',
                fontWeight: 700,
                color: routerData.hol_blocking_present ? '#ef4444' : 'var(--color-accent)',
                marginTop: '4px',
              }}>
                {routerData.hol_blocking_present ? 'Active (58.6% Limit)' : 'Eliminated'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Aggregated Switching Capacity</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#3b82f6' }}>
                {routerData.switching_capacity_gbps} <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Gbps</span>
              </div>
            </div>
          </div>

          <div style={{
            padding: '16px',
            borderRadius: '12px',
            background: 'rgba(0,0,0,0.3)',
            border: '1px solid rgba(255,255,255,0.06)',
            fontSize: '12px',
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
          }}>
            <strong style={{ color: 'var(--text-primary)' }}>Architecture Analysis:</strong> {routerData.fabric_description}
          </div>
        </SpatialGlassSurface>
      )}
    </div>
  );
}
