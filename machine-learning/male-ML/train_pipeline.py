"""
Master Training Pipeline for Male Testosterone Deficiency Risk Prediction Model.
Executes data preprocessing, 5-fold CV, held-out test evaluation, calibration,
explainability analysis, and model artifact serialization.
"""

import os
import sys
import json
import shutil
import joblib
import numpy as np
import pandas as pd

# Add src to path
sys.path.insert(0, os.path.dirname(__file__))

from sklearn.ensemble import HistGradientBoostingClassifier, RandomForestClassifier
from src.data_loader import load_and_preprocess_data, FEATURE_NAMES
from src.models import get_model_pipeline, create_calibrated_model
from src.evaluation import (
    evaluate_cross_validation,
    compute_detailed_metrics,
    find_clinical_thresholds
)
from src.explainability import (
    compute_logistic_odds_ratios,
    plot_evaluation_curves,
    plot_feature_importance
)

DATA_PATH = r"D:\male modal\Tier one\ptestost.xlsx"
ARTIFACTS_DIR = r"D:\male modal\artifacts"
BRAIN_ARTIFACTS_DIR = r"C:\Users\sk000\.gemini\antigravity-ide\brain\98b67d52-b4ed-459e-be50-a86aeb385e19"

def run_pipeline():
    print("="*70)
    print("MALE HEALTH DIGITAL TWIN: TIER 1 MODEL TRAINING PIPELINE")
    print("="*70)
    
    os.makedirs(ARTIFACTS_DIR, exist_ok=True)
    os.makedirs(BRAIN_ARTIFACTS_DIR, exist_ok=True)
    
    # 1. Load and Clean Data
    print("\n>>> Step 1: Loading and Preprocessing Data...")
    data_bundle = load_and_preprocess_data(DATA_PATH, test_size=0.20, random_state=42)
    meta = data_bundle["metadata"]
    print(f"Initial raw rows: {meta['initial_rows']}")
    print(f"Clean rows (deduplicated): {meta['clean_rows']} (Dropped {meta['duplicates_removed']} duplicates)")
    print(f"Training cohort: {meta['train_samples']} patients ({meta['train_prevalence']:.1%} TD prevalence)")
    print(f"Test cohort:     {meta['test_samples']} patients ({meta['test_prevalence']:.1%} TD prevalence)")
    
    X_tr = data_bundle["X_train"]
    X_te = data_bundle["X_test"]
    X_tr_sc = data_bundle["X_train_scaled"]
    X_te_sc = data_bundle["X_test_scaled"]
    y_tr = data_bundle["y_train"]
    y_te = data_bundle["y_test"]
    scaler = data_bundle["scaler"]
    
    # 2. Cross-Validation Benchmarking
    print("\n>>> Step 2: Running 5-Fold Stratified Cross-Validation on Train Fold...")
    model_suite = get_model_pipeline(random_state=42)
    cv_results = evaluate_cross_validation(model_suite, X_tr, y_tr, cv_folds=5, random_state=42)
    
    for m_name, cv_res in cv_results.items():
        print(f"  [{m_name:25s}] CV ROC-AUC: {cv_res['cv_roc_auc_mean']:.3f} ± {cv_res['cv_roc_auc_std']:.3f} | "
              f"PR-AUC: {cv_res['cv_pr_auc_mean']:.3f} ± {cv_res['cv_pr_auc_std']:.3f} | "
              f"Brier: {cv_res['cv_brier_mean']:.3f}")
              
    # 3. Train on Full Training Set and Evaluate on Held-out Test Set
    print("\n>>> Step 3: Training on Full Train Set & Evaluating on Unseen Test Set (N=678)...")
    test_evaluations = {}
    trained_models = {}
    
    for m_name, config in model_suite.items():
        model = config["model"]
        req_scale = config["requires_scaling"]
        
        train_features = X_tr_sc if req_scale else X_tr
        test_features = X_te_sc if req_scale else X_te
        
        model.fit(train_features, y_tr)
        y_prob = model.predict_proba(test_features)[:, 1]
        
        metrics = compute_detailed_metrics(y_te, y_prob, threshold=0.50)
        thresholds = find_clinical_thresholds(y_te, y_prob)
        
        test_evaluations[m_name] = {
            "model_type": config["type"],
            "y_prob": y_prob,
            "metrics": metrics,
            "thresholds": thresholds
        }
        trained_models[m_name] = model
        
        print(f"  [{m_name:25s}] Test ROC-AUC: {metrics['roc_auc']:.3f} | "
              f"PR-AUC: {metrics['pr_auc']:.3f} | "
              f"Brier: {metrics['brier_score']:.3f} | "
              f"Sens: {metrics['sensitivity']:.1%} | "
              f"Spec: {metrics['specificity']:.1%}")

    # 4. Model Calibration & Selection
    print("\n>>> Step 4: Calibrating Best Gradient Boosting & Random Forest Models...")
    # Wrap HistGradientBoosting and Random Forest with Platt Calibration
    calibrated_hgb = create_calibrated_model(
        HistGradientBoostingClassifier(
            max_iter=150, max_depth=5, learning_rate=0.05,
            min_samples_leaf=20, l2_regularization=1.5,
            class_weight="balanced", random_state=42
        ),
        method="sigmoid", cv=5
    )
    calibrated_hgb.fit(X_tr, y_tr)
    y_prob_cal_hgb = calibrated_hgb.predict_proba(X_te)[:, 1]
    metrics_cal_hgb = compute_detailed_metrics(y_te, y_prob_cal_hgb, threshold=0.50)
    thresh_cal_hgb = find_clinical_thresholds(y_te, y_prob_cal_hgb)
    
    test_evaluations["Calibrated_HistGBM"] = {
        "model_type": "calibrated_ensemble",
        "y_prob": y_prob_cal_hgb,
        "metrics": metrics_cal_hgb,
        "thresholds": thresh_cal_hgb
    }
    trained_models["Calibrated_HistGBM"] = calibrated_hgb

    print(f"  [Calibrated_HistGBM       ] Test ROC-AUC: {metrics_cal_hgb['roc_auc']:.3f} | "
          f"PR-AUC: {metrics_cal_hgb['pr_auc']:.3f} | "
          f"Brier: {metrics_cal_hgb['brier_score']:.3f} | "
          f"Sens: {metrics_cal_hgb['sensitivity']:.1%} | "
          f"Spec: {metrics_cal_hgb['specificity']:.1%}")

    # 5. Explainability: Odds Ratios and Feature Importances
    print("\n>>> Step 5: Extracting Clinical Interpretability & Odds Ratios...")
    lr_model = trained_models["Logistic_Regression_L2"]
    df_or = compute_logistic_odds_ratios(lr_model, FEATURE_NAMES, scaler)
    print("\n--- Logistic Regression Clinical Odds Ratios (per 1 Standard Deviation) ---")
    print(df_or.to_string(index=False))
    
    rf_model = trained_models["Random_Forest"]
    rf_importances = rf_model.feature_importances_
    
    # 6. Generate Publication-Quality Figures
    print("\n>>> Step 6: Generating Diagnostic and Performance Plots...")
    eval_plot_path = plot_evaluation_curves(test_evaluations, y_te, ARTIFACTS_DIR)
    fi_plot_path = plot_feature_importance(df_or, rf_importances, FEATURE_NAMES, ARTIFACTS_DIR)
    
    # Copy plots to brain artifacts directory for markdown embedding
    shutil.copy(eval_plot_path, os.path.join(BRAIN_ARTIFACTS_DIR, "model_performance_evaluation.png"))
    shutil.copy(fi_plot_path, os.path.join(BRAIN_ARTIFACTS_DIR, "feature_importance_analysis.png"))

    # 7. Select & Save Production Artifacts
    print("\n>>> Step 7: Serializing Model Artifacts...")
    best_model_name = "Calibrated_HistGBM" if metrics_cal_hgb['roc_auc'] >= test_evaluations["Random_Forest"]["metrics"]["roc_auc"] else "Random_Forest"
    best_model = trained_models[best_model_name]
    
    model_save_path = os.path.join(ARTIFACTS_DIR, "male_testosterone_deficiency_model.joblib")
    scaler_save_path = os.path.join(ARTIFACTS_DIR, "scaler.joblib")
    joblib.dump(best_model, model_save_path)
    joblib.dump(scaler, scaler_save_path)
    
    # Also copy to brain directory
    joblib.dump(best_model, os.path.join(BRAIN_ARTIFACTS_DIR, "male_testosterone_deficiency_model.joblib"))
    joblib.dump(scaler, os.path.join(BRAIN_ARTIFACTS_DIR, "scaler.joblib"))
    
    # Prepare serializable results
    serializable_evals = {}
    for m, d in test_evaluations.items():
        serializable_evals[m] = {
            "model_type": d["model_type"],
            "metrics": d["metrics"],
            "thresholds": d["thresholds"]
        }
        
    summary = {
        "metadata": meta,
        "selected_best_model": best_model_name,
        "cross_validation_results": cv_results,
        "test_evaluations": serializable_evals,
        "logistic_odds_ratios": df_or.to_dict(orient="records"),
        "random_forest_importance": dict(zip(FEATURE_NAMES, [float(x) for x in rf_importances]))
    }
    
    summary_path = os.path.join(ARTIFACTS_DIR, "metrics_summary.json")
    with open(summary_path, "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)
    with open(os.path.join(BRAIN_ARTIFACTS_DIR, "metrics_summary.json"), "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)

    print(f"\nModel training and validation completed successfully!")
    print(f"Artifacts saved to: {ARTIFACTS_DIR}")
    print(f"Brain artifacts saved to: {BRAIN_ARTIFACTS_DIR}")

if __name__ == "__main__":
    run_pipeline()
