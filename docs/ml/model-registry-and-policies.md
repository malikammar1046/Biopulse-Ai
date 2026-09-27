# BioPulse AI — ML Model Registry & Governance Policies

This guide details the lifecycle management, serialization standards, evaluation gates, and governance policies for all machine learning models in BioPulse AI.

---

## 1. Production Model Catalog

| Pathway | Tier Level | Target Condition | Inputs | Primary Model Architecture | Explainability Technique |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Female** | Tier 1 | Polycystic Ovary Syndrome (PCOS) | 16 Phenotypic Features | ExtraTreesClassifier + Platt Sigmoid Calibration | 5-Fold Calibrated TreeSHAP |
| **Female** | Tier 2 | Cumulative PCOS Risk | 32 Features (Tier 1 + Labs/Vitals) | ExtraTreesClassifier + Platt Sigmoid Calibration | 5-Fold Calibrated TreeSHAP |
| **Female** | Vision | Polycystic Ovarian Morphology (PCOM) | Pelvic Ultrasound Scans | PyTorch EfficientNet-B0 Backbone | Grad-CAM Attention Heatmaps |
| **Male** | Tier 1 | Male Hypogonadism / Low Testosterone | 11 Symptomatic & Anthropometric Features | Logistic Regression (Balanced) | LinearSHAP |
| **Male** | Tier 2 | Comprehensive Endocrine Risk | 16 Biomarker Panel Features | Calibrated Random Forest | 5-Fold Calibrated TreeSHAP |

---

## 2. Model Serialization & Verification

1. **Format**: Models must be serialized using `joblib` with explicit compression.
2. **Deterministic Schemas**: All tabular models must enforce input column ordering and handle missing data via dedicated imputation transformers inside the scikit-learn Pipeline.
3. **Automated Smoke Gate**: Every production artifact must pass the validation suite in `machine-learning/test_production_models.py`.

---

## 3. Data Privacy and Ethical AI Rules

- **Zero PHI Tolerance**: No real patient records, protected health information (PHI), or identifiable personal attributes are stored in this repository.
- **De-identification**: Public open-science cohorts (e.g., Kaggle PCOS dataset, NHANES endocrine samples) and synthetic cohorts are strictly de-identified before use.
- **Bias & Fairness Evaluation**: Any retraining must evaluate calibration parity across age and BMI brackets to prevent algorithmic disparity.
- **Explainability Requirement**: No "black-box" predictions are deployed to production without accompanying SHAP feature attributions.
