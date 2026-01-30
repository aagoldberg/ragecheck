"""
Tests for confidence level assessment.

Run with: cd jobs && pytest tests/test_confidence.py -v
"""

import pytest

from analysis import assess_confidence


class TestConfidence:
    def test_low_confidence_minimal_data(self):
        """Tiny graph with minimal data should be LOW."""
        result = assess_confidence(
            node_count=10,
            edge_count=15,
            cluster_count=1,
            days=1,
            sampled=False,
            platforms=1,
        )
        assert result == "LOW"

    def test_low_confidence_no_clusters(self):
        """No meaningful clustering should be LOW."""
        result = assess_confidence(
            node_count=50,
            edge_count=100,
            cluster_count=1,
            days=1,
            sampled=False,
            platforms=1,
        )
        assert result == "LOW"

    def test_med_confidence_decent_data(self):
        """Moderate graph with some clusters should be MED."""
        result = assess_confidence(
            node_count=200,
            edge_count=500,
            cluster_count=3,
            days=3,
            sampled=False,
            platforms=1,
        )
        assert result == "MED"

    def test_high_confidence_excellent_data(self):
        """Large graph with many clusters and days should be HIGH."""
        result = assess_confidence(
            node_count=1000,
            edge_count=5000,
            cluster_count=5,
            days=14,
            sampled=False,
            platforms=1,
        )
        assert result == "HIGH"

    def test_sampling_penalty(self):
        """Sampled data should get lower confidence."""
        unsampled = assess_confidence(
            node_count=200,
            edge_count=500,
            cluster_count=3,
            days=3,
            sampled=False,
            platforms=1,
        )
        sampled = assess_confidence(
            node_count=200,
            edge_count=500,
            cluster_count=3,
            days=3,
            sampled=True,
            platforms=1,
        )
        # Sampled should be same or lower
        levels = {"LOW": 0, "MED": 1, "HIGH": 2}
        assert levels[sampled] <= levels[unsampled]

    def test_multi_platform_bonus(self):
        """Multi-platform data should get bonus."""
        single = assess_confidence(
            node_count=200,
            edge_count=500,
            cluster_count=2,
            days=3,
            sampled=False,
            platforms=1,
        )
        multi = assess_confidence(
            node_count=200,
            edge_count=500,
            cluster_count=2,
            days=3,
            sampled=False,
            platforms=3,
        )
        levels = {"LOW": 0, "MED": 1, "HIGH": 2}
        assert levels[multi] >= levels[single]

    def test_edge_count_thresholds(self):
        """More edges should increase confidence."""
        low_edges = assess_confidence(
            node_count=100, edge_count=10, cluster_count=2,
            days=1, sampled=False, platforms=1,
        )
        high_edges = assess_confidence(
            node_count=100, edge_count=2000, cluster_count=2,
            days=1, sampled=False, platforms=1,
        )
        levels = {"LOW": 0, "MED": 1, "HIGH": 2}
        assert levels[high_edges] >= levels[low_edges]

    def test_days_threshold(self):
        """More days of data should increase confidence."""
        one_day = assess_confidence(
            node_count=500, edge_count=1000, cluster_count=3,
            days=1, sampled=False, platforms=1,
        )
        many_days = assess_confidence(
            node_count=500, edge_count=1000, cluster_count=3,
            days=14, sampled=False, platforms=1,
        )
        levels = {"LOW": 0, "MED": 1, "HIGH": 2}
        assert levels[many_days] >= levels[one_day]

    def test_returns_valid_values(self):
        """All returns should be LOW, MED, or HIGH."""
        for nodes in [0, 10, 100, 1000]:
            for edges in [0, 10, 100, 1000]:
                for clusters in [0, 1, 3, 5]:
                    result = assess_confidence(
                        nodes, edges, clusters, 1, False, 1
                    )
                    assert result in ("LOW", "MED", "HIGH")
