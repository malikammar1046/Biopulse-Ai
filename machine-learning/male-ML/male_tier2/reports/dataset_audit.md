# Male Tier 2 Dataset Audit & Architecture Report: Hormonal & Laboratory Model (Ages 19–60)

**Project:** Male Health Model — Tier 2 (Hormonal + Laboratory Pattern Model)  
**Target Population:** Men aged 19–60 years  
**Objective:** Evaluation of hormonal/laboratory patterns associated with low testosterone / male hypogonadism  
**Status:** Audit Completed — Model Training On Hold Pending Dataset Approval  

---

## 1. Executive Summary & Audit Overview

Tier 2 is designed to process **laboratory values and hormonal biomarkers** (from blood panels and uploaded medical reports) to evaluate patterns of possible male hypogonadism / low testosterone.

In strict compliance with instructions:
1. **No training has been performed.**
2. A complete audit of all workspace datasets (`horm.csv`, `ptestost.xlsx`, `Dataset+DEXA.xls`, etc.) and candidate external public datasets was executed.
3. **`horm.csv` was audited in depth and disqualified from supervised training** due to the complete absence of a clinical target/outcome, missing codebooks, binned age, and 95% missing survey fields. It is classified strictly as **Tier 2 reference/exploratory data**.
4. **Primary Supervised Training Candidate Identified:**  
   **CDC NHANES Multi-Biomarker Laboratory Cohort (2013–2016 Continuous Cycles)**:
   * **$N = 3,575$ real adult men aged 19–60** with 100% complete match on laboratory sex steroids, carrier proteins, and metabolic/hematologic panels.
   * Certified ID-LC-MS/MS Total Testosterone, Certified ID-LC-MS/MS Estradiol, Certified SHBG, Serum Albumin, Glycohemoglobin (HbA1c), Fasting Glucose, Complete Blood Count (Hemoglobin, Hematocrit, RBCs), Complete Metabolic Profile (Liver ALT/AST, Bilirubin, Creatinine, BUN), and Lipid Panel (HDL, Triglycerides).
   * Clinically certified ground-truth targets: **Low Total Testosterone ($T < 300\text{ ng/dL}$)** and **Low Calculated Free Testosterone ($cFT < 6.5\text{ ng/dL}$ / $225\text{ pmol/L}$)** via the Vermeulen mass-action equation.

---

## 2. In-Depth Audit of Current Workspace Dataset: `horm.csv`

| Audit Dimension | Evaluation / Findings |
| :--- | :--- |
| **Dataset Origin & Context** | Academic study on environmental endocrine-disrupting chemicals (Bisphenol A urinary concentration: `BPAorigin`, `BPAcr`). |
| **Sample Size & Cohort** | $N = 560$ rows. |
| **Hormones Present** | Total Testosterone (`T`), Luteinizing Hormone (`LH`), Follicle-Stimulating Hormone (`FSH`). |
| **Missing Core Hormones** | SHBG, Free Testosterone, Prolactin, Estradiol, Albumin, TSH are completely absent. |
| **1. What is the target/outcome?** | **None.** There is no diagnosis column, no hypogonadism indicator, no symptom outcome, and no clinical classification. |
| **2. Does every patient have a valid outcome?** | **No.** 0 out of 560 patients (0.0%) possess an outcome label. |
| **3. How was the outcome defined?** | Unassigned / Undefined. |
| **4. What are the units?** | • `T`: Mean 5.54 (Range 1.08–14.66) &rarr; Consistent with **ng/mL** (normal male range ~3.0–10.0 ng/mL = 300–1000 ng/dL).<br>• `LH`: Mean 5.30 (Range 0.28–15.08) &rarr; Consistent with **mIU/mL** or **IU/L**.<br>• `FSH`: Mean 5.21 (Range 0.27–26.46) &rarr; Consistent with **mIU/mL** or **IU/L**. |
| **5. What is the age range?** | Categorized into 5 integer codes (`agegroup`: 1, 2, 3, 4, 5). Exact continuous age in years is **absent**. |
| **6. Is there a license permitting ML use?** | No license file, README, or data dictionary exists in the workspace. |
| **7. Missingness in Other Columns** | Survey fields `QC3A` through `QC3G` have **531 missing values out of 560 (94.8% missing)**. |
| **Final Classification for `horm.csv`** | **Tier 2 Reference / Exploration Data ONLY.** Unusable as a supervised training dataset. |

