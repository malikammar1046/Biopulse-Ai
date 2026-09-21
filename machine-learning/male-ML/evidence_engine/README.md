# BioPulse Progressive Evidence Engine

> **Module Location**: `machine-learning/male-ML/evidence_engine/`  
> **Target Cohort**: Adult men aged 19–60  
> **Clinical Domain**: Male Endocrine & Hypogonadism Screening (Non-Diagnostic)

---

## 1. Overview & Architecture

The **BioPulse Progressive Evidence Engine** is an orchestration and evidence synthesis layer that unifies the non-invasive **Male Tier 1** (questionnaire, symptoms, and biometrics) and clinical **Male Tier 2** (indirect laboratory biomarkers and pituitary-gonadal hormone patterns) into one cohesive, progressively enriching assessment architecture.

Rather than forcing users into an all-or-nothing evaluation or attempting diagnosis from incomplete information, BioPulse recognizes that clinical evaluations unfold over time. As additional verified evidence is introduced (e.g., first testosterone measurement, collection timing, follow-up LH/FSH signals, or metabolic panels), the evidence engine dynamically updates the assessment stage, computes an information completeness index, identifies remaining evidence gaps, and explains precisely what changed.

```text
Tier 1 Questionnaire & Biometrics
               │
               ▼
      [Tier 1 Screener]
               │
               ▼
   ┌────────────────────────────────────────────────────────┐
   │                   EvidenceState                        │
   │ ────────────────────────────────────────────────────── │
   │  - Identity & Context (Session ID, Age, Timestamp)     │
   │  - Tier 1 Biometrics & Symptoms (BMI, Waist, ADAM)     │
   │  - Longitudinal Testosterone Measurements (Two-Test)   │
   │  - Tier 2 Lab Analytes & Provenance                    │
   │  - Lab Quality (Collection Time, Fasting, OCR Status)  │
   │  - Observed Data vs Model-Derived Data                 │
   └────────────────────────────────────────────────────────┘
               │
               ├── (+ Tier 2 Laboratory Evidence Added)
               ▼
   ┌────────────────────────────────────────────────────────┐
   │               Progressive Engine Pipeline              │
   │ ────────────────────────────────────────────────────── │
   │  1. Unit Normalization (Safe conversion, retains range)│
   │  2. Completeness Evaluator (Core T1, Core T2, Support) │
   │  3. Deterministic Gap Engine (Non-prescriptive)        │
   │  4. Rule-Based Pituitary-Gonadal Pattern Evaluator     │
   │  5. Non-Leaking Calibrated ML Risk Model               │
   │  6. Assessment History Snapshot Recorder               │
   └────────────────────────────────────────────────────────┘
               │
               ▼
   Unified Male Endocrine Assessment (Non-Diagnostic)
```

---

## 2. Normalized Patient Evidence State (`evidence_state.py`)

`EvidenceState` serves as the single source of truth for all observed patient parameters and model outputs:

* **Identity / Context**: Patient ID, session ID, validated age (19–60), and ISO-8601 assessment timestamp.
* **Tier 1 Parameters**:
  * Physical metrics: Height (cm), Weight (kg), BMI (kg/m²), Waist circumference (cm).
  * Clinical symptoms: Low energy, sleep trouble/post-dinner sleepiness, mood dips, reduced libido/drive.
  * Medical history flags: Hypertension history, diabetes/prediabetes history.
  * Model-derived results: Tier 1 calibrated probability, screening threshold (0.1808), and screen positive status.
* **Tier 2 Laboratory Evidence**:
  * Direct hormone analytes: Total Testosterone, Free Testosterone, LH, FSH, Prolactin, Estradiol.
  * Carrier proteins: SHBG, Serum Albumin.
  * Metabolic & organ biomarkers: Fasting Glucose, HbA1c, HDL Cholesterol, Uric Acid, Liver enzymes (ALT, AST, Bilirubin), Kidney markers (Creatinine, BUN), Hematology (Hemoglobin, Hematocrit, RBC count).
* **Strict Anti-Fabrication**: Missing clinical values remain strictly `None`. They are never imputed as zero or fabricated.

---

## 3. Evidence Provenance & Quality

Every laboratory analyte is encapsulated in an `AnalyteEvidence` record tracking its origin:

```json
{
  "analyte": "total_testosterone",
  "value": 260.0,
  "unit": "ng/dL",
  "source": "uploaded_lab_report",
  "verified": true,
  "data_origin": "observed",
  "collection_time": "08:15",
  "fasting": true,
  "ocr_confidence": 0.98,
  "reference_low": 300.0,
  "reference_high": 1000.0
}
```

### Distinction of Observed vs. Model-Derived Data
* **Observed Data**: Actual laboratory test measurements and patient-entered symptoms.
* **Model-Derived Data**: Risk probabilities, risk levels, and predicted screening signals from trained algorithms.
* **Strict Rule**: A model prediction is never treated as laboratory evidence.

### OCR & Verification Safeguard
When lab reports are ingested via automated optical character recognition (OCR), they are initially marked `verified = False`. The engine flags unverified evidence in the limitations and evidence gaps, ensuring unverified readings are never silently promoted to verified observed data until the user or clinician reviews them.

---

## 4. Longitudinal Evidence & The Two-Test Requirement

Clinical guidelines from the **Endocrine Society** and the **American Urological Association (AUA)** dictate that low testosterone cannot be diagnosed from a single blood draw due to circadian variation, stress, and transient illness. A confirmatory repeat early-morning test on a separate day is required.

`EvidenceState` manages testosterone measurements in a longitudinal array (`testosterone_measurements`):
* Previous measurements are **never overwritten**.
* The engine evaluates:
  * Number of measurements available (`1` vs `2+`).
  * Confirmation of early-morning collection window (8:00 AM – 10:00 AM).
  * Fasting state.
