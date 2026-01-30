"""
SideLines Database Access (Python worker)

Read/write functions for Neon PostgreSQL via psycopg2.
"""

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
    """Upsert cluster assignments."""
    if not assignments:
        return
    with get_conn() as conn:
        with conn.cursor() as cur:
            for a in assignments:
                cur.execute(
                    """INSERT INTO sidelines_cluster_assignments
                       (event_id, day, user_id, cluster_id, score)
                       VALUES (%s, %s, %s, %s, %s)
                       ON CONFLICT (event_id, day, user_id) DO UPDATE SET
                         cluster_id = EXCLUDED.cluster_id,
                         score = EXCLUDED.score""",
                    (a["event_id"], a["day"], a["user_id"], a["cluster_id"], a["score"]),
                )
        conn.commit()


def upsert_user_features(
    features: list[dict[str, Any]],
) -> None:
    """Upsert user features."""
    if not features:
        return
    with get_conn() as conn:
        with conn.cursor() as cur:
            for f in features:
                cur.execute(
                    """INSERT INTO sidelines_user_features
                       (event_id, day, user_id, arousal_mean, arousal_p95,
                        post_count, in_degree, out_degree, betweenness)
                       VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                       ON CONFLICT (event_id, day, user_id) DO UPDATE SET
                         arousal_mean = EXCLUDED.arousal_mean,
                         arousal_p95 = EXCLUDED.arousal_p95,
                         post_count = EXCLUDED.post_count,
                         in_degree = EXCLUDED.in_degree,
                         out_degree = EXCLUDED.out_degree,
                         betweenness = EXCLUDED.betweenness""",
                    (
                        f["event_id"], f["day"], f["user_id"],
                        f["arousal_mean"], f["arousal_p95"],
                        f["post_count"], f["in_degree"], f["out_degree"],
                        f["betweenness"],
                    ),
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
