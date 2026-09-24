"""
Clinical & Machine Learning Evaluation Metrics for Male Testosterone Deficiency Model.
Calculates ROC-AUC, PR-AUC, Brier score, diagnostic metrics, and optimal clinical thresholds.
"""

import numpy as np
import pandas as pd
from sklearn.metrics import (
    roc_auc_score,
    average_precision_score,
    brier_score_loss,
    log_loss,
    confusion_matrix,
    roc_curve,
    precision_recall_curve,
    f1_score
)
from sklearn.model_selection import StratifiedKFold

def compute_detailed_metrics(y_true, y_prob, threshold: float = 0.50):
    """
    Computes comprehensive clinical performance metrics at a specific decision threshold.
    """
    y_pred = (y_prob >= threshold).astype(int)
    tn, fp, fn, tp = confusion_matrix(y_true, y_pred).ravel()
    
    sensitivity = tp / (tp + fn) if (tp + fn) > 0 else 0.0  # Recall
    specificity = tn / (tn + fp) if (tn + fp) > 0 else 0.0
    ppv = tp / (tp + fp) if (tp + fp) > 0 else 0.0          # Precision
    npv = tn / (tn + fn) if (tn + fn) > 0 else 0.0
    f1 = 2 * (ppv * sensitivity) / (ppv + sensitivity) if (ppv + sensitivity) > 0 else 0.0
    accuracy = (tp + tn) / (tp + tn + fp + fn)
    
    roc_auc = roc_auc_score(y_true, y_prob)
    pr_auc = average_precision_score(y_true, y_prob)
    brier = brier_score_loss(y_true, y_prob)
    loss = log_loss(y_true, y_prob)
    
    return {
        "threshold": float(threshold),
        "roc_auc": float(roc_auc),
        "pr_auc": float(pr_auc),
        "brier_score": float(brier),
        "log_loss": float(loss),
        "sensitivity": float(sensitivity),
        "specificity": float(specificity),
        "ppv_precision": float(ppv),
        "npv": float(npv),
        "f1_score": float(f1),
        "accuracy": float(accuracy),
        "true_positives": int(tp),
        "false_positives": int(fp),
        "true_negatives": int(tn),
        "false_negatives": int(fn)
    }

def find_clinical_thresholds(y_true, y_prob):
    """
    Determines optimal clinical decision thresholds:
    1. Default (0.50)
    2. Youden's J statistic (Balanced Sensitivity + Specificity)
    3. High-Sensitivity Screening Threshold (Sensitivity >= 85%)
    4. High-Specificity Rule-in Threshold (Specificity >= 85%)
    """
    fpr, tpr, roc_thresh = roc_curve(y_true, y_prob)
    
    # Youden's Index = TPR - FPR
    j_scores = tpr - fpr
    best_j_idx = np.argmax(j_scores)
    youden_thresh = roc_thresh[best_j_idx]
    if np.isinf(youden_thresh):
        youden_thresh = 0.50
        
    # High-Sensitivity (Screening: >= 85% Sensitivity)
    sens_85_indices = np.where(tpr >= 0.85)[0]
    high_sens_thresh = roc_thresh[sens_85_indices[-1]] if len(sens_85_indices) > 0 else 0.30
    if np.isinf(high_sens_thresh):
        high_sens_thresh = 0.30

    # High-Specificity (Rule-In: Specificity >= 85% => FPR <= 0.15)
    spec_85_indices = np.where(fpr <= 0.15)[0]
    high_spec_thresh = roc_thresh[spec_85_indices[-1]] if len(spec_85_indices) > 0 else 0.70
    if np.isinf(high_spec_thresh):
        high_spec_thresh = 0.70

    threshold_map = {
        "Default_0.50": 0.50,
        "Youden_Balanced": float(youden_thresh),
        "High_Sensitivity_Screening": float(high_sens_thresh),
        "High_Specificity_RuleIn": float(high_spec_thresh)
    }
    
    results = {}
    for name, t_val in threshold_map.items():
        results[name] = compute_detailed_metrics(y_true, y_prob, threshold=t_val)
        
    return results

def evaluate_cross_validation(model_dict, X, y, cv_folds: int = 5, random_state: int = 42):
    """
    Performs 5-fold Stratified Cross-Validation on the training set.
    Tracks ROC-AUC, PR-AUC, and Brier score.
    """
    skf = StratifiedKFold(n_splits=cv_folds, shuffle=True, random_state=random_state)
    results = {}
    
    for model_name, config in model_dict.items():
        model = config["model"]
        req_scale = config["requires_scaling"]
        
        fold_roc = []
        fold_pr = []
        fold_brier = []
        
        for train_idx, val_idx in skf.split(X, y):
            X_tr, X_val = X.iloc[train_idx], X.iloc[val_idx]
            y_tr, y_val = y[train_idx], y[val_idx]
            
            if req_scale:
                from sklearn.preprocessing import StandardScaler
                scaler = StandardScaler()
                X_tr_proc = scaler.fit_transform(X_tr)
                X_val_proc = scaler.transform(X_val)
            else:
                X_tr_proc = X_tr
                X_val_proc = X_val
                
            model.fit(X_tr_proc, y_tr)
            y_prob_val = model.predict_proba(X_val_proc)[:, 1]
            
            fold_roc.append(roc_auc_score(y_val, y_prob_val))
            fold_pr.append(average_precision_score(y_val, y_prob_val))
            fold_brier.append(brier_score_loss(y_val, y_prob_val))
            
        results[model_name] = {
            "cv_roc_auc_mean": float(np.mean(fold_roc)),
            "cv_roc_auc_std": float(np.std(fold_roc)),
            "cv_pr_auc_mean": float(np.mean(fold_pr)),
            "cv_pr_auc_std": float(np.std(fold_pr)),
            "cv_brier_mean": float(np.mean(fold_brier)),
            "cv_brier_std": float(np.std(fold_brier))
        }
        
    return results
