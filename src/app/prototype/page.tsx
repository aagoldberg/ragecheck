import Link from "next/link";

export default function RageCheckPrototype() {
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
            <Link href="/" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">Analyzer</Link>
            <Link href="/prototype" className="text-zinc-900 dark:text-zinc-100">Prototype</Link>
            <Link href="/methodology" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">Methodology</Link>
            <Link href="/about" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">About</Link>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-12 md:py-20">
        <h1 className="text-4xl font-bold tracking-tight mb-4">RageCheck: Architecture &amp; Strategy</h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-4">
          Transparent detection of manipulative framing via a 5-bar signal model with optional AI enhancement.
        </p>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-12">
          Rule-based pattern detection. No political bias classification. Open source.
        </p>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* THE THESIS                                                        */}
        {/* ═══════════════════════════════════════════════════════════════════ */}

        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-4">The Thesis</h2>
          <div className="p-6 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl mb-6">
            <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed mb-3">
              The attention economy rewards outrage over understanding. Content that activates
              <span className="font-bold"> anger, fear, and tribal identity</span> performs better algorithmically
              than content that informs or nuances. This isn&apos;t a conspiracy — it&apos;s basic economics.
              Engagement is monetizable, and outrage is engaging.
            </p>
            <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
              RageCheck makes these <span className="font-bold">framing patterns visible</span> by decomposing text
              into five orthogonal signal categories — each grounded in distinct psychological research — so
              users can see <em>how</em> content is constructed to provoke, not just <em>what</em> it says.
            </p>
          </div>

          <div className="p-5 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-xl mb-6">
            <p className="text-sm text-rose-800 dark:text-rose-300 leading-relaxed">
              <span className="font-bold">The key insight:</span> Manipulative framing uses <em>multiple
              mechanisms simultaneously</em>. A single angry word isn&apos;t ragebait. But anger + dehumanization
              + moral absolutism + engagement bait, concentrated in a short text? That&apos;s a constructed
              artifact. The 5-bar model detects this <span className="font-bold">combination</span> — and the
              non-linear boost system amplifies the score when multiple bars fire together.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
              <div className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">RageCheck</div>
              <div className="text-sm font-bold mb-1">Text Signal</div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Is this article manipulative? 5-bar lexicon scoring on individual text. The foundation layer.</p>
            </div>
            <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
              <div className="text-xs font-bold uppercase tracking-widest text-indigo-500 mb-2">ClearView</div>
              <div className="text-sm font-bold mb-1">Framing Signal</div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">How are different outlets framing the same story? Cross-source synthesis using RageCheck as input.</p>
            </div>
            <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
              <div className="text-xs font-bold uppercase tracking-widest text-emerald-500 mb-2">SideLines</div>
              <div className="text-sm font-bold mb-1">Graph Signal</div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">How are communities interacting? Network structure analysis using RageCheck arousal as node attribute.</p>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* WHY SIGNAL DECOMPOSITION                                          */}
        {/* ═══════════════════════════════════════════════════════════════════ */}

        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-4">Why Signal Decomposition</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-6">
            A single &ldquo;manipulation score&rdquo; is opaque. Decomposing into five bars answers the question
            users actually have: <em>what specifically is this content doing, and how?</em>
          </p>

          <div className="space-y-4">
            <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
              <h3 className="font-bold text-lg mb-2">1. Orthogonal Signals Reduce False Positives</h3>
              <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">
                A passionate editorial about injustice scores high on Emotional Heat but low on
                Enemy Construction, Simplification, and Call-to-Conflict. A genuine expression of anger
                isn&apos;t ragebait. The system catches this because ragebait requires <span className="font-semibold">multiple
                bars firing together</span> — the non-linear boost only activates when 2+ bars are high.
              </p>
            </div>

            <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
              <h3 className="font-bold text-lg mb-2">2. Each Bar Maps to Distinct Psychology</h3>
              <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">
                Arousal (dimensional emotion theory), Enemy Construction (intergroup conflict theory),
                Moral Condemnation (moral foundations theory), Simplification (cognitive bias research),
                Call-to-Conflict (propaganda analysis). These aren&apos;t arbitrary groupings — they&apos;re
                different <span className="font-semibold">psychological mechanisms</span> through which
                content manipulates.
              </p>
            </div>

            <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
              <h3 className="font-bold text-lg mb-2">3. Transparency Builds Trust</h3>
              <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">
                Users can see exactly which phrases triggered each bar, what weight each signal carries,
                and how the final score was computed. No black box. Every step is inspectable. This is
                critical for a tool that analyzes <em>other people&apos;s</em> content — it needs to hold itself
                to the same standard of transparency it demands.
              </p>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* ARCHITECTURE                                                      */}
        {/* ═══════════════════════════════════════════════════════════════════ */}

        <div className="mb-8 mt-20 flex items-center gap-3">
          <div className="text-xs font-bold uppercase tracking-widest text-zinc-500 bg-zinc-200 dark:bg-zinc-800 px-3 py-1 rounded-full">System</div>
          <h2 className="text-3xl font-bold">Architecture</h2>
        </div>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-10">
          Two-stage pipeline: deterministic rule-based detection (fast, transparent, always-on) followed by
          optional AI contextual analysis (slower, nuanced, requires API key). Both stages produce
          inspectable output.
        </p>

        <section className="mb-16">
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div className="p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
              <div className="text-xs font-bold uppercase tracking-widest text-rose-500 mb-2">Stage 1: Rule-Based</div>
              <p className="text-sm font-semibold mb-2">Deterministic Detection</p>
              <ul className="text-xs text-zinc-500 dark:text-zinc-400 space-y-1">
                <li>Text preprocessing + tokenization</li>
                <li>20 signal detectors (lexicon matching)</li>
                <li>5 bars + 2 modifiers computed</li>
                <li>Non-linear combination boosts</li>
                <li>Reporting/analysis discount applied</li>
                <li>Score, label, evidence, explanation</li>
              </ul>
            </div>
            <div className="p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
              <div className="text-xs font-bold uppercase tracking-widest text-indigo-500 mb-2">Stage 2: AI Enhancement</div>
              <p className="text-sm font-semibold mb-2">Contextual Analysis</p>
              <ul className="text-xs text-zinc-500 dark:text-zinc-400 space-y-1">
                <li>Claude AI reviews rule-based findings</li>
                <li>Detects satire, irony, quoted speech</li>
                <li>Identifies missed manipulation tactics</li>
                <li>Adjusts for context rules can&apos;t capture</li>
                <li>Produces &ldquo;What Follows&rdquo; prediction</li>
                <li>Optional — works without API key</li>
              </ul>
            </div>
            <div className="p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
              <div className="text-xs font-bold uppercase tracking-widest text-amber-500 mb-2">Content Extraction</div>
              <p className="text-sm font-semibold mb-2">Multi-Platform Input</p>
              <ul className="text-xs text-zinc-500 dark:text-zinc-400 space-y-1">
                <li>URLs: Readability + ScrapingBee fallback</li>
                <li>Images: Vision AI text extraction</li>
                <li>Social: platform-specific API extractors</li>
                <li>SSRF protection + URL validation</li>
                <li>Cloudflare bypass for blocked sites</li>
                <li>In-memory cache for repeated URLs</li>
              </ul>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* DATA PIPELINE                                                     */}
        {/* ═══════════════════════════════════════════════════════════════════ */}

        <section className="mb-16">
          <h3 className="text-xl font-bold mb-4">Analysis Pipeline</h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
            Six stages from raw input to final result. All run on Vercel serverless functions.
          </p>

          <div className="space-y-3">
            <PipelineStep
              n={1}
              title="Input Detection"
              runtime="Vercel"
              detail="Classify input as URL, image upload, or raw text. For URLs, detect platform (Twitter/X, Bluesky, Reddit, Threads, Truth Social, TikTok, YouTube, Mastodon, Farcaster) and route to platform-specific extractor."
              output="Raw text + metadata (source domain, title, image)"
            />
            <PipelineStep
              n={2}
              title="Content Extraction"
              runtime="Vercel"
              detail="Social posts: platform APIs (oEmbed, AT Protocol, Mastodon API, Reddit JSON). Articles: fetch HTML → Readability parser → clean text. Cloudflare-blocked: ScrapingBee headless browser fallback. Images: Claude Vision API → text extraction."
              output="Clean text string, 100+ characters minimum"
            />
            <PipelineStep
              n={3}
              title="Text Preprocessing"
              runtime="Vercel (inline)"
              detail="Tokenize text, split sentences, compute structural features: caps ratio, exclamation count, question count, punctuation intensity. These feed both the 5-bar model and the AI enhancement."
              output="PreprocessedText object with tokens, sentences, structural metrics"
            />
            <PipelineStep
              n={4}
              title="5-Bar Signal Detection"
              runtime="Vercel (inline)"
              detail="Run 20 signal detectors across 5 bars. Each detector matches curated lexicons and pattern templates against preprocessed text. Signals weighted within bars, bars weighted to core score. Apply non-linear boosts for multi-bar combinations."
              output="5 bar scores (0-100), 2 modifier scores, evidence per bar"
            />
            <PipelineStep
              n={5}
              title="Reporting Discount + Final Score"
              runtime="Vercel (inline)"
              detail="Compute reporting discount from attribution verbs, quotations, hedging, multi-perspective markers, and analytic structure. Apply as bait_score = core * (1 - discount/125). Classify: ≥50 ragebait, 10-49 borderline, <10 not_ragebait."
              output="bait_score (0-100), label, confidence, explanation"
            />
            <PipelineStep
              n={6}
              title="AI Enhancement (Optional)"
              runtime="Vercel"
              detail="Claude AI reviews the rule-based result with full text context. Can detect satire the rules miss, adjust for quoted speech, identify manipulation tactics beyond the lexicon. Produces 'Techniques Detected', 'Viral Triggers', and 'What Follows' sections."
              output="Enhanced analysis with contextual adjustments"
            />
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* THE FIVE BARS                                                     */}
        {/* ═══════════════════════════════════════════════════════════════════ */}

        <div className="mb-8 mt-20 flex items-center gap-3">
          <div className="text-xs font-bold uppercase tracking-widest text-rose-500 bg-rose-100 dark:bg-rose-900/30 px-3 py-1 rounded-full">Model</div>
          <h2 className="text-3xl font-bold">The Five Bars</h2>
        </div>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-10">
          Each bar captures a distinct psychological mechanism of manipulation. Together they form a
          &ldquo;manipulation fingerprint&rdquo; — the specific combination of tactics a piece of content uses.
          Weights sum to 1.0.
        </p>

        <section className="mb-16 space-y-6">
          <BarBlock
            color="rose"
            name="Emotional Heat (Arousal)"
            weight="20%"
            what="Language designed to activate high-arousal emotional states — anger, fear, disgust, urgency — over calm understanding."
            why="High-arousal emotions reduce critical thinking and increase sharing behavior. Content optimized for arousal bypasses the analytical mind. But arousal alone isn't manipulation — journalism about genuine crises is naturally arousing. That's why this bar is weighted at 20%, not 50%."
            signals={[
              { name: "Emotion Lexicon", weight: "30%", source: "EMOTION_ANGER_FEAR_DISGUST", examples: "furious, terrified, disgusting, appalling" },
              { name: "Urgency Words", weight: "25%", source: "URGENCY_WORDS", examples: "breaking, must see, act now, crisis" },
              { name: "Punctuation Intensity", weight: "25%", source: "structural", examples: "ALL CAPS ratio, !!!, ?!, exclamation density" },
              { name: "Intensifiers", weight: "20%", source: "INTENSIFIERS", examples: "literally, absolutely, insanely, utterly" },
            ]}
            references={[
              "Russell, J.A. (1980). A circumplex model of affect. Journal of Personality and Social Psychology, 39(6), 1161-1178.",
              "Kramer, A.D.I., Guillory, J.E., & Hancock, J.T. (2014). Experimental evidence of massive-scale emotional contagion through social networks. PNAS, 111(24), 8788-8790.",
              "Brady, W.J., Wills, J.A., Jost, J.T., Tucker, J.A., & Van Bavel, J.J. (2017). Emotion shapes the diffusion of moralized content in social networks. PNAS, 114(28), 7313-7318.",
              "Berger, J. & Milkman, K.L. (2012). What makes online content viral? Journal of Marketing Research, 49(2), 192-205.",
              "Fan, R., Zhao, J., Chen, Y., & Xu, K. (2014). Anger is more influential than joy: Sentiment correlation in Weibo. PLOS ONE, 9(10), e110184.",
            ]}
          />
          <BarBlock
            color="indigo"
            name="Us vs Them (Enemy Construction)"
            weight="25%"
            what="Framing that constructs an adversary — dehumanizing groups, attributing malicious intent, creating artificial in-group/out-group divisions."
            why="The highest-weighted bar because enemy construction is the most structurally dangerous manipulation tactic. It doesn't just provoke emotion — it restructures how the reader sees other people. Once someone is dehumanized, any action against them becomes justifiable. This is the mechanism that converts individual anger into collective hostility."
            signals={[
              { name: "Group Generalizations", weight: "25%", source: "GROUP_GENERALIZATIONS", examples: "they all, the left, the elite, those people" },
              { name: "Malicious Intent", weight: "25%", source: "MALICIOUS_INTENT_PATTERNS", examples: "they want to destroy, coming for your, agenda to" },
              { name: "Dehumanization", weight: "30%", source: "DEHUMANIZATION_TERMS", examples: "vermin, parasites, subhuman, plague, sheeple" },
              { name: "Scapegoating", weight: "20%", source: "SCAPEGOAT_PATTERNS", examples: "is to blame for, responsible for all, caused the" },
            ]}
            references={[
              "Tajfel, H. & Turner, J.C. (1979). An integrative theory of intergroup conflict. In W.G. Austin & S. Worchel (Eds.), The Social Psychology of Intergroup Relations, 33-47.",
              "Haslam, N. (2006). Dehumanization: An integrative review. Personality and Social Psychology Review, 10(3), 252-264.",
              "Iyengar, S. & Westwood, S.J. (2015). Fear and loathing across party lines: New evidence on group polarization. American Journal of Political Science, 59(3), 690-707.",
              "Kteily, N., Bruneau, E., Waytz, A., & Cotterill, S. (2015). The ascent of man: Theoretical and empirical evidence for blatant dehumanization. Journal of Personality and Social Psychology, 109(5), 901-931.",
              "Cikara, M. & Fiske, S.T. (2012). Stereotypes and schadenfreude: Affective and physiological markers of pleasure at outgroup misfortunes. Social Psychological and Personality Science, 3(1), 63-71.",
            ]}
          />
          <BarBlock
            color="orange"
            name="Moral Outrage (Moral Condemnation)"
            weight="20%"
            what="Appeals to moral outrage, purity rhetoric, and righteous indignation that frame issues as battles between good and evil."
            why="Moral language transforms disagreements into existential conflicts. Once an opponent is 'evil' rather than 'wrong,' compromise becomes complicity. Moral condemnation content generates 20% more engagement than equivalent non-moral content because it activates identity-protective cognition — sharing it signals which moral tribe you belong to."
            signals={[
              { name: "Moral Judgment", weight: "40%", source: "MORAL_JUDGMENT_TERMS", examples: "evil, corrupt, traitor, deplorable, immoral" },
              { name: "Purity/Contamination", weight: "35%", source: "PURITY_CONTAMINATION", examples: "poison, infected, rot, contaminate, filth" },
              { name: "Betrayal Framing", weight: "25%", source: "BETRAYAL_FRAMING", examples: "sold out, backstab, turned their back on" },
            ]}
            references={[
              "Haidt, J. & Graham, J. (2007). When morality opposes justice: Conservatives have moral intuitions that liberals may not recognize. Social Justice Research, 20(1), 98-116.",
              "Crockett, M.J. (2017). Moral outrage in the digital age. Nature Human Behaviour, 1(11), 769-771.",
              "Brady, W.J., Crockett, M.J., & Van Bavel, J.J. (2020). The MAD model of moral contagion: The role of motivation, attention, and design in the spread of moralized content online. Perspectives on Psychological Science, 15(4), 978-1010.",
              "Rozin, P., Lowery, L., Imada, S., & Haidt, J. (1999). The CAD triad hypothesis: A mapping between three moral emotions and three moral codes. Journal of Personality and Social Psychology, 76(4), 574-586.",
              "Graham, J., Haidt, J., & Nosek, B.A. (2009). Liberals and conservatives rely on different sets of moral foundations. Journal of Personality and Social Psychology, 96(5), 1029-1046.",
            ]}
          />
          <BarBlock
            color="blue"
            name="Black & White Thinking (Simplification)"
            weight="15%"
            what="Oversimplification, false dichotomies, absolutist framing, and causal reductionism that eliminate nuance from complex issues."
            why="Lowest-weighted bar because some simplification is inherent to short-form media. But extreme simplification — 'always,' 'never,' 'the only solution' — actively prevents the reader from engaging with complexity. False dilemmas force binary choices on multi-dimensional problems. Combined with other bars, simplification becomes the rhetorical framework that makes anger feel justified."
            signals={[
              { name: "Absolutist Terms", weight: "35%", source: "ABSOLUTIST_TERMS", examples: "always, never, everyone, impossible, undeniable" },
              { name: "False Dilemma", weight: "25%", source: "FALSE_DILEMMA_PATTERNS", examples: "either...or, you're with us or, the only choice" },
              { name: "Causal Oversimplification", weight: "25%", source: "CAUSAL_OVERSIMPLIFICATION", examples: "this is why, the reason is simple, it's because" },
              { name: "Repetition/Slogans", weight: "15%", source: "structural", examples: "repeated trigrams, slogan patterns, chanting structure" },
            ]}
            references={[
              "Kahneman, D. (2011). Thinking, Fast and Slow. Farrar, Straus and Giroux.",
              "Pennycook, G. & Rand, D.G. (2019). Lazy, not biased: Susceptibility to partisan fake news is better explained by lack of reasoning than by motivated reasoning. Cognition, 188, 39-50.",
              "Tetlock, P.E. (2005). Expert Political Judgment: How Good Is It? How Can We Know? Princeton University Press.",
              "Baron, J. & Jost, J.T. (2019). False equivalence: Are liberals and conservatives in the United States equally biased? Perspectives on Psychological Science, 14(2), 292-303.",
              "van Prooijen, J.-W. & Krouwel, A.P.M. (2019). Psychological features of extreme political ideologies. Current Directions in Psychological Science, 28(2), 159-163.",
            ]}
          />
          <BarBlock
            color="amber"
            name="Fight-Picking (Call-to-Conflict)"
            weight="20%"
            what="Direct provocations, engagement bait, and language designed to mobilize action, drive replies, or force viral spread."
            why="The most ragebait-specific signal. While the other four bars detect framing quality, Call-to-Conflict detects framing intent — the text is explicitly designed to generate engagement. Gets a special 1.8x multiplier when ≥70 because pure engagement bait ('share before they delete this!') is the clearest signal of manufactured outrage, even when other bars are moderate."
            signals={[
              { name: "Reply Bait", weight: "40%", source: "REPLY_BAIT_TEMPLATES", examples: "how is this allowed, share before they delete, bet you won't" },
              { name: "Rhetorical Questions", weight: "30%", source: "structural", examples: "how can we, why do they, isn't it obvious" },
              { name: "Second-Person Provocation", weight: "30%", source: "SECOND_PERSON_PROVOCATION", examples: "you people, if you support, wake up, open your eyes" },
            ]}
            references={[
              "Ellul, J. (1965). Propaganda: The Formation of Men's Attitudes. Knopf.",
              "Vosoughi, S., Roy, D., & Aral, S. (2018). The spread of true and false news online. Science, 359(6380), 1146-1151.",
              "Bail, C.A., Argyle, L.P., Brown, T.W., et al. (2018). Exposure to opposing views on social media can increase political polarization. PNAS, 115(37), 9216-9221.",
              "Rathje, S., Van Bavel, J.J., & van der Linden, S. (2021). Out-group animosity drives engagement on social media. PNAS, 118(26), e2024292118.",
              "Zuboff, S. (2019). The Age of Surveillance Capitalism. PublicAffairs.",
            ]}
          />
        </section>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* CONTEXT MODIFIERS                                                 */}
        {/* ═══════════════════════════════════════════════════════════════════ */}

        <div className="mb-8 mt-20 flex items-center gap-3">
          <div className="text-xs font-bold uppercase tracking-widest text-teal-500 bg-teal-100 dark:bg-teal-900/30 px-3 py-1 rounded-full">Modifiers</div>
          <h2 className="text-3xl font-bold">Context Modifiers</h2>
        </div>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-10">
          Two modifiers adjust the raw bar scores based on structural properties of the text.
          The reporting discount is the primary false-positive reducer.
        </p>

        <section className="mb-16">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-5 bg-white dark:bg-zinc-900 border border-teal-200 dark:border-teal-800 rounded-xl">
              <h3 className="font-bold text-lg text-teal-600 dark:text-teal-400 mb-3">Reporting/Analysis Discount</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-3">
                Journalism and academic writing often <em>discuss</em> manipulative content without <em>being</em>
                manipulative. This modifier detects reporting markers and reduces the final score.
              </p>
              <p className="text-xs text-zinc-400 font-mono mb-3">bait_score = core * (1 - discount/125)</p>
              <div className="border-t border-zinc-200 dark:border-zinc-800 pt-3">
                <div className="text-xs text-zinc-500 space-y-1">
                  <div><span className="font-medium">Attribution Verbs (25%):</span> said, claimed, according to, reported</div>
                  <div><span className="font-medium">Quotations (20%):</span> quoted speech detection</div>
                  <div><span className="font-medium">Hedging (20%):</span> appears, suggests, may, could indicate</div>
                  <div><span className="font-medium">Multi-Perspective (20%):</span> however, critics say, on the other hand</div>
                  <div><span className="font-medium">Analytic Structure (15%):</span> 5+ sentences, 15+ words/sentence avg</div>
                </div>
              </div>
            </div>
            <div className="p-5 bg-white dark:bg-zinc-900 border border-teal-200 dark:border-teal-800 rounded-xl">
              <h3 className="font-bold text-lg text-teal-600 dark:text-teal-400 mb-3">Information Density</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-3">
                Measures whether content contains substantive information (names, numbers, sources)
                or is purely rhetorical. High information density correlates with informational intent
                rather than provocative intent.
              </p>
              <p className="text-xs text-zinc-400 font-mono mb-3">score = entities + numbers + links (capped at 1.0)</p>
              <div className="border-t border-zinc-200 dark:border-zinc-800 pt-3">
                <div className="text-xs text-zinc-500 space-y-1">
                  <div><span className="font-medium">Named Entities:</span> capitalized words in non-initial positions</div>
                  <div><span className="font-medium">Numbers/Statistics:</span> digits, percentages, dates</div>
                  <div><span className="font-medium">Links/Sources:</span> URLs and domain references</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* SCORING FORMULA                                                   */}
        {/* ═══════════════════════════════════════════════════════════════════ */}

        <div className="mb-8 mt-20 flex items-center gap-3">
          <div className="text-xs font-bold uppercase tracking-widest text-violet-500 bg-violet-100 dark:bg-violet-900/30 px-3 py-1 rounded-full">Formula</div>
          <h2 className="text-3xl font-bold">Scoring Pipeline</h2>
        </div>

        <section className="mb-16">
          <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-6">
            The final score combines weighted bar scores with non-linear boosts and a reporting discount.
            The non-linear boosts are the system&apos;s core insight: manipulation uses multiple mechanisms
            simultaneously, so multi-bar activation gets disproportionate weight.
          </p>

          <div className="space-y-4">
            <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
              <h4 className="font-bold text-sm mb-2">Step 1: Weighted Sum</h4>
              <code className="text-xs text-zinc-500 block">
                core = (arousal * 0.20) + (enemy_construction * 0.25) + (moral_condemnation * 0.20) + (simplification * 0.15) + (call_to_conflict * 0.20)
              </code>
            </div>

            <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
              <h4 className="font-bold text-sm mb-2">Step 2: Non-Linear Boosts</h4>
              <div className="text-xs text-zinc-500 dark:text-zinc-400 space-y-1">
                <div>3+ bars &ge; 55 (very high): <span className="font-mono text-rose-600 dark:text-rose-400">core * 1.6</span></div>
                <div>2+ bars &ge; 55 or 4+ bars &ge; 35: <span className="font-mono text-rose-600 dark:text-rose-400">core * 1.45</span></div>
                <div>3+ bars &ge; 35: <span className="font-mono text-rose-600 dark:text-rose-400">core * 1.35</span></div>
                <div>2+ bars &ge; 35: <span className="font-mono text-rose-600 dark:text-rose-400">core * 1.25</span></div>
              </div>
            </div>

            <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
              <h4 className="font-bold text-sm mb-2">Step 3: Special Boosts</h4>
              <div className="text-xs text-zinc-500 dark:text-zinc-400 space-y-1">
                <div>call_to_conflict &ge; 70: <span className="font-mono text-amber-600 dark:text-amber-400">core * 1.8</span> (most ragebait-specific signal)</div>
                <div>call_to_conflict &ge; 55: <span className="font-mono text-amber-600 dark:text-amber-400">core * 1.35</span></div>
                <div>enemy_construction &ge; 40 AND moral_condemnation &ge; 40: <span className="font-mono text-amber-600 dark:text-amber-400">core * 1.15</span></div>
              </div>
            </div>

            <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
              <h4 className="font-bold text-sm mb-2">Step 4: Reporting Discount</h4>
              <code className="text-xs text-zinc-500 block mb-2">
                bait_score = clamp(core * (1 - reporting_discount / 125), 0, 100)
              </code>
              <p className="text-xs text-zinc-400">At discount = 100 (strong reporting), score reduced by 80%. At discount = 0, no change.</p>
            </div>

            <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
              <h4 className="font-bold text-sm mb-2">Step 5: Label + Confidence</h4>
              <div className="grid grid-cols-3 gap-3 mt-2">
                <div className="p-2 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-lg text-center">
                  <div className="text-lg font-bold text-rose-600 dark:text-rose-400">&ge;50</div>
                  <div className="text-xs text-rose-700 dark:text-rose-300">ragebait</div>
                </div>
                <div className="p-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg text-center">
                  <div className="text-lg font-bold text-amber-600 dark:text-amber-400">10-49</div>
                  <div className="text-xs text-amber-700 dark:text-amber-300">borderline</div>
                </div>
                <div className="p-2 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg text-center">
                  <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">&lt;10</div>
                  <div className="text-xs text-emerald-700 dark:text-emerald-300">not ragebait</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* CONTENT EXTRACTION                                                */}
        {/* ═══════════════════════════════════════════════════════════════════ */}

        <div className="mb-8 mt-20 flex items-center gap-3">
          <div className="text-xs font-bold uppercase tracking-widest text-blue-500 bg-blue-100 dark:bg-blue-900/30 px-3 py-1 rounded-full">Extraction</div>
          <h2 className="text-3xl font-bold">Content Extraction</h2>
        </div>

        <section className="mb-16">
          <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-6">
            RageCheck accepts URLs, images, and raw text. For URLs, platform-specific extractors are tried
            first for reliability, falling back to generic Readability parsing for web pages.
          </p>

          <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden mb-6">
            <div className="px-4 py-3 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
              <span className="text-sm font-semibold">Platform-Specific Extractors</span>
            </div>
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
              {[
                { platform: "Bluesky", method: "AT Protocol public API", detail: "app.bsky.feed.getPostThread, no auth required" },
                { platform: "Twitter / X", method: "oEmbed + FxTwitter fallback", detail: "publish.twitter.com → api.fxtwitter.com" },
                { platform: "Reddit", method: "JSON API (.json suffix)", detail: "Post text + top 5 comments" },
                { platform: "Threads", method: "og:description meta tag", detail: "Page fetch with Googlebot UA" },
                { platform: "Truth Social", method: "Mastodon-compatible API", detail: "/api/v1/statuses/{id} + og:description fallback" },
                { platform: "TikTok", method: "oEmbed API", detail: "Video title + author" },
                { platform: "YouTube", method: "oEmbed API", detail: "Video title + channel name" },
                { platform: "Mastodon", method: "Instance API", detail: "/api/v1/statuses/{id} for known instances" },
                { platform: "Farcaster", method: "Neynar API", detail: "Cast lookup by URL" },
              ].map((p) => (
                <div key={p.platform} className="px-4 py-2.5 flex items-center gap-3 text-sm bg-white dark:bg-zinc-900/50">
                  <span className="font-medium w-28 flex-shrink-0">{p.platform}</span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 w-52 flex-shrink-0">{p.method}</span>
                  <span className="text-xs text-zinc-400 truncate">{p.detail}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
              <h4 className="font-bold text-sm mb-2">Web Articles (Fallback)</h4>
              <ul className="text-xs text-zinc-500 dark:text-zinc-400 space-y-1">
                <li>Mozilla Readability for content extraction</li>
                <li>linkedom for serverless-compatible HTML parsing</li>
                <li>ScrapingBee for Cloudflare-blocked sites (headless browser)</li>
                <li>25s fetch timeout, 5MB size limit</li>
                <li>SSRF protection: private IPs blocked</li>
              </ul>
            </div>
            <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
              <h4 className="font-bold text-sm mb-2">Image Analysis</h4>
              <ul className="text-xs text-zinc-500 dark:text-zinc-400 space-y-1">
                <li>Claude Vision API extracts text from screenshots</li>
                <li>Platform detection (Twitter, Facebook, Instagram, etc.)</li>
                <li>Meme analysis: considers image + text interaction</li>
                <li>Handles screenshots from private accounts</li>
                <li>Useful when direct URL extraction fails</li>
              </ul>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* WHAT THIS DOES NOT DO                                             */}
        {/* ═══════════════════════════════════════════════════════════════════ */}

        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-4">What This Does Not Do</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-6">
            Clarity about limitations is a feature, not a concession. These boundaries are intentional.
          </p>

          <div className="space-y-3">
            <LimitationItem
              title="verify facts"
              detail="A high score means content uses manipulative framing — it does not mean the underlying claims are false. Conversely, low-scoring content can be completely wrong. RageCheck measures HOW something is said, not WHETHER it's true."
            />
            <LimitationItem
              title="detect political bias"
              detail="Manipulative framing exists across the political spectrum. The same dehumanization, moral absolutism, and engagement bait patterns appear in content from any political orientation. The lexicons are deliberately apolitical."
            />
            <LimitationItem
              title="understand sarcasm perfectly"
              detail="'This is FINE. Everything is GREAT.' scores high on absolutist + intensifier lexicons. The rule-based system sees surface text, not intent. The AI enhancement helps with this, but lexicon-based detection has inherent limits with irony."
            />
            <LimitationItem
              title="analyze non-English content"
              detail="All lexicons are English-only. Non-English text will produce unreliable scores. Multilingual support would require language-specific lexicon development and validation."
            />
            <LimitationItem
              title="replace your judgment"
              detail="RageCheck is a tool, not an oracle. Use it as one signal among many. Context, source credibility, your own knowledge, and critical thinking remain more important than any automated score."
            />
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* FILE MANIFEST                                                     */}
        {/* ═══════════════════════════════════════════════════════════════════ */}

        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-4">Key Files</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
            Core system files. Open source — every line is inspectable.
          </p>

          <div className="grid md:grid-cols-2 gap-4">
            <FileGroup title="5-Bar Model (7)" color="rose" files={[
              "src/lib/model/types.ts",
              "src/lib/model/preprocess.ts",
              "src/lib/model/lexicons.ts",
              "src/lib/model/signals.ts",
              "src/lib/model/bars.ts",
              "src/lib/model/scoring.ts",
              "src/lib/model/index.ts",
            ]} />
            <FileGroup title="Content Extraction (2)" color="blue" files={[
              "src/lib/extract.ts",
              "src/lib/llm.ts",
            ]} />
            <FileGroup title="API Routes (3)" color="violet" files={[
              "src/app/api/model/route.ts",
              "src/app/api/analyze/route.ts",
              "src/lib/score.ts",
            ]} />
            <FileGroup title="UI & Pages (5)" color="amber" files={[
              "src/app/page.tsx",
              "src/app/about/page.tsx",
              "src/app/methodology/page.tsx",
              "src/app/prototype/page.tsx",
              "src/app/model/page.tsx",
            ]} />
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* REFERENCES                                                        */}
        {/* ═══════════════════════════════════════════════════════════════════ */}

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">References</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
            Each signal category is grounded in established research. Full citations grouped by the
            bar they inform.
          </p>

          <div className="space-y-4">
            <ReferenceBox
              bar="Emotional Heat (Arousal)"
              color="rose"
              references={[
                { citation: "Russell, J.A. (1980). A circumplex model of affect.", journal: "Journal of Personality and Social Psychology", volume: "39(6), 1161-1178", note: "Foundation for dimensional emotion models: arousal (high/low) x valence (positive/negative). RageCheck's arousal bar measures the high-arousal axis regardless of valence." },
                { citation: "Kramer, A.D.I., Guillory, J.E., & Hancock, J.T. (2014). Experimental evidence of massive-scale emotional contagion through social networks.", journal: "PNAS", volume: "111(24), 8788-8790", note: "Facebook's emotional contagion experiment: exposure to emotional content in feeds altered users' own emotional expression. Establishes that arousal-laden content has measurable downstream effects." },
                { citation: "Brady, W.J., Wills, J.A., Jost, J.T., Tucker, J.A., & Van Bavel, J.J. (2017). Emotion shapes the diffusion of moralized content in social networks.", journal: "PNAS", volume: "114(28), 7313-7318", note: "Each moral-emotional word in a tweet increased its retweet rate by 20%. Directly informs the signal scoring curve — more lexicon matches = disproportionately higher score." },
                { citation: "Berger, J. & Milkman, K.L. (2012). What makes online content viral?", journal: "Journal of Marketing Research", volume: "49(2), 192-205", note: "High-arousal content (anger, anxiety, awe) is more viral than low-arousal content (sadness). Validates using arousal as a key dimension of manipulation detection." },
                { citation: "Fan, R., Zhao, J., Chen, Y., & Xu, K. (2014). Anger is more influential than joy: Sentiment correlation in Weibo.", journal: "PLOS ONE", volume: "9(10), e110184", note: "Anger propagates faster and further than other emotions in social networks. Supports weighting anger/fear/disgust lexicons heavily in the arousal bar." },
              ]}
            />
            <ReferenceBox
              bar="Us vs Them (Enemy Construction)"
              color="indigo"
              references={[
                { citation: "Tajfel, H. & Turner, J.C. (1979). An integrative theory of intergroup conflict.", journal: "In W.G. Austin & S. Worchel (Eds.), The Social Psychology of Intergroup Relations", volume: "33-47", note: "Social Identity Theory: people derive self-esteem from group membership and are motivated to view out-groups negatively. The psychological basis for why enemy construction is so effective." },
                { citation: "Haslam, N. (2006). Dehumanization: An integrative review.", journal: "Personality and Social Psychology Review", volume: "10(3), 252-264", note: "Two forms: animalistic (denying uniquely human traits) and mechanistic (denying human nature). Informs the DEHUMANIZATION_TERMS lexicon and its 30% weight in the bar — highest of any signal." },
                { citation: "Iyengar, S. & Westwood, S.J. (2015). Fear and loathing across party lines: New evidence on group polarization.", journal: "American Journal of Political Science", volume: "59(3), 690-707", note: "Affective polarization now exceeds racial and religious polarization in the US. Out-group animosity, not in-group favoritism, drives the effect. Validates detecting enemy construction as a primary manipulation axis." },
                { citation: "Kteily, N., Bruneau, E., Waytz, A., & Cotterill, S. (2015). The ascent of man: Theoretical and empirical evidence for blatant dehumanization.", journal: "Journal of Personality and Social Psychology", volume: "109(5), 901-931", note: "Developed the 'Ascent of Man' scale measuring blatant dehumanization. Participants who blatantly dehumanized out-groups also supported aggressive policies toward them. Justifies the 25% weight — enemy construction is the most structurally dangerous bar." },
                { citation: "Cikara, M. & Fiske, S.T. (2012). Stereotypes and schadenfreude: Affective and physiological markers of pleasure at outgroup misfortunes.", journal: "Social Psychological and Personality Science", volume: "3(1), 63-71", note: "People experience pleasure at out-group suffering, mediated by perceived competition. Content that constructs enemies exploits this neural reward pathway." },
              ]}
            />
            <ReferenceBox
              bar="Moral Outrage (Moral Condemnation)"
              color="orange"
              references={[
                { citation: "Haidt, J. & Graham, J. (2007). When morality opposes justice: Conservatives have moral intuitions that liberals may not recognize.", journal: "Social Justice Research", volume: "20(1), 98-116", note: "Moral Foundations Theory: five foundations (care, fairness, loyalty, authority, purity) underlie moral reasoning. The moral condemnation bar detects when content weaponizes these foundations — especially purity/contamination rhetoric." },
                { citation: "Crockett, M.J. (2017). Moral outrage in the digital age.", journal: "Nature Human Behaviour", volume: "1(11), 769-771", note: "Digital platforms reduce the cost of expressing moral outrage while increasing its audience. This creates 'outrage inflation' where expressions escalate over time. Directly motivates detecting moral condemnation as a manipulation vector." },
                { citation: "Brady, W.J., Crockett, M.J., & Van Bavel, J.J. (2020). The MAD model of moral contagion.", journal: "Perspectives on Psychological Science", volume: "15(4), 978-1010", note: "Motivation, Attention, and Design interact to spread moralized content. Platform design amplifies moral-emotional content. The theoretical framework for why moral condemnation is a key bar." },
                { citation: "Rozin, P., Lowery, L., Imada, S., & Haidt, J. (1999). The CAD triad hypothesis.", journal: "Journal of Personality and Social Psychology", volume: "76(4), 574-586", note: "Maps three moral emotions (contempt, anger, disgust) to three moral codes (community, autonomy, divinity). Informs the purity/contamination signal — disgust-based moral language is particularly potent for mobilization." },
                { citation: "Graham, J., Haidt, J., & Nosek, B.A. (2009). Liberals and conservatives rely on different sets of moral foundations.", journal: "Journal of Personality and Social Psychology", volume: "96(5), 1029-1046", note: "Different political orientations emphasize different moral foundations. The lexicon includes terms from all five foundations to avoid political bias in detection." },
              ]}
            />
            <ReferenceBox
              bar="Black & White Thinking (Simplification)"
              color="blue"
              references={[
                { citation: "Kahneman, D. (2011). Thinking, Fast and Slow.", journal: "Farrar, Straus and Giroux", volume: "", note: "System 1 (fast, intuitive) vs System 2 (slow, analytical) thinking. Simplification in manipulative content exploits System 1 — it presents conclusions without the complexity that would engage System 2. Absolutist framing ('always,' 'never') bypasses analytical thought." },
                { citation: "Pennycook, G. & Rand, D.G. (2019). Lazy, not biased: Susceptibility to partisan fake news is better explained by lack of reasoning than by motivated reasoning.", journal: "Cognition", volume: "188, 39-50", note: "People fall for misinformation not because of partisan bias but because they don't think carefully. Simplified framing exploits this — it asks for less cognitive effort, making false or misleading conclusions feel intuitive." },
                { citation: "Tetlock, P.E. (2005). Expert Political Judgment: How Good Is It? How Can We Know?", journal: "Princeton University Press", volume: "", note: "'Hedgehog' thinkers (one big idea) are worse forecasters than 'fox' thinkers (many small ideas). Simplification in content promotes hedgehog thinking — the false dilemma signal detects when content forces binary choices on multidimensional problems." },
                { citation: "Baron, J. & Jost, J.T. (2019). False equivalence: Are liberals and conservatives in the United States equally biased?", journal: "Perspectives on Psychological Science", volume: "14(2), 292-303", note: "Examines whether oversimplification (treating asymmetric situations as equivalent) is itself a cognitive bias. Informs the causal oversimplification signal." },
                { citation: "van Prooijen, J.-W. & Krouwel, A.P.M. (2019). Psychological features of extreme political ideologies.", journal: "Current Directions in Psychological Science", volume: "28(2), 159-163", note: "Political extremism correlates with black-and-white thinking, intolerance of ambiguity, and need for cognitive closure. Validates absolutist language detection as a signal of manipulative framing." },
              ]}
            />
            <ReferenceBox
              bar="Fight-Picking (Call-to-Conflict)"
              color="amber"
              references={[
                { citation: "Ellul, J. (1965). Propaganda: The Formation of Men's Attitudes.", journal: "Knopf", volume: "", note: "Classic analysis of propaganda techniques. Distinguishes 'agitation propaganda' (designed to provoke action) from 'integration propaganda' (designed to conform). The call-to-conflict bar specifically detects agitation propaganda patterns: urgency, provocation, mobilization." },
                { citation: "Vosoughi, S., Roy, D., & Aral, S. (2018). The spread of true and false news online.", journal: "Science", volume: "359(6380), 1146-1151", note: "False news spreads faster and further than true news, driven by novelty and emotional reactions. Content with high call-to-conflict signals ('share before they delete this!') exploits these dynamics deliberately." },
                { citation: "Bail, C.A., Argyle, L.P., Brown, T.W., et al. (2018). Exposure to opposing views on social media can increase political polarization.", journal: "PNAS", volume: "115(37), 9216-9221", note: "Exposure to opposing views can backfire, increasing polarization rather than reducing it — especially when the content is confrontational. Reply bait and second-person provocation actively create these adversarial exposures." },
                { citation: "Rathje, S., Van Bavel, J.J., & van der Linden, S. (2021). Out-group animosity drives engagement on social media.", journal: "PNAS", volume: "118(26), e2024292118", note: "Posts about out-groups generate more engagement than posts about in-groups, especially on political topics. Directly validates the call-to-conflict bar — engagement bait content is designed to exploit this asymmetry." },
                { citation: "Zuboff, S. (2019). The Age of Surveillance Capitalism.", journal: "PublicAffairs", volume: "", note: "Argues that behavioral data extraction creates economic incentives for engagement maximization. Fight-picking content is the natural output of these incentives — it's not a bug, it's the product. Contextualizes why call-to-conflict detection matters." },
              ]}
            />
          </div>
        </section>

        {/* Back link */}
        <div className="pt-8 border-t border-zinc-200 dark:border-zinc-800">
          <Link
            href="/"
            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium"
          >
            &larr; Back to RageCheck
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ── Components ── */

