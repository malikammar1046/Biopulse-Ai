# BioPulse AI — External Validation Status Report

> **Status**: Formal Audit Completed — Independent Dataset Incompatibility Documented  
> **Target Population**: Adult Men Aged 19–60  
> **Clinical Domain**: Male Endocrine & Hypogonadism Screening (Non-Diagnostic)

---

## 1. Executive Summary & Scientific Integrity Statement

In accordance with strict clinical AI evaluation standards and FYP research ethics:

> **BioPulse AI does NOT pretend external clinical validation exists when suitable independent data is absent.**

A comprehensive audit of all candidate datasets available within the repository and broader public repositories was conducted. No external dataset was found that simultaneously satisfies:
1. The validated target population age window (**19–60 years**).
2. The complete **Tier 1 non-invasive feature vector** (demographics, physical measurements, and symptom questionnaire items).
3. The complete **Tier 2 indirect laboratory biomarker panel** (16 standardized clinical laboratory markers without data leakage).
4. Reliable serum total testosterone measurements obtained under standardized conditions.

Evaluating models by arbitrarily zeroing or fabricating missing features produces invalid, deceptive metrics. Consequently, this document details why candidate datasets were incompatible, quantifies the missing variable gaps, and outlines the prospective clinical validation protocol for BioPulse in Pakistan.

---

## 2. Comprehensive Audit of Candidate Datasets Inspected

### Dataset 1: `Tier one/ptestost.xlsx` (Taiwanese Elderly Male Health Examination Cohort)
* **Sample Size**: $N = 3,397$ participants.
* **Age Distribution**: 45–85 years (Mean: 62.4 years; median: 61.0 years).
* **Target Variable**: Serum total testosterone deficiency ($T < 300\text{ ng/dL}$).
* **Available Variables**: `Age`, `DM` (Diabetes), `TG` (Triglycerides), `HT` (Hypertension), `HDL` (HDL Cholesterol), `AC` (Abdominal Circumference / Waist), and `T` (Deficiency label).
* **Compatibility Verdict**: **INCOMPATIBLE FOR TIER 1 & TIER 2 EXTERNAL VALIDATION**.
* **Clinical & Methodological Reasons for Rejection**:
  1. **Severe Age Discrepancy**: Over 55% of the cohort is aged $>60$ years (up to age 85). BioPulse Tier 1 and Tier 2 models are calibrated strictly for adult men aged 19–60, where late-onset hypogonadism etiology differs substantially from geriatric multi-morbidity.
  2. **Absence of Tier 1 Symptom Survey Data**: Lacks all 4 clinical symptom questions (fatigue/low energy, sleep disturbance, depressed mood, and reduced libido/drive).
  3. **Absence of 14 of 16 Tier 2 Laboratory Analytes**: Lacks SHBG, Estradiol, Serum Albumin, HbA1c, Fasting Glucose, Liver enzymes (ALT, AST, Total Bilirubin), Kidney markers (Creatinine, BUN, Uric Acid), and CBC indices (Hemoglobin, Hematocrit, Total RBC).
  4. **Original Role**: This dataset was developed solely for the legacy Digital Twin metabolic baseline (evaluating older Asian men using 6 metabolic indicators) and cannot represent the progressive Tier 1/Tier 2 architecture.

---

### Dataset 2: `Tier one/horm.csv` (Occupational Chemical Exposure Cohort)
* **Sample Size**: $N = 560$ factory workers.
* **Population**: Chinese chemical manufacturing workers exposed to occupational bisphenol-A (BPA).
* **Available Variables**: `ID`, `LH`, `FSH`, `T`, `BPAorigin`, `BPAcr`, `agegroup`, `education`, `bmigroup`, `ethnicity`, and workplace survey codes (`QB1`–`QC3G`).
* **Compatibility Verdict**: **INCOMPATIBLE FOR EXTERNAL VALIDATION**.
* **Clinical & Methodological Reasons for Rejection**:
  1. **Atypical Occupational Confounders**: Exposure to industrial endocrine-disrupting chemicals (BPA) induces toxicological alterations in gonadotropin signaling that do not reflect community-dwelling adult men.
  2. **Missing General Laboratory Biomarkers**: Measures only LH, FSH, and Total Testosterone. None of the 16 indirect metabolic and carrier biomarkers required by Tier 2 are present.
  3. **Non-Standard Survey Instruments**: Questions relate to chemical factory shifts, personal protective equipment, and occupational history rather than standardized ADAM or PHQ-9 symptoms.

---

### Dataset 3: `Tier one/Dataset+DEXA.xls` (Body Composition & DEXA Scan Cohort)
* **Focus**: Dual-energy X-ray absorptiometry (DEXA) bone mineral density and regional fat distribution.
* **Compatibility Verdict**: **INCOMPATIBLE**.
* **Clinical Reasons**: Designed for radiological osteoporosis and adiposity research; lacks paired serum gonadotropins, carrier proteins, and full metabolic panels.

---

### Datasets 4–7: `t0001` through `t0004` (Literature Meta-Analysis Tables)
* **Nature**: Summary correlation tables extracted from published literature (*Aging Male* journal, 2017).
* **Compatibility Verdict**: **INCOMPATIBLE** (aggregated meta-analytic statistics; no individual patient microdata).

