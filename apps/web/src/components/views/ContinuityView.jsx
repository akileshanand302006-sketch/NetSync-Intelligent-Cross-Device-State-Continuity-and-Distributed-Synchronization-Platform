import React, { useState } from 'react';
import { Zap, Laptop, Smartphone, Tablet, CheckCircle, RefreshCw, Search } from 'lucide-react';
import SpatialGlassSurface from '../design-system/SpatialGlassSurface';
import LiquidGlassButton from '../design-system/LiquidGlassButton';
import LiquidGlassInput from '../design-system/LiquidGlassInput';

export default function ContinuityView({ onBeamHandoff }) {
  const [activeTabId, setActiveTabId] = useState('tab-1');
  const [selectedTargetDevice, setSelectedTargetDevice] = useState('dev-3');
  const [beaming, setBeaming] = useState(false);
  const [beamSuccess, setBeamSuccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [tabs] = useState([
    { id: 'tab-1', title: 'RFC 9293 — Transmission Control Protocol Specification', url: 'https://datatracker.ietf.org/doc/html/rfc9293', scroll: 48, favicon: '🌐', device: 'Workstation Alpha' },
    { id: 'tab-2', title: 'NetSync Protocol Engine Architecture & Binary Framing', url: 'https://netsync.internal/docs/protocol', scroll: 82, favicon: '⚡', device: 'MacBook Pro M3' },
    { id: 'tab-3', title: 'Distributed Systems & Conflict-Free Replicated Data Types', url: 'https://research.distributed.io/crdt', scroll: 15, favicon: '📑', device: 'Google Pixel 9' },
    { id: 'tab-4', title: 'FastAPI High-Performance Async WebSocket Multiplexing', url: 'https://fastapi.tiangolo.com/advanced/websockets', scroll: 90, favicon: '🚀', device: 'iPad Pro 13"' },
  ]);

  const devices = [
    { id: 'dev-2', name: 'MacBook Pro M3', icon: Laptop, os: 'macOS Sonoma' },
    { id: 'dev-3', name: 'Pixel 9 Pro', icon: Smartphone, os: 'Android 15' },
    { id: 'dev-4', name: 'iPad Pro 13"', icon: Tablet, os: 'iPadOS 18' },
  ];

  const handleBeam = () => {
    setBeaming(true);
    setBeamSuccess(false);
    const activeTab = tabs.find(t => t.id === activeTabId);

    setTimeout(() => {
      setBeaming(false);
      setBeamSuccess(true);
      if (onBeamHandoff) {
        onBeamHandoff({
          tab: activeTab,
          targetDevice: selectedTargetDevice,
          scroll: activeTab?.scroll || 0,
        });
      }
      setTimeout(() => setBeamSuccess(false), 3000);
    }, 700);
  };

  const filteredTabs = tabs.filter(t =>
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.url.toLowerCase().includes(searchQuery.toLowerCase())
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
                CROSS-DEVICE CONTINUITY STUDIO
              </span>
            </div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              Instant Spatial State Handoff
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Continuously track and restore scroll coordinates, open tabs, and draft buffers across devices with zero context loss.
            </p>
          </div>

          <div style={{ width: '280px' }}>
            <LiquidGlassInput
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search active sessions..."
              icon={<Search size={16} />}
            />
          </div>
        </div>
      </SpatialGlassSurface>

      {/* Main Studio Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '24px' }}>
        {/* Left: Active Tab Sessions */}
        <SpatialGlassSurface style={{ padding: '26px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Active Synchronized Tabs ({filteredTabs.length})
            </h3>
            <span className="badge-emerald-pill">Sub-5ms Sync</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredTabs.map((tab) => {
              const isSelected = tab.id === activeTabId;
              return (
                <div
                  key={tab.id}
                  onClick={() => setActiveTabId(tab.id)}
                  style={{
                    background: isSelected ? 'rgba(69, 245, 154, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                    border: isSelected ? '1px solid rgba(69, 245, 154, 0.4)' : '1px solid var(--border-metallic-subtle)',
                    borderRadius: '14px',
                    padding: '14px 18px',
                    cursor: 'pointer',
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '1.2rem' }}>{tab.favicon}</span>
                      <span style={{ fontWeight: 600, fontSize: '0.9rem', color: isSelected ? 'var(--color-emerald)' : 'var(--text-primary)' }}>
                        {tab.title}
                      </span>
                    </div>
                    {isSelected && <span className="badge-emerald-pill" style={{ fontSize: '0.62rem' }}>Selected</span>}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <span style={{ fontFamily: 'var(--font-mono)' }}>{tab.url}</span>
                    <span style={{ color: 'var(--color-emerald)', fontWeight: 600 }}>Scroll: {tab.scroll}%</span>
                  </div>

                  {/* Scroll Bar Visual */}
                  <div style={{ width: '100%', height: '3px', background: 'rgba(255, 255, 255, 0.06)', borderRadius: '2px', marginTop: '10px', overflow: 'hidden' }}>
                    <div style={{ width: `${tab.scroll}%`, height: '100%', background: 'linear-gradient(90deg, #45f59a, #8bffd0)' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </SpatialGlassSurface>

        {/* Right: Beam Handoff Action Panel */}
        <SpatialGlassSurface style={{ padding: '26px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Zap size={20} color="var(--color-emerald)" />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Target Beam Dispatch
              </h3>
            </div>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '24px' }}>
              Transmits binary state frame with exact URL and viewport scroll offset to the target peer via local TCP socket on port 9100.
            </p>

            <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '10px' }}>
              Select Destination Hardware Node:
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
              {devices.map((dev) => {
                const Icon = dev.icon;
                const isTarget = selectedTargetDevice === dev.id;
                return (
                  <div
                    key={dev.id}
                    onClick={() => setSelectedTargetDevice(dev.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      border: isTarget ? '1px solid var(--color-emerald)' : '1px solid var(--border-metallic)',
                      background: isTarget ? 'rgba(69, 245, 154, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                      transition: 'all 0.2s',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Icon size={18} color={isTarget ? 'var(--color-emerald)' : 'var(--text-muted)'} />
                      <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{dev.name}</span>
                    </div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{dev.os}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <LiquidGlassButton
              variant="primary"
              size="lg"
              onClick={handleBeam}
              disabled={beaming}
              icon={beaming ? <RefreshCw size={18} className="animate-spin" /> : beamSuccess ? <CheckCircle size={18} /> : <Zap size={18} />}
              style={{ width: '100%' }}
            >
              {beaming ? 'Transmitting Frame over Socket (:9100)...' : beamSuccess ? 'State Restored on Target Device!' : 'Beam Selected Session'}
            </LiquidGlassButton>
          </div>
        </SpatialGlassSurface>
      </div>
    </div>
  );
}
