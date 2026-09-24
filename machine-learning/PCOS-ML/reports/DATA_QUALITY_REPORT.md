# Data Quality, Outlier & Demographic Bias Report

**Project**: OvaSense FYP  
**Date**: September 2026  
**Auditor**: OvaSense ML / Data Science Team  
**Status**: Authoritative Data Quality Audit Complete  

---

## 1. Data Cleaning & Malformed Value Treatment

Medical datasets frequently contain manual entry typos and formatting inconsistencies. Rather than silently modifying raw files, our cleaning pipeline (`src/preprocessing.py`) handles all corrections deterministically.

### 1.1 Documented Typographical Corrections

| Raw Column | Row Index (0-based) | Raw Malformed Value | Cleaned Value | Clinical / Technical Rationale |
| :--- | :--- | :--- | :--- | :--- |
| `II    beta-HCG(mIU/mL)` | 123 (Sl. No 124) | `'1.99.'` (string) | `1.99` (float) | Accidental trailing period entered during manual data entry in Excel. Cleaned deterministically to 1.99. |
| `AMH(ng/mL)` | 305 (Sl. No 306) | `'a'` (string) | `NaN` (float) | Clinical shorthand ('absent' or keyboard slip). Converted to NaN for fold-level median imputation. |
| `BP _Systolic (mmHg)` | 161 (Sl. No 162) | `12` (int) | `120.0` (float) | Clinically impossible systolic blood pressure (patient conscious, diastolic 80 mmHg). Missing trailing zero; corrected to 120 mmHg. |
| `BP _Diastolic (mmHg)` | 200 (Sl. No 201) | `8` (int) | `80.0` (float) | Clinically impossible diastolic blood pressure (systolic 120 mmHg). Missing trailing zero; corrected to 80 mmHg. |
| `Pulse rate(bpm) ` | 223 (Sl. No 224) | `18` (int) | `NaN` (float) | Non-physiological bradycardia incompatible with conscious outpatient triage. Replaced with NaN. |
| `Pulse rate(bpm) ` | 296 (Sl. No 297) | `13` (int) | `NaN` (float) | Non-physiological bradycardia. Replaced with NaN for training-fold imputation. |
| `FSH(mIU/mL)` | 329 (Sl. No 330) | `5052.0` (float) | `NaN` (float) | Impossible biological value (normal 1–12 mIU/mL; postmenopausal $< 100$). Replaced with NaN. |
| `LH(mIU/mL)` | 455 (Sl. No 456) | `2018.0` (float) | `NaN` (float) | Suspected year typo (2018) entered into cell. Normal range 2–20 mIU/mL. Replaced with NaN. |
| `Vit D3 (ng/mL)` | 191 (Sl. No 192) | `6014.66` (float) | `NaN` (float) | Impossible biological serum concentration (normal 20–50 ng/mL, severe toxicity $> 100$). Likely assay unit mismatch (pg/mL) or shift. |
| `Vit D3 (ng/mL)` | 195 (Sl. No 196) | `5418.60` (float) | `NaN` (float) | Impossible biological serum concentration. Replaced with NaN for training-fold imputation. |
| `Unnamed: 44` | 180 & 363 | `.` and `7` | Dropped | Column is 99.63% missing (539 NaNs). Trailing Excel artifact column; completely dropped. |

---

## 2. Missing Value Analysis

The primary dataset exhibits remarkably high completeness across clinical fields:

