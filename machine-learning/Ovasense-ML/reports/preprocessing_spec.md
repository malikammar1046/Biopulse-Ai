# OvaSense-ML — Preprocessing Specification & Data Dictionary

**Project**: OvaSense Standalone PCOS Risk-Screening Machine Learning  
**Phase**: Phase 2 — Preprocessing, Split & Baseline ML  
**Status**: Approved Specification & Implemented Pipeline  
**Module**: [`src/preprocessing.py`](file:///c:/Users/hp/Desktop/Ovasense-ML/src/preprocessing.py)  

---

## 1. Scope & Objective

This document defines the formal preprocessing specifications for the **16-feature OvaSense CORE model**.  
The primary clinical objective of OvaSense is to estimate PCOS screening risk using exclusively **patient-accessible, non-invasive features** (demographics, anthropometrics, menstrual patterns, symptoms, and lifestyle indicators) that can be reported by an individual at home without laboratory blood assays or pelvic ultrasound imaging.

---

## 2. OvaSense CORE Feature Dictionary

The 16 features selected for the primary screening model are detailed below:

| # | Feature (Clean Name) | Raw Column Name | Data Type | Clinical / Measurement Role | Expected Clinical Range | Patient-Reported? | Directly Measurable? | Preprocessing & Transformation Strategy |
|---|---|---|---|---|---|---|---|---|
| 1 | `age_years` | ` Age (yrs)` | `int64` | Demographic | 20 – 48 yrs | Yes | Yes (Chronological) | Median Imputation; StandardScaled for linear models |
| 2 | `weight_kg` | `Weight (Kg)` | `float64` | Anthropometric | 30.0 – 120.0 kg | Yes | Yes (Bathroom scale) | Median Imputation; StandardScaled for linear models |
| 3 | `height_cm` | `Height(Cm) ` | `float64` | Anthropometric | 130.0 – 190.0 cm | Yes | Yes (Stadiometer / Tape) | Median Imputation; StandardScaled for linear models |
| 4 | `bmi` | `BMI` | `float64` | Derived Anthropometric | 12.0 – 45.0 kg/m² | Yes | Calculated ($\text{kg}/\text{m}^2$) | Median Imputation; StandardScaled for linear models |
| 5 | `cycle_ri` | `Cycle(R/I)` | `int64` | Menstrual History | 2 (Reg), 4 or 5 (Irreg) | Yes | Qualitative assessment | Most-Frequent Imputation; Mapped ($2 \rightarrow 0, 4/5 \rightarrow 1$) |
| 6 | `cycle_length_days` | `Cycle length(days)` | `int64` | Menstrual History | 0 – 15 days (menses length) | Yes | Patient-tracked calendar | Median Imputation; StandardScaled for linear models |
| 7 | `marriage_status_years` | `Marraige Status (Yrs)` | `float64` | Demographic Context | 0.0 – 35.0 yrs | Yes | Patient-reported | Median Imputation (1 missing in raw); Scaled for linear |
| 8 | `pregnant_yn` | `Pregnant(Y/N)` | `int64` | Reproductive History | 0 (No), 1 (Yes) | Yes | Patient-reported | Most-Frequent Imputation (Binary indicator) |
| 9 | `no_of_abortions` | `No. of aborptions` | `int64` | Obstetric History | 0 – 6 miscarriages/losses | Yes | Patient-reported | Median Imputation; StandardScaled for linear models |
| 10 | `weight_gain_yn` | `Weight gain(Y/N)` | `int64` | Clinical Symptom | 0 (No), 1 (Yes) | Yes | Qualitative symptom | Most-Frequent Imputation (Binary indicator) |
| 11 | `hair_growth_yn` | `hair growth(Y/N)` | `int64` | Clinical Symptom (Hirsutism) | 0 (No), 1 (Yes) | Yes | Visual self-examination | Most-Frequent Imputation (Binary indicator) |
| 12 | `skin_darkening_yn` | `Skin darkening (Y/N)` | `int64` | Clinical Symptom (Acanthosis) | 0 (No), 1 (Yes) | Yes | Visual self-examination | Most-Frequent Imputation (Binary indicator) |
| 13 | `hair_loss_yn` | `Hair loss(Y/N)` | `int64` | Clinical Symptom (Alopecia) | 0 (No), 1 (Yes) | Yes | Visual self-examination | Most-Frequent Imputation (Binary indicator) |
| 14 | `pimples_yn` | `Pimples(Y/N)` | `int64` | Clinical Symptom (Acne) | 0 (No), 1 (Yes) | Yes | Visual self-examination | Most-Frequent Imputation (Binary indicator) |
| 15 | `fast_food_yn` | `Fast food (Y/N)` | `float64` | Lifestyle Indicator | 0 (No), 1 (Yes) | Yes | Dietary habit recall | Most-Frequent Imputation (1 missing in raw); Binary |
| 16 | `reg_exercise_yn` | `Reg.Exercise(Y/N)` | `int64` | Lifestyle Indicator | 0 (No), 1 (Yes) | Yes | Activity habit recall | Most-Frequent Imputation (Binary indicator) |
| -- | `pcos_yn` | `PCOS (Y/N)` | `int64` | **Ground Truth TARGET** | 0 (Negative), 1 (Positive) | No | Clinical diagnostic workup | Binary target label |

---

## 3. Strict Exclusion & Leakage Safeguard Rules

The following columns are permanently excluded from the OvaSense CORE pipeline:

1. **Administrative Identifiers (`Sl. No`, `Patient File No.`)**:
   * *Reason*: Non-clinical database artifacts. If included, tree models or linear models risk memorizing ID numbers and producing false high predictive accuracy.
2. **Excel Corrupted Artifact (`Unnamed: 44`)**:
   * *Reason*: Column containing 99.63% null values and two stray entries (`.` and `7`).
3. **Ultrasound Antral Follicle Counts (`Follicle No. (L)`, `Follicle No. (R)`)**:
   * *Reason*: Antral follicle count ($\ge 12$ follicles per ovary) is an explicit **Rotterdam diagnostic criterion** used by clinicians to assign the ground-truth label `PCOS (Y/N)`. Using it in a screening questionnaire creates circular target leakage.
4. **All Specialized Blood Assays (`AMH`, `FSH`, `LH`, `TSH`, `PRL`, `PRG`, `Vit D3`, `Beta-HCG`) & Ultrasound Metrics (`Avg. F size`, `Endometrium`)**:
   * *Reason*: Require invasive venipuncture or pelvic ultrasound imaging. Excluded to preserve non-invasive screening utility.

---

## 4. Pre-Model Data Quality & Sanity Validations

Prior to pipeline fitting, all 16 CORE variables underwent data validation:

### A. Missing Value Inventory
* `Marraige Status (Yrs)`: Exactly 1 missing value (Row index 458, `Sl. No` 459).
* `Fast food (Y/N)`: Exactly 1 missing value (Row index 156, `Sl. No` 157).
* All remaining 14 CORE features: 0 missing values (100% complete).

### B. Derived Variable Audit (BMI Consistency)
Calculated: $\text{BMI}_{calc} = \text{Weight (kg)} / (\text{Height (m)})^2$ and compared to supplied `BMI`:
* **Mean Absolute Difference**: $0.0194 \text{ kg/m}^2$
* **Median Absolute Difference**: $0.0000 \text{ kg/m}^2$
* **Maximum Absolute Difference**: $1.5750 \text{ kg/m}^2$
* **Discrepancy Breakdown**:
  * 534 out of 541 rows (98.7%) have a difference $\le 0.05 \text{ kg/m}^2$ (attributable to floating-point rounding).
  * Exactly 4 rows have a discrepancy $> 0.5 \text{ kg/m}^2$:
    * Row 402 (`Sl. No` 403): Weight 65 kg, Height 158 cm $\rightarrow$ Supplied BMI 25.0, Calc BMI 26.04 (Diff: 1.04)
    * Row 412 (`Sl. No` 413): Weight 55 kg, Height 152 cm $\rightarrow$ Supplied BMI 23.2, Calc BMI 23.81 (Diff: 0.61)
    * Row 440 (`Sl. No` 441): Weight 56 kg, Height 160 cm $\rightarrow$ Supplied BMI 20.3, Calc BMI 21.88 (Diff: 1.58)
    * Row 481 (`Sl. No` 482): Weight 66.1 kg, Height 148 cm $\rightarrow$ Supplied BMI 30.8, Calc BMI 30.18 (Diff: 0.62)
* *Policy Decision*: Per audit rules, the original supplied `BMI` is preserved without ad-hoc manual modification.

### C. Binary Variable Audit
* Verified that `Pregnant(Y/N)`, `Weight gain(Y/N)`, `hair growth(Y/N)`, `Skin darkening (Y/N)`, `Hair loss(Y/N)`, `Pimples(Y/N)`, `Fast food (Y/N)`, and `Reg.Exercise(Y/N)` strictly contain values $\{0, 1\}$.
* Verified that `Cycle(R/I)` contains values $\{2, 4, 5\}$ where $2=\text{Regular}$ (390 patients), $4=\text{Irregular}$ (150 patients), and $5=\text{Irregular / entry variation}$ (1 patient).

---

## 5. Implementation Architecture: `src/preprocessing.py`

To prevent data leakage during model training and evaluation:
1. **Pipeline Encapsulation**: All transformations are encapsulated inside a scikit-learn `ColumnTransformer` composed of:
   * **`num` Pipeline**: `SimpleImputer(strategy='median')` followed by `StandardScaler()` (for linear models) or unscaled (for tree models).
   * **`bin` Pipeline**: `SimpleImputer(strategy='most_frequent')`.
   * **`cyc` Pipeline**: `SimpleImputer(strategy='most_frequent')` followed by `CycleRegularityTransformer` (mapping $2 \rightarrow 0.0$ and $\{4, 5\} \rightarrow 1.0$).
2. **Fit-Transform Isolation**:
   * Preprocessor statistics (medians, means, standard deviations) are computed **strictly on training folds** during cross-validation.
   * Testing folds and the locked holdout test set are transformed using training parameters only.
