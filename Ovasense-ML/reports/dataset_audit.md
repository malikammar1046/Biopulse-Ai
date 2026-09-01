# OvaSense-ML — Dataset Audit Report

**Project**: OvaSense Standalone PCOS Risk-Screening Machine Learning  
**Date**: August 2026  
**Auditor**: ML Engineering & Data Science Team  
**Dataset Source**: `data/raw/PCOS_data_without_infertility.xlsx` (Sheet: `Full_new`) & `PCOS_infertility.csv`  

---

## 1. Executive Summary

A comprehensive, rigorous clinical data audit was conducted on the PCOS dataset provided for the OvaSense project. The raw dataset comprises **541 patient records** across **45 columns** (44 clinical/demographic/laboratory attributes plus 1 stray column artifact). 

The primary objective of OvaSense is to build an accessible, non-invasive **PCOS risk-screening system** that estimates the likelihood of PCOS using patient-reportable symptoms, lifestyle, anthropometric, and menstrual features without requiring invasive hormonal assays or pelvic ultrasound.

```
Total Rows: 541
Total Columns: 45 (42 active clinical features + 2 identifiers + 1 empty artifact column)
Target Column: 'PCOS (Y/N)'
Target Distribution: 364 Negative (67.28%), 177 Positive (32.72%)
Imbalance Ratio: ~2.06 : 1
Duplicate Patient Records: 0 (All 541 records represent unique clinical profiles)
```

---

## 2. Dataset Dimensions & Schema Overview

* **Rows**: 541 observations
* **Columns in Raw Excel**: 45
* **Sheet Names in Excel**:
  1. `Instructions`: Contains 12 standardized clinical data collection protocol instructions from the hospital/study coordinators.
  2. `Full_new`: The primary patient tabular dataset.
* **Accompanying CSV**: `PCOS_infertility.csv` (541 rows, 6 columns: `Sl. No`, `Patient File No.`, `PCOS (Y/N)`, `I beta-HCG`, `II beta-HCG`, `AMH`).

---

## 3. Complete Column Inventory (All 45 Columns)

