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

from db import get_conn, insert_community_snapshots, get_topic_label, upsert_topic_label

log = logging.getLogger(__name__)

# In-memory topic label cache: keywords_key → label
_topic_label_cache: dict[str, str] = {}

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


# =============================================================================
# TOPIC GROUPING
# =============================================================================


def _make_keywords_key(keywords: list[str]) -> str:
    """Create a canonical cache key from a list of keywords."""
    return ",".join(sorted(k.lower() for k in keywords))


def group_posts_by_topic(
    posts: list[dict[str, Any]],
    top_terms: list[str],
) -> list[dict[str, Any]]:
    """
    Group posts by topic using top_terms as keyword buckets.

    1. Build threads by reply_root_uri
    2. Assign posts/threads to the best-matching top_term
    3. Merge co-occurring terms
    4. Label via Haiku (cached)

    Returns list of topic dicts with threads, standalone posts, and metadata.
    """
    if not posts or not top_terms:
        return []

    # --- Step 1: Build threads ---
    # A thread is a group of posts sharing the same reply_root_uri.
    # Posts with no reply_root_uri are standalone originals, unless
    # their URI is referenced as a thread root by other posts.
    threads: dict[str, list[dict[str, Any]]] = defaultdict(list)
    standalone: list[dict[str, Any]] = []

    # First pass: collect all reply_root_uris
    root_uris_referenced: set[str] = set()
    for post in posts:
        root_uri = post.get("reply_root_uri")
        if root_uri:
            root_uris_referenced.add(root_uri)

    # Build URI index for matching root posts
    uri_to_post: dict[str, dict[str, Any]] = {}
    for post in posts:
        if post.get("uri"):
            uri_to_post[post["uri"]] = post

    for post in posts:
        root_uri = post.get("reply_root_uri")
        if root_uri:
            threads[root_uri].append(post)
        elif post.get("uri") in root_uris_referenced:
            # This post is a root post referenced by replies
            threads[post["uri"]].append(post)
        else:
            standalone.append(post)

    # --- Step 2: Assign topics via keyword matching ---
    term_set = {t.lower() for t in top_terms}

    def _best_term(texts: list[str]) -> str | None:
        """Find the top_term with the highest match count across texts."""
        counts: Counter[str] = Counter()
        for text in texts:
            tokens = set(_tokenize_simple(text))
            for term in term_set:
                if term in tokens:
                    counts[term] += 1
        if counts:
            return counts.most_common(1)[0][0]
        return None

    # Map: term -> list of (type, data)
    # type is "thread" or "standalone"
    topic_buckets: dict[str, list[tuple[str, Any]]] = defaultdict(list)
    other_bucket: list[tuple[str, Any]] = []

    # Assign threads
    for root_uri, thread_posts in threads.items():
        texts = [p.get("text", "") for p in thread_posts]
        term = _best_term(texts)
        item = ("thread", {"root_uri": root_uri, "posts": thread_posts})
        if term:
            topic_buckets[term].append(item)
        else:
            other_bucket.append(item)

    # Assign standalone posts
    for post in standalone:
        term = _best_term([post.get("text", "")])
        item = ("standalone", post)
        if term:
            topic_buckets[term].append(item)
        else:
            other_bucket.append(item)

    # --- Step 3: Merge co-occurring terms ---
    # If two terms appear together in >50% of their posts, merge them.
    term_post_sets: dict[str, set[int]] = defaultdict(set)
    for idx, post in enumerate(posts):
        tokens = set(_tokenize_simple(post.get("text", "")))
        for term in term_set:
            if term in tokens:
                term_post_sets[term].add(idx)

    active_terms = [t for t in top_terms if t.lower() in topic_buckets]
    merged: dict[str, str] = {}  # secondary_term -> primary_term

    for i, t1 in enumerate(active_terms):
        k1 = t1.lower()
        if k1 in merged:
            continue
        for t2 in active_terms[i + 1:]:
            k2 = t2.lower()
            if k2 in merged:
                continue
            s1, s2 = term_post_sets.get(k1, set()), term_post_sets.get(k2, set())
            if not s1 or not s2:
                continue
            overlap = len(s1 & s2)
            if overlap > 0.5 * min(len(s1), len(s2)):
                # Merge: keep the one with more posts as primary
                if len(s1) >= len(s2):
                    merged[k2] = k1
                else:
                    merged[k1] = k2

    # Apply merges to topic_buckets
    for secondary, primary in merged.items():
        if secondary in topic_buckets:
            topic_buckets[primary].extend(topic_buckets.pop(secondary))

    # --- Step 4: Build result with labels ---
    # Prepare keyword groups for labeling
    keyword_groups: dict[str, list[str]] = {}
    for term_key in topic_buckets:
        keywords = [term_key]
        # Add any terms that were merged into this one
        for sec, pri in merged.items():
            if pri == term_key:
                keywords.append(sec)
        keyword_groups[term_key] = keywords

    # Get labels (Haiku or fallback)
    labels = _resolve_topic_labels(keyword_groups, posts)

    # Build final topic list
    result: list[dict[str, Any]] = []
    for term_key, items in topic_buckets.items():
        topic_threads = []
        topic_standalone = []

        for item_type, data in items:
            if item_type == "thread":
                thread_posts = data["posts"]
                # Find root post (no reply_parent_uri or reply_parent_uri == reply_root_uri)
                root = None
                replies = []
                for p in sorted(thread_posts, key=lambda x: x.get("created_at", "")):
                    if not p.get("reply_parent_uri"):
                        root = {**p, "post_type": "original"}
                    else:
                        replies.append({**p, "post_type": "reply"})
                if root is None and thread_posts:
                    # If root not in our set, use earliest post as pseudo-root
                    root = {**thread_posts[0], "post_type": "original"}
                    replies = [{**p, "post_type": "reply"} for p in thread_posts[1:]]
                if root:
                    topic_threads.append({"root": root, "replies": replies})
            else:
                post = data
                post_type = "original"
                if post.get("reply_parent_uri"):
                    post_type = "reply"
                topic_standalone.append({**post, "post_type": post_type})

        all_posts_in_topic = []
        for t in topic_threads:
            all_posts_in_topic.append(t["root"])
            all_posts_in_topic.extend(t["replies"])
        all_posts_in_topic.extend(topic_standalone)

        post_count = len(all_posts_in_topic)
        scores = [
            float(p.get("arousal_score", 0))
            for p in all_posts_in_topic
            if p.get("arousal_score") is not None
        ]
        mean_arousal = sum(scores) / len(scores) if scores else 0.0

        result.append({
            "topic_label": labels.get(term_key, term_key.title()),
            "topic_keywords": keyword_groups.get(term_key, [term_key]),
            "threads": topic_threads,
            "standalone": topic_standalone,
            "post_count": post_count,
            "mean_arousal": round(mean_arousal, 4),
        })

    # Add "Other" bucket if non-empty
    if other_bucket:
        other_threads = []
        other_standalone = []
        for item_type, data in other_bucket:
            if item_type == "thread":
                thread_posts = data["posts"]
                root = None
                replies = []
                for p in sorted(thread_posts, key=lambda x: x.get("created_at", "")):
                    if not p.get("reply_parent_uri"):
                        root = {**p, "post_type": "original"}
                    else:
                        replies.append({**p, "post_type": "reply"})
                if root is None and thread_posts:
                    root = {**thread_posts[0], "post_type": "original"}
                    replies = [{**p, "post_type": "reply"} for p in thread_posts[1:]]
                if root:
                    other_threads.append({"root": root, "replies": replies})
            else:
                post = data
                post_type = "original" if not post.get("reply_parent_uri") else "reply"
                other_standalone.append({**post, "post_type": post_type})

        all_other = []
        for t in other_threads:
            all_other.append(t["root"])
            all_other.extend(t["replies"])
        all_other.extend(other_standalone)

        scores = [
            float(p.get("arousal_score", 0))
            for p in all_other
            if p.get("arousal_score") is not None
        ]
        mean_arousal = sum(scores) / len(scores) if scores else 0.0

        result.append({
            "topic_label": "Other",
            "topic_keywords": [],
            "threads": other_threads,
            "standalone": other_standalone,
            "post_count": len(all_other),
            "mean_arousal": round(mean_arousal, 4),
        })

    # Sort by post count descending
    result.sort(key=lambda t: t["post_count"], reverse=True)
    return result


