"""
Bluesky Jetstream Consumer

Persistent WebSocket consumer that subscribes to the Bluesky Jetstream
for real-time follow events. Keeps the global follow graph up to date.

Jetstream endpoint: wss://jetstream2.us-east.bsky.network/subscribe
  ?wantedCollections=app.bsky.graph.follow

No authentication required. Supports cursor-based resume on reconnect.

Run as standalone: python jetstream.py
Or via FastAPI endpoint for managed start/stop.
"""

from __future__ import annotations

import asyncio
import json
import logging
import os
import signal
import time
from typing import Any

import psycopg2
import psycopg2.extras

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
)
log = logging.getLogger(__name__)

JETSTREAM_URL = "wss://jetstream2.us-east.bsky.network/subscribe"
WANTED_COLLECTIONS = ["app.bsky.graph.follow"]
FLUSH_INTERVAL_S = 5
FLUSH_BATCH_SIZE = 500
RECONNECT_DELAY_S = 5
MAX_RECONNECT_DELAY_S = 60

# State file for cursor persistence across restarts
CURSOR_FILE = os.environ.get("JETSTREAM_CURSOR_FILE", "/tmp/jetstream_cursor.txt")


def _get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def _load_tracked_dids() -> set[str]:
    """Load the set of tracked DIDs from the database."""
    with _get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT did FROM bluesky_tracked_users")
            return {r[0] for r in cur.fetchall()}


def _save_cursor(cursor: int) -> None:
    """Persist cursor to file for resume on restart."""
    try:
        with open(CURSOR_FILE, "w") as f:
            f.write(str(cursor))
    except OSError:
        pass


def _load_cursor() -> int | None:
    """Load cursor from file."""
    try:
        with open(CURSOR_FILE, "r") as f:
            return int(f.read().strip())
    except (OSError, ValueError):
        return None


def _flush_follows(
    buffer: list[tuple[str, str, str]],
) -> int:
    """Flush buffered follow rows to the database. Returns count inserted."""
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


def _flush_unfollows(
    buffer: list[tuple[str, str]],
) -> int:
    """Remove unfollowed relationships. Returns count deleted."""
    if not buffer:
        return 0
    with _get_conn() as conn:
        with conn.cursor() as cur:
            deleted = 0
            for user_did, follows_did in buffer:
                cur.execute(
                    "DELETE FROM bluesky_follows WHERE user_did = %s AND follows_did = %s",
                    (user_did, follows_did),
                )
                deleted += cur.rowcount
        conn.commit()
    return deleted


async def consume_jetstream() -> None:
    """
    Main consumer loop. Connects to Jetstream, filters follow events
    for tracked users, and writes to bluesky_follows.
    """
    try:
        import websockets
    except ImportError:
        log.error("websockets package not installed. Run: pip install websockets")
        return

    # Load tracked DIDs (refresh periodically)
    tracked_dids = _load_tracked_dids()
    log.info(f"Loaded {len(tracked_dids)} tracked DIDs")

    last_tracked_refresh = time.time()
    tracked_refresh_interval = 300  # refresh every 5 min

    follow_buffer: list[tuple[str, str, str]] = []
    unfollow_buffer: list[tuple[str, str]] = []
    last_flush = time.time()
    last_cursor: int | None = _load_cursor()

    reconnect_delay = RECONNECT_DELAY_S
    total_processed = 0
    total_inserted = 0

    while True:
        # Build URL with params
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

                    # Update cursor
                    time_us = msg.get("time_us")
                    if time_us:
                        last_cursor = time_us

                    # Only process commit events
                    if msg.get("kind") != "commit":
                        continue

                    commit = msg.get("commit", {})
                    collection = commit.get("collection", "")
                    if collection != "app.bsky.graph.follow":
                        continue

                    user_did = msg.get("did", "")
                    operation = commit.get("operation", "")

                    # Only track follows from/to tracked users
                    if user_did not in tracked_dids:
                        continue

                    total_processed += 1

                    if operation == "create":
                        record = commit.get("record", {})
                        follows_did = record.get("subject", "")
                        if follows_did:
                            follow_buffer.append((user_did, follows_did, ""))
                    elif operation == "delete":
                        # For deletes, we need the rkey to find the target
                        # Jetstream doesn't include the record on delete,
                        # so we skip unfollow tracking for now
                        pass

                    # Periodic flush
                    now = time.time()
                    if (
                        len(follow_buffer) >= FLUSH_BATCH_SIZE
                        or (follow_buffer and now - last_flush >= FLUSH_INTERVAL_S)
                    ):
                        inserted = _flush_follows(follow_buffer)
                        total_inserted += inserted
                        follow_buffer.clear()
                        last_flush = now
                        _save_cursor(last_cursor)

                        if total_processed % 1000 == 0:
                            log.info(
                                f"Processed {total_processed} events, "
                                f"inserted {total_inserted} follows"
                            )

                    # Refresh tracked DIDs periodically
                    if now - last_tracked_refresh >= tracked_refresh_interval:
                        tracked_dids = _load_tracked_dids()
                        last_tracked_refresh = now
                        log.info(f"Refreshed tracked DIDs: {len(tracked_dids)}")

        except Exception as e:
            # Flush any remaining buffer before reconnect
            if follow_buffer:
                _flush_follows(follow_buffer)
                follow_buffer.clear()
            if last_cursor:
                _save_cursor(last_cursor)

            log.warning(f"Disconnected: {e}. Reconnecting in {reconnect_delay}s...")
            await asyncio.sleep(reconnect_delay)
            reconnect_delay = min(reconnect_delay * 2, MAX_RECONNECT_DELAY_S)


def main() -> None:
    """Entry point for standalone execution."""
    log.info("Starting Jetstream consumer...")

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
