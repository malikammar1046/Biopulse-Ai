# OvaSense PCOS Machine Learning Pipeline

A medically responsible, explainable, and technically defensible machine learning system for Polycystic Ovary Syndrome (PCOS) risk assessment.

---

## 1. Project Architecture: Progressive 3-Tier Assessment

OvaSense models clinical diagnosis as a progressive incorporation of evidence:

1. **Tier 1 — Self-Reported Pre-Clinical Screening (16 Core Features)**:
   - Non-invasive, free, user-accessible at home.
   - Demographics, anthropometrics, menstrual regularity, menses bleeding duration, hyperandrogenic symptoms, and lifestyle habits.
   - Strictly excludes clinical vitals, laboratory tests, ultrasound, and biased reproductive/marital history variables.
2. **Tier 2 — Clinical & Laboratory Enhancement (32 Features = 16 Tier 1 + 16 Tier 2)**:
   - Evaluates whether adding objective laboratory and clinical triage data enhances the Tier 1 assessment.
   - Clinical vitals (Pulse, RR, BP), hematology (Hb), pituitary/ovarian hormones (FSH, LH, FSH/LH, TSH, AMH, PRL, PRG, beta-hCG), and metabolic glucose (RBS).
   - **Tier 2 is an enhancement of Tier 1, NOT an independent laboratory-only model.**
3. **Tier 3 — Ultrasound / Imaging (Future Multi-Modal Fusion)**:
   - Tabular clinical dataset contains 5 structured transvaginal ultrasound measurements (`Follicle No. (L/R)`, `Avg. F size (L/R)`, `Endometrium`), but **zero ultrasound images**.
   - These 5 structured measurements are isolated in `data/tiered/tier3_structured_reference.csv` as a reference.
   - **Tier 3 cannot currently be trained as an imaging model from this dataset.**

---

## 2. Directory Structure

