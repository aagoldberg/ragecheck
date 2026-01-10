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

interface ExpertConsensus {
  type: "scientific" | "legal" | "historical" | "economic" | "intelligence" | "statistical" | "professional" | "international" | "none";
  exists: boolean;
  statement?: string;
  confidenceLevel: "high" | "moderate" | "low" | "contested";
  sources?: string[];
  dissent?: string;
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
  expertConsensus?: ExpertConsensus;
  debateType?: "factual" | "policy" | "values" | "mixed";
  debateQuestion?: string;
  commonGround?: string[];
  factualDisputes?: FactualDispute[];
}

// --- Constants & Utils ---

const LEAN_CONFIG: Record<string, { color: string; bg: string; border: string; label: string }> = {
  "Far Left": { color: "text-indigo-900 dark:text-indigo-200", bg: "bg-indigo-100 dark:bg-indigo-900/40", border: "border-indigo-200 dark:border-indigo-800", label: "Far Left" },
  "Left": { color: "text-blue-800 dark:text-blue-200", bg: "bg-blue-50 dark:bg-blue-900/20", border: "border-blue-200 dark:border-blue-800", label: "Left" },
  "Center": { color: "text-zinc-700 dark:text-zinc-300", bg: "bg-zinc-100 dark:bg-zinc-800", border: "border-zinc-200 dark:border-zinc-700", label: "Center" },
  "Right": { color: "text-rose-800 dark:text-rose-200", bg: "bg-rose-50 dark:bg-rose-900/20", border: "border-rose-200 dark:border-rose-800", label: "Right" },
  "Far Right": { color: "text-orange-900 dark:text-orange-200", bg: "bg-orange-100 dark:bg-orange-900/40", border: "border-orange-200 dark:border-orange-800", label: "Far Right" },
};

function getLeanConfig(lean: string) {
  return LEAN_CONFIG[lean] || LEAN_CONFIG["Center"];
}

// --- Components ---

function BiasBadge({ lean }: { lean: string }) {
  const config = getLeanConfig(lean);
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${config.bg} ${config.color} border ${config.border} shadow-sm`}>
      {lean}
    </span>
  );
}

function BiasSpectrum({ sources }: { sources: SourceAnalysis[] }) {
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
    <div className="flex flex-col gap-1">
      <div className="flex h-1.5 w-32 rounded-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
        <div style={{ width: `${(counts.left / total) * 100}%` }} className="bg-blue-500/80" />
        <div style={{ width: `${(counts.center / total) * 100}%` }} className="bg-zinc-400/50" />
        <div style={{ width: `${(counts.right / total) * 100}%` }} className="bg-rose-500/80" />
      </div>
      <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">{total} Sources</span>
    </div>
  );
}

function EvidenceStatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    supported: { bg: "bg-emerald-50 dark:bg-emerald-900/20", text: "text-emerald-700 dark:text-emerald-400", label: "Supported by Evidence" },
    mixed: { bg: "bg-amber-50 dark:bg-amber-900/20", text: "text-amber-700 dark:text-amber-400", label: "Mixed Evidence" },
    unsupported: { bg: "bg-rose-50 dark:bg-rose-900/20", text: "text-rose-700 dark:text-rose-400", label: "Unsupported" },
    misleading: { bg: "bg-orange-50 dark:bg-orange-900/20", text: "text-orange-700 dark:text-orange-400", label: "Misleading Context" },
  };
  const c = config[status] || config.mixed;
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide border border-transparent ${c.bg} ${c.text}`}>
      {c.label}
    </span>
  );
}

function ExpertConsensusMinimal({ consensus }: { consensus?: ExpertConsensus }) {
  if (!consensus || consensus.type === "none" || !consensus.exists) return null;

  const confidenceColor = 
    consensus.confidenceLevel === "high" ? "text-emerald-600 dark:text-emerald-400" :
    consensus.confidenceLevel === "moderate" ? "text-amber-600 dark:text-amber-400" :
    "text-zinc-500";

  return (
    <div className="flex items-start gap-3 p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-zinc-100 dark:border-zinc-800/50">
      <div className="shrink-0 mt-0.5 text-lg">⚖️</div>
      <div className="space-y-1">
        <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">Expert Consensus ({consensus.type})</p>
        <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 leading-snug">
          {consensus.statement}
        </p>
        <p className={`text-xs ${confidenceColor}`}>Confidence: {consensus.confidenceLevel}</p>
      </div>
    </div>
  );
}

