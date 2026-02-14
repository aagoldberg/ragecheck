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
                <h3 className="font-bold text-lg mb-1">Moral Foundations & Perspective Synthesis</h3>
                <p className="text-zinc-600 dark:text-zinc-400">
                  We identify the moral foundations (care, fairness, loyalty, authority, sanctity, liberty)
                  driving each perspective, then synthesize viewpoints organized by values rather than
                  political team. We identify shared values and common ground first, then genuine
                  points of disagreement.
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

        {/* Moral Foundations Theory */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Moral Foundations Analysis</h2>
          <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed mb-6">
            Rather than framing every disagreement as &ldquo;Left vs. Right,&rdquo; ClearView identifies the
            underlying <strong>moral foundations</strong> driving each perspective. This framework, developed by
            social psychologist Jonathan Haidt, helps explain <em>why</em> reasonable people disagree &mdash; they&apos;re
            prioritizing different values, not just picking different teams.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            <div className="p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl">
              <div className="text-lg mb-1">{"\u2665"}</div>
              <h3 className="font-bold text-rose-700 dark:text-rose-400 mb-1">Care</h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">Concern about harm to vulnerable people. Compassion, protection, nurturing.</p>
            </div>
            <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl">
              <div className="text-lg mb-1">{"\u2696"}</div>
              <h3 className="font-bold text-indigo-700 dark:text-indigo-400 mb-1">Fairness</h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">Concern about equality, proportionality, or justice. Rights, reciprocity.</p>
            </div>
            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl">
              <div className="text-lg mb-1">{"\u{1F91D}"}</div>
              <h3 className="font-bold text-purple-700 dark:text-purple-400 mb-1">Loyalty</h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">Concern about group bonds, patriotism, or betrayal. In-group solidarity.</p>
            </div>
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
              <div className="text-lg mb-1">{"\u{1F3DB}"}</div>
              <h3 className="font-bold text-amber-700 dark:text-amber-400 mb-1">Authority</h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">Concern about order, tradition, or legitimate institutions. Hierarchy, respect.</p>
            </div>
            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl">
              <div className="text-lg mb-1">{"\u2726"}</div>
              <h3 className="font-bold text-emerald-700 dark:text-emerald-400 mb-1">Sanctity</h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">Concern about purity, degradation, or sacred values. Moral cleanliness.</p>
            </div>
            <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl">
              <div className="text-lg mb-1">{"\u{1F5FD}"}</div>
              <h3 className="font-bold text-orange-700 dark:text-orange-400 mb-1">Liberty</h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">Concern about autonomy, oppression, or government overreach. Individual freedom.</p>
            </div>
          </div>

          <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Research shows that left-leaning perspectives tend to emphasize Care and Fairness, while
            right-leaning perspectives draw more evenly from all six foundations. Neither side is
            &ldquo;missing&rdquo; empathy &mdash; they&apos;re applying different moral palettes to the same situation.
          </p>
        </section>

        {/* Emotional Manipulation Taxonomy */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Emotional Manipulation Taxonomy</h2>
          <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed mb-6">
            Beyond anger and outrage, we detect a range of emotional manipulation techniques that
            research shows are more structurally dangerous to democratic discourse:
          </p>

          <div className="space-y-3">
            <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
              <h3 className="font-bold text-lg mb-1 text-rose-600 dark:text-rose-400">Contempt</h3>
              <p className="text-zinc-600 dark:text-zinc-400 text-sm">
                Sneering, mocking, treating opponents as beneath consideration. Anger says &ldquo;you&apos;re
                wrong&rdquo;; contempt says &ldquo;you&apos;re not worth engaging.&rdquo; Forecloses dialogue entirely.
              </p>
            </div>
            <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
              <h3 className="font-bold text-lg mb-1 text-amber-600 dark:text-amber-400">Moral Disgust</h3>
              <p className="text-zinc-600 dark:text-zinc-400 text-sm">
                Contamination language, portraying opponents as pollutants. Treats people as things
                to be expelled rather than argued with.
              </p>
            </div>
            <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
              <h3 className="font-bold text-lg mb-1 text-purple-600 dark:text-purple-400">Schadenfreude</h3>
              <p className="text-zinc-600 dark:text-zinc-400 text-sm">
                Celebrating opponents&apos; suffering or losses. Neural reward activation from a rival&apos;s
                pain. No resolution condition &mdash; predicts support for cruel policies.
              </p>
            </div>
            <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
              <h3 className="font-bold text-lg mb-1 text-indigo-600 dark:text-indigo-400">Epistemic Arrogance</h3>
              <p className="text-zinc-600 dark:text-zinc-400 text-sm">
                &ldquo;Everyone knows,&rdquo; &ldquo;not up for debate,&rdquo; &ldquo;do your research.&rdquo; False certainty that
                forecloses inquiry and makes disagreement feel like ignorance.
              </p>
            </div>
            <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
              <h3 className="font-bold text-lg mb-1 text-zinc-600 dark:text-zinc-400">Cynicism Induction</h3>
              <p className="text-zinc-600 dark:text-zinc-400 text-sm">
                &ldquo;It&apos;s all rigged,&rdquo; &ldquo;both sides are the same,&rdquo; &ldquo;nothing will change.&rdquo; Drives
                disengagement that amplifies extremist voices by removing the moderating middle.
              </p>
            </div>
            <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
              <h3 className="font-bold text-lg mb-1 text-orange-600 dark:text-orange-400">Existential Threat</h3>
              <p className="text-zinc-600 dark:text-zinc-400 text-sm">
                &ldquo;The end of democracy,&rdquo; &ldquo;point of no return.&rdquo; Frames stakes as civilization-ending
                to activate fear-driven authoritarianism and outgroup aggression.
              </p>
            </div>
          </div>
        </section>

        {/* Perception Gap */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Perception Gap Detection</h2>
          <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4">
            Research from More in Common shows that Americans imagine roughly twice as many opponents
            hold &ldquo;extreme&rdquo; views as actually do. The most news-engaged people are roughly 3x less
            accurate about opponents&apos; views than those who follow news casually.
          </p>
          <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4">
            When we detect that media framing suggests deeper division than public opinion data supports,
            we flag this as a <strong>Perception Gap</strong>. This helps readers distinguish between
            genuinely contested issues and manufactured controversy.
          </p>
        </section>

        {/* Why Common Ground First */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Why We Lead with Common Ground</h2>
          <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4">
            ClearView intentionally shows shared values and common ground <em>before</em> showing
            disagreements. This is based on research from:
          </p>
          <ul className="list-disc list-inside text-zinc-600 dark:text-zinc-400 space-y-2 ml-4 mb-4">
            <li><strong>Braver Angels workshops</strong> &mdash; RCTs show that reciprocal group reflection reduces
              affective polarization and stereotyping</li>
            <li><strong>Putnam&apos;s bridging capital</strong> &mdash; Cross-group ties (&ldquo;sociological WD-40&rdquo;) matter
              more for democracy than in-group bonding</li>
            <li><strong>Haidt&apos;s &ldquo;elephant and rider&rdquo;</strong> &mdash; Presenting opposing arguments often backfires;
              starting with shared identity creates emotional openness to difference</li>
          </ul>
          <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
            The goal is not to find watered-down &ldquo;common ground&rdquo; positions, but to help each side see
            the other&apos;s concerns as real &mdash; what Haidt calls the &ldquo;Asteroids Club&rdquo; approach.
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
