"""
Tests for the scoring models module.

Tests are organized into:
1. Lexicon fallback tests (always run)
2. Signal format tests with mocked ONNX sessions
3. Conditional tests for loaded models (only in Docker/CI)
"""

from __future__ import annotations

import sys
import os
import pytest
from unittest.mock import patch, MagicMock

import numpy as np

# Ensure jobs/ is on the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))


# =============================================================================
# LEXICON FALLBACK TESTS
# =============================================================================


class TestLexiconFallback:
    """Test that lexicon scoring still works as the fast fallback."""

    def test_compute_arousal_lexicon_empty(self):
        from arousal import compute_arousal_lexicon

        result = compute_arousal_lexicon("")
        assert result["score"] == 0
        assert "breakdown" in result

    def test_compute_arousal_lexicon_calm(self):
        from arousal import compute_arousal_lexicon

        result = compute_arousal_lexicon("The weather is nice today.")
        assert result["score"] == 0
        assert "breakdown" in result

    def test_compute_arousal_lexicon_angry(self):
        from arousal import compute_arousal_lexicon

        result = compute_arousal_lexicon(
            "This is absolutely outrageous and disgusting! I am furious!"
        )
        assert result["score"] > 0.1
        assert "breakdown" in result

    def test_compute_arousal_coordinator(self):
        """Test that compute_arousal delegates to lexicon."""
        from arousal import compute_arousal

        result = compute_arousal("I am furious about this!")
        assert "score" in result
        assert "breakdown" in result
        assert isinstance(result["score"], float)

    def test_compute_arousal_lexicon_whitespace(self):
        from arousal import compute_arousal_lexicon

        result = compute_arousal_lexicon("   \n\t  ")
        assert result["score"] == 0


# =============================================================================
# SCORING MODELS UNIT TESTS (mocked ONNX)
# =============================================================================


class TestScoringModelsHelpers:
    """Test helper functions in scoring_models without loading actual models."""

    def test_softmax(self):
        # Import the internal function
        from scoring_models import _softmax

        logits = np.array([[1.0, 2.0, 3.0]])
        probs = _softmax(logits)
        assert probs.shape == (1, 3)
        assert abs(probs.sum() - 1.0) < 1e-6
        # Highest logit should have highest probability
        assert probs[0, 2] > probs[0, 1] > probs[0, 0]

    def test_sigmoid(self):
        from scoring_models import _sigmoid

        logits = np.array([[0.0, 10.0, -10.0]])
        probs = _sigmoid(logits)
        assert abs(probs[0, 0] - 0.5) < 1e-6
        assert probs[0, 1] > 0.99
        assert probs[0, 2] < 0.01

    def test_compute_arousal_from_emotions(self):
        from scoring_models import _compute_arousal

        # Pure anger should give high arousal
        emotions = {
            "anger": 1.0,
            "disgust": 0.0,
            "fear": 0.0,
            "joy": 0.0,
            "neutral": 0.0,
            "sadness": 0.0,
            "surprise": 0.0,
        }
        arousal = _compute_arousal(emotions)
        assert arousal == 0.95  # anger weight is 0.95

        # Pure neutral should give low arousal
        emotions_neutral = {
            "anger": 0.0,
            "disgust": 0.0,
            "fear": 0.0,
            "joy": 0.0,
            "neutral": 1.0,
            "sadness": 0.0,
            "surprise": 0.0,
        }
        arousal_neutral = _compute_arousal(emotions_neutral)
        assert arousal_neutral == 0.05  # neutral weight is 0.05

    def test_compute_valence(self):
        from scoring_models import _compute_valence

        # Pure joy should give high valence
        emotions_joy = {
            "anger": 0.0,
            "disgust": 0.0,
            "fear": 0.0,
            "joy": 1.0,
            "neutral": 0.0,
            "sadness": 0.0,
            "surprise": 0.0,
        }
        valence = _compute_valence(emotions_joy)
        assert valence > 0.5

        # Pure anger should give low valence
        emotions_anger = {
            "anger": 1.0,
            "disgust": 0.0,
            "fear": 0.0,
            "joy": 0.0,
            "neutral": 0.0,
            "sadness": 0.0,
            "surprise": 0.0,
        }
        valence_anger = _compute_valence(emotions_anger)
        assert valence_anger < 0.5

    def test_compute_valence_range(self):
        from scoring_models import _compute_valence

        # Test that valence is always in [0, 1]
        test_cases = [
            {"anger": 1.0, "disgust": 1.0, "fear": 1.0, "joy": 0.0, "neutral": 0.0, "sadness": 1.0, "surprise": 0.0},
            {"anger": 0.0, "disgust": 0.0, "fear": 0.0, "joy": 1.0, "neutral": 0.0, "sadness": 0.0, "surprise": 1.0},
            {"anger": 0.0, "disgust": 0.0, "fear": 0.0, "joy": 0.0, "neutral": 1.0, "sadness": 0.0, "surprise": 0.0},
        ]
        for emotions in test_cases:
            valence = _compute_valence(emotions)
            assert 0.0 <= valence <= 1.0, f"Valence {valence} out of range for {emotions}"


