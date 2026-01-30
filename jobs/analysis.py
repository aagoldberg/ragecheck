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


def extract_giant_component(
    graph: ig.Graph,
) -> tuple[ig.Graph, list[int]]:
    """
    Extract the largest weakly connected component from the graph.

    Returns:
        (subgraph, original_indices) — the giant component subgraph and
        the original vertex indices of its members in the full graph.
    """
    if graph.vcount() == 0:
        return graph, []

    components = graph.connected_components(mode="weak")
    if len(components) == 0:
        return graph, []

    # Find largest component
    largest_idx = max(range(len(components)), key=lambda i: len(components[i]))
    original_indices = sorted(components[largest_idx])

    subgraph = graph.subgraph(original_indices)
    return subgraph, original_indices


def compute_cluster_summaries(
    graph: ig.Graph,
    partition: Any,
    betweenness: dict[int, float],
    min_size: int = 5,
) -> list[dict[str, Any]]:
    """
    Compute summary statistics for each cluster with >= min_size members.

    Returns list of dicts with: clusterId, size, meanArousal, energyLevel,
    keyVoices, edgeDensity, interactionBreakdown.
    """
    if partition is None or graph.vcount() == 0:
        return []

    membership = partition.membership
    n_clusters = max(membership) + 1 if membership else 0
    summaries = []

    for c in range(n_clusters):
        members = [i for i, m in enumerate(membership) if m == c]
        if len(members) < min_size:
            continue

        # Mean arousal
        arousals = [graph.vs[i]["arousal"] for i in members]
        mean_arousal = float(np.mean(arousals)) if arousals else 0.0

        # Energy level
        if mean_arousal >= 0.40:
            energy_level = "High"
        elif mean_arousal >= 0.15:
            energy_level = "Medium"
        else:
            energy_level = "Low"

        # Key voices: top 3 by betweenness
        member_betweenness = [(i, betweenness.get(i, 0.0)) for i in members]
        member_betweenness.sort(key=lambda x: x[1], reverse=True)
        key_voices = [
            {"userId": graph.vs[i]["user_id"], "betweenness": round(b, 4)}
            for i, b in member_betweenness[:3]
        ]

        # Edge density
        subgraph = graph.subgraph(members)
        possible_edges = len(members) * (len(members) - 1)
        edge_density = subgraph.ecount() / possible_edges if possible_edges > 0 else 0.0

        # Interaction breakdown
        edge_types = subgraph.es["type"] if subgraph.ecount() > 0 and "type" in subgraph.es.attributes() else []
        total_edges = len(edge_types) if edge_types else 1
        reply_count = sum(1 for t in edge_types if t == "reply")
        quote_count = sum(1 for t in edge_types if t == "quote")
        repost_count = sum(1 for t in edge_types if t == "repost")

        summaries.append({
            "clusterId": c,
            "size": len(members),
            "meanArousal": round(mean_arousal, 4),
            "energyLevel": energy_level,
            "keyVoices": key_voices,
            "edgeDensity": round(edge_density, 4),
            "interactionBreakdown": {
                "reply": round(reply_count / total_edges, 2) if total_edges > 0 else 0,
                "quote": round(quote_count / total_edges, 2) if total_edges > 0 else 0,
                "repost": round(repost_count / total_edges, 2) if total_edges > 0 else 0,
            },
        })

    return summaries


def compute_discourse_temperature(
    base_activation: float,
    mean_arousal: float,
    cross_cluster_contact: float,
    edge_count: int,
    node_count: int,
) -> dict[str, Any]:
    """
    Compute a 0-100 discourse temperature score.

    Formula: 0.35 * base_activation + 0.30 * (mean_arousal * 100)
             + 0.20 * cross_cluster_contact + 0.15 * connectivity_term

    Returns: { score, label, colorZone }
    """
    connectivity = min(100.0, (edge_count / max(node_count, 1)) * 50)
    score = (
        0.35 * base_activation
        + 0.30 * (mean_arousal * 100)
        + 0.20 * cross_cluster_contact
        + 0.15 * connectivity
    )
    score = max(0.0, min(100.0, score))

    if score < 20:
        label, color_zone = "Quiet", "zinc"
    elif score < 40:
        label, color_zone = "Simmering", "blue"
    elif score < 60:
        label, color_zone = "Warm", "amber"
    elif score < 80:
        label, color_zone = "Heated", "orange"
    else:
        label, color_zone = "Boiling", "red"

    return {
        "score": round(score, 1),
        "label": label,
        "colorZone": color_zone,
    }


