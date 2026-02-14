# RageCheck

A tool for analyzing emotional manipulation patterns in news articles and social media posts. Includes **ClearView**, a daily cross-spectrum news briefing.

## Project Structure

- `src/app/` - Next.js app router pages and API routes
- `src/app/clearview/` - ClearView daily briefing pages
- `src/lib/` - Core libraries (scoring, LLM, extraction, DB)
- `src/components/` - React components
- `jobs/` - Python cron jobs for background processing

## Key Files

### RageCheck Analyzer
- `src/app/api/analyze/route.ts` - Main analysis endpoint
- `src/lib/llm.ts` - Claude API integration for LLM enhancement
- `src/lib/extract.ts` - URL content extraction (social platforms, articles)
- `src/lib/score.ts` - Rule-based scoring with 5-signal model
- `src/lib/db.ts` - PostgreSQL database functions

### ClearView Agents
- `src/lib/agents/survey/` - Survey Research Pipeline (persistent DB + 3-stage chain)
- `src/lib/agents/survey/types.ts` - Shared types: `RawPollData`, `StoredPoll`, `PollAnalysis`, `VizSpec`
- `src/lib/agents/survey/poll-store.ts` - Persistent `ragecheck_polls` table: init, upsert, query by entity/topic/FTS
- `src/lib/agents/survey/poll-collector.ts` - Discovery (web search for URLs) + fetch actual poll pages + extract full cross-tabs + store in DB
- `src/lib/agents/survey/poll-analyst.ts` - Query DB for relevant polls, two-stage context management (Sonnet selection → Opus analysis)
- `src/lib/agents/survey/viz-spec.ts` - Generate React chart specs from analysis + stored polls
- `src/lib/agents/survey/index.ts` - Orchestrator: `collectAndAnalyzePolls()` entry point (aliased as `researchSurveyData`)

### ClearView
- `src/app/clearview/page.tsx` - Main briefing page (client component, ~990 lines)
- `src/app/clearview/layout.tsx` - OG metadata for social sharing
- `src/app/clearview/share/page.tsx` - Server-rendered share page with per-story OG tags, redirects to main page
- `src/app/clearview/sources/page.tsx` - 5-layer source architecture documentation (~900 lines of feed data)
- `src/app/clearview/about/page.tsx` - About page
- `src/app/clearview/methodology/page.tsx` - Analysis pipeline methodology
- `src/app/clearview/email-preview/page.tsx` - Admin tool for email newsletter
- `src/lib/share/clearviewShareText.ts` - Share text generation for stories/briefings
- `src/app/api/clearview/route.ts` - Serves cached briefing data (24h TTL)
- `src/app/api/clearview/refresh/route.ts` - Cron endpoint for generating briefings
- `src/app/api/clearview/story/route.ts` - Individual story lookup
- `src/app/api/clearview/translate/route.ts` - Translation to 15 languages
- `src/app/api/clearview/detect-country/route.ts` - Auto-detect language from country
- `src/app/api/clearview/send-email/route.ts` - Send newsletter to all subscribers
- `src/app/api/clearview/email-preview/route.ts` - Preview/test email
- `src/app/api/clearview/unsubscribe/route.ts` - Email unsubscribe

## Commands

```bash
npm run dev     # Start dev server
npm run build   # Production build
npm run lint    # Run ESLint
```

## Environment

Requires:
- `ANTHROPIC_API_KEY` - Claude API
- `DATABASE_URL` - PostgreSQL connection string
- `BLOB_READ_WRITE_TOKEN` - Vercel Blob storage (optional, for image uploads)

## Analysis Flow

1. URL submitted → check cache (24h TTL)
2. Cache miss → extract content (5-30s for complex sites)
3. Rule-based scoring (~10ms)
4. LLM enhancement with Claude Opus (~2-5s)
5. Log to DB, return results

Cache hits return in ~50-200ms.

## Caching Strategy

**What's cached**: All successful URL analyses (`success=true AND score IS NOT NULL`)

