"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface SourceAnalysis {
  name: string;
  lean: string;
  title: string;
  url: string;
  framing: string;
  manipulationTechniques: string[];
}

interface Perspective {
  lean: string;
  viewpoint: string;
}

interface StoryCluster {
  id: string;
  topic: string;
  summary: string;
  whatHappened: string;
  sources: SourceAnalysis[];
  perspectives: Perspective[];
  keyTakeaway: string;
}

const LEAN_COLORS: Record<string, string> = {
  "Far Left": "bg-blue-600 text-white",
  "Left": "bg-blue-400 text-white",
  "Center": "bg-gray-400 text-white",
  "Right": "bg-red-400 text-white",
  "Far Right": "bg-red-600 text-white",
};

const LEAN_BORDER_COLORS: Record<string, string> = {
  "Far Left": "border-blue-600",
  "Left": "border-blue-400",
  "Center": "border-gray-400",
  "Right": "border-red-400",
  "Far Right": "border-red-600",
};

function StoryCard({ story, index }: { story: StoryCluster; index: number }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Story Header */}
      <div className="p-6 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-lg">
            {index + 1}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
              {story.topic}
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
              {story.summary}
            </p>
          </div>
        </div>
      </div>

      {/* What Actually Happened */}
      <div className="p-6 bg-emerald-50 dark:bg-emerald-900/10 border-b border-zinc-100 dark:border-zinc-800">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-3 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          What Actually Happened
        </h3>
        <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed">
          {story.whatHappened}
        </p>
      </div>

      {/* Key Takeaway */}
      <div className="p-6 bg-amber-50 dark:bg-amber-900/10 border-b border-zinc-100 dark:border-zinc-800">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400 mb-3 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Key Takeaway
        </h3>
        <p className="text-zinc-700 dark:text-zinc-300 font-medium">
          {story.keyTakeaway}
        </p>
      </div>

      {/* Expand/Collapse Button */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center justify-center gap-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
      >
        {expanded ? (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
            Hide Source Analysis
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            See How Each Source Framed It ({story.sources.length} sources)
          </>
        )}
      </button>

      {/* Expanded Content */}
      {expanded && (
        <div className="border-t border-zinc-100 dark:border-zinc-800">
          {/* Source Analysis */}
          <div className="p-6 space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-4">
              How Each Source Covered This Story
            </h3>
            <div className="space-y-4">
              {story.sources.map((source, i) => (
                <div
                  key={i}
                  className={`p-4 rounded-lg border-l-4 bg-zinc-50 dark:bg-zinc-800/50 ${LEAN_BORDER_COLORS[source.lean] || "border-gray-400"}`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-bold text-zinc-900 dark:text-zinc-100">
                      {source.name}
                    </span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${LEAN_COLORS[source.lean] || "bg-gray-400 text-white"}`}>
                      {source.lean}
                    </span>
                  </div>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline block mb-3 truncate"
                  >
                    &ldquo;{source.title}&rdquo; →
                  </a>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3">
                    <span className="font-medium text-zinc-700 dark:text-zinc-300">Framing:</span> {source.framing}
                  </p>
                  {source.manipulationTechniques.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {source.manipulationTechniques.map((technique, j) => (
                        <span
                          key={j}
                          className="text-xs px-2 py-1 bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 rounded"
                        >
                          {technique}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Different Perspectives */}
          {story.perspectives.length > 0 && (
            <div className="p-6 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/30">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-4">
                Understanding Different Viewpoints
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                {story.perspectives.map((perspective, i) => (
                  <div
                    key={i}
                    className={`p-4 rounded-lg border ${
                      perspective.lean.toLowerCase().includes("left")
                        ? "border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/10"
                        : "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10"
                    }`}
                  >
                    <h4 className={`font-bold mb-2 ${
                      perspective.lean.toLowerCase().includes("left")
                        ? "text-blue-700 dark:text-blue-400"
                        : "text-red-700 dark:text-red-400"
                    }`}>
                      {perspective.lean} Perspective
                    </h4>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      {perspective.viewpoint}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 animate-pulse">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-zinc-200 dark:bg-zinc-700 rounded-full" />
            <div className="flex-1 space-y-3">
              <div className="h-6 bg-zinc-200 dark:bg-zinc-700 rounded w-2/3" />
              <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-full" />
              <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-5/6" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ClearviewPage() {
  const [stories, setStories] = useState<StoryCluster[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/clearview")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setStories(data.stories);
          setGeneratedAt(data.generatedAt);
        } else {
          setError(data.error || "Failed to load analysis");
        }
      })
      .catch(() => {
        setError("Failed to connect to server");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      {/* Navigation */}
      <nav className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-5 h-5 bg-zinc-900 dark:bg-zinc-100 rounded-sm" />
            <span className="font-bold text-lg tracking-tight">RageCheck</span>
          </Link>
          <div className="flex gap-4 text-sm font-medium text-zinc-500">
            <Link href="/" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
              Analyzer
            </Link>
            <span className="text-indigo-600 dark:text-indigo-400">Clearview</span>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-sm font-medium mb-4">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Beta Feature
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Clearview
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Cut through the spin. We read today&apos;s top stories from across the political spectrum,
            synthesize what actually happened, and show you how each source is framing it.
          </p>
          {generatedAt && (
            <p className="text-sm text-zinc-500 mt-4">
              Last updated: {new Date(generatedAt).toLocaleString()}
            </p>
          )}
        </div>

        {/* Content */}
        {loading && <LoadingSkeleton />}

        {error && (
          <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl p-6 text-center">
            <p className="text-rose-700 dark:text-rose-300 font-medium">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-rose-600 text-white rounded-lg text-sm font-medium hover:bg-rose-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && stories.length === 0 && (
          <div className="bg-zinc-100 dark:bg-zinc-800 rounded-xl p-8 text-center">
            <p className="text-zinc-600 dark:text-zinc-400">
              No major stories found with coverage from multiple sources. Check back later.
            </p>
          </div>
        )}

        {!loading && !error && stories.length > 0 && (
          <div className="space-y-8">
            {stories.map((story, index) => (
              <StoryCard key={story.id} story={story} index={index} />
            ))}
          </div>
        )}

        {/* Methodology Note */}
        <div className="mt-12 p-6 bg-zinc-100 dark:bg-zinc-800/50 rounded-xl">
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
            How This Works
          </h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Clearview pulls headlines from news sources across the political spectrum (Jacobin, NPR, PBS, Fox News, Breitbart),
            identifies stories being covered by multiple outlets, and uses AI to synthesize the facts from the framing.
            Our goal is to help you understand what actually happened before deciding what to think about it.
          </p>
        </div>
      </div>
    </div>
  );
}
