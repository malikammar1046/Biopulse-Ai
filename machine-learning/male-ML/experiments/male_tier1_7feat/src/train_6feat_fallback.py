"""
train_6feat_fallback.py
-----------------------
Controlled Offline Experiment: Standalone Six-Feature Male Tier 1 Fallback Model.
Used when waist circumference is unavailable/omitted.

Features (6):
  ['age', 'height_cm', 'weight_kg', 'bmi', 'high_blood_pressure', 'diabetes']

Strict Experimental Constraints:
- Offline research & development only.
- Fitted strictly on the 80% development split (N=2,860, seed 42) of canonical NHANES data.
- Out-of-fold calibration (cv=5, method='sigmoid') on development data for threshold selection.
- Standalone serialization with full metadata, hash verification, and dependency recording.
- No tuning against the examined holdout partition.
"""

import os
import sys
import json
import hashlib
import joblib
import numpy as np
import pandas as pd
import sklearn
from sklearn.model_selection import train_test_split, StratifiedKFold
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.calibration import CalibratedClassifierCV
from sklearn.metrics import (
    roc_auc_score, average_precision_score, confusion_matrix,
    roc_curve, brier_score_loss
)

MALE_ML_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
DATA_PATH = os.path.join(MALE_ML_DIR, "male_tier1", "data", "processed", "male_tier1_nhanes_19_60.csv")
EXPERIMENT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
ARTIFACTS_DIR = os.path.join(EXPERIMENT_DIR, "artifacts")
REPORTS_DIR = os.path.join(EXPERIMENT_DIR, "reports")

os.makedirs(ARTIFACTS_DIR, exist_ok=True)
os.makedirs(REPORTS_DIR, exist_ok=True)

FALLBACK_FEATURES = [
    "age",
    "height_cm",
    "weight_kg",
    "bmi",
    "high_blood_pressure",
    "diabetes"
]

TARGET_COL = "possible_low_testosterone"
RANDOM_SEED = 42
MODEL_VERSION = "male_tier1_6feat_v1.0.0_exp"


def compute_sha256(filepath: str) -> str:
    hasher = hashlib.sha256()
    with open(filepath, "rb") as f:
        while chunk := f.read(65536):
            hasher.update(chunk)
    return hasher.hexdigest()


