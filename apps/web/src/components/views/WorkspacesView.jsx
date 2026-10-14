import React, { useState } from 'react';
import { FileCode, Plus, CheckCircle2 } from 'lucide-react';
import SpatialGlassSurface from '../design-system/SpatialGlassSurface';
import LiquidGlassButton from '../design-system/LiquidGlassButton';

export default function WorkspacesView() {
  const [activeWorkspace, setActiveWorkspace] = useState('ws-1');
  const [editorBuffer, setEditorBuffer] = useState(
`// NetSync Core Differential State Synchronization
// Monotonic Revision Ordering — Server Version Authority
export class DeltaEngine {
  constructor(threshold = 0.8) {
    this.threshold = threshold; // Use delta if size < 80% of full snapshot
  }

  computeDelta(oldState, newState) {
    const added = {};
    const modified = {};
    const removed = [];
    // Performs field-level dictionary diffing
    return { added, modified, removed };
  }
}`
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Top Banner */}
      <SpatialGlassSurface style={{ padding: '28px 32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span className="pulse-emerald-dot"></span>
              <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--color-emerald)', textTransform: 'uppercase' }}>
                SPATIAL WORKSPACES
              </span>
            </div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              Layered Multi-Document Workspaces
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Cross-platform editor buffers, cursor coordinates, and split pane layouts synchronized with monotonic revision ordering.
            </p>
          </div>

          <LiquidGlassButton variant="primary" icon={<Plus size={16} />}>
            New Workspace
          </LiquidGlassButton>
        </div>
      </SpatialGlassSurface>

      {/* Editor & Workspaces Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '24px' }}>
        {/* Left: Active Live Document Buffer */}
        <SpatialGlassSurface style={{ padding: '26px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FileCode size={20} color="var(--color-emerald)" />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                delta_engine.ts (Synchronized Draft)
              </h3>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="badge-emerald-pill" style={{ fontSize: '0.65rem' }}>Rev #7</span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>SHA-256: e8b9...c1</span>
            </div>
          </div>

          <textarea
            value={editorBuffer}
            onChange={(e) => setEditorBuffer(e.target.value)}
            style={{
              width: '100%',
              minHeight: '320px',
              background: 'rgba(7, 9, 11, 0.75)',
              border: '1px solid var(--border-metallic)',
              borderRadius: '14px',
              padding: '18px',
              color: 'var(--color-emerald)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.875rem',
              lineHeight: 1.6,
              outline: 'none',
              resize: 'vertical',
            }}
          />

          {/* Telemetry bar below editor */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '12px',
            marginTop: '16px',
            padding: '12px',
            borderRadius: '10px',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-metallic-subtle)',
            fontSize: '0.78rem',
            fontFamily: 'var(--font-mono)',
          }}>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Cursor:</span> <strong style={{ color: 'var(--text-primary)' }}>Ln 12, Col 4</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Delta:</span> <strong style={{ color: 'var(--color-emerald)' }}>32 B (-89%)</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Strategy:</span> <strong style={{ color: 'var(--color-mint)' }}>Field Merge</strong>
            </div>
          </div>
        </SpatialGlassSurface>

        {/* Right: Workspace Metadata & Snapshots */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <SpatialGlassSurface style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px' }}>
              Workspaces In Mesh
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { id: 'ws-1', name: 'Research & Protocol Engineering', tabs: 4, version: 7 },
                { id: 'ws-2', name: 'Network Sockets & Benchmarks', tabs: 2, version: 3 },
                { id: 'ws-3', name: 'UI / UX Spatial Liquid Glass Spec', tabs: 5, version: 12 },
              ].map((ws) => {
                const isSelected = activeWorkspace === ws.id;
                return (
                  <div
                    key={ws.id}
                    onClick={() => setActiveWorkspace(ws.id)}
                    style={{
                      padding: '14px 16px',
                      borderRadius: '12px',
                      background: isSelected ? 'rgba(69, 245, 154, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                      border: isSelected ? '1px solid var(--border-emerald-glow)' : '1px solid var(--border-metallic-subtle)',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem', color: isSelected ? 'var(--color-emerald)' : 'var(--text-primary)' }}>
                        {ws.name}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {ws.tabs} tabs open • Rev #{ws.version}
                      </div>
                    </div>
                    {isSelected && (
                      <span className="badge-emerald-pill" style={{ fontSize: '0.65rem' }}>
                        Active Buffer
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </SpatialGlassSurface>

          <SpatialGlassSurface style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px' }}>
              Revision History
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
              Immutable server-assigned revision snapshots. Revert or branch anytime.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-emerald)' }}>
                <span>Rev #7 (Current)</span>
                <span>Just now</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                <span>Rev #6</span>
                <span>4m ago</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                <span>Rev #5</span>
                <span>12m ago</span>
              </div>
            </div>
          </SpatialGlassSurface>
        </div>
      </div>
    </div>
  );
}