```text
pcos_ml/
│
├── data/
│   ├── raw/                              # Reference to authoritative read-only files
│   ├── processed/                        # Master cleaned matrix with normalized types
│   │   └── pcos_cleaned_master.csv       # 541 rows x 45 columns
├── models/
│   ├── tier1/                            # Serialized Tier 1 model artifact (joblib)
│   │   └── tier1_selected_model.joblib   # Extra Trees Unweighted + Platt Sigmoid Calibration
│   └── tier2/                            # Serialized Tier 2 model artifact (joblib)
│       └── tier2_selected_model.joblib   # Extra Trees Unweighted + Platt Sigmoid Calibration (32 features)
│
├── notebooks/
│   ├── 03_Tier2_Model_Training.ipynb     # Executable Tier 2 model training notebook with populated outputs
│   └── 04_Tier1_vs_Tier2_Comparative_Analysis.ipynb # Supervisor-ready comparative evaluation notebook
│
├── src/
│   ├── data_audit.py                     # Raw dataset verification and hash checks
│   ├── tier_classifier.py                # Schema mapping and column classifier
│   ├── preprocessing.py                  # Cleans typos ('1.99.', 'a', vitals) & generates tiers
│   ├── verify_pipeline.py                # Automated integrity and tier isolation checks
│   ├── evaluation.py                     # Multi-metric evaluation, threshold sweeps, calibration
│   ├── models.py                         # Model factory & fold-contained ColumnTransformers
│   ├── train_tier1.py                    # Complete Tier 1 10-step training & evaluation runner
│   └── predict_tier1.py                  # Interactive terminal evaluation tool for Tier 1
│
├── reports/
│   ├── comparison/                       # Head-to-head comparison metrics and diagnostic figures
│   │   ├── tier1_vs_tier2_metrics.csv    # Metric difference table with winning tier marked
│   │   ├── tier1_vs_tier2_holdout_metrics.csv # Full holdout comparison at default and screening tau
│   │   ├── low_circularity_comparison.csv# Sensitivity analysis (Rotterdam criteria excluded)
│   │   ├── roc_comparison.png            # Side-by-side publication-grade ROC curves
│   │   ├── pr_comparison.png             # Side-by-side Precision-Recall curves
│   │   ├── calibration_comparison.png    # Holdout reliability diagrams
│   │   └── confusion_matrices_comparison.png # Side-by-side screening confusion matrices
│   ├── TIER1_VS_TIER2_COMPARATIVE_ANALYSIS.md # Authoritative comparative scientific report
│   ├── tier1/                            # Tier 1 training outputs, CSV tables & reports
│   │   ├── TIER1_TRAINING_REPORT.md      # Authoritative Tier 1 model training & evaluation report
│   │   ├── tier1_model_comparison.csv    # 8-model CV performance summary (mean ± SD)
│   │   ├── tier1_cv_results.csv          # 15-fold detailed cross-validation records
│   │   ├── tier1_holdout_results.csv     # Final single evaluation on frozen 20% holdout
│   │   ├── tier1_threshold_analysis.csv  # Threshold sweeps for target sensitivity >= 0.85
│   │   ├── tier1_calibration_results.csv # Brier score & Platt calibration analysis
│   │   ├── tier1_low_circularity_results.csv # Sensitivity analysis on non-Rotterdam features
│   │   ├── tier1_blocked_cv_results.csv  # Contiguous blocked-CV intake stability analysis
│   │   ├── tier1_confusion_matrix.csv    # Confusion matrices at default and clinical thresholds
│   │   └── tier1_feature_importance.csv  # SHAP global feature attributions
│   ├── tier2/                            # Tier 2 training outputs, CSV tables & diagnostic figures
│   │   ├── tier2_model_comparison.csv    # 8-model CV performance summary (mean ± SD)
│   │   ├── tier2_cv_results.csv          # 15-fold detailed cross-validation records
│   │   ├── tier2_holdout_results.csv     # Final single evaluation on frozen 20% holdout
│   │   ├── tier2_threshold_analysis.csv  # Threshold sweeps for target sensitivity >= 0.85
│   │   ├── tier2_calibration_results.csv # Brier score & Platt calibration analysis
│   │   ├── tier2_low_circularity_results.csv # Sensitivity analysis on 27 non-Rotterdam features
│   │   ├── tier2_blocked_cv_results.csv  # Contiguous blocked-CV intake stability analysis
│   │   ├── tier2_vs_tier1_comparison.csv # Direct head-to-head Tier 1 vs Tier 2 delta table
│   │   ├── tier2_confusion_matrix.csv    # Confusion matrices at default and clinical thresholds
│   │   ├── tier2_shap_summary.csv        # SHAP global feature attributions
│   │   └── *.png                         # High-DPI diagnostic plots (ROC, PR, bar, calibration, CM)
│   ├── FINAL_PRE_TRAINING_AUDIT.md       # Authoritative pre-training scientific & methodological audit
│   ├── SECOND_LEVEL_AUDIT.md             # Second-level adversarial critical audit
│   ├── FINAL_FEATURE_DECISIONS.md        # Definitive 5-axis feature evaluation & criteria overlap
│   ├── FINAL_LEAKAGE_REVIEW.md           # Leakage channels, row batching, & CV protocol
│   ├── TIER1_INPUT_REQUIREMENTS.md       # Human-centered availability taxonomy & UI/UX guidelines
│   ├── ABLATION_PLAN.md                  # Systematic multivariable ablation experiments
│   ├── UPDATED_MODEL_TRAINING_APPROVAL.md# 22-item pre-training verification checklist & gate
│   ├── DATA_AUDIT.md                     # Initial raw dataset audit
│   ├── FEATURE_DECISION_LOG.md           # 8-question audit of every candidate feature
│   ├── TIER_ARCHITECTURE.md              # Progressive assessment architecture & fusion roadmap
│   ├── LEAKAGE_ANALYSIS.md               # Leakage analysis and CV protocol
│   ├── DATA_QUALITY_REPORT.md            # Outliers, derived features, & demographic analysis
│   └── feature_inventory.csv             # Traceability matrix mapping all 45 raw columns
│
├── PCOS_data_without_infertility.xlsx     # Authoritative raw dataset (read-only)
├── PCOS_infertility.csv                  # Secondary infertility subset (read-only)
├── main.pdf                              # Peer-reviewed reference paper (CSBJ 2025)
└── README.md
```

