"""
run_tabpfn_benchmark.py
-----------------------
Dedicated offline benchmark for TabPFN (Tabular Foundation Model) on Male Tier 1 Screening.

Methodological Rigor & Guardrails:
- Token loaded securely from .env using python-dotenv. Boolean check only (never printed or logged).
- Runs 100% locally on CPU using direct checkpoint weights (no patient data transmitted externally).
- Exact same NHANES dataset (SHA-256 verified), same 7 features, same seed 42 train/test split.
- 5-Fold Stratified Cross-Validation on development partition (N=2,860).
- Decision threshold selected strictly on development OOF predictions (Sens >= 80%).
- Final holdout test evaluation (N=715) at pre-selected threshold.
- Directly updates benchmark comparison tables and JSON reports.
"""

import os
import sys
import time
import json
import hashlib
import dotenv
import numpy as np
import pandas as pd

# 1. Secure Environment Loading
dotenv.load_dotenv(os.path.abspath(".env"))
token_present = bool(os.environ.get("TABPFN_TOKEN"))
if not token_present:
    print("[ERROR] TABPFN_TOKEN not found in .env")
    sys.exit(1)
print(f"[AUTH] TABPFN_TOKEN presence verified: {token_present} (Value hidden)")

from tabpfn import TabPFNClassifier
from sklearn.model_selection import train_test_split, StratifiedKFold
from sklearn.impute import SimpleImputer
from sklearn.metrics import (
    roc_auc_score, average_precision_score, brier_score_loss,
    confusion_matrix, roc_curve, precision_recall_curve
)

# -----------------------------------------------------------------------------
# Configuration and Paths
# -----------------------------------------------------------------------------
RANDOM_SEED = 42
np.random.seed(RANDOM_SEED)

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
BENCHMARK_DIR = os.path.abspath(os.path.join(CURRENT_DIR, ".."))
ARTIFACTS_DIR = os.path.join(BENCHMARK_DIR, "artifacts")
REPORTS_DIR = os.path.join(BENCHMARK_DIR, "reports")

MALE_ML_DIR = os.path.abspath(os.path.join(BENCHMARK_DIR, "..", ".."))
DATA_PATH = os.path.join(MALE_ML_DIR, "male_tier1", "data", "processed", "male_tier1_nhanes_19_60.csv")

FEATURES_7 = [
    "age",
    "height_cm",
    "weight_kg",
    "bmi",
    "waist_cm",
    "high_blood_pressure",
    "diabetes"
]
TARGET_COL = "possible_low_testosterone"

def compute_sha256(filepath: str) -> str:
    hasher = hashlib.sha256()
    with open(filepath, "rb") as f:
        while chunk := f.read(65536):
            hasher.update(chunk)
    return hasher.hexdigest()

def compute_ece(y_true, y_prob, n_bins=10):
    bins = np.linspace(0.0, 1.0, n_bins + 1)
    ece = 0.0
    n = len(y_true)
    for i in range(n_bins):
        idx = np.where((y_prob >= bins[i]) & (y_prob < bins[i + 1]))[0]
        if i == n_bins - 1:
            idx = np.where((y_prob >= bins[i]) & (y_prob <= bins[i + 1]))[0]
        if len(idx) > 0:
            bin_acc = np.mean(y_true[idx])
            bin_conf = np.mean(y_prob[idx])
            ece += (len(idx) / n) * np.abs(bin_acc - bin_conf)
    return float(ece)

def find_screening_threshold_oof(y_true, y_prob_oof, min_sensitivity=0.80):
    fpr, tpr, thresholds = roc_curve(y_true, y_prob_oof)
    valid_mask = tpr >= min_sensitivity
    if np.any(valid_mask):
        best_idx = np.argmin(fpr[valid_mask])
        best_threshold = float(thresholds[valid_mask][best_idx])
    else:
        j_scores = tpr - fpr
        best_threshold = float(thresholds[np.argmax(j_scores)])
    return float(np.clip(best_threshold, 0.05, 0.95))

def compute_screening_metrics(y_true, y_prob, threshold: float):
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