| Column Name | Clean Name | Missing Count | Missing % | Target Distribution of Missing Records | Missingness Mechanism & Imputation Strategy |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `Marraige Status (Yrs)` | `marriage_years` | 1 | 0.18% | Row 458: Target = 0 (No PCOS) | No strong evidence of target-associated missingness detected; imputed via training-fold median. |
| `Fast food (Y/N)` | `fast_food` | 1 | 0.18% | Row 156: Target = 1 (PCOS) | No strong evidence of target-associated missingness detected; imputed via training-fold mode. |
| `AMH(ng/mL)` | `amh` | 1 (after `'a'`) | 0.18% | Row 305: Target = 0 (No PCOS) | Unparseable shorthand; imputed via training-fold median. |
| `Pulse rate(bpm) ` | `pulse_rate_bpm` | 2 (after typos) | 0.37% | Rows 223, 296: Both Target = 0 | Typographical omission. Imputed via training-fold median. |
| `FSH(mIU/mL)` | `fsh` | 1 (after 5052) | 0.18% | Row 329: Target = 0 | Data-entry error. Imputed via training-fold median. |
| `LH(mIU/mL)` | `lh` | 1 (after 2018) | 0.18% | Row 455: Target = 1 | Data-entry error. Imputed via training-fold median. |
| `Vit D3 (ng/mL)` | `vitamin_d3` | 2 (after >1000) | 0.37% | Rows 191, 195: Both Target = 1 | Measurement error. Imputed via training-fold median. |
| `Unnamed: 44` | `unnamed_44` | 539 | 99.63% | Non-informative | **Column excluded entirely**. |

> [!NOTE]
> All imputations occur **strictly inside each cross-validation fold**. No global dataset statistics are used.

---

## 3. Clinically Informed Outlier Analysis

We separate **legitimate biological extremes** (which reflect true PCOS phenotypes and must be preserved) from **data entry errors** (which corrupt linear weights and distance metrics).

| Column | Observed Min | 1st Percentile | Median | 99th Percentile | Observed Max | Clinical Assessment & Action |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `Age (yrs)` | 20 | 22.0 | 31.0 | 45.0 | 48 | **Valid biological range** for reproductive-aged females. |
| `Weight (Kg)` | 31.0 | 38.0 | 59.0 | 88.0 | 108.0 | **Valid biological range** (spans underweight to morbid obesity). |
| `Height(Cm)` | 137.0 | 143.0 | 156.0 | 170.0 | 180.0 | **Valid biological range** in Indian female population. |
| `BMI` | 12.42 | 16.02 | 24.24 | 34.61 | 38.90 | **Valid biological range** reflecting phenotypic diversity. |
| `Pulse rate(bpm)` | 13 | 70.0 | 72.0 | 80.0 | 82 | **Entries 13 and 18 are impossible typos**; remainder valid. |
| `RR (breaths/min)` | 16 | 16.0 | 18.0 | 24.0 | 28 | **Valid biological range** (normal resting respiratory rate). |
| `Hb(g/dl)` | 8.5 | 9.6 | 11.0 | 13.8 | 14.8 | **Valid biological range** (mild anemia to normal female range). |
| `I beta-HCG` | 1.3 | 1.99 | 20.0 | 15,200 | 32,461 | **Valid biological range**; highly elevated values occur in pregnancy. |
| `FSH(mIU/mL)` | 0.21 | 1.00 | 4.85 | 15.30 | 5,052 | **5052 is an error**. 99% of values lie $< 15.3\ \text{mIU/mL}$. |
| `LH(mIU/mL)` | 0.02 | 0.10 | 2.30 | 10.70 | 2,018 | **2018 is an error**. 99% of values lie $< 10.7\ \text{mIU/mL}$. |
| `TSH (mIU/L)` | 0.04 | 0.30 | 2.26 | 16.80 | 65.0 | **Valid clinical extremes**; reflects severe primary hypothyroidism. |
| `AMH(ng/mL)` | 0.10 | 0.20 | 3.70 | 21.00 | 66.0 | **Valid biological extremes**; AMH $> 10$ is characteristic of PCOS. |
| `PRL(ng/mL)` | 0.40 | 3.90 | 21.92 | 94.90 | 128.2 | **Valid clinical extremes**; reflects hyperprolactinemia. |
| `Vit D3 (ng/mL)` | 0.00 | 9.30 | 25.90 | 72.90 | 6,014.66 | **Values > 1000 are unit errors**; 99th percentile is 72.9. |
| `PRG(ng/mL)` | 0.047 | 0.10 | 0.32 | 1.30 | 85.0 | **Valid biological range**; 85.0 ng/mL occurs in pregnancy (row 41). |
| `RBS(mg/dl)` | 60.0 | 72.0 | 100.0 | 143.6 | 350.0 | **Valid biological range**; reflects overt type 2 diabetes mellitus. |
| `BP Systolic` | 12 | 100.0 | 110.0 | 130.0 | 140 | **12 is a typo for 120**; remainder valid. |
| `BP Diastolic` | 8 | 70.0 | 80.0 | 80.0 | 100 | **8 is a typo for 80**; remainder valid. |
| `Follicle No. (L)`| 0 | 0.0 | 5.0 | 19.2 | 22 | **Valid TVS range**; $>12$ indicates polycystic morphology. |
| `Follicle No. (R)`| 0 | 0.0 | 6.0 | 19.6 | 20 | **Valid TVS range**; $>12$ indicates polycystic morphology. |

