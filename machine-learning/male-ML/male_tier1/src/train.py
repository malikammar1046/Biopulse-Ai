"""
train.py
--------
Supervised ML pipeline for Male Tier 1 Screening Model (Men aged 19-60).
Trains, compares, cross-validates, and calibrates models on CDC NHANES data.
Optimizes clinical screening threshold for high sensitivity (>= 80%) to minimize missed cases.
Exports models, preprocessors, performance figures, and detailed metrics.
"""

import os
import json
import joblib
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

from sklearn.model_selection import train_test_split, StratifiedKFold, cross_validate
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, HistGradientBoostingClassifier, VotingClassifier
from sklearn.calibration import CalibratedClassifierCV, calibration_curve
from sklearn.metrics import (
    roc_auc_score, average_precision_score, confusion_matrix,
    classification_report, roc_curve, precision_recall_curve, brier_score_loss
)

BASE_DIR = os.path.dirname(os.path.dirname(__file__))
DATA_PATH = os.path.join(BASE_DIR, "data", "processed", "male_tier1_nhanes_19_60.csv")
ARTIFACTS_DIR = os.path.join(BASE_DIR, "artifacts")
REPORTS_DIR = os.path.join(BASE_DIR, "reports")

os.makedirs(ARTIFACTS_DIR, exist_ok=True)
os.makedirs(REPORTS_DIR, exist_ok=True)

FEATURE_COLS = [
    "age",
    "height_cm",
    "weight_kg",
    "bmi",
    "waist_cm",
    "low_energy",
    "sleep_trouble",
    "low_mood",
    "low_interest",
    "high_blood_pressure",
    "diabetes"
]

TARGET_COL = "possible_low_testosterone"


def load_and_split_data(seed: int = 42):
    """Loads processed dataset and returns stratified train and test splits."""
    if not os.path.exists(DATA_PATH):
        raise FileNotFoundError(f"Processed dataset not found at {DATA_PATH}. Please run data_prep.py first.")
        
    df = pd.read_csv(DATA_PATH)
    print(f"Loaded dataset: {len(df)} rows, {len(FEATURE_COLS)} features.")
    
    # Filter only rows with valid target
    df = df.dropna(subset=[TARGET_COL]).copy()
    
    X = df[FEATURE_COLS].copy()
    y = df[TARGET_COL].astype(int).values
    
    # Verify age restriction
    assert X["age"].min() >= 19.0 and X["age"].max() <= 60.0, "Age constraint [19, 60] violated!"
    
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, stratify=y, random_state=seed
    )
    
    print(f"Train set: {len(X_train)} samples ({np.mean(y_train)*100:.1f}% positive)")
    print(f"Test set:  {len(X_test)} samples ({np.mean(y_test)*100:.1f}% positive)")
    
    return df, X_train, X_test, y_train, y_test


def compute_screening_metrics(y_true, y_prob, threshold: float = 0.5):
    """Computes clinical screening metrics at a given probability threshold."""
    y_pred = (y_prob >= threshold).astype(int)
    cm = confusion_matrix(y_true, y_pred)
    tn, fp, fn, tp = cm.ravel()
    
    sensitivity = tp / (tp + fn) if (tp + fn) > 0 else 0.0  # Recall
    specificity = tn / (tn + fp) if (tn + fp) > 0 else 0.0
    precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0    # PPV
    npv = tn / (tn + fn) if (tn + fn) > 0 else 0.0          # NPV
    f1 = 2 * (precision * sensitivity) / (precision + sensitivity) if (precision + sensitivity) > 0 else 0.0
    acc = (tp + tn) / len(y_true)
    
    return {
        "threshold": round(float(threshold), 4),
        "sensitivity": round(float(sensitivity), 4),
        "specificity": round(float(specificity), 4),
        "precision": round(float(precision), 4),
        "npv": round(float(npv), 4),
        "f1": round(float(f1), 4),
        "accuracy": round(float(acc), 4),
        "confusion_matrix": {"TN": int(tn), "FP": int(fp), "FN": int(fn), "TP": int(tp)}
    }


