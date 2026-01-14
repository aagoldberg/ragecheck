"use client";

import { useState } from "react";
import Link from "next/link";

// Types matching the API response
interface AnalysisResult {
  text: string;
  bait_score: number;
  bars: {
    arousal: number;
    enemy_construction: number;
    moral_condemnation: number;
    simplification: number;
    call_to_conflict: number;
  };
  modifiers: {
    reporting_analysis_discount: number;
    information_density: number;
  };
  evidence: Record<string, string[]>;
  top_signals: {
    name: string;
    bar: string;
    weight: number;
    matched: string[];
  }[];
  explanation: string;
  label: "ragebait" | "borderline" | "not_ragebait";
  confidence: number;
}

// Bar display configuration
const BAR_CONFIG = {
  arousal: { label: "Emotional Heat", color: "bg-red-500", description: "Emotional intensity & urgency" },
  enemy_construction: { label: "Us vs Them", color: "bg-orange-500", description: "Othering & dehumanization" },
  moral_condemnation: { label: "Moral Outrage", color: "bg-purple-500", description: "Moral outrage & purity" },
  simplification: { label: "Black & White Thinking", color: "bg-yellow-500", description: "Black-and-white thinking" },
  call_to_conflict: { label: "Fight-Picking", color: "bg-pink-500", description: "Engagement bait & provocation" },
};

