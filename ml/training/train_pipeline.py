"""
OvaSense — Metabolic Health Risk Pattern Training Pipeline.

═══════════════════════════════════════════════════════════════════════════════
⚠  RESEARCH PROTOTYPE — SYNTHETIC TRAINING DATA ⚠
This model is trained on a synthetically-generated prototype dataset.
It has NOT been clinically validated.
It is NOT a medical device.
Do NOT use predictions for clinical decision-making.
═══════════════════════════════════════════════════════════════════════════════

Algorithm:       RandomForestClassifier (scikit-learn)
Feature count:   22 (see ml/features/data_quality.py → FEATURE_NAMES)
Output classes:  lower_pattern, moderate_pattern, higher_pattern
Preprocessing:   SimpleImputer (median) → StandardScaler

The synthetic dataset is generated in this script using plausible
medical relationships based on publicly available research, but it is
explicitly NOT patient data.  Feature distributions are approximate.

Usage:
    cd d:/PMOSense
    python -m ml.training.train_pipeline

Artifacts written to ml/artifacts/:
    model.joblib     — serialized RandomForestClassifier pipeline
    scaler.joblib    — serialized StandardScaler (also embedded in pipeline)
    metadata.json    — model metadata including version and feature names
"""

import json
import logging
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

import joblib
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.metrics import classification_report, confusion_matrix
from sklearn.model_selection import cross_val_score, StratifiedKFold, train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

# Add repo root to path so relative imports work when run as script
_REPO_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(_REPO_ROOT))

from ml.features.data_quality import FEATURE_NAMES, FEATURE_COUNT

logging.basicConfig(level=logging.INFO, format="%(levelname)s | %(message)s")
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Artifact directory
# ---------------------------------------------------------------------------

ARTIFACTS_DIR = _REPO_ROOT / "ml" / "artifacts"
ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)

MODEL_PATH = ARTIFACTS_DIR / "model.joblib"
METADATA_PATH = ARTIFACTS_DIR / "metadata.json"

# Class labels — order matters for predict_proba
CLASSES = ["lower_pattern", "moderate_pattern", "higher_pattern"]
MODEL_VERSION = "0.1.0"

# ---------------------------------------------------------------------------
# Synthetic prototype dataset generator
# ---------------------------------------------------------------------------
# Feature index references (must match FEATURE_NAMES order):
IDX = {name: i for i, name in enumerate(FEATURE_NAMES)}


def _make_lower_pattern_sample(rng: np.random.Generator) -> np.ndarray:
    """
    Generate a synthetic sample resembling a patient with lower metabolic
    health risk patterns — regular cycles, good lifestyle, good adherence.
    """
    row = np.full(FEATURE_COUNT, np.nan)

    # Regular cycles
    row[IDX["cycle_length_mean"]] = rng.normal(28, 2)
    row[IDX["cycle_length_variability"]] = rng.uniform(0.5, 2.5)
    row[IDX["cycle_irregularity_rate"]] = rng.uniform(0.0, 0.1)
    row[IDX["cycle_record_count"]] = rng.integers(4, 13).astype(float)

    # Mild symptoms
    row[IDX["symptom_total_count"]] = rng.uniform(5, 25)
    row[IDX["symptom_severity_mean"]] = rng.uniform(1.0, 1.8)
    row[IDX["fatigue_frequency"]] = rng.uniform(0.0, 0.15)
    row[IDX["pelvic_pain_frequency"]] = rng.uniform(0.0, 0.10)
    row[IDX["acne_frequency"]] = rng.uniform(0.0, 0.08)
    row[IDX["mood_symptom_frequency"]] = rng.uniform(0.0, 0.10)
    row[IDX["hirsutism_frequency"]] = rng.uniform(0.0, 0.03)

    # Good lifestyle
    row[IDX["average_water_intake_glasses"]] = rng.uniform(7, 10)
    row[IDX["average_sleep_hours"]] = rng.uniform(7.0, 9.0)
    row[IDX["average_daily_movement_mins"]] = rng.uniform(25, 60)
    row[IDX["workout_frequency_per_week"]] = rng.uniform(3, 6)
    row[IDX["food_logging_frequency"]] = rng.uniform(0.6, 1.0)

    # Good medication adherence
    row[IDX["medication_adherence_rate"]] = rng.uniform(0.80, 1.0)
    row[IDX["active_prescription_count"]] = rng.integers(0, 3).astype(float)

    # Better lab values (NaN ~40% of the time — not all patients have labs)
    if rng.random() > 0.4:
        row[IDX["homa_ir_value"]] = rng.uniform(0.5, 1.8)
    if rng.random() > 0.4:
        row[IDX["vitamin_d_value"]] = rng.uniform(30, 60)
    if rng.random() > 0.5:
        row[IDX["testosterone_value"]] = rng.uniform(15, 45)
    if rng.random() > 0.5:
        row[IDX["lh_fsh_ratio"]] = rng.uniform(0.5, 1.5)

    return row


