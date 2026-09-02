"""
OvaSense — ML Bridge Adapter for Authoritative Ovasense-ML Model.

Connects the OvaSense application to the real trained Extra Trees Joblib model:
  Artifact:      Ovasense-ML/models/ovasense_final_model.joblib
  Config:        Ovasense-ML/models/ovasense_model_config.json
  Classifier:    ExtraTreesClassifier (150 trees, balanced_subsample, max_depth=7)
  Threshold:     0.38 (Screening-tuned for >=85% sensitivity)
  Classes:       0 (Non-PCOS / Lower Risk), 1 (PCOS / Higher Risk)

Thread safety:
  The model is loaded lazily once and reused across requests.
"""

from __future__ import annotations

import json
import logging
import os
import sys
import threading
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd
import shap
from django.conf import settings

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Artifact Paths & Model Config
# ---------------------------------------------------------------------------

# Safe path resolution compatible both inside Django and in standalone scripts
try:
    from django.conf import settings
    if settings.configured:
        REPO_ROOT = getattr(settings, "REPO_ROOT", Path(__file__).resolve().parent.parent.parent.parent.parent)
    else:
        REPO_ROOT = Path(__file__).resolve().parent.parent.parent.parent.parent
except Exception:
    REPO_ROOT = Path(__file__).resolve().parent.parent.parent.parent.parent

OVASENSE_ML_DIR = REPO_ROOT / "Ovasense-ML"
DEFAULT_MODEL_PATH = OVASENSE_ML_DIR / "models" / "ovasense_final_model.joblib"
DEFAULT_CONFIG_PATH = OVASENSE_ML_DIR / "models" / "ovasense_model_config.json"

SCREENING_THRESHOLD = 0.38
LOWER_RISK_CUTOFF = 0.20

MEDICAL_DISCLAIMER = (
    "CRITICAL: OvaSense provides an AI-based risk screening estimate based on non-invasive questionnaires "
    "and does NOT diagnose PCOS. It does not replace formal clinical ultrasound or biochemical evaluation. "
    "Please consult a qualified healthcare professional for medical advice."
)

RISK_CATEGORY_DESCRIPTIONS = {
    "lower_risk": (
        "Your recorded health patterns currently indicate a lower screening risk profile based on available information."
    ),
    "intermediate_risk": (
        "Your recorded health patterns indicate an intermediate screening risk profile. Continued tracking and healthy habits are recommended."
    ),
    "higher_risk": (
        "Your recorded health patterns cross the screening risk threshold (>= 38%). We recommend discussing these findings with your healthcare provider for formal clinical evaluation."
    ),
    "insufficient_data": (
        "There is not enough logged health information to generate a reliable screening assessment. Please complete your profile and log your cycle."
    ),
}

# The exact 16 raw column names expected by the trained pipeline
RAW_FEATURE_NAMES = [
    " Age (yrs)",
    "Weight (Kg)",
    "Height(Cm) ",
    "BMI",
    "Cycle(R/I)",
    "Cycle length(days)",
    "Marraige Status (Yrs)",
    "Pregnant(Y/N)",
    "No. of aborptions",
    "Weight gain(Y/N)",
    "hair growth(Y/N)",
    "Skin darkening (Y/N)",
    "Hair loss(Y/N)",
    "Pimples(Y/N)",
    "Fast food (Y/N)",
    "Reg.Exercise(Y/N)",
]