---

## 4. Derived Feature Consistency & Numerical Audit

We investigated whether spreadsheet-calculated variables match their deterministic biological formulas:

### 4.1 Body Mass Index (BMI)
- **Formula**: $\text{BMI} = \text{weight\_kg} / (\text{height\_cm} / 100)^2$
- **Exact Match ($\Delta = 0$)**: 7 / 541 (1.29%)
- **Match within $\pm 0.01\ \text{kg/m}^2$**: 347 / 541 (64.14%)
- **Match within $\pm 0.1\ \text{kg/m}^2$**: 535 / 541 (98.89%)
- **Discrepancies $> 0.1\ \text{kg/m}^2$**: 6 / 541 (1.11%)
  - Row 440: Recorded 20.3 vs. Calculated 21.88 ($\Delta = 1.58$)
  - Row 402: Recorded 25.0 vs. Calculated 26.04 ($\Delta = 1.04$)
  - Row 481: Recorded 30.8 vs. Calculated 30.18 ($\Delta = 0.62$)
- **Action**: In preprocessing, calculate deterministic BMI from height and weight to eliminate spreadsheet rounding errors.

### 4.2 Waist-to-Hip Ratio (WHR)
- **Formula**: $\text{WHR} = \text{waist\_inch} / \text{hip\_inch}$
- **Match within $10^{-4}$**: 534 / 541 (98.71%)
- **Discrepancies $> 10^{-4}$**: 7 / 541 (1.29%), with maximum discrepancy of only $0.000865$.
- **Action**: Calculated deterministically in pipeline.

### 4.3 FSH / LH Ratio
- **Formula**: $\text{Ratio} = \text{FSH} / \text{LH}$
- **Match within $10^{-4}$**: 532 / 541 (98.34%)
- **Discrepancies $> 10^{-4}$**: 9 / 541 (1.66%), with maximum discrepancy of $0.025$ at row 151.
- **Action**: Calculated deterministically from cleaned FSH and LH.

---

## 5. Reproductive & Demographic Bias Analysis

A critical requirement for OvaSense is that the model must not be biased against demographic sub-populations (such as young, unmarried, or nulliparous women).

### 5.1 Quantitative Association with PCOS Target

