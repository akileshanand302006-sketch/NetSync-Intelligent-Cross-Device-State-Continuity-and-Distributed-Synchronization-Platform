import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import FloatingGlassNavbar from './components/design-system/FloatingGlassNavbar';
import FloatingGlassDock from './components/design-system/FloatingGlassDock';
import GlassCommandPalette from './components/design-system/GlassCommandPalette';
import PairingModal from './components/PairingModal';
import NetSyncFooter from './components/layout/NetSyncFooter';

// Spatial Liquid Glass Page Views
import OverviewView from './components/views/OverviewView';
import DevicesView from './components/views/DevicesView';
import ContinuityView from './components/views/ContinuityView';
import WorkspacesView from './components/views/WorkspacesView';
import ClipboardView from './components/views/ClipboardView';
import TelemetryView from './components/views/TelemetryView';
import SyncHistoryView from './components/views/SyncHistoryView';
import IntegrationsView from './components/views/IntegrationsView';
import SettingsView from './components/views/SettingsView';
import FileTransferView from './components/views/FileTransferView';

// API Services
import {
  fetchDevices,
  fetchNetworkSummary,
  fetchSyncHistory,
  pushClipboardItem,
} from './services/api';

// SPA Route Definitions and Titles
const VALID_ROUTES = [
  'overview',
  'devices',
  'continuity',
  'workspaces',
  'clipboard',
  'file-transfer',
  'telemetry',
  'history',
  'integrations',
  'settings',
];

const ROUTE_TITLES = {
  overview: 'NetSync — Spatial Continuity • Continue Anywhere. Lose Nothing.',
  devices: 'NetSync — Device Mesh & Sockets',
  continuity: 'NetSync — Continuity Studio & Tab Handoff',
  workspaces: 'NetSync — Spatial Workspaces & Buffers',
  clipboard: 'NetSync — Universal Liquid Clipboard',
  'file-transfer': 'NetSync — P2P File Transfer & WebRTC DataChannels',
  telemetry: 'NetSync — Network Intelligence & CN Benchmarks',
  history: 'NetSync — State Synchronization Audit History',
  integrations: 'NetSync — Cross-Platform Adapters & Protocol RFC',
  settings: 'NetSync — Preferences & Hardware Trust',
};