---

## 3. How to Run the Pipeline

### Step 1: Verify Raw Dataset & Hashes
```powershell
python src/data_audit.py
```

### Step 2: Clean Dataset & Generate Tiered Datasets
```powershell
python src/preprocessing.py
```

### Step 3: Run Automated Pipeline & Isolation Verification
```powershell
python src/verify_pipeline.py
```

All verification tests must display `[PASS]` before proceeding to model training.

### Step 4: Run Tier 1 Model Training & Evaluation Protocol
```powershell
python src/train_tier1.py
```
Executes the audited 10-step training protocol:
- Stratified holdout isolation (20%, $N=109$, `seed=42`)
- Repeated Stratified 5-Fold Cross-Validation (15 folds, `seed=42`)
- Evaluates Logistic Regression, Random Forest, Extra Trees, and XGBoost (unweighted vs. balanced)
- Out-of-fold threshold tuning for clinical screening ($\text{Sensitivity} \ge 0.85$)
- Platt probability calibration and Brier score evaluation
- Low-circularity sensitivity experiment (non-Rotterdam features)
- Contiguous blocked-CV sensitivity experiment (row-order stability)
- Single evaluation on frozen untouched holdout ($N=109$)
- SHAP feature attributions and report export to `reports/tier1/`

### Step 5: Run Interactive Manual Prediction Tool
```powershell
python src/predict_tier1.py
```
Interactive terminal interface for evaluating a patient's Tier 1 self-reported profile using the trained, calibrated Extra Trees model with deterministic BMI/WHR derivation and SHAP factor attribution.

### Step 6: Run Tier 2 Model Training (Jupyter Notebook)
```powershell
jupyter notebook notebooks/03_Tier2_Model_Training.ipynb
```
Executes the audited 22-section Tier 2 model training workflow:
- Combines 16 Tier 1 self-reported features with 16 Tier 2 clinical/laboratory features (32 combined features as a single feature vector).
- Exact same frozen holdout protocol (20%, $N=109$, `seed=42`) and 15-fold RSKF on development set ($N=432$, `seed=42`).
- Restrained candidate model comparison across Logistic Regression, Random Forest, Extra Trees, and XGBoost.
- Probability calibration (Platt Sigmoid) and clinical screening threshold selection ($\tau^* = 0.29$ targeting $\ge 85\%$ sensitivity).
- Single holdout evaluation on frozen untouched holdout ($N=109$).
- Comprehensive Tier 1 vs Tier 2 head-to-head comparison and clinical interpretation.
- Low-circularity (27 features, non-Rotterdam) and contiguous row-order blocked CV sensitivity analyses.
- Global model-attributed SHAP explanations and serialization of final production artifact to `models/tier2/tier2_selected_model.joblib`.

### Step 7: Run Tier 1 vs Tier 2 Comparative Analysis (Jupyter Notebook)
```powershell
jupyter notebook notebooks/04_Tier1_vs_Tier2_Comparative_Analysis.ipynb
```
Executes the supervisor-facing 22-section comparative evaluation:
- Loads the trained Tier 1 and Tier 2 production models without retraining.
- Direct side-by-side metric comparison across 15-fold CV and the frozen holdout ($N=109$).
- Metric difference analysis ($\Delta = \text{Tier 2} - \text{Tier 1}$), demonstrating that Tier 1 slightly outperforms Tier 2 ($0.8980$ vs $0.8919$ holdout ROC-AUC).
- Publication-quality ROC, PR, calibration, and confusion matrix comparisons.
- Statistical significance evaluation: paired 15-fold CV t-test ($p = 0.820$) and holdout bootstrap 95% confidence intervals (spans zero).
- In-depth scientific analysis of phenotypic saturation, events-per-variable halving, and tree subsampling resilience.
- Analysis of dataset limitations, including the empirical Beta-HCG / pregnancy anomaly (103 non-pregnant patients with Beta-HCG > 10).
- Product and architectural implications for OvaSense's progressive multi-tier screening and clinical workflow.
