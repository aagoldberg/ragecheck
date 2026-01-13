import { Readability } from "@mozilla/readability";
import { parseHTML } from "linkedom";

// In-memory cache for extracted content
const cache = new Map<string, ExtractedContent>();

// ScrapingBee API for bypassing Cloudflare and other bot protection
const SCRAPINGBEE_API_KEY = process.env.SCRAPINGBEE_API_KEY;

/**
 * Detect if HTML response is a Cloudflare challenge page
 */
function isCloudflareChallenge(html: string): boolean {
  return (
    html.includes("Just a moment...") ||
    html.includes("cf_chl_opt") ||
    html.includes("challenge-platform") ||
    html.includes("Enable JavaScript and cookies to continue")
  );
}

/**
 * Fetch URL using ScrapingBee (headless browser service)
 * Used as fallback when normal fetch is blocked
 */
async function fetchWithScrapingBee(url: string): Promise<{ html: string; success: boolean; error?: string }> {
  if (!SCRAPINGBEE_API_KEY) {
    return { html: "", success: false, error: "ScrapingBee not configured" };
  }

  try {
    const apiUrl = new URL("https://app.scrapingbee.com/api/v1/");
    apiUrl.searchParams.set("api_key", SCRAPINGBEE_API_KEY);
    apiUrl.searchParams.set("url", url);
    apiUrl.searchParams.set("render_js", "true");
    apiUrl.searchParams.set("premium_proxy", "true"); // Better for Cloudflare
    apiUrl.searchParams.set("block_ads", "true");
    apiUrl.searchParams.set("block_resources", "false"); // Need JS to render

    const response = await fetch(apiUrl.toString(), {
      method: "GET",
      headers: { "Accept": "text/html" },
    });

    if (!response.ok) {
      return { html: "", success: false, error: `ScrapingBee error: ${response.status}` };
    }

    const html = await response.text();
    return { html, success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return { html: "", success: false, error: `ScrapingBee failed: ${errorMessage}` };
  }
}

export interface ExtractedContent {
  title: string;
  text: string;
  sourceDomain: string;
  success: boolean;
  error?: string;
  image?: string;
}

// Private IP ranges to block (SSRF protection)
const PRIVATE_IP_PATTERNS = [
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
  /^192\.168\./,
  /^0\./,
  /^169\.254\./,
  /^::1$/,
  /^fc00:/i,
  /^fe80:/i,
  /^localhost$/i,
];

const BLOCKED_HOSTNAMES = [
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "[::1]",
];

function isPrivateUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);

    // Only allow http and https
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return true;
    }

    // Check blocked hostnames
    if (BLOCKED_HOSTNAMES.includes(url.hostname.toLowerCase())) {
      return true;
    }

    // Check private IP patterns
    for (const pattern of PRIVATE_IP_PATTERNS) {
      if (pattern.test(url.hostname)) {
        return true;
      }
    }

    return false;
  } catch {
    return true;
  }
}

// ============ BLUESKY SUPPORT ============
// Bluesky has a public API via AT Protocol

interface BlueskyPost {
  thread: {
    post: {
      author: {
        handle: string;
        displayName?: string;
      };
      record: {
        text: string;
        createdAt: string;
      };
    };
  };
}

