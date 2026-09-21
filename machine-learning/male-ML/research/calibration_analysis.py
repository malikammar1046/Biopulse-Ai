"""
research/calibration_analysis.py
--------------------------------
In-depth calibration and reliability evaluation for BioPulse AI Phase 3.
Distinguishes discrimination from calibration.
Calculates Brier score, Expected Calibration Error (ECE), Maximum Calibration Error (MCE),
and generates 10-decile predicted vs. observed risk tables.
Saves machine-readable results to reports/calibration/calibration_metrics.json.
"""

from __future__ import annotations
import json
import os
import sys
from typing import Any, Dict, List, Tuple

import joblib
import numpy as np
import pandas as pd
from sklearn.calibration import calibration_curve
from sklearn.metrics import brier_score_loss, roc_auc_score
from sklearn.model_selection import train_test_split

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
MALE_ML_ROOT = os.path.dirname(CURRENT_DIR)
REPORTS_DIR = os.path.join(MALE_ML_ROOT, "reports", "calibration")
os.makedirs(REPORTS_DIR, exist_ok=True)

from ablation_runner import (
    TIER1_ARTIFACT,
    TIER1_FEATURES,
    TIER2_ARTIFACT,
    TIER2_FEATURES,
    COMBINED_FEATURES,
    load_harmonized_paired_dataset
)


def compute_calibration_statistics(
    y_true: np.ndarray,
    y_prob: np.ndarray,
    n_bins: int = 10
) -> Dict[str, Any]:
    """
    Computes Brier score, Expected Calibration Error (ECE),
    Maximum Calibration Error (MCE), and 10-bin calibration table.
    """
    brier = float(brier_score_loss(y_true, y_prob))
    roc_auc = float(roc_auc_score(y_true, y_prob))

    # Construct quantile-based / equal-width risk bins
    bins = np.linspace(0.0, 1.0, n_bins + 1)
    bin_assignments = np.digitize(y_prob, bins) - 1
    bin_assignments = np.clip(bin_assignments, 0, n_bins - 1)

    decile_records = []
    total_n = len(y_true)
    weighted_abs_diff_sum = 0.0
    max_abs_diff = 0.0

    for b_idx in range(n_bins):
        mask = (bin_assignments == b_idx)
        bin_count = int(np.sum(mask))

        if bin_count > 0:
            bin_pred_mean = float(np.mean(y_prob[mask]))
            bin_obs_mean = float(np.mean(y_true[mask]))
            bin_pos_count = int(np.sum(y_true[mask]))
            diff = abs(bin_pred_mean - bin_obs_mean)
            weighted_abs_diff_sum += (bin_count / total_n) * diff
            if diff > max_abs_diff:
                max_abs_diff = diff
        else:
            bin_pred_mean = float((bins[b_idx] + bins[b_idx + 1]) / 2.0)
            bin_obs_mean = None
            bin_pos_count = 0
            diff = None

        decile_records.append({
            "bin_index": b_idx + 1,
            "bin_range": f"{bins[b_idx]:.2f} - {bins[b_idx+1]:.2f}",
            "sample_count": bin_count,
            "observed_positive_count": bin_pos_count,
            "mean_predicted_probability": round(bin_pred_mean, 4) if bin_pred_mean is not None else None,
            "observed_event_rate": round(bin_obs_mean, 4) if bin_obs_mean is not None else None,
            "calibration_error": round(diff, 4) if diff is not None else None
        })

    prob_true, prob_pred = calibration_curve(y_true, y_prob, n_bins=n_bins, strategy="uniform")

    return {
        "discrimination": {
            "roc_auc": round(roc_auc, 4),
            "concept": "Measures ranking ability: How effectively the model assigns higher scores to men with actual low testosterone than men with normal testosterone."
        },
        "calibration": {
            "brier_score": round(brier, 4),
            "expected_calibration_error_ece": round(weighted_abs_diff_sum, 4),
            "maximum_calibration_error_mce": round(max_abs_diff, 4),
            "concept": "Measures probability accuracy: When the model predicts a 20% risk, approximately 20 of 100 such men should truly have low testosterone."
        },
        "reliability_curve_points": [
            {"predicted": round(float(p), 4), "observed": round(float(o), 4)}
            for p, o in zip(prob_pred, prob_true)
        ],
        "decile_table": decile_records
    }


