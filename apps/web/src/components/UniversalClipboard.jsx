import React, { useState } from 'react';
import { Clipboard, Copy, Check, Send, Smartphone, Laptop, Monitor, Code, FileText, Terminal } from 'lucide-react';

export default function UniversalClipboard({ onPushClipboard }) {
  const [copiedId, setCopiedId] = useState(null);
  const [newContent, setNewContent] = useState('');
  const [contentType, setContentType] = useState('text/plain');

  const [items, setItems] = useState([
    {
      id: 'clip-1',
      device: 'MacBook Pro M3',
      deviceType: 'laptop',
      content: 'git clone https://github.com/netsync/netsync-platform.git && cd netsync-platform',
      type: 'command',
      time: 'Just now',
      bytes: 84,
    },
    {
      id: 'clip-2',
      device: 'Google Pixel 9 Pro',
      deviceType: 'phone',
      content: 'Meeting summary: Finalized binary framing header with 64-byte payload offsets and CRC32 checks.',
      type: 'text/plain',
      time: '4 mins ago',
      bytes: 98,
    },
    {
      id: 'clip-3',
      device: 'Workstation Alpha',
      deviceType: 'desktop',
      content: '{\n  "status": "healthy",\n  "active_peers": 5,\n  "rtt_ms": 1.8\n}',
      type: 'application/json',
      time: '12 mins ago',
      bytes: 65,
    },
    {
      id: 'clip-4',
      device: 'iPad Pro 13"',
      deviceType: 'tablet',
      content: 'ssh netsync-node-prod@192.168.1.101 -p 9100',
      type: 'command',
      time: '25 mins ago',
      bytes: 46,
    },
  ]);

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSend = () => {
    if (!newContent.trim()) return;
    const newItem = {
      id: `clip-${Date.now()}`,
      device: 'Workstation Alpha (This device)',
      deviceType: 'desktop',
      content: newContent,
      type: contentType,
      time: 'Just now',
      bytes: new Blob([newContent]).size,
    };
    const updated = [newItem, ...items];
    setItems(updated);
    if (onPushClipboard) onPushClipboard(newItem);
    setNewContent('');
  };

  const getDeviceIcon = (type) => {
    if (type === 'laptop') return Laptop;
    if (type === 'phone') return Smartphone;
    return Monitor;
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '24px' }}>
      {/* Feed */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc', marginBottom: '4px' }}>
              Universal Clipboard History
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
              Instant copy-paste continuity across all registered hardware and browser extensions.
            </p>
          </div>
          <span className="badge-pill badge-purple">E2E Synchronized</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {items.map((item) => {
            const DeviceIcon = getDeviceIcon(item.deviceType);
            const isCopied = copiedId === item.id;
            return (
              <div
                key={item.id}
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '12px',
                  padding: '14px 16px',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <DeviceIcon size={15} color="#38bdf8" />
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#e2e8f0' }}>{item.device}</span>
                    <span style={{ color: '#475569' }}>•</span>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{item.time}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="badge-pill badge-cyan" style={{ fontSize: '0.65rem' }}>
                      {item.type}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'var(--font-mono)' }}>
                      {item.bytes} B
                    </span>
                  </div>
                </div>

                <div style={{
                  background: 'rgba(6, 9, 19, 0.6)',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.8rem',
                  color: '#f1f5f9',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                  marginBottom: '10px',
                  maxHeight: '120px',
                  overflowY: 'auto',
                }}>
                  {item.content}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => handleCopy(item.id, item.content)}
                    className="btn-secondary"
                    style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                  >
                    {isCopied ? (
                      <>
                        <Check size={14} color="#34d399" />
                        Copied to Local Clipboard!
                      </>
                    ) : (
                      <>
                        <Copy size={14} />
                        Copy to Local System
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Composer */}
      <div className="glass-panel" style={{ padding: '24px', height: 'fit-content' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc', marginBottom: '8px' }}>
          Broadcast Clipboard Snippet
        </h3>
        <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '16px' }}>
          Pushes content instantly to all connected peer devices over the local mesh.
        </p>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
          {[
            { id: 'text/plain', label: 'Plain Text' },
            { id: 'command', label: 'Shell Command' },
            { id: 'application/json', label: 'JSON' },
          ].map((type) => (
            <button
              key={type.id}
              onClick={() => setContentType(type.id)}
              style={{
                padding: '6px 10px',
                borderRadius: '8px',
                fontSize: '0.75rem',
                fontWeight: 600,
                border: contentType === type.id ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.08)',
                background: contentType === type.id ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                color: contentType === type.id ? '#38bdf8' : '#94a3b8',
                cursor: 'pointer',
              }}
            >
              {type.label}
            </button>
          ))}
        </div>

        <textarea
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          placeholder="Paste or type text to synchronize across devices..."
          style={{
            width: '100%',
            height: '140px',
            background: 'rgba(6, 9, 19, 0.6)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '10px',
            padding: '12px',
            color: '#f8fafc',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.825rem',
            resize: 'none',
            outline: 'none',
            marginBottom: '16px',
          }}
        />

        <button
          onClick={handleSend}
          disabled={!newContent.trim()}
          className="btn-primary"
          style={{ width: '100%' }}
        >
          <Send size={15} />
          Broadcast to Mesh
        </button>
      </div>
    </div>
  );
}
