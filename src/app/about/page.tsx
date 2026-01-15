import Link from "next/link";

export default function About() {
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
            <Link href="/methodology" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">Methodology</Link>
            <Link href="/about" className="text-zinc-900 dark:text-zinc-100">About</Link>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-12 md:py-20">
        <h1 className="text-4xl font-bold tracking-tight mb-4">About RageCheck</h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-12">
          A tool for understanding manipulative framing in media.
        </p>

        {/* What it is */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">What RageCheck Is</h2>
          <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4">
            RageCheck is a free tool that analyzes online content for linguistic patterns commonly
            associated with manipulative framing—the kind of language designed to provoke emotional
            reactions rather than inform.
          </p>
          <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4">
            Modern social platforms reward engagement, and outrage generates more engagement than
            nuance. This creates incentives for content creators to frame information in emotionally
            provocative ways, regardless of whether that framing is accurate or fair.
          </p>
          <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
            RageCheck helps you see these patterns so you can make more informed decisions about
            what to believe, share, and engage with.
          </p>
        </section>

        {/* What it is NOT */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">What RageCheck Is Not</h2>
          <div className="space-y-4">
            <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
              <h3 className="font-bold text-lg mb-2">Not a Fact Checker</h3>
              <p className="text-zinc-600 dark:text-zinc-400">
                RageCheck does not verify claims or assess accuracy. A high score means content uses
                manipulative framing—it doesn't mean the underlying claims are false. Conversely,
                a low score doesn't mean content is true.
              </p>
            </div>

            <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
              <h3 className="font-bold text-lg mb-2">Not a Political Bias Detector</h3>
              <p className="text-zinc-600 dark:text-zinc-400">
                Manipulative framing exists across the political spectrum. RageCheck analyzes
                linguistic patterns regardless of political orientation. Content from any viewpoint
                can score high or low depending on how it's framed.
              </p>
            </div>

            <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
              <h3 className="font-bold text-lg mb-2">Not an Arbiter of Truth</h3>
              <p className="text-zinc-600 dark:text-zinc-400">
                RageCheck is a tool, not an authority. Use it as one input among many when evaluating
                content. Your own judgment, multiple sources, and critical thinking remain essential.
              </p>
            </div>
          </div>
        </section>

        {/* Why this exists */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Why This Exists</h2>
          <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4">
            The attention economy has created perverse incentives. Content that makes you angry,
            afraid, or tribal performs better algorithmically than content that informs or nuances.
            This isn't a conspiracy—it's basic economics. Outrage is engaging, and engagement is
            monetizable.
          </p>
          <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4">
            The result is an information environment where even accurate information often comes
            wrapped in manipulative framing. We're all being nudged toward emotional reactions
            rather than thoughtful responses.
          </p>
          <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
            RageCheck exists to make these patterns visible. When you can see the manipulation,
            you can choose how to respond to it rather than being unconsciously driven by it.
          </p>
        </section>

        {/* How to use it */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">How to Use It</h2>
          <ol className="list-decimal list-inside text-zinc-600 dark:text-zinc-400 space-y-3 ml-4">
            <li>
              <strong>Paste a URL</strong> — Works with articles, social media posts (Twitter/X,
              Bluesky, Threads, Farcaster), and most web content.
            </li>
            <li>
              <strong>Review the score</strong> — Higher scores indicate more manipulative framing.
              Check which signal categories are most prominent.
            </li>
            <li>
              <strong>Read the highlights</strong> — See exactly which phrases triggered detection.
              Click signal categories to filter.
            </li>
            <li>
              <strong>Consider the context</strong> — AI analysis (when available) provides nuance
              about whether flagged language is manipulative in context.
            </li>
            <li>
              <strong>Decide for yourself</strong> — Use this information as one factor in how you
              engage with and share content.
            </li>
          </ol>
        </section>

        {/* Privacy */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Privacy</h2>
          <ul className="list-disc list-inside text-zinc-600 dark:text-zinc-400 space-y-2 ml-4">
            <li>We log analyzed URLs and scores for aggregate analytics (no personal data)</li>
            <li>We don't track individual users or create profiles</li>
            <li>We don't sell data to third parties</li>
            <li>Content is fetched server-side—your IP isn't exposed to analyzed sites</li>
            <li>AI analysis uses Claude by Anthropic; content is processed per their privacy policy</li>
          </ul>
        </section>

        {/* Open source */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Open Source</h2>
          <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4">
            RageCheck is open source. You can inspect the code, see exactly how detection works,
            and suggest improvements.
          </p>
          <a
            href="https://github.com/aagoldberg/ragecheck"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
            </svg>
            View on GitHub
          </a>
        </section>

        {/* Contact */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Feedback</h2>
          <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Found a bug? Have a suggestion? Open an issue on GitHub or reach out via the repository.
            We're especially interested in false positives/negatives and edge cases that could
            improve detection accuracy.
          </p>
        </section>

        {/* Support */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Support</h2>
          <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4">
            RageCheck is free and ad-free. If you find it useful, consider supporting its development.
          </p>
          <a
            href="https://buy.stripe.com/4gM8wQ8Xq8xU8gw9HvgEg00"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            Support RageCheck
          </a>
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
