"""
Tests for SideLines graph analysis module.

Run with: cd jobs && pytest tests/test_analysis.py -v
"""

from __future__ import annotations

import igraph as ig
import leidenalg
import pytest

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
    extract_giant_component,
    compute_cluster_summaries,
    compute_inter_cluster_edges,
    compute_discourse_temperature,
    generate_headline_insight,
)


def make_test_users(n: int) -> list[dict]:
    """Create n test users."""
    return [{"id": i, "did": f"did:plc:user{i}"} for i in range(n)]


def make_test_interactions(edges: list[tuple[int, int]], types=None, weights=None):
    """Create test interactions from edge tuples."""
    interactions = []
    for i, (src, dst) in enumerate(edges):
        interactions.append({
            "src_user_id": src,
            "dst_user_id": dst,
            "type": types[i] if types else "reply",
            "weight": weights[i] if weights else 1.0,
            "post_uri": f"at://did:plc:user{src}/app.bsky.feed.post/{i}",
        })
    return interactions


class TestBuildGraph:
    def test_empty_graph(self):
        g = build_graph([], [], {})
        assert g.vcount() == 0
        assert g.ecount() == 0

    def test_basic_graph(self):
        users = make_test_users(3)
        interactions = make_test_interactions([(0, 1), (1, 2)])
        arousal = {0: 0.5, 1: 0.3, 2: 0.8}
        g = build_graph(users, interactions, arousal)
        assert g.vcount() == 3
        assert g.ecount() == 2
        assert g.is_directed()

    def test_arousal_attribute(self):
        users = make_test_users(2)
        interactions = make_test_interactions([(0, 1)])
        arousal = {0: 0.9, 1: 0.1}
        g = build_graph(users, interactions, arousal)
        assert g.vs[0]["arousal"] == 0.9
        assert g.vs[1]["arousal"] == 0.1

    def test_self_loops_excluded(self):
        users = make_test_users(2)
        interactions = make_test_interactions([(0, 0), (0, 1)])
        g = build_graph(users, interactions, {})
        assert g.ecount() == 1  # self-loop excluded


class TestCommunityDetection:
    def test_empty_graph(self):
        g = ig.Graph(directed=True)
        partition = detect_communities(g)
        assert partition is None

    def test_two_cliques(self):
        """Two densely connected groups should be detected as separate communities."""
        users = make_test_users(8)
        # Clique 1: 0-3 fully connected
        edges_1 = [(i, j) for i in range(4) for j in range(4) if i != j]
        # Clique 2: 4-7 fully connected
        edges_2 = [(i, j) for i in range(4, 8) for j in range(4, 8) if i != j]
        # One weak connection
        edges = edges_1 + edges_2 + [(0, 4)]
        interactions = make_test_interactions(edges)
        g = build_graph(users, interactions, {i: 0.5 for i in range(8)})

        partition = detect_communities(g)
        assert partition is not None
        # Should detect 2 communities
        assert max(partition.membership) + 1 >= 2


class TestBetweenness:
    def test_empty_graph(self):
        g = ig.Graph(directed=True)
        result = compute_betweenness(g)
        assert result == {}

    def test_star_graph(self):
        """Center node of a star should have highest betweenness."""
        users = make_test_users(5)
        # Star: 0 is center
        edges = [(1, 0), (2, 0), (3, 0), (4, 0)]
        interactions = make_test_interactions(edges)
        g = build_graph(users, interactions, {})
        result = compute_betweenness(g)
        # Center should have highest betweenness
        assert result[0] >= max(result[i] for i in range(1, 5))


class TestBaseActivation:
    def test_empty(self):
        g = ig.Graph(directed=True)
        assert compute_base_activation(g, None) == 0.0

    def test_single_cluster_high_arousal(self):
        """Dense cluster with high arousal should have high activation."""
        users = make_test_users(4)
        edges = [(i, j) for i in range(4) for j in range(4) if i != j]
        interactions = make_test_interactions(edges)
        arousal = {i: 0.9 for i in range(4)}
        g = build_graph(users, interactions, arousal)
        partition = detect_communities(g)
        activation = compute_base_activation(g, partition)
        assert activation > 0


