import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Network,
  Layers,
  FileText,
  Blocks,
  Clipboard,
  Laptop,
  QrCode,
  Radio,
  Activity,
  History,
  Settings,
  Sun,
  Moon,
  ChevronDown,
  HardDrive,
} from 'lucide-react';

export default function FloatingGlassNavbar({
  activeRoute,
  onRouteChange,
  onOpenPairModal,
  theme,
  onToggleTheme,
}) {
  const [openDropdown, setOpenDropdown] = useState(null);
  const navRef = useRef(null);

  // Close dropdown on outside click or Escape
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) {
        setOpenDropdown(null);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Primary 5 destinations with their child routes
  const primaryNav = [
    {
      id: 'overview',
      label: 'Overview',
      icon: Layers,
      primaryRoute: 'overview',
      isActive: activeRoute === 'overview',
      hasDropdown: false,
    },
    {
      id: 'continuity',
      label: 'Continuity',
      icon: FileText,
      primaryRoute: 'continuity',
      isActive: ['continuity', 'workspaces', 'clipboard'].includes(activeRoute),
      hasDropdown: true,
      children: [
        {
          id: 'continuity',
          title: 'Continuity Studio',
          description: 'Instant tab handoff & scroll offset sync',
          icon: FileText,
        },
        {
          id: 'workspaces',
          title: 'Spatial Workspaces',
          description: 'Synchronized editor buffers & draft history',
          icon: Blocks,
        },
        {
          id: 'clipboard',
          title: 'Universal Clipboard',
          description: 'P2P real-time encrypted clipboard stream',
          icon: Clipboard,
        },
      ],
    },
    {
      id: 'devices',
      label: 'Devices',
      icon: Laptop,
      primaryRoute: 'devices',
      isActive: ['devices', 'integrations'].includes(activeRoute),
      hasDropdown: true,
      children: [
        {
          id: 'devices',
          title: 'Devices & Mesh',
          description: 'Authenticated hardware peers & socket status',
          icon: Laptop,
        },
        {
          id: 'pair-action',
          title: 'Pair Hardware Peer',
          description: '6-digit time-limited cryptographic token',
          icon: QrCode,
          isAction: true,
          action: onOpenPairModal,
        },
        {
          id: 'integrations',
          title: 'Integrations & SDKs',
          description: 'Browser extension, mobile & Python daemons',
          icon: Radio,
        },
      ],
    },
    {
      id: 'network',
      label: 'Network',
      icon: Activity,
      primaryRoute: 'telemetry',
      isActive: ['telemetry', 'history'].includes(activeRoute),
      hasDropdown: true,
      children: [
        {
          id: 'telemetry',
          title: 'Network Intelligence',
          description: 'Empirical LAN direct vs cloud benchmarks',
          icon: Activity,
        },
        {
          id: 'history',
          title: 'Sync History Audit',
          description: 'State deltas, CRC-32 & conflict resolutions',
          icon: History,
        },
      ],
    },
    {
      id: 'file-transfer',
      label: 'File Transfer',
      icon: HardDrive,
      primaryRoute: 'file-transfer',
      isActive: activeRoute === 'file-transfer',
      hasDropdown: false,
    },
  ];

  const handleNavClick = (item) => {
    if (!item.hasDropdown) {
      setOpenDropdown(null);
      onRouteChange(item.primaryRoute);
    } else {
      setOpenDropdown(openDropdown === item.id ? null : item.id);
    }
  };

  const handleChildClick = (child) => {
    setOpenDropdown(null);
    if (child.isAction && child.action) {
      child.action();
    } else if (child.id) {
      onRouteChange(child.id);
    }
  };

  return (
    <header
      ref={navRef}
      style={{
        position: 'sticky',
        top: '16px',
        zIndex: 100,
        width: 'calc(100% - 32px)',
        maxWidth: '1060px',
        margin: '0 auto',
        marginBottom: '28px',
        overflow: 'visible',
      }}
    >
      <div
        className="spatial-glass-navbar"
        style={{
          padding: '8px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderRadius: '9999px',
          boxShadow: 'var(--shadow-liquid-glass)',
          background: 'var(--color-surface-translucent)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid var(--border-metallic)',
          position: 'relative',
          overflow: 'visible',
        }}
      >
        {/* A. Brand Area */}
        <div
          onClick={() => {
            setOpenDropdown(null);
            onRouteChange('overview');
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            cursor: 'pointer',
            paddingLeft: '4px',
            userSelect: 'none',
          }}
          title="NetSync Home"
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '9999px',
              background: 'linear-gradient(135deg, rgba(69, 245, 154, 0.22) 0%, rgba(139, 255, 208, 0.08) 100%)',
              border: '1px solid var(--border-emerald-glow)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 14px var(--color-emerald-glow)',
              flexShrink: 0,
            }}
          >
            <Network size={17} color="var(--color-emerald)" />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span
              style={{
                fontSize: '1.05rem',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                color: 'var(--text-primary)',
              }}
            >
              NetSync
            </span>
            <span
              className="badge-emerald-pill"
              style={{
                fontSize: '0.6rem',
                padding: '1px 6px',
                lineHeight: 1.2,
              }}
            >
              SPATIAL
            </span>
          </div>
        </div>

        {/* B. Main 4 Navigation Capsules */}
        <nav
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            background: theme === 'dark' ? 'rgba(7, 9, 11, 0.5)' : 'rgba(233, 238, 240, 0.65)',
            padding: '3px 4px',
            borderRadius: '9999px',
            border: '1px solid var(--border-metallic)',
            position: 'relative',
            overflow: 'visible',
          }}
        >
          {primaryNav.map((item) => {
            const Icon = item.icon;
            const isMenuOpen = openDropdown === item.id;

            return (
              <div
                key={item.id}
                style={{ position: 'relative', overflow: 'visible' }}
                onMouseEnter={() => {
                  if (item.hasDropdown) setOpenDropdown(item.id);
                }}
                onMouseLeave={() => {
                  if (item.hasDropdown) setOpenDropdown(null);
                }}
              >
                <button
                  onClick={() => handleNavClick(item)}
                  style={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '7px 14px',
                    borderRadius: '9999px',
                    fontSize: '0.82rem',
                    fontWeight: item.isActive ? 700 : 600,
                    border: 'none',
                    cursor: 'pointer',
                    background: 'transparent',
                    color: item.isActive
                      ? 'var(--color-emerald)'
                      : 'var(--text-secondary)',
                    transition: 'color 0.2s ease',
                    outline: 'none',
                    userSelect: 'none',
                  }}
                  onMouseEnter={(e) => {
                    if (!item.isActive) {
                      e.currentTarget.style.color = 'var(--text-primary)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!item.isActive) {
                      e.currentTarget.style.color = 'var(--text-secondary)';
                    }
                  }}
                  aria-expanded={isMenuOpen}
                >
                  {item.isActive && (
                    <motion.div
                      layoutId="activeNavCapsule"
                      style={{
                        position: 'absolute',
                        inset: 0,
                        borderRadius: '9999px',
                        background:
                          theme === 'dark'
                            ? 'rgba(69, 245, 154, 0.12)'
                            : 'rgba(8, 127, 91, 0.12)',
                        border: '1px solid var(--border-emerald-glow)',
                        boxShadow: '0 0 14px var(--color-emerald-glow)',
                        zIndex: 0,
                      }}
                      transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                    />
                  )}

                  <span
                    style={{
                      position: 'relative',
                      zIndex: 1,
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <Icon size={14} color={item.isActive ? 'var(--color-emerald)' : 'currentColor'} />
                  </span>
                  <span style={{ position: 'relative', zIndex: 1 }}>{item.label}</span>
                  {item.hasDropdown && (
                    <span
                      style={{
                        position: 'relative',
                        zIndex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        transition: 'transform 0.2s ease',
                        transform: isMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      }}
                    >
                      <ChevronDown size={12} />
                    </span>
                  )}
                </button>

                {/* Dropdown Popover */}
                <AnimatePresence>
                  {isMenuOpen && item.children && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, x: '-50%', scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, x: '-50%', scale: 1 }}
                      exit={{ opacity: 0, y: 6, x: '-50%', scale: 0.96 }}
                      transition={{ duration: 0.16, ease: 'easeOut' }}
                      style={{
                        position: 'absolute',
                        top: 'calc(100% + 14px)',
                        left: '50%',
                        width: '270px',
                        padding: '8px',
                        borderRadius: '18px',
                        boxShadow:
                          theme === 'dark'
                            ? '0 24px 56px -8px rgba(0, 0, 0, 0.9), 0 0 24px rgba(16, 185, 129, 0.18)'
                            : '0 24px 56px -8px rgba(0, 0, 0, 0.16), 0 0 20px rgba(8, 127, 91, 0.14)',
                        background:
                          theme === 'dark'
                            ? 'rgba(12, 17, 22, 0.96)'
                            : 'rgba(255, 255, 255, 0.97)',
                        backdropFilter: 'blur(32px)',
                        WebkitBackdropFilter: 'blur(32px)',
                        border:
                          theme === 'dark'
                            ? '1px solid rgba(255, 255, 255, 0.15)'
                            : '1px solid rgba(0, 0, 0, 0.12)',
                        zIndex: 9999,
                        overflow: 'visible',
                        pointerEvents: 'auto',
                      }}
                    >
                      {/* Top Arrow Pointer */}
                      <div
                        style={{
                          position: 'absolute',
                          top: '-6px',
                          left: '50%',
                          marginLeft: '-6px',
                          width: '12px',
                          height: '12px',
                          background:
                            theme === 'dark'
                              ? 'rgba(12, 17, 22, 0.96)'
                              : 'rgba(255, 255, 255, 0.97)',
                          borderLeft:
                            theme === 'dark'
                              ? '1px solid rgba(255, 255, 255, 0.15)'
                              : '1px solid rgba(0, 0, 0, 0.12)',
                          borderTop:
                            theme === 'dark'
                              ? '1px solid rgba(255, 255, 255, 0.15)'
                              : '1px solid rgba(0, 0, 0, 0.12)',
                          transform: 'rotate(45deg)',
                          zIndex: 1,
                        }}
                      />

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', position: 'relative', zIndex: 2 }}>
                        {item.children.map((child) => {
                          const ChildIcon = child.icon;
                          const isChildActive = activeRoute === child.id;

                          return (
                            <button
                              key={child.id}
                              onClick={() => handleChildClick(child)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                padding: '8px 12px',
                                borderRadius: '12px',
                                border: 'none',
                                background: isChildActive
                                  ? theme === 'dark'
                                    ? 'rgba(69, 245, 154, 0.14)'
                                    : 'rgba(8, 127, 91, 0.12)'
                                  : 'transparent',
                                color: isChildActive
                                  ? 'var(--color-emerald)'
                                  : 'var(--text-primary)',
                                textAlign: 'left',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                                width: '100%',
                              }}
                              onMouseEnter={(e) => {
                                if (!isChildActive) {
                                  e.currentTarget.style.background =
                                    theme === 'dark'
                                      ? 'rgba(255, 255, 255, 0.08)'
                                      : 'rgba(0, 0, 0, 0.05)';
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!isChildActive) {
                                  e.currentTarget.style.background = 'transparent';
                                }
                              }}
                            >
                              <div
                                style={{
                                  width: '30px',
                                  height: '30px',
                                  borderRadius: '8px',
                                  background: isChildActive
                                    ? 'rgba(16, 185, 129, 0.2)'
                                    : theme === 'dark'
                                      ? 'rgba(255, 255, 255, 0.06)'
                                      : 'rgba(0, 0, 0, 0.05)',
                                  border: isChildActive
                                    ? '1px solid var(--border-emerald-glow)'
                                    : '1px solid var(--border-metallic)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: isChildActive
                                    ? 'var(--color-emerald)'
                                    : 'var(--text-secondary)',
                                  flexShrink: 0,
                                }}
                              >
                                <ChildIcon size={15} />
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span
                                  style={{
                                    fontSize: '0.82rem',
                                    fontWeight: isChildActive ? 700 : 600,
                                    lineHeight: 1.25,
                                    color: isChildActive
                                      ? 'var(--color-emerald)'
                                      : 'var(--text-primary)',
                                  }}
                                >
                                  {child.title}
                                </span>
                                <span
                                  style={{
                                    fontSize: '0.7rem',
                                    color: 'var(--text-muted)',
                                    lineHeight: 1.2,
                                    marginTop: '2px',
                                  }}
                                >
                                  {child.description}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </nav>

        {/* C. Essential Utility Controls (Theme, Pair, Settings) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {/* Theme Toggle */}
          <button
            onClick={onToggleTheme}
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '9999px',
              border: '1px solid var(--border-metallic)',
              background: 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
              e.currentTarget.style.borderColor = 'var(--border-emerald-glow)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.borderColor = 'var(--border-metallic)';
            }}
            title={`Switch to ${theme === 'dark' ? 'Pearl White' : 'Obsidian Dark'} mode`}
            aria-label="Toggle visual theme"
          >
            {theme === 'dark' ? (
              <Sun size={15} color="var(--color-emerald)" />
            ) : (
              <Moon size={15} color="var(--text-primary)" />
            )}
          </button>

          {/* Pair Device Action Button */}
          <button
            onClick={() => {
              setOpenDropdown(null);
              onOpenPairModal();
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '9999px',
              border: '1px solid var(--border-emerald-glow)',
              background:
                theme === 'dark'
                  ? 'linear-gradient(135deg, rgba(69, 245, 154, 0.16) 0%, rgba(139, 255, 208, 0.06) 100%)'
                  : 'linear-gradient(135deg, rgba(8, 127, 91, 0.14) 0%, rgba(11, 168, 121, 0.06) 100%)',
              color: 'var(--color-emerald)',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 10px var(--color-emerald-glow)',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 4px 16px var(--color-emerald-glow)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 10px var(--color-emerald-glow)';
            }}
            title="Pair new hardware peer"
          >
            <QrCode size={13} />
            <span>Pair</span>
          </button>

          {/* Settings Control */}
          <button
            onClick={() => {
              setOpenDropdown(null);
              onRouteChange('settings');
            }}
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '9999px',
              border: '1px solid',
              borderColor:
                activeRoute === 'settings'
                  ? 'var(--border-emerald-glow)'
                  : 'var(--border-metallic)',
              background:
                activeRoute === 'settings'
                  ? theme === 'dark'
                    ? 'rgba(69, 245, 154, 0.12)'
                    : 'rgba(8, 127, 91, 0.12)'
                  : 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color:
                activeRoute === 'settings'
                  ? 'var(--color-emerald)'
                  : 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--text-primary)';
              e.currentTarget.style.borderColor = 'var(--border-emerald-glow)';
            }}
            onMouseLeave={(e) => {
              if (activeRoute !== 'settings') {
                e.currentTarget.style.color = 'var(--text-secondary)';
                e.currentTarget.style.borderColor = 'var(--border-metallic)';
              }
            }}
            title="System Preferences & Hardware Trust"
            aria-label="Settings"
          >
            <Settings size={15} />
          </button>
        </div>
      </div>
    </header>
  );
}
