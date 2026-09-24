"""
OvaSense ML Pipeline - Evaluation Metrics & Threshold Module
Author: OvaSense ML / Data Science Team
Project: OvaSense FYP

Provides comprehensive evaluation metrics, threshold sweeps, calibration scoring,
and confusion matrix extraction.
"""

import numpy as np
import pandas as pd
from sklearn.metrics import (
    roc_auc_score,
    average_precision_score,
    recall_score,
    precision_score,
    f1_score,
    brier_score_loss,
    confusion_matrix
)
from sklearn.calibration import calibration_curve

def compute_classification_metrics(y_true, y_prob, threshold=0.5):
    """
    Computes standard multi-metric evaluation suite for binary classification.
    """
    y_true = np.array(y_true).astype(int)
    y_prob = np.array(y_prob).astype(float)
    y_pred = (y_prob >= threshold).astype(int)
    
    # Base rates
    n_pos = int(np.sum(y_true == 1))
    n_neg = int(np.sum(y_true == 0))
    
    # Discrimination
    try:
        roc_auc = float(roc_auc_score(y_true, y_prob))
    except Exception:
        roc_auc = float('nan')
        
    try:
        pr_auc = float(average_precision_score(y_true, y_prob))
    except Exception:
        pr_auc = float('nan')
        
    # Threshold-dependent metrics
    sens = float(recall_score(y_true, y_pred, zero_division=0)) # Recall / Sensitivity
    
    # Specificity = TN / (TN + FP)
    tn, fp, fn, tp = confusion_matrix(y_true, y_pred, labels=[0, 1]).ravel()
    spec = float(tn / (tn + fp)) if (tn + fp) > 0 else 0.0
    prec = float(precision_score(y_true, y_pred, zero_division=0))
    f1 = float(f1_score(y_true, y_pred, zero_division=0))
    brier = float(brier_score_loss(y_true, y_prob))
    
    return {
        'roc_auc': roc_auc,
        'pr_auc': pr_auc,
        'sensitivity': sens,
        'specificity': spec,
        'precision': prec,
        'f1': f1,
        'brier_score': brier,
        'tn': int(tn),
        'fp': int(fp),
        'fn': int(fn),
        'tp': int(tp),
        'threshold': float(threshold)
    }

def sweep_thresholds(y_true, y_prob, target_sensitivity=0.85):
    """
    Sweeps thresholds from 0.05 to 0.95 and selects operating point
    satisfying sensitivity >= target_sensitivity with maximal specificity.
    """
    y_true = np.array(y_true).astype(int)
    y_prob = np.array(y_prob).astype(float)
    
    thresholds = np.linspace(0.05, 0.95, 91)
    sweep_records = []
    
    for t in thresholds:
        m = compute_classification_metrics(y_true, y_prob, threshold=t)
        sweep_records.append(m)
        
    df_sweep = pd.DataFrame(sweep_records)
    
    # Filter candidates meeting target sensitivity
    candidates = df_sweep[df_sweep['sensitivity'] >= target_sensitivity]
    if len(candidates) > 0:
        # Choose candidate with highest specificity (and breaking ties with highest F1)
        best_row = candidates.sort_values(by=['specificity', 'f1'], ascending=[False, False]).iloc[0]
    else:
        # Fallback: candidate with maximum sensitivity
        best_row = df_sweep.sort_values(by=['sensitivity', 'f1'], ascending=[False, False]).iloc[0]
        
    best_threshold = float(best_row['threshold'])
    
    # Also find F1-optimal threshold
    best_f1_row = df_sweep.sort_values(by='f1', ascending=False).iloc[0]
    best_f1_threshold = float(best_f1_row['threshold'])
    
    return {
        'sweep_df': df_sweep,
        'selected_threshold': best_threshold,
        'selected_metrics': best_row.to_dict(),
        'optimal_f1_threshold': best_f1_threshold,
        'optimal_f1_metrics': best_f1_row.to_dict()
    }

def compute_calibration_curve(y_true, y_prob, n_bins=10):
    """
    Computes calibration curve probabilities and bin centers.
    """
    prob_true, prob_pred = calibration_curve(y_true, y_prob, n_bins=n_bins, strategy='uniform')
    ece = float(np.mean(np.abs(prob_true - prob_pred)))
    return {
        'prob_true': prob_true.tolist(),
        'prob_pred': prob_pred.tolist(),
        'expected_calibration_error': ece
    }
