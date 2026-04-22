chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg.type === 'SEARCH' && msg.query) {
    const tabId = sender.tab?.id;
    if (tabId !== undefined) {
      chrome.search.query({ text: msg.query, tabId }, () => {});
    }
  }
});

async function updateBadge(): Promise<void> {
  try {
    const tabs = await chrome.tabs.query({});
    const count = tabs.filter((t) => {
      const url = t.url || '';
      return (
        !url.startsWith('chrome://') &&
        !url.startsWith('chrome-extension://') &&
        !url.startsWith('about:') &&
        !url.startsWith('edge://') &&
        !url.startsWith('brave://')
      );
    }).length;

    await chrome.action.setBadgeText({ text: count > 0 ? String(count) : '' });

    if (count === 0) return;

    let color: string;
    if (count <= 10) {
      color = '#10b981';
    } else if (count <= 20) {
      color = '#f59e0b';
    } else {
      color = '#ef4444';
    }

    await chrome.action.setBadgeBackgroundColor({ color });
  } catch {
    chrome.action.setBadgeText({ text: '' });
  }
}

chrome.runtime.onInstalled.addListener(updateBadge);
chrome.runtime.onStartup.addListener(updateBadge);
chrome.tabs.onCreated.addListener(updateBadge);
chrome.tabs.onRemoved.addListener(updateBadge);
chrome.tabs.onUpdated.addListener(updateBadge);

updateBadge();
