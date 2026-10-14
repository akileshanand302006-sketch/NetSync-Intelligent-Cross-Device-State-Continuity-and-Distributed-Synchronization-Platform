import React, { useState } from 'react';
import {
  Shield,
  Activity,
  Search,
  Globe,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Lock,
  RefreshCw,
  Send,
} from 'lucide-react';
import SpatialGlassSurface from '../design-system/SpatialGlassSurface';
import LiquidGlassButton from '../design-system/LiquidGlassButton';
import { scanTargetPorts, runDnsDiagnostics } from '../../services/api';

export default function ConnectivityDiagnosticsTab() {
  const [activeSubTab, setActiveSubTab] = useState('ports'); // 'ports' | 'dns'
  const [targetHost, setTargetHost] = useState('127.0.0.1');
  const [selectedPorts, setSelectedPorts] = useState([80, 443, 5173, 8000, 9100, 5353]);
  const [customPortInput, setCustomPortInput] = useState('');
  const [timeoutSec, setTimeoutSec] = useState(0.8);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [scanError, setScanError] = useState(null);

  // DNS Diag State
  const [dnsHost, setDnsHost] = useState('localhost');
  const [isDnsLoading, setIsDnsLoading] = useState(false);
  const [dnsResult, setDnsResult] = useState(null);

  const togglePort = (p) => {
    setSelectedPorts((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p].sort((a, b) => a - b)
    );
  };

  const handleAddCustomPort = () => {
    const val = parseInt(customPortInput, 10);
    if (!isNaN(val) && val >= 1 && val <= 65535 && !selectedPorts.includes(val)) {
      setSelectedPorts((prev) => [...prev, val].sort((a, b) => a - b));
      setCustomPortInput('');
    }
  };

  const handleExecutePortScan = async () => {
    if (selectedPorts.length === 0) return;
    setIsScanning(true);
    setScanError(null);
    setScanResult(null);

    try {
      const res = await scanTargetPorts({
        host: targetHost,
        ports: selectedPorts,
        timeout_sec: Number(timeoutSec),
      });
      setScanResult(res);
    } catch (err) {
      setScanError(err.message || 'Port diagnostic scan failed');
    } finally {
      setIsScanning(false);
    }
  };

  const handleExecuteDns = async () => {
    if (!dnsHost.trim()) return;
    setIsDnsLoading(true);
    try {
      const res = await runDnsDiagnostics(dnsHost.trim());
      setDnsResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsDnsLoading(false);
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
                COURSE 20MSS56 • EXERCISE 5
              </span>
            </div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Connectivity & Port Reachability Diagnostics
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
              Safe TCP connect diagnostics with accurate 4-state classification (OPEN, CLOSED, FILTERED, ERROR) and DNS resolution.
            </p>
          </div>

          {/* Sub-tab Switcher */}
          <div style={{
            display: 'inline-flex',
            padding: '4px',
            borderRadius: '9999px',
            background: 'rgba(0,0,0,0.2)',
            border: '1px solid var(--border-metallic)',
            gap: '4px',
          }}>
            <button
              onClick={() => setActiveSubTab('ports')}
              style={{
                padding: '6px 16px',
                borderRadius: '9999px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: 700,
                background: activeSubTab === 'ports' ? 'var(--color-emerald)' : 'transparent',
                color: activeSubTab === 'ports' ? '#03100b' : 'var(--text-secondary)',
                transition: 'all 0.2s ease',
              }}
            >
              Target Port Diagnostics
            </button>
            <button
              onClick={() => setActiveSubTab('dns')}
              style={{
                padding: '6px 16px',
                borderRadius: '9999px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: 700,
                background: activeSubTab === 'dns' ? 'var(--color-emerald)' : 'transparent',
                color: activeSubTab === 'dns' ? '#03100b' : 'var(--text-secondary)',
                transition: 'all 0.2s ease',
              }}
            >
              DNS Resolution Diagnostic
            </button>
          </div>
        </div>
      </SpatialGlassSurface>

      {/* View A: Port Diagnostics */}
      {activeSubTab === 'ports' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <SpatialGlassSurface style={{ padding: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  TARGET IP (RFC 1918 / LOCALHOST ONLY)
                </label>
                <input
                  type="text"
                  value={targetHost}
                  onChange={(e) => setTargetHost(e.target.value)}
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
                  CONNECTION TIMEOUT ({timeoutSec}s)
                </label>
                <input
                  type="range"
                  min="0.2"
                  max="2.0"
                  step="0.1"
                  value={timeoutSec}
                  onChange={(e) => setTimeoutSec(Number(e.target.value))}
                  style={{ width: '100%', marginTop: '6px' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <LiquidGlassButton
                  variant="primary"
                  onClick={handleExecutePortScan}
                  disabled={isScanning || selectedPorts.length === 0}
                  icon={<Search size={14} className={isScanning ? 'spin-anim' : ''} />}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  {isScanning ? 'Testing Ports...' : `Scan ${selectedPorts.length} Selected Ports`}
                </LiquidGlassButton>
              </div>
            </div>

            {/* Quick Port Badges */}
            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-metallic-subtle)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                SELECTED TEST PORTS (CLICK TO TOGGLE):
              </span>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                {[
                  { port: 80, label: '80 (HTTP)' },
                  { port: 443, label: '443 (HTTPS)' },
                  { port: 5173, label: '5173 (Vite UI)' },
                  { port: 8000, label: '8000 (NetSync API)' },
                  { port: 9100, label: '9100 (P2P Sockets)' },
                  { port: 5353, label: '5353 (mDNS)' },
                  { port: 22, label: '22 (SSH)' },
                  { port: 53, label: '53 (DNS)' },
                ].map((item) => {
                  const isChecked = selectedPorts.includes(item.port);
                  return (
                    <button
                      key={item.port}
                      onClick={() => togglePort(item.port)}
                      style={{
                        padding: '5px 12px',
                        borderRadius: '9999px',
                        border: '1px solid',
                        borderColor: isChecked ? 'var(--color-emerald)' : 'var(--border-metallic)',
                        background: isChecked ? 'rgba(69, 245, 154, 0.12)' : 'rgba(0,0,0,0.15)',
                        color: isChecked ? 'var(--color-emerald)' : 'var(--text-muted)',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {item.label}
                    </button>
                  );
                })}

                {/* Custom Port Adder */}
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <input
                    type="number"
                    placeholder="Add Port"
                    value={customPortInput}
                    onChange={(e) => setCustomPortInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddCustomPort()}
                    style={{
                      width: '80px',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-metallic)',
                      background: 'rgba(0,0,0,0.2)',
                      color: 'var(--text-primary)',
                      fontSize: '0.75rem',
                      fontFamily: 'var(--font-mono)',
                    }}
                  />
                  <button
                    onClick={handleAddCustomPort}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-metallic)',
                      background: 'rgba(255,255,255,0.08)',
                      color: 'var(--text-primary)',
                      fontSize: '0.72rem',
                      cursor: 'pointer',
                    }}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </SpatialGlassSurface>

          {/* Results Table */}
          {scanResult && (
            <SpatialGlassSurface style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                    Diagnostic Results for {scanResult.target}
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                    {scanResult.open_count} Open • {scanResult.closed_count} Closed • {scanResult.filtered_count} Filtered
                  </p>
                </div>
                <span className="badge-emerald-pill">
                  {scanResult.results?.length} Ports Evaluated
                </span>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                      <th style={{ padding: '10px 14px' }}>PORT</th>
                      <th style={{ padding: '10px 14px' }}>IDENTIFIED SERVICE</th>
                      <th style={{ padding: '10px 14px' }}>TCP HANDSHAKE RTT</th>
                      <th style={{ padding: '10px 14px', textAlign: 'right' }}>CLASSIFICATION STATE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scanResult.results?.map((r, idx) => {
                      const isOpen = r.state === 'OPEN';
                      const isClosed = r.state === 'CLOSED';
                      const isFiltered = r.state === 'FILTERED';

                      return (
                        <tr key={idx} style={{ borderBottom: '1px solid var(--border-metallic-subtle)' }}>
                          <td style={{ padding: '12px 14px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-primary)' }}>
                            {r.port} / TCP
                          </td>
                          <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>
                            {r.service}
                          </td>
                          <td style={{ padding: '12px 14px', fontFamily: 'var(--font-mono)', color: isOpen ? 'var(--color-emerald)' : 'var(--text-muted)' }}>
                            {r.rtt_ms > 0 ? `${r.rtt_ms.toFixed(1)} ms` : '—'}
                          </td>
                          <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              padding: '3px 10px',
                              borderRadius: '9999px',
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              background: isOpen
                                ? 'rgba(69, 245, 154, 0.15)'
                                : isClosed
                                  ? 'rgba(234, 179, 8, 0.15)'
                                  : 'rgba(56, 189, 248, 0.15)',
                              color: isOpen
                                ? 'var(--color-emerald)'
                                : isClosed
                                  ? '#eab308'
                                  : '#38bdf8',
                            }}>
                              {isOpen ? <CheckCircle2 size={12} /> : isClosed ? <XCircle size={12} /> : <Clock size={12} />}
                              {r.state}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Course Note */}
              <div style={{ marginTop: '16px', padding: '12px 16px', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                <strong>Port Classification Mechanics:</strong> <code>OPEN</code> means TCP 3-way handshake succeeded with SYN-ACK; <code>CLOSED</code> received an immediate TCP RST/ACK refusal; <code>FILTERED</code> timed out, indicating network silent drop by a packet filter or firewall.
              </div>
            </SpatialGlassSurface>
          )}
        </div>
      )}

      {/* View B: DNS Diagnostics */}
      {activeSubTab === 'dns' && (
        <SpatialGlassSurface style={{ padding: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '16px', marginBottom: '20px' }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                HOSTNAME OR DOMAIN TO RESOLVE
              </label>
              <input
                type="text"
                value={dnsHost}
                onChange={(e) => setDnsHost(e.target.value)}
                placeholder="e.g. localhost, google.com, gateway.lan"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-metallic)',
                  background: 'rgba(0,0,0,0.15)',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <LiquidGlassButton
                variant="primary"
                onClick={handleExecuteDns}
                disabled={isDnsLoading}
                icon={<Globe size={14} className={isDnsLoading ? 'spin-anim' : ''} />}
              >
                {isDnsLoading ? 'Resolving...' : 'Lookup DNS'}
              </LiquidGlassButton>
            </div>
          </div>

          {dnsResult && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '16px' }}>
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '14px', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>CANONICAL HOSTNAME</span>
                <p style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-primary)', margin: '4px 0' }}>
                  {dnsResult.canonical_name || dnsHost}
                </p>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '14px', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>RESOLVED A RECORDS</span>
                <p style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-emerald)', margin: '4px 0' }}>
                  {dnsResult.resolved_ips?.join(', ') || 'None'}
                </p>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '14px', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>REVERSE PTR LOOKUP</span>
                <p style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#38bdf8', margin: '4px 0' }}>
                  {dnsResult.reverse_ptr || 'N/A'}
                </p>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '14px', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>RESOLUTION DURATION</span>
                <p style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-mint)', margin: '4px 0' }}>
                  {dnsResult.duration_ms?.toFixed(2)} ms
                </p>
              </div>
            </div>
          )}
        </SpatialGlassSurface>
      )}
    </div>
  );
}