def _resolve_topic_labels(
    keyword_groups: dict[str, list[str]],
    posts: list[dict[str, Any]],
) -> dict[str, str]:
    """
    Resolve labels for topic keyword groups.

    Check in-memory cache → DB cache → call Haiku for unseen groups.
    Returns dict of term_key → label.
    """
    labels: dict[str, str] = {}
    uncached_groups: dict[str, list[str]] = {}

    for term_key, keywords in keyword_groups.items():
        kk = _make_keywords_key(keywords)

        # Check in-memory cache
        if kk in _topic_label_cache:
            labels[term_key] = _topic_label_cache[kk]
            continue

        # Check DB cache
        db_label = get_topic_label(kk)
        if db_label:
            _topic_label_cache[kk] = db_label
            labels[term_key] = db_label
            continue

        uncached_groups[term_key] = keywords

    if uncached_groups:
        # Call Haiku for all uncached groups at once
        llm_labels = label_topics_llm(uncached_groups, posts)
        for term_key, label in llm_labels.items():
            keywords = uncached_groups[term_key]
            kk = _make_keywords_key(keywords)
            _topic_label_cache[kk] = label
            try:
                upsert_topic_label(kk, label)
            except Exception as e:
                log.warning(f"Failed to persist topic label: {e}")
            labels[term_key] = label

    return labels