def _make_moderate_pattern_sample(rng: np.random.Generator) -> np.ndarray:
    """
    Generate a synthetic sample resembling a patient with moderate metabolic
    health risk patterns — some cycle irregularity, moderate symptoms.
    """
    row = np.full(FEATURE_COUNT, np.nan)

    # Somewhat irregular cycles
    row[IDX["cycle_length_mean"]] = rng.normal(31, 4)
    row[IDX["cycle_length_variability"]] = rng.uniform(3, 7)
    row[IDX["cycle_irregularity_rate"]] = rng.uniform(0.15, 0.45)
    row[IDX["cycle_record_count"]] = rng.integers(2, 10).astype(float)

    # Moderate symptoms
    row[IDX["symptom_total_count"]] = rng.uniform(20, 60)
    row[IDX["symptom_severity_mean"]] = rng.uniform(1.7, 2.3)
    row[IDX["fatigue_frequency"]] = rng.uniform(0.10, 0.35)
    row[IDX["pelvic_pain_frequency"]] = rng.uniform(0.08, 0.25)
    row[IDX["acne_frequency"]] = rng.uniform(0.05, 0.20)
    row[IDX["mood_symptom_frequency"]] = rng.uniform(0.10, 0.30)
    row[IDX["hirsutism_frequency"]] = rng.uniform(0.02, 0.12)

    # Moderate lifestyle
    row[IDX["average_water_intake_glasses"]] = rng.uniform(4, 8)
    row[IDX["average_sleep_hours"]] = rng.uniform(6.0, 7.5)
    row[IDX["average_daily_movement_mins"]] = rng.uniform(10, 35)
    row[IDX["workout_frequency_per_week"]] = rng.uniform(1, 4)
    row[IDX["food_logging_frequency"]] = rng.uniform(0.3, 0.7)

    # Moderate medication adherence
    row[IDX["medication_adherence_rate"]] = rng.uniform(0.55, 0.85)
    row[IDX["active_prescription_count"]] = rng.integers(1, 4).astype(float)

    # Moderate lab values
    if rng.random() > 0.35:
        row[IDX["homa_ir_value"]] = rng.uniform(1.8, 3.5)
    if rng.random() > 0.35:
        row[IDX["vitamin_d_value"]] = rng.uniform(18, 35)
    if rng.random() > 0.4:
        row[IDX["testosterone_value"]] = rng.uniform(45, 75)
    if rng.random() > 0.4:
        row[IDX["lh_fsh_ratio"]] = rng.uniform(1.5, 2.5)

    return row


def _make_higher_pattern_sample(rng: np.random.Generator) -> np.ndarray:
    """
    Generate a synthetic sample resembling a patient with higher metabolic
    health risk patterns — irregular cycles, frequent severe symptoms.
    """
    row = np.full(FEATURE_COUNT, np.nan)

    # Highly irregular cycles
    row[IDX["cycle_length_mean"]] = rng.normal(37, 8)
    row[IDX["cycle_length_variability"]] = rng.uniform(7, 20)
    row[IDX["cycle_irregularity_rate"]] = rng.uniform(0.4, 1.0)
    row[IDX["cycle_record_count"]] = rng.integers(1, 7).astype(float)

    # Frequent / severe symptoms
    row[IDX["symptom_total_count"]] = rng.uniform(50, 150)
    row[IDX["symptom_severity_mean"]] = rng.uniform(2.2, 3.0)
    row[IDX["fatigue_frequency"]] = rng.uniform(0.30, 0.70)
    row[IDX["pelvic_pain_frequency"]] = rng.uniform(0.20, 0.60)
    row[IDX["acne_frequency"]] = rng.uniform(0.15, 0.50)
    row[IDX["mood_symptom_frequency"]] = rng.uniform(0.25, 0.65)
    row[IDX["hirsutism_frequency"]] = rng.uniform(0.10, 0.40)

    # Poor lifestyle
    row[IDX["average_water_intake_glasses"]] = rng.uniform(1, 5)
    row[IDX["average_sleep_hours"]] = rng.uniform(4.0, 6.5)
    row[IDX["average_daily_movement_mins"]] = rng.uniform(0, 15)
    row[IDX["workout_frequency_per_week"]] = rng.uniform(0, 2)
    row[IDX["food_logging_frequency"]] = rng.uniform(0.0, 0.4)

    # Poor medication adherence
    row[IDX["medication_adherence_rate"]] = rng.uniform(0.20, 0.60)
    row[IDX["active_prescription_count"]] = rng.integers(2, 6).astype(float)

    # Concerning lab values
    if rng.random() > 0.25:
        row[IDX["homa_ir_value"]] = rng.uniform(3.5, 8.0)
    if rng.random() > 0.25:
        row[IDX["vitamin_d_value"]] = rng.uniform(5, 20)
    if rng.random() > 0.3:
        row[IDX["testosterone_value"]] = rng.uniform(70, 130)
    if rng.random() > 0.3:
        row[IDX["lh_fsh_ratio"]] = rng.uniform(2.5, 5.0)

    return row


