# BioPulse AI / PMOSense — Complete Machine Learning Viva Preparation Guide

**Repository:** `MHamzaAhmed-dev/biopulse-ai-risk-assessment`  
**Branch:** `ammar-latest-work`  
**Analyzed Git Commit:** `549c60a2b50eb4446deb231db69a2bf77ae52fc5`  
**Target Audience:** Final Year Project (FYP) Viva Defense, External Examiner Technical Review, Machine Learning Architecture Defense  
**Authoritative Scope:** Female Reproductive Screening (PCOS Tiers 1, 2, 3 & Multimodal) and Male Endocrine Screening (Hypogonadism Tiers 1 & 2)

---

# SECTION 1: ML VIVA QUICK REVISION CHEAT SHEET

> [!IMPORTANT]
> **Use this 10-minute cheat sheet for last-minute revision before entering the viva room.** Every number, algorithm, and threshold below is verified directly from serialized artifacts, evaluation reports, and production code.

### 1.1 The 5 Production Models at a Glance

| Pathway & Tier | Algorithm | Features | Training Dataset | Operating Threshold | Holdout ROC-AUC | Holdout Sensitivity | Holdout Specificity |
| :--- | :--- | :---: | :--- | :---: | :---: | :---: | :---: |
| **Female Tier 1** | ExtraTreesClassifier + Platt Sigmoid | 16 | Kottarathil PCOS ($N=541$, Dev $432$, Test $109$) | $\tau^* = 0.25$ | **0.8980** | **80.56%** | **83.56%** |
| **Female Tier 2** | ExtraTreesClassifier + Platt Sigmoid | 32 | Kottarathil PCOS ($N=541$, Dev $432$, Test $109$) | $\tau^* = 0.25$ | **0.8919** | **77.78%** | **83.56%** |
| **Female Tier 3 (PCOM)** | Pretrained EfficientNet-B0 + Head | Images (224×224) | Ultrasound Cohort ($N=541$ scans, Dev $432$, Test $109$) | $\tau = 0.50$ | **0.9199** | **98.28%** | **84.31%** |
| **Male Tier 1** | Logistic Regression (Balanced) + Platt | 11 | CDC NHANES 2013–2016 ($N=3,575$, Train $2,860$, Test $715$) | $t = 0.1808$ | **0.7044** | **80.59%** | **44.59%** |
| **Male Tier 2** | Calibrated Random Forest (100 Trees) | 16 | CDC NHANES 2013–2016 ($N=3,575$, Train $2,860$, Test $715$) | $\tau = 0.3379$ | **0.8742** | **73.53%** | **83.49%** |

---

### 1.2 The Multimodal Fusion Formula (Female Tier 1+2+3)

$$p_{\text{multimodal}} = 0.95 \times p_{\text{Tier 2 Clinical}} + 0.05 \times p_{\text{Tier 3 Ultrasound}}$$

- **Why 95% / 5%?** The empirical incremental diagnostic signal of ultrasound for predicting the clinical reference PCOS outcome is negligible ($\Delta\text{ROC-AUC} = +0.0008$, $\Delta\text{PR-AUC} = +0.0017$). Systemic PCOS is an endocrine/metabolic disorder best predicted by cumulative clinical biomarkers. The 5% weight reflects this statistical reality while honoring the third Rotterdam criterion (PCOM morphology).
- **Fallback Rule:** If ultrasound is missing, unreadable, or throws an inference error, the system safely preserves 100% of the validated Tier 2 clinical score ($w_{\text{clinical}} = 1.0, w_{\text{ultrasound}} = 0.0$).

---

### 1.3 Decision Thresholds & Risk Categorization

| Tier | Operating Threshold | Low-Risk Cutoff | Likelihood / Risk Bands |
| :--- | :---: | :---: | :--- |
| **Female Tier 1 & Tier 2** | **0.25** | **0.18** | Lower: $< 0.18$ \| Intermediate: $0.18 \le p < 0.25$ \| Higher: $\ge 0.25$ |
| **Female Multimodal** | **0.29** (Research) / **0.25** (Policy) | **0.18** | Lower: $< 0.18$ \| Intermediate: $0.18 \le p < 0.25$ \| Higher: $\ge 0.25$ |
| **Male Tier 1** | **0.1808** | **0.10** | Lower: $< 0.10$ \| Intermediate: $0.10 \le p < 0.1808$ \| Higher: $\ge 0.1808$ |
| **Male Tier 2** | **0.3379** | **0.10** | Lower: $< 0.10$ \| Intermediate: $0.10 \le p < 0.3379$ \| Higher: $\ge 0.3379$ |

*Why are screening thresholds $< 0.50$?* In medical screening, **False Negatives are far more dangerous than False Positives**. Lowering the threshold prioritizes **Sensitivity (Recall $\ge 80\%$)** to catch cases early for clinical workup.

---

### 1.4 SHAP Explainability Engine

- **Method:** Model-Aware, 5-Fold Calibrated SHAP (`FoldAwareCalibratedExplainer`).
- **Tree Models (Extra Trees, Random Forest):** `TreeExplainer` on each of the 5 internal cross-validation estimators.
- **Linear Models (Logistic Regression):** `LinearExplainer` on decision function log-odds space.
- **Ensemble Aggregation:** Computes local SHAP attributions across all 5 folds, maps column keys, checks strict mathematical additivity ($|\sum \phi_i + \phi_0 - f(x)| < 10^{-5}$), and calculates cross-fold direction agreement stability.

---

### 1.5 Five Genuine Project Limitations You Must Defend

1. **Retrospective Benchmark Data:** Both cohorts (Kottarathil PCOS from 10 Kerala hospitals, CDC NHANES 2013–2016) are retrospective cross-sectional cohorts; prospective clinical trials have not yet been conducted.
2. **Ultrasound Modality Disconnect:** The ultrasound dataset contains 2D B-mode cross-sections rather than full volumetric cine-loops; predicting systemic clinical PCOS from image alone yielded chance-level performance (Holdout ROC-AUC = 0.5042).
3. **Male Tier 1 Specificity Trade-Off:** Prioritizing 80.6% screening sensitivity at threshold 0.1808 reduced test specificity to 44.6% ($FP = 302 / 545$), requiring blood tests to confirm true status.
4. **No Direct Pediatric Validation:** Female models represent reproductive-age women (median ~26 years); male models represent adult men aged 19–60. They cannot be used on pediatric or postmenopausal cohorts.
5. **Screening vs. Diagnosis:** BioPulse AI calculates statistical screening likelihoods to assist clinical triage; it is **NOT an autonomous diagnostic medical device**.

---

### 1.6 20 Essential Facts You Must Memorize

1. **Female Dataset Source:** Prasoon Kottarathil benchmark (10 hospitals in Kerala, India, Kaggle), $N = 541$ patients.
2. **Female Cohort Balance:** 364 Negative (67.28%), 177 Positive (32.72%), Imbalance ratio 2.06:1.
3. **Female Split Strategy:** Stratified 80/20 train/test split. Development $N = 432$, Frozen Holdout $N = 109$.
4. **Critical Excluded Leakage Features in Female Tiers:** `Follicle No. (L)`, `Follicle No. (R)`, `Avg. F size (L/R)`, and `Endometrium` were **excluded from Tiers 1 and 2** because they are Rotterdam diagnostic criteria derived via ultrasound.
5. **Female Tier 1 Features (16):** `age`, `weight_kg`, `height_cm`, `bmi`, `cycle_regularity`, `cycle_length_raw`, `hip_inch`, `waist_inch`, `waist_hip_ratio`, `weight_gain`, `hirsutism`, `skin_darkening`, `hair_loss`, `pimples_acne`, `fast_food`, `regular_exercise`.
6. **Female Tier 1 Champion:** ExtraTreesClassifier (Unweighted, 100 trees) with 5-fold Platt sigmoid calibration.
7. **Female Tier 1 Holdout Performance:** ROC-AUC = 0.8980, PR-AUC = 0.8324, Sensitivity = 80.56%, Specificity = 83.56%, F1 = 0.7532, Brier = 0.1121 ($\tau = 0.25$, $TN=61, FP=12, FN=7, TP=29$).
8. **Female Tier 2 Cumulative Features (32):** All 16 Tier 1 features + 16 clinical vitals & laboratory assays (`pulse_rate_bpm`, `respiratory_rate`, `hemoglobin`, `beta_hcg_i`, `beta_hcg_ii`, `fsh`, `lh`, `fsh_lh_ratio`, `tsh`, `amh`, `prolactin`, `vitamin_d3`, `progesterone`, `rbs`, `bp_systolic`, `bp_diastolic`).
9. **Female Tier 2 Holdout Performance:** ROC-AUC = 0.8919, PR-AUC = 0.8243, Sensitivity = 77.78%, Specificity = 83.56%, F1 = 0.7368, Brier = 0.1138 ($\tau = 0.25$, $TN=61, FP=12, FN=8, TP=28$).
10. **Female Tier 3 Ultrasound Vision Model:** Pretrained EfficientNet-B0 (transfer learning on ImageNet-1k, 1,280-dim embedding) + linear classification head.
11. **Female Tier 3 PCOM Image Task:** Predicts visible Polycystic Ovarian Morphology. Holdout ROC-AUC = **0.9199**, Sensitivity = **98.28%** (57/58), Specificity = **84.31%** (43/51), F1 = **0.9268**, Brier = **0.0769**.
12. **Female Tier 3 Ultrasound Clinical Outcome Paradox:** EfficientNet-B0 predicting systemic clinical PCOS label alone yields Holdout ROC-AUC = **0.5042** (chance level), proving ultrasound images cannot diagnose systemic PCOS in isolation.
13. **Multimodal Holdout Performance:** ROC-AUC = **0.8927**, PR-AUC = **0.8260**, Sensitivity = **69.44%**, Specificity = **93.15%**, F1 = **0.7576** (at default 0.50).
14. **Male Dataset Source:** CDC NHANES (2013–2014 and 2015–2016 continuous epidemiological cycles), $N = 3,575$ real adult men aged 19–60 years.
15. **Male Dataset Balance:** 2,724 Negative (76.2%), 851 Positive (23.8%) for low testosterone ($T < 300\text{ ng/dL}$).
16. **Male Split Strategy:** Stratified 80/20 train/test split. Train $N = 2,860$, Test $N = 715$.
17. **Male Critical Excluded Leakage Feature:** Total Testosterone (`LBXTST`) and Free Testosterone (`cFT`) were **100% excluded** from model inputs $\mathbf{x}$; used strictly to define ground truth supervision.
18. **Male Tier 1 Champion:** Balanced Logistic Regression ($C=0.2$) with Platt sigmoid calibration. Test ROC-AUC = 0.7044, Sensitivity = 80.59% (137/170), Specificity = 44.59% (243/545), NPV = 88.0% ($t = 0.1808$).
19. **Male Tier 2 Champion:** Calibrated Random Forest (100 trees). Test ROC-AUC = **0.8742**, PR-AUC = **0.6723**, Sensitivity = **73.53%** (125/170), Specificity = **83.49%** (455/545), Accuracy = **81.12%**, Brier = **0.1164** ($\tau = 0.3379$).
20. **PCA Verification:** **PCA was NOT used in any production or experimental pipeline**; raw interpretable clinical features were preserved to maintain direct biological explainability via TreeSHAP and LinearSHAP.

---

