import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Share2,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Layers,
  GitBranch,
} from 'lucide-react';
import SpatialGlassSurface from '../design-system/SpatialGlassSurface';
import LiquidGlassButton from '../design-system/LiquidGlassButton';
import ProvenanceBadge from '../design-system/ProvenanceBadge';
import { fetchDijkstra, fetchCountToInfinity } from '../../services/api';

export default function RoutingLabTab() {
  const [sourceNode, setSourceNode] = useState('A');
  const [loading, setLoading] = useState(false);
  const [dijkstraData, setDijkstraData] = useState(null);
  const [bfData, setBfData] = useState(null);
  const [activeSubTab, setActiveSubTab] = useState('dijkstra');

  const runAlgorithms = async () => {
    setLoading(true);
    const [dijkstra, bf] = await Promise.all([
      fetchDijkstra(sourceNode),
      fetchCountToInfinity(),
    ]);
    if (dijkstra) setDijkstraData(dijkstra);
    if (bf) setBfData(bf);
    setLoading(false);
  };

  useEffect(() => {
    runAlgorithms();
  }, [sourceNode]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header & Sub-Tab Switcher */}
      <SpatialGlassSurface glow style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span className="status-indicator-dot online" />
              <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--color-accent)' }}>
                TIER B2 • NETWORK INTELLIGENCE LAB
              </span>
              <ProvenanceBadge provenance="derived" rfc="RFC 2328" tooltip="OSPF Link-State Dijkstra & RIP Distance-Vector algorithms" />
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: 700, margin: '0 0 6px 0', color: 'var(--text-primary)' }}>
              Routing Algorithm Lab
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, maxWidth: '640px' }}>
              Compare centralized Link-State (OSPF Dijkstra) shortest-path tree construction against decentralized Distance-Vector (RIP Bellman-Ford) routing loops and count-to-infinity convergence.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', background: 'rgba(0,0,0,0.3)', padding: '4px', borderRadius: '12px' }}>
            <button
              onClick={() => setActiveSubTab('dijkstra')}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                background: activeSubTab === 'dijkstra' ? 'var(--color-accent)' : 'transparent',
                color: activeSubTab === 'dijkstra' ? '#000' : 'var(--text-secondary)',
              }}
            >
              Dijkstra Link-State
            </button>
            <button
              onClick={() => setActiveSubTab('bellman_ford')}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                background: activeSubTab === 'bellman_ford' ? 'var(--color-accent)' : 'transparent',
                color: activeSubTab === 'bellman_ford' ? '#000' : 'var(--text-secondary)',
              }}
            >
              Count-to-Infinity Loop
            </button>
          </div>
        </div>
      </SpatialGlassSurface>

      {/* Dijkstra Link-State View */}
      {activeSubTab === 'dijkstra' && dijkstraData && (
        <SpatialGlassSurface style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <GitBranch size={18} style={{ color: 'var(--color-accent)' }} />
              <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Dijkstra Shortest Path Tree from Root: Node {dijkstraData.source}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              {['A', 'B', 'C', 'D', 'E', 'F'].map((node) => (
                <button
                  key={node}
                  onClick={() => setSourceNode(node)}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    border: '1px solid var(--color-glass-border)',
                    background: sourceNode === node ? 'var(--color-accent)' : 'rgba(255,255,255,0.04)',
                    color: sourceNode === node ? '#000' : 'var(--text-primary)',
                    fontWeight: 700,
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  {node}
                </button>
              ))}
            </div>
          </div>

          {/* Routing Table Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            {Object.entries(dijkstraData.routing_table).map(([dest, info]) => (
              <div
                key={dest}
                style={{
                  padding: '12px 14px',
                  borderRadius: '10px',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--color-glass-border)',
                  fontSize: '12px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Target: Node {dest}</span>
                  <span style={{ color: 'var(--color-accent)', fontWeight: 700 }}>Cost: {info.cost}</span>
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Next Hop: {info.next_hop}</div>
                {info.path && <div style={{ color: 'var(--text-secondary)', fontSize: '11px', marginTop: '2px' }}>Path: {info.path}</div>}
              </div>
            ))}
          </div>
        </SpatialGlassSurface>
      )}

      {/* Bellman-Ford Count-to-Infinity View */}
      {activeSubTab === 'bellman_ford' && bfData && (
        <SpatialGlassSurface style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <AlertTriangle size={18} style={{ color: '#f59e0b' }} />
            <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Distance Vector Routing Loop & Poison Reverse
            </span>
          </div>

          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            When link Y–Z breaks, without Split Horizon / Poison Reverse, node Y mistakenly routes through X believing X has a cost-2 path to Z, inflating distance each round until reaching metric 16 (infinity).
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {bfData.rounds.map((rnd, idx) => (
              <div
                key={idx}
                style={{
                  padding: '10px 14px',
                  borderRadius: '10px',
                  background: rnd.round === 0 ? 'rgba(16, 185, 129, 0.08)' : (rnd.Dy_Z >= 16 ? 'rgba(239, 68, 68, 0.08)' : 'rgba(255, 255, 255, 0.02)'),
                  border: '1px solid var(--color-glass-border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '12px',
                }}
              >
                <div>
                  <strong style={{ color: 'var(--text-primary)' }}>Round {rnd.round}</strong>: {rnd.event}
                </div>
                <div style={{ display: 'flex', gap: '16px', fontFamily: 'var(--font-mono)' }}>
                  <span>D_Y(Z) = <strong style={{ color: 'var(--color-accent)' }}>{rnd.Dy_Z}</strong></span>
                  <span>D_X(Z) = <strong style={{ color: '#3b82f6' }}>{rnd.Dx_Z}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </SpatialGlassSurface>
      )}
    </div>
  );
}
