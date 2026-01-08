import Link from "next/link";

export default function Methodology() {
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
            <Link href="/methodology" className="text-zinc-900 dark:text-zinc-100">Methodology</Link>
            <Link href="/about" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">About</Link>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-12 md:py-20">
        <h1 className="text-4xl font-bold tracking-tight mb-4">Methodology</h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-12">
          How RageCheck detects manipulative patterns in content.
        </p>

        {/* Overview */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Overview</h2>
          <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4">
            RageCheck uses a two-stage analysis pipeline: rule-based pattern detection followed by
            optional AI-powered contextual analysis. This hybrid approach balances speed, transparency,
            and accuracy.
          </p>
          <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
            The system analyzes text for linguistic patterns commonly associated with manipulative
            framing—language designed to provoke emotional reactions rather than inform. It does not
            assess factual accuracy or political bias.
          </p>
        </section>

        {/* Signal Categories */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Signal Categories</h2>
          <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed mb-6">
            Content is analyzed across five distinct signal categories, each targeting specific
            manipulation patterns:
          </p>

          <div className="space-y-6">
            <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
              <h3 className="font-bold text-lg mb-2 text-rose-600 dark:text-rose-400">Loaded Language</h3>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed mb-3">
                Emotionally charged words designed to provoke reactions rather than convey information.
              </p>
              <p className="text-sm text-zinc-500">
                <strong>Examples:</strong> Dehumanizing terms, inflammatory adjectives, insults disguised
                as descriptors, words that presuppose guilt or malice.
              </p>
            </div>

            <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
              <h3 className="font-bold text-lg mb-2 text-indigo-600 dark:text-indigo-400">Absolutist Phrasing</h3>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed mb-3">
                Black-and-white language that eliminates nuance and complexity.
              </p>
              <p className="text-sm text-zinc-500">
                <strong>Examples:</strong> "Always," "never," "everyone knows," "no one can deny,"
                "the only way," "completely," "totally."
              </p>
            </div>

            <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
              <h3 className="font-bold text-lg mb-2 text-orange-600 dark:text-orange-400">Threat & Panic</h3>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed mb-3">
                Fear-mongering language that emphasizes danger, catastrophe, or existential threats.
              </p>
              <p className="text-sm text-zinc-500">
                <strong>Examples:</strong> "Dangerous," "threat," "crisis," "catastrophe," "destroy,"
                "end of," "collapse," urgent calls to action based on fear.
              </p>
            </div>

            <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
              <h3 className="font-bold text-lg mb-2 text-blue-600 dark:text-blue-400">Us-vs-Them Framing</h3>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed mb-3">
                Tribal language that creates artificial divisions between groups.
              </p>
              <p className="text-sm text-zinc-500">
                <strong>Examples:</strong> "They want to," "those people," "the elite," "real Americans,"
                "our side," "the enemy," collective blame attribution.
              </p>
            </div>

            <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
              <h3 className="font-bold text-lg mb-2 text-amber-600 dark:text-amber-400">Engagement Bait</h3>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed mb-3">
                Phrases designed to maximize clicks, shares, and emotional responses.
              </p>
              <p className="text-sm text-zinc-500">
                <strong>Examples:</strong> "You won't believe," "share this before," "what happens next,"
                "the truth about," "what they don't want you to know."
              </p>
            </div>
          </div>
        </section>

        {/* Scoring */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Scoring System</h2>

          <div className="space-y-6">
            <div>
              <h3 className="font-bold text-lg mb-2">Rule-Based Detection</h3>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed mb-3">
                The first stage uses pattern matching against curated dictionaries of manipulative
                phrases. Each category has weighted terms—stronger manipulative signals receive
                higher weights.
              </p>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Scores are normalized per 1,000 words to account for content length, ensuring
                short tweets and long articles are compared fairly.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-2">AI Enhancement</h3>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed mb-3">
                When available, Claude AI reviews the rule-based findings to add context. This
                stage can adjust scores based on factors rules can't capture:
              </p>
              <ul className="list-disc list-inside text-zinc-600 dark:text-zinc-400 space-y-1 ml-4">
                <li>Distinguishing quotes from original statements</li>
                <li>Recognizing academic or analytical discussion of extremism</li>
                <li>Identifying satire or irony</li>
                <li>Detecting manipulation tactics the rules missed</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-2">Score Interpretation</h3>
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg text-center">
                  <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">0-33</div>
                  <div className="text-sm text-emerald-700 dark:text-emerald-300 font-medium">Low</div>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">Minimal manipulation signals</p>
                </div>
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-center">
                  <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">34-66</div>
                  <div className="text-sm text-amber-700 dark:text-amber-300 font-medium">Medium</div>
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">Some concerning patterns</p>
                </div>
                <div className="p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-lg text-center">
                  <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">67-100</div>
                  <div className="text-sm text-rose-700 dark:text-rose-300 font-medium">High</div>
                  <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">Significant manipulation density</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Limitations */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Limitations</h2>
          <ul className="list-disc list-inside text-zinc-600 dark:text-zinc-400 space-y-2 ml-4">
            <li>Pattern detection is not perfect—false positives and negatives occur</li>
            <li>Context matters: the same words can be manipulative or neutral depending on usage</li>
            <li>Non-English content is not well supported</li>
            <li>Very short content (under ~50 words) may produce unreliable scores</li>
            <li>Sophisticated manipulation that avoids common patterns may score low</li>
            <li>A high score does not mean content is false—just that it uses manipulative framing</li>
          </ul>
        </section>

        {/* Back link */}
        <div className="pt-8 border-t border-zinc-200 dark:border-zinc-800">
          <Link
            href="/"
            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium"
          >
            ← Back to RageCheck
          </Link>
        </div>
      </div>
    </div>
  );
}