* If only one low measurement (< 300 ng/dL) exists, a deterministic evidence gap (`single_low_measurement_confirmatory_needed`) alerts the user and recommends discussing a second morning draw with their physician.

---

## 5. Information Completeness (`evidence_gaps.py`)

Completeness is categorized across three distinct tiers:

1. **CORE TIER 1**:
   * Validated Age (19–60)
   * Physical Metrics (BMI or Waist Circumference)
   * Symptom Questionnaire Responses
2. **CORE TIER 2**:
   * Total Testosterone Blood Test
   * Morning Blood Collection Time (8:00–10:00 AM)
   * LH Hormone (Pituitary Signaling)
   * FSH Hormone (Pituitary Signaling)
3. **SUPPORTING**:
   * SHBG (Carrier Protein)
   * Serum Albumin
   * Prolactin
   * Estradiol
   * HbA1c / Fasting Glucose
   * General organ & metabolic markers

> [!NOTE]
> This metric is strictly an **INFORMATION COMPLETENESS INDICATOR**, not a diagnostic confidence score.

---

## 6. Deterministic Evidence Gap Engine

Answers the fundamental clinical question: **"What information is currently missing to interpret this pattern?"**

| Scenario | Deterministic Gap Identified | Clinical Guidance (Non-Prescriptive) |
| :--- | :--- | :--- |
| **Tier 1 Only** | `missing_testosterone_draw`, `missing_morning_timing`, `missing_pituitary_signaling` | Clinical evaluation may consider ordering an early-morning fasting Total and Free Testosterone panel. |
| **Testosterone Present, LH/FSH Missing** | `missing_lh_fsh_signaling` | A healthcare professional may consider measuring serum LH and FSH levels to better understand pituitary signaling. |
| **Collection Time Missing** | `unconfirmed_collection_time` | Confirming that the sample was collected between 8:00 AM and 10:00 AM helps ensure accurate interpretation. |
| **Afternoon Collection** | `non_morning_collection_alert` | Clinical evaluation may consider repeating the test during the early morning peak (8:00 AM – 10:00 AM). |
| **Single Low Testosterone** | `single_low_measurement_confirmatory_needed` | Clinical evaluation may consider obtaining a second confirmatory fasting morning testosterone draw on a separate day. |
| **Unverified OCR Data** | `unverified_ocr_evidence` | Please review the extracted laboratory values against your original report to confirm their accuracy. |

---

## 7. Progressive Assessment Stages (`assessment_engine.py`)

The engine generates unified, progressively enriched results:

### Stage: `tier_1`
Triggered when only lifestyle, biometric, and symptom data are available:
* `tier1_result`: Calibrated Logistic Regression probability (cutoff: 18.1%), contributing risk factors, calculated BMI.
* `tier2_result`: `None`.
* `hormonal_pattern`: `None`.
* `evidence_gaps`: Details missing blood draw, timing confirmation, and pituitary hormones.

### Stage: `tier_2`
Triggered when verified laboratory data is added:
* `tier1_result`: Carried forward and preserved.
* `tier2_result`: Direct laboratory status against preserved report ranges; calibrated Random Forest screening score from 16 non-leaking metabolic/carrier markers (excluding Total T).
* `hormonal_pattern`: Rule-based classification:
  * **Primary Pattern**: Higher LH/FSH with low testosterone (testicular origin).
  * **Secondary Pattern**: Normal or low LH/FSH with low testosterone (pituitary/hypothalamic origin).
  * **Prolactin-Related Pattern**: Elevated prolactin with low testosterone.
  * **Normal Range**: Testosterone within standard eugonadal range.
  * **Incomplete Profile**: Testosterone low, but LH/FSH not yet tested.
* `longitudinal_testosterone`: Full measurement history and timing verification status.

---

## 8. Assessment History Timeline (`assessment_history.py`)

Every time meaningful evidence changes, an immutable `AssessmentSnapshot` is stored. The history engine generates human-readable explanations:

* **Snapshot #1**: Initial Tier 1 lifestyle, demographic, and symptom baseline recorded.
* **Snapshot #2**: *"Your assessment changed because new evidence was added: Total Testosterone (260 ng/dL)."*
* **Snapshot #3**: *"Your assessment changed because new evidence was added: LH (12.8 mIU/mL), FSH (14.5 mIU/mL)."*

---

## 9. Zero Model Duplication & Existing Pipeline Reuse

The Evidence Engine strictly orchestrates existing validated modules:
* **Tier 1 Model**: `male_tier1/artifacts/male_low_t_model.joblib` (Calibrated Logistic Regression).
* **Tier 2 Model**: `male_tier2/artifacts/male_tier2_model.joblib` (Calibrated Random Forest).
* **Hormone Pattern Rules**: `male_tier2/src/evaluation.py::interpret_clinical_hormone_pattern`.
* **Unit Normalizer**: `male_tier2/src/unit_normalizer.py::convert_value_and_range`.
* **Lab Extractor**: `male_tier2/src/lab_extractor.py::extract_lab_report`.

---

## 10. Non-Diagnostic Clinical Safety Language

BioPulse enforces strict safety contracts across all generated text:
* **Prohibited Words**: Never outputs *"You have hypogonadism"*, *"disease positive"*, *"your pituitary is failing"*, or medical prescriptions.
* **Permitted Everyday Terms**: Uses *"Testosterone level"*, *"LH hormone"*, *"blood test"*, *"reference range"*, *"screening signal"*, and *"pattern"*.
* **Educational Guidance**: Always includes explicit disclaimers emphasizing that only certified morning blood laboratory tests and clinical evaluation by a medical doctor can diagnose male hypogonadism.
