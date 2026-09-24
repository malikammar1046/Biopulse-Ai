# Final Leakage Review & Cross-Validation Containment Protocol

**Project**: OvaSense FYP  
**Date**: September 2026  
**Auditor**: OvaSense ML / Data Science Team  
**Review Status**: Authoritative Pre-Training Leakage Audit Complete  

---

## 1. Scope & Adversarial Vulnerability Assessment

In machine learning for healthcare, subtle data leakage is the primary cause of models achieving near-perfect in-sample accuracy but failing completely during clinical deployment. This review audits every potential leakage channel in the OvaSense pipeline.

---

## 2. Leakage Channel Audits & Countermeasures

### 2.1 Channel 1: Ground-Truth Labeling & Supervised Target Alignment
- **Vulnerability**: If ground-truth labels were generated using features included in the model, does this constitute target leakage?
- **Audit Findings**:
  - The ground truth `PCOS (Y/N)` was assigned by gynecologists based on Rotterdam consensus criteria (incorporating transvaginal ultrasound, clinical history, and hormonal profiles).
  - In Tier 1, ultrasound follicle counts and lab hormones are **completely excluded**. The model learns to predict physician diagnosis from self-reported symptoms alone. This is legitimate pre-clinical triage.
  - In Tier 2, clinical vitals and laboratory hormones are added. While AMH and LH/FSH correlate with Rotterdam criteria, they are legitimate biochemical indicators obtained during clinical workup.
  - In Tier 3, structured TVS measurements are decoupled into a reference dataset. **No ultrasound images exist, and no Tier 3 imaging model will be trained.**

### 2.2 Channel 2: Identifier & Dataset Row-Order Leakage
- **Vulnerability**: Administrative IDs or row ordering correlating with the target.
- **Audit Findings**:
  - `Sl. No` is identical to `Patient File No.` (1 to 541).
  - **Row Batch Effect Discovered**: Our empirical batch analysis of sequential 50-patient blocks revealed that PCOS prevalence fluctuates from **17.1% to 46.0%** across row chunks. This indicates that patients were entered in institutional or temporal batches across the 10 contributing hospitals in Kerala.
- **Countermeasure**:
  - `Sl. No` and `Patient File No.` are **100% purged** from all feature sets.
  - To prevent row-order and batch-boundary overfitting, **Repeated Stratified K-Fold Cross-Validation (with multiple random shuffles)** is strictly required.

### 2.3 Channel 3: Diagnostic Criterion Circularity (Ultrasound Follicle Counts)
- **Vulnerability**: Including TVS follicle counts in pre-clinical triage.
- **Audit Findings**:
  - Transvaginal ultrasound follicle counts ($\ge 12$ follicles per ovary) serve as Rotterdam Criterion 3.
  - Naive models trained on this dataset achieve $>98\%$ accuracy purely by splitting on `Follicle No. (R) >= 10`. If deployed in a mobile app where ultrasound is absent, the model collapses.
- **Countermeasure**:
  - Follicle counts and endometrial thickness are **strictly isolated** into `tier3_structured_reference.csv`. They are forbidden from entering Tier 1 or Tier 2.

### 2.4 Channel 4: Preprocessing & Transformation Contamination
- **Vulnerability**: Computing imputations, normalizations, or oversampling on the complete dataset prior to cross-validation splitting.
- **Countermeasure**:
  - All preprocessing transformations are wrapped inside scikit-learn `Pipeline` objects.
  - Missing value medians, standard scalers, and resamplers are fitted **exclusively on the training folds**:
    $$\hat{\mu}_{\text{train}} = \frac{1}{|D_{\text{train}}|} \sum_{i \in D_{\text{train}}} x_i$$
  - Validation folds are transformed using frozen parameters from the training fold.
  - SMOTE (if evaluated) will be injected strictly inside training folds using `imblearn.pipeline.Pipeline`. Applying SMOTE prior to splitting is strictly forbidden.

---

## 3. Strict 80/20 Holdout & Cross-Validation Protocol

To guarantee that final performance estimates are completely unbiased and defensible in an FYP viva, the following 6-step protocol is established:

```
[Entire Dataset: N = 541]
       |
       +---> [Holdout Test Partition: 20% (N = 109)]  <--- FROZEN COMPLETELY (Never touched during CV)
       |
       +---> [Development Partition: 80% (N = 432)]
                    |
                    v
             [Repeated Stratified 5-Fold CV (3 Repeats = 15 Folds)]
                    |
                    +--> Model Comparison (Logistic Regression vs. RF vs. ET vs. XGBoost)
                    +--> Feature Ablation Comparisons (Core vs. Extended, Ratio vs. Source)
                    +--> Hyperparameter Tuning & Regularization
                    +--> Decision Threshold Tuning (Youden's J / Clinical Sensitivity)
                    +--> Probability Calibration (Platt / Isotonic)
                    |
                    v
             [Fit Final Selected Pipeline on Full 80% Development Partition]
                    |
                    v
             [Evaluate ONCE on the Frozen 20% Holdout Partition]
```

### Golden Rules of Evaluation:
1. **The Holdout Set is Evaluated Exactly ONCE**: It is never used to select features, tune hyperparameters, or choose decision thresholds.
2. **Decision Thresholds are Selected on Development Data**: Operating thresholds (e.g., target 85% sensitivity for screening) are determined using out-of-fold cross-validation probabilities, never on the holdout partition.
3. **Probability Calibration is Learned on Development Data**: Calibration curves and Brier scores are optimized strictly within cross-validation.
