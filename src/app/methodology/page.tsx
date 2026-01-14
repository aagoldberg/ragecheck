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
        <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-4">
          How RageCheck detects manipulative patterns in content.
        </p>
        <p className="text-sm text-zinc-500 dark:text-zinc-500 mb-12">
          If you're seeing the "Techniques Detected," "Viral Triggers," or "How This Usually Plays Out" sections in a report, this page explains the model behind them.
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
            framing—language optimized to provoke high-arousal reactions over understanding. It does not
            assess factual accuracy or political bias.
          </p>
        </section>

        {/* Why this breakdown */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Why This Breakdown</h2>
          <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4">
            RageCheck organizes analysis the same way influence typically works in the real world:
          </p>
          <ol className="list-decimal list-inside text-zinc-600 dark:text-zinc-400 space-y-2 ml-4 mb-6">
            <li><strong>How content is constructed</strong> — tone, framing, rhetoric</li>
            <li><strong>Why it spreads</strong> — share mechanics, identity signaling, conflict cues</li>
            <li><strong>How it tends to affect people</strong> — likely emotional intensity and discussion style</li>
          </ol>

          <div className="p-4 bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg mb-6">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              <strong>Note:</strong> This is probabilistic pattern detection. It does not infer intent and it is not truth scoring. It estimates patterns that tend to correlate with higher-arousal, lower-nuance media.
            </p>
          </div>

          <h3 className="font-bold text-lg mb-3">How the UI Sections Map to Signals</h3>
          <div className="space-y-3">
            <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 sm:min-w-[180px]">Techniques Detected</span>
                <span className="text-zinc-400 hidden sm:inline">→</span>
                <span className="text-sm text-zinc-600 dark:text-zinc-400"><strong>Construction:</strong> Emotional Heat, Moral Outrage, Black & White Thinking</span>
              </div>
            </div>
            <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 sm:min-w-[180px]">Viral Triggers</span>
                <span className="text-zinc-400 hidden sm:inline">→</span>
                <span className="text-sm text-zinc-600 dark:text-zinc-400"><strong>Transmission:</strong> Fight-Picking, Us vs Them</span>
              </div>
            </div>
            <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 sm:min-w-[180px]">How This Usually Plays Out</span>
                <span className="text-zinc-400 hidden sm:inline">→</span>
                <span className="text-sm text-zinc-600 dark:text-zinc-400"><strong>Impact:</strong> Combined signal read predicting likely reaction patterns</span>
              </div>
            </div>
          </div>
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
              <h3 className="font-bold text-lg mb-2 text-rose-600 dark:text-rose-400">Emotional Heat</h3>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed mb-3">
                Language designed to activate strong emotional responses—fear, anger, disgust, or outrage—rather than inform.
              </p>
              <p className="text-sm text-zinc-500">
                <strong>Examples:</strong> "Shocking," "horrifying," "unbelievable," "disgusting," inflammatory
                adjectives, ALL CAPS emphasis, excessive punctuation, urgent calls to action.
              </p>
            </div>

            <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
              <h3 className="font-bold text-lg mb-2 text-indigo-600 dark:text-indigo-400">Us vs Them</h3>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed mb-3">
                Framing that constructs an adversary—dehumanizing groups, attributing malicious intent,
                or creating artificial us-vs-them divisions.
              </p>
              <p className="text-sm text-zinc-500">
                <strong>Examples:</strong> "They want to destroy," "the elite," "those people," "the enemy within,"
                collective blame, conspiracy framing, dehumanizing labels.
              </p>
            </div>

            <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
              <h3 className="font-bold text-lg mb-2 text-orange-600 dark:text-orange-400">Moral Outrage</h3>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed mb-3">
                Appeals to moral outrage, purity rhetoric, and righteous indignation that frame issues
                as battles between good and evil.
              </p>
              <p className="text-sm text-zinc-500">
                <strong>Examples:</strong> "Evil," "immoral," "corruption," "betrayal," "disgusting behavior,"
                virtue signaling, moral absolutism, purity tests.
              </p>
            </div>

            <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
              <h3 className="font-bold text-lg mb-2 text-blue-600 dark:text-blue-400">Black & White Thinking</h3>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed mb-3">
                Black-and-white framing that eliminates nuance, presents false dichotomies, or reduces
                complex issues to simple narratives.
              </p>
              <p className="text-sm text-zinc-500">
                <strong>Examples:</strong> "Always," "never," "everyone knows," "the only solution,"
                "it's simple," false equivalences, strawman arguments, ignoring counterevidence.
              </p>
            </div>

            <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
              <h3 className="font-bold text-lg mb-2 text-amber-600 dark:text-amber-400">Fight-Picking</h3>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed mb-3">
                Direct provocations, engagement bait, and language designed to mobilize action or
                spread content virally.
              </p>
              <p className="text-sm text-zinc-500">
                <strong>Examples:</strong> "Share before they delete this," "wake up," "fight back,"
                "they don't want you to know," rhetorical questions designed to provoke, call-outs.
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

        {/* Image Analysis */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Image & Screenshot Analysis</h2>
          <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4">
            RageCheck can analyze screenshots of social media posts, memes with text, and news headlines
            using computer vision.
          </p>
          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-lg mb-2">How It Works</h3>
              <ol className="list-decimal list-inside text-zinc-600 dark:text-zinc-400 space-y-1 ml-4">
                <li>Upload an image (screenshot, meme, or photo of text content)</li>
                <li>Vision AI extracts all visible text from the image</li>
                <li>The platform is identified (Twitter, Facebook, Instagram, Reddit, etc.)</li>
                <li>Extracted text is analyzed using the same 5-signal framework</li>
                <li>For memes, the AI considers how image and text work together</li>
              </ol>
            </div>
            <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
              This allows analysis of content that can't be linked directly—screenshots shared in
              group chats, posts from private accounts, or memes circulating on social media.
            </p>
          </div>
        </section>

        {/* Academic Foundation */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Academic Foundation</h2>
          <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4">
            RageCheck's signal categories draw from established research in media psychology,
            propaganda studies, and affective computing:
          </p>
          <ul className="list-disc list-inside text-zinc-600 dark:text-zinc-400 space-y-2 ml-4">
            <li><strong>Emotional Heat</strong> — Based on dimensional models of emotion (Russell, 1980) and research on emotional contagion in social media (Kramer et al., 2014)</li>
            <li><strong>Us vs Them</strong> — Draws from intergroup conflict theory (Tajfel & Turner, 1979) and research on dehumanization (Haslam, 2006)</li>
            <li><strong>Moral Outrage</strong> — Informed by moral foundations theory (Haidt & Graham, 2007) and research on moral outrage online (Crockett, 2017)</li>
            <li><strong>Black & White Thinking</strong> — Based on research on cognitive biases and the appeal of simple narratives (Kahneman, 2011)</li>
            <li><strong>Fight-Picking</strong> — Draws from propaganda analysis frameworks (Ellul, 1965) and research on viral content dynamics (Berger & Milkman, 2012)</li>
          </ul>
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
            <li>Satire and irony may be misinterpreted (though AI enhancement helps)</li>
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