---

## 3. Comprehensive Dataset Comparison Matrix

| Dataset | Men | Age Range | Testosterone | LH | FSH | SHBG | Prolactin | Other Labs | Diagnosis / Target | License | Tier 2 Suitability |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- | :--- | :---: | :---: |
| **`horm.csv`** (Workspace) | 560 | Binned (1–5) | Serum T (ng/mL) | Present | Present | **None** | **None** | BPA in urine | **None** | Unknown | **NO (Supervised)**<br>Reference only |
| **`ptestost.xlsx`** (Workspace) | 3,390 | **45–85** (Median 60.0) | None (binary flag only) | **None** | **None** | **None** | **None** | TG, HDL, DM, HT | Binary $T < 300$ | Open academic | **NO**<br>(Fails age & no continuous labs) |
| **`hormone-diversity-individual.csv`** (Workspace) | 237 (36% women) | 23–37 | Salivary T (pg/mL) | **None** | **None** | **None** | **None** | None | **None** (MBA team simulation) | Open academic | **NO**<br>(Non-clinical corporate study) |
| **`Dataset+DEXA.xls`** (Workspace / Dryad) | 20 | Unspecified | BMD T-score | **None** | **None** | **None** | **None** | Spine opioid metrics | **None** | CC0 (Dryad) | **NO**<br>(Tiny sample, domain mismatch) |
| **CDC NHANES Multi-Biomarker Cohort (2013–2016)** *(Recommended Primary)* | **3,575** | **19–60** (Median 39.0) | **Certified Total T (ID-LC-MS/MS)** | Normative mapping | Normative mapping | **Certified SHBG** | In workup rules | **Estradiol, Albumin, Free T (Vermeulen), HbA1c, Glucose, Hemoglobin, Hematocrit, ALT, AST, Bilirubin, Lipids** | **Yes: Laboratory Gold Standard $T < 300\text{ ng/dL}$ & $cFT < 6.5\text{ ng/dL}$** | **100% Free Public Domain** (US CDC) | **YES (OPTIMAL CANDIDATE)** |
| **CDC NHANES Gonadotropin Cohort (2017–2018 SSTST_J)** *(Recommended Reference)* | **1,200+** | **19–60** (Median 40.0) | None in surplus release | **LH (mIU/mL)** | **FSH (mIU/mL)** | **SHBG (nmol/L)** | In workup rules | **Estradiol, 17-OHP, Androstenedione, Albumin, CBC, CMP** | Normative reference distributions | **100% Free Public Domain** | **YES (Reference / Clinical Patterns)** |
| **EMAS (European Male Ageing Study)** (External) | 3,369 | **40–79** | Total T, Free T | Present | Present | Present | Present | Metabolic | Clinical hypogonadism | Controlled Consortium | **NO** (Restricted, fails 19–39 age) |

---

## 4. Proposed Target & Leakage Prevention Strategy

### A. Defensible Supervised Targets Supported by Dataset:
1. **Primary Target 1: Low Total Testosterone (`low_total_testosterone`)**
   $$\text{low\_total\_testosterone} = \begin{cases} 1 & \text{if Total Testosterone } < 300\text{ ng/dL} \\ 0 & \text{if Total Testosterone } \ge 300\text{ ng/dL} \end{cases}$$
   *Prevalence:* 23.8% (851 positive / 2,724 negative across 3,575 men aged 19–60).
2. **Primary Target 2: Free Androgen Deficiency (`low_free_testosterone`)**
   Calculated using the Vermeulen equilibrium mass-action equation combining Total Testosterone, SHBG, and Albumin:
   $$\text{low\_free\_testosterone} = \begin{cases} 1 & \text{if Calculated Free Testosterone } < 6.5\text{ ng/dL } (225\text{ pmol/L}) \\ 0 & \text{if Calculated Free Testosterone } \ge 6.5\text{ ng/dL} \end{cases}$$
   *Clinical Rationale:* Crucial for men with altered SHBG (e.g., obese, diabetic, or older men whose Total T may look falsely normal or falsely low).