| # | Column Name (Raw) | Clean Name | Data Type | Nulls | Null % | Uniques | Min | Max | Mean / Top | Median | Likely Clinical Meaning |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `Sl. No` | `sl_no` | `int64` | 0 | 0.00% | 541 | 1 | 541 | 271.00 | 271.0 | Patient serial/row sequence number (Identifier) |
| 2 | `Patient File No.` | `patient_file_no` | `int64` | 0 | 0.00% | 541 | 1 | 541 | 271.00 | 271.0 | Hospital medical record number (Identifier) |
| 3 | `PCOS (Y/N)` | `pcos_yn` | `int64` | 0 | 0.00% | 2 | 0 | 1 | 32.72% Pos | 0.0 | **Primary Binary Target Label** (0=No, 1=Yes) |
| 4 | ` Age (yrs)` | `age_years` | `int64` | 0 | 0.00% | 29 | 20 | 48 | 31.43 yrs | 31.0 | Patient chronological age in years |
| 5 | `Weight (Kg)` | `weight_kg` | `float64` | 0 | 0.00% | 117 | 31.0 | 108.0 | 59.64 kg | 59.0 | Patient body weight in kilograms |
| 6 | `Height(Cm) ` | `height_cm` | `float64` | 0 | 0.00% | 50 | 137.0 | 180.0 | 156.48 cm | 156.0 | Patient standing height in centimeters |
| 7 | `BMI` | `bmi` | `float64` | 0 | 0.00% | 355 | 12.42 | 38.90 | 24.31 kg/m² | 24.24 | Body Mass Index ($kg/m^2$) |
| 8 | `Blood Group` | `blood_group` | `int64` | 0 | 0.00% | 8 | 11 | 18 | Mode: 15 (O+) | 14.0 | ABO/Rh group coded (11=A+, 12=A-, 13=B+, 14=B-, 15=O+, 16=O-, 17=AB+, 18=AB-) |
| 9 | `Pulse rate(bpm) ` | `pulse_rate_bpm` | `int64` | 0 | 0.00% | 11 | 13 | 82 | 73.25 bpm | 72.0 | Resting heart rate (contains severe data entry errors 13, 18) |
| 10 | `RR (breaths/min)` | `rr_breaths_min` | `int64` | 0 | 0.00% | 8 | 16 | 28 | 19.24 /min | 18.0 | Resting respiratory rate |
| 11 | `Hb(g/dl)` | `hb_g_dl` | `float64` | 0 | 0.00% | 46 | 8.5 | 14.8 | 11.16 g/dL | 11.0 | Blood hemoglobin concentration |
| 12 | `Cycle(R/I)` | `cycle_ri` | `int64` | 0 | 0.00% | 3 | 2 | 5 | Mode: 2 (Reg) | 2.0 | Menstrual cycle regularity (2=Regular, 4=Irregular, 5=Encoding anomaly) |
| 13 | `Cycle length(days)` | `cycle_length_days` | `int64` | 0 | 0.00% | 12 | 0 | 12 | 4.94 days | 5.0 | Menstrual bleeding duration / menses length in days |
| 14 | `Marraige Status (Yrs)` | `marriage_status_years` | `float64` | 1 | 0.18% | 35 | 0.0 | 30.0 | 7.68 yrs | 7.0 | Duration of marriage in years |
| 15 | `Pregnant(Y/N)` | `pregnant_yn` | `int64` | 0 | 0.00% | 2 | 0 | 1 | 38.08% Yes | 0.0 | Current / history of pregnancy |
| 16 | `No. of aborptions` | `no_of_abortions` | `int64` | 0 | 0.00% | 6 | 0 | 5 | 0.29 | 0.0 | Number of spontaneous or induced pregnancy losses |
| 17 | `  I   beta-HCG(mIU/mL)` | `beta_hcg_i` | `float64` | 0 | 0.00% | 307 | 1.30 | 32460.97 | 664.55 mIU/mL | 20.0 | Serum Beta-hCG initial test (Pregnancy marker) |
| 18 | `II    beta-HCG(mIU/mL)` | `beta_hcg_ii` | `object` | 0 | 0.00% | 203 | 0.99 | 25000.00 | 238.67 mIU/mL | 1.99 | Serum Beta-hCG repeat test (contains string typo '1.99.') |
| 19 | `FSH(mIU/mL)` | `fsh_miu_ml` | `float64` | 0 | 0.00% | 371 | 0.21 | 5052.00 | 14.60 mIU/mL | 4.85 | Follicle-Stimulating Hormone (contains extreme outlier 5052.0) |
| 20 | `LH(mIU/mL)` | `lh_miu_ml` | `float64` | 0 | 0.00% | 342 | 0.02 | 2018.00 | 6.47 mIU/mL | 2.30 | Luteinizing Hormone (contains extreme outlier 2018.0) |
| 21 | `FSH/LH` | `fsh_lh_ratio` | `float64` | 0 | 0.00% | 512 | 0.002 | 1372.83 | 6.90 | 2.17 | Calculated ratio of FSH to LH |
| 22 | `Hip(inch)` | `hip_inch` | `int64` | 0 | 0.00% | 19 | 26 | 48 | 37.99 in | 38.0 | Hip circumference in inches |
| 23 | `Waist(inch)` | `waist_inch` | `int64` | 0 | 0.00% | 23 | 24 | 47 | 33.84 in | 34.0 | Waist circumference in inches |
| 24 | `Waist:Hip Ratio` | `waist_hip_ratio` | `float64` | 0 | 0.00% | 96 | 0.76 | 0.98 | 0.89 | 0.89 | Waist-to-Hip Ratio ($Waist / Hip$) |
| 25 | `TSH (mIU/L)` | `tsh_miu_l` | `float64` | 0 | 0.00% | 308 | 0.04 | 65.00 | 2.98 mIU/L | 2.26 | Thyroid-Stimulating Hormone |
| 26 | `AMH(ng/mL)` | `amh_ng_ml` | `object` | 0 | 0.00% | 301 | 0.10 | 66.00 | 5.62 ng/mL | 3.70 | Anti-Müllerian Hormone (contains string typo 'a') |
| 27 | `PRL(ng/mL)` | `prl_ng_ml` | `float64` | 0 | 0.00% | 481 | 0.40 | 128.24 | 24.32 ng/mL | 21.92 | Prolactin level |
| 28 | `Vit D3 (ng/mL)` | `vit_d3_ng_ml` | `float64` | 0 | 0.00% | 331 | 0.00 | 6014.66 | 49.92 ng/mL | 25.90 | 25-Hydroxy Vitamin D3 (contains extreme outliers 6014.66, 5418.6) |
| 29 | `PRG(ng/mL)` | `prg_ng_ml` | `float64` | 0 | 0.00% | 89 | 0.047 | 85.00 | 0.61 ng/mL | 0.32 | Progesterone level |
| 30 | `RBS(mg/dl)` | `rbs_mg_dl` | `float64` | 0 | 0.00% | 55 | 60.0 | 350.0 | 99.84 mg/dL | 100.0 | Random Blood Sugar / glucose |
| 31 | `Weight gain(Y/N)` | `weight_gain_yn` | `int64` | 0 | 0.00% | 2 | 0 | 1 | 37.71% Yes | 0.0 | Recent unexplained weight gain (Symptom) |
| 32 | `hair growth(Y/N)` | `hair_growth_yn` | `int64` | 0 | 0.00% | 2 | 0 | 1 | 27.36% Yes | 0.0 | Clinical Hirsutism / excess facial or body hair (Symptom) |
| 33 | `Skin darkening (Y/N)` | `skin_darkening_yn` | `int64` | 0 | 0.00% | 2 | 0 | 1 | 30.68% Yes | 0.0 | Acanthosis nigricans / skin hyperpigmentation (Symptom) |
| 34 | `Hair loss(Y/N)` | `hair_loss_yn` | `int64` | 0 | 0.00% | 2 | 0 | 1 | 45.29% Yes | 0.0 | Androgenic alopecia / scalp hair thinning (Symptom) |
| 35 | `Pimples(Y/N)` | `pimples_yn` | `int64` | 0 | 0.00% | 2 | 0 | 1 | 48.98% Yes | 0.0 | Clinical Acne / pimples (Symptom) |
| 36 | `Fast food (Y/N)` | `fast_food_yn` | `float64` | 1 | 0.18% | 3 | 0.0 | 1.0 | 51.48% Yes | 1.0 | Regular fast-food consumption (Lifestyle) |
| 37 | `Reg.Exercise(Y/N)` | `reg_exercise_yn` | `int64` | 0 | 0.00% | 2 | 0 | 1 | 24.77% Yes | 0.0 | Regular physical exercise participation (Lifestyle) |
| 38 | `BP _Systolic (mmHg)` | `bp_systolic_mmhg` | `int64` | 0 | 0.00% | 6 | 12 | 140 | 114.66 mmHg | 110.0 | Systolic blood pressure (contains entry error 12) |
| 39 | `BP _Diastolic (mmHg)` | `bp_diastolic_mmhg` | `int64` | 0 | 0.00% | 5 | 8 | 100 | 76.93 mmHg | 80.0 | Diastolic blood pressure (contains entry error 8) |
| 40 | `Follicle No. (L)` | `follicle_no_l` | `int64` | 0 | 0.00% | 21 | 0 | 22 | 6.13 | 5.0 | Antral follicle count left ovary (Ultrasound) |
| 41 | `Follicle No. (R)` | `follicle_no_r` | `int64` | 0 | 0.00% | 20 | 0 | 20 | 6.64 | 6.0 | Antral follicle count right ovary (Ultrasound) |
| 42 | `Avg. F size (L) (mm)` | `avg_f_size_l_mm` | `float64` | 0 | 0.00% | 31 | 0.0 | 24.0 | 15.02 mm | 15.0 | Average follicle diameter left ovary (Ultrasound) |
| 43 | `Avg. F size (R) (mm)` | `avg_f_size_r_mm` | `float64` | 0 | 0.00% | 32 | 0.0 | 24.0 | 15.45 mm | 16.0 | Average follicle diameter right ovary (Ultrasound) |
| 44 | `Endometrium (mm)` | `endometrium_mm` | `float64` | 0 | 0.00% | 91 | 0.0 | 18.0 | 8.48 mm | 8.5 | Endometrial stripe thickness (Ultrasound) |
| 45 | `Unnamed: 44` | `unnamed_44` | `object` | 539 | 99.63% | 3 | 7.0 | 7.0 | Stray text | NaN | **Corrupted Ghost Column** (539 NaNs, stray '.' and '7') |