---

## 3. Feature Mapping & Missing Variable Comparison Matrix

The table below demonstrates why attempting to evaluate Tier 1 or Tier 2 on candidate datasets without missing-data fabrication is impossible:

| Feature Required by BioPulse Engine | Tier 1 Model | Tier 2 Model | Present in `ptestost.xlsx`? | Present in `horm.csv`? |
| :--- | :---: | :---: | :---: | :---: |
| **Age (19–60)** | Yes | Yes | Yes (Skewed 45–85) | Binned only |
| **Height (cm)** | Yes | — | No | No |
| **Weight (kg)** | Yes | — | No | No |
| **Body Mass Index (BMI)** | Yes | — | No (AC only) | Binned only |
| **Waist Circumference (cm)** | Yes | — | Yes (`AC`) | No |
| **Low Energy / Fatigue (0–3)** | Yes | — | **NO** | **NO** |
| **Sleep Disturbance (0–3)** | Yes | — | **NO** | **NO** |
| **Low Mood / Depressed (0–3)** | Yes | — | **NO** | **NO** |
| **Low Sexual Drive (0–3)** | Yes | — | **NO** | **NO** |
| **Hypertension History (0/1)** | Yes | — | Yes (`HT`) | No |
| **Diabetes History (0/1)** | Yes | — | Yes (`DM`) | No |
| **SHBG (nmol/L)** | — | Yes | **NO** | **NO** |
| **Estradiol (pg/mL)** | — | Yes | **NO** | **NO** |
| **Serum Albumin (g/dL)** | — | Yes | **NO** | **NO** |
| **HbA1c (%)** | — | Yes | **NO** | **NO** |
| **Fasting Glucose (mg/dL)** | — | Yes | **NO** | **NO** |
| **HDL Cholesterol (mg/dL)** | — | Yes | Yes (`HDL`) | **NO** |
| **Serum Uric Acid (mg/dL)** | — | Yes | **NO** | **NO** |
| **Hemoglobin (g/dL)** | — | Yes | **NO** | **NO** |
| **Hematocrit (%)** | — | Yes | **NO** | **NO** |
| **Total RBC Count** | — | Yes | **NO** | **NO** |
| **Liver ALT (U/L)** | — | Yes | **NO** | **NO** |
| **Liver AST (U/L)** | — | Yes | **NO** | **NO** |
| **Total Bilirubin (mg/dL)** | — | Yes | **NO** | **NO** |
| **Serum Creatinine (mg/dL)** | — | Yes | **NO** | **NO** |
| **Blood Urea Nitrogen (BUN)** | — | Yes | **NO** | **NO** |
| **Total Features Available** | **11 / 11** | **16 / 16** | **2 / 11 (T1), 1 / 16 (T2)** | **0 / 11 (T1), 0 / 16 (T2)** |

---

## 4. Methodological Justification for Withholding Pseudo-Validation

In medical machine learning, evaluating a model by imputing >80% missing variables using synthetic distributions is known as **pseudo-validation**. It artificially inflates or distorts performance metrics and gives users and clinicians false reassurance.

By stating clearly that:
* **Internal validation** was rigorously conducted using 5-fold cross-validation and held-out 20% test partitions ($N=715$) with 1,000 bootstrap confidence intervals on CDC NHANES.
* **External validation** is pending an authentic prospective clinical cohort.

BioPulse upholds the highest standards of scientific and clinical integrity.

---

## 5. Prospective Clinical Validation Protocol (Roadmap for Pakistan)

To achieve true, publication-grade external validation, the following study protocol is designed for Phase 4:

### Study Design
* **Design**: Prospective, multi-center observational screening validation study.
* **Target Centers**: Tertiary care endocrinology, urology, and family medicine clinics in Lahore, Islamabad, and Karachi (e.g., Shaikh Zayed Hospital Lahore, Shaukat Khanum Memorial diagnostic centers, Aga Khan University Hospital outpatient labs).
* **Target Cohort**: $N = 500$ consecutively enrolled Pakistani adult men aged 19–60 presenting for routine executive health check-ups, metabolic screening, or non-specific symptoms (fatigue, weight gain, metabolic syndrome).

### Required Protocol
1. **Standardized Morning Phlebotomy**: All blood draws scheduled between 8:00 AM and 10:00 AM following a 10–12 hour overnight fast.
2. **Gold-Standard Laboratory Reference**: Total testosterone measured via certified automated electrochemiluminescence immunoassay (ECLIA) or LC-MS/MS, with laboratory-specific reference ranges preserved.
3. **Mandatory Repeat Confirmation**: Any participant with Total Testosterone $< 300\text{ ng/dL}$ receives a confirmatory repeat draw 2–4 weeks later on a separate morning.
4. **Complete Paired Data Collection**:
   * Standardized Urdu/English translated ADAM and PHQ-9 questionnaires.
   * Standardized anthropometric measurements (calibrated stadiometer, beam scale, WHO-standard waist circumference protocol).
   * Complete Tier 2 laboratory panel (SHBG, Albumin, Glucose, HbA1c, Lipids, Liver, Kidney, CBC).
5. **Outcome Measures**: ROC-AUC, Sensitivity, Specificity, NPV, Brier score, and calibration curves evaluated directly against Pakistani reference standards.
