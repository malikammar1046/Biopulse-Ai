"""
research/subgroup_audit.py
--------------------------
Subgroup auditing for BioPulse AI Phase 3.
Evaluates model performance across:
1. Age Groups (19-30, 31-40, 41-50, 51-60)
2. Diabetes Status (No Diabetes vs Diabetes)
3. BMI Categories (Normal < 25, Overweight 25-29.9, Obese >= 30)

Clearly reports sample sizes, positive counts, and subgroup prevalence.
Flags strata with insufficient sample size without making unsupported fairness claims.
Saves machine-readable results to reports/subgroup/subgroup_audit.json.
"""

from __future__ import annotations
import json
import os
import sys
from typing import Any, Dict, List

import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import (
    confusion_matrix,
    precision_score,
    recall_score,
    roc_auc_score
)
from sklearn.model_selection import train_test_split

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
MALE_ML_ROOT = os.path.dirname(CURRENT_DIR)
REPORTS_DIR = os.path.join(MALE_ML_ROOT, "reports", "subgroup")
os.makedirs(REPORTS_DIR, exist_ok=True)

from ablation_runner import (
    TIER1_ARTIFACT,
    TIER1_FEATURES,
    TIER2_ARTIFACT,
    TIER2_FEATURES,
    load_harmonized_paired_dataset
)


def evaluate_stratum(
    sub_df: pd.DataFrame,
    y_sub: np.ndarray,
    prob_sub: np.ndarray,
    threshold: float,
    min_sample_warning: int = 30
) -> Dict[str, Any]:
    """Computes stratum-specific performance with sample size auditing."""
    n_total = len(y_sub)
    n_pos = int(np.sum(y_sub))
    n_neg = n_total - n_pos
    prev = float(n_pos / n_total) if n_total > 0 else 0.0

    is_small_sample = (n_total < min_sample_warning or n_pos < 5)

    if n_pos > 0 and n_neg > 0:
        try:
            auc_val = float(roc_auc_score(y_sub, prob_sub))
        except Exception:
            auc_val = None
    else:
        auc_val = None

    y_pred = (prob_sub >= threshold).astype(int)
    cm = confusion_matrix(y_sub, y_pred, labels=[0, 1])
    tn, fp, fn, tp = cm.ravel()

    sens = tp / (tp + fn) if (tp + fn) > 0 else None
    spec = tn / (tn + fp) if (tn + fp) > 0 else None
    ppv = tp / (tp + fp) if (tp + fp) > 0 else None
    npv = tn / (tn + fn) if (tn + fn) > 0 else None

    return {
        "sample_size_total": int(n_total),
        "positive_count": int(n_pos),
        "negative_count": int(n_neg),
        "prevalence_percent": round(prev * 100, 2),
        "insufficient_sample_size_flag": bool(is_small_sample),
        "screening_threshold": round(float(threshold), 4),
        "roc_auc": round(auc_val, 4) if auc_val is not None else None,
        "sensitivity": round(float(sens), 4) if sens is not None else None,
        "specificity": round(float(spec), 4) if spec is not None else None,
        "precision_ppv": round(float(ppv), 4) if ppv is not None else None,
        "npv": round(float(npv), 4) if npv is not None else None,
        "confusion_matrix": {
            "TN": int(tn),
            "FP": int(fp),
            "FN": int(fn),
            "TP": int(tp)
        }
    }


