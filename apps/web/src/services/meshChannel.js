/**
 * NetSync Real-Time Cross-Tab & Cross-Device Mesh Event Bus
 * ==========================================================
 * Enables instant, seamless state continuity across:
 * 1. Multiple browser tabs on the same device (BroadcastChannel + LocalStorage event bus)
 * 2. Cross-device distributed nodes (Supabase cloud authority synchronization)
 *
 * Modeled after Link to Windows, Moto Connect, and OnePlus Connect:
 * - Real-time text buffer synchronization (keystroke-level or debounced updates)
 * - Real-time Universal Clipboard beaming
 * - Real-time URL beaming / tab handoff
 * - Direct P2P file transfers with auto-download and file locator
 * - Instant bidirectional pairing acknowledgement (Host + Paired Device)
 */

const CHANNEL_NAME = 'netsync_mesh_bus_v1';
const STORAGE_KEY = 'netsync_mesh_event_broadcast';

// Generate unique ID for this browser tab
export const CURRENT_TAB_ID =
  typeof window !== 'undefined'
    ? `tab_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
    : 'server_tab';

// Active subscribers set
const subscribers = new Set();

let broadcastChannel = null;

if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    broadcastChannel = new BroadcastChannel(CHANNEL_NAME);
    broadcastChannel.onmessage = (event) => {
      const msg = event.data;
      if (msg && msg.senderTabId !== CURRENT_TAB_ID) {
        notifySubscribers(msg);
      }
    };
  } catch (err) {
    console.warn('[NetSync Mesh] BroadcastChannel init error, falling back to storage:', err);
  }
}

// Fallback: Listen to storage events for cross-tab communication
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === STORAGE_KEY && event.newValue) {
      try {
        const msg = JSON.parse(event.newValue);
        if (msg && msg.senderTabId !== CURRENT_TAB_ID) {
          notifySubscribers(msg);
        }
      } catch (e) {
        // Ignore parse error
      }
    }
  });
}

function notifySubscribers(message) {
  subscribers.forEach((callback) => {
    try {
      callback(message);
    } catch (err) {
      console.error('[NetSync Mesh] Subscriber error:', err);
    }
  });
}

/**
 * Broadcast an event to all other tabs and peers on the local mesh
 * @param {string} type - Event type (e.g. 'DEVICE_PAIRED', 'WORKSPACE_BUFFER_UPDATE', 'CLIPBOARD_ITEM_PUSHED', 'TAB_HANDOFF_BEAM', 'P2P_FILE_OFFER')
 * @param {any} payload - Event data
 */
export function broadcastMeshEvent(type, payload) {
  const message = {
    id: `mesh_evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    senderTabId: CURRENT_TAB_ID,
    timestamp: Date.now(),
    type,
    payload,
  };

  // 1. Send via BroadcastChannel (sub-millisecond cross-tab delivery)
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage(message);
    } catch (e) {
      console.warn('[NetSync Mesh] postMessage error:', e);
    }
  }

  // 2. Write to localStorage to trigger window.storage event in other tabs
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(message));
    } catch (e) {
      // Ignore quota error
    }
  }

  return message;
}

/**
 * Subscribe to mesh events from other tabs and devices
 * @param {Function} callback - (message) => void
 * @returns {Function} Unsubscribe function
 */
export function subscribeMeshEvents(callback) {
  subscribers.add(callback);
  return () => {
    subscribers.delete(callback);
  };
}
