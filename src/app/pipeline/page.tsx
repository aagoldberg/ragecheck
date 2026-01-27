export const metadata = {
  title: "Pipeline Documentation | RageCheck",
  description: "Comprehensive documentation of the RageCheck, Clearview, Despun, and LongView data pipelines, database schemas, and modeling processes.",
};

export default function PipelinePage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-100 font-mono">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <header className="mb-16">
          <h1 className="text-4xl font-bold mb-4">Pipeline Documentation</h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-lg">
            Comprehensive technical documentation for RageCheck, Clearview, Despun, and LongView systems.
          </p>
          <div className="mt-6 flex gap-4 text-sm">
            <a href="#overview" className="text-indigo-600 dark:text-indigo-400 hover:underline">Overview</a>
            <a href="#database" className="text-indigo-600 dark:text-indigo-400 hover:underline">Database</a>
            <a href="#ragecheck" className="text-indigo-600 dark:text-indigo-400 hover:underline">RageCheck</a>
            <a href="#clearview" className="text-indigo-600 dark:text-indigo-400 hover:underline">Clearview</a>
            <a href="#despun" className="text-indigo-600 dark:text-indigo-400 hover:underline">Despun</a>
            <a href="#longview" className="text-indigo-600 dark:text-indigo-400 hover:underline">LongView</a>
            <a href="#costs" className="text-indigo-600 dark:text-indigo-400 hover:underline">Costs</a>
          </div>
        </header>

        {/* Overview Section */}
        <section id="overview" className="mb-20">
          <h2 className="text-3xl font-bold mb-6 pb-2 border-b border-zinc-200 dark:border-zinc-800">System Overview</h2>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="p-6 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
              <h3 className="font-bold text-lg mb-2 text-rose-600 dark:text-rose-400">RageCheck</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                Manipulative framing detector. Scores individual URLs/articles for &quot;ragebait&quot; patterns (0-100).
              </p>
              <ul className="text-xs text-zinc-500 space-y-1">
                <li>• 5-bar scoring model + 2 modifiers</li>
                <li>• Full article text analysis</li>
                <li>• Per-URL LLM enhancement</li>
                <li>• Headlines feed with per-item scoring</li>
              </ul>
            </div>

            <div className="p-6 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
              <h3 className="font-bold text-lg mb-2 text-indigo-600 dark:text-indigo-400">Clearview / Despun</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                Multi-source news synthesis. Clusters stories and analyzes framing across political spectrum.
              </p>
              <ul className="text-xs text-zinc-500 space-y-1">
                <li>• 48 RSS sources across 7-point spectrum</li>
                <li>• Batch LLM analysis (single call)</li>
                <li>• Headlines-only analysis</li>
                <li>• Expert consensus detection</li>
              </ul>
            </div>

            <div className="p-6 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
              <h3 className="font-bold text-lg mb-2 text-emerald-600 dark:text-emerald-400">LongView</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                Frontend-only bias spectrum visualization. UI template for news synthesis display.
              </p>
              <ul className="text-xs text-zinc-500 space-y-1">
                <li>• No database (hardcoded sample data)</li>
                <li>• Bias spectrum components</li>
                <li>• Story card templates</li>
                <li>• Ready for API integration</li>
              </ul>
            </div>

            <div className="p-6 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
              <h3 className="font-bold text-lg mb-2 text-amber-600 dark:text-amber-400">Shared Infrastructure</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                Common infrastructure across all projects.
              </p>
              <ul className="text-xs text-zinc-500 space-y-1">
                <li>• Neon PostgreSQL (serverless)</li>
                <li>• Vercel hosting + cron</li>
                <li>• Anthropic Claude API</li>
                <li>• RSS feed aggregation</li>
              </ul>
            </div>
          </div>

          {/* Architecture Diagram */}
          <div className="p-6 bg-zinc-100 dark:bg-zinc-900 rounded-xl font-mono text-xs overflow-x-auto">
            <pre className="text-zinc-700 dark:text-zinc-300">{`
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              DATA FLOW ARCHITECTURE                              │
└─────────────────────────────────────────────────────────────────────────────────┘

                    ┌──────────────┐
                    │  USER INPUT  │
                    │  (URL/Image) │
                    └──────┬───────┘
                           │
           ┌───────────────┴───────────────┐
           │                               │
           ▼                               ▼
┌──────────────────────┐       ┌──────────────────────┐
│     RAGECHECK        │       │  CLEARVIEW/DESPUN    │
│  (Single URL Mode)   │       │  (Multi-Source Mode) │
└──────────┬───────────┘       └──────────┬───────────┘
           │                               │
           ▼                               ▼
┌──────────────────────┐       ┌──────────────────────┐
│  Content Extraction  │       │   RSS Feed Fetching  │
│  (Readability API)   │       │   (48 sources)       │
│  - Full article text │       │   - Headlines only   │
│  - ~3000 chars       │       │   - Deduplicate URLs │
└──────────┬───────────┘       └──────────┬───────────┘
           │                               │
           ▼                               ▼
┌──────────────────────┐       ┌──────────────────────┐
│  Rule-Based Scoring  │       │   Single LLM Call    │
│  (5-Bar Model)       │       │   (Claude Sonnet)    │
│  - Arousal           │       │   - Cluster stories  │
│  - Enemy Construction│       │   - Analyze framing  │
│  - Moral Condemnation│       │   - Expert consensus │
│  - Simplification    │       │   - Perspectives     │
│  - Call-to-Conflict  │       │                      │
└──────────┬───────────┘       └──────────┬───────────┘
           │                               │
           ▼                               ▼
┌──────────────────────┐       ┌──────────────────────┐
│  LLM Enhancement     │       │   StoryCluster[]     │
│  (Claude Sonnet)     │       │   - whatHappened     │
│  - Context review    │       │   - sources[]        │
│  - Score adjustment  │       │   - perspectives     │
│  - Categorization    │       │   - expertConsensus  │
└──────────┬───────────┘       └──────────┬───────────┘
           │                               │
           └───────────────┬───────────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │   NEON POSTGRESQL      │
              │   - ragecheck_*        │
              │   - despun_*           │
              └────────────────────────┘
            `}</pre>
          </div>
        </section>

        {/* Database Section */}
        <section id="database" className="mb-20">
          <h2 className="text-3xl font-bold mb-6 pb-2 border-b border-zinc-200 dark:border-zinc-800">Database Schema</h2>

          <p className="text-zinc-600 dark:text-zinc-400 mb-8">
            All projects use <strong>Neon PostgreSQL</strong> (serverless) with the <code className="px-1 bg-zinc-200 dark:bg-zinc-800 rounded">@neondatabase/serverless</code> client.
          </p>

          {/* RageCheck Tables */}
          <h3 className="text-xl font-bold mb-4 text-rose-600 dark:text-rose-400">RageCheck Tables</h3>

          <div className="space-y-6 mb-12">
            {/* ragecheck_analyses */}
            <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
              <h4 className="font-bold text-sm mb-2 font-mono">ragecheck_analyses</h4>
              <p className="text-xs text-zinc-500 mb-3">Main analysis results cache. Stores scored URLs with full analysis.</p>
              <div className="text-xs font-mono bg-zinc-50 dark:bg-zinc-950 p-3 rounded overflow-x-auto">
                <pre>{`id                    SERIAL PRIMARY KEY
url                   TEXT NOT NULL (analyzed URL)
source_domain         TEXT
platform              TEXT (twitter|bluesky|threads|farcaster|truthsocial|web)
score                 INTEGER (0-100 ragebait score)
label                 TEXT (ragebait|borderline|not_ragebait)
llm_enhanced          BOOLEAN

-- 5-Bar Signal Breakdown (mapped from legacy names)
signal_loaded_language    INTEGER (arousal)
signal_us_vs_them         INTEGER (enemy_construction)
signal_threat_panic       INTEGER (moral_condemnation)
signal_absolutist         INTEGER (simplification)
signal_engagement_bait    INTEGER (call_to_conflict)

-- Rich Analysis
title                 TEXT
reasons               JSONB (array of explanation strings)
highlights            JSONB (array of {start, end, category, text})
context_notes         TEXT
text_preview          TEXT
sharing_patterns      JSONB
technique_explanations JSONB
share_card_summary    TEXT
share_card_bullets    JSONB

-- Categorization
topic                 TEXT
content_type          TEXT
source_type           TEXT

-- Visitor Tracking
ip_address            TEXT
user_agent            TEXT
country               TEXT
is_bot                BOOLEAN
session_id            TEXT
language              TEXT

created_at            TIMESTAMP DEFAULT NOW()`}</pre>
              </div>
            </div>

            {/* ragecheck_headlines */}
            <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
              <h4 className="font-bold text-sm mb-2 font-mono">ragecheck_headlines</h4>
              <p className="text-xs text-zinc-500 mb-3">High-rage news feed. Headlines scored individually via LLM.</p>
              <div className="text-xs font-mono bg-zinc-50 dark:bg-zinc-950 p-3 rounded overflow-x-auto">
                <pre>{`id                    SERIAL PRIMARY KEY
url                   TEXT UNIQUE NOT NULL
title                 TEXT NOT NULL
description           TEXT
source                TEXT NOT NULL (publication name)
lean                  TEXT NOT NULL (political lean)
score                 INTEGER (0-100)
summary               TEXT
analysis              TEXT

-- 5-Bar Breakdown
arousal               INTEGER
enemy_construction    INTEGER
moral_condemnation    INTEGER
simplification        INTEGER
call_to_conflict      INTEGER

-- Categorization
topic                 TEXT
category              TEXT

-- RSS Metadata
author                TEXT
image_url             TEXT
rss_categories        TEXT[]
guid                  TEXT
published_at          TIMESTAMP

-- Story Clustering
story_slug            TEXT
story_label           TEXT
clustered_at          TIMESTAMP

scored_at             TIMESTAMP DEFAULT NOW()
created_at            TIMESTAMP DEFAULT NOW()

-- Indexes
idx_headlines_score_date (score DESC, scored_at DESC)
idx_headlines_topic (topic, scored_at DESC)
idx_headlines_story (story_slug, score DESC)`}</pre>
              </div>
            </div>

            {/* ragecheck_visitors */}
            <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
              <h4 className="font-bold text-sm mb-2 font-mono">ragecheck_visitors</h4>
              <p className="text-xs text-zinc-500 mb-3">Page visitor tracking with UTM parameters.</p>
              <div className="text-xs font-mono bg-zinc-50 dark:bg-zinc-950 p-3 rounded overflow-x-auto">
                <pre>{`id              SERIAL PRIMARY KEY
ip_address      TEXT
user_agent      TEXT
country         TEXT
referrer        TEXT
is_bot          BOOLEAN
page_path       TEXT
utm_source      TEXT
utm_medium      TEXT
utm_campaign    TEXT
utm_content     TEXT
utm_term        TEXT
created_at      TIMESTAMP DEFAULT NOW()`}</pre>
              </div>
            </div>

            {/* ragecheck_shares */}
            <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
              <h4 className="font-bold text-sm mb-2 font-mono">ragecheck_shares</h4>
              <p className="text-xs text-zinc-500 mb-3">Share/viral event tracking.</p>
              <div className="text-xs font-mono bg-zinc-50 dark:bg-zinc-950 p-3 rounded overflow-x-auto">
                <pre>{`id              SERIAL PRIMARY KEY
url             TEXT
share_type      TEXT
ip_address      TEXT
referrer_code   TEXT
score           INTEGER
platform        TEXT
user_agent      TEXT
created_at      TIMESTAMP DEFAULT NOW()`}</pre>
              </div>
            </div>

            {/* ragecheck_analysis_starts */}
            <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
              <h4 className="font-bold text-sm mb-2 font-mono">ragecheck_analysis_starts</h4>
              <p className="text-xs text-zinc-500 mb-3">Funnel tracking for abandoned/completed analyses.</p>
              <div className="text-xs font-mono bg-zinc-50 dark:bg-zinc-950 p-3 rounded overflow-x-auto">
                <pre>{`id                        SERIAL PRIMARY KEY
session_id                TEXT NOT NULL
analysis_type             TEXT NOT NULL (url|image)
url                       TEXT
ip_address                TEXT
user_agent                TEXT
country                   TEXT
is_bot                    BOOLEAN

-- Abandonment Diagnostics
abandoned_at              TIMESTAMPTZ
abandon_reason            TEXT (timeout|error|user_close|page_leave)
time_to_abandon_ms        INTEGER
connection_type           TEXT (wifi|cellular|ethernet|none|unknown)
effective_connection_type TEXT (slow-2g|2g|3g|4g)

created_at                TIMESTAMP DEFAULT NOW()`}</pre>
              </div>
            </div>

            {/* ragecheck_subscribers */}
            <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
              <h4 className="font-bold text-sm mb-2 font-mono">ragecheck_subscribers</h4>
              <p className="text-xs text-zinc-500 mb-3">Email subscription list.</p>
              <div className="text-xs font-mono bg-zinc-50 dark:bg-zinc-950 p-3 rounded overflow-x-auto">
                <pre>{`id              SERIAL PRIMARY KEY
email           TEXT NOT NULL UNIQUE
ip_address      TEXT
country         TEXT
source          TEXT DEFAULT 'website'
subscribed_at   TIMESTAMP DEFAULT NOW()
unsubscribed_at TIMESTAMP`}</pre>
              </div>
            </div>

            {/* ragecheck_stories */}
            <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
              <h4 className="font-bold text-sm mb-2 font-mono">ragecheck_stories</h4>
              <p className="text-xs text-zinc-500 mb-3">Story metadata and framing examples for clustered headlines.</p>
              <div className="text-xs font-mono bg-zinc-50 dark:bg-zinc-950 p-3 rounded overflow-x-auto">
                <pre>{`slug              TEXT PRIMARY KEY
label             TEXT NOT NULL
framing_examples  JSONB {
  divisionWords: string[],
  emotionWords: string[],
  moralWords: string[],
  conflictWords: string[],
  simplificationNote: string
}
created_at        TIMESTAMP DEFAULT NOW()
updated_at        TIMESTAMP DEFAULT NOW()`}</pre>
              </div>
            </div>
          </div>

          {/* Despun Tables */}
          <h3 className="text-xl font-bold mb-4 text-indigo-600 dark:text-indigo-400">Despun Tables</h3>

          <div className="space-y-6 mb-12">
            {/* despun_clearview */}
            <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
              <h4 className="font-bold text-sm mb-2 font-mono">despun_clearview</h4>
              <p className="text-xs text-zinc-500 mb-3">Cached topic briefings. Stores StoryCluster[] as JSONB blob.</p>
              <div className="text-xs font-mono bg-zinc-50 dark:bg-zinc-950 p-3 rounded overflow-x-auto">
                <pre>{`id              SERIAL PRIMARY KEY
data            JSONB (StoryCluster[] - see interfaces below)
generated_at    TIMESTAMP
created_at      TIMESTAMP DEFAULT NOW()`}</pre>
              </div>
            </div>

            {/* despun_analytics_events */}
            <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
              <h4 className="font-bold text-sm mb-2 font-mono">despun_analytics_events</h4>
              <p className="text-xs text-zinc-500 mb-3">Granular event tracking for user interactions.</p>
              <div className="text-xs font-mono bg-zinc-50 dark:bg-zinc-950 p-3 rounded overflow-x-auto">
                <pre>{`id              SERIAL PRIMARY KEY
event_type      VARCHAR(50) (pageview|story_view|story_expand|source_click|scroll_depth|time_on_page)
session_id      VARCHAR(64) INDEXED
visitor_id      VARCHAR(64) INDEXED
page_path       VARCHAR(255)
story_id        VARCHAR(100) INDEXED
referrer        VARCHAR(500)
utm_source      VARCHAR(100)
utm_medium      VARCHAR(100)
utm_campaign    VARCHAR(100)
device_type     VARCHAR(20)
browser         VARCHAR(50)
os              VARCHAR(20)
country         VARCHAR(2)
region          VARCHAR(100)
city            VARCHAR(100)
scroll_depth    INTEGER
time_on_page    INTEGER
metadata        JSONB
created_at      TIMESTAMP DEFAULT NOW() INDEXED`}</pre>
              </div>
            </div>

            {/* despun_sessions */}
            <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
              <h4 className="font-bold text-sm mb-2 font-mono">despun_sessions</h4>
              <p className="text-xs text-zinc-500 mb-3">Session aggregation for user journey analysis.</p>
              <div className="text-xs font-mono bg-zinc-50 dark:bg-zinc-950 p-3 rounded overflow-x-auto">
                <pre>{`id                  SERIAL PRIMARY KEY
session_id          VARCHAR(64) UNIQUE NOT NULL
visitor_id          VARCHAR(64) INDEXED
started_at          TIMESTAMP INDEXED
ended_at            TIMESTAMP
duration_seconds    INTEGER
page_count          INTEGER
stories_viewed      INTEGER
stories_expanded    INTEGER
sources_clicked     INTEGER
entry_page          VARCHAR(255)
exit_page           VARCHAR(255)
referrer            VARCHAR(500)
utm_source          VARCHAR(100)
utm_medium          VARCHAR(100)
device_type         VARCHAR(20)
browser             VARCHAR(50)
os                  VARCHAR(20)
country             VARCHAR(2)
is_bounce           BOOLEAN
is_return_visitor   BOOLEAN
created_at          TIMESTAMP
updated_at          TIMESTAMP`}</pre>
              </div>
            </div>

            {/* despun_daily_metrics */}
            <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
              <h4 className="font-bold text-sm mb-2 font-mono">despun_daily_metrics</h4>
              <p className="text-xs text-zinc-500 mb-3">Pre-aggregated daily rollups for fast dashboard queries.</p>
              <div className="text-xs font-mono bg-zinc-50 dark:bg-zinc-950 p-3 rounded overflow-x-auto">
                <pre>{`id                      SERIAL PRIMARY KEY
date                    DATE UNIQUE INDEXED
pageviews               INTEGER
unique_visitors         INTEGER
sessions                INTEGER
new_visitors            INTEGER
return_visitors         INTEGER
avg_session_duration    DECIMAL
avg_pages_per_session   DECIMAL
bounce_rate             DECIMAL
avg_scroll_depth        DECIMAL
total_story_views       INTEGER
total_story_expands     INTEGER
total_source_clicks     INTEGER
traffic_sources         JSONB
device_breakdown        JSONB
geo_breakdown           JSONB
created_at              TIMESTAMP
updated_at              TIMESTAMP`}</pre>
              </div>
            </div>

            {/* despun_story_performance */}
            <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
              <h4 className="font-bold text-sm mb-2 font-mono">despun_story_performance</h4>
              <p className="text-xs text-zinc-500 mb-3">Per-story metrics for content analysis.</p>
              <div className="text-xs font-mono bg-zinc-50 dark:bg-zinc-950 p-3 rounded overflow-x-auto">
                <pre>{`id                      SERIAL PRIMARY KEY
story_id                VARCHAR(100) NOT NULL INDEXED
story_topic             VARCHAR(500)
date                    DATE INDEXED
views                   INTEGER
unique_viewers          INTEGER
expands                 INTEGER
expand_rate             DECIMAL
avg_time_on_story       DECIMAL
avg_scroll_depth        DECIMAL
source_clicks           INTEGER
source_clicks_breakdown JSONB
created_at              TIMESTAMP
UNIQUE(story_id, date)`}</pre>
              </div>
            </div>

            {/* despun_newsletter_signups */}
            <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
              <h4 className="font-bold text-sm mb-2 font-mono">despun_newsletter_signups</h4>
              <p className="text-xs text-zinc-500 mb-3">Newsletter subscription tracking.</p>
              <div className="text-xs font-mono bg-zinc-50 dark:bg-zinc-950 p-3 rounded overflow-x-auto">
                <pre>{`id              SERIAL PRIMARY KEY
email           VARCHAR(255) UNIQUE
signup_source   VARCHAR(100)
referrer        VARCHAR(500)
utm_source      VARCHAR(100)
utm_medium      VARCHAR(100)
utm_campaign    VARCHAR(100)
visitor_id      VARCHAR(64)
session_id      VARCHAR(64)
status          VARCHAR(20) (active|unsubscribed|bounced)
confirmed_at    TIMESTAMP
unsubscribed_at TIMESTAMP
created_at      TIMESTAMP`}</pre>
              </div>
            </div>

            {/* despun_ab_tests */}
            <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
              <h4 className="font-bold text-sm mb-2 font-mono">despun_ab_tests</h4>
              <p className="text-xs text-zinc-500 mb-3">A/B testing framework configuration.</p>
              <div className="text-xs font-mono bg-zinc-50 dark:bg-zinc-950 p-3 rounded overflow-x-auto">
                <pre>{`id                  SERIAL PRIMARY KEY
test_name           VARCHAR(100) UNIQUE
test_description    TEXT
variants            JSONB [{id, name}]
target_metric       VARCHAR(100)
traffic_allocation  DECIMAL(3,2)
status              VARCHAR(20) (draft|running|paused|completed)
started_at          TIMESTAMP
ended_at            TIMESTAMP
winner_variant      VARCHAR(10)
created_at          TIMESTAMP
updated_at          TIMESTAMP`}</pre>
              </div>
            </div>

            {/* despun_system_health */}
            <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
              <h4 className="font-bold text-sm mb-2 font-mono">despun_system_health</h4>
              <p className="text-xs text-zinc-500 mb-3">Infrastructure monitoring metrics.</p>
              <div className="text-xs font-mono bg-zinc-50 dark:bg-zinc-950 p-3 rounded overflow-x-auto">
                <pre>{`id                      SERIAL PRIMARY KEY
timestamp               TIMESTAMP INDEXED
api_response_time_avg   INTEGER
api_response_time_p95   INTEGER
api_error_rate          DECIMAL(5,4)
api_requests_total      INTEGER
cache_hit_rate          DECIMAL(5,4)
cache_size_mb           DECIMAL(10,2)
rss_feeds_status        JSONB
rss_feeds_healthy       INTEGER
rss_feeds_total         INTEGER
llm_requests            INTEGER
llm_avg_latency         INTEGER
llm_errors              INTEGER
llm_tokens_used         INTEGER
db_query_time_avg       INTEGER
db_connections_active   INTEGER
created_at              TIMESTAMP`}</pre>
              </div>
            </div>
          </div>
        </section>

        {/* RageCheck Section */}
        <section id="ragecheck" className="mb-20">
          <h2 className="text-3xl font-bold mb-6 pb-2 border-b border-zinc-200 dark:border-zinc-800">RageCheck Pipeline</h2>

          {/* Single URL Analysis */}
          <h3 className="text-xl font-bold mb-4">1. Single URL Analysis</h3>
          <p className="text-zinc-600 dark:text-zinc-400 mb-4">
            Endpoint: <code className="px-1 bg-zinc-200 dark:bg-zinc-800 rounded">POST /api/analyze</code>
          </p>

          <div className="p-6 bg-zinc-100 dark:bg-zinc-900 rounded-xl font-mono text-xs mb-8 overflow-x-auto">
            <pre className="text-zinc-700 dark:text-zinc-300">{`
User submits URL
       │
       ▼
┌─────────────────────────────────────────────────────────────────┐
│  [A] CONTENT EXTRACTION                                         │
│  ─────────────────────────────────────────────────────────────  │
│  • Fetch webpage with SSRF protection                           │
│  • Parse HTML with Mozilla Readability                          │
│  • Extract: title, full article text (~3000 chars), domain      │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│  [B] RULE-BASED SCORING (5-Bar Model)                           │
│  ─────────────────────────────────────────────────────────────  │
│  Preprocessed text analyzed for 5 bars + 2 modifiers:           │
│                                                                 │
│  BAR 1: AROUSAL (20%)                                           │
│    • Emotion Lexicon (30%): anger, fear, disgust words          │
│    • Urgency Words (25%): "now", "immediately", "breaking"      │
│    • Punctuation (25%): ALL CAPS ratio, !, ?                    │
│    • Intensifiers (20%): "literally", "insane", "crazy"         │
│                                                                 │
│  BAR 2: ENEMY CONSTRUCTION (25%)                                │
│    • Group Generalizations (25%): "they all", "the left"        │
│    • Malicious Intent (25%): "they want to destroy"             │
│    • Dehumanization (30%): "vermin", "parasites"                │
│    • Scapegoating (20%): "is to blame for"                      │
│                                                                 │
│  BAR 3: MORAL CONDEMNATION (20%)                                │
│    • Moral Judgment (40%): "evil", "corrupt", "traitor"         │
│    • Purity/Contamination (35%): "poison", "infect"             │
│    • Betrayal Framing (25%): "sold out", "backstab"             │
│                                                                 │
│  BAR 4: SIMPLIFICATION (15%)                                    │
│    • Absolutist Terms (35%): "always", "never", "everyone"      │
│    • False Dilemma (25%): "either/or", "with us or against"     │
│    • Causal Oversimplification (25%): "this is why"             │
│    • Repetition/Slogans (15%): trigram repetition               │
│                                                                 │
│  BAR 5: CALL-TO-CONFLICT (20%)                                  │
│    • Reply Bait (40%): "how is this allowed", "wake up"         │
│    • Rhetorical Questions (30%): provocative questions          │
│    • 2nd Person Provocation (30%): "you people", "if you..."    │
│                                                                 │
│  MODIFIER A: REPORTING DISCOUNT (reduces false positives)       │
│    • Attribution verbs, quotes, hedging, multi-perspective      │
│    • At 100% discount: score × 0.2 (80% reduction)              │
│                                                                 │
│  MODIFIER B: INFORMATION DENSITY                                │
│    • Named entities, numbers, stats, links                      │
│    • High density = substance, low density = rhetoric           │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│  [C] SCORING FORMULA                                            │
│  ─────────────────────────────────────────────────────────────  │
│  1. core = Σ(bar_score × bar_weight)                            │
│  2. Apply non-linear boost when multiple bars high:             │
│     • 3+ bars ≥55: core × 1.6                                   │
│     • 3+ bars ≥35: core × 1.35                                  │
│  3. Special boosts:                                             │
│     • call_to_conflict ≥70: core × 1.8                          │
│     • enemy + moral both ≥40: core × 1.15                       │
│  4. Apply reporting discount                                    │
│  5. Clamp to 0-100                                              │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│  [D] LLM ENHANCEMENT (Claude Sonnet)                            │
│  ─────────────────────────────────────────────────────────────  │
│  Input:                                                         │
│    • Title + text preview (~3000 chars)                         │
│    • Rule-based score + signal breakdown                        │
│    • Top 10 flagged phrases                                     │
│                                                                 │
│  Claude analyzes:                                               │
│    • Is flagged language USED or QUOTED/REPORTED?               │
│    • Manipulation tactics rules missed?                         │
│    • Overall intent: inform or provoke?                         │
│                                                                 │
│  Output:                                                        │
│    • adjustedScore (0-100)                                      │
│    • reasons[] (3-5 explanation bullets)                        │
│    • contextNotes (if rule score misleading)                    │
│    • sharingPatterns[] (why people share)                       │
│    • techniqueExplanations[]                                    │
│    • shareCardBullets[] (3-7 word noun phrases)                 │
│    • topic, contentType, sourceType                             │
│                                                                 │
│  Model: claude-sonnet-4-20250514                                │
│  Max tokens: 800                                                │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│  [E] CACHE & RETURN                                             │
│  ─────────────────────────────────────────────────────────────  │
│  • Check ragecheck_analyses for existing URL (24h cache)        │
│  • Store complete analysis in database                          │
│  • Return score + label + breakdown to user                     │
│                                                                 │
│  Labels:                                                        │
│    • ≥50: "High" (ragebait)                                     │
│    • 25-49: "Medium" (borderline)                               │
│    • <25: "Low" (not ragebait)                                  │
└─────────────────────────────────────────────────────────────────┘
            `}</pre>
          </div>

          {/* Headlines Feed */}
          <h3 className="text-xl font-bold mb-4">2. Headlines Feed (High-Rage)</h3>
          <p className="text-zinc-600 dark:text-zinc-400 mb-4">
            Endpoint: <code className="px-1 bg-zinc-200 dark:bg-zinc-800 rounded">GET/POST /api/headlines/scored</code>
          </p>

          <div className="p-6 bg-zinc-100 dark:bg-zinc-900 rounded-xl font-mono text-xs mb-8 overflow-x-auto">
            <pre className="text-zinc-700 dark:text-zinc-300">{`
POST /api/headlines/scored (Admin trigger or cron)
       │
       ▼
┌─────────────────────────────────────────────────────────────────┐
│  [A] FETCH ALL RSS FEEDS                                        │
│  ─────────────────────────────────────────────────────────────  │
│  • 24 sources (dev branch) across 7-point spectrum              │
│  • ALL items from each feed (~20-50 per source)                 │
│  • Total: ~500-1200 headlines per refresh                       │
│  • Timeout: 15s per feed, with fallback URLs                    │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│  [B] DEDUPLICATE BY URL                                         │
│  ─────────────────────────────────────────────────────────────  │
│  • Query existing URLs from ragecheck_headlines                 │
│  • Filter to only NEW headlines                                 │
│  • Skip already-scored articles                                 │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│  [C] SCORE EACH HEADLINE INDIVIDUALLY                           │
│  ─────────────────────────────────────────────────────────────  │
│  For EACH new headline, call LLM with:                          │
│    • Source name                                                │
│    • Headline title                                             │
│    • Description (first 500 chars from RSS snippet)             │
│                                                                 │
│  Model: claude-sonnet-4-20250514                                │
│  Max tokens: 350                                                │
│                                                                 │
│  Returns:                                                       │
│    • score (0-100)                                              │
│    • summary                                                    │
│    • analysis                                                   │
│    • 5-bar signal breakdown                                     │
│    • topic, category                                            │
│                                                                 │
│  Rate: ~100ms delay between calls to avoid rate limits          │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│  [D] STORE IN DATABASE                                          │
│  ─────────────────────────────────────────────────────────────  │
│  Each headline stored in ragecheck_headlines with:              │
│    • All RSS metadata (author, image, categories, guid)         │
│    • Score and signal breakdown                                 │
│    • Topic and category classification                          │
│    • Published timestamp                                        │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│  [E] GET ENDPOINT RETURNS TOP 30                                │
│  ─────────────────────────────────────────────────────────────  │
│  • Sorted by score (highest "rage" first)                       │
│  • Filtered for profanity                                       │
│  • Hidden sources removed (e.g., Gateway Pundit)                │
│  • Returns top 30 headlines                                     │
└─────────────────────────────────────────────────────────────────┘
            `}</pre>
          </div>

          {/* Story Clustering */}
          <h3 className="text-xl font-bold mb-4">3. Story Clustering</h3>
          <p className="text-zinc-600 dark:text-zinc-400 mb-4">
            Endpoint: <code className="px-1 bg-zinc-200 dark:bg-zinc-800 rounded">POST /api/headlines/cluster</code>
          </p>

          <div className="p-6 bg-zinc-100 dark:bg-zinc-900 rounded-xl font-mono text-xs mb-8 overflow-x-auto">
            <pre className="text-zinc-700 dark:text-zinc-300">{`
┌─────────────────────────────────────────────────────────────────┐
│  STORY CLUSTERING (Claude Haiku)                                │
│  ─────────────────────────────────────────────────────────────  │
│  Purpose: Group related headlines by underlying story/event     │
│                                                                 │
│  Input: Recent headlines with scores                            │
│                                                                 │
│  Claude Haiku identifies:                                       │
│    • Same event = same story_slug                               │
│    • Story labels (3-6 words, human-readable)                   │
│    • Framing examples extracted from headlines:                 │
│      - division_words (us-vs-them)                              │
│      - emotion_words (charged language)                         │
│      - moral_words (judgment/outrage)                           │
│      - conflict_words (action incitement)                       │
│      - simplification_note                                      │
│                                                                 │
│  Output stored in:                                              │
│    • ragecheck_headlines.story_slug                             │
│    • ragecheck_stories.framing_examples                         │
└─────────────────────────────────────────────────────────────────┘
            `}</pre>
          </div>
        </section>

        {/* Clearview Section */}
        <section id="clearview" className="mb-20">
          <h2 className="text-3xl font-bold mb-6 pb-2 border-b border-zinc-200 dark:border-zinc-800">Clearview Pipeline</h2>

          <p className="text-zinc-600 dark:text-zinc-400 mb-4">
            Endpoint: <code className="px-1 bg-zinc-200 dark:bg-zinc-800 rounded">GET /api/clearview</code> (cached) |{" "}
            <code className="px-1 bg-zinc-200 dark:bg-zinc-800 rounded">GET /api/clearview/refresh</code> (cron)
          </p>

          <div className="p-6 bg-zinc-100 dark:bg-zinc-900 rounded-xl font-mono text-xs mb-8 overflow-x-auto">
            <pre className="text-zinc-700 dark:text-zinc-300">{`
Cron job (every 4 hours) or GET request
       │
       ▼
┌─────────────────────────────────────────────────────────────────┐
│  [A] CHECK CACHE                                                │
│  ─────────────────────────────────────────────────────────────  │
│  • Query despun_clearview for recent data                       │
│  • If <4 hours old, return cached StoryCluster[]                │
│  • Otherwise, generate fresh                                    │
└──────────────────────────────┬──────────────────────────────────┘
                               │ (cache miss)
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│  [B] FETCH ALL RSS FEEDS                                        │
│  ─────────────────────────────────────────────────────────────  │
│  48 sources across 7-point spectrum:                            │
│                                                                 │
│  FAR LEFT (5):                                                  │
│    Jacobin, The Intercept, Common Dreams,                       │
│    Democracy Now, The Nation                                    │
│                                                                 │
│  LEFT (8):                                                      │
│    The Guardian, HuffPost, Vox, Mother Jones, Slate,            │
│    MSNBC, The Daily Beast, Salon                                │
│                                                                 │
│  CENTER-LEFT (9):                                               │
│    NPR, The Atlantic, CNN, NBC News, CBS News, ABC News,        │
│    NYT, Washington Post, Politico                               │
│                                                                 │
│  CENTER (9):                                                    │
│    PBS NewsHour, AP News, Reuters, The Hill, USA Today,         │
│    BBC News, Axios, Bloomberg, Business Insider                 │
│                                                                 │
│  CENTER-RIGHT (3):                                              │
│    Wall Street Journal, The Economist, RealClearPolitics        │
│                                                                 │
│  RIGHT (9):                                                     │
│    Fox News, NY Post, Washington Examiner, Daily Wire,          │
│    The Federalist, Washington Times, The Blaze,                 │
│    American Conservative, National Review                       │
│                                                                 │
│  FAR RIGHT (5):                                                 │
│    Breitbart, Newsmax, Daily Caller, Gateway Pundit,            │
│    Epoch Times                                                  │
│                                                                 │
│  Fetch: ALL items from each feed                                │
│  Deduplicate: by URL                                            │
│  Result: ~800-1500 unique headlines                             │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│  [C] SINGLE LLM CALL (Claude Sonnet)                            │
│  ─────────────────────────────────────────────────────────────  │
│  Input format (HEADLINES ONLY, no article content):             │
│    "[0] NPR (Center-Left): "Biden Signs Executive Order""       │
│    "[1] Fox News (Right): "Biden's Power Grab Sparks Outrage""  │
│    ...                                                          │
│                                                                 │
│  Claude performs ALL analysis in one call:                      │
│                                                                 │
│  1. CLUSTER related headlines into 3-5 major stories            │
│                                                                 │
│  2. For each story, generate:                                   │
│     • topic: Brief name ("Immigration Policy Changes")          │
│     • summary: 2-3 sentence neutral summary                     │
│     • whatHappened: Detailed factual explanation                │
│     • sources[]: For each source covering the story:            │
│       - name, lean, title, url                                  │
│       - framing: How they're spinning it                        │
│       - manipulationTechniques: ["loaded language", ...]        │
│     • perspectives[]: {lean, viewpoint} for left/right          │
│     • keyTakeaway: One sentence without spin                    │
│                                                                 │
│  3. EXPERT CONSENSUS:                                           │
│     • type: scientific|legal|historical|economic|               │
│             intelligence|statistical|professional|              │
│             international|none                                  │
│     • exists: boolean                                           │
│     • statement: What consensus says                            │
│     • confidenceLevel: high|moderate|low|contested              │
│     • sources: ["CDC", "Supreme Court", ...]                    │
│     • dissent: Notable minority views                           │
│                                                                 │
│  4. DEBATE CLASSIFICATION:                                      │
│     • debateType: factual|policy|values|mixed                   │
│     • debateQuestion: Actual question being debated             │
│     • commonGround: Facts both sides agree on                   │
│     • factualDisputes[]: {claim, leftPosition,                  │
│         rightPosition, evidenceStatus}                          │
│                                                                 │
│  5. POLITICAL PSYCHOLOGY (whyItMatters):                        │
│     • left: {coreValue, motivation, stance, emotionalAppeal}    │
│     • right: {coreValue, motivation, stance, emotionalAppeal}   │
│     • bottomLine: What this fight is really about               │
│                                                                 │
│  6. DEEPER ANALYSIS:                                            │
│     • unstatedConcerns: {left: [], right: []}                   │
│     • economicDimension: Economic interests at play             │
│     • culturalDimension: Identity anxieties                     │
│     • politicalGame: How politicians exploit this               │
│     • whatGetsIgnored: Nuances that don't fit narrative         │
│                                                                 │
│  Model: claude-sonnet-4-20250514                                │
│  Max tokens: 8000                                               │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│  [D] CACHE & RETURN                                             │
│  ─────────────────────────────────────────────────────────────  │
│  • Store StoryCluster[] as JSONB in despun_clearview            │
│  • Keep 3 days of history, remove older entries                 │
│  • Cache for 4 hours                                            │
│  • Return to frontend                                           │
└─────────────────────────────────────────────────────────────────┘
            `}</pre>
          </div>

          {/* StoryCluster Interface */}
          <h3 className="text-xl font-bold mb-4">StoryCluster Interface</h3>
          <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 mb-8">
            <div className="text-xs font-mono bg-zinc-50 dark:bg-zinc-950 p-3 rounded overflow-x-auto">
              <pre>{`interface StoryCluster {
  id: string;
  topic: string;
  summary: string;
  whatHappened: string;
  sources: {
    name: string;
    lean: string;
    title: string;
    url: string;
    framing: string;
    manipulationTechniques: string[];
  }[];
  perspectives: {
    lean: string;
    viewpoint: string;
  }[];
  keyTakeaway: string;
  expertConsensus?: {
    type: "scientific" | "legal" | "historical" | "economic" |
          "intelligence" | "statistical" | "professional" |
          "international" | "none";
    exists: boolean;
    statement?: string;
    confidenceLevel: "high" | "moderate" | "low" | "contested";
    sources?: string[];
    dissent?: string;
  };
  debateType: "factual" | "policy" | "values" | "mixed";
  debateQuestion?: string;
  commonGround?: string[];
  factualDisputes?: {
    claim: string;
    leftPosition: string;
    rightPosition: string;
    evidenceStatus: "supported" | "mixed" | "unsupported" | "misleading";
  }[];
  whyItMatters?: {
    left: {
      coreValue: string;
      motivation: string;
      stance: "offensive" | "defensive" | "mobilizing";
      emotionalAppeal: string;
    };
    right: { /* same structure */ };
    bottomLine: string;
  };
  deeperAnalysis?: {
    unstatedConcerns: { left: string[]; right: string[] };
    economicDimension?: string;
    culturalDimension?: string;
    politicalGame: string;
    whatGetsIgnored?: string;
  };
}`}</pre>
            </div>
          </div>
        </section>

        {/* Despun Section */}
        <section id="despun" className="mb-20">
          <h2 className="text-3xl font-bold mb-6 pb-2 border-b border-zinc-200 dark:border-zinc-800">Despun Analytics</h2>

          <p className="text-zinc-600 dark:text-zinc-400 mb-6">
            Despun extends Clearview with comprehensive analytics, A/B testing, and admin dashboards.
          </p>

          {/* Analytics Tracking */}
          <h3 className="text-xl font-bold mb-4">Client-Side Tracking</h3>
          <div className="p-6 bg-zinc-100 dark:bg-zinc-900 rounded-xl font-mono text-xs mb-8 overflow-x-auto">
            <pre className="text-zinc-700 dark:text-zinc-300">{`
┌─────────────────────────────────────────────────────────────────┐
│  EVENT TRACKING                                                 │
│  ─────────────────────────────────────────────────────────────  │
│  Events tracked:                                                │
│    • pageview - Page load with path                             │
│    • story_view - Story becomes visible                         │
│    • story_expand - User expands story details                  │
│    • source_click - User clicks news source link                │
│    • scroll_depth - Milestones at 25%, 50%, 75%, 100%           │
│    • time_on_page - On visibility change/unload                 │
│    • newsletter_signup - Subscription                           │
│    • share - Content sharing with platform                      │
│                                                                 │
│  Session Management:                                            │
│    • visitor_id: Persistent in localStorage                     │
│    • session_id: 30-minute timeout in sessionStorage            │
│    • is_return_visitor: Tracked via visitor_id                  │
│                                                                 │
│  Device Detection:                                              │
│    • device_type: desktop|mobile|tablet                         │
│    • browser: Chrome|Safari|Firefox|Edge|Opera                  │
│    • os: Windows|macOS|Linux|Android|iOS                        │
│                                                                 │
│  UTM Capture:                                                   │
│    • utm_source, utm_medium, utm_campaign                       │
│    • utm_term, utm_content                                      │
└─────────────────────────────────────────────────────────────────┘
            `}</pre>
          </div>

          {/* Admin APIs */}
          <h3 className="text-xl font-bold mb-4">Admin API Endpoints</h3>
          <div className="grid md:grid-cols-2 gap-4 mb-8">
            <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
              <code className="text-xs text-indigo-600 dark:text-indigo-400">GET /api/admin/analytics/overview</code>
              <p className="text-xs text-zinc-500 mt-1">Pageviews, visitors, sessions, bounce rate, story expands</p>
            </div>
            <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
              <code className="text-xs text-indigo-600 dark:text-indigo-400">GET /api/admin/analytics/traffic</code>
              <p className="text-xs text-zinc-500 mt-1">Traffic by day, sources, devices, geo</p>
            </div>
            <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
              <code className="text-xs text-indigo-600 dark:text-indigo-400">GET /api/admin/content/performance</code>
              <p className="text-xs text-zinc-500 mt-1">Top stories with performance metrics</p>
            </div>
            <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
              <code className="text-xs text-indigo-600 dark:text-indigo-400">GET /api/admin/growth/metrics</code>
              <p className="text-xs text-zinc-500 mt-1">AARRR metrics, retention cohorts, newsletter stats</p>
            </div>
            <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
              <code className="text-xs text-indigo-600 dark:text-indigo-400">GET /api/admin/users/behavior</code>
              <p className="text-xs text-zinc-500 mt-1">Session metrics, bounce rate, engagement</p>
            </div>
            <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
              <code className="text-xs text-indigo-600 dark:text-indigo-400">GET /api/admin/system/health</code>
              <p className="text-xs text-zinc-500 mt-1">RSS feed health, DB health, API status</p>
            </div>
            <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
              <code className="text-xs text-indigo-600 dark:text-indigo-400">GET /api/admin/seo/metrics</code>
              <p className="text-xs text-zinc-500 mt-1">Organic traffic, SEO recommendations</p>
            </div>
            <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
              <code className="text-xs text-indigo-600 dark:text-indigo-400">GET/POST /api/admin/experiments</code>
              <p className="text-xs text-zinc-500 mt-1">A/B test management (CRUD)</p>
            </div>
          </div>
        </section>

        {/* LongView Section */}
        <section id="longview" className="mb-20">
          <h2 className="text-3xl font-bold mb-6 pb-2 border-b border-zinc-200 dark:border-zinc-800">LongView (Frontend Only)</h2>

          <p className="text-zinc-600 dark:text-zinc-400 mb-6">
            LongView is a frontend-only application with no database. It serves as a UI template for bias spectrum visualization,
            ready to connect to Clearview/Despun APIs.
          </p>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
              <h4 className="font-bold text-sm mb-2">Pages</h4>
              <ul className="text-xs text-zinc-500 space-y-1">
                <li><code>/</code> - Home with story feed</li>
                <li><code>/about</code> - About page</li>
                <li><code>/methodology</code> - Source list</li>
              </ul>
            </div>
            <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
              <h4 className="font-bold text-sm mb-2">Components</h4>
              <ul className="text-xs text-zinc-500 space-y-1">
                <li><code>BiasSpectrum</code> - Source distribution bar</li>
                <li><code>BiasBadge</code> - Political lean badge</li>
                <li><code>StoryCard</code> - Expandable story card</li>
              </ul>
            </div>
          </div>

          <h3 className="text-xl font-bold mb-4">Story Interface</h3>
          <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
            <div className="text-xs font-mono bg-zinc-50 dark:bg-zinc-950 p-3 rounded overflow-x-auto">
              <pre>{`interface Story {
  id: string;
  topic: string;
  whatHappened: string;
  keyTakeaway: string;
  debateType: string;
  sources: {
    name: string;
    lean: string;
    title: string;
    framing: string;
  }[];
  perspectives: {
    left: string;
    right: string;
  };
  commonGround: string[];
}`}</pre>
            </div>
          </div>
        </section>

        {/* Costs Section */}
        <section id="costs" className="mb-20">
          <h2 className="text-3xl font-bold mb-6 pb-2 border-b border-zinc-200 dark:border-zinc-800">Cost Analysis</h2>

          <h3 className="text-xl font-bold mb-4">LLM Pricing (per million tokens)</h3>
          <div className="overflow-x-auto mb-8">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800">
                  <th className="text-left py-2 font-bold">Model</th>
                  <th className="text-right py-2 font-bold">Input</th>
                  <th className="text-right py-2 font-bold">Output</th>
                </tr>
              </thead>
              <tbody className="text-zinc-600 dark:text-zinc-400">
                <tr className="border-b border-zinc-100 dark:border-zinc-800/50">
                  <td className="py-2">Claude Sonnet 4</td>
                  <td className="text-right">$3</td>
                  <td className="text-right">$15</td>
                </tr>
                <tr>
                  <td className="py-2">Claude Haiku</td>
                  <td className="text-right">$0.25</td>
                  <td className="text-right">$1.25</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3 className="text-xl font-bold mb-4">Cost Comparison</h3>
          <div className="overflow-x-auto mb-8">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800">
                  <th className="text-left py-2 font-bold">Pipeline</th>
                  <th className="text-right py-2 font-bold">Per Refresh</th>
                  <th className="text-right py-2 font-bold">Daily (6x)</th>
                  <th className="text-right py-2 font-bold">Monthly</th>
                </tr>
              </thead>
              <tbody className="text-zinc-600 dark:text-zinc-400">
                <tr className="border-b border-zinc-100 dark:border-zinc-800/50">
                  <td className="py-2">Clearview (batch, Sonnet)</td>
                  <td className="text-right">~$0.20</td>
                  <td className="text-right">~$1.20</td>
                  <td className="text-right">~$36</td>
                </tr>
                <tr className="border-b border-zinc-100 dark:border-zinc-800/50">
                  <td className="py-2">RageCheck Headlines (per-item, Sonnet)</td>
                  <td className="text-right">~$1-2</td>
                  <td className="text-right">~$6-12</td>
                  <td className="text-right">~$180-360</td>
                </tr>
                <tr>
                  <td className="py-2">Single URL Analysis (Sonnet)</td>
                  <td className="text-right">~$0.01-0.02</td>
                  <td className="text-right">varies</td>
                  <td className="text-right">varies</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-800">
            <h4 className="font-bold text-amber-800 dark:text-amber-200 mb-2">Key Insight</h4>
            <p className="text-sm text-amber-700 dark:text-amber-300">
              Clearview&apos;s batch approach (1 LLM call for all headlines) is <strong>~25-50x cheaper</strong> than
              RageCheck&apos;s per-headline scoring. Consider implementing batch scoring to further reduce costs.
            </p>
          </div>
        </section>

        {/* RSS Sources */}
        <section id="sources" className="mb-20">
          <h2 className="text-3xl font-bold mb-6 pb-2 border-b border-zinc-200 dark:border-zinc-800">RSS Sources (48 Total)</h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Far Left */}
            <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border-l-4 border-blue-700">
              <h4 className="font-bold text-sm mb-2 text-blue-700">Far Left (5)</h4>
              <ul className="text-xs text-zinc-500 space-y-1">
                <li>Jacobin</li>
                <li>The Intercept</li>
                <li>Common Dreams</li>
                <li>Democracy Now</li>
                <li>The Nation</li>
              </ul>
            </div>

            {/* Left */}
            <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border-l-4 border-blue-500">
              <h4 className="font-bold text-sm mb-2 text-blue-600">Left (8)</h4>
              <ul className="text-xs text-zinc-500 space-y-1">
                <li>The Guardian</li>
                <li>HuffPost</li>
                <li>Vox</li>
                <li>Mother Jones</li>
                <li>Slate</li>
                <li>MSNBC</li>
                <li>The Daily Beast</li>
                <li>Salon</li>
              </ul>
            </div>

            {/* Center-Left */}
            <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border-l-4 border-sky-500">
              <h4 className="font-bold text-sm mb-2 text-sky-600">Center-Left (9)</h4>
              <ul className="text-xs text-zinc-500 space-y-1">
                <li>NPR</li>
                <li>The Atlantic</li>
                <li>CNN</li>
                <li>NBC News</li>
                <li>CBS News</li>
                <li>ABC News</li>
                <li>New York Times</li>
                <li>Washington Post</li>
                <li>Politico</li>
              </ul>
            </div>

            {/* Center */}
            <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border-l-4 border-zinc-400">
              <h4 className="font-bold text-sm mb-2 text-zinc-600">Center (9)</h4>
              <ul className="text-xs text-zinc-500 space-y-1">
                <li>PBS NewsHour</li>
                <li>AP News</li>
                <li>Reuters</li>
                <li>The Hill</li>
                <li>USA Today</li>
                <li>BBC News</li>
                <li>Axios</li>
                <li>Bloomberg</li>
                <li>Business Insider</li>
              </ul>
            </div>

            {/* Center-Right */}
            <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border-l-4 border-orange-400">
              <h4 className="font-bold text-sm mb-2 text-orange-600">Center-Right (3)</h4>
              <ul className="text-xs text-zinc-500 space-y-1">
                <li>Wall Street Journal</li>
                <li>The Economist</li>
                <li>RealClearPolitics</li>
              </ul>
            </div>

            {/* Right */}
            <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border-l-4 border-rose-500">
              <h4 className="font-bold text-sm mb-2 text-rose-600">Right (9)</h4>
              <ul className="text-xs text-zinc-500 space-y-1">
                <li>Fox News</li>
                <li>NY Post</li>
                <li>Washington Examiner</li>
                <li>Daily Wire</li>
                <li>The Federalist</li>
                <li>Washington Times</li>
                <li>The Blaze</li>
                <li>American Conservative</li>
                <li>National Review</li>
              </ul>
            </div>

            {/* Far Right */}
            <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border-l-4 border-rose-700">
              <h4 className="font-bold text-sm mb-2 text-rose-700">Far Right (5)</h4>
              <ul className="text-xs text-zinc-500 space-y-1">
                <li>Breitbart</li>
                <li>Newsmax</li>
                <li>Daily Caller</li>
                <li>Gateway Pundit</li>
                <li>Epoch Times</li>
              </ul>
            </div>
          </div>
        </section>

        <footer className="pt-8 border-t border-zinc-200 dark:border-zinc-800 text-center text-xs text-zinc-400">
          <p>Pipeline Documentation - RageCheck / Clearview / Despun / LongView</p>
          <p className="mt-1">Last updated: {new Date().toISOString().split('T')[0]}</p>
        </footer>
      </div>
    </div>
  );
}