**Implementation** (`src/lib/db.ts:getCachedAnalysis`, `src/app/api/analyze/route.ts`):
- Cache key: URL only (no version prefix)
- TTL: 24 hours (`created_at > NOW() - INTERVAL '24 hours'`)
- Cache hits are re-logged for analytics (preserves funnel metrics)
- `force=true` parameter bypasses cache for re-analysis

**Not cached**:
- Failed analyses (transient errors should retry)
- Image uploads (each gets unique timestamped URL)

**Trade-offs**:
- 24h TTL balances freshness vs cost/latency
- News articles rarely change post-publication; tweets are immutable
- No version key — if scoring algorithm changes, old results persist until TTL expires

**Future consideration**: Add cache version prefix (e.g., `v2:${url}`) to invalidate on algorithm changes.

## Loading State UX

Analysis takes 7-35 seconds for cache misses. The loading indicator is positioned inline directly below the input form (not far down the page) to keep it visible where users click.

**Implementation** (`src/app/page.tsx`):
- `loadingPhase` state (0-4) tracks elapsed time
- `useEffect` timer advances phase every few seconds while loading
- Phase messages: "Fetching article..." → "Extracting content..." → "Running pattern analysis..." → "AI is reviewing for nuance..." → "Complex content — almost there..."
- Stepped progress bar (4 segments) fills as phases advance
- Button shows spinner and is disabled during loading to prevent double-clicks

## ClearView

Daily news briefing that synthesizes top stories from across the political spectrum, separating core facts from editorial framing.

### Data Model

Each briefing contains `StoryCluster[]`, where each story has:
- `topic`, `summary`, `whatHappened` - Core factual content
- `sources: SourceAnalysis[]` - Individual articles with `name`, `lean`, `title`, `url`, `framing`, `manipulationTechniques`, `emotionalTechniques?`
- `perspectives: Perspective[]` - Viewpoints with `lean`, `viewpoint`, `moralFoundations?`
- `expertConsensus` - Scientific/legal/economic/etc. consensus with confidence level and dissent
- `factualDisputes` - Contested claims with left/right positions and evidence status (supported/mixed/unsupported/misleading)
- `whyItMatters` - Core values and motivations for each side (with optional `moralFoundations`), plus `bottomLine`
- `deeperAnalysis` - Unstated concerns, economic/cultural dimensions, political game, what gets ignored
- `debateType` - factual | policy | values | mixed
- `commonGround` - Points both sides agree on
- `perceptionGap?` - Where media framing diverges from actual polling data (`claim`, `actualAgreement`, `mediaPortrayal`)
- `sharedValues?` - Specific values both sides genuinely share on this story
- `moralFoundationsInPlay?` - Which of Haidt's 6 foundations are activated

#### New Types (added in moral foundations redesign)
- `MoralFoundation` - `{ foundation: care|fairness|loyalty|authority|sanctity|liberty, label: string, strength: primary|secondary }`
- `EmotionalTechnique` - `{ type: contempt|disgust|dehumanization|fear|schadenfreude|epistemic_arrogance|cynicism_induction|self_serving_outrage|anger, label: string, severity: low|moderate|high, evidence?: string }`
- `PerceptionGap` - `{ claim: string, actualAgreement?: string, mediaPortrayal?: string, pollSource?: string, pollDate?: string, crossPartisanBreakdown?: string }`
- `RawPollData` - Full poll extraction: organization, dates, sample size, margin of error, mode, exact question wording, all response options with partisan/demographic breakdowns, trend data
- `PollAnalysis` - Analyst output: headline insight, perception gap (claim + media framing + gap magnitude), key findings with trends, data quality rating
- `VizSpec` - Chart specification: chartType (partisan-bars | perception-gap | trend | distribution), title, data points, source attribution

### Architecture