function getRouteFromLocation() {
  if (typeof window === 'undefined') return 'overview';

  // Check hash first (e.g. #/devices or #devices)
  const hash = window.location.hash.replace(/^#[/]?/, '');
  if (VALID_ROUTES.includes(hash)) return hash;

  // Check pathname (e.g. /devices)
  const path = window.location.pathname.replace(/^\//, '').split('/')[0];
  if (VALID_ROUTES.includes(path)) return path;

  return 'overview';
}

function getUrlForRoute(route) {
  return route === 'overview' ? '/' : `/${route}`;
}

export default function App() {
  const [activeRoute, setActiveRoute] = useState(getRouteFromLocation);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('netsync_theme') || 'dark';
  });
  const [isPairModalOpen, setIsPairModalOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [mouseParallax, setMouseParallax] = useState({ x: 0, y: 0 });

  // Mesh State
  const [devices, setDevices] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [logs, setLogs] = useState([]);

  // Client-Side SPA Navigation Handler
  const handleNavigate = useCallback((targetRoute) => {
    if (!VALID_ROUTES.includes(targetRoute)) return;

    setActiveRoute(targetRoute);

    const targetUrl = getUrlForRoute(targetRoute);
    if (window.location.pathname !== targetUrl && window.location.hash.replace(/^#[/]?/, '') !== targetRoute) {
      window.history.pushState({ route: targetRoute }, '', targetUrl);
    }

    if (ROUTE_TITLES[targetRoute]) {
      document.title = ROUTE_TITLES[targetRoute];
    }
  }, []);

  // Listen to browser Back/Forward (popstate)
  useEffect(() => {
    const onPopState = (event) => {
      const route = event.state?.route || getRouteFromLocation();
      setActiveRoute(route);
      if (ROUTE_TITLES[route]) {
        document.title = ROUTE_TITLES[route];
      }
    };

    window.addEventListener('popstate', onPopState);

    // Initial title and state check
    const current = getRouteFromLocation();
    if (ROUTE_TITLES[current]) {
      document.title = ROUTE_TITLES[current];
    }
    const currentUrl = getUrlForRoute(current);
    window.history.replaceState({ route: current }, '', currentUrl);

    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // Sync theme with document element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('netsync_theme', theme);
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Initial Data Fetch
  useEffect(() => {
    let mounted = true;

    async function loadData() {
      const [devList, netSum, syncHist] = await Promise.all([
        fetchDevices(),
        fetchNetworkSummary(),
        fetchSyncHistory(),
      ]);

      if (mounted) {
        setDevices(devList);
        setMetrics(netSum);
        if (syncHist && syncHist.length > 0) {
          setLogs(
            syncHist.map((item, idx) => ({
              id: item.id || `evt-${109 - idx}`,
              timestamp: new Date(item.timestamp || Date.now()).toTimeString().split(' ')[0],
              state: item.state_id || 'Workspace Alpha',
              version: `Rev #${item.version || 6}`,
              type: item.sync_type || 'delta',
              bytes: item.bytes_transferred || 48,
              savings: '87.5%',
              conflict: item.conflict_detected || false,
              strategy: item.conflict_strategy,
              device: 'MacBook Pro M3 Max',
            }))
          );
        }
      }
    }

    loadData();
    return () => {
      mounted = false;
    };
  }, []);

  // Global Keyboard Shortcuts (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Desktop Mouse Parallax Handler
  const handleMouseMove = (e) => {
    const x = (e.clientX / window.innerWidth - 0.5) * 2;
    const y = (e.clientY / window.innerHeight - 0.5) * 2;
    setMouseParallax({ x, y });
  };

  // Handlers for interactive simulations
  const handleTriggerSimulation = (type) => {
    const timeStr = new Date().toTimeString().split(' ')[0];
    if (type === 'conflict') {
      const newEvt = {
        id: `evt-${Date.now()}`,
        timestamp: timeStr,
        state: 'Workspace Alpha / buffer',
        version: `Rev #${logs.length + 5}`,
        type: 'delta',
        bytes: 112,
        savings: '84.2%',
        conflict: true,
        strategy: 'field_merge',
        device: 'Google Pixel 9 Pro',
        targetDevice: 'Workstation Alpha',
        details: {
          conflict_fields: ['cursor_positions', 'selectionRange'],
          resolution: 'Non-overlapping fields merged automatically; monotonic vector clock preserved.',
          ack_rtt_ms: 3.2,
          crc32: '0x8A4B29E1',
        },
      };
      setLogs((prev) => [newEvt, ...prev]);
    } else if (type === 'burst') {
      const newEvt = {
        id: `evt-${Date.now()}`,
        timestamp: timeStr,
        state: 'Telemetry Probe Frame (MSG_PING)',
        version: `Rev #${logs.length + 6}`,
        type: 'delta',
        bytes: 32,
        savings: '92.4%',
        conflict: false,
        strategy: null,
        device: 'Workstation Alpha',
        targetDevice: 'All Mesh Nodes',
        details: {
          fields_modified: ['rtt_probe_timestamp'],
          ack_rtt_ms: 1.8,
          crc32: '0x22F099BC',
        },
      };
      setLogs((prev) => [newEvt, ...prev]);
    }
  };

  const handlePushClipboard = async (newItem) => {
    const timeStr = new Date().toTimeString().split(' ')[0];
    setLogs((prev) => [
      {
        id: `evt-${Date.now()}`,
        timestamp: timeStr,
        state: 'Universal Clipboard',
        version: `Rev #${prev.length + 1}`,
        type: 'delta',
        bytes: newItem.bytes,
        savings: '76.5%',
        conflict: false,
        strategy: null,
        device: newItem.device,
        targetDevice: 'All Mesh Nodes',
      },
      ...prev,
    ]);

    await pushClipboardItem(newItem.device, newItem.content, newItem.type);
  };

  const handleBeamHandoff = (handoff) => {
    const timeStr = new Date().toTimeString().split(' ')[0];
    setLogs((prev) => [
      {
        id: `evt-${Date.now()}`,
        timestamp: timeStr,
        state: handoff.tab.title.substring(0, 26),
        version: `Rev #${prev.length + 1}`,
        type: 'delta',
        bytes: 52,
        savings: '89.2%',
        conflict: false,
        strategy: null,
        device: 'Target Peer Beam',
        targetDevice: handoff.targetDevice,
      },
      ...prev,
    ]);
  };

  const handleRevokeDevice = (deviceId) => {
    setDevices((prev) => prev.filter((d) => d.id !== deviceId));
  };

  const handleDevicePaired = (newDevice) => {
    const created = {
      id: `dev-${Date.now()}`,
      device_name: newDevice.name || 'New Hardware Peer',
      device_type: newDevice.type?.toLowerCase().includes('phone') ? 'phone' : 'laptop',
      os: 'NetSync OS 2.4',
      ip_address: '192.168.1.112',
      port: 9100,
      is_online: true,
      is_trusted: true,
      last_seen: 'Now',
    };
    setDevices((prev) => [...prev, created]);
  };

  return (
    <div className="cinematic-viewport" onMouseMove={handleMouseMove}>
      {/* Cinematic Background Multi-Layer System */}
      <div className="cinematic-bg-container">
        <div
          className="cinematic-bg-image"
          style={{
            transform: `translate3d(${mouseParallax.x * -16}px, ${mouseParallax.y * -16}px, 0) scale(1.04)`,
          }}
        />
        <div className="cinematic-atmospheric-overlay" />
        <div className="cinematic-grid-overlay" />
      </div>

      {/* Floating Desktop Navigation */}
      <div className="desktop-nav-wrapper">
        <FloatingGlassNavbar
          activeRoute={activeRoute}
          onRouteChange={handleNavigate}
          onOpenPairModal={() => setIsPairModalOpen(true)}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          theme={theme}
          onToggleTheme={handleToggleTheme}
          peersCount={devices.filter((d) => d.is_online).length || 5}
          rtt={metrics?.avg_latency_ms ? `${metrics.avg_latency_ms}ms` : '2.4ms'}
        />
      </div>

      {/* Main Viewport Container */}
      <main
        className="main-content-container"
        style={{
          position: 'relative',
          zIndex: 10,
          flex: 1,
          maxWidth: '1440px',
          width: '100%',
          margin: '0 auto',
          padding: '0 24px 48px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={activeRoute}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            {activeRoute === 'overview' && (
              <OverviewView
                onNavigate={handleNavigate}
                onOpenPairModal={() => setIsPairModalOpen(true)}
                devices={devices}
                metrics={metrics}
                recentLogs={logs}
                onTriggerSimulation={handleTriggerSimulation}
              />
            )}

            {activeRoute === 'devices' && (
              <DevicesView
                devices={devices}
                onOpenPairModal={() => setIsPairModalOpen(true)}
                onRevokeDevice={handleRevokeDevice}
              />
            )}

            {activeRoute === 'continuity' && (
              <ContinuityView onBeamHandoff={handleBeamHandoff} />
            )}

            {activeRoute === 'workspaces' && <WorkspacesView />}

            {activeRoute === 'clipboard' && (
              <ClipboardView onPushClipboard={handlePushClipboard} />
            )}

            {activeRoute === 'file-transfer' && (
              <FileTransferView
                devices={devices}
                onOpenPairModal={() => setIsPairModalOpen(true)}
              />
            )}

            {activeRoute === 'telemetry' && (
              <TelemetryView
                onTriggerSimulation={handleTriggerSimulation}
                devices={devices}
              />
            )}

            {activeRoute === 'history' && <SyncHistoryView logs={logs} />}

            {activeRoute === 'integrations' && <IntegrationsView />}

            {activeRoute === 'settings' && (
              <SettingsView currentTheme={theme} onToggleTheme={handleToggleTheme} />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Premium NetSync Liquid Glass Footer */}
      <NetSyncFooter
        activeRoute={activeRoute}
        onRouteChange={handleNavigate}
        onOpenPairModal={() => setIsPairModalOpen(true)}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
      />

      {/* Mobile Floating Glass Dock */}
      <div className="mobile-dock-wrapper">
        <FloatingGlassDock
          activeRoute={activeRoute}
          onRouteChange={handleNavigate}
          onOpenPairModal={() => setIsPairModalOpen(true)}
        />
      </div>

      {/* Glass Command Palette (Cmd+K) */}
      <GlassCommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigate={handleNavigate}
        onOpenPairModal={() => setIsPairModalOpen(true)}
        onToggleTheme={handleToggleTheme}
        theme={theme}
      />

      {/* Pairing Modal */}
      <PairingModal
        isOpen={isPairModalOpen}
        onClose={() => setIsPairModalOpen(false)}
        onDevicePaired={handleDevicePaired}
      />
    </div>
  );
}
