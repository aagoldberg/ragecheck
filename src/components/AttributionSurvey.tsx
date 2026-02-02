"use client";

import { useState, useEffect } from "react";
import { trackAttribution, trackAttributionDismissed } from "@/lib/tracking";

const ATTRIBUTION_SOURCES = [
  "Twitter/X",
  "Bluesky",
  "Reddit",
  "Hacker News",
  "Google Search",
  "Friend/Word of Mouth",
  "Newsletter",
  "Other",
];

interface AttributionSurveyProps {
  /** Prefix for localStorage keys and tracking category. Defaults to "clearview". */
  storagePrefix?: string;
  /** If true, shows the survey immediately (with a short delay). Use for trigger-based display. */
  ready?: boolean;
  /** Delay in ms before showing. For timer mode (ready not provided), defaults to 5000. For ready mode, defaults to 2500. */
  delayMs?: number;
}

export default function AttributionSurvey({
  storagePrefix = "clearview",
  ready,
  delayMs,
}: AttributionSurveyProps) {
  const [visible, setVisible] = useState(false);
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [otherText, setOtherText] = useState("");
  const [exiting, setExiting] = useState(false);

  const lsAnswered = `${storagePrefix}-attribution-answered`;
  const lsDismissed = `${storagePrefix}-attribution-dismissed`;

  const isReadyMode = ready !== undefined;

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem(lsAnswered) || localStorage.getItem(lsDismissed)) return;

    if (isReadyMode) {
      // Ready-based trigger: show when ready becomes true
      if (!ready) return;
      const timer = setTimeout(() => setVisible(true), delayMs ?? 2500);
      return () => clearTimeout(timer);
    } else {
      // Timer-based trigger: show after delay
      const timer = setTimeout(() => setVisible(true), delayMs ?? 5000);
      return () => clearTimeout(timer);
    }
  }, [ready, isReadyMode, delayMs, lsAnswered, lsDismissed]);

  const slideOut = () => {
    setExiting(true);
    setTimeout(() => setVisible(false), 300);
  };

  const handleSelect = (source: string) => {
    if (source === "Other") {
      setShowOtherInput(true);
      return;
    }
    trackAttribution(storagePrefix, source);
    localStorage.setItem(lsAnswered, "true");
    slideOut();
  };

  const handleOtherSubmit = () => {
    const value = otherText.trim() || "Other";
    trackAttribution(storagePrefix, value);
    localStorage.setItem(lsAnswered, "true");
    slideOut();
  };

  const handleDismiss = () => {
    trackAttributionDismissed(storagePrefix);
    localStorage.setItem(lsDismissed, "true");
    slideOut();
  };

  if (!visible) return null;

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300 ease-out ${
        exiting ? "translate-y-full" : "translate-y-0"
      }`}
    >
      <div className="max-w-xl mx-auto px-4 pb-3">
        <div className="bg-zinc-900 dark:bg-zinc-800 border border-zinc-700 dark:border-zinc-600 rounded-xl shadow-2xl px-4 py-3 relative">
          <button
            onClick={handleDismiss}
            className="absolute top-2 right-2 text-zinc-500 hover:text-zinc-300 transition-colors"
            aria-label="Dismiss"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {!showOtherInput ? (
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs font-semibold text-zinc-400 whitespace-nowrap">How&apos;d you find us?</span>
              {ATTRIBUTION_SOURCES.map((source) => (
                <button
                  key={source}
                  onClick={() => handleSelect(source)}
                  className="px-2.5 py-1 text-[11px] font-medium rounded-full border border-zinc-600 text-zinc-300 hover:bg-zinc-700 hover:text-white hover:border-zinc-500 transition-colors"
                >
                  {source}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-zinc-400 whitespace-nowrap">Source:</span>
              <input
                type="text"
                value={otherText}
                onChange={(e) => setOtherText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleOtherSubmit()}
                placeholder="Where did you hear about us?"
                className="flex-1 px-2.5 py-1 text-[11px] bg-zinc-800 dark:bg-zinc-700 border border-zinc-600 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                autoFocus
              />
              <button
                onClick={handleOtherSubmit}
                className="px-3 py-1 text-[11px] font-bold rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition-colors"
              >
                Submit
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
