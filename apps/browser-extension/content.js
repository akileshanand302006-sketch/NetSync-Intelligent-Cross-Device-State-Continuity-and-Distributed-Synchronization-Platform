/**
 * NetSync Browser Extension — Content Script
 * Tracks user scroll coordinates, active selection, and enables smooth scroll restoration.
 */

// Listen for messages from popup or background service worker
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'get_scroll') {
    const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = totalHeight > 0 ? Math.round((window.scrollY / totalHeight) * 100) : 0;
    sendResponse({
      scrollY: window.scrollY,
      scrollPercent: scrollPercent,
      selection: window.getSelection()?.toString() || '',
    });
  } else if (request.action === 'restore_scroll') {
    const targetY = request.scrollY || 0;
    window.scrollTo({
      top: targetY,
      behavior: 'smooth',
    });
    sendResponse({ status: 'restored' });
  }
  return true;
});

// Periodic debounced scroll position sync to background storage
let scrollTimer = null;
window.addEventListener('scroll', () => {
  clearTimeout(scrollTimer);
  scrollTimer = setTimeout(() => {
    const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = totalHeight > 0 ? Math.round((window.scrollY / totalHeight) * 100) : 0;
    chrome.runtime.sendMessage({
      action: 'scroll_updated',
      url: window.location.href,
      scrollPercent: scrollPercent,
      scrollY: window.scrollY,
    }).catch(() => {});
  }, 300);
}, { passive: true });