| Feature | Category / Values | Count | Non-PCOS (0) | PCOS (1) | PCOS % | Statistical Association | Bias Risk & Decision |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `Pregnant(Y/N)` | 0 (Not Pregnant)<br>1 (Pregnant) | 335<br>206 | 222<br>142 | 113<br>64 | 33.73%<br>31.07% | $\chi^2 = 0.4144$<br>$p = 0.5197$ (Not Significant) | **Severe clinical bias**. Pregnancy confounds hormone levels. **Excluded from Core Tier 1**. |
| `No. of aborptions` | 0 abortions<br>$\ge 1$ abortions | 437<br>104 | 298<br>66 | 139<br>38 | 31.81%<br>36.54% | $\chi^2 = 0.8652$<br>$p = 0.3523$ (Not Significant) | **Severe reproductive bias** against nulliparous women. **Excluded from Core Tier 1**. |
| `Marraige Status (Yrs)` | Continuous (0–30 yrs)<br>Mean: 7.68 yrs | 540 | Mean: 7.63<br>Median: 7.0 | Mean: 7.79<br>Median: 7.0 | N/A | $r = +0.0163$<br>$p = 0.7061$ (Not Significant) | **Severe social bias** against unmarried adolescents/young adults. **Excluded from Core Tier 1**. |

### 5.2 Viva & Academic Defensibility
If an examiner asks:  
*"Why did you remove marriage duration and pregnancy status from Tier 1?"*  
**Our Defensible Answer**:  
1. **Statistical independence**: None of the three features exhibits a statistically significant association with PCOS in this dataset ($p > 0.35$ for all).
2. **Clinical purpose**: OvaSense is a general-population screening tool for all women, including 18-year-old unmarried university students. Requiring marriage duration or pregnancy history creates an institutional selection bias inherited from infertility clinic datasets.
3. **Endocrine confounding**: Pregnancy alters beta-hCG, progesterone, and gonadotropins, obscuring diagnostic PCOS thresholds.

---

## 6. Cycle Length Semantics Verification

The column `Cycle length(days)` has values ranging strictly from 0 to 12 days.

### 6.1 Empirical Distribution
- Min: 0, 25th percentile: 4.0, Median: 5.0, Mean: 4.94, 75th percentile: 5.0, Max: 12.0.
- Exactly 276 out of 541 patients (**51.0%**) have a value of 5.
- Over 92% of patients have values between 2 and 7 days.

### 6.2 Medical Evidence
In clinical gynecology:
- A normal **menstrual cycle interval** (interval from Day 1 of menses to Day 1 of the next menses) is **21 to 35 days** (average 28 days). A cycle interval of 5 days is physiologically impossible.
- The **duration of menstrual flow / bleeding days** is typically **3 to 7 days** (average 5 days).
- In regular cycles (`Cycle(R/I) == 2`), the standard deviation is only 0.58 days (tightly clustered around 5.0 days). In irregular cycles (`Cycle(R/I) == 4`), values range from 0 to 12 days, reflecting menorrhagia (prolonged bleeding up to 12 days) or scanty oligomenorrhea (2–3 days).

### 6.3 Action Taken
To avoid misrepresenting the feature to ML models or reviewers:
- Formally renamed to `cycle_length_raw`.
- Documented in all reports as representing **menstrual bleeding duration in days**.

---

## 7. Categorical Feature Audit: Blood Group

- **Encoding**: 11=A+, 12=A-, 13=B+, 14=B-, 15=O+, 16=O-, 17=AB+, 18=AB-.
- **Prevalence across groups**:
  - A+: 31.48% PCOS (34 / 108)
  - A-: 30.77% PCOS (4 / 13)
  - B+: 31.11% PCOS (42 / 135)
  - B-: 37.50% PCOS (6 / 16)
  - O+: 32.04% PCOS (66 / 206)
  - O-: 42.11% PCOS (8 / 19)
  - AB+: 38.10% PCOS (16 / 42)
  - AB-: 50.00% PCOS (1 / 2)
- **Chi-Square Test**: $\chi^2 = 2.0488, \text{df} = 7, p = 0.9571$.
- **Conclusion**: No meaningful univariate association was detected in this dataset. One-hot encoding would add 7 degrees of freedom of sparse categories, increasing complexity and risk of overfitting on small sub-cohorts.
- **Decision**: **Candidate excluded from Core Tier 2; retained for multivariable ablation evaluation.**