async function extractBluesky(urlString: string): Promise<ExtractedContent | null> {
  // Parse Bluesky URL: https://bsky.app/profile/{handle}/post/{postId}
  const match = urlString.match(/bsky\.app\/profile\/([^/]+)\/post\/([^/?]+)/);
  if (!match) return null;

  const [, handle, postId] = match;
  const sourceDomain = "bsky.app";

  try {
    // First, resolve handle to DID if it's not already a DID
    let did = handle;
    if (!handle.startsWith("did:")) {
      const resolveRes = await fetch(
        `https://public.api.bsky.app/xrpc/com.atproto.identity.resolveHandle?handle=${encodeURIComponent(handle)}`,
        { headers: { "Accept": "application/json" } }
      );
      if (resolveRes.ok) {
        const resolved = await resolveRes.json();
        did = resolved.did;
      }
    }

    // Fetch the post thread
    const uri = `at://${did}/app.bsky.feed.post/${postId}`;
    const response = await fetch(
      `https://public.api.bsky.app/xrpc/app.bsky.feed.getPostThread?uri=${encodeURIComponent(uri)}&depth=0`,
      { headers: { "Accept": "application/json" } }
    );

    if (!response.ok) {
      return {
        title: "",
        text: "",
        sourceDomain,
        success: false,
        error: `Bluesky API error: ${response.status}`,
      };
    }

    const data: BlueskyPost = await response.json();
    const post = data.thread?.post;

    if (!post?.record?.text) {
      return {
        title: "",
        text: "",
        sourceDomain,
        success: false,
        error: "Could not extract post content",
      };
    }

    const text = post.record.text;
    
    // Extract image if available
    let image: string | undefined;
    // @ts-ignore - Basic type safety for dynamic API response
    if (post.embed?.images?.[0]?.fullsize) {
      // @ts-ignore
      image = post.embed.images[0].fullsize;
    }

    return {
      title: `Post by @${post.author?.handle || handle}`,
      text: text,
      sourceDomain,
      success: true,
      image,
    };
  } catch (err) {
    return {
      title: "",
      text: "",
      sourceDomain,
      success: false,
      error: `Bluesky extraction failed: ${err instanceof Error ? err.message : "Unknown error"}`,
    };
  }
}

// ============ TWITTER/X SUPPORT ============
// Try multiple methods: oEmbed API, syndication, Nitter

async function extractTwitter(urlString: string): Promise<ExtractedContent | null> {
  // Parse Twitter URL: https://twitter.com/{user}/status/{id} or https://x.com/{user}/status/{id}
  const match = urlString.match(/(?:twitter\.com|x\.com)\/([^/]+)\/status\/(\d+)/);
  if (!match) return null;

  const [, username, tweetId] = match;
  const sourceDomain = urlString.includes("x.com") ? "x.com" : "twitter.com";

  // Method 1: Try Twitter's oEmbed API (still works for public tweets)
  try {
    const oembedUrl = `https://publish.twitter.com/oembed?url=${encodeURIComponent(urlString)}&omit_script=true`;
    const response = await fetch(oembedUrl, {
      headers: { "Accept": "application/json" },
    });

    if (response.ok) {
      const data = await response.json();
      if (data.html) {
        // Parse the HTML to extract text
        const { document } = parseHTML(data.html);
        const blockquote = document.querySelector("blockquote");
        if (blockquote) {
          // Remove the author link at the end
          const links = blockquote.querySelectorAll("a");
          links.forEach((link: Element) => {
            if (link.textContent?.includes("@") || (link as HTMLAnchorElement).href?.includes("/status/")) {
              link.remove();
            }
          });

          const text = blockquote.textContent?.trim();
          if (text && text.length > 10) {
            return {
              title: `Tweet by @${username}`,
              text: text,
              sourceDomain,
              success: true,
            };
          }
        }
      }
    }
  } catch {
    // Continue to next method
  }

  // Method 2: Try FxTwitter/VxTwitter API (third-party but reliable)
  try {
    const fxUrl = `https://api.fxtwitter.com/status/${tweetId}`;
    const response = await fetch(fxUrl, {
      headers: { "Accept": "application/json" },
    });

    if (response.ok) {
      const data = await response.json();
      if (data.tweet?.text) {
        return {
          title: `Tweet by @${data.tweet.author?.screen_name || username}`,
          text: data.tweet.text,
          sourceDomain,
          success: true,
          image: data.tweet.media?.photos?.[0]?.url,
        };
      }
    }
  } catch {
    // All methods failed
  }

  return {
    title: "",
    text: "",
    sourceDomain,
    success: false,
    error: "Could not extract tweet. Twitter/X has restricted API access.",
  };
}

// ============ THREADS SUPPORT ============

