import React, { useState, useEffect } from 'react';
import {
  FileText,
  Play,
  CheckCircle2,
  Download,
  Activity,
  Layers,
  Clock,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import SpatialGlassSurface from '../design-system/SpatialGlassSurface';
import LiquidGlassButton from '../design-system/LiquidGlassButton';
import { fetchLabExperiments, executeSingleExperiment, executeAllExperiments } from '../../services/api';

export default function ExperimentsReportsTab() {
  const [experiments, setExperiments] = useState([]);
  const [runningId, setRunningId] = useState(null);
  const [isBatchRunning, setIsBatchRunning] = useState(false);
  const [resultsMap, setResultsMap] = useState({});
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    async function loadCatalog() {
      try {
        const catalog = await fetchLabExperiments();
        if (catalog && catalog.length > 0) {
          setExperiments(catalog);
          setExpandedId(catalog[0]?.id);
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadCatalog();
  }, []);

  const handleRunSingle = async (expId) => {
    setRunningId(expId);
    try {
      const res = await executeSingleExperiment(expId);
      setResultsMap((prev) => ({ ...prev, [expId]: res }));
      setExpandedId(expId);
    } catch (err) {
      console.error(err);
    } finally {
      setRunningId(null);
    }
  };

  const handleRunAll = async () => {
    setIsBatchRunning(true);
    try {
      const res = await executeAllExperiments();
      if (res && res.experiments) {
        const newMap = {};
        res.experiments.forEach((exp) => {
          newMap[exp.experiment_id] = exp;
        });
        setResultsMap(newMap);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsBatchRunning(false);
    }
  };

  const handleExportReport = () => {
    const timestamp = new Date().toISOString();
    const evaluatedCount = Object.keys(resultsMap).length;

    let markdown = `# NETSYNC NETWORK INTELLIGENCE LAB — EVALUATION REPORT\n`;
    markdown += `## Course: 20MSS56 — Network Programming Laboratory\n`;
    markdown += `**Evaluation Timestamp:** ${timestamp}\n`;
    markdown += `**Hardware Testbed:** Windows x64 / Python 3.14 / React SPA\n`;
    markdown += `**Experiments Evaluated:** ${evaluatedCount} / 10\n\n`;
    markdown += `---\n\n`;

    experiments.forEach((exp, idx) => {
      const res = resultsMap[exp.id];
      markdown += `### Experiment ${idx + 1}: ${exp.title}\n`;
      markdown += `- **Syllabus Module:** ${exp.syllabus_topic}\n`;
      markdown += `- **Objective:** ${exp.objective}\n`;
      markdown += `- **Status:** ${res ? 'COMPLETED' : 'PENDING'}\n`;
      if (res) {
        markdown += `- **Execution Time:** ${res.duration_sec?.toFixed(3)}s\n`;
        markdown += `- **Findings:** ${res.findings || 'N/A'}\n`;
        markdown += `\`\`\`json\n${JSON.stringify(res.measurements, null, 2)}\n\`\`\`\n\n`;
      } else {
        markdown += `*(Experiment has not yet been executed in this session)*\n\n`;
      }
    });

    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NetSync_20MSS56_Network_Lab_Report_${new Date().toISOString().split('T')[0]}.md`;
    a.click();
    URL.revokeObjectURL(url);
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
                COURSE 20MSS56 • CAPSTONE EVALUATION SUITE
              </span>
            </div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Network Programming Lab Experiment Runner & Reports
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
              Repeatable, empirical execution of all 10 course experiments covering socket APIs, multiplexing, protocol parsing, and DHCP.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <LiquidGlassButton
              variant="secondary"
              onClick={handleExportReport}
              icon={<Download size={14} />}
            >
              Export Report (.md)
            </LiquidGlassButton>

            <LiquidGlassButton
              variant="primary"
              onClick={handleRunAll}
              disabled={isBatchRunning}
              icon={<Sparkles size={14} className={isBatchRunning ? 'spin-anim' : ''} />}
            >
              {isBatchRunning ? 'Executing 10 Experiments...' : 'Run All 10 Capstone Experiments'}
            </LiquidGlassButton>
          </div>
        </div>

        {/* Evaluation Progress Pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-metallic-subtle)' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Evaluation Progress: <strong style={{ color: 'var(--color-emerald)' }}>{Object.keys(resultsMap).length} of 10</strong> experiments completed
          </span>
          <div style={{ flex: 1, height: '6px', background: 'rgba(0,0,0,0.3)', borderRadius: '9999px', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${(Object.keys(resultsMap).length / 10) * 100}%`,
                background: 'var(--color-emerald)',
                borderRadius: '9999px',
                transition: 'width 0.4s ease',
              }}
            />
          </div>
        </div>
      </SpatialGlassSurface>

      {/* Experiments Catalog Accordion List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {experiments.map((exp, idx) => {
          const isExpanded = expandedId === exp.id;
          const isRunning = runningId === exp.id;
          const result = resultsMap[exp.id];

          return (
            <SpatialGlassSurface
              key={exp.id}
              style={{
                padding: '20px',
                border: result ? '1px solid var(--border-emerald-glow)' : '1px solid var(--border-metallic)',
                transition: 'all 0.2s ease',
              }}
            >
              {/* Accordion Header */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
                onClick={() => setExpandedId(isExpanded ? null : exp.id)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: result
                      ? 'rgba(69, 245, 154, 0.15)'
                      : 'rgba(255, 255, 255, 0.05)',
                    border: result
                      ? '1px solid var(--border-emerald-glow)'
                      : '1px solid var(--border-metallic)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.8rem',
                    fontWeight: 800,
                    color: result ? 'var(--color-emerald)' : 'var(--text-muted)',
                  }}>
                    {idx + 1}
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h4 style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                        {exp.title}
                      </h4>
                      {result && (
                        <span className="badge-emerald-pill" style={{ fontSize: '0.65rem', padding: '1px 6px' }}>
                          COMPLETED
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {exp.syllabus_topic}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <LiquidGlassButton
                    variant="primary"
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRunSingle(exp.id);
                    }}
                    disabled={isRunning || isBatchRunning}
                    icon={<Play size={12} className={isRunning ? 'spin-anim' : ''} />}
                  >
                    {isRunning ? 'Running...' : result ? 'Re-run' : 'Execute'}
                  </LiquidGlassButton>

                  {isExpanded ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
                </div>
              </div>

              {/* Accordion Body */}
              {isExpanded && (
                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-metallic-subtle)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
                    {/* Left: Objective & Findings */}
                    <div>
                      <h5 style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>
                        LABORATORY OBJECTIVE
                      </h5>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', margin: '0 0 14px', lineHeight: 1.5 }}>
                        {exp.objective}
                      </p>

                      {result?.findings && (
                        <div>
                          <h5 style={{ fontSize: '0.82rem', color: 'var(--color-emerald)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>
                            EMPIRICAL FINDINGS & ANALYSIS
                          </h5>
                          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5, background: 'rgba(69, 245, 154, 0.05)', padding: '12px', borderRadius: '8px', borderLeft: '3px solid var(--color-emerald)' }}>
                            {result.findings}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Right: Measurements JSON Display */}
                    <div>
                      <h5 style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>
                        QUANTITATIVE TELEMETRY MEASUREMENTS
                      </h5>
                      <div style={{
                        background: 'rgba(0,0,0,0.4)',
                        borderRadius: '8px',
                        padding: '12px',
                        maxHeight: '180px',
                        overflowY: 'auto',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.74rem',
                        color: 'var(--color-mint)',
                        border: '1px solid var(--border-metallic-subtle)',
                      }}>
                        {result ? (
                          <pre style={{ margin: 0 }}>{JSON.stringify(result.measurements, null, 2)}</pre>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>Click &quot;Execute&quot; to collect live empirical measurements.</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </SpatialGlassSurface>
          );
        })}
      </div>
    </div>
  );
}