# Human-friendly metadata mapping for clinical explanations
FEATURE_METADATA: dict[str, dict[str, str]] = {
    " Age (yrs)": {
        "human_label": "Age",
        "increases_risk": "Age profile was a contributing factor in the model's risk evaluation.",
        "decreases_risk": "Age profile contributed toward a lower risk estimate.",
    },
    "Weight (Kg)": {
        "human_label": "Body Weight",
        "increases_risk": "Recorded body weight contributed toward the model's risk evaluation.",
        "decreases_risk": "Recorded body weight contributed toward a lower risk estimate.",
    },
    "Height(Cm) ": {
        "human_label": "Height",
        "increases_risk": "Height measurement considered in baseline anthropometric ratios.",
        "decreases_risk": "Height measurement contributed to baseline anthropometric ratios.",
    },
    "BMI": {
        "human_label": "Body Mass Index (BMI)",
        "increases_risk": "Calculated BMI contributed toward the model's elevated risk estimate.",
        "decreases_risk": "Calculated BMI fell within a range associated with lower screening risk.",
    },
    "Cycle length(days)": {
        "human_label": "Cycle Length",
        "increases_risk": "Cycle length duration was noted as a contributing risk indicator.",
        "decreases_risk": "Typical cycle length contributed toward a lower risk estimate.",
    },
    "Marraige Status (Yrs)": {
        "human_label": "Marriage Duration",
        "increases_risk": "Reproductive timeline factor considered by the model.",
        "decreases_risk": "Reproductive timeline factor contributed toward a baseline estimate.",
    },
    "No. of aborptions": {
        "human_label": "Prior Pregnancy Loss History",
        "increases_risk": "Obstetric history factor considered in the risk estimate.",
        "decreases_risk": "Obstetric history contributed toward a baseline estimate.",
    },
    "Pregnant(Y/N)": {
        "human_label": "Current Pregnancy Status",
        "increases_risk": "Pregnancy status was evaluated as a physiological context factor.",
        "decreases_risk": "Pregnancy status contributed toward the baseline model estimate.",
    },
    "Weight gain(Y/N)": {
        "human_label": "Recent Weight Changes",
        "increases_risk": "Reported recent unexplained weight gain contributed toward the risk estimate.",
        "decreases_risk": "Absence of rapid weight fluctuations contributed toward a lower risk estimate.",
    },
    "hair growth(Y/N)": {
        "human_label": "Excess Facial / Body Hair (Hirsutism)",
        "increases_risk": "Reported unwanted or coarse hair growth was a key factor contributing to elevated risk.",
        "decreases_risk": "Absence of excess hair growth contributed positively toward a lower risk profile.",
    },
    "Skin darkening (Y/N)": {
        "human_label": "Skin Darkening (Acanthosis Nigricans)",
        "increases_risk": "Reported skin hyperpigmentation contributed toward the model's risk estimate.",
        "decreases_risk": "Absence of skin hyperpigmentation contributed toward a lower risk estimate.",
    },
    "Hair loss(Y/N)": {
        "human_label": "Hair Thinning / Loss (Alopecia)",
        "increases_risk": "Reported hair shedding or crown thinning was noted as a contributing factor.",
        "decreases_risk": "Absence of hair thinning contributed toward a lower risk profile.",
    },
    "Pimples(Y/N)": {
        "human_label": "Acne & Skin Breakouts",
        "increases_risk": "Reported persistent facial acne contributed toward the model's risk estimate.",
        "decreases_risk": "Clear skin / absence of moderate-to-severe acne contributed toward lower risk.",
    },
    "Fast food (Y/N)": {
        "human_label": "Dietary Habits (Processed Food)",
        "increases_risk": "Dietary patterns involving frequent fast food contributed toward the risk estimate.",
        "decreases_risk": "Healthier dietary patterns contributed toward a lower metabolic risk estimate.",
    },
    "Reg.Exercise(Y/N)": {
        "human_label": "Regular Physical Exercise",
        "increases_risk": "Lower physical activity level was considered in metabolic risk assessment.",
        "decreases_risk": "Consistent physical exercise habits acted as a protective factor.",
    },
    "Cycle(R/I)": {
        "human_label": "Menstrual Cycle Regularity",
        "increases_risk": "Irregular or unpredictable menstrual cycles were a strong driver of elevated risk.",
        "decreases_risk": "Regular, predictable menstrual cycles were a strong indicator of lower screening risk.",
    },
}


class ModelNotReadyError(Exception):
    """Raised when the Ovasense-ML model artifact cannot be found or loaded."""


# ---------------------------------------------------------------------------
# Data Quality & Extraction Container
# ---------------------------------------------------------------------------

@dataclass
class DataQualityReport:
    completeness_percentage: float
    quality_level: str  # "good" | "limited" | "insufficient_data"
    missing_features: list[str] = field(default_factory=list)
    available_features: list[str] = field(default_factory=list)
    feature_details: list[dict[str, Any]] = field(default_factory=list)
    cycle_records_count: int = 0
    symptom_records_count: int = 0

    def to_dict(self) -> dict[str, Any]:
        return {
            "completeness_percentage": round(self.completeness_percentage, 1),
            "quality_level": self.quality_level,
            "missing_features": self.missing_features,
            "available_features": self.available_features,
            "feature_details": self.feature_details,
            "cycle_records_count": self.cycle_records_count,
            "symptom_records_count": self.symptom_records_count,
        }


