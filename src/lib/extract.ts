import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";

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

  try {
    // Fetch with timeout and size limits
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

    const response = await fetch(urlString, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; BaitCheck/1.0; +https://baitcheck.app)",
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

    // Parse with jsdom
    const dom = new JSDOM(html, { url: urlString });
    const document = dom.window.document;

    // Remove script and style elements
    const scripts = document.querySelectorAll("script, style, noscript, iframe");
    scripts.forEach((el) => el.remove());

    // Use Readability to extract content
    const reader = new Readability(document);
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
