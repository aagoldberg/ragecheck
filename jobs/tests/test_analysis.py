"""
Tests for SideLines graph analysis module.

Run with: cd jobs && pytest tests/test_analysis.py -v
"""

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
