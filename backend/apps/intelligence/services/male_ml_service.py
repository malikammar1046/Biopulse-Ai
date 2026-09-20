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
MALE_TIER2_SCREENING_THRESHOLD = 0.3379

DISCLAIMER_TEXT = (
    "This assessment is an AI-assisted screening estimate and does not diagnose hypogonadism. "
    "A qualified clinician and appropriate morning hormone testing are required for diagnosis."
)


class MaleMLService:
    """
    Thread-safe service for male hypogonadism screening model inference.
    """

    def __init__(self) -> None:
        self._tier1_artifact: Optional[Dict[str, Any]] = None
        self._tier2_artifact: Optional[Dict[str, Any]] = None
        self._is_ready: bool = False
        self._models_dir: str = ""

    def _resolve_paths(self) -> Tuple[str, str]:
        """Resolves absolute paths to male Tier 1 and Tier 2 joblib artifacts."""
        configured_dir = getattr(settings, "MALE_ML_ROOT_DIR", None)
        if configured_dir and os.path.isdir(configured_dir):
            base_dir = configured_dir
        else:
            base_dir = os.path.abspath(
                os.path.join(settings.BASE_DIR, "..", "machine-learning", "male-ML")
            )

        self._models_dir = base_dir
        t1_path = os.path.join(base_dir, "male_tier1", "artifacts", "male_low_t_model.joblib")
        t2_path = os.path.join(base_dir, "male_tier2", "artifacts", "male_tier2_model.joblib")
        return t1_path, t2_path

    def load(self) -> None:
        """Loads male Tier 1 and Tier 2 models once into memory."""
        if self._is_ready:
            return

        with _service_lock:
            if self._is_ready:
                return

            t1_path, t2_path = self._resolve_paths()
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
        if bmi_raw is not None and str(bmi_raw).strip() != "":
            try:
                bmi_val = float(bmi_raw)
            except (ValueError, TypeError):
                bmi_val = np.nan
        elif height_raw and weight_raw:
            try:
                h_m = float(height_raw) / 100.0
                w_kg = float(weight_raw)
                bmi_val = w_kg / (h_m ** 2) if h_m > 0 else np.nan
            except (ValueError, TypeError, ZeroDivisionError):
                bmi_val = np.nan
        else:
            bmi_val = np.nan

        for feat in MALE_TIER1_FEATURE_NAMES:
            if feat == "bmi":
                if not np.isnan(bmi_val):
                    row["bmi"] = float(bmi_val)
                    available_features.append(feat)
                else:
                    row["bmi"] = np.nan
                    missing_features.append(feat)
                continue

            val = raw_inputs.get(feat)
            if val is None or str(val).strip() == "":
                row[feat] = np.nan
                missing_features.append(feat)
            else:
                try:
                    num_val = float(val)
                    # For binary flags, normalize to 0.0 or 1.0
                    if feat in ["low_energy", "sleep_trouble", "low_mood", "low_interest", "high_blood_pressure", "diabetes"]:
                        num_val = 1.0 if num_val > 0 else 0.0
                    row[feat] = num_val
                    available_features.append(feat)
                except (ValueError, TypeError):
                    row[feat] = np.nan
                    missing_features.append(feat)

        df = pd.DataFrame([row])[MALE_TIER1_FEATURE_NAMES]
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
        threshold = float(self._tier1_artifact.get("screening_threshold", MALE_TIER1_SCREENING_THRESHOLD))
        model_name = self._tier1_artifact.get("model_name", "Logistic Regression (Balanced)")

        # Inference: calibrated probability for positive class (column 1)
        prob_matrix = model.predict_proba(df)
        prob = float(prob_matrix[0, 1])
        prob_percent = round(prob * 100.0, 1)

        # Risk categorization using validated screening threshold
        if prob >= threshold:
            risk_category = "higher"
            risk_label = "Higher Screening Risk"
            summary_text = "Your answers and health profile show factors that are sometimes associated with lower testosterone levels."
            next_step = "Add clinical laboratory evidence (e.g. morning fasting blood draw) to refine this assessment."
        else:
            risk_category = "lower"
            risk_label = "Lower Screening Risk"
            summary_text = "Your answers and health profile show a lower probability pattern for testosterone deficiency."
            next_step = "You can add clinical laboratory results anytime if symptoms arise."

        explanations = self._generate_tier1_explanations(df.iloc[0].to_dict())

        limitations = [
            "This Tier 1 assessment evaluates non-invasive lifestyle, demographic, and symptom parameters.",
            "It does not replace a morning laboratory blood draw.",
        ]

        return {
            "module": "male_hypogonadism",
            "assessment_level": "tier_1",
            "tiers_included": [1],
            "model_name": model_name,
            "model_version": "Male-ML v1.0-T1",
            "probability": prob,
            "probability_percent": prob_percent,
            "threshold": threshold,
            "risk_category": risk_category,
            "risk_label": risk_label,
            "summary_text": summary_text,
            "available_features": available_feats,
            "missing_features": missing_feats,
            "input_features": {k: (None if pd.isna(v) else v) for k, v in df.iloc[0].to_dict().items()},
            "explanations": explanations,
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

        # Age is derived from Tier 1 or lab inputs
        age_val = (
            lab_inputs.get("age")
            or (tier1_inputs.get("age") if tier1_inputs else None)
            or 35.0
        )
        try:
            row["age"] = float(age_val)
            available_features.append("age")
        except (ValueError, TypeError):
            row["age"] = 35.0
            missing_features.append("age")

        # Indirect laboratory features
        for feat in MALE_TIER2_FEATURE_NAMES:
            if feat == "age":
                continue

            val = lab_inputs.get(feat)
            if val is None or str(val).strip() == "":
                row[feat] = np.nan
                missing_features.append(feat)
            else:
                try:
                    row[feat] = float(val)
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

        total_t = _get_float("total_testosterone") or _get_float("total_t")
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
                    "This pattern suggests the brain is sending strong signals to stimulate testosterone production."
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

        # Inference: calibrated probability for positive class (column 1)
        prob_matrix = model.predict_proba(df)
        prob = float(prob_matrix[0, 1])
        prob_percent = round(prob * 100.0, 1)

        # Risk categorization using validated screening threshold
        if prob >= threshold:
            risk_category = "higher"
            risk_label = "Higher Screening Risk"
            summary_text = "Your laboratory and metabolic blood markers show a pattern that is frequently associated with lower testosterone."
            next_step = "Discuss these laboratory findings and morning fasting hormone levels with your physician."
        else:
            risk_category = "lower"
            risk_label = "Lower Screening Risk"
            summary_text = "Your laboratory blood markers show a lower probability pattern for biochemical androgen deficiency."
            next_step = "Continue healthy lifestyle habits and periodic routine monitoring."

        # Rule-based hormone pattern evaluation
        hormone_pattern = self.evaluate_hormone_pattern(lab_inputs)
        explanations = self._generate_tier2_explanations(df.iloc[0].to_dict())

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
            "limitations": limitations,
            "next_step": next_step,
            "disclaimer": DISCLAIMER_TEXT,
        }


male_ml_service = MaleMLService()
