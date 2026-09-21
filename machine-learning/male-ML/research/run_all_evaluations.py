"""
research/run_all_evaluations.py
-------------------------------
Master evaluation driver for BioPulse AI Phase 3 Research Layer.
Executes:
1. Comparative Ablation Study (Models A, B, C, D) with 1,000-sample bootstrap 95% CIs.
2. Calibration & Reliability Analysis (Brier, ECE, MCE, decile tables).
3. Subgroup Audits (Age groups, Diabetes status, BMI categories).
4. Experiment Registry logging.
5. Machine-readable JSON report serialization.
"""

import json
import os
import sys
import numpy as np

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
MALE_ML_ROOT = os.path.dirname(CURRENT_DIR)
sys.path.insert(0, CURRENT_DIR)

from ablation_runner import run_ablation_study
from calibration_analysis import run_calibration_evaluation
from subgroup_audit import run_subgroup_audit
from experiment_registry import ExperimentRegistry


def main():
    print("*" * 75)
    print("BIOPULSE AI — PHASE 3 RESEARCH & EVALUATION SUITE")
    print("Target Population: Adult Men aged 19–60 (CDC NHANES 2013–2016 Cohort, N=3,575)")
    print("*" * 75)

    registry = ExperimentRegistry()

    # 1. Run Ablation Study
    ablation_results = run_ablation_study()

    # 2. Run Calibration Analysis
    calibration_results = run_calibration_evaluation()

    # 3. Run Subgroup Audit
    subgroup_results = run_subgroup_audit()

    # 4. Save Tier 1 & Tier 2 individual reports
    tier1_dir = os.path.join(MALE_ML_ROOT, "reports", "tier1")
    tier2_dir = os.path.join(MALE_ML_ROOT, "reports", "tier2")
    os.makedirs(tier1_dir, exist_ok=True)
    os.makedirs(tier2_dir, exist_ok=True)

    with open(os.path.join(tier1_dir, "tier1_evaluation.json"), "w", encoding="utf-8") as f:
        json.dump(ablation_results["models"]["model_a_tier1_only"], f, indent=2)

    with open(os.path.join(tier2_dir, "tier2_evaluation.json"), "w", encoding="utf-8") as f:
        json.dump(ablation_results["models"]["model_b_tier2_only"], f, indent=2)

    # 5. External validation dataset audit record
    ext_dir = os.path.join(MALE_ML_ROOT, "reports", "external_validation")
    os.makedirs(ext_dir, exist_ok=True)
    ext_audit = {
        "external_validation_conducted": False,
        "reason": "No compatible independent dataset with paired Tier 1 and Tier 2 variables exists in the repository.",
        "datasets_examined": [
            {
                "dataset_name": "ptestost.xlsx (Elderly Taiwanese Male Health Exam Cohort)",
                "sample_size": 3397,
                "age_range": "45-85 (Mean: 62.4 years)",
                "compatible": False,
                "incompatibility_reasons": [
                    "Missing all Tier 1 symptom questions (low energy, sleep trouble, low mood, low interest).",
                    "Missing 14 of 16 Tier 2 laboratory features (SHBG, Estradiol, Albumin, HbA1c, Liver enzymes, Kidney markers, CBC).",
                    "Population age distribution is severely skewed towards geriatric men (60-85), failing the 19-60 target window."
                ]
            },
            {
                "dataset_name": "horm.csv (Occupational BPA Chemical Cohort)",
                "sample_size": 560,
                "compatible": False,
                "incompatibility_reasons": [
                    "Lacks standard clinical questionnaire features.",
                    "Lacks broader metabolic panel (liver, kidney, glycemic, hematologic biomarkers).",
                    "Occupational chemical exposure population with non-representative endocrine confounders."
                ]
            },
            {
                "dataset_name": "Dataset+DEXA.xls (Body Composition Scan Study)",
                "sample_size": "Unknown",
                "compatible": False,
                "incompatibility_reasons": [
                    "Body composition / radiology focus without multi-biomarker laboratory endocrine panel."
                ]
            }
        ],
        "conclusion": "External validation must be performed on an authentic, prospective clinical cohort rather than forced onto incompatible datasets."
    }
    with open(os.path.join(ext_dir, "dataset_audit.json"), "w", encoding="utf-8") as f:
        json.dump(ext_audit, f, indent=2)

    # 6. Log experiments in registry
    meta = ablation_results["benchmark_metadata"]
    sample_info = {
        "total_cohort_n": meta["total_participants"],
        "train_n": meta["train_participants"],
        "test_n": meta["test_participants"],
        "prevalence_percent": meta["prevalence_pct"]
    }

    # Register Model A
    registry.register_experiment(
        experiment_id="EXP-001-TIER1",
        name="Model A: Male Tier 1 Screening (Non-Invasive)",
        description="Calibrated Logistic Regression on 11 demographic, physical, and symptom parameters.",
        dataset="CDC NHANES 2013-2016 Men 19-60",
        sample_size=sample_info,
        features=ablation_results["models"]["model_a_tier1_only"]["features"],
        model_type="LogisticRegression(penalty='l2', class_weight='balanced') + Platt Calibration",
        hyperparameters={"C": 0.1, "screening_threshold": 0.1808},
        metrics=ablation_results["models"]["model_a_tier1_only"]["metrics"],
        notes="Validated for adult men 19-60. Primary goal is sensitivity-oriented non-invasive triage."
    )

    # Register Model B
    registry.register_experiment(
        experiment_id="EXP-002-TIER2",
        name="Model B: Male Tier 2 Laboratory Screener (Anti-Leakage)",
        description="Calibrated Random Forest on 16 indirect metabolic and carrier protein blood biomarkers (Total T excluded).",
        dataset="CDC NHANES 2013-2016 Men 19-60",
        sample_size=sample_info,
        features=ablation_results["models"]["model_b_tier2_only"]["features"],
        model_type="RandomForestClassifier(n_estimators=300, max_depth=8) + CalibratedClassifierCV(sigmoid)",
        hyperparameters={"n_estimators": 300, "max_depth": 8, "screening_threshold": 0.3379},
        metrics=ablation_results["models"]["model_b_tier2_only"]["metrics"],
        notes="Zero target leakage. Excludes Total Testosterone and Free Testosterone from feature matrix."
    )

    # Register Model C
    registry.register_experiment(
        experiment_id="EXP-003-MULTIMODAL",
        name="Model C: Tier 1 + Tier 2 Multimodal Combined Screener",
        description="Calibrated Random Forest on 26 unified biometric, symptom, and laboratory features.",
        dataset="CDC NHANES 2013-2016 Men 19-60 Paired",
        sample_size=sample_info,
        features=ablation_results["models"]["model_c_multimodal_combined"]["features"],
        model_type="Pipeline(SimpleImputer, StandardScaler, RandomForestClassifier) + CalibratedClassifierCV",
        hyperparameters={"n_estimators": 300, "max_depth": 8, "screening_threshold": ablation_results["models"]["model_c_multimodal_combined"]["screening_threshold"]},
        metrics=ablation_results["models"]["model_c_multimodal_combined"]["metrics"],
        notes="Evaluates multimodal combination of non-invasive biometrics with clinical laboratory panel."
    )

    # Register Model D (Audit)
    registry.register_experiment(
        experiment_id="EXP-004-LONGITUDINAL",
        name="Model D: Tier 1 + Tier 2 + Longitudinal Repeat Draw Audit",
        description="Longitudinal evaluation audit in public cross-sectional NHANES cohort.",
        dataset="CDC NHANES 2013-2016 Men 19-60",
        sample_size=sample_info,
        features=["Tier 1 (11)", "Tier 2 (16)", "Longitudinal Repeat Draws (0 available)"],
        model_type="Ablation Limitation Audit",
        hyperparameters={"status": "INCOMPATIBLE_CROSS_SECTIONAL_SURVEY"},
        metrics={"roc_auc": None, "note": "Cross-sectional survey lacks paired repeat morning draws."},
        notes="Documented limitation per scientific integrity guidelines. Longitudinal architecture implemented in software."
    )

    print("\n" + "=" * 75)
    print("ALL PHASE 3 EVALUATION MODULES COMPLETED SUCCESSFULLY.")
    print("Registry saved to: reports/experiment_registry.json")
    print("=" * 75)


if __name__ == "__main__":
    main()
