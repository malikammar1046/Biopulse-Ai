# Second-Level Critical Audit: Rigorous Scientific & Clinical Re-Evaluation

**Project**: OvaSense FYP  
**Date**: September 2026  
**Auditor**: OvaSense ML / Data Science Team  
**Review Status**: Second-Level Adversarial Audit Complete  

---

## 1. Executive Retrospective & Critical Reframing

A responsible machine learning audit must not act as a confirmation exercise. The primary objective of this second-level audit is to identify unverified assumptions, tone down over-confident claims, rectify statistical oversimplifications, and ensure that every architectural decision can withstand aggressive scrutiny during an academic viva and clinical evaluation.

### 1.1 Summary of Initial Weaknesses Corrected in this Audit
1. **Univariate Dismissal ("Zero Predictive Power")**: The initial audit dismissed `Blood Group`, `Marraige Status`, `Pregnant`, and `No. of aborptions` on the basis of univariate p-values and correlations. A feature with weak marginal correlation can still provide valuable non-linear interaction or orthogonal variance in an ensemble model. We have retracted all claims of "zero predictive power" and reframed these variables as candidates for formal multivariable ablation.
2. **Unsupported "Bias" Claims**: The initial audit asserted that reproductive features cause "demographic bias" without empirical subgroup disparity metrics. We now distinguish clinical appropriateness, demographic generalizability, and confounding from proven algorithmic bias.
3. **Over-Claim of "MCAR" Missingness**: We previously claimed that all missingness is Missing Completely at Random (MCAR). Low missingness and lack of target correlation do not prove MCAR. This claim has been retracted and replaced with a scientifically defensible characterization.
4. **Cycle Length Semantic Uncertainty**: The initial audit asserted that `Cycle length(days)` represents menses flow duration purely based on values ranging from 0 to 12. Because the dataset documentation is silent, this is an empirical inference, not a documented fact. The variable remains neutrally named `cycle_length_raw` with explicit acknowledgment of uncertainty.
5. **Pregnancy Confounding & Clinical Role of Beta-HCG**: We critically investigated whether pregnancy-related markers represent an acute physiological state that should act as an eligibility exclusion rather than a screening predictor.

---

## 2. Dataset Provenance, Scope, and Label Generation

### 2.1 Origin and Collection Context
The primary dataset (`PCOS_data_without_infertility.xlsx`, sheet `Full_new`) was compiled by Prasoon Kottarathil and collected across 10 fertility and obstetrics/gynecology hospital clinics in Kerala, India.

### 2.2 How Was the Target Label `PCOS (Y/N)` Assigned?
An ML model does not learn an abstract, platonic "disease entity"; it learns to reproduce the empirical labeling function of the dataset collectors.

Based on analysis of the accompanying CSBJ 2025 review paper (`main.pdf`) and the clinical variables recorded:
1. **Rotterdam 2003 Diagnostic Framework**: In hospital gynecology clinics in India, diagnosis of PCOS routinely follows the Rotterdam consensus, which requires at least two of the following three features (with exclusion of other etiologies):
   - Oligo- or anovulation (clinically observed via cycle irregularity).
   - Clinical and/or biochemical hyperandrogenism (hirsutism, acne, alopecia, elevated androgens).
   - Polycystic ovarian morphology on transvaginal ultrasound (TVS follicle count $\ge 12$ per ovary or increased ovarian volume).
2. **Label Generation Dependency**: The ground-truth label `PCOS (Y/N)` was assigned by attending physicians **after reviewing ultrasound scans and laboratory panels**.
3. **Supervised Learning Implication**: When training Tier 1 models on self-reported symptoms, the model is tasked with predicting an outcome that was originally confirmed using clinical and ultrasound tests. This is clinically and technically valid for pre-clinical triage, but must be explicitly acknowledged: **the model is learning to predict clinical diagnostic confirmation from pre-clinical evidence.**

---

## 3. Empirical Row-Order & Hospital Batch Effects Audit

In smaller observational datasets ($N = 541$), sequential ordering often reflects data collection batches, temporal recruitment, or hospital-specific intake blocks.

### 3.1 Quantitative Batch Analysis across Sequential 50-Patient Blocks

