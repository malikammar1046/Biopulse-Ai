# BioPulse Progressive Evidence Engine — System Architecture

This document specifies the internal component layout, state transition models, data structures, and isolation boundaries of the **BioPulse Progressive Evidence Engine**.

---

## 1. Top-Level Architectural Separation

The BioPulse system is designed around an explicit separation between machine learning risk screening and deterministic clinical pattern interpretation:

```
                    BioPulse Assessment
                           │
             ┌─────────────┴─────────────┐
             │                           │
        ML SCREENING               CLINICAL PATTERN
             │                           │
       Tier 1 / Tier 2              T + LH + FSH
             │                       + Prolactin
             │                           │
             └─────────────┬─────────────┘
                           ↓
                 EVIDENCE ENGINE
                           ↓
                  EXPLAINABILITY
                           ↓
                  DIGITAL TWIN
```

### The Seven Questions of the BioPulse Story

1. **Tier 1**: *“Based on the information currently available, is there a screening signal worth investigating?”*
2. **Tier 2**: *“What does the available laboratory evidence show?”*
   - **Anti-Leakage Guard**: Total Testosterone is strictly excluded from predictive features to prevent circular leakage.
3. **Hormonal Pattern Engine**: *“How do testosterone, LH, FSH and prolactin relate?”*
   - **2026 Clinical Statement**: Requires symptoms plus consistently low testosterone on at least two early-morning fasting measurements (07:00–11:00 AM). Single low draws never prove hypogonadism.
4. **Evidence Gap Engine**: *“What important information is still missing?”*
5. **Explainability Engine**: *“Why did the assessment produce this result?”*
6. **Digital Twin**: *“How has this person's evidence changed over time?”*
7. **Research Layer**: *“How reliable, calibrated, generalizable and explainable is the system?”*

---

## 2. End-to-End System Pipeline

```text
====================================================================================================
                               BIOPULSE PROGRESSIVE EVIDENCE ENGINE
====================================================================================================

      TIER 1 INPUTS                                             TIER 2 CLINICAL LABS
  (Demographics, Biometrics,                               (EHR, Manual Entry, OCR Extractor)
      ADAM Symptoms)                                                      │
             │                                                            ▼
             │                                              ┌───────────────────────────┐
             │                                              │    Safe Unit Normalizer   │
             │                                              │  (Preserves Report Ranges)│
             │                                              └─────────────┬─────────────┘
             │                                                            │
             ▼                                                            ▼
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                       EvidenceState                                              │
│ ──────────────────────────────────────────────────────────────────────────────────────────────── │
│  IDENTITY & CONTEXT                                                                              │
│    ├── patient_id / session_id                                                                   │
│    ├── age (19–60)                                                                               │
│    └── assessment_timestamp                                                                      │
│                                                                                                  │
│  TIER 1 EVIDENCE                                                                                 │
│    ├── physical: height_cm, weight_kg, bmi, waist_cm                                             │
│    ├── symptoms: low_energy, sleep_trouble, low_mood, low_interest                                   │
│    ├── comorbidities: high_blood_pressure, diabetes                                              │
│    └── tier1_model_output: { prob: 0.265, threshold: 0.1808, screen_positive: True }             │
│                                                                                                  │
│  TIER 2 LABORATORY EVIDENCE (Map<AnalyteKey, AnalyteEvidence>)                                   │
│    ├── total_testosterone  ──> [ AnalyteEvidence (val, unit, provenance, verified) ]              │
│    ├── lh                  ──> [ AnalyteEvidence (val, unit, provenance, verified) ]              │
│    ├── fsh                 ──> [ AnalyteEvidence (val, unit, provenance, verified) ]              │
│    ├── shbg, albumin, glucose, hba1c, liver, kidney, hematology ...                              │
│                                                                                                  │
│  LONGITUDINAL TESTOSTERONE EVIDENCE (Two-Test Requirement Array)                                 │
│    ├── Draw #1: { 260 ng/dL, 08:10 AM, fasting: True, verified: True, source: "lab_report" }     │
│    └── Draw #2: { 275 ng/dL, 08:25 AM, fasting: True, verified: True, source: "manual_entry" }   │
│                                                                                                  │
│  QUALITY & PROVENANCE FLAGS                                                                      │
│    ├── data_origin: "observed" vs "model_derived" (Strict Separation)                           │
│    ├── ocr_confidence: float (0.0 – 1.0)                                                         │
│    └── verification_status: verified / unverified                                                │
└──────────────────────────────────────────────┬───────────────────────────────────────────────────┘
                                               │
                                               ▼
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                  ProgressiveAssessmentEngine                                     │
│ ──────────────────────────────────────────────────────────────────────────────────────────────── │
│                                                                                                  │
│   1. EVIDENCE COMPLETENESS EVALUATOR (evidence_gaps.py)                                          │
│      ├── Core Tier 1 (Age, Physical, Symptoms)                                                   │
│      ├── Core Tier 2 (Total T, Collection Time, LH, FSH)                                         │
│      └── Supporting (SHBG, Albumin, Prolactin, Glucose, HbA1c, etc.)                             │
│                                                                                                  │
│   2. DETERMINISTIC GAP ENGINE (evidence_gaps.py)                                                 │
│      ├── Checks for missing laboratory tests (e.g. Total T, LH/FSH)                              │
│      ├── Checks collection timing (Morning 8-10 AM vs Unspecified / Afternoon)                   │
│      ├── Checks Two-Test Confirmation Requirement if Total T < 300 ng/dL                         │
│      └── Flags unverified OCR readings requiring user confirmation                               │
│                                                                                                  │
│   3. TIER 1 ML INFERENCE (Reuses male_tier1/artifacts/male_low_t_model.joblib)                   │
│      └── Calibrated Logistic Regression (threshold: 0.1808) -> Probability & Contributing Factors│
│                                                                                                  │
│   4. TIER 2 RULE-BASED HORMONE PATTERN ENGINE (Reuses male_tier2/src/evaluation.py)              │
│      ├── Evaluates LH, FSH, Prolactin signaling relative to report reference ranges              │
│      └── Pattern: Primary vs Secondary vs Eugonadal vs Prolactin-Related                         │
│                                                                                                  │
│   5. TIER 2 PREDICTIVE ML MODEL (Reuses male_tier2/artifacts/male_tier2_model.joblib)            │
│      └── 16 Non-Leaking Metabolic/Carrier Markers (Calibrated Random Forest, threshold: 0.3379)  │
│                                                                                                  │
│   6. NON-DIAGNOSTIC SAFETY & LANGUAGE ENFORCEMENT                                                │
│      └── Audits all summary texts, guides, and disclaimers to prevent diagnostic claims          │
└──────────────────────────────────────────────┬───────────────────────────────────────────────────┘
                                               │
                                               ▼
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   AssessmentHistory Snapshot                                     │
│ ──────────────────────────────────────────────────────────────────────────────────────────────── │
│    ├── Snapshot ID: snap_a1b2c3d4e5f6                                                            │
│    ├── Stage: tier_1 -> tier_2                                                                   │
│    ├── Change Reason: "Your assessment changed because new evidence was added: LH, FSH"          │
│    └── Chronological Timeline Card Generation                                                    │
└──────────────────────────────────────────────┬───────────────────────────────────────────────────┘
                                               │
                                               ▼
                               OUTPUT: UnifiedAssessmentResult
```

