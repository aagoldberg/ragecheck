import Link from "next/link";

export default function ClearviewAbout() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      {/* Navigation */}
      <nav className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/clearview" className="flex items-center gap-2">
            <div className="w-5 h-5 bg-zinc-900 dark:bg-zinc-100 rounded-sm" />
            <span className="font-bold text-lg tracking-tight">ClearView</span>
          </Link>
          <div className="flex gap-4 text-sm font-medium text-zinc-500">
            <Link href="/clearview/methodology" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">Methodology</Link>
            <Link href="/clearview/about" className="text-zinc-900 dark:text-zinc-100">About</Link>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-12 md:py-20">
        <h1 className="text-4xl font-bold tracking-tight mb-4">About ClearView</h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-12">
          Daily news intelligence that cuts through partisan framing.
        </p>

        {/* What it is */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">What ClearView Is</h2>
          <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4">
            ClearView is a daily briefing that synthesizes top news stories from across the political
            spectrum. Instead of reading one source and absorbing its framing, you get the core facts
            separated from the spin—along with a clear view of how different outlets are presenting
            the same events.
          </p>
          <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4">
            We analyze 50+ news sources daily, from far-left to far-right, mainstream to independent.
            Our AI clusters related coverage, extracts what actually happened, and reveals how each
            side frames the narrative.
          </p>
          <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
            The goal is simple: give you the information you need to form your own opinion, without
            being nudged by any particular outlet's editorial agenda.
          </p>
        </section>

        {/* The Problem */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">The Problem We're Solving</h2>
          <div className="space-y-4">
            <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
              <h3 className="font-bold text-lg mb-2">Filter Bubbles</h3>
              <p className="text-zinc-600 dark:text-zinc-400">
                Most people consume news from sources that confirm their existing views. Algorithms
                reinforce this by showing you more of what you already agree with. ClearView breaks
                the bubble by showing you how the same story looks across the spectrum.
              </p>
            </div>

            <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
              <h3 className="font-bold text-lg mb-2">Facts vs. Framing</h3>
              <p className="text-zinc-600 dark:text-zinc-400">
                Even factually accurate reporting can be manipulative through selective emphasis,
                loaded language, and strategic omission. ClearView separates what happened from
                how it's being presented.
              </p>
            </div>

            <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
              <h3 className="font-bold text-lg mb-2">Information Overload</h3>
              <p className="text-zinc-600 dark:text-zinc-400">
                There's too much news. ClearView distills the day's most significant stories into
                a concise briefing, so you can stay informed without drowning in content.
              </p>
            </div>
          </div>
        </section>

        {/* What We Provide */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">What Each Briefing Includes</h2>
          <ul className="list-disc list-inside text-zinc-600 dark:text-zinc-400 space-y-3 ml-4">
            <li>
              <strong>The Core Facts</strong> — What actually happened, stripped of editorial spin
            </li>
            <li>
              <strong>Left vs. Right Framing</strong> — How different sides are presenting and
              emphasizing the story
            </li>
            <li>
              <strong>Expert Consensus</strong> — When relevant, what experts and evidence actually
              say (scientific, legal, economic, etc.)
            </li>
            <li>
              <strong>Common Ground</strong> — Points that both sides agree on (often more than
              you'd expect)
            </li>
            <li>
              <strong>Factual Disputes</strong> — Claims that are contested, with evidence status
            </li>
            <li>
              <strong>Source Analysis</strong> — Individual source coverage with bias ratings and
              manipulation analysis via RageCheck
            </li>
          </ul>
        </section>

        {/* What We're NOT */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">What ClearView Is Not</h2>
          <div className="space-y-4">
            <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
              <h3 className="font-bold text-lg mb-2">Not "Neutral" in the False-Balance Sense</h3>
              <p className="text-zinc-600 dark:text-zinc-400">
                We don't pretend both sides are always equally valid. When evidence clearly supports
                one position, we say so. When experts have consensus, we show it. Balance doesn't
                mean treating lies and facts as equivalent.
              </p>
            </div>

            <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
              <h3 className="font-bold text-lg mb-2">Not a Replacement for Primary Sources</h3>
              <p className="text-zinc-600 dark:text-zinc-400">
                ClearView is a starting point, not an endpoint. We link to original sources so you
                can dig deeper. Use our analysis as a map, then explore the territory yourself.
              </p>
            </div>

            <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
              <h3 className="font-bold text-lg mb-2">Not Perfect</h3>
              <p className="text-zinc-600 dark:text-zinc-400">
                AI analysis can miss nuance, misclassify sources, or oversimplify complex issues.
                We're constantly improving. If you spot errors, let us know.
              </p>
            </div>
          </div>
        </section>

        {/* Connection to RageCheck */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Powered by RageCheck</h2>
          <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4">
            ClearView is part of the RageCheck project. While the main RageCheck tool analyzes
            individual articles for manipulation patterns, ClearView applies similar analysis
            at scale across the daily news cycle.
          </p>
          <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Every source in our briefings can be analyzed with RageCheck to see its manipulation
            score and specific techniques used.
          </p>
        </section>

        {/* Back link */}
        <div className="pt-8 border-t border-zinc-200 dark:border-zinc-800">
          <Link
            href="/clearview"
            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium"
          >
            ← Back to ClearView
          </Link>
        </div>
      </div>
    </div>
  );
}