def run_calibration_evaluation() -> Dict[str, Any]:
    """Evaluates calibration for Tier 1, Tier 2, and Multimodal Combined models."""
    print("=" * 72)
    print("BIOPULSE RESEARCH PHASE 3: CALIBRATION & RELIABILITY EVALUATION")
    print("=" * 72)

    merged, y = load_harmonized_paired_dataset()
    X_train_full, X_test_full, y_train, y_test = train_test_split(
        merged, y, test_size=0.20, random_state=42, stratify=y
    )
    y_test_arr = y_test.values

    # Model A: Tier 1
    print("\n--- Auditing Model A (Tier 1) Calibration ---")
    t1_artifact = joblib.load(TIER1_ARTIFACT)
    prob_a = t1_artifact["model"].predict_proba(X_test_full[TIER1_FEATURES])[:, 1]
    cal_a = compute_calibration_statistics(y_test_arr, prob_a)
    print(f"  Model A | Brier Score: {cal_a['calibration']['brier_score']:.4f} | ECE: {cal_a['calibration']['expected_calibration_error_ece']:.4f}")

    # Model B: Tier 2
    print("\n--- Auditing Model B (Tier 2) Calibration ---")
    t2_artifact = joblib.load(TIER2_ARTIFACT)
    prob_b = t2_artifact["model"].predict_proba(X_test_full[TIER2_FEATURES])[:, 1]
    cal_b = compute_calibration_statistics(y_test_arr, prob_b)
    print(f"  Model B | Brier Score: {cal_b['calibration']['brier_score']:.4f} | ECE: {cal_b['calibration']['expected_calibration_error_ece']:.4f}")

    # Model C: Multimodal Combined
    print("\n--- Auditing Model C (Multimodal Combined) Calibration ---")
    from sklearn.ensemble import RandomForestClassifier
    from sklearn.impute import SimpleImputer
    from sklearn.pipeline import Pipeline
    from sklearn.preprocessing import StandardScaler
    from sklearn.calibration import CalibratedClassifierCV

    rf_base = RandomForestClassifier(n_estimators=300, max_depth=8, min_samples_leaf=10, class_weight="balanced", random_state=42, n_jobs=-1)
    pipe_c = Pipeline([("imputer", SimpleImputer(strategy="median")), ("scaler", StandardScaler()), ("classifier", rf_base)])
    cal_clf_c = CalibratedClassifierCV(estimator=pipe_c, method="sigmoid", cv=5)
    cal_clf_c.fit(X_train_full[COMBINED_FEATURES], y_train)

    prob_c = cal_clf_c.predict_proba(X_test_full[COMBINED_FEATURES])[:, 1]
    cal_c = compute_calibration_statistics(y_test_arr, prob_c)
    print(f"  Model C | Brier Score: {cal_c['calibration']['brier_score']:.4f} | ECE: {cal_c['calibration']['expected_calibration_error_ece']:.4f}")

    results = {
        "metadata": {
            "test_sample_size": len(y_test_arr),
            "test_prevalence_pct": round(float(np.mean(y_test_arr) * 100), 2),
            "calibration_bins": 10
        },
        "model_a_tier1": cal_a,
        "model_b_tier2": cal_b,
        "model_c_multimodal": cal_c
    }

    out_file = os.path.join(REPORTS_DIR, "calibration_metrics.json")
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)

    print(f"\n[Saved] Machine-readable calibration report: {out_file}")
    return results


if __name__ == "__main__":
    run_calibration_evaluation()
