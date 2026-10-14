import React, { useState } from 'react';
import {
  Globe,
  Smartphone,
  Terminal,
  Code2,
  KeyRound,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  FileCode,
} from 'lucide-react';
import SpatialGlassSurface from '../design-system/SpatialGlassSurface';
import LiquidGlassButton from '../design-system/LiquidGlassButton';

export default function IntegrationsView() {
  const [copiedKey, setCopiedKey] = useState(false);
  const [apiKey] = useState('ns_sec_994b7f81_e41c4961_a29e46a1df843c08');

  const handleCopyKey = () => {
    navigator.clipboard.writeText(apiKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const integrations = [
    {
      id: 'chrome-ext',
      title: 'Google Chrome / Chromium Extension',
      badge: 'Manifest V3',
      description: 'Synchronizes active tabs, real-time scroll offsets, and DOM form buffers across connected LAN peers.',
      status: 'CONNECTED',
      statusColor: 'var(--color-emerald)',
      icon: Globe,
      version: 'v1.4.2',
      port: 9100,
    },
    {
      id: 'mobile-app',
      title: 'React Native Mobile Client (Android & iOS)',
      badge: 'ZeroConf & UDP',
      description: 'Native mobile client enabling push handoff, universal clipboard listeners, and background beacon sync.',
      status: 'PAIRED',
      statusColor: 'var(--color-emerald)',
      icon: Smartphone,
      version: 'v2.1.0',
      port: 9100,
    },
    {
      id: 'vscode-plugin',
      title: 'VS Code & JetBrains Editor Adapter',
      badge: 'Language Server Protocol',
      description: 'Streams active editor documents, split panes, and multi-cursor positions into NetSync workspaces.',
      status: 'LISTENING',
      statusColor: '#38bdf8',
      icon: Code2,
      version: 'v0.9.8',
      port: 9102,
    },
    {
      id: 'python-daemon',
      title: 'NetSync Python Socket Daemon',
      badge: 'POSIX & WinSock',
      description: 'Underlying CPython networking core managing raw binary frames, CRC-32 validation, and mDNS responder.',
      status: 'ACTIVE_DAEMON',
      statusColor: 'var(--color-emerald)',
      icon: Terminal,
      version: 'v3.14.0',
      port: 9100,
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Top Banner */}
      <SpatialGlassSurface style={{ padding: '28px 32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span className="pulse-emerald-dot"></span>
              <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--color-emerald)', textTransform: 'uppercase' }}>
                CLIENT ADAPTERS & MESH INTEGRATIONS
              </span>
            </div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              Cross-Platform State Adapters & SDKs
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Native hooks connecting web browsers, mobile operating systems, IDEs, and CLI daemons to NetSync's binary socket engine.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '9999px',
              background: 'rgba(69, 245, 154, 0.1)',
              border: '1px solid rgba(69, 245, 154, 0.3)',
              color: 'var(--color-emerald)',
              fontSize: '0.8rem',
              fontWeight: 700,
            }}>
              <ShieldCheck size={14} /> HMAC-SHA256 Token Auth
            </span>
          </div>
        </div>
      </SpatialGlassSurface>

      {/* Grid of Adapter Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
        {integrations.map((item) => {
          const Icon = item.icon;

          return (
            <SpatialGlassSurface key={item.id} style={{ padding: '26px' }} glow>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid var(--glass-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: item.statusColor,
                  }}>
                    <Icon size={22} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {item.title}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px' }}>
                      <span style={{
                        fontSize: '0.72rem',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: 'rgba(255, 255, 255, 0.06)',
                        color: 'var(--text-secondary)',
                      }}>
                        {item.badge}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        Port {item.port}
                      </span>
                    </div>
                  </div>
                </div>

                <span style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  background: 'rgba(69, 245, 154, 0.1)',
                  border: '1px solid rgba(69, 245, 154, 0.25)',
                  color: item.statusColor,
                  fontSize: '0.72rem',
                  fontWeight: 700,
                }}>
                  {item.status}
                </span>
              </div>

              <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '20px' }}>
                {item.description}
              </p>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid var(--glass-border)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Installed Version: {item.version}
                </span>
                <span style={{ fontSize: '0.78rem', color: 'var(--color-emerald)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                  Configure Adapter <ExternalLink size={12} />
                </span>
              </div>
            </SpatialGlassSurface>
          );
        })}
      </div>

      {/* API Credentials & Quick Connect Snippets */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '24px' }}>
        {/* API Credentials */}
        <SpatialGlassSurface style={{ padding: '26px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <KeyRound size={20} color="var(--color-emerald)" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Mesh Master Key (HMAC-SHA256)
            </h3>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '16px' }}>
            All socket frames exchanged across peer nodes are signed with this shared secret using HMAC-SHA256 in the 64-byte frame header.
          </p>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(7, 9, 11, 0.8)',
            border: '1px solid var(--glass-border)',
            borderRadius: '10px',
            padding: '10px 14px',
            marginBottom: '16px',
          }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--text-primary)', wordBreak: 'break-all' }}>
              {apiKey}
            </span>
            <LiquidGlassButton
              variant="secondary"
              onClick={handleCopyKey}
              icon={copiedKey ? <Check size={14} /> : <Copy size={14} />}
              style={{ padding: '6px 12px', fontSize: '0.78rem', marginLeft: '10px' }}
            >
              {copiedKey ? 'Copied' : 'Copy'}
            </LiquidGlassButton>
          </div>

          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Never expose this key in public client repositories. Rotate keys instantly from Settings.
          </div>
        </SpatialGlassSurface>

        {/* Quick Connect cURL / Python Code Block */}
        <SpatialGlassSurface style={{ padding: '26px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <FileCode size={20} color="var(--color-mint)" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Direct Socket Testbed (Python Client)
            </h3>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '14px' }}>
            Connect to any active peer on LAN using the NetSync binary socket transport:
          </p>

          <pre style={{
            background: 'rgba(7, 9, 11, 0.85)',
            border: '1px solid var(--glass-border)',
            borderRadius: '10px',
            padding: '14px',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.8rem',
            color: 'var(--text-primary)',
            overflowX: 'auto',
            lineHeight: 1.5,
          }}>
{`from netsync.protocol import NetSyncFrameCodec, MSG_STATE_DELTA

client = NetSyncFrameCodec(secret_key="` + apiKey.substring(0, 16) + `...")
frame = client.encode_frame(
    msg_type=MSG_STATE_DELTA,
    payload={"tab_scroll": 85, "url": "https://example.com"}
)
# Sends binary frame with 64-byte header and CRC32
sock.sendall(frame)`}
          </pre>
        </SpatialGlassSurface>
      </div>
    </div>
  );
}
