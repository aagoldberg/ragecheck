"""
SideLines Python Analysis Worker

FastAPI app that runs graph analysis on collected Bluesky data.
Deployed on Railway, triggered by Vercel API routes.
"""

from __future__ import annotations

import os
from datetime import date, datetime
from typing import Any

import numpy as np
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from analysis import (
    build_graph,
    detect_communities,
    compute_betweenness,
    compute_base_activation,
    compute_cross_cluster_contact,
    compute_bridge_nodes,
    compute_bridge_churn,
    compute_attack_matrix,
    compute_middle_attrition,
    assess_confidence,
    extract_giant_component,
    compute_cluster_summaries,
    compute_discourse_temperature,
    generate_headline_insight,
    get_bridge_user_details,
    compute_inter_cluster_edges,
    compute_field_positions,
    build_cofollow_graph,
    build_global_cofollow_graph,
    characterize_communities,
    summarize_community_llm,
)
from db import (
    get_event,
    get_users,
    get_interactions,
    get_posts,
    get_posts_with_text,
    get_follows,
    get_existing_metrics,
    get_yesterday_metrics,
    get_yesterday_user_features,
    upsert_daily_metrics,
    upsert_cluster_assignments,
    upsert_user_features,
    update_event_status,
    get_all_global_follows,
    upsert_communities,
    upsert_community_members,
    get_community_assignments_for_dids,
    get_global_communities,
)
from starter_packs import crawl_starter_packs, backfill_follows

app = FastAPI(title="SideLines Analysis Worker")


class AnalyzeRequest(BaseModel):
    event_id: int
    day: str | None = None


class AnalyzeResponse(BaseModel):
    event_id: int
    day: str
    metrics: dict[str, Any]
    confidence: str
    cluster_count: int
    node_count: int
    edge_count: int


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "ok", "service": "sidelines-worker"}


