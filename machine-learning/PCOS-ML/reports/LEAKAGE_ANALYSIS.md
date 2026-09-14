# Data Leakage & Integrity Audit Report

**Project**: OvaSense FYP  
**Date**: September 2026  
**Auditor**: OvaSense ML / Data Science Team  
**Status**: Authoritative Leakage Audit Finalized  

---

## 1. Scope & Leakage Taxonomy

In clinical machine learning, data leakage occurs when information from outside the training environment contaminates the learning algorithm, yielding unrealistically optimistic test performance that collapses in real-world deployment.

We audited the pipeline across five formal leakage categories:
1. **Target & Ground-Truth Leakage**: Features derived from or directly encoding the diagnosis.
2. **Diagnostic Criterion Overlap**: Features that serve as the definitive formal criteria used by physicians to define the ground truth.
3. **Identifier & Patient-Level Leakage**: Non-biological metadata (serial numbers, file IDs) that allow algorithms to memorize patients or order effects.
4. **Temporal & Post-Treatment Leakage**: Variables recorded only after a patient enters specialized medical management or treatment.
5. **Methodological Preprocessing Leakage**: Fitting statistical transformers (imputers, scalers, encoders, oversamplers) across the full dataset prior to train/test partitioning.

---

## 2. Dedicated Feature Leakage Audit Table

| Feature Name | Leakage Risk | Empirical Evidence & Mechanism | Decision | Reason |
| :--- | :--- | :--- | :--- | :--- |
| `Sl. No` | **High (Identifier Leakage)** | Monotonically increasing index (1 to 541). If patient order correlates with hospital admission batches or diagnoses, models memorize row indices. | **EXCLUDE** | Pure database artifact. Zero biological or predictive generalizability. |
| `Patient File No.` | **High (Identifier Leakage)** | Exactly identical to `Sl. No` in `Full_new` (1 to 541). Hospital record ID. | **EXCLUDE** | Administrative surrogate. Must never be used as a predictive feature. |
| `PCOS (Y/N)` | **Critical (Direct Target)** | Binary ground truth label (364 neg, 177 pos). Perfect correlation ($r = 1.0$). | **EXCLUDE from Features** | Ground truth dependent variable. Excluded from all input matrices. |
| `Unnamed: 44` | **Moderate (Artifact Leakage)** | Empty column (539 NaNs) with two stray entries (`.` and `7`). | **EXCLUDE** | Non-informative spreadsheet formatting overflow. |
| `Follicle No. (L)` & `Follicle No. (R)` | **High (Diagnostic Criterion Leakage)** | Under Rotterdam 2003/2023 criteria, $\ge 12$ (or $\ge 20$) follicles per ovary on TVS defines polycystic ovarian morphology (Criterion 3). Mean count is 10.8 in PCOS vs. 4.6 in non-PCOS. | **EXCLUDE from Tier 1 & Tier 2** | Including TVS follicle counts in Tier 1 or Tier 2 completely invalidates early-stage screening, creating a trivial decision tree split ($>10$) that collapses if ultrasound is unavailable. |
| `Avg. F size (L/R)` & `Endometrium` | **Moderate (Diagnostic Proxy)** | Measured exclusively via transvaginal ultrasound. Reflects follicular arrest (2–9 mm) and endometrial proliferation. | **EXCLUDE from Tier 1 & Tier 2** | Ultrasound measurements cannot be demanded from users in pre-clinical self-assessment or standard lab triage. |
| `Cycle(R/I)` | **Low (Legitimate Pre-Diagnostic Symptom)** | Irregular menses is Criterion 1 of Rotterdam criteria, but is experienced by the patient *before* consulting a doctor. It is the primary complaint prompting evaluation. | **KEEP in Tier 1 & 2** | Medically valid pre-diagnostic symptom. Reflects clinical reality of patient presentation. |
| `AMH(ng/mL)` | **Low (Legitimate Biomarker)** | Anti-Müllerian Hormone correlates with antral follicle pool. Recently recognized in 2023 international guidelines as an alternative proxy for ultrasound. | **KEEP in Tier 2** | Legitimate venipuncture blood biomarker. Obtained during Tier 2 clinical workup. |
| `FSH/LH` | **Low (Mathematical Redundancy)** | Exact ratio of $FSH / LH$ ($98.34\%$ exact match within $10^{-4}$). | **KEEP in Tier 2 (Flagged)** | While redundant with source variables, LH:FSH inversion is standard in clinical endocrinology. Not leakage. |
| `BMI` & `Waist:Hip Ratio` | **Low (Mathematical Redundancy)** | Deterministic functions of Weight/Height and Waist/Hip. | **KEEP in Tier 1 & 2** | Reflect established clinical thresholds (WHO). Preprocessing will compute deterministically. |
| `Marraige Status (Yrs)` | **Demographic Selection / Inapplicability** | Recorded in fertility/OBGYN hospital clinics. Inapplicable to unmarried users; potential generalizability concern ($r=0.016, p=0.71$). | **Candidate Excluded from Core** | Inapplicable to unmarried users seeking general screening. Retained for ablation. |

---

## 3. Preprocessing & Methodological Leakage Protocol

To ensure 100% mathematical defensibility in an academic/viva defense, the modeling pipeline enforces the following non-negotiable rules:

### 3.1 Strict Cross-Validation Containment
All transformations that compute dataset-level summary statistics must be fitted **exclusively on the training folds**:
1. **Missing Value Imputation**:
   - Medians, means, and modes are computed **only** on the training fold:
     $$\hat{\mu}_{\text{train}} = \frac{1}{|D_{\text{train}}|} \sum_{i \in D_{\text{train}}} x_i$$
   - Validation and test folds are transformed using $\hat{\mu}_{\text{train}}$. Computing imputations over the full dataset prior to splitting is strictly forbidden.
2. **Feature Scaling & Standardization**:
   - `StandardScaler` (or `RobustScaler`) calculates mean $\mu_{\text{train}}$ and standard deviation $\sigma_{\text{train}}$ exclusively on $D_{\text{train}}$:
     $$x_{\text{scaled}} = \frac{x - \mu_{\text{train}}}{\sigma_{\text{train}}}$$
   - Test folds are evaluated using the frozen parameters of the training fold.
3. **Class Imbalance & Oversampling (SMOTE)**:
   - If synthetic oversampling is tested, it must be applied **only within the training fold of each CV split**.
   - Synthetic samples must never leak into the validation or test partitions. Applying SMOTE before splitting creates duplicate/interpolated points across splits, artificially inflating validation accuracy.
4. **Feature Selection**:
   - Any algorithmic feature ranking (e.g., recursive feature elimination, mutual information) must be computed strictly inside each training fold to prevent selection bias.

---

## 4. Patient-Level Independence Verification
- **Patient Clustering Check**: Every row in `Full_new` has a distinct `Patient File No.` (1 to 541).
- **Exact Duplicate Rows**: 0 across all 45 columns.
- **Clinical Feature Duplicates**: 0 across all 42 clinical columns.
- **Conclusion**: Standard stratified $k$-fold cross-validation is mathematically valid because no patient appears across multiple rows. Group-based splitting is unnecessary as there is exactly one record per patient.
