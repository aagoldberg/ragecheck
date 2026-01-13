"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, Suspense } from "react";

// Initialize PostHog
if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
    person_profiles: "identified_only",
    capture_pageview: false, // We'll do this manually for more control
    capture_pageleave: true,
    autocapture: true, // Auto-capture clicks, form submissions, etc.
  });
}

// Scroll depth tracking component
function ScrollDepthTracker() {
  const scrollMilestones = useRef<Set<number>>(new Set());
  const pathname = usePathname();

  useEffect(() => {
    // Reset milestones on page change
    scrollMilestones.current = new Set();

    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;

      if (docHeight <= 0) return;

      const scrollPercent = Math.round((scrollTop / docHeight) * 100);

      const milestones = [25, 50, 75, 100];
      for (const milestone of milestones) {
        if (scrollPercent >= milestone && !scrollMilestones.current.has(milestone)) {
          scrollMilestones.current.add(milestone);
          posthog.capture("scroll_depth", {
            depth_percent: milestone,
            page: pathname,
          });
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [pathname]);

  return null;
}

// Time on page tracking component
function TimeOnPageTracker() {
  const pathname = usePathname();
  const startTime = useRef<number>(Date.now());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const capturedMilestones = useRef<Set<number>>(new Set());

  useEffect(() => {
    // Reset on page change
    startTime.current = Date.now();
    capturedMilestones.current = new Set();

    // Track time milestones
    const milestones = [10, 30, 60, 120, 300]; // seconds

    intervalRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime.current) / 1000);

      for (const milestone of milestones) {
        if (elapsed >= milestone && !capturedMilestones.current.has(milestone)) {
          capturedMilestones.current.add(milestone);
          posthog.capture("time_on_page", {
            seconds: milestone,
            page: pathname,
          });
        }
      }
    }, 5000); // Check every 5 seconds

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      // Capture final time on page leave
      const finalTime = Math.floor((Date.now() - startTime.current) / 1000);
      if (finalTime > 0) {
        posthog.capture("page_leave", {
          time_spent_seconds: finalTime,
          page: pathname,
        });
      }
    };
  }, [pathname]);

  return null;
}

// Page view tracker with search params
function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (pathname) {
      let url = window.origin + pathname;
      if (searchParams.toString()) {
        url = url + `?${searchParams.toString()}`;
      }
      posthog.capture("$pageview", {
        $current_url: url,
      });
    }
  }, [pathname, searchParams]);

  return null;
}

// Wrapper for PageViewTracker with Suspense (required for useSearchParams)
function SuspendedPageViewTracker() {
  return (
    <Suspense fallback={null}>
      <PageViewTracker />
    </Suspense>
  );
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  // Don't render PostHog stuff if no key configured
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    return <>{children}</>;
  }

  return (
    <PHProvider client={posthog}>
      <SuspendedPageViewTracker />
      <ScrollDepthTracker />
      <TimeOnPageTracker />
      {children}
    </PHProvider>
  );
}

// Export posthog for manual event tracking
export { posthog };
