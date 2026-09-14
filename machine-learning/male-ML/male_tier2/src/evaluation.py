"""
evaluation.py
-------------
Comprehensive cross-validation, threshold optimization, calibration,
and test-set evaluation for Male Tier 2 Laboratory Screener.
Benchmarks:
- Extra Trees
- XGBoost
- Logistic Regression
- Random Forest
Includes clinical pattern interpretation rules for LH/FSH/Prolactin.
"""

import os
import json
import joblib
from typing import Optional, Dict, Any, List
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

from sklearn.model_selection import StratifiedKFold, cross_validate
from sklearn.calibration import CalibratedClassifierCV, calibration_curve
from sklearn.metrics import (
    roc_auc_score, average_precision_score, confusion_matrix,
    roc_curve, precision_recall_curve, brier_score_loss
)

from preprocessing import load_tier2_data, build_preprocessor, FEATURE_COLS, TARGET_COL
from models import get_tier2_models

BASE_DIR = os.path.dirname(os.path.dirname(__file__))
ARTIFACTS_DIR = os.path.join(BASE_DIR, "artifacts")
REPORTS_DIR = os.path.join(BASE_DIR, "reports")

os.makedirs(ARTIFACTS_DIR, exist_ok=True)
os.makedirs(REPORTS_DIR, exist_ok=True)


def compute_metrics(y_true, y_prob, threshold: float = 0.5):
    """Computes screening metrics at a given decision threshold."""
    y_pred = (y_prob >= threshold).astype(int)
    cm = confusion_matrix(y_true, y_pred)
    tn, fp, fn, tp = cm.ravel()
    
    sens = tp / (tp + fn) if (tp + fn) > 0 else 0.0
    spec = tn / (tn + fp) if (tn + fp) > 0 else 0.0
    prec = tp / (tp + fp) if (tp + fp) > 0 else 0.0
    npv = tn / (tn + fn) if (tn + fn) > 0 else 0.0
    f1 = 2 * (prec * sens) / (prec + sens) if (prec + sens) > 0 else 0.0
    acc = (tp + tn) / len(y_true)
    
    return {
        "threshold": round(float(threshold), 4),
        "sensitivity": round(float(sens), 4),
        "specificity": round(float(spec), 4),
        "precision": round(float(prec), 4),
        "npv": round(float(npv), 4),
        "f1": round(float(f1), 4),
        "accuracy": round(float(acc), 4),
        "confusion_matrix": {"TN": int(tn), "FP": int(fp), "FN": int(fn), "TP": int(tp)}
    }


def find_screening_threshold(y_true, y_prob, min_sensitivity: float = 0.80):
    """Finds optimal threshold guaranteeing sensitivity >= 80% with maximal specificity."""
    fpr, tpr, thresholds = roc_curve(y_true, y_prob)
    valid_mask = tpr >= min_sensitivity
    if np.any(valid_mask):
        valid_fpr = fpr[valid_mask]
        valid_thresh = thresholds[valid_mask]
        best_idx = np.argmin(valid_fpr)
        best_t = float(valid_thresh[best_idx])
    else:
        j_scores = tpr - fpr
        best_t = float(thresholds[np.argmax(j_scores)])
    return min(max(best_t, 0.05), 0.95)


def run_cross_validation_benchmark(models, X_train, y_train, cv_splits: int = 5):
    """Evaluates all 4 candidate models across 5 stratified folds."""
    cv = StratifiedKFold(n_splits=cv_splits, shuffle=True, random_state=42)
    cv_results = {}
    
    print("\n==================================================")
    print("5-Fold Stratified Cross-Validation Benchmark (Tier 2)")
    print("==================================================")
    
    for name, pipe in models.items():
        scoring = ["roc_auc", "average_precision", "recall", "neg_brier_score"]
        scores = cross_validate(pipe, X_train, y_train, cv=cv, scoring=scoring, n_jobs=-1)
        
        mean_roc = float(scores["test_roc_auc"].mean())
        std_roc = float(scores["test_roc_auc"].std())
        mean_pr = float(scores["test_average_precision"].mean())
        mean_rec = float(scores["test_recall"].mean())
        mean_brier = float(-scores["test_neg_brier_score"].mean())
        
        cv_results[name] = {
            "roc_auc_mean": round(mean_roc, 4),
            "roc_auc_std": round(std_roc, 4),
            "pr_auc_mean": round(mean_pr, 4),
            "sensitivity_default_mean": round(mean_rec, 4),
            "brier_score_mean": round(mean_brier, 4)
        }
        print(f"  {name:26s} | ROC-AUC: {mean_roc:.4f} (+/- {std_roc:.4f}) | PR-AUC: {mean_pr:.4f} | Default Recall: {mean_rec:.4f}")
        
    return cv_results


