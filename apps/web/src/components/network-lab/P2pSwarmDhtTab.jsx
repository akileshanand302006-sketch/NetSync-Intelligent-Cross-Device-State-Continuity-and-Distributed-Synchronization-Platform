import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Share2,
  Play,
  RotateCcw,
  Zap,
  Layers,
  Hash,
  Binary,
} from 'lucide-react';
import SpatialGlassSurface from '../design-system/SpatialGlassSurface';
import LiquidGlassButton from '../design-system/LiquidGlassButton';
import LiquidGlassInput from '../design-system/LiquidGlassInput';
import ProvenanceBadge from '../design-system/ProvenanceBadge';
import { calculateKademliaDistance } from '../../services/api';

export default function P2pSwarmDhtTab() {
  const [nodeA, setNodeA] = useState('A1B2C3');
  const [nodeB, setNodeB] = useState('A1B2D5');
  const [dhtData, setDhtData] = useState(null);
  const [loading, setLoading] = useState(false);

  const calculate = async () => {
    setLoading(true);
    const data = await calculateKademliaDistance(nodeA, nodeB);
    if (data) setDhtData(data);
    setLoading(false);
  };

  useEffect(() => {
    calculate();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header & Inputs */}
      <SpatialGlassSurface glow style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span className="status-indicator-dot online" />
              <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--color-accent)' }}>
                TIER B5 • NETWORK INTELLIGENCE LAB
              </span>
              <ProvenanceBadge provenance="derived" rfc="Kademlia DHT" tooltip="BitTorrent Mainline DHT & Kademlia XOR metric" />
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: 700, margin: '0 0 6px 0', color: 'var(--text-primary)' }}>
              P2P Swarm & Kademlia DHT Lab
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, maxWidth: '640px' }}>
              Evaluate the non-Euclidean XOR distance metric $d(x, y) = x \oplus y$, routing tree structure, and $k$-bucket index placement that powers BitTorrent and IPFS.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div style={{ width: '130px' }}>
              <LiquidGlassInput
                value={nodeA}
                onChange={(e) => setNodeA(e.target.value)}
                placeholder="Node A Hex"
              />
            </div>
            <span style={{ color: 'var(--text-muted)' }}>⊕</span>
            <div style={{ width: '130px' }}>
              <LiquidGlassInput
                value={nodeB}
                onChange={(e) => setNodeB(e.target.value)}
                placeholder="Node B Hex"
              />
            </div>
            <LiquidGlassButton variant="primary" onClick={calculate} loading={loading} icon={<Play size={14} />}>
              Compute Metric
            </LiquidGlassButton>
          </div>
        </div>
      </SpatialGlassSurface>

      {/* DHT Distance Card */}
      {dhtData && (
        <SpatialGlassSurface style={{ padding: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '20px' }}>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>XOR Distance (Hex)</div>
              <div style={{ fontSize: '24px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--color-accent)' }}>
                {dhtData.xor_distance_hex}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>XOR Distance (Decimal)</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>
                {dhtData.xor_distance_int}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>K-Bucket Index (⌊log2(d)⌋)</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#3b82f6' }}>
                Bucket #{dhtData.k_bucket_index}
              </div>
            </div>
          </div>

          <div style={{
            padding: '16px',
            borderRadius: '12px',
            background: 'rgba(0,0,0,0.3)',
            border: '1px solid rgba(255,255,255,0.06)',
            fontSize: '12px',
          }}>
            <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
              Mathematical Properties of XOR Metric:
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
              <div>• Identity: {dhtData.metric_properties.identity}</div>
              <div>• Symmetry: {dhtData.metric_properties.symmetry}</div>
              <div>• Triangle Inequality: {dhtData.metric_properties.triangle_inequality}</div>
            </div>
          </div>
        </SpatialGlassSurface>
      )}
    </div>
  );
}
