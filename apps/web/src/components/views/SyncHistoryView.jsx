import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  GitCommit,
  CheckCircle2,
  AlertTriangle,
  Search,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import SpatialGlassSurface from '../design-system/SpatialGlassSurface';
import LiquidGlassInput from '../design-system/LiquidGlassInput';

export default function SyncHistoryView({ logs = [] }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [expandedLogId, setExpandedLogId] = useState(null);

  const defaultLogs = [
    {
      id: 'evt-110',
      timestamp: '13:42:10',
      state: 'Workspace Alpha / delta_engine.ts',
      version: 'Rev #8',
      type: 'delta',
      bytes: 64,
      savings: '86.2%',
      conflict: false,
      strategy: null,
      device: 'MacBook Pro M3 Max',
      targetDevice: 'Workstation Alpha',
      details: {
        fields_modified: ['editorBuffer.cursor', 'selectionRange'],
        ack_rtt_ms: 1.6,
        crc32: '0x8F4A21C0',
      },
    },
    {
      id: 'evt-109',
      timestamp: '13:38:42',
      state: 'Workspace Alpha',
      version: 'Rev #7',
      type: 'delta',
      bytes: 48,
      savings: '87.5%',
      conflict: false,
      strategy: null,
      device: 'MacBook Pro M3 Max',
      targetDevice: 'All Active Peers',
      details: {
        fields_modified: ['tabs[0].scroll_percentage'],
        ack_rtt_ms: 2.1,
        crc32: '0x3D9B51E2',
      },
    },
    {
      id: 'evt-108',
      timestamp: '13:35:15',
      state: 'Workspace Alpha',
      version: 'Rev #6',
      type: 'delta',
      bytes: 96,
      savings: '82.0%',
      conflict: true,
      strategy: 'field_merge',
      device: 'Google Pixel 9 Pro',
      targetDevice: 'Workstation Alpha',
      details: {
        conflict_fields: ['cursor_positions', 'active_tab_id'],
        resolution: 'Non-overlapping fields merged automatically; monotonic vector clock preserved.',
        ack_rtt_ms: 3.4,
        crc32: '0x5C209AE4',
      },
    },
    {
      id: 'evt-107',
      timestamp: '13:28:01',
      state: 'Universal Clipboard',
      version: 'Rev #5',
      type: 'delta',
      bytes: 142,
      savings: '65.4%',
      conflict: false,
      strategy: null,
      device: 'Workstation Alpha',
      targetDevice: 'All Mesh Nodes',
      details: {
        fields_modified: ['clipboard.item_stream'],
        ack_rtt_ms: 1.9,
        crc32: '0x1A8077D3',
      },
    },
    {
      id: 'evt-106',
      timestamp: '13:20:18',
      state: 'Initial Mesh Handshake',
      version: 'Rev #1',
      type: 'full_snapshot',
      bytes: 38400,
      savings: '0%',
      conflict: false,
      strategy: null,
      device: 'Workstation Alpha',
      targetDevice: 'Mesh Multicast',
      details: {
        fields_modified: ['full_state_baseline'],
        ack_rtt_ms: 2.4,
        crc32: '0x7B6194A5',
      },
    },
  ];

  const activeLogs = logs.length > 0 ? logs : defaultLogs;

  const filteredLogs = activeLogs
    .filter((log) => {
      if (filterType === 'conflicts') return log.conflict;
      if (filterType === 'delta') return log.type === 'delta';
      if (filterType === 'full') return log.type === 'full_snapshot';
      return true;
    })
    .filter(
      (log) =>
        log.state.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.device.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.id.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const toggleExpand = (id) => {
    setExpandedLogId(expandedLogId === id ? null : id);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Top Banner */}
      <SpatialGlassSurface style={{ padding: '28px 32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span className="pulse-emerald-dot"></span>
              <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--color-emerald)', textTransform: 'uppercase' }}>
                DISTRIBUTED STATE AUDIT LOG
              </span>
            </div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              Synchronization History & Conflict Resolutions
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Deterministic sequence of state deltas, frame checksums, and CRDT field-level conflict resolutions.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
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
              <CheckCircle2 size={14} /> Monotonic Revision Ordering Active
            </span>
          </div>
        </div>
      </SpatialGlassSurface>

      {/* Filter and Search Bar */}
      <SpatialGlassSurface style={{ padding: '18px 24px' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '240px' }}>
            <LiquidGlassInput
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by event ID, state topic, or peer node..."
              icon={<Search size={15} />}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            {[
              { id: 'all', label: 'All Events' },
              { id: 'conflicts', label: 'Conflicts Only' },
              { id: 'delta', label: 'Delta Frames' },
              { id: 'full', label: 'Full Snapshots' },
            ].map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setFilterType(id)}
                style={{
                  padding: '7px 14px',
                  borderRadius: '8px',
                  border: '1px solid',
                  borderColor: filterType === id ? 'var(--color-emerald)' : 'var(--glass-border)',
                  background: filterType === id ? 'rgba(69, 245, 154, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                  color: filterType === id ? 'var(--color-emerald)' : 'var(--text-secondary)',
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

      {/* Event Timeline Table */}
      <SpatialGlassSurface style={{ padding: '24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredLogs.map((log) => {
            const isExpanded = expandedLogId === log.id;

            return (
              <div
                key={log.id}
                style={{
                  background: 'rgba(7, 9, 11, 0.65)',
                  border: '1px solid',
                  borderColor: log.conflict ? 'rgba(234, 179, 8, 0.35)' : 'var(--glass-border)',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  transition: 'border-color 0.2s',
                }}
              >
                {/* Event Row Header */}
                <div
                  onClick={() => toggleExpand(log.id)}
                  style={{
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    userSelect: 'none',
                    gap: '16px',
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      background: log.conflict ? 'rgba(234, 179, 8, 0.12)' : 'rgba(69, 245, 154, 0.1)',
                      border: `1px solid ${log.conflict ? 'rgba(234, 179, 8, 0.3)' : 'rgba(69, 245, 154, 0.2)'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: log.conflict ? '#eab308' : 'var(--color-emerald)',
                    }}>
                      {log.conflict ? <AlertTriangle size={18} /> : <GitCommit size={18} />}
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {log.state}
                        </span>
                        <span style={{
                          fontSize: '0.72rem',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: 'rgba(255, 255, 255, 0.05)',
                          color: 'var(--text-secondary)',
                          fontFamily: 'var(--font-mono)',
                        }}>
                          {log.version}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {log.timestamp} • Origin: <span style={{ color: 'var(--text-secondary)' }}>{log.device}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    {/* Wire savings */}
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                        {log.bytes} B
                      </div>
                      <div style={{ fontSize: '0.72rem', color: log.type === 'delta' ? 'var(--color-emerald)' : 'var(--text-muted)' }}>
                        {log.type === 'delta' ? `${log.savings} saved` : 'full frame'}
                      </div>
                    </div>

                    {/* Conflict or Status Badge */}
                    {log.conflict ? (
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        background: 'rgba(234, 179, 8, 0.15)',
                        border: '1px solid rgba(234, 179, 8, 0.3)',
                        color: '#facc15',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                      }}>
                        CONFLICT: {log.strategy}
                      </span>
                    ) : (
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        background: 'rgba(69, 245, 154, 0.1)',
                        border: '1px solid rgba(69, 245, 154, 0.25)',
                        color: 'var(--color-emerald)',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                      }}>
                        ACK VERIFIED
                      </span>
                    )}

                    <div style={{ color: 'var(--text-muted)' }}>
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </div>
                  </div>
                </div>

                {/* Expanded Details Pane */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      style={{
                        borderTop: '1px solid var(--glass-border)',
                        padding: '16px 20px',
                        background: 'rgba(0, 0, 0, 0.3)',
                        fontSize: '0.8rem',
                      }}
                    >
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '12px' }}>
                        <div>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>EVENT ID</span>
                          <div style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{log.id}</div>
                        </div>
                        <div>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>FRAME CRC-32 CHECKSUM</span>
                          <div style={{ color: 'var(--color-emerald)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                            {log.details?.crc32 || '0x4E2B9A10'}
                          </div>
                        </div>
                        <div>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>ACK RTT ROUND-TRIP</span>
                          <div style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                            {log.details?.ack_rtt_ms || '2.0'} ms
                          </div>
                        </div>
                      </div>

                      {log.conflict && log.details?.resolution && (
                        <div style={{
                          padding: '10px 14px',
                          background: 'rgba(234, 179, 8, 0.08)',
                          border: '1px solid rgba(234, 179, 8, 0.25)',
                          borderRadius: '8px',
                          color: '#fef08a',
                          fontSize: '0.78rem',
                          marginBottom: '10px',
                        }}>
                          <strong>Conflict Resolution Audit:</strong> {log.details.resolution}
                        </div>
                      )}

                      <div style={{
                        background: 'rgba(7, 9, 11, 0.8)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: '8px',
                        padding: '10px 12px',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.75rem',
                        color: 'var(--text-secondary)',
                      }}>
                        {JSON.stringify({
                          event_id: log.id,
                          origin: log.device,
                          target: log.targetDevice || 'Mesh Multicast',
                          version_vector: log.version,
                          payload_bytes: log.bytes,
                          compression: log.type,
                          audit_checksum: log.details?.crc32 || '0x4E2B9A10',
                        }, null, 2)}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}

          {filteredLogs.length === 0 && (
            <div style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
              No synchronization events match the selected criteria.
            </div>
          )}
        </div>
      </SpatialGlassSurface>
    </div>
  );
}
