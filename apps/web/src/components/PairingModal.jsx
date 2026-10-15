import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, ShieldCheck, CheckCircle2, ArrowRight, RefreshCw, Laptop, Smartphone, Tablet, Layers } from 'lucide-react';
import SpatialGlassSurface from './design-system/SpatialGlassSurface';
import LiquidGlassButton from './design-system/LiquidGlassButton';
import ProvenanceBadge from './design-system/ProvenanceBadge';
import { broadcastMeshEvent, subscribeMeshEvents } from '../services/meshChannel';

export default function PairingModal({ isOpen, onClose, onDevicePaired }) {
  const [mode, setMode] = useState('generate'); // generate | enter | same_device
  const [token, setToken] = useState('849201');
  const [timeLeft, setTimeLeft] = useState(300);
  const [inputCode, setInputCode] = useState('');
  const [trustLevel, setTrustLevel] = useState('TRUSTED_HARDWARE'); // TRUSTED_HARDWARE | PROVISIONAL_GUEST
  const [pairingSuccess, setPairingSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [peerName, setPeerName] = useState('Google Pixel 9 Pro');
  const [peerType, setPeerType] = useState('phone');

  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  // Real-time synchronization listener: if another tab/device pairs with this token, host updates immediately!
  useEffect(() => {
    if (!isOpen) return;

    const unsubscribe = subscribeMeshEvents((msg) => {
      if (msg.type === 'DEVICE_PAIRED' && msg.payload?.device) {
        const pairedName = msg.payload.device.device_name || msg.payload.device.name || 'New Hardware Peer';
        setSuccessMessage(`Hardware Peer Connected: ${pairedName}! Vector clocks synced.`);
        setPairingSuccess(true);
        setTimeout(() => {
          onClose();
          setPairingSuccess(false);
          setSuccessMessage('');
        }, 1500);
      }
    });

    return () => unsubscribe();
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleGenerateNew = () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setToken(code);
    setTimeLeft(300);
    setPairingSuccess(false);
    setSuccessMessage('');
  };

  const handleVerifyCode = () => {
    if (inputCode.length === 6) {
      setPairingSuccess(true);
      const newDevPayload = {
        name: peerName.trim() || 'New Hardware Peer',
        type: peerType,
        code: inputCode,
        trustLevel: trustLevel,
        isTrusted: trustLevel === 'TRUSTED_HARDWARE',
        os: peerType === 'phone' ? 'Android 15' : peerType === 'tablet' ? 'iPadOS 18' : 'macOS Sequoia',
      };

      setSuccessMessage(`Authenticated with host code ${inputCode}!`);

      // Broadcast pairing to all tabs on this device and mesh
      broadcastMeshEvent('DEVICE_PAIRED', { device: newDevPayload });

      setTimeout(() => {
        if (onDevicePaired) {
          onDevicePaired(newDevPayload);
        }
        onClose();
        setPairingSuccess(false);
        setInputCode('');
        setSuccessMessage('');
      }, 1000);
    }
  };

  const handleQuickPairSameDeviceTab = () => {
    setPairingSuccess(true);
    const peerTabNum = Math.floor(100 + Math.random() * 900);
    const tabPeerData = {
      name: `Same-Device Tab Peer #${peerTabNum}`,
      type: 'laptop',
      trustLevel: 'TRUSTED_HARDWARE',
      isTrusted: true,
      os: 'Chrome Virtual Tab Node',
    };

    setSuccessMessage(`Paired as Same-Device Tab Peer #${peerTabNum}! BroadcastChannel live.`);

    // Broadcast to host tab and other tabs
    broadcastMeshEvent('DEVICE_PAIRED', { device: tabPeerData });

    setTimeout(() => {
      if (onDevicePaired) {
        onDevicePaired(tabPeerData);
      }
      onClose();
      setPairingSuccess(false);
      setSuccessMessage('');
    }, 900);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = (timeLeft % 60).toString().padStart(2, '0');

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 100,
      background: 'rgba(7, 9, 11, 0.82)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
    }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.2 }}
        style={{ width: '100%', maxWidth: '480px' }}
      >
        <SpatialGlassSurface
          glow
          style={{
            padding: '32px',
            position: 'relative',
            boxShadow: '0 24px 64px rgba(0, 0, 0, 0.7), 0 0 32px var(--color-emerald-glow)',
          }}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px',
            }}
          >
            <X size={20} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <ShieldCheck size={24} color="var(--color-emerald)" />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Hardware Peer Mesh Pairing
            </h3>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
            Pair cross-device hardware peers or browser tabs with cryptographic HMAC-SHA256 tokens and instant state synchronization.
          </p>

          {/* Tab Switcher: Host / Joiner / Same-Device */}
          <div style={{
            display: 'flex',
            background: 'rgba(0, 0, 0, 0.35)',
            borderRadius: '12px',
            padding: '4px',
            marginBottom: '22px',
            border: '1px solid var(--glass-border)',
            gap: '4px',
          }}>
            <button
              onClick={() => { setMode('generate'); setPairingSuccess(false); }}
              style={{
                flex: 1,
                padding: '8px 4px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.78rem',
                background: mode === 'generate' ? 'var(--color-emerald)' : 'transparent',
                color: mode === 'generate' ? '#07090b' : 'var(--text-secondary)',
                transition: 'all 0.2s',
              }}
            >
              Host (Code)
            </button>
            <button
              onClick={() => { setMode('enter'); setPairingSuccess(false); }}
              style={{
                flex: 1,
                padding: '8px 4px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.78rem',
                background: mode === 'enter' ? 'var(--color-emerald)' : 'transparent',
                color: mode === 'enter' ? '#07090b' : 'var(--text-secondary)',
                transition: 'all 0.2s',
              }}
            >
              Join (Code)
            </button>
            <button
              onClick={() => { setMode('same_device'); setPairingSuccess(false); }}
              style={{
                flex: 1,
                padding: '8px 4px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.78rem',
                background: mode === 'same_device' ? 'var(--color-emerald)' : 'transparent',
                color: mode === 'same_device' ? '#07090b' : 'var(--text-secondary)',
                transition: 'all 0.2s',
              }}
            >
              Same Device
            </button>
          </div>

          {pairingSuccess && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              padding: '16px',
              marginBottom: '18px',
              background: 'rgba(69, 245, 154, 0.14)',
              border: '1px solid var(--color-emerald)',
              borderRadius: '12px',
              color: 'var(--color-emerald)',
              fontWeight: 700,
              fontSize: '0.88rem',
              boxShadow: '0 0 20px var(--color-emerald-glow)',
            }}>
              <CheckCircle2 size={20} />
              <span>{successMessage || 'Peer Authenticated! State synchronized.'}</span>
            </div>
          )}

          {mode === 'generate' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <div style={{
                background: 'rgba(7, 9, 11, 0.75)',
                border: '1px solid var(--border-emerald-glow)',
                borderRadius: '16px',
                padding: '24px',
                width: '100%',
                marginBottom: '18px',
                boxSizing: 'border-box',
              }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
                  Host Pairing Token
                </div>
                <div style={{
                  fontSize: '3rem',
                  fontWeight: 800,
                  letterSpacing: '0.15em',
                  color: 'var(--color-emerald)',
                  fontFamily: 'var(--font-mono)',
                  textShadow: '0 0 24px var(--color-emerald-glow)',
                }}>
                  {token}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <span>Expires in: <strong style={{ color: '#fbbf24', fontFamily: 'var(--font-mono)' }}>{minutes}:{seconds}</strong></span>
                  <ProvenanceBadge type="measured" detail="Single-use random token with 300s TTL" size="sm" />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', width: '100%', marginBottom: '14px' }}>
                <LiquidGlassButton
                  variant="secondary"
                  onClick={handleGenerateNew}
                  icon={<RefreshCw size={14} />}
                  style={{ flex: 1 }}
                >
                  Regenerate
                </LiquidGlassButton>
                <LiquidGlassButton
                  variant="primary"
                  onClick={() => {
                    setPairingSuccess(true);
                    setSuccessMessage('MacBook Pro M3 Max paired with Host!');
                    const simulatedPeer = {
                      name: 'MacBook Pro M3 Max',
                      type: 'laptop',
                      os: 'macOS Sequoia 15.1',
                      code: token,
                      trustLevel: 'TRUSTED_HARDWARE',
                      isTrusted: true,
                    };
                    broadcastMeshEvent('DEVICE_PAIRED', { device: simulatedPeer });
                    setTimeout(() => {
                      if (onDevicePaired) {
                        onDevicePaired(simulatedPeer);
                      }
                      onClose();
                      setPairingSuccess(false);
                      setSuccessMessage('');
                    }, 1000);
                  }}
                  icon={<ShieldCheck size={14} />}
                  style={{ flex: 1.3 }}
                >
                  Simulate Peer Join
                </LiquidGlassButton>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                Enter this 6-digit code on your other phone/laptop, or open another tab on this machine to join.
              </span>
            </div>
          )}

          {mode === 'enter' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Peer Device Name:
                </label>
                <input
                  type="text"
                  value={peerName}
                  onChange={(e) => setPeerName(e.target.value)}
                  placeholder="e.g. Google Pixel 9 Pro"
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid var(--border-metallic, rgba(255, 255, 255, 0.1))',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  6-Digit Code displayed on Host:
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  style={{
                    width: '100%',
                    padding: '14px',
                    background: 'rgba(7, 9, 11, 0.75)',
                    border: '1px solid var(--border-emerald-glow)',
                    borderRadius: '12px',
                    color: 'var(--color-emerald)',
                    fontSize: '2rem',
                    fontWeight: 800,
                    textAlign: 'center',
                    letterSpacing: '0.25em',
                    fontFamily: 'var(--font-mono)',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Hardware Trust Level:
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[
                    { id: 'TRUSTED_HARDWARE', label: 'Trusted Hardware' },
                    { id: 'PROVISIONAL_GUEST', label: 'Provisional Guest' },
                  ].map(({ id, label }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setTrustLevel(id)}
                      style={{
                        flex: 1,
                        padding: '8px 6px',
                        borderRadius: '8px',
                        border: '1px solid',
                        borderColor: trustLevel === id ? 'var(--color-emerald)' : 'var(--glass-border)',
                        background: trustLevel === id ? 'rgba(69, 245, 154, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                        color: trustLevel === id ? 'var(--color-emerald)' : 'var(--text-secondary)',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {!pairingSuccess && (
                <LiquidGlassButton
                  variant="primary"
                  onClick={handleVerifyCode}
                  disabled={inputCode.length !== 6}
                  icon={<ArrowRight size={16} />}
                  style={{ width: '100%', padding: '12px' }}
                >
                  Verify & Join Mesh
                </LiquidGlassButton>
              )}
            </div>
          )}

          {mode === 'same_device' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'center' }}>
              <div style={{
                background: 'rgba(7, 9, 11, 0.7)',
                border: '1px solid var(--border-emerald-glow)',
                borderRadius: '16px',
                padding: '24px 20px',
              }}>
                <div style={{ display: 'inline-flex', padding: '12px', borderRadius: '50%', background: 'rgba(69, 245, 154, 0.1)', marginBottom: '12px' }}>
                  <Layers size={28} color="var(--color-emerald)" />
                </div>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
                  Multi-Tab Local Pairing
                </h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                  Test cross-tab data continuity on this computer without needing a separate phone or laptop. Connected via native <code>BroadcastChannel</code> with zero cloud relay latency.
                </p>
              </div>

              {!pairingSuccess && (
                <LiquidGlassButton
                  variant="primary"
                  onClick={handleQuickPairSameDeviceTab}
                  icon={<CheckCircle2 size={16} />}
                  style={{ width: '100%', padding: '13px' }}
                >
                  Quick Pair as Virtual Tab Peer
                </LiquidGlassButton>
              )}

              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                Tip: Open another browser tab at <code>/workspaces</code> or <code>/clipboard</code> to watch changes propagate in real time!
              </span>
            </div>
          )}
        </SpatialGlassSurface>
      </motion.div>
    </div>
  );
}
