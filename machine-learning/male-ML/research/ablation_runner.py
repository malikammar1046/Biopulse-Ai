"""
research/ablation_runner.py
---------------------------
Executes rigorous, reproducible ablation experiments across:
- MODEL A: Tier 1 evidence only (11 non-invasive biometric & symptom features)
- MODEL B: Tier 2 laboratory evidence only (16 indirect laboratory biomarkers without leakage)
- MODEL C: Tier 1 + Tier 2 Multimodal Combined (26 unified features)
- MODEL D: Tier 1 + Tier 2 + Longitudinal evidence (cross-sectional survey audit)

Computes core discrimination and clinical utility metrics with 1,000-iteration bootstrap 95% CIs.
Saves machine-readable results to reports/ablation/ablation_benchmark.json.
"""

from __future__ import annotations
import json
import os
import sys
import warnings
from typing import Any, Dict, List, Tuple

import joblib
import numpy as np
import pandas as pd
from sklearn.calibration import CalibratedClassifierCV
from sklearn.ensemble import RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    average_precision_score,
    brier_score_loss,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score
)
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

# Add male_tier1 and male_tier2 paths
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
MALE_ML_ROOT = os.path.dirname(CURRENT_DIR)
REPORTS_DIR = os.path.join(MALE_ML_ROOT, "reports", "ablation")
os.makedirs(REPORTS_DIR, exist_ok=True)

# Datasets
TIER1_DATA_PATH = os.path.join(MALE_ML_ROOT, "male_tier1", "data", "processed", "male_tier1_nhanes_19_60.csv")
TIER2_DATA_PATH = os.path.join(MALE_ML_ROOT, "male_tier2", "data", "processed", "male_tier2_nhanes_19_60.csv")

TIER1_ARTIFACT = os.path.join(MALE_ML_ROOT, "male_tier1", "artifacts", "male_low_t_model.joblib")
TIER2_ARTIFACT = os.path.join(MALE_ML_ROOT, "male_tier2", "artifacts", "male_tier2_model.joblib")

TIER1_FEATURES = [
    "age", "height_cm", "weight_kg", "bmi", "waist_cm",
    "low_energy", "sleep_trouble", "low_mood", "low_interest",
    "high_blood_pressure", "diabetes"
]

TIER2_FEATURES = [
    "age", "shbg_nmol_l", "estradiol_pg_ml", "albumin_g_dl", "hba1c_pct",
    "glucose_mg_dl", "hemoglobin_g_dl", "hematocrit_pct", "rbc_count",
    "alt_u_l", "ast_u_l", "total_bilirubin_mg_dl", "creatinine_mg_dl",
    "bun_mg_dl", "uric_acid_mg_dl", "hdl_mg_dl"
]

COMBINED_FEATURES = TIER1_FEATURES + [f for f in TIER2_FEATURES if f != "age"]


def load_harmonized_paired_dataset() -> Tuple[pd.DataFrame, pd.Series]:
    """Loads and pairs Tier 1 and Tier 2 NHANES 2013-2016 cohorts by participant SEQN."""
    if not os.path.exists(TIER1_DATA_PATH):
        raise FileNotFoundError(f"Tier 1 dataset not found at: {TIER1_DATA_PATH}")
    if not os.path.exists(TIER2_DATA_PATH):
        raise FileNotFoundError(f"Tier 2 dataset not found at: {TIER2_DATA_PATH}")

    df1 = pd.read_csv(TIER1_DATA_PATH)
    df2 = pd.read_csv(TIER2_DATA_PATH)

    # Merge on SEQN
    merged = df1.merge(
        df2[["SEQN"] + [c for c in TIER2_FEATURES if c not in ["age"]]],
        on="SEQN",
        how="inner"
    )

    y = merged["possible_low_testosterone"].astype(int)
    return merged, y


