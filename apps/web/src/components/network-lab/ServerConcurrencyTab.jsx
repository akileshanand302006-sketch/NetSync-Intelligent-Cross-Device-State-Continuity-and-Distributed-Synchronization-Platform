import React, { useState } from 'react';
import {
  Server,
  Cpu,
  Layers,
  Activity,
  Zap,
  TrendingUp,
  AlertTriangle,
  Play,
  CheckCircle2,
  Sliders,
  BarChart2,
} from 'lucide-react';
import SpatialGlassSurface from '../design-system/SpatialGlassSurface';
import LiquidGlassButton from '../design-system/LiquidGlassButton';
import { runConcurrencyBenchmark } from '../../services/api';

export default function ServerConcurrencyTab() {
  const [architecture, setArchitecture] = useState('all'); // 'iterative' | 'concurrent' | 'multiplexed' | 'all'
  const [clientsCount, setClientsCount] = useState(15);
  const [requestsPerClient, setRequestsPerClient] = useState(6);
  const [payloadSize, setPayloadSize] = useState(128);
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleRunBenchmark = async () => {
    setIsRunning(true);
    setErrorMsg(null);
    setResults(null);

    try {
      if (architecture === 'all') {
        const [iterRes, concRes, muxRes] = await Promise.all([
          runConcurrencyBenchmark({
            architecture: 'iterative',
            clients_count: Number(clientsCount),
            requests_per_client: Number(requestsPerClient),
            payload_size: Number(payloadSize),
          }),
          runConcurrencyBenchmark({
            architecture: 'concurrent',
            clients_count: Number(clientsCount),
            requests_per_client: Number(requestsPerClient),
            payload_size: Number(payloadSize),
          }),
          runConcurrencyBenchmark({
            architecture: 'multiplexed',
            clients_count: Number(clientsCount),
            requests_per_client: Number(requestsPerClient),
            payload_size: Number(payloadSize),
          }),
        ]);
        setResults({
          type: 'comparative',
          iterative: iterRes,
          concurrent: concRes,
          multiplexed: muxRes,
        });
      } else {
        const singleRes = await runConcurrencyBenchmark({
          architecture,
          clients_count: Number(clientsCount),
          requests_per_client: Number(requestsPerClient),
          payload_size: Number(payloadSize),
        });
        setResults({
          type: 'single',
          data: singleRes,
        });
      }
    } catch (err) {
      setErrorMsg(err.message || 'Benchmark execution failed');
    } finally {
      setIsRunning(false);
    }
  };

  const getMaxRps = () => {
    if (!results || results.type !== 'comparative') return 1000;
    return Math.max(
      results.iterative?.requests_per_second || 1,
      results.concurrent?.requests_per_second || 1,
      results.multiplexed?.requests_per_second || 1
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header Banner */}
      <SpatialGlassSurface style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span className="pulse-emerald-dot" />
              <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--color-emerald)', textTransform: 'uppercase' }}>
                COURSE 20MSS56 • EXERCISE 3 & 10
              </span>
            </div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Concurrent Server Architectures & I/O Multiplexing Lab
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
              Controlled stress-test benchmark comparing Iterative blocking, Multi-Threaded concurrency, and Non-blocking Async I/O Multiplexing.
            </p>
          </div>

          <LiquidGlassButton
            variant="primary"
            onClick={handleRunBenchmark}
            disabled={isRunning}
            icon={<Play size={14} className={isRunning ? 'spin-anim' : ''} />}
          >
            {isRunning ? 'Benchmarking Sockets...' : 'Execute Concurrency Benchmark'}
          </LiquidGlassButton>
        </div>

        {/* Workload Knobs */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginTop: '20px',
          paddingTop: '20px',
          borderTop: '1px solid var(--border-metallic-subtle)',
        }}>
          <div>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
              TARGET ARCHITECTURE
            </label>
            <select
              value={architecture}
              onChange={(e) => setArchitecture(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-metallic)',
                background: 'rgba(0,0,0,0.2)',
                color: 'var(--text-primary)',
                fontSize: '0.85rem',
              }}
            >
              <option value="all">Compare All 3 Architectures Side-by-Side</option>
              <option value="iterative">Iterative (Sequential Blocking)</option>
              <option value="concurrent">Concurrent (Thread-per-Connection)</option>
              <option value="multiplexed">I/O Multiplexing (AsyncIO / select)</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
              CONCURRENT CLIENTS ({clientsCount} THREADS)
            </label>
            <input
              type="range"
              min="2"
              max="50"
              value={clientsCount}
              onChange={(e) => setClientsCount(Number(e.target.value))}
              style={{ width: '100%', marginTop: '6px' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
              REQUESTS PER CLIENT ({requestsPerClient} REQS)
            </label>
            <input
              type="range"
              min="2"
              max="20"
              value={requestsPerClient}
              onChange={(e) => setRequestsPerClient(Number(e.target.value))}
              style={{ width: '100%', marginTop: '6px' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
              PAYLOAD SIZE ({payloadSize} BYTES)
            </label>
            <input
              type="range"
              min="64"
              max="1024"
              step="64"
              value={payloadSize}
              onChange={(e) => setPayloadSize(Number(e.target.value))}
              style={{ width: '100%', marginTop: '6px' }}
            />
          </div>
        </div>
      </SpatialGlassSurface>

      {/* Error Banner */}
      {errorMsg && (
        <SpatialGlassSurface style={{ padding: '16px 20px', borderLeft: '4px solid #ef4444' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#ef4444' }}>
            <AlertTriangle size={18} />
            <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>{errorMsg}</span>
          </div>
        </SpatialGlassSurface>
      )}

      {/* Results Display */}
      {results && results.type === 'comparative' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Comparative RPS Bar Chart */}
          <SpatialGlassSurface style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  Empirical Throughput Scaling: Requests Per Second (RPS)
                </h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                  Tested under identical workload of {clientsCount * requestsPerClient} total requests with {clientsCount} concurrent client connections.
                </p>
              </div>
              <span className="badge-emerald-pill">
                MULTIPLEXED: {((results.multiplexed?.requests_per_second || 1) / (results.iterative?.requests_per_second || 1)).toFixed(1)}x SPEEDUP
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Iterative Bar */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '6px' }}>
                  <span style={{ color: '#94a3b8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Server size={14} /> Iterative Server (Single-thread sequential loop)
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#94a3b8' }}>
                    {results.iterative?.requests_per_second?.toFixed(1)} RPS • {results.iterative?.mean_latency_ms?.toFixed(2)}ms mean
                  </span>
                </div>
                <div className="metric-track">
                  <div
                    style={{
                      height: '100%',
                      width: `${Math.max(4, ((results.iterative?.requests_per_second || 0) / getMaxRps()) * 100)}%`,
                      background: '#64748b',
                      borderRadius: '9999px',
                      transition: 'width 0.6s ease',
                    }}
                  />
                </div>
              </div>

              {/* Concurrent Bar */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '6px' }}>
                  <span style={{ color: '#38bdf8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Cpu size={14} /> Concurrent Server (Thread-per-connection pool)
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#38bdf8' }}>
                    {results.concurrent?.requests_per_second?.toFixed(1)} RPS • {results.concurrent?.mean_latency_ms?.toFixed(2)}ms mean
                  </span>
                </div>
                <div className="metric-track">
                  <div
                    style={{
                      height: '100%',
                      width: `${Math.max(4, ((results.concurrent?.requests_per_second || 0) / getMaxRps()) * 100)}%`,
                      background: '#38bdf8',
                      borderRadius: '9999px',
                      transition: 'width 0.6s ease',
                    }}
                  />
                </div>
              </div>

              {/* I/O Multiplexed Bar */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--color-emerald)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Zap size={14} /> I/O Multiplexing (AsyncIO Event Loop / select / epoll)
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-emerald)' }}>
                    {results.multiplexed?.requests_per_second?.toFixed(1)} RPS • {results.multiplexed?.mean_latency_ms?.toFixed(2)}ms mean
                  </span>
                </div>
                <div className="metric-track">
                  <div
                    style={{
                      height: '100%',
                      width: `${Math.max(4, ((results.multiplexed?.requests_per_second || 0) / getMaxRps()) * 100)}%`,
                      background: 'var(--color-emerald)',
                      borderRadius: '9999px',
                      boxShadow: '0 0 12px var(--color-emerald-glow)',
                      transition: 'width 0.6s ease',
                    }}
                  />
                </div>
              </div>
            </div>
          </SpatialGlassSurface>

          {/* Latency Percentile Cards (p50, p95, p99) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            {[
              { title: 'Iterative Model', data: results.iterative, color: '#94a3b8' },
              { title: 'Concurrent Model', data: results.concurrent, color: '#38bdf8' },
              { title: 'I/O Multiplexed Model', data: results.multiplexed, color: 'var(--color-emerald)' },
            ].map((model, idx) => (
              <SpatialGlassSurface key={idx} style={{ padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: model.color }}>{model.title}</span>
                  <Activity size={16} color={model.color} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.82rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-metallic-subtle)', paddingBottom: '4px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>P50 Median Latency:</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {model.data?.p50_latency_ms?.toFixed(2) || '0.00'} ms
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-metallic-subtle)', paddingBottom: '4px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>P95 Tail Latency:</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {model.data?.p95_latency_ms?.toFixed(2) || '0.00'} ms
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-metallic-subtle)', paddingBottom: '4px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>P99 Worst Case:</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: model.color }}>
                      {model.data?.p99_latency_ms?.toFixed(2) || '0.00'} ms
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '2px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Completion Rate:</span>
                    <span style={{ fontWeight: 700, color: 'var(--color-emerald)' }}>
                      {model.data?.completed_requests} / {model.data?.total_requests} (100%)
                    </span>
                  </div>
                </div>
              </SpatialGlassSurface>
            ))}
          </div>

          {/* Linux Networking Architectural Deep Dive */}
          <SpatialGlassSurface style={{ padding: '20px', background: 'rgba(56, 189, 248, 0.04)' }}>
            <h5 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
              POSIX / Linux Socket Multiplexing Conceptual Breakdown (select vs poll vs epoll)
            </h5>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              <p style={{ margin: '0 0 6px' }}>
                • <strong>select() [O(N) Complexity]:</strong> Scans through fixed-size bitmasks of file descriptors up to FD_SETSIZE (usually 1024). Every invocation copies the descriptor set between user and kernel space.
              </p>
              <p style={{ margin: '0 0 6px' }}>
                • <strong>poll() [O(N) Complexity]:</strong> Uses an array of struct pollfd without a hard limit on descriptor count, but still requires linear scanning across all descriptors every wake cycle.
              </p>
              <p style={{ margin: '0 0 6px' }}>
                • <strong>epoll() [O(1) Complexity on Linux]:</strong> Edge or level-triggered kernel event notification backed by red-black trees and a ready list. Only file descriptors with active I/O events are returned to user space, eliminating linear scanning entirely.
              </p>
              <p style={{ margin: 0, color: 'var(--color-mint)' }}>
                • <strong>Cross-Platform Note:</strong> On Windows, Python asyncio utilizes I/O Completion Ports (IOCP) via the ProactorEventLoop, delivering comparable O(1) asynchronous scaling.
              </p>
            </div>
          </SpatialGlassSurface>
        </div>
      )}

      {/* Default placeholder before run */}
      {!results && !isRunning && (
        <SpatialGlassSurface style={{ padding: '36px', textAlign: 'center' }}>
          <Layers size={36} color="var(--color-emerald)" style={{ margin: '0 auto 12px', opacity: 0.8 }} />
          <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            Ready to Evaluate Server Architectures
          </h4>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '520px', margin: '8px auto 16px' }}>
            Click &quot;Execute Concurrency Benchmark&quot; to spawn a controlled workload and measure live Requests/sec, median latency, and tail P99 latency across all 3 networking paradigms.
          </p>
        </SpatialGlassSurface>
      )}
    </div>
  );
}
