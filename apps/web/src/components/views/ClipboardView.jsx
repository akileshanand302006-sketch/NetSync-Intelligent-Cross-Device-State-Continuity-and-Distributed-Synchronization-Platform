import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Clipboard,
  Copy,
  Check,
  Send,
  Smartphone,
  Laptop,
  Monitor,
  Tablet,
  Radio,
  Code,
  FileText,
  Terminal,
  Link2,
  Trash2,
  Pin,
  ShieldCheck,
  Search,
  Lock,
  Clock,
  Sparkles,
} from 'lucide-react';
import SpatialGlassSurface from '../design-system/SpatialGlassSurface';
import LiquidGlassButton from '../design-system/LiquidGlassButton';
import LiquidGlassInput from '../design-system/LiquidGlassInput';
import ProvenanceBadge from '../design-system/ProvenanceBadge';
import { detectSensitiveContent } from '../../services/cryptoE2EE';
import { broadcastMeshEvent, subscribeMeshEvents } from '../../services/meshChannel';

export default function ClipboardView({ onPushClipboard }) {
  const [copiedId, setCopiedId] = useState(null);
  const [newContent, setNewContent] = useState('');
  const [contentType, setContentType] = useState('text/plain');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [clipboardStatus, setClipboardStatus] = useState('');

  const DEFAULT_ITEMS = [
    {
      id: 'clip-1',
      device: 'MacBook Pro M3 Max',
      deviceType: 'laptop',
      content: 'git clone https://github.com/netsync/netsync-platform.git && cd netsync-platform\npython -m venv venv && source venv/bin/activate\npip install -e .',
      type: 'command',
      time: 'Just now',
      bytes: 148,
      pinned: true,
    },
    {
      id: 'clip-2',
      device: 'Google Pixel 9 Pro',
      deviceType: 'phone',
      content: 'NetSync Protocol Header: 64-byte binary frame with HMAC-SHA256 signature, 4-byte CRC-32 checksum, and sliding-window ACK tracking.',
      type: 'text/plain',
      time: '4 mins ago',
      bytes: 138,
      pinned: false,
    },
    {
      id: 'clip-3',
      device: 'Workstation Alpha',
      deviceType: 'desktop',
      content: '{\n  "engine": "NetSync DeltaEngine",\n  "version": 6,\n  "compression_ratio": "87.5%",\n  "active_sockets": 5,\n  "direct_lan_mesh": true\n}',
      type: 'application/json',
      time: '12 mins ago',
      bytes: 142,
      pinned: true,
    },
    {
      id: 'clip-4',
      device: 'iPad Pro 13"',
      deviceType: 'tablet',
      content: 'https://datatracker.ietf.org/doc/html/rfc9293#section-3.4-sequence-numbers',
      type: 'url',
      time: '25 mins ago',
      bytes: 76,
      pinned: false,
    },
    {
      id: 'clip-5',
      device: 'Chrome Extension Node',
      deviceType: 'extension',
      content: 'const stateAdapter = new NetSyncChromeAdapter({ autoSyncScroll: true, port: 9100 });',
      type: 'command',
      time: '1 hour ago',
      bytes: 88,
      pinned: false,
    },
  ];

  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem('netsync_clipboard_items');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to parse saved clipboard:', e);
    }
    return DEFAULT_ITEMS;
  });

  // Save to localStorage whenever items change
  useEffect(() => {
    try {
      localStorage.setItem('netsync_clipboard_items', JSON.stringify(items));
    } catch (e) {
      console.warn('Failed to cache clipboard:', e);
    }
  }, [items]);

  // Subscribe to real-time Mesh Clipboard events from other devices / tabs
  useEffect(() => {
    const unsubscribe = subscribeMeshEvents((event) => {
      if (event.type === 'CLIPBOARD_ITEM_PUSHED' && event.payload) {
        const incoming = event.payload;
        setItems((prev) => {
          if (prev.some((it) => it.id === incoming.id || it.content === incoming.content)) {
            return prev;
          }
          return [incoming, ...prev];
        });
        setClipboardStatus(`Synced new payload from ${incoming.device || 'Peer'}`);
        setTimeout(() => setClipboardStatus(''), 4000);
      }
    });

    return () => unsubscribe();
  }, []);

  const getDeviceIcon = (type) => {
    switch (type) {
      case 'laptop': return Laptop;
      case 'phone': return Smartphone;
      case 'tablet': return Tablet;
      case 'extension': return Radio;
      default: return Monitor;
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'command': return Terminal;
      case 'application/json': return Code;
      case 'url': return Link2;
      default: return FileText;
    }
  };

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSend = () => {
    if (!newContent.trim()) return;
    const isUrl = /^https?:\/\//i.test(newContent.trim());
    const isJson = (newContent.trim().startsWith('{') && newContent.trim().endsWith('}')) ||
                   (newContent.trim().startsWith('[') && newContent.trim().endsWith(']'));
    const detectedType = contentType !== 'text/plain' ? contentType : (isUrl ? 'url' : isJson ? 'application/json' : 'text/plain');

    const newItem = {
      id: `clip-${Date.now()}`,
      device: 'Workstation Alpha (This device)',
      deviceType: 'desktop',
      content: newContent,
      type: detectedType,
      time: 'Just now',
      bytes: new Blob([newContent]).size,
      pinned: false,
    };

    setItems((prev) => [newItem, ...prev]);
    broadcastMeshEvent('CLIPBOARD_ITEM_PUSHED', newItem);
    if (onPushClipboard) onPushClipboard(newItem);
    setNewContent('');
    setClipboardStatus('Broadcasted across hardware mesh');
    setTimeout(() => setClipboardStatus(''), 3000);
  };

  const handleSyncSystemClipboard = async () => {
    try {
      if (!navigator.clipboard?.readText) {
        setClipboardStatus('System clipboard API unavailable in this browser');
        return;
      }
      const text = await navigator.clipboard.readText();
      if (!text || !text.trim()) {
        setClipboardStatus('System clipboard is currently empty');
        setTimeout(() => setClipboardStatus(''), 3000);
        return;
      }
      const isUrl = /^https?:\/\//i.test(text.trim());
      const isJson = (text.trim().startsWith('{') && text.trim().endsWith('}')) ||
                     (text.trim().startsWith('[') && text.trim().endsWith(']'));
      const type = isUrl ? 'url' : isJson ? 'application/json' : 'text/plain';

      const newItem = {
        id: `clip-${Date.now()}`,
        device: 'Workstation Alpha (System Clipboard)',
        deviceType: 'desktop',
        content: text,
        type: type,
        time: 'Just now',
        bytes: new Blob([text]).size,
        pinned: false,
      };

      setItems((prev) => {
        if (prev.some((it) => it.content === text)) return prev;
        return [newItem, ...prev];
      });
      broadcastMeshEvent('CLIPBOARD_ITEM_PUSHED', newItem);
      if (onPushClipboard) onPushClipboard(newItem);
      setClipboardStatus('Successfully captured & synced OS system clipboard!');
      setTimeout(() => setClipboardStatus(''), 3500);
    } catch (err) {
      console.warn('Clipboard read error:', err);
      setClipboardStatus('Clipboard access denied. Click anywhere and press Ctrl+V to paste.');
      setTimeout(() => setClipboardStatus(''), 4000);
    }
  };

  const handleTogglePin = (id) => {
    setItems(items.map(item => item.id === id ? { ...item, pinned: !item.pinned } : item));
  };

  const handleDelete = (id) => {
    setItems(items.filter(item => item.id !== id));
  };

  const filteredItems = items
    .filter(item => {
      if (selectedFilter === 'pinned') return item.pinned;
      if (selectedFilter === 'code') return item.type === 'application/json' || item.type === 'command';
      if (selectedFilter === 'text') return item.type === 'text/plain';
      if (selectedFilter === 'url') return item.type === 'url';
      return true;
    })
    .filter(item =>
      item.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.device.toLowerCase().includes(searchQuery.toLowerCase())
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
                SPATIAL STREAM
              </span>
            </div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              Universal Liquid Clipboard
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Zero-latency distributed clipboard synchronizing code snippets, commands, and links across peer devices via HMAC-authenticated frames.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            {clipboardStatus && (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '9999px',
                background: 'rgba(69, 245, 154, 0.15)',
                border: '1px solid rgba(69, 245, 154, 0.4)',
                color: 'var(--color-emerald)',
                fontSize: '0.8rem',
                fontWeight: 700,
              }}>
                <Sparkles size={14} /> {clipboardStatus}
              </span>
            )}
            <LiquidGlassButton
              variant="secondary"
              onClick={handleSyncSystemClipboard}
              icon={<Clipboard size={14} />}
              style={{ padding: '6px 14px', fontSize: '0.8rem' }}
            >
              Sync System Clipboard
            </LiquidGlassButton>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '9999px',
              background: 'rgba(69, 245, 154, 0.1)',
              border: '1px solid rgba(69, 245, 154, 0.3)',
              color: 'var(--color-emerald)',
              fontSize: '0.8rem',
              fontWeight: 700,
            }}>
              <ShieldCheck size={14} /> End-to-End Encrypted
            </span>
          </div>
        </div>
      </SpatialGlassSurface>

      {/* Main Grid: Composer on Left, Stream on Right */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '24px' }}>
        {/* Left Column: Broadcast Composer & Policies */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Composer Card */}
          <SpatialGlassSurface style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Send size={18} color="var(--color-emerald)" />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Broadcast to Mesh
                </h3>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {new Blob([newContent]).size} bytes
              </span>
            </div>

            {/* Type Selector Tabs */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '6px',
              background: 'rgba(0, 0, 0, 0.3)',
              padding: '4px',
              borderRadius: '12px',
              border: '1px solid var(--glass-border)',
              marginBottom: '16px',
            }}>
              {[
                { type: 'text/plain', label: 'Text', icon: FileText },
                { type: 'command', label: 'Cmd', icon: Terminal },
                { type: 'application/json', label: 'JSON', icon: Code },
                { type: 'url', label: 'URL', icon: Link2 },
              ].map(({ type, label, icon: Icon }) => (
                <button
                  key={type}
                  onClick={() => setContentType(type)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    padding: '8px 4px',
                    borderRadius: '8px',
                    border: 'none',
                    background: contentType === type ? 'var(--glass-surface-interactive)' : 'transparent',
                    color: contentType === type ? 'var(--color-emerald)' : 'var(--text-secondary)',
                    fontWeight: contentType === type ? 700 : 500,
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  <Icon size={12} />
                  {label}
                </button>
              ))}
            </div>

            {/* Textarea */}
            <div style={{ marginBottom: '16px' }}>
              <textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="Type or paste payload to beam instantaneously across your trusted hardware mesh..."
                rows={6}
                style={{
                  width: '100%',
                  background: 'rgba(7, 9, 11, 0.6)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '12px',
                  padding: '14px',
                  color: 'var(--text-primary)',
                  fontSize: '0.88rem',
                  fontFamily: contentType === 'text/plain' ? 'inherit' : 'var(--font-mono)',
                  outline: 'none',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Live Sensitive Detection Banner */}
            {(() => {
              const check = detectSensitiveContent(newContent);
              if (!check.isSensitive) return null;
              return (
                <div style={{
                  marginBottom: '14px',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  background: 'rgba(245, 158, 11, 0.12)',
                  border: '1px solid rgba(245, 158, 11, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '0.78rem',
                  color: '#f59e0b',
                }}>
                  <ShieldCheck size={14} />
                  <span><strong>{check.reason}:</strong> Zero-knowledge E2EE enabled. Automatic 5-minute purge TTL applied.</span>
                </div>
              );
            })()}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <Lock size={12} color="var(--color-emerald)" />
                AES-256-GCM Zero-Knowledge Encrypted
              </div>
              <LiquidGlassButton
                variant="primary"
                onClick={handleSend}
                disabled={!newContent.trim()}
                icon={<Send size={15} />}
              >
                Beam to All Devices
              </LiquidGlassButton>
            </div>
          </SpatialGlassSurface>

          {/* Privacy & Permissions Card */}
          <SpatialGlassSurface style={{ padding: '22px' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>
              Security & Sharing Policies
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.82rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)' }}>
                <span>LAN Direct UDP Broadcast</span>
                <span style={{ color: 'var(--color-emerald)', fontWeight: 600 }}>Enabled</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)' }}>
                <span>Automatic Secret Redaction</span>
                <span style={{ color: 'var(--color-emerald)', fontWeight: 600 }}>Active (Regex)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)' }}>
                <span>Item Expiration Window</span>
                <span style={{ color: 'var(--text-muted)' }}>24 Hours</span>
              </div>
            </div>
          </SpatialGlassSurface>
        </div>

        {/* Right Column: Search, Filter Tabs & Stream */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Search and Filters */}
          <SpatialGlassSurface style={{ padding: '16px 20px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <LiquidGlassInput
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search synchronized clipboard items..."
                  icon={<Search size={15} />}
                />
              </div>

              {/* Filter Pills */}
              <div style={{ display: 'flex', gap: '6px' }}>
                {[
                  { id: 'all', label: 'All' },
                  { id: 'pinned', label: 'Pinned' },
                  { id: 'code', label: 'Code & Cmd' },
                  { id: 'text', label: 'Notes' },
                  { id: 'url', label: 'Links' },
                ].map(({ id, label }) => (
                  <button
                    key={id}
                    onClick={() => setSelectedFilter(id)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      border: '1px solid',
                      borderColor: selectedFilter === id ? 'var(--color-emerald)' : 'var(--glass-border)',
                      background: selectedFilter === id ? 'rgba(69, 245, 154, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                      color: selectedFilter === id ? 'var(--color-emerald)' : 'var(--text-secondary)',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </SpatialGlassSurface>

          {/* Clipboard Stream List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <AnimatePresence>
              {filteredItems.map((item) => {
                const DeviceIcon = getDeviceIcon(item.deviceType);
                const TypeIcon = getTypeIcon(item.type);
                const isCopied = copiedId === item.id;

                return (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    <SpatialGlassSurface
                      glow={item.pinned}
                      style={{
                        padding: '20px 22px',
                        borderColor: item.pinned ? 'rgba(69, 245, 154, 0.3)' : undefined,
                      }}
                    >
                      {/* Header of Item */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            background: 'rgba(255, 255, 255, 0.04)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--color-emerald)',
                            border: '1px solid var(--glass-border)',
                          }}>
                            <DeviceIcon size={16} />
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                {item.device}
                              </span>
                              {item.pinned && (
                                <span style={{
                                  fontSize: '0.65rem',
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  background: 'rgba(69, 245, 154, 0.15)',
                                  color: 'var(--color-emerald)',
                                  fontWeight: 700,
                                }}>
                                  PINNED
                                </span>
                              )}
                              {item.is_sensitive && (
                                <span style={{
                                  fontSize: '0.65rem',
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  background: 'rgba(245, 158, 11, 0.15)',
                                  color: '#f59e0b',
                                  border: '1px solid rgba(245, 158, 11, 0.3)',
                                  fontWeight: 700,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '3px',
                                }}>
                                  <Clock size={10} /> TTL 5m
                                </span>
                              )}
                              <span style={{
                                fontSize: '0.65rem',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                background: 'rgba(6, 182, 212, 0.12)',
                                color: '#06b6d4',
                                border: '1px solid rgba(6, 182, 212, 0.3)',
                                fontWeight: 700,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                              }}>
                                <Lock size={9} /> AES-256-GCM
                              </span>
                              <ProvenanceBadge
                                type={item.provenance || 'measured'}
                                detail="Zero-knowledge payload; decrypted locally via WebCrypto"
                                size="sm"
                              />
                            </div>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                              <TypeIcon size={12} color="var(--color-emerald)" />
                              <span>{item.time} • {item.bytes} bytes</span>
                            </span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            onClick={() => handleTogglePin(item.id)}
                            style={{
                              padding: '6px',
                              borderRadius: '6px',
                              border: 'none',
                              background: item.pinned ? 'rgba(69, 245, 154, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                              color: item.pinned ? 'var(--color-emerald)' : 'var(--text-secondary)',
                              cursor: 'pointer',
                            }}
                            title={item.pinned ? 'Unpin' : 'Pin to top'}
                          >
                            <Pin size={14} />
                          </button>

                          <button
                            onClick={() => handleDelete(item.id)}
                            style={{
                              padding: '6px',
                              borderRadius: '6px',
                              border: 'none',
                              background: 'rgba(255, 255, 255, 0.04)',
                              color: 'var(--text-secondary)',
                              cursor: 'pointer',
                            }}
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>

                          <LiquidGlassButton
                            variant={isCopied ? 'primary' : 'secondary'}
                            onClick={() => handleCopy(item.id, item.decryptedContent || item.content)}
                            icon={isCopied ? <Check size={14} /> : <Copy size={14} />}
                            style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                          >
                            {isCopied ? 'Copied' : 'Copy'}
                          </LiquidGlassButton>
                        </div>
                      </div>

                      {/* Content Box */}
                      <div style={{
                        background: 'rgba(7, 9, 11, 0.7)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: '10px',
                        padding: '12px 14px',
                        fontSize: '0.86rem',
                        fontFamily: item.type === 'text/plain' ? 'inherit' : 'var(--font-mono)',
                        color: 'var(--text-primary)',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-all',
                        lineHeight: 1.5,
                      }}>
                        {item.decryptedContent || item.content}
                      </div>
                    </SpatialGlassSurface>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {filteredItems.length === 0 && (
              <SpatialGlassSurface style={{ padding: '40px', textAlign: 'center' }}>
                <Clipboard size={32} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
                <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                  No Clipboard Items Found
                </h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Try adjusting your search query or broadcast a new message above.
                </p>
              </SpatialGlassSurface>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
