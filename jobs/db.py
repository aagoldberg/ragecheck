"""
SideLines Database Access (Python worker)

Read/write functions for Neon PostgreSQL via psycopg2.
"""

from __future__ import annotations

import os
import json
from decimal import Decimal
from typing import Any

import psycopg2
import psycopg2.extras


def _convert_decimals(row: dict[str, Any]) -> dict[str, Any]:
    """Convert decimal.Decimal values to float for igraph/numpy compatibility."""
    return {
        k: float(v) if isinstance(v, Decimal) else v
        for k, v in row.items()
    }


def get_conn():
    """Get a database connection from DATABASE_URL."""
    return psycopg2.connect(os.environ["DATABASE_URL"])


# =============================================================================
# READ FUNCTIONS
# =============================================================================


def get_event(event_id: int) -> dict[str, Any] | None:
    """Fetch a single event by ID."""
    with get_conn() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                "SELECT * FROM sidelines_events WHERE id = %s", (event_id,)
            )
            row = cur.fetchone()
            return _convert_decimals(dict(row)) if row else None


def get_users(event_id: int) -> list[dict[str, Any]]:
    """Fetch all users for an event."""
    with get_conn() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                "SELECT * FROM sidelines_users WHERE event_id = %s ORDER BY id",
                (event_id,),
            )
            return [_convert_decimals(dict(r)) for r in cur.fetchall()]


def get_interactions(event_id: int) -> list[dict[str, Any]]:
    """Fetch all interactions for an event."""
    with get_conn() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                "SELECT * FROM sidelines_interactions WHERE event_id = %s ORDER BY created_at",
                (event_id,),
            )
            return [_convert_decimals(dict(r)) for r in cur.fetchall()]


def get_posts(event_id: int) -> list[dict[str, Any]]:
    """Fetch all posts for an event."""
    with get_conn() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                "SELECT id, event_id, author_did, arousal_score FROM sidelines_posts WHERE event_id = %s",
                (event_id,),
            )
            return [_convert_decimals(dict(r)) for r in cur.fetchall()]


def get_top_posts_for_users(
    event_id: int,
    user_ids: list[int],
    limit: int = 3,
) -> list[dict[str, Any]]:
    """Fetch highest-arousal posts by specific user IDs."""
    if not user_ids:
        return []
    with get_conn() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                """SELECT p.id, p.text, p.author_did, p.author_handle,
                          p.arousal_score, p.arousal_breakdown,
                          u.id as user_id
                   FROM sidelines_posts p
                   JOIN sidelines_users u ON u.event_id = p.event_id AND u.did = p.author_did
                   WHERE p.event_id = %s
                     AND u.id = ANY(%s)
                     AND p.arousal_score IS NOT NULL
                   ORDER BY p.arousal_score DESC
                   LIMIT %s""",
                (event_id, user_ids, limit),
            )
            return [_convert_decimals(dict(r)) for r in cur.fetchall()]


def get_yesterday_metrics(
    event_id: int, today: str
) -> dict[str, Any] | None:
    """Fetch the most recent metrics before the given day."""
    with get_conn() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                """SELECT * FROM sidelines_daily_metrics
                   WHERE event_id = %s AND day < %s
                   ORDER BY day DESC LIMIT 1""",
                (event_id, today),
            )
            row = cur.fetchone()
            return _convert_decimals(dict(row)) if row else None


def get_yesterday_cluster_assignments(
    event_id: int, today: str
) -> list[dict[str, Any]]:
    """Fetch cluster assignments from the day before today."""
    with get_conn() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                """SELECT * FROM sidelines_cluster_assignments
                   WHERE event_id = %s AND day = (
                     SELECT MAX(day) FROM sidelines_cluster_assignments
                     WHERE event_id = %s AND day < %s
                   )""",
                (event_id, event_id, today),
            )
            return [_convert_decimals(dict(r)) for r in cur.fetchall()]


def get_yesterday_user_features(
    event_id: int, today: str
) -> list[dict[str, Any]]:
    """Fetch user features from the day before today."""
    with get_conn() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                """SELECT * FROM sidelines_user_features
                   WHERE event_id = %s AND day = (
                     SELECT MAX(day) FROM sidelines_user_features
                     WHERE event_id = %s AND day < %s
                   )""",
                (event_id, event_id, today),
            )
            return [_convert_decimals(dict(r)) for r in cur.fetchall()]


# =============================================================================
# WRITE FUNCTIONS
# =============================================================================


def upsert_daily_metrics(
    event_id: int,
    day: str,
    metrics: dict[str, Any],
    confidence: str,
) -> None:
    """Upsert daily metrics for an event."""
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """INSERT INTO sidelines_daily_metrics (event_id, day, metrics_json, confidence)
                   VALUES (%s, %s, %s::jsonb, %s)
                   ON CONFLICT (event_id, day) DO UPDATE SET
                     metrics_json = EXCLUDED.metrics_json,
                     confidence = EXCLUDED.confidence""",
                (event_id, day, json.dumps(metrics), confidence),
            )
        conn.commit()


def upsert_cluster_assignments(
    assignments: list[dict[str, Any]],
) -> None:
    """Upsert cluster assignments using batch insert."""
    if not assignments:
        return
    with get_conn() as conn:
        with conn.cursor() as cur:
            values = [
                (a["event_id"], a["day"], a["user_id"], a["cluster_id"], a["score"])
                for a in assignments
            ]
            psycopg2.extras.execute_values(
                cur,
                """INSERT INTO sidelines_cluster_assignments
                   (event_id, day, user_id, cluster_id, score)
                   VALUES %s
                   ON CONFLICT (event_id, day, user_id) DO UPDATE SET
                     cluster_id = EXCLUDED.cluster_id,
                     score = EXCLUDED.score""",
                values,
                page_size=500,
            )
        conn.commit()