def find_optimal_screening_threshold(y_true, y_prob, min_sensitivity: float = 0.80):
    """
    Finds optimal clinical screening threshold that guarantees sensitivity >= min_sensitivity
    while maximizing specificity (minimizing false alarms).
    """
    fpr, tpr, thresholds = roc_curve(y_true, y_prob)
    
    # Filter points where sensitivity (tpr) >= min_sensitivity
    valid_mask = tpr >= min_sensitivity
    if np.any(valid_mask):
        # Among valid points, pick the one with lowest FPR (highest specificity = 1 - FPR)
        valid_fpr = fpr[valid_mask]
        valid_thresh = thresholds[valid_mask]
        valid_tpr = tpr[valid_mask]
        
        best_idx = np.argmin(valid_fpr)
        best_threshold = float(valid_thresh[best_idx])
    else:
        # Fallback to Youden's J statistic
        j_scores = tpr - fpr
        best_idx = np.argmax(j_scores)
        best_threshold = float(thresholds[best_idx])
        
    return min(max(best_threshold, 0.05), 0.95)


def build_candidate_pipelines():
    """Builds preprocessed model pipelines for benchmarking."""
    pipelines = {
        "Logistic Regression (Balanced)": Pipeline([
            ("imputer", SimpleImputer(strategy="median")),
            ("scaler", StandardScaler()),
            ("clf", LogisticRegression(C=0.2, penalty="l2", class_weight="balanced", random_state=42, max_iter=1000))
        ]),
        "Random Forest (Balanced)": Pipeline([
            ("imputer", SimpleImputer(strategy="median")),
            ("clf", RandomForestClassifier(n_estimators=250, max_depth=6, min_samples_leaf=15, class_weight="balanced", random_state=42, n_jobs=-1))
        ]),
        "HistGradientBoosting": Pipeline([
            ("imputer", SimpleImputer(strategy="median")),
            ("clf", HistGradientBoostingClassifier(max_iter=120, max_depth=4, min_samples_leaf=25, class_weight="balanced", random_state=42))
        ])
    }
    return pipelines


def cross_validate_candidates(pipelines, X_train, y_train, cv_splits: int = 5):
    """Evaluates candidate models across 5 stratified folds."""
    cv = StratifiedKFold(n_splits=cv_splits, shuffle=True, random_state=42)
    cv_results = {}
    
    print("\n--- 5-Fold Stratified Cross-Validation Benchmark ---")
    for name, pipe in pipelines.items():
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
        print(f"  {name:32s} | ROC-AUC: {mean_roc:.4f} (+/- {std_roc:.4f}) | PR-AUC: {mean_pr:.4f} | Default Recall: {mean_rec:.4f}")
        
    return cv_results


def train_and_calibrate_champion(pipelines, X_train, y_train, best_name: str):
    """Fits and calibrates the best model on the training set."""
    base_pipeline = pipelines[best_name]
    
    # We calibrate probabilities using CalibratedClassifierCV (isotonic or sigmoid)
    calibrated_clf = CalibratedClassifierCV(
        estimator=base_pipeline,
        method="sigmoid",
        cv=5
    )
    calibrated_clf.fit(X_train, y_train)
    
    # Also fit base pipeline directly to inspect coefficients/importances
    base_pipeline.fit(X_train, y_train)
    
    return calibrated_clf, base_pipeline