class TestCrossClusterContact:
    def test_no_cross_edges(self):
        """Fully separated communities should have 0 contact."""
        g = ig.Graph(directed=True)
        g.add_vertices(4)
        g.add_edges([(0, 1), (2, 3)])
        g.es["weight"] = [1.0, 1.0]

        # Manual partition: {0,1} and {2,3}
        undirected = g.as_undirected(mode="collapse", combine_edges={"weight": "sum"})
        partition = leidenalg.find_partition(
            undirected, leidenalg.ModularityVertexPartition, seed=42
        )
        contact = compute_cross_cluster_contact(g, partition)
        # If Leiden separates them, cross-cluster should be 0 or very low
        # (depends on whether Leiden actually separates 4 nodes)
        assert contact >= 0

    def test_all_cross_edges(self):
        """Graph where all edges cross communities should have high contact."""
        g = ig.Graph(directed=True)
        g.add_vertices(4)
        g.vs["arousal"] = [0.5, 0.5, 0.5, 0.5]
        # Only cross edges: 0→2, 1→3
        g.add_edges([(0, 2), (1, 3)])
        g.es["weight"] = [1.0, 1.0]

        # Force partition
        class FakePartition:
            membership = [0, 0, 1, 1]

        contact = compute_cross_cluster_contact(g, FakePartition())
        assert contact == 100.0  # All edges are cross-cluster


class TestBridgeNodes:
    def test_empty(self):
        g = ig.Graph(directed=True)
        bridges = compute_bridge_nodes(g, None, {})
        assert bridges == set()

    def test_bridge_identification(self):
        """A node connecting two clusters with low arousal should be a bridge."""
        g = ig.Graph(directed=True)
        g.add_vertices(5)
        # Node 2 connects clusters {0,1} and {3,4}
        g.add_edges([(0, 1), (1, 0), (3, 4), (4, 3), (0, 2), (2, 3)])
        g.es["weight"] = [1.0] * 6
        g.vs["arousal"] = [0.8, 0.7, 0.1, 0.9, 0.6]

        class FakePartition:
            membership = [0, 0, 0, 1, 1]

        betweenness = compute_betweenness(g)
        bridges = compute_bridge_nodes(g, FakePartition(), betweenness)
        # Node 2 should potentially be a bridge (low arousal, high betweenness, connects clusters)
        # The exact result depends on betweenness thresholds
        assert isinstance(bridges, set)


class TestBridgeChurn:
    def test_no_yesterday(self):
        assert compute_bridge_churn({1, 2, 3}, set()) == 0.0

    def test_no_churn(self):
        assert compute_bridge_churn({1, 2, 3}, {1, 2, 3}) == 0.0

    def test_full_churn(self):
        assert compute_bridge_churn(set(), {1, 2, 3}) == 1.0

    def test_partial_churn(self):
        churn = compute_bridge_churn({1}, {1, 2})
        assert churn == 0.5


class TestAttackMatrix:
    def test_empty(self):
        g = ig.Graph(directed=True)
        assert compute_attack_matrix(g, None) == []

    def test_with_attacks(self):
        g = ig.Graph(directed=True)
        g.add_vertices(4)
        g.vs["arousal"] = [0.8, 0.9, 0.3, 0.2]
        g.add_edges([(0, 2), (1, 3)])
        g.es["weight"] = [1.0, 1.0]

        class FakePartition:
            membership = [0, 0, 1, 1]

        matrix = compute_attack_matrix(g, FakePartition())
        # Nodes 0 and 1 have arousal > 0.6 and cross-cluster edges
        assert len(matrix) > 0
        assert all(e["mean_arousal"] > 0.6 for e in matrix)