function PerspectiveColumn({ perspective, align }: { perspective: Perspective; align: "left" | "right" }) {
  const isLeft = align === "left";
  const borderColor = isLeft ? "border-l-blue-500" : "border-l-rose-500";
  const titleColor = isLeft ? "text-blue-700 dark:text-blue-400" : "text-rose-700 dark:text-rose-400";
  
  return (
    <div className={`pl-4 border-l-2 ${borderColor}`}>
      <h4 className={`text-xs font-bold uppercase tracking-wider mb-2 ${titleColor}`}>
        {isLeft ? "The Left's Framing" : "The Right's Framing"}
      </h4>
      <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed italic">
        "{perspective.viewpoint}"
      </p>
    </div>
  );
}

function StoryCard({ story }: { story: StoryCluster }) {
  const [expanded, setExpanded] = useState(false);
  
  const leftPerspective = story.perspectives.find(p => p.lean.toLowerCase().includes("left"));
  const rightPerspective = story.perspectives.find(p => p.lean.toLowerCase().includes("right"));

  return (
    <article className="group bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all duration-300">
      
      {/* Header / Meta */}
      <div className="px-6 pt-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
             <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-900 text-zinc-500 font-serif font-bold text-sm">
                #
             </span>
             <span className="text-xs font-medium text-zinc-400 uppercase tracking-widest">{story.debateType || "News"}</span>
        </div>
        <BiasSpectrum sources={story.sources} />
      </div>

      {/* Main Content */}
      <div className="p-6 md:p-8 space-y-8">
        
        {/* Headline & Core Facts */}
        <div className="space-y-6">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-zinc-900 dark:text-zinc-50 leading-tight">
                {story.topic}
            </h2>

            <div className="prose prose-lg dark:prose-invert max-w-none">
                 <p className="text-zinc-800 dark:text-zinc-300 leading-relaxed font-serif text-lg md:text-xl border-l-4 border-zinc-900 dark:border-zinc-100 pl-6 py-1">
                    {story.whatHappened}
                </p>
            </div>
        </div>

        {/* Perspectives Split */}
        {(leftPerspective || rightPerspective) && (
            <div className="grid md:grid-cols-2 gap-8 pt-4 border-t border-zinc-100 dark:border-zinc-900">
                {leftPerspective && <PerspectiveColumn perspective={leftPerspective} align="left" />}
                {rightPerspective && <PerspectiveColumn perspective={rightPerspective} align="right" />}
            </div>
        )}

        <ExpertConsensusMinimal consensus={story.expertConsensus} />

      </div>

      {/* Footer / Actions */}
      <div className="bg-zinc-50/50 dark:bg-zinc-900/30 px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
         <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Key Takeaway</span>
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{story.keyTakeaway}</span>
         </div>
         
         <button 
            onClick={() => setExpanded(!expanded)}
            className="text-sm font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors flex items-center gap-2"
          >
              {expanded ? "Close Analysis" : "View Sources & Disputes"}
              <svg className={`w-4 h-4 transition-transform ${expanded ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
          </button>
      </div>

      {/* Expanded Section */}
      {expanded && (
        <div className="border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/20 p-6 md:p-8 animate-in slide-in-from-top-2">
            
            {/* Common Ground & Disputes */}
            <div className="grid md:grid-cols-2 gap-8 mb-10">
                {story.commonGround && story.commonGround.length > 0 && (
                    <div className="space-y-4">
                        <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                            <span className="text-emerald-500">✓</span> Common Ground
                        </h4>
                        <ul className="space-y-2">
                            {story.commonGround.map((item, i) => (
                                <li key={i} className="text-sm text-zinc-600 dark:text-zinc-400 pl-4 border-l border-zinc-200 dark:border-zinc-700">
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                
                {story.factualDisputes && story.factualDisputes.length > 0 && (
                    <div className="space-y-4">
                        <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                            <span className="text-amber-500">⚠</span> Factual Disputes
                        </h4>
                        <div className="space-y-3">
                            {story.factualDisputes.map((dispute, i) => (
                                <div key={i} className="bg-white dark:bg-zinc-900 p-3 rounded border border-zinc-200 dark:border-zinc-800">
                                    <div className="flex justify-between items-start mb-2">
                                        <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300">"{dispute.claim}"</p>
                                        <EvidenceStatusBadge status={dispute.evidenceStatus} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div className="text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/10 p-1.5 rounded">
                                            L: {dispute.leftPosition}
                                        </div>
                                        <div className="text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/10 p-1.5 rounded">
                                            R: {dispute.rightPosition}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Source Grid */}
            <div className="space-y-4">
                <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-widest border-b border-zinc-200 dark:border-zinc-800 pb-2">
                    Source Breakdown
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {story.sources.map((source, i) => (
                        <a 
                            key={i} 
                            href={source.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="block p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors group/card"
                        >
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{source.name}</span>
                                <BiasBadge lean={source.lean} />
                            </div>
                            <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 mb-3 group-hover/card:underline decoration-zinc-400 underline-offset-2">
                                {source.title}
                            </p>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">
                                <span className="font-semibold text-zinc-400">Framing:</span> {source.framing}
                            </p>
                            {source.manipulationTechniques.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                    {source.manipulationTechniques.slice(0, 2).map((tech, t) => (
                                        <span key={t} className="text-[9px] px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 rounded border border-zinc-200 dark:border-zinc-700">
                                            {tech}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </a>
                    ))}
                </div>
            </div>
        </div>
      )}

    </article>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-12">
      {[1, 2].map((i) => (
        <div key={i} className="animate-pulse space-y-4">
            <div className="h-6 w-32 bg-zinc-200 dark:bg-zinc-800 rounded" />
            <div className="h-10 w-3/4 bg-zinc-200 dark:bg-zinc-800 rounded" />
            <div className="h-40 w-full bg-zinc-100 dark:bg-zinc-900 rounded-xl" />
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
    <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-100 font-sans selection:bg-indigo-100 dark:selection:bg-indigo-900">
      
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
            <span className="text-zinc-900 dark:text-white border-b-2 border-zinc-900 dark:border-white">ClearView</span>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative pt-20 pb-16 px-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
        <div className="max-w-2xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 rounded-full text-xs font-bold uppercase tracking-widest border border-zinc-200 dark:border-zinc-800">
                Daily Briefing
                {generatedAt && (
                   <span className="text-zinc-400">| {new Date(generatedAt).toLocaleDateString()}</span>
                )}
            </div>
            
            <h1 className="text-5xl md:text-6xl font-serif font-bold tracking-tight text-zinc-900 dark:text-white leading-[1.1]">
                What actually happened.
            </h1>
            
            <p className="text-xl text-zinc-500 dark:text-zinc-400 max-w-xl mx-auto leading-relaxed">
                We read the spin so you don't have to. A cross-spectrum analysis of today's top stories.
            </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-16">
        
        {loading && <LoadingSkeleton />}

        {error && (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-rose-50 dark:bg-rose-900/30 text-rose-600 rounded-full mb-4">!</div>
            <h3 className="text-lg font-bold">Unable to load briefing</h3>
            <p className="text-zinc-500 mt-2 mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-zinc-900 text-white rounded hover:bg-zinc-800"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && stories.length === 0 && (
           <div className="text-center py-24 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
              <h3 className="text-xl font-bold mb-2">No Stories Detected</h3>
              <p className="text-zinc-500">The news cycle seems quiet, or we haven't found sufficient cross-spectrum coverage yet.</p>
           </div>
        )}

        {!loading && !error && stories.length > 0 && (
          <div className="space-y-12">
            {stories.map((story) => (
              <StoryCard key={story.id} story={story} />
            ))}
          </div>
        )}

        <div className="mt-32 pt-12 border-t border-zinc-200 dark:border-zinc-800 text-center">
            <p className="text-xs text-zinc-400 uppercase tracking-widest">
                Generated by RageCheck AI • Aggregating 50+ Sources
            </p>
        </div>

      </div>
    </div>
  );
}
