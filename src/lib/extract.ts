import { Readability } from "@mozilla/readability";
import { parseHTML } from "linkedom";

// In-memory cache for extracted content
const cache = new Map<string, ExtractedContent>();

export interface ExtractedContent {
  title: string;
  text: string;
  sourceDomain: string;
  success: boolean;
  error?: string;
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

    return {
      title: `Post by @${post.author?.handle || handle}`,
      text: text,
      sourceDomain,
      success: true,
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

        if (text.length > 20) {
          return {
            title: `Thread by @${username}`,
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
    error: "Could not extract Threads post content.",
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

  if (sourceDomain.includes("warpcast.com")) {
    const result = await extractFarcaster(urlString);
    if (result) {
      if (result.success) cache.set(urlString, result);
      return result;
    }
  }

  // Default: use Readability for regular web pages
  try {
    // Fetch with timeout and size limits
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

    const response = await fetch(urlString, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; RageCheck/1.0; +https://ragecheck.vercel.app)",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    clearTimeout(timeoutId);

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

    const html = await response.text();

    // Parse with linkedom (serverless-friendly alternative to jsdom)
    const { document } = parseHTML(html);

    // Remove script and style elements
    const scripts = document.querySelectorAll("script, style, noscript, iframe");
    scripts.forEach((el: Element) => el.remove());

    // Use Readability to extract content
    const reader = new Readability(document as unknown as Document);
    const article = reader.parse();

    if (!article || !article.textContent) {
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