def label_topics_llm(
    keyword_groups: dict[str, list[str]],
    posts: list[dict[str, Any]],
) -> dict[str, str]:
    """
    Call Claude Haiku to generate 2-4 word topic labels for keyword groups.

    Single LLM call per community with all keyword buckets.
    Falls back to title-cased primary keyword on failure.
    """
    import os

    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        return {k: k.title() for k in keyword_groups}

    # Build sample snippets per group
    group_descriptions = []
    for term_key, keywords in keyword_groups.items():
        # Find sample posts matching this group
        samples = []
        kw_set = set(keywords)
        for post in posts:
            tokens = set(_tokenize_simple(post.get("text", "")))
            if tokens & kw_set:
                snippet = post.get("text", "")[:150]
                if snippet:
                    samples.append(snippet)
                if len(samples) >= 3:
                    break
        kw_str = ", ".join(keywords)
        sample_str = "\n  ".join(f"- {s}" for s in samples) if samples else "(no samples)"
        group_descriptions.append(
            f'Group "{kw_str}":\n  {sample_str}'
        )

    prompt = f"""Given these keyword groups from recent social media posts, provide a short (2-4 word) topic label for each group.

{chr(10).join(group_descriptions)}

Return ONLY a JSON object mapping each keyword group (use the first keyword as key) to its label.
Example: {{"tariff": "Trade Policy", "ukraine": "Ukraine Conflict"}}"""

    try:
        import anthropic
        import json as json_mod

        client = anthropic.Anthropic(api_key=api_key)
        message = client.messages.create(
            model="claude-3-5-haiku-20241022",
            max_tokens=300,
            messages=[{"role": "user", "content": prompt}],
        )
        response_text = message.content[0].text.strip()

        # Extract JSON from response (handle markdown code blocks)
        if "```" in response_text:
            # Extract content between code fences
            parts = response_text.split("```")
            for part in parts[1:]:
                # Skip the language tag line if present
                lines = part.strip().split("\n")
                if lines[0].strip() in ("json", ""):
                    lines = lines[1:]
                json_str = "\n".join(lines).strip()
                if json_str:
                    response_text = json_str
                    break

        parsed = json_mod.loads(response_text)
        result = {}
        for term_key in keyword_groups:
            if term_key in parsed:
                result[term_key] = str(parsed[term_key])
            else:
                result[term_key] = term_key.title()
        return result

    except Exception as e:
        log.warning(f"Topic label LLM call failed: {e}")
        return {k: k.title() for k in keyword_groups}
