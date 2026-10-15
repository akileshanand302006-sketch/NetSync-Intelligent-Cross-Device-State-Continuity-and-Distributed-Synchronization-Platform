import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Check, ArrowRight, GitMerge, RotateCcw, X, ShieldAlert } from 'lucide-react';
import SpatialGlassSurface from '../design-system/SpatialGlassSurface';
import LiquidGlassButton from '../design-system/LiquidGlassButton';
import ProvenanceBadge from '../design-system/ProvenanceBadge';

/**
 * NetSync Conflict Inspector Modal
 * ================================
 * Governed by Section 5.1 & ADR 0004:
 * Interactive conflict resolution showing both versions when a concurrent edit diverges.
 */

export default function ConflictInspectorModal({
  isOpen,
  conflictData,
  onResolve,
  onClose,
}) {
  if (!isOpen || !conflictData) return null;

  const localState = conflictData.mutation?.diff || {
    title: 'Distributed Systems & CRDTs (Local Draft)',
    scroll: 82,
    cursor: { line: 124, col: 12 },
  };

  const serverState = conflictData.serverState || {
    title: 'Distributed Systems & CRDTs (Remote Edit)',
    scroll: 45,
    cursor: { line: 88, col: 4 },
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 120,
      background: 'rgba(7, 9, 11, 0.85)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 15 }}
        transition={{ duration: 0.2 }}
        style={{ width: '100%', maxWidth: '780px' }}
      >
        <SpatialGlassSurface
          glow
          style={{
            padding: '32px',
            position: 'relative',
            border: '1px solid rgba(245, 158, 11, 0.4)',
            boxShadow: '0 24px 64px rgba(0, 0, 0, 0.7), 0 0 32px rgba(245, 158, 11, 0.2)',
          }}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px',
            }}
          >
            <X size={20} />
          </button>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'rgba(245, 158, 11, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#f59e0b',
            }}>
              <ShieldAlert size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  State Synchronization Conflict Detected
                </h3>
                <ProvenanceBadge
                  type="derived"
                  detail="Vector clock divergence detected during offline delta replay"
                  size="sm"
                />
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                Another peer device committed a revision while your offline mutations were queued.
              </p>
            </div>
          </div>

          {/* Side-by-Side Version Diff */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', margin: '22px 0' }}>
            {/* Local Version */}
            <div style={{
              background: 'rgba(7, 9, 11, 0.75)',
              border: '1px solid var(--border-emerald-glow)',
              borderRadius: '14px',
              padding: '18px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-emerald)' }}>
                  YOUR LOCAL VERSION (Uncommitted)
                </span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>HLC: +1</span>
              </div>
              <pre style={{
                fontSize: '0.78rem',
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-primary)',
                background: 'rgba(0,0,0,0.3)',
                padding: '12px',
                borderRadius: '8px',
                overflowX: 'auto',
                lineHeight: 1.4,
              }}>
                {JSON.stringify(localState, null, 2)}
              </pre>
            </div>

            {/* Server Authoritative Version */}
            <div style={{
              background: 'rgba(7, 9, 11, 0.75)',
              border: '1px solid rgba(6, 182, 212, 0.4)',
              borderRadius: '14px',
              padding: '18px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#06b6d4' }}>
                  SERVER AUTHORITATIVE (Rev #{conflictData.serverVersion || 7})
                </span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Committed</span>
              </div>
              <pre style={{
                fontSize: '0.78rem',
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-primary)',
                background: 'rgba(0,0,0,0.3)',
                padding: '12px',
                borderRadius: '8px',
                overflowX: 'auto',
                lineHeight: 1.4,
              }}>
                {JSON.stringify(serverState, null, 2)}
              </pre>
            </div>
          </div>

          {/* Resolution Actions */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            <LiquidGlassButton
              variant="secondary"
              onClick={() => onResolve('server_wins')}
              icon={<RotateCcw size={15} />}
            >
              Accept Server Version (Rollback)
            </LiquidGlassButton>

            <LiquidGlassButton
              variant="secondary"
              onClick={() => onResolve('client_wins')}
              icon={<ArrowRight size={15} />}
            >
              Keep My Local Version
            </LiquidGlassButton>

            <LiquidGlassButton
              variant="primary"
              onClick={() => onResolve('field_merge')}
              icon={<GitMerge size={15} />}
            >
              Automatic Field-Level Merge
            </LiquidGlassButton>
          </div>
        </SpatialGlassSurface>
      </motion.div>
    </div>
  );
}
