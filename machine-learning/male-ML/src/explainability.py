"""
Explainability, Visualization, and Clinical Interpretability Module.
Generates ROC, PR, Calibration, and Feature Importance plots, and computes odds ratios.
"""

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import os
from sklearn.metrics import roc_curve, precision_recall_curve, confusion_matrix
from sklearn.calibration import calibration_curve

# Set clean scientific plotting style
plt.style.use('tableau-colorblind10' if 'tableau-colorblind10' in plt.style.available else 'default')
plt.rcParams['font.sans-serif'] = 'Arial'
plt.rcParams['axes.edgecolor'] = '#333333'
plt.rcParams['axes.linewidth'] = 0.8

def compute_logistic_odds_ratios(lr_model, feature_names, scaler=None):
    """
    Computes Odds Ratios (e^beta) for Logistic Regression.
    If features were standardized, calculates per-standard-deviation and natural unit effects.
    """
    coefs = lr_model.coef_[0]
    intercept = lr_model.intercept_[0]
    odds_ratios = np.exp(coefs)
    
    df_or = pd.DataFrame({
        "Feature": feature_names,
        "Coefficient_Beta": coefs,
        "Odds_Ratio": odds_ratios
    })
    
    if scaler is not None:
        df_or["Scale_Std"] = scaler.scale_
        df_or["Mean"] = scaler.mean_
        
    df_or = df_or.sort_values(by="Odds_Ratio", ascending=False).reset_index(drop=True)
    return df_or

def plot_evaluation_curves(model_predictions, y_test, output_dir: str):
    """
    Generates combined ROC curves, Precision-Recall curves, and Calibration curves.
    """
    os.makedirs(output_dir, exist_ok=True)
    fig, axes = plt.subplots(1, 3, figsize=(18, 5), dpi=300)
    
    # 1. ROC Curves
    ax_roc = axes[0]
    ax_roc.plot([0, 1], [0, 1], 'k--', alpha=0.5, label="Chance (AUC = 0.50)")
    for name, data in model_predictions.items():
        fpr, tpr, _ = roc_curve(y_test, data["y_prob"])
        auc = data["metrics"]["roc_auc"]
        ax_roc.plot(fpr, tpr, label=f"{name} (AUC = {auc:.3f})", lw=2)
    ax_roc.set_title("Receiver Operating Characteristic (ROC)", fontsize=12, fontweight='bold')
    ax_roc.set_xlabel("False Positive Rate (1 - Specificity)", fontsize=11)
    ax_roc.set_ylabel("True Positive Rate (Sensitivity)", fontsize=11)
    ax_roc.legend(loc="lower right", frameon=True)
    ax_roc.grid(True, alpha=0.3)

    # 2. Precision-Recall Curves
    ax_pr = axes[1]
    prevalence = float(np.mean(y_test))
    ax_pr.plot([0, 1], [prevalence, prevalence], 'k--', alpha=0.5, label=f"Baseline Prev. ({prevalence:.1%})")
    for name, data in model_predictions.items():
        prec, rec, _ = precision_recall_curve(y_test, data["y_prob"])
        pr_auc = data["metrics"]["pr_auc"]
        ax_pr.plot(rec, prec, label=f"{name} (PR-AUC = {pr_auc:.3f})", lw=2)
    ax_pr.set_title("Precision-Recall Curve (PR-AUC)", fontsize=12, fontweight='bold')
    ax_pr.set_xlabel("Recall (Sensitivity)", fontsize=11)
    ax_pr.set_ylabel("Precision (Positive Predictive Value)", fontsize=11)
    ax_pr.legend(loc="upper right", frameon=True)
    ax_pr.grid(True, alpha=0.3)

    # 3. Calibration Curves (Reliability Diagram)
    ax_cal = axes[2]
    ax_cal.plot([0, 1], [0, 1], 'k--', alpha=0.5, label="Perfect Calibration")
    for name, data in model_predictions.items():
        prob_true, prob_pred = calibration_curve(y_test, data["y_prob"], n_bins=8, strategy='uniform')
        brier = data["metrics"]["brier_score"]
        ax_cal.plot(prob_pred, prob_true, marker='o', label=f"{name} (Brier = {brier:.3f})", lw=2)
    ax_cal.set_title("Calibration Curve (Reliability)", fontsize=12, fontweight='bold')
    ax_cal.set_xlabel("Mean Predicted Probability", fontsize=11)
    ax_cal.set_ylabel("Empirical True Fraction", fontsize=11)
    ax_cal.legend(loc="upper left", frameon=True)
    ax_cal.grid(True, alpha=0.3)

    plt.tight_layout()
    plot_path = os.path.join(output_dir, "model_performance_evaluation.png")
    fig.savefig(plot_path, bbox_inches='tight')
    plt.close(fig)
    print(f"Performance plots saved to: {plot_path}")
    return plot_path

def plot_feature_importance(df_or, rf_importances, feature_names, output_dir: str):
    """
    Plots Logistic Regression Odds Ratios and Random Forest MDI Feature Importances side by side.
    """
    os.makedirs(output_dir, exist_ok=True)
    fig, axes = plt.subplots(1, 2, figsize=(14, 5), dpi=300)
    
    # Odds Ratios
    ax_or = axes[0]
    sorted_or = df_or.sort_values(by="Odds_Ratio", ascending=True)
    y_pos = np.arange(len(sorted_or))
    bars = ax_or.barh(y_pos, sorted_or["Odds_Ratio"], color="#1f77b4", edgecolor="#0a3c63", height=0.6)
    ax_or.axvline(1.0, color='red', linestyle='--', alpha=0.7, label="Neutral Odds (OR = 1.0)")
    ax_or.set_yticks(y_pos)
    ax_or.set_yticklabels(sorted_or["Feature"], fontsize=11)
    ax_or.set_xlabel("Odds Ratio (per 1 SD change / binary presence)", fontsize=11)
    ax_or.set_title("Logistic Regression Odds Ratios", fontsize=12, fontweight='bold')
    ax_or.grid(True, alpha=0.3, axis='x')
    
    for bar in bars:
        width = bar.get_width()
        ax_or.text(width + 0.03, bar.get_y() + bar.get_height()/2, f"{width:.2f}",
                   va='center', ha='left', fontsize=10, fontweight='bold')
    ax_or.legend(loc="lower right")

    # Random Forest Importance
    ax_rf = axes[1]
    rf_df = pd.DataFrame({"Feature": feature_names, "Importance": rf_importances})
    rf_df = rf_df.sort_values(by="Importance", ascending=True)
    y_pos_rf = np.arange(len(rf_df))
    bars_rf = ax_rf.barh(y_pos_rf, rf_df["Importance"], color="#2ca02c", edgecolor="#145214", height=0.6)
    ax_rf.set_yticks(y_pos_rf)
    ax_rf.set_yticklabels(rf_df["Feature"], fontsize=11)
    ax_rf.set_xlabel("Gini Feature Importance", fontsize=11)
    ax_rf.set_title("Random Forest Non-Linear Feature Importance", fontsize=12, fontweight='bold')
    ax_rf.grid(True, alpha=0.3, axis='x')
    
    for bar in bars_rf:
        width = bar.get_width()
        ax_rf.text(width + 0.005, bar.get_y() + bar.get_height()/2, f"{width:.3f}",
                   va='center', ha='left', fontsize=10, fontweight='bold')

    plt.tight_layout()
    plot_path = os.path.join(output_dir, "feature_importance_analysis.png")
    fig.savefig(plot_path, bbox_inches='tight')
    plt.close(fig)
    print(f"Feature importance plots saved to: {plot_path}")
    return plot_path