def generate_headline_insight(
    temperature_label: str,
    cluster_count: int,
    cross_cluster_contact: float,
    mean_arousal: float,
    node_count: int,
) -> str:
    """
    Generate a template-based headline insight (no LLM).

    Keyed on temperature zone + cluster count + connectivity level.
    """
    # Connectivity level
    if cross_cluster_contact >= 50:
        connectivity = "high"
    elif cross_cluster_contact >= 20:
        connectivity = "moderate"
    else:
        connectivity = "low"

    # Cluster descriptor
    if cluster_count <= 2:
        cluster_desc = "polarized"
    elif cluster_count <= 5:
        cluster_desc = "fragmented into a few camps"
    else:
        cluster_desc = "highly fragmented"

    templates = {
        ("Quiet", "low"): "Discourse is quiet — communities are {cluster_desc} with low engagement between them.",
        ("Quiet", "moderate"): "A calm discussion with some cross-community exchange, but energy remains low across {n} teams.",
        ("Quiet", "high"): "Teams are talking to each other, but the overall tone is measured and calm.",
        ("Simmering", "low"): "Tension is building in isolated pockets — {n} teams are active but not yet engaging each other.",
        ("Simmering", "moderate"): "A simmering debate with moderate cross-team engagement. Energy is rising across {n} communities.",
        ("Simmering", "high"): "Active debate across team lines with building momentum. Watch for escalation.",
        ("Warm", "low"): "The discussion is heated within teams but they're mostly talking past each other.",
        ("Warm", "moderate"): "A warm debate is underway — {n} teams are engaging with moderate intensity.",
        ("Warm", "high"): "Heated cross-team exchanges are driving the conversation. {n} communities are actively clashing.",
        ("Heated", "low"): "High-intensity discourse is happening in silos — teams are fired up but not engaging rivals.",
        ("Heated", "moderate"): "The debate is heated with {n} communities firing across lines. Bridge users are under pressure.",
        ("Heated", "high"): "Full engagement across all fronts. High-arousal exchanges dominate the discourse between {n} teams.",
        ("Boiling", "low"): "Extreme intensity within isolated groups. The discourse is boiling but contained.",
        ("Boiling", "moderate"): "The discourse has reached a boiling point — {n} teams are locked in high-energy conflict.",
        ("Boiling", "high"): "All-out discursive warfare. Every team is fully engaged with maximum intensity.",
    }

    key = (temperature_label, connectivity)
    template = templates.get(key, "The discourse involves {n} communities with {connectivity} cross-team engagement.")
    return template.format(
        cluster_desc=cluster_desc,
        n=cluster_count,
        connectivity=connectivity,
    )


def get_bridge_user_details(
    graph: ig.Graph,
    partition: Any,
    bridges: set[int],
    betweenness: dict[int, float],
    top_n: int = 10,
) -> list[dict[str, Any]]:
    """
    Get details for top-N bridge users by betweenness.

    Returns list of dicts: userId, betweenness, arousal, clustersSpanned.
    """
    if not bridges or partition is None:
        return []

    membership = partition.membership

    bridge_details = []
    for i in bridges:
        neighbors = graph.neighbors(i, mode="all")
        clusters_spanned = sorted({membership[n] for n in neighbors} | {membership[i]})
        bridge_details.append({
            "userId": graph.vs[i]["user_id"],
            "betweenness": round(betweenness.get(i, 0.0), 4),
            "arousal": round(float(graph.vs[i]["arousal"]), 4),
            "clustersSpanned": clusters_spanned,
        })

    bridge_details.sort(key=lambda x: x["betweenness"], reverse=True)
    return bridge_details[:top_n]


