import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Laptop, FileText, QrCode, Activity, Moon, Sun, X, ArrowRight, Zap } from 'lucide-react';

export default function GlassCommandPalette({
  isOpen,
  onClose,
  onNavigate,
  onOpenPairModal,
  onToggleTheme,
  theme,
}) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onClose(); // toggle or open
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const actions = [
    { id: 'resume', title: 'Resume Workspace State', category: 'Continuity', icon: Zap, action: () => { onNavigate('continuity'); onClose(); } },
    { id: 'transfer', title: 'Direct P2P File Transfer (WebRTC)', category: 'Transport', icon: Zap, action: () => { onNavigate('file-transfer'); onClose(); } },
    { id: 'devices', title: 'Inspect Connected Devices', category: 'Mesh', icon: Laptop, action: () => { onNavigate('devices'); onClose(); } },
    { id: 'pair', title: 'Pair New Hardware Peer (6-Digit Token)', category: 'Security', icon: QrCode, action: () => { onOpenPairModal(); onClose(); } },
    { id: 'telemetry', title: 'View LAN vs Cloud Network Telemetry', category: 'Evaluation', icon: Activity, action: () => { onNavigate('telemetry'); onClose(); } },
    { id: 'clipboard', title: 'Open Universal Clipboard Stream', category: 'Clipboard', icon: FileText, action: () => { onNavigate('clipboard'); onClose(); } },
    { id: 'theme', title: `Toggle Theme (${theme === 'dark' ? 'Light Pearl' : 'Dark Obsidian'})`, category: 'Appearance', icon: theme === 'dark' ? Sun : Moon, action: () => { onToggleTheme(); onClose(); } },
  ];

  const filtered = actions.filter((a) =>
    a.title.toLowerCase().includes(query.toLowerCase()) ||
    a.category.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <AnimatePresence>
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 100,
        background: 'rgba(7, 9, 11, 0.75)',
        backdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '15vh',
        paddingLeft: '20px',
        paddingRight: '20px',
      }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -10 }}
          transition={{ duration: 0.18 }}
          className="spatial-glass-surface"
          style={{
            width: '100%',
            maxWidth: '560px',
            borderRadius: '20px',
            boxShadow: '0 24px 64px rgba(0, 0, 0, 0.8), 0 0 1px 1px rgba(255, 255, 255, 0.15)',
            overflow: 'hidden',
          }}
        >
          {/* Search Bar Input */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-metallic)',
          }}>
            <Search size={18} color="var(--color-emerald)" />
            <input
              autoFocus
              type="text"
              placeholder="Type a command or jump to feature..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                color: 'var(--text-primary)',
                fontSize: '0.95rem',
                fontFamily: 'var(--font-sans)',
                outline: 'none',
              }}
            />
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Action List */}
          <div style={{ padding: '8px', maxHeight: '340px', overflowY: 'auto' }}>
            {filtered.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No commands matching "{query}"
              </div>
            ) : (
              filtered.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.id}
                    onClick={item.action}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: 'var(--color-emerald-dim)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        <Icon size={16} color="var(--color-emerald)" />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {item.title}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          {item.category}
                        </div>
                      </div>
                    </div>
                    <ArrowRight size={14} color="var(--text-muted)" />
                  </div>
                );
              })
            )}
          </div>

          {/* Footer note */}
          <div style={{
            padding: '10px 20px',
            borderTop: '1px solid var(--border-metallic)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.72rem',
            color: 'var(--text-muted)',
            background: 'rgba(7, 9, 11, 0.4)',
          }}>
            <span>Navigation: <kbd style={{ padding: '2px 5px', borderRadius: '4px', background: 'rgba(255,255,255,0.06)' }}>↑</kbd> <kbd style={{ padding: '2px 5px', borderRadius: '4px', background: 'rgba(255,255,255,0.06)' }}>↓</kbd></span>
            <span>Close: <kbd style={{ padding: '2px 5px', borderRadius: '4px', background: 'rgba(255,255,255,0.06)' }}>ESC</kbd></span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
