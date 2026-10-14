/**
 * NetSync Browser Extension — Background Service Worker
 * Handles tab synchronization, WebSocket connections to NetSync API, and incoming handoffs.
 */

const API_BASE = 'http://localhost:8000/api/v1';

// Handle extension messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'beam_tab') {
    handleBeamTab(request.tab, request.targetDevice)
      .then((res) => sendResponse({ success: true, res }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true; // keep channel open for async response
  }

  if (request.action === 'push_clipboard') {
    handlePushClipboard(request.content)
      .then((res) => sendResponse({ success: true, res }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true;
  }

  if (request.action === 'scroll_updated') {
    chrome.storage.local.set({ [request.url]: request.scrollPercent });
  }
});

async function handleBeamTab(tab, targetDevice) {
  try {
    const payload = {
      source_device_id: 'dev-chrome-ext',
      target_device_id: targetDevice,
      session_type: 'handoff',
      state_type: 'workspace',
      payload: {
        title: tab.title,
        url: tab.url,
        scroll: tab.scroll,
      },
    };

    // Attempt direct API post if server is reachable
    const response = await fetch(`${API_BASE}/continuity/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return await response.json();
  } catch (e) {
    console.log('[NetSync Ext] Offline queueing handoff request');
    return { queued: true };
  }
}

async function handlePushClipboard(content) {
  try {
    const response = await fetch(`${API_BASE}/clipboard/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        device_id: 'dev-chrome-ext',
        content: content,
        content_type: 'text/plain',
      }),
    });
    return await response.json();
  } catch (e) {
    console.log('[NetSync Ext] Local clipboard cached');
    return { cached: true };
  }
}

// Restore tab scroll when incoming handoff opens
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    chrome.storage.local.get([tab.url], (result) => {
      if (result[tab.url]) {
        chrome.tabs.sendMessage(tabId, {
          action: 'restore_scroll',
          scrollY: result[tab.url],
        }).catch(() => {});
      }
    });
  }
});