---

## 4. Target Variable Analysis: `PCOS (Y/N)`

The target variable represents the clinical diagnosis of PCOS assigned during hospital workup.

* **Class 0 (Negative / Non-PCOS)**: 364 patients (**67.28%**)
* **Class 1 (Positive / PCOS)**: 177 patients (**32.72%**)
* **Total Sample Size**: 541 patients
* **Prevalence / Prior Probability**: 32.72%
* **Imbalance Assessment**: Moderate class imbalance (~2.06:1). Standard accuracy would produce a deceptive baseline of 67.28% by simply predicting negative. Stratified sampling and evaluation using **Sensitivity/Recall**, **PR-AUC**, and **Brier Score** are mandatory.

---

## 5. Duplicate Records Analysis

1. **Exact Row Duplicates**: **0** rows across all 45 columns.
2. **Clinical Feature Duplicates** (excluding `Sl. No`, `Patient File No.`, and `Unnamed: 44`): **0** rows.
3. **Conclusion**: Every record represents a distinct patient with unique biometric, symptom, and laboratory measurements. No deduplication deletion is required.

---

## 6. Comprehensive Data Quality & Anomaly Catalog

A deep audit identified multiple clinical impossibilities, string-in-numeric corruption, and data collection artifacts:

### A. Non-Numeric Data in Continuous Columns (String Corruption)
1. **`AMH(ng/mL)` (Row index 305, `Sl. No` 306)**:
   * Value: `'a'` (String character)
   * Impact: Forced pandas to read the entire column as `object`.
   * Remedy: Coerce to NaN and impute via median/iterative imputer during preprocessing.
