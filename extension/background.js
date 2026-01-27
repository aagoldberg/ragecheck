// RageCheck Background Service Worker
// Handles context menu for checking selected text on any website

const API_BASE = 'https://ragecheck.com';
// const API_BASE = 'http://localhost:3000'; // Uncomment for local dev

// Create context menu on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'ragecheck-selection',
    title: 'Check with RageCheck',
    contexts: ['selection']
  });

  chrome.contextMenus.create({
    id: 'ragecheck-link',
    title: 'Check link with RageCheck',
    contexts: ['link']
  });

  chrome.contextMenus.create({
    id: 'ragecheck-page',
    title: 'Check this page with RageCheck',
    contexts: ['page']
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'ragecheck-selection') {
    const selectedText = info.selectionText;
    if (selectedText && selectedText.trim().length > 0) {
      await analyzeText(selectedText, tab);
    }
  } else if (info.menuItemId === 'ragecheck-link') {
    const linkUrl = info.linkUrl;
    if (linkUrl) {
      await analyzeUrl(linkUrl, tab);
    }
  } else if (info.menuItemId === 'ragecheck-page') {
    const pageUrl = info.pageUrl || tab.url;
    if (pageUrl) {
      await analyzeUrl(pageUrl, tab);
    }
  }
});

// Analyze text content directly
async function analyzeText(text, tab) {
  // Show loading notification
  await showNotification('analyzing', 'Analyzing...', 'Checking content for rage bait...');

  try {
    const response = await fetch(`${API_BASE}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: text })
    });

    const data = await response.json();

    if (data.success) {
      showResult(data.score, data.label, text.substring(0, 100));
    } else {
      showNotification('error', 'Analysis Failed', data.error || 'Could not analyze content');
    }
  } catch (err) {
    showNotification('error', 'Connection Error', 'Could not reach RageCheck API');
  }
}

// Analyze URL
async function analyzeUrl(url, tab) {
  // Show loading notification
  await showNotification('analyzing', 'Analyzing...', 'Checking URL for rage bait...');

  try {
    const response = await fetch(`${API_BASE}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: url })
    });

    const data = await response.json();

    if (data.success) {
      showResult(data.score, data.label, url);
    } else {
      showNotification('error', 'Analysis Failed', data.error || 'Could not analyze URL');
    }
  } catch (err) {
    showNotification('error', 'Connection Error', 'Could not reach RageCheck API');
  }
}

// Show result notification
function showResult(score, label, content) {
  let level, emoji;
  if (score >= 66) {
    level = 'High Rage';
    emoji = '🔴';
  } else if (score >= 33) {
    level = 'Medium Rage';
    emoji = '🟡';
  } else {
    level = 'Low Rage';
    emoji = '🟢';
  }

  const title = `${emoji} ${score}/100 - ${level}`;
  const preview = content.length > 80 ? content.substring(0, 80) + '...' : content;

  showNotification('result', title, preview);
}

// Show browser notification
async function showNotification(id, title, message) {
  // Clear any existing notification
  chrome.notifications.clear('ragecheck-' + id);

  chrome.notifications.create('ragecheck-' + id, {
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title: title,
    message: message
  });
}

// Open full analysis when notification clicked
chrome.notifications.onClicked.addListener((notificationId) => {
  if (notificationId.startsWith('ragecheck-')) {
    chrome.tabs.create({ url: API_BASE });
  }
});