| Block (Rows) | Patient Count | PCOS Cases | PCOS Prevalence (%) | Mean Age (yrs) | Mean BMI ($\text{kg/m}^2$) | Pregnant Count |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **001 – 050** | 50 | 10 | 20.0% | 30.7 | 24.0 | 23 |
| **051 – 100** | 50 | 10 | 20.0% | 32.1 | 25.3 | 21 |
| **101 – 150** | 50 | 16 | 32.0% | 30.7 | 25.3 | 10 |
| **151 – 200** | 50 | 22 | 44.0% | 30.8 | 24.8 | 17 |
| **201 – 250** | 50 | 21 | 42.0% | 30.0 | 25.3 | 13 |
| **251 – 300** | 50 | 15 | 30.0% | 32.2 | 22.5 | 5 |
| **301 – 350** | 50 | 18 | 36.0% | 31.7 | 24.3 | 29 |
| **351 – 400** | 50 | 13 | 26.0% | 31.1 | 24.1 | 35 |
| **401 – 450** | 50 | 22 | 44.0% | 32.3 | 24.2 | 27 |
| **451 – 500** | 50 | 23 | 46.0% | 32.4 | 24.0 | 18 |
| **501 – 541** | 41 | 7 | 17.1% | 31.9 | 23.6 | 8 |

### 3.2 Findings & Methodological Defense
- **Prevalence Fluctuation**: PCOS prevalence varies from **17.1%** (Block 501–541) to **46.0%** (Block 451–500).
- **Pregnancy Clustering**: Pregnant patient counts range from 5 (Block 251–300) to 35 (Block 351–400).
- **Batch Interpretation**: This substantial non-random variation across contiguous row blocks indicates that patients were likely entered in batches by clinic, hospital, or department across the 10 participating centers in Kerala.
- **Validation Mandate**: A single train/test split or non-shuffled cross-validation would be severely confounded by these batch boundaries. **Repeated Stratified K-Fold Cross-Validation (with multiple random seeds and complete shuffling)** is mathematically mandatory to avoid overestimating generalization.

---

## 4. Re-Evaluation of Pregnancy, Beta-HCG, and Hormonal Confounding

The dataset includes 206 pregnant women (38.08%) and 335 non-pregnant women (61.92%).

### 4.1 Cross-Tabulation of Hormones by Pregnancy and PCOS Status

| Hormone Biomarker | Non-Pregnant, No PCOS ($N=222$) | Non-Pregnant, PCOS ($N=113$) | Pregnant, No PCOS ($N=142$) | Pregnant, PCOS ($N=64$) |
| :--- | :--- | :--- | :--- | :--- |
| **Beta-HCG I (mIU/mL)** | Median: 1.99<br>Mean: 220.9 | Median: 2.14<br>Mean: 363.2 | Median: 252.4<br>Mean: 1523.4 | Median: 341.8<br>Mean: 830.2 |
| **Progesterone (ng/mL)** | Median: 0.31<br>Range: 0.11–25.3 | Median: 0.32<br>Range: 0.05–1.10 | Median: 0.31<br>Range: 0.10–85.0 | Median: 0.32<br>Range: 0.10–0.98 |
| **FSH (mIU/mL)** | Median: 5.28<br>Mean: 5.73 | Median: 4.38<br>Mean: 5.37 | Median: 4.66<br>Mean: 40.2 (outlier) | Median: 4.82<br>Mean: 4.82 |
| **LH (mIU/mL)** | Median: 2.32<br>Mean: 2.71 | Median: 2.22<br>Mean: 20.7 (outlier) | Median: 2.24<br>Mean: 2.47 | Median: 2.19<br>Mean: 3.22 |
| **AMH (ng/mL)** | Median: 3.18<br>Mean: 4.73 | Median: 6.00<br>Mean: 8.22 | Median: 3.26<br>Mean: 4.25 | Median: 5.80<br>Mean: 7.18 |

### 4.2 Critical Insights on Pregnancy Confounding
1. **Beta-HCG is an Exclusion / Safety Check, NOT a PCOS Biomarker**:
   - In clinical practice, beta-hCG is evaluated before PCOS interventions to **rule out pregnancy**. It is not a diagnostic marker for PCOS.
   - 103 patients recorded as `Pregnant == 0` have beta-hCG $> 10\ \text{mIU/mL}$ (reaching up to $30,004\ \text{mIU/mL}$). This reflects recent miscarriages, early biochemical gestations, or ectopic evaluations common in hospital fertility clinics.
   - If an ML model trains on beta-hCG, it risks learning artifactual associations between hospital pregnancy testing protocols and PCOS labels.
2. **Progesterone reflects Luteal/Gestational Phase, NOT PCOS**:
   - Progesterone ranges from 0.05 to 85.0 ng/mL. All values $> 1.10\ \text{ng/mL}$ occur exclusively in non-PCOS patients, several of whom are pregnant (e.g., row 41: PRG = 85.0 ng/mL, Pregnant = 1).
   - In anovulatory PCOS, progesterone is chronically suppressed ($< 1.0\ \text{ng/mL}$). However, including progesterone in a model without cycle-phase normalization risks confusing luteal ovulation with non-PCOS status.
