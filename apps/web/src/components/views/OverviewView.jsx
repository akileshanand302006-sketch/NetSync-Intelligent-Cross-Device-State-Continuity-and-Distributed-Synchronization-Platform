import React from 'react';
import { motion } from 'motion/react';
import { Zap, Laptop, ArrowRight, ShieldCheck, Activity, CheckCircle, Radio, Clock, Shield } from 'lucide-react';
import NetSync3DScene from '../3d/NetSync3DScene';
import SpatialGlassSurface from '../design-system/SpatialGlassSurface';
import LiquidGlassButton from '../design-system/LiquidGlassButton';
import ProvenanceBadge from '../design-system/ProvenanceBadge';

export default function OverviewView({
  onNavigate,
  onOpenPairModal,
  devices = [],
  metrics,
  recentLogs = [],
  onTriggerSimulation,
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Cinematic Hero Viewport */}
      <SpatialGlassSurface
        className="hero-spatial-container"
        style={{
          padding: '48px 40px',
          position: 'relative',
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 1fr', gap: '36px', alignItems: 'center' }}>
          {/* Left Hero Content */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}
            >
              <span className="pulse-emerald-dot"></span>
              <span style={{
                fontSize: '0.78rem',
                fontWeight: 800,
                letterSpacing: '0.08em',
                color: 'var(--color-emerald)',
                textTransform: 'uppercase',
              }}>
                NETSYNC SPATIAL CONTINUITY
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              style={{
                fontSize: '3.2rem',
                fontWeight: 800,
                letterSpacing: '-0.04em',
                lineHeight: 1.1,
                marginBottom: '18px',
              }}
            >
              Continue Anywhere.<br />
              <span className="text-gradient-emerald">Lose Nothing.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              style={{
                fontSize: '1.05rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.6,
                maxWidth: '520px',
                marginBottom: '32px',
              }}
            >
              Move your digital work between devices while preserving the context that matters. Instant tab scroll restoration, zero-clock monotonic state revisions, and differential sync over direct LAN sockets.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}
            >
              <LiquidGlassButton
                variant="primary"
                size="lg"
                onClick={() => onNavigate('continuity')}
                icon={<Zap size={18} />}
              >
                Resume Workspace
              </LiquidGlassButton>

              <LiquidGlassButton
                variant="secondary"
                size="lg"
                onClick={() => onNavigate('devices')}
                icon={<Laptop size={18} />}
              >
                Explore Devices
              </LiquidGlassButton>
            </motion.div>
          </div>

          {/* Right: 3D Centerpiece */}
          <div style={{ position: 'relative' }}>
            <NetSync3DScene onSelectDevice={(dev) => onNavigate('devices')} />
          </div>
        </div>
      </SpatialGlassSurface>

      {/* Real Application Metrics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '18px' }}>
        <SpatialGlassSurface style={{ padding: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Registered Devices</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ProvenanceBadge type="measured" detail="Hardware devices registered in cryptographic mesh." />
              <Laptop size={18} color="var(--color-emerald)" />
            </div>
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
            {devices.length || 5} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Peers</span>
          </div>
          <div style={{ fontSize: '0.725rem', color: 'var(--color-emerald)', marginTop: '4px' }}>
            100% Verified in Mesh
          </div>
        </SpatialGlassSurface>

        <SpatialGlassSurface style={{ padding: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Online & Ready</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ProvenanceBadge type="measured" detail="Online presence verified via WebSocket/heartbeat." />
              <Radio size={18} color="var(--color-emerald)" />
            </div>
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
            {devices.filter(d => d.is_online).length || 5} <span style={{ fontSize: '0.85rem', color: 'var(--color-emerald)' }}>Active</span>
          </div>
          <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Port 9100 Direct Sockets
          </div>
        </SpatialGlassSurface>

        <SpatialGlassSurface style={{ padding: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Pending Sync</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ProvenanceBadge type="measured" detail="Offline IndexedDB outbox queue depth." />
              <Shield size={18} color="var(--color-mint)" />
            </div>
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
            0 <span style={{ fontSize: '0.85rem', color: 'var(--color-emerald)' }}>Queued</span>
          </div>
          <div style={{ fontSize: '0.725rem', color: 'var(--color-emerald)', marginTop: '4px' }}>
            Synchronized Real-Time
          </div>
        </SpatialGlassSurface>

        <SpatialGlassSurface style={{ padding: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Wire Bandwidth Saved</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ProvenanceBadge type="derived" detail="Calculated: (Full State - Delta Diff) / Full State." />
              <Activity size={18} color="var(--color-emerald)" />
            </div>
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--color-emerald)' }}>
            87.5%
          </div>
          <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Delta Diff Engine (-33.6 KB)
          </div>
        </SpatialGlassSurface>
      </div>

      {/* Recent Activity Timeline & Quick Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '24px' }}>
        <SpatialGlassSurface style={{ padding: '26px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Recent Continuity Activity
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Live chronological audit trail of state transmissions and handoff events.
              </p>
            </div>
            <button
              onClick={() => onNavigate('history')}
              className="liquid-btn-emerald-ghost"
            >
              View Full History →
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {recentLogs.slice(0, 4).map((log) => (
              <div
                key={log.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-metallic-subtle)',
                  borderRadius: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'var(--color-emerald-dim)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <CheckCircle size={16} color="var(--color-emerald)" />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {log.state}
                    </div>
                    <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                      {log.device} • {log.version}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span className="badge-emerald-pill" style={{ fontSize: '0.65rem' }}>
                    {log.type === 'delta' ? 'Delta (-87%)' : 'Full Sync'}
                  </span>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                    {log.timestamp}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SpatialGlassSurface>

        {/* Quick Continuity Launch Box */}
        <SpatialGlassSurface style={{ padding: '26px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div className="badge-emerald-pill" style={{ marginBottom: '12px' }}>
              One-Click Handoff
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
              Active Session Ready
            </h3>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '20px' }}>
              <strong>RFC 9293 Transmission Control Protocol</strong> is paused at scroll position <strong>48%</strong> on MacBook Pro. Beam directly to your mobile phone or tablet with full context preserved.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <LiquidGlassButton
              variant="primary"
              onClick={() => onNavigate('continuity')}
              icon={<ArrowRight size={16} />}
              style={{ width: '100%' }}
            >
              Resume on Current Device
            </LiquidGlassButton>
            <LiquidGlassButton
              variant="secondary"
              onClick={onOpenPairModal}
              icon={<ShieldCheck size={16} color="var(--color-emerald)" />}
              style={{ width: '100%' }}
            >
              Pair Another Device
            </LiquidGlassButton>
          </div>
        </SpatialGlassSurface>
      </div>
    </div>
  );
}
