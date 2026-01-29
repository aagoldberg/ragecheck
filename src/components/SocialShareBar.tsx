"use client";

import { useState, useEffect } from "react";
import {
  buildXIntentUrl,
  buildBlueskyIntentUrl,
  buildFacebookShareUrl,
  buildLinkedInShareUrl,
} from "@/lib/share/getShareText";
import * as tracking from "@/lib/tracking";

interface SocialShareBarProps {
  url: string;
  xText: string;
  blueskyText: string;
  nativeText: string;
  nativeTitle: string;
  context: string;
  compact?: boolean;
}

export function SocialShareBar({
  url,
  xText,
  blueskyText,
  nativeText,
  nativeTitle,
  context,
  compact = false,
}: SocialShareBarProps) {
  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);

  useEffect(() => {
    setCanNativeShare(typeof navigator !== "undefined" && !!navigator.share);
  }, []);

  const fullUrl = url.startsWith("http")
    ? url
    : `${typeof window !== "undefined" ? window.location.origin : ""}${url}`;

  const handleShareX = () => {
    tracking.trackClearviewShare(context, "x");
    window.open(buildXIntentUrl(xText, fullUrl), "_blank");
  };

  const handleShareBluesky = () => {
    tracking.trackClearviewShare(context, "bluesky");
    window.open(buildBlueskyIntentUrl(blueskyText), "_blank");
  };

  const handleShareFacebook = () => {
    tracking.trackClearviewShare(context, "facebook");
    window.open(buildFacebookShareUrl(fullUrl), "_blank");
  };

  const handleShareLinkedIn = () => {
    tracking.trackClearviewShare(context, "linkedin");
    window.open(buildLinkedInShareUrl(fullUrl), "_blank");
  };

  const handleCopyLink = async () => {
    tracking.trackClearviewShare(context, "copy");
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = fullUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleNativeShare = async () => {
    tracking.trackClearviewShare(context, "native");
    try {
      await navigator.share({
        title: nativeTitle,
        text: nativeText,
        url: fullUrl,
      });
    } catch {
      // User cancelled or share failed
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mr-1">Share</span>
        <button onClick={handleShareX} title="Share to X" className="p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
          <XIcon className="w-3.5 h-3.5" />
        </button>
        <button onClick={handleShareBluesky} title="Share to Bluesky" className="p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
          <BlueskyIcon className="w-3.5 h-3.5" />
        </button>
        <button onClick={handleShareFacebook} title="Share to Facebook" className="p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
          <FacebookIcon className="w-3.5 h-3.5" />
        </button>
        <button onClick={handleShareLinkedIn} title="Share to LinkedIn" className="p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
          <LinkedInIcon className="w-3.5 h-3.5" />
        </button>
        <button onClick={handleCopyLink} title="Copy link" className="p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
          {copied ? <CheckIcon className="w-3.5 h-3.5 text-emerald-500" /> : <LinkIcon className="w-3.5 h-3.5" />}
        </button>
        {canNativeShare && (
          <button onClick={handleNativeShare} title="Share" className="p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
            <ShareIcon className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        onClick={handleShareX}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-black text-white hover:opacity-90 transition-opacity"
      >
        <XIcon className="w-3.5 h-3.5" />
        X
      </button>
      <button
        onClick={handleShareBluesky}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-500 text-white hover:opacity-90 transition-opacity"
      >
        <BlueskyIcon className="w-3.5 h-3.5" />
        Bluesky
      </button>
      <button
        onClick={handleShareFacebook}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#1877F2] text-white hover:opacity-90 transition-opacity"
      >
        <FacebookIcon className="w-3.5 h-3.5" />
        Facebook
      </button>
      <button
        onClick={handleShareLinkedIn}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#0A66C2] text-white hover:opacity-90 transition-opacity"
      >
        <LinkedInIcon className="w-3.5 h-3.5" />
        LinkedIn
      </button>
      <button
        onClick={handleCopyLink}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
          copied
            ? "bg-emerald-500 text-white"
            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
        }`}
      >
        {copied ? (
          <>
            <CheckIcon className="w-3.5 h-3.5" />
            Copied!
          </>
        ) : (
          <>
            <LinkIcon className="w-3.5 h-3.5" />
            Copy Link
          </>
        )}
      </button>
      {canNativeShare && (
        <button
          onClick={handleNativeShare}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
        >
          <ShareIcon className="w-3.5 h-3.5" />
          Share
        </button>
      )}
    </div>
  );
}

// Icons

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function BlueskyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 568 501">
      <path d="M123.121 33.664C188.241 82.553 258.281 181.68 284 234.873c25.719-53.192 95.759-152.32 160.879-201.21C491.866-1.611 568-28.906 568 57.947c0 17.346-9.945 145.713-15.778 166.555-20.275 72.453-94.155 90.933-159.875 79.748C507.222 323.8 536.444 388.56 503.222 453.32 441.497 574.806 321.895 449.291 295.436 408.682c-4.614-7.08-6.78-10.403-11.436-17.809-4.655 7.406-6.822 10.73-11.435 17.809-26.46 40.609-146.062 166.124-207.787 44.638-33.222-64.76-4-129.52 110.875-149.07C109.933 315.634 36.053 297.154 15.778 224.701 9.945 203.859 0 75.492 0 58.146 0-28.906 76.135-1.612 123.121 33.664Z" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function LinkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
  );
}

function ShareIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
    </svg>
  );
}

export default SocialShareBar;