---

## 3. Evidence State Lifecycle & Progression

```text
[ Patient Intake ]
       │
       ▼
   State: Tier 1 Only
   Stage: "tier_1"
   - Model: Logistic Regression (11 biometrics/symptoms)
   - Completeness: 42.9% (Core Tier 1 complete, Core Tier 2 missing)
   - Gaps: Total T missing, Morning timing unconfirmed, LH/FSH missing
       │
       ├── (+ Total Testosterone Draw Added)
       ▼
   State: Partial Tier 2
   Stage: "tier_2"
   - Observed Data: Total Testosterone recorded (longitudinal #1)
   - Hormone Pattern: "Low Testosterone Level (LH/FSH Hormones Not Tested)"
   - Gaps: LH/FSH signaling missing, Confirmatory second draw needed
       │
       ├── (+ Morning Confirmed Repeat Draw + LH + FSH Added)
       ▼
   State: Complete Tier 2
   Stage: "tier_2"
   - Observed Data: Total T (#1 & #2), LH, FSH, SHBG, Albumin
   - Hormone Pattern: "Primary Hormonal Pattern" or "Secondary Hormonal Pattern"
   - Completeness: 95.0%
   - Two-Test Requirement: SATISFIED (2 morning tests recorded)
   - Gaps: Fully resolved or only minor supporting markers noted
```

---

## 3. Strict Boundary Guarantees

1. **Zero Data Fabrication**: Missing parameters remain `None`. The system never infers or invents laboratory or symptom data.
2. **Anti-Leakage Isolation**: Total Testosterone and Calculated Free Testosterone are strictly excluded from the Tier 2 ML feature vector to prevent mathematical leakage.
3. **Observed vs. Model-Derived Data**: Model probabilities (`prob`) are strictly stored under `model_output` and never treated as laboratory evidence.
4. **No Direct Overwrite of Longitudinal Tests**: Multiple testosterone draws are appended to `testosterone_measurements` with timestamps and collection times preserved.
5. **No Diagnosis**: Output texts are screened against prohibited diagnostic phrases (`"You have hypogonadism"`, `"disease positive"`, etc.) and adhere to educational screening standards.
