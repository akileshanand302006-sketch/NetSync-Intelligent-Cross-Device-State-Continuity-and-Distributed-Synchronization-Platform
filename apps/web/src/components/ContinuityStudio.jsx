import React, { useState } from 'react';
import { Globe, ArrowRight, Laptop, Smartphone, Tablet, Monitor, CheckCircle, Zap, RefreshCw, FileText } from 'lucide-react';

export default function ContinuityStudio({ onBeamHandoff, onUpdateWorkspace }) {
  const [activeTabId, setActiveTabId] = useState('tab-1');
  const [selectedTargetDevice, setSelectedTargetDevice] = useState('dev-3');
  const [beaming, setBeaming] = useState(false);
  const [beamSuccess, setBeamSuccess] = useState(false);

  const [tabs, setTabs] = useState([
    { id: 'tab-1', title: 'RFC 9293 — Transmission Control Protocol Specification', url: 'https://datatracker.ietf.org/doc/html/rfc9293', scroll: 48, favicon: '🌐' },
    { id: 'tab-2', title: 'NetSync Protocol Engine Architecture & Binary Framing', url: 'https://netsync.internal/docs/protocol', scroll: 82, favicon: '⚡' },
    { id: 'tab-3', title: 'Distributed Systems & Conflict-Free Replicated Data Types', url: 'https://research.distributed.io/crdt', scroll: 15, favicon: '📑' },
    { id: 'tab-4', title: 'FastAPI High-Performance Async WebSocket Multiplexing', url: 'https://fastapi.tiangolo.com/advanced/websockets', scroll: 90, favicon: '🚀' },
  ]);

  const [documentContent, setDocumentContent] = useState(
`// NetSync State Synchronization Kernel
// Monotonic Revision Ordering & Field-Level Delta Application
const syncState = {
  session_id: "8f7e2a91-4d3b-41c0-b18a",
  base_version: 4,
  target_version: 5,
  strategy: "field_merge",
  transfer_mode: "delta_compressed"
};`
  );

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
      setTimeout(() => setBeamSuccess(false), 3500);
    }, 600);
  };

  const handleAddTab = () => {
    const newId = `tab-${tabs.length + 1}`;
    const newTab = {
      id: newId,
      title: 'New Synchronized Tab Session',
      url: 'https://netsync.dev/session/new',
      scroll: 0,
      favicon: '✨',
    };
    const updated = [...tabs, newTab];
    setTabs(updated);
    setActiveTabId(newId);
    if (onUpdateWorkspace) onUpdateWorkspace(updated);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
      {/* Left: Active Tabs & Browser Continuity */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc', marginBottom: '4px' }}>
              Active Synchronized Tabs
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
              Real-time scroll coordinates and URL state mirror across your devices.
            </p>
          </div>
          <button onClick={handleAddTab} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.78rem' }}>
            + Add Tab
          </button>
        </div>

        {/* Tab list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
          {tabs.map((tab) => {
            const isSelected = tab.id === activeTabId;
            return (
              <div
                key={tab.id}
                onClick={() => setActiveTabId(tab.id)}
                style={{
                  background: isSelected ? 'rgba(56, 189, 248, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                  border: isSelected ? '1px solid rgba(56, 189, 248, 0.35)' : '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                    <span style={{ fontSize: '1.1rem' }}>{tab.favicon}</span>
                    <span style={{ fontWeight: 600, fontSize: '0.875rem', color: isSelected ? '#38bdf8' : '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {tab.title}
                    </span>
                  </div>
                  {isSelected && (
                    <span className="badge-pill badge-cyan" style={{ fontSize: '0.65rem' }}>Active Tab</span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '300px' }}>
                    {tab.url}
                  </span>
                  <span style={{ color: '#94a3b8', fontWeight: 600 }}>
                    Scroll: {tab.scroll}%
                  </span>
                </div>

                {/* Scroll Position Indicator Bar */}
                <div style={{ width: '100%', height: '3px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', marginTop: '8px', overflow: 'hidden' }}>
                  <div style={{ width: `${tab.scroll}%`, height: '100%', background: 'linear-gradient(90deg, #38bdf8, #818cf8)' }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Handoff Beam Action Box */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.8), rgba(30, 41, 59, 0.6))',
          borderRadius: '14px',
          padding: '18px',
          border: '1px solid rgba(99, 102, 241, 0.25)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Zap size={18} color="#38bdf8" />
              <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#f8fafc' }}>
                Instant State Handoff Beam
              </span>
            </div>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              Zero-latency direct socket dispatch
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Target Device:</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              {devices.map((dev) => {
                const Icon = dev.icon;
                const isTarget = selectedTargetDevice === dev.id;
                return (
                  <button
                    key={dev.id}
                    onClick={() => setSelectedTargetDevice(dev.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: isTarget ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.08)',
                      background: isTarget ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255,255,255,0.03)',
                      color: isTarget ? '#38bdf8' : '#94a3b8',
                    }}
                  >
                    <Icon size={14} />
                    {dev.name}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            onClick={handleBeam}
            disabled={beaming}
            className="btn-primary"
            style={{ width: '100%', padding: '12px' }}
          >
            {beaming ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                Transmitting State Frame over TCP (Port 9100)...
              </>
            ) : beamSuccess ? (
              <>
                <CheckCircle size={16} color="#34d399" />
                Handoff Delivered in 1.4ms! Scroll & Tab Restored.
              </>
            ) : (
              <>
                <ArrowRight size={16} />
                Beam Selected Tab to Target Peer
              </>
            )}
          </button>
        </div>
      </div>

      {/* Right: Live Shared Buffer & Cursor Coordinates */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={18} color="#818cf8" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc' }}>
              Shared State Buffer
            </h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="badge-pill badge-emerald">Synced</span>
            <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: '#94a3b8' }}>
              Rev #5 (SHA256: 4a9f...c2)
            </span>
          </div>
        </div>

        <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '14px' }}>
          Continuous delta diffing is active. Edits generate binary delta payloads automatically.
        </p>

        <textarea
          value={documentContent}
          onChange={(e) => setDocumentContent(e.target.value)}
          style={{
            flex: 1,
            width: '100%',
            minHeight: '260px',
            background: 'rgba(6, 9, 19, 0.7)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '16px',
            color: '#38bdf8',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.85rem',
            lineHeight: 1.6,
            resize: 'none',
            outline: 'none',
          }}
        />

        {/* Live Cursor & Delta Metrics */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '12px',
          marginTop: '16px',
          padding: '12px',
          borderRadius: '10px',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
        }}>
          <div>
            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Cursor Offset</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#e2e8f0', fontFamily: 'var(--font-mono)' }}>Ln 8, Col 24</div>
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Delta Size</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#34d399', fontFamily: 'var(--font-mono)' }}>48 Bytes (-84%)</div>
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Engine Protocol</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#818cf8', fontFamily: 'var(--font-mono)' }}>Binary Framed</div>
          </div>
        </div>
      </div>
    </div>
  );
}
