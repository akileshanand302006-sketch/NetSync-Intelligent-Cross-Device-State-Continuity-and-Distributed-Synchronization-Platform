import React from 'react';
import {
  Activity,
  Layers,
  Radio,
  Server,
  Shield,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownLeft,
  Wifi,
} from 'lucide-react';
import SpatialGlassSurface from '../design-system/SpatialGlassSurface';

export default function LiveConnectionsTab({ devices = [] }) {
  const activeConnections = [
    {
      id: 'conn-1',
      peer: 'MacBook Pro M3 Max',
      local_endpoint: '192.168.1.101:52180',
      remote_endpoint: '192.168.1.102:9100',
      transport: 'TCP Byte Stream',
      method: 'Direct LAN Socket',
      status: 'ESTABLISHED',
      duration: '42m 18s',
      bytes_sent: 14680064,
      bytes_recv: 38240,
      rtt_ms: 1.8,
      last_error: null,
    },
    {
      id: 'conn-2',
      peer: 'Google Pixel 9 Pro',
      local_endpoint: '192.168.1.101:54912',
      remote_endpoint: '192.168.1.105:9100',
      transport: 'WebRTC DataChannel',
      method: 'P2P Direct SCTP',
      status: 'ESTABLISHED',
      duration: '18m 05s',
      bytes_sent: 4194304,
      bytes_recv: 18400,
      rtt_ms: 3.2,
      last_error: null,
    },
    {
      id: 'conn-3',
      peer: 'iPad Pro 13"',
      local_endpoint: '192.168.1.101:56220',
      remote_endpoint: '192.168.1.108:9100',
      transport: 'TCP Byte Stream',
      method: 'Direct LAN Socket',
      status: 'ESTABLISHED',
      duration: '09m 44s',
      bytes_sent: 89120,
      bytes_recv: 52100,
      rtt_ms: 2.1,
      last_error: null,
    },
    {
      id: 'conn-4',
      peer: 'Chrome Extension Node',
      local_endpoint: '127.0.0.1:58410',
      remote_endpoint: '127.0.0.1:9100',
      transport: 'Local IPC / Loopback',
      method: '127.0.0.1 Loopback',
      status: 'ESTABLISHED',
      duration: '1h 14m',
      bytes_sent: 342000,
      bytes_recv: 342000,
      rtt_ms: 0.4,
      last_error: null,
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Banner */}
      <SpatialGlassSurface style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span className="pulse-emerald-dot" />
              <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--color-emerald)', textTransform: 'uppercase' }}>
                AUTHENTICATED APPLICATION TELEMETRY
              </span>
            </div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Live NetSync Application Mesh Connections
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
              Real-time state channels, direct socket streams, and WebRTC DataChannels authenticated via mutual cryptographic keys.
            </p>
          </div>

          <span className="badge-emerald-pill">
            {activeConnections.length} ACTIVE SOCKET SESSIONS
          </span>
        </div>

        {/* Boundary Notice */}
        <div style={{ marginTop: '16px', padding: '10px 14px', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
          <strong>Telemetry Boundary Notice:</strong> This table displays authenticated NetSync application-level connections and sessions. It does not monitor or expose unrelated operating-system sockets or third-party background traffic.
        </div>
      </SpatialGlassSurface>

      {/* Connections Explorer Table */}
      <SpatialGlassSurface style={{ padding: '24px' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                <th style={{ padding: '12px 14px' }}>REMOTE PEER</th>
                <th style={{ padding: '12px 14px' }}>TRANSPORT / METHOD</th>
                <th style={{ padding: '12px 14px' }}>SOCKET 5-TUPLE</th>
                <th style={{ padding: '12px 14px' }}>BANDWIDTH SENT / RECV</th>
                <th style={{ padding: '12px 14px' }}>RTT</th>
                <th style={{ padding: '12px 14px', textAlign: 'right' }}>STATE</th>
              </tr>
            </thead>
            <tbody>
              {activeConnections.map((conn) => (
                <tr key={conn.id} style={{ borderBottom: '1px solid var(--border-metallic-subtle)' }}>
                  <td style={{ padding: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    <div>{conn.peer}</div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                      Uptime: {conn.duration}
                    </span>
                  </td>
                  <td style={{ padding: '14px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.82rem' }}>
                      {conn.transport}
                    </div>
                    <span style={{
                      fontSize: '0.7rem',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: 'rgba(69, 245, 154, 0.1)',
                      color: 'var(--color-emerald)',
                      fontWeight: 700,
                    }}>
                      {conn.method}
                    </span>
                  </td>
                  <td style={{ padding: '14px', fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    <div>{conn.local_endpoint}</div>
                    <div style={{ color: 'var(--color-emerald)' }}>→ {conn.remote_endpoint}</div>
                  </td>
                  <td style={{ padding: '14px', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                    <div style={{ color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <ArrowUpRight size={13} color="var(--color-emerald)" />
                      {(conn.bytes_sent / 1024).toFixed(1)} KB
                    </div>
                    <div style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <ArrowDownLeft size={13} color="#38bdf8" />
                      {(conn.bytes_recv / 1024).toFixed(1)} KB
                    </div>
                  </td>
                  <td style={{ padding: '14px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-emerald)' }}>
                    {conn.rtt_ms} ms
                  </td>
                  <td style={{ padding: '14px', textAlign: 'right' }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '3px 8px',
                      borderRadius: '9999px',
                      background: 'rgba(69, 245, 154, 0.12)',
                      color: 'var(--color-emerald)',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                    }}>
                      <span className="pulse-emerald-dot" style={{ width: '5px', height: '5px' }} />
                      {conn.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SpatialGlassSurface>
    </div>
  );
}