async function extractThreads(urlString: string): Promise<ExtractedContent | null> {
  // Parse Threads URL: https://www.threads.net/@{user}/post/{id}
  const match = urlString.match(/threads\.net\/@([^/]+)\/post\/([^/?]+)/);
  if (!match) return null;

  const [, username] = match;
  const sourceDomain = "threads.net";

  // Threads doesn't have a public API, but we can try oEmbed
  try {
    // Try to get content via their page (limited success)
    const response = await fetch(urlString, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
        "Accept": "text/html",
      },
    });

    if (response.ok) {
      const html = await response.text();

      // Look for meta tags with content
      const ogDescMatch = html.match(/<meta[^>]*property="og:description"[^>]*content="([^"]+)"/);
      if (ogDescMatch && ogDescMatch[1]) {
        const text = ogDescMatch[1]
          .replace(/&quot;/g, '"')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&#x27;/g, "'");

        const ogImage = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/)?.[1];

        if (text.length > 20) {
          return {
            title: `Thread by @${username}`,
            text: text,
            sourceDomain,
            success: true,
            image: ogImage,
          };
        }
      }
    }
  } catch {
    // Failed
  }

  return {
    title: "",
    text: "",
    sourceDomain,
    success: false,
    error: "Could not extract Threads post content.",
  };
}

// ============ TRUTH SOCIAL SUPPORT ============