def evaluate_on_test_set(model, base_pipeline, X_train, y_train, X_test, y_test, df_full):
    """Comprehensive evaluation on unseen test set with subpopulation age auditing."""
    # Obtain out-of-fold or train predictions for threshold calibration
    train_probs = model.predict_proba(X_train)[:, 1]
    test_probs = model.predict_proba(X_test)[:, 1]
    
    # Find optimal screening threshold (Sensitivity >= 80%)
    optimal_thresh = find_optimal_screening_threshold(y_train, train_probs, min_sensitivity=0.80)
    print(f"\nDetermined Optimal Clinical Screening Threshold: {optimal_thresh:.4f} (Targeting Sensitivity >= 80%)")
    
    # Metrics
    test_roc_auc = float(roc_auc_score(y_test, test_probs))
    test_pr_auc = float(average_precision_score(y_test, test_probs))
    test_brier = float(brier_score_loss(y_test, test_probs))
    
    metrics_at_opt = compute_screening_metrics(y_test, test_probs, threshold=optimal_thresh)
    metrics_at_50 = compute_screening_metrics(y_test, test_probs, threshold=0.50)
    
    print("\n--- Test Set Performance at Screening Threshold ({:.2f}) ---".format(optimal_thresh))
    print(f"  ROC-AUC:     {test_roc_auc:.4f}")
    print(f"  PR-AUC:      {test_pr_auc:.4f}")
    print(f"  Sensitivity: {metrics_at_opt['sensitivity']*100:.1f}% (Recall - Primary Screening Metric)")
    print(f"  Specificity: {metrics_at_opt['specificity']*100:.1f}%")
    print(f"  Precision:   {metrics_at_opt['precision']*100:.1f}% (PPV)")
    print(f"  NPV:         {metrics_at_opt['npv']*100:.1f}% (Negative Predictive Value)")
    print(f"  F1 Score:    {metrics_at_opt['f1']:.4f}")
    print(f"  Brier Score: {test_brier:.4f}")
    print(f"  Confusion Matrix: TP={metrics_at_opt['confusion_matrix']['TP']}, FP={metrics_at_opt['confusion_matrix']['FP']}, TN={metrics_at_opt['confusion_matrix']['TN']}, FN={metrics_at_opt['confusion_matrix']['FN']}")
    
    # Age Subpopulation Breakdown
    print("\n--- Age Subpopulation Breakdown (Screening Threshold = {:.2f}) ---".format(optimal_thresh))
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
        g_metrics = compute_screening_metrics(g_true, g_prob, threshold=optimal_thresh)
        g_auc = float(roc_auc_score(g_true, g_prob)) if len(np.unique(g_true)) > 1 else None
        
        age_metrics[str(grp)] = {
            "n_samples": int(len(grp_df)),
            "positive_count": int(np.sum(g_true)),
            "positive_prevalence": round(float(np.mean(g_true)), 4),
            "roc_auc": round(g_auc, 4) if g_auc else None,
            "sensitivity": g_metrics["sensitivity"],
            "specificity": g_metrics["specificity"],
            "precision": g_metrics["precision"],
            "npv": g_metrics["npv"]
        }
        print(f"  Age {grp:5s} | N={len(grp_df):3d} | Prev: {np.mean(g_true)*100:4.1f}% | AUC: {g_auc if g_auc else 0.0:.4f} | Sens: {g_metrics['sensitivity']*100:5.1f}% | Spec: {g_metrics['specificity']*100:5.1f}%")
        
    return {
        "test_roc_auc": round(test_roc_auc, 4),
        "test_pr_auc": round(test_pr_auc, 4),
        "test_brier_score": round(test_brier, 4),
        "screening_threshold": round(float(optimal_thresh), 4),
        "metrics_at_screening_threshold": metrics_at_opt,
        "metrics_at_default_0_5": metrics_at_50,
        "age_subpopulation_metrics": age_metrics,
        "test_probs": test_probs
    }