def evaluate_champion(champion_pipe, X_train, y_train, X_test, y_test, df_full):
    """Calibrates best model and performs test-set evaluation with age auditing."""
    # Calibrate probability predictions
    calibrated_clf = CalibratedClassifierCV(estimator=champion_pipe, method="sigmoid", cv=5)
    calibrated_clf.fit(X_train, y_train)
    champion_pipe.fit(X_train, y_train)
    
    train_probs = calibrated_clf.predict_proba(X_train)[:, 1]
    test_probs = calibrated_clf.predict_proba(X_test)[:, 1]
    
    screening_t = find_screening_threshold(y_train, train_probs, min_sensitivity=0.80)
    print(f"\nDetermined Optimal Screening Threshold: {screening_t:.4f} (Targeting Sensitivity >= 80%)")
    
    test_roc_auc = float(roc_auc_score(y_test, test_probs))
    test_pr_auc = float(average_precision_score(y_test, test_probs))
    test_brier = float(brier_score_loss(y_test, test_probs))
    
    metrics_screening = compute_metrics(y_test, test_probs, threshold=screening_t)
    metrics_default = compute_metrics(y_test, test_probs, threshold=0.50)
    
    print("\n--- Test Set Performance at Screening Threshold ({:.2f}) ---".format(screening_t))
    print(f"  ROC-AUC:     {test_roc_auc:.4f}")
    print(f"  PR-AUC:      {test_pr_auc:.4f}")
    print(f"  Sensitivity: {metrics_screening['sensitivity']*100:.1f}% (Recall)")
    print(f"  Specificity: {metrics_screening['specificity']*100:.1f}%")
    print(f"  Precision:   {metrics_screening['precision']*100:.1f}% (PPV)")
    print(f"  NPV:         {metrics_screening['npv']*100:.1f}% (Negative Predictive Value)")
    print(f"  Brier Score: {test_brier:.4f}")
    
    # Subpopulation Breakdown by Age Bracket
    print("\n--- Age Subpopulation Breakdown (Screening Threshold = {:.2f}) ---".format(screening_t))
    test_df = X_test.copy()
    test_df["y_true"] = y_test
    test_df["y_prob"] = test_probs
    test_df["age_group"] = pd.cut(test_df["age"], bins=[18, 30, 40, 50, 60], labels=["19-30", "31-40", "41-50", "51-60"])
    
    age_metrics = {}
    for grp, grp_df in test_df.groupby("age_group", observed=False):
        if len(grp_df) == 0:
            continue
        g_true = grp_df["y_true"].values
        g_prob = grp_df["y_prob"].values
        g_metrics = compute_metrics(g_true, g_prob, threshold=screening_t)
        g_auc = float(roc_auc_score(g_true, g_prob)) if len(np.unique(g_true)) > 1 else None
        
        age_metrics[str(grp)] = {
            "n_samples": int(len(grp_df)),
            "positive_count": int(np.sum(g_true)),
            "positive_prevalence": round(float(np.mean(g_true)), 4),
            "roc_auc": round(g_auc, 4) if g_auc else None,
            "sensitivity": g_metrics["sensitivity"],
            "specificity": g_metrics["specificity"],
            "npv": g_metrics["npv"],
            "precision": g_metrics["precision"]
        }
        print(f"  Age {grp:5s} | N={len(grp_df):3d} | Prev: {np.mean(g_true)*100:4.1f}% | AUC: {g_auc if g_auc else 0.0:.4f} | Sens: {g_metrics['sensitivity']*100:5.1f}% | Spec: {g_metrics['specificity']*100:5.1f}%")
        
    return {
        "calibrated_model": calibrated_clf,
        "base_pipeline": champion_pipe,
        "test_roc_auc": round(test_roc_auc, 4),
        "test_pr_auc": round(test_pr_auc, 4),
        "test_brier_score": round(test_brier, 4),
        "screening_threshold": round(float(screening_t), 4),
        "metrics_at_screening_threshold": metrics_screening,
        "metrics_at_default_0_5": metrics_default,
        "age_subpopulation_metrics": age_metrics,
        "test_probs": test_probs
    }