async function extractTruthSocial(urlString: string): Promise<ExtractedContent | null> {
  // Parse Truth Social URL formats:
  // https://truthsocial.com/@{username}/posts/{postId}
  // https://truthsocial.com/@{username}/{postId}
  const match = urlString.match(/truthsocial\.com\/@([^/]+)(?:\/posts)?\/(\d+)/);
  if (!match) return null;

  const [, username, postId] = match;
  const sourceDomain = "truthsocial.com";

  // Try multiple approaches since Truth Social blocks many requests

  // Method 1: Try their API directly (Mastodon-compatible)
  try {
    const apiUrl = `https://truthsocial.com/api/v1/statuses/${postId}`;
    const response = await fetch(apiUrl, {
      headers: {
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    if (response.ok) {
      const data = await response.json();
      if (data.content) {
        // Strip HTML tags from content
        const text = data.content
          .replace(/<[^>]+>/g, ' ')
          .replace(/&quot;/g, '"')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&#x27;/g, "'")
          .replace(/&#39;/g, "'")
          .replace(/\s+/g, ' ')
          .trim();

        if (text.length > 5) {
          return {
            title: `Truth by @${data.account?.username || username}`,
            text: text,
            sourceDomain,
            success: true,
          };
        }
      }
    }
  } catch {
    // API failed, try next method
  }

  // Method 2: Try page fetch with browser-like headers
  try {
    const response = await fetch(urlString, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Cache-Control": "no-cache",
      },
    });

    if (response.ok) {
      const html = await response.text();

      // Look for og:description meta tag
      const ogDescMatch = html.match(/<meta[^>]*property="og:description"[^>]*content="([^"]+)"/);
      if (ogDescMatch && ogDescMatch[1]) {
        const text = ogDescMatch[1]
          .replace(/&quot;/g, '"')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&#x27;/g, "'")
          .replace(/&#39;/g, "'");

        if (text.length > 10) {
          return {
            title: `Truth by @${username}`,
            text: text,
            sourceDomain,
            success: true,
          };
        }
      }

      // Try twitter:description as fallback
      const twitterDescMatch = html.match(/<meta[^>]*name="twitter:description"[^>]*content="([^"]+)"/);
      if (twitterDescMatch && twitterDescMatch[1]) {
        const text = twitterDescMatch[1]
          .replace(/&quot;/g, '"')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&#x27;/g, "'")
          .replace(/&#39;/g, "'");

        if (text.length > 10) {
          return {
            title: `Truth by @${username}`,
            text: text,
            sourceDomain,
            success: true,
          };
        }
      }
    }
  } catch {
    // Failed
  }

  return {
    title: "",
    text: "",
    sourceDomain,
    success: false,
    error: "Could not extract Truth Social post. The platform may be blocking automated requests.",
  };
}

// ============ FARCASTER/WARPCAST SUPPORT ============

interface NeynarCast {
  cast: {
    author: {
      username: string;
      display_name?: string;
    };
    text: string;
  };
}

async function extractFarcaster(urlString: string): Promise<ExtractedContent | null> {
  // Parse Farcaster/Warpcast URL: https://warpcast.com/{username}/{hash} or https://farcaster.xyz/{username}/{hash}
  const match = urlString.match(/(?:warpcast\.com|farcaster\.xyz)\/([^/]+)\/([a-zA-Z0-9x]+)/);
  if (!match) return null;

  const [, username, hash] = match;
  const sourceDomain = urlString.includes("farcaster.xyz") ? "farcaster.xyz" : "warpcast.com";

  // Try Neynar's public cast lookup API
  try {
    // Neynar has a free endpoint for cast lookups by URL
    const neynarUrl = `https://api.neynar.com/v2/farcaster/cast?identifier=${encodeURIComponent(urlString)}&type=url`;

    const response = await fetch(neynarUrl, {
      headers: {
        "Accept": "application/json",
        // Neynar requires an API key, but has a public demo key
        "api_key": "NEYNAR_API_DOCS",
      },
    });

    if (response.ok) {
      const data: NeynarCast = await response.json();
      if (data.cast?.text) {
        return {
          title: `Cast by @${data.cast.author?.username || username}`,
          text: data.cast.text,
          sourceDomain,
          success: true,
        };
      }
    }
  } catch {
    // Try fallback
  }

  // Fallback: Try to extract from Supercast embed API
  try {
    const embedUrl = `https://client.warpcast.com/v2/cast?hash=${hash}`;
    const response = await fetch(embedUrl, {
      headers: { "Accept": "application/json" },
    });

    if (response.ok) {
      const data = await response.json();
      if (data.result?.cast?.text) {
        return {
          title: `Cast by @${data.result.cast.author?.username || username}`,
          text: data.result.cast.text,
          sourceDomain,
          success: true,
        };
      }
    }
  } catch {
    // Failed
  }

  return {
    title: "",
    text: "",
    sourceDomain,
    success: false,
    error: "Could not extract Farcaster cast. Try using a Neynar API key for reliable access.",
  };
}

// ============ TIKTOK SUPPORT ============
// TikTok has an oEmbed API

async function extractTikTok(urlString: string): Promise<ExtractedContent | null> {
  const sourceDomain = "tiktok.com";

  try {
    const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(urlString)}`;

    const response = await fetch(oembedUrl, {
      headers: { "Accept": "application/json" },
    });

    if (!response.ok) return null;

    const data = await response.json();

    if (data.title) {
      return {
        title: `TikTok by @${data.author_name || "unknown"}`,
        text: data.title,
        sourceDomain,
        success: true,
        image: data.thumbnail_url,
      };
    }

    return null;
  } catch (error) {
    console.error("TikTok extraction failed:", error);
    return null;
  }
}

// ============ MASTODON SUPPORT ============
// Mastodon instances have a public API

async function extractMastodon(urlString: string): Promise<ExtractedContent | null> {
  try {
    const url = new URL(urlString);
    const sourceDomain = url.hostname;

    // Extract status ID from URL (format: /@user/123456 or /users/user/statuses/123456)
    const match = urlString.match(/\/@[^/]+\/(\d+)|\/statuses\/(\d+)/);
    if (!match) return null;

    const statusId = match[1] || match[2];

    // Try the Mastodon API
    const apiUrl = `https://${sourceDomain}/api/v1/statuses/${statusId}`;

    const response = await fetch(apiUrl, {
      headers: { "Accept": "application/json" },
    });

    if (!response.ok) return null;

    const data = await response.json();

    if (data.content) {
      // Strip HTML tags from content
      const text = data.content.replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");

      return {
        title: `Post by @${data.account?.username || "unknown"}@${sourceDomain}`,
        text,
        sourceDomain,
        success: true,
        image: data.media_attachments?.[0]?.preview_url,
      };
    }

    return null;
  } catch (error) {
    console.error("Mastodon extraction failed:", error);
    return null;
  }
}

// ============ YOUTUBE SUPPORT ============
// YouTube has an oEmbed API for video info

async function extractYouTube(urlString: string): Promise<ExtractedContent | null> {
  const sourceDomain = "youtube.com";

  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(urlString)}&format=json`;

    const response = await fetch(oembedUrl, {
      headers: { "Accept": "application/json" },
    });

    if (!response.ok) return null;

    const data = await response.json();

    if (data.title) {
      return {
        title: data.title,
        text: `YouTube video by ${data.author_name || "unknown"}: "${data.title}"`,
        sourceDomain,
        success: true,
        image: data.thumbnail_url,
      };
    }

    return null;
  } catch (error) {
    console.error("YouTube extraction failed:", error);
    return null;
  }
}

// ============ REDDIT SUPPORT ============
// Reddit provides JSON data by appending .json to URLs

interface RedditPost {
  data: {
    title: string;
    selftext: string;
    author: string;
    subreddit: string;
    url?: string;
  };
}

interface RedditComment {
  data: {
    body: string;
    author: string;
  };
}

interface RedditListing {
  kind: string;
  data: {
    children: Array<{ kind: string; data: RedditPost["data"] | RedditComment["data"] }>;
  };
}

async function extractReddit(urlString: string): Promise<ExtractedContent | null> {
  const sourceDomain = "reddit.com";

  try {
    // Clean URL and append .json
    let jsonUrl = urlString.replace(/\?.*$/, ""); // Remove query params
    if (!jsonUrl.endsWith("/")) jsonUrl += "/";
    jsonUrl += ".json";

    const response = await fetch(jsonUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; RageCheck/1.0; +https://ragecheck.com)",
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      return null; // Fall back to regular extraction
    }

    const data: RedditListing[] = await response.json();

    // Handle post pages (array with post and comments)
    if (Array.isArray(data) && data.length > 0) {
      const postListing = data[0];
      if (postListing?.data?.children?.[0]?.data) {
        const post = postListing.data.children[0].data as RedditPost["data"];
        const title = post.title || "Reddit Post";
        const subreddit = post.subreddit || "";
        const author = post.author || "[deleted]";

        // Get post text (selftext for text posts)
        let text = post.selftext || "";

        // If it's a link post with no selftext, note that
        if (!text && post.url) {
          text = `[Link post to: ${post.url}]`;
        }

        // Add top comments if available
        if (data.length > 1 && data[1]?.data?.children) {
          const comments = data[1].data.children
            .filter((c) => c.kind === "t1" && (c.data as RedditComment["data"]).body)
            .slice(0, 5)
            .map((c) => {
              const comment = c.data as RedditComment["data"];
              return `[Comment by u/${comment.author}]: ${comment.body}`;
            });

          if (comments.length > 0) {
            text += "\n\n--- Top Comments ---\n" + comments.join("\n\n");
          }
        }

        return {
          title: `r/${subreddit}: ${title}`,
          text: text || title,
          sourceDomain,
          success: true,
        };
      }
    }

    return null;
  } catch (error) {
    console.error("Reddit extraction failed:", error);
    return null;
  }
}

// ============ MAIN EXTRACTION FUNCTION ============

export async function extractContent(urlString: string): Promise<ExtractedContent> {
  // Check cache first
  const cached = cache.get(urlString);
  if (cached) {
    return cached;
  }

  // Validate URL
  let url: URL;
  try {
    url = new URL(urlString);
  } catch {
    return {
      title: "",
      text: "",
      sourceDomain: "",
      success: false,
      error: "Invalid URL format",
    };
  }

  // SSRF protection
  if (isPrivateUrl(urlString)) {
    return {
      title: "",
      text: "",
      sourceDomain: "",
      success: false,
      error: "URL not allowed for security reasons",
    };
  }

  const sourceDomain = url.hostname;

  // Try platform-specific extractors first
  if (sourceDomain.includes("bsky.app")) {
    const result = await extractBluesky(urlString);
    if (result) {
      if (result.success) cache.set(urlString, result);
      return result;
    }
  }

  if (sourceDomain.includes("twitter.com") || sourceDomain.includes("x.com")) {
    const result = await extractTwitter(urlString);
    if (result) {
      if (result.success) cache.set(urlString, result);
      return result;
    }
  }

  if (sourceDomain.includes("threads.net")) {
    const result = await extractThreads(urlString);
    if (result) {
      if (result.success) cache.set(urlString, result);
      return result;
    }
  }

  if (sourceDomain.includes("truthsocial.com")) {
    const result = await extractTruthSocial(urlString);
    if (result) {
      if (result.success) cache.set(urlString, result);
      return result;
    }
  }

  if (sourceDomain.includes("warpcast.com")) {
    const result = await extractFarcaster(urlString);
    if (result) {
      if (result.success) cache.set(urlString, result);
      return result;
    }
  }

  if (sourceDomain.includes("reddit.com")) {
    const result = await extractReddit(urlString);
    if (result) {
      if (result.success) cache.set(urlString, result);
      return result;
    }
  }

  if (sourceDomain.includes("tiktok.com")) {
    const result = await extractTikTok(urlString);
    if (result) {
      if (result.success) cache.set(urlString, result);
      return result;
    }
  }

  if (sourceDomain.includes("youtube.com") || sourceDomain.includes("youtu.be")) {
    const result = await extractYouTube(urlString);
    if (result) {
      if (result.success) cache.set(urlString, result);
      return result;
    }
  }

  // Check for Mastodon-like instances (have /api/v1/statuses endpoint)
  // Common Mastodon instances and forks
  const mastodonInstances = [
    "mastodon.social", "mastodon.online", "mstdn.social", "mas.to",
    "fosstodon.org", "hachyderm.io", "infosec.exchange", "techhub.social",
  ];
  const isMastodonLike = mastodonInstances.some(instance => sourceDomain.includes(instance)) ||
    urlString.match(/\/@[^/]+\/\d+/); // Common Mastodon URL pattern

  if (isMastodonLike) {
    const result = await extractMastodon(urlString);
    if (result) {
      if (result.success) cache.set(urlString, result);
      return result;
    }
  }

  // Default: use Readability for regular web pages
  try {
    // Fetch with timeout and size limits
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000); // 25s timeout

    const response = await fetch(urlString, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": "https://www.google.com/",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1",
      },
    });

    clearTimeout(timeoutId);

    // Handle blocked responses - try ScrapingBee fallback for 403
    if (response.status === 403 && SCRAPINGBEE_API_KEY) {
      const scrapingResult = await fetchWithScrapingBee(urlString);
      if (scrapingResult.success) {
        // Continue with ScrapingBee HTML below
        const html = scrapingResult.html;
        const { document } = parseHTML(html);
        const scripts = document.querySelectorAll("script, style, noscript, iframe");
        scripts.forEach((el: Element) => el.remove());
        const reader = new Readability(document as unknown as Document);
        const article = reader.parse();
        const ogImage = document.querySelector('meta[property="og:image"]')?.getAttribute("content")
                     || document.querySelector('meta[name="twitter:image"]')?.getAttribute("content");

        if (article?.textContent) {
          const cleanText = article.textContent.replace(/\s+/g, " ").trim();
          if (cleanText.length >= 100) {
            const result: ExtractedContent = {
              title: article.title || document.title || "Untitled",
              text: cleanText,
              sourceDomain,
              success: true,
              image: ogImage || undefined,
            };
            cache.set(urlString, result);
            return result;
          }
        }
      }
    }

    if (!response.ok) {
      return {
        title: "",
        text: "",
        sourceDomain,
        success: false,
        error: `Failed to fetch: HTTP ${response.status}`,
      };
    }

    // Check content type
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/html") && !contentType.includes("text/plain")) {
      return {
        title: "",
        text: "",
        sourceDomain,
        success: false,
        error: "Content is not HTML or text",
      };
    }

    // Limit response size (5MB max)
    const contentLength = response.headers.get("content-length");
    if (contentLength && parseInt(contentLength) > 5 * 1024 * 1024) {
      return {
        title: "",
        text: "",
        sourceDomain,
        success: false,
        error: "Content too large",
      };
    }

    let html = await response.text();

    // Check for Cloudflare challenge and retry with ScrapingBee if available
    if (isCloudflareChallenge(html)) {
      if (SCRAPINGBEE_API_KEY) {
        const scrapingResult = await fetchWithScrapingBee(urlString);
        if (scrapingResult.success) {
          html = scrapingResult.html;
        } else {
          return {
            title: "",
            text: "",
            sourceDomain,
            success: false,
            error: "Site blocked by Cloudflare protection",
          };
        }
      } else {
        return {
          title: "",
          text: "",
          sourceDomain,
          success: false,
          error: "Site blocked by Cloudflare protection",
        };
      }
    }

    // Parse with linkedom (serverless-friendly alternative to jsdom)
    const { document } = parseHTML(html);

    // Remove script and style elements
    const scripts = document.querySelectorAll("script, style, noscript, iframe");
    scripts.forEach((el: Element) => el.remove());

    // Use Readability to extract content
    const reader = new Readability(document as unknown as Document);
    const article = reader.parse();

    // Extract OG Image
    const ogImage = document.querySelector('meta[property="og:image"]')?.getAttribute("content")
                 || document.querySelector('meta[name="twitter:image"]')?.getAttribute("content");

    if (!article || !article.textContent || article.textContent.replace(/\s+/g, " ").trim().length < 100) {
      // Try ScrapingBee as fallback for JS-rendered content
      if (SCRAPINGBEE_API_KEY) {
        const scrapingResult = await fetchWithScrapingBee(urlString);
        if (scrapingResult.success) {
          const { document: sbDoc } = parseHTML(scrapingResult.html);
          const sbScripts = sbDoc.querySelectorAll("script, style, noscript, iframe");
          sbScripts.forEach((el: Element) => el.remove());
          const sbReader = new Readability(sbDoc as unknown as Document);
          const sbArticle = sbReader.parse();
          const sbOgImage = sbDoc.querySelector('meta[property="og:image"]')?.getAttribute("content")
                        || sbDoc.querySelector('meta[name="twitter:image"]')?.getAttribute("content");

          if (sbArticle?.textContent) {
            const sbCleanText = sbArticle.textContent.replace(/\s+/g, " ").trim();
            if (sbCleanText.length >= 100) {
              const result: ExtractedContent = {
                title: sbArticle.title || sbDoc.title || "Untitled",
                text: sbCleanText,
                sourceDomain,
                success: true,
                image: sbOgImage || undefined,
              };
              cache.set(urlString, result);
              return result;
            }
          }
        }
      }

      return {
        title: document.title || "",
        text: "",
        sourceDomain,
        success: false,
        error: "Couldn't extract text (may be paywalled or blocked)",
      };
    }

    // Clean up text
    const cleanText = article.textContent
      .replace(/\s+/g, " ")
      .trim();

    if (cleanText.length < 100) {
      return {
        title: article.title || document.title || "",
        text: cleanText,
        sourceDomain,
        success: false,
        error: "Extracted text too short (may be paywalled or blocked)",
      };
    }

    const result: ExtractedContent = {
      title: article.title || document.title || "Untitled",
      text: cleanText,
      sourceDomain,
      success: true,
      image: ogImage || undefined,
    };

    // Cache the result
    cache.set(urlString, result);

    return result;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";

    if (errorMessage.includes("abort")) {
      return {
        title: "",
        text: "",
        sourceDomain,
        success: false,
        error: "Request timed out",
      };
    }

    return {
      title: "",
      text: "",
      sourceDomain,
      success: false,
      error: `Failed to extract content: ${errorMessage}`,
    };
  }
}

// Clear cache (can be called periodically if needed)
export function clearCache(): void {
  cache.clear();
}
