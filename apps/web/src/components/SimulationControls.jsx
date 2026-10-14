import React, { useState } from 'react';
import { Play, AlertCircle, RefreshCw, Radio, Zap, ShieldAlert, CheckCircle } from 'lucide-react';

export default function SimulationControls({ onTriggerEvent }) {
  const [activeSimulation, setActiveSimulation] = useState(null);
  const [statusMessage, setStatusMessage] = useState(null);

  const runSimulation = (name, handler) => {
    setActiveSimulation(name);
    setStatusMessage(`Running: ${name}...`);
    setTimeout(() => {
      handler();
      setActiveSimulation(null);
    }, 800);
  };

  const handleSimulateConflict = () => {
    runSimulation('Concurrent Divergence', () => {
      setStatusMessage('Conflict Detected! Simultaneous writes to "cursor_pos". Applied FIELD_MERGE strategy.');
      if (onTriggerEvent) onTriggerEvent('conflict');
    });
  };

  const handleSimulateDrop = () => {
    runSimulation('Packet Loss & Retransmission', () => {
      setStatusMessage('Simulated Frame #42 dropped! AckTracker timeout triggered: Retransmitted via Exponential Backoff (1.4ms).');
      if (onTriggerEvent) onTriggerEvent('retransmit');
    });
  };

  const handleSimulateRelay = () => {
    runSimulation('Cloud Relay Fallback', () => {
      setStatusMessage('Simulated LAN isolation: Seamlessly switched socket to Cloud Relay (RTT: 68.2ms). Offline mutations queued.');
      if (onTriggerEvent) onTriggerEvent('relay');
    });
  };

  const handleSimulateBurst = () => {
    runSimulation('High-Frequency Delta Burst', () => {
      setStatusMessage('Dispatched 50 delta frames in 200ms. DeltaEngine achieved 89.2% transfer size reduction.');
      if (onTriggerEvent) onTriggerEvent('burst');
    });
  };

  return (
    <div className="glass-panel" style={{
      padding: '20px 24px',
      background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.75), rgba(30, 41, 59, 0.5))',
      border: '1px solid rgba(56, 189, 248, 0.25)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.35)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Zap size={18} color="#38bdf8" />
            <span style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc' }}>
              Interactive Network & Protocol Evaluation Suite
            </span>
            <span className="badge-pill badge-cyan" style={{ fontSize: '0.65rem' }}>Live Testbed</span>
          </div>
          <p style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '2px' }}>
            Test distributed synchronization edge-cases, packet loss recovery, and conflict merging interactively.
          </p>
        </div>

        {statusMessage && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 14px',
            background: 'rgba(56, 189, 248, 0.12)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: '9999px',
            fontSize: '0.78rem',
            color: '#38bdf8',
            maxWidth: '500px',
          }}>
            <CheckCircle size={14} color="#34d399" />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{statusMessage}</span>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <button
          onClick={handleSimulateConflict}
          disabled={!!activeSimulation}
          className="btn-secondary"
          style={{ fontSize: '0.8rem', padding: '8px 14px' }}
        >
          <ShieldAlert size={14} color="#fbbf24" />
          Test Concurrent Edit Conflict
        </button>

        <button
          onClick={handleSimulateDrop}
          disabled={!!activeSimulation}
          className="btn-secondary"
          style={{ fontSize: '0.8rem', padding: '8px 14px' }}
        >
          <RefreshCw size={14} color="#f43f5e" />
          Test Dropped Packet & Retransmit
        </button>

        <button
          onClick={handleSimulateRelay}
          disabled={!!activeSimulation}
          className="btn-secondary"
          style={{ fontSize: '0.8rem', padding: '8px 14px' }}
        >
          <Radio size={14} color="#818cf8" />
          Test LAN → Cloud Fallback
        </button>

        <button
          onClick={handleSimulateBurst}
          disabled={!!activeSimulation}
          className="btn-secondary"
          style={{ fontSize: '0.8rem', padding: '8px 14px' }}
        >
          <Zap size={14} color="#34d399" />
          Test Delta Frame Burst (50 Ops)
        </button>
      </div>
    </div>
  );
}
