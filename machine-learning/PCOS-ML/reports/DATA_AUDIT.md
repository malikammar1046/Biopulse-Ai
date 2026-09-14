# Data Audit Report: OvaSense PCOS ML Pipeline

**Project**: OvaSense FYP  
**Date**: September 2026  
**Auditor**: OvaSense ML / Data Science Team  
**Status**: Authoritative Data Audit Complete  

---

## 1. Executive Summary & Authoritative File Verification

The OvaSense machine learning system evaluates Polycystic Ovary Syndrome (PCOS) risk using a progressive multi-tier architecture. To ensure medical defensibility, reproducibility, and prevent data leakage, a comprehensive empirical audit of all repository files was conducted.

### 1.1 File Authenticity & Cryptographic Hashes
The raw dataset files are strictly authoritative and remain 100% read-only throughout the pipeline.

| Filename | File Size | Cryptographic Hash (SHA-256) | Role |
| :--- | :--- | :--- | :--- |
| `PCOS_data_without_infertility.xlsx` | 125,274 bytes | `b663ec9f491be419718e0935eb1c5b6c4923b527282230a73cfc9aca8533f742` | **Authoritative Primary Dataset** |
| `PCOS_infertility.csv` | 15,378 bytes | `2e4f06b6dc68450c0e05d7a433dabd4ff50ad2edb7e9302d6103449a95b63ad3` | **Secondary Infertility Subset (Inspection Only)** |
| `main.pdf` | 2,536,085 bytes | `073b4a25c8677e0c9e520eaf0d7c4617ded3a65227d2f479c24e81fc9217f99c` | **Reference Scientific Literature** |

---

## 2. Primary Dataset Audit (`PCOS_data_without_infertility.xlsx`)

The primary spreadsheet contains two distinct worksheets:
1. `Instructions`: Operational guidelines, unit specifications, and encoding keys.
2. `Full_new`: The clinical patient matrix containing 541 records across 45 columns.

### 2.1 Instructions Sheet Analysis
The `Instructions` sheet provides explicit domain guidelines established by the collecting clinicians:
- **Instruction 1**: Standardize units (e.g., height in cm).
- **Instruction 4**: Yes/No binary questions coded as `Yes = 1`, `No = 0`.
- **Instruction 5**: Blood Group encoding key:
  - `A+ = 11`, `A- = 12`, `B+ = 13`, `B- = 14`, `O+ = 15`, `O- = 16`, `AB+ = 17`, `AB- = 18`.
- **Instruction 6**: Blood pressure recorded separately as systolic and diastolic (mmHg).
- **Instruction 9**: `RBS` denotes Random Blood Sugar (mg/dL).
- **Instruction 10**: Beta-HCG values entered as Case I and Case II; if only one test was performed, Case I is repeated in Case II.
- **Instruction 12**: PCOS status indicated by green cell formatting in raw visual records.

> [!NOTE]
> The `Instructions` sheet serves purely as operational metadata and is strictly excluded from machine learning processing.

---

## 3. Secondary Dataset Audit (`PCOS_infertility.csv`)

`PCOS_infertility.csv` contains 541 rows and 6 columns:
- Columns: `Sl. No`, `Patient File No.`, `PCOS (Y/N)`, `  I   beta-HCG(mIU/mL)`, `II    beta-HCG(mIU/mL)`, `AMH(ng/mL)`.
- **Row Alignment**: Exactly 541 rows matching the primary dataset one-to-one.
- **Identifier Offset**: `Patient File No.` uses a 10,000 offset (values range from 10,001 to 10,541 compared to 1 to 541 in `Full_new`).
- **Feature Redundancy**: All 4 clinical features present in this CSV (`PCOS (Y/N)`, `I beta-HCG`, `II beta-HCG`, `AMH`) are already present in the primary `Full_new` sheet.
- **Decision**: **Do NOT merge**. The primary sheet `Full_new` already contains the authoritative clinical superset.

---

## 4. Scientific Literature Audit (`main.pdf`)

The accompanying scientific document is the peer-reviewed survey:  
*“Intelligent detection for Polycystic Ovary Syndrome (PCOS): Taxonomy, datasets and detection tools”* (Computational and Structural Biotechnology Journal, 2025).

