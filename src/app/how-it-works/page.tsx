import { Metadata } from "next";

export const metadata: Metadata = {
  title: "How It Works | RageCheck",
  description: "Understanding persuasive language patterns — without the moralizing.",
};

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <nav className="sticky top-0 z-50 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            RageCheck
          </a>
          <div className="flex items-center gap-6 text-sm text-zinc-600 dark:text-zinc-400">
            <a href="/methodology" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">Methodology</a>
            <a href="/about" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">About</a>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-12 sm:py-20">
        <article className="prose prose-zinc dark:prose-invert max-w-none">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-4">
            Why emotionally charged language works — even when we agree with it
          </h1>
          <p className="text-xl text-zinc-600 dark:text-zinc-400 mb-12">
            The mechanics of persuasion, without the moralizing.
          </p>

          <section className="mb-12">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
              1. Arousal isn't bias — it's attention
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
              High-arousal language (urgency, threat, moral weight) captures attention faster than neutral phrasing.
              This isn't manipulation by itself — it's how language competes for limited cognitive bandwidth.
              The question isn't "is this emotional?" but "is the emotional intensity proportional to the claim?"
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
              2. Pattern recognition, not mind-reading
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
              RageCheck identifies language <em>structures</em> — not intent. We don't know if a writer is trying to mislead you.
              We can observe that certain patterns (us-vs-them framing, implied moral stakes, call-to-action pressure)
              tend to bypass deliberation and trigger reactive sharing.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
              3. You can agree with something and still notice the technique
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
              The most effective persuasion often targets people who already lean a certain direction.
              Recognizing high-arousal framing doesn't mean the underlying point is wrong — it means the
              delivery was optimized for engagement over nuance.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
              4. What we measure
            </h2>
            <ul className="space-y-3 text-zinc-600 dark:text-zinc-400">
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-2 flex-shrink-0"></span>
                <span><strong className="text-zinc-900 dark:text-zinc-100">Arousal intensity:</strong> How emotionally charged is the language?</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-2 flex-shrink-0"></span>
                <span><strong className="text-zinc-900 dark:text-zinc-100">Framing patterns:</strong> Us-vs-them, moral condemnation, urgency cues</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-2 flex-shrink-0"></span>
                <span><strong className="text-zinc-900 dark:text-zinc-100">Simplification signals:</strong> Black-and-white framing, missing context cues</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-2 flex-shrink-0"></span>
                <span><strong className="text-zinc-900 dark:text-zinc-100">Engagement triggers:</strong> Language designed to provoke shares, reactions</span>
              </li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
              5. What we don't do
            </h2>
            <ul className="space-y-3 text-zinc-600 dark:text-zinc-400">
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full mt-2 flex-shrink-0"></span>
                <span>Fact-check claims</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full mt-2 flex-shrink-0"></span>
                <span>Label sources as trustworthy or not</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full mt-2 flex-shrink-0"></span>
                <span>Assign political bias scores</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full mt-2 flex-shrink-0"></span>
                <span>Tell you what to believe</span>
              </li>
            </ul>
          </section>

          <div className="mt-16 p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 text-center">
            <p className="text-zinc-600 dark:text-zinc-400 mb-4">
              Ready to try it?
            </p>
            <a
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl font-medium text-sm hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all"
            >
              Analyze a post
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        </article>
      </main>

      <footer className="border-t border-zinc-200 dark:border-zinc-800 py-6 mt-auto">
        <div className="max-w-2xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-zinc-500 dark:text-zinc-400">
          <a href="/about" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">About</a>
          <span className="hidden sm:inline">·</span>
          <a href="/methodology" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">Methodology</a>
          <span className="hidden sm:inline">·</span>
          <a href="/how-it-works" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">How It Works</a>
        </div>
      </footer>
    </div>
  );
}