def generate_synthetic_dataset(
    n_samples: int = 900,
    seed: int = 42,
    class_weights: tuple[float, float, float] = (0.40, 0.35, 0.25),
) -> tuple[np.ndarray, np.ndarray]:
    """
    Generate a reproducible synthetic dataset for prototype training.

    Distribution:
      lower_pattern    : 40% of samples
      moderate_pattern : 35% of samples
      higher_pattern   : 25% of samples

    ⚠ RESEARCH PROTOTYPE — SYNTHETIC DATA — NOT CLINICALLY VALIDATED
    """
    rng = np.random.default_rng(seed)

    n_lower = int(n_samples * class_weights[0])
    n_moderate = int(n_samples * class_weights[1])
    n_higher = n_samples - n_lower - n_moderate

    rows: list[np.ndarray] = []
    labels: list[int] = []

    for _ in range(n_lower):
        rows.append(_make_lower_pattern_sample(rng))
        labels.append(0)   # lower_pattern

    for _ in range(n_moderate):
        rows.append(_make_moderate_pattern_sample(rng))
        labels.append(1)   # moderate_pattern

    for _ in range(n_higher):
        rows.append(_make_higher_pattern_sample(rng))
        labels.append(2)   # higher_pattern

    X = np.array(rows, dtype=np.float64)
    y = np.array(labels, dtype=np.int32)

    # Shuffle
    idx = rng.permutation(len(X))
    return X[idx], y[idx]


# ---------------------------------------------------------------------------
# Training
# ---------------------------------------------------------------------------

def build_pipeline() -> Pipeline:
    """
    Build the scikit-learn pipeline:
      1. SimpleImputer — median strategy for NaN values (lab features)
      2. StandardScaler — normalize all features
      3. RandomForestClassifier — tree ensemble supporting SHAP TreeExplainer
    """
    return Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler", StandardScaler()),
        ("classifier", RandomForestClassifier(
            n_estimators=200,
            max_depth=10,
            min_samples_leaf=5,
            class_weight="balanced",
            random_state=42,
            n_jobs=-1,
        )),
    ])


def train_and_evaluate() -> Pipeline:
    logger.info("=" * 60)
    logger.info("OvaSense Metabolic Pattern Classifier — Training Pipeline")
    logger.info("⚠  RESEARCH PROTOTYPE — SYNTHETIC TRAINING DATA")
    logger.info("   NOT CLINICALLY VALIDATED")
    logger.info("=" * 60)

    logger.info("Generating synthetic prototype dataset (n=900)...")
    X, y = generate_synthetic_dataset(n_samples=900, seed=42)
    logger.info("Dataset shape: %s | classes: %s", X.shape, np.unique(y, return_counts=True))

    # Train/test split (stratified)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, stratify=y, random_state=42
    )

    pipeline = build_pipeline()

    logger.info("Training RandomForestClassifier pipeline...")
    pipeline.fit(X_train, y_train)

    # Evaluate
    y_pred = pipeline.predict(X_test)
    logger.info("\nTest Set Classification Report:")
    logger.info(
        "\n%s",
        classification_report(
            y_test, y_pred,
            target_names=CLASSES,
            zero_division=0,
        )
    )

    # Cross-validation
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    cv_scores = cross_val_score(pipeline, X, y, cv=cv, scoring="balanced_accuracy")
    logger.info(
        "5-fold CV balanced accuracy: %.3f ± %.3f",
        cv_scores.mean(),
        cv_scores.std(),
    )

    logger.info("Confusion matrix:\n%s", confusion_matrix(y_test, y_pred))

    return pipeline


def save_artifacts(pipeline: Pipeline) -> None:
    # Save the full sklearn Pipeline (includes imputer + scaler + classifier)
    joblib.dump(pipeline, MODEL_PATH)
    logger.info("Model pipeline saved to: %s", MODEL_PATH)

    # Extract the classifier for SHAP (needs raw estimator, not the pipeline)
    classifier = pipeline.named_steps["classifier"]
    imputer = pipeline.named_steps["imputer"]
    scaler = pipeline.named_steps["scaler"]

    # Save metadata
    metadata = {
        "model_name": "ovasense_metabolic_pattern_classifier",
        "model_version": MODEL_VERSION,
        "algorithm": "RandomForestClassifier",
        "pipeline_steps": ["SimpleImputer(median)", "StandardScaler", "RandomForestClassifier"],
        "training_type": "research_prototype",
        "clinical_validation": False,
        "training_dataset": "RESEARCH PROTOTYPE — SYNTHETIC TRAINING DATA — NOT CLINICALLY VALIDATED",
        "feature_count": FEATURE_COUNT,
        "feature_names": FEATURE_NAMES,
        "classes": CLASSES,
        "n_estimators": 200,
        "max_depth": 10,
        "n_samples_train": 720,    # 80% of 900
        "created_at": datetime.now(timezone.utc).isoformat(),
        "disclaimer": (
            "OvaSense provides educational health-pattern insights based on the "
            "information available in your account. It does not provide a medical diagnosis. "
            "Discuss concerning or persistent results with a qualified healthcare professional."
        ),
    }

    with open(METADATA_PATH, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    logger.info("Metadata saved to: %s", METADATA_PATH)
    logger.info("Training complete ✓")


def main():
    pipeline = train_and_evaluate()
    save_artifacts(pipeline)


if __name__ == "__main__":
    main()