def compute_metrics(y_true: np.ndarray, y_prob: np.ndarray, threshold: float = 0.50) -> Dict[str, Any]:
    """Computes full set of discrimination, calibration, and threshold-dependent metrics."""
    y_pred = (y_prob >= threshold).astype(int)
    cm = confusion_matrix(y_true, y_pred)
    tn, fp, fn, tp = cm.ravel()

    sensitivity = recall_score(y_true, y_pred, zero_division=0)
    specificity = tn / (tn + fp) if (tn + fp) > 0 else 0.0
    precision = precision_score(y_true, y_pred, zero_division=0)
    npv = tn / (tn + fn) if (tn + fn) > 0 else 0.0
    f1 = f1_score(y_true, y_pred, zero_division=0)
    brier = brier_score_loss(y_true, y_prob)
    roc_auc = roc_auc_score(y_true, y_prob)
    pr_auc = average_precision_score(y_true, y_prob)

    return {
        "threshold": round(float(threshold), 4),
        "roc_auc": round(float(roc_auc), 4),
        "pr_auc": round(float(pr_auc), 4),
        "sensitivity": round(float(sensitivity), 4),
        "specificity": round(float(specificity), 4),
        "precision": round(float(precision), 4),
        "npv": round(float(npv), 4),
        "f1": round(float(f1), 4),
        "brier_score": round(float(brier), 4),
        "confusion_matrix": {
            "TN": int(tn),
            "FP": int(fp),
            "FN": int(fn),
            "TP": int(tp)
        }
    }


def compute_bootstrap_confidence_intervals(
    y_true: np.ndarray,
    y_prob: np.ndarray,
    threshold: float,
    n_bootstraps: int = 1000,
    seed: int = 42
) -> Dict[str, Dict[str, float]]:
    """
    Computes empirical 95% confidence intervals via non-parametric bootstrap resampling.
    """
    rng = np.random.RandomState(seed)
    n = len(y_true)
    metrics_list = {
        "roc_auc": [],
        "pr_auc": [],
        "sensitivity": [],
        "specificity": [],
        "precision": [],
        "npv": [],
        "brier_score": []
    }

    for _ in range(n_bootstraps):
        idx = rng.randint(0, n, size=n)
        b_true = y_true[idx]
        b_prob = y_prob[idx]

        if len(np.unique(b_true)) < 2:
            continue

        b_pred = (b_prob >= threshold).astype(int)
        tn, fp, fn, tp = confusion_matrix(b_true, b_pred, labels=[0, 1]).ravel()

        metrics_list["roc_auc"].append(roc_auc_score(b_true, b_prob))
        metrics_list["pr_auc"].append(average_precision_score(b_true, b_prob))
        metrics_list["sensitivity"].append(tp / (tp + fn) if (tp + fn) > 0 else 0.0)
        metrics_list["specificity"].append(tn / (tn + fp) if (tn + fp) > 0 else 0.0)
        metrics_list["precision"].append(tp / (tp + fp) if (tp + fp) > 0 else 0.0)
        metrics_list["npv"].append(tn / (tn + fn) if (tn + fn) > 0 else 0.0)
        metrics_list["brier_score"].append(brier_score_loss(b_true, b_prob))

    ci_results = {}
    for k, vals in metrics_list.items():
        if len(vals) > 0:
            low = float(np.percentile(vals, 2.5))
            high = float(np.percentile(vals, 97.5))
            ci_results[k] = {
                "ci_95_lower": round(low, 4),
                "ci_95_upper": round(high, 4)
            }
        else:
            ci_results[k] = {"ci_95_lower": None, "ci_95_upper": None}

    return ci_results


