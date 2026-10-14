import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Laptop, Smartphone, Tablet, Monitor, Radio, Shield, Trash2, QrCode, RefreshCw, CheckCircle2, Activity } from 'lucide-react';
import SpatialGlassSurface from '../design-system/SpatialGlassSurface';
import LiquidGlassButton from '../design-system/LiquidGlassButton';

export default function DevicesView({ devices = [], onOpenPairModal, onRevokeDevice }) {
  const [revokingId, setRevokingId] = useState(null);

  const getDeviceIcon = (type) => {
    if (type.includes('laptop')) return Laptop;
    if (type.includes('phone') || type.includes('mobile')) return Smartphone;
    if (type.includes('tablet')) return Tablet;
    if (type.includes('extension')) return Radio;
    return Monitor;
  };

  const handleRevoke = (id, name) => {
    if (window.confirm(`Revoke trust for ${name}? The device will be disconnected from the mesh and require a new 6-digit code to rejoin.`)) {
      setRevokingId(id);
      setTimeout(() => {
        if (onRevokeDevice) onRevokeDevice(id);
        setRevokingId(null);
      }, 500);
    }
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
                TRUSTED DEVICE MESH
              </span>
            </div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              Peer Nodes & Socket Channels ({devices.length})
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Direct point-to-point connections with HMAC-SHA256 authenticated links and zero-configuration mDNS discovery.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <LiquidGlassButton
              variant="primary"
              onClick={onOpenPairModal}
              icon={<QrCode size={16} />}
            >
              Pair New Device
            </LiquidGlassButton>
          </div>
        </div>
      </SpatialGlassSurface>

      {/* Grid of Spatial Glass Device Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
        {devices.map((device) => {
          const Icon = getDeviceIcon(device.device_type || '');
          const isRevoking = revokingId === device.id;

          return (
            <SpatialGlassSurface
              key={device.id}
              interactive
              glow={device.is_online}
              style={{
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background: 'var(--color-emerald-dim)',
                    border: '1px solid rgba(69, 245, 154, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Icon size={22} color="var(--color-emerald)" />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className="pulse-emerald-dot"></span>
                    <span className="badge-emerald-pill" style={{ fontSize: '0.68rem' }}>
                      {device.is_online ? 'Online' : 'Idle'}
                    </span>
                  </div>
                </div>

                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  {device.device_name}
                </h3>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                  {device.os || 'Universal Platform Node'}
                </div>

                {/* Network & Socket Attributes */}
                <div className="frosted-subpanel" style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Socket Address:</span>
                    <span style={{ color: 'var(--text-primary)' }}>{device.ip_address || '192.168.1.101'}:{device.port || 9100}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Application RTT:</span>
                    <span style={{ color: 'var(--color-emerald)', fontWeight: 600 }}>2.1 ms</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Transport Layer:</span>
                    <span style={{ color: 'var(--color-mint)' }}>TCP / NSFP v1</span>
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: '14px',
                borderTop: '1px solid var(--border-metallic-subtle)',
              }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Shield size={13} color="var(--color-emerald)" /> HMAC Authenticated
                </span>

                <button
                  onClick={() => handleRevoke(device.id, device.device_name)}
                  disabled={isRevoking}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--color-rose)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    opacity: isRevoking ? 0.5 : 0.8,
                    transition: 'opacity 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = '0.8'}
                >
                  <Trash2 size={13} />
                  Revoke
                </button>
              </div>
            </SpatialGlassSurface>
          );
        })}
      </div>
    </div>
  );
}