- **Data flow**: Cron job (`/api/clearview/refresh`) generates briefings → stored in DB → served by `/api/clearview` (read-only, 24h TTL)
- **Source architecture**: 5 layers — Primary Sources (gov, courts, corporate) → News (state, metro, beat, diaspora, international) → Influence (think tanks, magazines, Substacks) → Reaction (social, cultural, religious media) → Public Opinion (polls, surveys)
- **~280 RSS feeds** + Google News dynamic queries for gap-filling
- **Translation**: Auto-detects country, supports 15 languages via `/api/clearview/translate`
- **Email newsletter**: Subscribe on page, admin sends via `/clearview/email-preview`
- **Social sharing**: Per-story and per-briefing share with OG images via `/api/og/clearview` and `/api/og/clearview/story`
- **Archived briefings**: Previous briefings shown below current, deduplicated by topic

### Specialized Agent Pipeline

The refresh pipeline uses specialized parallel agents:

```
Fetch RSS → Cluster → Extract Articles
                          ↓
              ┌───────────┼───────────┐
              ↓           ↓           ↓
       Survey Research  Article     Expert Source
       Pipeline         Analysis    Verification
       (DB + 3 stages) Agent       Agent
              ↓           ↓           ↓
              └───────────┼───────────┘
                          ↓
                   Assembly + QA
```

Survey pipeline detail:
```
Poll Collector (discover URLs → fetch pages → extract cross-tabs → store in DB)
       ↓
Poll Analyst (query DB → select relevant → Opus analysis)
       ↓
Viz Spec Generator (analysis + stored polls → chart specs)
```

**Why specialize**: Each subtask has different failure modes. Polling data and expert consensus need grounding via web search (LLMs hallucinate statistics). Article analysis benefits from focused attention on full article content. Separating concerns means each agent can be optimized independently.

#### File Structure

```
src/lib/agents/
  survey/                # Survey Research Pipeline (persistent DB + 3-stage chain)
    types.ts             # Shared input/output contracts (RawPollData, StoredPoll, PollAnalysis, VizSpec)
    poll-store.ts        # Persistent ragecheck_polls table: init, upsert, query, dedup
    poll-collector.ts    # Discovery (web search → URLs) + fetch pages + extract cross-tabs + store in DB
    poll-analyst.ts      # Query DB for relevant polls, two-stage selection, Opus analysis
    viz-spec.ts          # Generate React chart specs from analysis + stored polls
    index.ts             # Orchestrator: collectAndAnalyzePolls() entry point
  expert/                # Expert Source Verification (planned)
  article/               # Article Analysis (planned, currently monolithic in refresh/route.ts)
```

#### Survey Research Pipeline (`src/lib/agents/survey/`)

Three chained agents that replace the previous single `polling.ts` agent. The pipeline takes story context and produces React-renderable visualization specs with grounded polling data.

**Research basis**: A PMC study (2024) on visualization and polarization perception found that full-range bar charts and icon array histograms reduce perceived polarization by 12-24%. Truncated charts increase misperceptions. The visualization itself is a depolarization intervention. More in Common's "estimated vs. actual" pattern makes perception gaps viscerally visible. Source: https://pmc.ncbi.nlm.nih.gov/articles/PMC11600389/

##### Poll Collector (`poll-collector.ts`)

**Purpose**: Two-step process: (1) discover poll report URLs via web search, (2) fetch actual poll report pages and extract full cross-tab data, then store in persistent DB.

**Step 1 — Discovery** (LLM + web search, Sonnet, 10 searches):
Same 4-step graduated search strategy as before (entity → org-specific → aggregator → broader). Key difference: the goal is to find URLs to actual poll report pages, NOT extract data from news snippets.
- **No domain restriction** on web search — unrestricted so agent can discover polls via news coverage, aggregators, and secondary sources.
- **Entity extraction**: `extractEntities()` in refresh/route.ts prioritizes acronyms (ICE, FBI, NATO) over title-case proper nouns.