# SECTION 2: COMPLETE PRODUCTION MODEL INVENTORY

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   BIOPULSE AI / PMOSENSE                                        │
│                              DUAL-PATHWAY ML INFRASTRUCTURE                                     │
├──────────────────────────────────────────────┬──────────────────────────────────────────────────┤
│           FEMALE REPRODUCTIVE PATHWAY        │             MALE ENDOCRINE PATHWAY               │
├──────────────────────────────────────────────┼──────────────────────────────────────────────────┤
│ Tier 1: 16-Feature Non-Invasive Extra Trees  │ Tier 1: 11-Feature Symptom/Biometric LogReg      │
│ Tier 2: 32-Feature Cumulative Clinical Labs  │ Tier 2: 16-Feature Routine Lab Random Forest     │
│ Tier 3: Transvaginal Ultrasound Vision CNN   │ Rule Layer: Pituitary-Gonadal Hormone Evaluator   │
│ Fusion: 95% Clinical + 5% Ultrasound Map     │ Explainability: 5-Fold LinearSHAP & TreeSHAP     │
└──────────────────────────────────────────────┴──────────────────────────────────────────────────┘
```

### 2.1 Exhaustive Inventory Table

| Model Identity | Pathway & Tier | Algorithm | Input Feature Count | Primary Model Artifact | Training Code Source | Inference Service | Status |
| :--- | :--- | :--- | :---: | :--- | :--- | :--- | :--- |
| `PCOS-ML-T1` | Female Tier 1 | `ExtraTreesClassifier` (100 trees, unweighted) + 5-fold Sigmoid Platt | 16 | `machine-learning/PCOS-ML/models/tier1/tier1_selected_model.joblib` | `PCOS-ML/src/train_tier1.py` | `backend/apps/intelligence/services/pcos_ml_service.py` | **Production Deployed** |
| `PCOS-ML-T2` | Female Tier 2 | `ExtraTreesClassifier` (100 trees, unweighted) + 5-fold Sigmoid Platt | 32 | `machine-learning/PCOS-ML/models/tier2/tier2_selected_model.joblib` | `PCOS-ML/src/models.py` | `backend/apps/intelligence/services/pcos_ml_service.py` | **Production Deployed** |
| `PCOS-ML-T3-PCOM` | Female Tier 3 (Morphology) | Pretrained `EfficientNet-B0` + Linear Head + Sigmoid Calibration | 224×224 Image ($1,280$ embeddings) | `machine-learning/PCOS-ML/models/tier3/tier3_pcom_model.joblib` | `PCOS-ML/src/tier3_image_models.py` | `backend/apps/intelligence/services/pcos_ml_service.py` | **Production Deployed** |
| `PCOS-ML-T3-Clinical` | Female Tier 3 (Outcome) | Pretrained `EfficientNet-B0` + Linear Head | 224×224 Image ($1,280$ embeddings) | `machine-learning/PCOS-ML/models/tier3/tier3_clinical_pcos_model.joblib` | `PCOS-ML/src/tier3_image_models.py` | `backend/apps/intelligence/services/pcos_ml_service.py` | **Research / Diagnostic Benchmark** |
| `PCOS-ML-Multimodal` | Female Tier 1+2+3 | Linear Weighted Probability Fusion ($0.95 \times \text{T2} + 0.05 \times \text{T3}$) | 32 Tabular + 1 Image | `machine-learning/PCOS-ML/models/tier3/tier3_multimodal_final_model.joblib` | `PCOS-ML/src/train_multimodal_final.py` | `backend/apps/intelligence/services/pcos_ml_service.py` | **Production Deployed** |
| `Male-ML-T1` | Male Tier 1 | Balanced `LogisticRegression` ($C=0.2$, L2) + Platt Sigmoid | 11 | `machine-learning/male-ML/male_tier1/artifacts/male_low_t_model.joblib` | `male-ML/male_tier1/src/train.py` | `backend/apps/intelligence/services/male_ml_service.py` | **Production Deployed** |
| `Male-ML-T2` | Male Tier 2 | Calibrated `RandomForestClassifier` (100 trees, max_depth=8) | 16 | `machine-learning/male-ML/male_tier2/artifacts/male_tier2_model.joblib` | `male-ML/male_tier2/src/train.py` | `backend/apps/intelligence/services/male_ml_service.py` | **Production Deployed** |
| `Male-ML-T1-Clean7` | Male Tier 1 (Candidate) | Balanced `LogisticRegression` ($C=0.2$) on purely objective biometrics | 7 | `machine-learning/male-ML/experiments/male_tier1_7feat/artifacts/male_tier1_7feat_candidate.joblib` | `male-ML/experiments/male_tier1_7feat/src/train_candidate.py` | `backend/apps/intelligence/services/male_ml_service.py` | **Staged Candidate** |
| `Male-ML-T1-Fallback6`| Male Tier 1 (Fallback) | Balanced `LogisticRegression` without waist circumference | 6 | `machine-learning/male-ML/experiments/male_tier1_7feat/reports/fallback_6feat_metrics_report.json` | `male-ML/experiments/male_tier1_7feat/src/train_candidate.py` | `backend/apps/intelligence/services/male_ml_service.py` | **Graceful Degradation Fallback** |
| `Ovasense-ML-Baseline`| Female Diagnostic | `HistGradientBoosting` / `ExtraTrees` baseline experiments | 42 | `machine-learning/Ovasense-ML/models/ovasense_final_model.joblib` | `Ovasense-ML/src/train.py` | Not deployed to production | **Superseded Legacy Prototype** |

---

# SECTION 3: FEMALE AND MALE DATASET COMPARISON

### 3.1 Master Dataset Comparison Table

| Dataset / Model Tier | Original Raw Rows | Original Raw Columns | Final Validated Rows | Features Used in Model | Target Variable | Positive Cases (%) | Negative Cases (%) | Imbalance Ratio | Primary Source |
| :--- | :---: | :---: | :---: | :---: | :--- | :---: | :---: | :---: | :--- |
| **Female Tier 1** | 541 | 45 | 541 | **16** | `PCOS (Y/N)` | 177 (32.72%) | 364 (67.28%) | 2.06 : 1 | Kottarathil / Kaggle PCOS |
| **Female Tier 2** | 541 | 45 | 541 | **32** | `PCOS (Y/N)` | 177 (32.72%) | 364 (67.28%) | 2.06 : 1 | Kottarathil / Kaggle PCOS |
| **Female Tier 3 (PCOM)** | 1,468 images | N/A | 541 linked | **Image (224×224)** | `PCOM Visibility` | 276 (51.02%) | 265 (48.98%) | 1.04 : 1 | Pelvic TVS Benchmark |
| **Female Multimodal** | 541 | 45 + Images | 541 linked | **32 Tabular + Image** | `PCOS (Y/N)` | 177 (32.72%) | 364 (67.28%) | 2.06 : 1 | Linked Kottarathil Cohort |
| **Male Tier 1** | 10,175 raw NHANES | 181 | 3,575 | **11** (7 candidate) | $T < 300\text{ ng/dL}$ | 851 (23.80%) | 2,724 (76.20%) | 3.20 : 1 | CDC NHANES 2013–2016 |
| **Male Tier 2** | 10,175 raw NHANES | 181 | 3,575 | **16** | $T < 300\text{ ng/dL}$ | 851 (23.80%) | 2,724 (76.20%) | 3.20 : 1 | CDC NHANES 2013–2016 |

> [!NOTE]
> **Important Distinction on Dataset Sharing:**  
> Female Tier 1 and Tier 2 use the **exact same 541 patient cohort**. Tier 1 uses a 16-feature subset (non-invasive), while Tier 2 uses a cumulative 32-feature superset (Tier 1 + laboratory biomarkers). They are NOT independent patient cohorts. Similarly, Male Tier 1 and Tier 2 share the **exact same CDC NHANES cohort of 3,575 men aged 19–60**.

---

# SECTION 4: INDIVIDUAL DATASET PROFILES

## 4.1 Female PCOS Clinical Dataset Profile

1. **Exact Dataset Name:** `PCOS_data_without_infertility.xlsx` (Sheet: `Full_new`).
2. **File Location:** `machine-learning/PCOS-ML/PCOS_data_without_infertility.xlsx`.
3. **Cryptographic Hash (SHA-256):** `b663ec9f491be419718e0935eb1c5b6c4923b527282230a73cfc9aca8533f742`.
4. **Original Source:** Collected by Prasoon Kottarathil across 10 hospital centers in Kerala, India; published on Kaggle.
5. **Data Nature:** De-identified real-world clinical patient cohort. Zero synthetic records.
6. **Cohort Dimensions:** Exactly 541 rows, 45 columns.
7. **Target Variable:** `PCOS (Y/N)` in column index 2.
   - Meaning: Clinical consensus diagnosis of Polycystic Ovary Syndrome based on Rotterdam criteria.
   - Positive Class: `1` (PCOS confirmed, $N = 177, 32.72\%$).
   - Negative Class: `0` (Normal controls / no PCOS, $N = 364, 67.28\%$).
8. **Patient Isolation & Deduplication:**
   - Serial number column `Sl. No` ranges from 1 to 541.
   - Hospital identifier `Patient File No.` ranges from 1 to 541.
   - Exact duplicate rows across all 45 columns: **0**.
   - Pairwise duplicate feature vectors (excluding IDs): **0**.
   - Conclusion: Every row represents a unique, independent patient. No longitudinal repeat visits exist.
9. **Partitioning Strategy (Seed 42):**
   - **Development Set (80%):** $N = 432$ ($141$ PCOS+, $291$ controls). Used for 5-fold cross-validation, threshold tuning, and calibration.
   - **Frozen Holdout Set (20%):** $N = 109$ ($36$ PCOS+, $73$ controls). Kept locked until final verification.

---

## 4.2 Female Tier 3 Ultrasound Imaging Dataset Profile

1. **Exact Dataset Name:** `Ultrasound_Images/images/` and `Ultrasound_Images/class label.csv`.
2. **File Location:** `machine-learning/PCOS-ML/Ultrasound_Images/`.
3. **Total Images on Disk:** 1,468 files.
4. **Linked Cohort Images:** Exactly 541 images mapped 1-to-1 to the 541 clinical patients:
   - Patient File No. 10001 $\rightarrow$ `image10001.jpg`
   - Patient File No. 10541 $\rightarrow$ `image10541.jpg`
5. **Original Resolution:** Native 300×300 pixels, single-channel B-mode grayscale stored as 3-channel JPEG.
6. **Target Variables:**
   - **Task 3A (Morphology):** `Class label (whether polycsytic ovary is visible or not visible)` from `class label.csv`:
     - Positive (`1`): PCOM Visible ($N = 276, 51.02\%$).
     - Negative (`0`): PCOM Not Visible ($N = 265, 48.98\%$).
   - **Task 3B (Systemic Outcome):** `pcos_diagnosis` from linked clinical record (177 positive, 364 negative).
7. **Leakage & Duplicate Hash Audit:**
   - A bit-level SHA-256 hash audit across all 1,468 files revealed 19 duplicate clusters.
   - Development ($N=432$) vs. Frozen Holdout ($N=109$) duplicate images: **Strictly 0**.
   - Three external unlinked duplicate images (`image10716.jpg`, `image10949.jpg`, `image10962.jpg`) matched holdout scans; they were **permanently quarantined** and excluded from all training.

---

## 4.3 Male Hypogonadism Dataset Profile

1. **Exact Dataset Name:** `male_tier1_nhanes_19_60.csv`.
2. **File Location:** `machine-learning/male-ML/male_tier1/data/processed/male_tier1_nhanes_19_60.csv`.
3. **Cryptographic Hash (SHA-256):** `48806ffbddac1999bd646118301dfea102134aebd1eddc96a457b9eae7779953`.
4. **Original Source:** US Centers for Disease Control and Prevention (CDC) National Health and Nutrition Examination Survey (NHANES), combining continuous cycles 2013–2014 and 2015–2016.
5. **Why NHANES Replaced Legacy Data:**  
   The initial workspace dataset `ptestost.xlsx` ($N = 3,390$) was audited and rejected because the minimum age was **45.0 years** (zero patients under 45). CDC NHANES was adopted because it provides verified epidemiological data for adult men across every decade from age 19 to 60.
6. **Demographic Breakdown ($N = 3,575$ Men Aged 19–60):**
   - **Age 19–30:** 1,048 men (17.1% low-T prevalence)
   - **Age 31–40:** 853 men (25.8% low-T prevalence)
   - **Age 41–50:** 826 men (27.2% low-T prevalence)
   - **Age 51–60:** 848 men (26.8% low-T prevalence)
   - **Median Age:** 39.0 years (Range: 19.0 to 60.0).
7. **Supervision Target (`possible_low_testosterone`):**
   - Derived from Serum Total Testosterone (`LBXTST`) measured via CDC certified reference ID-LC-MS/MS (Isotope Dilution Liquid Chromatography-Tandem Mass Spectrometry).
   - Consensus Clinical Guideline Cutoff (American Urological Association / Endocrine Society):
     $$\text{Target} = 1 \quad \text{if Total Testosterone} < 300\text{ ng/dL}, \quad \text{else } 0$$
   - Total Positives: 851 men (23.80%).
   - Total Negatives: 2,724 men (76.20%).
   - Imbalance Ratio: 3.20 : 1.
8. **Partitioning Strategy (Seed 42):**
   - **Training Set (80%):** $N = 2,860$ ($681$ low-T, $2,179$ normal T).
   - **Test Set (20%):** $N = 715$ ($170$ low-T, $545$ normal T).

---

# SECTION 5: FEATURE DICTIONARIES AND LEAKAGE EXCLUSIONS

## 5.1 Female Tier 1 Feature Dictionary (16 Non-Invasive Features)

| Feature Name | Clinical Description | Data Type | Units | Original Column in Dataset | Acquisition Mode | Clinical Relevance in PCOS |
| :--- | :--- | :---: | :---: | :--- | :--- | :--- |
| `age` | Patient chronological age | Numeric | Years | `Age (yrs)` | Self-reported | Typical onset during peak reproductive years (late teens to 20s). |
| `weight_kg` | Body weight | Numeric | kg | `Weight (Kg)` | Self-reported scale | Marker of metabolic adiposity. |
| `height_cm` | Standing height | Numeric | cm | `Height(Cm) ` | Self-reported | Anthropometric scaling baseline. |
| `bmi` | Body Mass Index | Numeric | $\text{kg/m}^2$ | `BMI` | Deterministic derived | Strongly associated with insulin resistance and hyperandrogenism. |
| `cycle_regularity` | Menstrual cycle regularity | Binary | 0/1 | `Cycle(R/I)` | Menstrual history | Primary symptom (Rotterdam Criterion 1: oligo/amenorrhea). |
| `cycle_length_raw`| Duration of menstrual bleeding | Numeric | Days | `Cycle length(days)` | Menstrual log | Prolonged bleeding duration correlates with ovulatory dysfunction. |
| `hip_inch` | Circumference at widest hip | Numeric | Inches | `Hip(inch)` | Tape measurement | Body fat distribution marker. |
| `waist_inch` | Circumference at natural waist | Numeric | Inches | `Waist(inch)` | Tape measurement | Central visceral adiposity marker. |
| `waist_hip_ratio`| Waist-to-Hip Ratio | Numeric | Ratio | `Waist:Hip Ratio` | Deterministic derived | WHR $> 0.85$ indicates central visceral adiposity and metabolic risk. |
| `weight_gain` | Rapid unexplained weight gain | Binary | 0/1 | `Weight gain(Y/N)` | Self-reported toggle | Common secondary metabolic symptom of insulin resistance. |
| `hirsutism` | Excess coarse facial/body hair | Binary | 0/1 | `hair growth(Y/N)` | Self-reported toggle | Clinical sign of hyperandrogenism (Rotterdam Criterion 2). |
| `skin_darkening` | Acanthosis nigricans on neck/folds| Binary | 0/1 | `Skin darkening (Y/N)`| Self-reported toggle | Direct dermatological manifestation of severe hyperinsulinemia. |
| `hair_loss` | Androgenic scalp alopecia | Binary | 0/1 | `Hair loss(Y/N)` | Self-reported toggle | Hyperandrogenic follicle miniaturization. |
| `pimples_acne` | Persistent moderate/severe acne | Binary | 0/1 | `Pimples(Y/N)` | Self-reported toggle | Sebaceous gland stimulation from circulating free androgens. |
| `fast_food` | Frequent processed food intake | Binary | 0/1 | `Fast food (Y/N)` | Lifestyle questionnaire | High glycemic index diet exacerbating glycemic variability. |
| `regular_exercise`| Consistent weekly exercise | Binary | 0/1 | `Reg.Exercise(Y/N)` | Lifestyle questionnaire | Physical activity increases skeletal muscle insulin sensitivity. |

---

## 5.2 Female Tier 2 Cumulative Features (32 Features)

Inherits all 16 Tier 1 features plus the following 16 clinical vitals and laboratory assays:

| Feature Name | Clinical Description | Units | Original Column Name | Clinical Relevance |
| :--- | :--- | :---: | :--- | :--- |
| `pulse_rate_bpm` | Resting pulse rate | bpm | `Pulse rate(bpm) ` | Autonomic and cardiovascular basal evaluation. |
| `respiratory_rate` | Resting respiratory rate | breaths/min | `RR (breaths/min)` | Baseline physical vital sign. |
| `hemoglobin` | Blood hemoglobin concentration | g/dL | `Hb(g/dl)` | Evaluated for anemia secondary to menorrhagia. |
| `beta_hcg_i` | Serum Beta-hCG (Assay 1) | mIU/mL | `  I   beta-HCG(mIU/mL)` | Rules out early pregnancy in amenorrheic patients. |
| `beta_hcg_ii` | Serum Beta-hCG (Assay 2) | mIU/mL | `II    beta-HCG(mIU/mL)` | Confirmatory pregnancy rule-out assay. |
| `fsh` | Follicle-Stimulating Hormone | mIU/mL | `FSH(mIU/mL)` | Pituitary gonadotropin governing follicular recruitment. |
| `lh` | Luteinizing Hormone | mIU/mL | `LH(mIU/mL)` | Pituitary gonadotropin; elevated in premature LH surges. |
| `fsh_lh_ratio` | FSH to LH Ratio | Ratio | `FSH/LH` | Reversal of normal $2:1$ FSH:LH ratio ($LH > FSH$) is a classic hallmark. |
| `tsh` | Thyroid Stimulating Hormone | mIU/L | `TSH (mIU/L)` | Rules out primary hypothyroidism mimicking PCOS symptoms. |
| `amh` | Anti-Müllerian Hormone | ng/mL | `AMH(ng/mL)` | Secreted by pre-antral follicles; surrogate marker for follicle count. |
| `prolactin` | Serum Prolactin | ng/mL | `PRL(ng/mL)` | Rules out hyperprolactinemia / pituitary prolactinoma. |
| `vitamin_d3` | 25-Hydroxy Vitamin D3 | ng/mL | `Vit D3 (ng/mL)` | Hypovitaminosis D exacerbates ovulatory arrest and insulin resistance. |
| `progesterone` | Serum Luteal Progesterone | ng/mL | `PRG(ng/mL)` | Low mid-luteal levels confirm anovulation. |
| `rbs` | Random Blood Sugar | mg/dL | `RBS(mg/dl)` | Identifies impaired glucose tolerance and diabetes comorbidity. |
| `bp_systolic` | Systolic blood pressure | mmHg | `BP _Systolic (mmHg)` | Cardiometabolic vascular risk parameter. |
| `bp_diastolic` | Diastolic blood pressure | mmHg | `BP _Diastolic (mmHg)` | Vascular tone and diastolic pressure parameter. |

---

## 5.3 Features Excluded from Female Tiers Due to Data Leakage

| Excluded Column | Leakage Classification | Reason for Exclusion |
| :--- | :--- | :--- |
| `Sl. No` | **Identifier Leakage** | Database index (1–541); risk of spurious patient order memorization. |
| `Patient File No.` | **Identifier Leakage** | Hospital record ID (1–541); administrative metadata. |
| `Follicle No. (L)` | **Diagnostic Criterion Leakage** | TVS follicle count ($\ge 12-20$) is Rotterdam Criterion 3. Including it creates trivial tree splits ($>10$) and causes model collapse if ultrasound is absent. |
| `Follicle No. (R)` | **Diagnostic Criterion Leakage** | Right ovary TVS follicle count. Same diagnostic overlap mechanism. |
| `Avg. F size (L/R)` | **Diagnostic Proxy Leakage** | Antral follicle diameter measured via ultrasound; unavailable at early triage. |
| `Endometrium (mm)` | **Diagnostic Proxy Leakage** | Endometrial stripe thickness measured via transvaginal pelvic ultrasound. |
| `Unnamed: 44` | **Spreadsheet Formatting Artifact**| Empty column (539 NaNs) with two formatting typos (`.` and `7`). |
| `Blood Group` | **No Biological Plausibility** | ABO blood group encoding key (11–18); uncorrelated with PCOS ($p > 0.40$). |
| `Marraige Status (Yrs)`| **Demographic Inapplicability** | Recorded in fertility clinics; inapplicable to unmarried users seeking screening. |

---

## 5.4 Male Tier 1 Feature Dictionary (11 Features)

| Feature Name | Clinical Description | Data Type | Units | Source Variable in NHANES |
| :--- | :--- | :---: | :---: | :--- |
| `age` | Chronological age | Numeric | Years | `RIDAGEYR` (Ages 19–60) |
| `height_cm` | Standing height | Numeric | cm | `BMXHT` |
| `weight_kg` | Body weight | Numeric | kg | `BMXWT` |
| `bmi` | Body Mass Index | Numeric | $\text{kg/m}^2$ | `BMXBMI` |
| `waist_cm` | Waist circumference at iliac crest | Numeric | cm | `BMXWAIST` |
| `low_energy` | Frequency of low energy / fatigue | Ordinal/Binary | 0–3 $\rightarrow$ 0/1 | `DPQ040` (PHQ-9 fatigue item) |
| `sleep_trouble` | Post-dinner sleepiness / insomnia | Ordinal/Binary | 0–3 $\rightarrow$ 0/1 | `DPQ030` (PHQ-9 sleep item) |
| `low_mood` | Feeling down, depressed, hopeless | Ordinal/Binary | 0–3 $\rightarrow$ 0/1 | `DPQ020` (PHQ-9 mood item) |
| `low_interest` | Reduced libido / anhedonia | Ordinal/Binary | 0–3 $\rightarrow$ 0/1 | `DPQ010` (PHQ-9 interest item) |
| `high_blood_pressure`| Ever diagnosed with hypertension | Binary | 0/1 | `BPQ020` |
| `diabetes` | Ever diagnosed with diabetes | Binary | 0/1 | `DIQ010` |

*Candidate 7-Feature Model (`Male-ML-T1-Clean7`):* Retains the 7 strictly objective variables (`age`, `height_cm`, `weight_kg`, `bmi`, `waist_cm`, `high_blood_pressure`, `diabetes`) and removes the 4 subjective self-report symptom questions.

---

## 5.5 Male Tier 2 Feature Dictionary (16 Features)

| Feature Name | Clinical Description | Units | Source in NHANES | Biological Rationale |
| :--- | :--- | :---: | :--- | :--- |
| `shbg_nmol_l` | Sex Hormone-Binding Globulin | nmol/L | `LBXSHBG` | **#1 Predictor (38.05% Gini Importance).** Primary carrier protein; suppressed by hyperinsulinemia and visceral adiposity. |
| `estradiol_pg_ml` | Serum Estradiol ($E_2$) | pg/mL | `LBXEST` | Aromatase activity marker; aromatization in adipose tissue converts testosterone to estrogen. |
| `albumin_g_dl` | Serum Albumin | g/dL | `LBDSALSI` | Secondary non-specific circulating testosterone carrier. |
| `hba1c_pct` | Glycated Hemoglobin | % | `LBXGH` | Long-term glycemic regulation; diabetes impairs hypothalamic GnRH pulsatility. |
| `glucose_mg_dl` | Fasting / Random Glucose | mg/dL | `LBDSGLSI` | Acute glycemic status; glucose loads transiently suppress LH secretion. |
| `hemoglobin_g_dl` | Hemoglobin | g/dL | `LBXHGB` | Testosterone directly stimulates renal erythropoietin; low T causes borderline normocytic anemia. |
| `hematocrit_pct` | Hematocrit | % | `LBXHCT` | Red blood cell volume percentage; erythropoietic response marker. |
| `rbc_count` | Red Blood Cell Count | $10^6/\mu\text{L}$ | `LBXRBCSI` | Hematopoietic status indicator. |
| `alt_u_l` | Alanine Aminotransferase | U/L | `LBXSATSI` | Hepatic transaminase; hepatic steatosis suppresses hepatic SHBG synthesis. |
| `ast_u_l` | Aspartate Aminotransferase | U/L | `LBXSASSI` | Hepatic function biomarker. |
| `total_bilirubin_mg_dl`| Total Bilirubin | mg/dL | `LBXSTB` | Hepatic heme breakdown parameter. |
| `creatinine_mg_dl`| Serum Creatinine | mg/dL | `LBXSCR` | Renal clearance and muscle mass indicator. |
| `bun_mg_dl` | Blood Urea Nitrogen | mg/dL | `LBXSBU` | Renal nitrogenous waste parameter. |
| `uric_acid_mg_dl` | Serum Uric Acid | mg/dL | `LBXSUA` | Elevated in metabolic syndrome and insulin resistance. |
| `hdl_mg_dl` | HDL Cholesterol | mg/dL | `LBDHDD` | Dyslipidemia marker; low HDL is a core metabolic syndrome criterion. |
| `age` | Chronological Age | Years | `RIDAGEYR` | Natural progressive Leydig cell decline (~1% per year after age 30). |

*Critical Excluded Target Leakage:* `LBXTST` (Serum Total Testosterone) and `cFT` (Calculated Free Testosterone) were **100% excluded** from the input feature matrix.

---

# SECTION 6: EXPLORATORY DATA ANALYSIS (EDA) AND DATA QUALITY

### 6.1 Female PCOS EDA Findings
1. **Missing Data Analysis:**
   - Primary sheet `Full_new` contains 45 columns and 541 rows.
   - 43 columns have **0 missing values** (100% complete).
   - Only 2 columns have missing values: `Marraige Status (Yrs)` (1 missing value) and `Fast food (Y/N)` (1 missing value).
   - Both were imputed using training-fold median/mode.
2. **Outlier Detection:**
   - `beta_hcg_ii` had extreme positive skew with values exceeding $10,000\text{ mIU/mL}$ in pregnant controls.
   - `fsh_lh_ratio` had outliers due to division by near-zero LH levels; handled via median capping and robust tree splitting.
3. **Multicollinearity Checks:**
   - Deterministic pairs verified: `BMI` vs. $\text{Weight}/\text{Height}^2$ ($r = 0.99$), `Waist:Hip Ratio` vs. $\text{Waist}/\text{Hip}$ ($r = 0.98$).
   - Tree-based models (Extra Trees, Random Forest) are invariant to monotonic multicollinearity; however, both raw and derived terms were kept for explicit WHO threshold accessibility.
4. **Target Balance:**
   - 177 PCOS positive (32.72%) vs. 364 negative (67.28%). No extreme rarity ($>10\%$), so standard cross-validation with stratification is statistically stable.

### 6.2 Male Hypogonadism EDA Findings
1. **Age vs. Testosterone Relationship:**
   - In NHANES men aged 19–60, testosterone does not drop off a cliff; instead, low-T prevalence rises from **17.1% (ages 19–30)** to **25.8% (ages 31–40)**, **27.2% (ages 41–50)**, and stabilizes at **26.8% (ages 51–60)**.
2. **Adiposity as the Dominant Driver:**
   - Waist circumference (`waist_cm`) was the single strongest correlate of low testosterone ($r = -0.38, p < 10^{-15}$), outperforming chronological age.
   - Visceral adipose tissue expresses aromatase enzyme, which metabolizes testosterone into estradiol, suppressing hypothalamic LH release.
3. **Missing Value Structure:**
   - Biometrics (height, weight, waist) had $< 1.5\%$ missingness in NHANES exam records.
   - Laboratory panels (SHBG, Estradiol) had complete assays in the morning examination sub-sample.
   - Imputed strictly using training-fold medians via scikit-learn `SimpleImputer`.

---

# SECTION 7: PREPROCESSING AND FEATURE ENGINEERING

### 7.1 Preprocessing Transformations by Tier

| Operation | Female Tier 1 & Tier 2 | Male Tier 1 | Male Tier 2 | Why It Matters |
| :--- | :--- | :--- | :--- | :--- |
| **Missing Imputation** | `SimpleImputer(strategy='median')` for numeric; `strategy='most_frequent'` for binary. | `SimpleImputer(strategy='median')` | `SimpleImputer(strategy='median')` | Prevents runtime failure when users omit optional inputs. |
| **Scaling** | `StandardScaler()` applied inside Pipeline. | `StandardScaler()` inside Pipeline. | `StandardScaler()` inside Pipeline. | Required for Logistic Regression gradient descent; regularizes tree initializations. |
| **Binary Normalization** | Mapped to $1.0$ (Yes/True) and $0.0$ (No/False). | Mapped to $1.0$ / $0.0$. | Not applicable (all continuous labs). | Standardizes heterogeneous frontend JSON types. |
| **Derived Features** | BMI ($\text{kg/m}^2$) and Waist-Hip Ratio ($\text{waist}/\text{hip}$). | BMI calculated if missing; Waist-to-Height ratio. | No manual ratios; raw analytes preserved. | Captures non-linear body fat distribution metrics. |

### 7.2 Strict Leakage-Free Preprocessing Protocol

```
Full Dataset (N=541 or N=3,575)
       │
       ▼ Stratified 80/20 Partition (Seed 42)
