# Model Ablation & Experimental Evaluation Plan

**Project**: OvaSense FYP  
**Date**: September 2026  
**Auditor**: OvaSense ML / Data Science Team  
**Execution Phase**: Pre-Training Experimental Design  

---

## 1. Experimental Philosophy: Defensible Comparative Benchmarking

Rather than making irreversible feature-selection decisions based solely on marginal correlations or clinical assumptions, OvaSense utilizes a formal **Model Ablation Framework**.

Every hypothesis regarding feature utility, derived ratios, pregnancy confounding, and algorithmic selection will be evaluated empirically under strictly controlled conditions.

### Golden Rules of Experimental Integrity:
1. **Identical Partitions**: All ablation experiments use the **exact same cross-validation splits** (Repeated Stratified 5-Fold, 3 repeats = 15 folds, random seed 42) and the exact same 20% holdout test partition ($N = 109$).
2. **Zero Preprocessing Leakage**: Scalers, imputers, and resamplers are fitted exclusively within each training fold.
3. **No Metric Cherry-Picking**: Performance is evaluated across a multi-metric clinical suite; models will not be judged on raw accuracy alone.

---

## 2. Tier 1 Ablation Experiments (Pre-Clinical Screening)

| Experiment ID | Feature Configuration | Feature Count | Primary Research Hypothesis |
| :--- | :--- | :---: | :--- |
| **EXP-1A (Baseline)** | **Core Tier 1**<br>Age, Weight, Height, BMI, Cycle Regularity, Cycle Length Raw, Waist, Hip, WHR, 5 Symptoms, 2 Lifestyle. | **16** | Baseline pre-clinical screening performance without invasive or socially biased variables. |
| **EXP-1B (Reproductive Sensitivity)** | **Core Tier 1 + Reproductive / Social**<br>Core 16 + `marriage_years`, `pregnant`, `abortions_count`. | **19** | Evaluates whether adding reproductive history improves predictive discrimination or merely introduces demographic confounding. |
| **EXP-1C (Derived Feature Ablation)** | **Core Tier 1 without Derived Metrics**<br>Core 16 minus `bmi` and `waist_hip_ratio`. | **14** | Evaluates whether non-linear tree models and linear models can learn adiposity relationships directly from raw Weight, Height, Waist, and Hip without pre-computed ratios. |
| **EXP-1D (Calculated vs. Raw Derivation)** | **Core Tier 1 with Raw Spreadsheet Values**<br>Uses original uncleaned BMI and WHR from the Excel sheet. | **16** | Measures whether deterministic formula calculation in preprocessing improves numerical stability over historical spreadsheet rounding. |

---

## 3. Tier 2 Progressive Ablation Experiments (Clinical & Laboratory)

| Experiment ID | Feature Configuration | Feature Count | Primary Research Hypothesis |
| :--- | :--- | :---: | :--- |
| **EXP-2A (Incremental Benchmark)** | **Tier 1 Core Baseline** (Identical to EXP-1A) | **16** | Serves as the direct comparative benchmark to quantify the exact incremental gain ($\Delta \text{ROC-AUC}$, $\Delta \text{Sensitivity}$) of adding laboratory evidence. |
| **EXP-2B (Progressive Core)** | **Tier 1 Core (16) + Tier 2 Core Clinical/Lab (16)**<br>Vitals (Pulse, RR, BP), CBC (Hb), Pituitary/Ovarian Hormones, Thyroid, Metabolic Glucose. | **32** | Tests the core OvaSense architectural hypothesis: clinical and laboratory data substantially refines the Tier 1 pre-clinical risk estimate. |
| **EXP-2C (Blood Group Sensitivity)** | **Tier 2 Core (32) + `blood_group`** | **33** | Evaluates whether adding ABO/Rh typing improves multivariable discrimination or causes tree fragmentation and overfitting due to sparse categorical noise. |
| **EXP-2D (Pregnancy Marker Ablation)** | **Tier 2 Core minus Gestational Markers**<br>Tier 2 Core minus `beta_hcg_i`, `beta_hcg_ii`, and `progesterone`. | **29** | Tests whether removing pregnancy-confounded markers preserves or improves model robustness for non-pregnant screening populations. |
| **EXP-2E (Gonadotropin Ratio Ablation)** | **FSH / LH Configurations**: <br>E1: Source `fsh` + `lh` only<br>E2: `fsh_lh_ratio` only<br>E3: Source `fsh` + `lh` + `fsh_lh_ratio` | **31 / 30 / 32** | Compares collinearity impact, tree split efficiency, and linear model coefficient stability across gonadotropin representations. |

---

## 4. Algorithmic Comparison Suite (Evaluated for Each Tier)

For every feature configuration, four algorithms will be trained under identical CV folds:
1. **Logistic Regression (ElasticNet / L2 Penalty)**:
   - Interpretable baseline.
   - Evaluated with standardized continuous features and odds-ratio coefficients.
2. **Random Forest (Bagging Ensemble)**:
   - Non-linear ensemble robust to monotonic feature transformations and outliers.
3. **Extra Trees (Extremely Randomized Trees)**:
   - Random threshold splits; lower variance and reduced overfitting on smaller sample sizes ($N = 541$).
4. **XGBoost (Gradient Boosted Decision Trees)**:
   - Optimized gradient boosting with regularized objective ($\ell_1$ and $\ell_2$ leaf penalties).

---

## 5. Multi-Metric Evaluation & Clinical Operating Thresholds

### 5.1 Primary Evaluation Metrics
To satisfy healthcare standards, models will be evaluated across seven distinct metrics:
1. **Sensitivity (Recall)**: Primary metric for screening triage ($\text{TP} / (\text{TP} + \text{FN})$). Minimizes dangerous false negatives.
2. **Specificity**: Secondary metric ($\text{TN} / (\text{TN} + \text{FP})$). Minimizes unnecessary anxiety and costly clinical follow-up.
3. **ROC-AUC**: Overall discrimination capability across all potential operating thresholds.
4. **PR-AUC (Average Precision)**: Critical for moderately imbalanced clinical cohorts (32.7% positive).
5. **F1-Score / Balanced Accuracy**: Harmonic and arithmetic balance between sensitivity and precision/specificity.
6. **Brier Score**: Evaluates probability calibration ($\text{Brier} = \frac{1}{N} \sum (p_i - y_i)^2$).
7. **Calibration Curves**: Visual assessment of predicted probability vs. observed empirical fraction.

### 5.2 Operating Threshold Selection Protocol
- The default threshold of $0.50$ is rarely optimal for medical screening.
- Operating thresholds will be tuned **strictly on training fold out-of-fold predictions** using:
  - **Criterion 1 (Screening Priority)**: Minimum threshold achieving **$\ge 85\%$ Sensitivity** with maximal specificity.
  - **Criterion 2 (Balanced Priority)**: Youden's Index ($J = \text{Sensitivity} + \text{Specificity} - 1$).
- The frozen holdout test set will be evaluated using the frozen threshold selected on the development partition.