def main():
    print("================================================================================")
    print("TRAINING STANDALONE SIX-FEATURE MALE TIER 1 FALLBACK MODEL")
    print("================================================================================")
    
    assert os.path.exists(DATA_PATH), f"Dataset not found at {DATA_PATH}"
    data_hash = compute_sha256(DATA_PATH)
    print(f"Canonical Dataset SHA-256: {data_hash}")
    
    df = pd.read_csv(DATA_PATH)
    y_full = df[TARGET_COL].astype(int).values
    X_6_full = df[FALLBACK_FEATURES].copy()
    
    # 80/20 train/test split with seed 42
    X_train, X_test, y_train, y_test = train_test_split(
        X_6_full, y_full, test_size=0.20, stratify=y_full, random_state=RANDOM_SEED
    )
    
    print(f"Development Set: N={len(X_train)} ({np.mean(y_train)*100:.2f}% prevalence)")
    print(f"Holdout Set:     N={len(X_test)} ({np.mean(y_test)*100:.2f}% prevalence)")
    
    # Base pipeline
    base_pipe_6 = Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler", StandardScaler()),
        ("clf", LogisticRegression(C=0.2, class_weight="balanced", random_state=RANDOM_SEED, max_iter=1000))
    ])
    
    # 5-fold CV on Development Split for OOF Calibration and Threshold Selection
    cv_5 = StratifiedKFold(n_splits=5, shuffle=True, random_state=RANDOM_SEED)
    oof_probs_6 = np.zeros(len(y_train))
    
    print("\nExecuting 5-Fold Stratified Out-of-Fold Calibration on Development Split...")
    for fold, (train_idx, val_idx) in enumerate(cv_5.split(X_train, y_train)):
        X_tr_f, y_tr_f = X_train.iloc[train_idx], y_train[train_idx]
        X_val_f, y_val_f = X_train.iloc[val_idx], y_train[val_idx]
        
        cal_fold = CalibratedClassifierCV(estimator=base_pipe_6, method="sigmoid", cv=3)
        cal_fold.fit(X_tr_f, y_tr_f)
        oof_probs_6[val_idx] = cal_fold.predict_proba(X_val_f)[:, 1]
        
    oof_roc = float(roc_auc_score(y_train, oof_probs_6))
    oof_pr = float(average_precision_score(y_train, oof_probs_6))
    oof_brier = float(brier_score_loss(y_train, oof_probs_6))
    
    print(f"Development OOF ROC-AUC:    {oof_roc:.4f}")
    print(f"Development OOF PR-AUC:     {oof_pr:.4f}")
    print(f"Development OOF Brier:      {oof_brier:.4f}")
    
    # Threshold selection strictly on OOF development data (Sens >= 80%)
    fpr, tpr, thresholds = roc_curve(y_train, oof_probs_6)
    valid_mask = tpr >= 0.80
    if np.any(valid_mask):
        best_idx = np.argmin(fpr[valid_mask])
        screening_thresh_6 = float(thresholds[valid_mask][best_idx])
    else:
        screening_thresh_6 = float(thresholds[np.argmax(tpr - fpr)])
        
    screening_thresh_6 = float(np.clip(screening_thresh_6, 0.05, 0.95))
    print(f"OOF-Derived Screening Threshold (Sens >= 80%): {screening_thresh_6:.4f}")
    
    # Fit final calibrated model on entire development split
    print("\nFitting final calibrated fallback model on full development split (N=2,860)...")
    calibrated_fallback = CalibratedClassifierCV(estimator=base_pipe_6, method="sigmoid", cv=5)
    calibrated_fallback.fit(X_train, y_train)
    
    # Fit base pipeline for uncalibrated coefficients & odds ratios
    base_pipe_6.fit(X_train, y_train)
    clf = base_pipe_6.named_steps["clf"]
    coefs = clf.coef_[0]
    intercept = float(clf.intercept_[0])
    odds_ratios = np.exp(coefs)
    
    feature_coefficients = {}
    for feat, c, odds in zip(FALLBACK_FEATURES, coefs, odds_ratios):
        feature_coefficients[feat] = {
            "standardized_coef": round(float(c), 5),
            "odds_ratio": round(float(odds), 5),
            "risk_direction": "Increases Risk" if c > 0 else "Decreases Risk"
        }
        
    # Evaluate on Holdout Test Partition for Exploratory Benchmark
    test_probs = calibrated_fallback.predict_proba(X_test)[:, 1]
    test_roc = float(roc_auc_score(y_test, test_probs))
    test_pr = float(average_precision_score(y_test, test_probs))
    test_brier = float(brier_score_loss(y_test, test_probs))
    
    y_pred_opt = (test_probs >= screening_thresh_6).astype(int)
    cm = confusion_matrix(y_test, y_pred_opt)
    tn, fp, fn, tp = cm.ravel()
    
    sens = tp / (tp + fn)
    spec = tn / (tn + fp)
    prec = tp / (tp + fp) if (tp + fp) > 0 else 0
    npv = tn / (tn + fn) if (tn + fn) > 0 else 0
    
    print("\n--- Exploratory Holdout Test Evaluation (N=715) ---")
    print(f"  ROC-AUC:     {test_roc:.4f}")
    print(f"  PR-AUC:      {test_pr:.4f}")
    print(f"  Brier Score: {test_brier:.4f}")
    print(f"  Sensitivity: {sens*100:.2f}% ({tp}/{tp+fn})")
    print(f"  Specificity: {spec*100:.2f}% ({tn}/{tn+fp})")
    print(f"  Precision:   {prec*100:.2f}%")
    print(f"  NPV:         {npv*100:.2f}%")
    print(f"  Confusion Matrix: TP={tp}, FP={fp}, TN={tn}, FN={fn}")
    
    # Save standalone candidate fallback artifact
    artifact_path = os.path.join(ARTIFACTS_DIR, "male_tier1_6feat_fallback.joblib")
    artifact_payload = {
        "model": calibrated_fallback,
        "base_pipeline": base_pipe_6,
        "feature_names": FALLBACK_FEATURES,
        "model_version": MODEL_VERSION,
        "model_role": "fallback_no_waist",
        "screening_threshold": screening_thresh_6,
        "default_threshold": 0.50,
        "lower_risk_threshold": 0.10,
        "model_name": "Logistic Regression (Balanced, C=0.2, Sigmoid Calibrated 6-Feature Fallback)",
        "target_name": TARGET_COL,
        "training_metadata": {
            "dataset_sha256": data_hash,
            "train_n": len(X_train),
            "test_n": len(X_test),
            "seed": RANDOM_SEED,
            "python_version": sys.version,
            "sklearn_version": sklearn.__version__,
            "development_oof_metrics": {
                "oof_roc_auc": round(oof_roc, 4),
                "oof_pr_auc": round(oof_pr, 4),
                "oof_brier": round(oof_brier, 4),
                "screening_threshold": round(screening_thresh_6, 4)
            },
            "exploratory_test_metrics": {
                "roc_auc": round(test_roc, 4),
                "pr_auc": round(test_pr, 4),
                "brier": round(test_brier, 4),
                "sensitivity": round(float(sens), 4),
                "specificity": round(float(spec), 4),
                "confusion_matrix": {"TP": int(tp), "FP": int(fp), "TN": int(tn), "FN": int(fn)}
            }
        },
        "feature_coefficients": feature_coefficients
    }
    
    joblib.dump(artifact_payload, artifact_path)
    artifact_hash = compute_sha256(artifact_path)
    print(f"\nSaved Standalone 6-Feature Fallback Artifact to: {artifact_path}")
    print(f"Artifact File Size: {os.path.getsize(artifact_path)} bytes")
    print(f"Artifact SHA-256:   {artifact_hash}")
    
    # Save report metadata JSON
    fallback_report_path = os.path.join(REPORTS_DIR, "fallback_6feat_metrics_report.json")
    with open(fallback_report_path, "w") as f:
        json.dump(artifact_payload["training_metadata"], f, indent=2)
    print(f"Saved Fallback Report Metadata to: {fallback_report_path}")
    print("\n================================================================================")
    print("SIX-FEATURE FALLBACK TRAINING & SERIALIZATION COMPLETED SUCCESSFULLY!")
    print("================================================================================")


if __name__ == "__main__":
    main()
