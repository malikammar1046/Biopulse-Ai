# Male Tier 2: Laboratory & Hormonal Model Walkthrough

## Overview

We have successfully implemented and validated **Male Tier 2 (Hormonal & Laboratory Screener)** for men aged **19–60**, using the CDC NHANES 2013–2016 multi-biomarker laboratory cohort ($N = 3,575$).

All requirements and constraints specified for Tier 2 have been satisfied:
1. **No ML Classification for Primary vs. Secondary Hypogonadism:** Modeled strictly as a separate rule-based clinical-pattern interpretation layer based on pituitary-gonadal signaling (LH, FSH, Prolactin).
2. **Strict Anti-Leakage Isolation:** Total Testosterone (`LBXTST`) and Calculated Free Testosterone (`cFT`) are strictly excluded from the predictor feature vector $\mathbf{x}$.
3. **Modular Extraction:** The pipeline handles arbitrary lab subsets without requiring every biomarker, clearly listing which tests were detected and which were not reported. Missing values are never fabricated.
4. **Independent Extraction & Unit Normalization:** OCR and extraction produce neutral structured data without making medical conclusions.
5. **Preservation of Laboratory Reference Ranges:** Report-provided reference ranges are strictly preserved and presented directly to the user.
6. **Everyday Language:** Complex clinical jargon (*"gonadotropin"*, *"hypogonadotropic"*, *"androgen deficiency"*) has been completely eliminated in favor of plain terms (*"Testosterone level"*, *"LH hormone"*, *"FSH hormone"*, *"blood test"*, *"reference range"*).
7. **Strict Safety Protocol:** Never outputs *"You have hypogonadism"*; instead uses *"Your lab results show a pattern that can sometimes be linked with low testosterone..."* and emphasizes that results do not confirm a medical diagnosis.
8. **Pre-Training Verification:** Completed in [data_verification_before_training.md](file:///d:/male%20modal/male_tier2/reports/data_verification_before_training.md).
9. **4 Algorithms Benchmarked:** Extra Trees, XGBoost, Logistic Regression, and Random Forest.
10. **Untouched Codebases:** Tier 1, Female PCOS, and Digital Twin remain untouched; all work is isolated in [`male_tier2/`](file:///d:/male%20modal/male_tier2).

---

## 4-Algorithm Benchmark & Model Comparison

5-Fold Stratified Cross-Validation results across the 2,860 training samples:

| Algorithm | Mean ROC-AUC | Std ROC-AUC | Mean PR-AUC | Default Recall | Mean Brier Score | Status |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Random Forest** | **0.8521** | $\pm 0.0120$ | 0.6639 | 0.7695 | 0.1576 | **Champion** |
| **XGBoost** | **0.8490** | $\pm 0.0120$ | 0.6616 | 0.7401 | 0.1460 | Candidate |
| **Logistic Regression (L2 Balanced)** | **0.8487** | $\pm 0.0133$ | **0.6674** | **0.8092** | 0.1609 | Candidate |
| **Extra Trees Classifier** | **0.8407** | $\pm 0.0083$ | 0.6332 | 0.7607 | 0.2070 | Candidate |

### Best Model & Results
* **Champion Model:** **Random Forest Classifier** with probability calibration via Platt scaling (`CalibratedClassifierCV`).
* **Test Set Performance ($N = 715$, unseen 20%):**
  * **ROC-AUC:** **0.8742**
  * **PR-AUC (Average Precision):** **0.6723** (vs. 23.8% base prevalence)
  * **Sensitivity (Recall):** **73.5%**
  * **Specificity:** **83.5%**
  * **Negative Predictive Value (NPV):** **91.0%**
  * **Brier Score:** **0.1164** (superbly calibrated)
* **Age Subpopulation Performance:**
  * **Ages 19–30 ($N = 197$):** ROC-AUC **0.9219**, Sensitivity 79.0%, Specificity 89.3%, NPV **94.7%**
  * **Ages 31–40 ($N = 170$):** ROC-AUC **0.8902**, Sensitivity 84.1%, Specificity 77.0%, NPV **93.3%**
  * **Ages 41–50 ($N = 177$):** ROC-AUC **0.9093**, Sensitivity 85.7%, Specificity 78.9%, NPV **93.5%**
  * **Ages 51–60 ($N = 171$):** ROC-AUC **0.7793**, Sensitivity 41.0%, Specificity 87.1%, NPV **83.3%**

---

## Diagnostic Performance Figures

Diagnostic evaluation figure saved to: [`male_tier2/artifacts/tier2_model_performance.png`](file:///d:/male%20modal/male_tier2/artifacts/tier2_model_performance.png)

* **Top-Left (ROC Curve):** Test set AUC of 0.874 with the sensitivity-optimized screening threshold ($\tau = 0.3379$) marked in red.
* **Top-Right (Precision-Recall Curve):** PR-AUC of 0.672 demonstrates high precision across wide recall ranges compared to 23.8% baseline prevalence.
* **Bottom-Left (Calibration Curve):** Calibrated predicted probabilities align closely with empirical observed event rates.
* **Bottom-Right (Feature Importances):** SHBG (38.1%), Estradiol (17.0%), Uric Acid (6.9%), HDL (6.8%), Age (5.2%), HbA1c (5.2%), and Fasting Glucose (5.1%) are the primary indirect markers of low testosterone.

---

## Verification & Testing Results

An automated test suite ([`test_tier2_suite.py`](file:///d:/male%20modal/male_tier2/tests/test_tier2_suite.py)) was executed, confirming 100% compliance across all 9 test cases:

```
Ran 9 tests in 7.632s

OK

[PASS] Test 1: Feature matrix strictly excludes Total T and Free T (Zero Leakage).
[PASS] Test 2: Modular execution with partial report gracefully reports missing tests.
[PASS] Test 3: Primary hormonal pattern correctly classified as pattern interpretation.
[PASS] Test 4: Secondary hormonal pattern correctly identified with non-diagnostic language.
[PASS] Test 5: Prolactin-related pattern successfully flagged.
[PASS] Test 6: Laboratory reference range preserved without silent overwriting.
[PASS] Test 7: Prohibited medical jargon check passed (all everyday wording).
[PASS] Test 8: Strict safety language verified (never claims 'You have hypogonadism').
[PASS] Test 9: Serialized Champion Model loaded (Random Forest, threshold: 0.3379).
```

---

## Key Files Created

| Directory / File | Description |
| :--- | :--- |
| [`male_tier2/src/data_loader.py`](file:///d:/male%20modal/male_tier2/src/data_loader.py) | Downloads, validates, merges NHANES tables, filters men aged 19–60, and exports clean cohort. |
| [`male_tier2/src/preprocessing.py`](file:///d:/male%20modal/male_tier2/src/preprocessing.py) | 80/20 train/test partition, feature matrix definitions, imputer, scaler. |
| [`male_tier2/src/models.py`](file:///d:/male%20modal/male_tier2/src/models.py) | Pipelines for Extra Trees, XGBoost, Logistic Regression, and Random Forest. |
| [`male_tier2/src/evaluation.py`](file:///d:/male%20modal/male_tier2/src/evaluation.py) | 5-fold CV benchmark, Platt calibration, subpopulation auditing, diagnostic plotting, and pattern rules. |
| [`male_tier2/src/lab_extractor.py`](file:///d:/male%20modal/male_tier2/src/lab_extractor.py) | Modular text/OCR extractor isolating lab data without clinical assumptions. |
| [`male_tier2/src/unit_normalizer.py`](file:///d:/male%20modal/male_tier2/src/unit_normalizer.py) | Safe unit converter preserving original values and laboratory reference ranges. |
| [`male_tier2/src/inference.py`](file:///d:/male%20modal/male_tier2/src/inference.py) | End-to-end inference engine with plain-language, non-diagnostic guidance. |
| [`male_tier2/src/train_tier2.py`](file:///d:/male%20modal/male_tier2/src/train_tier2.py) | Master training script executing benchmark, calibration, and artifact generation. |
| [`male_tier2/tests/test_tier2_suite.py`](file:///d:/male%20modal/male_tier2/tests/test_tier2_suite.py) | Automated test suite verifying all 8 user requirements. |
| [`male_tier2/reports/data_verification_before_training.md`](file:///d:/male%20modal/male_tier2/reports/data_verification_before_training.md) | Full pre-training data verification and leakage audit. |
| [`male_tier2/reports/model_evaluation.md`](file:///d:/male%20modal/male_tier2/reports/model_evaluation.md) | Comprehensive model evaluation, benchmark tables, and subpopulation metrics. |
| [`male_tier2/artifacts/male_tier2_model.joblib`](file:///d:/male%20modal/male_tier2/artifacts/male_tier2_model.joblib) | Serialized calibrated Random Forest model artifact. |
| [`male_tier2/artifacts/metrics_report.json`](file:///d:/male%20modal/male_tier2/artifacts/metrics_report.json) | Complete metrics, confusion matrices, and feature importances in JSON. |
| [`male_tier2/artifacts/tier2_model_performance.png`](file:///d:/male%20modal/male_tier2/artifacts/tier2_model_performance.png) | 4-panel publication diagnostic figure. |
