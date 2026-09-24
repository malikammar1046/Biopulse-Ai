# Model Training Approval Gate & Readiness Checklist

**Project**: OvaSense FYP  
**Date**: September 2026  
**Auditor**: OvaSense ML / Data Science Team  
**Status**: Pre-Training Audit Complete & Verified  

---

## 1. Executive Summary & Readiness Verdict

Before commencing model training, all 22 foundational data architecture requirements were audited and verified using the actual dataset. No models have been trained. The dataset architecture has been cleaned, tiered, and validated via automated reproducibility tests.

### Overall Gate Status: **READY FOR CONTROLLED MODEL TRAINING**

---

## 2. Definitive Verification Checklist

| Checklist Item | Status | Verification Evidence & Implementation Summary |
| :--- | :---: | :--- |
| **[X] Raw dataset verified** | **PASSED** | SHA-256 hash verified: `b663ec9f491be419718e0935eb1c5b6c4923b527282230a73cfc9aca8533f742`. File remains strictly read-only. Exactly 541 rows, 45 raw columns in `Full_new`. |
| **[X] Target verified** | **PASSED** | Column `PCOS (Y/N)` verified: Class 0 = 364 (67.28%), Class 1 = 177 (32.72%). Zero missing values, zero invalid labels. Excluded from all input feature matrices. |
| **[X] IDs removed** | **PASSED** | `Sl. No` (1–541) and `Patient File No.` (1–541) verified as administrative IDs. Both 100% excluded from Tier 1, Tier 2, and Tier 3 feature matrices. |
| **[X] Artifact removed** | **PASSED** | `Unnamed: 44` verified as an empty Excel trailing artifact column (99.63% missing). Completely dropped from all datasets. |
| **[X] Every feature classified** | **PASSED** | All 45 raw columns formally classified in `src/tier_classifier.py`: 16 Tier 1 Core, 3 Tier 1 Flagged (Reproductive), 16 Tier 2 Core, 1 Tier 2 Flagged (Blood Group), 5 Tier 3 Structured, 1 Target, 2 IDs, 1 Artifact. |
| **[X] Tier 1 finalized** | **PASSED** | Core Tier 1 finalized with 16 strictly self-reported, non-invasive features (age, anthropometrics, cycle regularity, bleeding flow duration, symptoms, lifestyle). Zero lab/vitals/ultrasound. |
| **[X] Tier 2 finalized** | **PASSED** | Progressive Tier 2 finalized with 32 features = 16 Tier 1 Core + 16 Clinical Vitals and Lab Biomarkers (CBC, Pituitary/Ovarian Hormones, Thyroid, Metabolic Glucose). |
| **[X] Tier 3 structured data separated** | **PASSED** | 5 structured TVS measurements (`Follicle No. (L/R)`, `Avg. F size (L/R)`, `Endometrium`) isolated into `tier3_structured_reference.csv`. Fully decoupled from Tier 1 and Tier 2. |
| **[X] Cycle-length semantics verified** | **PASSED** | Values (0–12 days, median 5.0 days) verified via distribution and clinical literature to represent **menstrual bleeding duration in days**, NOT the 28-day cycle interval. Formally named `cycle_length_raw`. |
| **[X] Derived features verified** | **PASSED** | BMI (98.89% match), Waist:Hip Ratio (98.71% match), and FSH/LH (98.34% match) consistency verified. Discrepancies traced to manual rounding. Calculated deterministically in pipeline. |
| **[X] Missingness analyzed** | **PASSED** | Only 2 clinical features have 1 missing value each (`Marraige Status`, `Fast food`). Cleaning typos (`1.99.`, `'a'`, impossible vitals) converted to NaN. All imputations strictly contained inside training folds. |
| **[X] Outliers analyzed** | **PASSED** | Clinically informed separation: data-entry errors (BP 12/8, Pulse 13/18, FSH 5052, LH 2018, Vit D3 > 5000) converted to NaN for fold imputation; valid biological extremes (AMH, weight, TSH) preserved. |
| **[X] Duplicate patients checked** | **PASSED** | 0 exact duplicate rows across all 45 columns; 0 duplicate rows on clinical features. Patient File Numbers are unique (1 to 541). No repeated measures or clustering. |
| **[X] Leakage audit completed** | **PASSED** | Comprehensive leakage audit completed in `reports/LEAKAGE_ANALYSIS.md`. Ultrasound criteria excluded from early tiers. Target excluded. Preprocessing leakage strictly contained. |
| **[X] Reproductive-feature bias reviewed** | **PASSED** | Quantitative analysis confirmed `Pregnant`, `No. of aborptions`, and `Marraige Status` have no statistically significant association with PCOS ($p > 0.35$). Excluded from Core Tier 1 to prevent severe bias against unmarried/nulliparous users. |
| **[X] Preprocessing pipeline designed** | **PASSED** | Implemented in `src/preprocessing.py`. Generates clean tiered datasets. All scalers and imputers designed to fit strictly on training partitions. |
| **[X] Cross-validation strategy defined** | **PASSED** | Repeated Stratified $k$-Fold Cross-Validation (5 folds, 3 repeats, seed 42) selected due to small sample size ($N=541$) and moderate imbalance (32.7% positive). Final 20% holdout test set isolated once. |
| **[X] Class imbalance strategy defined** | **PASSED** | Baseline evaluation uses balanced class weighting (`class_weight='balanced'`). SMOTE will only be evaluated inside cross-validation training folds to prevent validation contamination. |
| **[X] Calibration strategy defined** | **PASSED** | Because OvaSense presents a clinical risk probability, models will be evaluated using Brier score and calibration curves. Post-hoc calibration (Platt scaling / Isotonic regression) will be fitted via nested CV. |
| **[X] Evaluation metrics defined** | **PASSED** | Multi-metric clinical suite: ROC-AUC, PR-AUC, Sensitivity (Recall), Specificity, F1-score, Balanced Accuracy, and Brier score. Models will NOT be selected on raw accuracy alone. |
| **[X] SHAP strategy defined** | **PASSED** | TreeExplainer for Random Forest, Extra Trees, and XGBoost; linear coefficients for Logistic Regression. Global summary plots and local patient-level risk force plots. |
| **[X] Tier 1 -> Tier 2 progression verified** | **PASSED** | Verified via `src/verify_pipeline.py`. Tier 2 strictly contains all 16 Tier 1 core features plus 16 clinical/lab features. No independent lab-only model. |
| **[X] No Tier 3 imaging claims made** | **PASSED** | Formally documented in all reports: the current dataset does NOT support an ultrasound image model. Tier 3 is documented as a future multi-modal fusion roadmap. |

---

## 3. Recommended Next Step: Controlled Model Training Execution

With all 22 approval gate items verified and cryptographically checked, the project is officially ready for Phase 2:
1. **Tier 1 Baseline Training**: Train Logistic Regression, Random Forest, Extra Trees, and XGBoost on `tier1_dataset.csv` using 5-fold stratified CV.
2. **Tier 2 Progressive Training**: Train the identical 4 algorithms on `tier2_dataset.csv` under identical CV folds to measure the exact incremental diagnostic gain ($\Delta \text{ROC-AUC}$, $\Delta \text{Sensitivity}$, $\Delta \text{PR-AUC}$) of clinical/laboratory evidence.
3. **Sensitivity Analysis**: Compare Core Tier 1 (16 features) against Extended Tier 1 (19 features with reproductive variables) to empirically prove that removing biased reproductive variables preserves or enhances model robustness.