3. **Architectural Recommendation for OvaSense App**:
   - Active pregnancy must be an **eligibility screening question** in the OvaSense UI: pregnant users should be directed to antenatal care pathways.
   - In Tier 2 feature ablation, we will evaluate models with and without `beta_hcg_i`, `beta_hcg_ii`, and `progesterone` to guarantee that gestational hormone swings do not distort risk predictions.

---

## 5. Re-Check of the "Cycle Length" Semantic Decision

The column `Cycle length(days)` contains values ranging from 0 to 12.

- **Empirical Observation**: 51.0% (276/541) are 5 days; 92.2% are between 2 and 7 days.
- **Physiological Reality**: A 5-day cycle-to-cycle interval is physiologically impossible in adult humans. However, a 5-day bleeding duration is standard.
- **Documentation Status**: Neither the `Instructions` sheet nor Kottarathil's public Kaggle notes explicitly specify the exact operational definition of this column.
- **Corrected Action**:
  - We do NOT present our interpretation as a verified clinical fact.
  - We name the column `cycle_length_raw`.
  - We document: *"Empirical distribution suggests menstrual bleeding duration in days; however, authoritative metadata is absent, so semantic uncertainty is formally acknowledged."*

---

## 6. Full Inventory of Manual Data-Entry Corrections

Every manual intervention must be traceable, deterministic, and medically justified:

| Row Index (0-based) | Patient File No. | Column Name | Raw Recorded Value | Corrected Value | Detailed Medical & Data-Entry Rationale | Deterministic? | Alters Target Relation? |
| :---: | :---: | :--- | :---: | :---: | :--- | :---: | :---: |
| **123** | 124 | `II beta-HCG` | `'1.99.'` (str) | `1.99` (float) | Accidental double-period keystroke. Value is clearly 1.99. | Yes | No |
| **305** | 306 | `AMH(ng/mL)` | `'a'` (str) | `NaN` | Clinical shorthand for 'absent' or keyboard slip. Converted to NaN for fold-level imputation. | Yes | No |
| **161** | 162 | `BP Systolic` | `12` | `120.0` | Diastolic is 80 mmHg. A systolic of 12 mmHg in an outpatient is fatal; clearly missing trailing zero. | Yes | No |
| **200** | 201 | `BP Diastolic` | `8` | `80.0` | Systolic is 120 mmHg. Diastolic of 8 mmHg is fatal; clearly missing trailing zero. | Yes | No |
| **223** | 224 | `Pulse rate` | `18` | `NaN` | Pulse of 18 bpm is extreme non-physiological bradycardia for conscious outpatient. Converted to NaN. | Yes | No |
| **296** | 297 | `Pulse rate` | `13` | `NaN` | Pulse of 13 bpm is non-physiological. Converted to NaN for fold imputation. | Yes | No |
| **329** | 330 | `FSH(mIU/mL)` | `5052.0` | `NaN` | Normal follicular range is 3–12 mIU/mL. 5052 is an extreme data entry error. Replaced with NaN. | Yes | No |
| **455** | 456 | `LH(mIU/mL)` | `2018.0` | `NaN` | Value coincides with the collection year (2018), entered accidentally into the cell. Replaced with NaN. | Yes | No |
| **191** | 192 | `Vit D3` | `6014.66` | `NaN` | Extreme value $>5000\ \text{ng/mL}$ (toxic is $>100$). Unverified assay or unit error; replaced with NaN. | Yes | No |
| **195** | 196 | `Vit D3` | `5418.60` | `NaN` | Extreme value $>5000\ \text{ng/mL}$. Replaced with NaN for fold imputation. | Yes | No |

---

## 7. Numerical Stability & Redundancy of Derived Features

### 7.1 Gonadotropin Ratio: FSH vs. LH
- **Cleaned Ratio**: Median 2.17, Mean 4.38, Max 327.0.
- **Denominator Zeros**: Min LH is 0.02 mIU/mL. **Zero division does not occur**.
- **Clinical Relevance**: In classical endocrinology, the ratio is expressed as **LH/FSH**, where $\text{LH/FSH} > 2.0$ indicates hyperactive GnRH pulsatility in PCOS. In this dataset, raw column is recorded inverted as **FSH/LH**.
- **Ablation Necessity**: We will evaluate:
  - Configuration A: `fsh` + `lh` (Source features only)
  - Configuration B: `fsh_lh_ratio` only
  - Configuration C: `fsh` + `lh` + `fsh_lh_ratio`

### 7.2 Anthropometrics: BMI and WHR
- **Collinearity**:
  - `weight_kg` and `bmi`: $r = 0.9017$.
  - `waist_inch` and `hip_inch`: $r = 0.8734$.
- **Numerical Safeguards**: Min height is 137 cm ($>0$); min hip is 26 in ($>0$). No zero denominators exist.
- **Timing of Derivation**: Derived metrics are calculated deterministically from cleaned source variables inside the preprocessing pipeline.