function ScoreGauge({ score, label }: { score: number; label: string }) {
  const getColor = () => {
    if (label === "ragebait") return "text-red-500";
    if (label === "borderline") return "text-amber-500";
    return "text-emerald-500";
  };

  const getBgColor = () => {
    if (label === "ragebait") return "bg-red-500";
    if (label === "borderline") return "bg-amber-500";
    return "bg-emerald-500";
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-32 h-32">
        {/* Background circle */}
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-zinc-200 dark:text-zinc-800"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeDasharray={`${score * 2.83} 283`}
            strokeLinecap="round"
            className={getBgColor()}
          />
        </svg>
        {/* Score text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-3xl font-bold ${getColor()}`}>{score}</span>
        </div>
      </div>
      <span className={`mt-2 text-sm font-semibold uppercase tracking-wider ${getColor()}`}>
        {label.replace("_", " ")}
      </span>
    </div>
  );
}

function Bar({ name, score, config }: {
  name: string;
  score: number;
  config: { label: string; color: string; description: string }
}) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <div>
          <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{config.label}</span>
          <span className="ml-2 text-xs text-zinc-500">{config.description}</span>
        </div>
        <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{score}%</span>
      </div>
      <div className="h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
        <div
          className={`h-full ${config.color} transition-all duration-500 ease-out`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

function ModifierBadge({ label, value, positive }: { label: string; value: number; positive?: boolean }) {
  const bgColor = positive
    ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
    : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300";

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${bgColor}`}>
      <span className="text-xs font-medium">{label}</span>
      <span className="text-xs font-bold">{value}%</span>
    </div>
  );
}

function EvidenceSection({ evidence, barName }: { evidence: string[]; barName: string }) {
  if (!evidence || evidence.length === 0) return null;

  return (
    <div className="space-y-1">
      <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">{barName}</h4>
      <ul className="space-y-0.5">
        {evidence.slice(0, 5).map((item, i) => (
          <li key={i} className="text-sm text-zinc-700 dark:text-zinc-300 flex items-start gap-2">
            <span className="text-zinc-400">•</span>
            <span className="font-mono text-xs bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
              {item}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function ModelPage() {
  const [text, setText] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyze = async () => {
    if (!text.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/model", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Analysis failed");
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-100">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-5 h-5 bg-zinc-900 dark:bg-zinc-100 rounded-sm group-hover:rotate-12 transition-transform" />
            <span className="font-bold text-lg tracking-tight">RageCheck</span>
          </Link>
          <div className="flex gap-6 text-sm font-medium">
            <Link href="/" className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
              Analyzer
            </Link>
            <Link href="/clearview" className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
              ClearView
            </Link>
            <span className="text-zinc-900 dark:text-white border-b-2 border-zinc-900 dark:border-white">Model</span>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 rounded-full text-xs font-bold uppercase tracking-widest mb-4">
            Experimental
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            5-Bar Ragebait Model
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl">
            A deterministic, explainable model for detecting ragebait patterns.
            No AI required—pure signal-based analysis with transparent scoring.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Input */}
        <div className="bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 mb-8">
          <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">
            Paste text to analyze
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter a social media post, headline, or article excerpt..."
            className="w-full h-40 px-4 py-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400 resize-none"
          />
          <div className="flex justify-between items-center mt-4">
            <span className="text-xs text-zinc-500">
              {text.length} / 10,000 characters
            </span>
            <button
              onClick={analyze}
              disabled={loading || !text.trim()}
              className="px-6 py-2.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg font-medium text-sm hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {loading ? "Analyzing..." : "Analyze"}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-8">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-6">
            {/* Score Card */}
            <div className="bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 p-8">
              <div className="flex flex-col md:flex-row items-center gap-8">
                {/* Main Score */}
                <ScoreGauge score={result.bait_score} label={result.label} />

                {/* Modifiers */}
                <div className="flex-1 space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                      Context Modifiers
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      <ModifierBadge
                        label="Reporting Discount"
                        value={result.modifiers.reporting_analysis_discount}
                        positive
                      />
                      <ModifierBadge
                        label="Info Density"
                        value={result.modifiers.information_density}
                      />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                      Confidence
                    </h3>
                    <div className="flex items-center gap-2">
                      <div className="h-2 flex-1 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-zinc-500 transition-all"
                          style={{ width: `${result.confidence}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold">{result.confidence}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bars */}
            <div className="bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
              <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-4">
                Signal Bars
              </h3>
              <div className="space-y-4">
                {Object.entries(result.bars).map(([key, value]) => (
                  <Bar
                    key={key}
                    name={key}
                    score={value}
                    config={BAR_CONFIG[key as keyof typeof BAR_CONFIG]}
                  />
                ))}
              </div>
            </div>

            {/* Explanation */}
            <div className="bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
              <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-3">
                Explanation
              </h3>
              <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed">
                {result.explanation}
              </p>
            </div>

            {/* Top Evidence */}
            <div className="bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
              <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-4">
                Top Evidence
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                {Object.entries(result.evidence)
                  .filter(([_, evidence]) => evidence.length > 0)
                  .slice(0, 6)
                  .map(([barName, evidence]) => (
                    <EvidenceSection
                      key={barName}
                      barName={barName.replace(/_/g, " ")}
                      evidence={evidence}
                    />
                  ))}
              </div>
            </div>

            {/* Top Signals */}
            {result.top_signals.length > 0 && (
              <div className="bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
                <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-4">
                  Top Signals
                </h3>
                <div className="space-y-3">
                  {result.top_signals.map((signal, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg"
                    >
                      <div>
                        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                          {signal.name}
                        </span>
                        <span className="ml-2 text-xs text-zinc-500">
                          ({signal.bar.replace(/_/g, " ")})
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {signal.matched.slice(0, 2).map((m, j) => (
                          <span
                            key={j}
                            className="text-xs font-mono bg-zinc-200 dark:bg-zinc-800 px-2 py-0.5 rounded"
                          >
                            {m.length > 20 ? m.slice(0, 17) + "..." : m}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Methodology */}
        <div className="mt-16 border-t border-zinc-200 dark:border-zinc-800 pt-12">
          <h2 className="text-xl font-bold mb-6">How It Works</h2>
          <div className="grid md:grid-cols-2 gap-8 text-sm text-zinc-600 dark:text-zinc-400">
            <div>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">5 Signal Bars</h3>
              <p className="mb-4">
                Each bar measures a distinct ragebait mechanism using multiple weighted signals.
                No single word triggers a high score—patterns must combine.
              </p>
              <ul className="space-y-1">
                <li><strong>Emotional Heat:</strong> Emotional intensity, urgency, punctuation</li>
                <li><strong>Us vs Them:</strong> Othering, dehumanization, scapegoating</li>
                <li><strong>Moral Outrage:</strong> Moral judgment, purity rhetoric</li>
                <li><strong>Black & White Thinking:</strong> Absolutism, false dilemmas</li>
                <li><strong>Fight-Picking:</strong> Engagement bait, provocation</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">2 Context Modifiers</h3>
              <p className="mb-4">
                Modifiers adjust the final score based on context, reducing false positives.
              </p>
              <ul className="space-y-1">
                <li><strong>Reporting Discount:</strong> Detects journalistic/analytical framing (attribution, hedging, quotes)</li>
                <li><strong>Information Density:</strong> Measures substance (entities, numbers, links)</li>
              </ul>
              <p className="mt-4">
                <strong>Formula:</strong> bait_score = core × (1 - discount/125)
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
