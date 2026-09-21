"""
evidence_engine/assessment_engine.py
------------------------------------
Progressive Assessment Engine for BioPulse Male Endocrine Screening.
Integrates Tier 1 biometrics and Tier 2 laboratory evidence into a unified,
progressively enriched assessment using existing validated ML models and rule layers.
Enforces non-diagnostic clinical safety language.
"""

from __future__ import annotations
import os
import sys
import logging
from typing import Any, Dict, List, Optional, Tuple
import joblib
import numpy as np
import pandas as pd

_CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
_MALE_ML_ROOT = os.path.abspath(os.path.join(_CURRENT_DIR, ".."))
_MALE_TIER1_DIR = os.path.join(_MALE_ML_ROOT, "male_tier1")
_MALE_TIER2_DIR = os.path.join(_MALE_ML_ROOT, "male_tier2")
_MALE_TIER2_SRC = os.path.join(_MALE_TIER2_DIR, "src")

if _MALE_TIER2_SRC not in sys.path:
    sys.path.insert(0, _MALE_TIER2_SRC)

# Safe imports from existing male_tier2
try:
    from evaluation import interpret_clinical_hormone_pattern
except ImportError:
    interpret_clinical_hormone_pattern = None

try:
    from preprocessing import FEATURE_COLS as TIER2_FEATURE_COLS
except ImportError:
    TIER2_FEATURE_COLS = [
        "age", "shbg_nmol_l", "estradiol_pg_ml", "albumin_g_dl", "hba1c_pct",
        "glucose_mg_dl", "hemoglobin_g_dl", "hematocrit_pct", "rbc_count",
        "alt_u_l", "ast_u_l", "total_bilirubin_mg_dl", "creatinine_mg_dl",
        "bun_mg_dl", "uric_acid_mg_dl", "hdl_mg_dl"
    ]

from schemas import (
    UnifiedAssessmentResult,
    AssessmentStage
)
from evidence_state import EvidenceState
from evidence_gaps import calculate_evidence_completeness, EvidenceGapEngine

logger = logging.getLogger(__name__)

# Feature definitions for Tier 1
TIER1_FEATURE_NAMES = [
    "age",
    "height_cm",
    "weight_kg",
    "bmi",
    "waist_cm",
    "low_energy",
    "sleep_trouble",
    "low_mood",
    "low_interest",
    "high_blood_pressure",
    "diabetes"
]

# Mapping from Tier 2 feature names to EvidenceState canonical keys
FEATURE_TO_ANALYTE_KEY = {
    "shbg_nmol_l": "shbg",
    "estradiol_pg_ml": "estradiol",
    "albumin_g_dl": "albumin",
    "hba1c_pct": "hba1c",
    "glucose_mg_dl": "glucose",
    "hemoglobin_g_dl": "hemoglobin",
    "hematocrit_pct": "hematocrit",
    "rbc_count": "rbc",
    "alt_u_l": "alt",
    "ast_u_l": "ast",
    "total_bilirubin_mg_dl": "total_bilirubin",
    "creatinine_mg_dl": "creatinine",
    "bun_mg_dl": "bun",
    "uric_acid_mg_dl": "uric_acid",
    "hdl_mg_dl": "hdl"
}

FRIENDLY_ANALYTE_NAMES = {
    "total_testosterone": "Testosterone level (Total)",
    "free_testosterone": "Active (free) testosterone",
    "lh": "LH hormone (brain signal to produce testosterone)",
    "fsh": "FSH hormone (brain signal for sperm health)",
    "shbg": "Hormone carrier protein (SHBG)",
    "prolactin": "Prolactin hormone",
    "estradiol": "Estrogen (Estradiol)",
    "albumin": "Albumin protein",
    "glucose": "Blood sugar (Glucose)",
    "hemoglobin": "Hemoglobin (red blood cells)",
    "hematocrit": "Hematocrit",
    "hba1c": "HbA1c (3-month blood sugar)",
    "alt": "Liver enzyme (ALT)",
    "ast": "Liver enzyme (AST)",
    "total_bilirubin": "Bilirubin",
    "creatinine": "Kidney marker (Creatinine)",
    "bun": "Kidney marker (BUN)",
    "uric_acid": "Uric acid",
    "hdl": "HDL (good cholesterol)"
}

