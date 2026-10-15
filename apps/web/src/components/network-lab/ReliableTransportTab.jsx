import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Layers,
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import SpatialGlassSurface from '../design-system/SpatialGlassSurface';
import LiquidGlassButton from '../design-system/LiquidGlassButton';
import ProvenanceBadge from '../design-system/ProvenanceBadge';
import { simulateReliableTransport } from '../../services/api';

export default function ReliableTransportTab() {
  const [protocol, setProtocol] = useState('go_back_n');
  const [windowSize, setWindowSize] = useState(4);
  const [totalPackets, setTotalPackets] = useState(12);
  const [dropIndices, setDropIndices] = useState([3, 7]);
  const [loading, setLoading] = useState(false);
  const [simData, setSimData] = useState(null);

  const runSim = async (proto = protocol) => {
    setLoading(true);
    const data = await simulateReliableTransport({
      protocol: proto,
      window_size: Number(windowSize),
      total_packets: Number(totalPackets),
      drop_packets: dropIndices,
    });
    if (data) {
      setSimData(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    runSim();
  }, [protocol, windowSize, totalPackets]);

  const toggleDropIndex = (idx) => {
    setDropIndices((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header & Protocol Selection */}
      <SpatialGlassSurface glow style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span className="status-indicator-dot online" />
              <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--color-accent)' }}>
                TIER A3 • NETWORK INTELLIGENCE LAB
              </span>
              <ProvenanceBadge provenance="simulated" rfc="RFC 9293" tooltip="ARQ Sliding Window simulation (Stop-and-Wait, GBN, Selective Repeat)" />
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: 700, margin: '0 0 6px 0', color: 'var(--text-primary)' }}>
              Reliable Transport Lab
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, maxWidth: '640px' }}>
              Simulate sliding-window Automatic Repeat reQuest (ARQ) protocols. Compare Cumulative ACKs vs Selective ACKs and observe timeout retransmissions over lossy channels.
            </p>
          </div>

          {/* Protocol Switcher */}
          <div style={{ display: 'flex', gap: '8px', background: 'rgba(0,0,0,0.3)', padding: '4px', borderRadius: '12px' }}>
            {[
              { id: 'stop_and_wait', label: 'Stop-and-Wait (ARQ)' },
              { id: 'go_back_n', label: 'Go-Back-N (GBN)' },
              { id: 'selective_repeat', label: 'Selective Repeat (SR)' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setProtocol(p.id)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: protocol === p.id ? 'var(--color-accent)' : 'transparent',
                  color: protocol === p.id ? '#000' : 'var(--text-secondary)',
                  transition: 'all 0.15s ease',
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Configuration Bar */}
        <div style={{
          display: 'flex',
          gap: '24px',
          alignItems: 'center',
          flexWrap: 'wrap',
          marginTop: '20px',
          paddingTop: '16px',
          borderTop: '1px solid var(--color-glass-border)',
        }}>
          {protocol !== 'stop_and_wait' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Send Window (N):</span>
              <input
                type="range"
                min="2"
                max="8"
                value={windowSize}
                onChange={(e) => setWindowSize(e.target.value)}
                style={{ accentColor: 'var(--color-accent)', width: '100px' }}
              />
              <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{windowSize}</strong>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Total Packets:</span>
            <input
              type="range"
              min="8"
              max="24"
              value={totalPackets}
              onChange={(e) => setTotalPackets(e.target.value)}
              style={{ accentColor: 'var(--color-accent)', width: '100px' }}
            />
            <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{totalPackets}</strong>
          </div>

          <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px' }}>
            <LiquidGlassButton variant="primary" onClick={() => runSim()} loading={loading} icon={<Play size={14} />}>
              Run Simulation
            </LiquidGlassButton>
          </div>
        </div>
      </SpatialGlassSurface>

      {/* Interactive Packet Sequence Strip */}
      <SpatialGlassSurface style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Frame Injection Strip (Click to toggle loss in flight)
            </span>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Red packets will be dropped by the simulated link on first transmission.
            </div>
          </div>

          {simData && (
            <div style={{ display: 'flex', gap: '16px', fontSize: '12px' }}>
              <div>
                Transmissions: <strong style={{ color: 'var(--text-primary)' }}>{simData.total_transmissions}</strong>
              </div>
              <div>
                Channel Efficiency: <strong style={{ color: 'var(--color-accent)' }}>{simData.efficiency_percent}%</strong>
              </div>
            </div>
          )}
        </div>

        {/* Packet Slots */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '6px' }}>
          {Array.from({ length: totalPackets }).map((_, idx) => {
            const isDropped = dropIndices.includes(idx);
            return (
              <button
                key={idx}
                onClick={() => toggleDropIndex(idx)}
                style={{
                  minWidth: '44px',
                  height: '52px',
                  borderRadius: '10px',
                  border: isDropped ? '1px solid #ef4444' : '1px solid var(--color-glass-border)',
                  background: isDropped ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                  color: isDropped ? '#ef4444' : 'var(--text-primary)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <span style={{ fontSize: '10px', fontWeight: 700 }}>PKT</span>
                <span style={{ fontSize: '13px', fontWeight: 700 }}>#{idx}</span>
              </button>
            );
          })}
        </div>
      </SpatialGlassSurface>

      {/* Step-by-Step Transmission Log */}
      {simData?.events && (
        <SpatialGlassSurface style={{ padding: '24px' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px' }}>
            Transmission Timeline & Window Sliding Events ({simData.events.length} steps)
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '340px', overflowY: 'auto' }}>
            {simData.events.map((evt, idx) => {
              const isDrop = evt.status.includes('DROP') || evt.status.includes('FAIL');
              const isFlush = evt.status.includes('FLUSH');
              return (
                <div
                  key={idx}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '10px',
                    background: isDrop
                      ? 'rgba(239, 68, 68, 0.08)'
                      : isFlush
                      ? 'rgba(245, 158, 11, 0.08)'
                      : 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--color-glass-border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: 'rgba(255,255,255,0.06)',
                      color: 'var(--text-secondary)',
                    }}>
                      T+{evt.step}
                    </span>
                    <strong style={{ color: isDrop ? '#ef4444' : (isFlush ? '#f59e0b' : 'var(--text-primary)') }}>
                      {evt.action}
                    </strong>
                    <span style={{ color: 'var(--text-secondary)' }}>{evt.details}</span>
                  </div>

                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>
                    Window: [{evt.window?.join(', ')}]
                  </div>
                </div>
              );
            })}
          </div>
        </SpatialGlassSurface>
      )}
    </div>
  );
}