**Step 2 — Fetch + Extract** (for each new URL):
1. Dedup: query DB for existing URLs, skip any already stored
2. Fetch page via `extractContent()` from `src/lib/extract.ts`
3. Extract structured data via focused Sonnet LLM call on full page text (~2K-20K chars)
4. Store in `ragecheck_polls` table via `upsertPoll()`
- Rate limiting: 1s between fetches, max 5 new URLs per story per refresh
- Cost: Discovery ~$0.50-1.00/story, Extraction ~$0.10/URL. After DB seeded, extraction drops to near-zero (dedup skips known URLs).

**Persistent storage** (`ragecheck_polls` table):
- `url` (UNIQUE), `organization`, `dates_conducted`, `poll_date` (normalized DATE), `sample_size`, `margin_of_error`, `mode`
- `topics TEXT[]`, `entities TEXT[]`, `categories TEXT[]` — GIN-indexed for array containment queries
- `questions JSONB` — full cross-tab data (all questions, all responses, partisan/demographic breakdowns, trend data)
- `page_text TEXT` — preserved for re-extraction if extraction logic improves
- `extraction_quality` — "full" | "partial" | "snippet_only" | "unknown"
- Upsert enriches topics/entities on re-encounter; upgrades questions if new extraction is better quality

**Key improvement**: Previous `poll-finder.ts` read news articles *about* polls via web search snippets — most cross-tab data was missing (0% values). Now we fetch the actual poll report pages and extract ALL data.

##### Poll Analyst (`poll-analyst.ts`)

**Purpose**: Query DB for relevant stored polls and produce the insight layer. Uses Claude Opus for deeper reasoning.

**Model**: `claude-opus-4-6` (analyst needs stronger reasoning for insight extraction)

**Input**: `StoredPoll[]` from DB query (not raw web search results)

**Two-stage context management**:
- If >8 polls found in DB: Stage 1 (Sonnet) selects the 3-5 most relevant, Stage 2 (Opus) analyzes
- If ≤8 polls: skip Stage 1, send all to Opus directly

**DB query strategy** (in `poll-store.ts:findRelevantPolls`):
1. Exact entity match (`entities && story.entities`, 18-month window)
2. Topic keyword match (`topics && topicKeywords`, 18-month window)
3. Full-text search on `page_text` (catches untagged matches)

**Analysis tasks**:
1. **Identify the headline insight** — not conventional wisdom ("Americans are divided") but the surprise ("65% say ICE has gone too far — including 27% of Republicans, up 7pts since June")
2. **Detect the perception gap** — what does media coverage suggest vs. what data shows? The "estimated vs. actual" framing
3. **Detect movement** — trend data is often more newsworthy than absolute numbers. "Up from 54% to 65% in 8 months" is the story
4. **Cross-triangulate** — multiple questions/polls corroborating the same finding strengthens it
5. **Find surprising cross-partisan agreement** — "71% of Independents agree" is more interesting than "Dems and Reps disagree"
6. **Assess data quality** — weight findings by sample size, recency, polling organization reputation

**Output**:
```typescript
interface PollAnalysis {
  headlineInsight: string;       // The surprising finding, not the conventional wisdom
  perceptionGap: {
    claim: string;               // What the data actually shows
    mediaFraming: string;        // What coverage suggests
    gapMagnitude: string;        // How big the distortion is
  };
  keyFindings: {
    finding: string;
    source: string;              // "Marist, Jan 2026"
    crossPartisan?: { dem: number; ind: number; rep: number };
    trend?: { direction: "up" | "down" | "stable"; from: number; to: number; period: string };
  }[];
  dataQuality: "strong" | "moderate" | "limited";  // How confident are we in the data
}
```

**Key concern**: The analyst must produce genuine insight, not just restate numbers. "65% say gone too far" is data; "Americans have shifted sharply against ICE in 8 months, including a 7-point swing among Republicans" is insight.

##### Agent 3: Viz Spec Generator (`viz-spec.ts`)

**Purpose**: Take analyst output and produce React-renderable visualization specifications.

**Input**: `PollAnalysis` from Agent 2

