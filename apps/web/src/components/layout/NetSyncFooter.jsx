import React from 'react';
import {
  Network,
  ArrowUp,
  ShieldCheck,
  Layers,
  Laptop,
  FileText,
  Blocks,
  Clipboard,
  Activity,
  History,
  Settings,
  Radio,
  Terminal,
  Globe,
  Smartphone,
  CheckCircle2,
  Lock,
  Cpu,
  HardDrive,
} from 'lucide-react';

export default function NetSyncFooter({
  activeRoute = 'overview',
  onRouteChange,
  onOpenPairModal,
  onOpenCommandPalette,
}) {
  const currentYear = new Date().getFullYear();

  const handleBackToTop = () => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
    });
  };

  const navLinks = [
    { id: 'overview', label: 'Overview', icon: Layers },
    { id: 'devices', label: 'Devices & Mesh', icon: Laptop },
    { id: 'continuity', label: 'Continuity Studio', icon: FileText },
    { id: 'workspaces', label: 'Workspaces', icon: Blocks },
    { id: 'clipboard', label: 'Universal Clipboard', icon: Clipboard },
    { id: 'file-transfer', label: 'P2P File Transfer', icon: HardDrive },
    { id: 'telemetry', label: 'Network Intelligence', icon: Activity },
    { id: 'history', label: 'Sync History', icon: History },
    { id: 'integrations', label: 'Integrations & SDKs', icon: Network },
    { id: 'settings', label: 'Preferences & Trust', icon: Settings },
  ];

  const platformItems = [
    { label: 'Web Application', desc: 'Connected Node • Port 9100', icon: Globe, route: 'overview' },
    { label: 'Mobile Client (Android/iOS)', desc: 'ZeroConf & Direct UDP', icon: Smartphone, route: 'integrations' },
    { label: 'Browser Extension', desc: 'Manifest V3 Tab Handoff', icon: Radio, route: 'integrations' },
    { label: 'FastAPI Socket Core', desc: 'Binary Framing Engine', icon: Terminal, route: 'telemetry' },
  ];

  const securityItems = [
    { label: 'End-to-End Encryption', desc: 'HMAC-SHA256 Signatures', icon: Lock, route: 'settings' },
    { label: 'Monotonic Vector Clocks', desc: 'CRDT Conflict Resolution', icon: Cpu, route: 'history' },
    { label: 'Binary Framing (RFC 9293)', desc: '64-Byte Custom Header', icon: ShieldCheck, route: 'integrations' },
  ];

  return (
    <footer
      style={{
        position: 'relative',
        zIndex: 10,
        marginTop: 'auto',
        width: '100%',
        maxWidth: '1440px',
        margin: '0 auto',
        padding: '0 24px 32px',
        boxSizing: 'border-box',
      }}
    >
      <div
        className="spatial-glass-surface"
        style={{
          padding: '44px 36px 28px',
          borderRadius: '24px',
          boxShadow: 'var(--shadow-liquid-glass)',
          display: 'flex',
          flexDirection: 'column',
          gap: '36px',
        }}
      >
        {/* Main Footer Multi-Column Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.4fr 1.1fr 1.1fr 1fr',
            gap: '36px',
          }}
          className="footer-grid-layout"
        >
          {/* Column 1: Brand & Identity */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div
              onClick={() => onRouteChange && onRouteChange('overview')}
              style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', width: 'fit-content' }}
            >
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '11px',
                  background: 'linear-gradient(135deg, rgba(69, 245, 154, 0.22) 0%, rgba(139, 255, 208, 0.08) 100%)',
                  border: '1px solid rgba(69, 245, 154, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 16px rgba(69, 245, 154, 0.25)',
                }}
              >
                <Network size={22} color="var(--color-emerald)" />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    fontSize: '1.35rem',
                    fontWeight: 800,
                    letterSpacing: '-0.02em',
                    color: 'var(--text-primary)',
                  }}
                >
                  NetSync
                </span>
                <span className="badge-emerald-pill" style={{ fontSize: '0.64rem', padding: '1px 7px' }}>
                  SPATIAL
                </span>
              </div>
            </div>

            <div style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--color-emerald)', letterSpacing: '-0.01em' }}>
              Continue Anywhere. Lose Nothing.
            </div>

            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: '340px' }}>
              Seamlessly continue your digital work across devices with intelligent state synchronization, binary socket framing, and direct LAN peer discovery.
            </p>

            {/* Socket Mesh Status Pill */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                borderRadius: '9999px',
                background: 'rgba(69, 245, 154, 0.08)',
                border: '1px solid rgba(69, 245, 154, 0.25)',
                width: 'fit-content',
                marginTop: '4px',
              }}
            >
              <span className="pulse-emerald-dot" style={{ width: '6px', height: '6px' }}></span>
              <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--color-emerald)' }}>
                Direct P2P LAN Mesh Active • Zero Cloud Latency
              </span>
            </div>
          </div>

          {/* Column 2: Application Navigation (SPA Links) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h4
              style={{
                fontSize: '0.78rem',
                fontWeight: 800,
                color: 'var(--text-muted)',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              Navigation
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 12px' }}>
              {navLinks.map(({ id, label, icon: Icon }) => {
                const isActive = activeRoute === id;
                return (
                  <button
                    key={id}
                    onClick={() => onRouteChange && onRouteChange(id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '7px',
                      background: isActive ? 'rgba(69, 245, 154, 0.1)' : 'transparent',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '5px 8px',
                      color: isActive ? 'var(--color-emerald)' : 'var(--text-secondary)',
                      fontSize: '0.82rem',
                      fontWeight: isActive ? 700 : 500,
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.color = 'var(--text-primary)';
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.color = 'var(--text-secondary)';
                        e.currentTarget.style.background = 'transparent';
                      }
                    }}
                  >
                    <Icon size={14} color={isActive ? 'var(--color-emerald)' : 'currentColor'} />
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Column 3: Platform Nodes & Ecosystem */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h4
              style={{
                fontSize: '0.78rem',
                fontWeight: 800,
                color: 'var(--text-muted)',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              Platform Nodes
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {platformItems.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div
                    key={idx}
                    onClick={() => onRouteChange && onRouteChange(item.route)}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                      padding: '6px 8px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div
                      style={{
                        padding: '5px',
                        borderRadius: '6px',
                        background: 'rgba(255, 255, 255, 0.04)',
                        color: 'var(--color-emerald)',
                        border: '1px solid var(--border-metallic)',
                        marginTop: '2px',
                      }}
                    >
                      <Icon size={13} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {item.label}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {item.desc}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Column 4: Security & Protocols */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h4
              style={{
                fontSize: '0.78rem',
                fontWeight: 800,
                color: 'var(--text-muted)',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              Security & Protocol
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {securityItems.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div
                    key={idx}
                    onClick={() => onRouteChange && onRouteChange(item.route)}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                      padding: '6px 8px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div
                      style={{
                        padding: '5px',
                        borderRadius: '6px',
                        background: 'rgba(255, 255, 255, 0.04)',
                        color: 'var(--color-mint)',
                        border: '1px solid var(--border-metallic)',
                        marginTop: '2px',
                      }}
                    >
                      <Icon size={13} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {item.label}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {item.desc}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Quick Actions trigger */}
              <button
                onClick={onOpenCommandPalette}
                style={{
                  marginTop: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-metallic)',
                  color: 'var(--text-secondary)',
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(69, 245, 154, 0.08)';
                  e.currentTarget.style.borderColor = 'rgba(69, 245, 154, 0.3)';
                  e.currentTarget.style.color = 'var(--color-emerald)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                  e.currentTarget.style.borderColor = 'var(--border-metallic)';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }}
              >
                <span>Command Palette</span>
                <span
                  style={{
                    padding: '1px 6px',
                    borderRadius: '4px',
                    background: 'rgba(0, 0, 0, 0.3)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.7rem',
                    border: '1px solid var(--border-metallic)',
                  }}
                >
                  Cmd+K
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Bar Separator */}
        <div
          style={{
            height: '1px',
            width: '100%',
            background: 'linear-gradient(90deg, transparent 0%, var(--border-metallic-bright) 50%, transparent 100%)',
          }}
        />

        {/* Bottom Bar: Copyright, Statement, and Back to Top */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
            fontSize: '0.78rem',
            color: 'var(--text-muted)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span>&copy; {currentYear} NetSync Platform.</span>
            <span>•</span>
            <span style={{ color: 'var(--text-secondary)' }}>
              Computer Networks Final-Year Capstone Project
            </span>
            <span>•</span>
            <span style={{ color: 'var(--text-muted)' }}>
              Built with Next.js, React Three Fiber & Python Sockets
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              onClick={onOpenPairModal}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary)',
                fontSize: '0.78rem',
                cursor: 'pointer',
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-emerald)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
            >
              Pair Device
            </button>

            <button
              onClick={handleBackToTop}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '9999px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-metallic)',
                color: 'var(--text-secondary)',
                fontSize: '0.76rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(69, 245, 154, 0.12)';
                e.currentTarget.style.borderColor = 'rgba(69, 245, 154, 0.35)';
                e.currentTarget.style.color = 'var(--color-emerald)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                e.currentTarget.style.borderColor = 'var(--border-metallic)';
                e.currentTarget.style.color = 'var(--text-secondary)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
              title="Scroll back to top"
            >
              <span>Back to Top</span>
              <ArrowUp size={13} />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
