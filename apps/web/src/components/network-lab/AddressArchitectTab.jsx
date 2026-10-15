import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Layers,
  Globe,
  Play,
  RotateCcw,
  CheckCircle2,
  Copy,
  Hash,
  Binary,
} from 'lucide-react';
import SpatialGlassSurface from '../design-system/SpatialGlassSurface';
import LiquidGlassButton from '../design-system/LiquidGlassButton';
import LiquidGlassInput from '../design-system/LiquidGlassInput';
import ProvenanceBadge from '../design-system/ProvenanceBadge';
import { calculateVlsm, generateEui64 } from '../../services/api';

export default function AddressArchitectTab() {
  const [networkCidr, setNetworkCidr] = useState('192.168.1.0/24');
  const [macAddress, setMacAddress] = useState('3A:8F:C2:59:E0:11');
  const [vlsmData, setVlsmData] = useState(null);
  const [euiData, setEuiData] = useState(null);
  const [loading, setLoading] = useState(false);

  const calculate = async () => {
    setLoading(true);
    const [vlsm, eui] = await Promise.all([
      calculateVlsm(networkCidr, [50, 25, 12, 2]),
      generateEui64(macAddress, '2001:db8:acad::'),
    ]);
    if (vlsm) setVlsmData(vlsm);
    if (eui) setEuiData(eui);
    setLoading(false);
  };

  useEffect(() => {
    calculate();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <SpatialGlassSurface glow style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span className="status-indicator-dot online" />
              <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--color-accent)' }}>
                TIER B3 • NETWORK INTELLIGENCE LAB
              </span>
              <ProvenanceBadge provenance="derived" rfc="RFC 4291" tooltip="CIDR VLSM partitioning & Modified EUI-64 generation" />
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: 700, margin: '0 0 6px 0', color: 'var(--text-primary)' }}>
              Address Architect & Subnet Studio
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, maxWidth: '640px' }}>
              Design optimal Variable Length Subnet Masking (VLSM) hierarchies without address wastage, and synthesize SLAAC IPv6 Modified EUI-64 addresses directly from hardware MACs.
            </p>
          </div>

          <LiquidGlassButton variant="primary" onClick={calculate} loading={loading} icon={<Play size={14} />}>
            Recalculate
          </LiquidGlassButton>
        </div>
      </SpatialGlassSurface>

      {/* VLSM Subnet Hierarchy */}
      {vlsmData && (
        <SpatialGlassSurface style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Hash size={18} style={{ color: 'var(--color-accent)' }} />
              <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                IPv4 VLSM Subnet Allocation ({vlsmData.base_network})
              </span>
            </div>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              {vlsmData.total_subnets} Subnets Allocated
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {vlsmData.subnets.map((sub, idx) => (
              <div
                key={idx}
                style={{
                  padding: '12px 16px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--color-glass-border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '12px',
                  flexWrap: 'wrap',
                  gap: '8px',
                }}
              >
                <div>
                  <strong style={{ color: 'var(--color-accent)', fontSize: '13px' }}>{sub.subnet_id}</strong>
                  <span style={{ margin: '0 8px', color: 'var(--text-muted)' }}>•</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-primary)' }}>{sub.cidr}</span>
                </div>

                <div style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                  Hosts: <strong style={{ color: 'var(--text-primary)' }}>{sub.usable_hosts}</strong> ({sub.host_range})
                </div>

                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  Bcast: {sub.broadcast_ip}
                </div>
              </div>
            ))}
          </div>
        </SpatialGlassSurface>
      )}

      {/* IPv6 SLAAC EUI-64 Card */}
      {euiData && (
        <SpatialGlassSurface style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <Binary size={18} style={{ color: '#3b82f6' }} />
            <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
              IPv6 Stateless Address Autoconfiguration (SLAAC) Modified EUI-64
            </span>
          </div>

          <div style={{
            padding: '16px',
            borderRadius: '12px',
            background: 'rgba(0,0,0,0.3)',
            border: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            fontSize: '12px',
          }}>
            <div>Source Hardware MAC: <strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{euiData.mac_address}</strong></div>
            <div>Inserted Octets: <strong style={{ color: 'var(--color-accent)' }}>{euiData.inserted_octets}</strong></div>
            <div>Universal/Local Bit Inverted: <strong style={{ color: '#3b82f6' }}>b7 inverted (0x02)</strong></div>
            <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid var(--color-glass-border)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Synthesized Global IPv6 Address:</span>
              <div style={{ fontSize: '15px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-accent)', marginTop: '4px' }}>
                {euiData.full_ipv6_address}/64
              </div>
            </div>
          </div>
        </SpatialGlassSurface>
      )}
    </div>
  );
}