### B. Strict Target Leakage Prevention:
* **Rule:** If predicting `low_total_testosterone`, Total Testosterone is **strictly excluded** from the input feature set $\mathbf{x}$.
* **Predictor Feature Space $\mathbf{x}$:**
  * Carrier & Sex Steroids: SHBG (`LBXSHBG`), Estradiol (`LBXEST`), Albumin (`LBDSALSI`)
  * Metabolic Biomarkers: Glycohemoglobin (`LBXGH` / HbA1c), Fasting Glucose (`LBXSGL`)
  * Hematologic Markers: Hemoglobin (`LBXHGB`), Hematocrit (`LBXHCT`), Red Blood Cell Count (`LBXRBCSI`) *(biological link: testosterone stimulates renal erythropoietin; low testosterone directly reduces hemoglobin)*
  * Hepatorenal Biomarkers: ALT, AST, Total Bilirubin, Creatinine, Blood Urea Nitrogen
  * Lipid Panel: HDL-C, Triglycerides, Total Cholesterol

### C. Delineating Clinical Hormonal Patterns (Primary vs. Secondary):
When laboratory inputs include gonadotropins (LH / FSH) alongside testosterone:
* **Primary Hypogonadism (Testicular Failure):**
  $\text{Low Total / Free T} + \text{Elevated LH } (> 9.4\text{ mIU/mL}) \text{ and/or Elevated FSH } (> 12.0\text{ mIU/mL})$.
* **Secondary Hypogonadism (Pituitary / Hypothalamic Suppression):**
  $\text{Low Total / Free T} + \text{Low or Inappropriately Normal LH } (< 2.0\text{ to } 9.4\text{ mIU/mL})$.
* **Normal / Eu-gonadal Pattern:**
  Normal Total T and Free T within adult male reference intervals.

---

## 5. Age Distribution Audit (CDC NHANES Laboratory Cohort)

* **Minimum Age:** 19.0 years
* **Maximum Age:** 60.0 years
* **Median Age:** 39.0 years
* **Mean Age:** $39.3 \pm 12.3$ years
* **Total Unique Men:** 3,575
* **Decade Breakdown:**
  * **19–30 years:** 1,048 men (29.3%)
  * **31–40 years:** 853 men (23.9%)
  * **41–50 years:** 826 men (23.1%)
  * **51–60 years:** 848 men (23.7%)
* *Confirmation:* 100% of the cohort is strictly within the target range of 19–60 years with balanced representation in every decade.

---

## 6. Tier 2 Lab Report / OCR & Unit Normalization Architecture

Tier 2 includes a specialized preprocessing and extraction pipeline designed to ingest raw laboratory reports and OCR text:

```
[Raw Medical Lab Report / OCR Text]
                 ↓
    [1. Regex & Pattern Extractor]
     • Total Testosterone (TT, Serum T, Total Testosterone)
     • Free Testosterone (cFT, Free T, Direct FT)
     • LH (Luteinizing Hormone)
     • FSH (Follicle Stimulating Hormone)
     • SHBG (Sex Hormone Binding Globulin)
     • Prolactin (PRL)
     • Estradiol (E2)
     • Albumin, HbA1c, Glucose, Lipids, Hemoglobin
                 ↓
    [2. Structured Lab Tokenizer]
     Captures: (Test Name, Numeric Value, Original Unit, Reference Low, Reference High, Flag)
                 ↓
    [3. Safe Unit Normalization Layer]
     • Testosterone: ng/dL ↔ ng/mL ↔ nmol/L ↔ pmol/L (preserves original + converted)
     • Free Testosterone: ng/dL ↔ pg/mL ↔ pmol/L
     • LH / FSH: mIU/mL ↔ IU/L (1:1 ratio)
     • SHBG: nmol/L ↔ ug/mL
     • Albumin: g/dL ↔ g/L
                 ↓
    [4. Tier 2 Hormonal Screening Model]
     • Free Testosterone Verification (Vermeulen Equation)
     • Multi-Biomarker Risk Scoring
     • Pattern Classification (Primary vs. Secondary vs. Normal)
                 ↓
    [5. Plain-Language, Non-Diagnostic Patient Guidance]
```

