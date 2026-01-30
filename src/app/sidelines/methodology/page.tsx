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
            <Link href="/sidelines/methodology" className="text-zinc-900 dark:text-zinc-100">Methodology</Link>
            <Link href="/sidelines/about" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">About</Link>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-12 md:py-20">
        <h1 className="text-4xl font-bold tracking-tight mb-4">Methodology</h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-12">
          How SideLines measures political discourse dynamics.
        </p>

        {/* Pipeline */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Analysis Pipeline</h2>
          <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed mb-6">
            SideLines processes discourse events through a multi-stage pipeline:
          </p>

          <div className="space-y-4">
            <div className="flex gap-4 items-start">
              <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-sm flex-shrink-0">1</div>
              <div>
                <h3 className="font-bold text-lg mb-1">Event Definition</h3>
                <p className="text-zinc-600 dark:text-zinc-400">
                  Define a discourse event with keywords, time window, and optional seed posts.
                  Events are bounded by time and topic to create focused interaction subgraphs.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-sm flex-shrink-0">2</div>
              <div>
                <h3 className="font-bold text-lg mb-1">Data Collection</h3>
                <p className="text-zinc-600 dark:text-zinc-400">
                  Search the Bluesky public API for matching posts. Follow reply chains and quote
                  threads to build the full interaction graph. Each post is scored for arousal
                  using RageCheck&apos;s curated lexicons.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-sm flex-shrink-0">3</div>
              <div>
                <h3 className="font-bold text-lg mb-1">Graph Construction</h3>
                <p className="text-zinc-600 dark:text-zinc-400">
                  Build a directed interaction graph where nodes are users and edges are
                  replies, quotes, or reposts. Edge weights reflect interaction frequency.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-sm flex-shrink-0">4</div>
              <div>
                <h3 className="font-bold text-lg mb-1">Community Detection</h3>
                <p className="text-zinc-600 dark:text-zinc-400">
                  Leiden algorithm (Traag et al., 2019) identifies densely-connected communities.
                  Resolution parameter = 1.0 for default granularity. Communities are structural,
                  not ideological.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-sm flex-shrink-0">5</div>
              <div>
                <h3 className="font-bold text-lg mb-1">Metric Computation</h3>
                <p className="text-zinc-600 dark:text-zinc-400">
                  Compute betweenness centrality, cross-cluster edge ratios, bridge node
                  identification, and attack matrix from the annotated graph.
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
              <h3 className="font-bold text-lg mb-2 text-emerald-600 dark:text-emerald-400">Base Activation (0-100)</h3>
              <p className="text-zinc-600 dark:text-zinc-400 mb-2">
                Weighted average of within-cluster edge density multiplied by mean arousal per
                cluster. Measures how internally cohesive and emotionally activated each community is.
              </p>
              <p className="text-sm text-zinc-500 font-mono">
                BA = sum(density_c * mean_arousal_c * size_c) / total_size * 200
              </p>
            </div>

            <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
              <h3 className="font-bold text-lg mb-2 text-blue-600 dark:text-blue-400">Cross-Cluster Contact (0-100)</h3>
              <p className="text-zinc-600 dark:text-zinc-400 mb-2">
                Proportion of edges that connect different communities, weighted by the diversity
                of cluster pairs connected. Higher values mean more inter-community communication.
              </p>
              <p className="text-sm text-zinc-500 font-mono">
                CCC = 0.6 * (cross_edges / total_edges) + 0.4 * (active_dyads / possible_dyads)
              </p>
            </div>

            <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
              <h3 className="font-bold text-lg mb-2 text-amber-600 dark:text-amber-400">Bridge Churn (0-1)</h3>
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
              <h3 className="font-bold text-lg mb-2 text-red-600 dark:text-red-400">Middle Attrition (0-100)</h3>
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
              <h3 className="font-bold text-lg mb-2">Attack Matrix</h3>
              <p className="text-zinc-600 dark:text-zinc-400">
                Heatmap of cross-cluster edges where the source node has arousal &gt; 0.6.
                Shows which communities are directing high-arousal content at which other
                communities. Asymmetric: A attacking B does not imply B attacking A.
              </p>
            </div>
          </div>
        </section>

        {/* Arousal Scoring */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Arousal Scoring</h2>
          <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4">
            Each post receives an arousal score (0-1) based on lexicon matching across seven
            dimensions, using the same curated word lists as RageCheck:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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

          <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed mt-4">
            Additional boosts for heavy punctuation (!!!) and ALL CAPS words.
            No LLM is involved—scoring is pure lexicon matching for speed (~5000 posts/sec).
          </p>
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
                <li>100-500 nodes</li>
                <li>200-1000 edges</li>
                <li>2-3 clusters</li>
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
            <li>Bluesky only (Phase 1) — discourse on other platforms is not captured</li>
            <li>Search API sampling may miss relevant posts, especially in high-volume events</li>
            <li>Community detection is sensitive to resolution parameter choice</li>
            <li>Lexicon-based arousal scoring misses sarcasm, irony, and context-dependent tone</li>
            <li>Bridge node identification uses heuristics, not ground-truth moderation labels</li>
            <li>Repost edges do not carry text, so they contribute to graph structure without arousal</li>
            <li>Day-over-day metrics require multiple collection runs to be meaningful</li>
            <li>No causal claims — correlation between metrics and real-world outcomes is unknown</li>
          </ul>
        </section>

        {/* References */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">References</h2>
          <ul className="list-disc list-inside text-zinc-600 dark:text-zinc-400 space-y-2 ml-4">
            <li>
              Traag, V.A., Waltman, L., & van Eck, N.J. (2019). From Louvain to Leiden:
              guaranteeing well-connected communities. <em>Scientific Reports</em>, 9(1), 5233.
            </li>
            <li>
              Freeman, L.C. (1977). A set of measures of centrality based on betweenness.
              <em> Sociometry</em>, 40(1), 35-41.
            </li>
            <li>
              Brady, W.J., et al. (2017). Emotion shapes the diffusion of moralized content
              in social networks. <em>PNAS</em>, 114(28), 7313-7318.
            </li>
          </ul>
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
