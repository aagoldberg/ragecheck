import Link from "next/link";

export default function SideLinesMethodology() {
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
            <Link href="/sidelines/pulse" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">Pulse</Link>
            <Link href="/sidelines/methodology" className="text-zinc-900 dark:text-zinc-100">Methodology</Link>
            <Link href="/sidelines/about" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">About</Link>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-12 md:py-20">
        <h1 className="text-4xl font-bold tracking-tight mb-4">Methodology</h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-12">
          How SideLines maps political communities and measures discourse dynamics on Bluesky.
        </p>

        {/* Purpose */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Purpose</h2>
          <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4">
            SideLines is a discourse health observatory. It continuously monitors the political
            conversation on Bluesky to answer: <strong>who are the communities participating in a
            discourse event, and how are they engaging with each other?</strong>
          </p>
          <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4">
            Traditional social media analysis starts from scratch for each event&mdash;searching for
            posts, building ad-hoc clusters, and labeling them &ldquo;Team A&rdquo; and &ldquo;Team B.&rdquo;
            This approach fails because interaction-only clusters rarely align with real ideological
            communities, and the small sample of event participants misses the broader structure.
          </p>
          <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
            SideLines takes the approach established in computational social science (Barber&aacute; 2015,
            Gustafson 2024, Salloum 2025): build a <strong>persistent follow graph</strong> of
            politically-active users, detect stable communities from follow patterns, characterize each
            community by its shared information sources, and then <strong>overlay</strong> specific
            discourse events onto this pre-existing community map.
          </p>
        </section>

        {/* Architecture Overview */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Architecture</h2>
          <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed mb-6">
            The system operates in two layers: a <strong>persistent global layer</strong> that grows
            over time and an <strong>event layer</strong> that captures specific discourse episodes.
          </p>

          <div className="p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl mb-6">
            <h3 className="font-bold text-lg mb-3 text-emerald-600 dark:text-emerald-400">Global Layer (persistent, always running)</h3>
            <ul className="text-zinc-600 dark:text-zinc-400 space-y-2 text-sm">
              <li><strong>Follow graph</strong> &mdash; Millions of follow relationships between politically-active Bluesky users</li>
              <li><strong>Post stream</strong> &mdash; Real-time collection of all posts from tracked users</li>
              <li><strong>Community map</strong> &mdash; Stable community assignments derived from follow patterns (not topic-specific)</li>
              <li><strong>Tracked user set</strong> &mdash; Grows via snowball sampling: accounts followed by many tracked users get added automatically</li>
            </ul>
          </div>

          <div className="p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
            <h3 className="font-bold text-lg mb-3 text-blue-600 dark:text-blue-400">Event Layer (per discourse event)</h3>
            <ul className="text-zinc-600 dark:text-zinc-400 space-y-2 text-sm">
              <li><strong>Event definition</strong> &mdash; Keywords, time window, and seed posts defining a discourse episode</li>
              <li><strong>Interaction graph</strong> &mdash; Directed graph of replies, quotes, and reposts between participants</li>
              <li><strong>Community overlay</strong> &mdash; Map each participant to their global community assignment</li>
              <li><strong>Health metrics</strong> &mdash; Per-community arousal, cross-community engagement, bridge users</li>
            </ul>
          </div>
        </section>

        {/* Data Collection */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Data Collection</h2>
          <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed mb-6">
            Three mechanisms keep the global follow graph current and growing:
          </p>

          <div className="space-y-4">
            <div className="flex gap-4 items-start">
              <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-sm flex-shrink-0">1</div>
              <div>
                <h3 className="font-bold text-lg mb-1">Jetstream Real-Time Stream</h3>
                <p className="text-zinc-600 dark:text-zinc-400">
                  A persistent WebSocket consumer subscribes to Bluesky&apos;s Jetstream firehose
                  (<code className="text-xs bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">wss://jetstream2.us-east.bsky.network/subscribe</code>)
                  for real-time follow and post events. No authentication required. The consumer
                  filters events for tracked users only and batch-writes to the database every 5 seconds.
                  Supports cursor-based resume on reconnect&mdash;no data loss during restarts.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-sm flex-shrink-0">2</div>
              <div>
                <h3 className="font-bold text-lg mb-1">Historical Backfill</h3>
                <p className="text-zinc-600 dark:text-zinc-400">
                  For newly-tracked users, we fetch their existing follow lists via the public
                  Bluesky API (<code className="text-xs bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">app.bsky.graph.getFollows</code>).
                  This one-time batch process captures the full follow history that predates our
                  Jetstream subscription. Subsequent changes are captured in real time.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-sm flex-shrink-0">3</div>
              <div>
                <h3 className="font-bold text-lg mb-1">Snowball Expansion</h3>
                <p className="text-zinc-600 dark:text-zinc-400">
                  The tracked user set grows automatically through snowball sampling. For each
                  account in the follow graph that is not yet tracked, we count how many existing
                  tracked users follow it. Accounts followed by 20 or more tracked users are added
                  to the tracked set. This threshold is the primary lever: higher values produce a
                  smaller, more central set; lower values produce broader coverage with more noise.
                  The top candidates are followed by thousands of tracked users; the cutoff ensures
                  we only add accounts with meaningful connections to the existing political graph.
                  The Jetstream consumer picks up new users within 5 minutes of addition.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-zinc-100 dark:bg-zinc-800/50 rounded-lg">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              <strong>Initial seed:</strong> The system was seeded with users from existing discourse
              events, supplemented by targeted searches for politically-active accounts. Starter packs
              (Lancaster & TU Darmstadt, 2025) provide additional seeding when available. The seed
              set is expanded continuously via the snowball mechanism above.
            </p>
          </div>
        </section>

        {/* Community Detection */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Global Community Detection</h2>
          <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed mb-6">
            Community structure is derived from the global follow graph, not from per-event
            interactions. This produces stable, interpretable communities that persist across
            discourse events.
          </p>

          <div className="space-y-4">
            <div className="flex gap-4 items-start">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-sm flex-shrink-0">1</div>
              <div>
                <h3 className="font-bold text-lg mb-1">Co-Follow Graph Construction</h3>
                <p className="text-zinc-600 dark:text-zinc-400">
                  For each pair of tracked users, compute the Jaccard similarity of their follow
                  lists: <code className="text-xs bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">J(A,B) = |A &cap; B| / |A &cup; B|</code>.
                  An inverted index maps each followed account to its followers for efficient
                  pairwise computation. Accounts followed by more than 50% of users are excluded
                  to prevent popular accounts from collapsing structure. Only pairs sharing at least
                  3 follows produce an edge.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-sm flex-shrink-0">2</div>
              <div>
                <h3 className="font-bold text-lg mb-1">Leiden Community Detection</h3>
                <p className="text-zinc-600 dark:text-zinc-400">
                  The Leiden algorithm (Traag et al., 2019) partitions the co-follow graph into
                  communities that maximize modularity. Leiden improves on Louvain by guaranteeing
                  well-connected communities. Parameters: ModularityVertexPartition, 10 iterations,
                  seed=42 for reproducibility. Edge weights are Jaccard similarities.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-sm flex-shrink-0">3</div>
              <div>
                <h3 className="font-bold text-lg mb-1">Community Characterization</h3>
                <p className="text-zinc-600 dark:text-zinc-400">
                  Each community is characterized by the accounts most frequently followed by its
                  members but not by other communities. The top 10 distinctive handles are passed
                  to an LLM (Claude Haiku) for a one-sentence name and description. Example:
                  &ldquo;Progressive News Consumers&mdash;Left-leaning users who follow major
                  news outlets and civil rights organizations.&rdquo;
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <strong>Why follow-based communities?</strong> Follow relationships are stable signals
              of ideological affinity (Barber&aacute; 2015). Unlike interaction clusters that shift
              with each topic, follow-based communities capture durable social structure. A user who
              follows the same news sources and commentators as another user is likely in the same
              political community, regardless of what they&apos;re currently arguing about.
            </p>
          </div>
        </section>

        {/* Event Analysis Pipeline */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Per-Event Analysis Pipeline</h2>
          <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed mb-6">
            When a discourse event is created, the following pipeline runs:
          </p>

          <div className="space-y-4">
            <div className="flex gap-4 items-start">
              <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center text-amber-600 dark:text-amber-400 font-bold text-sm flex-shrink-0">1</div>
              <div>
                <h3 className="font-bold text-lg mb-1">Ingest</h3>
                <p className="text-zinc-600 dark:text-zinc-400">
                  Search the Bluesky API for posts matching event keywords. Follow reply chains
                  and quote threads to build the full interaction graph. Each post is scored for
                  emotional arousal using lexicon matching.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center text-amber-600 dark:text-amber-400 font-bold text-sm flex-shrink-0">2</div>
              <div>
                <h3 className="font-bold text-lg mb-1">Graph Construction</h3>
                <p className="text-zinc-600 dark:text-zinc-400">
                  Build a directed graph where nodes are users and edges are replies, quotes,
                  or reposts. Edge weights reflect interaction frequency. Extract the giant
                  connected component for analysis.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center text-amber-600 dark:text-amber-400 font-bold text-sm flex-shrink-0">3</div>
              <div>
                <h3 className="font-bold text-lg mb-1">Community Overlay</h3>
                <p className="text-zinc-600 dark:text-zinc-400">
                  Map each event participant to their pre-existing global community assignment.
                  Compute per-community statistics: member count, post count, mean arousal, and
                  cross-community interaction rates. This instantly reveals which political
                  communities are engaged and how heated each one is.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center text-amber-600 dark:text-amber-400 font-bold text-sm flex-shrink-0">4</div>
              <div>
                <h3 className="font-bold text-lg mb-1">Health Metrics</h3>
                <p className="text-zinc-600 dark:text-zinc-400">
                  Compute discourse health metrics: base activation, cross-cluster contact,
                  bridge node identification, bridge churn, middle attrition, attack matrix,
                  and discourse temperature. These measure whether communities are engaging
                  constructively or polarizing.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Metric Definitions */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Metric Definitions</h2>

          <div className="space-y-6">
            <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
              <h3 className="font-bold text-lg mb-2 text-emerald-600 dark:text-emerald-400">Base Activation (0&ndash;100)</h3>
              <p className="text-zinc-600 dark:text-zinc-400 mb-2">
                Weighted average of within-cluster edge density multiplied by mean arousal per
                cluster. Measures how internally cohesive and emotionally activated each community is.
              </p>
              <p className="text-sm text-zinc-500 font-mono">
                BA = sum(density_c * mean_arousal_c * size_c) / total_size * 200
              </p>
            </div>

            <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
              <h3 className="font-bold text-lg mb-2 text-blue-600 dark:text-blue-400">Cross-Cluster Contact (0&ndash;100)</h3>
              <p className="text-zinc-600 dark:text-zinc-400 mb-2">
                Proportion of edges that connect different communities, weighted by the diversity
                of cluster pairs connected. Higher values mean more inter-community communication.
              </p>
              <p className="text-sm text-zinc-500 font-mono">
                CCC = 0.6 * (cross_edges / total_edges) + 0.4 * (active_dyads / possible_dyads)
              </p>
            </div>

            <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
              <h3 className="font-bold text-lg mb-2 text-amber-600 dark:text-amber-400">Bridge Churn (0&ndash;1)</h3>
              <p className="text-zinc-600 dark:text-zinc-400 mb-2">
                Fraction of yesterday&apos;s bridge nodes that are no longer bridges today. Bridge
                nodes have high betweenness centrality, neighbors in 2+ clusters, and
                below-median arousal. High churn indicates loss of moderating connectors.
              </p>
              <p className="text-sm text-zinc-500 font-mono">
                BC = |yesterday_bridges - today_bridges| / |yesterday_bridges|
              </p>
            </div>

            <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
              <h3 className="font-bold text-lg mb-2 text-red-600 dark:text-red-400">Middle Attrition (0&ndash;100)</h3>
              <p className="text-zinc-600 dark:text-zinc-400 mb-2">
                Composite score measuring the decline of moderate engagement. Combines three
                signals: bridge node decline (40%), cross-cluster contact decline (30%), and
                overall participation decline (30%).
              </p>
              <p className="text-sm text-zinc-500 font-mono">
                MA = 0.4 * bridge_decline + 0.3 * contact_decline + 0.3 * participation_decline
              </p>
            </div>

            <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
              <h3 className="font-bold text-lg mb-2">Discourse Temperature</h3>
              <p className="text-zinc-600 dark:text-zinc-400">
                Composite score integrating base activation, mean arousal, cross-cluster contact,
                and graph density into a single 0&ndash;100 reading. Labeled as Cold, Warm, Hot,
                or Boiling. Designed to give a quick read on whether a discourse event is heating
                up or cooling down.
              </p>
            </div>

            <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
              <h3 className="font-bold text-lg mb-2">Attack Matrix</h3>
              <p className="text-zinc-600 dark:text-zinc-400">
                Heatmap of cross-cluster edges where the source node has arousal &gt; 0.6.
                Shows which communities are directing high-arousal content at which other
                communities. Asymmetric: A attacking B does not imply B attacking A.
              </p>
            </div>
          </div>
        </section>

        {/* Post Scoring Models */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Post Scoring Models</h2>
          <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed mb-6">
            Each post is scored by a two-stage pipeline: a fast lexicon pre-score at ingestion time,
            followed by transformer-based multi-model scoring that runs every 2 minutes and overwrites
            the lexicon score with richer signals.
          </p>

          <h3 className="text-xl font-bold mb-4">Stage 1: Lexicon Pre-Score (instant)</h3>
          <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4">
            At ingestion, each post receives an arousal score (0&ndash;1) based on lexicon matching across seven
            dimensions, using the same curated word lists as RageCheck:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            {[
              { name: "Emotion (Anger/Fear/Disgust)", weight: "25%" },
              { name: "Urgency", weight: "15%" },
              { name: "Intensifiers", weight: "10%" },
              { name: "Moral Judgment", weight: "15%" },
              { name: "Purity/Contamination", weight: "10%" },
              { name: "Dehumanization", weight: "15%" },
              { name: "Absolutist Language", weight: "10%" },
            ].map((dim) => (
              <div
                key={dim.name}
                className="p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg flex justify-between"
              >
                <span className="text-sm">{dim.name}</span>
                <span className="text-sm text-zinc-500 font-mono">{dim.weight}</span>
              </div>
            ))}
          </div>

          <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed mb-6">
            Additional boosts for heavy punctuation (!!!) and ALL CAPS words.
            This stage is pure lexicon matching for speed (~5000 posts/sec) and serves as a fast
            fallback when transformer scoring is unavailable.
          </p>

          <h3 className="text-xl font-bold mb-4">Stage 2: Transformer Models (batch, every 2 min)</h3>
          <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed mb-6">
            A background task in the FastAPI worker batch-scores recent lexicon-scored posts using three
            ONNX transformer models. Models are loaded once at startup (~240 MB total RAM) and reused
            across all scoring cycles. If model inference fails, lexicon scores remain as fallback.
          </p>

          <div className="space-y-4 mb-6">
            <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
              <h4 className="font-bold text-lg mb-2 text-emerald-600 dark:text-emerald-400">Model 1: Emotion Detection</h4>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
                <code className="text-xs bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">j-hartmann/emotion-english-distilroberta-base</code>
              </p>
              <p className="text-zinc-600 dark:text-zinc-400 mb-2">
                Classifies each post into 7 emotion categories: anger, disgust, fear, joy, neutral, sadness,
                surprise. From these probabilities, we derive:
              </p>
              <ul className="text-sm text-zinc-600 dark:text-zinc-400 space-y-1 ml-4 list-disc">
                <li><strong>Arousal</strong> &mdash; Weighted sum using Russell&apos;s circumplex model (anger=0.95, fear=0.85, surprise=0.80, joy=0.70, disgust=0.60, sadness=0.20, neutral=0.05)</li>
                <li><strong>Valence</strong> &mdash; P(joy) + P(surprise)*0.5 - P(anger) - P(fear) - P(disgust) - P(sadness)*0.5, normalized to 0&ndash;1</li>
                <li><strong>Dominant emotion</strong> &mdash; The emotion with highest probability</li>
              </ul>
            </div>

            <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
              <h4 className="font-bold text-lg mb-2 text-red-600 dark:text-red-400">Model 2: Toxicity Detection</h4>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
                <code className="text-xs bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">unitary/toxic-bert</code>
              </p>
              <p className="text-zinc-600 dark:text-zinc-400">
                Multi-label classification across 6 toxicity categories: toxic, severe_toxic, obscene,
                threat, insult, identity_hate. The toxicity score is the maximum across all categories.
                Posts with toxicity &gt; 0.5 are flagged with a &ldquo;toxic&rdquo; badge.
              </p>
            </div>

            <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
              <h4 className="font-bold text-lg mb-2 text-violet-600 dark:text-violet-400">Model 3: Irony Detection</h4>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
                <code className="text-xs bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">cardiffnlp/twitter-roberta-base-irony</code>
              </p>
              <p className="text-zinc-600 dark:text-zinc-400">
                Binary classification (ironic vs. non-ironic). Flags posts where surface text may not match
                intent. Posts with irony probability &gt; 0.5 are flagged with an &ldquo;ironic&rdquo; badge.
                This helps identify cases where lexicon-based arousal may be misleading.
              </p>
            </div>
          </div>

          <h3 className="text-xl font-bold mb-4">Signal Storage</h3>
          <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4">
            All model outputs are stored in a <code className="text-xs bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">signals_json</code> JSONB
            column per post, containing the full emotion probability distribution, derived arousal and
            valence, dominant emotion, toxicity breakdown, and irony score. The transformer-derived
            arousal overwrites the lexicon score in the <code className="text-xs bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">arousal_score</code> column,
            keeping existing pulse queries working without changes.
          </p>

          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <strong>Why a two-stage pipeline?</strong> The Jetstream ingestion container stays lean and
              focused on real-time data collection. Transformer inference runs in the separate FastAPI
              worker container, which already has heavier dependencies. The 2-minute scoring delay is
              invisible on a dashboard that uses 30-minute windows. If model inference fails, ingestion
              continues unaffected with lexicon scores.
            </p>
          </div>
        </section>

        {/* Topic Grouping */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Topic Grouping</h2>
          <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed mb-6">
            Within each community, posts are grouped into topics and organized into conversation
            threads. This provides structure beyond a flat list of high-arousal posts, revealing
            what specific subjects are driving engagement.
          </p>

          <div className="space-y-4">
            <div className="flex gap-4 items-start">
              <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold text-sm flex-shrink-0">1</div>
              <div>
                <h3 className="font-bold text-lg mb-1">Top-Term Extraction</h3>
                <p className="text-zinc-600 dark:text-zinc-400">
                  Every 10 minutes, the pulse cycle tokenizes high-arousal posts per community,
                  removes stopwords, and selects the top 10 terms by frequency. These serve as the
                  keyword buckets for topic assignment. Tokenization uses simple whitespace splitting
                  with punctuation removal and a curated stopword list.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold text-sm flex-shrink-0">2</div>
              <div>
                <h3 className="font-bold text-lg mb-1">Thread Detection</h3>
                <p className="text-zinc-600 dark:text-zinc-400">
                  Posts are grouped into conversation threads using
                  the <code className="text-xs bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">reply_root_uri</code> field.
                  Posts sharing the same root URI form a thread. Posts with no root URI are standalone
                  originals. Within each thread, the root post (no <code className="text-xs bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">reply_parent_uri</code>)
                  is highlighted and replies are displayed indented beneath it.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold text-sm flex-shrink-0">3</div>
              <div>
                <h3 className="font-bold text-lg mb-1">Topic Assignment</h3>
                <p className="text-zinc-600 dark:text-zinc-400">
                  Each post or thread is assigned to the top-term with the highest keyword match
                  count. Threads are assigned based on the aggregate keyword matches across all posts
                  in the thread. Posts matching no top-terms are placed in an &ldquo;Other&rdquo; bucket.
                  Co-occurring terms (appearing together in &gt;50% of their posts) are merged into
                  a single topic bucket to prevent redundant categories.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold text-sm flex-shrink-0">4</div>
              <div>
                <h3 className="font-bold text-lg mb-1">Topic Labeling</h3>
                <p className="text-zinc-600 dark:text-zinc-400">
                  Each keyword group is labeled with a readable 2&ndash;4 word topic name generated
                  by Claude Haiku. Labels are cached in
                  the <code className="text-xs bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">bluesky_topic_labels</code> table
                  (keyed by sorted, comma-joined keyword sets) to avoid redundant LLM calls. An
                  in-memory cache provides a first-level lookup. Fallback: the primary keyword,
                  title-cased.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold text-sm flex-shrink-0">5</div>
              <div>
                <h3 className="font-bold text-lg mb-1">Original vs. Reply Distinction</h3>
                <p className="text-zinc-600 dark:text-zinc-400">
                  Posts are classified as originals or replies using
                  the <code className="text-xs bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">reply_parent_uri</code> and <code className="text-xs bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">reply_root_uri</code> fields
                  from the Bluesky AT Protocol. Original posts are displayed at full opacity, while
                  replies are indented and slightly muted. Quote posts
                  (with <code className="text-xs bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">quote_uri</code>)
                  are given a blockquote-style left border accent.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Technical Stack */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Technical Stack</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
              <h3 className="font-bold mb-2">Data Collection</h3>
              <ul className="text-sm text-zinc-600 dark:text-zinc-400 space-y-1">
                <li>Bluesky Jetstream (WebSocket firehose)</li>
                <li>Bluesky Public API (historical backfill)</li>
                <li>Python + websockets + httpx</li>
              </ul>
            </div>
            <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
              <h3 className="font-bold mb-2">Analysis</h3>
              <ul className="text-sm text-zinc-600 dark:text-zinc-400 space-y-1">
                <li>igraph (graph construction)</li>
                <li>leidenalg (community detection)</li>
                <li>NumPy (centrality, statistics)</li>
                <li>ONNX Runtime (transformer model inference)</li>
                <li>Claude Haiku (community labeling)</li>
              </ul>
            </div>
            <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
              <h3 className="font-bold mb-2">Infrastructure</h3>
              <ul className="text-sm text-zinc-600 dark:text-zinc-400 space-y-1">
                <li>Neon PostgreSQL (database)</li>
                <li>Railway (Python workers)</li>
                <li>Vercel (Next.js frontend)</li>
              </ul>
            </div>
            <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
              <h3 className="font-bold mb-2">Frontend</h3>
              <ul className="text-sm text-zinc-600 dark:text-zinc-400 space-y-1">
                <li>Next.js 15 (App Router)</li>
                <li>Tailwind CSS</li>
                <li>Custom SVG field visualization</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Confidence */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Confidence Rubric</h2>
          <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed mb-6">
            Each analysis run receives a confidence rating based on data quality:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="text-sm font-bold text-red-700 dark:text-red-400 mb-2">LOW</div>
              <ul className="text-xs text-red-600 dark:text-red-400 space-y-1">
                <li>&lt; 100 nodes</li>
                <li>&lt; 200 edges</li>
                <li>&lt; 2 clusters</li>
                <li>Single-day data</li>
              </ul>
            </div>
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <div className="text-sm font-bold text-amber-700 dark:text-amber-400 mb-2">MED</div>
              <ul className="text-xs text-amber-600 dark:text-amber-400 space-y-1">
                <li>100&ndash;500 nodes</li>
                <li>200&ndash;1000 edges</li>
                <li>2&ndash;3 clusters</li>
                <li>3+ days of data</li>
              </ul>
            </div>
            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
              <div className="text-sm font-bold text-emerald-700 dark:text-emerald-400 mb-2">HIGH</div>
              <ul className="text-xs text-emerald-600 dark:text-emerald-400 space-y-1">
                <li>500+ nodes</li>
                <li>1000+ edges</li>
                <li>3+ clusters</li>
                <li>7+ days of data</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Limitations */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Limitations</h2>
          <ul className="list-disc list-inside text-zinc-600 dark:text-zinc-400 space-y-2 ml-4">
            <li>Bluesky only&mdash;discourse on X/Twitter, Reddit, and other platforms is not captured</li>
            <li>The tracked user set starts from a seed and grows via snowball sampling, which may underrepresent communities not well-connected to the seed</li>
            <li>Follow-based communities are stable but may lag behind rapid realignment events</li>
            <li>Community characterization depends on LLM interpretation of top-followed handles, which may oversimplify</li>
            <li>While transformer models improve on lexicon scoring, irony and sarcasm detection remains imperfect&mdash;the irony model flags likely cases but does not adjust scores automatically</li>
            <li>Search API sampling may miss relevant posts, especially in high-volume events</li>
            <li>Community detection is sensitive to the Jaccard similarity threshold and minimum shared follow count</li>
            <li>Bridge node identification uses heuristics, not ground-truth moderation labels</li>
            <li>Day-over-day metrics require multiple collection runs to be meaningful</li>
            <li>No causal claims&mdash;correlation between metrics and real-world outcomes is unknown</li>
          </ul>
        </section>

        {/* References */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">References</h2>
          <ul className="text-zinc-600 dark:text-zinc-400 space-y-3 text-sm">
            <li className="pl-6 -indent-6">
              Barber&aacute;, P. (2015). Birds of the same feather tweet together: Bayesian ideal point
              estimation using Twitter data. <em>Political Analysis</em>, 23(1), 76&ndash;91.
            </li>
            <li className="pl-6 -indent-6">
              Brady, W.J., et al. (2017). Emotion shapes the diffusion of moralized content
              in social networks. <em>PNAS</em>, 114(28), 7313&ndash;7318.
            </li>
            <li className="pl-6 -indent-6">
              Freeman, L.C. (1977). A set of measures of centrality based on betweenness.
              <em>Sociometry</em>, 40(1), 35&ndash;41.
            </li>
            <li className="pl-6 -indent-6">
              Gustafson, A., et al. (2024). Mapping political communities on social media using
              follow network structure. <em>Journal of Quantitative Description</em>.
            </li>
            <li className="pl-6 -indent-6">
              Lancaster, J. & TU Darmstadt (2025). Starter packs and network formation on Bluesky:
              up to 43% of follows during peak periods originate from starter pack recommendations.
            </li>
            <li className="pl-6 -indent-6">
              Salloum, R., et al. (2025). Community detection in political social networks:
              follow graphs as stable proxies for ideological alignment.
            </li>
            <li className="pl-6 -indent-6">
              Traag, V.A., Waltman, L., & van Eck, N.J. (2019). From Louvain to Leiden:
              guaranteeing well-connected communities. <em>Scientific Reports</em>, 9(1), 5233.
            </li>
          </ul>
        </section>

        {/* Back link */}
        <div className="pt-8 border-t border-zinc-200 dark:border-zinc-800">
          <Link
            href="/sidelines"
            className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium"
          >
            &larr; Back to SideLines
          </Link>
        </div>
      </div>
    </div>
  );
}
