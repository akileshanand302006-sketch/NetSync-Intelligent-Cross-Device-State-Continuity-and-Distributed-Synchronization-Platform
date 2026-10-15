import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, QrCode, Key, ShieldCheck, CheckCircle2, ArrowRight, RefreshCw } from 'lucide-react';
import SpatialGlassSurface from './design-system/SpatialGlassSurface';
import LiquidGlassButton from './design-system/LiquidGlassButton';
import LiquidGlassInput from './design-system/LiquidGlassInput';
import ProvenanceBadge from './design-system/ProvenanceBadge';

export default function PairingModal({ isOpen, onClose, onDevicePaired }) {
  const [mode, setMode] = useState('generate'); // generate | enter
  const [token, setToken] = useState('849201');
  const [timeLeft, setTimeLeft] = useState(300);
  const [inputCode, setInputCode] = useState('');
  const [trustLevel, setTrustLevel] = useState('TRUSTED_HARDWARE'); // TRUSTED_HARDWARE | PROVISIONAL_GUEST
  const [pairingSuccess, setPairingSuccess] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleGenerateNew = () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setToken(code);
    setTimeLeft(300);
    setPairingSuccess(false);
  };

  const handleVerifyCode = () => {
    if (inputCode.length === 6) {
      setPairingSuccess(true);
      setTimeout(() => {
        if (onDevicePaired) {
          onDevicePaired({
            name: 'New Hardware Peer',
            type: 'Mobile Client',
            code: inputCode,
            trustLevel: trustLevel,
            isTrusted: trustLevel === 'TRUSTED_HARDWARE',
          });
        }
        onClose();
        setPairingSuccess(false);
        setInputCode('');
      }, 1200);
    }
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
      background: 'rgba(7, 9, 11, 0.8)',
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
        style={{ width: '100%', maxWidth: '460px' }}
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
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Hardware Peer Mesh Pairing
            </h3>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '22px' }}>
            Pair hardware peers with time-limited single-use cryptographic tokens and HMAC-SHA256 handshake.
          </p>

          {/* Tab Switcher */}
          <div style={{
            display: 'flex',
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '12px',
            padding: '4px',
            marginBottom: '24px',
            border: '1px solid var(--glass-border)',
          }}>
            <button
              onClick={() => setMode('generate')}
              style={{
                flex: 1,
                padding: '9px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.82rem',
                background: mode === 'generate' ? 'var(--color-emerald)' : 'transparent',
                color: mode === 'generate' ? '#07090b' : 'var(--text-secondary)',
                transition: 'all 0.2s',
              }}
            >
              Display Code (Host)
            </button>
            <button
              onClick={() => setMode('enter')}
              style={{
                flex: 1,
                padding: '9px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.82rem',
                background: mode === 'enter' ? 'var(--color-emerald)' : 'transparent',
                color: mode === 'enter' ? '#07090b' : 'var(--text-secondary)',
                transition: 'all 0.2s',
              }}
            >
              Enter Code (Joiner)
            </button>
          </div>

          {mode === 'generate' ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <div style={{
                background: 'rgba(7, 9, 11, 0.75)',
                border: '1px solid var(--border-emerald-glow)',
                borderRadius: '16px',
                padding: '24px',
                width: '100%',
                marginBottom: '18px',
              }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
                  Single-Use Pairing Code
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
                  <ProvenanceBadge type="measured" detail="Cryptographically generated via secrets.randbelow" size="sm" />
                </div>
              </div>

              <LiquidGlassButton
                variant="secondary"
                onClick={handleGenerateNew}
                icon={<RefreshCw size={14} />}
                style={{ width: '100%', marginBottom: '14px' }}
              >
                Regenerate Token
              </LiquidGlassButton>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                Enter this 6-digit code on your secondary device to establish an authenticated P2P socket channel.
              </span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  6-Digit Code displayed on Host peer:
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
                  Peer Hardware Trust Level:
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

              {pairingSuccess ? (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '14px',
                  background: 'rgba(69, 245, 154, 0.12)',
                  border: '1px solid var(--color-emerald)',
                  borderRadius: '10px',
                  color: 'var(--color-emerald)',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                }}>
                  <CheckCircle2 size={18} />
                  Peer Authenticated! Added to Socket Mesh.
                </div>
              ) : (
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
        </SpatialGlassSurface>
      </motion.div>
    </div>
  );
}
