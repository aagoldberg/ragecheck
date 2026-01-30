import Link from "next/link";

export default function SideLinesPrototype() {
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
            <Link href="/sidelines" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">Dashboard</Link>
            <Link href="/sidelines/prototype" className="text-zinc-900 dark:text-zinc-100">Prototype</Link>
            <Link href="/sidelines/methodology" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">Methodology</Link>
            <Link href="/sidelines/about" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">About</Link>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-12 md:py-20">
        <h1 className="text-4xl font-bold tracking-tight mb-4">SideLines: Architecture &amp; Strategy</h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-4">
          Measuring the sporting dynamics of political discourse via event-bounded social network subgraphs.
        </p>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-12">
          Phase 1 prototype. Bluesky only. Hybrid TypeScript/Python architecture.
        </p>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* THE THESIS                                                        */}
        {/* ═══════════════════════════════════════════════════════════════════ */}

        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-4">The Thesis</h2>
          <div className="p-6 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl mb-6">
            <p className="text-sm text-emerald-800 dark:text-emerald-300 leading-relaxed mb-3">
              Political discourse has <span className="font-bold">sporting dynamics</span> — teams form, rivalries
              intensify, moderators get pushed out, and the middle collapses. These dynamics are
              <span className="font-bold"> structurally observable</span> in social interaction graphs
              without needing to classify anyone&apos;s ideology.
            </p>
            <p className="text-sm text-emerald-800 dark:text-emerald-300 leading-relaxed">
              RageCheck scores <span className="font-bold">individual texts</span> for manipulation. ClearView tracks
              how <span className="font-bold">media outlets</span> frame stories. SideLines measures how
              <span className="font-bold"> communities interact</span> around political events — the graph layer
              that neither tool touches.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
              <div className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">RageCheck</div>
              <div className="text-sm font-bold mb-1">Text Signal</div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Is this article manipulative? Lexicon + bar scoring on individual text.</p>
            </div>
            <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
              <div className="text-xs font-bold uppercase tracking-widest text-indigo-500 mb-2">ClearView</div>
              <div className="text-sm font-bold mb-1">Framing Signal</div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">How are different outlets framing the same story? Cross-source synthesis.</p>
            </div>
            <div className="p-4 bg-white dark:bg-zinc-900 border border-emerald-200 dark:border-emerald-800 rounded-xl">
              <div className="text-xs font-bold uppercase tracking-widest text-emerald-500 mb-2">SideLines</div>
              <div className="text-sm font-bold mb-1">Graph Signal</div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">How are communities interacting? Who bridges them? Is the middle holding?</p>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* WHY GRAPHS                                                        */}
        {/* ═══════════════════════════════════════════════════════════════════ */}

        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-4">Why Graph Analysis</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-6">
            Text analysis tells you <em>what</em> is being said. Graph analysis tells you <em>how communities are
            structured</em> around what&apos;s being said. Three things you can only see in the graph:
          </p>

          <div className="space-y-4">
            <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
              <h3 className="font-bold text-lg mb-2">1. Community Formation Without Ideology Labels</h3>
              <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">
                Leiden clustering detects communities by <span className="font-semibold">interaction density</span>,
                not by guessing who&apos;s left or right. Two people who argue constantly are
                &ldquo;interacting&rdquo; — the algorithm puts them in the same community if they argue
                with each other more than with outsiders. This is structurally honest: the graph doesn&apos;t
                know or care about politics.
              </p>
            </div>

            <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
              <h3 className="font-bold text-lg mb-2">2. Bridge Nodes — The Structural Middle</h3>
              <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">
                In any polarized graph, there are nodes with high betweenness centrality that
                connect multiple communities while maintaining lower emotional arousal. These are the
                <span className="font-semibold"> structural moderators</span> — not necessarily centrists,
                but people whose network position bridges divides. When they leave, the graph
                structurally fragments. You can track this day-over-day.
              </p>
            </div>

            <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
              <h3 className="font-bold text-lg mb-2">3. Attack Directionality</h3>
              <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">
                The attack matrix shows which communities are directing high-arousal content at
                which other communities. This is <span className="font-semibold">asymmetric</span> —
                Community A attacking Community B at 0.8 arousal while B responds at 0.3 tells you
                something that no amount of text analysis on individual posts reveals. It&apos;s a structural
                property of the interaction graph.
              </p>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* ARCHITECTURE                                                      */}
        {/* ═══════════════════════════════════════════════════════════════════ */}

        <div className="mb-8 mt-20 flex items-center gap-3">
          <div className="text-xs font-bold uppercase tracking-widest text-emerald-500 bg-emerald-100 dark:bg-emerald-900/30 px-3 py-1 rounded-full">System</div>
          <h2 className="text-3xl font-bold">Architecture</h2>
        </div>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-10">
          Hybrid TypeScript/Python. Product logic in TS (UI, API, ingestion, arousal scoring). Heavy
          graph math in Python (igraph, Leiden, betweenness). Connected via HTTP.
        </p>

        <section className="mb-16">
          <h3 className="text-xl font-bold mb-4">Why Hybrid</h3>
          <div className="p-5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl mb-6">
            <p className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed">
              <span className="font-bold">The constraint:</span> igraph + leidenalg are C-backed Python libraries with
              no JavaScript equivalent at comparable performance. graphology-communities exists but uses Louvain
              (not Leiden), has no approximate betweenness, and would add ~2MB to the Next.js bundle for a single
              subapp. The right boundary is clear: keep the product in TypeScript, ship the math to Python.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
              <div className="text-xs font-bold uppercase tracking-widest text-blue-500 mb-2">Vercel (Next.js)</div>
              <p className="text-sm font-semibold mb-2">TypeScript — Product</p>
              <ul className="text-xs text-zinc-500 dark:text-zinc-400 space-y-1">
                <li>UI pages (React, Tailwind)</li>
                <li>API routes (event CRUD)</li>
                <li>Bluesky collector (fetch + rate limit)</li>
                <li>Arousal scoring (reuses RageCheck lexicons)</li>
                <li>Triggers analysis via HTTP</li>
              </ul>
            </div>
            <div className="p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
              <div className="text-xs font-bold uppercase tracking-widest text-violet-500 mb-2">Railway (Python)</div>
              <p className="text-sm font-semibold mb-2">Python — Graph Math</p>
              <ul className="text-xs text-zinc-500 dark:text-zinc-400 space-y-1">
                <li>FastAPI with /analyze endpoint</li>
                <li>igraph graph construction</li>
                <li>Leiden community detection</li>
                <li>Approximate betweenness centrality</li>
                <li>All metric computations</li>
                <li>Writes results directly to Neon</li>
              </ul>
            </div>
            <div className="p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
              <div className="text-xs font-bold uppercase tracking-widest text-emerald-500 mb-2">Neon PostgreSQL</div>
              <p className="text-sm font-semibold mb-2">Shared Database</p>
              <ul className="text-xs text-zinc-500 dark:text-zinc-400 space-y-1">
                <li>7 sidelines_* tables</li>
                <li>Shared with RageCheck + ClearView</li>
                <li>Both TS and Python read/write</li>
                <li>JSONB for flexible metrics</li>
                <li>Unique constraints for idempotency</li>
              </ul>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* DATA PIPELINE                                                     */}
        {/* ═══════════════════════════════════════════════════════════════════ */}

        <section className="mb-16">
          <h3 className="text-xl font-bold mb-4">Data Pipeline</h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
            Five stages. First three run on Vercel (TypeScript). Last two run on Railway (Python).
          </p>

          <div className="space-y-3">
            <PipelineStep
              n={1}
              title="Event Definition"
              runtime="Vercel"
              detail="User defines: name, keywords, time window, seed posts. Creates event in DB with status 'draft'. Bounded by time and topic — no open-ended crawling."
              output="sidelines_events row"
            />
            <PipelineStep
              n={2}
              title="Bluesky Collection"
              runtime="Vercel (max 300s)"
              detail="Search app.bsky.feed.searchPosts for keywords. Follow reply chains via getPostThread. Extract edges: reply-to, quote, repost. Rate limited to 120ms/req. Hard cap: 10K posts or 250s elapsed."
              output="sidelines_posts, sidelines_users, sidelines_interactions"
            />
            <PipelineStep
              n={3}
              title="Arousal Scoring"
              runtime="Vercel (inline)"
              detail="Each post scored on insert via computeArousal(). 7-component lexicon match reusing RageCheck word lists. ~5000 posts/sec. Score + breakdown stored on the post row."
              output="arousal_score + arousal_breakdown on each post"
            />

            <div className="flex items-center gap-3 py-2">
              <div className="flex-1 border-t border-dashed border-zinc-300 dark:border-zinc-700" />
              <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">HTTP boundary</span>
              <div className="flex-1 border-t border-dashed border-zinc-300 dark:border-zinc-700" />
            </div>

            <PipelineStep
              n={4}
              title="Graph Construction + Community Detection"
              runtime="Railway (Python)"
              detail="Build directed igraph from users (nodes) and interactions (edges). Node attribute: mean arousal. Run Leiden (resolution=1.0, 10 iterations, seed=42) on undirected projection. Compute approximate betweenness centrality (cutoff=100 for graphs > 200 nodes)."
              output="Partition membership, betweenness scores"
            />
            <PipelineStep
              n={5}
              title="Metric Computation + Storage"
              runtime="Railway (Python)"
              detail="Compute all metrics from annotated graph + partition. Write daily_metrics (JSONB), cluster_assignments, user_features to Neon. Assess confidence. Update event status to 'ready'."
              output="sidelines_daily_metrics, sidelines_cluster_assignments, sidelines_user_features"
            />
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* THE FOUR METRICS                                                  */}
        {/* ═══════════════════════════════════════════════════════════════════ */}

        <div className="mb-8 mt-20 flex items-center gap-3">
          <div className="text-xs font-bold uppercase tracking-widest text-emerald-500 bg-emerald-100 dark:bg-emerald-900/30 px-3 py-1 rounded-full">Metrics</div>
          <h2 className="text-3xl font-bold">The Four Core Metrics</h2>
        </div>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-10">
          Each metric captures a different structural dimension of discourse dynamics.
          Together they form a &ldquo;game state&rdquo; — are the teams activating, is contact
          increasing or decreasing, are the bridges holding.
        </p>

        <section className="mb-16 space-y-6">
          <MetricBlock
            color="emerald"
            name="Base Activation"
            range="0-100"
            formula="sum(density_c * mean_arousal_c * size_c) / total_size * 200"
            what="How internally cohesive and emotionally activated each community is."
            why="High activation = tightly-knit communities producing high-arousal content. This is the 'team energy' metric. A calm, loosely-connected graph scores low. A dense graph full of furious posts scores high."
            reads="Within-cluster edge density (from graph) + mean arousal per cluster (from lexicon scores)"
          />
          <MetricBlock
            color="blue"
            name="Cross-Cluster Contact"
            range="0-100"
            formula="0.6 * (cross_edges / total_edges) + 0.4 * (active_dyads / possible_dyads)"
            what="How much inter-community communication is happening."
            why="High contact isn't inherently good or bad. It can mean constructive dialogue or it can mean cross-community attacks. The attack matrix disambiguates. But declining contact is a polarization signal — communities retreating into their own echo chambers."
            reads="Proportion of edges crossing cluster boundaries + diversity of cluster pairs connected"
          />
          <MetricBlock
            color="amber"
            name="Bridge Churn"
            range="0-1"
            formula="|yesterday_bridges - today_bridges| / |yesterday_bridges|"
            what="Fraction of yesterday's bridge nodes that are no longer bridges today."
            why="Bridge nodes are the structural middle — high betweenness, neighbors in 2+ clusters, below-median arousal. When bridges churn out, it means the people who were connecting communities have either left, been pushed out, or been radicalized above the arousal median. This is the most direct 'middle collapse' signal."
            reads="Day-over-day comparison of bridge node sets (requires multiple analysis runs)"
          />
          <MetricBlock
            color="red"
            name="Middle Attrition"
            range="0-100"
            formula="0.4 * bridge_decline + 0.3 * contact_decline + 0.3 * participation_decline"
            what="Composite score measuring erosion of moderate engagement."
            why="A single metric that says 'the middle is eroding.' Combines three signals: bridge nodes leaving (40%), cross-cluster contact declining (30%), and overall participation dropping (30%). When all three move together, it's a strong structural signal."
            reads="Day-over-day deltas for bridge count, contact rate, and total node count"
          />
        </section>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* SUPPORTING OUTPUTS                                                */}
        {/* ═══════════════════════════════════════════════════════════════════ */}

        <section className="mb-16">
          <h3 className="text-xl font-bold mb-4">Supporting Outputs</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
              <h4 className="font-bold mb-2">Attack Matrix</h4>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-2">
                Heatmap of cross-cluster edges where source arousal &gt; 0.6. Asymmetric: A attacking B
                does not imply B attacking A. Shows directed aggression patterns between communities.
              </p>
              <p className="text-xs text-zinc-400 font-mono">Per cell: edge_count + mean_arousal</p>
            </div>
            <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
              <h4 className="font-bold mb-2">Play-by-Play</h4>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-2">
                Top posts ranked by arousal score with author handle and arousal bar. Ground truth for
                what the arousal scorer is detecting. Users can verify whether the scoring matches
                their intuition.
              </p>
              <p className="text-xs text-zinc-400 font-mono">Top 30-50 posts, sorted by arousal DESC</p>
            </div>
            <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
              <h4 className="font-bold mb-2">Cluster View</h4>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-2">
                Cluster sizes + top members by betweenness centrality. Shows the community structure
                without ideological labels. Users can inspect whether the clustering makes sense by
                looking at who&apos;s in each group.
              </p>
              <p className="text-xs text-zinc-400 font-mono">Per cluster: member count + top handles</p>
            </div>
            <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
              <h4 className="font-bold mb-2">Confidence Badge</h4>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-2">
                LOW/MED/HIGH based on node count, edge count, cluster count, days of data, and
                sampling status. Prevents over-interpreting thin data. Most single-day Bluesky
                events will be LOW or MED.
              </p>
              <p className="text-xs text-zinc-400 font-mono">HIGH requires 500+ nodes, 1000+ edges, 3+ clusters, 7+ days</p>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* DATABASE SCHEMA                                                   */}
        {/* ═══════════════════════════════════════════════════════════════════ */}

        <div className="mb-8 mt-20 flex items-center gap-3">
          <div className="text-xs font-bold uppercase tracking-widest text-violet-500 bg-violet-100 dark:bg-violet-900/30 px-3 py-1 rounded-full">Schema</div>
          <h2 className="text-3xl font-bold">Database Schema</h2>
        </div>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-10">
          7 tables. All prefixed <code className="text-xs bg-zinc-100 dark:bg-zinc-800 px-1 rounded">sidelines_</code>.
          Shared Neon instance with RageCheck + ClearView. Auto-created on first API call.
        </p>

        <section className="mb-16">
          <SchemaTable tables={[
            {
              name: "sidelines_events",
              desc: "Event definitions",
              cols: "id, name, description, platform, keywords[], seed_post_uris[], start_ts, end_ts, status, created_at",
              uniq: "Primary key: id",
            },
            {
              name: "sidelines_posts",
              desc: "Collected posts with arousal",
              cols: "id, event_id, platform, uri, author_did, author_handle, text, created_at, raw_json, arousal_score, arousal_breakdown",
              uniq: "UNIQUE(event_id, uri)",
            },
            {
              name: "sidelines_users",
              desc: "Users within event subgraphs",
              cols: "id, event_id, platform, did, handle, display_name, follower_count",
              uniq: "UNIQUE(event_id, did)",
            },
            {
              name: "sidelines_interactions",
              desc: "Edges between users",
              cols: "id, event_id, type[reply|quote|repost], src_user_id, dst_user_id, post_uri, parent_uri, created_at, weight",
              uniq: "FK: src_user_id, dst_user_id -> sidelines_users",
            },
            {
              name: "sidelines_daily_metrics",
              desc: "Computed metrics per day",
              cols: "event_id, day, metrics_json (JSONB), confidence",
              uniq: "UNIQUE(event_id, day)",
            },
            {
              name: "sidelines_cluster_assignments",
              desc: "Leiden community assignments",
              cols: "event_id, day, user_id, cluster_id, score",
              uniq: "UNIQUE(event_id, day, user_id)",
            },
            {
              name: "sidelines_user_features",
              desc: "Per-user feature vectors",
              cols: "event_id, day, user_id, arousal_mean, arousal_p95, post_count, in_degree, out_degree, betweenness",
              uniq: "UNIQUE(event_id, day, user_id)",
            },
          ]} />
        </section>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* AROUSAL SCORING                                                   */}
        {/* ═══════════════════════════════════════════════════════════════════ */}

        <div className="mb-8 mt-20 flex items-center gap-3">
          <div className="text-xs font-bold uppercase tracking-widest text-rose-500 bg-rose-100 dark:bg-rose-900/30 px-3 py-1 rounded-full">Signal</div>
          <h2 className="text-3xl font-bold">Arousal Scoring</h2>
        </div>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-10">
          Reuses RageCheck&apos;s curated lexicons. No LLM. Pure computation. 7 weighted components.
          The same word lists that score individual articles for ragebait now annotate every node in
          the interaction graph.
        </p>

        <section className="mb-16">
          <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
            <div className="px-4 py-3 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
              <span className="text-sm font-semibold">7 Arousal Components (weights sum to 1.0)</span>
            </div>
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
              {[
                { name: "Emotion (Anger/Fear/Disgust)", weight: 0.25, source: "EMOTION_ANGER_FEAR_DISGUST", examples: "furious, terrified, disgusting, appalling" },
                { name: "Moral Judgment", weight: 0.15, source: "MORAL_JUDGMENT_TERMS", examples: "traitor, evil, corrupt, deplorable" },
                { name: "Dehumanization", weight: 0.15, source: "DEHUMANIZATION_TERMS", examples: "vermin, parasites, subhuman, sheeple" },
                { name: "Urgency", weight: 0.15, source: "URGENCY_WORDS", examples: "breaking, must see, act now, crisis" },
                { name: "Intensifiers", weight: 0.10, source: "INTENSIFIERS", examples: "literally, absolutely, insanely, utterly" },
                { name: "Purity/Contamination", weight: 0.10, source: "PURITY_CONTAMINATION", examples: "poison, infected, corrupt, contaminate" },
                { name: "Absolutist Language", weight: 0.10, source: "ABSOLUTIST_TERMS", examples: "always, never, everyone, impossible" },
              ].map((c) => (
                <div key={c.name} className="px-4 py-3 flex items-center gap-3 text-sm bg-white dark:bg-zinc-900/50">
                  <span className="font-medium w-52 flex-shrink-0">{c.name}</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-mono text-xs w-12 flex-shrink-0">{(c.weight * 100).toFixed(0)}%</span>
                  <code className="text-xs text-zinc-400 w-52 flex-shrink-0">{c.source}</code>
                  <span className="text-xs text-zinc-400 italic truncate">{c.examples}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 grid md:grid-cols-2 gap-4">
            <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
              <h4 className="font-bold text-sm mb-2">Additional Boosts</h4>
              <ul className="text-xs text-zinc-500 dark:text-zinc-400 space-y-1">
                <li>ALL CAPS ratio &gt; 30% → +0.05</li>
                <li>Punctuation intensity (!!!, ?!) → up to +0.10</li>
              </ul>
            </div>
            <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
              <h4 className="font-bold text-sm mb-2">Scoring Curve</h4>
              <ul className="text-xs text-zinc-500 dark:text-zinc-400 space-y-1">
                <li>1 lexicon match → 0.3</li>
                <li>2 matches → 0.5</li>
                <li>3 matches → 0.7</li>
                <li>4+ matches → 0.7 + density bonus (up to 1.0)</li>
              </ul>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* BLUESKY COLLECTOR                                                 */}
        {/* ═══════════════════════════════════════════════════════════════════ */}

        <div className="mb-8 mt-20 flex items-center gap-3">
          <div className="text-xs font-bold uppercase tracking-widest text-blue-500 bg-blue-100 dark:bg-blue-900/30 px-3 py-1 rounded-full">Ingestion</div>
          <h2 className="text-3xl font-bold">Bluesky Collector</h2>
        </div>

        <section className="mb-16">
          <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-6">
            Three-phase collection within a single Vercel function invocation (max 300s).
            All public API — no authentication required.
          </p>

          <div className="space-y-4">
            <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold uppercase tracking-widest text-blue-500">Phase 1</span>
                <span className="font-bold text-sm">Keyword Search</span>
              </div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                <code className="text-xs bg-zinc-100 dark:bg-zinc-800 px-1 rounded">app.bsky.feed.searchPosts</code> for
                each keyword within the event&apos;s time window. Pagination up to 20 pages per keyword.
                Each result processed: UPSERT post, ensure user, extract reply/quote edges.
              </p>
            </div>

            <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold uppercase tracking-widest text-blue-500">Phase 2</span>
                <span className="font-bold text-sm">Seed Thread Following</span>
              </div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                <code className="text-xs bg-zinc-100 dark:bg-zinc-800 px-1 rounded">app.bsky.feed.getPostThread</code> for
                each seed URI. Recursively extracts all replies (depth 6). Captures the full conversation
                tree around known starting points.
              </p>
            </div>

            <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold uppercase tracking-widest text-blue-500">Phase 3</span>
                <span className="font-bold text-sm">Reply Chain Expansion</span>
              </div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Follow threads of first 50 collected posts to expand the subgraph. Captures second-order
                interactions that keyword search misses.
              </p>
            </div>
          </div>

          <div className="mt-6 grid md:grid-cols-4 gap-3">
            <Stat label="Rate Limit" value="120ms/req" detail="~2500 req/5min, under 3000 cap" />
            <Stat label="Post Cap" value="10,000" detail="Hard maximum per collection run" />
            <Stat label="Time Cap" value="250s" detail="50s buffer before 300s Vercel timeout" />
            <Stat label="Edge Types" value="3" detail="Reply, Quote, Repost" />
          </div>

          <div className="mt-6 p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
            <h4 className="font-bold text-sm mb-2">Edge Extraction</h4>
            <div className="grid md:grid-cols-3 gap-3">
              <div className="text-xs text-zinc-500 dark:text-zinc-400">
                <span className="font-semibold text-zinc-700 dark:text-zinc-300">Reply:</span> record.reply.parent.uri → extract DID → edge (author → parent_author)
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">
                <span className="font-semibold text-zinc-700 dark:text-zinc-300">Quote:</span> embed.record.uri (when $type = app.bsky.embed.record) → edge (author → quoted_author)
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">
                <span className="font-semibold text-zinc-700 dark:text-zinc-300">Self-loops:</span> Excluded. No edge when author DID = target DID.
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* GRAPH ANALYSIS                                                    */}
        {/* ═══════════════════════════════════════════════════════════════════ */}

        <div className="mb-8 mt-20 flex items-center gap-3">
          <div className="text-xs font-bold uppercase tracking-widest text-violet-500 bg-violet-100 dark:bg-violet-900/30 px-3 py-1 rounded-full">Analysis</div>
          <h2 className="text-3xl font-bold">Graph Analysis (Python)</h2>
        </div>

        <section className="mb-16">
          <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-6">
            Single POST to <code className="text-xs bg-zinc-100 dark:bg-zinc-800 px-1 rounded">/analyze</code>
            triggers the full pipeline. Reads from Neon, computes everything, writes back to Neon.
          </p>

          <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
            <div className="px-4 py-3 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
              <span className="text-sm font-semibold">Python Dependencies</span>
            </div>
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
              {[
                { pkg: "igraph", role: "Graph construction, betweenness centrality, subgraph operations" },
                { pkg: "leidenalg", role: "Leiden community detection (Traag et al., 2019)" },
                { pkg: "numpy", role: "Mean, median, percentile, array operations" },
                { pkg: "FastAPI", role: "HTTP server with Pydantic request/response models" },
                { pkg: "psycopg2-binary", role: "Direct PostgreSQL access to shared Neon database" },
                { pkg: "uvicorn", role: "ASGI server for production deployment" },
              ].map((d) => (
                <div key={d.pkg} className="px-4 py-2.5 flex items-center gap-3 text-sm bg-white dark:bg-zinc-900/50">
                  <code className="font-mono text-emerald-600 dark:text-emerald-400 w-32 flex-shrink-0">{d.pkg}</code>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">{d.role}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 p-4 bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800 rounded-xl">
            <p className="text-sm text-violet-800 dark:text-violet-300 leading-relaxed">
              <span className="font-bold">Leiden vs Louvain:</span> Leiden guarantees well-connected communities
              (no disconnected sub-communities), converges faster, and is provably optimal for modularity.
              Louvain can produce badly-connected communities where nodes in the same community have no path
              between them through the community — this breaks all downstream metrics.
            </p>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* STRATEGY & PHASES                                                 */}
        {/* ═══════════════════════════════════════════════════════════════════ */}

        <div className="mb-8 mt-20 flex items-center gap-3">
          <div className="text-xs font-bold uppercase tracking-widest text-amber-500 bg-amber-100 dark:bg-amber-900/30 px-3 py-1 rounded-full">Strategy</div>
          <h2 className="text-3xl font-bold">Phases &amp; Roadmap</h2>
        </div>

        <section className="mb-16">
          <div className="space-y-4">
            <PhaseCard
              phase="1"
              status="Built"
              title="Bluesky Single-Platform"
              items={[
                "Manual event creation (keywords + time window)",
                "Bluesky public API collection (no auth)",
                "Lexicon-based arousal scoring (reuses RageCheck)",
                "Leiden community detection + betweenness centrality",
                "4 core metrics + attack matrix + confidence",
                "Full UI dashboard with timeline, clusters, play-by-play",
              ]}
            />
            <PhaseCard
              phase="2"
              status="Planned"
              title="Multi-Event Comparison"
              items={[
                "Side-by-side comparison of two events' metric trajectories",
                "Normalized metrics for different graph sizes",
                "Automated daily collection via cron (Vercel cron triggers ingest + analyze)",
                "Metric alerts: bridge churn > 0.5, middle attrition > 60",
              ]}
            />
            <PhaseCard
              phase="3"
              status="Future"
              title="Multi-Platform + Richer Graphs"
              items={[
                "Reddit comment trees (public API, rich threading structure)",
                "Cross-platform identity matching (handle-based heuristic)",
                "Weighted edges (reply weight > repost weight)",
                "Temporal slicing: intra-day metric evolution",
                "LLM-annotated cluster summaries (what is this community about?)",
              ]}
            />
            <PhaseCard
              phase="4"
              status="Future"
              title="Research & Validation"
              items={[
                "Controlled experiments: synthetic graphs with known dynamics",
                "Calibration against hand-labeled datasets (if they exist)",
                "Academic paper: are these metrics actually predictive of anything?",
                "Open data: publish anonymized event graphs for research",
              ]}
            />
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
              title="Classify ideology"
              detail="Leiden clusters are structural, not political. A cluster might contain people who hate-reply to each other constantly. The algorithm doesn't know or care about left vs right."
            />
            <LimitationItem
              title="Predict radicalization"
              detail="High activation and bridge churn are structural signals, not causal mechanisms. Correlation with real-world outcomes is unknown and unvalidated."
            />
            <LimitationItem
              title="Detect sarcasm or irony"
              detail="'This is FINE' scores high on absolutist + intensifier lexicons. The scorer sees surface text, not intent. This is a known limitation of lexicon-based approaches."
            />
            <LimitationItem
              title="Claim representativeness"
              detail="Bluesky is ~20M users, skewing tech-literate, liberal, and younger. Discourse on Bluesky does not represent discourse in general."
            />
            <LimitationItem
              title="Replace qualitative analysis"
              detail="These metrics are descriptive scaffolding. A researcher still needs to look at the actual posts, the actual communities, and the actual context to say anything meaningful."
            />
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* FILE MANIFEST                                                     */}
        {/* ═══════════════════════════════════════════════════════════════════ */}

        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-4">File Manifest</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
            28 files total. 21 TypeScript, 5 Python, 1 Dockerfile, 1 requirements.txt.
          </p>

          <div className="grid md:grid-cols-2 gap-4">
            <FileGroup title="Foundation (4)" color="emerald" files={[
              "src/lib/sidelines/types.ts",
              "src/lib/db-sidelines.ts",
              "src/lib/sidelines/arousal.ts",
              "src/lib/sidelines/collector.ts",
            ]} />
            <FileGroup title="Python Worker (5)" color="violet" files={[
              "jobs/requirements.txt",
              "jobs/Dockerfile",
              "jobs/main.py",
              "jobs/analysis.py",
              "jobs/db.py",
            ]} />
            <FileGroup title="API Routes (7)" color="blue" files={[
              "api/sidelines/events/route.ts",
              "api/sidelines/events/[id]/route.ts",
              "api/sidelines/events/[id]/ingest/route.ts",
              "api/sidelines/events/[id]/analyze/route.ts",
              "api/sidelines/events/[id]/metrics/route.ts",
              "api/sidelines/events/[id]/clusters/route.ts",
              "api/sidelines/events/[id]/top-posts/route.ts",
            ]} />
            <FileGroup title="UI Pages (5)" color="amber" files={[
              "sidelines/layout.tsx",
              "sidelines/page.tsx",
              "sidelines/events/[id]/page.tsx",
              "sidelines/about/page.tsx",
              "sidelines/methodology/page.tsx",
            ]} />
            <FileGroup title="Tests — TypeScript (3)" color="rose" files={[
              "__tests__/arousal.test.ts",
              "__tests__/collector.test.ts",
              "__tests__/db.test.ts",
            ]} />
            <FileGroup title="Tests — Python (2)" color="rose" files={[
              "jobs/tests/test_analysis.py",
              "jobs/tests/test_confidence.py",
            ]} />
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* REFERENCES                                                        */}
        {/* ═══════════════════════════════════════════════════════════════════ */}

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">References</h2>
          <ul className="text-sm text-zinc-600 dark:text-zinc-400 space-y-2 ml-4 list-disc list-inside">
            <li>Traag, V.A., Waltman, L., &amp; van Eck, N.J. (2019). From Louvain to Leiden: guaranteeing well-connected communities. <em>Scientific Reports</em>, 9(1), 5233.</li>
            <li>Freeman, L.C. (1977). A set of measures of centrality based on betweenness. <em>Sociometry</em>, 40(1), 35-41.</li>
            <li>Brady, W.J., et al. (2017). Emotion shapes the diffusion of moralized content in social networks. <em>PNAS</em>, 114(28), 7313-7318.</li>
            <li>Bakshy, E., Messing, S., &amp; Adamic, L.A. (2015). Exposure to ideologically diverse news and opinion on Facebook. <em>Science</em>, 348(6239), 1130-1132.</li>
            <li>Barber&aacute;, P. (2015). Birds of the same feather tweet together: Bayesian ideal point estimation using Twitter data. <em>Political Analysis</em>, 23(1), 76-91.</li>
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
      <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-sm flex-shrink-0">{n}</div>
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

function MetricBlock({ color, name, range, formula, what, why, reads }: {
  color: string;
  name: string;
  range: string;
  formula: string;
  what: string;
  why: string;
  reads: string;
}) {
  const colorClasses: Record<string, { border: string; heading: string }> = {
    emerald: { border: "border-emerald-200 dark:border-emerald-800", heading: "text-emerald-600 dark:text-emerald-400" },
    blue: { border: "border-blue-200 dark:border-blue-800", heading: "text-blue-600 dark:text-blue-400" },
    amber: { border: "border-amber-200 dark:border-amber-800", heading: "text-amber-600 dark:text-amber-400" },
    red: { border: "border-red-200 dark:border-red-800", heading: "text-red-600 dark:text-red-400" },
  };
  const c = colorClasses[color] || colorClasses.emerald;
  return (
    <div className={`p-5 bg-white dark:bg-zinc-900 border ${c.border} rounded-xl`}>
      <div className="flex items-center gap-3 mb-3">
        <h3 className={`font-bold text-xl ${c.heading}`}>{name}</h3>
        <span className="text-xs font-mono text-zinc-400">{range}</span>
      </div>
      <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-2">
        <span className="font-semibold">What:</span> {what}
      </p>
      <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-2">
        <span className="font-semibold">Why it matters:</span> {why}
      </p>
      <p className="text-xs text-zinc-400 mb-1">
        <span className="font-semibold">Reads from:</span> {reads}
      </p>
      <p className="text-xs text-zinc-400 font-mono">{formula}</p>
    </div>
  );
}

function Stat({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-center">
      <div className="text-xs text-zinc-500 mb-1">{label}</div>
      <div className="text-lg font-bold">{value}</div>
      <div className="text-xs text-zinc-400">{detail}</div>
    </div>
  );
}

function PhaseCard({ phase, status, title, items }: {
  phase: string;
  status: string;
  title: string;
  items: string[];
}) {
  const statusColor = status === "Built"
    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
    : status === "Planned"
      ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
      : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400";

  return (
    <div className="p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
      <div className="flex items-center gap-3 mb-3">
        <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">Phase {phase}</span>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${statusColor}`}>{status}</span>
      </div>
      <h3 className="font-bold text-lg mb-3">{title}</h3>
      <ul className="text-sm text-zinc-500 dark:text-zinc-400 space-y-1">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2">
            <span className="text-emerald-500 flex-shrink-0">-</span>
            {item}
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

function SchemaTable({ tables }: {
  tables: { name: string; desc: string; cols: string; uniq: string }[];
}) {
  return (
    <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
      <div className="px-4 py-3 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <span className="text-sm font-semibold">7 Tables</span>
      </div>
      <div className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
        {tables.map((t) => (
          <div key={t.name} className="px-4 py-3 bg-white dark:bg-zinc-900/50">
            <div className="flex items-center gap-2 mb-1">
              <code className="text-sm font-mono font-bold text-emerald-600 dark:text-emerald-400">{t.name}</code>
              <span className="text-xs text-zinc-400">— {t.desc}</span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">{t.cols}</p>
            <p className="text-xs text-zinc-400 font-mono">{t.uniq}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function FileGroup({ title, color, files }: { title: string; color: string; files: string[] }) {
  const colorMap: Record<string, string> = {
    emerald: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    violet: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
    blue: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    amber: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    rose: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
  };
  return (
    <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
      <div className="flex items-center gap-2 mb-3">
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${colorMap[color] || colorMap.emerald}`}>{title}</span>
      </div>
      <ul className="text-xs font-mono text-zinc-500 dark:text-zinc-400 space-y-1">
        {files.map((f) => (
          <li key={f}>{f}</li>
        ))}
      </ul>
    </div>
  );
}