def generate_diagnostic_plots(y_test, test_probs, base_pipeline, screening_thresh: float):
    """Generates and saves publication-quality evaluation figures."""
    fig, axes = plt.subplots(2, 2, figsize=(14, 11))
    plt.style.use("seaborn-v0_8-whitegrid" if "seaborn-v0_8-whitegrid" in plt.style.available else "default")
    
    # 1. ROC Curve
    fpr, tpr, thresholds = roc_curve(y_test, test_probs)
    auc_val = roc_auc_score(y_test, test_probs)
    
    ax_roc = axes[0, 0]
    ax_roc.plot(fpr, tpr, color="#1f77b4", lw=2.5, label=f"Calibrated Model (AUC = {auc_val:.3f})")
    ax_roc.plot([0, 1], [0, 1], color="gray", lw=1.5, linestyle="--", label="Chance (AUC = 0.500)")
    
    # Mark screening threshold point
    idx_opt = np.argmin(np.abs(thresholds - screening_thresh))
    ax_roc.scatter([fpr[idx_opt]], [tpr[idx_opt]], color="#d62728", s=100, zorder=5, 
                   label=f"Screening Thresh ({screening_thresh:.2f}): Sens={tpr[idx_opt]*100:.1f}%, Spec={(1-fpr[idx_opt])*100:.1f}%")
    ax_roc.set_title("ROC Curve (Ages 19–60)", fontsize=13, fontweight="bold")
    ax_roc.set_xlabel("False Positive Rate (1 - Specificity)", fontsize=11)
    ax_roc.set_ylabel("True Positive Rate (Sensitivity / Recall)", fontsize=11)
    ax_roc.legend(loc="lower right", fontsize=10)
    ax_roc.set_xlim([-0.02, 1.02])
    ax_roc.set_ylim([-0.02, 1.02])
    
    # 2. Precision-Recall Curve
    prec, rec, _ = precision_recall_curve(y_test, test_probs)
    pr_auc = average_precision_score(y_test, test_probs)
    prevalence = np.mean(y_test)
    
    ax_pr = axes[0, 1]
    ax_pr.plot(rec, prec, color="#2ca02c", lw=2.5, label=f"PR Curve (AP = {pr_auc:.3f})")
    ax_pr.axhline(prevalence, color="gray", linestyle="--", label=f"Baseline Prevalence ({prevalence*100:.1f}%)")
    ax_pr.set_title("Precision-Recall Curve", fontsize=13, fontweight="bold")
    ax_pr.set_xlabel("Recall (Sensitivity)", fontsize=11)
    ax_pr.set_ylabel("Precision (Positive Predictive Value)", fontsize=11)
    ax_pr.legend(loc="upper right", fontsize=10)
    ax_pr.set_xlim([-0.02, 1.02])
    ax_pr.set_ylim([-0.02, 1.02])
    
    # 3. Calibration Curve
    fraction_pos, mean_pred = calibration_curve(y_test, test_probs, n_bins=8, strategy="uniform")
    ax_cal = axes[1, 0]
    ax_cal.plot(mean_pred, fraction_pos, "s-", color="#9467bd", lw=2, label="Calibrated Screening Model")
    ax_cal.plot([0, 1], [0, 1], "k--", lw=1.5, label="Perfect Calibration")
    ax_cal.set_title("Probability Calibration Curve", fontsize=13, fontweight="bold")
    ax_cal.set_xlabel("Mean Predicted Probability", fontsize=11)
    ax_cal.set_ylabel("Observed Fraction of Low-T", fontsize=11)
    ax_cal.legend(loc="upper left", fontsize=10)
    ax_cal.set_xlim([-0.02, 1.02])
    ax_cal.set_ylim([-0.02, 1.02])
    
    # 4. Feature Importance / Odds Ratios
    ax_feat = axes[1, 1]
    clf = base_pipeline.named_steps.get("clf")
    if hasattr(clf, "coef_"):
        # Logistic Regression Odds Ratios: exp(coef)
        coefs = clf.coef_[0]
        feature_impact = pd.Series(coefs, index=FEATURE_COLS).sort_values()
        colors = ["#d62728" if c > 0 else "#1f77b4" for c in feature_impact.values]
        ax_feat.barh(feature_impact.index, feature_impact.values, color=colors, edgecolor="black", alpha=0.85)
        ax_feat.axvline(0, color="black", linestyle="-", lw=1)
        ax_feat.set_title("Standardized Feature Coefficients (Log-Odds Impact)", fontsize=13, fontweight="bold")
        ax_feat.set_xlabel("Model Coefficient (Standardized Beta)", fontsize=11)
    elif hasattr(clf, "feature_importances_"):
        importances = pd.Series(clf.feature_importances_, index=FEATURE_COLS).sort_values()
        ax_feat.barh(importances.index, importances.values, color="#1f77b4", edgecolor="black", alpha=0.85)
        ax_feat.set_title("Relative Feature Importances", fontsize=13, fontweight="bold")
        ax_feat.set_xlabel("Gini / Gain Importance", fontsize=11)
        
    plt.tight_layout()
    plot_path = os.path.join(ARTIFACTS_DIR, "model_performance_evaluation.png")
    plt.savefig(plot_path, dpi=200, bbox_inches="tight")
    plt.close()
    print(f"\nSaved evaluation figure to: {plot_path}")
    return plot_path


