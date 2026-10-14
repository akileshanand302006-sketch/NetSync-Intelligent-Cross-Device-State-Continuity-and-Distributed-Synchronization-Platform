import React from 'react';
import { Network, Laptop, Sparkles, Layers, Clipboard, Activity, QrCode, ShieldCheck } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, onOpenPairModal, peersCount = 5, rtt = '2.8ms' }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Layers },
    { id: 'topology', label: '3D Mesh', icon: Network },
    { id: 'continuity', label: 'Continuity Studio', icon: Laptop },
    { id: 'clipboard', label: 'Universal Clipboard', icon: Clipboard },
    { id: 'telemetry', label: 'CN Telemetry', icon: Activity },
  ];

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      background: 'rgba(6, 9, 19, 0.8)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      padding: '12px 28px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    }}>
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{
          width: '38px',
          height: '38px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #0284c7 0%, #6366f1 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 18px rgba(56, 189, 248, 0.4)',
        }}>
          <Network size={22} color="#ffffff" />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.2rem', fontWeight: 800, letterSpacing: '-0.02em' }} className="text-gradient">
              NetSync
            </span>
            <span className="badge-pill badge-cyan" style={{ fontSize: '0.65rem', padding: '2px 6px' }}>v1.0 CN</span>
          </div>
          <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
            Cross-Device State Continuity & Distributed Sync
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        background: 'rgba(15, 23, 42, 0.6)',
        padding: '4px',
        borderRadius: '12px',
        border: '1px solid rgba(255, 255, 255, 0.06)',
      }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '0.825rem',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                background: isActive ? 'linear-gradient(135deg, rgba(56, 189, 248, 0.15), rgba(99, 102, 241, 0.2))' : 'transparent',
                color: isActive ? '#38bdf8' : '#94a3b8',
                borderBottom: isActive ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid transparent',
                transition: 'all 0.2s ease',
              }}
            >
              <Icon size={16} />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Live Mesh Status & Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          background: 'rgba(15, 23, 42, 0.5)',
          padding: '6px 14px',
          borderRadius: '9999px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          fontSize: '0.75rem',
        }}>
          <span className="pulse-dot"></span>
          <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{peersCount} Peers Mesh</span>
          <span style={{ color: '#475569' }}>•</span>
          <span style={{ color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>{rtt} LAN RTT</span>
        </div>

        <button
          onClick={onOpenPairModal}
          className="btn-primary"
          style={{ padding: '8px 16px', fontSize: '0.8rem' }}
        >
          <QrCode size={15} />
          Pair Device
        </button>
      </div>
    </header>
  );
}