class TestScoreBatchMocked:
    """Test score_batch with mocked ONNX sessions."""

    def test_score_batch_empty(self):
        """score_batch with empty list should return empty list."""
        from scoring_models import MODELS_LOADED

        if not MODELS_LOADED:
            pytest.skip("Models not loaded")

        from scoring_models import score_batch

        result = score_batch([])
        assert result == []

    def test_score_batch_not_loaded(self):
        """score_batch should raise when models aren't loaded."""
        import scoring_models

        original = scoring_models.MODELS_LOADED
        try:
            scoring_models.MODELS_LOADED = False
            with pytest.raises(RuntimeError, match="not loaded"):
                scoring_models.score_batch(["test"])
        finally:
            scoring_models.MODELS_LOADED = original


# =============================================================================
# CONDITIONAL TESTS (only run when models are actually loaded)
# =============================================================================


class TestModelsLoaded:
    """Tests that require actual ONNX models to be present."""

    @pytest.fixture(autouse=True)
    def check_models(self):
        from scoring_models import MODELS_LOADED

        if not MODELS_LOADED:
            pytest.skip("ONNX models not loaded (run in Docker to test)")

    def test_score_single_angry(self):
        from scoring_models import score_batch

        results = score_batch(["I am absolutely furious about this outrage!"])
        assert len(results) == 1
        signal = results[0]

        assert "arousal" in signal
        assert "valence" in signal
        assert "dominant_emotion" in signal
        assert "emotions" in signal
        assert "toxicity" in signal
        assert "irony" in signal

        assert 0.0 <= signal["arousal"] <= 1.0
        assert 0.0 <= signal["valence"] <= 1.0
        assert isinstance(signal["dominant_emotion"], str)
        assert isinstance(signal["emotions"], dict)
        assert isinstance(signal["toxicity"], dict)
        assert "score" in signal["toxicity"]
        assert 0.0 <= signal["irony"] <= 1.0

    def test_score_single_calm(self):
        from scoring_models import score_batch

        results = score_batch(["Nice weather today, I enjoyed my walk in the park."])
        assert len(results) == 1
        signal = results[0]

        # Calm text should have low arousal
        assert signal["arousal"] < 0.5
        assert signal["valence"] > 0.3

    def test_score_batch_multiple(self):
        from scoring_models import score_batch

        texts = [
            "I am furious!",
            "What a beautiful day.",
            "This is terrifying and dangerous.",
        ]
        results = score_batch(texts)
        assert len(results) == 3

        # All should have valid format
        for signal in results:
            assert "arousal" in signal
            assert "valence" in signal
            assert "dominant_emotion" in signal
            assert 0.0 <= signal["arousal"] <= 1.0

    def test_emotion_labels_present(self):
        from scoring_models import score_batch

        results = score_batch(["test"])
        emotions = results[0]["emotions"]

        # Should have the 7 standard emotions
        expected = {"anger", "disgust", "fear", "joy", "neutral", "sadness", "surprise"}
        assert set(emotions.keys()) == expected

    def test_toxicity_breakdown(self):
        from scoring_models import score_batch

        results = score_batch(["You are an idiot and I hate you"])
        tox = results[0]["toxicity"]
        assert "score" in tox
        assert "breakdown" in tox
        assert isinstance(tox["breakdown"], dict)
        assert 0.0 <= tox["score"] <= 1.0
