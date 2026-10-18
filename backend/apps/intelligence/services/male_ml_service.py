"""
backend/apps/intelligence/services/male_ml_service.py
Dedicated ML inference service for Male Hypogonadism Screening (Tier 1 & Tier 2).

Loads and caches serialized model artifacts from male-ML:
- Male Tier 1: Calibrated Logistic Regression (11 biometrics & symptom features, threshold: 0.1808)
- Male Tier 2: Calibrated Random Forest (16 indirect laboratory markers without leakage, threshold: 0.3379)
+ Rule-based Pituitary-Gonadal Hormone Pattern Evaluator (LH, FSH, Prolactin, Total Testosterone)
"""

from __future__ import annotations

import logging
import os
import threading
from typing import Any, Dict, List, Optional, Tuple

import joblib
import numpy as np
import pandas as pd
from django.conf import settings

logger = logging.getLogger(__name__)

_service_lock = threading.Lock()

# ---------------------------------------------------------------------------
# Feature Schemas (Preserving exact training feature order)
# ---------------------------------------------------------------------------

MALE_TIER1_FEATURE_NAMES = [
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
    "diabetes",
]

MALE_TIER1_7FEAT_FEATURE_NAMES = [
    "age",
    "height_cm",
    "weight_kg",
    "bmi",
    "waist_cm",
    "high_blood_pressure",
    "diabetes",
]

MALE_TIER2_FEATURE_NAMES = [
    "age",
    "shbg_nmol_l",
    "estradiol_pg_ml",
    "albumin_g_dl",
    "hba1c_pct",
    "glucose_mg_dl",
    "hemoglobin_g_dl",
    "hematocrit_pct",
    "rbc_count",
    "alt_u_l",
    "ast_u_l",
    "total_bilirubin_mg_dl",
    "creatinine_mg_dl",
    "bun_mg_dl",
    "uric_acid_mg_dl",
    "hdl_mg_dl",
]

# Standard feature aliases and friendly display names
MALE_TIER1_FEATURE_LABELS = {
    "age": "Age",
    "height_cm": "Height (cm)",
    "weight_kg": "Weight (kg)",
    "bmi": "Body Mass Index (BMI)",
    "waist_cm": "Waist Circumference (cm)",
    "low_energy": "Low Energy / Fatigue",
    "sleep_trouble": "Sleep Quality / Post-Dinner Sleepiness",
    "low_mood": "Mood Dips / Grumpiness",
    "low_interest": "Reduced Libido / Sex Drive",
    "high_blood_pressure": "Hypertension History",
    "diabetes": "Diabetes / Prediabetes History",
}

MALE_TIER2_FEATURE_LABELS = {
    "age": "Age",
    "shbg_nmol_l": "SHBG (Sex Hormone-Binding Globulin)",
    "estradiol_pg_ml": "Estradiol (E2)",
    "albumin_g_dl": "Serum Albumin",
    "hba1c_pct": "HbA1c (Glycated Hemoglobin)",
    "glucose_mg_dl": "Fasting / Random Glucose",
    "hemoglobin_g_dl": "Hemoglobin (Hb)",
    "hematocrit_pct": "Hematocrit (HCT)",
    "rbc_count": "Total RBC Count",
    "alt_u_l": "ALT (Alanine Aminotransferase)",
    "ast_u_l": "AST (Aspartate Aminotransferase)",
    "total_bilirubin_mg_dl": "Total Bilirubin",
    "creatinine_mg_dl": "Serum Creatinine",
    "bun_mg_dl": "Blood Urea Nitrogen (BUN)",
    "uric_acid_mg_dl": "Serum Uric Acid",
    "hdl_mg_dl": "HDL Cholesterol",
}

# Standard screening thresholds verified from metrics_report.json
MALE_TIER1_SCREENING_THRESHOLD = 0.1808
MALE_TIER1_CANDIDATE_SCREENING_THRESHOLD = 0.1799
MALE_TIER2_SCREENING_THRESHOLD = 0.3379
MALE_LOWER_RISK_THRESHOLD = 0.10


def classify_male_screening_risk(
    prob: float | None,
    threshold: float = MALE_TIER1_SCREENING_THRESHOLD,
    low_cutoff: float = MALE_LOWER_RISK_THRESHOLD,
) -> tuple[str, str]:
    """
    Authoritative classification of Male Hypogonadism screening risk.
    Returns (category, label).
    - Lower: prob < low_cutoff (p < 0.10)
    - Intermediate: low_cutoff <= prob < threshold (0.10 <= p < threshold)
    - Higher: prob >= threshold (p >= threshold)
    - Unavailable: prob is None or NaN
    """
    if prob is None:
        return ("unavailable", "Assessment Unavailable")
    try:
        fprob = float(prob)
        if np.isnan(fprob) or np.isneginf(fprob) or np.isposinf(fprob):
            return ("unavailable", "Assessment Unavailable")
    except (ValueError, TypeError):
        return ("unavailable", "Assessment Unavailable")

    if fprob >= threshold:
        return ("higher", "Higher Screening Risk")
    elif fprob >= low_cutoff:
        return ("intermediate", "Intermediate Screening Risk")
    return ("lower", "Lower Screening Risk")


DISCLAIMER_TEXT = (
    "This assessment is an AI-assisted screening estimate and does not diagnose hypogonadism. "
    "A qualified clinician and appropriate morning hormone testing are required for diagnosis."
)


def normalize_binary_input(val: Any) -> Optional[float]:
    """
    Safely normalizes binary model inputs into 1.0, 0.0, or None (if missing).
    Safely handles:
      - booleans: True -> 1.0, False -> 0.0
      - numbers: >0 -> 1.0, <=0 -> 0.0
      - strings: 'true', 'yes', '1', 'y', 't', 'positive' -> 1.0
                 'false', 'no', '0', 'n', 'f', 'negative' -> 0.0
      - missing: None, '', 'unknown', 'null', 'nan', 'undefined' -> None
    """
    if val is None:
        return None
    if isinstance(val, bool):
        return 1.0 if val else 0.0
    if isinstance(val, (int, float)):
        if np.isnan(val):
            return None
        return 1.0 if val > 0 else 0.0
    s = str(val).strip().lower()
    if s in ("", "none", "null", "nan", "unknown", "undefined"):
        return None
    if s in ("1", "1.0", "true", "yes", "y", "t", "positive"):
        return 1.0
    if s in ("0", "0.0", "false", "no", "n", "f", "negative"):
        return 0.0
    try:
        num = float(s)
        return 1.0 if num > 0 else 0.0
    except (ValueError, TypeError):
        return None