### Key Clinical & Technical Insights:
1. **Dataset Origin**: Identifies the primary dataset as the benchmark compiled by Prasoon Kottarathil, collected across 10 hospitals in Kerala, India.
2. **Ultrasound vs. Tabular Distinction**: Explicitly differentiates between:
   - **Tabular clinical datasets** (such as Kottarathil's 541-patient dataset containing structured demographic, hormonal, and physical metrics).
   - **Image datasets** (such as Choudhari's Kaggle dataset and the MMOTU ultrasound benchmark containing raw B-mode ultrasound scan images).
3. **Implication for OvaSense Tier 3**: This confirms that our current dataset contains **structured ultrasound measurements**, but **zero ultrasound image scans**. Tier 3 computer vision cannot be trained from this dataset.

---

## 5. Target Variable Audit: `PCOS (Y/N)`

The ground truth diagnostic label is recorded in column 2: `PCOS (Y/N)`.

- **Total Sample Size**: 541 records.
- **Missing / Null Count**: 0 (100% complete).
- **Invalid / Non-Binary Entries**: 0.
- **Class Breakdown**:
  - **Negative (Class 0 - No PCOS)**: 364 patients (**67.28%**)
  - **Positive (Class 1 - PCOS)**: 177 patients (**32.72%**)
- **Imbalance Ratio**: 2.06 : 1 (Moderate imbalance).
- **Implication**: Random splitting risks non-representative validation folds. **Stratified cross-validation is mandatory**.

---

## 6. Patient Identifier & Duplicate Audit

To prevent train/test contamination and evaluate potential patient clustering:
- `Sl. No`: 541 unique values (range 1 to 541). Serial row index.
- `Patient File No.`: 541 unique values (range 1 to 541). Identical to `Sl. No` in `Full_new`.
- **Exact Duplicate Rows (all 45 columns)**: 0.
- **Duplicate Records (excluding IDs)**: 0.
- **Clinical Vector Duplication**: Zero pairs of patients share identical feature vectors.
- **Conclusion**: Each record represents an independent, unique patient. No repeat visits or longitudinal clustering exist in this dataset.
- **Decision**: `Sl. No` and `Patient File No.` are administrative IDs with high risk of spurious memorization. **Both are strictly excluded from all feature sets.**

---

## 7. Complete 45-Column Audit Table

The table below documents every raw column in `Full_new` in original index order:

| Index | Raw Column Name | Proposed Clean Name | Raw Dtype | Missing Count (%) | Unique Values | Sample Values / Range | Semantic Role |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 0 | `Sl. No` | `sl_no` | `int64` | 0 (0.0%) | 541 | [1, 2, 3] / 1-541 | Administrative ID |
| 1 | `Patient File No.` | `patient_file_no` | `int64` | 0 (0.0%) | 541 | [1, 2, 3] / 1-541 | Administrative ID |
| 2 | `PCOS (Y/N)` | `pcos_diagnosis` | `int64` | 0 (0.0%) | 2 | [0, 1] / 364 neg, 177 pos | Target Variable |
| 3 | ` Age (yrs)` | `age` | `int64` | 0 (0.0%) | 29 | [28, 36, 33] / 20-48 yrs | Tier 1 Demographic |
| 4 | `Weight (Kg)` | `weight_kg` | `float64` | 0 (0.0%) | 117 | [44.6, 65.0, 68.8] / 31-108 kg | Tier 1 Anthropometry |
| 5 | `Height(Cm) ` | `height_cm` | `float64` | 0 (0.0%) | 50 | [152.0, 161.5, 165.0] / 137-180 cm | Tier 1 Anthropometry |
| 6 | `BMI` | `bmi` | `float64` | 0 (0.0%) | 355 | [19.3, 24.9, 25.3] / 12.4-38.9 | Tier 1 Anthropometry (Derived) |
| 7 | `Blood Group` | `blood_group` | `int64` | 0 (0.0%) | 8 | [15, 15, 11] / 11-18 | Tier 2 Hematology (Noise) |
| 8 | `Pulse rate(bpm) ` | `pulse_rate_bpm` | `int64` | 0 (0.0%) | 11 | [78, 74, 72] / 13-82 bpm | Tier 2 Clinical Vital |
| 9 | `RR (breaths/min)` | `respiratory_rate` | `int64` | 0 (0.0%) | 8 | [22, 20, 18] / 16-28 bpm | Tier 2 Clinical Vital |
| 10 | `Hb(g/dl)` | `hemoglobin` | `float64` | 0 (0.0%) | 46 | [10.48, 11.7, 11.8] / 8.5-14.8 | Tier 2 Lab Biomarker |
| 11 | `Cycle(R/I)` | `cycle_regularity` | `int64` | 0 (0.0%) | 3 | [2, 4, 5] / 390 reg, 151 irreg | Tier 1 Menstrual History |
| 12 | `Cycle length(days)` | `cycle_length_raw` | `int64` | 0 (0.0%) | 12 | [5, 5, 5] / 0-12 days (flow) | Tier 1 Menstrual History |
| 13 | `Marraige Status (Yrs)` | `marriage_years` | `float64` | 1 (0.18%) | 34 | [7.0, 11.0, 10.0] / 0-30 yrs | Tier 1 Demographic (Bias Risk) |
| 14 | `Pregnant(Y/N)` | `pregnant` | `int64` | 0 (0.0%) | 2 | [0, 1] / 335 no, 206 yes | Tier 1 Obstetric (Bias Risk) |
| 15 | `No. of aborptions` | `abortions_count` | `int64` | 0 (0.0%) | 6 | [0, 1, 2] / 0-5 count | Tier 1 Obstetric (Bias Risk) |
| 16 | `  I   beta-HCG(mIU/mL)` | `beta_hcg_i` | `float64` | 0 (0.0%) | 307 | [1.99, 60.8, 494.1] / 1.3-32461 | Tier 2 Lab Hormone |
| 17 | `II    beta-HCG(mIU/mL)` | `beta_hcg_ii` | `object` | 0 (0.0%) | 203 | ['1.99', '1.99.', '494.08'] | Tier 2 Lab Hormone (Typo) |
| 18 | `FSH(mIU/mL)` | `fsh` | `float64` | 0 (0.0%) | 371 | [7.95, 6.73, 5.54] / 0.21-5052 | Tier 2 Lab Hormone |
| 19 | `LH(mIU/mL)` | `lh` | `float64` | 0 (0.0%) | 342 | [3.68, 1.09, 0.88] / 0.02-2018 | Tier 2 Lab Hormone |
| 20 | `FSH/LH` | `fsh_lh_ratio` | `float64` | 0 (0.0%) | 512 | [2.16, 6.17, 6.30] / 0.002-1373 | Tier 2 Lab Ratio (Derived) |
| 21 | `Hip(inch)` | `hip_inch` | `int64` | 0 (0.0%) | 19 | [36, 38, 40] / 26-48 in | Tier 1 Anthropometry |
| 22 | `Waist(inch)` | `waist_inch` | `int64` | 0 (0.0%) | 23 | [30, 32, 36] / 24-47 in | Tier 1 Anthropometry |
| 23 | `Waist:Hip Ratio` | `waist_hip_ratio` | `float64` | 0 (0.0%) | 96 | [0.83, 0.84, 0.90] / 0.76-0.98 | Tier 1 Anthropometry (Derived) |
| 24 | `TSH (mIU/L)` | `tsh` | `float64` | 0 (0.0%) | 308 | [0.68, 3.16, 2.54] / 0.04-65.0 | Tier 2 Lab Hormone |
| 25 | `AMH(ng/mL)` | `amh` | `object` | 0 (0.0%) | 301 | ['2.07', '1.53', 'a'] / 0.1-66.0 | Tier 2 Lab Hormone (Typo) |
| 26 | `PRL(ng/mL)` | `prolactin` | `float64` | 0 (0.0%) | 481 | [45.16, 20.09, 10.52] / 0.4-128 | Tier 2 Lab Hormone |
| 27 | `Vit D3 (ng/mL)` | `vitamin_d3` | `float64` | 0 (0.0%) | 331 | [17.1, 61.3, 49.7] / 0.0-6015 | Tier 2 Lab Biomarker |
| 28 | `PRG(ng/mL)` | `progesterone` | `float64` | 0 (0.0%) | 89 | [0.57, 0.97, 0.36] / 0.05-85.0 | Tier 2 Lab Hormone |
| 29 | `RBS(mg/dl)` | `rbs` | `float64` | 0 (0.0%) | 55 | [92.0, 92.0, 84.0] / 60-350 | Tier 2 Metabolic Lab |
| 30 | `Weight gain(Y/N)` | `weight_gain` | `int64` | 0 (0.0%) | 2 | [0, 1] / 337 no, 204 yes | Tier 1 Symptom |
| 31 | `hair growth(Y/N)` | `hirsutism` | `int64` | 0 (0.0%) | 2 | [0, 1] / 393 no, 148 yes | Tier 1 Symptom |
| 32 | `Skin darkening (Y/N)` | `skin_darkening` | `int64` | 0 (0.0%) | 2 | [0, 1] / 375 no, 166 yes | Tier 1 Symptom |
| 33 | `Hair loss(Y/N)` | `hair_loss` | `int64` | 0 (0.0%) | 2 | [0, 1] / 296 no, 245 yes | Tier 1 Symptom |
| 34 | `Pimples(Y/N)` | `pimples_acne` | `int64` | 0 (0.0%) | 2 | [0, 1] / 276 no, 265 yes | Tier 1 Symptom |
| 35 | `Fast food (Y/N)` | `fast_food` | `float64` | 1 (0.18%) | 2 | [1.0, 0.0] / 278 yes, 262 no | Tier 1 Lifestyle |
| 36 | `Reg.Exercise(Y/N)` | `regular_exercise` | `int64` | 0 (0.0%) | 2 | [0, 1] / 407 no, 134 yes | Tier 1 Lifestyle |
| 37 | `BP _Systolic (mmHg)` | `bp_systolic` | `int64` | 0 (0.0%) | 6 | [110, 120, 12] / 12-140 mmHg | Tier 2 Clinical Vital |
| 38 | `BP _Diastolic (mmHg)` | `bp_diastolic` | `int64` | 0 (0.0%) | 5 | [80, 70, 8] / 8-100 mmHg | Tier 2 Clinical Vital |
| 39 | `Follicle No. (L)` | `follicle_no_l` | `int64` | 0 (0.0%) | 21 | [3, 3, 13] / 0-22 count | Tier 3 Ultrasound (TVS) |
| 40 | `Follicle No. (R)` | `follicle_no_r` | `int64` | 0 (0.0%) | 20 | [3, 5, 15] / 0-20 count | Tier 3 Ultrasound (TVS) |
| 41 | `Avg. F size (L) (mm)` | `avg_f_size_l` | `float64` | 0 (0.0%) | 31 | [18.0, 15.0, 18.0] / 0-24 mm | Tier 3 Ultrasound (TVS) |
| 42 | `Avg. F size (R) (mm)` | `avg_f_size_r` | `float64` | 0 (0.0%) | 32 | [18.0, 14.0, 20.0] / 0-24 mm | Tier 3 Ultrasound (TVS) |
| 43 | `Endometrium (mm)` | `endometrium_mm` | `float64` | 0 (0.0%) | 91 | [8.5, 3.7, 10.0] / 0-18 mm | Tier 3 Ultrasound (TVS) |
| 44 | `Unnamed: 44` | `unnamed_44` | `object` | 539 (99.6%) | 2 | ['.', 7] | Excel Trailing Artifact |

---

## 8. Summary of Dataset Readiness

1. **Integrity**: Original Excel and CSV files are cryptographically protected and verified.
2. **Completeness**: 42 out of 45 columns have 0 missing values. Only 2 clinical features have 1 missing entry (`Marraige Status` and `Fast food`), and 1 column is an Excel overflow artifact (`Unnamed: 44`).
3. **Data Types**: All features are numeric or binary, except `II beta-HCG` (contains `'1.99.'`), `AMH` (contains `'a'`), and `Unnamed: 44` (contains `.` and `7`). These are cleanly parsed in `src/preprocessing.py`.
4. **Target Validity**: Ground truth label is clean, complete, and uncorrupted.
