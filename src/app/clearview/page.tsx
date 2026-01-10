"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

// --- Types ---

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

interface FactualContext {
  hasScientificConsensus: boolean;
  consensusStatement?: string;
  confidenceLevel: "high" | "moderate" | "low" | "contested";
  expertSources?: string[];
}

interface FactualDispute {
  claim: string;
  leftPosition: string;
  rightPosition: string;
  evidenceStatus: "supported" | "mixed" | "unsupported" | "misleading";
}

interface StoryCluster {
  id: string;
  topic: string;
  summary: string;
  whatHappened: string;
  sources: SourceAnalysis[];
  perspectives: Perspective[];
  keyTakeaway: string;
  factualContext?: FactualContext;
  debateType?: "factual" | "policy" | "values" | "mixed";
  debateQuestion?: string;
  commonGround?: string[];
  factualDisputes?: FactualDispute[];
}

// --- Constants & Utils ---

const LEAN_CONFIG: Record<string, { color: string; bg: string; border: string; label: string }> = {
  "Far Left": { color: "text-blue-700 dark:text-blue-300", bg: "bg-blue-100 dark:bg-blue-900/40", border: "border-blue-200 dark:border-blue-800", label: "Far Left" },
  "Left": { color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-900/20", border: "border-blue-200 dark:border-blue-800", label: "Left" },
  "Center": { color: "text-zinc-600 dark:text-zinc-400", bg: "bg-zinc-100 dark:bg-zinc-800", border: "border-zinc-200 dark:border-zinc-700", label: "Center" },
  "Right": { color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-50 dark:bg-rose-900/20", border: "border-rose-200 dark:border-rose-800", label: "Right" },
  "Far Right": { color: "text-rose-700 dark:text-rose-300", bg: "bg-rose-100 dark:bg-rose-900/40", border: "border-rose-200 dark:border-rose-800", label: "Far Right" },
};

function getLeanConfig(lean: string) {
  return LEAN_CONFIG[lean] || LEAN_CONFIG["Center"];
}

// --- Components ---

function BiasBadge({ lean }: { lean: string }) {
  const config = getLeanConfig(lean);
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${config.bg} ${config.color} ${config.border}`}>
      {lean}
    </span>
  );
}

function BiasSpectrum({ sources }: { sources: SourceAnalysis[] }) {
  // Simple visualization of source distribution
  const counts = { left: 0, center: 0, right: 0 };
  sources.forEach(s => {
    const lean = s.lean.toLowerCase();
    if (lean.includes("left")) counts.left++;
    else if (lean.includes("right")) counts.right++;
    else counts.center++;
  });

  const total = sources.length;
  if (total === 0) return null;

  return (
    <div className="flex items-center gap-2 text-xs text-zinc-500 font-medium">
      <div className="flex h-2 w-24 rounded-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
        <div style={{ width: `${(counts.left / total) * 100}%` }} className="bg-blue-500 h-full" />
        <div style={{ width: `${(counts.center / total) * 100}%` }} className="bg-zinc-400 h-full" />
        <div style={{ width: `${(counts.right / total) * 100}%` }} className="bg-rose-500 h-full" />
      </div>
      <span>{total} Sources Analysis</span>
    </div>
  );
}

function DebateTypeBadge({ type }: { type: string }) {
  const config: Record<string, { bg: string; text: string; label: string; icon: string }> = {
    factual: { bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-300", label: "Factual Dispute", icon: "❓" },
    policy: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-300", label: "Policy Debate", icon: "⚖️" },
    values: { bg: "bg-purple-100 dark:bg-purple-900/30", text: "text-purple-700 dark:text-purple-300", label: "Values Debate", icon: "💭" },
    mixed: { bg: "bg-zinc-100 dark:bg-zinc-800", text: "text-zinc-700 dark:text-zinc-300", label: "Mixed", icon: "🔀" },
  };
  const c = config[type] || config.mixed;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${c.bg} ${c.text}`}>
      <span>{c.icon}</span>
      {c.label}
    </span>
  );
}

function EvidenceStatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    supported: { bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-300", label: "✓ Evidence Supported" },
    mixed: { bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-300", label: "~ Mixed Evidence" },
    unsupported: { bg: "bg-rose-100 dark:bg-rose-900/30", text: "text-rose-700 dark:text-rose-300", label: "✗ Not Supported" },
    misleading: { bg: "bg-orange-100 dark:bg-orange-900/30", text: "text-orange-700 dark:text-orange-300", label: "⚠ Misleading" },
  };
  const c = config[status] || config.mixed;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${c.bg} ${c.text}`}>
      {c.label}
    </span>
  );
}

function FactualContextBox({ context, debateType, debateQuestion }: {
  context?: FactualContext;
  debateType?: string;
  debateQuestion?: string;
}) {
  if (!context) return null;

  const confidenceConfig: Record<string, { color: string; label: string }> = {
    high: { color: "text-emerald-600 dark:text-emerald-400", label: "High confidence" },
    moderate: { color: "text-amber-600 dark:text-amber-400", label: "Moderate confidence" },
    low: { color: "text-orange-600 dark:text-orange-400", label: "Low confidence" },
    contested: { color: "text-rose-600 dark:text-rose-400", label: "Actively contested" },
  };

  const conf = confidenceConfig[context.confidenceLevel] || confidenceConfig.contested;

  return (
    <div className={`p-4 rounded-xl border ${
      context.hasScientificConsensus
        ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50"
        : "bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50"
    }`}>
      <div className="flex items-start gap-3">
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          context.hasScientificConsensus
            ? "bg-emerald-100 dark:bg-emerald-900/50"
            : "bg-amber-100 dark:bg-amber-900/50"
        }`}>
          {context.hasScientificConsensus ? (
            <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h4 className={`font-bold text-sm ${
              context.hasScientificConsensus
                ? "text-emerald-900 dark:text-emerald-100"
                : "text-amber-900 dark:text-amber-100"
            }`}>
              {context.hasScientificConsensus ? "Scientific Consensus Exists" : "No Clear Scientific Consensus"}
            </h4>
            <span className={`text-xs ${conf.color}`}>({conf.label})</span>
          </div>

          {context.consensusStatement && (
            <p className="text-sm text-zinc-700 dark:text-zinc-300 mb-2">
              {context.consensusStatement}
            </p>
          )}

          {context.expertSources && context.expertSources.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {context.expertSources.map((src, i) => (
                <span key={i} className="px-1.5 py-0.5 bg-white/50 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400 text-[10px] rounded border border-zinc-200 dark:border-zinc-700">
                  {src}
                </span>
              ))}
            </div>
          )}

          {debateType && debateQuestion && (
            <div className="mt-3 pt-3 border-t border-zinc-200/50 dark:border-zinc-700/50">
              <div className="flex items-center gap-2 mb-1">
                <DebateTypeBadge type={debateType} />
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 italic">
                The real question: "{debateQuestion}"
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CommonGroundSection({ commonGround }: { commonGround?: string[] }) {
  if (!commonGround || commonGround.length === 0) return null;

  return (
    <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-200 dark:border-zinc-800">
      <h4 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 mb-2 flex items-center gap-2">
        <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        Common Ground (Both Sides Agree)
      </h4>
      <ul className="space-y-1">
        {commonGround.map((item, i) => (
          <li key={i} className="text-sm text-zinc-600 dark:text-zinc-400 flex items-start gap-2">
            <span className="text-emerald-500 mt-0.5">✓</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function FactualDisputesSection({ disputes }: { disputes?: FactualDispute[] }) {
  if (!disputes || disputes.length === 0) return null;

  return (
    <div className="space-y-3">
      <h4 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
        <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        Disputed Claims
      </h4>
      {disputes.map((dispute, i) => (
        <div key={i} className="p-4 bg-white dark:bg-zinc-900/50 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-start justify-between gap-2 mb-3">
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">"{dispute.claim}"</p>
            <EvidenceStatusBadge status={dispute.evidenceStatus} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-2 rounded bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30">
              <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase">Left Position</span>
              <p className="text-xs text-zinc-700 dark:text-zinc-300 mt-1">{dispute.leftPosition}</p>
            </div>
            <div className="p-2 rounded bg-rose-50/50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/30">
              <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase">Right Position</span>
              <p className="text-xs text-zinc-700 dark:text-zinc-300 mt-1">{dispute.rightPosition}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function PerspectiveCard({ perspective }: { perspective: Perspective }) {
  const isLeft = perspective.lean.toLowerCase().includes("left");
  const theme = isLeft ? LEAN_CONFIG["Left"] : LEAN_CONFIG["Right"];
  
  return (
    <div className={`p-5 rounded-xl border ${theme.bg} ${theme.border} h-full`}>
      <h4 className={`font-bold mb-3 flex items-center gap-2 ${theme.color}`}>
        {isLeft ? (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                 <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
        ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                 <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
        )}
        {perspective.lean} Viewpoint
      </h4>
      <p className="text-sm leading-relaxed text-zinc-800 dark:text-zinc-200">
        {perspective.viewpoint}
      </p>
    </div>
  );
}

function SourceCard({ source }: { source: SourceAnalysis }) {
  const config = getLeanConfig(source.lean);
  
  return (
    <div className="group relative p-4 bg-white dark:bg-zinc-900/50 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all hover:shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{source.name}</span>
        <BiasBadge lean={source.lean} />
      </div>
      
      <a 
        href={source.url} 
        target="_blank" 
        rel="noopener noreferrer"
        className="block text-sm font-medium text-zinc-800 dark:text-zinc-200 mb-3 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors line-clamp-2"
      >
        {source.title}
      </a>

      <div className="space-y-3">
        <div>
           <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Framing</p>
           <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
             {source.framing}
           </p>
        </div>
        
        {source.manipulationTechniques.length > 0 && (
          <div>
            <div className="flex flex-wrap gap-1">
              {source.manipulationTechniques.slice(0, 3).map((tech, i) => (
                <span key={i} className="px-1.5 py-0.5 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 text-[10px] rounded border border-rose-100 dark:border-rose-800/50">
                  {tech}
                </span>
              ))}
              {source.manipulationTechniques.length > 3 && (
                 <span className="px-1.5 py-0.5 text-zinc-400 text-[10px]">+ {source.manipulationTechniques.length - 3} more</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StoryCard({ story }: { story: StoryCluster }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      
      {/* Main Content */}
      <div className="p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-start gap-6 md:gap-8">
            
          {/* Left Column: Context */}
          <div className="flex-1 space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-3 leading-tight">
                {story.topic}
                </h2>
                <div className="flex items-center gap-4 mb-4">
                    <BiasSpectrum sources={story.sources} />
                </div>
            </div>

            <div className="prose prose-sm dark:prose-invert max-w-none">
                <div className="bg-indigo-50/50 dark:bg-indigo-950/20 p-5 rounded-xl border border-indigo-100 dark:border-indigo-900/30">
                     <h3 className="text-indigo-900 dark:text-indigo-100 font-bold text-sm uppercase tracking-wide flex items-center gap-2 mb-2">
                        <svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        The Core Facts
                    </h3>
                    <p className="text-zinc-800 dark:text-zinc-200 leading-relaxed text-base">
                        {story.whatHappened}
                    </p>
                </div>
            </div>

            {/* Factual Context - NEW */}
            <FactualContextBox
              context={story.factualContext}
              debateType={story.debateType}
              debateQuestion={story.debateQuestion}
            />

            <div>
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm flex items-center gap-2 mb-2">
                    <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    Key Takeaway
                </h3>
                <p className="text-zinc-600 dark:text-zinc-400 text-sm">
                    {story.keyTakeaway}
                </p>
            </div>
          </div>

          {/* Right Column: Perspectives Preview (Desktop) */}
          <div className="hidden md:block w-72 flex-shrink-0 space-y-4">
               <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Divergent Perspectives</h3>
               {story.perspectives.slice(0, 2).map((p, i) => (
                   <div key={i} className={`p-3 rounded-lg border text-sm ${
                        p.lean.toLowerCase().includes("left") 
                        ? "bg-blue-50/50 border-blue-100 dark:bg-blue-900/10 dark:border-blue-900/30 text-blue-900 dark:text-blue-200"
                        : "bg-rose-50/50 border-rose-100 dark:bg-rose-900/10 dark:border-rose-900/30 text-rose-900 dark:text-rose-200"
                   }`}>
                       <span className="font-bold block mb-1 text-xs opacity-75">{p.lean} Focus</span>
                       {p.viewpoint}
                   </div>
               ))}
          </div>

        </div>
      </div>

      {/* Action Bar */}
      <div className="border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
          <button 
            onClick={() => setExpanded(!expanded)}
            className="w-full py-4 px-6 flex items-center justify-between group hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
              <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-200 flex items-center gap-2">
                 {expanded ? "Hide Analysis" : "Dive Deeper: Compare Sources & Framing"}
              </span>
              <svg 
                className={`w-5 h-5 text-zinc-400 transition-transform ${expanded ? "rotate-180" : ""}`} 
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
          </button>
      </div>

      {/* Expanded Analysis */}
      {expanded && (
        <div className="border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/30 p-6 md:p-8 space-y-8 animate-in slide-in-from-top-4 duration-300">

            {/* Mobile Perspectives (Visible only on mobile) */}
            <div className="md:hidden space-y-4">
                 <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Divergent Perspectives</h3>
                 <div className="grid gap-4">
                    {story.perspectives.map((p, i) => <PerspectiveCard key={i} perspective={p} />)}
                 </div>
            </div>

            {/* Common Ground & Factual Disputes - NEW */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <CommonGroundSection commonGround={story.commonGround} />
              <FactualDisputesSection disputes={story.factualDisputes} />
            </div>

            {/* Source Grid */}
            <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
                    <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                    </svg>
                    Source-by-Source Breakdown
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {story.sources.map((source, i) => (
                        <SourceCard key={i} source={source} />
                    ))}
                </div>
            </div>

        </div>
      )}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto px-4">
      {[1, 2].map((i) => (
        <div key={i} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 animate-pulse">
          <div className="space-y-4">
            <div className="h-8 bg-zinc-100 dark:bg-zinc-800 rounded w-3/4" />
            <div className="h-4 bg-zinc-100 dark:bg-zinc-800 rounded w-1/4" />
            <div className="h-32 bg-zinc-100 dark:bg-zinc-800 rounded-xl w-full mt-6" />
          </div>
        </div>
      ))}
    </div>
  );
}

// --- Main Page ---

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
    <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-100 font-sans">
      
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-5 h-5 bg-zinc-900 dark:bg-zinc-100 rounded-sm group-hover:rotate-12 transition-transform" />
            <span className="font-bold text-lg tracking-tight">RageCheck</span>
          </Link>
          <div className="flex gap-6 text-sm font-medium">
            <Link href="/" className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
              Analyzer
            </Link>
            <span className="text-indigo-600 dark:text-indigo-400">Clearview</span>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800">
        <div className="absolute inset-0 bg-grid-zinc-100 dark:bg-grid-zinc-900/50 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:[mask-image:linear-gradient(0deg,rgba(0,0,0,0.2),rgba(0,0,0,0.6))]" />
        <div className="max-w-5xl mx-auto px-4 pt-16 pb-12 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-semibold uppercase tracking-wide mb-6 border border-indigo-100 dark:border-indigo-800">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                Daily Briefing
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6 max-w-3xl">
                What’s actually happening. <br/>
                <span className="text-zinc-400 dark:text-zinc-500">Minus the spin.</span>
            </h1>
            <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl leading-relaxed">
                We analyze stories from across the political spectrum to extract the core facts and show you exactly how different outlets are framing the narrative.
            </p>
             {generatedAt && (
                <p className="text-sm text-zinc-400 mt-6 flex items-center gap-2">
                   <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                   </svg>
                   Last updated: {new Date(generatedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                </p>
            )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-12">
        
        {loading && <LoadingSkeleton />}

        {error && (
          <div className="max-w-2xl mx-auto bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-800 rounded-xl p-8 text-center">
            <div className="w-12 h-12 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
            </div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-2">Failed to load briefing</h3>
            <p className="text-zinc-600 dark:text-zinc-400 mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && stories.length === 0 && (
          <div className="max-w-2xl mx-auto bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-12 text-center">
             <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 text-zinc-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
            </div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-2">No Stories Analyzed Yet</h3>
            <p className="text-zinc-600 dark:text-zinc-400">
              We haven't detected any major stories with significant cross-spectrum coverage at this moment. Please check back later.
            </p>
          </div>
        )}

        {!loading && !error && stories.length > 0 && (
          <div className="space-y-8">
            {stories.map((story) => (
              <StoryCard key={story.id} story={story} />
            ))}
          </div>
        )}

        {/* Methodology Footer */}
        <div className="mt-24 border-t border-zinc-200 dark:border-zinc-800 pt-12 text-center">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Powered by Transparent Analysis</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto">
                Clearview aggregates headlines from diverse sources (including Jacobin, NPR, PBS, Fox News, Breitbart), identifies shared topics, and uses AI to synthesize facts while highlighting framing differences.
            </p>
        </div>
      </div>
    </div>
  );
}