@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze(request: AnalyzeRequest):
    """
    Run full analysis for an event on a given day.

    1. Read users, interactions, posts from Neon
    2. Build igraph directed graph
    3. Run Leiden community detection
    4. Compute betweenness centrality
    5. Compute all metrics
    6. Write results to Neon
    """
    event = get_event(request.event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    today = request.day or date.today().isoformat()

    try:
        update_event_status(request.event_id, "analyzing")

        # Fetch data
        users = get_users(request.event_id)
        interactions = get_interactions(request.event_id)
        posts = get_posts(request.event_id)

        if not users or not interactions:
            update_event_status(request.event_id, "error")
            raise HTTPException(
                status_code=400,
                detail="Insufficient data: no users or interactions found",
            )

        # Build per-user arousal map from posts
        user_arousal: dict[int, list[float]] = {}
        did_to_user_id = {u["did"]: u["id"] for u in users}
        for post in posts:
            arousal = post.get("arousal_score")
            if arousal is None:
                continue
            uid = did_to_user_id.get(post["author_did"])
            if uid is not None:
                user_arousal.setdefault(uid, []).append(float(arousal))

        post_arousal_mean = {
            uid: float(np.mean(scores))
            for uid, scores in user_arousal.items()
        }

        # Build full graph
        full_graph = build_graph(users, interactions, post_arousal_mean)

        # Extract giant component (connected users only)
        giant, giant_indices = extract_giant_component(full_graph)
        total_users = full_graph.vcount()
        giant_component_size = giant.vcount()
        isolated_users = total_users - giant_component_size

        # Community detection on giant component only
        partition = detect_communities(giant)

        # Betweenness centrality on giant component
        betweenness = compute_betweenness(giant)

        # Compute metrics on giant component
        membership = partition.membership if partition else []
        n_clusters = max(membership) + 1 if membership else 0

        base_activation = compute_base_activation(giant, partition)
        cross_cluster_contact = compute_cross_cluster_contact(giant, partition)

        # Bridge analysis
        today_bridges = compute_bridge_nodes(giant, partition, betweenness)

        # Get yesterday's data for churn/attrition
        yesterday_metrics = get_yesterday_metrics(request.event_id, today)
        yesterday_features = get_yesterday_user_features(request.event_id, today)

        # Bridge churn
        yesterday_bridge_ids = set()
        if yesterday_features:
            b_values = [f["betweenness"] for f in yesterday_features if f["betweenness"] > 0]
            if b_values:
                p75 = float(np.percentile(b_values, 75))
                yesterday_bridge_ids = {
                    f["user_id"] for f in yesterday_features
                    if float(f["betweenness"]) >= p75
                }

        # Map today's bridges to user_ids for comparison
        today_bridge_user_ids = {giant.vs[i]["user_id"] for i in today_bridges}
        bridge_churn = compute_bridge_churn(today_bridge_user_ids, yesterday_bridge_ids)

        # Middle attrition
        bridge_delta = 0.0
        contact_delta = 0.0
        participation_delta = 0.0

        if yesterday_metrics:
            ym = yesterday_metrics.get("metrics_json", {})
            if isinstance(ym, str):
                import json
                ym = json.loads(ym)
            old_bridges = len(yesterday_bridge_ids) if yesterday_bridge_ids else 1
            new_bridges = len(today_bridges)
            bridge_delta = (new_bridges - old_bridges) / max(old_bridges, 1)

            old_contact = ym.get("crossClusterContact", cross_cluster_contact)
            if old_contact > 0:
                contact_delta = (cross_cluster_contact - old_contact) / old_contact

            old_nodes = ym.get("nodeCount", giant.vcount())
            if old_nodes > 0:
                participation_delta = (giant.vcount() - old_nodes) / old_nodes

        middle_attrition = compute_middle_attrition(
            bridge_delta, contact_delta, participation_delta
        )

        # Mean arousal across all posts
        all_arousals = [
            float(p["arousal_score"])
            for p in posts
            if p.get("arousal_score") is not None
        ]
        mean_arousal = float(np.mean(all_arousals)) if all_arousals else 0.0

        # New enriched analysis
        cluster_summaries = compute_cluster_summaries(giant, partition, betweenness)
        meaningful_cluster_count = len(cluster_summaries)

        discourse_temp = compute_discourse_temperature(
            base_activation, mean_arousal, cross_cluster_contact,
            giant.ecount(), giant.vcount(),
        )

        headline_insight = generate_headline_insight(
            discourse_temp["label"],
            meaningful_cluster_count,
            cross_cluster_contact,
            mean_arousal,
            giant.vcount(),
        )

        bridge_user_details = get_bridge_user_details(
            giant, partition, today_bridges, betweenness,
        )

        inter_cluster_edges = compute_inter_cluster_edges(
            giant, partition, cluster_summaries,
        )

        field_positions = compute_field_positions(
            cluster_summaries, giant, partition,
        )

        # Confidence assessment
        days_count = 1
        if yesterday_metrics:
            days_count = 2

        confidence = assess_confidence(
            node_count=giant.vcount(),
            edge_count=giant.ecount(),
            cluster_count=n_clusters,
            days=days_count,
            sampled=len(posts) >= 10000,
            platforms=1,
        )

        # Assemble metrics (original + new fields, additive)
        metrics = {
            "baseActivation": round(base_activation, 2),
            "crossClusterContact": round(cross_cluster_contact, 2),
            "bridgeChurn": round(bridge_churn, 4),
            "middleAttrition": round(middle_attrition, 2),
            "clusterCount": n_clusters,
            "nodeCount": giant.vcount(),
            "edgeCount": giant.ecount(),
            "meanArousal": round(mean_arousal, 4),
            "attackMatrix": compute_attack_matrix(giant, partition),
            # New fields
            "totalUsers": total_users,
            "giantComponentSize": giant_component_size,
            "isolatedUsers": isolated_users,
            "meaningfulClusterCount": meaningful_cluster_count,
            "discourseTemperature": discourse_temp,
            "headlineInsight": headline_insight,
            "clusterSummaries": cluster_summaries,
            "bridgeUsers": bridge_user_details,
            "interClusterEdges": inter_cluster_edges,
            "clusterPositions": field_positions,
        }

        # Community overlay — map event participants to global communities
        event_dids = [u["did"] for u in users]
        community_assignments = get_community_assignments_for_dids(event_dids)

        if community_assignments:
            from collections import defaultdict

            by_community: dict[int, list[dict]] = defaultdict(list)
            for ca in community_assignments:
                by_community[ca["community_id"]].append(ca)

            community_breakdown = []
            for community_id, members in by_community.items():
                member_dids = {m["user_did"] for m in members}
                community_posts = [
                    p for p in posts
                    if p.get("author_did") in member_dids
                ]
                community_arousals = [
                    float(p["arousal_score"])
                    for p in community_posts
                    if p.get("arousal_score") is not None
                ]

                community_breakdown.append({
                    "communityId": community_id,
                    "communityName": members[0]["community_name"],
                    "communityDescription": members[0]["community_description"],
                    "memberCount": len(member_dids),
                    "postCount": len(community_posts),
                    "meanArousal": round(
                        float(np.mean(community_arousals)) if community_arousals else 0.0,
                        4,
                    ),
                    "activeOnTopic": len(community_posts) > 0,
                })

            # Sort by member count descending
            community_breakdown.sort(key=lambda x: x["memberCount"], reverse=True)
            metrics["communityBreakdown"] = community_breakdown

        # Write results to DB
        upsert_daily_metrics(request.event_id, today, metrics, confidence)

        # Write cluster assignments (for giant component)
        if partition:
            cluster_data = []
            for i, cluster_id in enumerate(membership):
                cluster_data.append({
                    "event_id": request.event_id,
                    "day": today,
                    "user_id": giant.vs[i]["user_id"],
                    "cluster_id": cluster_id,
                    "score": betweenness.get(i, 0.0),
                })
            upsert_cluster_assignments(cluster_data)

        # Write user features (for giant component)
        user_feature_data = []
        for i in range(giant.vcount()):
            uid = giant.vs[i]["user_id"]
            u_arousals = user_arousal.get(uid, [])
            u_p95 = float(np.percentile(u_arousals, 95)) if len(u_arousals) >= 2 else (
                u_arousals[0] if u_arousals else 0.0
            )
            user_feature_data.append({
                "event_id": request.event_id,
                "day": today,
                "user_id": uid,
                "arousal_mean": post_arousal_mean.get(uid, 0.0),
                "arousal_p95": u_p95,
                "post_count": len(u_arousals),
                "in_degree": giant.degree(i, mode="in"),
                "out_degree": giant.degree(i, mode="out"),
                "betweenness": betweenness.get(i, 0.0),
            })
        upsert_user_features(user_feature_data)

        update_event_status(request.event_id, "ready")

        return AnalyzeResponse(
            event_id=request.event_id,
            day=today,
            metrics=metrics,
            confidence=confidence,
            cluster_count=n_clusters,
            node_count=giant.vcount(),
            edge_count=giant.ecount(),
        )

    except HTTPException:
        raise
    except Exception as e:
        update_event_status(request.event_id, "error")
        raise HTTPException(status_code=500, detail=str(e))


class AnalyzeFollowsRequest(BaseModel):
    event_id: int
    day: str | None = None


class AnalyzeFollowsResponse(BaseModel):
    event_id: int
    day: str
    community_count: int
    communities: list[dict[str, Any]]


@app.post("/analyze-follows", response_model=AnalyzeFollowsResponse)
async def analyze_follows(request: AnalyzeFollowsRequest):
    """
    Run co-follow community analysis for an event.

    1. Fetch follows and users from DB
    2. Build co-follow graph (shared follows → Jaccard similarity)
    3. Run Leiden community detection
    4. Characterize communities by top-followed accounts
    5. Compute per-community arousal from posts
    6. Call Claude Haiku for summaries
    7. Merge cofollowCommunities into existing metrics_json
    """
    event = get_event(request.event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    today = request.day or date.today().isoformat()

    try:
        # Fetch data
        users = get_users(request.event_id)
        follows = get_follows(request.event_id)

        if not follows:
            return AnalyzeFollowsResponse(
                event_id=request.event_id,
                day=today,
                community_count=0,
                communities=[],
            )

        posts = get_posts_with_text(request.event_id)

        # Build per-user arousal from posts
        did_to_arousals: dict[str, list[float]] = {}
        for post in posts:
            arousal = post.get("arousal_score")
            if arousal is not None:
                did_to_arousals.setdefault(post["author_did"], []).append(float(arousal))

        # Build per-user post texts for sampling
        did_to_posts: dict[str, list[str]] = {}
        for post in posts:
            if post.get("text"):
                did_to_posts.setdefault(post["author_did"], []).append(post["text"])

        # Build co-follow graph
        cofollow_graph, idx_to_did = build_cofollow_graph(users, follows, min_shared=3)

        if cofollow_graph.vcount() < 2:
            return AnalyzeFollowsResponse(
                event_id=request.event_id,
                day=today,
                community_count=0,
                communities=[],
            )

        # Run Leiden community detection on co-follow graph
        import leidenalg
        partition = None
        if cofollow_graph.vcount() > 0:
            partition = leidenalg.find_partition(
                cofollow_graph,
                leidenalg.ModularityVertexPartition,
                weights="weight" if "weight" in cofollow_graph.es.attributes() else None,
                n_iterations=10,
                seed=42,
            )

        if partition is None:
            return AnalyzeFollowsResponse(
                event_id=request.event_id,
                day=today,
                community_count=0,
                communities=[],
            )

        # Characterize communities
        community_profiles = characterize_communities(
            cofollow_graph, partition, follows, min_size=5
        )

        # Enrich with arousal and post data, then get LLM summaries
        cofollow_communities = []
        for profile in community_profiles:
            member_dids = profile["memberDids"]

            # Compute mean arousal for community members
            community_arousals = []
            for did in member_dids:
                community_arousals.extend(did_to_arousals.get(did, []))
            mean_arousal = float(np.mean(community_arousals)) if community_arousals else 0.0

            # Count posts from this community
            post_count = sum(len(did_to_posts.get(did, [])) for did in member_dids)
            active_on_topic = post_count > 0

            # Sample posts for LLM
            sample_posts = []
            for did in member_dids:
                sample_posts.extend(did_to_posts.get(did, [])[:2])
            sample_posts = sample_posts[:5]

            # Get LLM summary
            llm_summary = summarize_community_llm(
                profile["topFollowedHandles"],
                sample_posts,
                profile["memberCount"],
                mean_arousal,
            )

            cofollow_communities.append({
                "clusterId": profile["clusterId"],
                "memberCount": profile["memberCount"],
                "llmSummary": llm_summary,
                "topFollowedHandles": profile["topFollowedHandles"],
                "meanArousal": round(mean_arousal, 4),
                "postCount": post_count,
                "activeOnTopic": active_on_topic,
            })

        # Merge into existing metrics
        existing = get_existing_metrics(request.event_id, today)
        if existing:
            metrics = existing["metrics_json"]
            if isinstance(metrics, str):
                import json
                metrics = json.loads(metrics)
            metrics["cofollowCommunities"] = cofollow_communities
            upsert_daily_metrics(
                request.event_id, today, metrics, existing["confidence"]
            )
        else:
            # No existing metrics — write minimal metrics with just cofollow data
            metrics = {
                "baseActivation": 0,
                "crossClusterContact": 0,
                "bridgeChurn": 0,
                "middleAttrition": 0,
                "clusterCount": 0,
                "nodeCount": 0,
                "edgeCount": 0,
                "meanArousal": 0,
                "cofollowCommunities": cofollow_communities,
            }
            upsert_daily_metrics(request.event_id, today, metrics, "LOW")

        return AnalyzeFollowsResponse(
            event_id=request.event_id,
            day=today,
            community_count=len(cofollow_communities),
            communities=cofollow_communities,
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# =============================================================================
# GLOBAL COMMUNITY MAP ENDPOINTS
# =============================================================================


class CrawlStarterPacksRequest(BaseModel):
    queries: list[str] | None = None
    max_packs: int = 100


class CrawlStarterPacksResponse(BaseModel):
    packs_found: int
    members_found: int
    new_users_added: int


@app.post("/crawl-starter-packs", response_model=CrawlStarterPacksResponse)
async def crawl_starter_packs_endpoint(request: CrawlStarterPacksRequest):
    """
    Crawl political starter packs to seed the global follow graph.

    Searches Bluesky for political starter packs, extracts member DIDs,
    and stores them as tracked users for follow backfill.
    """
    try:
        result = crawl_starter_packs(
            queries=request.queries,
            max_packs=request.max_packs,
        )
        return CrawlStarterPacksResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class BackfillFollowsRequest(BaseModel):
    batch_size: int = 200


class BackfillFollowsResponse(BaseModel):
    processed: int
    remaining: int
    done: bool


@app.post("/backfill-follows", response_model=BackfillFollowsResponse)
async def backfill_follows_endpoint(request: BackfillFollowsRequest):
    """
    Backfill follows for tracked users who haven't been fetched yet.

    Call repeatedly until done == True. Each call processes one batch.
    """
    try:
        result = backfill_follows(batch_size=request.batch_size)
        return BackfillFollowsResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class ComputeCommunitiesRequest(BaseModel):
    min_shared: int = 3
    min_community_size: int = 5


class ComputeCommunitiesResponse(BaseModel):
    community_count: int
    total_members: int
    communities: list[dict[str, Any]]


@app.post("/compute-communities", response_model=ComputeCommunitiesResponse)
async def compute_communities(request: ComputeCommunitiesRequest):
    """
    Run global community detection on the full follow graph.

    1. Fetch all global follows
    2. Build co-follow graph (Jaccard similarity)
    3. Run Leiden community detection
    4. Characterize communities by top-followed handles
    5. Call Claude Haiku for community names/descriptions
    6. Write to bluesky_communities + bluesky_community_members
    """
    try:
        # Fetch all global follows
        follows = get_all_global_follows()
        if not follows:
            return ComputeCommunitiesResponse(
                community_count=0, total_members=0, communities=[]
            )

        # Build co-follow graph
        cofollow_graph, idx_to_did = build_global_cofollow_graph(
            follows, min_shared=request.min_shared
        )

        if cofollow_graph.vcount() < 2:
            return ComputeCommunitiesResponse(
                community_count=0, total_members=0, communities=[]
            )

        # Run Leiden community detection
        import leidenalg

        partition = leidenalg.find_partition(
            cofollow_graph,
            leidenalg.ModularityVertexPartition,
            weights="weight" if "weight" in cofollow_graph.es.attributes() else None,
            n_iterations=10,
            seed=42,
        )

        if partition is None:
            return ComputeCommunitiesResponse(
                community_count=0, total_members=0, communities=[]
            )

        # Characterize communities
        community_profiles = characterize_communities(
            cofollow_graph, partition, follows, min_size=request.min_community_size
        )

        if not community_profiles:
            return ComputeCommunitiesResponse(
                community_count=0, total_members=0, communities=[]
            )

        # Get LLM summaries and build community records
        community_records = []
        for profile in community_profiles:
            llm_summary = summarize_community_llm(
                profile["topFollowedHandles"],
                [],  # no event-specific posts for global communities
                profile["memberCount"],
                0.0,  # no arousal for global characterization
            )

            # Parse "Name: description" format from LLM
            name = f"Community {profile['clusterId']}"
            description = llm_summary
            if ": " in llm_summary:
                parts = llm_summary.split(": ", 1)
                name = parts[0]
                description = parts[1]

            community_records.append({
                "name": name,
                "description": description,
                "top_followed_handles": profile["topFollowedHandles"],
                "member_count": profile["memberCount"],
                "member_dids": profile["memberDids"],
            })

        # Write communities to DB
        community_ids = upsert_communities([
            {
                "name": c["name"],
                "description": c["description"],
                "top_followed_handles": c["top_followed_handles"],
                "member_count": c["member_count"],
            }
            for c in community_records
        ])

        # Write membership assignments
        all_assignments = []
        for cid, record in zip(community_ids, community_records):
            for did in record["member_dids"]:
                all_assignments.append({
                    "user_did": did,
                    "community_id": cid,
                })
        upsert_community_members(all_assignments)

        total_members = sum(c["member_count"] for c in community_records)

        # Build response
        response_communities = []
        for cid, record in zip(community_ids, community_records):
            response_communities.append({
                "id": cid,
                "name": record["name"],
                "description": record["description"],
                "topFollowedHandles": record["top_followed_handles"],
                "memberCount": record["member_count"],
            })

        return ComputeCommunitiesResponse(
            community_count=len(response_communities),
            total_members=total_members,
            communities=response_communities,
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/communities")
async def list_communities():
    """List all global communities."""
    try:
        communities = get_global_communities()
        return {"communities": communities, "count": len(communities)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