def run_subgroup_audit() -> Dict[str, Any]:
    """Executes subgroup auditing across age, diabetes, and BMI strata."""
    print("=" * 72)
    print("BIOPULSE RESEARCH PHASE 3: SUBGROUP AUDIT & FAIRNESS ANALYSIS")
    print("=" * 72)

    merged, y = load_harmonized_paired_dataset()
    X_train_full, X_test_full, y_train, y_test = train_test_split(
        merged, y, test_size=0.20, random_state=42, stratify=y
    )

    t1_artifact = joblib.load(TIER1_ARTIFACT)
    t2_artifact = joblib.load(TIER2_ARTIFACT)

    t1_thresh = float(t1_artifact.get("screening_threshold", 0.1808))
    t2_thresh = float(t2_artifact.get("screening_threshold", 0.3379))

    # Predict test probabilities
    test_df = X_test_full.copy()
    test_df["y_true"] = y_test.values
    test_df["prob_tier1"] = t1_artifact["model"].predict_proba(test_df[TIER1_FEATURES])[:, 1]
    test_df["prob_tier2"] = t2_artifact["model"].predict_proba(test_df[TIER2_FEATURES])[:, 1]

    # 1. Age Groups
    test_df["age_group"] = pd.cut(
        test_df["age"],
        bins=[18, 30, 40, 50, 60],
        labels=["19-30", "31-40", "41-50", "51-60"]
    )

    # 2. BMI Categories
    test_df["bmi_category"] = pd.cut(
        test_df["bmi"],
        bins=[0, 24.99, 29.99, 100],
        labels=["Normal (<25)", "Overweight (25-29.9)", "Obese (>=30)"]
    )

    # 3. Diabetes Status
    test_df["diabetes_status"] = test_df["diabetes"].apply(lambda v: "Diabetes" if v == 1 else "No Diabetes")

    audit_results: Dict[str, Any] = {
        "metadata": {
            "total_test_samples": len(test_df),
            "test_positive_prevalence_pct": round(float(test_df["y_true"].mean() * 100), 2)
        },
        "age_subgroups": {},
        "diabetes_subgroups": {},
        "bmi_subgroups": {}
    }

    print("\n--- Auditing Subgroups by Age Bracket ---")
    for grp, grp_df in test_df.groupby("age_group", observed=False):
        y_g = grp_df["y_true"].values
        p_t1 = grp_df["prob_tier1"].values
        p_t2 = grp_df["prob_tier2"].values

        eval_t1 = evaluate_stratum(grp_df, y_g, p_t1, t1_thresh)
        eval_t2 = evaluate_stratum(grp_df, y_g, p_t2, t2_thresh)

        audit_results["age_subgroups"][str(grp)] = {
            "model_a_tier1": eval_t1,
            "model_b_tier2": eval_t2
        }
        auc_str_t1 = f"{eval_t1['roc_auc']:.3f}" if eval_t1['roc_auc'] else "N/A"
        auc_str_t2 = f"{eval_t2['roc_auc']:.3f}" if eval_t2['roc_auc'] else "N/A"
        print(f"  Age {grp:7s} (N={len(grp_df):3d}, Prev={eval_t1['prevalence_percent']:4.1f}%) | Tier 1 AUC: {auc_str_t1} | Tier 2 AUC: {auc_str_t2}")

    print("\n--- Auditing Subgroups by Diabetes Status ---")
    for grp, grp_df in test_df.groupby("diabetes_status", observed=False):
        y_g = grp_df["y_true"].values
        p_t1 = grp_df["prob_tier1"].values
        p_t2 = grp_df["prob_tier2"].values

        eval_t1 = evaluate_stratum(grp_df, y_g, p_t1, t1_thresh)
        eval_t2 = evaluate_stratum(grp_df, y_g, p_t2, t2_thresh)

        audit_results["diabetes_subgroups"][str(grp)] = {
            "model_a_tier1": eval_t1,
            "model_b_tier2": eval_t2
        }
        auc_str_t1 = f"{eval_t1['roc_auc']:.3f}" if eval_t1['roc_auc'] else "N/A"
        auc_str_t2 = f"{eval_t2['roc_auc']:.3f}" if eval_t2['roc_auc'] else "N/A"
        print(f"  {grp:12s} (N={len(grp_df):3d}, Prev={eval_t1['prevalence_percent']:4.1f}%) | Tier 1 AUC: {auc_str_t1} | Tier 2 AUC: {auc_str_t2}")

    print("\n--- Auditing Subgroups by BMI Category ---")
    for grp, grp_df in test_df.groupby("bmi_category", observed=False):
        if len(grp_df) == 0:
            continue
        y_g = grp_df["y_true"].values
        p_t1 = grp_df["prob_tier1"].values
        p_t2 = grp_df["prob_tier2"].values

        eval_t1 = evaluate_stratum(grp_df, y_g, p_t1, t1_thresh)
        eval_t2 = evaluate_stratum(grp_df, y_g, p_t2, t2_thresh)

        audit_results["bmi_subgroups"][str(grp)] = {
            "model_a_tier1": eval_t1,
            "model_b_tier2": eval_t2
        }
        auc_str_t1 = f"{eval_t1['roc_auc']:.3f}" if eval_t1['roc_auc'] else "N/A"
        auc_str_t2 = f"{eval_t2['roc_auc']:.3f}" if eval_t2['roc_auc'] else "N/A"
        print(f"  BMI {grp:22s} (N={len(grp_df):3d}, Prev={eval_t1['prevalence_percent']:4.1f}%) | Tier 1 AUC: {auc_str_t1} | Tier 2 AUC: {auc_str_t2}")

    out_file = os.path.join(REPORTS_DIR, "subgroup_audit.json")
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(audit_results, f, indent=2)

    print(f"\n[Saved] Machine-readable subgroup audit report: {out_file}")
    return audit_results


if __name__ == "__main__":
    run_subgroup_audit()