**Chart types** (chosen based on depolarization research):
- **Full-range horizontal bars** (0-100%): For partisan breakdowns. Shows overlap between groups, not just difference. PMC study: reduces perceived polarization ~12-24%
- **"Expected vs. Actual" paired bars**: More in Common style. Two bars per item showing perception gap. The gap between them IS the insight
- **Trend arrows / sparklines**: Direction of movement (54% → 65%). Movement is often more newsworthy than position
- **Stacked distribution bars**: Full response range ("gone too far / about right / not far enough") showing actual shape of opinion, not a binary

**Output**:
```typescript
interface VizSpec {
  chartType: "partisan-bars" | "perception-gap" | "trend" | "distribution";
  title: string;
  subtitle?: string;             // Source attribution: "Marist, Jan 27-30 2026, n=1,462, ±2.9%"
  data: ChartDataPoint[];        // Structured for React rendering
  annotations?: string[];        // Callouts for key insights
  sourceAttribution: string;     // Full citation
}
```

**Key concern**: Output must be structured JSON that maps directly to React components — not images, not SVG, not markdown. The frontend renders with consistent ClearView styling. All charts must start axes at 0 (never truncate — truncated axes exaggerate differences).

##### Orchestrator (`index.ts`)

Exports a single function for the refresh pipeline:
```typescript
export async function collectAndAnalyzePolls(
  stories: StoryContext[],
  concurrency?: number
): Promise<Map<string, SurveyResearchResult>>
```

Also exported as `researchSurveyData` for backwards compatibility.

Flow: (1) Initialize `ragecheck_polls` table if needed, (2) Collect polls for all stories (discover + fetch + store in DB), (3) For each story, query DB for relevant polls → analyze → generate viz specs.

Graceful degradation: if collector finds no polls, returns empty result. If analyst fails, returns raw data without analysis/viz. DB accumulates polls across refreshes — analysis can find polls from previous days even if current collection fails.

Also provides `formatSurveyContext()` for backwards-compatible deep dive prompt injection with richer data (exact question wording, trend data, analyst insights).

#### Other Agents

| Agent | Directory | Purpose | Status |
|-------|-----------|---------|--------|
| **Article Analysis** | `src/lib/agents/article/` | Perspectives, moral foundations, emotional techniques, framing | Planned — currently monolithic in deep dive prompt |
| **Expert Source Verification** | `src/lib/agents/expert/` | Verify expert consensus citations exist via web search | Planned |

### UI Patterns

- Story cards with collapsible "Go Deeper" and "Sources" sections
- Bias spectrum bar (blue=left, gray=center, rose=right) per story
- **Moral foundations layout** (new): When `perspective.moralFoundations` exists, perspectives show as full-width foundation-labeled cards with foundation color/icon as primary label, political lean as de-emphasized badge. Falls back to legacy Left/Right 2-column grid for old data.
- **Foundation color system** (`FOUNDATION_CONFIG`): rose=care, indigo=fairness, purple=loyalty, amber=authority, emerald=sanctity, orange=liberty
- **Story card section order** (new): Headline → What Happened → **Common Ground + Shared Values** → **Perception Gap** → **Perspectives** → Factual Disputes → Bottom Line → Expert Consensus
- **Perception Gap component**: Violet color scheme, shows polling data with source/date/numbers, media framing contrast
- **Emotional technique badges**: Severity-colored (rose=high, amber=moderate, zinc=low) in source cards
- `BiasBadge` component for source lean labels
- Defensive coding: all array access uses `|| []` guards (fixed in commits `c3f708c`, `e710e92`, `dc8d85f`)

### ClearView Design Philosophy (Planned Evolution)

**Core problem with current design**: The Left View / Right View framing reinforces tribal binary thinking. It creates more *informed* partisans rather than more *connected* citizens. This is the exact pathology diagnosed by Putnam and Haidt.

**Guiding frameworks**:

