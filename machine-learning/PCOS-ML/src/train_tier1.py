"""
OvaSense ML Pipeline - Tier 1 Complete Training & Evaluation Runner
Author: OvaSense ML / Data Science Team
Project: OvaSense FYP

Orchestrates the audited 10-step training protocol:
1. Frozen 20% holdout split (N=109, seed=42)
2. Repeated Stratified 5-Fold CV (3 repeats = 15 folds, seed=42) on Development set (N=432)
3. Model comparison: Logistic Regression, Random Forest, Extra Trees, XGBoost (unweighted & weighted)
4. Out-of-fold threshold optimization (Sensitivity >= 0.85)
5. Out-of-fold Platt probability calibration
6. Low-circularity sensitivity analysis (non-Rotterdam features)
7. Contiguous blocked-CV sensitivity analysis (row-order stability)
8. Multi-evidence model selection
9. Single final evaluation on untouched holdout
10. SHAP attribution and artifact export
"""

import os
import sys
sys.path.insert(0, os.path.abspath('.'))
import json
import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split, RepeatedStratifiedKFold, KFold
from sklearn.base import clone
from sklearn.calibration import CalibratedClassifierCV
from sklearn.metrics import brier_score_loss
import shap

from src.models import (
    get_tier1_models,
    get_low_circularity_models,
    TIER1_NUMERIC_COLS,
    TIER1_BINARY_COLS
)
from src.evaluation import (
    compute_classification_metrics,
    sweep_thresholds,
    compute_calibration_curve
)