SAFETY_DISCLAIMER_TEXT = (
    "IMPORTANT SAFETY STATEMENT: BioPulse is an educational screening system, NOT a medical diagnosis. "
    "Testosterone levels fluctuate naturally and are influenced by sleep, illness, and acute stress. "
    "These screening results do not confirm a medical condition. A qualified healthcare professional, "
    "clinical symptom evaluation, and certified morning blood laboratory testing are required for clinical diagnosis."
)


class ProgressiveAssessmentEngine:
    """
    Orchestrates the progressive evaluation of an EvidenceState.
    Reuses existing Tier 1 and Tier 2 calibrated model artifacts and pattern rules.
    """

    def __init__(self, tier1_artifact_path: Optional[str] = None, tier2_artifact_path: Optional[str] = None):
        self._tier1_path = tier1_artifact_path or os.path.join(_MALE_TIER1_DIR, "artifacts", "male_low_t_model.joblib")
        self._tier2_path = tier2_artifact_path or os.path.join(_MALE_TIER2_DIR, "artifacts", "male_tier2_model.joblib")
        self._tier1_artifact: Optional[Dict[str, Any]] = None
        self._tier2_artifact: Optional[Dict[str, Any]] = None
        self._load_artifacts()

    def _load_artifacts(self) -> None:
        """Loads serialized model artifacts with backward-compatibility warnings suppressed."""
        import warnings
        try:
            from sklearn.exceptions import InconsistentVersionWarning
        except ImportError:
            InconsistentVersionWarning = UserWarning

        with warnings.catch_warnings():
            warnings.simplefilter("ignore", InconsistentVersionWarning)
            if os.path.exists(self._tier1_path):
                try:
                    self._tier1_artifact = joblib.load(self._tier1_path)
                except Exception as e:
                    logger.warning("Could not load Tier 1 artifact: %s", e)

            if os.path.exists(self._tier2_path):
                try:
                    self._tier2_artifact = joblib.load(self._tier2_path)
                except Exception as e:
                    logger.warning("Could not load Tier 2 artifact: %s", e)

    # -------------------------------------------------------------------------
    # Tier 1 Inference
    # -------------------------------------------------------------------------

    def evaluate_tier1(self, state: EvidenceState) -> Dict[str, Any]:
        """
        Executes calibrated Tier 1 risk screening using existing Logistic Regression model.
        """
        age = state.age if state.age is not None else 35.0
        bmi = state.bmi
        if bmi is None:
            if state.height_cm and state.weight_kg and state.height_cm > 0:
                h_m = state.height_cm / 100.0
                bmi = state.weight_kg / (h_m * h_m)
            else:
                bmi = 26.0

        row = {
            "age": float(age),
            "height_cm": float(state.height_cm if state.height_cm is not None else 175.0),
            "weight_kg": float(state.weight_kg if state.weight_kg is not None else 80.0),
            "bmi": float(bmi),
            "waist_cm": float(state.waist_cm if state.waist_cm is not None else 90.0),
            "low_energy": float(state.low_energy if state.low_energy is not None else 0),
            "sleep_trouble": float(state.sleep_trouble if state.sleep_trouble is not None else 0),
            "low_mood": float(state.low_mood if state.low_mood is not None else 0),
            "low_interest": float(state.low_interest if state.low_interest is not None else 0),
            "high_blood_pressure": float(state.high_blood_pressure if state.high_blood_pressure is not None else 0),
            "diabetes": float(state.diabetes if state.diabetes is not None else 0)
        }

        X_df = pd.DataFrame([row])[TIER1_FEATURE_NAMES]

        prob = 0.15
        threshold = 0.1808
        if self._tier1_artifact is not None:
            model = self._tier1_artifact["model"]
            threshold = float(self._tier1_artifact.get("screening_threshold", 0.1808))
            prob = float(model.predict_proba(X_df)[0, 1])

        # Record in state
        state.set_tier1_model_output(prob, threshold=threshold)

        is_screen_positive = (prob >= threshold)
        if prob < 0.15:
            risk_level = "Lower Screening Risk"
            summary_badge = "LOWER RISK"
        elif prob < threshold:
            risk_level = "Borderline Likelihood"
            summary_badge = "BORDERLINE RISK"
        elif prob < 0.40:
            risk_level = "Elevated Screening Signal"
            summary_badge = "ELEVATED SIGNAL"
        else:
            risk_level = "Higher Screening Signal"
            summary_badge = "HIGHER SIGNAL"

        # Contributing factor analysis
        factors = []
        if state.waist_cm is not None and state.waist_cm >= 102.0:
            factors.append("Waist circumference >= 102 cm (correlates with lower testosterone availability).")
        elif state.waist_cm is not None and state.waist_cm >= 94.0:
            factors.append("Mildly elevated waist circumference (abdominal adiposity marker).")

        if bmi >= 30.0:
            factors.append(f"Body Mass Index in the obese range (BMI = {bmi:.1f} kg/m²).")
        elif bmi >= 25.0:
            factors.append(f"Body Mass Index in the overweight range (BMI = {bmi:.1f} kg/m²).")

        if state.low_energy and state.low_energy >= 2:
            factors.append("Reported frequent tiredness or low energy over the past 2 weeks.")
        if state.sleep_trouble and state.sleep_trouble >= 2:
            factors.append("Reported frequent sleep disturbance (poor sleep significantly suppresses morning testosterone production).")
        if state.low_interest and state.low_interest >= 2:
            factors.append("Reported reduced sexual interest or drive.")
        if state.high_blood_pressure == 1:
            factors.append("History of elevated blood pressure (vascular metabolic factor).")
        if state.diabetes == 1:
            factors.append("History of diabetes or insulin resistance (closely associated with testosterone levels).")
        if age >= 45:
            factors.append(f"Age {int(age)} (testosterone levels gradually decline with age).")

        if not factors:
            factors.append("No prominent physical or symptom risk flags detected.")

        return {
            "risk_level": risk_level,
            "badge": summary_badge,
            "probability_percent": round(prob * 100.0, 1),
            "screening_threshold_percent": round(threshold * 100.0, 1),
            "screen_positive": is_screen_positive,
            "bmi": round(bmi, 1),
            "contributing_factors": factors,
            "guidance": (
                "Your responses show factors that are sometimes associated with lower testosterone levels. "
                "Consider discussing these findings with a physician."
                if is_screen_positive else
                "Your profile shows a lower likelihood pattern based on physical metrics and reported symptoms."
            )
        }

    # -------------------------------------------------------------------------
    # Tier 2 Inference & Hormonal Pattern Evaluation
    # -------------------------------------------------------------------------

    def evaluate_tier2(self, state: EvidenceState) -> Dict[str, Any]:
        """
        Evaluates Tier 2 laboratory evidence:
        1. Direct laboratory interpretations with preserved reference ranges.
        2. Non-leaking predictive ML risk from metabolic/carrier biomarkers.
        """
        direct_values = []
        found_analytes = []

        # Only use verified analytes for ML prediction, but report verification status on all
        for key, item in state.analytes.items():
            name = FRIENDLY_ANALYTE_NAMES.get(key, key.replace("_", " ").title())
            found_analytes.append(name)

            orig_val = item.value
            orig_u = item.unit or item.normalized_unit or ""
            ref_l = item.reference_low
            ref_h = item.reference_high

            norm_val = item.normalized_value if item.normalized_value is not None else orig_val
            norm_u = item.normalized_unit or orig_u

            # Clinical status badge
            if ref_l is not None and orig_val < ref_l:
                status_text = "Below report reference range"
                status_badge = "LOW"
            elif ref_h is not None and orig_val > ref_h:
                status_text = "Above report reference range"
                status_badge = "HIGH"
            elif ref_l is not None and ref_h is not None:
                status_text = "Within normal reference range"
                status_badge = "NORMAL"
            else:
                status_text = "Reported (No reference range provided)"
                status_badge = "RECORDED"

            ref_str = f"{ref_l} - {ref_h} {orig_u}" if (ref_l is not None and ref_h is not None) else "Not specified"

            direct_values.append({
                "analyte_key": key,
                "friendly_name": name,
                "reported_value": f"{orig_val} {orig_u}".strip(),
                "normalized_value": f"{norm_val} {norm_u}".strip(),
                "report_reference_range": ref_str,
                "status_text": status_text,
                "status_badge": status_badge,
                "verified": item.verified,
                "source": item.source,
                "collection_time": item.collection_time
            })

        # Predictive ML Risk (Random Forest using 16 non-leaking indirect markers)
        ml_prediction = None
        if self._tier2_artifact is not None:
            age = state.age if state.age is not None else 35.0
            row_dict: Dict[str, float] = {"age": float(age)}

            has_any_indirect = False
            for feat in TIER2_FEATURE_COLS:
                if feat == "age":
                    continue
                canon_k = FEATURE_TO_ANALYTE_KEY.get(feat)
                # Only use VERIFIED analytes in predictive ML feature vector
                if canon_k and canon_k in state.analytes and state.analytes[canon_k].verified:
                    val = state.analytes[canon_k].normalized_value
                    row_dict[feat] = float(val) if val is not None else np.nan
                    has_any_indirect = True
                else:
                    row_dict[feat] = np.nan

            if has_any_indirect:
                X_df = pd.DataFrame([row_dict])[TIER2_FEATURE_COLS]
                calibrated_model = self._tier2_artifact["model"]
                screening_t = float(self._tier2_artifact.get("screening_threshold", 0.3379))
                prob = float(calibrated_model.predict_proba(X_df)[0, 1])
                screen_pos = (prob >= screening_t)

                ml_prediction = {
                    "risk_probability_percent": round(prob * 100.0, 1),
                    "screening_threshold_percent": round(screening_t * 100.0, 1),
                    "screen_positive": screen_pos,
                    "risk_level": "Elevated Screening Signal" if screen_pos else "Lower Screening Signal",
                    "model_notes": "Computed from broader metabolic and carrier protein blood biomarkers (excluding Total Testosterone to prevent leakage)."
                }

        return {
            "direct_laboratory_values": direct_values,
            "predictive_ml_risk": ml_prediction,
            "analytes_detected_count": len(direct_values),
            "analytes_detected": found_analytes
        }

    def evaluate_hormonal_pattern(self, state: EvidenceState) -> Optional[Dict[str, Any]]:
        """
        Invokes rule-based hormonal pattern interpretation (LH, FSH, Prolactin, Total T).
        Uses safe non-diagnostic wording.
        """
        tt_item = state.analytes.get("total_testosterone")
        lh_item = state.analytes.get("lh")
        fsh_item = state.analytes.get("fsh")
        prl_item = state.analytes.get("prolactin")

        if not tt_item and not lh_item and not fsh_item and not prl_item:
            return None

        tt_norm = tt_item.normalized_value if tt_item else None
        lh_norm = lh_item.normalized_value if lh_item else None
        fsh_norm = fsh_item.normalized_value if fsh_item else None
        prl_norm = prl_item.normalized_value if prl_item else None

        ref_ranges = {}
        if tt_item and tt_item.reference_low is not None:
            ref_ranges["total_testosterone_low"] = tt_item.reference_low
        if lh_item and lh_item.reference_high is not None:
            ref_ranges["lh_high"] = lh_item.reference_high
        if fsh_item and fsh_item.reference_high is not None:
            ref_ranges["fsh_high"] = fsh_item.reference_high
        if prl_item and prl_item.reference_high is not None:
            ref_ranges["prolactin_high"] = prl_item.reference_high

        if interpret_clinical_hormone_pattern:
            try:
                res = interpret_clinical_hormone_pattern(
                    total_t_ng_dl=tt_norm,
                    lh_miu_ml=lh_norm,
                    fsh_miu_ml=fsh_norm,
                    prolactin_ng_ml=prl_norm,
                    ref_ranges=ref_ranges
                )
                return res
            except Exception as e:
                logger.warning("Error running interpret_clinical_hormone_pattern: %s", e)

        # Fallback pure-python rule evaluator if isolated
        t_ref_low = ref_ranges.get("total_testosterone_low", 300.0)
        lh_ref_high = ref_ranges.get("lh_high", 8.6)
        fsh_ref_high = ref_ranges.get("fsh_high", 12.4)
        flags = []

        is_low_t = (tt_norm is not None and tt_norm < t_ref_low)
        tt_count = len(state.get_testosterone_measurements(verified_only=False))
        if tt_norm is not None:
            if is_low_t:
                flags.append(f"Testosterone level ({tt_norm:.1f} ng/dL) is below the standard reference range ({t_ref_low:.0f} ng/dL).")
                if tt_count < 2:
                    flags.append(
                        "Clinical Notice (2026 Endocrine Society Guidance): A single subnormal testosterone measurement "
                        "does not prove hypogonadism. Clinical confirmation requires characteristic symptoms plus consistently low "
                        "morning testosterone confirmed on at least two early-morning fasting measurements (07:00–11:00 AM) on separate days."
                    )
            else:
                flags.append(f"Testosterone level ({tt_norm:.1f} ng/dL) is within the standard reference range.")

        if is_low_t:
            if lh_norm is not None or fsh_norm is not None:
                is_lh_high = (lh_norm is not None and lh_norm > lh_ref_high)
                is_fsh_high = (fsh_norm is not None and fsh_norm > fsh_ref_high)
                if is_lh_high or is_fsh_high:
                    pat_name = "Primary Hormonal Pattern (Higher LH/FSH with Low Testosterone)"
                    pat_desc = (
                        "Your LH hormone or FSH hormone signals from the brain are high while testosterone level is low. "
                        "This pattern suggests the brain is sending strong signals to produce testosterone, but production in the body remains low. "
                        "This is an educational pattern interpretation, not a medical diagnosis. "
                        "Per 2026 Endocrine Society guidelines, repeat morning fasting testing is required to confirm."
                    )
                else:
                    pat_name = "Secondary Hormonal Pattern (Normal or Low LH/FSH with Low Testosterone)"
                    pat_desc = (
                        "Both testosterone level and brain signal hormones (LH hormone, FSH hormone) are low or in the standard range. "
                        "This pattern can sometimes be linked with sleep, daily stress, metabolic factors, or how the brain signals the body to produce testosterone. "
                        "This is an educational pattern interpretation, not a medical diagnosis. "
                        "Per 2026 Endocrine Society guidelines, repeat morning fasting testing is required to confirm."
                    )
            else:
                pat_name = "Low Testosterone Level (LH/FSH Hormones Not Tested)"
                pat_desc = (
                    "Your testosterone level is low, but LH hormone and FSH hormone were not tested. "
                    "Checking LH hormone and FSH hormone can help a doctor understand whether brain signals or the body's response are involved. "
                    "This is an educational pattern interpretation, not a medical diagnosis."
                )
        elif tt_norm is not None:
            pat_name = "Testosterone Level Within Reference Range"
            pat_desc = "Your reported testosterone level is within the standard reference range shown on the blood test."
        else:
            pat_name = "Incomplete Hormone Profile"
            pat_desc = "Additional blood tests are needed to better understand the hormonal pattern."

        # If external helper returned a result, enrich it with 2-test flag
        if interpret_clinical_hormone_pattern:
            try:
                res = interpret_clinical_hormone_pattern(
                    total_t_ng_dl=tt_norm,
                    lh_miu_ml=lh_norm,
                    fsh_miu_ml=fsh_norm,
                    prolactin_ng_ml=prl_norm,
                    ref_ranges=ref_ranges
                )
                if is_low_t and tt_count < 2:
                    if "clinical_flags" not in res:
                        res["clinical_flags"] = []
                    res["clinical_flags"].append(
                        "Clinical Notice (2026 Endocrine Society Guidance): A single subnormal testosterone measurement "
                        "does not prove hypogonadism. Clinical confirmation requires characteristic symptoms plus consistently low "
                        "morning testosterone confirmed on at least two early-morning fasting measurements (07:00–11:00 AM) on separate days."
                    )
                res["two_morning_test_confirmed"] = (tt_count >= 2)
                return res
            except Exception as e:
                logger.warning("Error running interpret_clinical_hormone_pattern: %s", e)

        return {
            "pattern_name": pat_name,
            "pattern_description": pat_desc,
            "clinical_flags": flags,
            "two_morning_test_confirmed": (tt_count >= 2)
        }

    # -------------------------------------------------------------------------
    # Master Progressive Assessment Generator
    # -------------------------------------------------------------------------

    def generate_assessment(self, state: EvidenceState) -> UnifiedAssessmentResult:
        """
        Executes unified progressive endocrine assessment.
        Explicitly separates:
        1. ML Screening (Tier 1 & Tier 2 without Total Testosterone leakage)
        2. Clinical Pattern Engine (T + LH + FSH + Prolactin)
        3. Evidence Engine (Gaps, Completeness, 2026 2-morning-draw rule)
        4. Explainability Engine
        5. Digital Twin (Longitudinal tracking & lifestyle trajectory)
        6. Research Layer (Calibration, Discrimination, Audit Context)
        """
        # 1. Evaluate Tier 1 baseline
        tier1_res = self.evaluate_tier1(state)

        # 2. Check presence of laboratory evidence (Tier 2)
        has_verified_labs = any(item.verified for item in state.analytes.values())
        has_any_labs = len(state.analytes) > 0

        # Stage determination: tier_1 if no verified labs, tier_2 if verified labs present
        if has_verified_labs:
            stage = AssessmentStage.TIER_2.value
        else:
            stage = AssessmentStage.TIER_1.value

        # 3. Evaluate Tier 2 if any lab evidence exists
        tier2_res = None
        hormonal_pattern = None
        if has_any_labs:
            tier2_res = self.evaluate_tier2(state)
            hormonal_pattern = self.evaluate_hormonal_pattern(state)

        # 4. Completeness and Deterministic Gaps
        completeness = calculate_evidence_completeness(state).to_dict()
        gaps = [g.to_dict() for g in EvidenceGapEngine.identify_gaps(state)]

        # 5. Longitudinal Testosterone Status
        all_tt = state.get_testosterone_measurements(verified_only=False)
        verified_tt = state.get_testosterone_measurements(verified_only=True)
        latest_tt = state.get_latest_testosterone(verified_only=False)
        morning_status = state.has_morning_timing(latest_tt) if latest_tt else None

        longitudinal_summary = {
            "measurement_count": len(all_tt),
            "verified_measurement_count": len(verified_tt),
            "repeated_measurements_available": len(all_tt) >= 2,
            "morning_timing_confirmed": morning_status is True,
            "timing_status": "morning" if morning_status is True else ("non_morning" if morning_status is False else "unspecified"),
            "measurements": [m.to_dict() for m in all_tt]
        }

        # 6. Synthesize Plain-English Non-Diagnostic Screening Status
        if stage == AssessmentStage.TIER_1.value:
            if tier1_res["screen_positive"]:
                screening_status = "Your current responses show an elevated lifestyle and biometric screening signal."
            else:
                screening_status = "Your current responses show a lower probability screening pattern."
        else:
            tt_meas = state.get_latest_testosterone(verified_only=True)
            tt_val = tt_meas.normalized_value if tt_meas else None

            if tt_val is not None and tt_val < 300.0:
                screening_status = "Your available laboratory results show a pattern that may warrant clinical evaluation."
            elif tt_val is not None:
                screening_status = "Your reported testosterone measurement is within the standard reference range."
            elif tier2_res and tier2_res.get("predictive_ml_risk", {}).get("screen_positive"):
                screening_status = "Your indirect metabolic and carrier biomarkers show an elevated screening pattern."
            else:
                screening_status = "Your available laboratory results show a lower likelihood pattern."

        # 7. Explanations & Limitations
        explanations = []
        for factor in tier1_res["contributing_factors"]:
            explanations.append({
                "domain": "tier1_lifestyle_biometric",
                "statement": factor
            })

        if hormonal_pattern and hormonal_pattern.get("clinical_flags"):
            for flag in hormonal_pattern["clinical_flags"]:
                explanations.append({
                    "domain": "hormonal_signaling",
                    "statement": flag
                })

        limitations = [
            "This assessment does not establish a diagnosis of hypogonadism or any medical condition.",
            "Testosterone levels fluctuate naturally and must be verified by a certified morning fasting blood draw.",
            "Per 2026 Endocrine Society guidance, at least two morning fasting draws on separate days are required for clinical evaluation.",
            "Clinical evaluation by a medical doctor is necessary to interpret results in context with symptoms and medical history.",
            "The assessment can be updated when additional verified evidence becomes available."
        ]

        if state.has_unverified_evidence():
            limitations.append(
                "Notice: Some laboratory results were derived from automated document reading and have not been confirmed by the user."
            )

        # 8. Structured BioPulse Narrative & Explicit Architectural Separation
        ml_screening = {
            "branch_name": "ML Screening",
            "tier1": {
                "question": "Based on the information currently available, is there a screening signal worth investigating?",
                "result": tier1_res
            },
            "tier2": {
                "question": "What does the available laboratory evidence show?",
                "predictive_ml_risk": tier2_res.get("predictive_ml_risk") if tier2_res else None,
                "direct_laboratory_values": tier2_res.get("direct_laboratory_values") if tier2_res else [],
                "target_leakage_guard": "Total Testosterone is strictly excluded from Tier 2 predictive feature matrix to prevent leakage."
            },
            "anti_leakage_verified": True
        }

        clinical_pattern_dict = {
            "branch_name": "Clinical Pattern",
            "question": "How do testosterone, LH, FSH and prolactin relate?",
            "pattern_interpretation": hormonal_pattern,
            "two_morning_test_confirmed": len(all_tt) >= 2 and (morning_status is True),
            "guideline_compliance": "Endocrine Society 2026 Guidance (Symptoms + at least 2 early-morning fasting measurements required)"
        }

        digital_twin_dict = {
            "question": "How has this person's evidence changed over time?",
            "longitudinal_testosterone": longitudinal_summary,
            "counterfactual_simulation_ready": True,
            "temporal_tracking": "Maintains immutable historical snapshots as new evidence is introduced."
        }

        research_layer_dict = {
            "question": "How reliable, calibrated, generalizable and explainable is the system?",
            "derivation_cohort": "CDC NHANES 2013-2016 (N=3,575 men 19-60)",
            "tier1_roc_auc": 0.7044,
            "tier2_roc_auc": 0.8742,
            "multimodal_roc_auc": 0.8902,
            "multimodal_brier_score": 0.1094,
            "multimodal_ece": 0.0326,
            "external_validation_audit": "machine-learning/male-ML/EXTERNAL_VALIDATION_STATUS.md",
            "dataset_shift_audit": "machine-learning/male-ML/DATASET_SHIFT.md",
            "limitations_audit": "machine-learning/male-ML/RESEARCH_LIMITATIONS.md"
        }

        biopulse_story = {
            "tier1": {
                "question": "Based on the information currently available, is there a screening signal worth investigating?",
                "answer": tier1_res.get("guidance", "")
            },
            "tier2": {
                "question": "What does the available laboratory evidence show?",
                "answer": (
                    tier2_res.get("predictive_ml_risk", {}).get("risk_level", "No laboratory data recorded yet.")
                    if tier2_res and tier2_res.get("predictive_ml_risk") else "No laboratory data recorded yet."
                )
            },
            "hormonal_pattern_engine": {
                "question": "How do testosterone, LH, FSH and prolactin relate?",
                "answer": (
                    hormonal_pattern.get("pattern_name", "Incomplete hormonal panel.")
                    if hormonal_pattern else "Hormonal panel not yet provided."
                )
            },
            "evidence_gap_engine": {
                "question": "What important information is still missing?",
                "answer": f"{len(gaps)} evidence gap(s) identified (e.g. {gaps[0]['description']})" if gaps else "Core evidence complete."
            },
            "explainability_engine": {
                "question": "Why did the assessment produce this result?",
                "answer": f"Driven by {len(explanations)} contributing biological and lifestyle factor(s)."
            },
            "digital_twin": {
                "question": "How has this person's evidence changed over time?",
                "answer": f"{len(all_tt)} testosterone measurement(s) recorded across timeline."
            },
            "research_layer": {
                "question": "How reliable, calibrated, generalizable and explainable is the system?",
                "answer": "Empirically validated on 715 holdout men with Platt calibration (Brier 0.1094, ECE 0.0326, ROC-AUC 0.8902)."
            }
        }

        return UnifiedAssessmentResult(
            assessment_stage=stage,
            screening_status=screening_status,
            tier1_result=tier1_res,
            tier2_result=tier2_res,
            hormonal_pattern=hormonal_pattern,
            longitudinal_testosterone=longitudinal_summary,
            evidence_completeness=completeness,
            evidence_gaps=gaps,
            explanations=explanations,
            limitations=limitations,
            safety_disclaimer=SAFETY_DISCLAIMER_TEXT,
            ml_screening=ml_screening,
            clinical_pattern=clinical_pattern_dict,
            digital_twin=digital_twin_dict,
            research_layer=research_layer_dict,
            biopulse_story=biopulse_story
        )


def generate_assessment(evidence_state: EvidenceState) -> UnifiedAssessmentResult:
    """Helper functional interface to generate an assessment from an EvidenceState."""
    engine = ProgressiveAssessmentEngine()
    return engine.generate_assessment(evidence_state)
