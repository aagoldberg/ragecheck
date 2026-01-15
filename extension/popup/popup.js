const API_BASE = 'https://ragecheck.com';

const urlInput = document.getElementById('url');
const analyzeBtn = document.getElementById('analyze');
const resultDiv = document.getElementById('result');
const scoreEl = document.getElementById('score');
const labelEl = document.getElementById('label');

// Try to get current tab URL
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  if (tabs[0]?.url) {
    const url = tabs[0].url;
    // Only pre-fill for social media URLs
    if (url.includes('twitter.com') ||
        url.includes('x.com') ||
        url.includes('bsky.app') ||
        url.includes('facebook.com') ||
        url.includes('reddit.com') ||
        url.includes('threads.net')) {
      urlInput.value = url;
    }
  }
});

analyzeBtn.addEventListener('click', async () => {
  const url = urlInput.value.trim();
  if (!url) return;

  analyzeBtn.disabled = true;
  analyzeBtn.textContent = 'Analyzing...';
  resultDiv.className = 'result';

  try {
    const response = await fetch(`${API_BASE}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });

    const data = await response.json();

    if (data.success) {
      const score = data.score;
      scoreEl.textContent = score;

      if (score >= 66) {
        resultDiv.className = 'result show high';
        labelEl.textContent = 'High Rage - Likely manipulative';
      } else if (score >= 33) {
        resultDiv.className = 'result show medium';
        labelEl.textContent = 'Medium Rage - Some manipulation';
      } else {
        resultDiv.className = 'result show low';
        labelEl.textContent = 'Low Rage - Appears balanced';
      }
    } else {
      resultDiv.className = 'result show error';
      scoreEl.textContent = '!';
      labelEl.textContent = data.error || 'Analysis failed';
    }
  } catch (err) {
    resultDiv.className = 'result show error';
    scoreEl.textContent = '!';
    labelEl.textContent = 'Connection failed';
  }

  analyzeBtn.disabled = false;
  analyzeBtn.textContent = 'Analyze';
});

// Enter key to submit
urlInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    analyzeBtn.click();
  }
});
