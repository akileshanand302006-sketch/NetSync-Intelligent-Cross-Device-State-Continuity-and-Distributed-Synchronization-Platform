import React from 'react';
import { History, GitCommit, CheckCircle2, AlertTriangle, ArrowDownRight, Zap } from 'lucide-react';

export default function SyncHistoryLog({ logs }) {
  const defaultLogs = [
    {
      id: 'evt-109',
      timestamp: '13:28:42',
      state: 'Workspace Alpha',
      version: 'Rev #6',
      type: 'delta',
      bytes: 48,
      savings: '87.5%',
      conflict: false,
      strategy: null,
      device: 'MacBook Pro M3',
    },
    {
      id: 'evt-108',
      timestamp: '13:27:15',
      state: 'Workspace Alpha',
      version: 'Rev #5',
      type: 'delta',
      bytes: 96,
      savings: '82.0%',
      conflict: true,
      strategy: 'field_merge',
      device: 'Google Pixel 9 Pro',
    },
    {
      id: 'evt-107',
      timestamp: '13:25:01',
      state: 'Universal Clipboard',
      version: 'Rev #4',
      type: 'delta',
      bytes: 142,
      savings: '65.4%',
      conflict: false,
      strategy: null,
      device: 'Workstation Alpha',
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
    },
  ];

  const displayLogs = logs && logs.length > 0 ? logs : defaultLogs;

  return (
    <div className="glass-panel" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <History size={20} color="#38bdf8" />
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc' }}>
            State Sync Transactions & Conflict Log
          </h3>
        </div>
        <span className="badge-pill badge-cyan">Server-Assigned Revisions</span>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', color: '#64748b' }}>
              <th style={{ padding: '10px 12px', fontWeight: 600 }}>Time</th>
              <th style={{ padding: '10px 12px', fontWeight: 600 }}>State Identifier</th>
              <th style={{ padding: '10px 12px', fontWeight: 600 }}>Revision</th>
              <th style={{ padding: '10px 12px', fontWeight: 600 }}>Sync Mode</th>
              <th style={{ padding: '10px 12px', fontWeight: 600 }}>Payload</th>
              <th style={{ padding: '10px 12px', fontWeight: 600 }}>Compression</th>
              <th style={{ padding: '10px 12px', fontWeight: 600 }}>Conflict Handling</th>
            </tr>
          </thead>
          <tbody>
            {displayLogs.map((log) => (
              <tr
                key={log.id}
                style={{
                  borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                  color: '#e2e8f0',
                  transition: 'background 0.2s',
                }}
              >
                <td style={{ padding: '12px', fontFamily: 'var(--font-mono)', color: '#94a3b8' }}>
                  {log.timestamp}
                </td>
                <td style={{ padding: '12px', fontWeight: 600 }}>
                  {log.state}
                </td>
                <td style={{ padding: '12px', fontFamily: 'var(--font-mono)', color: '#38bdf8' }}>
                  {log.version}
                </td>
                <td style={{ padding: '12px' }}>
                  {log.type === 'delta' ? (
                    <span className="badge-pill badge-emerald" style={{ fontSize: '0.65rem' }}>
                      <Zap size={10} /> Delta Diff
                    </span>
                  ) : (
                    <span className="badge-pill badge-purple" style={{ fontSize: '0.65rem' }}>
                      Full State
                    </span>
                  )}
                </td>
                <td style={{ padding: '12px', fontFamily: 'var(--font-mono)' }}>
                  {log.bytes >= 1024 ? `${(log.bytes / 1024).toFixed(1)} KB` : `${log.bytes} B`}
                </td>
                <td style={{ padding: '12px', color: '#34d399', fontWeight: 600 }}>
                  {log.savings}
                </td>
                <td style={{ padding: '12px' }}>
                  {log.conflict ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#fbbf24' }}>
                      <AlertTriangle size={14} /> Resolved ({log.strategy})
                    </span>
                  ) : (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#64748b' }}>
                      <CheckCircle2 size={14} color="#34d399" /> Clean Merge
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
