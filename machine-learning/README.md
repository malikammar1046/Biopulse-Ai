# Machine Learning & Clinical Risk Assessment Architecture

Welcome to the **BioPulse AI** Machine Learning subsystem. This directory houses the statistical learning pipelines, deep vision models, calibrated explainability engines (TreeSHAP), and production model artifacts driving reproductive and endocrine health risk stratification.

---

## 1. Directory Structure & Layout

```
machine-learning/
├── PCOS-ML/                     # Female PCOS Risk Assessment Models
│   ├── models/                  # Calibrated production joblib model pipelines
│   │   ├── tier1/               # 16-feature lifestyle/phenotype model
│   │   └── tier2/               # 32-feature cumulative clinical & biomarker model
│   ├── notebooks/               # Exploratory data analysis & experiments
│   ├── src/                     # Preprocessing and model training source
│   ├── data/                    # De-identified/synthetic datasets
│   └── Ultrasound_Images/       # De-identified ovarian ultrasound research samples
│
├── male-ML/                     # Male Hypogonadism Risk Assessment Models
│   ├── male_tier1/artifacts/    # 11-feature questionnaire/vitals model (Logistic Regression)
│   ├── male_tier2/artifacts/    # 16-feature comprehensive lab model (Random Forest)
│   ├── digital_twin_inference.py# Longitudinal risk inference engine
│   └── train_pipeline.py        # Automated male risk training pipeline
│
├── ml/                          # Shared ML modules & OCR extraction
│   ├── artifacts/               # Common serialization utilities
│   ├── explainability/          # SHAP attribution adapters
│   ├── features/                # Standardization & imputation logic
│   ├── inference/               # Production runtime inference wrappers
│   └── training/                # Shared training orchestration
│
├── test_production_models.py    # Production artifact validation test suite
├── requirements.txt             # ML pipeline dependencies
└── README.md                    # This document
```

---

## 2. Model Tiering & Feature Signatures

The BioPulse AI risk stratification architecture operates via a **progressive two-tier hierarchy**:

### Female PCOS Pathway (`PCOS-ML`)
- **Tier 1 (Phenotypic / Non-Invasive — 16 features)**:
  `age`, `weight_kg`, `height_cm`, `bmi`, `cycle_regularity`, `cycle_length_raw`, `hip_inch`, `waist_inch`, `waist_hip_ratio`, `weight_gain`, `hirsutism`, `skin_darkening`, `hair_loss`, `pimples_acne`, `fast_food`, `regular_exercise`.
  *Model*: ExtraTreesClassifier with Platt Sigmoid Calibration (`CalibratedClassifierCV`).
- **Tier 2 (Cumulative Biochemical — 32 features)**:
  Inherits all Tier 1 features plus clinical vitals and laboratory biomarkers: `pulse_rate_bpm`, `respiratory_rate`, `hemoglobin`, `beta_hcg_i`, `beta_hcg_ii`, `fsh`, `lh`, `fsh_lh_ratio`, `tsh`, `amh`, `prolactin`, `vitamin_d3`, `progesterone`, `rbs`, `bp_systolic`, `bp_diastolic`.
  *Model*: 5-fold ensemble with fold-aware TreeSHAP explainability.

### Male Hypogonadism Pathway (`male-ML`)
- **Tier 1 (Symptom & Vitals — 11 features)**:
  `age`, `height_cm`, `weight_kg`, `bmi`, `waist_cm`, `low_energy`, `sleep_trouble`, `low_mood`, `low_interest`, `high_blood_pressure`, `diabetes`.
  *Model*: Balanced Logistic Regression with LinearSHAP explainability.
- **Tier 2 (Endocrine Lab Panel — 16 features)**:
  `age`, `shbg_nmol_l`, `estradiol_pg_ml`, `albumin_g_dl`, `hba1c_pct`, `glucose_mg_dl`, `hemoglobin_g_dl`, `hematocrit_pct`, `rbc_count`, `alt_u_l`, `ast_u_l`, `total_bilirubin_mg_dl`, `creatinine_mg_dl`, `bun_mg_dl`, `uric_acid_mg_dl`, `hdl_mg_dl`.
  *Model*: Calibrated Random Forest with fold-aware TreeSHAP.

---

## 3. Medical Data & Artifact Handling Policy

> [!CAUTION]
> **STRICT PROHIBITION OF PROTECTED HEALTH INFORMATION (PHI/PII)**
> Never commit real patient records, identifiable health data, unredacted scans, or proprietary clinical datasets into this Git repository.
> Only de-identified, publicly open research cohorts or synthetic data may be stored locally.

### Model Storage & Versioning Strategy
1. **Lightweight Artifacts (<50MB)**:
   Pre-trained scikit-learn/joblib pipelines can be checked into their respective `models/` folders, provided they are accompanied by checksum verification in `test_production_models.py`.
2. **Heavyweight Vision Models (>100MB)**:
   PyTorch vision backbones (e.g., EfficientNet-B0 weights) must NOT be committed directly to Git. They should be retrieved from versioned cloud object storage or Git LFS during production deployment.
3. **Artifact Integrity**:
   Every model artifact MUST be loadable via `joblib.load()` and pass the smoke test in `test_production_models.py` before any Pull Request is merged.

---

## 4. How Models Are Consumed

```
┌────────────────────────┐
│ Machine Learning (ML)  │
│ Models & TreeSHAP      │
└───────────┬────────────┘
            │ Joblib / Torch In-Memory Service
┌───────────▼────────────┐
│ Backend (Django / DRF) │
│ apps/intelligence/     │
└───────────┬────────────┘
            │ REST API (/api/v1/intelligence/assessment/)
┌───────────▼────────────┐
│ Frontend (React / Vite)│
│ apps/web/              │
└────────────────────────┘
```

The Django backend imports models via the singleton services in `backend/apps/intelligence/services/`:
- `pcos_ml_service.py`: Loads PCOS Tier 1, Tier 2, and ultrasound vision models.
- `male_ml_service.py`: Loads Male Tier 1 and Tier 2 models.
- `shap_adapter.py`: Computes fold-averaged local SHAP feature importance for explainability cards.

---

## 5. Submitting Model Changes (PR Workflow)

When an ML developer improves or retrains a model:
1. Create a feature branch: `feature/ml-<description>` (e.g., `feature/ml-pcos-calibration`).
2. Run the offline training script to generate the candidate artifact.
3. Validate feature signature consistency: Ensure input columns and types match the expected schema.
4. Execute validation locally:
   ```powershell
   pytest machine-learning/test_production_models.py -v
   ```
5. Commit with conventional commit tag: `feat(ml): update PCOS Tier 2 calibrated pipeline`.
6. Open a Pull Request into `develop`. Include model evaluation metrics (ROC-AUC, Brier score, sensitivity, specificity) in the PR description.
