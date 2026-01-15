// RageCheck Content Script
// Injects "Check" buttons into social media posts

const API_BASE = 'https://ragecheck.com';
// const API_BASE = 'http://localhost:3000'; // Uncomment for local dev

// Platform-specific selectors
const PLATFORMS = {
  twitter: {
    host: ['twitter.com', 'x.com'],
    postSelector: 'article[data-testid="tweet"]',
    actionBarSelector: '[role="group"]:last-of-type',
    urlSelector: 'a[href*="/status/"] time',
    getPostUrl: (post) => {
      const timeLink = post.querySelector('a[href*="/status/"]');
      return timeLink ? timeLink.href : null;
    }
  },
  bluesky: {
    host: ['bsky.app'],
    postSelector: '[data-testid="postThreadItem"], [data-testid="feedItem-by-"]',
    actionBarSelector: '[class*="actions"], [class*="PostCtrls"]',
    getPostUrl: (post) => {
      const link = post.querySelector('a[href*="/post/"]');
      return link ? 'https://bsky.app' + link.getAttribute('href') : null;
    }
  },
  facebook: {
    host: ['www.facebook.com'],
    postSelector: '[data-pagelet*="FeedUnit"], [role="article"]',
    actionBarSelector: '[role="button"]',
    getPostUrl: (post) => {
      const link = post.querySelector('a[href*="/posts/"], a[href*="permalink"]');
      return link ? link.href : null;
    }
  },
  reddit: {
    host: ['www.reddit.com'],
    postSelector: 'shreddit-post, [data-testid="post-container"]',
    actionBarSelector: '[slot="post-actions"], [data-testid="post-bottom-bar"]',
    getPostUrl: (post) => {
      const link = post.querySelector('a[href*="/comments/"]');
      return link ? link.href : window.location.href;
    }
  },
  threads: {
    host: ['www.threads.net'],
    postSelector: '[data-pressable-container="true"]',
    actionBarSelector: '[role="button"]',
    getPostUrl: (post) => {
      const link = post.querySelector('a[href*="/post/"]');
      return link ? 'https://www.threads.net' + link.getAttribute('href') : null;
    }
  }
};

// Detect current platform
function getCurrentPlatform() {
  const hostname = window.location.hostname;
  for (const [name, config] of Object.entries(PLATFORMS)) {
    if (config.host.some(h => hostname.includes(h))) {
      return { name, ...config };
    }
  }
  return null;
}

// Track processed posts to avoid duplicates
const processedPosts = new WeakSet();

// Create the check button
function createCheckButton(postUrl) {
  const btn = document.createElement('button');
  btn.className = 'ragecheck-btn';
  btn.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
      <path d="M12 6v6l4 2"/>
    </svg>
    <span class="ragecheck-label">Check</span>
  `;

  btn.onclick = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!postUrl) {
      showResult(btn, { error: 'Could not find post URL' });
      return;
    }

    btn.classList.add('ragecheck-loading');
    btn.querySelector('.ragecheck-label').textContent = '...';

    try {
      const response = await fetch(`${API_BASE}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: postUrl })
      });

      const data = await response.json();

      if (data.success) {
        showResult(btn, { score: data.score, label: data.label });
      } else {
        showResult(btn, { error: data.error || 'Analysis failed' });
      }
    } catch (err) {
      showResult(btn, { error: 'Connection failed' });
    }

    btn.classList.remove('ragecheck-loading');
  };

  return btn;
}

// Show result on button
function showResult(btn, result) {
  const label = btn.querySelector('.ragecheck-label');

  if (result.error) {
    label.textContent = 'Error';
    btn.classList.add('ragecheck-error');
    btn.title = result.error;
    return;
  }

  const score = result.score;
  label.textContent = score;

  btn.classList.remove('ragecheck-error');
  if (score >= 66) {
    btn.classList.add('ragecheck-high');
    btn.title = `High rage score (${score}/100) - This content may be designed to provoke anger`;
  } else if (score >= 33) {
    btn.classList.add('ragecheck-medium');
    btn.title = `Medium rage score (${score}/100) - Some emotional manipulation detected`;
  } else {
    btn.classList.add('ragecheck-low');
    btn.title = `Low rage score (${score}/100) - Appears relatively balanced`;
  }
}

// Process a single post
function processPost(post, platform) {
  if (processedPosts.has(post)) return;
  processedPosts.add(post);

  const postUrl = platform.getPostUrl(post);
  if (!postUrl) return;

  // Find action bar - try multiple approaches
  let actionBar = post.querySelector(platform.actionBarSelector);

  // For Twitter/X, we need the bottom action bar
  if (platform.name === 'twitter') {
    const groups = post.querySelectorAll('[role="group"]');
    actionBar = groups[groups.length - 1];
  }

  if (!actionBar) return;

  // Check if button already exists
  if (post.querySelector('.ragecheck-btn')) return;

  const btn = createCheckButton(postUrl);

  // Insert button
  if (platform.name === 'twitter') {
    // Twitter: append to action group
    const wrapper = document.createElement('div');
    wrapper.className = 'ragecheck-wrapper';
    wrapper.appendChild(btn);
    actionBar.appendChild(wrapper);
  } else if (platform.name === 'reddit') {
    // Reddit: insert before share button
    const wrapper = document.createElement('div');
    wrapper.className = 'ragecheck-wrapper';
    wrapper.appendChild(btn);
    actionBar.insertBefore(wrapper, actionBar.firstChild);
  } else {
    // Others: append to post
    const wrapper = document.createElement('div');
    wrapper.className = 'ragecheck-wrapper ragecheck-floating';
    wrapper.appendChild(btn);
    post.style.position = 'relative';
    post.appendChild(wrapper);
  }
}

// Main function to find and process posts
function processAllPosts() {
  const platform = getCurrentPlatform();
  if (!platform) return;

  const posts = document.querySelectorAll(platform.postSelector);
  posts.forEach(post => processPost(post, platform));
}

// Initialize
function init() {
  const platform = getCurrentPlatform();
  if (!platform) {
    console.log('RageCheck: Unsupported platform');
    return;
  }

  console.log(`RageCheck: Initialized on ${platform.name}`);

  // Process existing posts
  processAllPosts();

  // Watch for new posts (infinite scroll)
  const observer = new MutationObserver((mutations) => {
    // Debounce
    clearTimeout(observer.timeout);
    observer.timeout = setTimeout(processAllPosts, 200);
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