def normalize_continuous_input(val: Any) -> Optional[float]:
    """
    Safely parses continuous biometric inputs into float or None.
    """
    if val is None:
        return None
    if isinstance(val, (int, float)):
        return float(val) if not np.isnan(val) else None
    s = str(val).strip().lower()
    if s in ("", "none", "null", "nan", "unknown", "undefined"):
        return None
    try:
        return float(s)
    except (ValueError, TypeError):
        return None


class MaleMLService:
    """
    Thread-safe service for male hypogonadism screening model inference.
    """

    def __init__(self) -> None:
        self._tier1_artifact: Optional[Dict[str, Any]] = None
        self._tier2_artifact: Optional[Dict[str, Any]] = None
        self._t1_fold_explainer: Optional[Any] = None
        self._t2_fold_explainer: Optional[Any] = None
        self._is_ready: bool = False
        self._models_dir: str = ""

    def _resolve_paths(self) -> Tuple[str, str]:
        """Resolves absolute paths to male Tier 1 and Tier 2 joblib artifacts."""
        configured_dir = getattr(settings, "MALE_ML_ROOT_DIR", None)
        if configured_dir and os.path.isdir(configured_dir):
            base_dir = str(configured_dir)
        else:
            base_dir = os.path.abspath(
                os.path.join(settings.BASE_DIR, "..", "machine-learning", "male-ML")
            )

        self._models_dir = base_dir

        # Check server-side feature flag for verified clean 7-feature candidate
        use_7feat = getattr(settings, "ENABLE_MALE_TIER1_CLEAN_7FEAT", False)
        if use_7feat:
            staged_path = os.path.join(base_dir, "male_tier1", "artifacts", "male_tier1_7feat_candidate.joblib")
            exp_path = os.path.join(
                base_dir, "experiments", "male_tier1_7feat", "artifacts", "male_tier1_7feat_candidate.joblib"
            )
            if os.path.exists(staged_path):
                t1_path = staged_path
            elif os.path.exists(exp_path):
                t1_path = exp_path
            else:
                logger.warning("Clean 7-feature candidate requested but not found; falling back to legacy artifact.")
                t1_path = os.path.join(base_dir, "male_tier1", "artifacts", "male_low_t_model.joblib")
        else:
            t1_path = os.path.join(base_dir, "male_tier1", "artifacts", "male_low_t_model.joblib")

        t2_path = os.path.join(base_dir, "male_tier2", "artifacts", "male_tier2_model.joblib")
        return t1_path, t2_path

    def _init_shap_explainers(self) -> None:
        """Initializes fold-aware 5-fold ensemble SHAP explainers for Male Tier 1 and Tier 2."""
        try:
            from apps.intelligence.services.shap_adapter import FoldAwareCalibratedExplainer

            if self._tier1_artifact and "model" in self._tier1_artifact:
                t1_feat_names = self.tier1_feature_names
                model_ver = (
                    "Male-ML v2.0-T1-Clean7"
                    if len(t1_feat_names) == 7
                    else "Male-ML v1.0-T1"
                )
                self._t1_fold_explainer = FoldAwareCalibratedExplainer(
                    calibrated_model=self._tier1_artifact["model"],
                    model_name=self._tier1_artifact.get("model_name", "Logistic Regression (Balanced)"),
                    model_version=model_ver,
                    pathway="male_hypogonadism",
                    tier="tier_1",
                    explainer_type="LinearExplainer",
                    output_space="log_odds",
                    raw_feature_names=t1_feat_names,
                )
                self._t1_fold_explainer.initialize()

            if self._tier2_artifact and "model" in self._tier2_artifact:
                self._t2_fold_explainer = FoldAwareCalibratedExplainer(
                    calibrated_model=self._tier2_artifact["model"],
                    model_name=self._tier2_artifact.get("model_name", "Random Forest"),
                    model_version="Male-ML v1.0-T2",
                    pathway="male_hypogonadism",
                    tier="tier_1_2",
                    explainer_type="TreeExplainer",
                    output_space="raw",
                    raw_feature_names=MALE_TIER2_FEATURE_NAMES,
                )
                self._t2_fold_explainer.initialize()

            logger.info("Fold-aware SHAP explainers successfully initialized across all 5 folds for Male T1 and T2.")
        except Exception as e:
            logger.warning("Male SHAP explainer initialization deferred: %s", e)
            self._t1_fold_explainer = None
            self._t2_fold_explainer = None

    def load(self, force_reload: bool = False) -> None:
        """Loads male Tier 1 and Tier 2 models into memory."""
        t1_path, t2_path = self._resolve_paths()
        if self._is_ready and not force_reload and getattr(self, "_loaded_t1_path", None) == t1_path:
            return

        with _service_lock:
            t1_path, t2_path = self._resolve_paths()
            if self._is_ready and not force_reload and getattr(self, "_loaded_t1_path", None) == t1_path:
                return

            logger.info("Initializing Male-ML Assessment Engine from %s...", self._models_dir)

            if not os.path.exists(t1_path):
                raise FileNotFoundError(f"Male Tier 1 model artifact not found at: {t1_path}")
            if not os.path.exists(t2_path):
                raise FileNotFoundError(f"Male Tier 2 model artifact not found at: {t2_path}")

            try:
                import warnings
                try:
                    from sklearn.exceptions import InconsistentVersionWarning
                except ImportError:
                    InconsistentVersionWarning = UserWarning

                with warnings.catch_warnings():
                    warnings.simplefilter("ignore", InconsistentVersionWarning)
                    self._tier1_artifact = joblib.load(t1_path)
                    self._tier2_artifact = joblib.load(t2_path)
                
                self._loaded_t1_path = t1_path
                self._init_shap_explainers()
                self._is_ready = True
                logger.info("Male-ML Assessment Engine initialized successfully.")
            except Exception as e:
                logger.error("Failed to load Male-ML artifacts: %s", e)
                raise RuntimeError(f"Failed to load Male-ML artifacts: {e}") from e

    @property
    def is_ready(self) -> bool:
        return self._is_ready

    @property
    def tier1_pipeline(self) -> Any:
        if self._tier1_artifact is None:
            self.load()
        return self._tier1_artifact.get("model") if self._tier1_artifact else None

    @property
    def tier1_feature_names(self) -> List[str]:
        if self._tier1_artifact is None:
            self.load()
        if self._tier1_artifact and "feature_names" in self._tier1_artifact:
            return list(self._tier1_artifact["feature_names"])
        return list(MALE_TIER1_FEATURE_NAMES)

    @property
    def tier1_screening_threshold(self) -> float:
        if self._tier1_artifact is None:
            self.load()
        if self._tier1_artifact and "screening_threshold" in self._tier1_artifact:
            return float(self._tier1_artifact["screening_threshold"])
        return MALE_TIER1_SCREENING_THRESHOLD

    @property
    def tier2_pipeline(self) -> Any:
        if self._tier2_artifact is None:
            self.load()
        return self._tier2_artifact.get("model") if self._tier2_artifact else None

    # -----------------------------------------------------------------------
    # Tier 1 Inference (Questionnaire, Symptoms & Biometrics)
    # -----------------------------------------------------------------------

    def prepare_tier1_features(self, raw_inputs: Dict[str, Any]) -> Tuple[pd.DataFrame, List[str], List[str]]:
        """
        Extracts, converts, and validates Tier 1 feature vector.
        Missing values are preserved as np.nan for pipeline median imputation.
        """
        row: Dict[str, float] = {}
        available_features: List[str] = []
        missing_features: List[str] = []

        # Height & Weight for BMI calculation
        height_raw = raw_inputs.get("height_cm")
        weight_raw = raw_inputs.get("weight_kg")
        bmi_raw = raw_inputs.get("bmi")

        # Auto-compute BMI if height and weight are provided
        bmi_parsed = normalize_continuous_input(bmi_raw)
        if bmi_parsed is not None:
            bmi_val = bmi_parsed
        else:
            h_val = normalize_continuous_input(height_raw)
            w_val = normalize_continuous_input(weight_raw)
            if h_val and w_val and h_val > 0:
                h_m = h_val / 100.0
                bmi_val = round(w_val / (h_m ** 2), 2)
            else:
                bmi_val = np.nan

        BINARY_FEATURES = {
            "low_energy",
            "sleep_trouble",
            "low_mood",
            "low_interest",
            "high_blood_pressure",
            "diabetes",
        }

        active_feats = self.tier1_feature_names

        for feat in active_feats:
            if feat == "bmi":
                if not np.isnan(bmi_val):
                    row["bmi"] = float(bmi_val)
                    available_features.append(feat)
                else:
                    row["bmi"] = np.nan
                    missing_features.append(feat)
                continue

            val = raw_inputs.get(feat)
            if feat in BINARY_FEATURES:
                b_val = normalize_binary_input(val)
                if b_val is not None:
                    row[feat] = b_val
                    available_features.append(feat)
                else:
                    row[feat] = np.nan
                    missing_features.append(feat)
            else:
                c_val = normalize_continuous_input(val)
                if c_val is not None:
                    row[feat] = c_val
                    available_features.append(feat)
                else:
                    row[feat] = np.nan
                    missing_features.append(feat)

        df = pd.DataFrame([row])[active_feats]
        return df, available_features, missing_features

    def _generate_tier1_explanations(self, features_dict: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Derives directional factor explanations using model feature weights and clinical cutoffs.
        """
        explanations: List[Dict[str, Any]] = []

        waist = features_dict.get("waist_cm")
        if waist is not None and not np.isnan(waist):
            if waist >= 102.0:
                explanations.append({
                    "feature_key": "waist_cm",
                    "feature_name": "Waist Circumference",
                    "direction": "increases_risk",
                    "impact": "high",
                    "patient_summary": f"Waist circumference ({waist:.1f} cm >= 102 cm) is strongly associated with reduced testosterone production.",
                })
            elif waist >= 94.0:
                explanations.append({
                    "feature_key": "waist_cm",
                    "feature_name": "Waist Circumference",
                    "direction": "increases_risk",
                    "impact": "moderate",
                    "patient_summary": f"Borderline elevated waist circumference ({waist:.1f} cm) indicates mild visceral adiposity.",
                })
            elif waist < 94.0:
                explanations.append({
                    "feature_key": "waist_cm",
                    "feature_name": "Waist Circumference",
                    "direction": "decreases_risk",
                    "impact": "moderate",
                    "patient_summary": f"Healthy waist circumference ({waist:.1f} cm < 94 cm) supports optimal metabolic signaling.",
                })

        bmi = features_dict.get("bmi")
        if bmi is not None and not np.isnan(bmi):
            if bmi >= 30.0:
                explanations.append({
                    "feature_key": "bmi",
                    "feature_name": "Body Mass Index (BMI)",
                    "direction": "increases_risk",
                    "impact": "high",
                    "patient_summary": f"BMI ({bmi:.1f} kg/m²) in the obese range is a recognized contributor to functional hypogonadism.",
                })
            elif bmi >= 25.0:
                explanations.append({
                    "feature_key": "bmi",
                    "feature_name": "Body Mass Index (BMI)",
                    "direction": "increases_risk",
                    "impact": "moderate",
                    "patient_summary": f"BMI ({bmi:.1f} kg/m²) in the overweight range.",
                })

        if features_dict.get("diabetes") == 1.0:
            explanations.append({
                "feature_key": "diabetes",
                "feature_name": "Diabetes / Blood Sugar History",
                "direction": "increases_risk",
                "impact": "high",
                "patient_summary": "Type 2 diabetes or insulin resistance is a strong independent driver of secondary hypogonadism.",
            })

        if features_dict.get("high_blood_pressure") == 1.0:
            explanations.append({
                "feature_key": "high_blood_pressure",
                "feature_name": "Blood Pressure History",
                "direction": "increases_risk",
                "impact": "moderate",
                "patient_summary": "Hypertension indicates vascular and metabolic comorbidity.",
            })

        if features_dict.get("low_energy") == 1.0:
            explanations.append({
                "feature_key": "low_energy",
                "feature_name": "Energy Level",
                "direction": "increases_risk",
                "impact": "moderate",
                "patient_summary": "Persistent low energy or daytime fatigue is a core clinical symptom of androgen deficiency.",
            })

        if features_dict.get("low_interest") == 1.0:
            explanations.append({
                "feature_key": "low_interest",
                "feature_name": "Libido & Interest",
                "direction": "increases_risk",
                "impact": "moderate",
                "patient_summary": "Reported reduction in libido or sexual desire correlates with lower bioavailable testosterone.",
            })

        return explanations

    def predict_tier1(self, raw_inputs: Dict[str, Any]) -> Dict[str, Any]:
        """
        Executes calibrated Tier 1 Male Low Testosterone screening inference.
        """
        self.load()
        if self._tier1_artifact is None:
            raise RuntimeError("Male Tier 1 artifact not loaded.")

        df, available_feats, missing_feats = self.prepare_tier1_features(raw_inputs)
        model = self._tier1_artifact["model"]
        threshold = float(self._tier1_artifact.get("screening_threshold", self.tier1_screening_threshold))
        model_name = self._tier1_artifact.get("model_name", "Logistic Regression (Balanced)")
        is_7feat = len(self.tier1_feature_names) == 7
        default_ver = "Male-ML v2.0-T1-Clean7" if is_7feat else "Male-ML v1.0-T1"
        model_version = self._tier1_artifact.get("model_version", default_ver)

        # Check explicit eligibility rejection reason if passed
        rejection_reason = raw_inputs.get("eligibility_rejection_reason")
        rejection_summary = raw_inputs.get("eligibility_rejection_summary")

        # Validate age before inference (NHANES cohort 19 to 60)
        age_val = df.iloc[0].get("age")
        if rejection_reason or pd.isna(age_val) or age_val < 19.0 or age_val > 60.0:
            if rejection_reason:
                unavail_reason = rejection_reason
                reason_summary = rejection_summary or (
                    "Submitted age and date of birth conflict or are invalid."
                    if rejection_reason == "conflicting_age_and_dob"
                    else "Date of birth cannot be in the future."
                    if rejection_reason == "future_dob"
                    else "Please provide a valid date of birth."
                )
            elif pd.isna(age_val):
                reason_summary = "Age is required for male hypogonadism screening. Please provide your date of birth or age in your profile."
                unavail_reason = "missing_age"
            elif age_val < 19.0:
                reason_summary = "BioPulse AI screening models are calibrated for adult men aged 19 to 60. Adolescent androgen physiology requires specialized pediatric clinical evaluation."
                unavail_reason = "age_under_19"
            else:
                reason_summary = "BioPulse AI screening models are calibrated for adult men aged 19 to 60. In men older than 60, age-related endocrine changes require direct clinical evaluation with a physician."
                unavail_reason = "age_over_60"

            return {
                "module": "male_hypogonadism",
                "assessment_level": "tier_1",
                "tiers_included": [1],
                "model_name": model_name,
                "model_version": model_version,
                "probability": None,
                "probability_percent": None,
                "threshold": threshold,
                "risk_category": "unavailable",
                "risk_label": "Assessment Unavailable",
                "summary_text": reason_summary,
                "unavailable_reason": unavail_reason,
                "available_features": available_feats,
                "missing_features": missing_feats,
                "input_features": {k: (None if pd.isna(v) else v) for k, v in df.iloc[0].to_dict().items()},
                "explanations": [],
                "shap_explanation": None,
                "limitations": [
                    "This screening model was trained and evaluated on NHANES adult men aged 19 to 60.",
                    "Predictions cannot be reliably generated without a valid age within the supported 19–60 range.",
                ],
                "next_step": "Consult a healthcare provider for an individualized clinical hormone evaluation.",
                "disclaimer": DISCLAIMER_TEXT,
            }

        # Inference: calibrated probability for positive class (column 1)
        prob_matrix = model.predict_proba(df)
        prob = float(prob_matrix[0, 1])
        prob_percent = round(prob * 100.0, 1)

        # Risk categorization using validated screening threshold and lower cutoff
        risk_category, risk_label = classify_male_screening_risk(
            prob,
            threshold=threshold,
            low_cutoff=MALE_LOWER_RISK_THRESHOLD,
        )
        if risk_category == "higher":
            summary_text = "Your answers and health profile show factors that are sometimes associated with lower testosterone levels."
            next_step = "Add clinical laboratory evidence (e.g. morning fasting blood draw) to refine this assessment."
        elif risk_category == "intermediate":
            summary_text = "Your answers and health profile indicate an intermediate screening risk profile for testosterone deficiency."
            next_step = "Consider morning hormone testing or discussing clinical symptoms with a specialist."
        else:
            summary_text = "Your answers and health profile show a lower probability pattern for testosterone deficiency."
            next_step = "You can add clinical laboratory results anytime if symptoms arise."

        shap_payload = None
        if self._t1_fold_explainer is not None:
            shap_payload = self._t1_fold_explainer.explain(df, raw_inputs, final_calibrated_prob=prob)
            explanations = shap_payload["factors"]
        else:
            explanations = self._generate_tier1_explanations(df.iloc[0].to_dict())

        limitations = [
            "This Tier 1 assessment evaluates non-invasive lifestyle, demographic, and symptom parameters.",
            "It does not replace a morning laboratory blood draw.",
        ]

        is_missing_waist = is_7feat and ("waist_cm" in missing_feats or pd.isna(df.iloc[0].get("waist_cm")))
        is_complete = not is_missing_waist
        assessment_status = "incomplete" if is_missing_waist else "complete"
        notice = None

        if is_missing_waist:
            notice = (
                "Waist circumference was not provided. In the seven-feature model, waist circumference "
                "is a primary physical marker of visceral adiposity and endocrine balance. While a preliminary "
                "estimate was generated using baseline reference statistics, this assessment is incomplete. "
                "Please measure and provide your waist circumference for a fully calibrated assessment."
            )
            limitations.append(
                "Waist circumference was omitted; this assessment is incomplete and should not be relied upon until waist measurement is recorded."
            )

        if "high_blood_pressure" in missing_feats or "diabetes" in missing_feats:
            limitations.append(
                "Doctor-diagnosed hypertension or diabetes status was unknown or unanswered; clinical evaluation is recommended to clarify metabolic risk."
            )

        return {
            "module": "male_hypogonadism",
            "assessment_level": "tier_1",
            "tiers_included": [1],
            "model_name": model_name,
            "model_version": model_version,
            "probability": prob,
            "probability_percent": prob_percent,
            "threshold": threshold,
            "risk_category": risk_category,
            "risk_label": risk_label,
            "summary_text": summary_text,
            "is_complete": is_complete,
            "assessment_status": assessment_status,
            "notice": notice,
            "available_features": available_feats,
            "missing_features": missing_feats,
            "input_features": {k: (None if pd.isna(v) else v) for k, v in df.iloc[0].to_dict().items()},
            "explanations": explanations,
            "shap_explanation": shap_payload,
            "limitations": limitations,
            "next_step": next_step,
            "disclaimer": DISCLAIMER_TEXT,
        }

    # -----------------------------------------------------------------------
    # Tier 2 Inference (Indirect Laboratory Markers + Hormone Pattern Rules)
    # -----------------------------------------------------------------------

    def can_predict_tier2(self, lab_inputs: Optional[Dict[str, Any]]) -> bool:
        """
        Determines whether sufficient clinical/laboratory inputs exist to run male Tier 2 assessment.
        Returns True if at least one direct hormone marker or indirect laboratory marker is provided.
        """
        if not lab_inputs or not isinstance(lab_inputs, dict):
            return False
        candidate_fields = [
            "total_testosterone", "total_t", "lh", "fsh", "prolactin",
            "shbg_nmol_l", "estradiol_pg_ml", "albumin_g_dl", "hba1c_pct",
            "glucose_mg_dl", "hemoglobin_g_dl", "hematocrit_pct", "rbc_count",
            "alt_u_l", "ast_u_l", "total_bilirubin_mg_dl", "creatinine_mg_dl",
            "bun_mg_dl", "uric_acid_mg_dl", "hdl_mg_dl",
        ]
        for f in candidate_fields:
            val = lab_inputs.get(f)
            if val is not None and str(val).strip() != "":
                if not (isinstance(val, float) and np.isnan(val)):
                    try:
                        float(val)
                        return True
                    except (ValueError, TypeError):
                        pass
        return False

    def prepare_tier2_features(
        self,
        lab_inputs: Dict[str, Any],
        tier1_inputs: Optional[Dict[str, Any]] = None,
    ) -> Tuple[pd.DataFrame, List[str], List[str]]:
        """
        Constructs the 16-feature vector for Tier 2 Random Forest inference.
        Missing laboratory values are kept as np.nan for pipeline median imputation.
        """
        row: Dict[str, float] = {}
        available_features: List[str] = []
        missing_features: List[str] = []

        # Age is derived from Tier 1 or lab inputs (never fabricated or defaulted to 35)
        raw_age = (
            lab_inputs.get("age")
            if lab_inputs.get("age") is not None
            else (tier1_inputs.get("age") if tier1_inputs else None)
        )
        age_norm = normalize_continuous_input(raw_age)
        if age_norm is not None:
            row["age"] = age_norm
            available_features.append("age")
        else:
            row["age"] = np.nan
            missing_features.append("age")

        TIER2_ALIASES: Dict[str, List[str]] = {
            "creatinine_mg_dl": ["creatinine", "serum_creatinine"],
            "total_bilirubin_mg_dl": ["total_bilirubin", "bilirubin", "serum_bilirubin"],
            "uric_acid_mg_dl": ["uric_acid"],
            "hdl_mg_dl": ["hdl", "hdl_cholesterol", "hdl_cholesterol_mg_dl"],
            "bun_mg_dl": ["bun", "blood_urea_nitrogen"],
            "shbg_nmol_l": ["shbg", "shbg_nmol"],
            "estradiol_pg_ml": ["estradiol", "e2"],
            "albumin_g_dl": ["albumin", "serum_albumin"],
            "glucose_mg_dl": ["glucose", "fasting_glucose", "blood_glucose"],
            "hba1c_pct": ["hba1c", "a1c"],
            "hemoglobin_g_dl": ["hemoglobin", "hb"],
            "hematocrit_pct": ["hematocrit", "hct"],
            "rbc_count": ["rbc", "rbc_count_m_ul"],
            "alt_u_l": ["alt", "sgpt"],
            "ast_u_l": ["ast", "sgot"],
        }

        # Indirect laboratory features
        for feat in MALE_TIER2_FEATURE_NAMES:
            if feat == "age":
                continue

            val = lab_inputs.get(feat)
            if val is None or str(val).strip() == "":
                for alias in TIER2_ALIASES.get(feat, []):
                    alias_val = lab_inputs.get(alias)
                    if alias_val is not None and str(alias_val).strip() != "":
                        val = alias_val
                        break

            if val is None or str(val).strip() == "":
                row[feat] = np.nan
                missing_features.append(feat)
            else:
                try:
                    fval = float(val)
                    # Medically grounded unit conversions if provided in µmol/L
                    if feat == "creatinine_mg_dl":
                        c_unit = str(lab_inputs.get("creatinine_unit") or "").lower()
                        if "umol" in c_unit or "µmol" in c_unit or fval > 35.0:
                            fval = round(fval / 88.4, 2)
                    elif feat == "total_bilirubin_mg_dl":
                        b_unit = str(lab_inputs.get("bilirubin_unit") or "").lower()
                        if "umol" in b_unit or "µmol" in b_unit or fval > 30.0:
                            fval = round(fval / 17.1, 2)

                    row[feat] = fval
                    available_features.append(feat)
                except (ValueError, TypeError):
                    row[feat] = np.nan
                    missing_features.append(feat)

        df = pd.DataFrame([row])[MALE_TIER2_FEATURE_NAMES]
        return df, available_features, missing_features

    def evaluate_hormone_pattern(
        self,
        lab_inputs: Optional[Dict[str, Any]] = None,
        **kwargs: Any,
    ) -> Dict[str, Any]:
        """
        Deterministic, rule-based clinical hormone pattern evaluation using
        pituitary-gonadal signaling (LH, FSH, Prolactin, Total Testosterone).
        Does NOT classify; strictly provides pattern interpretation.
        """
        data: Dict[str, Any] = {}
        if lab_inputs and isinstance(lab_inputs, dict):
            data.update(lab_inputs)
        data.update(kwargs)

        def _get_float(k: str) -> Optional[float]:
            v = data.get(k)
            if v is None or str(v).strip() == "":
                return None
            try:
                return float(v)
            except (ValueError, TypeError):
                return None

        total_t = _get_float("total_testosterone") or _get_float("total_t") or _get_float("testosterone_total")
        t_unit = str(data.get("testosterone_unit") or data.get("testosteroneUnit") or "").strip().lower()
        if total_t is not None and t_unit in ("nmol/l", "nmol/l"):
            total_t = round(total_t * 28.842, 1)

        lh = _get_float("lh")
        fsh = _get_float("fsh")
        prolactin = _get_float("prolactin")

        # Default clinical reference thresholds
        TT_LOW = 300.0     # ng/dL
        LH_HIGH = 8.6      # mIU/mL
        FSH_HIGH = 12.4    # mIU/mL
        PRL_HIGH = 20.0    # ng/mL

        is_hypogonadal = False
        pattern_type = "EUGONADAL"
        pattern_name = "Standard Hormonal Pattern"
        pattern_description = "Hormone measurements are within typical reference expectations."
        pattern_code = "normal_pattern"

        if prolactin is not None and prolactin > PRL_HIGH:
            is_hypogonadal = (total_t is not None and total_t < TT_LOW)
            pattern_type = "SECONDARY_HYPERPROLACTINEMIC" if is_hypogonadal else "HYPERPROLACTINEMIA"
            pattern_name = "Elevated Prolactin Signaling"
            pattern_description = (
                "Prolactin is above typical reference limits. Elevated prolactin can suppress pituitary "
                "LH and FSH secretion, leading to downstream reductions in testosterone production."
            )
            pattern_code = "hyperprolactinemia_pattern"

        elif total_t is not None and total_t < TT_LOW:
            is_hypogonadal = True
            if (lh is not None and lh > LH_HIGH) or (fsh is not None and fsh > FSH_HIGH):
                pattern_type = "PRIMARY"
                pattern_name = "Elevated Pituitary Signal Pattern (Primary)"
                pattern_description = (
                    "Total testosterone is below standard reference range with elevated LH or FSH. "
                    "This pattern reflects elevated gonadotropin signaling in the presence of lower circulating testosterone."
                )
                pattern_code = "primary_pattern"
            elif lh is not None or fsh is not None:
                pattern_type = "SECONDARY"
                pattern_name = "Low or Inappropriately Normal Signal Pattern (Secondary)"
                pattern_description = (
                    "Total testosterone is below standard reference range with non-elevated LH and FSH. "
                    "This pattern suggests reduced pituitary/hypothalamic stimulation."
                )
                pattern_code = "secondary_pattern"
            else:
                pattern_type = "LOW_T_ISOLATED"
                pattern_name = "Low Testosterone Observation"
                pattern_description = (
                    "Reported total testosterone is below 300 ng/dL. Additional LH and FSH measurements "
                    "help your clinician determine the underlying signaling pathway."
                )
                pattern_code = "low_t_isolated"
        elif total_t is not None and total_t >= TT_LOW:
            is_hypogonadal = False
            pattern_type = "EUGONADAL"
            pattern_name = "Normal Testosterone Range"
            pattern_description = "Reported total testosterone is within standard eugonadal reference range (>= 300 ng/dL)."
            pattern_code = "normal_eugonadal"

        return {
            "is_hypogonadal": is_hypogonadal,
            "pattern_type": pattern_type,
            "pattern_name": pattern_name,
            "pattern_description": pattern_description,
            "pattern_code": pattern_code,
            "total_testosterone_recorded": total_t,
            "lh_recorded": lh,
            "fsh_recorded": fsh,
            "prolactin_recorded": prolactin,
        }

    def _generate_tier2_explanations(self, features_dict: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Derives clinical interpretations for available Tier 2 indirect laboratory markers.
        """
        explanations: List[Dict[str, Any]] = []

        shbg = features_dict.get("shbg_nmol_l")
        if shbg is not None and not np.isnan(shbg):
            if shbg < 20.0:
                explanations.append({
                    "feature_key": "shbg_nmol_l",
                    "feature_name": "SHBG (Carrier Protein)",
                    "direction": "increases_risk",
                    "impact": "high",
                    "patient_summary": f"Lower SHBG ({shbg:.1f} nmol/L < 20 nmol/L) often reflects metabolic syndrome and correlates with reduced total testosterone.",
                })
            elif shbg > 50.0:
                explanations.append({
                    "feature_key": "shbg_nmol_l",
                    "feature_name": "SHBG (Carrier Protein)",
                    "direction": "increases_risk",
                    "impact": "moderate",
                    "patient_summary": f"Elevated SHBG ({shbg:.1f} nmol/L) can bind more circulating testosterone, lowering the active free fraction.",
                })

        glucose = features_dict.get("glucose_mg_dl")
        if glucose is not None and not np.isnan(glucose) and glucose >= 100.0:
            explanations.append({
                "feature_key": "glucose_mg_dl",
                "feature_name": "Blood Glucose",
                "direction": "increases_risk",
                "impact": "moderate",
                "patient_summary": f"Elevated glucose ({glucose:.1f} mg/dL) indicates metabolic stress.",
            })

        hba1c = features_dict.get("hba1c_pct")
        if hba1c is not None and not np.isnan(hba1c) and hba1c >= 5.7:
            explanations.append({
                "feature_key": "hba1c_pct",
                "feature_name": "HbA1c",
                "direction": "increases_risk",
                "impact": "moderate",
                "patient_summary": f"HbA1c ({hba1c:.1f}%) in prediabetes or diabetes range.",
            })

        uric_acid = features_dict.get("uric_acid_mg_dl")
        if uric_acid is not None and not np.isnan(uric_acid) and uric_acid >= 7.0:
            explanations.append({
                "feature_key": "uric_acid_mg_dl",
                "feature_name": "Serum Uric Acid",
                "direction": "increases_risk",
                "impact": "low",
                "patient_summary": f"Elevated uric acid ({uric_acid:.1f} mg/dL) is an established marker of metabolic dysfunction.",
            })

        hdl = features_dict.get("hdl_mg_dl")
        if hdl is not None and not np.isnan(hdl) and hdl < 40.0:
            explanations.append({
                "feature_key": "hdl_mg_dl",
                "feature_name": "HDL (Good Cholesterol)",
                "direction": "increases_risk",
                "impact": "moderate",
                "patient_summary": f"Low protective HDL ({hdl:.1f} mg/dL < 40 mg/dL).",
            })

        return explanations

    def predict_tier2(
        self,
        lab_inputs: Dict[str, Any],
        tier1_inputs: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Executes calibrated Tier 2 Male Laboratory & Hormonal pattern screening inference.
        """
        self.load()
        if self._tier2_artifact is None:
            raise RuntimeError("Male Tier 2 artifact not loaded.")

        df, available_feats, missing_feats = self.prepare_tier2_features(lab_inputs, tier1_inputs)
        model = self._tier2_artifact["model"]
        threshold = float(self._tier2_artifact.get("screening_threshold", MALE_TIER2_SCREENING_THRESHOLD))
        model_name = self._tier2_artifact.get("model_name", "Random Forest")

        # Check explicit eligibility rejection reason if passed
        rejection_reason = (tier1_inputs or {}).get("eligibility_rejection_reason") or lab_inputs.get("eligibility_rejection_reason")
        rejection_summary = (tier1_inputs or {}).get("eligibility_rejection_summary") or lab_inputs.get("eligibility_rejection_summary")

        # Validate age before inference (NHANES cohort 19 to 60)
        age_val = df.iloc[0].get("age")
        if rejection_reason or pd.isna(age_val) or age_val < 19.0 or age_val > 60.0:
            if rejection_reason:
                unavail_reason = rejection_reason
                reason_summary = rejection_summary or (
                    "Submitted age and date of birth conflict or are invalid."
                    if rejection_reason == "conflicting_age_and_dob"
                    else "Date of birth cannot be in the future."
                    if rejection_reason == "future_dob"
                    else "Please provide a valid date of birth."
                )
            elif pd.isna(age_val):
                reason_summary = "Age is required for male hypogonadism screening. Please provide your date of birth or age."
                unavail_reason = "missing_age"
            elif age_val < 19.0:
                reason_summary = "BioPulse AI screening models are calibrated for adult men aged 19 to 60. Adolescent androgen physiology requires specialized pediatric clinical evaluation."
                unavail_reason = "age_under_19"
            else:
                reason_summary = "BioPulse AI screening models are calibrated for adult men aged 19 to 60. In men older than 60, age-related endocrine changes require direct clinical evaluation with a physician."
                unavail_reason = "age_over_60"

            hormone_pattern = self.evaluate_hormone_pattern(lab_inputs)

            # Direct lab interpretations
            direct_labs: List[Dict[str, Any]] = []
            for feat in available_feats:
                if feat == "age":
                    continue
                val = df.iloc[0][feat]
                direct_labs.append({
                    "analyte_key": feat,
                    "label": MALE_TIER2_FEATURE_LABELS.get(feat, feat),
                    "value": float(val),
                })

            evidence_completeness_pct = round((len(available_feats) / len(MALE_TIER2_FEATURE_NAMES)) * 100.0, 1)

            return {
                "module": "male_hypogonadism",
                "assessment_level": "tier_1_2",
                "tiers_included": [1, 2],
                "model_name": model_name,
                "model_version": "Male-ML v1.0-T2",
                "probability": None,
                "probability_percent": None,
                "threshold": threshold,
                "risk_category": "unavailable",
                "risk_label": "Assessment Unavailable",
                "summary_text": reason_summary,
                "unavailable_reason": unavail_reason,
                "available_features": available_feats,
                "missing_features": missing_feats,
                "tier_2_available_count": len(available_feats),
                "tier_2_total_count": len(MALE_TIER2_FEATURE_NAMES),
                "tier_2_available_fields": available_feats,
                "tier_2_missing_fields": missing_feats,
                "evidence_completeness_percent": evidence_completeness_pct,
                "evidence_completeness": {
                    "total_required": len(MALE_TIER2_FEATURE_NAMES),
                    "total_available": len(available_feats),
                    "missing": missing_feats,
                },
                "direct_laboratory_values": direct_labs,
                "hormone_pattern_interpretation": hormone_pattern,
                "explanations": [],
                "shap_explanation": None,
                "limitations": [
                    "This screening model was trained and evaluated on NHANES adult men aged 19 to 60.",
                    "Predictions cannot be reliably generated without a valid age within the supported 19–60 range.",
                ],
                "next_step": "Discuss your laboratory measurements directly with your physician.",
                "disclaimer": DISCLAIMER_TEXT,
            }

        # Check available indirect laboratory features (excluding age)
        indirect_available_feats = [f for f in available_feats if f != "age"]
        indirect_count = len(indirect_available_feats)
        indirect_total = len(MALE_TIER2_FEATURE_NAMES) - 1  # 15 indirect markers

        # Rule-based hormone pattern evaluation runs directly and independently
        hormone_pattern = self.evaluate_hormone_pattern(lab_inputs)

        is_complete = indirect_count == indirect_total
        assessment_status = "complete" if is_complete else ("partial" if indirect_count > 0 else "hormone_pattern_only")
        notice = None

        if indirect_count == 0:
            # Only direct hormone tests (e.g. Total T, LH, FSH, Prolactin) or vitals were provided.
            # No indirect metabolic features available for the Random Forest model.
            prob = None
            prob_percent = None
            risk_category = "direct_hormone_evaluation"
            risk_label = "Direct Hormone Pattern Evaluation"
            notice = (
                "Direct pituitary-gonadal hormone evaluation completed. Metabolic laboratory panel was not provided, "
                "so indirect biochemical model risk estimation was omitted."
            )
            shap_payload = None
            explanations = []
        else:
            # Inference: calibrated probability for positive class (column 1)
            prob_matrix = model.predict_proba(df)
            prob = float(prob_matrix[0, 1])
            prob_percent = round(prob * 100.0, 1)

            # Risk categorization using validated screening threshold and lower cutoff
            risk_category, risk_label = classify_male_screening_risk(
                prob,
                threshold=threshold,
                low_cutoff=MALE_LOWER_RISK_THRESHOLD,
            )

            if not is_complete:
                notice = (
                    f"Your laboratory profile contains {len(available_feats)} of {len(MALE_TIER2_FEATURE_NAMES)} model features "
                    f"({indirect_count} of {indirect_total} indirect metabolic markers). Missing parameters were estimated using "
                    f"baseline reference statistics for screening context. For a complete assessment, consider completing "
                    f"the remaining standard laboratory panels."
                )

            combined_patient_inputs = {**(tier1_inputs or {}), **lab_inputs}
            shap_payload = None
            if self._t2_fold_explainer is not None:
                shap_payload = self._t2_fold_explainer.explain(df, combined_patient_inputs, final_calibrated_prob=prob)
                explanations = shap_payload["factors"]
            else:
                explanations = self._generate_tier2_explanations(df.iloc[0].to_dict())

        # Clinical hormone pattern takes precedence in narrative summary
        if hormone_pattern.get("total_testosterone_recorded") is not None:
            tt_val = hormone_pattern["total_testosterone_recorded"]
            if hormone_pattern.get("is_hypogonadal"):
                summary_text = (
                    f"Direct hormone testing indicates lower circulating testosterone ({tt_val:.1f} ng/dL) "
                    f"with {hormone_pattern.get('pattern_name')}. "
                    f"{hormone_pattern.get('pattern_description')} "
                )
            else:
                summary_text = (
                    f"Direct hormone testing indicates total testosterone is within standard reference range "
                    f"({tt_val:.1f} ng/dL, >= 300 ng/dL). "
                    f"{hormone_pattern.get('pattern_description')} "
                )
            if prob is not None:
                summary_text += f"Indirect metabolic markers provide auxiliary screening context ({prob_percent}% likelihood profile)."
            next_step = "Discuss these morning fasting hormone results with your physician."
        elif prob is not None:
            if risk_category == "higher":
                summary_text = "Your laboratory and metabolic blood markers show a pattern that is frequently associated with lower testosterone."
                next_step = "Discuss these laboratory findings and morning fasting hormone levels with your physician."
            elif risk_category == "intermediate":
                summary_text = "Your laboratory and metabolic blood markers indicate an intermediate screening risk profile for androgen deficiency."
                next_step = "Continue monitoring your metabolic biomarkers and discuss with your physician."
            else:
                summary_text = "Your laboratory blood markers show a lower probability pattern for biochemical androgen deficiency."
                next_step = "Continue healthy lifestyle habits and periodic routine monitoring."
        else:
            summary_text = "Direct hormone testing was evaluated. Indirect metabolic markers were not provided."
            next_step = "Discuss your morning fasting laboratory results with your physician."

        # Direct lab interpretations
        direct_labs: List[Dict[str, Any]] = []
        for feat in available_feats:
            if feat == "age":
                continue
            val = df.iloc[0][feat]
            direct_labs.append({
                "analyte_key": feat,
                "label": MALE_TIER2_FEATURE_LABELS.get(feat, feat),
                "value": float(val),
            })

        evidence_completeness_pct = round((len(available_feats) / len(MALE_TIER2_FEATURE_NAMES)) * 100.0, 1)

        limitations = [
            "Total Testosterone and Free Testosterone were strictly excluded from the ML feature matrix to prevent data leakage.",
            f"Evaluated {len(available_feats)} of {len(MALE_TIER2_FEATURE_NAMES)} laboratory parameters; missing values were estimated using baseline reference statistics.",
            "This model provides an indirect metabolic-endocrine screening risk estimate.",
        ]

        return {
            "module": "male_hypogonadism",
            "assessment_level": "tier_1_2",
            "tiers_included": [1, 2],
            "model_name": model_name,
            "model_version": "Male-ML v1.0-T2",
            "probability": prob,
            "probability_percent": prob_percent,
            "threshold": threshold,
            "risk_category": risk_category,
            "risk_label": risk_label,
            "summary_text": summary_text,
            "is_complete": is_complete,
            "assessment_status": assessment_status,
            "notice": notice,
            "available_features": available_feats,
            "missing_features": missing_feats,
            "tier_2_available_count": len(available_feats),
            "tier_2_total_count": len(MALE_TIER2_FEATURE_NAMES),
            "tier_2_available_fields": available_feats,
            "tier_2_missing_fields": missing_feats,
            "evidence_completeness_percent": evidence_completeness_pct,
            "evidence_completeness": {
                "available": len(available_feats),
                "total": len(MALE_TIER2_FEATURE_NAMES),
                "percentage": evidence_completeness_pct,
            },
            "input_features": {k: (None if pd.isna(v) else v) for k, v in df.iloc[0].to_dict().items()},
            "tier_2_inputs": lab_inputs,
            "hormone_pattern_interpretation": hormone_pattern,
            "direct_laboratory_values": direct_labs,
            "explanations": explanations,
            "shap_explanation": shap_payload,
            "limitations": limitations,
            "next_step": next_step,
            "disclaimer": DISCLAIMER_TEXT,
        }


male_ml_service = MaleMLService()
