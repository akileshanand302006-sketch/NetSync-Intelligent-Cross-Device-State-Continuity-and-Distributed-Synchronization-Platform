import React, { useState } from 'react';
import {
  Radio,
  Wifi,
  Users,
  Send,
  Activity,
  Layers,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Globe,
  Sliders,
} from 'lucide-react';
import SpatialGlassSurface from '../design-system/SpatialGlassSurface';
import LiquidGlassButton from '../design-system/LiquidGlassButton';
import { testBroadcastDiscovery, testMulticastDiscovery } from '../../services/api';

export default function LanDiscoveryMulticastTab() {
  const [activeTab, setActiveTab] = useState('broadcast'); // 'broadcast' | 'multicast'

  // Broadcast state
  const [broadcastPort, setBroadcastPort] = useState(9100);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastResult, setBroadcastResult] = useState(null);

  // Multicast state
  const [multicastGroup, setMulticastGroup] = useState('239.255.0.1');
  const [multicastPort, setMulticastPort] = useState(9105);
  const [multicastTtl, setMulticastTtl] = useState(1);
  const [messageCount, setMessageCount] = useState(4);
  const [isMulticasting, setIsMulticasting] = useState(false);
  const [multicastResult, setMulticastResult] = useState(null);

  const handleRunBroadcast = async () => {
    setIsBroadcasting(true);
    try {
      const data = await testBroadcastDiscovery(broadcastPort);
      setBroadcastResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsBroadcasting(false);
    }
  };

  const handleRunMulticast = async () => {
    setIsMulticasting(true);
    try {
      const data = await testMulticastDiscovery({
        group: multicastGroup,
        port: Number(multicastPort),
        ttl: Number(multicastTtl),
        message_count: Number(messageCount),
      });
      setMulticastResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsMulticasting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Banner */}
      <SpatialGlassSurface style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span className="pulse-emerald-dot" />
              <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--color-emerald)', textTransform: 'uppercase' }}>
                COURSE 20MSS56 • EXERCISE 4 & 7
              </span>
            </div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              LAN Discovery (UDP Broadcast) & IP Multicast Lab
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
              Demonstrating `SO_BROADCAST` subnet-wide node discovery and Class D multicast group communication with IGMP scoping.
            </p>
          </div>

          <div style={{
            display: 'inline-flex',
            padding: '4px',
            borderRadius: '9999px',
            background: 'rgba(0,0,0,0.2)',
            border: '1px solid var(--border-metallic)',
            gap: '4px',
          }}>
            <button
              onClick={() => setActiveTab('broadcast')}
              style={{
                padding: '6px 16px',
                borderRadius: '9999px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: 700,
                background: activeTab === 'broadcast' ? 'var(--color-emerald)' : 'transparent',
                color: activeTab === 'broadcast' ? '#03100b' : 'var(--text-secondary)',
                transition: 'all 0.2s ease',
              }}
            >
              UDP Subnet Broadcast
            </button>
            <button
              onClick={() => setActiveTab('multicast')}
              style={{
                padding: '6px 16px',
                borderRadius: '9999px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: 700,
                background: activeTab === 'multicast' ? 'var(--color-emerald)' : 'transparent',
                color: activeTab === 'multicast' ? '#03100b' : 'var(--text-secondary)',
                transition: 'all 0.2s ease',
              }}
            >
              Class D IP Multicast
            </button>
          </div>
        </div>
      </SpatialGlassSurface>

      {/* Broadcast Sub-view */}
      {activeTab === 'broadcast' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <SpatialGlassSurface style={{ padding: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '20px', alignItems: 'flex-end' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  TARGET BROADCAST PORT (DESTINATION 255.255.255.255)
                </label>
                <input
                  type="number"
                  value={broadcastPort}
                  onChange={(e) => setBroadcastPort(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-metallic)',
                    background: 'rgba(0,0,0,0.15)',
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.85rem',
                  }}
                />
              </div>

              <LiquidGlassButton
                variant="primary"
                onClick={handleRunBroadcast}
                disabled={isBroadcasting}
                icon={<Radio size={14} className={isBroadcasting ? 'spin-anim' : ''} />}
              >
                {isBroadcasting ? 'Transmitting SO_BROADCAST...' : 'Transmit Subnet Broadcast Probe'}
              </LiquidGlassButton>
            </div>
          </SpatialGlassSurface>

          {broadcastResult && (
            <SpatialGlassSurface style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  Broadcast Probe Transmission Report
                </h4>
                <span className="badge-emerald-pill">
                  STATUS: {broadcastResult.status?.toUpperCase()}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '16px' }}>
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>DESTINATION ADDRESS</span>
                  <p style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-emerald)', margin: '4px 0' }}>
                    {broadcastResult.broadcast_address}
                  </p>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>WIRE BYTES TRANSMITTED</span>
                  <p style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-primary)', margin: '4px 0' }}>
                    {broadcastResult.bytes_sent} bytes
                  </p>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>EXECUTION DURATION</span>
                  <p style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-mint)', margin: '4px 0' }}>
                    {broadcastResult.duration_ms?.toFixed(2)} ms
                  </p>
                </div>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.25)', padding: '12px 16px', borderRadius: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                <strong>Socket Configuration:</strong> Initialized raw datagram socket with <code>SO_BROADCAST=1</code> and <code>SO_REUSEADDR=1</code>. Broadcast packets are flooded to all hosts on the local physical link without routing across WAN boundaries (RFC 919).
              </div>
            </SpatialGlassSurface>
          )}
        </div>
      )}

      {/* Multicast Sub-view */}
      {activeTab === 'multicast' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <SpatialGlassSurface style={{ padding: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  CLASS D MULTICAST IP (224.0.0.0 - 239.255.255.255)
                </label>
                <input
                  type="text"
                  value={multicastGroup}
                  onChange={(e) => setMulticastGroup(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-metallic)',
                    background: 'rgba(0,0,0,0.15)',
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.85rem',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  MULTICAST PORT
                </label>
                <input
                  type="number"
                  value={multicastPort}
                  onChange={(e) => setMulticastPort(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-metallic)',
                    background: 'rgba(0,0,0,0.15)',
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.85rem',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  IP_MULTICAST_TTL ({multicastTtl} HOPS)
                </label>
                <input
                  type="range"
                  min="1"
                  max="4"
                  value={multicastTtl}
                  onChange={(e) => setMulticastTtl(Number(e.target.value))}
                  style={{ width: '100%', marginTop: '6px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  MESSAGE COUNT ({messageCount})
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={messageCount}
                  onChange={(e) => setMessageCount(Number(e.target.value))}
                  style={{ width: '100%', marginTop: '6px' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <LiquidGlassButton
                  variant="primary"
                  onClick={handleRunMulticast}
                  disabled={isMulticasting}
                  icon={<Users size={14} className={isMulticasting ? 'spin-anim' : ''} />}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  {isMulticasting ? 'Transmitting...' : 'Send Multicast Stream'}
                </LiquidGlassButton>
              </div>
            </div>
          </SpatialGlassSurface>

          {multicastResult && (
            <SpatialGlassSurface style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  Multicast Group Transmission Report ({multicastResult.group}:{multicastResult.port})
                </h4>
                <span className="badge-emerald-pill">
                  {multicastResult.messages_sent} Messages Transmitted
                </span>
              </div>

              <div style={{ overflowX: 'auto', marginBottom: '16px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '8px 12px' }}>SEQ #</th>
                      <th style={{ padding: '8px 12px' }}>TIMESTAMP</th>
                      <th style={{ padding: '8px 12px' }}>MULTICAST PAYLOAD</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right' }}>SIZE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {multicastResult.details?.map((m, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--border-metallic-subtle)' }}>
                        <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-emerald)' }}>
                          #{m.sequence}
                        </td>
                        <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                          {m.timestamp?.toFixed(4)}
                        </td>
                        <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                          {m.payload}
                        </td>
                        <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', textAlign: 'right' }}>
                          {m.bytes} bytes
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.25)', padding: '12px 16px', borderRadius: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                <strong>Class D Scoping (RFC 2365):</strong> Transmitted with <code>IP_MULTICAST_TTL={multicastResult.ttl}</code>. Only hosts that explicitly join the multicast group via IGMP (Internet Group Management Protocol) report frames to the application layer.
              </div>
            </SpatialGlassSurface>
          )}
        </div>
      )}
    </div>
  );
}