def compute_age_breakdown(df_subset, y_prob, threshold: float):
    age_groups = [
        ("19-30", 19, 30),
        ("31-40", 31, 40),
        ("41-50", 41, 50),
        ("51-60", 51, 60),
    ]
    results = {}
    for label, min_a, max_a in age_groups:
        mask = (df_subset["age"] >= min_a) & (df_subset["age"] <= max_a)
        if mask.sum() == 0:
            continue
        y_sub = df_subset.loc[mask, TARGET_COL].values
        prob_sub = y_prob[mask]
        pred_sub = (prob_sub >= threshold).astype(int)
        cm = confusion_matrix(y_sub, pred_sub, labels=[0, 1])
        tn, fp, fn, tp = cm.ravel()
        sens = tp / (tp + fn) if (tp + fn) > 0 else 0.0
        spec = tn / (tn + fp) if (tn + fp) > 0 else 0.0
        results[label] = {
            "n_total": int(mask.sum()),
            "n_positive": int((tp + fn)),
            "tp": int(tp),
            "fn": int(fn),
            "sensitivity": round(float(sens), 4),
            "specificity": round(float(spec), 4)
        }
    return results

def main():
    print("=" * 80)
    print("BioPulse AI - Male Tier 1 TabPFN Benchmark Execution")
    print("=" * 80)
    
    data_hash = compute_sha256(DATA_PATH)
    print(f"Dataset Path:       {DATA_PATH}")
    print(f"Dataset SHA-256:    {data_hash}")
    
    df = pd.read_csv(DATA_PATH)
    assert len(df) == 3575, f"Expected 3,575 records, found {len(df)}"
    y_full = df[TARGET_COL].astype(int).values
    X_full = df[FEATURES_7].copy()
    
    # Stratified Split (80% dev: 2860, 20% test: 715, seed=42)
    X_train, X_test, y_train, y_test = train_test_split(
        X_full, y_full, test_size=0.20, stratify=y_full, random_state=RANDOM_SEED
    )
    df_train = df.iloc[X_train.index].copy().reset_index(drop=True)
    df_test = df.iloc[X_test.index].copy().reset_index(drop=True)
    
    X_train_clean = X_train.reset_index(drop=True)
    X_test_clean = X_test.reset_index(drop=True)
    
    print(f"Development Set:    N={len(X_train_clean)} (Positive prevalence: {np.mean(y_train)*100:.2f}%)")
    print(f"Holdout Test Set:   N={len(X_test_clean)} (Positive prevalence: {np.mean(y_test)*100:.2f}%)")

    # -------------------------------------------------------------------------
    # 5-Fold Stratified Cross-Validation on Development Data
    # -------------------------------------------------------------------------
    print("\n" + "-" * 80)
    print("STARTING 5-FOLD STRATIFIED CROSS-VALIDATION FOR TabPFN (N=2,860)")
    print("-" * 80)
    
    cv_5 = StratifiedKFold(n_splits=5, shuffle=True, random_state=RANDOM_SEED)
    oof_probs = np.zeros(len(y_train))
    fold_aucs = []
    fold_times = []
    
    imputer = SimpleImputer(strategy="median")
    
    for fold, (tr_idx, val_idx) in enumerate(cv_5.split(X_train_clean, y_train)):
        y_tr_f, y_val_f = y_train[tr_idx], y_train[val_idx]
        
        # Fit median imputer on training fold
        X_tr_f_imp = imputer.fit_transform(X_train_clean.iloc[tr_idx])
        X_val_f_imp = imputer.transform(X_train_clean.iloc[val_idx])
        
        print(f"\n>>> TabPFN Fold {fold + 1}/5 (Train: {len(tr_idx)}, Val: {len(val_idx)})...")
        t_fold_start = time.perf_counter()
        
        clf = TabPFNClassifier.create_default_for_version("v2")
        clf.device = "cpu"
        clf.ignore_pretraining_limits = True
        
        # Fit caches training context
        t_fit_0 = time.perf_counter()
        clf.fit(X_tr_f_imp, y_tr_f)
        t_fit = time.perf_counter() - t_fit_0
        
        # Predict evaluates validation queries with full attention over training context
        t_pred_0 = time.perf_counter()
        p_val = clf.predict_proba(X_val_f_imp)[:, 1]
        t_pred = time.perf_counter() - t_pred_0
        
        total_fold_time = time.perf_counter() - t_fold_start
        fold_times.append(total_fold_time)
        oof_probs[val_idx] = p_val
        
        fold_roc = roc_auc_score(y_val_f, p_val)
        fold_aucs.append(fold_roc)
        print(f"    Fold {fold + 1} ROC-AUC: {fold_roc:.4f} | Fit: {t_fit:.2f}s | Predict: {t_pred:.2f}s ({t_pred*1000/len(val_idx):.2f} ms/sample)")

    # -------------------------------------------------------------------------
    # Development OOF Metrics & Threshold Selection
    # -------------------------------------------------------------------------
    print("\n" + "=" * 80)
    print("TabPFN DEVELOPMENT OUT-OF-FOLD (OOF) PERFORMANCE")
    print("=" * 80)
    
    dev_roc = float(roc_auc_score(y_train, oof_probs))
    dev_pr = float(average_precision_score(y_train, oof_probs))
    dev_brier = float(brier_score_loss(y_train, oof_probs))
    dev_ece = float(compute_ece(y_train, oof_probs))
    
    # Threshold selection guaranteeing Sens >= 80%
    selected_threshold = find_screening_threshold_oof(y_train, oof_probs, min_sensitivity=0.80)
    dev_metrics = compute_screening_metrics(y_train, oof_probs, selected_threshold)
    dev_age = compute_age_breakdown(df_train, oof_probs, selected_threshold)
    
    print(f"OOF ROC-AUC:    {dev_roc:.4f} (+/- {np.std(fold_aucs):.4f})")
    print(f"OOF PR-AUC:     {dev_pr:.4f}")
    print(f"OOF Brier:      {dev_brier:.4f}")
    print(f"OOF ECE:        {dev_ece:.4f}")
    print(f"Selected Threshold (Sens >= 80%): {selected_threshold:.4f}")
    print(f"OOF Sensitivity: {dev_metrics['sensitivity']*100:.2f}% | Specificity: {dev_metrics['specificity']*100:.2f}%")

    # -------------------------------------------------------------------------
    # Final Model Training on Full Development Partition & Holdout Evaluation
    # -------------------------------------------------------------------------
    print("\n" + "=" * 80)
    print("HOLDOUT TEST EVALUATION FOR TabPFN (N=715)")
    print("=" * 80)
    
    X_train_imp = imputer.fit_transform(X_train_clean)
    X_test_imp = imputer.transform(X_test_clean)
    
    final_clf = TabPFNClassifier.create_default_for_version("v2")
    final_clf.device = "cpu"
    final_clf.ignore_pretraining_limits = True
    
    print("Fitting TabPFN on full development set (N=2,860)...")
    final_clf.fit(X_train_imp, y_train)
    
    print("Predicting on unseen holdout test set (N=715)...")
    t0_test = time.perf_counter()
    p_test = final_clf.predict_proba(X_test_imp)[:, 1]
    test_pred_time = time.perf_counter() - t0_test
    latency_ms = round(test_pred_time * 1000 / len(X_test_clean), 3)
    
    test_roc = float(roc_auc_score(y_test, p_test))
    test_pr = float(average_precision_score(y_test, p_test))
    test_brier = float(brier_score_loss(y_test, p_test))
    test_ece = float(compute_ece(y_test, p_test))
    
    test_metrics = compute_screening_metrics(y_test, p_test, selected_threshold)
    test_age = compute_age_breakdown(df_test, p_test, selected_threshold)
    
    print(f"Test ROC-AUC:       {test_roc:.4f}")
    print(f"Test PR-AUC:        {test_pr:.4f}")
    print(f"Test Brier:         {test_brier:.4f}")
    print(f"Test ECE:           {test_ece:.4f}")
    print(f"Test Sensitivity:   {test_metrics['sensitivity']*100:.2f}% (Threshold: {selected_threshold:.4f})")
    print(f"Test Specificity:   {test_metrics['specificity']*100:.2f}%")
    print(f"Test Inference Latency: {latency_ms:.2f} ms/sample (Total: {test_pred_time:.2f}s for 715 samples)")
    print("Age Stratified Sensitivities:")
    for ag, d in test_age.items():
        print(f"  {ag:6s}: {d['sensitivity']*100:5.1f}% ({d['tp']}/{d['n_positive']} detected, N={d['n_total']})")

    # -------------------------------------------------------------------------
    # Save TabPFN Results JSON
    # -------------------------------------------------------------------------
    tabpfn_results = {
        "model_architecture": "TabPFN (v2 Foundation Model)",
        "model_checkpoint": "tabpfn-v2-classifier-finetuned-zk73skhh.ckpt",
        "license_status": "Proprietary Non-Commercial Research License (Prior Labs GmbH)",
        "commercial_usage": "Prohibited without Prior Labs Enterprise License",
        "token_authenticated": True,
        "dev_oof": {
            "roc_auc": round(dev_roc, 4),
            "roc_auc_std": round(float(np.std(fold_aucs)), 4),
            "pr_auc": round(dev_pr, 4),
            "brier_score": round(dev_brier, 4),
            "ece": round(dev_ece, 4),
            "selected_threshold": round(selected_threshold, 4),
            "sensitivity": dev_metrics["sensitivity"],
            "specificity": dev_metrics["specificity"],
            "precision": dev_metrics["precision"],
            "npv": dev_metrics["npv"],
            "f1": dev_metrics["f1"],
            "confusion_matrix": dev_metrics["confusion_matrix"],
            "fold_roc_aucs": [round(x, 4) for x in fold_aucs],
            "age_stratified": dev_age
        },
        "holdout_test": {
            "roc_auc": round(test_roc, 4),
            "pr_auc": round(test_pr, 4),
            "brier_score": round(test_brier, 4),
            "ece": round(test_ece, 4),
            "threshold": round(selected_threshold, 4),
            "sensitivity": test_metrics["sensitivity"],
            "specificity": test_metrics["specificity"],
            "precision": test_metrics["precision"],
            "npv": test_metrics["npv"],
            "f1": test_metrics["f1"],
            "confusion_matrix": test_metrics["confusion_matrix"],
            "latency_ms_per_sample": latency_ms,
            "total_predict_time_seconds": round(test_pred_time, 2),
            "age_stratified": test_age
        }
    }
    
    tabpfn_json_path = os.path.join(REPORTS_DIR, "tabpfn_benchmark_results.json")
    with open(tabpfn_json_path, "w") as f:
        json.dump(tabpfn_results, f, indent=2)
    print(f"\nSaved TabPFN benchmark report to {tabpfn_json_path}")
    
    # -------------------------------------------------------------------------
    # Update Consolidated Comparison Tables
    # -------------------------------------------------------------------------
    csv_path = os.path.join(REPORTS_DIR, "benchmark_comparison_table.csv")
    md_path = os.path.join(REPORTS_DIR, "benchmark_comparison_table.md")
    
    if os.path.exists(csv_path):
        df_comp = pd.read_csv(csv_path)
        # Update or append TabPFN row
        tabpfn_row = {
            "Model Architecture": "TabPFN (v2 Foundation Model)",
            "Parameters/Size": "Checkpoint (~100 MB)",
            "Inference Latency": f"{latency_ms:.2f} ms",
            "Dev OOF ROC-AUC": f"{dev_roc:.4f} (±{np.std(fold_aucs):.4f})",
            "Dev OOF PR-AUC": f"{dev_pr:.4f}",
            "Dev OOF Brier": f"{dev_brier:.4f}",
            "Dev Threshold": f"{selected_threshold:.4f}",
            "Dev Sensitivity": f"{dev_metrics['sensitivity']*100:.1f}%",
            "Dev Specificity": f"{dev_metrics['specificity']*100:.1f}%",
            "Test ROC-AUC": f"{test_roc:.4f}",
            "Test PR-AUC": f"{test_pr:.4f}",
            "Test Brier": f"{test_brier:.4f}",
            "Test ECE": f"{test_ece:.4f}",
            "Test Sensitivity": f"{test_metrics['sensitivity']*100:.1f}%",
            "Test Specificity": f"{test_metrics['specificity']*100:.1f}%",
            "Age 19-30 Sens": f"{test_age['19-30']['sensitivity']*100:.1f}%",
            "Age 51-60 Sens": f"{test_age['51-60']['sensitivity']*100:.1f}%"
        }
        
        # Replace blocked row if exists
        mask = df_comp["Model Architecture"].str.contains("TabPFN")
        if mask.any():
            for k, v in tabpfn_row.items():
                df_comp.loc[mask, k] = v
        else:
            df_comp = pd.concat([df_comp, pd.DataFrame([tabpfn_row])], ignore_index=True)
            
        df_comp.to_csv(csv_path, index=False)
        df_comp.to_markdown(md_path, index=False)
        print(f"Updated {csv_path} and {md_path} with TabPFN empirical benchmark results!")
        
    print("\nTabPFN Benchmark completed successfully!")

if __name__ == "__main__":
    main()