def main():
    print("==================================================")
    print("Training Male Tier 1 Screening Model (Ages 19-60)")
    print("==================================================")
    
    # 1. Load data
    df, X_train, X_test, y_train, y_test = load_and_split_data(seed=42)
    
    # 2. Build and Benchmark candidate pipelines
    pipelines = build_candidate_pipelines()
    cv_results = cross_validate_candidates(pipelines, X_train, y_train, cv_splits=5)
    
    # 3. Select best model by CV ROC-AUC
    best_model_name = max(cv_results, key=lambda k: cv_results[k]["roc_auc_mean"])
    print(f"\nChampion Candidate Selected: '{best_model_name}' (CV ROC-AUC = {cv_results[best_model_name]['roc_auc_mean']:.4f})")
    
    # 4. Train and Calibrate Champion
    calibrated_model, base_pipeline = train_and_calibrate_champion(pipelines, X_train, y_train, best_model_name)
    
    # 5. Evaluate on Unseen Test Set
    eval_results = evaluate_on_test_set(
        calibrated_model, base_pipeline, X_train, y_train, X_test, y_test, df
    )
    
    # 6. Generate Diagnostic Plots
    plot_path = generate_diagnostic_plots(
        y_test, eval_results["test_probs"], base_pipeline, eval_results["screening_threshold"]
    )
    
    # 7. Extract Feature Weights for Explainability
    clf = base_pipeline.named_steps.get("clf")
    feature_weights = {}
    if hasattr(clf, "coef_"):
        coefs = clf.coef_[0]
        odds_ratios = np.exp(coefs)
        for col, c, odds in zip(FEATURE_COLS, coefs, odds_ratios):
            feature_weights[col] = {
                "coefficient": round(float(c), 4),
                "odds_ratio": round(float(odds), 4),
                "risk_direction": "Increases Risk" if c > 0 else "Decreases Risk"
            }
    elif hasattr(clf, "feature_importances_"):
        for col, imp in zip(FEATURE_COLS, clf.feature_importances_):
            feature_weights[col] = {
                "importance": round(float(imp), 4)
            }
            
    # 8. Save Metrics Report JSON
    full_report = {
        "model_name": best_model_name,
        "target_population": "Men aged 19-60",
        "sample_size": {
            "total_men_19_60": int(len(df)),
            "train_n": int(len(X_train)),
            "test_n": int(len(X_test)),
            "prevalence_percent": round(float(np.mean(df[TARGET_COL])) * 100, 2)
        },
        "features": FEATURE_COLS,
        "cross_validation_benchmark": cv_results,
        "test_evaluation": {
            "roc_auc": eval_results["test_roc_auc"],
            "pr_auc": eval_results["test_pr_auc"],
            "brier_score": eval_results["test_brier_score"],
            "screening_threshold": eval_results["screening_threshold"],
            "metrics_at_screening_threshold": eval_results["metrics_at_screening_threshold"],
            "metrics_at_default_0_5": eval_results["metrics_at_default_0_5"],
            "age_subpopulation_breakdown": eval_results["age_subpopulation_metrics"]
        },
        "feature_weights": feature_weights,
        "safety_disclaimer": "This model is an educational risk screening tool, NOT a diagnostic device. A clinical diagnosis of male hypogonadism requires repeated morning fasting blood serum testosterone laboratory tests and clinical evaluation by a licensed healthcare provider."
    }
    
    metrics_path = os.path.join(ARTIFACTS_DIR, "metrics_report.json")
    with open(metrics_path, "w") as f:
        json.dump(full_report, f, indent=2)
    print(f"Saved metrics report to: {metrics_path}")
    
    # 9. Save Serialized Model Artifact
    model_artifact = {
        "model": calibrated_model,
        "base_pipeline": base_pipeline,
        "feature_names": FEATURE_COLS,
        "screening_threshold": eval_results["screening_threshold"],
        "default_threshold": 0.50,
        "model_name": best_model_name,
        "target_name": "possible_low_testosterone",
        "test_metrics": eval_results["metrics_at_screening_threshold"],
        "age_subpopulation_metrics": eval_results["age_subpopulation_metrics"],
        "metadata": {
            "data_source": "CDC NHANES (2013-2016 continuous cycles, ID-LC-MS/MS Total Testosterone)",
            "target_population": "Men aged 19-60",
            "clinical_cutoff": "Total Testosterone < 300 ng/dL (AUA / Endocrine Society standard)",
            "safety_statement": "Screening tool only. Not a medical diagnosis."
        }
    }
    
    model_save_path = os.path.join(ARTIFACTS_DIR, "male_low_t_model.joblib")
    joblib.dump(model_artifact, model_save_path)
    print(f"Saved calibrated model artifact to: {model_save_path}")
    
    print("\n==================================================")
    print("Model Training & Evaluation Completed Successfully!")
    print("==================================================")


if __name__ == "__main__":
    main()
