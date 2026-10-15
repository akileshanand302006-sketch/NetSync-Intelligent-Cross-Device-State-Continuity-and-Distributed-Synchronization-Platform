import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Compass,
  ArrowRight,
  Globe,
  Lock,
  Layers,
  Terminal,
  Clock,
  Play,
  CheckCircle2,
  Cpu,
  FileCode,
  Shield,
  Zap,
} from 'lucide-react';
import SpatialGlassSurface from '../design-system/SpatialGlassSurface';
import LiquidGlassButton from '../design-system/LiquidGlassButton';
import LiquidGlassInput from '../design-system/LiquidGlassInput';
import ProvenanceBadge from '../design-system/ProvenanceBadge';
import { traceLifeOfRequest } from '../../services/api';

export default function RequestTracerTab() {
  const [url, setUrl] = useState('https://datatracker.ietf.org/doc/html/rfc9293');
  const [loading, setLoading] = useState(false);
  const [traceData, setTraceData] = useState(null);
  const [selectedStageIdx, setSelectedStageIdx] = useState(0);

  const handleRunTrace = async () => {
    setLoading(true);
    const data = await traceLifeOfRequest(url);
    if (data) {
      setTraceData(data);
      setSelectedStageIdx(0);
    }
    setLoading(false);
  };

  const selectedStage = traceData?.stages?.[selectedStageIdx];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header & Controller */}
      <SpatialGlassSurface glow style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span className="status-indicator-dot online" />
              <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--color-accent)' }}>
                TIER A1 • NETWORK INTELLIGENCE LAB
              </span>
              <ProvenanceBadge provenance="derived" rfc="RFC 9293" tooltip="Multi-layer protocol encapsulation model" />
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: 700, margin: '0 0 6px 0', color: 'var(--text-primary)' }}>
              Life-of-a-Request Tracer
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, maxWidth: '640px' }}>
              Inspect the microsecond timeline from hardware DHCP lease acquisition to ARP, recursive DNS, TCP 3-way handshake, TLS 1.3 key exchange, and HTTP/2 payload delivery.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ width: '320px' }}>
              <LiquidGlassInput
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                icon={<Globe size={15} />}
              />
            </div>
            <LiquidGlassButton
              variant="primary"
              onClick={handleRunTrace}
              loading={loading}
              icon={<Play size={15} />}
            >
              Trace Lifecycle
            </LiquidGlassButton>
          </div>
        </div>
      </SpatialGlassSurface>

      {/* Waterfall Stages Timeline */}
      {traceData && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: '20px' }}>
          {/* Left Column: Waterfall Stage Sequence */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                PROTOCOL WATERFALL ({traceData.stages.length} STAGES)
              </span>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-accent)' }}>
                Total: {traceData.total_latency_ms} ms
              </span>
            </div>

            {traceData.stages.map((stage, idx) => {
              const isSelected = selectedStageIdx === idx;
              return (
                <motion.div
                  key={stage.id}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => setSelectedStageIdx(idx)}
                  style={{
                    cursor: 'pointer',
                    padding: '14px 18px',
                    borderRadius: '14px',
                    background: isSelected ? 'rgba(16, 185, 129, 0.12)' : 'var(--color-surface-translucent)',
                    border: isSelected ? '1px solid var(--color-accent)' : '1px solid var(--color-glass-border)',
                    boxShadow: isSelected ? '0 0 16px rgba(16, 185, 129, 0.2)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '6px',
                        background: 'rgba(255,255,255,0.06)',
                        color: 'var(--text-secondary)',
                      }}>
                        STAGE {idx + 1}
                      </span>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {stage.name}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <ProvenanceBadge provenance={stage.provenance} />
                      <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-accent)' }}>
                        {stage.delay_ms} ms
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)' }}>
                    <span>{stage.protocol} • {stage.layer}</span>
                    <span style={{ color: 'var(--text-secondary)' }}>{stage.packets.length} packets</span>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Right Column: Encapsulation & Hex Inspector */}
          {selectedStage && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Encapsulation Layers Tree */}
              <SpatialGlassSurface style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Layers size={16} style={{ color: 'var(--color-accent)' }} />
                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      OSI Encapsulation Stack — {selectedStage.protocol}
                    </span>
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Layer Breakdown</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {Object.entries(selectedStage.encapsulation).map(([layerName, details]) => (
                    <div
                      key={layerName}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '10px',
                        background: 'rgba(0, 0, 0, 0.25)',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        fontSize: '12px',
                      }}
                    >
                      <div style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        color: 'var(--color-accent)',
                        marginBottom: '4px',
                      }}>
                        {layerName.replace('_', ' ')}
                      </div>
                      <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                        {details}
                      </div>
                    </div>
                  ))}
                </div>
              </SpatialGlassSurface>

              {/* Wire Hex Dump */}
              <SpatialGlassSurface style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Terminal size={15} style={{ color: '#3b82f6' }} />
                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Wire Byte Hex Dump (Offset Highlighting)
                    </span>
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Framing Preamble</span>
                </div>

                <pre style={{
                  margin: 0,
                  padding: '12px',
                  borderRadius: '10px',
                  background: 'rgba(0,0,0,0.4)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12px',
                  color: '#10b981',
                  overflowX: 'auto',
                  letterSpacing: '0.08em',
                  lineHeight: 1.6,
                }}>
                  {selectedStage.hex_snippet}
                </pre>
              </SpatialGlassSurface>

              {/* Flight Packets List */}
              <SpatialGlassSurface style={{ padding: '20px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>
                  Packet Flight Sequence
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {selectedStage.packets.map((pkt, pIdx) => (
                    <div
                      key={pIdx}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '10px',
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid var(--color-glass-border)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '12px',
                      }}
                    >
                      <div>
                        <strong style={{ color: 'var(--text-primary)' }}>{pkt.step}</strong>: {pkt.details}
                      </div>
                      <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                        {pkt.src} → {pkt.dst}
                      </div>
                    </div>
                  ))}
                </div>
              </SpatialGlassSurface>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
