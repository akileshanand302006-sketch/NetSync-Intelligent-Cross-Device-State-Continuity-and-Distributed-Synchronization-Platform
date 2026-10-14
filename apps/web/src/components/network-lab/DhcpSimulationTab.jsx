import React, { useState, useEffect } from 'react';
import {
  Server,
  Layers,
  ArrowRight,
  CheckCircle2,
  Clock,
  RefreshCw,
  Play,
  RotateCcw,
  Zap,
  Shield,
  Activity,
  AlertTriangle,
} from 'lucide-react';
import SpatialGlassSurface from '../design-system/SpatialGlassSurface';
import LiquidGlassButton from '../design-system/LiquidGlassButton';
import { fetchDhcpStatus, simulateDhcpDora } from '../../services/api';

export default function DhcpSimulationTab() {
  const [serverStatus, setServerStatus] = useState(null);
  const [clientMac, setClientMac] = useState('00:1A:2B:3C:4D:5E');
  const [clientName, setClientName] = useState('Research Node Alpha');
  const [isSimulating, setIsSimulating] = useState(false);
  const [doraResult, setDoraResult] = useState(null);

  const loadStatus = async () => {
    try {
      const data = await fetchDhcpStatus();
      setServerStatus(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const handleRunDora = async () => {
    setIsSimulating(true);
    try {
      const res = await simulateDhcpDora({
        client_mac: clientMac,
        client_name: clientName,
      });
      setDoraResult(res);
      await loadStatus();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleReleaseLease = async (mac) => {
    try {
      await fetch('/api/v1/lab/dhcp/release', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_mac: mac }),
      });
      if (doraResult?.client_mac === mac) {
        setDoraResult(null);
      }
      await loadStatus();
    } catch (err) {
      console.error(err);
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
                COURSE 20MSS56 • EXERCISE 6
              </span>
            </div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              RFC 2131 DHCP Address Allocation & State Machine Sandbox
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
              Safe, isolated demonstration of the 4-phase DORA cycle (Discover-Offer-Request-Ack) without altering OS network settings.
            </p>
          </div>

          <span className="badge-emerald-pill">
            SANDBOXED IP POOL: 192.168.10.100 - 150
          </span>
        </div>
      </SpatialGlassSurface>

      {/* Pool KPIs */}
      {serverStatus && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
          <SpatialGlassSurface style={{ padding: '18px' }} glow>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '6px' }}>
              DHCP GATEWAY & SUBNET
            </div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
              {serverStatus.gateway}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--color-emerald)', marginTop: '4px' }}>
              Subnet Mask: {serverStatus.subnet_mask}
            </div>
          </SpatialGlassSurface>

          <SpatialGlassSurface style={{ padding: '18px' }} glow>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '6px' }}>
              ACTIVE LEASES ALLOCATED
            </div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-mint)', fontFamily: 'var(--font-mono)' }}>
              {serverStatus.allocated_count} / {serverStatus.pool_size}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              {serverStatus.available_count} addresses available ({serverStatus.utilization_pct}% utilized)
            </div>
          </SpatialGlassSurface>

          <SpatialGlassSurface style={{ padding: '18px' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '6px' }}>
              PRIMARY DNS SERVER
            </div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>
              {serverStatus.dns_server}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Distributed Resolver
            </div>
          </SpatialGlassSurface>
        </div>
      )}

      {/* Interactive DORA Handshake Trigger */}
      <SpatialGlassSurface style={{ padding: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '16px', alignItems: 'flex-end' }}>
          <div>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
              SIMULATED CLIENT MAC ADDRESS
            </label>
            <input
              type="text"
              value={clientMac}
              onChange={(e) => setClientMac(e.target.value)}
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
              CLIENT HOSTNAME IDENTITY
            </label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-metallic)',
                background: 'rgba(0,0,0,0.15)',
                color: 'var(--text-primary)',
                fontSize: '0.85rem',
              }}
            />
          </div>

          <LiquidGlassButton
            variant="primary"
            onClick={handleRunDora}
            disabled={isSimulating}
            icon={<Play size={14} className={isSimulating ? 'spin-anim' : ''} />}
          >
            {isSimulating ? 'Executing DORA...' : 'Simulate 4-Phase DORA Cycle'}
          </LiquidGlassButton>
        </div>
      </SpatialGlassSurface>

      {/* DORA 4-Phase Step-by-Step Handshake Flow */}
      {doraResult && (
        <SpatialGlassSurface style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                RFC 2131 Handshake Progression for {doraResult.client_name}
              </h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                Assigned IP: <strong style={{ color: 'var(--color-emerald)', fontFamily: 'var(--font-mono)' }}>{doraResult.assigned_ip}</strong> • Lease Duration: {doraResult.lease_duration_sec}s
              </p>
            </div>
            <button
              onClick={() => handleReleaseLease(doraResult.client_mac)}
              style={{
                padding: '6px 14px',
                borderRadius: '9999px',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                background: 'rgba(239, 68, 68, 0.1)',
                color: '#ef4444',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Release Lease (DHCP_RELEASE)
            </button>
          </div>

          {/* Handshake Cards Progression */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
            {doraResult.dora_steps?.map((step, idx) => {
              const isDiscover = step.step === 'DHCP_DISCOVER';
              const isOffer = step.step === 'DHCP_OFFER';
              const isRequest = step.step === 'DHCP_REQUEST';
              const isAck = step.step === 'DHCP_ACK';

              const stepColor = isDiscover
                ? '#38bdf8'
                : isOffer
                  ? '#a78bfa'
                  : isRequest
                    ? '#f59e0b'
                    : 'var(--color-emerald)';

              return (
                <div
                  key={idx}
                  style={{
                    background: 'rgba(0,0,0,0.25)',
                    borderRadius: '12px',
                    padding: '16px',
                    border: `1px solid ${stepColor}`,
                    boxShadow: `0 0 16px ${stepColor}15`,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 800, color: stepColor }}>
                        PHASE {idx + 1}
                      </span>
                      <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                        UDP PORT 67/68
                      </span>
                    </div>
                    <h5 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 8px' }}>
                      {step.step}
                    </h5>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                      <p style={{ margin: '0 0 4px' }}><strong>Source:</strong> {step.source}</p>
                      <p style={{ margin: '0 0 4px' }}><strong>Dest:</strong> {step.destination}</p>
                      {step.offered_ip && <p style={{ margin: 0, color: stepColor }}><strong>Offered IP:</strong> {step.offered_ip}</p>}
                      {step.requested_ip && <p style={{ margin: 0, color: stepColor }}><strong>Req IP:</strong> {step.requested_ip}</p>}
                      {step.assigned_ip && <p style={{ margin: 0, color: stepColor }}><strong>Bound IP:</strong> {step.assigned_ip}</p>}
                    </div>
                  </div>

                  <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--border-metallic-subtle)' }}>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block' }}>STATE TRANSITION:</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: stepColor, fontFamily: 'var(--font-mono)' }}>
                      {step.state_transition}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </SpatialGlassSurface>
      )}

      {/* Active Lease Table */}
      {serverStatus && serverStatus.active_leases && (
        <SpatialGlassSurface style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              DHCP Server Lease Registry & Pool Allocation
            </h4>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Subnet: 192.168.10.0/24
            </span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '10px 14px' }}>CLIENT HOSTNAME</th>
                  <th style={{ padding: '10px 14px' }}>HARDWARE MAC</th>
                  <th style={{ padding: '10px 14px' }}>ASSIGNED IP</th>
                  <th style={{ padding: '10px 14px' }}>LEASE STATE</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right' }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {serverStatus.active_leases.map((l, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border-metallic-subtle)' }}>
                    <td style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {l.client_id}
                    </td>
                    <td style={{ padding: '12px 14px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                      {l.mac}
                    </td>
                    <td style={{ padding: '12px 14px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-emerald)' }}>
                      {l.ip}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        background: 'rgba(69, 245, 154, 0.12)',
                        color: 'var(--color-emerald)',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                      }}>
                        {l.state} ({Math.round(l.expires_in_sec / 60)}m left)
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                      <button
                        onClick={() => handleReleaseLease(l.mac)}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          background: 'transparent',
                          color: '#ef4444',
                          fontSize: '0.72rem',
                          cursor: 'pointer',
                        }}
                      >
                        Release
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SpatialGlassSurface>
      )}
    </div>
  );
}
