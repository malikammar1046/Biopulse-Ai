"""
OvaSense — ML Inference Engine.

Loads the trained sklearn Pipeline (imputer → scaler → RandomForest) and
produces risk pattern predictions with class probabilities.

The predictor:
  1. Loads model.joblib and metadata.json from ml/artifacts/
  2. Validates that the incoming feature vector matches the expected features
  3. Runs predict() and predict_proba()
  4. Returns a typed PredictionResult

Thread safety:
  The predictor is a singleton loaded once at startup.  The sklearn Pipeline
  is read-only after training, so concurrent requests are safe.

IMPORTANT: If model artifacts don't exist, the predictor raises ModelNotReady.
The orchestrator catches this and returns insufficient_data gracefully.
"""

from __future__ import annotations

import json
import logging
import os
from dataclasses import dataclass, field
from pathlib import Path

import numpy as np

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------

_REPO_ROOT = Path(__file__).resolve().parent.parent.parent
ARTIFACTS_DIR = _REPO_ROOT / "ml" / "artifacts"
MODEL_PATH = ARTIFACTS_DIR / "model.joblib"
METADATA_PATH = ARTIFACTS_DIR / "metadata.json"

CLASSES = ["lower_pattern", "moderate_pattern", "higher_pattern"]


# ---------------------------------------------------------------------------
# Exceptions
# ---------------------------------------------------------------------------

class ModelNotReady(Exception):
    """Raised when model artifacts have not been trained yet."""


# ---------------------------------------------------------------------------
# Result type
# ---------------------------------------------------------------------------

@dataclass
class PredictionResult:
    risk_pattern: str                         # lower_pattern | moderate_pattern | higher_pattern
    confidence: float                         # probability of predicted class, 0–1
    probabilities: dict[str, float]           # all class probabilities
    feature_vector_imputed: np.ndarray        # the imputed+scaled feature vector (for SHAP)
    raw_feature_vector: np.ndarray            # the original unimputed vector


# ---------------------------------------------------------------------------
# Predictor
# ---------------------------------------------------------------------------

class OvaSensePredictor:
    """
    Singleton ML predictor.  Load once, predict many times.

    Internals:
      self._pipeline  : the full sklearn Pipeline (imputer → scaler → rf)
      self._metadata  : dict loaded from metadata.json
      self._feature_names : list of feature names (in training order)
    """

    def __init__(self):
        self._pipeline = None
        self._metadata: dict = {}
        self._feature_names: list[str] = []
        self._loaded = False

    def load(self) -> None:
        """Load model artifacts from disk.  Called lazily on first prediction."""
        if self._loaded:
            return

        if not MODEL_PATH.exists():
            raise ModelNotReady(
                f"Model artifact not found at {MODEL_PATH}. "
                "Run: python -m ml.training.train_pipeline"
            )

        if not METADATA_PATH.exists():
            raise ModelNotReady(
                f"Model metadata not found at {METADATA_PATH}. "
                "Run: python -m ml.training.train_pipeline"
            )

        import joblib
        self._pipeline = joblib.load(MODEL_PATH)
        logger.info("Loaded ML model pipeline from %s", MODEL_PATH)

        with open(METADATA_PATH, encoding="utf-8") as f:
            self._metadata = json.load(f)

        self._feature_names = self._metadata.get("feature_names", [])
        self._loaded = True

        logger.info(
            "OvaSense predictor ready | model=%s version=%s features=%d",
            self._metadata.get("model_name"),
            self._metadata.get("model_version"),
            len(self._feature_names),
        )

    def predict(self, feature_vector: np.ndarray) -> PredictionResult:
        """
        Run inference on a single patient feature vector.

        Args:
            feature_vector: 1D numpy array of shape (n_features,)
                           NaN values are allowed; the pipeline's imputer handles them.

        Returns:
            PredictionResult with risk_pattern, confidence, probabilities.

        Raises:
            ModelNotReady: if artifacts haven't been trained.
            ValueError:    if feature vector has wrong shape.
        """
        self.load()

        if feature_vector.ndim == 1:
            X = feature_vector.reshape(1, -1)
        else:
            X = feature_vector

        expected_n = len(self._feature_names)
        if X.shape[1] != expected_n:
            raise ValueError(
                f"Feature vector has {X.shape[1]} features; model expects {expected_n}."
            )

        # Run through the full pipeline (impute → scale → predict)
        predicted_class_idx: int = int(self._pipeline.predict(X)[0])
        proba: np.ndarray = self._pipeline.predict_proba(X)[0]

        risk_pattern = CLASSES[predicted_class_idx]
        confidence = float(proba[predicted_class_idx])

        probabilities = {cls: float(proba[i]) for i, cls in enumerate(CLASSES)}

        # For SHAP, we need the imputed+scaled version of X.
        # We access pipeline steps directly.
        X_imputed = self._pipeline.named_steps["imputer"].transform(X)
        X_scaled = self._pipeline.named_steps["scaler"].transform(X_imputed)

        return PredictionResult(
            risk_pattern=risk_pattern,
            confidence=round(confidence, 4),
            probabilities={k: round(v, 4) for k, v in probabilities.items()},
            feature_vector_imputed=X_imputed[0],
            raw_feature_vector=feature_vector,
        )

    @property
    def metadata(self) -> dict:
        if not self._loaded:
            try:
                self.load()
            except ModelNotReady:
                return {}
        return self._metadata

    @property
    def classifier(self):
        """Return the raw RandomForestClassifier for SHAP TreeExplainer."""
        if not self._loaded:
            self.load()
        return self._pipeline.named_steps["classifier"]

    @property
    def feature_names(self) -> list[str]:
        if not self._loaded:
            self.load()
        return self._feature_names

    @property
    def is_ready(self) -> bool:
        try:
            self.load()
            return True
        except ModelNotReady:
            return False


# Singleton — shared across Django workers
predictor = OvaSensePredictor()
