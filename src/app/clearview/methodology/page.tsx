import Link from "next/link";

export default function ClearviewMethodology() {
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
            <Link href="/clearview/methodology" className="text-zinc-900 dark:text-zinc-100">Methodology</Link>
            <Link href="/clearview/about" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">About</Link>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-12 md:py-20">
        <h1 className="text-4xl font-bold tracking-tight mb-4">Methodology</h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-12">
          How ClearView synthesizes news from across the political spectrum.
        </p>

        {/* Pipeline Overview */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Analysis Pipeline</h2>
          <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed mb-6">
            ClearView processes news through a multi-stage pipeline that runs several times daily:
          </p>

          <div className="space-y-4">
            <div className="flex gap-4 items-start">
              <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-sm flex-shrink-0">1</div>
              <div>
                <h3 className="font-bold text-lg mb-1">Source Collection</h3>
                <p className="text-zinc-600 dark:text-zinc-400">
                  We monitor 50+ news outlets across the political spectrum, from mainstream to
                  independent, US and international.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-sm flex-shrink-0">2</div>
              <div>
                <h3 className="font-bold text-lg mb-1">Story Clustering</h3>
                <p className="text-zinc-600 dark:text-zinc-400">
                  AI identifies when multiple outlets are covering the same underlying story,
                  grouping related articles regardless of headline framing.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-sm flex-shrink-0">3</div>
              <div>
                <h3 className="font-bold text-lg mb-1">Fact Extraction</h3>
                <p className="text-zinc-600 dark:text-zinc-400">
                  We extract the core factual claims—what happened, when, where, who was involved—
                  separating verifiable facts from interpretation and opinion.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-sm flex-shrink-0">4</div>
              <div>
                <h3 className="font-bold text-lg mb-1">Framing Analysis</h3>
                <p className="text-zinc-600 dark:text-zinc-400">
                  For each source, we analyze the editorial framing: what's emphasized, what's
                  omitted, what language is used, and what manipulation techniques appear.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-sm flex-shrink-0">5</div>
              <div>
                <h3 className="font-bold text-lg mb-1">Perspective Synthesis</h3>
                <p className="text-zinc-600 dark:text-zinc-400">
                  We distill the dominant left and right perspectives, identifying common ground
                  and genuine points of disagreement.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-sm flex-shrink-0">6</div>
              <div>
                <h3 className="font-bold text-lg mb-1">Expert Consensus Check</h3>
                <p className="text-zinc-600 dark:text-zinc-400">
                  When relevant, we identify whether expert communities (scientific, legal, economic)
                  have established consensus, and note any significant dissent.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Source Classification */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Source Classification</h2>
          <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed mb-6">
            We classify sources along a five-point political lean spectrum:
          </p>

          <div className="grid grid-cols-5 gap-2 mb-6">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-800 rounded-lg text-center">
              <div className="text-xs font-bold text-blue-700 dark:text-blue-300">Far Left</div>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-center">
              <div className="text-xs font-bold text-blue-600 dark:text-blue-400">Left</div>
            </div>
            <div className="p-3 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-center">
              <div className="text-xs font-bold text-zinc-600 dark:text-zinc-400">Center</div>
            </div>
            <div className="p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-lg text-center">
              <div className="text-xs font-bold text-rose-600 dark:text-rose-400">Right</div>
            </div>
            <div className="p-3 bg-rose-100 dark:bg-rose-900/40 border border-rose-200 dark:border-rose-800 rounded-lg text-center">
              <div className="text-xs font-bold text-rose-700 dark:text-rose-300">Far Right</div>
            </div>
          </div>

          <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4">
            Classifications are based on:
          </p>
          <ul className="list-disc list-inside text-zinc-600 dark:text-zinc-400 space-y-1 ml-4">
            <li>Editorial stance and opinion coverage</li>
            <li>Story selection and emphasis patterns</li>
            <li>Language and framing tendencies</li>
            <li>Third-party media bias ratings (AllSides, Ad Fontes Media, MBFC)</li>
          </ul>
        </section>

        {/* Debate Classification */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Debate Type Classification</h2>
          <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed mb-6">
            We categorize disagreements to help you understand what's actually being disputed:
          </p>

          <div className="space-y-4">
            <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
              <h3 className="font-bold text-lg mb-2 text-emerald-600 dark:text-emerald-400">Factual Debates</h3>
              <p className="text-zinc-600 dark:text-zinc-400">
                Disagreements about what actually happened or what is true. These can often be
                resolved with evidence.
              </p>
              <p className="text-sm text-zinc-500 mt-2">
                <strong>Example:</strong> "Did X politician say Y?" — verifiable via transcript
              </p>
            </div>

            <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
              <h3 className="font-bold text-lg mb-2 text-blue-600 dark:text-blue-400">Policy Debates</h3>
              <p className="text-zinc-600 dark:text-zinc-400">
                Disagreements about what should be done. These involve trade-offs and priorities,
                not just facts.
              </p>
              <p className="text-sm text-zinc-500 mt-2">
                <strong>Example:</strong> "Should we raise the minimum wage?" — depends on values and priorities
              </p>
            </div>

            <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
              <h3 className="font-bold text-lg mb-2 text-purple-600 dark:text-purple-400">Values Debates</h3>
              <p className="text-zinc-600 dark:text-zinc-400">
                Fundamental disagreements about what matters or what's right. These reflect
                different moral frameworks.
              </p>
              <p className="text-sm text-zinc-500 mt-2">
                <strong>Example:</strong> "Is individual liberty or collective welfare more important?"
              </p>
            </div>

            <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
              <h3 className="font-bold text-lg mb-2 text-amber-600 dark:text-amber-400">Mixed Debates</h3>
              <p className="text-zinc-600 dark:text-zinc-400">
                Most real-world debates combine factual, policy, and values disagreements.
                We try to separate these threads.
              </p>
            </div>
          </div>
        </section>

        {/* Evidence Status */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Evidence Status Ratings</h2>
          <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed mb-6">
            For factual disputes, we assess the evidence status:
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg text-center">
              <div className="text-sm font-bold text-emerald-700 dark:text-emerald-400 mb-1">Supported</div>
              <p className="text-xs text-emerald-600 dark:text-emerald-400">Strong evidence confirms this claim</p>
            </div>
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-center">
              <div className="text-sm font-bold text-amber-700 dark:text-amber-400 mb-1">Mixed</div>
              <p className="text-xs text-amber-600 dark:text-amber-400">Evidence is inconclusive or conflicting</p>
            </div>
            <div className="p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-lg text-center">
              <div className="text-sm font-bold text-rose-700 dark:text-rose-400 mb-1">Unsupported</div>
              <p className="text-xs text-rose-600 dark:text-rose-400">No credible evidence supports this</p>
            </div>
            <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg text-center">
              <div className="text-sm font-bold text-orange-700 dark:text-orange-400 mb-1">Misleading</div>
              <p className="text-xs text-orange-600 dark:text-orange-400">Technically true but deceptive in context</p>
            </div>
          </div>
        </section>

        {/* Expert Consensus */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Expert Consensus Framework</h2>
          <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4">
            When a story touches on areas with established expertise, we identify relevant consensus:
          </p>
          <ul className="list-disc list-inside text-zinc-600 dark:text-zinc-400 space-y-2 ml-4">
            <li><strong>Scientific</strong> — Peer-reviewed research, major scientific bodies</li>
            <li><strong>Legal</strong> — Court rulings, legal scholarship, bar associations</li>
            <li><strong>Economic</strong> — Central banks, major economic institutions, academic economists</li>
            <li><strong>Intelligence</strong> — Intelligence community assessments</li>
            <li><strong>Historical</strong> — Established historical scholarship</li>
            <li><strong>Statistical</strong> — Official statistics, major data sources</li>
            <li><strong>International</strong> — UN bodies, international organizations</li>
          </ul>
          <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed mt-4">
            We note confidence levels (high, moderate, low, contested) and significant dissent
            when it exists.
          </p>
        </section>

        {/* Limitations */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Limitations</h2>
          <ul className="list-disc list-inside text-zinc-600 dark:text-zinc-400 space-y-2 ml-4">
            <li>Source bias ratings are approximations and may not capture nuance</li>
            <li>AI analysis can miss context or misinterpret complex situations</li>
            <li>We can't cover every story—selection itself involves editorial judgment</li>
            <li>Breaking news may be incomplete; we update as information develops</li>
            <li>Expert consensus can change as new evidence emerges</li>
            <li>Non-English sources are underrepresented</li>
            <li>Some manipulation is too subtle for automated detection</li>
          </ul>
        </section>

        {/* Technology */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Technology Stack</h2>
          <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4">
            ClearView is built on:
          </p>
          <ul className="list-disc list-inside text-zinc-600 dark:text-zinc-400 space-y-2 ml-4">
            <li><strong>Claude AI</strong> — For text analysis, clustering, and synthesis</li>
            <li><strong>RageCheck Engine</strong> — For manipulation pattern detection</li>
            <li><strong>RSS/API Feeds</strong> — For real-time source monitoring</li>
            <li><strong>Custom Classifiers</strong> — For source bias and story categorization</li>
          </ul>
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
