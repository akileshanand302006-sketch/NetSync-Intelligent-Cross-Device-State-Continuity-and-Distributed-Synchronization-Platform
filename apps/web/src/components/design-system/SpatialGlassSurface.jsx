import React, { useRef, useState } from 'react';
import { motion } from 'motion/react';

export default function SpatialGlassSurface({
  children,
  className = '',
  style = {},
  glow = false,
  interactive = false,
  onClick,
}) {
  const surfaceRef = useRef(null);
  const [mousePos, setMousePos] = useState({ x: '50%', y: '0%' });

  const handleMouseMove = (e) => {
    if (!surfaceRef.current) return;
    const rect = surfaceRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePos({ x: `${x}%`, y: `${y}%` });
  };

  return (
    <motion.div
      ref={surfaceRef}
      onMouseMove={handleMouseMove}
      onClick={onClick}
      className={`spatial-glass-surface ${glow ? 'spatial-glass-surface-glow' : ''} ${className}`}
      style={{
        ...style,
        cursor: interactive ? 'pointer' : 'default',
      }}
      whileHover={interactive ? { y: -2, transition: { duration: 0.2 } } : undefined}
      whileTap={interactive ? { scale: 0.99 } : undefined}
    >
      {/* Dynamic Specular Reflection Point */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `radial-gradient(circle at ${mousePos.x} ${mousePos.y}, rgba(255, 255, 255, 0.06) 0%, transparent 45%)`,
          pointerEvents: 'none',
          transition: 'background 0.15s ease',
        }}
      />
      {children}
    </motion.div>
  );
}
