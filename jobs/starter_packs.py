"""
Bluesky Starter Pack Crawler

Crawls political starter packs via Bluesky public API to seed the global
follow graph with politically-active users.

Steps:
1. Search for political starter packs
2. Get member DIDs from each pack
3. Store members in bluesky_tracked_users
4. Backfill follows for each member via public API
5. Store follows in bluesky_follows

No authentication required — uses public API only.
"""

from __future__ import annotations

import time
from typing import Any

import httpx

from db import get_conn
import psycopg2.extras

BSKY_PUBLIC_API = "https://public.api.bsky.app/xrpc"
RATE_LIMIT_MS = 120
FOLLOWS_PER_PAGE = 100


def search_starter_packs(
    query: str, limit: int = 100
) -> list[dict[str, Any]]:
    """Search for starter packs matching a query."""
    packs: list[dict[str, Any]] = []
    cursor: str | None = None

    while len(packs) < limit:
        params: dict[str, Any] = {"q": query, "limit": min(25, limit - len(packs))}
        if cursor:
            params["cursor"] = cursor

        resp = httpx.get(
            f"{BSKY_PUBLIC_API}/app.bsky.graph.searchStarterPacks",
            params=params,
            timeout=30,
        )
        if resp.status_code != 200:
            break

        data = resp.json()
        batch = data.get("starterPacks", [])
        if not batch:
            break

        packs.extend(batch)
        cursor = data.get("cursor")
        if not cursor:
            break

        time.sleep(RATE_LIMIT_MS / 1000)

    return packs[:limit]


def get_starter_pack_list_uri(pack_uri: str) -> str | None:
    """Get the underlying list URI from a starter pack."""
    resp = httpx.get(
        f"{BSKY_PUBLIC_API}/app.bsky.graph.getStarterPack",
        params={"starterPack": pack_uri},
        timeout=30,
    )
    if resp.status_code != 200:
        return None

    data = resp.json()
    sp = data.get("starterPack", {})
    list_ref = sp.get("list")
    if isinstance(list_ref, dict):
        return list_ref.get("uri")
    return sp.get("listUri")


def get_list_members(list_uri: str) -> list[dict[str, str]]:
    """Get all members of a Bluesky list. Returns [{did, handle}]."""
    members: list[dict[str, str]] = []
    cursor: str | None = None

    for _ in range(20):  # max 20 pages
        params: dict[str, Any] = {"list": list_uri, "limit": 100}
        if cursor:
            params["cursor"] = cursor

        resp = httpx.get(
            f"{BSKY_PUBLIC_API}/app.bsky.graph.getList",
            params=params,
            timeout=30,
        )
        if resp.status_code != 200:
            break

        data = resp.json()
        items = data.get("items", [])
        if not items:
            break

        for item in items:
            subject = item.get("subject", {})
            members.append({
                "did": subject.get("did", ""),
                "handle": subject.get("handle", ""),
            })

        cursor = data.get("cursor")
        if not cursor:
            break

        time.sleep(RATE_LIMIT_MS / 1000)

    return members


def fetch_user_follows(did: str) -> list[dict[str, str]] | None:
    """Fetch all follows for a single user. Returns None if user is inaccessible."""
    follows: list[dict[str, str]] = []
    cursor: str | None = None

    for _ in range(50):  # max 5000 follows
        params: dict[str, Any] = {"actor": did, "limit": FOLLOWS_PER_PAGE}
        if cursor:
            params["cursor"] = cursor

        resp = httpx.get(
            f"{BSKY_PUBLIC_API}/app.bsky.graph.getFollows",
            params=params,
            timeout=30,
        )

        if resp.status_code in (400, 404):
            return None
        if resp.status_code == 429:
            time.sleep(2)
            resp = httpx.get(
                f"{BSKY_PUBLIC_API}/app.bsky.graph.getFollows",
                params=params,
                timeout=30,
            )
            if resp.status_code != 200:
                return None
        elif resp.status_code != 200:
            return None

        data = resp.json()
        for f in data.get("follows", []):
            follows.append({
                "follows_did": f.get("did", ""),
                "follows_handle": f.get("handle", ""),
            })

        cursor = data.get("cursor")
        if not cursor or not data.get("follows"):
            break

        time.sleep(RATE_LIMIT_MS / 1000)

    return follows