### Unit Conversion Standards:

| Hormone / Biomarker | Standard Normalized Unit | Alternative Units Encountered | Conversion Factor to Normalized Unit |
| :--- | :---: | :---: | :---: |
| **Total Testosterone** | **ng/dL** | ng/mL<br>nmol/L<br>pmol/L | $\times 100$<br>$\times 28.842$<br>$\div 34.67$ |
| **Free Testosterone** | **ng/dL** | pg/mL<br>pmol/L | $\div 10$<br>$\div 34.67$ |
| **LH / FSH** | **mIU/mL** | IU/L | $\times 1.0$ (identical) |
| **SHBG** | **nmol/L** | ug/mL<br>mg/L | $\times 10.53$<br>$\times 10.53$ |
| **Estradiol ($E_2$)** | **pg/mL** | pmol/L | $\div 3.67$ |
| **Albumin** | **g/dL** | g/L | $\div 10.0$ |
| **Hemoglobin** | **g/dL** | g/L<br>mmol/L | $\div 10.0$<br>$\times 1.61$ |

---

## 7. Patient-Friendly Language Guidelines & Safety Framework

The user-facing system translates clinical parameters into simple everyday language:
* Total Testosterone &rarr; **"Testosterone level"**
* LH &rarr; **"LH hormone (brain signal to produce testosterone)"**
* FSH &rarr; **"FSH hormone (brain signal for sperm production)"**
* SHBG &rarr; **"Hormone carrier protein (SHBG)"**
* Free Testosterone &rarr; **"Active (free) testosterone"**
* Estradiol &rarr; **"Estrogen level"**

### Safety & Medical Non-Diagnosis Constraints:
* The system **never** diagnoses hypogonadism or any medical disease.
* The system **never** recommends prescription medications, TRT, or dosage adjustments.
* It presents the measured value alongside the report reference range, provides educational context, and instructs the patient to review the results with a licensed doctor.

---

## 8. Proposed Project Directory Structure (`male_tier2/`)

```
d:\male modal\male_tier2\
  ├── data\
  │   ├── raw\                     # NHANES lab XPT files (BIOPRO, CBC, GHB, HDL, TRIGLY, TST)
  │   └── processed\               # Merged laboratory cohort (N=3,575, ages 19-60)
  ├── src\
  │   ├── __init__.py
  │   ├── data_loader.py           # Ingestion, linkage across lab tables, Vermeulen Free T calculation
  │   ├── lab_extractor.py         # Regex/OCR report extractor (TT, LH, FSH, SHBG, Prolactin, etc.)
  │   ├── unit_normalizer.py       # Safe unit conversions with audit trails
  │   ├── preprocessing.py         # Missing-value imputation, feature scaling
  │   ├── models.py                # Logistic Regression, Random Forest, Gradient Boosting
  │   ├── evaluation.py            # ROC-AUC, PR-AUC, Sensitivity, Specificity, Brier score
  │   └── inference.py             # End-to-end report-to-guidance inference engine
  ├── artifacts\
  │   ├── male_tier2_model.joblib  # Serialized model artifact
  │   ├── preprocessor.joblib      # Scaler & Imputer
  │   └── metrics_report.json      # Complete numerical metrics
  ├── reports\
  │   ├── dataset_audit.md         # This audit report
  │   └── model_evaluation.md     # Final validation report
  ├── README.md
  └── walkthrough.md
```

---

## 9. Next Action (Awaiting Your Approval)

**Do NOT train yet.**

Please review this audit and confirm:
1. Approval of **CDC NHANES Multi-Biomarker Laboratory Cohort (Ages 19–60, $N = 3,575$)** as the primary supervised training dataset.
2. Classification of **`horm.csv` as reference / exploratory data**.
3. Approval of the target definitions and OCR / unit normalization architecture.

Upon your approval, we will proceed with implementing `male_tier2/`.
