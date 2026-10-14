import React, { useState } from 'react';
import {
  Radio,
  Clock,
  Zap,
  Activity,
  Shield,
  RefreshCw,
  Send,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  TrendingDown,
  Globe,
} from 'lucide-react';
import SpatialGlassSurface from '../design-system/SpatialGlassSurface';
import LiquidGlassButton from '../design-system/LiquidGlassButton';
import { runTcpProbe, runUdpProbe } from '../../services/api';

export default function SocketToolkitTab() {
  const [protocol, setProtocol] = useState('TCP'); // 'TCP' | 'UDP' | 'NTP'
  const [targetHost, setTargetHost] = useState('127.0.0.1');
  const [targetPort, setTargetPort] = useState(9100);
  const [payloadSize, setPayloadSize] = useState(64);
  const [packetCount, setPacketCount] = useState(5);
  const [timeoutSec, setTimeoutSec] = useState(2.0);
  const [isLoading, setIsLoading] = useState(false);
  const [probeResult, setProbeResult] = useState(null);
  const [ntpResult, setNtpResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleExecuteProbe = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    setProbeResult(null);

    try {
      if (protocol === 'TCP') {
        const res = await runTcpProbe({
          host: targetHost,
          port: Number(targetPort),
          payload_size: Number(payloadSize),
          count: Number(packetCount),
          timeout_sec: Number(timeoutSec),
        });
        setProbeResult(res);
      } else if (protocol === 'UDP') {
        const res = await runUdpProbe({
          host: targetHost,
          port: Number(targetPort),
          payload_size: Number(payloadSize),
          count: Number(packetCount),
          timeout_sec: Number(timeoutSec),
        });
        setProbeResult(res);
      } else if (protocol === 'NTP') {
        const res = await fetch('/api/v1/lab/socket/time', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ host: targetHost === '127.0.0.1' ? 'time.cloudflare.com' : targetHost, port: 123 }),
        });
        const data = await res.json();
        setNtpResult(data);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Probe execution failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Control Banner */}
      <SpatialGlassSurface style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span className="pulse-emerald-dot" />
              <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--color-emerald)', textTransform: 'uppercase' }}>
                COURSE 20MSS56 • EXERCISE 1 & 2
              </span>
            </div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              TCP & UDP Socket Diagnostic Toolkit
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
              Real empirical byte-stream vs unreliable datagram timing using high-resolution monotonic clocks.
            </p>
          </div>

          {/* Protocol Toggle */}
          <div style={{
            display: 'inline-flex',
            padding: '4px',
            borderRadius: '9999px',
            background: 'rgba(0,0,0,0.2)',
            border: '1px solid var(--border-metallic)',
            gap: '4px',
          }}>
            {['TCP', 'UDP', 'NTP'].map((p) => (
              <button
                key={p}
                onClick={() => { setProtocol(p); setProbeResult(null); setNtpResult(null); }}
                style={{
                  padding: '6px 16px',
                  borderRadius: '9999px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  background: protocol === p ? 'var(--color-emerald)' : 'transparent',
                  color: protocol === p ? '#03100b' : 'var(--text-secondary)',
                  transition: 'all 0.2s ease',
                }}
              >
                {p === 'TCP' ? 'TCP Byte Stream' : p === 'UDP' ? 'UDP Datagrams' : 'RFC 5905 NTP'}
              </button>
            ))}
          </div>
        </div>

        {/* Configuration Parameters */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '16px',
          marginTop: '20px',
          paddingTop: '20px',
          borderTop: '1px solid var(--border-metallic-subtle)',
        }}>
          <div>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
              TARGET HOST (LOOPBACK / RFC 1918)
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
              TARGET PORT
            </label>
            <input
              type="number"
              value={targetPort}
              onChange={(e) => setTargetPort(Number(e.target.value))}
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

          {protocol !== 'NTP' && (
            <>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  PAYLOAD SIZE ({payloadSize} BYTES)
                </label>
                <input
                  type="range"
                  min="32"
                  max="4096"
                  step="32"
                  value={payloadSize}
                  onChange={(e) => setPayloadSize(Number(e.target.value))}
                  style={{ width: '100%', marginTop: '6px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  PROBE COUNT ({packetCount} BURSTS)
                </label>
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={packetCount}
                  onChange={(e) => setPacketCount(Number(e.target.value))}
                  style={{ width: '100%', marginTop: '6px' }}
                />
              </div>
            </>
          )}

          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <LiquidGlassButton
              variant="primary"
              onClick={handleExecuteProbe}
              disabled={isLoading}
              icon={<Send size={14} className={isLoading ? 'spin-anim' : ''} />}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              {isLoading ? 'Executing Probe...' : `Run ${protocol} Diagnostic`}
            </LiquidGlassButton>
          </div>
        </div>
      </SpatialGlassSurface>

      {/* Results Section */}
      {errorMsg && (
        <SpatialGlassSurface style={{ padding: '16px 20px', borderLeft: '4px solid #ef4444' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#ef4444' }}>
            <AlertTriangle size={18} />
            <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>{errorMsg}</span>
          </div>
        </SpatialGlassSurface>
      )}

      {probeResult && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* KPI Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
            {protocol === 'TCP' && (
              <SpatialGlassSurface style={{ padding: '18px' }} glow>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '6px' }}>
                  SYN-ACK SETUP LATENCY
                </div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                  {probeResult.connection_time_ms?.toFixed(2) || '0.00'} <span style={{ fontSize: '0.9rem', color: 'var(--color-emerald)' }}>ms</span>
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  3-Way Handshake Connection Time
                </div>
              </SpatialGlassSurface>
            )}

            <SpatialGlassSurface style={{ padding: '18px' }} glow>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '6px' }}>
                MEAN ROUND-TRIP (RTT)
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                {probeResult.avg_rtt_ms?.toFixed(2) || '0.00'} <span style={{ fontSize: '0.9rem', color: 'var(--color-emerald)' }}>ms</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Min: {probeResult.min_rtt_ms?.toFixed(2)}ms • Max: {probeResult.max_rtt_ms?.toFixed(2)}ms
              </div>
            </SpatialGlassSurface>

            <SpatialGlassSurface style={{ padding: '18px' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '6px' }}>
                EMPIRICAL JITTER
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                {probeResult.jitter_ms?.toFixed(2) || '0.00'} <span style={{ fontSize: '0.9rem', color: '#a78bfa' }}>ms</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                RTT Dispersion Variance
              </div>
            </SpatialGlassSurface>

            {protocol === 'UDP' && (
              <SpatialGlassSurface style={{ padding: '18px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '6px' }}>
                  DATAGRAM LOSS RATE
                </div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: probeResult.packet_loss_rate > 0 ? '#ef4444' : 'var(--color-emerald)', fontFamily: 'var(--font-mono)' }}>
                  {((probeResult.packet_loss_rate || 0) * 100).toFixed(1)} <span style={{ fontSize: '0.9rem' }}>%</span>
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  {probeResult.packets_received} recvd / {probeResult.packets_sent} sent • Out-of-order: {probeResult.out_of_order_count || 0}
                </div>
              </SpatialGlassSurface>
            )}

            {protocol === 'TCP' && (
              <SpatialGlassSurface style={{ padding: '18px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '6px' }}>
                  ESTIMATED THROUGHPUT
                </div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                  {probeResult.throughput_mbps?.toFixed(1) || '0.0'} <span style={{ fontSize: '0.9rem', color: 'var(--color-mint)' }}>Mbps</span>
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Streaming Byte Bandwidth
                </div>
              </SpatialGlassSurface>
            )}
          </div>

          {/* RTT Samples Visualizer */}
          {probeResult.rtt_samples_ms && probeResult.rtt_samples_ms.length > 0 && (
            <SpatialGlassSurface style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  Per-Packet Monotonic RTT Dispersion Samples
                </h4>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {probeResult.rtt_samples_ms.length} Sampled Packets
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '100px', padding: '8px 0' }}>
                {probeResult.rtt_samples_ms.map((sample, idx) => {
                  const maxVal = Math.max(...probeResult.rtt_samples_ms, 1);
                  const heightPct = Math.max(10, (sample / maxVal) * 100);
                  return (
                    <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                      <span style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--color-emerald)', fontWeight: 700 }}>
                        {sample.toFixed(1)}ms
                      </span>
                      <div
                        style={{
                          width: '100%',
                          height: `${heightPct}%`,
                          background: 'linear-gradient(180deg, var(--color-emerald) 0%, rgba(69, 245, 154, 0.2) 100%)',
                          borderRadius: '4px 4px 0 0',
                          border: '1px solid var(--border-emerald-glow)',
                        }}
                      />
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                        #{idx + 1}
                      </span>
                    </div>
                  );
                })}
              </div>
            </SpatialGlassSurface>
          )}

          {/* Educational Callout */}
          <SpatialGlassSurface style={{ padding: '16px 20px', background: 'rgba(69, 245, 154, 0.04)' }}>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              <strong style={{ color: 'var(--color-emerald)' }}>Academic Principle (20MSS56):</strong>{' '}
              {protocol === 'TCP'
                ? 'TCP establishes connection state via 3-way handshake (SYN, SYN-ACK, ACK), guaranteeing ordered reliable streaming via sliding windows. Note that connection establishment latency is measured separately from request/response round-trip delay.'
                : 'UDP does not establish a connection, allocate state buffers, or guarantee delivery. Datagrams may arrive out-of-order, be duplicated, or drop silently. Our probe tracks sequence numbers in datagram headers to accurately compute loss and jitter.'}
            </div>
          </SpatialGlassSurface>
        </div>
      )}

      {ntpResult && (
        <SpatialGlassSurface style={{ padding: '24px' }}>
          <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px' }}>
            RFC 5905 Network Time Protocol (NTP) Diagnostics
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>NTP SERVER</span>
              <p style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-emerald)', margin: '4px 0' }}>
                {ntpResult.server}:{ntpResult.port}
              </p>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>STRATUM LEVEL</span>
              <p style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-primary)', margin: '4px 0' }}>
                Stratum {ntpResult.stratum} ({ntpResult.stratum === 1 ? 'Atomic Clock Primary' : 'Secondary Server'})
              </p>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>MEASURED NETWORK RTT</span>
              <p style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-emerald)', margin: '4px 0' }}>
                {ntpResult.round_trip_delay_ms?.toFixed(2)} ms
              </p>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>LOCAL CLOCK OFFSET</span>
              <p style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#38bdf8', margin: '4px 0' }}>
                {ntpResult.clock_offset_sec > 0 ? '+' : ''}{ntpResult.clock_offset_sec?.toFixed(4)} sec
              </p>
            </div>
          </div>
          <div style={{ marginTop: '16px', padding: '12px', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            <strong>Wall Clock vs Monotonic Clock:</strong> Wall clock represents calendar time subject to leap seconds and NTP step adjustments; monotonic clocks advance strictly forward without timezone resets, making them essential for network RTT benchmarks.
          </div>
        </SpatialGlassSurface>
      )}
    </div>
  );
}