2. **`II beta-HCG(mIU/mL)` (Row index 123, `Sl. No` 124)**:
   * Value: `'1.99.'` (Trailing period typo)
   * Note: In `PCOS_infertility.csv`, this row was improperly parsed as `0.110416667`. In Excel, `I beta-HCG` for this patient is `1.99`. Following Instruction #10 ("repeat the previous one if only one exist"), the true intended value is `1.99`.
   * Remedy: Clean string, cast to float.

### B. Severe Vital Sign / Clinical Impossibilities (Transposition Errors)
1. **`Pulse rate(bpm) ` = 13 and 18**:
   * Patient `Sl. No` 297: Pulse rate = **13 bpm** (Physiologically incompatible with life for walking patient).
   * Patient `Sl. No` 224: Pulse rate = **18 bpm**.
   * Clinical Root Cause: Respiratory Rate (RR) values in this dataset are 16, 18, 20. The values 13 and 18 represent **column transposition errors** where RR was accidentally recorded in the Pulse Rate column.
   * Remedy: Treat <= 40 bpm as invalid entry; replace with training-set median during pipeline preprocessing.
2. **`BP _Systolic (mmHg)` = 12**:
   * Patient `Sl. No` 162: Systolic BP = **12 mmHg** (Diastolic BP = 80 mmHg).
   * Clinical Root Cause: Typo missing a trailing zero (intended value was 120 mmHg).
   * Remedy: Treat < 60 mmHg as invalid entry; impute with 120 or median.
3. **`BP _Diastolic (mmHg)` = 8**:
   * Patient `Sl. No` 201: Diastolic BP = **8 mmHg** (Systolic BP = 120 mmHg).
   * Clinical Root Cause: Typo missing a trailing zero (intended value was 80 mmHg).
   * Remedy: Treat < 40 mmHg as invalid entry; impute with 80 or median.

### C. Extreme Laboratory Value Outliers
1. **`Vit D3 (ng/mL)` = 6014.66 and 5418.60**:
   * Patient `Sl. No` 192: 6014.66 ng/mL; Patient `Sl. No` 196: 5418.60 ng/mL.
   * Clinical Reference Range: 20–100 ng/mL (toxicity threshold ~150 ng/mL). 6000+ is a massive decimal/unit transcription artifact (likely 60.14 and 54.18).
2. **`FSH(mIU/mL)` = 5052.0**:
   * Patient `Sl. No` 330: FSH = 5052.0 mIU/mL, LH = 3.68 mIU/mL, resulting in FSH/LH = 1372.83.
   * Clinical Reference Range: 1.5–12.0 mIU/mL.
3. **`LH(mIU/mL)` = 2018.0**:
   * Patient `Sl. No` 456: LH = 2018.0 mIU/mL, FSH = 4.33 mIU/mL, resulting in FSH/LH = 0.0021.
   * Clinical Reference Range: 1.0–15.0 mIU/mL.

### D. Categorical Coding Inconsistencies
1. **`Cycle(R/I)`**:
   * Standard encoding: `2` = Regular (390 patients), `4` = Irregular (150 patients).
   * Anomaly: `5` (1 patient at `Sl. No` 513, Cycle length = 7 days).
   * Remedy: Map 2 -> Regular (0), 4 & 5 -> Irregular (1).
2. **`Blood Group`**:
   * Encodings: 11 to 18 representing A+, A-, B+, B-, O+, O-, AB+, AB-.
   * Note: This is an integer-encoded nominal categorical variable, NOT an ordinal numerical variable. Must be treated as categorical / one-hot encoded if used.

### E. Missing Values
1. `Marraige Status (Yrs)`: 1 missing value at `Sl. No` 459 (0.18%).
2. `Fast food (Y/N)`: 1 missing value at `Sl. No` 157 (0.18%).
3. `Unnamed: 44`: 539 missing values (99.63%). Contains 1 `.` (`Sl. No` 181) and 1 `7` (`Sl. No` 364).

---

## 7. Audit Conclusion & Preprocessing Guidance

1. The dataset contains **high quality signal** across patient symptoms, anthropometrics, and cycle characteristics, with moderate missingness (<0.2% on active columns).
2. All data cleaning and imputation steps MUST be enclosed in scikit-learn preprocessing pipelines fit strictly on training folds to prevent data leakage.
3. Model training must NOT proceed until feature boundaries (Core vs Extended vs Full Clinical) and leakage exclusions are strictly finalized.