def interpret_clinical_hormone_pattern(
    total_t_ng_dl: Optional[float] = None,
    lh_miu_ml: Optional[float] = None,
    fsh_miu_ml: Optional[float] = None,
    prolactin_ng_ml: Optional[float] = None,
    ref_ranges: Optional[dict] = None
) -> dict:
    """
    Modular clinical pattern rule layer (NOT a medical diagnosis).
    Evaluates available hormones against guideline patterns:
    - Primary pattern (Elevated LH/FSH with Low T)
    - Secondary pattern (Low/Inappropriately Normal LH/FSH with Low T)
    - Hyperprolactinemic pattern
    - Normal androgen pattern
    """
    ref_ranges = ref_ranges or {}
    t_ref_low = ref_ranges.get("total_testosterone_low", 300.0)
    lh_ref_high = ref_ranges.get("lh_high", 8.6)
    lh_ref_low = ref_ranges.get("lh_low", 1.7)
    fsh_ref_high = ref_ranges.get("fsh_high", 12.4)
    prl_ref_high = ref_ranges.get("prolactin_high", 15.0)
    
    pattern_name = "Incomplete Hormone Profile"
    pattern_description = "Additional blood tests (such as LH hormone or FSH hormone) are needed to better understand the hormonal pattern."
    flags = []
    
    is_low_t = (total_t_ng_dl is not None and total_t_ng_dl < t_ref_low)
    
    if total_t_ng_dl is not None:
        if is_low_t:
            flags.append(f"Testosterone level ({total_t_ng_dl:.1f} ng/dL) is below the reference range ({t_ref_low:.0f} ng/dL).")
        else:
            flags.append(f"Testosterone level ({total_t_ng_dl:.1f} ng/dL) is within the reference range.")
            
    if prolactin_ng_ml is not None and prolactin_ng_ml > prl_ref_high:
        flags.append(f"Prolactin hormone ({prolactin_ng_ml:.1f} ng/mL) is higher than reference range (< {prl_ref_high:.1f} ng/mL).")
        if is_low_t:
            pattern_name = "Possible Prolactin-Related Pattern"
            pattern_description = (
                "An elevated prolactin hormone level can sometimes signal the body to lower testosterone production. "
                "A healthcare professional can check this together with medications and other blood tests. "
                "This is an educational pattern interpretation, not a medical diagnosis."
            )
            return {"pattern_name": pattern_name, "pattern_description": pattern_description, "clinical_flags": flags}

    if is_low_t:
        if lh_miu_ml is not None or fsh_miu_ml is not None:
            is_lh_high = (lh_miu_ml is not None and lh_miu_ml > lh_ref_high)
            is_fsh_high = (fsh_miu_ml is not None and fsh_miu_ml > fsh_ref_high)
            
            if is_lh_high or is_fsh_high:
                pattern_name = "Primary Hormonal Pattern (Higher LH/FSH with Low Testosterone)"
                pattern_description = (
                    "Your LH hormone or FSH hormone signals from the brain are high while testosterone level is low. "
                    "This pattern suggests the brain is sending strong signals to produce testosterone, but production in the body remains low. "
                    "This is an educational pattern interpretation, not a medical diagnosis."
                )
                flags.append("Higher LH hormone or FSH hormone with low testosterone level.")
            else:
                pattern_name = "Secondary Hormonal Pattern (Normal or Low LH/FSH with Low Testosterone)"
                pattern_description = (
                    "Both testosterone level and brain signal hormones (LH hormone, FSH hormone) are low or in the standard range. "
                    "This pattern can sometimes be linked with sleep, daily stress, metabolic factors, or how the brain signals the body to produce testosterone. "
                    "This is an educational pattern interpretation, not a medical diagnosis."
                )
                flags.append("LH hormone and FSH hormone are not elevated despite low testosterone level.")
        else:
            pattern_name = "Low Testosterone Level (LH/FSH Hormones Not Tested)"
            pattern_description = (
                "Your testosterone level is low, but LH hormone and FSH hormone were not tested. "
                "Checking LH hormone and FSH hormone can help a doctor understand whether the brain signals or the body's response are involved. "
                "This is an educational pattern interpretation, not a medical diagnosis."
            )
    elif total_t_ng_dl is not None:
        pattern_name = "Testosterone Level Within Reference Range"
        pattern_description = "Your reported testosterone level is within the standard reference range shown on the blood test."
        
    return {
        "pattern_name": pattern_name,
        "pattern_description": pattern_description,
        "clinical_flags": flags
    }