def compute_inter_cluster_edges(
    graph: ig.Graph,
    partition: Any,
    cluster_summaries: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    """
    Count ALL cross-cluster edges between meaningful clusters.

    Unlike attack_matrix (which only includes high-arousal edges >0.6),
    this counts every edge crossing cluster boundaries, providing data
    for the field visualization arrows even in low-arousal discourse.

    Returns list of {fromCluster, toCluster, count, meanArousal}.
    """
    if not partition or not cluster_summaries or graph.ecount() == 0:
        return []

    valid_ids = {s["clusterId"] for s in cluster_summaries}
    membership = partition.membership

    # Accumulate edge counts and arousal sums between cluster pairs
    pair_counts: dict[tuple[int, int], int] = {}
    pair_arousal_sums: dict[tuple[int, int], float] = {}

    for e in graph.es:
        src_c = membership[e.source]
        dst_c = membership[e.target]
        if src_c == dst_c:
            continue
        if src_c not in valid_ids or dst_c not in valid_ids:
            continue

        # Canonical key (smaller cluster id first)
        key = (min(src_c, dst_c), max(src_c, dst_c))
        pair_counts[key] = pair_counts.get(key, 0) + 1

        # Arousal from source node
        try:
            arousal = float(graph.vs[e.source]["arousal"])
        except (KeyError, TypeError):
            arousal = 0.0
        pair_arousal_sums[key] = pair_arousal_sums.get(key, 0.0) + arousal

    result = []
    for (c1, c2), count in pair_counts.items():
        mean_a = pair_arousal_sums.get((c1, c2), 0.0) / max(count, 1)
        result.append({
            "fromCluster": c1,
            "toCluster": c2,
            "count": count,
            "meanArousal": round(mean_a, 4),
        })

    result.sort(key=lambda x: x["count"], reverse=True)
    return result


def compute_field_positions(
    cluster_summaries: list[dict[str, Any]],
    graph: ig.Graph,
    partition: Any,
) -> list[dict[str, Any]]:
    """
    Compute 2D positions for clusters on the field using a simple
    force-directed layout.

    Returns list of {clusterId, x, y} in [0,1] coordinate space.

    Algorithm:
    1. Initialize positions on a circle
    2. Iterate: clusters repel, cross-cluster edges attract, centering force
    3. Normalize to [0.1, 0.9] range (padding from field edges)
    4. Deterministic seed for stable positions
    """
    if not cluster_summaries:
        return []

    n = len(cluster_summaries)
    if n == 1:
        return [{"clusterId": cluster_summaries[0]["clusterId"], "x": 0.5, "y": 0.5}]

    # Initialize on a circle around center
    positions = np.zeros((n, 2))
    for i in range(n):
        angle = 2 * np.pi * i / n
        positions[i] = [0.5 + 0.3 * np.cos(angle), 0.5 + 0.3 * np.sin(angle)]

    # Build cross-cluster edge counts between summary clusters
    cluster_ids = [s["clusterId"] for s in cluster_summaries]
    id_to_idx = {cid: i for i, cid in enumerate(cluster_ids)}

    cross_edges = np.zeros((n, n))
    if partition is not None and graph.ecount() > 0:
        membership = partition.membership
        for e in graph.es:
            src_c = membership[e.source]
            dst_c = membership[e.target]
            if src_c != dst_c and src_c in id_to_idx and dst_c in id_to_idx:
                si, di = id_to_idx[src_c], id_to_idx[dst_c]
                cross_edges[si][di] += 1
                cross_edges[di][si] += 1

    # Cluster sizes affect repulsion (larger clusters push harder)
    sizes = np.array([s["size"] for s in cluster_summaries], dtype=float)
    max_size = max(sizes.max(), 1)
    size_factor = sizes / max_size  # 0-1

    # Force-directed iterations with decreasing step size
    for iteration in range(150):
        forces = np.zeros((n, 2))
        step = 0.3 * (1.0 - iteration / 150)  # Decreasing step size

        # Centering force: pull all clusters toward (0.5, 0.5)
        center = np.array([0.5, 0.5])
        for i in range(n):
            to_center = center - positions[i]
            forces[i] += to_center * 0.05

        for i in range(n):
            for j in range(i + 1, n):
                diff = positions[i] - positions[j]
                dist = max(np.linalg.norm(diff), 0.02)
                direction = diff / dist

                # Repulsion — proportional to sizes (bigger clusters need more space)
                repulsion_strength = 0.005 * (1.0 + size_factor[i]) * (1.0 + size_factor[j])
                repulsion = repulsion_strength / (dist * dist)
                forces[i] += direction * repulsion
                forces[j] -= direction * repulsion

                # Attraction (spring) proportional to cross-cluster edges
                edge_weight = cross_edges[i][j]
                if edge_weight > 0:
                    attraction = 0.002 * np.log1p(edge_weight) * dist
                    forces[i] -= direction * attraction
                    forces[j] += direction * attraction

        # Apply forces with step size
        positions += forces * step

    # Normalize to [0.1, 0.9] — do NOT clip during iteration
    for dim in range(2):
        vals = positions[:, dim]
        min_v, max_v = vals.min(), vals.max()
        if max_v - min_v > 0.001:
            positions[:, dim] = 0.1 + 0.8 * (vals - min_v) / (max_v - min_v)
        else:
            positions[:, dim] = 0.5

    return [
        {
            "clusterId": cluster_summaries[i]["clusterId"],
            "x": round(float(positions[i][0]), 4),
            "y": round(float(positions[i][1]), 4),
        }
        for i in range(n)
    ]


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