# ---------------------------------------------------------------------------
# Singleton ML Bridge
# ---------------------------------------------------------------------------

class OvaSenseMLBridge:
    """
    Singleton bridge to the authoritative Ovasense-ML Joblib model.
    Provides feature mapping, inference, threshold classification, and TreeSHAP.
    """

    def __init__(self, model_path: Path | None = None, config_path: Path | None = None):
        self.model_path = model_path or DEFAULT_MODEL_PATH
        self.config_path = config_path or DEFAULT_CONFIG_PATH
        self._model = None
        self._config: dict[str, Any] = {}
        self._explainer = None
        self._lock = threading.Lock()
        self._loaded = False

    def load(self) -> None:
        """Loads the serialized Pipeline from disk lazily once."""
        if self._loaded:
            return

        with self._lock:
            if self._loaded:
                return

            # Ensure Ovasense-ML root is on sys.path for custom transformers unpickling
            ml_dir = str(OVASENSE_ML_DIR)
            if ml_dir not in sys.path:
                sys.path.insert(0, ml_dir)

            if not self.model_path.exists():
                raise ModelNotReadyError(
                    f"Authoritative model artifact not found at {self.model_path}."
                )

            try:
                self._model = joblib.load(self.model_path)
                logger.info("Loaded Ovasense-ML model from %s", self.model_path)
            except Exception as exc:
                logger.error("Failed to load Ovasense-ML model: %s", exc, exc_info=True)
                raise ModelNotReadyError(f"Failed to unpickle model: {exc}") from exc

            if self.config_path.exists():
                try:
                    with open(self.config_path, encoding="utf-8") as f:
                        self._config = json.load(f)
                except Exception as exc:
                    logger.warning("Could not load model config: %s", exc)

            # Initialize TreeSHAP on the ExtraTreesClassifier step
            try:
                classifier = self._model.named_steps["classifier"]
                self._explainer = shap.TreeExplainer(classifier)
                logger.info("Initialized TreeSHAP explainer for ExtraTreesClassifier")
            except Exception as exc:
                logger.warning("Could not initialize TreeSHAP: %s", exc)
                self._explainer = None

            self._loaded = True

    @property
    def is_ready(self) -> bool:
        try:
            self.load()
            return True
        except ModelNotReadyError:
            return False

    @property
    def metadata(self) -> dict[str, Any]:
        self.load()
        return {
            "model_name": self._config.get("model_name", "OvaSense Extra Trees (Screening Tuned)"),
            "model_version": self._config.get("model_version", "1.0.0-phase3"),
            "artifact": self.model_path.name,
            "framework": "scikit-learn",
            "classifier": "ExtraTreesClassifier",
            "feature_count": len(RAW_FEATURE_NAMES),
            "screening_threshold": SCREENING_THRESHOLD,
            "training_samples": self._config.get("training_metadata", {}).get("training_samples", 432),
            "clinical_safety_warning": self._config.get("clinical_safety_warning", MEDICAL_DISCLAIMER),
        }

    # ------------------------------------------------------------------
    # Feature Extraction (PatientHealthData -> 16-feature DataFrame)
    # ------------------------------------------------------------------

    def extract_features(self, health_data: Any) -> tuple[pd.DataFrame, DataQualityReport]:
        """
        Maps patient health records into the exact 16-feature DataFrame required by the model.
        Missing values are kept as np.nan so the pipeline's SimpleImputer handles them.
        """
        profile = health_data.profile
        cycle_records = health_data.cycle_records
        symptom_records = health_data.symptom_records
        fitness_logs = health_data.fitness_logs
        food_logs = health_data.food_logs

        raw_dict: dict[str, Any] = {}
        # 1. Age (yrs)
        if profile.date_of_birth:
            dob_str = str(profile.date_of_birth).strip()
            if dob_str.replace(".", "", 1).isdigit():
                try:
                    val = float(dob_str)
                    raw_dict[" Age (yrs)"] = val if (10 <= val <= 100) else np.nan
                except Exception:
                    raw_dict[" Age (yrs)"] = np.nan
            else:
                try:
                    dob = datetime.strptime(dob_str[:10], "%Y-%m-%d").replace(tzinfo=timezone.utc)
                    age = (datetime.now(timezone.utc) - dob).days / 365.25
                    raw_dict[" Age (yrs)"] = round(float(age), 1) if age > 0 else np.nan
                except Exception:
                    raw_dict[" Age (yrs)"] = np.nan
        else:
            raw_dict[" Age (yrs)"] = np.nan

        # 2. Weight (Kg)
        if profile.weight_kg is not None and float(profile.weight_kg) > 0:
            raw_dict["Weight (Kg)"] = float(profile.weight_kg)
        else:
            raw_dict["Weight (Kg)"] = np.nan

        # 3. Height(Cm)
        if profile.height_cm is not None and float(profile.height_cm) > 0:
            raw_dict["Height(Cm) "] = float(profile.height_cm)
        else:
            raw_dict["Height(Cm) "] = np.nan

        # 4. BMI
        if not np.isnan(raw_dict.get("Weight (Kg)", np.nan)) and not np.isnan(raw_dict.get("Height(Cm) ", np.nan)):
            h_m = raw_dict["Height(Cm) "] / 100.0
            raw_dict["BMI"] = round(raw_dict["Weight (Kg)"] / (h_m ** 2), 1)
        else:
            raw_dict["BMI"] = np.nan

        # 5. Cycle(R/I) (2 = Regular, 4 = Irregular)
        cycle_ri = np.nan
        if profile.period_regularity:
            reg = str(profile.period_regularity).lower()
            if "irregular" in reg or reg in ("sometimes_irregular", "often_irregular", "very_irregular"):
                cycle_ri = 4.0
            elif reg in ("regular", "very_regular", "mostly_regular"):
                cycle_ri = 2.0

        if np.isnan(cycle_ri) and len(cycle_records) >= 2:
            try:
                sorted_starts = sorted([
                    datetime.strptime(r.period_start_date[:10], "%Y-%m-%d")
                    for r in cycle_records if r.period_start_date
                ])
                diffs = [(sorted_starts[i] - sorted_starts[i - 1]).days for i in range(1, len(sorted_starts))]
                if diffs:
                    std_dev = np.std(diffs)
                    cycle_ri = 4.0 if (std_dev > 7 or any(d < 21 or d > 35 for d in diffs)) else 2.0
            except Exception:
                pass

        raw_dict["Cycle(R/I)"] = cycle_ri

        # 6. Cycle length(days)
        cycle_len = np.nan
        if profile.cycle_length and str(profile.cycle_length).isdigit():
            cycle_len = float(profile.cycle_length)
        elif len(cycle_records) >= 2:
            try:
                sorted_starts = sorted([
                    datetime.strptime(r.period_start_date[:10], "%Y-%m-%d")
                    for r in cycle_records if r.period_start_date
                ])
                diffs = [(sorted_starts[i] - sorted_starts[i - 1]).days for i in range(1, len(sorted_starts))]
                valid_diffs = [d for d in diffs if 10 < d < 120]
                if valid_diffs:
                    cycle_len = float(np.mean(valid_diffs))
            except Exception:
                pass

        raw_dict["Cycle length(days)"] = cycle_len

        # 7. Marriage Status (Yrs)
        if getattr(profile, "marriage_years", None) is not None:
            try:
                raw_dict["Marraige Status (Yrs)"] = float(profile.marriage_years)
            except Exception:
                raw_dict["Marraige Status (Yrs)"] = 0.0
        elif getattr(profile, "marital_status", None):
            ms = str(profile.marital_status).lower()
            raw_dict["Marraige Status (Yrs)"] = 0.0 if ("single" in ms or "unmarried" in ms) else 1.0
        else:
            raw_dict["Marraige Status (Yrs)"] = np.nan

        # 8. Pregnant(Y/N)
        if getattr(profile, "is_pregnant", None) is not None:
            raw_dict["Pregnant(Y/N)"] = 1.0 if profile.is_pregnant else 0.0
        else:
            raw_dict["Pregnant(Y/N)"] = np.nan

        # 9. No. of abortions
        if getattr(profile, "abortions_count", None) is not None:
            try:
                raw_dict["No. of aborptions"] = float(profile.abortions_count)
            except Exception:
                raw_dict["No. of aborptions"] = 0.0
        else:
            raw_dict["No. of aborptions"] = np.nan

        # 10–14. Symptom Features (Weight gain, hair growth, skin darkening, hair loss, pimples)
        common_symptoms = [str(s).lower() for s in (profile.common_symptoms or [])]
        logged_symptom_types = [str(s.symptom_type).lower() for s in symptom_records if s.symptom_type]
        all_symptom_tags = set(common_symptoms + logged_symptom_types)
        has_symptom_history = bool(profile.common_symptoms is not None and len(profile.common_symptoms) > 0 or symptom_records)

        # Weight gain(Y/N)
        if any(k in s for s in all_symptom_tags for k in ("weight", "weight_gain", "bloating", "gain")):
            raw_dict["Weight gain(Y/N)"] = 1.0
        elif has_symptom_history:
            raw_dict["Weight gain(Y/N)"] = 0.0
        else:
            raw_dict["Weight gain(Y/N)"] = np.nan

        # hair growth(Y/N) (Hirsutism)
        if any(k in s for s in all_symptom_tags for k in ("hirsutism", "unwanted_hair", "facial", "chin", "body hair", "hair growth")):
            raw_dict["hair growth(Y/N)"] = 1.0
        elif has_symptom_history:
            raw_dict["hair growth(Y/N)"] = 0.0
        else:
            raw_dict["hair growth(Y/N)"] = np.nan

        # Skin darkening(Y/N) (Acanthosis nigricans)
        if any(k in s for s in all_symptom_tags for k in ("skin_darkening", "acanthosis", "darkening", "neck", "pigmentation")):
            raw_dict["Skin darkening (Y/N)"] = 1.0
        elif has_symptom_history:
            raw_dict["Skin darkening (Y/N)"] = 0.0
        else:
            raw_dict["Skin darkening (Y/N)"] = np.nan

        # Hair loss(Y/N) (Alopecia)
        if any(k in s for s in all_symptom_tags for k in ("hair_thinning", "hair_loss", "alopecia", "hair fall", "thinning", "shedding")):
            raw_dict["Hair loss(Y/N)"] = 1.0
        elif has_symptom_history:
            raw_dict["Hair loss(Y/N)"] = 0.0
        else:
            raw_dict["Hair loss(Y/N)"] = np.nan

        # Pimples(Y/N) (Acne)
        if any(k in s for s in all_symptom_tags for k in ("acne", "cystic_acne", "pimples", "breakout", "flare", "zits", "spot")):
            raw_dict["Pimples(Y/N)"] = 1.0
        elif has_symptom_history:
            raw_dict["Pimples(Y/N)"] = 0.0
        else:
            raw_dict["Pimples(Y/N)"] = np.nan

        # 15. Fast food (Y/N)
        if getattr(profile, "fast_food_intake", None):
            ffi = str(profile.fast_food_intake).lower()
            raw_dict["Fast food (Y/N)"] = 1.0 if ffi == "frequent" else 0.0
        elif profile.dietary_preference:
            pref = str(profile.dietary_preference).lower()
            if any(k in pref for k in ("fast_food", "junk", "processed", "restaurant")):
                raw_dict["Fast food (Y/N)"] = 1.0
            else:
                raw_dict["Fast food (Y/N)"] = 0.0
        elif food_logs:
            has_fast_food = any("fast" in f.food_name.lower() or "burger" in f.food_name.lower() or "pizza" in f.food_name.lower() for f in food_logs if f.food_name)
            raw_dict["Fast food (Y/N)"] = 1.0 if has_fast_food else 0.0
        else:
            raw_dict["Fast food (Y/N)"] = np.nan

        # 16. Reg.Exercise(Y/N)
        if getattr(profile, "regular_exercise", None) is not None:
            raw_dict["Reg.Exercise(Y/N)"] = 1.0 if profile.regular_exercise else 0.0
        elif profile.activity_level:
            act = str(profile.activity_level).lower()
            if any(k in act for k in ("moderate", "very_active", "active", "high")):
                raw_dict["Reg.Exercise(Y/N)"] = 1.0
            else:
                raw_dict["Reg.Exercise(Y/N)"] = 0.0
        elif fitness_logs:
            raw_dict["Reg.Exercise(Y/N)"] = 1.0 if len(fitness_logs) >= 2 else 0.0
        else:
            raw_dict["Reg.Exercise(Y/N)"] = np.nan

        # Construct single-row DataFrame aligned with RAW_FEATURE_NAMES
        df = pd.DataFrame([raw_dict], columns=RAW_FEATURE_NAMES)

        # Assess data completeness
        available = [col for col in RAW_FEATURE_NAMES if not pd.isna(df.at[0, col])]
        missing = [col for col in RAW_FEATURE_NAMES if pd.isna(df.at[0, col])]
        completeness_pct = (len(available) / len(RAW_FEATURE_NAMES)) * 100.0

        # Minimum clinical data requirement:
        # Patient must have age/DOB or height/weight AND at least one cycle indicator
        has_biometrics = not pd.isna(df.at[0, " Age (yrs)"]) or (not pd.isna(df.at[0, "Weight (Kg)"]) and not pd.isna(df.at[0, "Height(Cm) "]))
        has_cycle_info = not pd.isna(df.at[0, "Cycle(R/I)"]) or not pd.isna(df.at[0, "Cycle length(days)"]) or len(cycle_records) >= 1

        if not has_biometrics and not has_cycle_info:
            quality_level = "insufficient_data"
        elif completeness_pct >= 50.0 and (has_biometrics and has_cycle_info):
            quality_level = "good"
        else:
            quality_level = "limited"

        # Build structured 16-feature audit list
        feature_category_map = {
            " Age (yrs)": "clinical",
            "Weight (Kg)": "clinical",
            "Height(Cm) ": "clinical",
            "BMI": "clinical",
            "Cycle(R/I)": "cycle",
            "Cycle length(days)": "cycle",
            "Marraige Status (Yrs)": "clinical",
            "Pregnant(Y/N)": "clinical",
            "No. of aborptions": "clinical",
            "Weight gain(Y/N)": "symptom",
            "hair growth(Y/N)": "symptom",
            "Skin darkening (Y/N)": "symptom",
            "Hair loss(Y/N)": "symptom",
            "Pimples(Y/N)": "symptom",
            "Fast food (Y/N)": "lifestyle",
            "Reg.Exercise(Y/N)": "lifestyle",
        }

        feature_details = []
        for col in RAW_FEATURE_NAMES:
            val = df.at[0, col]
            lbl = FEATURE_METADATA.get(col, {}).get("human_label", col)
            cat = feature_category_map.get(col, "clinical")

            if pd.isna(val):
                disp = "Not provided"
                status = "not_provided"
                is_imp = True
            else:
                is_imp = False
                status = "provided"
                if col == " Age (yrs)":
                    disp = f"{int(round(val))} yrs"
                elif col == "Weight (Kg)":
                    disp = f"{val:.1f} kg"
                elif col == "Height(Cm) ":
                    disp = f"{val:.0f} cm"
                elif col == "BMI":
                    disp = f"{val:.1f}"
                elif col == "Cycle(R/I)":
                    disp = "Regular" if val == 2.0 else "Irregular"
                elif col == "Cycle length(days)":
                    disp = f"{int(round(val))} days"
                elif col == "Marraige Status (Yrs)":
                    disp = f"{val} yrs"
                elif col == "No. of aborptions":
                    disp = f"{int(round(val))}"
                elif col in ("Weight gain(Y/N)", "hair growth(Y/N)", "Skin darkening (Y/N)", "Hair loss(Y/N)", "Pimples(Y/N)"):
                    disp = "Yes (Reported)" if val == 1.0 else "No (None reported)"
                elif col == "Pregnant(Y/N)":
                    disp = "Yes" if val == 1.0 else "No"
                elif col == "Fast food (Y/N)":
                    disp = "Yes (Logged)" if val == 1.0 else "No (Healthy logs)"
                elif col == "Reg.Exercise(Y/N)":
                    disp = "Active" if val == 1.0 else "Sedentary / Light"
                else:
                    disp = str(val)

            feature_details.append({
                "name": col,
                "label": lbl,
                "category": cat,
                "status": status,
                "display_value": disp,
                "is_imputed": is_imp,
            })

        dq = DataQualityReport(
            completeness_percentage=completeness_pct,
            quality_level=quality_level,
            missing_features=[FEATURE_METADATA.get(c, {}).get("human_label", c) for c in missing],
            available_features=[FEATURE_METADATA.get(c, {}).get("human_label", c) for c in available],
            feature_details=feature_details,
            cycle_records_count=len(cycle_records),
            symptom_records_count=len(symptom_records),
        )

        return df, dq

    # ------------------------------------------------------------------
    # Prediction & Risk Classification
    # ------------------------------------------------------------------

    def predict(self, features_df: pd.DataFrame) -> dict[str, Any]:
        """
        Executes predict_proba on the authoritative Pipeline and applies screening threshold.
        """
        self.load()

        # Execute through full pipeline (impute -> map -> classify)
        proba = self._model.predict_proba(features_df)[0]
        pcos_prob = float(proba[1])
        non_pcos_prob = float(proba[0])

        is_higher_risk = bool(pcos_prob >= SCREENING_THRESHOLD)

        if pcos_prob < LOWER_RISK_CUTOFF:
            risk_category = "lower_risk"
        elif pcos_prob < SCREENING_THRESHOLD:
            risk_category = "intermediate_risk"
        else:
            risk_category = "higher_risk"

        confidence = round(max(pcos_prob, non_pcos_prob), 4)

        return {
            "pcos_probability": round(pcos_prob, 4),
            "non_pcos_probability": round(non_pcos_prob, 4),
            "screening_threshold": SCREENING_THRESHOLD,
            "risk_category": risk_category,
            "risk_category_description": RISK_CATEGORY_DESCRIPTIONS.get(risk_category, ""),
            "is_higher_risk": is_higher_risk,
            "confidence": confidence,
            "probabilities": {
                "non_pcos": round(non_pcos_prob, 4),
                "pcos": round(pcos_prob, 4),
            },
        }

    # ------------------------------------------------------------------
    # TreeSHAP Explainability
    # ------------------------------------------------------------------

    def explain(self, features_df: pd.DataFrame, top_n: int = 5) -> list[dict[str, Any]]:
        """
        Generates localized TreeSHAP explanations for an individual patient.
        Transforms raw features using the pipeline's fitted preprocessor before TreeExplainer.
        """
        self.load()
        if self._explainer is None:
            return []

        try:
            preprocessor = self._model.named_steps["preprocessor"]
            X_trans = preprocessor.transform(features_df)
            transformed_names = list(preprocessor.get_feature_names_out())

            shap_values = self._explainer.shap_values(X_trans)

            # For binary ExtraTrees, shap_values has shape (n_samples, n_features, 2)
            # Index 1 corresponds to positive PCOS class contributions
            if len(shap_values.shape) == 3:
                pcos_shap = shap_values[0, :, 1]
            elif isinstance(shap_values, list) and len(shap_values) == 2:
                pcos_shap = shap_values[1][0]
            else:
                pcos_shap = shap_values[0]

            explanations: list[dict[str, Any]] = []

            # Sort features by absolute SHAP impact
            sorted_indices = np.argsort(np.abs(pcos_shap))[::-1]

            for idx in sorted_indices[:top_n]:
                raw_col_name = transformed_names[idx]
                mag = float(pcos_shap[idx])

                # Clean up transformed prefix ('num__', 'bin__', 'cyc__')
                cleaned_key = raw_col_name
                for prefix in ("num__", "bin__", "cyc__"):
                    if cleaned_key.startswith(prefix):
                        cleaned_key = cleaned_key[len(prefix):]
                if cleaned_key.endswith("_irregular"):
                    cleaned_key = cleaned_key[:-len("_irregular")]

                meta = FEATURE_METADATA.get(cleaned_key, {
                    "human_label": cleaned_key,
                    "increases_risk": f"{cleaned_key} contributed toward a higher risk estimate.",
                    "decreases_risk": f"{cleaned_key} contributed toward a lower risk estimate.",
                })

                direction = "increases_risk" if mag > 0 else "decreases_risk"
                explanation_text = meta["increases_risk"] if mag > 0 else meta["decreases_risk"]

                explanations.append({
                    "feature": cleaned_key.strip(),
                    "human_label": meta["human_label"],
                    "direction": direction,
                    "magnitude": round(abs(mag), 4),
                    "patient_explanation": explanation_text,
                })

            return explanations
        except Exception as exc:
            logger.warning("TreeSHAP explanation generation failed: %s", exc, exc_info=True)
            return []


# Global Singleton Instance
ovasense_ml_bridge = OvaSenseMLBridge()
