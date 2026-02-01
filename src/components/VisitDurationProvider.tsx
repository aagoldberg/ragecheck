"use client";

import { useEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";

export default function VisitDurationProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const visitorIdRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const hasSentLeaveRef = useRef(false);

  const sendLeave = useCallback(() => {
    if (hasSentLeaveRef.current || !visitorIdRef.current) return;
    hasSentLeaveRef.current = true;

    const duration = Math.round((Date.now() - startTimeRef.current) / 1000);
    if (duration <= 0) return;

    const payload = JSON.stringify({
      visitorId: visitorIdRef.current,
      duration,
    });

    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/visit/leave", payload);
    } else {
      fetch("/api/visit/leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true,
      }).catch(() => {});
    }
  }, []);

  useEffect(() => {
    // Send leave for previous page if we're doing an SPA navigation
    sendLeave();

    // Reset for new page
    visitorIdRef.current = null;
    startTimeRef.current = Date.now();
    hasSentLeaveRef.current = false;

    // Gather UTM params
    const urlParams = new URLSearchParams(window.location.search);
    const utmSource = urlParams.get("utm_source");
    const utmMedium = urlParams.get("utm_medium");
    const utmCampaign = urlParams.get("utm_campaign");
    const utmContent = urlParams.get("utm_content");
    const utmTerm = urlParams.get("utm_term");
    const refParam = urlParams.get("ref");

    fetch("/api/visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        referrer: document.referrer || null,
        pagePath: window.location.pathname,
        utmSource: utmSource || refParam || null,
        utmMedium: utmMedium || (refParam ? "qr_code" : null),
        utmCampaign,
        utmContent,
        utmTerm,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.visitorId) {
          visitorIdRef.current = data.visitorId;
        }
      })
      .catch(() => {});

    // Page leave handlers
    const handlePageHide = () => sendLeave();
    const handleBeforeUnload = () => sendLeave();

    window.addEventListener("pagehide", handlePageHide);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("pagehide", handlePageHide);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      // Cleanup fires on SPA navigation — sendLeave will be called at the top of the next effect run
    };
  }, [pathname, sendLeave]);

  return <>{children}</>;
}
