import React from 'react';
import { motion } from 'motion/react';
import { Layers, Laptop, FileText, Activity, Settings } from 'lucide-react';

export default function FloatingGlassDock({
  activeRoute,
  onRouteChange,
}) {
  const dockItems = [
    {
      id: 'overview',
      label: 'Home',
      icon: Layers,
      isActive: activeRoute === 'overview',
    },
    {
      id: 'continuity',
      label: 'Continuity',
      icon: FileText,
      isActive: ['continuity', 'workspaces', 'clipboard', 'file-transfer'].includes(activeRoute),
    },
    {
      id: 'devices',
      label: 'Devices',
      icon: Laptop,
      isActive: ['devices', 'integrations'].includes(activeRoute),
    },
    {
      id: 'telemetry',
      label: 'Network',
      icon: Activity,
      isActive: ['telemetry', 'history'].includes(activeRoute),
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      isActive: activeRoute === 'settings',
    },
  ];

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '16px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 60,
        width: 'calc(100% - 32px)',
        maxWidth: '420px',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <div
        className="spatial-glass-surface"
        style={{
          padding: '6px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          borderRadius: '9999px',
          background: 'var(--color-surface-translucent)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          boxShadow: 'var(--shadow-liquid-glass)',
          border: '1px solid var(--border-metallic)',
        }}
      >
        {dockItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.isActive;

          return (
            <button
              key={item.id}
              onClick={() => onRouteChange(item.id)}
              style={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '3px',
                padding: '6px 14px',
                borderRadius: '12px',
                border: 'none',
                background: 'transparent',
                color: isActive ? 'var(--color-emerald)' : 'var(--text-muted)',
                cursor: 'pointer',
                outline: 'none',
                transition: 'color 0.2s ease',
              }}
              title={item.label}
            >
              {isActive && (
                <motion.div
                  layoutId="dock-active-pill"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: '10px',
                    background: 'var(--color-emerald-dim)',
                    border: '1px solid var(--border-emerald-glow)',
                    zIndex: 0,
                  }}
                  transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                />
              )}
              <span style={{ position: 'relative', zIndex: 1 }}>
                <Icon size={18} color={isActive ? 'var(--color-emerald)' : 'currentColor'} />
              </span>
              <span
                style={{
                  position: 'relative',
                  zIndex: 1,
                  fontSize: '0.66rem',
                  fontWeight: isActive ? 700 : 500,
                  letterSpacing: '0.02em',
                }}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
