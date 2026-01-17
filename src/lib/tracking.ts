import posthog from "posthog-js";

// Check if PostHog is available
const isPostHogAvailable = () => {
  return typeof window !== "undefined" && process.env.NEXT_PUBLIC_POSTHOG_KEY;
};

// Landing page funnel events
export const trackSearchFocus = () => {
  if (!isPostHogAvailable()) return;
  posthog.capture("search_focused", {
    funnel_step: 1,
  });
};

export const trackUrlPasted = (url: string) => {
  if (!isPostHogAvailable()) return;
  posthog.capture("url_pasted", {
    funnel_step: 2,
    url_domain: extractDomain(url),
    input_method: "paste",
  });
};

export const trackUrlTyped = (url: string) => {
  if (!isPostHogAvailable()) return;
  posthog.capture("url_entered", {
    funnel_step: 2,
    url_domain: extractDomain(url),
    input_method: "type",
  });
};

export const trackTrendingHeadlineClicked = (headline: string, index: number) => {
  if (!isPostHogAvailable()) return;
  posthog.capture("trending_headline_clicked", {
    funnel_step: 2,
    headline_preview: headline.substring(0, 50),
    position: index,
  });
};

export const trackImageUploaded = (method: "button" | "paste" | "drop") => {
  if (!isPostHogAvailable()) return;
  posthog.capture("image_uploaded", {
    funnel_step: 2,
    upload_method: method,
  });
};

export const trackAnalysisStarted = (type: "url" | "image") => {
  if (!isPostHogAvailable()) return;
  posthog.capture("analysis_started", {
    funnel_step: 3,
    analysis_type: type,
  });
};

export const trackAnalysisCompleted = (score: number, platform: string | null, llmEnhanced: boolean) => {
  if (!isPostHogAvailable()) return;
  posthog.capture("analysis_completed", {
    funnel_step: 4,
    score,
    score_level: score <= 33 ? "low" : score <= 66 ? "medium" : "high",
    platform: platform || "unknown",
    llm_enhanced: llmEnhanced,
  });
};

export const trackAnalysisFailed = (error: string) => {
  if (!isPostHogAvailable()) return;
  posthog.capture("analysis_failed", {
    funnel_step: 3,
    error_type: categorizeError(error),
  });
};

export const trackShareClicked = (platform: "twitter" | "copy" | "native") => {
  if (!isPostHogAvailable()) return;
  posthog.capture("share_clicked", {
    funnel_step: 5,
    platform,
  });
};

export const trackShareCompleted = (platform: "twitter" | "copy" | "native") => {
  if (!isPostHogAvailable()) return;
  posthog.capture("share_completed", {
    funnel_step: 6,
    platform,
  });
};

// UI interaction events
export const trackTabChanged = (tab: string) => {
  if (!isPostHogAvailable()) return;
  posthog.capture("tab_changed", {
    tab,
  });
};

export const trackExpandedSection = (section: string) => {
  if (!isPostHogAvailable()) return;
  posthog.capture("section_expanded", {
    section,
  });
};

export const trackFeedbackSubmitted = (rating: "positive" | "negative", hasComment: boolean) => {
  if (!isPostHogAvailable()) return;
  posthog.capture("feedback_submitted", {
    rating,
    has_comment: hasComment,
  });
};

// CTA events
export const trackCtaViewed = (ctaType: string) => {
  if (!isPostHogAvailable()) return;
  posthog.capture("cta_viewed", {
    cta_type: ctaType,
  });
};

export const trackCtaClicked = (ctaType: string) => {
  if (!isPostHogAvailable()) return;
  posthog.capture("cta_clicked", {
    cta_type: ctaType,
  });
};

// Helper functions
function extractDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return "invalid";
  }
}

function categorizeError(error: string): string {
  const e = error.toLowerCase();
  if (e.includes("url") || e.includes("invalid")) return "invalid_url";
  if (e.includes("fetch") || e.includes("network")) return "network_error";
  if (e.includes("content") || e.includes("extract")) return "extraction_error";
  if (e.includes("timeout")) return "timeout";
  return "other";
}

// Identify user (call when you have user info, e.g., from IP or login)
export const identifyUser = (distinctId: string, properties?: Record<string, unknown>) => {
  if (!isPostHogAvailable()) return;
  posthog.identify(distinctId, properties);
};

// Reset user (call on logout or session end)
export const resetUser = () => {
  if (!isPostHogAvailable()) return;
  posthog.reset();
};

// ==========================================
// INTERACTION TRACKING (with DB logging)
// ==========================================

// Generic interaction tracker - logs to PostHog and DB
export const trackInteraction = async (
  category: string,
  action: string,
  label?: string,
  value?: number,
  metadata?: Record<string, unknown>
) => {
  // PostHog tracking
  if (isPostHogAvailable()) {
    posthog.capture("interaction", {
      category,
      action,
      label,
      value,
      ...metadata,
    });
  }

  // DB tracking (fire and forget)
  try {
    navigator.sendBeacon(
      "/api/track-interaction",
      JSON.stringify({ category, action, label, value, metadata })
    );
  } catch {
    // Silently fail - don't break UX for tracking
  }
};

// Navigation tracking
export const trackNavClick = (destination: string, location: "header" | "footer" | "menu") => {
  trackInteraction("navigation", "click", destination, undefined, { location });
};

// Share card interactions
export const trackShareCardVariant = (variant: "x" | "bluesky") => {
  trackInteraction("share_card", "variant_selected", variant);
};

export const trackShareCardCopy = (variant: string) => {
  trackInteraction("share_card", "copy_clicked", variant);
};

export const trackShareCardDownload = (variant: string) => {
  trackInteraction("share_card", "download_clicked", variant);
};

export const trackShareToTwitter = () => {
  trackInteraction("share_card", "share_to_twitter");
};

export const trackShareToBluesky = () => {
  trackInteraction("share_card", "share_to_bluesky");
};

// Result interactions
export const trackFilterClick = (filter: string) => {
  trackInteraction("results", "filter_clicked", filter);
};

export const trackScoreClick = () => {
  trackInteraction("results", "score_clicked");
};

export const trackSectionExpand = (section: string) => {
  trackInteraction("results", "section_expanded", section);
};

export const trackSectionCollapse = (section: string) => {
  trackInteraction("results", "section_collapsed", section);
};

// Form/input interactions
export const trackPasteButtonClick = () => {
  trackInteraction("input", "paste_button_clicked");
};

export const trackSubmitButtonClick = (inputType: "url" | "image") => {
  trackInteraction("input", "submit_clicked", inputType);
};

export const trackSurpriseMeClick = () => {
  trackInteraction("input", "surprise_me_clicked");
};

export const trackFeedbackThumbClick = (type: "up" | "down") => {
  trackInteraction("feedback", "thumb_clicked", type);
};

// External link tracking
export const trackExternalLink = (destination: string, context?: string) => {
  trackInteraction("external_link", "clicked", destination, undefined, { context });
};

// Email subscription tracking
export const trackEmailSubscribe = (location: string) => {
  trackInteraction("email", "subscribe_clicked", location);
};

export const trackEmailSubscribeSuccess = (location: string) => {
  trackInteraction("email", "subscribe_success", location);
};

// Language selection tracking
export const trackLanguageSelected = (language: string) => {
  trackInteraction("language", "selected", language || "English");
};