def generate_tier2_plots(y_test, test_probs, base_pipeline, screening_thresh: float):
    """Generates publication diagnostic plots for Tier 2."""
    fig, axes = plt.subplots(2, 2, figsize=(14, 11))
    plt.style.use("seaborn-v0_8-whitegrid" if "seaborn-v0_8-whitegrid" in plt.style.available else "default")
    
    # 1. ROC Curve
    fpr, tpr, thresholds = roc_curve(y_test, test_probs)
    auc_val = roc_auc_score(y_test, test_probs)
    ax_roc = axes[0, 0]
    ax_roc.plot(fpr, tpr, color="#0284c7", lw=2.5, label=f"Calibrated Laboratory Model (AUC = {auc_val:.3f})")
    ax_roc.plot([0, 1], [0, 1], color="gray", lw=1.5, linestyle="--", label="Chance (AUC = 0.500)")
    idx_opt = np.argmin(np.abs(thresholds - screening_thresh))
    ax_roc.scatter([fpr[idx_opt]], [tpr[idx_opt]], color="#dc2626", s=100, zorder=5,
                   label=f"Screening Thresh ({screening_thresh:.2f}): Sens={tpr[idx_opt]*100:.1f}%, Spec={(1-fpr[idx_opt])*100:.1f}%")
    ax_roc.set_title("Tier 2 ROC Curve (Ages 19–60)", fontsize=13, fontweight="bold")
    ax_roc.set_xlabel("False Positive Rate (1 - Specificity)", fontsize=11)
    ax_roc.set_ylabel("True Positive Rate (Sensitivity)", fontsize=11)
    ax_roc.legend(loc="lower right", fontsize=10)
    ax_roc.set_xlim([-0.02, 1.02])
    ax_roc.set_ylim([-0.02, 1.02])
    
    # 2. Precision-Recall Curve
    prec, rec, _ = precision_recall_curve(y_test, test_probs)
    pr_auc = average_precision_score(y_test, test_probs)
    prev = np.mean(y_test)
    ax_pr = axes[0, 1]
    ax_pr.plot(rec, prec, color="#16a34a", lw=2.5, label=f"PR Curve (AP = {pr_auc:.3f})")
    ax_pr.axhline(prev, color="gray", linestyle="--", label=f"Base Prevalence ({prev*100:.1f}%)")
    ax_pr.set_title("Precision-Recall Curve", fontsize=13, fontweight="bold")
    ax_pr.set_xlabel("Recall (Sensitivity)", fontsize=11)
    ax_pr.set_ylabel("Precision (PPV)", fontsize=11)
    ax_pr.legend(loc="upper right", fontsize=10)
    ax_pr.set_xlim([-0.02, 1.02])
    ax_pr.set_ylim([-0.02, 1.02])
    
    # 3. Calibration Curve
    fraction_pos, mean_pred = calibration_curve(y_test, test_probs, n_bins=8, strategy="uniform")
    ax_cal = axes[1, 0]
    ax_cal.plot(mean_pred, fraction_pos, "s-", color="#7c3aed", lw=2, label="Calibrated Screener")
    ax_cal.plot([0, 1], [0, 1], "k--", lw=1.5, label="Perfect Calibration")
    ax_cal.set_title("Probability Calibration Curve", fontsize=13, fontweight="bold")
    ax_cal.set_xlabel("Mean Predicted Probability", fontsize=11)
    ax_cal.set_ylabel("Observed Fraction of Low-T", fontsize=11)
    ax_cal.legend(loc="upper left", fontsize=10)
    ax_cal.set_xlim([-0.02, 1.02])
    ax_cal.set_ylim([-0.02, 1.02])
    
    # 4. Feature Impact / Importance
    ax_feat = axes[1, 1]
    clf = base_pipeline.named_steps.get("clf")
    if hasattr(clf, "feature_importances_"):
        imps = pd.Series(clf.feature_importances_, index=FEATURE_COLS).sort_values()
        ax_feat.barh(imps.index, imps.values, color="#0284c7", edgecolor="black", alpha=0.85)
        ax_feat.set_title("Relative Laboratory Feature Importances", fontsize=13, fontweight="bold")
        ax_feat.set_xlabel("Importance (Gini / Gain)", fontsize=11)
    elif hasattr(clf, "coef_"):
        coefs = clf.coef_[0]
        impact = pd.Series(coefs, index=FEATURE_COLS).sort_values()
        colors = ["#dc2626" if c > 0 else "#0284c7" for c in impact.values]
        ax_feat.barh(impact.index, impact.values, color=colors, edgecolor="black", alpha=0.85)
        ax_feat.axvline(0, color="black", lw=1)
        ax_feat.set_title("Standardized Feature Coefficients (Log-Odds)", fontsize=13, fontweight="bold")
        ax_feat.set_xlabel("Coefficient (Beta)", fontsize=11)
        
    plt.tight_layout()
    plot_path = os.path.join(ARTIFACTS_DIR, "tier2_model_performance.png")
    plt.savefig(plot_path, dpi=200, bbox_inches="tight")
    plt.close()
    return plot_path
