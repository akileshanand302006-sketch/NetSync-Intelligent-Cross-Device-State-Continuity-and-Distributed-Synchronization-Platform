import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Globe,
  Layers,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Play,
  Server,
  FileText,
  Search,
  CheckCircle2,
} from 'lucide-react';
import SpatialGlassSurface from '../design-system/SpatialGlassSurface';
import LiquidGlassButton from '../design-system/LiquidGlassButton';
import LiquidGlassInput from '../design-system/LiquidGlassInput';
import ProvenanceBadge from '../design-system/ProvenanceBadge';
import { fetchDnsHierarchy } from '../../services/api';

export default function DnsStudioTab() {
  const [domain, setDomain] = useState('netsync.dev');
  const [loading, setLoading] = useState(false);
  const [dnsData, setDnsData] = useState(null);

  const resolve = async () => {
    setLoading(true);
    const data = await fetchDnsHierarchy(domain);
    if (data) {
      setDnsData(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    resolve();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header & Query Bar */}
      <SpatialGlassSurface glow style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span className="status-indicator-dot online" />
              <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--color-accent)' }}>
                TIER A5 • NETWORK INTELLIGENCE LAB
              </span>
              <ProvenanceBadge provenance="derived" rfc="RFC 1035" tooltip="Hierarchical Root-to-Authoritative iterative DNS resolver" />
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: 700, margin: '0 0 6px 0', color: 'var(--text-primary)' }}>
              DNS Studio & Hierarchy Explorer
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, maxWidth: '640px' }}>
              Trace RFC 1035 iterative name resolution from 13 ICANN root server clusters down to top-level domains and authoritative zone name servers. Inspect resource records and assess cache poisoning resilience.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div style={{ width: '260px' }}>
              <LiquidGlassInput
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="domain.com"
                icon={<Search size={15} />}
              />
            </div>
            <LiquidGlassButton variant="primary" onClick={resolve} loading={loading} icon={<Play size={14} />}>
              Resolve Hierarchy
            </LiquidGlassButton>
          </div>
        </div>
      </SpatialGlassSurface>

      {/* Resolution Hierarchy Tree */}
      {dnsData && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
          {dnsData.hierarchy_steps.map((step, idx) => (
            <SpatialGlassSurface key={idx} style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '6px',
                  background: 'rgba(255,255,255,0.06)',
                  color: 'var(--color-accent)',
                }}>
                  TIER {idx + 1}: {step.tier}
                </span>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  {step.rtt_ms} ms
                </span>
              </div>

              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                {step.server}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                Query: <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{step.query}</span>
              </div>

              {/* Records List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {step.records.map((rec, rIdx) => (
                  <div
                    key={rIdx}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '8px',
                      background: 'rgba(0,0,0,0.25)',
                      border: '1px solid rgba(255,255,255,0.05)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '11px',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    <span style={{ color: 'var(--color-accent)', fontWeight: 700 }}>{rec.type}</span>
                    <span style={{ color: 'var(--text-primary)', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {rec.value}
                    </span>
                    <span style={{ color: 'var(--text-muted)' }}>TTL {rec.ttl}s</span>
                  </div>
                ))}
              </div>
            </SpatialGlassSurface>
          ))}
        </div>
      )}

      {/* Security Audit: Kaminsky Cache Poisoning Mitigation */}
      {dnsData?.security_audit && (
        <SpatialGlassSurface style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <ShieldCheck size={18} style={{ color: 'var(--color-accent)' }} />
            <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
              DNS Cache Poisoning & Kaminsky Attack Resilience Audit
            </span>
            <ProvenanceBadge provenance="derived" rfc="RFC 5452" tooltip="Source port and transaction ID entropy analysis" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
            {dnsData.security_audit.mitigations_active.map((mit, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={15} style={{ color: 'var(--color-accent)' }} />
                <span>{mit}</span>
              </div>
            ))}
          </div>

          <div style={{
            marginTop: '14px',
            padding: '12px',
            borderRadius: '10px',
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            fontSize: '12px',
            color: 'var(--text-primary)',
          }}>
            <strong>Security Evaluation:</strong> {dnsData.security_audit.attack_complexity}
          </div>
        </SpatialGlassSurface>
      )}
    </div>
  );
}
