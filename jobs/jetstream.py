"""
Bluesky Jetstream Consumer

Persistent WebSocket consumer that subscribes to the Bluesky Jetstream
for real-time follow AND post events from tracked users.

Jetstream endpoint: wss://jetstream2.us-east.bsky.network/subscribe
  ?wantedCollections=app.bsky.graph.follow
  &wantedCollections=app.bsky.feed.post

No authentication required. Supports cursor-based resume on reconnect.

Run as standalone: python jetstream.py
"""

from __future__ import annotations

import asyncio
import json
import logging
import os
import signal
import time
from datetime import datetime, timezone
from typing import Any

import psycopg2
import psycopg2.extras

from arousal import compute_arousal
from pulse import compute_pulse

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
)
log = logging.getLogger(__name__)

JETSTREAM_URL = "wss://jetstream2.us-east.bsky.network/subscribe"
WANTED_COLLECTIONS = [
    "app.bsky.graph.follow",
    "app.bsky.feed.post",
]
FLUSH_INTERVAL_S = 5
FLUSH_BATCH_SIZE = 500
RECONNECT_DELAY_S = 5
MAX_RECONNECT_DELAY_S = 60

CURSOR_FILE = os.environ.get("JETSTREAM_CURSOR_FILE", "/tmp/jetstream_cursor.txt")
PULSE_INTERVAL_S = 600  # 10 minutes


def _get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def _load_tracked_dids() -> set[str]:
    """Load the set of tracked DIDs from the database."""
    with _get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT did FROM bluesky_tracked_users")
            return {r[0] for r in cur.fetchall()}


def _save_cursor(cursor: int) -> None:
    try:
        with open(CURSOR_FILE, "w") as f:
            f.write(str(cursor))
    except OSError:
        pass


def _load_cursor() -> int | None:
    try:
        with open(CURSOR_FILE, "r") as f:
            return int(f.read().strip())
    except (OSError, ValueError):
        return None


def _flush_follows(buffer: list[tuple[str, str, str]]) -> int:
    """Flush buffered follow rows to the database."""
    if not buffer:
        return 0
    with _get_conn() as conn:
        with conn.cursor() as cur:
            psycopg2.extras.execute_values(
                cur,
                """INSERT INTO bluesky_follows (user_did, follows_did, follows_handle)
                   VALUES %s
                   ON CONFLICT (user_did, follows_did) DO NOTHING""",
                buffer,
                page_size=500,
            )
            inserted = cur.rowcount
        conn.commit()
    return inserted


def _flush_posts(buffer: list[tuple]) -> int:
    """Flush buffered post rows to the database."""
    if not buffer:
        return 0
    with _get_conn() as conn:
        with conn.cursor() as cur:
            psycopg2.extras.execute_values(
                cur,
                """INSERT INTO bluesky_posts
                   (author_did, uri, text, reply_parent_uri, reply_root_uri,
                    quote_uri, langs, created_at, arousal_score, arousal_breakdown)
                   VALUES %s
                   ON CONFLICT (uri) DO NOTHING""",
                buffer,
                page_size=500,
            )
            inserted = cur.rowcount
        conn.commit()
    return inserted


def _parse_post_record(
    user_did: str, commit: dict
) -> tuple | None:
    """Parse a post commit into a DB row tuple."""
    record = commit.get("record", {})
    rkey = commit.get("rkey", "")
    uri = f"at://{user_did}/app.bsky.feed.post/{rkey}"

    text = record.get("text", "")
    created_at_str = record.get("createdAt", "")
    langs = record.get("langs", [])

    # Parse reply
    reply = record.get("reply", {})
    reply_parent_uri = None
    reply_root_uri = None
    if reply:
        parent = reply.get("parent", {})
        root = reply.get("root", {})
        reply_parent_uri = parent.get("uri") if parent else None
        reply_root_uri = root.get("uri") if root else None

    # Parse quote (embed with record)
    quote_uri = None
    embed = record.get("embed", {})
    if embed:
        embed_type = embed.get("$type", "")
        if "record" in embed_type:
            embedded_record = embed.get("record", {})
            quote_uri = embedded_record.get("uri")

    # Parse timestamp
    try:
        if created_at_str:
            created_at = datetime.fromisoformat(
                created_at_str.replace("Z", "+00:00")
            )
        else:
            created_at = datetime.now(timezone.utc)
    except (ValueError, TypeError):
        created_at = datetime.now(timezone.utc)

    # Compute arousal score inline
    arousal_result = compute_arousal(text)
    arousal_score = arousal_result["score"]
    arousal_breakdown = json.dumps(arousal_result["breakdown"])

    return (
        user_did,
        uri,
        text,
        reply_parent_uri,
        reply_root_uri,
        quote_uri,
        langs,
        created_at,
        arousal_score,
        arousal_breakdown,
    )