#### Putnam — Social Capital & The Upswing
- **Bridging vs. bonding capital**: Bridging (cross-group ties, "sociological WD-40") matters more for democracy than bonding (in-group ties, "sociological superglue"). High bonding + low bridging = dangerous polarization. Current ClearView risks creating bonding within partisan identities while labeling the bridge.
- **The I-We-I curve** (from "The Upswing", 2020): Four metrics — economic equality, political comity, social cohesion, cultural solidarity — all trace the same inverted-U, peaking mid-1960s. All four are back to Gilded Age levels.
- **Cultural change precedes policy change**: Ngram data shows language shifted before legislation. Terms like "cooperation" rose in 1880s-1890s, decades before Progressive legislation. The Social Gospel replaced Social Darwinism as moral infrastructure.
- **Muckrakers' model**: Ida Tarbell, Upton Sinclair, Lincoln Steffens reached *ideologically diverse* mass audiences with fact-based investigation. They were reformist, not partisan. They "did the converting" rather than preaching to the converted. Modern partisan media does the opposite.
- **Superordinate identity**: Must be *functional* (tied to shared activity, not just a label), cross-cutting, and built on interdependence. Military desegregation worked because "Marine" became more salient than race through shared mission.
- **The constrict finding**: Diversity initially reduces trust across ALL groups (not just outgroup hostility — generalized withdrawal). But successful societies overcome this by creating "new, cross-cutting forms of social solidarity."
- **Progressive Era as template**: Settlement houses, Rotary clubs, civic organizations were *grassroots* social inventions — solutions "came out of Peoria and Toledo." We need equivalent institutional invention for digital age.

#### Haidt — Moral Psychology & The Righteous Mind
- **Moral Foundations Theory**: 6 foundations — Care/Harm, Fairness/Cheating, Loyalty/Betrayal, Authority/Subversion, Sanctity/Degradation, Liberty/Oppression. Left emphasizes Care + Fairness; Right uses all six more evenly. The right isn't *missing* empathy — they have a broader moral palette.
- **"Morality binds and blinds"**: Moral communities create in-group cohesion but prevent understanding of out-groups. Whatever a group holds sacred becomes the thing about which they cannot think clearly.
- **Elephant and rider**: Moral intuitions come first, strategic reasoning follows. Presenting "the other side's argument" often backfires because you're talking to the rider while the elephant has already decided. Must address the elephant first through emotional resonance, shared identity, narrative.
- **Moral reframing** (Feinberg & Willer research): People almost always argue from their own moral foundations. Fewer than 10% spontaneously reframe for the audience. Reframing is dramatically more effective — e.g., framing environmentalism through purity/sanctity for conservatives, military spending through fairness/equality for liberals.
- **Asteroids Club**: Not finding "common ground" (watered-down positions) but getting each side to see the other's threats as real.
- **Post-Babel thesis**: Social media's retweet/like/share mechanics (2009-2012) transformed connection platforms into performance platforms optimizing for outrage and moral grandstanding.

#### Depolarization Research
- **Perception gaps** (More in Common): Democrats and Republicans imagine ~2x as many opponents hold "extreme" views as actually do. The "Exhausted Majority" (67% of Americans) is fatigued by polarization but drowned out by extreme voices.
- **Braver Angels workshops**: RCTs show they reduce affective polarization, reduce stereotyping, increase willingness for cross-partisan engagement. Key mechanism: reciprocal group reflection.
- **Critical limitation**: Reducing affective polarization (feelings) does NOT automatically reduce support for undemocratic behavior. Feelings improve; behavior doesn't always follow.
- **Most news-engaged are most distorted**: People who follow news "most of the time" are ~3x less accurate about opponents' views than those who follow "only now and then."

### Emotional Variables Beyond Anger/Rage

Research shows anger is actually one of the *less* structurally dangerous emotions. More corrosive variables:

