"""
SideLines Graph Analysis Module

Core graph analysis using igraph + leidenalg.
Computes all discourse dynamics metrics from interaction graphs.
"""

from typing import Any

import igraph as ig
import leidenalg
import numpy as np


def build_graph(
    users: list[dict[str, Any]],
    interactions: list[dict[str, Any]],
    post_arousal: dict[int, float],
) -> ig.Graph:
    """
    Build a directed igraph from users and interactions.

    Args:
        users: List of user dicts with 'id' keys
        interactions: List of interaction dicts with src_user_id, dst_user_id, post_uri
        post_arousal: Map of user_id -> mean arousal score

    Returns:
        Directed igraph.Graph with user attributes
    """
    user_ids = [u["id"] for u in users]
    id_to_idx = {uid: i for i, uid in enumerate(user_ids)}

    g = ig.Graph(directed=True)
    g.add_vertices(len(user_ids))
    g.vs["user_id"] = user_ids
    g.vs["arousal"] = [post_arousal.get(uid, 0.0) for uid in user_ids]

    edges = []
    weights = []
    edge_types = []

    for interaction in interactions:
        src = id_to_idx.get(interaction["src_user_id"])
        dst = id_to_idx.get(interaction["dst_user_id"])
        if src is not None and dst is not None and src != dst:
            edges.append((src, dst))
            weights.append(float(interaction.get("weight", 1.0)))
            edge_types.append(interaction.get("type", "reply"))

    if edges:
        g.add_edges(edges)
        g.es["weight"] = weights
        g.es["type"] = edge_types

    return g


def detect_communities(
    graph: ig.Graph, resolution: float = 1.0
) -> leidenalg.VertexPartition.MutableVertexPartition:
    """
    Run Leiden community detection on the graph.

    Uses modularity optimization on the undirected projection.
    """
    if graph.vcount() == 0:
        return None

    # Leiden works on undirected graphs
    undirected = graph.as_undirected(mode="collapse", combine_edges={"weight": "sum"})

    partition = leidenalg.find_partition(
        undirected,
        leidenalg.ModularityVertexPartition,
        weights="weight" if "weight" in undirected.es.attributes() else None,
        n_iterations=10,
        seed=42,
    )
    return partition


def compute_betweenness(
    graph: ig.Graph, approximate: bool = True, cutoff: int = 100
) -> dict[int, float]:
    """
    Compute betweenness centrality for each node.

    Args:
        graph: The interaction graph
        approximate: If True, use cutoff to limit path length
        cutoff: Maximum path length for approximate computation

    Returns:
        Dict mapping node index to betweenness score (normalized)
    """
    if graph.vcount() == 0:
        return {}

    if approximate and graph.vcount() > 200:
        betweenness = graph.betweenness(cutoff=cutoff, directed=True)
    else:
        betweenness = graph.betweenness(directed=True)

    # Normalize to [0, 1]
    max_b = max(betweenness) if betweenness else 1.0
    if max_b == 0:
        max_b = 1.0

    return {i: b / max_b for i, b in enumerate(betweenness)}


def compute_base_activation(
    graph: ig.Graph, partition: Any
) -> float:
    """
    Base Activation: within-cluster edge density * mean arousal per cluster.
    Weighted by cluster size. Returns 0-100 scale.
    """
    if partition is None or graph.vcount() == 0:
        return 0.0

    membership = partition.membership
    n_clusters = max(membership) + 1 if membership else 0
    if n_clusters == 0:
        return 0.0

    total_activation = 0.0
    total_weight = 0.0

    for c in range(n_clusters):
        members = [i for i, m in enumerate(membership) if m == c]
        if len(members) < 2:
            continue

        # Within-cluster edge density
        subgraph = graph.subgraph(members)
        possible_edges = len(members) * (len(members) - 1)
        density = subgraph.ecount() / possible_edges if possible_edges > 0 else 0

        # Mean arousal for cluster members
        arousals = [graph.vs[i]["arousal"] for i in members]
        mean_arousal = np.mean(arousals) if arousals else 0.0

        cluster_activation = density * mean_arousal
        cluster_weight = len(members)
        total_activation += cluster_activation * cluster_weight
        total_weight += cluster_weight

    if total_weight == 0:
        return 0.0

    # Scale to 0-100
    raw = total_activation / total_weight
    return min(100.0, raw * 200)


def compute_cross_cluster_contact(
    graph: ig.Graph, partition: Any
) -> float:
    """
    Cross-Cluster Contact: proportion of cross-cluster edges + unique dyads.
    Returns 0-100 scale.
    """
    if partition is None or graph.ecount() == 0:
        return 0.0

    membership = partition.membership
    cross_edges = 0
    cross_dyads = set()

    for e in graph.es:
        src_cluster = membership[e.source]
        dst_cluster = membership[e.target]
        if src_cluster != dst_cluster:
            cross_edges += 1
            dyad = (min(src_cluster, dst_cluster), max(src_cluster, dst_cluster))
            cross_dyads.add(dyad)

    edge_proportion = cross_edges / graph.ecount()

    n_clusters = max(membership) + 1 if membership else 0
    possible_dyads = n_clusters * (n_clusters - 1) / 2 if n_clusters > 1 else 1
    dyad_coverage = len(cross_dyads) / possible_dyads if possible_dyads > 0 else 0

    # Weighted combination
    raw = 0.6 * edge_proportion + 0.4 * dyad_coverage
    return min(100.0, raw * 100)