async def consume_jetstream() -> None:
    """
    Main consumer loop. Connects to Jetstream, filters events
    for tracked users, writes follows and posts to the database.
    """
    try:
        import websockets
    except ImportError:
        log.error("websockets package not installed. Run: pip install websockets")
        return

    tracked_dids = _load_tracked_dids()
    log.info(f"Loaded {len(tracked_dids)} tracked DIDs")

    last_tracked_refresh = time.time()
    tracked_refresh_interval = 300
    last_pulse_run = time.time()

    follow_buffer: list[tuple[str, str, str]] = []
    post_buffer: list[tuple] = []
    last_flush = time.time()
    last_cursor: int | None = _load_cursor()

    reconnect_delay = RECONNECT_DELAY_S
    stats = {"follows": 0, "posts": 0, "skipped": 0}

    while True:
        params = [f"wantedCollections={c}" for c in WANTED_COLLECTIONS]
        if last_cursor:
            params.append(f"cursor={last_cursor}")
        url = f"{JETSTREAM_URL}?{'&'.join(params)}"

        try:
            async with websockets.connect(url, ping_interval=30) as ws:
                log.info(f"Connected to Jetstream (cursor={last_cursor})")
                reconnect_delay = RECONNECT_DELAY_S

                async for raw_msg in ws:
                    try:
                        msg = json.loads(raw_msg)
                    except json.JSONDecodeError:
                        continue

                    time_us = msg.get("time_us")
                    if time_us:
                        last_cursor = time_us

                    if msg.get("kind") != "commit":
                        continue

                    commit = msg.get("commit", {})
                    collection = commit.get("collection", "")
                    user_did = msg.get("did", "")
                    operation = commit.get("operation", "")

                    if user_did not in tracked_dids:
                        stats["skipped"] += 1
                        continue

                    # Handle follows
                    if collection == "app.bsky.graph.follow":
                        if operation == "create":
                            record = commit.get("record", {})
                            follows_did = record.get("subject", "")
                            if follows_did:
                                follow_buffer.append(
                                    (user_did, follows_did, "")
                                )
                                stats["follows"] += 1

                    # Handle posts
                    elif collection == "app.bsky.feed.post":
                        if operation == "create":
                            row = _parse_post_record(user_did, commit)
                            if row:
                                post_buffer.append(row)
                                stats["posts"] += 1

                    # Periodic flush
                    now = time.time()
                    needs_flush = (
                        len(follow_buffer) + len(post_buffer) >= FLUSH_BATCH_SIZE
                        or (
                            (follow_buffer or post_buffer)
                            and now - last_flush >= FLUSH_INTERVAL_S
                        )
                    )

                    if needs_flush:
                        _flush_follows(follow_buffer)
                        _flush_posts(post_buffer)
                        follow_buffer.clear()
                        post_buffer.clear()
                        last_flush = now
                        _save_cursor(last_cursor)

                        total = stats["follows"] + stats["posts"]
                        if total % 500 == 0 and total > 0:
                            log.info(
                                f"follows={stats['follows']:,} "
                                f"posts={stats['posts']:,} "
                                f"skipped={stats['skipped']:,}"
                            )

                    # Refresh tracked DIDs periodically
                    if now - last_tracked_refresh >= tracked_refresh_interval:
                        tracked_dids = _load_tracked_dids()
                        last_tracked_refresh = now
                        log.info(
                            f"Refreshed tracked DIDs: {len(tracked_dids)}"
                        )

                    # Run pulse computation periodically
                    if now - last_pulse_run >= PULSE_INTERVAL_S:
                        try:
                            compute_pulse()
                            log.info("Pulse computation completed")
                        except Exception as pulse_err:
                            log.warning(f"Pulse computation failed: {pulse_err}")
                        last_pulse_run = now

        except Exception as e:
            if follow_buffer:
                _flush_follows(follow_buffer)
                follow_buffer.clear()
            if post_buffer:
                _flush_posts(post_buffer)
                post_buffer.clear()
            if last_cursor:
                _save_cursor(last_cursor)

            log.warning(
                f"Disconnected: {e}. Reconnecting in {reconnect_delay}s..."
            )
            await asyncio.sleep(reconnect_delay)
            reconnect_delay = min(reconnect_delay * 2, MAX_RECONNECT_DELAY_S)


def main() -> None:
    """Entry point for standalone execution."""
    log.info("Starting Jetstream consumer (follows + posts)...")

    loop = asyncio.new_event_loop()

    def shutdown(sig, frame):
        log.info(f"Received {signal.Signals(sig).name}, shutting down...")
        loop.stop()

    signal.signal(signal.SIGINT, shutdown)
    signal.signal(signal.SIGTERM, shutdown)

    try:
        loop.run_until_complete(consume_jetstream())
    except KeyboardInterrupt:
        pass
    finally:
        loop.close()
        log.info("Jetstream consumer stopped.")


if __name__ == "__main__":
    main()
