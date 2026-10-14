import React, { useState } from 'react';
import {
  Moon,
  Sun,
  Shield,
  Sliders,
  RotateCcw,
  CheckCircle2,
  Zap,
} from 'lucide-react';
import SpatialGlassSurface from '../design-system/SpatialGlassSurface';
import LiquidGlassButton from '../design-system/LiquidGlassButton';

export default function SettingsView({ currentTheme = 'dark', onToggleTheme }) {
  const [lanDirectPriority, setLanDirectPriority] = useState(true);
  const [wifiOnly, setWifiOnly] = useState(true);
  const [deltaThreshold, setDeltaThreshold] = useState(80);
  const [autoSyncClipboard, setAutoSyncClipboard] = useState(true);
  const [secretRedaction, setSecretRedaction] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [highContrastBorders, setHighContrastBorders] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = () => {
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Top Banner */}
      <SpatialGlassSurface style={{ padding: '28px 32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span className="pulse-emerald-dot"></span>
              <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--color-emerald)', textTransform: 'uppercase' }}>
                SYSTEM CONFIGURATION
              </span>
            </div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              Mesh Policies & Glass Preferences
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Tune differential delta algorithms, theme material illumination, network transport parameters, and peer trust lifetimes.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {saveSuccess && (
              <span style={{ fontSize: '0.8rem', color: 'var(--color-emerald)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle2 size={15} /> Preferences Applied
              </span>
            )}
            <LiquidGlassButton variant="primary" onClick={handleSave}>
              Save Preferences
            </LiquidGlassButton>
          </div>
        </div>
      </SpatialGlassSurface>

      {/* Settings Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
        {/* Card 1: Theme & Visual Environment */}
        <SpatialGlassSurface style={{ padding: '26px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
            {currentTheme === 'dark' ? <Moon size={20} color="var(--color-emerald)" /> : <Sun size={20} color="var(--color-emerald)" />}
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Visual Environment & Material
            </h3>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
            Switch between Obsidian Black spatial liquid glass and Pearl White mist environment.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
            <button
              onClick={() => {
                if (currentTheme !== 'dark' && onToggleTheme) onToggleTheme();
              }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                padding: '16px',
                borderRadius: '12px',
                border: '1px solid',
                borderColor: currentTheme === 'dark' ? 'var(--color-emerald)' : 'var(--glass-border)',
                background: currentTheme === 'dark' ? 'rgba(69, 245, 154, 0.08)' : 'rgba(0, 0, 0, 0.2)',
                color: currentTheme === 'dark' ? 'var(--color-emerald)' : 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              <Moon size={22} />
              <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Obsidian Dark</span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>#07090B Liquid Glass</span>
            </button>

            <button
              onClick={() => {
                if (currentTheme !== 'light' && onToggleTheme) onToggleTheme();
              }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                padding: '16px',
                borderRadius: '12px',
                border: '1px solid',
                borderColor: currentTheme === 'light' ? 'var(--color-emerald)' : 'var(--glass-border)',
                background: currentTheme === 'light' ? 'rgba(69, 245, 154, 0.08)' : 'rgba(0, 0, 0, 0.2)',
                color: currentTheme === 'light' ? 'var(--color-emerald)' : 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              <Sun size={22} />
              <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Pearl White</span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Frosted Mist Material</span>
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingTop: '16px', borderTop: '1px solid var(--glass-border)' }}>
            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', fontSize: '0.84rem' }}>
              <span style={{ color: 'var(--text-primary)' }}>High Contrast Glass Borders</span>
              <input
                type="checkbox"
                checked={highContrastBorders}
                onChange={(e) => setHighContrastBorders(e.target.checked)}
                style={{ accentColor: 'var(--color-emerald)' }}
              />
            </label>
            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', fontSize: '0.84rem' }}>
              <span style={{ color: 'var(--text-primary)' }}>Reduce 3D Motion (Accessible Mode)</span>
              <input
                type="checkbox"
                checked={reducedMotion}
                onChange={(e) => setReducedMotion(e.target.checked)}
                style={{ accentColor: 'var(--color-emerald)' }}
              />
            </label>
          </div>
        </SpatialGlassSurface>

        {/* Card 2: Synchronization & Delta Policies */}
        <SpatialGlassSurface style={{ padding: '26px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
            <Zap size={20} color="var(--color-emerald)" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Differential State Policies
            </h3>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
            Control bandwidth savings thresholds and network socket binding behaviors.
          </p>

          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.84rem' }}>
              <span style={{ color: 'var(--text-primary)' }}>Delta Compression Threshold</span>
              <span style={{ color: 'var(--color-emerald)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                {deltaThreshold}%
              </span>
            </div>
            <input
              type="range"
              min="30"
              max="95"
              value={deltaThreshold}
              onChange={(e) => setDeltaThreshold(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--color-emerald)' }}
            />
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Transmit state deltas only when payload is below {deltaThreshold}% of full state size.
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingTop: '16px', borderTop: '1px solid var(--glass-border)' }}>
            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', fontSize: '0.84rem' }}>
              <span style={{ color: 'var(--text-primary)' }}>Priority P2P LAN Direct (Bypass WAN)</span>
              <input
                type="checkbox"
                checked={lanDirectPriority}
                onChange={(e) => setLanDirectPriority(e.target.checked)}
                style={{ accentColor: 'var(--color-emerald)' }}
              />
            </label>
            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', fontSize: '0.84rem' }}>
              <span style={{ color: 'var(--text-primary)' }}>Restrict Sync to Wi-Fi / Ethernet Only</span>
              <input
                type="checkbox"
                checked={wifiOnly}
                onChange={(e) => setWifiOnly(e.target.checked)}
                style={{ accentColor: 'var(--color-emerald)' }}
              />
            </label>
          </div>
        </SpatialGlassSurface>

        {/* Card 3: Security & Pairing Policies */}
        <SpatialGlassSurface style={{ padding: '26px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
            <Shield size={20} color="var(--color-emerald)" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Hardware Trust & Key Rotation
            </h3>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
            Cryptographic key lifecycles and peer authentication boundaries.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.84rem' }}>
              <span style={{ color: 'var(--text-primary)' }}>TOTP 6-Digit Pairing Window</span>
              <span style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>300 seconds</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.84rem' }}>
              <span style={{ color: 'var(--text-primary)' }}>HMAC Digest Algorithm</span>
              <span style={{ color: 'var(--color-emerald)', fontFamily: 'var(--font-mono)' }}>SHA-256</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.84rem' }}>
              <span style={{ color: 'var(--text-primary)' }}>Frame Header Checksum</span>
              <span style={{ color: 'var(--color-emerald)', fontFamily: 'var(--font-mono)' }}>CRC-32 (IEEE 802.3)</span>
            </div>
          </div>

          <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--glass-border)' }}>
            <LiquidGlassButton
              variant="secondary"
              onClick={() => {
                if (window.confirm('Revoke all peer authentication tokens? All devices will need to re-pair with a new 6-digit code.')) {
                  alert('All mesh session tokens revoked.');
                }
              }}
              icon={<RotateCcw size={14} />}
              style={{ width: '100%' }}
            >
              Revoke All Mesh Session Tokens
            </LiquidGlassButton>
          </div>
        </SpatialGlassSurface>

        {/* Card 4: Universal Clipboard Privacy */}
        <SpatialGlassSurface style={{ padding: '26px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
            <Sliders size={20} color="var(--color-emerald)" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Clipboard Privacy Controls
            </h3>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
            Protect sensitive credentials and tokens from unintentional broadcast.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', fontSize: '0.84rem' }}>
              <span style={{ color: 'var(--text-primary)' }}>Auto-Sync OS Clipboard Copies</span>
              <input
                type="checkbox"
                checked={autoSyncClipboard}
                onChange={(e) => setAutoSyncClipboard(e.target.checked)}
                style={{ accentColor: 'var(--color-emerald)' }}
              />
            </label>
            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', fontSize: '0.84rem' }}>
              <span style={{ color: 'var(--text-primary)' }}>Automatic Token & Password Redaction</span>
              <input
                type="checkbox"
                checked={secretRedaction}
                onChange={(e) => setSecretRedaction(e.target.checked)}
                style={{ accentColor: 'var(--color-emerald)' }}
              />
            </label>
          </div>

          <div style={{
            marginTop: '20px',
            padding: '12px',
            borderRadius: '8px',
            background: 'rgba(7, 9, 11, 0.6)',
            border: '1px solid var(--glass-border)',
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            lineHeight: 1.5,
          }}>
            When token redaction is enabled, NetSync flags strings matching JWT, AWS keys, and private key headers (`-----BEGIN PRIVATE KEY-----`) to prevent accidental LAN transmission.
          </div>
        </SpatialGlassSurface>
      </div>
    </div>
  );
}