def compute_bridge_nodes(
    graph: ig.Graph,
    partition: Any,
    betweenness: dict[int, float],
) -> set[int]:
    """
    Identify bridge nodes: high betweenness + neighbors in 2+ clusters + arousal <= median.

    Returns set of node indices that are bridges.
    """
    if partition is None or graph.vcount() == 0:
        return set()

    membership = partition.membership
    arousals = graph.vs["arousal"]
    median_arousal = float(np.median(arousals)) if arousals else 0.5

    # 75th percentile of betweenness
    b_values = list(betweenness.values())
    if not b_values:
        return set()
    p75 = float(np.percentile(b_values, 75))

    bridges = set()
    for i in range(graph.vcount()):
        if betweenness.get(i, 0) < p75:
            continue
        if arousals[i] > median_arousal:
            continue

        # Check neighbors span 2+ clusters
        neighbors = graph.neighbors(i, mode="all")
        neighbor_clusters = {membership[n] for n in neighbors}
        neighbor_clusters.add(membership[i])
        if len(neighbor_clusters) >= 2:
            bridges.add(i)

    return bridges


def compute_bridge_churn(
    today_bridges: set[int],
    yesterday_bridges: set[int],
) -> float:
    """
    Bridge Churn: fraction of yesterday's bridges that are no longer bridges.
    Returns 0-1.
    """
    if not yesterday_bridges:
        return 0.0

    lost = yesterday_bridges - today_bridges
    return len(lost) / len(yesterday_bridges)


def compute_attack_matrix(
    graph: ig.Graph,
    partition: Any,
) -> list[dict[str, Any]]:
    """
    Attack Matrix: cross-cluster edges from nodes with arousal > 0.6.
    Returns list of {src_cluster, dst_cluster, edge_count, mean_arousal}.
    """
    if partition is None or graph.ecount() == 0:
        return []

    membership = partition.membership
    arousals = graph.vs["arousal"]

    # Accumulate per (src_cluster, dst_cluster)
    matrix: dict[tuple[int, int], list[float]] = {}

    for e in graph.es:
        src = e.source
        dst = e.target
        src_cluster = membership[src]
        dst_cluster = membership[dst]
        src_arousal = arousals[src]

        if src_cluster == dst_cluster:
            continue
        if src_arousal <= 0.6:
            continue

        key = (src_cluster, dst_cluster)
        if key not in matrix:
            matrix[key] = []
        matrix[key].append(src_arousal)

    return [
        {
            "src_cluster": k[0],
            "dst_cluster": k[1],
            "edge_count": len(v),
            "mean_arousal": float(np.mean(v)),
        }
        for k, v in sorted(matrix.items())
    ]


def compute_middle_attrition(
    bridge_delta: float,
    contact_delta: float,
    participation_delta: float,
) -> float:
    """
    Middle Attrition composite score.
    40% bridge decline + 30% contact decline + 30% participation decline.
    Returns 0-100.
    """
    # Deltas are proportional changes (negative = decline)
    # We want to measure decline, so invert: positive delta = no attrition
    bridge_decline = max(0.0, -bridge_delta)
    contact_decline = max(0.0, -contact_delta)
    participation_decline = max(0.0, -participation_delta)

    raw = (
        0.4 * bridge_decline
        + 0.3 * contact_decline
        + 0.3 * participation_decline
    )
    return min(100.0, raw * 100)


def assess_confidence(
    node_count: int,
    edge_count: int,
    cluster_count: int,
    days: int,
    sampled: bool,
    platforms: int,
) -> str:
    """
    Assess confidence level based on data quality indicators.

    Returns: "LOW", "MED", or "HIGH"
    """
    score = 0

    # Node count thresholds
    if node_count >= 500:
        score += 3
    elif node_count >= 100:
        score += 2
    elif node_count >= 20:
        score += 1

    # Edge count thresholds
    if edge_count >= 1000:
        score += 3
    elif edge_count >= 200:
        score += 2
    elif edge_count >= 30:
        score += 1

    # Cluster count (need meaningful communities)
    if cluster_count >= 3:
        score += 2
    elif cluster_count >= 2:
        score += 1

    # Multi-day data
    if days >= 7:
        score += 2
    elif days >= 3:
        score += 1

    # Sampling penalty
    if sampled:
        score -= 1

    # Multi-platform bonus
    if platforms > 1:
        score += 1

    if score >= 8:
        return "HIGH"
    elif score >= 5:
        return "MED"
    return "LOW"
