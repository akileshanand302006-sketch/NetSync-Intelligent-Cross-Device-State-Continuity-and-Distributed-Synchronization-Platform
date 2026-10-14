import React from 'react';
import { Laptop, Smartphone, Tablet, Monitor, Radio, Shield, Zap, RefreshCw } from 'lucide-react';

export default function DeviceManager({ onOpenPairModal }) {
  const devices = [
    {
      id: 'dev-1',
      name: 'Workstation Alpha',
      type: 'Desktop (Host)',
      os: 'Windows 11 Pro',
      ip: '192.168.1.101',
      port: 9100,
      status: 'online',
      rtt: '0.4ms',
      lastSeen: 'Active now',
      isHost: true,
    },
    {
      id: 'dev-2',
      name: 'MacBook Pro M3 Max',
      type: 'Laptop',
      os: 'macOS 14.5 Sonoma',
      ip: '192.168.1.102',
      port: 9100,
      status: 'online',
      rtt: '2.1ms',
      lastSeen: 'Active now',
      isHost: false,
    },
    {
      id: 'dev-3',
      name: 'Google Pixel 9 Pro',
      type: 'Mobile Phone',
      os: 'Android 15 (Wi-Fi 6)',
      ip: '192.168.1.105',
      port: 9100,
      status: 'online',
      rtt: '3.8ms',
      lastSeen: 'Active now',
      isHost: false,
    },
    {
      id: 'dev-4',
      name: 'iPad Pro 13" M4',
      type: 'Tablet',
      os: 'iPadOS 18.1',
      ip: '192.168.1.108',
      port: 9100,
      status: 'online',
      rtt: '4.2ms',
      lastSeen: 'Active now',
      isHost: false,
    },
    {
      id: 'dev-5',
      name: 'Chrome Extension Node',
      type: 'Browser Extension',
      os: 'Manifest V3 Background',
      ip: '127.0.0.1',
      port: 9100,
      status: 'online',
      rtt: '1.2ms',
      lastSeen: 'Active now',
      isHost: false,
    },
  ];

  const getIcon = (type) => {
    if (type.includes('Laptop')) return Laptop;
    if (type.includes('Mobile')) return Smartphone;
    if (type.includes('Tablet')) return Tablet;
    if (type.includes('Extension')) return Radio;
    return Monitor;
  };

  return (
    <div className="glass-panel" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc', marginBottom: '4px' }}>
            Trusted Device Mesh Peers ({devices.length})
          </h3>
          <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
            Direct point-to-point sockets with HMAC-SHA256 authenticated links.
          </p>
        </div>
        <button onClick={onOpenPairModal} className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.8rem' }}>
          + Pair New Device
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
        {devices.map((device) => {
          const Icon = getIcon(device.type);
          return (
            <div
              key={device.id}
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: device.isHost ? '1px solid rgba(56, 189, 248, 0.35)' : '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '14px',
                padding: '18px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: device.isHost ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Icon size={18} color={device.isHost ? '#38bdf8' : '#e2e8f0'} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className="pulse-dot"></span>
                    <span className="badge-pill badge-emerald" style={{ fontSize: '0.65rem' }}>
                      {device.status}
                    </span>
                  </div>
                </div>

                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#f8fafc', marginBottom: '2px' }}>
                  {device.name}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '12px' }}>
                  {device.os}
                </div>

                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  background: 'rgba(6, 9, 19, 0.5)',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  fontSize: '0.75rem',
                  fontFamily: 'var(--font-mono)',
                  marginBottom: '14px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>IP:Port:</span>
                    <span style={{ color: '#e2e8f0' }}>{device.ip}:{device.port}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Socket RTT:</span>
                    <span style={{ color: '#38bdf8', fontWeight: 600 }}>{device.rtt}</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.725rem', color: '#64748b' }}>
                <span>{device.lastSeen}</span>
                <span style={{ color: '#34d399', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Shield size={12} /> Trusted
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
