import React from 'react';

export default function LiquidGlassInput({
  value,
  onChange,
  placeholder = '',
  type = 'text',
  icon,
  className = '',
  style = {},
  disabled = false,
}) {
  return (
    <div style={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center' }}>
      {icon && (
        <span style={{
          position: 'absolute',
          left: '12px',
          color: 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          pointerEvents: 'none',
        }}>
          {icon}
        </span>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={className}
        style={{
          width: '100%',
          padding: icon ? '10px 14px 10px 38px' : '10px 14px',
          background: 'var(--color-surface-translucent)',
          border: '1px solid var(--border-metallic)',
          borderRadius: '12px',
          color: 'var(--text-primary)',
          fontSize: '0.85rem',
          fontFamily: 'var(--font-sans)',
          outline: 'none',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          transition: 'border-color 0.2s, box-shadow 0.2s',
          ...style,
        }}
        onFocus={(e) => {
          e.target.style.borderColor = 'var(--color-emerald)';
          e.target.style.boxShadow = '0 0 12px rgba(69, 245, 154, 0.2)';
        }}
        onBlur={(e) => {
          e.target.style.borderColor = 'var(--border-metallic)';
          e.target.style.boxShadow = 'none';
        }}
      />
    </div>
  );
}
