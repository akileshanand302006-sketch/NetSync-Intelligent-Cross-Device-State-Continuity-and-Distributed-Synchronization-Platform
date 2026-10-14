import React from 'react';
import { motion } from 'motion/react';

export default function LiquidGlassButton({
  children,
  variant = 'primary', // primary | secondary | ghost
  size = 'md', // sm | md | lg
  onClick,
  disabled = false,
  className = '',
  style = {},
  icon,
}) {
  const getVariantClass = () => {
    if (variant === 'primary') return 'liquid-btn-primary';
    if (variant === 'ghost') return 'liquid-btn-emerald-ghost';
    return 'liquid-btn-secondary';
  };

  const sizeStyles = {
    sm: { padding: '6px 12px', fontSize: '0.775rem' },
    md: { padding: '10px 20px', fontSize: '0.875rem' },
    lg: { padding: '14px 28px', fontSize: '1rem' },
  }[size] || {};

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      className={`${getVariantClass()} ${className}`}
      style={{
        ...sizeStyles,
        ...style,
        opacity: disabled ? 0.5 : 1,
        pointerEvents: disabled ? 'none' : 'auto',
      }}
      whileHover={!disabled ? { y: -1, filter: 'brightness(1.08)' } : undefined}
      whileTap={!disabled ? { scale: 0.98, y: 1 } : undefined}
      transition={{ duration: 0.15 }}
    >
      {icon && <span style={{ display: 'inline-flex' }}>{icon}</span>}
      {children}
    </motion.button>
  );
}
