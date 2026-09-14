# Updated Model Training Approval Gate & Readiness Assessment

**Project**: OvaSense FYP  
**Date**: September 2026  
**Auditor**: OvaSense ML / Data Science Team  
**Review Status**: Second-Level Adversarial Audit Complete  

---

## 1. Executive Verdict: Gate Assessment

Following the second-level critical audit, every feature decision, statistical claim, outlier correction, and leakage safeguard has been thoroughly re-evaluated.

### Verdict: **DATA ARCHITECTURE READY — MODEL TRAINING PAUSED PENDING USER INITIATION**

The dataset architecture, tier isolation, deterministic cleaning, and ablation framework are fully specified, scientifically sound, and defensible. In accordance with the user's explicit instructions, **no machine learning models will be trained until the user reviews this second-level audit and provides explicit authorization**.

---

## 2. Definitive 22-Item Verification Checklist

| Item # | Verification Requirement | Status | Second-Level Audit Findings & Corrective Evidence |
| :---: | :--- | :---: | :--- |
| 1 | **Raw dataset verified** | **PASSED** | SHA-256 hash verified: `b663ec9f491be419718e0935eb1c5b6c4923b527282230a73cfc9aca8533f742`. File is strictly read-only. 541 rows $\times$ 45 columns in `Full_new`. |
| 2 | **Target verified** | **PASSED** | `PCOS (Y/N)` verified: Class 0 = 364 (67.28%), Class 1 = 177 (32.72%). Zero missing, zero invalid values. Fully isolated as target vector $y$. |
| 3 | **IDs removed** | **PASSED** | `Sl. No` (1–541) and `Patient File No.` (1–541) confirmed as administrative row identifiers. Completely purged from all feature matrices. |
| 4 | **Artifact removed** | **PASSED** | `Unnamed: 44` confirmed as an empty Excel overflow column (99.63% missing). Completely dropped. |
| 5 | **Every feature classified** | **PASSED** | All 45 columns classified across Tier 1, Tier 2, Tier 3 Structured, Target, ID, and Artifact in `src/tier_classifier.py`. |
| 6 | **Tier 1 finalized** | **PASSED** | Core Tier 1 finalized with 16 strictly self-reported, non-invasive features. Disputed reproductive variables moved to ablation variant. |
| 7 | **Tier 2 finalized** | **PASSED** | Progressive Tier 2 finalized with 32 features = 16 Tier 1 Core + 16 Clinical Vitals & Lab Biomarkers. Disputed `blood_group` moved to ablation variant. |
| 8 | **Tier 3 structured data separated** | **PASSED** | 5 structured TVS measurements isolated into `data/tiered/tier3_structured_reference.csv`. Zero ultrasound image claims made. |
| 9 | **Cycle-length semantics verified** | **PASSED** | Semantics formally acknowledged as uncertain; empirical values (0–12, median 5.0) suggest bleeding flow duration. Formally designated `cycle_length_raw`. |
| 10 | **Derived features verified** | **PASSED** | BMI (98.89% match), WHR (98.71% match), and FSH/LH (98.34% match) verified. Deterministic formulas applied during preprocessing. |
| 11 | **Missingness analyzed** | **PASSED** | Low missingness verified. Over-claim of "MCAR" retracted and replaced with scientifically defensible characterization. Imputations strictly inside CV folds. |
| 12 | **Outliers analyzed** | **PASSED** | Clinically informed separation: data-entry errors (BP 12/8, Pulse 13/18, FSH 5052, LH 2018, Vit D > 5000) converted to NaN for fold imputation; biological extremes preserved. |
| 13 | **Duplicate patients checked** | **PASSED** | 0 exact duplicate rows; 0 duplicate clinical vectors. 541 unique Patient File Numbers. No repeated-measures clustering. |
| 14 | **Leakage audit completed** | **PASSED** | TVS follicle counts excluded from early tiers. Preprocessing transformations fit strictly on training partitions within CV folds. |
| 15 | **Reproductive-feature bias reviewed** | **PASSED** | Over-claims of "proven bias" retracted. Reframed as: potential fairness/generalizability concerns across unmarried/nulliparous cohorts; retained in `tier1_extended_dataset.csv` for ablation. |
| 16 | **Preprocessing pipeline designed** | **PASSED** | Implemented in `src/preprocessing.py`. Scalers, imputers, and resamplers designed to fit exclusively inside training partitions. |
| 17 | **Cross-validation strategy defined** | **PASSED** | Repeated Stratified 5-Fold Cross-Validation (3 repeats = 15 folds, seed 42) selected to neutralize row-order batch effects. Frozen 20% holdout test set ($N=109$). |
| 18 | **Class imbalance strategy defined** | **PASSED** | Compare no weighting vs. algorithmic cost-sensitive weighting (`class_weight='balanced'`) vs. SMOTE strictly inside training folds. |
| 19 | **Calibration strategy defined** | **PASSED** | Brier score, calibration curves, and Platt scaling / Isotonic regression learned exclusively on development data. |
| 20 | **Evaluation metrics defined** | **PASSED** | Sensitivity (Recall), Specificity, ROC-AUC, PR-AUC, F1, Balanced Accuracy, and Brier Score. No reliance on raw accuracy alone. |
| 21 | **SHAP strategy defined** | **PASSED** | TreeExplainer for ensembles, linear coefficients for Logistic Regression. Clear documentation that SHAP attributes contribution, not biological causality, especially under collinearity. |
| 22 | **Tier 1 -> Tier 2 progression verified** | **PASSED** | Verified via `src/verify_pipeline.py`. Tier 2 strictly contains all 16 Tier 1 core features plus 16 clinical/lab features. No independent lab-only model. |

---

## 3. Explicit List of What Remains Blocked Until User Authorization

To maintain 100% adherence to user instructions:
1. **No Model Objects Have Been Created or Fitted**: Not a single scikit-learn or XGBoost estimator has been instantiated or fitted.
2. **No Metrics Have Been Computed**: No accuracy, AUC, or sensitivity scores have been calculated.
3. **Execution Gate**: Model training will commence only upon receiving a dedicated prompt from the user directing us to execute the experiments defined in `ABLATION_PLAN.md`.
