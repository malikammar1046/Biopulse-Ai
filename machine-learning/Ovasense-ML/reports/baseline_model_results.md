# OvaSense-ML — Baseline Model Evaluation & Benchmark Results

**Project**: OvaSense Standalone PCOS Risk-Screening Machine Learning  
**Phase**: Phase 2 — Preprocessing, Train/Test Split & Baseline ML  
**Evaluation Date**: August 31, 2026  
**Pipeline Code**: [`src/preprocessing.py`](file:///c:/Users/hp/Desktop/Ovasense-ML/src/preprocessing.py)  
**Notebook**: [`notebooks/02_preprocessing_and_baseline.ipynb`](file:///c:/Users/hp/Desktop/Ovasense-ML/notebooks/02_preprocessing_and_baseline.ipynb)  

---

## 1. Executive Summary

In Phase 2, a leak-free preprocessing pipeline was implemented, a stratified 80/20 train/test split was locked, and 8 baseline machine learning pipelines across 4 core model families were trained and evaluated using 5-fold Stratified Cross-Validation on the **16-feature OvaSense CORE non-invasive feature set**.

```
Total Patients: 541 (364 Non-PCOS [67.28%], 177 PCOS [32.72%])
Training Split (80%): 432 patients (291 Non-PCOS, 141 PCOS)
Locked Test Split (20%): 109 patients (73 Non-PCOS, 36 PCOS)
Feature Count: 16 patient-reportable non-invasive features
Invasive Tests Included: ZERO (No blood assays, no ultrasound)

Top CV Model by PR-AUC: Random Forest (Balanced) [CV PR-AUC: 0.812, CV ROC-AUC: 0.878]
Top CV Model by Sensitivity: Logistic Regression (Balanced) [CV Recall: 78.79%, CV ROC-AUC: 0.872]
Holdout Test Performance (Top CV Model): ROC-AUC 0.886 | PR-AUC 0.810 | Sensitivity 63.89% | Specificity 90.41%
Holdout Test Performance (LR Balanced): ROC-AUC 0.889 | PR-AUC 0.819 | Sensitivity 80.56% | Specificity 89.04%
```

**Key Clinical Finding**: The 16 non-invasive features carry **substantial predictive signal** ($>0.88$ ROC-AUC, $>0.81$ PR-AUC), demonstrating that symptom, menstrual, anthropometric, and lifestyle questionnaires can provide a highly viable first-line PCOS risk screening tool without requiring pelvic ultrasound or hormonal blood tests.

---

## 2. Experimental Setup & Methodology

### A. Dataset & Stratified Train/Test Split
* **Master Source**: `data/raw/PCOS_data_without_infertility.xlsx` (Sheet: `Full_new`).
* **Target Variable**: `PCOS (Y/N)` (Binary: 0 = Negative, 1 = Positive).
* **Train/Test Split**: 80% Train ($N=432$), 20% Locked Test ($N=109$).
* **Random Seed**: `random_state = 42`, `stratify = y`.
* **Reproducibility Storage**: Raw splits (including `Sl. No` and `Patient File No.` for auditing, but excluded from features) are saved in:
  * [`data/processed/train.csv`](file:///c:/Users/hp/Desktop/Ovasense-ML/data/processed/train.csv)
  * [`data/processed/test.csv`](file:///c:/Users/hp/Desktop/Ovasense-ML/data/processed/test.csv)

### B. Preprocessing & Leakage Controls
* **Column Exclusions**: `Sl. No`, `Patient File No.`, `Unnamed: 44`, and ultrasound follicle counts (`Follicle No. (L)`, `Follicle No. (R)`) were strictly excluded.
* **Pipeline Encapsulation**: All scaling and imputation transformations are encapsulated inside `src/preprocessing.py` and fitted strictly inside each training fold during cross-validation.
* **Continuous Features**: Median imputation + standard scaling (for linear models).
* **Binary Features**: Most-frequent imputation.
* **Cycle Regularity**: Most-frequent imputation + mapping ($2 \rightarrow 0, 4/5 \rightarrow 1$).

### C. Cross-Validation Strategy
* **Method**: 5-Fold `StratifiedKFold(n_splits=5, shuffle=True, random_state=42)`.
* **Decision Threshold**: Standard default $0.50$ (threshold optimization deferred to Phase 3 validation).
* **Evaluation Prioritization**:
  1. Sensitivity / Recall (Screening priority — minimize false negatives)
  2. PR-AUC / Average Precision (Reflects positive class ranking under ~2:1 imbalance)
  3. ROC-AUC
  4. Specificity
  5. Precision & F1-Score
  6. Accuracy

---

## 3. Cross-Validation Baseline Results (5-Fold Stratified CV on N=432 Training Set)

The 8 baseline model configurations evaluated across the 5 training folds are sorted below primarily by **CV PR-AUC** and secondarily by **CV Sensitivity**:

| Rank | Model Name | Preprocessing | CV PR-AUC (mean ± std) | CV ROC-AUC (mean ± std) | CV Sensitivity / Recall | CV Specificity | CV Precision | CV F1-Score | CV Accuracy | CV Train Time |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | **Random Forest (Balanced)** | Median + Unscaled | **0.8124 ± 0.0231** | 0.8777 ± 0.0169 | 66.72% ± 4.84% | 90.72% ± 1.74% | 77.82% | 0.7172 | 82.87% | 2.30s |
| 2 | **Extra Trees (Balanced)** | Median + Unscaled | **0.8110 ± 0.0332** | 0.8795 ± 0.0267 | 66.72% ± 5.80% | 89.01% ± 2.79% | 74.81% | 0.7043 | 81.72% | 2.24s |
| 3 | **Logistic Regression (Default)** | Median + StandardScaled | **0.8074 ± 0.0059** | 0.8736 ± 0.0106 | 70.22% ± 6.94% | 90.03% ± 1.32% | 77.33% | 0.7344 | 83.56% | 0.51s |
| 4 | **Logistic Regression (Balanced)** | Median + StandardScaled | **0.8072 ± 0.0101** | 0.8719 ± 0.0086 | **78.79% ± 5.10%** | 83.14% ± 3.40% | 69.54% | 0.7383 | 81.72% | 0.60s |
| 5 | **Random Forest (Default)** | Median + Unscaled | **0.8033 ± 0.0152** | 0.8791 ± 0.0131 | 71.67% ± 4.72% | 88.32% ± 0.67% | 74.80% | 0.7314 | 82.87% | 2.64s |
| 6 | **Extra Trees (Default)** | Median + Unscaled | **0.8004 ± 0.0367** | 0.8761 ± 0.0291 | 70.99% ± 5.71% | 87.98% ± 2.15% | 74.20% | 0.7243 | 82.42% | 2.14s |
| 7 | **HistGradientBoosting (Balanced)** | Median + Unscaled | **0.7725 ± 0.0220** | 0.8505 ± 0.0096 | 71.63% ± 3.93% | 86.60% ± 2.75% | 72.32% | 0.7187 | 81.70% | 2.31s |
| 8 | **HistGradientBoosting (Default)** | Median + Unscaled | **0.7663 ± 0.0214** | 0.8518 ± 0.0100 | 66.65% ± 3.75% | 89.35% ± 2.95% | 75.58% | 0.7065 | 81.94% | 4.36s |

---

## 4. Locked Holdout Test Set Performance (N=109 Patients)

All 8 models were fitted on the full 432-patient training set and evaluated on the locked holdout test set ($N=109$, 73 Non-PCOS / 36 PCOS).

> **CRITICAL PROTOCOL NOTE**: This locked test evaluation is for final benchmark verification. No hyperparameters or threshold decisions were tuned using these test observations.

| Model Name | Test ROC-AUC | Test PR-AUC | Test Sensitivity (Recall) | Test Specificity | Test Precision | Test F1-Score | Test Accuracy | True Pos (TP) | False Pos (FP) | True Neg (TN) | False Neg (FN) |
|---|---|---|---|---|---|---|---|---|---|---|---|
| **Logistic Regression (Default)** | 0.8916 | **0.8201** | 75.00% (27/36) | 94.52% (69/73) | 87.10% | 0.8060 | 88.07% | 27 | 4 | 69 | 9 |
| **Logistic Regression (Balanced)** | 0.8889 | **0.8188** | **80.56% (29/36)** | 89.04% (65/73) | 78.38% | 0.7945 | 86.24% | 29 | 8 | 65 | 7 |
| **Extra Trees (Balanced)** | 0.8957 | **0.8186** | 69.44% (25/36) | 90.41% (66/73) | 78.12% | 0.7353 | 83.49% | 25 | 7 | 66 | 11 |
| **Random Forest (Balanced)** | 0.8858 | **0.8104** | 63.89% (23/36) | 90.41% (66/73) | 76.67% | 0.6970 | 81.65% | 23 | 7 | 66 | 13 |
| **Extra Trees (Default)** | 0.9022 | **0.8059** | 66.67% (24/36) | 90.41% (66/73) | 77.42% | 0.7164 | 82.57% | 24 | 7 | 66 | 12 |
| **Random Forest (Default)** | 0.8765 | **0.7943** | 63.89% (23/36) | 91.78% (67/73) | 79.31% | 0.7077 | 82.57% | 23 | 6 | 67 | 13 |
| **HistGradientBoosting (Balanced)** | 0.8303 | **0.7135** | 72.22% (26/36) | 87.67% (64/73) | 74.29% | 0.7324 | 82.57% | 26 | 9 | 64 | 10 |
| **HistGradientBoosting (Default)** | 0.8204 | **0.6871** | 66.67% (24/36) | 87.67% (64/73) | 72.73% | 0.6957 | 80.73% | 24 | 9 | 64 | 12 |

### Detailed Classification Report: Top Sensitivity Model (`Logistic Regression Balanced`)
```text
              precision    recall  f1-score   support

Non-PCOS (0)       0.90      0.89      0.90        73
    PCOS (1)       0.78      0.81      0.79        36

    accuracy                           0.86       109
   macro avg       0.84      0.85      0.84       109
weighted avg       0.86      0.86      0.86       109

Confusion Matrix:
 [[65  8]
 [ 7 29]]
```

---

## 5. Visualizations & Artifacts Generated

The following figures were generated and saved in [`reports/figures/`](file:///c:/Users/hp/Desktop/Ovasense-ML/reports/figures):

1. **`01_target_distribution.png`**: Class balance in the full cohort (364 Neg / 177 Pos, 32.72% prevalence).
2. **`02_train_test_split.png`**: Stratified allocation verification across Training ($N=432$) and Locked Test ($N=109$).
3. **`03_cv_model_comparison.png`**: Bar chart comparing Cross-Validation PR-AUC and Sensitivity across all 8 pipelines.
4. **`04_cv_roc_curves.png`**: Out-of-fold ROC curves illustrating strong discriminative separation ($AUC > 0.87$).
5. **`05_cv_pr_curves.png`**: Out-of-fold Precision-Recall curves exceeding the $0.326$ baseline prevalence.
6. **`06_test_confusion_matrix.png`**: Heatmap of holdout predictions against true clinical status.

---

## 6. Saved Model Pipelines (`models/`)

All trained pipeline objects are serialized via `joblib` in [`models/`](file:///c:/Users/hp/Desktop/Ovasense-ML/models):

* [`models/logistic_regression_default_baseline.joblib`](file:///c:/Users/hp/Desktop/Ovasense-ML/models/logistic_regression_default_baseline.joblib)
* [`models/logistic_regression_balanced_baseline.joblib`](file:///c:/Users/hp/Desktop/Ovasense-ML/models/logistic_regression_balanced_baseline.joblib)
* [`models/random_forest_default_baseline.joblib`](file:///c:/Users/hp/Desktop/Ovasense-ML/models/random_forest_default_baseline.joblib)
* [`models/random_forest_balanced_baseline.joblib`](file:///c:/Users/hp/Desktop/Ovasense-ML/models/random_forest_balanced_baseline.joblib)
* [`models/extra_trees_default_baseline.joblib`](file:///c:/Users/hp/Desktop/Ovasense-ML/models/extra_trees_default_baseline.joblib)
* [`models/extra_trees_balanced_baseline.joblib`](file:///c:/Users/hp/Desktop/Ovasense-ML/models/extra_trees_balanced_baseline.joblib)
* [`models/histgradientboosting_default_baseline.joblib`](file:///c:/Users/hp/Desktop/Ovasense-ML/models/histgradientboosting_default_baseline.joblib)
* [`models/histgradientboosting_balanced_baseline.joblib`](file:///c:/Users/hp/Desktop/Ovasense-ML/models/histgradientboosting_balanced_baseline.joblib)

---

## 7. Limitations & Clinical Research Boundary

1. **Screening vs. Diagnostic Label**:
   * OvaSense models estimate **screening risk probability** ($P(\text{PCOS})$) to inform a patient whether further clinical consultation is recommended.
   * Model outputs MUST NOT be presented as a medical diagnosis.
2. **Class Imbalance & Default Threshold**:
   * Under a default $0.50$ decision threshold, standard models prioritize overall accuracy/specificity at the expense of sensitivity ($64\% - 78\%$). In Phase 3, clinical decision threshold tuning on CV folds will be used to calibrate sensitivity to $\ge 85\%$.
3. **Cohort Representation**:
   * The training cohort represents 541 patients from a clinical fertility/gynecology hospital setting in India. External generalizability to broader global or primary-care populations requires future external validation.
