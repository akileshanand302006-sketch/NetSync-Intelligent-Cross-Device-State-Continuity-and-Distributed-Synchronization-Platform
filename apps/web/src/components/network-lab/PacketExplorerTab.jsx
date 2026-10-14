import React, { useState, useEffect } from 'react';
import {
  Code2,
  Terminal,
} from 'lucide-react';
import SpatialGlassSurface from '../design-system/SpatialGlassSurface';
import LiquidGlassButton from '../design-system/LiquidGlassButton';
import { fetchPacketSamples, parseCustomPacketHex } from '../../services/api';

export default function PacketExplorerTab() {
  const [samples, setSamples] = useState([]);
  const [selectedSample, setSelectedSample] = useState(null);
  const [customHexInput, setCustomHexInput] = useState('');
  const [isParsingCustom, setIsParsingCustom] = useState(false);
  const [parseError, setParseError] = useState(null);

  useEffect(() => {
    async function loadSamples() {
      try {
        const data = await fetchPacketSamples();
        if (data && data.length > 0) {
          setSamples(data);
          setSelectedSample(data[0]);
        }
      } catch (err) {
        console.error('Failed to load packet samples:', err);
      }
    }
    loadSamples();
  }, []);

  const handleParseCustom = async () => {
    if (!customHexInput.trim()) return;
    setIsParsingCustom(true);
    setParseError(null);

    try {
      const res = await parseCustomPacketHex(customHexInput.trim());
      if (res.error) {
        setParseError(res.error);
      } else {
        setSelectedSample({
          id: `custom-${Date.now()}`,
          name: 'Custom Raw Packet Input',
          timestamp: new Date().toTimeString().split(' ')[0],
          summary: `${res.protocol_stack?.join(' / ')} • ${res.total_bytes} bytes`,
          parsed: res,
        });
      }
    } catch (err) {
      setParseError(err.message || 'Failed to decode custom packet');
    } finally {
      setIsParsingCustom(false);
    }
  };

  const currentLayers = selectedSample?.parsed?.layers || {};
  const currentHexDump = selectedSample?.parsed?.hex_dump || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Banner */}
      <SpatialGlassSurface style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span className="pulse-emerald-dot" />
              <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--color-emerald)', textTransform: 'uppercase' }}>
                COURSE 20MSS56 • EXERCISE 8 & 9
              </span>
            </div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Packet Explorer & Protocol Header Analyzer
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
              Binary-level protocol decoding of Ethernet II, IPv4/IPv6, TCP (9 control flags), and UDP headers using Python `struct.unpack`.
            </p>
          </div>

          <span className="badge-emerald-pill" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Code2 size={13} /> RFC 791 • RFC 9293 • RFC 768
          </span>
        </div>

        {/* Preset Sample Selector */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-metallic-subtle)' }}>
          {samples.map((s) => (
            <button
              key={s.id}
              onClick={() => { setSelectedSample(s); setParseError(null); }}
              style={{
                padding: '7px 14px',
                borderRadius: '9999px',
                border: '1px solid',
                borderColor: selectedSample?.id === s.id ? 'var(--color-emerald)' : 'var(--border-metallic)',
                background: selectedSample?.id === s.id ? 'rgba(69, 245, 154, 0.12)' : 'rgba(0,0,0,0.15)',
                color: selectedSample?.id === s.id ? 'var(--color-emerald)' : 'var(--text-secondary)',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {s.name}
            </button>
          ))}
        </div>
      </SpatialGlassSurface>

      {/* Main Split: Left Packet Summary & Layers | Right Hex Dump */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
        {/* Left Column: Decoded Protocol Layers */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Active Packet Header Bar */}
          <SpatialGlassSurface style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>SELECTED CAPTURE</span>
                <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', margin: '2px 0 6px' }}>
                  {selectedSample?.name || 'Packet'}
                </h4>
              </div>
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem',
                padding: '4px 8px',
                borderRadius: '6px',
                background: 'rgba(0,0,0,0.3)',
                color: 'var(--color-emerald)',
              }}>
                {selectedSample?.parsed?.total_bytes || 0} BYTES
              </span>
            </div>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
              {selectedSample?.summary}
            </p>
          </SpatialGlassSurface>

          {/* Ethernet Layer Card */}
          {currentLayers.ethernet && (
            <SpatialGlassSurface style={{ padding: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#38bdf8' }}>
                  Layer 2 • Ethernet II Frame Header (14 Bytes)
                </span>
                <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                  {currentLayers.ethernet.ethertype_hex} ({currentLayers.ethernet.payload_type})
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.8rem' }}>
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '8px 12px', borderRadius: '6px' }}>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem' }}>SOURCE MAC</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {currentLayers.ethernet.src_mac}
                  </span>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '8px 12px', borderRadius: '6px' }}>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem' }}>DESTINATION MAC</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {currentLayers.ethernet.dst_mac}
                  </span>
                </div>
              </div>
            </SpatialGlassSurface>
          )}

          {/* IPv4 Layer Card */}
          {currentLayers.ipv4 && (
            <SpatialGlassSurface style={{ padding: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-emerald)' }}>
                  Layer 3 • IPv4 Datagram Header (RFC 791)
                </span>
                <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--color-emerald)' }}>
                  {currentLayers.ipv4.protocol_name} (Proto {currentLayers.ipv4.protocol})
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', fontSize: '0.8rem', marginBottom: '10px' }}>
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '8px 12px', borderRadius: '6px' }}>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem' }}>VERSION / IHL</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-primary)' }}>
                    IPv{currentLayers.ipv4.version} • {currentLayers.ipv4.ihl_bytes}B
                  </span>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '8px 12px', borderRadius: '6px' }}>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem' }}>TTL (HOP LIMIT)</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {currentLayers.ipv4.ttl} hops
                  </span>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '8px 12px', borderRadius: '6px' }}>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem' }}>HEADER CHECKSUM</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-mint)' }}>
                    {currentLayers.ipv4.checksum}
                  </span>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.8rem' }}>
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '8px 12px', borderRadius: '6px' }}>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem' }}>SOURCE IP</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-emerald)' }}>
                    {currentLayers.ipv4.src_ip}
                  </span>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '8px 12px', borderRadius: '6px' }}>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem' }}>DESTINATION IP</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-emerald)' }}>
                    {currentLayers.ipv4.dst_ip}
                  </span>
                </div>
              </div>
            </SpatialGlassSurface>
          )}

          {/* TCP Layer Card with 9 Control Flags */}
          {currentLayers.tcp && (
            <SpatialGlassSurface style={{ padding: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#a78bfa' }}>
                  Layer 4 • TCP Segment Header (RFC 9293)
                </span>
                <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: '#a78bfa' }}>
                  Port {currentLayers.tcp.src_port} → {currentLayers.tcp.dst_port}
                </span>
              </div>

              {/* Ports & Sequence Numbers */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.8rem', marginBottom: '12px' }}>
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '8px 12px', borderRadius: '6px' }}>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem' }}>SEQUENCE NUMBER</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {currentLayers.tcp.sequence_number}
                  </span>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '8px 12px', borderRadius: '6px' }}>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem' }}>ACKNOWLEDGEMENT NUMBER</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {currentLayers.tcp.acknowledgement_number}
                  </span>
                </div>
              </div>

              {/* 9-Flag Control Bits Grid */}
              <div style={{ marginBottom: '12px' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                  TCP CONTROL FLAGS (9 BITS) • {currentLayers.tcp.flags_summary || 'NONE'}
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(9, 1fr)', gap: '4px', textAlign: 'center' }}>
                  {['CWR', 'ECE', 'URG', 'ACK', 'PSH', 'RST', 'SYN', 'FIN', 'NS'].map((flagName) => {
                    const isSet = currentLayers.tcp.flags ? currentLayers.tcp.flags[flagName] : false;
                    return (
                      <div
                        key={flagName}
                        style={{
                          padding: '6px 2px',
                          borderRadius: '6px',
                          background: isSet ? 'rgba(69, 245, 154, 0.2)' : 'rgba(0,0,0,0.2)',
                          border: isSet ? '1px solid var(--color-emerald)' : '1px solid var(--border-metallic-subtle)',
                        }}
                      >
                        <span style={{
                          fontSize: '0.65rem',
                          fontWeight: 800,
                          display: 'block',
                          color: isSet ? 'var(--color-emerald)' : 'var(--text-muted)',
                        }}>
                          {flagName}
                        </span>
                        <span style={{
                          fontSize: '0.75rem',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 700,
                          color: isSet ? 'var(--color-emerald)' : 'var(--text-secondary)',
                        }}>
                          {isSet ? '1' : '0'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Window & Checksum */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.8rem' }}>
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '8px 12px', borderRadius: '6px' }}>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem' }}>ADVERTISED WINDOW</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {currentLayers.tcp.window_size} bytes
                  </span>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '8px 12px', borderRadius: '6px' }}>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem' }}>CHECKSUM</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-mint)' }}>
                    {currentLayers.tcp.checksum}
                  </span>
                </div>
              </div>
            </SpatialGlassSurface>
          )}

          {/* UDP Layer Card */}
          {currentLayers.udp && (
            <SpatialGlassSurface style={{ padding: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-mint)' }}>
                  Layer 4 • UDP Datagram Header (RFC 768)
                </span>
                <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--color-mint)' }}>
                  Port {currentLayers.udp.src_port} → {currentLayers.udp.dst_port}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.8rem' }}>
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '8px 12px', borderRadius: '6px' }}>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem' }}>DATAGRAM LENGTH</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {currentLayers.udp.length} bytes
                  </span>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '8px 12px', borderRadius: '6px' }}>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem' }}>CHECKSUM</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-mint)' }}>
                    {currentLayers.udp.checksum}
                  </span>
                </div>
              </div>
            </SpatialGlassSurface>
          )}
        </div>

        {/* Right Column: 16-Byte Hex Dump & Custom Parser */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Hex Dump Viewer */}
          <SpatialGlassSurface style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Terminal size={15} color="var(--color-emerald)" />
                <h5 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  16-Byte Hex Dump Representation
                </h5>
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                OFFSET • HEX BYTES • ASCII
              </span>
            </div>

            <div style={{
              background: 'rgba(0, 0, 0, 0.45)',
              borderRadius: '8px',
              padding: '14px',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.76rem',
              color: '#d1d5db',
              lineHeight: 1.6,
              overflowX: 'auto',
              border: '1px solid var(--border-metallic-subtle)',
            }}>
              {currentHexDump.length > 0 ? (
                currentHexDump.map((row, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '16px', whiteSpace: 'pre' }}>
                    <span style={{ color: '#64748b' }}>{row.offset}</span>
                    <span style={{ color: 'var(--color-emerald)', flex: 1 }}>{row.hex}</span>
                    <span style={{ color: '#94a3b8' }}>|{row.ascii}|</span>
                  </div>
                ))
              ) : (
                <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '16px 0' }}>
                  No raw byte stream available.
                </div>
              )}
            </div>
          </SpatialGlassSurface>

          {/* Custom Hex Packet Injector */}
          <SpatialGlassSurface style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Code2 size={15} color="var(--color-mint)" />
              <h5 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Custom Raw Hex Packet Decoder
              </h5>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '0 0 12px' }}>
              Paste space-separated or raw hex string bytes to decode Ethernet/IP/TCP headers dynamically:
            </p>
            <textarea
              rows={3}
              value={customHexInput}
              onChange={(e) => setCustomHexInput(e.target.value)}
              placeholder="e.g. 450000281a2b400040062b3cc0a80165c0a80166..."
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                background: 'rgba(0,0,0,0.25)',
                border: '1px solid var(--border-metallic)',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.78rem',
                resize: 'none',
                marginBottom: '10px',
              }}
            />

            {parseError && (
              <div style={{ color: '#ef4444', fontSize: '0.75rem', marginBottom: '8px' }}>
                Error: {parseError}
              </div>
            )}

            <LiquidGlassButton
              variant="secondary"
              onClick={handleParseCustom}
              disabled={isParsingCustom || !customHexInput.trim()}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              {isParsingCustom ? 'Parsing Bytes...' : 'Decode Custom Hex Packet'}
            </LiquidGlassButton>
          </SpatialGlassSurface>
        </div>
      </div>
    </div>
  );
}
