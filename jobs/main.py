"""
SideLines Python Analysis Worker

FastAPI app that runs graph analysis on collected Bluesky data.
Deployed on Railway, triggered by Vercel API routes.
"""

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
)
from db import (
    get_event,
    get_users,
    get_interactions,
    get_posts,
    get_yesterday_metrics,
    get_yesterday_user_features,
    upsert_daily_metrics,
    upsert_cluster_assignments,
    upsert_user_features,
    update_event_status,
)

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