| Variable | Mechanism | Why Worse Than Anger |
|---|---|---|
| **Contempt** | Exclusion, moral superiority (Fischer & Roseman 2007; Gottman) | Anger says "you're wrong." Contempt says "you're not worth engaging." Forecloses dialogue entirely. |
| **Moral disgust** | Contamination, purity violation (Inbar, Pizarro, Haidt) | Treats opponents as pollutants to be expelled, not people to argue with. Dehumanization through "othering." |
| **Dehumanization** | Denial of full humanity (Kteily & Bruneau 2017) | American partisans rate opposing party 42 points less than fully human on evolutionary scale. Predicts tolerance of violence. |
| **Fear/existential threat** | Mortality salience, worldview defense (TMT: Pyszczynski et al.) | Drives authoritarianism and outgroup aggression. Cultural threats more polarizing than economic ones. |
| **Self-serving outrage** | Guilt alleviation, identity maintenance (Rothschild & Keefer 2017) | Outrage at outgroup is psychologically rewarding (affirms identity). Outrage at own side is costly. Crowds out genuine empathy. |
| **Epistemic arrogance** | Overconfidence, Dunning-Kruger in politics (Anson 2018) | Partisanship exacerbates overconfidence. Social media creates "illusion of knowledge" — more info, less accuracy, more certainty. |
| **Belonging deprivation** | Significance quest, identity vacuum (Kruglanski 3N model; Pfundmair 2024) | Loneliness creates cognitive opening to radical narratives. Extremist groups provide identity + purpose + community. |
| **Schadenfreude** | Reward from outgroup suffering (Cikara & Fiske; Webster & Albertson 2022) | Neural reward activation from rival's pain. No resolution condition — no behavior change by outgroup would satisfy it. Predicts support for cruel policies. |
| **Distrust** | Epistemic collapse (Rapp 2022; Lewandowsky et al.) | Perceived polarization directly undermines trust. Distrust → conspiracy adoption → further distrust (self-reinforcing). Structural, not episodic. |
| **Cynicism/hopelessness** | Learned helplessness (Pattyn et al. 2012) | Disengagement amplifies extremist voices by removing moderating middle. "Nothing matters" is as dangerous as "I'm furious." |

**Key insight**: The contempt → dehumanization → tolerance-of-violence pipeline is more dangerous than anger alone. Anger at least implies engagement and desire for change. Contempt, disgust, and cynicism eliminate the possibility of productive engagement.

### ClearView Redesign — COMPLETED

**Approach**: Layer moral foundations ON TOP of existing Left/Right data. Keep political lean as secondary metadata. Add moral foundations as primary framing. Backwards-compatible with existing briefings in DB.

All new fields are optional (`?`) — old briefings without them render the legacy UI unchanged. No DB migrations needed (JSONB storage).

#### Stream A: ClearView Prompt, Data Model & UI — DONE

- **A1** Data model expanded: `MoralFoundation`, `EmotionalTechnique`, `PerceptionGap` interfaces added. `Perspective`, `SourceAnalysis`, `StoryCluster`, `WhyItMatters` extended.
- **A2** Deep dive prompt updated with moral foundations analysis, emotional manipulation taxonomy (9 types), perception gap with real polling data requirements, shared values.
- **A3** UI reframed: `FOUNDATION_CONFIG` color system, promoted Common Ground + Shared Values, Perception Gap component, foundation-labeled perspective cards (with legacy fallback), emotional technique badges in source cards, foundation-colored "Why Each Side Cares".
- **A4** Methodology page updated with Moral Foundations Theory, Emotional Manipulation Taxonomy, Perception Gap Detection, Why We Lead with Common Ground sections.
- **A5** Share text updated to reference moral foundations when available.

#### Stream B: RageCheck Scoring Model Expansion — DONE

- **B1** New lexicons: `CONTEMPT_TERMS`, `CONTEMPT_PATTERNS`, `POLITICAL_DISGUST`, `SCHADENFREUDE_PATTERNS`, `EPISTEMIC_ARROGANCE`, `CYNICISM_TERMS`, `EXISTENTIAL_THREAT_PATTERNS`
- **B2** New signals: `detectContempt`, `detectSchadenfreude`, `detectEpistemicArrogance`, `detectCynicism`, `detectExistentialThreat`, `detectPoliticalDisgust`
- **B3** Integrated into bars: Contempt→Enemy Construction (0.20), Schadenfreude→Call-to-Conflict (0.20), Epistemic Arrogance→Simplification (0.20), Cynicism→Moral Condemnation (0.15), Political Disgust→Moral Condemnation (0.15), Existential Threat→Arousal (0.20). Weights rebalanced.
- **B4** LLM enhancement prompt expanded with contempt, disgust, schadenfreude, epistemic arrogance, cynicism, existential threat instructions.
- **B5** `SIGNAL_LABELS` and `CATEGORY_DESCRIPTIONS` updated to reflect expanded taxonomy.

