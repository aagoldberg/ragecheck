"use client";

import Link from "next/link";
import { CATEGORY_META, DefenseCategory } from "@/lib/defensecheck/types";

const categories = Object.values(DefenseCategory);

export default function DefenseCheckAboutPage() {
  return (
    <div className="min-h-screen bg-[#0c0c12] text-zinc-100">
      {/* Header */}
      <header className="border-b border-zinc-800/50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <Link href="/defensecheck" className="text-lg font-bold tracking-wide">
              <span className="text-teal-400">Defense</span>Check
            </Link>
          </div>
          <nav className="flex items-center gap-4 text-xs text-zinc-500">
            <Link href="/defensecheck" className="hover:text-zinc-300 transition-colors">
              Analyzer
            </Link>
            <Link href="/" className="hover:text-zinc-300 transition-colors">
              RageCheck
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-12 space-y-12">
        {/* Title */}
        <div className="space-y-4">
          <h1 className="text-3xl font-bold tracking-tight">
            About DefenseCheck
          </h1>
          <p className="text-zinc-400 leading-relaxed">
            DefenseCheck analyzes text for defensive rhetoric patterns — the
            communication strategies people use (often unconsciously) to avoid
            accountability, redirect conversations, or reframe situations.
          </p>
        </div>

        {/* What this tool is NOT */}
        <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-6 space-y-3">
          <h2 className="text-lg font-bold text-red-400">
            What This Tool is NOT
          </h2>
          <ul className="space-y-2 text-sm text-zinc-400">
            <li className="flex gap-2">
              <span className="text-red-400 mt-0.5">&#x2717;</span>
              <span>
                <strong className="text-zinc-300">Not therapy.</strong> This
                tool does not replace professional support. If you are in a
                harmful relationship, please reach out to a counselor or
                helpline.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-red-400 mt-0.5">&#x2717;</span>
              <span>
                <strong className="text-zinc-300">Not a lie detector.</strong>{" "}
                Defensive language does not mean someone is lying. People use
                these patterns for many reasons — stress, communication style,
                cultural context, or genuine disagreement.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-red-400 mt-0.5">&#x2717;</span>
              <span>
                <strong className="text-zinc-300">Not definitive.</strong>{" "}
                Results represent one plausible reading of the text. The same
                words can carry different weight depending on context we may not
                have.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-red-400 mt-0.5">&#x2717;</span>
              <span>
                <strong className="text-zinc-300">Not a weapon.</strong> This
                tool is designed for self-reflection and understanding
                communication patterns — not for &ldquo;proving&rdquo; someone
                is wrong.
              </span>
            </li>
          </ul>
        </div>

        {/* Methodology */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold">Methodology</h2>
          <p className="text-sm text-zinc-400 leading-relaxed">
            DefenseCheck uses Claude (by Anthropic) to analyze text for 8
            categories of defensive rhetoric. The AI identifies specific text
            excerpts as evidence, rates severity and confidence for each
            pattern, and provides an alternative charitable interpretation of
            every analysis.
          </p>

          <h3 className="text-lg font-semibold text-zinc-200 mt-8">
            The 8 Categories
          </h3>
          <div className="grid gap-4">
            {categories.map((cat) => {
              const meta = CATEGORY_META[cat];
              return (
                <div
                  key={cat}
                  className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 flex gap-4"
                >
                  <div
                    className="w-1 rounded-full flex-shrink-0"
                    style={{ backgroundColor: meta.color }}
                  />
                  <div className="space-y-1">
                    <h4
                      className="text-sm font-semibold"
                      style={{ color: meta.color }}
                    >
                      {meta.label}
                    </h4>
                    <p className="text-xs text-zinc-500">{meta.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Scoring */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold">How Scoring Works</h2>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Each detected pattern receives a <strong className="text-zinc-300">severity</strong> rating (0-10) and
            a <strong className="text-zinc-300">confidence</strong> rating (0-1). The composite score (0-100) is a
            weighted average of severity scores, weighted by confidence. This
            means patterns the AI is less certain about contribute less to the
            overall score.
          </p>
          <div className="grid gap-2 text-sm">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-teal-400" />
              <span className="text-zinc-400">
                <strong className="text-zinc-300">0–25:</strong> Minimal patterns
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-teal-500" />
              <span className="text-zinc-400">
                <strong className="text-zinc-300">26–50:</strong> Some patterns noted
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <span className="text-zinc-400">
                <strong className="text-zinc-300">51–75:</strong> Notable patterns
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-zinc-400">
                <strong className="text-zinc-300">76–100:</strong> Significant patterns
              </span>
            </div>
          </div>
          <p className="text-sm text-zinc-500 italic">
            Scores are capped at 85 when maximum confidence across all patterns
            is below 0.7 — preventing high scores on uncertain analyses.
          </p>
        </div>

        {/* Interpretive Framing */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Why &ldquo;One Plausible Reading&rdquo;?</h2>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Language is complex. The same sentence can be defensive rhetoric in
            one context and a reasonable response in another. We frame every
            result as &ldquo;one plausible reading&rdquo; because:
          </p>
          <ul className="space-y-2 text-sm text-zinc-400 ml-4 list-disc">
            <li>We only see the text, not the full relationship or conversation history</li>
            <li>Cultural and personal communication styles vary widely</li>
            <li>Defensive language can be appropriate in certain contexts (e.g., responding to actual unfairness)</li>
            <li>AI analysis has inherent limitations in understanding nuance and intent</li>
          </ul>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Every analysis includes an &ldquo;Alternative Reading&rdquo; card
            that offers a charitable interpretation of the same text. We believe
            both readings deserve consideration.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800/50 mt-16">
        <div className="max-w-3xl mx-auto px-4 py-6 flex items-center justify-between text-xs text-zinc-600">
          <span>DefenseCheck by RageCheck</span>
          <div className="flex gap-4">
            <Link href="/defensecheck" className="hover:text-zinc-400 transition-colors">
              Analyzer
            </Link>
            <Link href="/" className="hover:text-zinc-400 transition-colors">
              RageCheck
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