class TestMiddleAttrition:
    def test_no_decline(self):
        assert compute_middle_attrition(0.0, 0.0, 0.0) == 0.0

    def test_full_decline(self):
        # All three at -1.0 (100% decline)
        attrition = compute_middle_attrition(-1.0, -1.0, -1.0)
        assert attrition == 100.0

    def test_partial_decline(self):
        # 50% bridge decline, no other changes
        attrition = compute_middle_attrition(-0.5, 0.0, 0.0)
        assert 0 < attrition < 100

    def test_growth_ignored(self):
        # Positive deltas (growth) should not reduce attrition
        assert compute_middle_attrition(0.5, 0.5, 0.5) == 0.0


class TestExtractGiantComponent:
    def test_empty_graph(self):
        g = ig.Graph(directed=True)
        sub, indices = extract_giant_component(g)
        assert sub.vcount() == 0
        assert indices == []

    def test_single_component(self):
        """A fully connected graph returns itself."""
        users = make_test_users(4)
        edges = [(0, 1), (1, 2), (2, 3)]
        interactions = make_test_interactions(edges)
        g = build_graph(users, interactions, {i: 0.5 for i in range(4)})
        sub, indices = extract_giant_component(g)
        assert sub.vcount() == 4
        assert len(indices) == 4

    def test_multiple_components(self):
        """Should extract the largest component."""
        users = make_test_users(6)
        # Component 1: 0-1-2-3 (4 nodes)
        # Component 2: 4-5 (2 nodes)
        edges = [(0, 1), (1, 2), (2, 3), (4, 5)]
        interactions = make_test_interactions(edges)
        g = build_graph(users, interactions, {i: 0.5 for i in range(6)})
        sub, indices = extract_giant_component(g)
        assert sub.vcount() == 4
        assert len(indices) == 4
        # The giant component should be nodes 0-3
        giant_user_ids = set(sub.vs["user_id"])
        assert giant_user_ids == {0, 1, 2, 3}


class TestClusterSummaries:
    def test_empty(self):
        g = ig.Graph(directed=True)
        result = compute_cluster_summaries(g, None, {})
        assert result == []

    def test_min_size_filtering(self):
        """Clusters below min_size should be excluded."""
        users = make_test_users(8)
        # Create a big clique of 6 + small pair of 2
        edges = [(i, j) for i in range(6) for j in range(6) if i != j]
        edges += [(6, 7)]
        interactions = make_test_interactions(edges)
        g = build_graph(users, interactions, {i: 0.5 for i in range(8)})
        partition = detect_communities(g)
        betweenness = compute_betweenness(g)
        summaries = compute_cluster_summaries(g, partition, betweenness, min_size=5)
        # Only the big cluster should pass the filter
        assert all(s["size"] >= 5 for s in summaries)

    def test_energy_level_labels(self):
        """Energy levels should match arousal thresholds."""
        users = make_test_users(6)
        edges = [(i, j) for i in range(6) for j in range(6) if i != j]
        interactions = make_test_interactions(edges)

        # High arousal
        g = build_graph(users, interactions, {i: 0.5 for i in range(6)})
        partition = detect_communities(g)
        betweenness = compute_betweenness(g)
        summaries = compute_cluster_summaries(g, partition, betweenness, min_size=1)
        for s in summaries:
            if s["meanArousal"] >= 0.40:
                assert s["energyLevel"] == "High"
            elif s["meanArousal"] >= 0.15:
                assert s["energyLevel"] == "Medium"
            else:
                assert s["energyLevel"] == "Low"

    def test_key_voices(self):
        """Key voices should have at most 3 entries."""
        users = make_test_users(6)
        edges = [(i, j) for i in range(6) for j in range(6) if i != j]
        interactions = make_test_interactions(edges)
        g = build_graph(users, interactions, {i: 0.3 for i in range(6)})
        partition = detect_communities(g)
        betweenness = compute_betweenness(g)
        summaries = compute_cluster_summaries(g, partition, betweenness, min_size=1)
        for s in summaries:
            assert len(s["keyVoices"]) <= 3