#### Stream C: Survey Research Pipeline — DONE

Evolved from v1 single-agent → v2 3-agent chain → **v3 persistent DB pipeline**. Old `poll-finder.ts` deleted (replaced by `poll-collector.ts` + `poll-store.ts`). See "Specialized Agent Pipeline" section above for full architecture.

**Key architectural change (v3)**: Previous pipeline read news articles *about* polls via web search snippets — most cross-tab data was missing (0% values). Now: (1) Discovery finds poll report URLs, (2) Collector fetches actual report pages and extracts ALL cross-tab data, (3) Data stored persistently in `ragecheck_polls` Postgres table with GIN-indexed arrays for topic/entity queries, (4) Analyst queries DB to find relevant polls (including from previous refreshes).

**Completed**:
1. Persistent poll store — `src/lib/agents/survey/poll-store.ts`. `ragecheck_polls` table with `initPollsTable()`, `upsertPoll()` (enriches topics/entities on re-encounter), `findRelevantPolls()` (3-strategy: entity match → topic match → FTS), `getExistingUrls()` for dedup.
2. Poll Collector — `src/lib/agents/survey/poll-collector.ts`. Two-step: discovery (Sonnet + web search, 10 queries) finds URLs, then fetches actual poll report pages via `extractContent()` and extracts full cross-tabs via focused Sonnet LLM call. Dedup against DB before fetching. Rate-limited (1s between fetches, max 5 per story).
3. Poll Analyst — `src/lib/agents/survey/poll-analyst.ts`. Queries DB for `StoredPoll[]`. Two-stage context management: if >8 polls, Sonnet selects 3-5 most relevant, then Opus analyzes. Uses Claude Opus for deeper reasoning.
4. Viz Spec Generator — `src/lib/agents/survey/viz-spec.ts`. Pure function (no LLM). Generates chart specs from `StoredPoll[]`: partisan-bars, distribution, trend, perception-gap. All axes start at 0.
5. Orchestrator — `src/lib/agents/survey/index.ts`. `collectAndAnalyzePolls()` (aliased as `researchSurveyData()`). Initializes DB table, runs collection for all stories, then queries DB and analyzes per story.
6. Backwards compatible — refresh/route.ts unchanged (imports `researchSurveyData` alias). `formatSurveyContext()` for deep dive prompt injection.
7. Deep dive prompt — PERCEPTION GAP section prioritizes grounded survey data over LLM memory.
8. Frontend chart components — `PartisanBarsChart`, `DistributionChart`, `TrendChart`, `PerceptionGapChart`, `SurveyChart` dispatcher, and `hasValidChartData` guard in `src/app/clearview/page.tsx`. Perception gap section renders `story.surveyResearch.vizSpecs` with text-only fallback.

**Extraction quality verified** (Feb 2026): Page-level extraction produces real cross-tab data. Quinnipiac poll extracted with `byParty` (e.g., ICE approval D:4% I:33% R:84%) and `byDemographic` (gender splits) populated. 6/10 responses had partisan breakdowns. JSON parse resilience added for long pages. Known limitations: some poll sites (e.g., Marist) block scraping (0 chars returned); very long pages can cause LLM JSON truncation (mitigated with cleanup fallback).

**Remaining**:
- Consider: MCP server for external polling data access

**Research basis**: PMC study found full-range bar charts reduce perceived polarization 12-24%. More in Common's "estimated vs actual" pattern makes gaps visceral. Truncated axes exaggerate differences — all charts must start at 0.