def store_tracked_users(
    members: list[dict[str, str]], source: str
) -> int:
    """Store DIDs in bluesky_tracked_users. Returns count of new users added."""
    if not members:
        return 0
    with get_conn() as conn:
        with conn.cursor() as cur:
            values = [
                (m["did"], m["handle"], source)
                for m in members
                if m["did"]
            ]
            if not values:
                return 0
            psycopg2.extras.execute_values(
                cur,
                """INSERT INTO bluesky_tracked_users (did, handle, source)
                   VALUES %s
                   ON CONFLICT (did) DO NOTHING""",
                values,
                page_size=500,
            )
            added = cur.rowcount
        conn.commit()
    return added


def store_follows_batch(
    user_did: str, follows: list[dict[str, str]]
) -> None:
    """Store follow relationships and mark user as fetched."""
    with get_conn() as conn:
        with conn.cursor() as cur:
            if follows:
                values = [
                    (user_did, f["follows_did"], f["follows_handle"])
                    for f in follows
                ]
                psycopg2.extras.execute_values(
                    cur,
                    """INSERT INTO bluesky_follows (user_did, follows_did, follows_handle)
                       VALUES %s
                       ON CONFLICT (user_did, follows_did) DO NOTHING""",
                    values,
                    page_size=500,
                )
            cur.execute(
                """INSERT INTO bluesky_follows_fetched (user_did, fetched_at, follow_count)
                   VALUES (%s, NOW(), %s)
                   ON CONFLICT (user_did) DO UPDATE SET
                     fetched_at = NOW(), follow_count = EXCLUDED.follow_count""",
                (user_did, len(follows)),
            )
        conn.commit()


def get_unfetched_tracked_dids(limit: int = 200) -> list[str]:
    """Get tracked users whose follows haven't been backfilled yet."""
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """SELECT t.did FROM bluesky_tracked_users t
                   LEFT JOIN bluesky_follows_fetched f ON f.user_did = t.did
                   WHERE f.user_did IS NULL
                   LIMIT %s""",
                (limit,),
            )
            return [r[0] for r in cur.fetchall()]


def crawl_starter_packs(
    queries: list[str] | None = None,
    max_packs: int = 100,
) -> dict[str, Any]:
    """
    Crawl political starter packs and store member DIDs.

    Returns summary: {packs_found, members_found, new_users_added}
    """
    if queries is None:
        queries = [
            "politics",
            "political",
            "news politics",
            "democrat",
            "republican",
            "progressive",
            "conservative",
            "liberal",
            "congress",
            "election",
        ]

    all_members: list[dict[str, str]] = []
    packs_processed = 0

    for query in queries:
        packs = search_starter_packs(query, limit=max_packs // len(queries))

        for pack in packs:
            pack_uri = pack.get("uri", "")
            if not pack_uri:
                continue

            list_uri = get_starter_pack_list_uri(pack_uri)
            if not list_uri:
                continue

            members = get_list_members(list_uri)
            all_members.extend(members)
            packs_processed += 1

            time.sleep(RATE_LIMIT_MS / 1000)

    # Deduplicate by DID
    seen: set[str] = set()
    unique_members: list[dict[str, str]] = []
    for m in all_members:
        if m["did"] and m["did"] not in seen:
            seen.add(m["did"])
            unique_members.append(m)

    new_count = store_tracked_users(unique_members, "starter_pack")

    return {
        "packs_found": packs_processed,
        "members_found": len(unique_members),
        "new_users_added": new_count,
    }


def backfill_follows(batch_size: int = 200) -> dict[str, Any]:
    """
    Backfill follows for tracked users who haven't been fetched yet.

    Call repeatedly until done == True.
    Returns: {processed, remaining, done}
    """
    unfetched = get_unfetched_tracked_dids(limit=batch_size)

    if not unfetched:
        return {"processed": 0, "remaining": 0, "done": True}

    processed = 0
    for did in unfetched:
        follows = fetch_user_follows(did)
        if follows is not None:
            store_follows_batch(did, follows)
        else:
            # Mark as fetched with 0 follows (inaccessible user)
            store_follows_batch(did, [])
        processed += 1
        time.sleep(RATE_LIMIT_MS / 1000)

    remaining = len(get_unfetched_tracked_dids(limit=1))

    return {
        "processed": processed,
        "remaining": remaining,
        "done": remaining == 0,
    }