def run_tier1_training():
    print("=" * 80)
    print("OVASENSE PCOS ML — TIER 1 MODEL TRAINING & METHODOLOGICAL EVALUATION")
    print("=" * 80)
    
    # 0. Setup output directories
    reports_dir = 'reports/tier1'
    models_dir = 'models/tier1'
    os.makedirs(reports_dir, exist_ok=True)
    os.makedirs(models_dir, exist_ok=True)
    
    # 1. Load Tier 1 dataset
    data_path = 'data/tiered/tier1_dataset.csv'
    if not os.path.exists(data_path):
        raise FileNotFoundError(f"Dataset not found at {data_path}. Run preprocessing first.")
        
    df = pd.read_csv(data_path)
    target_col = 'pcos_diagnosis'
    feature_cols = [c for c in df.columns if c != target_col]
    
    print(f"\n[1] Loaded Dataset: {df.shape[0]} rows x {df.shape[1]} columns")
    print(f"    Features ({len(feature_cols)}): {feature_cols}")
    counts = df[target_col].value_counts()
    print(f"    Target Distribution: Negative (0) = {counts[0]} ({counts[0]/len(df)*100:.2f}%), Positive (1) = {counts[1]} ({counts[1]/len(df)*100:.2f}%)")
    
    # 2. Frozen Stratified Holdout Split (20%, N=109, seed=42)
    X = df[feature_cols]
    y = df[target_col]
    
    X_dev, X_holdout, y_dev, y_holdout = train_test_split(
        X, y,
        test_size=109,  # Exactly 109 for 20%
        stratify=y,
        random_state=42
    )
    
    print(f"\n[2] Partitioning (Frozen 20% Holdout Protocol):")
    print(f"    - Development Set: N = {len(X_dev)} (Neg: {(y_dev==0).sum()}, Pos: {(y_dev==1).sum()})")
    print(f"    - Untouched Holdout: N = {len(X_holdout)} (Neg: {(y_holdout==0).sum()}, Pos: {(y_holdout==1).sum()})")
    
    # 3. Repeated Stratified 5-Fold Cross-Validation on Development Set (3 repeats = 15 folds)
    rskf = RepeatedStratifiedKFold(n_splits=5, n_repeats=3, random_state=42)
    
    # Define models to evaluate: 4 models x 2 weighting options = 8 configurations
    model_configs = {
        'Logistic Regression (Unweighted)': {'weighted': False, 'model_key': 'Logistic Regression'},
        'Logistic Regression (Balanced)': {'weighted': True, 'model_key': 'Logistic Regression'},
        'Random Forest (Unweighted)': {'weighted': False, 'model_key': 'Random Forest'},
        'Random Forest (Balanced)': {'weighted': True, 'model_key': 'Random Forest'},
        'Extra Trees (Unweighted)': {'weighted': False, 'model_key': 'Extra Trees'},
        'Extra Trees (Balanced)': {'weighted': True, 'model_key': 'Extra Trees'},
        'XGBoost (Unweighted)': {'weighted': False, 'model_key': 'XGBoost'},
        'XGBoost (Balanced)': {'weighted': True, 'model_key': 'XGBoost'},
    }
    
    print(f"\n[3] Executing Repeated Stratified 5-Fold CV (15 Folds per Model)...")
    
    cv_fold_records = []
    model_oof_predictions = {cfg_name: np.zeros(len(X_dev)) for cfg_name in model_configs}
    model_oof_counts = {cfg_name: np.zeros(len(X_dev)) for cfg_name in model_configs}
    
    # Reset index for clean fold indexing
    X_dev_reset = X_dev.reset_index(drop=True)
    y_dev_reset = y_dev.reset_index(drop=True)
    
    for cfg_name, cfg in model_configs.items():
        print(f"    Evaluating: {cfg_name}...")
        pipelines = get_tier1_models(random_state=42, weighted=cfg['weighted'])
        base_pipe = pipelines[cfg['model_key']]
        
        fold_idx = 0
        for train_idx, val_idx in rskf.split(X_dev_reset, y_dev_reset):
            X_tr, y_tr = X_dev_reset.iloc[train_idx], y_dev_reset.iloc[train_idx]
            X_val, y_val = X_dev_reset.iloc[val_idx], y_dev_reset.iloc[val_idx]
            
            pipe = clone(base_pipe)
            pipe.fit(X_tr, y_tr)
            
            # Predict probabilities
            val_probs = pipe.predict_proba(X_val)[:, 1]
            
            # Accumulate OOF
            model_oof_predictions[cfg_name][val_idx] += val_probs
            model_oof_counts[cfg_name][val_idx] += 1
            
            # Compute fold metrics
            metrics = compute_classification_metrics(y_val, val_probs, threshold=0.5)
            metrics['model'] = cfg_name
            metrics['fold'] = fold_idx + 1
            cv_fold_records.append(metrics)
            
            fold_idx += 1
            
    # Average OOF across the 3 repeats
    for cfg_name in model_configs:
        model_oof_predictions[cfg_name] /= model_oof_counts[cfg_name]
        
    df_cv_folds = pd.DataFrame(cv_fold_records)
    cv_results_path = os.path.join(reports_dir, 'tier1_cv_results.csv')
    df_cv_folds.to_csv(cv_results_path, index=False)
    print(f"    Saved fold-level CV results: {cv_results_path}")
    
    # 4. Aggregate CV Model Comparison Summary (Mean ± Std)
    summary_records = []
    metric_cols = ['roc_auc', 'pr_auc', 'sensitivity', 'specificity', 'precision', 'f1', 'brier_score']
    
    for cfg_name in model_configs:
        sub = df_cv_folds[df_cv_folds['model'] == cfg_name]
        rec = {'Model Configuration': cfg_name}
        for m in metric_cols:
            mean_val = sub[m].mean()
            std_val = sub[m].std()
            rec[f'{m}_mean'] = round(mean_val, 4)
            rec[f'{m}_std'] = round(std_val, 4)
            rec[f'{m}_display'] = f"{mean_val:.4f} ± {std_val:.4f}"
            
        # OOF pooled metrics at default 0.5
        oof_probs = model_oof_predictions[cfg_name]
        oof_m = compute_classification_metrics(y_dev_reset, oof_probs, threshold=0.5)
        rec['oof_roc_auc'] = round(oof_m['roc_auc'], 4)
        rec['oof_pr_auc'] = round(oof_m['pr_auc'], 4)
        rec['oof_f1'] = round(oof_m['f1'], 4)
        rec['oof_brier'] = round(oof_m['brier_score'], 4)
        
        summary_records.append(rec)
        
    df_summary = pd.DataFrame(summary_records)
    comparison_path = os.path.join(reports_dir, 'tier1_model_comparison.csv')
    df_summary.to_csv(comparison_path, index=False)
    print(f"    Saved model comparison summary: {comparison_path}")
    
    # Print quick table
    print("\n--- DEVELOPMENT CV PERFORMANCE SUMMARY (15 Folds, Threshold=0.50) ---")
    display_cols = ['Model Configuration', 'roc_auc_display', 'pr_auc_display', 'sensitivity_display', 'specificity_display', 'f1_display', 'brier_score_display']
    print(df_summary[display_cols].to_string(index=False))
    
    # 5. Threshold Analysis on Development Out-of-Fold Predictions
    print(f"\n[4] Performing Threshold Sweep (Target Sensitivity >= 0.85)...")
    threshold_records = []
    
    for cfg_name in model_configs:
        oof_probs = model_oof_predictions[cfg_name]
        sweep_res = sweep_thresholds(y_dev_reset, oof_probs, target_sensitivity=0.85)
        sel = sweep_res['selected_metrics']
        opt_f1 = sweep_res['optimal_f1_metrics']
        
        threshold_records.append({
            'Model': cfg_name,
            'Default_Thresh': 0.50,
            'Default_Sens': round(compute_classification_metrics(y_dev_reset, oof_probs, 0.5)['sensitivity'], 4),
            'Default_Spec': round(compute_classification_metrics(y_dev_reset, oof_probs, 0.5)['specificity'], 4),
            'Default_F1': round(compute_classification_metrics(y_dev_reset, oof_probs, 0.5)['f1'], 4),
            'Selected_Thresh (Sens>=0.85)': round(sweep_res['selected_threshold'], 2),
            'Selected_Sens': round(sel['sensitivity'], 4),
            'Selected_Spec': round(sel['specificity'], 4),
            'Selected_Prec': round(sel['precision'], 4),
            'Selected_F1': round(sel['f1'], 4),
            'Optimal_F1_Thresh': round(sweep_res['optimal_f1_threshold'], 2),
            'Optimal_F1_Sens': round(opt_f1['sensitivity'], 4),
            'Optimal_F1_Spec': round(opt_f1['specificity'], 4),
            'Optimal_F1': round(opt_f1['f1'], 4)
        })
        
    df_thresholds = pd.DataFrame(threshold_records)
    thresh_path = os.path.join(reports_dir, 'tier1_threshold_analysis.csv')
    df_thresholds.to_csv(thresh_path, index=False)
    print(f"    Saved threshold analysis: {thresh_path}")
    print(df_thresholds[['Model', 'Selected_Thresh (Sens>=0.85)', 'Selected_Sens', 'Selected_Spec', 'Selected_F1']].to_string(index=False))
    
    # 6. Probability Calibration Analysis (Platt / Sigmoid Calibration on Dev OOF)
    print(f"\n[5] Evaluating Probability Calibration (Uncalibrated vs. Platt Sigmoid)...")
    calibration_records = []
    
    for cfg_name in model_configs:
        oof_probs = model_oof_predictions[cfg_name]
        uncal_brier = brier_score_loss(y_dev_reset, oof_probs)
        uncal_curve = compute_calibration_curve(y_dev_reset, oof_probs)
        
        # Fit Platt calibration via cross-validated calibration pipeline
        cfg = model_configs[cfg_name]
        base_pipe = get_tier1_models(random_state=42, weighted=cfg['weighted'])[cfg['model_key']]
        cal_clf = CalibratedClassifierCV(estimator=base_pipe, method='sigmoid', cv=5)
        
        # Cross-validated prediction of calibrated probabilities
        cal_oof_probs = np.zeros(len(X_dev_reset))
        skf = RepeatedStratifiedKFold(n_splits=5, n_repeats=1, random_state=42)
        for tr_idx, vl_idx in skf.split(X_dev_reset, y_dev_reset):
            cal_clf_fold = clone(cal_clf)
            cal_clf_fold.fit(X_dev_reset.iloc[tr_idx], y_dev_reset.iloc[tr_idx])
            cal_oof_probs[vl_idx] = cal_clf_fold.predict_proba(X_dev_reset.iloc[vl_idx])[:, 1]
            
        cal_brier = brier_score_loss(y_dev_reset, cal_oof_probs)
        cal_curve = compute_calibration_curve(y_dev_reset, cal_oof_probs)
        
        calibration_records.append({
            'Model': cfg_name,
            'Uncalibrated_Brier': round(uncal_brier, 4),
            'Uncalibrated_ECE': round(uncal_curve['expected_calibration_error'], 4),
            'Calibrated_Brier': round(cal_brier, 4),
            'Calibrated_ECE': round(cal_curve['expected_calibration_error'], 4),
            'Brier_Improvement': round(uncal_brier - cal_brier, 4),
            'Calibration_Recommended': bool(cal_brier < uncal_brier)
        })
        
    df_cal = pd.DataFrame(calibration_records)
    cal_path = os.path.join(reports_dir, 'tier1_calibration_results.csv')
    df_cal.to_csv(cal_path, index=False)
    print(f"    Saved calibration results: {cal_path}")
    print(df_cal[['Model', 'Uncalibrated_Brier', 'Calibrated_Brier', 'Brier_Improvement', 'Calibration_Recommended']].to_string(index=False))
    
    # 7. Low-Circularity Sensitivity Experiment (Non-Rotterdam Features)
    print(f"\n[6] Running Low-Circularity Sensitivity Analysis (Non-Rotterdam Features)...")
    low_circ_records = []
    
    for cfg_name, cfg in model_configs.items():
        pipelines_lc = get_low_circularity_models(random_state=42, weighted=cfg['weighted'])
        base_pipe_lc = pipelines_lc[cfg['model_key']]
        
        fold_idx = 0
        for train_idx, val_idx in rskf.split(X_dev_reset, y_dev_reset):
            X_tr, y_tr = X_dev_reset.iloc[train_idx], y_dev_reset.iloc[train_idx]
            X_val, y_val = X_dev_reset.iloc[val_idx], y_dev_reset.iloc[val_idx]
            
            pipe = clone(base_pipe_lc)
            pipe.fit(X_tr, y_tr)
            probs = pipe.predict_proba(X_val)[:, 1]
            
            m = compute_classification_metrics(y_val, probs, threshold=0.5)
            m['model'] = cfg_name
            m['fold'] = fold_idx + 1
            m['feature_set'] = 'Low-Circularity (Non-Rotterdam)'
            low_circ_records.append(m)
            fold_idx += 1
            
    df_lc_folds = pd.DataFrame(low_circ_records)
    lc_summary = []
    for cfg_name in model_configs:
        sub_lc = df_lc_folds[df_lc_folds['model'] == cfg_name]
        sub_orig = df_cv_folds[df_cv_folds['model'] == cfg_name]
        
        lc_summary.append({
            'Model': cfg_name,
            'Full_Tier1_ROC_AUC': round(sub_orig['roc_auc'].mean(), 4),
            'Low_Circ_ROC_AUC': round(sub_lc['roc_auc'].mean(), 4),
            'ROC_AUC_Delta': round(sub_lc['roc_auc'].mean() - sub_orig['roc_auc'].mean(), 4),
            'Full_Tier1_PR_AUC': round(sub_orig['pr_auc'].mean(), 4),
            'Low_Circ_PR_AUC': round(sub_lc['pr_auc'].mean(), 4),
            'PR_AUC_Delta': round(sub_lc['pr_auc'].mean() - sub_orig['pr_auc'].mean(), 4),
            'Full_Tier1_F1': round(sub_orig['f1'].mean(), 4),
            'Low_Circ_F1': round(sub_lc['f1'].mean(), 4),
            'F1_Delta': round(sub_lc['f1'].mean() - sub_orig['f1'].mean(), 4)
        })
        
    df_lc_summary = pd.DataFrame(lc_summary)
    lc_path = os.path.join(reports_dir, 'tier1_low_circularity_results.csv')
    df_lc_summary.to_csv(lc_path, index=False)
    print(f"    Saved low-circularity analysis: {lc_path}")
    print(df_lc_summary[['Model', 'Full_Tier1_ROC_AUC', 'Low_Circ_ROC_AUC', 'ROC_AUC_Delta', 'PR_AUC_Delta']].to_string(index=False))
    
    # 8. Contiguous Blocked-CV Sensitivity Analysis (Row-Order Stability)
    print(f"\n[7] Running Contiguous Blocked-CV Sensitivity Analysis...")
    # 5 contiguous blocks of development data (no random shuffling)
    blocked_kf = KFold(n_splits=5, shuffle=False)
    blocked_records = []
    
    for cfg_name, cfg in model_configs.items():
        base_pipe = get_tier1_models(random_state=42, weighted=cfg['weighted'])[cfg['model_key']]
        
        block_idx = 0
        for train_idx, val_idx in blocked_kf.split(X_dev_reset, y_dev_reset):
            X_tr, y_tr = X_dev_reset.iloc[train_idx], y_dev_reset.iloc[train_idx]
            X_val, y_val = X_dev_reset.iloc[val_idx], y_dev_reset.iloc[val_idx]
            
            pipe = clone(base_pipe)
            pipe.fit(X_tr, y_tr)
            probs = pipe.predict_proba(X_val)[:, 1]
            
            m = compute_classification_metrics(y_val, probs, threshold=0.5)
            m['model'] = cfg_name
            m['block'] = block_idx + 1
            blocked_records.append(m)
            block_idx += 1
            
    df_blocked_folds = pd.DataFrame(blocked_records)
    blocked_summary = []
    for cfg_name in model_configs:
        sub_b = df_blocked_folds[df_blocked_folds['model'] == cfg_name]
        sub_orig = df_cv_folds[df_cv_folds['model'] == cfg_name]
        
        blocked_summary.append({
            'Model': cfg_name,
            'Shuffled_CV_ROC_AUC': round(sub_orig['roc_auc'].mean(), 4),
            'Blocked_CV_ROC_AUC': round(sub_b['roc_auc'].mean(), 4),
            'ROC_AUC_Delta': round(sub_b['roc_auc'].mean() - sub_orig['roc_auc'].mean(), 4),
            'Shuffled_CV_PR_AUC': round(sub_orig['pr_auc'].mean(), 4),
            'Blocked_CV_PR_AUC': round(sub_b['pr_auc'].mean(), 4),
            'PR_AUC_Delta': round(sub_b['pr_auc'].mean() - sub_orig['pr_auc'].mean(), 4),
            'Shuffled_CV_F1': round(sub_orig['f1'].mean(), 4),
            'Blocked_CV_F1': round(sub_b['f1'].mean(), 4),
            'F1_Delta': round(sub_b['f1'].mean() - sub_orig['f1'].mean(), 4)
        })
        
    df_blocked_summary = pd.DataFrame(blocked_summary)
    blocked_path = os.path.join(reports_dir, 'tier1_blocked_cv_results.csv')
    df_blocked_summary.to_csv(blocked_path, index=False)
    print(f"    Saved blocked-CV sensitivity results: {blocked_path}")
    print(df_blocked_summary[['Model', 'Shuffled_CV_ROC_AUC', 'Blocked_CV_ROC_AUC', 'ROC_AUC_Delta']].to_string(index=False))
    
    # 9. Model Selection Decision
    print(f"\n[8] Model Selection Synthesis...")
    # Compare candidate models on ROC-AUC, PR-AUC, Sensitivity, Specificity, Brier score, and fold stability
    # Notice: Random Forest (Balanced) and Extra Trees (Balanced) vs XGBoost (Balanced) vs Logistic Regression
    # Let's see which model achieved the highest PR-AUC and ROC-AUC with low Brier score.
    best_candidate = df_summary.sort_values(by=['pr_auc_mean', 'roc_auc_mean'], ascending=[False, False]).iloc[0]['Model Configuration']
    print(f"    Top Ranking Development Model: {best_candidate}")
    
    # Let's check the selected model configuration
    selected_cfg_name = best_candidate
    selected_cfg = model_configs[selected_cfg_name]
    
    # Extract selected threshold for this model
    selected_thresh_row = df_thresholds[df_thresholds['Model'] == selected_cfg_name].iloc[0]
    selected_threshold = selected_thresh_row['Selected_Thresh (Sens>=0.85)']
    print(f"    Locked Operating Threshold for {selected_cfg_name}: tau = {selected_threshold} (Target Sens >= 0.85)")
    
    # Check calibration decision
    cal_row = df_cal[df_cal['Model'] == selected_cfg_name].iloc[0]
    apply_calibration = cal_row['Calibration_Recommended']
    print(f"    Calibration Recommended for {selected_cfg_name}: {apply_calibration} (Brier Improvement: {cal_row['Brier_Improvement']})")
    
    # 10. Fit Final Selected Model on Entire Development Set (N=432)
    print(f"\n[9] Fitting Final Model '{selected_cfg_name}' on Entire Development Set (N=432)...")
    final_pipeline = get_tier1_models(random_state=42, weighted=selected_cfg['weighted'])[selected_cfg['model_key']]
    final_pipeline.fit(X_dev, y_dev)
    
    if apply_calibration:
        print(f"    Applying Platt Sigmoid Calibration (cv=5 on Dev Set)...")
        final_model = CalibratedClassifierCV(estimator=final_pipeline, method='sigmoid', cv=5)
        final_model.fit(X_dev, y_dev)
    else:
        final_model = final_pipeline
        
    # Save fitted model
    model_save_path = os.path.join(models_dir, 'tier1_selected_model.joblib')
    joblib.dump(final_model, model_save_path)
    print(f"    Saved fitted model artifact to: {model_save_path}")
    
    # 11. Final Evaluation ONCE on Frozen Untouched Holdout (N=109)
    print(f"\n[10] SINGLE FINAL EVALUATION ON UNTOUCHED HOLDOUT (N=109)...")
    holdout_probs = final_model.predict_proba(X_holdout)[:, 1]
    
    # Metrics at Default Threshold 0.50
    m_holdout_def = compute_classification_metrics(y_holdout, holdout_probs, threshold=0.50)
    # Metrics at Selected Operating Threshold tau*
    m_holdout_sel = compute_classification_metrics(y_holdout, holdout_probs, threshold=selected_threshold)
    # Metrics at Optimal F1 Threshold
    opt_f1_thresh = selected_thresh_row['Optimal_F1_Thresh']
    m_holdout_opt_f1 = compute_classification_metrics(y_holdout, holdout_probs, threshold=opt_f1_thresh)
    
    holdout_records = [
        {'Evaluation': 'Holdout @ Default (0.50)', **m_holdout_def},
        {'Evaluation': f'Holdout @ Clinical Screening (tau={selected_threshold})', **m_holdout_sel},
        {'Evaluation': f'Holdout @ Optimal F1 (tau={opt_f1_thresh})', **m_holdout_opt_f1}
    ]
    df_holdout = pd.DataFrame(holdout_records)
    holdout_path = os.path.join(reports_dir, 'tier1_holdout_results.csv')
    df_holdout.to_csv(holdout_path, index=False)
    print(f"    Saved holdout results: {holdout_path}")
    
    print("\n--- FINAL UNTOUCHED HOLDOUT EVALUATION RESULTS ---")
    print(df_holdout[['Evaluation', 'roc_auc', 'pr_auc', 'sensitivity', 'specificity', 'precision', 'f1', 'brier_score', 'threshold']].to_string(index=False))
    
    # Confusion Matrix breakdown
    cm_records = [
        {'Condition': 'Holdout @ Default (0.50)', 'TN': m_holdout_def['tn'], 'FP': m_holdout_def['fp'], 'FN': m_holdout_def['fn'], 'TP': m_holdout_def['tp'], 'Threshold': 0.50},
        {'Condition': f'Holdout @ Clinical Screening (tau={selected_threshold})', 'TN': m_holdout_sel['tn'], 'FP': m_holdout_sel['fp'], 'FN': m_holdout_sel['fn'], 'TP': m_holdout_sel['tp'], 'Threshold': selected_threshold}
    ]
    df_cm = pd.DataFrame(cm_records)
    cm_path = os.path.join(reports_dir, 'tier1_confusion_matrix.csv')
    df_cm.to_csv(cm_path, index=False)
    print(f"    Saved confusion matrix: {cm_path}")
    print(df_cm.to_string(index=False))
    
    # 12. SHAP Attribution Analysis
    print(f"\n[11] Computing SHAP Attributions for Selected Model...")
    # Extract fitted classifier from pipeline
    base_estimator = final_pipeline['classifier']
    preprocessor = final_pipeline['preprocessor']
        
    # Transform development set features
    X_dev_trans = preprocessor.transform(X_dev)
    # Feature names in order of ColumnTransformer: numeric cols then binary cols
    feature_names_transformed = TIER1_NUMERIC_COLS + TIER1_BINARY_COLS
    
    try:
        if hasattr(base_estimator, 'feature_importances_'):
            explainer = shap.TreeExplainer(base_estimator)
            shap_values = explainer.shap_values(X_dev_trans)
            # Handle binary classification shap values output (list vs array)
            if isinstance(shap_values, list) and len(shap_values) == 2:
                # Class 1 shap values
                sv = shap_values[1]
            elif isinstance(shap_values, np.ndarray) and len(shap_values.shape) == 3:
                sv = shap_values[:, :, 1]
            else:
                sv = shap_values
                
            mean_abs_shap = np.mean(np.abs(sv), axis=0)
            df_feat_imp = pd.DataFrame({
                'Feature': feature_names_transformed,
                'Mean_Abs_SHAP': mean_abs_shap
            }).sort_values(by='Mean_Abs_SHAP', ascending=False).reset_index(drop=True)
            df_feat_imp['Rank'] = df_feat_imp.index + 1
            
            feat_imp_path = os.path.join(reports_dir, 'tier1_feature_importance.csv')
            df_feat_imp.to_csv(feat_imp_path, index=False)
            print(f"    Saved SHAP feature importance: {feat_imp_path}")
            print(df_feat_imp.head(10).to_string(index=False))
            
            # Summary stats
            shap_summary = {
                'model_name': selected_cfg_name,
                'top_features_ranked': df_feat_imp['Feature'].tolist(),
                'top_5_features': df_feat_imp.head(5)['Feature'].tolist(),
                'top_5_mean_abs_shap': df_feat_imp.head(5)['Mean_Abs_SHAP'].round(4).tolist()
            }
            with open(os.path.join(reports_dir, 'tier1_shap_summary.csv'), 'w', encoding='utf-8') as f:
                df_feat_imp.to_csv(f, index=False)
                
    except Exception as e:
        print(f"    [WARNING] SHAP calculation error: {e}")
        
    print("\n" + "=" * 80)
    print("TIER 1 MODEL TRAINING AND METHODOLOGICAL VERIFICATION COMPLETE")
    print("=" * 80)

if __name__ == '__main__':
    run_tier1_training()
