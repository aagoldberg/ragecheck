"""
Community Pulse Computation

Runs every 10 minutes (triggered from jetstream.py).
Computes per-community arousal snapshots, detects spikes,
and writes results to bluesky_community_snapshots.
"""

from __future__ import annotations

import logging
import re
from collections import Counter, defaultdict
from datetime import datetime, timezone, timedelta
from typing import Any

import psycopg2
import psycopg2.extras

from db import get_conn, insert_community_snapshots

log = logging.getLogger(__name__)

# Common English stop words to exclude from top terms
STOP_WORDS = frozenset({
    "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
    "of", "with", "by", "from", "is", "it", "this", "that", "was", "are",
    "be", "has", "have", "had", "not", "no", "do", "does", "did", "will",
    "would", "could", "should", "can", "may", "might", "if", "so", "as",
    "than", "then", "when", "what", "who", "how", "why", "where", "which",
    "its", "i", "you", "he", "she", "we", "they", "me", "him", "her", "us",
    "them", "my", "your", "his", "our", "their", "about", "up", "out",
    "just", "like", "been", "were", "being", "more", "very", "all", "also",
    "into", "over", "some", "any", "only", "new", "other", "these", "those",
    "own", "same", "get", "got", "don't", "didn't", "won't", "can't",
    "there", "here", "one", "two", "way", "even", "because", "after",
    "before", "most", "much", "many", "make", "go", "going", "know",
    "think", "say", "said", "people", "want", "need", "thing", "things",
    "still", "right", "back", "now", "well", "good", "time", "too",
    "really", "see", "take", "come", "let", "every", "already", "never",
})


def _tokenize_simple(text: str) -> list[str]:
    """Simple tokenizer for top-term extraction."""
    return [
        w for w in re.sub(r"[^\w\s]", " ", text.lower()).split()
        if len(w) >= 3 and w not in STOP_WORDS
    ]


def _percentile(values: list[float], p: float) -> float:
    """Compute percentile without numpy dependency."""
    if not values:
        return 0.0
    sorted_v = sorted(values)
    k = (len(sorted_v) - 1) * (p / 100)
    f = int(k)
    c = f + 1
    if c >= len(sorted_v):
        return sorted_v[-1]
    return sorted_v[f] + (k - f) * (sorted_v[c] - sorted_v[f])


def compute_pulse() -> int:
    """
    Compute community pulse snapshots.

    1. Query bluesky_posts from last 30 min with arousal scores,
       joined to bluesky_community_members on author_did = user_did
    2. Per community: compute post_count, mean_arousal, p95_arousal, max_arousal
    3. Query 24h baseline: mean arousal per community
    4. Spike detection: flag if current_mean > baseline * 1.5 AND post_count >= 5
    5. Extract top terms from high-arousal posts per community
    6. Write snapshots to bluesky_community_snapshots

    Returns number of snapshots written.
    """
    now = datetime.now(timezone.utc)
    window_start = now - timedelta(minutes=30)
    baseline_start = now - timedelta(hours=24)

    with get_conn() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            # Step 1: Get recent posts with community assignments
            cur.execute(
                """SELECT
                     p.arousal_score,
                     p.text,
                     m.community_id
                   FROM bluesky_posts p
                   JOIN bluesky_community_members m ON m.user_did = p.author_did
                   WHERE p.created_at >= %s
                     AND p.arousal_score IS NOT NULL""",
                (window_start,),
            )
            recent_posts = cur.fetchall()

            if not recent_posts:
                log.info("Pulse: no recent scored posts found")
                return 0

            # Step 2: Group by community
            community_posts: dict[int, list[dict]] = defaultdict(list)
            for row in recent_posts:
                community_posts[row["community_id"]].append(dict(row))

            # Step 3: Query 24h baseline per community
            cur.execute(
                """SELECT
                     m.community_id,
                     AVG(p.arousal_score) AS baseline_mean
                   FROM bluesky_posts p
                   JOIN bluesky_community_members m ON m.user_did = p.author_did
                   WHERE p.created_at >= %s
                     AND p.arousal_score IS NOT NULL
                   GROUP BY m.community_id""",
                (baseline_start,),
            )
            baselines: dict[int, float] = {}
            for row in cur.fetchall():
                baselines[row["community_id"]] = float(row["baseline_mean"])

    # Step 4 & 5: Compute per-community stats
    snapshots: list[dict[str, Any]] = []
    for community_id, posts in community_posts.items():
        scores = [float(p["arousal_score"]) for p in posts]
        post_count = len(scores)
        mean_arousal = sum(scores) / post_count if post_count else 0.0
        max_arousal = max(scores) if scores else 0.0
        p95_arousal = _percentile(scores, 95)

        baseline = baselines.get(community_id, mean_arousal)

        # Spike detection
        spike = (
            mean_arousal > baseline * 1.5
            and post_count >= 5
            and baseline > 0
        )

        # Top terms from higher-arousal posts (arousal > 0.1)
        # Threshold lowered from 0.5 to surface terms during normal activity
        high_arousal_texts = [
            p["text"] for p in posts
            if float(p["arousal_score"]) > 0.1 and p.get("text")
        ]
        term_counts: Counter[str] = Counter()
        for text in high_arousal_texts:
            term_counts.update(_tokenize_simple(text))
        top_terms = [term for term, _ in term_counts.most_common(10)]

        snapshots.append({
            "community_id": community_id,
            "window_start": window_start,
            "window_end": now,
            "post_count": post_count,
            "mean_arousal": round(mean_arousal, 4),
            "max_arousal": round(max_arousal, 4),
            "p95_arousal": round(p95_arousal, 4),
            "baseline_arousal": round(baseline, 4),
            "spike": spike,
            "top_terms": top_terms,
        })

    # Step 6: Write to DB
    inserted = insert_community_snapshots(snapshots)
    log.info(
        f"Pulse: wrote {inserted} snapshots for {len(snapshots)} communities"
    )
    return inserted