┌──────────────────────────────────────┐       ┌──────────────────────────────────────┐
│       TRAINING / DEV FOLDS (80%)     │       │         FROZEN HOLDOUT (20%)         │
│  - Compute Medians (\hat{\mu}_train) │       │  - Zero stats computed here!         │
│  - Compute Scales (\hat{\sigma}_train│       │  - Transformed using \hat{\mu}_train │
│  - Fit Pipeline Transformers         │──────>│    and \hat{\sigma}_train            │
│  - Fit Model Estimators              │       │  - Evaluated exactly ONCE            │
└──────────────────────────────────────┘       └──────────────────────────────────────┘
```

> [!CAUTION]
> **Viva Defense Point:** Preprocessing parameters ($\mu, \sigma$, medians) were **NEVER fitted on the full dataset before splitting**. They were fitted strictly inside training folds using scikit-learn `Pipeline`. Doing otherwise constitutes statistical data leakage.

---

# SECTION 8: PRINCIPAL COMPONENT ANALYSIS (PCA) AUDIT

> [!IMPORTANT]
> **AUDIT VERDICT:**  
> **PCA was NOT used in the verified production pipeline or in any finalized experimental model.**

### Why Was PCA Not Used?
1. **Clinical Interpretability Requirement:** PCA projects original, biologically meaningful features (such as `shbg_nmol_l`, `cycle_regularity`, `amh`) into orthogonal linear combinations (principal components $PC_1, PC_2, \dots, PC_k$). In a medical screening tool, explaining that a patient's risk is elevated because *"0.42 × PC1 - 0.18 × PC2 is high"* is clinically useless to doctors and patients.
2. **SHAP Explainability Invariance:** The system requires patient-centered explanations where each feature has an attributable risk contribution in everyday terms (e.g., *"Irregular cycles added +14% to your risk"*). TreeSHAP and LinearSHAP require the original feature space.
3. **Low Dimensionality:** With only 16 to 32 features, the models do not suffer from the "Curse of Dimensionality" ($p \ll N$, where $32 \ll 432$). Dimensionality reduction techniques like PCA are unnecessary when sample sizes are an order of magnitude larger than the feature space.
4. **Non-Linear Interactions:** PCA captures linear variance. Tree-based ensembles (Extra Trees, Random Forest) natively capture non-linear threshold effects and high-order interactions without requiring linear projection.

### Difference Between PCA, Feature Selection, and Feature Engineering

| Technique | Mathematical Principle | Modifies Feature Space? | Preserves Interpretability? | Used in BioPulse AI? |
| :--- | :--- | :---: | :---: | :---: |
| **PCA** | Linear projection onto orthogonal eigenvectors of the covariance matrix maximizing explained variance. | Yes (Creates new synthetic axes) | **No** (Mixes all variables together) | **NO** |
| **Feature Selection** | Subsetting original variables based on clinical criteria, correlation filtering, or tree feature importances. | No (Keeps subset of original axes) | **Yes** (Original variables preserved) | **YES** (Excluded TVS follicles & Total T) |
| **Feature Engineering** | Mathematical derivation of domain-specific indicators (e.g., $\text{BMI} = \text{weight}/\text{height}^2$, $\text{FSH/LH}$). | Yes (Adds explicit domain columns) | **Yes** (Direct physiological meaning) | **YES** (BMI, WHR, FSH/LH ratio) |

---

# SECTION 9: TRAINING STRATEGY, CROSS-VALIDATION, AND MODEL SELECTION

### 9.1 Cross-Validation and Splitting Protocols

| Parameter | Female PCOS (Tier 1 & Tier 2) | Male Hypogonadism (Tier 1 & Tier 2) |
| :--- | :--- | :--- |
| **Train / Test Split Ratio** | 80% Development ($N=432$) / 20% Holdout ($N=109$) | 80% Train ($N=2,860$) / 20% Test ($N=715$) |
| **Splitting Method** | Stratified Shuffle Split (`random_state = 42`) | Stratified Shuffle Split (`random_state = 42`) |
| **Cross-Validation Scheme** | 5-Fold Stratified CV (repeated 3 times = 15 folds for benchmark) | 5-Fold Stratified Cross-Validation |
| **Patient-Wise Independence** | Guaranteed (1 row = 1 unique patient; zero clustering) | Guaranteed (1 row = 1 unique NHANES participant) |
| **Holdout Integrity** | **Untouched holdout:** Frozen until after model & threshold selection | **Untouched test:** Frozen until after model & threshold selection |

---

### 9.2 Algorithm Benchmark and Selection Rationale

#### Female Tier 1 Model Selection (Development 5-Fold CV, $N = 432$)

| Candidate Algorithm | Mean ROC-AUC | Mean PR-AUC | Mean F1 | Mean Brier | Selection Verdict |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **Extra Trees (Unweighted)** | **$0.8863 \pm 0.0274$** | **$0.8152 \pm 0.0458$** | 0.7288 | **0.1246** | **CHAMPION (Selected for Production)** |
| **Random Forest (Balanced)** | $0.8820 \pm 0.0288$ | $0.8129 \pm 0.0503$ | **0.7492** | 0.1307 | Challenger (Higher variance) |
| **Random Forest (Unweighted)** | $0.8814 \pm 0.0289$ | $0.8116 \pm 0.0457$ | 0.7309 | 0.1264 | Challenger |
| **XGBoost (Unweighted)** | $0.8777 \pm 0.0350$ | $0.8075 \pm 0.0510$ | 0.7165 | 0.1243 | Challenger |
| **Logistic Regression (Unweighted)**| $0.8752 \pm 0.0296$ | $0.8089 \pm 0.0593$ | 0.7353 | 0.1230 | Linear Baseline |

*Why Extra Trees Won for Female Tier 1:*  
Extra Trees (Extremely Randomized Trees) randomizes both feature subsets AND split thresholds for each candidate feature. This extreme randomization provides stronger variance reduction than standard Random Forest, yielding the highest ROC-AUC ($0.8863$) and lowest fold-to-fold standard deviation ($0.0274$), making it less prone to overfitting on small clinical datasets ($N=432$).

---

#### Male Tier 1 Model Selection (Development 5-Fold CV, $N = 2,860$)

| Candidate Algorithm | Mean ROC-AUC | Mean PR-AUC | Default Recall | Mean Brier | Selection Verdict |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **Logistic Regression (Balanced)** | **$0.7225 \pm 0.0295$** | **0.4661** | 62.1% | 0.2106 | **CHAMPION (Selected for Production)** |
| **Random Forest (Balanced)** | $0.7141 \pm 0.0264$ | 0.4626 | **62.8%** | 0.2083 | Challenger |
| **HistGradientBoosting** | $0.6897 \pm 0.0218$ | 0.4278 | 58.1% | **0.2078** | Challenger |

*Why Logistic Regression Won for Male Tier 1:*  
In Tier 1, inputs are low-dimensional self-reported symptoms and basic anthropometrics. Non-linear tree ensembles overfit noisy questionnaire responses. Logistic Regression demonstrated superior generalization ($0.7225$ vs $0.7141$), produced smooth monotonic log-odds, and naturally integrated with LinearSHAP for transparent clinical odds ratios.

---

#### Male Tier 2 Model Selection (Development 5-Fold CV, $N = 2,860$)

| Candidate Algorithm | Mean ROC-AUC | Mean PR-AUC | Default Recall | Mean Brier | Selection Verdict |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **Random Forest (100 Trees)** | **$0.8521 \pm 0.0120$** | 0.6639 | 76.95% | 0.1576 | **CHAMPION (Selected for Production)** |
| **XGBoost (Balanced)** | $0.8490 \pm 0.0120$ | 0.6616 | 74.01% | **0.1460** | Challenger |
| **Logistic Regression (L2)** | $0.8487 \pm 0.0133$ | **0.6674** | **80.92%** | 0.1609 | Challenger |
| **Extra Trees Classifier** | $0.8407 \pm 0.0083$ | 0.6332 | 76.07% | 0.2070 | Challenger |

*Why Random Forest Won for Male Tier 2:*  
In Tier 2, complex metabolic interactions exist between carrier proteins (SHBG), sex steroids (Estradiol), and glycemic indices (HbA1c, Glucose). Random Forest captured these biological interactions without target leakage, achieving the highest cross-validation discrimination ($0.8521$) and holdout discrimination ($0.8742$).

---

# SECTION 10: COMPLETE EVALUATION METRICS FOR EVERY TIER

### 10.1 Master Production Metrics Table

| Model & Tier | Dataset Partition | Accuracy | Sensitivity (Recall) | Specificity | Precision (PPV) | NPV | F1-Score | ROC-AUC | PR-AUC | Brier Score | Operating Threshold ($\tau$) | Sample Count ($N$) |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Female Tier 1** | Frozen Holdout | 82.57% | **80.56%** | 83.56% | 70.73% | 89.71% | **0.7532** | **0.8980** | **0.8324** | 0.1121 | $\tau^* = 0.25$ | $N = 109$ |
| **Female Tier 1** | Frozen Holdout | **86.24%** | 69.44% | **94.52%** | **86.21%** | 86.25% | 0.7692 | 0.8980 | 0.8324 | 0.1121 | $\tau = 0.50$ (Default) | $N = 109$ |
| **Female Tier 2** | Frozen Holdout | 81.65% | **77.78%** | 83.56% | 70.00% | 88.41% | **0.7368** | **0.8919** | **0.8243** | 0.1138 | $\tau^* = 0.25$ | $N = 109$ |
| **Female Tier 2** | Frozen Holdout | **85.32%** | 69.44% | **93.15%** | **83.33%** | 86.08% | 0.7576 | 0.8919 | 0.8243 | 0.1138 | $\tau = 0.50$ (Default) | $N = 109$ |
| **Female Tier 3 (PCOM)** | Frozen Holdout | **91.74%** | **98.28%** | 84.31% | 87.69% | **97.73%** | **0.9268** | **0.9199** | **0.9039** | **0.0769** | $\tau = 0.50$ | $N = 109$ |
| **Female Tier 3 (Outcome)**| Frozen Holdout | 66.97% | 0.00% | 100.0% | 0.00% | 66.97% | 0.0000 | 0.5042 | 0.3414 | 0.2205 | $\tau = 0.50$ | $N = 109$ |
| **Female Multimodal** | Frozen Holdout | **85.32%** | 69.44% | **93.15%** | **83.33%** | 86.08% | **0.7576** | **0.8927** | **0.8260** | 0.1151 | $\tau = 0.50$ | $N = 109$ |
| **Male Tier 1** | Untouched Test | 53.15% | **80.59%** | 44.59% | 31.21% | **88.00%** | **0.4502** | **0.7044** | **0.4201** | 0.1650 | $t = 0.1808$ | $N = 715$ |
| **Male Tier 1** | Untouched Test | **77.06%** | 14.71% | **96.51%** | **56.82%** | 78.39% | 0.2336 | 0.7044 | 0.4201 | 0.1650 | $t = 0.50$ (Default) | $N = 715$ |
| **Male Tier 2** | Untouched Test | **81.12%** | **73.53%** | 83.49% | 58.14% | **91.00%** | **0.6494** | **0.8742** | **0.6723** | **0.1164** | $\tau = 0.3379$ | $N = 715$ |
| **Male Tier 2** | Untouched Test | **83.08%** | 55.29% | **91.74%** | **67.63%** | 86.81% | 0.6084 | 0.8742 | 0.6723 | 0.1164 | $\tau = 0.50$ (Default) | $N = 715$ |

---

# SECTION 11: CONFUSION MATRICES AND MATHEMATICAL FORMULAS

### 11.1 Verified Confusion Matrices

#### A. Female Tier 1 Holdout ($N = 109$, Operating Threshold $\tau^* = 0.25$)

| | Predicted Negative ($p < 0.25$) | Predicted Positive ($p \ge 0.25$) | Total |
| :--- | :---: | :---: | :---: |
| **Actual Negative (No PCOS)** | **$\text{TN} = 61$** | **$\text{FP} = 12$** | 73 |
| **Actual Positive (PCOS)** | **$\text{FN} = 7$** | **$\text{TP} = 29$** | 36 |
| **Total** | 68 | 41 | 109 |

*Comparison with Default Threshold ($\tau = 0.50$):* At $\tau = 0.50$, $\text{TN}=69, \text{FP}=4, \mathbf{FN=11}, \text{TP}=25$. Dropping the threshold to $0.25$ **reduced False Negatives from 11 down to 7** (a $36.4\%$ reduction in missed clinical cases).

---

#### B. Female Tier 2 Holdout ($N = 109$, Operating Threshold $\tau^* = 0.25$)

| | Predicted Negative ($p < 0.25$) | Predicted Positive ($p \ge 0.25$) | Total |
| :--- | :---: | :---: | :---: |
| **Actual Negative (No PCOS)** | **$\text{TN} = 61$** | **$\text{FP} = 12$** | 73 |
| **Actual Positive (PCOS)** | **$\text{FN} = 8$** | **$\text{TP} = 28$** | 36 |
| **Total** | 69 | 40 | 109 |

---

#### C. Female Tier 3 PCOM Image Holdout ($N = 109$, Threshold $\tau = 0.50$)

| | Predicted Negative (No PCOM) | Predicted Positive (PCOM Visible) | Total |
| :--- | :---: | :---: | :---: |
| **Actual Negative** | **$\text{TN} = 43$** | **$\text{FP} = 8$** | 51 |
| **Actual Positive** | **$\text{FN} = 1$** | **$\text{TP} = 57$** | 58 |
| **Total** | 44 | 65 | 109 |

*Highlight:* Notice that for morphological PCOM classification, the model achieved **Sensitivity of 98.28%** ($57 / 58$), with only ONE missed positive case across the entire holdout cohort.

---

#### D. Male Tier 1 Test Set ($N = 715$, Operating Threshold $t = 0.1808$)

| | Predicted Negative ($p < 0.18$) | Predicted Positive ($p \ge 0.18$) | Total |
| :--- | :---: | :---: | :---: |
| **Actual Negative ($T \ge 300$)** | **$\text{TN} = 243$** | **$\text{FP} = 302$** | 545 |
| **Actual Positive ($T < 300$)** | **$\text{FN} = 33$** | **$\text{TP} = 137$** | 170 |
| **Total** | 276 | 439 | 715 |

*Clinical Trade-Off:* By operating at $t=0.1808$ rather than $0.50$, **True Positives increased from 25 to 137** (Sensitivity jumped from $14.7\%$ to $80.6\%$). The cost is $302$ False Positives triaged for confirmatory morning blood tests.

---

#### E. Male Tier 2 Test Set ($N = 715$, Operating Threshold $\tau = 0.3379$)

| | Predicted Negative ($p < 0.34$) | Predicted Positive ($p \ge 0.34$) | Total |
| :--- | :---: | :---: | :---: |
| **Actual Negative ($T \ge 300$)** | **$\text{TN} = 455$** | **$\text{FP} = 90$** | 545 |
| **Actual Positive ($T < 300$)** | **$\text{FN} = 45$** | **$\text{TP} = 125$** | 170 |
| **Total** | 500 | 215 | 715 |

*Highlight:* High Negative Predictive Value of **91.0%** ($455 / 500$). If Male Tier 2 screens negative, the patient has a $91\%$ probability of having normal testosterone.

---

### 11.2 Evaluation Metric Mathematical Formulas & Worked Examples

Using the **Female Tier 1 Holdout** counts ($\text{TP}=29, \text{TN}=61, \text{FP}=12, \text{FN}=7$):

#### 1. Sensitivity (Recall / True Positive Rate)
$$\text{Sensitivity} = \frac{\text{TP}}{\text{TP} + \text{FN}} = \frac{29}{29 + 7} = \frac{29}{36} = \mathbf{0.8056 \quad (80.56\%)}$$
- *What it measures:* The proportion of actual positive cases correctly identified by the model.
- *Clinical Importance:* **Most critical screening metric.** A low sensitivity means patients with PCOS or low testosterone are missed and sent home without medical guidance.

#### 2. Specificity (True Negative Rate)
$$\text{Specificity} = \frac{\text{TN}}{\text{TN} + \text{FP}} = \frac{61}{61 + 12} = \frac{61}{73} = \mathbf{0.8356 \quad (83.56\%)}$$
- *What it measures:* The proportion of healthy controls correctly identified as low risk.
- *Clinical Importance:* Prevents overwhelming healthcare clinics with unnecessary confirmatory diagnostic workups.

#### 3. Positive Predictive Value (Precision)
$$\text{Precision} = \frac{\text{TP}}{\text{TP} + \text{FP}} = \frac{29}{29 + 12} = \frac{29}{41} = \mathbf{0.7073 \quad (70.73\%)}$$
- *What it measures:* When the model flags a patient as "Higher Likelihood", how often is that patient actually positive?

#### 4. Negative Predictive Value (NPV)
$$\text{NPV} = \frac{\text{TN}}{\text{TN} + \text{FN}} = \frac{61}{61 + 7} = \frac{61}{68} = \mathbf{0.8971 \quad (89.71\%)}$$
- *What it measures:* When the screener reassures a user that they are "Lower Likelihood", how confident can they be?
- *Clinical Importance:* High NPV ($>88\%-91\%$) is vital for pre-clinical reassurance.

#### 5. Accuracy & Why It Fails in Imbalanced Screening
$$\text{Accuracy} = \frac{\text{TP} + \text{TN}}{\text{TP} + \text{TN} + \text{FP} + \text{FN}} = \frac{29 + 61}{109} = \frac{90}{109} = \mathbf{0.8257 \quad (82.57\%)}$$
> [!WARNING]
> **Viva Trap:** In an imbalanced cohort (e.g., 80% negative, 20% positive), a naive dummy classifier that always predicts "Negative" achieves **80% accuracy** while having **0% sensitivity** (missing every single sick patient). Therefore, accuracy alone is clinically misleading and unacceptable.

#### 6. F1-Score (Harmonic Mean of Precision and Recall)
$$F_1 = 2 \times \frac{\text{Precision} \times \text{Recall}}{\text{Precision} + \text{Recall}} = 2 \times \frac{0.7073 \times 0.8056}{0.7073 + 0.8056} = \frac{1.1396}{1.5129} = \mathbf{0.7532}$$

#### 7. Matthews Correlation Coefficient (MCC)
$$\text{MCC} = \frac{(\text{TP} \times \text{TN}) - (\text{FP} \times \text{FN})}{\sqrt{(\text{TP}+\text{FP})(\text{TP}+\text{FN})(\text{TN}+\text{FP})(\text{TN}+\text{FN})}}$$
$$\text{MCC} = \frac{(29 \times 61) - (12 \times 7)}{\sqrt{(41)(36)(73)(68)}} = \frac{1769 - 84}{\sqrt{7,314,864}} = \frac{1685}{2704.6} = \mathbf{+0.6230}$$
- *Interpretation:* A correlation coefficient between $-1$ (total disagreement) and $+1$ (perfect prediction). An MCC of $+0.623$ indicates robust predictive quality invariant to class distribution.

#### 8. Brier Score (Mean Squared Probability Error)
$$\text{Brier} = \frac{1}{N} \sum_{i=1}^N (p_i - y_i)^2$$
- *Range:* $0$ (perfect probabilistic forecast) to $1$ (worst possible). A model outputting uniform $0.50$ on a balanced set scores $0.25$.
- *Project Value:* Female Tier 1 achieved **0.1121**; Male Tier 2 achieved **0.1164**. Both reflect well-calibrated posterior probabilities.

---

# SECTION 12: THRESHOLD SELECTION AND PROBABILITY CALIBRATION

### 12.1 Why Does the Model Output Probabilities Instead of 0 or 1?
1. **Medical Spectrum vs. Hard Dichotomy:** Biological conditions exist on a continuous spectrum of risk. A patient with a $49\%$ probability is biologically distinct from a patient with a $2\%$ probability, yet a hard threshold of $0.50$ would classify both as "Negative".
2. **Clinical Triage Flexibility:** Calibrated probabilities allow stratification into clinical risk bands:
   - **Lower Likelihood ($< 18\%$):** Routine lifestyle guidance and reassurance.
   - **Intermediate Likelihood ($18\% - 25\%$):** Advisory monitoring and symptom tracking.
   - **Higher Likelihood ($\ge 25\%$):** Priority triage for confirmatory endocrine workup.

---

### 12.2 Probability Calibration (Platt Sigmoid Scaling)

Standard tree ensembles output uncalibrated voting fractions. A Random Forest leaf vote of $0.80$ often does not mean an $80\%$ empirical risk.

To solve this, BioPulse AI applies **Platt Sigmoid Calibration** (`CalibratedClassifierCV(method='sigmoid', cv=5)`):
$$P(y=1 | f(x)) = \frac{1}{1 + \exp(A \cdot f(x) + B)}$$
Parameters $A$ and $B$ are fitted via maximum likelihood on out-of-fold validation predictions using an internal 5-fold cross-validation scheme.

```
       UNSETTLED ENSEMBLE VOTE                   CALIBRATED RISK PROBABILITY
      ┌─────────────────────────┐               ┌───────────────────────────┐
      │ Raw Tree Vote Fraction  │ ────────────> │ Sigmoid Platt Calibration │ ───> Clinically Reliable Risk %
      │   f(x) in [0.0, 1.0]    │               │ P(y=1|f(x)) = 1/(1+e^Af+B)│      (Brier: 0.1246 -> 0.1121)
      └─────────────────────────┘               └───────────────────────────┘
```

**Brier Score Improvement on Female Tier 1:**
- Uncalibrated Brier Score: $0.1246$
- Calibrated Brier Score: **$0.1214$ (CV) / $0.1121$ (Holdout)**
- Verdict: Monotonic, reliable probabilities without distortion.

---

# SECTION 13: FEMALE TIER 3 — ULTRASOUND AND MULTIMODAL FUSION

### 13.1 The Two Ultrasound Tasks (Critical Viva Distinction)

```
                                  PELVIC B-MODE ULTRASOUND
                                 (EfficientNet-B0 Backbone)
                                             │
                     ┌───────────────────────┴───────────────────────┐
                     ▼                                               ▼
         TASK 3A: PCOM MORPHOLOGY                       TASK 3B: CLINICAL PCOS OUTCOME
         Target: Polycystic Ovaries                      Target: Systemic PCOS Diagnosis
         Holdout ROC-AUC: 0.9199                         Holdout ROC-AUC: 0.5042
         Sensitivity:     98.28%                         Sensitivity:     0.00%
         Specificty:      84.31%                         Specificity:     100.0%
         F1-Score:        0.9268                         F1-Score:        0.0000
         VERDICT: HIGHLY ACCURATE                        VERDICT: CHANCE LEVEL (NO SIGNAL)
```

> [!IMPORTANT]
> **How to Defend the Ultrasound Paradox:**  
> **Examiner Question:** *"Why does your deep learning model have 91.99% ROC-AUC for PCOM, but 50.42% for PCOS?"*  
> **Student Answer:**  
> *"Because PCOM is a physical morphological feature of the ovary that is visually observable on ultrasound, whereas PCOS is a systemic endocrine disorder defined by the Rotterdam consensus (requiring 2 of 3 criteria). Approximately 20% to 30% of completely healthy women have polycystic-appearing ovaries without having PCOS, and many women with clinical PCOS have normal-appearing ovaries. Therefore, an ultrasound image alone cannot diagnose systemic PCOS. Our architecture correctly decouples morphological feature detection (Task 3A) from systemic clinical risk stratification."*

---

### 13.2 The Multimodal Fusion Architecture

Production implementation in `pcos_ml_service.py`:

```python
# Weighted Multimodal Fusion Policy:
# Final probability = 0.95 * tier2_clinical_probability + 0.05 * tier3_ultrasound_pcos_probability
if is_valid_us_prob:
    p_fused = max(0.0, min(1.0, 0.95 * p_t2 + 0.05 * p_us))
    multimodal_fusion_applied = True
else:
    # Safe fallback if ultrasound is unreadable or fails
    p_fused = p_t2
    multimodal_fusion_applied = False
```

#### Incremental Holdout Benefit of Adding Ultrasound to Tier 2:
- Clinical Baseline Alone (Tier 2): $\text{ROC-AUC} = 0.8919, \text{PR-AUC} = 0.8243$
- Multimodal Fusion ($95/5$): $\text{ROC-AUC} = 0.8927, \text{PR-AUC} = 0.8260$
- Incremental Delta: $\Delta\text{ROC-AUC} = \mathbf{+0.0008}$, $\Delta\text{PR-AUC} = \mathbf{+0.0017}$
- Scientific Conclusion: The empirical improvement is tiny, demonstrating that **serum biomarkers and clinical phenotypes carry virtually all the diagnostic signal**.

---

### 13.3 Grad-CAM Attention Heatmaps

- **What Grad-CAM Means:** Gradient-Weighted Class Activation Mapping.
- **How It Works:**
  1. Computes the gradient of the predicted PCOM class score with respect to the feature activation maps of the final convolutional layer (`model.features[-1]`).
  2. Pools the gradients across spatial dimensions to calculate importance weights $\alpha_k$.
  3. Computes a weighted sum of activation maps followed by a $\text{ReLU}$ non-linearity to isolate positive contributing features:
     $$L_{\text{Grad-CAM}} = \text{ReLU}\left(\sum_k \alpha_k A^k\right)$$
  4. Blends the Jet colormap onto the raw 224×224 ultrasound image using OpenCV (`cv2.addWeighted`).
- **What It Represents:** Highlights regions of follicular clustering in the ovarian stroma (the classic "string of pearls" sign). It visualizes model attention, providing transparent AI interpretability without claiming autonomous diagnostic proof.

---

# SECTION 14: MALE HYPOGONADISM MACHINE LEARNING & RULE LAYER

### 14.1 Male Architecture Overview

```
                                  USER MALE INTAKE
                                         │
                 ┌───────────────────────┴───────────────────────┐
                 ▼                                               ▼
       TIER 1: SCREENING MODEL                         TIER 2: LABORATORY MODEL
   - Inputs: 11 Biometrics/Symptoms                - Inputs: 16 Non-Leaking Labs
   - Model: Balanced Logistic Regression           - Model: Calibrated Random Forest
   - Threshold: 0.1808                             - Threshold: 0.3379
   - Test ROC-AUC: 0.7044                          - Test ROC-AUC: 0.8742
   - Test Sensitivity: 80.59%                      - Test Sensitivity: 73.53%
   - Test Specificity: 44.59%                      - Test Specificity: 83.49%
                 │                                               │
                 └───────────────────────┬───────────────────────┘
                                         ▼
                 ┌───────────────────────────────────────────────┐
                 │       RULE-BASED HORMONAL PATTERN LAYER       │
                 │   Evaluates: Total T, LH, FSH, Prolactin      │
                 │   - Primary Hypogonadism (High LH/FSH)        │
                 │   - Secondary Hypogonadism (Normal/Low LH/FSH)│
                 │   - Prolactin-Related Pattern                 │
                 │   - Clear Educational Phrasing (Not Diagnosis)│
                 └───────────────────────────────────────────────┘
```

### 14.2 The Rule-Based Hormonal Pattern Layer

Primary and secondary hypogonadism are **NOT modeled as machine learning classification targets**. Instead, a deterministic clinical expert rule layer evaluates pituitary gonadotropins:

1. **Primary Pattern (Testicular Origin):**
   $$\text{Total } T < 300\text{ ng/dL} \quad \text{AND} \quad (\text{LH} > 8.6\text{ mIU/mL} \quad \text{OR} \quad \text{FSH} > 12.4\text{ mIU/mL})$$
   *Plain-Language Feedback:* "Your brain is sending strong signals (high LH/FSH) to produce testosterone, but production in the body remains low."
2. **Secondary Pattern (Hypothalamic/Pituitary Origin):**
   $$\text{Total } T < 300\text{ ng/dL} \quad \text{AND} \quad (\text{LH} \le 8.6\text{ mIU/mL} \quad \text{AND} \quad \text{FSH} \le 12.4\text{ mIU/mL})$$
   *Plain-Language Feedback:* "Both testosterone and brain signal hormones are low or normal, suggesting brain signaling or lifestyle factors (sleep, stress, metabolic health) are involved."
3. **Prolactin Pattern:**
   $$\text{Total } T < 300\text{ ng/dL} \quad \text{AND} \quad \text{Prolactin} > 15.0\text{ ng/mL}$$
   *Plain-Language Feedback:* "Elevated prolactin can suppress testosterone production. A healthcare provider should evaluate medications or thyroid interactions."

---

# SECTION 15: SHAP (SHAPLEY ADDITIVE EXPLANATIONS)

### 15.1 Mathematical Foundation of SHAP

SHAP values are rooted in cooperative game theory (Lloyd Shapley, 1953). In our clinical screening models:
- The "players" are the clinical features $x_i$.
- The "payout" is the model prediction $f(x)$.
- The Shapley value $\phi_i$ represents the unique marginal contribution of feature $i$ across all possible feature subsets $S \subseteq F \setminus \{i\}$:

$$\phi_i(x) = \sum_{S \subseteq F \setminus \{i\}} \frac{|S|! (|F| - |S| - 1)!}{|F|!} \left[ f(S \cup \{i\}) - f(S) \right]$$

---

### 15.2 Five-Fold Calibrated SHAP Architecture (`shap_adapter.py`)

Because our production models use `CalibratedClassifierCV` with 5 internal folds, calculating SHAP on a single arbitrary fold would produce biased explanations. BioPulse AI implements `FoldAwareCalibratedExplainer`:

1. **Iterates over all 5 internal estimators** of the calibrated ensemble.
2. **Computes local SHAP attributions** for each fold: $\phi_i^{(k)}$ for $k \in \{1, 2, 3, 4, 5\}$.
3. **Averages attributions across folds**:
   $$\bar{\phi}_i = \frac{1}{5} \sum_{k=1}^5 \phi_i^{(k)}$$
4. **Verifies Additivity Invariant**:
   $$\left| \bar{\phi}_0 + \sum_{i=1}^M \bar{\phi}_i - \bar{f}(x) \right| < 10^{-5}$$
5. **Computes Direction Stability**: Tracks the percentage of folds that agree on whether the feature pushed risk UP or DOWN. If all 5 folds agree, stability is $100\%$. If folds disagree, this uncertainty is flagged rather than hidden.

---

### 15.3 SHAP vs. LIME — Why BioPulse AI Chose SHAP

| Property | SHAP (Shapley Additive Explanations) | LIME (Local Interpretable Model-agnostic Explanations) | Why BioPulse AI Chose SHAP |
| :--- | :--- | :--- | :--- |
| **Theoretical Foundation** | Axiomatic Game Theory (Shapley Values) | Local linear surrogate perturbations | **SHAP guarantees mathematical consistency.** |
| **Efficiency (Additivity)** | $\sum \phi_i = f(x) - E[f(x)]$ strictly holds. | No mathematical additivity guarantee. | **Essential for reliable risk waterfall plots.** |
| **Consistency Axiom** | If a model changes so feature $i$ contributes more, $\phi_i$ never decreases. | Inconsistent; different random seeds yield different explanations. | **Crucial for medico-legal reproducibility.** |
| **Tree Exploitation** | Exact polynomial-time evaluation via TreeSHAP ($O(T L D^2)$). | Slow sampling perturbation ($O(N \cdot M)$). | **TreeSHAP executes in milliseconds in production.** |

---

# SECTION 16: DATA LEAKAGE, OVERFITTING, AND MODEL RELIABILITY

### 16.1 Exhaustive Leakage Prevention Checklist

| Leakage Category | Risk Mechanism | Project Mitigation | Evidence File |
| :--- | :--- | :--- | :--- |
| **Target Leakage** | Including variables that directly encode the outcome. | `PCOS (Y/N)` and `LBXTST` excluded 100% from feature inputs. | `LEAKAGE_ANALYSIS.md`, `male_tier2/reports/dataset_audit.md` |
| **Diagnostic Overlap** | Including formal criteria (TVS follicle counts $\ge 12$). | `Follicle No. (L/R)` completely excluded from Tiers 1 and 2. | `LEAKAGE_ANALYSIS.md` |
| **Identifier Leakage** | Models memorizing row index or file number. | `Sl. No` and `Patient File No.` dropped prior to training. | `DATA_AUDIT.md` |
| **Preprocessing Leakage**| Fitting scalers/imputers across full dataset. | Fitted strictly inside training folds using scikit-learn `Pipeline`. | `train_tier1.py`, `male_tier2/src/train.py` |
| **Holdout Contamination**| Reusing test data during hyperparameter sweeps. | 20% holdout sets frozen and locked until final verification. | `TIER1_TRAINING_REPORT.md` |
| **Image Augmentation** | Augmenting test images before evaluation. | Augmentation applied strictly on training batches via `get_transforms`. | `tier3_image_models.py` |

---

### 16.2 How Do We Know the Models Are Not Overfitting?

1. **Consistent Train vs. Test Generalization:**
   - Female Tier 1: 5-Fold CV ROC-AUC = **0.8863** $\rightarrow$ Holdout ROC-AUC = **0.8980** (Zero collapse).
   - Female Tier 2: 5-Fold CV ROC-AUC = **0.8857** $\rightarrow$ Holdout ROC-AUC = **0.8919** (Zero collapse).
   - Male Tier 2: 5-Fold CV ROC-AUC = **0.8521** $\rightarrow$ Test ROC-AUC = **0.8742** (Slightly higher on test).
2. **Regularized Ensembles:**
   - Extra Trees uses random split thresholds, introducing high variance reduction.
   - Logistic Regression applies L2 weight penalty ($C = 0.2$).
   - Random Forest constrains tree depth (`max_depth = 8`).
3. **Repeated Cross-Validation:** Female Tier 1 was validated across 15 independent folds ($5\text{ folds} \times 3\text{ repeats}$), confirming tight standard deviations ($\text{SD} = 0.0274$).

---

# SECTION 17: END-TO-END ML TRAINING AND INFERENCE PIPELINE

```
                         INFERENCE ARCHITECTURE (RUNTIME)
                         
  1. USER INPUT (Frontend Web / Mobile Form)
     - Female Tier 1 (16 inputs) / Tier 2 (32 inputs) / Ultrasound Scan (.png / .jpg)
     - Male Tier 1 (11 inputs) / Tier 2 (16 lab values)
                         │
                         ▼ REST API Request (POST /api/v1/intelligence/assessment/)
  2. DJANGO INTELLIGENCE ORCHESTRATOR
     - Validates payload against strict clinical schemas
     - Dispatches to singleton services: pcos_ml_service / male_ml_service
                         │
                         ▼
  3. PIPELINE INGESTION & DATA NORMALIZATION
     - Imputes missing inputs using frozen training-fold medians
     - Recomputes deterministic ratios (BMI, Waist-to-Hip Ratio)
     - Normalizes continuous features via StandardScaler
                         │
                         ▼
  4. PROBABILITY PREDICTION & CALIBRATION
     - Executes calibrated predict_proba() on joblib ensemble artifact
     - Outputs well-calibrated posterior probability p in [0.0, 1.0]
     - Female Tier 3: Computes 95/5 multimodal fusion if ultrasound is present
                         │
                         ▼
  5. POLICY RISK STRATIFICATION
     - Compares p against policy thresholds (0.25 for PCOS, 0.1808 for Male T1, 0.3379 for Male T2)
     - Assigns clinical likelihood band: "Lower Likelihood", "Intermediate", or "Higher Likelihood"
                         │
                         ▼
  6. EXPLAINABILITY ATTRITION ENGINE
     - Tabular: FoldAwareCalibratedExplainer runs 5-fold TreeSHAP or LinearSHAP
     - Vision: GradCAM hooks activations on EfficientNet-B0 features[-1]
     - Blends OpenCV Jet colormap onto raw scan (Tier 1/2/3 fallback engine)
                         │
                         ▼ JSON Response
  7. CLIENT PRESENTATION (React / Tailwind UI)
     - Interactive Risk Cards, Biomarker Waterfall Visualizations, and Attention Heatmaps
```

---

# SECTION 18: 60+ MACHINE LEARNING VIVA QUESTIONS AND ANSWERS

## 18.1 Beginner Questions (1–15)

#### Q1: Is the BioPulse AI project performing classification or regression?
- **Short Answer:** It performs binary classification with calibrated probability estimation.
- **Detailed Answer:** While the supervision targets are binary (`PCOS: 1/0`, `Low-T: 1/0`), our models output continuous posterior probabilities $p \in [0.0, 1.0]$ via Platt sigmoid calibration, which are then mapped to clinical risk bands.
- **Project Evidence:** `pcos_ml_service.py` line 84; `male_ml_service.py` line 115.

#### Q2: What is the target variable for the female screening pathway?
- **Short Answer:** `PCOS (Y/N)`, representing clinical PCOS consensus diagnosis under the Rotterdam criteria.
- **Detailed Answer:** Located in column 2 of `PCOS_data_without_infertility.xlsx`, it comprises 177 positive cases (32.72%) and 364 negative controls (67.28%).
- **Project Evidence:** `machine-learning/PCOS-ML/reports/DATA_AUDIT.md`.

#### Q3: What is the target variable for the male screening pathway?
- **Short Answer:** Binary low total testosterone ($T < 300\text{ ng/dL}$).
- **Detailed Answer:** Ground truth Total Testosterone (`LBXTST`) was measured via CDC certified ID-LC-MS/MS in NHANES. Men with values $< 300\text{ ng/dL}$ are classified as positive per American Urological Association guidelines.
- **Project Evidence:** `machine-learning/male-ML/male_tier1/reports/model_walkthrough.md`.

#### Q4: How many datasets were investigated across the project?
- **Short Answer:** Two primary production datasets, one imaging benchmark, and multiple explored external cohorts.
- **Detailed Answer:** The two production datasets are Kottarathil PCOS ($N=541$) and CDC NHANES 2013–2016 ($N=3,575$). In addition, 1,468 ultrasound images were audited, and legacy datasets (`ptestost.xlsx`, `horm.csv`) were audited and rejected.
- **Project Evidence:** `DATA_AUDIT.md`, `male_tier1/reports/dataset_audit.md`.

#### Q5: What is stratified splitting and why was it necessary?
- **Short Answer:** Splitting data such that train and test sets preserve the exact positive/negative class ratio.
- **Detailed Answer:** In our PCOS dataset, the positive class is 32.7%. Random non-stratified splitting risks creating test folds with 20% or 45% prevalence, biasing evaluation metrics.
- **Project Evidence:** `train_tier1.py` line 45 (`stratify=y`).

#### Q6: What is the difference between supervised and unsupervised learning?
- **Short Answer:** Supervised learning learns a mapping from inputs $X$ to known ground-truth labels $y$; unsupervised learning finds patterns without labels.
- **Detailed Answer:** All our production models are supervised because they optimize objective loss functions against verified medical outcomes (`PCOS`, `Low-T`, `PCOM`).

#### Q7: What is feature engineering? Give an example from your project.
- **Short Answer:** Creating new informative mathematical features from raw inputs using domain knowledge.
- **Detailed Answer:** In Female Tier 1, Body Mass Index ($\text{BMI} = \text{weight}/\text{height}^2$) and Waist-to-Hip Ratio ($\text{WHR} = \text{waist}/\text{hip}$) were engineered. In Tier 2, the `fsh_lh_ratio` was calculated.
- **Project Evidence:** `PCOS-ML/src/preprocessing.py`.

#### Q8: What is data preprocessing?
- **Short Answer:** Cleaning, imputing, and scaling raw clinical data before feeding it into machine learning models.
- **Detailed Answer:** Our preprocessing pipeline handles missing value median imputation, standardizes continuous features to zero mean and unit variance, and maps categorical inputs to binary integers.

#### Q9: Was PCA used in your project?
- **Short Answer:** No, PCA was not used in any production or experimental pipeline.
- **Detailed Answer:** We preserved the original clinical feature space to ensure complete interpretability and direct feature attribution via TreeSHAP and LinearSHAP.
- **Project Evidence:** `machine-learning/` codebase search confirmed 0 instances of PCA.

#### Q10: What is cross-validation?
- **Short Answer:** Partitioning the training data into $K$ subsets to evaluate model stability and prevent overfitting.
- **Detailed Answer:** We used 5-fold Stratified Cross-Validation on the development sets ($N=432$ for female, $N=2,860$ for male), where 4 folds train and 1 fold validates, repeated across all 5 folds.

#### Q11: What is a holdout test set?
- **Short Answer:** A completely untouched partition of data kept separate during all training and hyperparameter tuning.
- **Detailed Answer:** We maintained a locked 20% holdout set ($N=109$ for female, $N=715$ for male) to evaluate final unbiased real-world generalization.

#### Q12: Why did you not use an 80/10/10 split instead of 80/20?
- **Short Answer:** Because the female dataset has $N=541$ samples; a 10% test set would contain only 17 positive cases, making evaluation statistically noisy.
- **Detailed Answer:** A 20% holdout ($N=109$, 36 positives) provides sufficient statistical support to compute reliable confidence intervals for sensitivity and specificity.

#### Q13: What does a confusion matrix tell you?
- **Short Answer:** The exact breakdown of True Positives, True Negatives, False Positives, and False Negatives.
- **Detailed Answer:** It exposes the types of errors the model makes. In medical screening, it allows clinicians to distinguish between benign false alarms and dangerous missed diagnoses.

#### Q14: What is overfitting?
- **Short Answer:** When a model memorizes the training data and noise, failing to generalize to new patients.
- **Detailed Answer:** We prevented overfitting using regularized algorithms, random split thresholds in Extra Trees, and verifying that 5-fold CV performance matched holdout test performance.

#### Q15: What is class imbalance?
- **Short Answer:** When one class significantly outnumbers another in the dataset.
- **Detailed Answer:** In our PCOS cohort, negative controls outnumber positive cases 2.06:1 (67.3% vs. 32.7%). In NHANES, normal testosterone outnumbers low-T 3.2:1 (76.2% vs. 23.8%).

---

## 18.2 Intermediate Questions (16–35)

#### Q16: Why did you choose Extra Trees instead of Random Forest for Female Tier 1?
- **Short Answer:** Extra Trees demonstrated higher ROC-AUC and lower variance across 15 cross-validation folds.
- **Detailed Answer:** Extra Trees randomizes both the feature subset AND the splitting threshold for each feature. This extreme randomization provides stronger variance reduction on small sample sizes ($N=432$), yielding CV ROC-AUC of $0.8863 \pm 0.0274$ vs. $0.8814 \pm 0.0289$ for Random Forest.
- **Project Evidence:** `tier1_model_comparison.csv`.

#### Q17: What is the fundamental difference between Random Forest and Extra Trees?
- **Short Answer:** Random Forest finds the mathematically optimal split threshold; Extra Trees draws thresholds at random and picks the best among them.
- **Detailed Answer:** Random Forest searches for the optimal cut-point using Gini impurity or entropy. Extra Trees draws random thresholds for each candidate feature, reducing computation time and decreasing model variance at the cost of a slight increase in bias.

#### Q18: Why did you select Logistic Regression for Male Tier 1?
- **Short Answer:** It outperformed non-linear tree models on low-dimensional symptom data and prevented overfitting.
- **Detailed Answer:** Male Tier 1 inputs consist of 11 self-reported symptoms and basic biometrics. Complex tree ensembles overfit subjective questionnaire noise, achieving only $0.7141$ AUC, whereas regularized Logistic Regression generalized at $0.7225$ AUC.
- **Project Evidence:** `male_tier1/reports/model_walkthrough.md`.

#### Q19: Why was probability calibration necessary?
- **Short Answer:** Uncalibrated tree voting fractions do not represent true clinical probabilities.
- **Detailed Answer:** Tree ensemble vote fractions cluster away from extreme probabilities and violate empirical likelihood ratios. Platt sigmoid scaling fits a logistic transformation on out-of-fold predictions, reducing the Brier score from $0.1246$ to $0.1121$.
- **Project Evidence:** `tier1_calibration_results.csv`.

#### Q20: How did you select the operating threshold of 0.25 for Female Tier 1?
- **Short Answer:** By conducting a systematic threshold sweep on out-of-fold development predictions targeting Sensitivity $\ge 85\%$.
- **Detailed Answer:** In a medical screener, false negatives delay treatment. At the default threshold of $0.50$, sensitivity was only $69.4\%$ (11 missed cases). At $\tau^* = 0.25$, sensitivity rose to $80.6\%$ ($FN=7$), while maintaining $83.6\%$ specificity.
- **Project Evidence:** `tier1_threshold_analysis.csv`.

#### Q21: What is the difference between Precision and Recall?
- **Short Answer:** Precision is the fraction of predicted positives that are truly positive; Recall is the fraction of actual positives correctly identified.
- **Detailed Answer:** Precision $= \text{TP} / (\text{TP} + \text{FP})$. Recall $= \text{TP} / (\text{TP} + \text{FN})$. In screening, we maximize Recall to catch cases, accepting lower Precision.

#### Q22: Why is the Brier Score useful?
- **Short Answer:** It measures the accuracy and calibration of probabilistic predictions.
- **Detailed Answer:** Defined as $\frac{1}{N}\sum(p_i - y_i)^2$, it penalizes overconfident wrong predictions much more heavily than soft errors. A Brier score $< 0.12$ indicates excellent calibration.

#### Q23: Why did Female Tier 2 (32 features) have virtually the same ROC-AUC as Tier 1 (16 features)?
- **Short Answer:** Because the 16 non-invasive phenotypic features already captured the dominant diagnostic signal.
- **Detailed Answer:** In our cohort, menstrual irregularity, clinical hyperandrogenism (hirsutism, acne), and Acanthosis nigricans (`skin_darkening`) carry strong discriminative signal. Adding serum assays slightly improved specificity ($+1.8\%$) but did not dramatically boost overall discrimination (Holdout AUC $0.8980 \rightarrow 0.8919$).
- **Project Evidence:** `tier2_vs_tier1_comparison.csv`.

#### Q24: What was the "Low-Circularity" sensitivity experiment in Female Tier 1?
- **Short Answer:** Retraining the model using ONLY non-Rotterdam features to prove the model wasn't just memorizing diagnostic definitions.
- **Detailed Answer:** We excluded all 5 Rotterdam-overlapping features (`cycle_regularity`, `cycle_length_raw`, `hirsutism`, `pimples_acne`, `hair_loss`) and evaluated the remaining 11 anthropometric and lifestyle features. The model still achieved **0.8437 ROC-AUC**, proving genuine metabolic signal.
- **Project Evidence:** `tier1_low_circularity_results.csv`.

#### Q25: Why did you exclude Follicle Number from Tier 1 and Tier 2?
- **Short Answer:** To prevent diagnostic criterion data leakage and ensure early-stage non-invasive triage utility.
- **Detailed Answer:** Having $\ge 12-20$ follicles per ovary on ultrasound is Criterion 3 of the Rotterdam consensus. Including it creates an artificial decision tree split that renders the model useless when ultrasound is unavailable.
- **Project Evidence:** `LEAKAGE_ANALYSIS.md`.

#### Q26: Why was Total Testosterone excluded from Male Tier 2 inputs?
- **Short Answer:** To prevent direct target leakage, since the target was defined as Total Testosterone $< 300\text{ ng/dL}$.
- **Detailed Answer:** Feeding Total Testosterone into a model predicting low testosterone would result in artificial 100% accuracy that collapses in pre-diagnostic clinical screening.
- **Project Evidence:** `male_tier2/reports/model_evaluation.md`.

#### Q27: What is PR-AUC and when is it preferred over ROC-AUC?
- **Short Answer:** Precision-Recall AUC; it is preferred when evaluating imbalanced datasets where the negative class dominates.
- **Detailed Answer:** ROC-AUC includes False Positive Rate ($\text{FP} / \text{TN}$), which can appear deceptively low when $\text{TN}$ is very large. PR-AUC focuses exclusively on minority positive class detection.

#### Q28: How does Platt scaling work mathematically?
- **Short Answer:** It fits a scalar logistic regression model on the raw prediction outputs.
- **Detailed Answer:** $P(y=1|f(x)) = 1 / (1 + \exp(A \cdot f(x) + B))$, where parameters $A$ and $B$ are estimated via maximum likelihood on cross-validated validation sets.

#### Q29: What is the difference between L1 and L2 regularization?
- **Short Answer:** L1 (Lasso) adds an absolute weight penalty and performs feature selection; L2 (Ridge) adds a squared weight penalty and shrinks weights smoothly.
- **Detailed Answer:** We used L2 regularization ($C = 0.2$) in Male Tier 1 to shrink collinear symptom coefficients smoothly without arbitrarily zeroing out correlated biological indicators.

#### Q30: What vision model was used for ultrasound image analysis?
- **Short Answer:** Pretrained EfficientNet-B0 transfer learning with a custom classification head.
- **Detailed Answer:** Pretrained on ImageNet-1k, the backbone extracts 1,280-dimensional feature representations, which are passed through a dropout layer ($p=0.3$) and a linear classification head.
- **Project Evidence:** `tier3_image_models.py`.

#### Q31: What loss function and optimizer were used to train EfficientNet-B0?
- **Short Answer:** Binary Cross-Entropy with Logits (`BCEWithLogitsLoss`) and AdamW optimizer.
- **Detailed Answer:** AdamW was initialized with learning rate $10^{-3}$ and weight decay $10^{-4}$. In the final 2 epochs, the backbone was unfrozen and fine-tuned at $10^{-4}$.
- **Project Evidence:** `tier3_image_models.py` lines 201–212.

#### Q32: What data augmentations were applied to ultrasound images?
- **Short Answer:** Conservative anatomical transformations: horizontal flips, subtle rotation ($\pm 10^\circ$), and color jitter ($\pm 10\%$).
- **Detailed Answer:** Pelvic ultrasound has bilateral anatomical symmetry, making horizontal flipping clinically sound. Vertical flipping was strictly avoided because probe orientation must be preserved.

#### Q33: Why did you not train a Deep Neural Network for tabular Tier 1 data?
- **Short Answer:** Tree-based ensembles consistently outperform neural networks on small tabular clinical datasets.
- **Detailed Answer:** Deep learning on tabular data lacks the spatial inductive bias of CNNs and easily overfits on $N=432$ samples. Empirical benchmarks (Grinsztajn et al., 2022) confirm tree ensembles remain state-of-the-art on tabular data.

#### Q34: What is the purpose of the 7-feature male candidate model?
- **Short Answer:** To provide a purely objective screening model that eliminates subjective symptom questionnaire noise.
- **Detailed Answer:** The candidate model uses only 7 objective measures (`age`, `height`, `weight`, `bmi`, `waist`, `hypertension`, `diabetes`), achieving $0.7074$ test ROC-AUC and $82.94\%$ sensitivity without requiring subjective symptom input.
- **Project Evidence:** `male_tier1_7feat/reports/metrics_report.json`.

#### Q35: What is the 6-feature male fallback model?
- **Short Answer:** A graceful degradation model deployed when a user does not know their waist circumference.
- **Detailed Answer:** Evaluated on the held-out test set ($N=715$), it achieved $0.7006$ ROC-AUC, $0.4203$ PR-AUC, and $81.76\%$ sensitivity ($FN=31$), ensuring system usability when tape measures are unavailable.

---

## 18.3 Advanced Questions (36–50)

#### Q36: How does TreeSHAP compute exact Shapley values in polynomial time?
- **Short Answer:** By recursively tracking decision path proportions and conditional expectations down tree structures.
- **Detailed Answer:** Standard Shapley computation is exponential ($O(M \cdot 2^{|F|})$). Lundberg's TreeSHAP algorithm evaluates feature subsets simultaneously by tracking leaf weights down tree paths, reducing complexity to $O(T \cdot L \cdot D^2)$, where $T$ is trees, $L$ is leaves, and $D$ is maximum tree depth.

#### Q37: How did you implement fold-aware SHAP in `FoldAwareCalibratedExplainer`?
- **Short Answer:** By extracting the underlying tree estimators from all 5 internal calibration folds and averaging their local attributions.
- **Detailed Answer:** `CalibratedClassifierCV` contains 5 fitted estimators. We run `TreeExplainer` on each fold estimator, map transformed feature names back to canonical keys, verify local additivity per fold, and compute the ensemble average attribution $\bar{\phi}_i = \frac{1}{5}\sum \phi_i^{(k)}$.
- **Project Evidence:** `shap_adapter.py`.

#### Q38: What is SHAP additivity and how do you test it?
- **Short Answer:** The sum of all feature SHAP values plus the base expected value must equal the model's raw output.
- **Detailed Answer:** $\bar{\phi}_0 + \sum_{i=1}^M \bar{\phi}_i = f(x)$. In `shap_adapter.py`, we test this numerically with an assertion tolerance of $10^{-5}$: `abs(sum(shap_values) + base_value - model_output) < 1e-5`.

#### Q39: What is fold-direction stability in your explainability engine?
- **Short Answer:** The percentage of internal cross-validation folds that agree on whether a feature increased or decreased risk.
- **Detailed Answer:** If 5 out of 5 folds give a positive SHAP value for a patient's BMI, stability is $100\%$. If 3 folds are positive and 2 are negative, stability is $60\%$, transparently exposing model uncertainty to clinicians.

#### Q40: Explain the mathematical fusion equation for Female Tier 1+2+3.
- **Short Answer:** A linear convex combination: $p_{\text{fused}} = 0.95 \times p_{\text{clinical}} + 0.05 \times p_{\text{ultrasound}}$.
- **Detailed Answer:** Evaluated on Development 5-Fold OOF predictions, $w_{\text{clinical}} = 0.95$ and $w_{\text{ultrasound}} = 0.05$ maximized PR-AUC ($0.8132$). This small weight prevents chance-level image predictions from degrading highly accurate clinical risk assessments.
- **Project Evidence:** `pcos_ml_service.py` line 1160; `multimodal_final_evaluation_report.md`.

#### Q41: What happens if an ultrasound image fails inference or is corrupt?
- **Short Answer:** The system executes graceful degradation, setting $w_{\text{clinical}} = 1.0$ and preserving the 100% Tier 2 score.
- **Detailed Answer:** In `pcos_ml_service.py`, if `is_valid_us_prob` is False, `multimodal_fusion_applied` is set to False, `fusion_status` is logged as `fusion_unavailable`, and the final probability directly equals $p_{\text{Tier 2}}$.

#### Q42: How does Grad-CAM compute activation weights?
- **Short Answer:** Via global average pooling of gradients of the target class score with respect to feature maps.
- **Detailed Answer:** $\alpha_k^c = \frac{1}{Z}\sum_i \sum_j \frac{\partial y^c}{\partial A_{i,j}^k}$. The weights $\alpha_k^c$ represent the importance of feature map $k$ for class $c$. The linear combination is passed through a ReLU activation to retain features that increase the target score.

#### Q43: Why does Grad-CAM use ReLU instead of absolute values?
- **Short Answer:** To isolate features that have a POSITIVE influence on the target class score.
- **Detailed Answer:** Features that decrease the class score (negative gradients) indicate evidence for the alternate class. We only want to visualize pixels that support the presence of PCOM.

#### Q44: What was the root cause of the solid green box bug in your Grad-CAM visualization?
- **Short Answer:** A missing `matplotlib` dependency triggered a fallback that returned a 1×1 green pixel, which CSS stretched into a full block.
- **Detailed Answer:** When `matplotlib` was missing in the backend environment, the exception handler defaulted to a base64 string encoding a 1×1 PNG pixel (`RGBA: 0, 255, 0, 127`). Frontend responsive CSS stretched this pixel across the entire 280×280 container over a dark slate background, producing an opaque solid green square.

#### Q45: How did you fix the Grad-CAM visualization engine?
- **Short Answer:** Built a 3-tier fallback engine prioritizing OpenCV (`cv2`), followed by Matplotlib, followed by pure NumPy/Pillow.
- **Detailed Answer:** Tier 1 uses native OpenCV C++ `COLORMAP_JET` blending with `cv2.addWeighted`, which is 50× faster and thread-safe. Tier 2 uses Matplotlib with figure cleanup. Tier 3 uses analytic NumPy JET array calculations with zero visualization dependencies.
- **Project Evidence:** `pcos_ml_service.py` (`_render_gradcam_overlay`).

#### Q46: How do you prevent data leakage during hyperparameter optimization?
- **Short Answer:** By performing hyperparameter searches strictly inside cross-validation loops or exclusively on development folds.
- **Detailed Answer:** We locked the 20% holdout test partition ($N=109$ female, $N=715$ male) before any model tuning began. All grid searches, threshold selections, and calibrations were conducted exclusively on the 80% development split.

#### Q47: Why is Negative Predictive Value (NPV) critical in pre-clinical screening?
- **Short Answer:** It represents the clinical reliability of a negative screen.
- **Detailed Answer:** If a user is told their risk is "Lower Likelihood", a high NPV ($89.7\%$ in female, $88.0\%$ in male) guarantees that nearly 9 out of 10 negative screens genuinely do not have the condition, minimizing dangerous false reassurance.

#### Q48: Why did you not model Primary vs. Secondary Hypogonadism as a multi-class ML model?
- **Short Answer:** Because they are defined by clear biochemical rules, not statistical approximations.
- **Detailed Answer:** Clinical guidelines define primary hypogonadism by elevated gonadotropins (LH $> 8.6$ or FSH $> 12.4$) and secondary by low/normal gonadotropins. Modeling this with machine learning introduces unnecessary classification error into deterministic clinical logic.

#### Q49: What is the Matthews Correlation Coefficient formula and why is it balanced?
- **Short Answer:** It treats all four confusion matrix quadrants equally and is invariant to class prevalence.
- **Detailed Answer:** Unlike F1-score (which ignores True Negatives), MCC incorporates TP, TN, FP, and FN in both numerator and denominator. It only scores high if the model predicts both positive and negative classes accurately.

#### Q50: How do you know your ultrasound model didn't memorize hospital artifacts or text watermarks?
- **Short Answer:** By inspecting Grad-CAM heatmaps to verify attention localized on the ovarian stroma and antral follicles.
- **Detailed Answer:** Ultrasound scans often have manufacturer watermarks or depth calipers in the corners. Grad-CAM heatmaps confirmed model activations concentrated on the internal ovarian stroma rather than peripheral text overlays.

---

## 18.4 Challenging External Examiner Questions (51–65)

#### Q51: "Your female dataset only has 541 patients. How can you claim statistical validity on such a small sample?"
- **Short Answer:** While 541 patients is modest, it represents a real clinical multicenter cohort validated via repeated stratified CV and locked holdout testing.
- **Detailed Answer:** We do not claim this model is ready for autonomous clinical deployment without prospective validation. However, for a university research prototype, 541 fully characterized clinical patients across 45 hormonal and physical assays is substantial. We mitigated sample size constraints by using high-variance-reducing Extra Trees, 15-fold repeated CV, strict holdout isolation, and Platt probability calibration.
- **Project Evidence:** `TIER1_TRAINING_REPORT.md` Section 1.

#### Q52: "Your Male Tier 1 model has a specificity of only 44.6%. Isn't that an unacceptable false alarm rate?"
- **Short Answer:** In a pre-clinical screener, catching 80.6% of hypogonadal men justifies a higher false positive rate for confirmatory blood tests.
- **Detailed Answer:** If we run the model at the standard threshold of $0.50$, specificity is $96.5\%$, but sensitivity collapses to $14.7\%$ (missing 85 out of 100 men with low testosterone). A screening tool's primary purpose is safety net triage. A false positive merely prompts a safe, non-invasive morning blood test, whereas a false negative leaves endocrine failure untreated.
- **Project Evidence:** `male_tier1/reports/model_walkthrough.md` Section 2.

#### Q53: "Why did adding ultrasound to Tier 2 clinical labs only improve ROC-AUC by 0.0008? Doesn't that mean your Tier 3 is useless?"
- **Short Answer:** It proves ultrasound is redundant for predicting systemic PCOS, but Tier 3 remains vital for detecting PCOM morphology.
- **Detailed Answer:** This is one of our project's strongest scientific findings. Ultrasound does not predict systemic metabolic PCOS; serum biomarkers and clinical symptoms do. However, Rotterdam Criterion 3 specifically requires evaluating ovarian morphology (PCOM). Tier 3 achieves 91.99% ROC-AUC for PCOM detection, fulfilling this distinct clinical criterion independently of the systemic risk score.
- **Project Evidence:** `multimodal_final_evaluation_report.md`.

#### Q54: "Could you have used SMOTE to balance the classes and improve performance?"
- **Short Answer:** SMOTE was evaluated during exploratory audits and rejected because it distorted posterior probability calibration.
- **Detailed Answer:** While SMOTE can artificially inflate uncalibrated sensitivity by interpolating synthetic minority vectors, it alters the natural prior class distribution $P(y=1)$. This severely degrades Platt probability calibration and increases the Brier score. Calibrating probabilities and tuning the decision threshold on natural distributions is mathematically superior.
- **Project Evidence:** `LEAKAGE_ANALYSIS.md` Section 3.1.

#### Q55: "What is the difference between SHAP output space and calibrated probability space?"
- **Short Answer:** SHAP values explain the pre-calibration raw model score; they do not sum linearly to the final calibrated probability.
- **Detailed Answer:** For tree ensembles, TreeSHAP explains the raw margin or leaf vote fraction $f(x) = \phi_0 + \sum \phi_i$. The final probability $P(y=1)$ is a non-linear sigmoid transformation of $f(x)$. In `shap_adapter.py`, we explicitly document this distinction so clinicians understand that SHAP represents relative feature push in log-odds/margin space rather than absolute percentage point shifts.
- **Project Evidence:** `shap_adapter.py` lines 8–17.

#### Q56: "How did you ensure that test set performance was not optimistic due to random seed cherry-picking?"
- **Short Answer:** By fixing random seed 42 across all splits and verifying that holdout metrics closely matched 5-fold cross-validation averages.
- **Detailed Answer:** In Female Tier 1, mean cross-validation ROC-AUC across 15 folds was $0.8863 \pm 0.0274$, and holdout ROC-AUC was $0.8980$ (within half a standard deviation). In Male Tier 2, CV ROC-AUC was $0.8521 \pm 0.0120$ and test ROC-AUC was $0.8742$. The close agreement proves results are robust and not an artifact of favorable splitting.

#### Q57: "If a patient has low testosterone and high LH, does your machine learning model classify them as having Primary Hypogonadism?"
- **Short Answer:** No, our machine learning model does not classify hypogonadism subtypes; that is handled by a deterministic rule layer.
- **Detailed Answer:** The supervised ML model strictly predicts the risk of low Total Testosterone ($T < 300\text{ ng/dL}$). The classification into Primary, Secondary, or Prolactin-related patterns is executed by a separate rule-based expert layer using clinical hormone cutoffs.
- **Project Evidence:** `male_ml_service.py` lines 8–9, 154–170.

#### Q58: "Why did you use Platt scaling instead of Isotonic Regression?"
- **Short Answer:** Platt scaling is parametric and avoids overfitting on small validation datasets.
- **Detailed Answer:** Isotonic Regression fits a non-parametric piecewise constant step-function. On small sample sizes ($N=432$), it easily overfits and creates flat probability steps with zero gradient. Platt scaling fits a smooth two-parameter sigmoid that preserves monotonicity and generalizes better out-of-fold.

#### Q59: "What clinical guideline did you use to define low testosterone in men?"
- **Short Answer:** The American Urological Association (AUA) and Endocrine Society guideline cutoff of $300\text{ ng/dL}$.
- **Detailed Answer:** AUA clinical guidelines define biochemical hypogonadism as two consecutive morning fasting Total Testosterone measurements $< 300\text{ ng/dL}$. NHANES morning serum samples analyzed via reference ID-LC-MS/MS were dichotomized at this exact cutoff.

#### Q60: "What is the single biggest technical limitation of your current implementation?"
- **Short Answer:** The absence of prospective multi-center clinical validation in an active hospital workflow.
- **Detailed Answer:** All findings are derived from retrospective open-access cohorts. Retrospective data suffers from referral filter bias (patients in hospital datasets already had clinical complaints). Prospective testing on unselected ambulatory populations is required before clinical deployment.

#### Q61: "Can BioPulse AI replace an endocrinologist or gynecologist?"
- **Short Answer:** Absolutely not. It is an AI-assisted educational screening tool, not a diagnostic medical device.
- **Detailed Answer:** BioPulse AI is explicitly designed for risk stratification and clinical triage. It alerts patients to potential endocrine and reproductive risks and recommends confirmatory clinical workups. The software displays prominent disclaimers emphasizing that diagnosis requires qualified medical professionals.

#### Q62: "Why did you use OpenCV instead of Matplotlib for runtime Grad-CAM heatmap generation?"
- **Short Answer:** OpenCV is 50× faster, requires less memory, and is completely thread-safe across concurrent web requests.
- **Detailed Answer:** Matplotlib's `pyplot` relies on a global state machine that is not thread-safe in multi-threaded Django worker servers and incurs heavy font-cache overhead. OpenCV C++ bindings execute in sub-milliseconds without GUI dependencies.

#### Q63: "What prevents a user from uploading a random chest X-ray and getting a PCOM prediction?"
- **Short Answer:** Current input validation checks file integrity and dimensions, but domain-specific out-of-distribution (OOD) image gating is an identified area for future enhancement.
- **Detailed Answer:** We enforce image decoding, aspect ratio validation, and channel normalization. However, implementing an automated OOD discriminator or pelvic ultrasound semantic segmenter is an important roadmap enhancement to reject non-ultrasound imagery.

#### Q64: "How does your system handle partial laboratory uploads where only 3 of 16 tests are available?"
- **Short Answer:** The ML model uses median imputation for risk estimation, while the UI explicitly informs the user which analytes were missing.
- **Detailed Answer:** Scikit-learn's `SimpleImputer` fills missing values using training medians so the model can compute an interim estimate. The response payload explicitly returns `analytes_not_reported` so the user knows their score is based on incomplete evidence.

#### Q65: "What is the clinical significance of Acanthosis nigricans (`skin_darkening`) in your Tier 1 model?"
- **Short Answer:** It is a visible dermatological manifestation of severe compensatory hyperinsulinemia.
- **Detailed Answer:** In PCOS, insulin resistance causes elevated circulating insulin, which binds to insulin-like growth factor (IGF-1) receptors on keratinocytes and dermal fibroblasts, stimulating hyperplasia and hyperpigmentation. It is one of the highest-weighted non-invasive features in Tier 1.

---

# SECTION 19: SPEAKING SCRIPTS FOR YOUR FYP VIVA DEFENSE

## 19.1 The 2-Minute Elevator Pitch

> *"Respected Examiners, BioPulse AI is a dual-pathway pre-clinical risk stratification system designed to address the widespread diagnostic delays in female Polycystic Ovary Syndrome and male hypogonadism.*
>
> *Our architecture implements a progressive tiered methodology. In the female pathway, Tier 1 uses a 16-feature non-invasive Extra Trees model achieving 89.8% holdout ROC-AUC and 80.6% sensitivity at our clinical screening threshold of 0.25. Tier 2 integrates 32 cumulative clinical biomarkers, achieving 89.2% ROC-AUC. Tier 3 incorporates deep vision via a transfer-learned EfficientNet-B0 analyzing pelvic ultrasound scans, achieving 92.0% ROC-AUC for PCOM morphology with Grad-CAM explainability.*
>
> *In the male pathway, we addressed severe age bias in prior literature by training on 3,575 adult men aged 19 to 60 from the CDC NHANES continuous cohort. Tier 1 uses a calibrated Logistic Regression model achieving 80.6% screening sensitivity, while Tier 2 uses a 16-biomarker Calibrated Random Forest achieving 87.4% test ROC-AUC without target leakage, paired with a clinical rule layer.*
>
> *Every model is calibrated via Platt scaling, protected by strict data leakage controls, and explained through 5-fold fold-aware TreeSHAP and LinearSHAP. BioPulse AI does not attempt to replace doctors; it empowers users with early, medically defensible risk awareness to accelerate timely clinical care. Thank you."*

---

## 19.2 The 5-Minute Comprehensive Presentation

> *"Good morning, respected external examiner and faculty members. Today I am presenting the machine learning subsystem of BioPulse AI, also known as PMOSense.*
>
> *Our core research problem centers on diagnostic accessibility. Systemic reproductive and endocrine disorders—specifically PCOS in women and testosterone deficiency in men—often take years to diagnose because patients lack accessible early screening tools.*
>
> *To solve this, we architected two distinct, non-invasive screening pipelines based on strict medical defensibility.*
>
> *Starting with the Female PCOS Pathway: We trained our models on a benchmark cohort of 541 patients from 10 hospital centers in Kerala, partitioned into an 80% development set of 432 patients and a frozen, untouched 20% holdout set of 109 patients.*
>
> *A major priority was preventing data leakage. In prior student projects, ultrasound follicle counts were naively included in early tabular models, which constitutes diagnostic criterion leakage under Rotterdam guidelines. We strictly excluded all ultrasound metrics from Tiers 1 and 2. Tier 1 uses 16 purely self-reportable features—such as cycle regularity, BMI, and skin darkening. Using an ExtraTreesClassifier with Platt sigmoid calibration, Tier 1 achieves 89.8% ROC-AUC on the locked holdout set. Because false negatives in medical screening are dangerous, we lowered the decision threshold from 0.50 to 0.25, boosting sensitivity from 69.4% to 80.6% and reducing missed cases from 11 down to 7.*
>
> *Tier 2 adds 16 clinical vitals and serum hormone assays, achieving 89.2% ROC-AUC. Tier 3 evaluates pelvic ultrasound scans using an EfficientNet-B0 convolutional network. Here, we uncovered an important scientific insight: ultrasound images alone predict PCOM morphology with 92.0% ROC-AUC and 98.3% sensitivity, but predicting systemic clinical PCOS from image alone yields chance-level performance (50.4% AUC). This confirms that PCOS is an endocrine disorder, not an image-only disease. We implemented a weighted multimodal fusion weighting clinical data at 95% and ultrasound at 5%, supported by OpenCV-accelerated Grad-CAM attention heatmaps.*
>
> *Turning to the Male Hypogonadism Pathway: Previous literature frequently relied on datasets like `ptestost.xlsx`, where the minimum patient age was 45 years. To make our screener valid for young adult men aged 19 to 60, we audited and utilized the CDC NHANES epidemiological cohort of 3,575 men, where Total Testosterone was measured via reference mass spectrometry. Total Testosterone was 100% excluded from model inputs to prevent target leakage. Tier 1 uses a balanced Logistic Regression model achieving 70.4% test ROC-AUC and 80.6% sensitivity at threshold 0.1808. Tier 2 uses a Calibrated Random Forest on 16 indirect routine lab markers, achieving 87.4% test ROC-AUC and 91.0% Negative Predictive Value.*
>
> *Finally, all models are made transparent through our custom Fold-Aware Calibrated SHAP adapter, which extracts local feature attributions across all 5 cross-validation folds, verifies mathematical additivity, and reports fold-direction stability.*
>
> *In summary, our project demonstrates rigorous engineering: zero target leakage, locked holdout testing, calibrated screening probabilities, and explainable AI. I am now ready for your technical questions."*

---

# SECTION 20: SOURCE VERIFICATION AND AUDIT EVIDENCE MATRIX

| Claim / Metric | Verified Value | Source File in Repository | Evidence Location | Status |
| :--- | :---: | :--- | :--- | :---: |
| Female Dataset Size | 541 rows, 45 cols | `machine-learning/PCOS-ML/reports/DATA_AUDIT.md` | Section 2 | **VERIFIED** |
| Female Target Balance | 177 pos (32.7%), 364 neg (67.3%) | `machine-learning/PCOS-ML/reports/DATA_AUDIT.md` | Section 5 | **VERIFIED** |
| Female Holdout Split | 432 Dev (80%) / 109 Test (20%) | `machine-learning/PCOS-ML/reports/DATA_AUDIT.md` | Section 1.3 | **VERIFIED** |
| Female T1 Holdout AUC | **0.8980** | `machine-learning/PCOS-ML/reports/tier1/tier1_holdout_results.csv`| Row 2 | **VERIFIED** |
| Female T1 Holdout Sens ($\tau=0.25$) | **80.56%** ($29/36$) | `machine-learning/PCOS-ML/reports/tier1/tier1_holdout_results.csv`| Row 3 | **VERIFIED** |
| Female T1 Holdout Spec ($\tau=0.25$) | **83.56%** ($61/73$) | `machine-learning/PCOS-ML/reports/tier1/tier1_holdout_results.csv`| Row 3 | **VERIFIED** |
| Female T1 Holdout Brier | **0.1121** | `machine-learning/PCOS-ML/reports/tier1/tier1_holdout_results.csv`| Row 2 | **VERIFIED** |
| Female T2 Holdout AUC | **0.8919** | `machine-learning/PCOS-ML/reports/tier2/tier2_holdout_results.csv`| Row 2 | **VERIFIED** |
| Female T2 Holdout Sens ($\tau=0.25$) | **77.78%** ($28/36$) | `machine-learning/PCOS-ML/reports/tier2/tier2_holdout_results.csv`| Row 3 | **VERIFIED** |
| Female T3 PCOM Holdout AUC | **0.9199** | `machine-learning/PCOS-ML/reports/tier3/tier3_pcom_metrics.csv` | Row 3 | **VERIFIED** |
| Female T3 PCOM Holdout Sens | **98.28%** ($57/58$) | `machine-learning/PCOS-ML/reports/tier3/tier3_pcom_metrics.csv` | Row 3 | **VERIFIED** |
| Female T3 PCOS Outcome AUC | **0.5042** (Chance) | `machine-learning/PCOS-ML/reports/tier3/tier3_clinical_pcos_metrics.csv` | Row 3 | **VERIFIED** |
| Multimodal Fusion Weights | 95% Clinical / 5% Ultrasound | `backend/apps/intelligence/services/pcos_ml_service.py` | Line 1160 | **VERIFIED** |
| Multimodal Holdout AUC | **0.8927** | `machine-learning/PCOS-ML/reports/tier3/multimodal_final_evaluation_report.md` | Section 3 | **VERIFIED** |
| Male Dataset Size | 3,575 men (Ages 19–60) | `machine-learning/male-ML/male_tier1/reports/model_walkthrough.md`| Section 1 | **VERIFIED** |
| Male Target Balance | 851 pos (23.8%), 2,724 neg (76.2%)| `machine-learning/male-ML/male_tier1/reports/model_walkthrough.md`| Section 1 | **VERIFIED** |
| Male Split Size | 2,860 Train / 715 Test | `machine-learning/male-ML/male_tier1/reports/model_walkthrough.md`| Section 2 | **VERIFIED** |
| Male T1 Test AUC | **0.7044** | `machine-learning/male-ML/male_tier1/reports/model_walkthrough.md`| Section 2 | **VERIFIED** |
| Male T1 Test Sens ($t=0.18$) | **80.59%** ($137/170$) | `machine-learning/male-ML/male_tier1/reports/model_walkthrough.md`| Section 2 | **VERIFIED** |
| Male T1 Test Spec ($t=0.18$) | **44.59%** ($243/545$) | `machine-learning/male-ML/male_tier1/reports/model_walkthrough.md`| Section 2 | **VERIFIED** |
| Male T1 Test NPV | **88.00%** | `machine-learning/male-ML/male_tier1/reports/model_walkthrough.md`| Section 2 | **VERIFIED** |
| Male T2 Test AUC | **0.8742** | `machine-learning/male-ML/male_tier2/reports/model_evaluation.md`| Section 3 | **VERIFIED** |
| Male T2 Test Sens ($\tau=0.34$) | **73.53%** ($125/170$) | `machine-learning/male-ML/male_tier2/reports/model_evaluation.md`| Section 3 | **VERIFIED** |
| Male T2 Test Spec ($\tau=0.34$) | **83.49%** ($455/545$) | `machine-learning/male-ML/male_tier2/reports/model_evaluation.md`| Section 3 | **VERIFIED** |
| Male T2 Test Brier | **0.1164** | `machine-learning/male-ML/male_tier2/reports/model_evaluation.md`| Section 3 | **VERIFIED** |
| PCA Usage | Not Used | Repository-wide codebase search | Entire repo | **VERIFIED** |

---

# SECTION 21: CRITICAL CLAIMS YOU MUST AVOID DURING YOUR VIVA

> [!CAUTION]
> **DO NOT MAKE THE FOLLOWING UNSUPPORTED STATEMENTS DURING QUESTIONING:**

1. **DO NOT claim BioPulse AI provides a medical diagnosis:**  
   *Correction:* Always state that BioPulse AI provides an *AI-assisted pre-clinical risk screening estimate* designed to assist clinical triage.
2. **DO NOT claim ultrasound images diagnose PCOS:**  
   *Correction:* State that ultrasound images accurately detect *Polycystic Ovarian Morphology (PCOM)* ($92.0\%$ AUC), but carry near-zero independent signal ($50.4\%$ AUC) for systemic metabolic PCOS.
3. **DO NOT claim you trained models on your own prospective hospital data:**  
   *Correction:* Acknowledge transparently that models were trained on authoritative de-identified retrospective benchmarks (Kottarathil PCOS and US CDC NHANES).
4. **DO NOT claim that PCA was used for dimensionality reduction:**  
   *Correction:* State clearly that PCA was deliberately avoided to preserve natural clinical feature interpretability for TreeSHAP and LinearSHAP.
5. **DO NOT quote training set accuracy as test set accuracy:**  
   *Correction:* Quote only the verified held-out test metrics ($N=109$ for female, $N=715$ for male).
6. **DO NOT claim your male models classify Primary vs. Secondary Hypogonadism using deep learning:**  
   *Correction:* State that hypogonadism subtyping is handled by a deterministic rule-based clinical expert layer that evaluates LH, FSH, and Prolactin signaling.
7. **DO NOT claim that SMOTE was used in the production pipeline:**  
   *Correction:* Explain that probability calibration and sensitivity-prioritized threshold tuning on natural class distributions were chosen over synthetic oversampling to preserve accurate posterior risk calibration.

---

*End of BioPulse AI / PMOSense Machine Learning Viva Preparation Guide.*  
*Good luck with your FYP viva defense!*
