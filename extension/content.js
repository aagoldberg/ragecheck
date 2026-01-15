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
    postSelector: null, // Custom detection
    actionBarSelector: null,
    getPostUrl: (post) => {
      const links = post.querySelectorAll('a[href*="/post/"]');
      for (const link of links) {
        const href = link.getAttribute('href');
        if (href && href.includes('/post/')) {
          return href.startsWith('http') ? href : 'https://bsky.app' + href;
        }
      }
      return null;
    },
    // Custom post finder for Bluesky
    findPosts: () => {
      const posts = [];
      // Find all links to posts, then get their parent containers
      document.querySelectorAll('a[href*="/post/"]').forEach(link => {
        // Walk up to find a reasonable container (stop at 10 levels)
        let container = link.parentElement;
        let depth = 0;
        while (container && depth < 10) {
          // Look for container that has the action buttons (comment, repost, like)
          if (container.querySelector('svg') &&
              container.textContent.length > 50 &&
              !posts.includes(container)) {
            // Check if this looks like a post (has multiple interactive elements)
            const buttons = container.querySelectorAll('button, [role="button"]');
            if (buttons.length >= 3) {
              posts.push(container);
              break;
            }
          }
          container = container.parentElement;
          depth++;
        }
      });
      return posts;
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

    // If already has result, open full analysis
    if (btn.classList.contains('ragecheck-has-result')) {
      const url = btn.dataset.postUrl;
      console.log('RageCheck: Opening analysis for', url);
      window.open(`${API_BASE}?url=${encodeURIComponent(url)}`, '_blank');
      return;
    }

    if (!postUrl) {
      showResult(btn, { error: 'Could not find post URL' }, postUrl);
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
        showResult(btn, { score: data.score, label: data.label }, postUrl);
      } else {
        showResult(btn, { error: data.error || 'Analysis failed' }, postUrl);
      }
    } catch (err) {
      showResult(btn, { error: 'Connection failed' }, postUrl);
    }

    btn.classList.remove('ragecheck-loading');
  };

  return btn;
}

// Show result on button
function showResult(btn, result, postUrl) {
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

  let levelText, levelDesc;
  if (score >= 66) {
    btn.classList.add('ragecheck-high');
    levelText = 'High Rage';
    levelDesc = 'Likely designed to provoke anger';
  } else if (score >= 33) {
    btn.classList.add('ragecheck-medium');
    levelText = 'Medium Rage';
    levelDesc = 'Some emotional manipulation detected';
  } else {
    btn.classList.add('ragecheck-low');
    levelText = 'Low Rage';
    levelDesc = 'Appears relatively balanced';
  }

  // Add tooltip
  const tooltip = document.createElement('div');
  tooltip.className = 'ragecheck-tooltip';
  tooltip.innerHTML = `
    <div class="ragecheck-tooltip-score">${score}/100</div>
    <div class="ragecheck-tooltip-label">${levelText} - ${levelDesc}</div>
    <div class="ragecheck-tooltip-cta">Click for full analysis</div>
  `;
  btn.appendChild(tooltip);

  // Make button clickable to open full analysis
  btn.classList.add('ragecheck-has-result');
  btn.dataset.postUrl = postUrl;
  btn.title = ''; // Clear native tooltip since we have custom one
}

// Process a single post
function processPost(post, platform) {
  if (processedPosts.has(post)) return;
  processedPosts.add(post);

  const postUrl = platform.getPostUrl(post);
  if (!postUrl) return;

  // Find action bar - try multiple approaches
  let actionBar = null;
  let useFloating = !platform.actionBarSelector;

  if (platform.actionBarSelector) {
    actionBar = post.querySelector(platform.actionBarSelector);

    // For Twitter/X, we need the bottom action bar
    if (platform.name === 'twitter') {
      const groups = post.querySelectorAll('[role="group"]');
      actionBar = groups[groups.length - 1];
    }

    if (!actionBar) {
      useFloating = true; // Fallback to floating
    }
  }

  // Check if button already exists
  if (post.querySelector('.ragecheck-btn')) return;

  const btn = createCheckButton(postUrl);

  // Insert button
  const wrapper = document.createElement('div');
  wrapper.className = 'ragecheck-wrapper';
  wrapper.appendChild(btn);

  if (useFloating) {
    // Floating button in top-right corner
    wrapper.className = 'ragecheck-wrapper ragecheck-floating';
    post.style.position = 'relative';
    post.appendChild(wrapper);
  } else if (platform.name === 'twitter') {
    // Twitter: append to action group
    actionBar.appendChild(wrapper);
  } else if (platform.name === 'reddit') {
    // Reddit: insert before share button
    actionBar.insertBefore(wrapper, actionBar.firstChild);
  } else {
    // Default: append to action bar
    actionBar.appendChild(wrapper);
  }
}

// Main function to find and process posts
function processAllPosts() {
  const platform = getCurrentPlatform();
  if (!platform) return;

  // Use custom finder if available, otherwise use selector
  let posts;
  if (platform.findPosts) {
    posts = platform.findPosts();
  } else if (platform.postSelector) {
    posts = document.querySelectorAll(platform.postSelector);
  } else {
    posts = [];
  }

  console.log(`RageCheck: Found ${posts.length} posts on ${platform.name}`);
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
