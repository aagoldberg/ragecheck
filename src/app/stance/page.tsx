"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { SocialShareBar } from "@/components/SocialShareBar";
import { getStanceShareText } from "@/lib/share/stanceShareText";
import * as tracking from "@/lib/tracking";
import {
  POSTURE_META,
  DEFENSE_TAG_LABELS,
  type StanceAnalysis,
  type Posture,
  type DefenseTag,
} from "@/lib/stance/types";

interface StanceResult {
  id: string;
  analysis: StanceAnalysis;
  analyzedAt: string;
}

export default function StancePage() {
  const [url, setUrl] = useState("");
  const [pasteText, setPasteText] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<StanceResult | null>(null);
  const [inputMode, setInputMode] = useState<"url" | "text">("url");

  // ---- Image handling ----
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setImageError(null);
    if (!file) { setImagePreview(null); return; }
    const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowed.includes(file.type)) { setImageError("Please upload a JPEG, PNG, GIF, or WebP image"); setImagePreview(null); return; }
    if (file.size > 5 * 1024 * 1024) { setImageError("Image too large (max 5MB)"); setImagePreview(null); return; }
    const reader = new FileReader();
    reader.onload = (ev) => { setImagePreview(ev.target?.result as string); setUrl(""); setPasteText(""); };
    reader.readAsDataURL(file);
  };
  const clearImage = () => { setImagePreview(null); setImageError(null); const fi = document.getElementById("stance-img") as HTMLInputElement; if (fi) fi.value = ""; };
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith("image/")) {
        e.preventDefault();
        const file = items[i].getAsFile();
        if (!file) continue;
        if (file.size > 5 * 1024 * 1024) { setImageError("Image too large (max 5MB)"); return; }
        const reader = new FileReader();
        reader.onload = (ev) => { setImagePreview(ev.target?.result as string); setUrl(""); setPasteText(""); setImageError(null); };
        reader.readAsDataURL(file);
        return;
      }
    }
  }, []);
  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); if (e.dataTransfer.types.includes("Files")) setIsDragging(true); }, []);
  const handleDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }, []);
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setIsDragging(false);
    const files = e.dataTransfer.files;
    if (!files?.length) return;
    const file = files[0];
    const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowed.includes(file.type)) { setImageError("Please drop a JPEG, PNG, GIF, or WebP image"); return; }
    if (file.size > 5 * 1024 * 1024) { setImageError("Image too large (max 5MB)"); return; }
    const reader = new FileReader();
    reader.onload = (ev) => { setImagePreview(ev.target?.result as string); setUrl(""); setPasteText(""); setImageError(null); };
    reader.readAsDataURL(file);
  }, []);

  // ---- Analysis ----
  const doAnalyze = async (body: Record<string, string>) => {
    setLoading(true); setError(null); setResult(null);
    tracking.trackInteraction("stance", "analysis_started", Object.keys(body)[0]);
    try {
      const res = await fetch("/api/stance/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!data.success) { setError(data.error || "Analysis failed"); return; }
      setResult(data.result);
      window.scrollTo({ top: 0, behavior: "smooth" });
      tracking.trackInteraction("stance", "analysis_completed", data.result.analysis.posture.primary);
    } catch { setError("Failed to connect. Please try again."); }
    finally { setLoading(false); }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (imagePreview) doAnalyze({ image: imagePreview });
    else if (inputMode === "text" && pasteText.trim()) doAnalyze({ text: pasteText.trim() });
    else if (url.trim()) doAnalyze({ url: url.trim() });
  };

  const shareUrl = result ? `${typeof window !== "undefined" ? window.location.origin : ""}/stance/share?id=${result.id}` : "";
  const shareTexts = result ? getStanceShareText(result.analysis, shareUrl) : null;

  const a = result?.analysis;

  return (
    <div className="min-h-screen bg-[#0a0a10] text-zinc-100">
      {/* Header */}
      <header className="border-b border-zinc-800/50">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" />
              </svg>
            </div>
            <h1 className="text-lg font-bold tracking-wide">
              <span className="text-violet-400">Stance</span>
            </h1>
            <span className="text-[10px] font-bold bg-violet-500/15 text-violet-400 border border-violet-500/30 px-2 py-0.5 rounded-full uppercase tracking-widest">
              Experimental
            </span>
          </div>
          <nav className="flex items-center gap-4 text-xs text-zinc-500">
            <Link href="/" className="hover:text-zinc-300 transition-colors">RageCheck</Link>
            <Link href="/defensecheck" className="hover:text-zinc-300 transition-colors">DefenseCheck</Link>
            <Link href="/stance/about" className="hover:text-zinc-300 transition-colors">About</Link>
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Hero */}
        {!result && (
          <div className="text-center space-y-3 pt-4">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              What is this content <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-violet-600">really doing?</span>
            </h2>
            <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
              Full 8-stage rhetorical analysis — posture, defense patterns, persuasion techniques, predicted effects, and actionable interventions.
            </p>
          </div>
        )}

        {/* Input */}
        <form onSubmit={handleSubmit} onPaste={handlePaste} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
          className={`relative max-w-2xl mx-auto ${isDragging ? "ring-2 ring-violet-500 ring-offset-2 ring-offset-[#0a0a10] rounded-2xl" : ""}`}>
          {isDragging && (
            <div className="absolute inset-0 z-50 bg-violet-500/10 border-2 border-dashed border-violet-500 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <p className="text-violet-400 font-bold">Drop screenshot here</p>
            </div>
          )}
          {imageError && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm text-center">{imageError}</div>}
          {imagePreview && (
            <div className="mb-6 relative">
              <div className="relative rounded-2xl overflow-hidden border border-zinc-700 bg-zinc-800">
                <img src={imagePreview} alt="Preview" className="w-full max-h-64 object-contain" />
                <button type="button" onClick={clearImage} className="absolute top-3 right-3 p-1.5 bg-zinc-900/80 hover:bg-zinc-900 text-white rounded-full transition-colors backdrop-blur-sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <button type="button" onClick={() => doAnalyze({ image: imagePreview })} disabled={loading}
                className="mt-4 w-full px-6 py-4 bg-gradient-to-r from-violet-500 to-violet-600 text-white rounded-xl font-bold text-lg hover:from-violet-400 hover:to-violet-500 transition-all disabled:opacity-50">
                {loading ? "Analyzing..." : "Analyze Screenshot"}
              </button>
            </div>
          )}
          {!imagePreview && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <button type="button" onClick={() => setInputMode("url")}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${inputMode === "url" ? "bg-violet-500/20 text-violet-400 border border-violet-500/30" : "text-zinc-500 hover:text-zinc-300"}`}>URL</button>
                <button type="button" onClick={() => setInputMode("text")}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${inputMode === "text" ? "bg-violet-500/20 text-violet-400 border border-violet-500/30" : "text-zinc-500 hover:text-zinc-300"}`}>Paste Text</button>
                <span className="text-zinc-600 text-xs ml-1">or drop/paste a screenshot</span>
              </div>
              {inputMode === "url" ? (
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-violet-500 to-violet-600 rounded-2xl blur opacity-20 group-focus-within:opacity-40 transition duration-1000"></div>
                  <div className="relative flex items-center bg-zinc-900 rounded-2xl ring-1 ring-zinc-800 group-focus-within:ring-zinc-700">
                    <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Paste URL or image (tweet, article, meme)..."
                      className="flex-1 w-full pl-6 pr-4 py-5 bg-transparent border-0 focus:ring-0 focus:outline-none text-lg text-zinc-100 placeholder-zinc-500" />
                    <div className="pr-3 flex items-center gap-3">
                      <label htmlFor="stance-img" className="p-2.5 text-zinc-500 hover:text-zinc-300 cursor-pointer transition-colors bg-zinc-800 rounded-xl hover:bg-zinc-700 flex-shrink-0" title="Upload screenshot">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        <input id="stance-img" type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={handleImageSelect} className="hidden" />
                      </label>
                      <button type="submit" disabled={loading || !url.trim()}
                        className="px-6 py-3 bg-gradient-to-r from-violet-500 to-violet-600 text-white rounded-xl text-base font-bold hover:from-violet-400 hover:to-violet-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed min-w-[120px]">
                        {loading ? <Spinner /> : "Analyze"}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-violet-500 to-violet-600 rounded-2xl blur opacity-20 group-focus-within:opacity-40 transition duration-1000"></div>
                  <div className="relative bg-zinc-900 rounded-2xl ring-1 ring-zinc-800 group-focus-within:ring-zinc-700">
                    <textarea value={pasteText} onChange={(e) => setPasteText(e.target.value)} placeholder="Paste a message, tweet, email, article text..."
                      rows={6} maxLength={15000} className="w-full bg-transparent border-0 focus:ring-0 focus:outline-none rounded-2xl p-5 text-base text-zinc-100 placeholder-zinc-500 resize-y" />
                    <div className="flex items-center justify-between px-5 pb-4">
                      <span className="text-xs text-zinc-600">{pasteText.length.toLocaleString()} / 15,000</span>
                      <button type="submit" disabled={loading || !pasteText.trim()}
                        className="px-6 py-2.5 bg-gradient-to-r from-violet-500 to-violet-600 text-white rounded-xl text-sm font-bold hover:from-violet-400 hover:to-violet-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                        {loading ? <Spinner /> : "Analyze"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </form>

        {error && <div className="max-w-2xl mx-auto bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">{error}</div>}

        {/* ===== RESULTS ===== */}
        {a && (
          <div className="space-y-6">
            {/* Stage 1 + 2: Summary & Posture */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <PostureBadge posture={a.posture.primary} />
                {a.posture.secondary?.filter(s => s.weight > 0.2).map((s, i) => (
                  <span key={i} className="text-xs px-2.5 py-1 rounded-full border" style={{ borderColor: POSTURE_META[s.label as Posture]?.color || "#8b5cf6", color: POSTURE_META[s.label as Posture]?.color || "#8b5cf6" }}>
                    {POSTURE_META[s.label as Posture]?.label || s.label} ({Math.round(s.weight * 100)}%)
                  </span>
                ))}
                <span className="text-xs text-zinc-500 bg-zinc-800 px-2.5 py-1 rounded-full ml-auto">{a.summary.primary_mode}</span>
              </div>
              <p className="text-sm text-zinc-300 leading-relaxed">{a.summary.neutral_summary}</p>
              {a.summary.top_claims.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1.5">Claims made</p>
                  <ul className="space-y-1">
                    {a.summary.top_claims.map((c, i) => <li key={i} className="text-xs text-zinc-400 flex gap-2"><span className="text-violet-400">&#x2022;</span>{c}</li>)}
                  </ul>
                </div>
              )}
              {a.posture.evidence_spans?.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1.5">Posture evidence</p>
                  {a.posture.evidence_spans.slice(0, 3).map((ev, i) => (
                    <blockquote key={i} className="text-xs text-zinc-400 bg-zinc-800/50 rounded-lg p-2.5 mb-1.5 border-l-2 border-violet-500/50">
                      &ldquo;{ev.quote}&rdquo; <span className="text-zinc-500">— {ev.explanation}</span>
                    </blockquote>
                  ))}
                </div>
              )}
            </div>

            {/* Stage 3: Defense Module */}
            {a.defense_module.tags.length > 0 && (
              <Section title="Defense Patterns" badge={`${a.defense_module.overall_defense_score_raw}/100`}>
                <div className="space-y-3">
                  {a.defense_module.tags.filter(t => t.intensity > 0).map((tag, i) => (
                    <div key={i} className="bg-zinc-800/30 rounded-lg p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-teal-400">{DEFENSE_TAG_LABELS[tag.tag as DefenseTag] || tag.tag}</span>
                        <span className="text-[10px] text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded">{tag.confidence}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-teal-500 transition-all" style={{ width: `${(tag.intensity / 10) * 100}%` }} />
                        </div>
                        <span className="text-xs text-zinc-500 w-8 text-right">{tag.intensity}/10</span>
                      </div>
                      {tag.evidence_spans?.slice(0, 2).map((ev, j) => (
                        <blockquote key={j} className="text-xs text-zinc-400 bg-zinc-800/50 rounded p-2 border-l-2 border-teal-500/40">
                          &ldquo;{ev.quote}&rdquo;
                        </blockquote>
                      ))}
                      {tag.alt_explanations?.length > 0 && (
                        <p className="text-[10px] text-zinc-500 italic">Alt: {tag.alt_explanations.join("; ")}</p>
                      )}
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Stage 4: Rhetorical Techniques */}
            {a.rhetorical_techniques?.length > 0 && (
              <Section title="Rhetorical Techniques">
                <div className="space-y-3">
                  {a.rhetorical_techniques.map((tech, i) => (
                    <div key={i} className="bg-zinc-800/30 rounded-lg p-3 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-orange-400">{tech.technique}</span>
                        <span className="text-[10px] text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded">{tech.confidence}</span>
                      </div>
                      {tech.evidence_spans?.slice(0, 2).map((ev, j) => (
                        <blockquote key={j} className="text-xs text-zinc-400 bg-zinc-800/50 rounded p-2 border-l-2 border-orange-500/40">
                          &ldquo;{ev.quote}&rdquo; <span className="text-zinc-500">— {ev.explanation}</span>
                        </blockquote>
                      ))}
                      {tech.alt_explanations?.length > 0 && (
                        <p className="text-[10px] text-zinc-500 italic">Alt: {tech.alt_explanations.join("; ")}</p>
                      )}
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Stage 5: Vulnerability Hypotheses */}
            {a.vulnerability_hypotheses && (
              <Section title="Reader Assumptions" badge={a.vulnerability_hypotheses.confidence}>
                {a.vulnerability_hypotheses.assumed_beliefs?.length > 0 && (
                  <div className="mb-3">
                    <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1.5">Assumes the reader believes</p>
                    <ul className="space-y-1">
                      {a.vulnerability_hypotheses.assumed_beliefs.map((b, i) => <li key={i} className="text-xs text-zinc-400 flex gap-2"><span className="text-amber-400">&#x2022;</span>{b}</li>)}
                    </ul>
                  </div>
                )}
                {a.vulnerability_hypotheses.invited_identity && (
                  <p className="text-xs text-zinc-400"><span className="text-zinc-500">Invited identity:</span> {a.vulnerability_hypotheses.invited_identity}</p>
                )}
                {a.vulnerability_hypotheses.rewarded_assumptions?.length > 0 && (
                  <div className="mt-2">
                    <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1.5">Assumptions this content rewards</p>
                    <ul className="space-y-1">
                      {a.vulnerability_hypotheses.rewarded_assumptions.map((r, i) => <li key={i} className="text-xs text-zinc-400 flex gap-2"><span className="text-amber-400">&#x2022;</span>{r}</li>)}
                    </ul>
                  </div>
                )}
              </Section>
            )}

            {/* Stage 6: Predicted Effects */}
            {a.predicted_effects && (
              <Section title="Predicted Effects" badge={a.predicted_effects.confidence}>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                  <EffectGauge label="Escalation" value={a.predicted_effects.escalation_likelihood} />
                  <EffectGauge label="Polarization" value={a.predicted_effects.polarization_push} />
                  <EffectGauge label="Belief Closure" value={a.predicted_effects.belief_closure} />
                  <EffectGauge label="Virality" value={a.predicted_effects.virality_language_only} />
                </div>
                <p className="text-xs text-zinc-400">{a.predicted_effects.why}</p>
                {a.predicted_effects.likely_reply_dynamics && (
                  <p className="text-xs text-zinc-500 mt-2"><span className="text-zinc-400">Likely reply dynamics:</span> {a.predicted_effects.likely_reply_dynamics}</p>
                )}
              </Section>
            )}

            {/* Stage 7: Interventions */}
            {a.interventions && (
              <div className="bg-violet-500/5 border border-violet-500/20 rounded-xl p-6 space-y-4">
                <h3 className="text-sm font-bold text-violet-400 uppercase tracking-wider">Reader Interventions</h3>
                {a.interventions.self_check_questions?.length > 0 && (
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2">Ask yourself</p>
                    {a.interventions.self_check_questions.map((q, i) => (
                      <p key={i} className="text-sm text-zinc-300 bg-zinc-800/40 rounded-lg p-3 mb-2 border-l-2 border-violet-500/40">{q}</p>
                    ))}
                  </div>
                )}
                {a.interventions.response_templates?.length > 0 && (
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2">Non-hostile response templates</p>
                    {a.interventions.response_templates.map((t, i) => (
                      <p key={i} className="text-sm text-zinc-300 bg-zinc-800/40 rounded-lg p-3 mb-2 font-mono text-xs">&ldquo;{t}&rdquo;</p>
                    ))}
                  </div>
                )}
                {a.interventions.sharing_caution && (
                  <div className="flex gap-2 items-start">
                    <svg className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <p className="text-xs text-amber-300/80">{a.interventions.sharing_caution}</p>
                  </div>
                )}
              </div>
            )}

            {/* Stage 8: Calibration */}
            {a.calibration && (a.calibration.context_notes?.length > 0 || a.calibration.failure_modes?.length > 0) && (
              <Section title="Calibration & Limits">
                {a.calibration.context_notes?.length > 0 && (
                  <div className="mb-3">
                    <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1.5">Missing context</p>
                    <ul className="space-y-1">{a.calibration.context_notes.map((n, i) => <li key={i} className="text-xs text-zinc-400 flex gap-2"><span className="text-zinc-500">&#x2022;</span>{n}</li>)}</ul>
                  </div>
                )}
                {a.calibration.failure_modes?.length > 0 && (
                  <div className="mb-3">
                    <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1.5">Possible failure modes</p>
                    <ul className="space-y-1">{a.calibration.failure_modes.map((f, i) => <li key={i} className="text-xs text-zinc-400 flex gap-2"><span className="text-zinc-500">&#x2022;</span>{f}</li>)}</ul>
                  </div>
                )}
                {a.calibration.what_would_change_assessment?.length > 0 && (
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1.5">What would change this assessment</p>
                    <ul className="space-y-1">{a.calibration.what_would_change_assessment.map((w, i) => <li key={i} className="text-xs text-zinc-400 flex gap-2"><span className="text-zinc-500">&#x2022;</span>{w}</li>)}</ul>
                  </div>
                )}
              </Section>
            )}

            {/* Cross-links */}
            <div className="flex flex-wrap gap-3">
              <Link href="/defensecheck" className="text-xs text-teal-400 bg-teal-500/10 border border-teal-500/20 rounded-lg px-3 py-2 hover:bg-teal-500/20 transition-colors">
                Deep-dive defense patterns in DefenseCheck &rarr;
              </Link>
              <Link href="/" className="text-xs text-orange-400 bg-orange-500/10 border border-orange-500/20 rounded-lg px-3 py-2 hover:bg-orange-500/20 transition-colors">
                Check rage-bait score in RageCheck &rarr;
              </Link>
            </div>

            {/* Share */}
            {shareTexts && (
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 space-y-3">
                <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-wider">Share This Analysis</h3>
                <SocialShareBar url={shareUrl} xText={shareTexts.xText} blueskyText={shareTexts.blueskyText} nativeText={shareTexts.nativeText} nativeTitle={shareTexts.nativeTitle} context="stance" />
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="border-t border-zinc-800/50 mt-16">
        <div className="max-w-5xl mx-auto px-4 py-6 flex items-center justify-between text-xs text-zinc-600">
          <span>Stance by RageCheck</span>
          <div className="flex gap-4">
            <Link href="/stance/about" className="hover:text-zinc-400 transition-colors">Methodology</Link>
            <Link href="/" className="hover:text-zinc-400 transition-colors">RageCheck</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ---- Sub-components ----

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4 mx-auto" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}

function PostureBadge({ posture }: { posture: string }) {
  const meta = POSTURE_META[posture as Posture];
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border" style={{ borderColor: meta?.color || "#8b5cf6", backgroundColor: `${meta?.color || "#8b5cf6"}15` }}>
      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: meta?.color || "#8b5cf6" }} />
      <span className="text-sm font-bold" style={{ color: meta?.color || "#8b5cf6" }}>{meta?.label || posture}</span>
    </div>
  );
}

function Section({ title, badge, children }: { title: string; badge?: string; children: React.ReactNode }) {
  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 space-y-4">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-wider">{title}</h3>
        {badge && <span className="text-[10px] text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded">{badge}</span>}
      </div>
      {children}
    </div>
  );
}

function EffectGauge({ label, value }: { label: string; value: number }) {
  const color = value <= 30 ? "#22c55e" : value <= 60 ? "#f59e0b" : "#ef4444";
  return (
    <div className="bg-zinc-800/50 rounded-lg p-3 text-center">
      <div className="relative w-14 h-14 mx-auto mb-2">
        <svg className="w-14 h-14 transform -rotate-90" viewBox="0 0 56 56">
          <circle cx="28" cy="28" r="24" fill="none" stroke="#27272a" strokeWidth="4" />
          <circle cx="28" cy="28" r="24" fill="none" stroke={color} strokeWidth="4" strokeLinecap="round"
            strokeDasharray={`${(value / 100) * 150.8} 150.8`} />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-xs font-bold" style={{ color }}>{value}</span>
      </div>
      <p className="text-[10px] text-zinc-500 uppercase tracking-wider">{label}</p>
    </div>
  );
}
