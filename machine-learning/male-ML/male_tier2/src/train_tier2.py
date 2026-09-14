"""
train_tier2.py
--------------
Main training pipeline for Male Tier 2 Laboratory & Hormonal Screener.
Trains and compares:
1. Extra Trees Classifier
2. XGBoost
3. Logistic Regression
4. Random Forest
Calibrates champion model, evaluates on held-out test split,
and exports all artifacts and diagnostic figures.
"""

import os
import json
import joblib
import numpy as np
import pandas as pd

from preprocessing import load_tier2_data, FEATURE_COLS, TARGET_COL
from models import get_tier2_models
from evaluation import (
    run_cross_validation_benchmark, evaluate_champion,
    generate_tier2_plots, interpret_clinical_hormone_pattern,
    ARTIFACTS_DIR, REPORTS_DIR
)


def main():
    print("==================================================")
    print("MALE TIER 2 HORMONAL & LABORATORY MODEL TRAINING")
    print("Population: Men aged 19-60 (CDC NHANES 2013-2016)")
    print("==================================================")
    
    # 1. Load data and verify zero leakage
    df, X_train, X_test, y_train, y_test, features = load_tier2_data(test_size=0.20, random_state=42)
    print(f"Total Cohort: {len(df)} men aged 19–60")
    print(f"Training Set: {len(X_train)} samples ({np.mean(y_train)*100:.1f}% low-T)")
    print(f"Test Set:     {len(X_test)} samples ({np.mean(y_test)*100:.1f}% low-T)")
    print(f"Predictor Features ({len(features)}): {features}")
    
    # 2. Get candidate models
    pos_weight = float((len(y_train) - np.sum(y_train)) / np.sum(y_train))
    models = get_tier2_models(scale_pos_weight=pos_weight)
    
    # 3. 5-Fold Stratified Cross-Validation Benchmark
    cv_results = run_cross_validation_benchmark(models, X_train, y_train, cv_splits=5)
    
    # 4. Select Champion Model by CV ROC-AUC
    champion_name = max(cv_results, key=lambda k: cv_results[k]["roc_auc_mean"])
    print(f"\nChampion Model Selected: '{champion_name}' (CV ROC-AUC: {cv_results[champion_name]['roc_auc_mean']:.4f})")
    
    # 5. Calibrate and Evaluate Champion on Held-Out Test Set
    champion_pipe = models[champion_name]
    eval_output = evaluate_champion(champion_pipe, X_train, y_train, X_test, y_test, df)
    
    # 6. Generate Diagnostic Plots
    plot_path = generate_tier2_plots(
        y_test, eval_output["test_probs"], eval_output["base_pipeline"], eval_output["screening_threshold"]
    )
    print(f"\nSaved diagnostic evaluation figure to: {plot_path}")
    
    # 7. Extract Feature Importances / Coefficients
    clf = eval_output["base_pipeline"].named_steps.get("clf")
    feature_importance = {}
    if hasattr(clf, "feature_importances_"):
        for f, imp in zip(FEATURE_COLS, clf.feature_importances_):
            feature_importance[f] = {"importance": round(float(imp), 4)}
    elif hasattr(clf, "coef_"):
        coefs = clf.coef_[0]
        for f, c in zip(FEATURE_COLS, coefs):
            feature_importance[f] = {
                "coefficient": round(float(c), 4),
                "odds_ratio": round(float(np.exp(c)), 4),
                "direction": "Higher risk" if c > 0 else "Lower risk"
            }
            
    # 8. Save Metrics Report JSON
    metrics_data = {
        "tier": "Male Tier 2",
        "model_type": "Laboratory and Hormonal Pattern Screener",
        "champion_model": champion_name,
        "population": "Adult men aged 19-60",
        "sample_size": {
            "total_men_19_60": len(df),
            "train_samples": len(X_train),
            "test_samples": len(X_test),
            "low_t_prevalence_percent": round(float(np.mean(y_train)) * 100, 2)
        },
        "features_used": FEATURE_COLS,
        "anti_leakage_safeguards": [
            "Total Testosterone (LBXTST) strictly excluded from predictor features",
            "Calculated Free Testosterone strictly excluded from predictor features",
            "Only indirect laboratory markers (SHBG, Estradiol, Albumin, HbA1c, CBC, CMP, Lipids) used in model"
        ],
        "cross_validation_benchmark": cv_results,
        "test_set_evaluation": {
            "roc_auc": eval_output["test_roc_auc"],
            "pr_auc": eval_output["test_pr_auc"],
            "brier_score": eval_output["test_brier_score"],
            "screening_threshold": eval_output["screening_threshold"],
            "metrics_at_screening_threshold": eval_output["metrics_at_screening_threshold"],
            "metrics_at_default_0_5": eval_output["metrics_at_default_0_5"],
            "age_subpopulation_metrics": eval_output["age_subpopulation_metrics"]
        },
        "feature_importance": feature_importance,
        "safety_statement": "Educational screening tool only. Not a medical diagnosis. A clinical diagnosis of hypogonadism requires morning fasting laboratory blood tests and clinical evaluation by a physician."
    }
    
    metrics_file = os.path.join(ARTIFACTS_DIR, "metrics_report.json")
    with open(metrics_file, "w") as f:
        json.dump(metrics_data, f, indent=2)
    print(f"Saved metrics report to: {metrics_file}")
    
    # 9. Save Serialized Model Artifact
    model_artifact = {
        "model": eval_output["calibrated_model"],
        "base_pipeline": eval_output["base_pipeline"],
        "model_name": champion_name,
        "feature_names": FEATURE_COLS,
        "screening_threshold": eval_output["screening_threshold"],
        "test_metrics": eval_output["metrics_at_screening_threshold"],
        "metadata": {
            "tier": "Male Tier 2",
            "target": "low_total_testosterone (<300 ng/dL)",
            "data_source": "CDC NHANES (2013-2016 Continuous Cycles)",
            "population": "Men aged 19-60",
            "leakage_safeguard": "Total Testosterone excluded from feature matrix"
        }
    }
    
    artifact_file = os.path.join(ARTIFACTS_DIR, "male_tier2_model.joblib")
    joblib.dump(model_artifact, artifact_file)
    print(f"Saved serialized model artifact to: {artifact_file}")
    
    print("\n==================================================")
    print("Male Tier 2 Model Training Completed Successfully!")
    print("==================================================")
    
    return metrics_data


if __name__ == "__main__":
    main()
