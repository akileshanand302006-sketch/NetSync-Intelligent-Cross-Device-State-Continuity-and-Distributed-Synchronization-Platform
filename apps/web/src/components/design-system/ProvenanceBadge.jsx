import React, { useState } from 'react';
import { ShieldCheck, Activity, Cpu, Database, Info } from 'lucide-react';

/**
 * NetSync Provenance Badge
 * ========================
 * Governed by Non-Negotiable Rule 3 ("Real or labeled"):
 * Every metric, packet, and event must visibly show provenance:
 * - MEASURED: Direct real socket or hardware measurement.
 * - DERIVED: Statistically computed from measurements (e.g. EWMA, variance, formula).
 * - SIMULATED: Generated from sandbox, synthetic model, or host-restricted fallback.
 * - IMPORTED: Golden capture or RFC trace data.
 */

const PROVENANCE_CONFIGS = {
  measured: {
    label: 'MEASURED',
    icon: Activity,
    bg: 'rgba(16, 185, 129, 0.12)',
    border: 'rgba(16, 185, 129, 0.35)',
    color: 'var(--accent-emerald, #10b981)',
    glow: 'rgba(16, 185, 129, 0.2)',
    defaultDetail: 'Empirically measured from active physical or loopback socket.',
  },
  derived: {
    label: 'DERIVED',
    icon: Cpu,
    bg: 'rgba(6, 182, 212, 0.12)',
    border: 'rgba(6, 182, 212, 0.35)',
    color: '#06b6d4',
    glow: 'rgba(6, 182, 212, 0.2)',
    defaultDetail: 'Derived mathematically from live measurements (EWMA, variance, throughput calculation).',
  },
  simulated: {
    label: 'SIMULATED',
    icon: ShieldCheck,
    bg: 'rgba(245, 158, 11, 0.14)',
    border: 'rgba(245, 158, 11, 0.45)',
    color: '#f59e0b',
    glow: 'rgba(245, 158, 11, 0.25)',
    defaultDetail: 'Synthetic simulation model or fallback due to host operating system restrictions.',
  },
  imported: {
    label: 'IMPORTED',
    icon: Database,
    bg: 'rgba(139, 92, 246, 0.12)',
    border: 'rgba(139, 92, 246, 0.35)',
    color: '#a855f7',
    glow: 'rgba(139, 92, 246, 0.2)',
    defaultDetail: 'Imported from standardized PCAP capture or RFC reference specification.',
  },
};

export default function ProvenanceBadge({
  type = 'measured',
  detail,
  size = 'sm',
  showIcon = true,
  style = {},
}) {
  const [showTooltip, setShowTooltip] = useState(false);
  const config = PROVENANCE_CONFIGS[type.toLowerCase()] || PROVENANCE_CONFIGS.simulated;
  const Icon = config.icon;
  const description = detail || config.defaultDetail;

  const isSmall = size === 'sm';

  return (
    <div
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        ...style,
      }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: isSmall ? '3px' : '5px',
          padding: isSmall ? '2px 6px' : '3px 8px',
          borderRadius: '9999px',
          fontSize: isSmall ? '9.5px' : '11px',
          fontWeight: 700,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          background: config.bg,
          border: `1px solid ${config.border}`,
          color: config.color,
          boxShadow: `0 0 10px ${config.glow}`,
          cursor: 'help',
          userSelect: 'none',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          transition: 'all 0.18s ease',
        }}
      >
        {showIcon && <Icon size={isSmall ? 10 : 12} strokeWidth={2.4} />}
        {config.label}
        <Info size={isSmall ? 8 : 10} style={{ opacity: 0.65, marginLeft: '1px' }} />
      </span>

      {/* Hover Glass Tooltip */}
      {showTooltip && (
        <div
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 6px)',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(10, 15, 20, 0.94)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6), 0 0 16px rgba(16, 185, 129, 0.1)',
            borderRadius: '8px',
            padding: '6px 10px',
            fontSize: '11px',
            color: '#f1f5f9',
            whiteSpace: 'nowrap',
            zIndex: 100,
            pointerEvents: 'none',
            lineHeight: 1.35,
          }}
        >
          <div style={{ fontWeight: 600, color: config.color, marginBottom: '2px' }}>
            Data Provenance: {config.label}
          </div>
          <div style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '10.5px' }}>
            {description}
          </div>
        </div>
      )}
    </div>
  );
}
