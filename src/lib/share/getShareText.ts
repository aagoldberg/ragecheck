export type SharePlatform = "x" | "bluesky" | "native" | "copy";

/**
 * Generate platform-specific share text
 */
export function getShareText(
  platform: SharePlatform,
  hookLine: string,
  resultUrl: string
): string {
  switch (platform) {
    case "x":
      // X: Short, punchy, slightly playful
      // Don't include URL here - it's added separately via intent param
      return `${hookLine}\n\nRagecheck breakdown:`;

    case "bluesky":
      // Bluesky: Softer curiosity framing, include URL inline
      return `Ran this through Ragecheck. ${hookLine}\n\n${resultUrl}`;

    case "native":
    case "copy":
    default:
      // Generic: Hook + URL
      return `${hookLine}\n\n${resultUrl}`;
  }
}

/**
 * Build the X/Twitter intent URL
 */
export function buildXIntentUrl(text: string, url: string): string {
  const params = new URLSearchParams({
    text,
    url,
  });
  return `https://twitter.com/intent/tweet?${params.toString()}`;
}

/**
 * Build the Bluesky compose URL
 */
export function buildBlueskyIntentUrl(text: string): string {
  const params = new URLSearchParams({
    text,
  });
  return `https://bsky.app/intent/compose?${params.toString()}`;
}

/**
 * Build the Facebook share URL
 * Facebook only accepts a URL param - it relies on OG tags for the preview card
 */
export function buildFacebookShareUrl(url: string): string {
  const params = new URLSearchParams({ u: url });
  return `https://www.facebook.com/sharer/sharer.php?${params.toString()}`;
}

/**
 * Build the LinkedIn share URL
 * LinkedIn only accepts a URL param - it relies on OG tags for the preview card
 */
export function buildLinkedInShareUrl(url: string): string {
  const params = new URLSearchParams({ url });
  return `https://www.linkedin.com/sharing/share-offsite/?${params.toString()}`;
}

/**
 * Check if a result is "worth sharing" based on scores
 * Used to show contextual share prompts
 */
export function isWorthSharing(
  baitScore: number,
  arousal: number,
  callToConflict: number
): boolean {
  // High bait score
  if (baitScore >= 70) return true;

  // High arousal + decent call-to-conflict
  if (arousal >= 70 && callToConflict >= 50) return true;

  // Interesting mismatch: high signal but moderate score (could indicate nuanced content)
  if (arousal >= 60 && baitScore >= 40 && baitScore < 60) return true;

  return false;
}

/**
 * Get the score bucket for analytics
 */
export function getScoreBucket(score: number): "low" | "medium" | "high" {
  if (score >= 70) return "high";
  if (score >= 45) return "medium";
  return "low";
}
