"use client";

import { useState, useRef, useEffect } from "react";
import { SharecardOutput, SharecardVariant } from "@/lib/asymmetricValue/types";
import {
  renderSharecardToCanvas,
  copySharecardToClipboard,
  downloadSharecard,
  getSharecardText,
  VARIANT_INFO,
  getRecommendedVariant,
} from "@/lib/asymmetricValue/SharecardRenderer";

interface SharecardSelectorProps {
  sharecards: SharecardOutput;
  resultUrl: string;
}

export function SharecardSelector({ sharecards, resultUrl }: SharecardSelectorProps) {
  const [selectedVariant, setSelectedVariant] = useState<SharecardVariant>(() =>
    getRecommendedVariant(
      parseInt(sharecards.respectful_share.heat_display),
      parseInt(sharecards.respectful_share.evidence_display)
    )
  );
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const selectedContent = sharecards[selectedVariant];

  // Render preview whenever selection changes
  useEffect(() => {
    if (canvasRef.current && selectedContent) {
      renderSharecardToCanvas(canvasRef.current, {
        variant: selectedVariant,
        content: selectedContent,
      });
    }
  }, [selectedVariant, selectedContent]);

  const handleCopy = async () => {
    const success = await copySharecardToClipboard({
      variant: selectedVariant,
      content: selectedContent,
    });
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    await downloadSharecard(
      { variant: selectedVariant, content: selectedContent },
      `ragecheck-${selectedVariant}.png`
    );
    setDownloading(false);
  };

  const handleShareTwitter = () => {
    const { twitterText } = getSharecardText(selectedContent, resultUrl);
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(twitterText)}`;
    window.open(url, "_blank");
  };

  const handleShareBluesky = () => {
    const { blueskyText } = getSharecardText(selectedContent, resultUrl);
    const url = `https://bsky.app/intent/compose?text=${encodeURIComponent(blueskyText)}`;
    window.open(url, "_blank");
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Share Card</h3>
        <span className="text-xs text-zinc-500">1200x630 for social</span>
      </div>

      {/* Variant selector */}
      <div className="flex gap-2">
        {VARIANT_INFO.map((info) => (
          <button
            key={info.id}
            onClick={() => setSelectedVariant(info.id)}
            className={`flex-1 px-3 py-2 rounded-lg text-left transition-all ${
              selectedVariant === info.id
                ? "bg-indigo-100 dark:bg-indigo-900/30 border-2 border-indigo-500"
                : "bg-zinc-100 dark:bg-zinc-800 border-2 border-transparent hover:border-zinc-300 dark:hover:border-zinc-600"
            }`}
          >
            <div className="text-xs font-bold text-zinc-900 dark:text-white">{info.name}</div>
            <div className="text-[10px] text-zinc-500 dark:text-zinc-400">{info.tone}</div>
          </button>
        ))}
      </div>

      {/* Canvas preview */}
      <div className="relative rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800">
        <canvas
          ref={canvasRef}
          className="w-full"
          style={{ aspectRatio: "1200/630" }}
        />
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleCopy}
          className={`flex-1 px-4 py-3 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2 ${
            copied
              ? "bg-emerald-500 text-white"
              : "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:opacity-90"
          }`}
        >
          {copied ? (
            <>
              <CheckIcon />
              Copied!
            </>
          ) : (
            <>
              <CopyIcon />
              Copy Image
            </>
          )}
        </button>

        <button
          onClick={handleDownload}
          disabled={downloading}
          className="px-4 py-3 rounded-lg font-medium text-sm bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-white hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors flex items-center gap-2"
        >
          <DownloadIcon />
          {downloading ? "..." : "Save"}
        </button>
      </div>

      {/* Share links */}
      <div className="flex gap-2">
        <button
          onClick={handleShareTwitter}
          className="flex-1 px-3 py-2 rounded-lg text-sm font-medium bg-black text-white hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
        >
          <XIcon />
          Share to X
        </button>
        <button
          onClick={handleShareBluesky}
          className="flex-1 px-3 py-2 rounded-lg text-sm font-medium bg-blue-500 text-white hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
        >
          <BlueskyIcon />
          Share to Bluesky
        </button>
      </div>

      {/* Text preview */}
      <details className="text-xs">
        <summary className="cursor-pointer text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
          View share text
        </summary>
        <div className="mt-2 p-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg font-mono text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap">
          {getSharecardText(selectedContent, resultUrl).fullText}
        </div>
      </details>
    </div>
  );
}

// Icons
function CopyIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function BlueskyIcon() {
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm5.5 14.5c-1.5 1.5-4 1.5-5.5 0-1.5-1.5-1.5-4 0-5.5 1.5-1.5 4-1.5 5.5 0 1.5 1.5 1.5 4 0 5.5z" />
    </svg>
  );
}

export default SharecardSelector;
