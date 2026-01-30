import Link from "next/link";

export default function SideLinesAbout() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      {/* Navigation */}
      <nav className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/sidelines" className="flex items-center gap-2">
            <div className="w-5 h-5 bg-emerald-600 dark:bg-emerald-500 rounded-sm" />
            <span className="font-bold text-lg tracking-tight">SideLines</span>
          </Link>
          <div className="flex gap-4 text-sm font-medium text-zinc-500">
            <Link href="/sidelines/methodology" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">Methodology</Link>
            <Link href="/sidelines/about" className="text-zinc-900 dark:text-zinc-100">About</Link>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-12 md:py-20">
        <h1 className="text-4xl font-bold tracking-tight mb-4">About SideLines</h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-12">
          Measuring the sporting dynamics of political discourse.
        </p>

        {/* What it is */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">What SideLines Is</h2>
          <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4">
            SideLines is a research tool that applies social network analysis to political discourse
            events on Bluesky. It constructs event-bounded interaction subgraphs and measures
            structural properties of how communities form, interact, and evolve during political
            events.
          </p>
          <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4">
            Think of it like sports analytics for political discourse: tracking how teams form,
            how they interact across boundaries, and whether the moderating middle ground is
            holding or eroding.
          </p>
          <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
            The core metrics—Base Activation, Cross-Cluster Contact, Bridge Churn, and Middle
            Attrition—are structural proxies derived from graph theory and community detection,
            combined with lexicon-based arousal scoring.
          </p>
        </section>

        {/* What it measures */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">What It Measures</h2>
          <div className="space-y-4">
            <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
              <h3 className="font-bold text-lg mb-2">Interaction Patterns</h3>
              <p className="text-zinc-600 dark:text-zinc-400">
                Who replies to whom, who quotes whom, how tightly-knit communities are, and how
                much cross-community communication occurs. These are observable structural
                properties of the social graph.
              </p>
            </div>

            <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
              <h3 className="font-bold text-lg mb-2">Emotional Arousal</h3>
              <p className="text-zinc-600 dark:text-zinc-400">
                Lexicon-based scoring that detects anger, fear, urgency, moral judgment, and
                other markers of high-arousal language. This is a text-surface signal, not a
                measure of the author&apos;s actual emotional state.
              </p>
            </div>

            <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
              <h3 className="font-bold text-lg mb-2">Bridge Dynamics</h3>
              <p className="text-zinc-600 dark:text-zinc-400">
                Users who connect different communities (high betweenness centrality) while
                maintaining moderate arousal. When these bridge nodes disappear, it can indicate
                that the middle ground in a discourse is collapsing.
              </p>
            </div>
          </div>
        </section>

        {/* What it does NOT measure */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">What SideLines Is Not</h2>
          <div className="space-y-4">
            <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
              <h3 className="font-bold text-lg mb-2">Not a Persuasion Detector</h3>
              <p className="text-zinc-600 dark:text-zinc-400">
                SideLines does not measure whether anyone is being persuaded or radicalized.
                Community detection groups users by interaction patterns, not ideology. High
                arousal text may or may not be persuasive.
              </p>
            </div>

            <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
              <h3 className="font-bold text-lg mb-2">Not Political Classification</h3>
              <p className="text-zinc-600 dark:text-zinc-400">
                Leiden clustering detects communities by interaction density, not political
                alignment. A cluster may contain people with diverse views who happen to interact
                frequently.
              </p>
            </div>

            <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
              <h3 className="font-bold text-lg mb-2">Not Predictive</h3>
              <p className="text-zinc-600 dark:text-zinc-400">
                These metrics describe what happened in the interaction graph. They don&apos;t predict
                future behavior, elections, or real-world outcomes.
              </p>
            </div>
          </div>
        </section>

        {/* Connection to RageCheck */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Part of RageCheck</h2>
          <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4">
            SideLines is a subapp within the RageCheck project. While the main RageCheck analyzer
            scores individual texts for manipulation patterns, and ClearView synthesizes news
            across the political spectrum, SideLines focuses on the structural dynamics of how
            political communities interact on social platforms.
          </p>
          <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
            The arousal scoring reuses RageCheck&apos;s curated lexicons for consistency across tools.
          </p>
        </section>

        {/* Back link */}
        <div className="pt-8 border-t border-zinc-200 dark:border-zinc-800">
          <Link
            href="/sidelines"
            className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium"
          >
            ← Back to SideLines
          </Link>
        </div>
      </div>
    </div>
  );
}