def run_ablation_study() -> Dict[str, Any]:
    """Runs full comparative ablation across Models A, B, C, and D."""
    print("=" * 72)
    print("BIOPULSE RESEARCH PHASE 3: ABLATION BENCHMARK EXPERIMENT")
    print("=" * 72)

    merged, y = load_harmonized_paired_dataset()
    print(f"Loaded paired NHANES cohort: N = {len(merged):,} men aged 19–60")
    print(f"Low Testosterone prevalence: {y.mean()*100:.2f}% (N = {y.sum()} positive)")

    # Standard 80/20 train/test split matching existing models
    X_train_full, X_test_full, y_train, y_test = train_test_split(
        merged, y, test_size=0.20, random_state=42, stratify=y
    )

    y_test_arr = y_test.values

    # -------------------------------------------------------------------------
    # MODEL A: Tier 1 Evidence Only (Calibrated Logistic Regression, 11 features)
    # -------------------------------------------------------------------------
    print("\n--- Evaluating Model A (Tier 1 Evidence Only) ---")
    t1_artifact = joblib.load(TIER1_ARTIFACT)
    t1_model = t1_artifact["model"]
    t1_thresh = float(t1_artifact.get("screening_threshold", 0.1808))

    X_test_t1 = X_test_full[TIER1_FEATURES]
    prob_a = t1_model.predict_proba(X_test_t1)[:, 1]

    metrics_a = compute_metrics(y_test_arr, prob_a, threshold=t1_thresh)
    ci_a = compute_bootstrap_confidence_intervals(y_test_arr, prob_a, threshold=t1_thresh)

    print(f"  Model A | ROC-AUC: {metrics_a['roc_auc']:.4f} [{ci_a['roc_auc']['ci_95_lower']} - {ci_a['roc_auc']['ci_95_upper']}]")
    print(f"          | Sensitivity: {metrics_a['sensitivity']*100:.1f}% | Specificity: {metrics_a['specificity']*100:.1f}% | NPV: {metrics_a['npv']*100:.1f}%")

    # -------------------------------------------------------------------------
    # MODEL B: Tier 2 Evidence Only (Calibrated Random Forest, 16 features)
    # -------------------------------------------------------------------------
    print("\n--- Evaluating Model B (Tier 2 Laboratory Evidence Only) ---")
    t2_artifact = joblib.load(TIER2_ARTIFACT)
    t2_model = t2_artifact["model"]
    t2_thresh = float(t2_artifact.get("screening_threshold", 0.3379))

    X_test_t2 = X_test_full[TIER2_FEATURES]
    prob_b = t2_model.predict_proba(X_test_t2)[:, 1]

    metrics_b = compute_metrics(y_test_arr, prob_b, threshold=t2_thresh)
    ci_b = compute_bootstrap_confidence_intervals(y_test_arr, prob_b, threshold=t2_thresh)

    print(f"  Model B | ROC-AUC: {metrics_b['roc_auc']:.4f} [{ci_b['roc_auc']['ci_95_lower']} - {ci_b['roc_auc']['ci_95_upper']}]")
    print(f"          | Sensitivity: {metrics_b['sensitivity']*100:.1f}% | Specificity: {metrics_b['specificity']*100:.1f}% | NPV: {metrics_b['npv']*100:.1f}%")

    # -------------------------------------------------------------------------
    # MODEL C: Multimodal Combined (Tier 1 + Tier 2, 26 features)
    # -------------------------------------------------------------------------
    print("\n--- Training & Evaluating Model C (Tier 1 + Tier 2 Multimodal Combined) ---")
    X_train_c = X_train_full[COMBINED_FEATURES]
    X_test_c = X_test_full[COMBINED_FEATURES]

    # Preprocessing pipeline: median imputation + standard scaling + balanced Random Forest
    rf_base = RandomForestClassifier(
        n_estimators=300,
        max_depth=8,
        min_samples_leaf=10,
        class_weight="balanced",
        random_state=42,
        n_jobs=-1
    )
    pipe_c = Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler", StandardScaler()),
        ("classifier", rf_base)
    ])

    # 5-fold probability calibration
    calibrated_c = CalibratedClassifierCV(estimator=pipe_c, method="sigmoid", cv=5)
    calibrated_c.fit(X_train_c, y_train)

    train_probs_c = calibrated_c.predict_proba(X_train_c)[:, 1]
    # Optimal screening threshold targeting sensitivity >= 80%
    sorted_probs = np.sort(train_probs_c)
    t_c_candidates = sorted_probs[::5]
    best_t_c = 0.35
    for cand in t_c_candidates:
        sens = np.mean((train_probs_c >= cand)[y_train == 1])
        if sens >= 0.80:
            best_t_c = float(cand)

    prob_c = calibrated_c.predict_proba(X_test_c)[:, 1]
    metrics_c = compute_metrics(y_test_arr, prob_c, threshold=best_t_c)
    ci_c = compute_bootstrap_confidence_intervals(y_test_arr, prob_c, threshold=best_t_c)

    print(f"  Model C | Screening Threshold: {best_t_c:.4f}")
    print(f"          | ROC-AUC: {metrics_c['roc_auc']:.4f} [{ci_c['roc_auc']['ci_95_lower']} - {ci_c['roc_auc']['ci_95_upper']}]")
    print(f"          | Sensitivity: {metrics_c['sensitivity']*100:.1f}% | Specificity: {metrics_c['specificity']*100:.1f}% | NPV: {metrics_c['npv']*100:.1f}%")

    # -------------------------------------------------------------------------
    # MODEL D: Tier 1 + Tier 2 + Longitudinal Evidence (Dataset Audit)
    # -------------------------------------------------------------------------
    print("\n--- Auditing Model D (Longitudinal Evidence Availability) ---")
    longitudinal_audit = {
        "status": "DATASET_INCOMPATIBLE_LIMITATION",
        "reason": (
            "CDC NHANES is a cross-sectional epidemiologic survey. Each participant had a single "
            "blood laboratory visit in the Mobile Examination Center (MEC). Repeated morning draws "
            "on separate days do not exist in this public microdata cohort. Rather than manufacturing "
            "synthetic longitudinal points, this limitation is formally documented."
        ),
        "longitudinal_points_per_participant": 1,
        "required_for_evaluation": "Prospective multi-point clinical cohort with paired repeat morning draws",
        "future_architecture_readiness": "Supported by BioPulse EvidenceState longitudinal array and two-test gap engine."
    }
    print(f"  Model D Status: {longitudinal_audit['status']}")
    print(f"  Note: {longitudinal_audit['reason']}")

    # -------------------------------------------------------------------------
    # Compile & Export Results
    # -------------------------------------------------------------------------
    ablation_results = {
        "benchmark_metadata": {
            "dataset": "CDC NHANES 2013-2014 & 2015-2016 Paired Cohort",
            "cohort_filter": "Adult Men aged 19-60",
            "total_participants": len(merged),
            "train_participants": len(X_train_full),
            "test_participants": len(X_test_full),
            "prevalence_pct": round(float(y.mean() * 100), 2),
            "random_seed": 42,
            "bootstrap_iterations": 1000
        },
        "models": {
            "model_a_tier1_only": {
                "name": "Model A: Tier 1 Evidence Only",
                "feature_count": len(TIER1_FEATURES),
                "features": TIER1_FEATURES,
                "model_type": "Calibrated Logistic Regression (L2 Balanced)",
                "screening_threshold": t1_thresh,
                "metrics": metrics_a,
                "confidence_intervals_95": ci_a
            },
            "model_b_tier2_only": {
                "name": "Model B: Tier 2 Laboratory Evidence Only",
                "feature_count": len(TIER2_FEATURES),
                "features": TIER2_FEATURES,
                "model_type": "Calibrated Random Forest (Platt Sigmoid)",
                "screening_threshold": t2_thresh,
                "metrics": metrics_b,
                "confidence_intervals_95": ci_b
            },
            "model_c_multimodal_combined": {
                "name": "Model C: Tier 1 + Tier 2 Multimodal Combined",
                "feature_count": len(COMBINED_FEATURES),
                "features": COMBINED_FEATURES,
                "model_type": "Calibrated Random Forest (Platt Sigmoid)",
                "screening_threshold": round(best_t_c, 4),
                "metrics": metrics_c,
                "confidence_intervals_95": ci_c
            },
            "model_d_longitudinal": {
                "name": "Model D: Tier 1 + Tier 2 + Longitudinal Evidence",
                "audit": longitudinal_audit
            }
        },
        "comparison_table": [
            {
                "model": "Model A (Tier 1 Only)",
                "features": len(TIER1_FEATURES),
                "threshold": t1_thresh,
                "roc_auc": metrics_a["roc_auc"],
                "pr_auc": metrics_a["pr_auc"],
                "sensitivity": metrics_a["sensitivity"],
                "specificity": metrics_a["specificity"],
                "npv": metrics_a["npv"],
                "brier_score": metrics_a["brier_score"]
            },
            {
                "model": "Model B (Tier 2 Only)",
                "features": len(TIER2_FEATURES),
                "threshold": t2_thresh,
                "roc_auc": metrics_b["roc_auc"],
                "pr_auc": metrics_b["pr_auc"],
                "sensitivity": metrics_b["sensitivity"],
                "specificity": metrics_b["specificity"],
                "npv": metrics_b["npv"],
                "brier_score": metrics_b["brier_score"]
            },
            {
                "model": "Model C (Tier 1 + Tier 2)",
                "features": len(COMBINED_FEATURES),
                "threshold": round(best_t_c, 4),
                "roc_auc": metrics_c["roc_auc"],
                "pr_auc": metrics_c["pr_auc"],
                "sensitivity": metrics_c["sensitivity"],
                "specificity": metrics_c["specificity"],
                "npv": metrics_c["npv"],
                "brier_score": metrics_c["brier_score"]
            },
            {
                "model": "Model D (Longitudinal)",
                "features": "N/A",
                "threshold": "N/A",
                "roc_auc": "Unavailable (Cross-sectional NHANES)",
                "pr_auc": "N/A",
                "sensitivity": "N/A",
                "specificity": "N/A",
                "npv": "N/A",
                "brier_score": "N/A"
            }
        ]
    }

    out_file = os.path.join(REPORTS_DIR, "ablation_benchmark.json")
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(ablation_results, f, indent=2)

    print(f"\n[Saved] Machine-readable ablation benchmark: {out_file}")
    return ablation_results


if __name__ == "__main__":
    run_ablation_study()
