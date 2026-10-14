document.addEventListener('DOMContentLoaded', async () => {
  const tabTitleEl = document.getElementById('tab-title');
  const tabUrlEl = document.getElementById('tab-url');
  const scrollValEl = document.getElementById('scroll-val');
  const btnBeam = document.getElementById('btn-beam');
  const btnClip = document.getElementById('btn-clip');
  const targetDeviceEl = document.getElementById('target-device');
  const feedbackEl = document.getElementById('feedback');

  // Query active tab
  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (activeTab) {
    tabTitleEl.textContent = activeTab.title || 'Untitled';
    tabUrlEl.textContent = activeTab.url || '';

    // Ask content script for scroll percentage
    try {
      chrome.tabs.sendMessage(activeTab.id, { action: 'get_scroll' }, (response) => {
        if (response && response.scrollPercent !== undefined) {
          scrollValEl.textContent = `${response.scrollPercent}%`;
        }
      });
    } catch (e) {
      scrollValEl.textContent = 'Ready';
    }
  }

  // Beam Tab Action
  btnBeam.addEventListener('click', async () => {
    feedbackEl.textContent = 'Beaming state frame...';
    const target = targetDeviceEl.value;

    chrome.runtime.sendMessage({
      action: 'beam_tab',
      tab: {
        title: activeTab?.title,
        url: activeTab?.url,
        scroll: parseInt(scrollValEl.textContent) || 0,
      },
      targetDevice: target,
    }, (res) => {
      feedbackEl.textContent = 'Delivered to ' + targetDeviceEl.options[targetDeviceEl.selectedIndex].text + '!';
      setTimeout(() => { feedbackEl.textContent = ''; }, 3000);
    });
  });

  // Sync to Clipboard Action
  btnClip.addEventListener('click', () => {
    const text = `${activeTab?.title}\n${activeTab?.url}`;
    chrome.runtime.sendMessage({
      action: 'push_clipboard',
      content: text,
    }, () => {
      feedbackEl.textContent = 'Synced to Universal Clipboard!';
      setTimeout(() => { feedbackEl.textContent = ''; }, 3000);
    });
  });
});
