# OvaSense Multimodal Fusion Evaluation Report

## 1. Overview & Research Question
- **Research Question**: Does incorporating B-mode ultrasound image predictions provide meaningful incremental predictive benefit beyond the cumulative 32-feature Tier 1 + Tier 2 clinical and endocrine model for predicting the dataset's clinical PCOS reference outcome?
- **Dataset Partition**:
  - Total Cohort: 541 patients
  - Development Cohort: N = 432 (PCOS positive: 141, 32.6%)
  - Frozen Holdout Cohort: N = 109 (PCOS positive: 36, 33.0%)
  - Validation Integrity: Zero duplicate leakage; frozen holdout was completely untouched during model training, hyperparameter tuning, and weight selection.

---

## 2. Model Selection (Development 5-Fold OOF Only)
- **Predefined Selection Rule**: Evaluate fusion models strictly on Development 5-Fold Out-Of-Fold (OOF) PR-AUC and ROC-AUC.
- **Development OOF Baselines**:
  - Tier 2 Clinical Baseline (32 Cumulative Features): ROC-AUC = 0.8810, PR-AUC = 0.8127, Brier = 0.1217, F1 = 0.7407
  - Tier 3 Ultrasound Model Alone (EfficientNet-B0):   ROC-AUC = 0.5513, PR-AUC = 0.3553, Brier = 0.2184, F1 = 0.0000
- **Selected Fusion Model**:
  - Fusion Method: Weighted Probability Fusion
  - Selected Weights: $w_{\text{clinical}} = 0.95$, $w_{\text{image}} = 0.05$
  - Selected Dev OOF Metrics: ROC-AUC = 0.8813 (+0.0003), PR-AUC = 0.8132 (+0.0004), Brier = 0.1225 (+0.0008), F1 = 0.7435 (+0.0028)
- **Scientific Caveat on Selected Weight**:
  The weight $0.95$ clinical / $0.05$ ultrasound was selected **strictly** because it was the numerical optimum under the predefined Development OOF PR-AUC criterion. This small weight reflects that ultrasound provides near-zero independent predictive signal for systemic PCOS diagnosis, rather than proving a clinically meaningful image contribution.

---

## 3. Frozen Holdout Evaluation (N = 109)

| Model Configuration | Modality / Input | ROC-AUC | PR-AUC | Brier Score | Sensitivity | Specificity | F1 Score |
|:---|:---|:---:|:---:|:---:|:---:|:---:|:---:|
| **Tier 1 Baseline** | 16 Self-Reported / Anthropometric | 0.8980 | 0.8324 | 0.1121 | 0.6944 | 0.9452 | 0.7692 |
| **Tier 1 + 2 Baseline (Clinical-Only)** | 32 Cumulative Clinical / Endocrine | 0.8919 | 0.8243 | 0.1138 | 0.6944 | 0.9315 | 0.7576 |
| **Tier 3 (Ultrasound Image Model Alone)** | B-Mode Ultrasound (EfficientNet-B0) | 0.5042 | 0.3414 | 0.2205 | 0.0000 | 1.0000 | 0.0000 |
| **Final Multimodal Fusion Model** | Tier 2 (0.95) + Tier 3 (0.05) | **0.8927** | **0.8260** | **0.1151** | **0.6944** | **0.9315** | **0.7576** |
| *Stacking Meta-Classifier (Reference)* | Logistic Regression Meta-Learner | 0.8919 | 0.8243 | 0.1146 | 0.6944 | 0.9315 | 0.7576 |

### Incremental Value Delta (Multimodal vs Clinical Baseline):
- $\Delta\text{ROC-AUC} = +0.0008$
- $\Delta\text{PR-AUC}  = +0.0017$
- $\Delta\text{Brier}   = +0.0012$ (slight calibration penalty)
- $\Delta\text{Sensitivity} = +0.0000$ (0.0% change)
- $\Delta\text{Specificity} = +0.0000$ (0.0% change)
- $\Delta\text{F1 Score}    = +0.0000$ (0.0% change)

---

## 4. Scientific Conclusion
1. **Negligible Incremental Benefit**: The empirical improvement demonstrated by adding ultrasound is negligible ($\Delta\text{ROC-AUC} \approx +0.0008$, $\Delta\text{PR-AUC} \approx +0.0017$, with Brier worsening by $\approx +0.0012$).
2. **Clinical Interpretation**:
   - Tier 1 + Tier 2 provides strong, well-calibrated systemic clinical and endocrine information (Holdout ROC-AUC = 0.8919, PR-AUC = 0.8243).
   - Tier 3 ultrasound performs accurately for morphological assessment (PCOM vs normal ovary), but is approximately chance-level for predicting the dataset-provided systemic clinical PCOS reference outcome on held-out patients (Holdout ROC-AUC = 0.5042).
   - Ultrasound images do not prove, diagnose, or explain systemic PCOS in this dataset.
3. **Artifact Location**:
   `models/tier3/tier3_multimodal_final_model.joblib`