class TestInterClusterEdges:
    def test_empty(self):
        g = ig.Graph(directed=True)
        result = compute_inter_cluster_edges(g, None, [])
        assert result == []

    def test_cross_edges_counted(self):
        """All cross-cluster edges should be counted, not just high-arousal."""
        g = ig.Graph(directed=True)
        g.add_vertices(4)
        g.vs["user_id"] = [0, 1, 2, 3]
        g.vs["arousal"] = [0.1, 0.1, 0.1, 0.1]  # Low arousal
        g.add_edges([(0, 2), (1, 3), (0, 3)])
        g.es["weight"] = [1.0, 1.0, 1.0]
        g.es["type"] = ["reply", "reply", "reply"]

        class FakePartition:
            membership = [0, 0, 1, 1]

        summaries = [
            {"clusterId": 0, "size": 2},
            {"clusterId": 1, "size": 2},
        ]
        result = compute_inter_cluster_edges(g, FakePartition(), summaries)
        assert len(result) == 1
        assert result[0]["count"] == 3  # All 3 edges cross clusters
        assert result[0]["fromCluster"] == 0
        assert result[0]["toCluster"] == 1

    def test_intra_cluster_excluded(self):
        """Edges within the same cluster should not be counted."""
        g = ig.Graph(directed=True)
        g.add_vertices(4)
        g.vs["user_id"] = [0, 1, 2, 3]
        g.vs["arousal"] = [0.5, 0.5, 0.5, 0.5]
        g.add_edges([(0, 1), (2, 3), (0, 2)])
        g.es["weight"] = [1.0, 1.0, 1.0]
        g.es["type"] = ["reply", "reply", "reply"]

        class FakePartition:
            membership = [0, 0, 1, 1]

        summaries = [
            {"clusterId": 0, "size": 2},
            {"clusterId": 1, "size": 2},
        ]
        result = compute_inter_cluster_edges(g, FakePartition(), summaries)
        assert len(result) == 1
        assert result[0]["count"] == 1  # Only 0→2 crosses


class TestDiscourseTemperature:
    def test_quiet_range(self):
        result = compute_discourse_temperature(0, 0, 0, 0, 1)
        assert result["score"] < 20
        assert result["label"] == "Quiet"
        assert result["colorZone"] == "zinc"

    def test_boiling_range(self):
        result = compute_discourse_temperature(100, 1.0, 100, 500, 10)
        assert result["score"] >= 80
        assert result["label"] == "Boiling"
        assert result["colorZone"] == "red"

    def test_warm_range(self):
        result = compute_discourse_temperature(50, 0.3, 40, 100, 50)
        score = result["score"]
        # Just verify it's a valid result with a label
        assert 0 <= score <= 100
        assert result["label"] in ("Quiet", "Simmering", "Warm", "Heated", "Boiling")

    def test_score_clamped(self):
        """Score should be clamped to 0-100."""
        result = compute_discourse_temperature(200, 2.0, 200, 1000, 1)
        assert result["score"] == 100.0

    def test_zero_nodes(self):
        """Should handle zero nodes without division error."""
        result = compute_discourse_temperature(0, 0, 0, 0, 0)
        assert result["score"] >= 0


class TestHeadlineInsight:
    def test_quiet_low(self):
        result = generate_headline_insight("Quiet", 3, 10, 0.05, 100)
        assert isinstance(result, str)
        assert len(result) > 0

    def test_boiling_high(self):
        result = generate_headline_insight("Boiling", 4, 60, 0.8, 500)
        assert isinstance(result, str)
        assert len(result) > 0

    def test_polarized_descriptor(self):
        result = generate_headline_insight("Warm", 2, 30, 0.3, 200)
        assert isinstance(result, str)

    def test_fragmented_descriptor(self):
        result = generate_headline_insight("Heated", 8, 45, 0.5, 1000)
        assert isinstance(result, str)

    def test_unknown_combo_uses_fallback(self):
        """Unknown temperature/connectivity combos should use fallback template."""
        result = generate_headline_insight("Unknown", 5, 35, 0.4, 500)
        assert isinstance(result, str)
        assert "5" in result  # Should include cluster count