function PipelineStep({ n, title, runtime, detail, output }: {
  n: number;
  title: string;
  runtime: string;
  detail: string;
  output: string;
}) {
  return (
    <div className="flex gap-4 items-start">
      <div className="w-8 h-8 bg-zinc-200 dark:bg-zinc-800 rounded-full flex items-center justify-center text-zinc-600 dark:text-zinc-400 font-bold text-sm flex-shrink-0">{n}</div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-bold text-lg">{title}</h4>
          <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500">{runtime}</span>
        </div>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">{detail}</p>
        <p className="text-xs text-zinc-400 font-mono">Output: {output}</p>
      </div>
    </div>
  );
}

function BarBlock({ color, name, weight, what, why, signals, references }: {
  color: string;
  name: string;
  weight: string;
  what: string;
  why: string;
  signals: { name: string; weight: string; source: string; examples: string }[];
  references: string[];
}) {
  const colorClasses: Record<string, { border: string; heading: string; bg: string }> = {
    rose: { border: "border-rose-200 dark:border-rose-800", heading: "text-rose-600 dark:text-rose-400", bg: "bg-rose-50 dark:bg-rose-950/20" },
    indigo: { border: "border-indigo-200 dark:border-indigo-800", heading: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-50 dark:bg-indigo-950/20" },
    orange: { border: "border-orange-200 dark:border-orange-800", heading: "text-orange-600 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-950/20" },
    blue: { border: "border-blue-200 dark:border-blue-800", heading: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950/20" },
    amber: { border: "border-amber-200 dark:border-amber-800", heading: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/20" },
  };
  const c = colorClasses[color] || colorClasses.rose;

  return (
    <div className={`p-5 bg-white dark:bg-zinc-900 border ${c.border} rounded-xl`}>
      <div className="flex items-center gap-3 mb-3">
        <h3 className={`font-bold text-xl ${c.heading}`}>{name}</h3>
        <span className="text-xs font-mono text-zinc-400">weight: {weight}</span>
      </div>
      <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-2">
        <span className="font-semibold">What:</span> {what}
      </p>
      <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4">
        <span className="font-semibold">Why this weight:</span> {why}
      </p>

      {/* Signal breakdown */}
      <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden mb-4">
        <div className="px-3 py-2 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
          <span className="text-xs font-semibold">Signals</span>
        </div>
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
          {signals.map((s) => (
            <div key={s.name} className="px-3 py-2 flex items-center gap-2 text-xs bg-white dark:bg-zinc-900/50">
              <span className="font-medium w-44 flex-shrink-0">{s.name}</span>
              <span className={`${c.heading} font-mono w-10 flex-shrink-0`}>{s.weight}</span>
              <code className="text-zinc-400 w-44 flex-shrink-0">{s.source}</code>
              <span className="text-zinc-400 italic truncate">{s.examples}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Inline references */}
      <div className={`p-3 ${c.bg} rounded-lg`}>
        <div className="text-xs font-semibold text-zinc-500 mb-2">Key Research</div>
        <ul className="text-xs text-zinc-500 dark:text-zinc-400 space-y-1">
          {references.slice(0, 3).map((ref, i) => (
            <li key={i} className="leading-relaxed">{ref}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function ReferenceBox({ bar, color, references }: {
  bar: string;
  color: string;
  references: { citation: string; journal: string; volume: string; note: string }[];
}) {
  const colorClasses: Record<string, { border: string; heading: string; badge: string }> = {
    rose: { border: "border-rose-200 dark:border-rose-800", heading: "text-rose-600 dark:text-rose-400", badge: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400" },
    indigo: { border: "border-indigo-200 dark:border-indigo-800", heading: "text-indigo-600 dark:text-indigo-400", badge: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400" },
    orange: { border: "border-orange-200 dark:border-orange-800", heading: "text-orange-600 dark:text-orange-400", badge: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
    blue: { border: "border-blue-200 dark:border-blue-800", heading: "text-blue-600 dark:text-blue-400", badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
    amber: { border: "border-amber-200 dark:border-amber-800", heading: "text-amber-600 dark:text-amber-400", badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  };
  const c = colorClasses[color] || colorClasses.rose;

  return (
    <div className={`p-5 bg-white dark:bg-zinc-900 border ${c.border} rounded-xl`}>
      <div className="flex items-center gap-3 mb-4">
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${c.badge}`}>{bar}</span>
      </div>
      <ul className="space-y-4">
        {references.map((ref, i) => (
          <li key={i} className="text-sm">
            <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed">
              {ref.citation} <em>{ref.journal}</em>{ref.volume ? `, ${ref.volume}` : ""}.
            </p>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
              {ref.note}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function LimitationItem({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
      <h4 className="font-bold mb-1">Does not {title}</h4>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">{detail}</p>
    </div>
  );
}

function FileGroup({ title, color, files }: { title: string; color: string; files: string[] }) {
  const colorMap: Record<string, string> = {
    rose: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
    violet: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
    blue: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    amber: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  };
  return (
    <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
      <div className="flex items-center gap-2 mb-3">
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${colorMap[color] || colorMap.rose}`}>{title}</span>
      </div>
      <ul className="text-xs font-mono text-zinc-500 dark:text-zinc-400 space-y-1">
        {files.map((f) => (
          <li key={f}>{f}</li>
        ))}
      </ul>
    </div>
  );
}