def upsert_user_features(
    features: list[dict[str, Any]],
) -> None:
    """Upsert user features using batch insert."""
    if not features:
        return
    with get_conn() as conn:
        with conn.cursor() as cur:
            values = [
                (
                    f["event_id"], f["day"], f["user_id"],
                    f["arousal_mean"], f["arousal_p95"],
                    f["post_count"], f["in_degree"], f["out_degree"],
                    f["betweenness"],
                )
                for f in features
            ]
            psycopg2.extras.execute_values(
                cur,
                """INSERT INTO sidelines_user_features
                   (event_id, day, user_id, arousal_mean, arousal_p95,
                    post_count, in_degree, out_degree, betweenness)
                   VALUES %s
                   ON CONFLICT (event_id, day, user_id) DO UPDATE SET
                     arousal_mean = EXCLUDED.arousal_mean,
                     arousal_p95 = EXCLUDED.arousal_p95,
                     post_count = EXCLUDED.post_count,
                     in_degree = EXCLUDED.in_degree,
                     out_degree = EXCLUDED.out_degree,
                     betweenness = EXCLUDED.betweenness""",
                values,
                page_size=500,
            )
        conn.commit()


def update_event_status(event_id: int, status: str) -> None:
    """Update the status of an event."""
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE sidelines_events SET status = %s WHERE id = %s",
                (status, event_id),
            )
        conn.commit()


# =============================================================================
# FOLLOW-RELATED READ FUNCTIONS
# =============================================================================


def get_follows(event_id: int) -> list[dict[str, Any]]:
    """Fetch all follow relationships for an event."""
    with get_conn() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                """SELECT user_did, follows_did, follows_handle
                   FROM sidelines_user_follows
                   WHERE event_id = %s""",
                (event_id,),
            )
            return [dict(r) for r in cur.fetchall()]


def get_posts_with_text(event_id: int) -> list[dict[str, Any]]:
    """Fetch posts with full text for community characterization."""
    with get_conn() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                """SELECT id, author_did, author_handle, text,
                          arousal_score, arousal_breakdown
                   FROM sidelines_posts
                   WHERE event_id = %s AND text != ''""",
                (event_id,),
            )
            return [_convert_decimals(dict(r)) for r in cur.fetchall()]


def get_existing_metrics(event_id: int, day: str) -> dict[str, Any] | None:
    """Fetch existing metrics for merging co-follow results."""
    with get_conn() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                """SELECT metrics_json, confidence
                   FROM sidelines_daily_metrics
                   WHERE event_id = %s AND day = %s""",
                (event_id, day),
            )
            row = cur.fetchone()
            if not row:
                return None
            result = _convert_decimals(dict(row))
            if isinstance(result["metrics_json"], str):
                result["metrics_json"] = json.loads(result["metrics_json"])
            return result


# =============================================================================
# GLOBAL BLUESKY COMMUNITY MAP FUNCTIONS
# =============================================================================


def get_all_global_follows() -> list[dict[str, Any]]:
    """Fetch all global follow relationships."""
    with get_conn() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                "SELECT user_did, follows_did, follows_handle FROM bluesky_follows"
            )
            return [dict(r) for r in cur.fetchall()]


def get_tracked_user_dids() -> list[str]:
    """Fetch all tracked user DIDs."""
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT did FROM bluesky_tracked_users")
            return [r[0] for r in cur.fetchall()]


def upsert_communities(
    communities: list[dict[str, Any]],
) -> list[int]:
    """Write community definitions (full recompute — clears old data)."""
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM bluesky_community_members")
            cur.execute("DELETE FROM bluesky_communities")
            ids = []
            for c in communities:
                cur.execute(
                    """INSERT INTO bluesky_communities
                       (name, description, top_followed_handles, member_count, computed_at)
                       VALUES (%s, %s, %s, %s, NOW())
                       RETURNING id""",
                    (
                        c["name"],
                        c["description"],
                        c["top_followed_handles"],
                        c["member_count"],
                    ),
                )
                ids.append(cur.fetchone()[0])
        conn.commit()
    return ids


def upsert_community_members(
    assignments: list[dict[str, Any]],
) -> None:
    """Write community membership assignments."""
    if not assignments:
        return
    with get_conn() as conn:
        with conn.cursor() as cur:
            values = [
                (a["user_did"], a["community_id"])
                for a in assignments
            ]
            psycopg2.extras.execute_values(
                cur,
                """INSERT INTO bluesky_community_members (user_did, community_id)
                   VALUES %s
                   ON CONFLICT (user_did) DO UPDATE SET
                     community_id = EXCLUDED.community_id,
                     computed_at = NOW()""",
                values,
                page_size=500,
            )
        conn.commit()


def get_community_assignments_for_dids(
    dids: list[str],
) -> list[dict[str, Any]]:
    """Look up global community assignments for a list of DIDs."""
    if not dids:
        return []
    with get_conn() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                """SELECT
                     m.user_did,
                     m.community_id,
                     c.name AS community_name,
                     c.description AS community_description
                   FROM bluesky_community_members m
                   JOIN bluesky_communities c ON c.id = m.community_id
                   WHERE m.user_did = ANY(%s)""",
                (dids,),
            )
            return [dict(r) for r in cur.fetchall()]


def get_global_communities() -> list[dict[str, Any]]:
    """Fetch all global community definitions."""
    with get_conn() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                "SELECT * FROM bluesky_communities ORDER BY member_count DESC"
            )
            return [dict(r) for r in cur.fetchall()]
