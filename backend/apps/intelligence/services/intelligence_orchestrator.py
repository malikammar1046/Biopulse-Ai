"""
backend/apps/intelligence/services/intelligence_orchestrator.py
Central workflow orchestrator for progressive cumulative PCOS assessments in PMOSense.

Coordinates:
- Health context & data retrieval via health_service
- Feature engineering, signature validation & ML inference via pcos_ml_service
- Assessment persistence, active state transitions, and history via assessment_repository
"""

from __future__ import annotations

import logging
import sys
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any
from PIL import Image

# Safe path resolution
_REPO_ROOT = Path(__file__).resolve().parent.parent.parent.parent.parent
if str(_REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(_REPO_ROOT))

from apps.health.services.supabase_health_service import health_service
from apps.intelligence.services.pcos_ml_service import (
    pcos_ml_service,
    TIER1_SCREENING_THRESHOLD,
    TIER2_SCREENING_THRESHOLD,
    MULTIMODAL_SCREENING_THRESHOLD,
    MEDICAL_DISCLAIMER,
    TIER2_CLINICAL_INPUT_FIELDS,
)
from apps.intelligence.services.male_ml_service import (
    male_ml_service,
    MALE_TIER1_FEATURE_NAMES,
    MALE_TIER2_FEATURE_NAMES,
    MALE_TIER1_SCREENING_THRESHOLD,
    MALE_TIER2_SCREENING_THRESHOLD,
)
from apps.intelligence.services.assessment_repository import assessment_repository
import numpy as np

logger = logging.getLogger(__name__)

# Medically plausible reference ranges for laboratory and vital measurements (Female PCOS)
CLINICAL_FIELD_RANGES: dict[str, tuple[float, float, str]] = {
    'fsh': (0.0, 200.0, 'mIU/mL'),
    'lh': (0.0, 200.0, 'mIU/mL'),
    'amh': (0.0, 100.0, 'ng/mL'),
    'tsh': (0.0, 100.0, 'mIU/L'),
    'prolactin': (0.0, 500.0, 'ng/mL'),
    'vitamin_d3': (0.0, 250.0, 'ng/mL'),
    'progesterone': (0.0, 100.0, 'ng/mL'),
    'rbs': (20.0, 600.0, 'mg/dL'),
    'hemoglobin': (2.0, 25.0, 'g/dL'),
    'beta_hcg_i': (0.0, 1000000.0, 'mIU/mL'),
    'beta_hcg_ii': (0.0, 1000000.0, 'mIU/mL'),
    'pulse_rate_bpm': (30.0, 240.0, 'bpm'),
    'respiratory_rate': (6.0, 60.0, 'breaths/min'),
    'bp_systolic': (50.0, 260.0, 'mmHg'),
    'bp_diastolic': (30.0, 160.0, 'mmHg'),
    'fsh_lh_ratio': (0.0, 50.0, ''),
}

# Medically plausible reference ranges for laboratory and vital measurements (Male Hypogonadism)
MALE_CLINICAL_FIELD_RANGES: dict[str, tuple[float, float, str]] = {
    'shbg_nmol_l': (0.0, 300.0, 'nmol/L'),
    'estradiol_pg_ml': (0.0, 200.0, 'pg/mL'),
    'albumin_g_dl': (1.0, 8.0, 'g/dL'),
    'hba1c_pct': (3.0, 20.0, '%'),
    'glucose_mg_dl': (20.0, 600.0, 'mg/dL'),
    'hemoglobin_g_dl': (2.0, 25.0, 'g/dL'),
    'hematocrit_pct': (10.0, 75.0, '%'),
    'rbc_count': (1.0, 10.0, 'million/cumm'),
    'alt_u_l': (0.0, 1000.0, 'U/L'),
    'ast_u_l': (0.0, 1000.0, 'U/L'),
    'total_bilirubin_mg_dl': (0.0, 30.0, 'mg/dL'),
    'creatinine_mg_dl': (0.1, 20.0, 'mg/dL'),
    'bun_mg_dl': (1.0, 150.0, 'mg/dL'),
    'uric_acid_mg_dl': (0.5, 20.0, 'mg/dL'),
    'hdl_mg_dl': (5.0, 150.0, 'mg/dL'),
    'total_testosterone': (0.0, 2000.0, 'ng/dL'),
    'lh': (0.0, 200.0, 'mIU/mL'),
    'fsh': (0.0, 200.0, 'mIU/mL'),
    'prolactin': (0.0, 500.0, 'ng/mL'),
}

def validate_male_clinical_value(field_name: str, val: Any) -> float | None:
    """
    Validates the format and medically plausible range for a single male laboratory feature.
    """
    if val is None or val == '':
        return None
    try:
        fval = float(val)
    except (ValueError, TypeError):
        raise ValueError(f"Invalid clinical measurement for '{field_name}': must be a valid number.")

    if np.isnan(fval):
        return None

    if field_name in MALE_CLINICAL_FIELD_RANGES:
        min_v, max_v, unit = MALE_CLINICAL_FIELD_RANGES[field_name]
        if fval < min_v or fval > max_v:
            unit_str = f" {unit}" if unit else ""
            raise ValueError(
                f"Clinical value for '{field_name}' ({fval}{unit_str}) is outside medically plausible range ({min_v}–{max_v}{unit_str})."
            )
    elif fval < 0:
        raise ValueError(f"Clinical value for '{field_name}' cannot be negative.")

    return fval


def validate_clinical_value(field_name: str, val: Any) -> float | None:
    """
    Validates the format and medically plausible range for a single clinical feature.
    Returns parsed float if valid, None if missing, or raises ValueError if invalid/out-of-bounds.
    """
    if val is None or val == '':
        return None
    try:
        fval = float(val)
    except (ValueError, TypeError):
        raise ValueError(f"Invalid clinical measurement for '{field_name}': must be a valid number.")

    if np.isnan(fval):
        return None

    if field_name in CLINICAL_FIELD_RANGES:
        min_v, max_v, unit = CLINICAL_FIELD_RANGES[field_name]
        if fval < min_v or fval > max_v:
            unit_str = f" {unit}" if unit else ""
            raise ValueError(
                f"Clinical value for '{field_name}' ({fval}{unit_str}) is outside medically plausible range ({min_v}–{max_v}{unit_str})."
            )
    elif fval < 0:
        raise ValueError(f"Clinical value for '{field_name}' cannot be negative.")

    return fval


@dataclass
class AssessmentResult:
    """Dataclass adapter for assessment result."""
    risk_category: str
    risk_category_description: str = ""
    pcos_probability: float | None = None
    non_pcos_probability: float | None = None
    screening_threshold: float = 0.38
    is_higher_risk: bool = False
    confidence: float | None = None
    probabilities: dict[str, float] = field(default_factory=dict)
    data_quality: dict[str, Any] = field(default_factory=dict)
    explanations: list[dict[str, Any]] = field(default_factory=list)
    model_metadata: dict[str, Any] = field(default_factory=dict)
    disclaimer: str = MEDICAL_DISCLAIMER
    shap_enabled: bool = True
    backend_mode: str = "ml"
    fetch_errors: list[str] = field(default_factory=list)

    @property
    def risk_pattern(self) -> str:
        return self.risk_category

    @property
    def risk_pattern_description(self) -> str:
        return self.risk_category_description


# ---------------------------------------------------------------------------
# Data Extraction Helper
# ---------------------------------------------------------------------------

def extract_patient_raw_inputs(health_data: Any, client_data: dict | None = None) -> dict[str, Any]:
    """
    Extracts raw feature dictionary from patient health records and client overrides.
    """
    inputs: dict[str, Any] = {}
    p = getattr(health_data, 'profile', None)

    if p:
        if getattr(p, 'height_cm', None) is not None:
            try:
                inputs['height_cm'] = float(p.height_cm)
            except Exception:
                pass
        if getattr(p, 'weight_kg', None) is not None:
            try:
                inputs['weight_kg'] = float(p.weight_kg)
            except Exception:
                pass
        if getattr(p, 'cycle_length', None) is not None:
            try:
                inputs['cycle_length_raw'] = float(p.cycle_length)
            except Exception:
                inputs['cycle_length_raw'] = 28.0
        if getattr(p, 'period_regularity', None):
            inputs['cycle_regularity'] = 1 if 'irreg' in str(p.period_regularity).lower() else 0

        # Calculate approximate age from date of birth
        dob_val = getattr(p, 'date_of_birth', None)
        if dob_val:
            try:
                from datetime import date
                dob = date.fromisoformat(str(dob_val))
                today = date.today()
                inputs['age'] = float(today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day)))
            except Exception:
                inputs['age'] = 25.0

        # Common symptoms list parsing
        symptoms = [str(s).lower() for s in getattr(p, 'common_symptoms', []) or []]
        inputs['hirsutism'] = 1 if any('hair' in s or 'hirsutism' in s for s in symptoms) else 0
        inputs['skin_darkening'] = 1 if any('dark' in s or 'acanthosis' in s for s in symptoms) else 0
        inputs['hair_loss'] = 1 if any('loss' in s or 'thinning' in s or 'alopecia' in s for s in symptoms) else 0
        inputs['pimples_acne'] = 1 if any('acne' in s or 'pimple' in s for s in symptoms) else 0
        inputs['weight_gain'] = 1 if any('weight' in s or 'gain' in s for s in symptoms) else 0

        # Lifestyle flags
        fast_food_val = getattr(p, 'fast_food_intake', None)
        if fast_food_val:
            inputs['fast_food'] = 1 if str(fast_food_val).lower() in ('frequent', 'daily', 'often') else 0
        reg_ex = getattr(p, 'regular_exercise', None)
        if reg_ex is not None:
            inputs['regular_exercise'] = 1 if reg_ex else 0

    # Also inspect symptom records for logged indicators
    symptom_records = getattr(health_data, 'symptom_records', []) or []
    for sym in symptom_records:
        st = getattr(sym, 'symptom_type', '').lower()
        if 'hair_growth' in st or 'hirsutism' in st:
            inputs['hirsutism'] = 1
        if 'skin_darkening' in st or 'acanthosis' in st:
            inputs['skin_darkening'] = 1
        if 'hair_loss' in st or 'alopecia' in st:
            inputs['hair_loss'] = 1
        if 'acne' in st or 'pimples' in st:
            inputs['pimples_acne'] = 1
        if 'weight_gain' in st:
            inputs['weight_gain'] = 1

    # Extract verified lab biomarkers from medical reports if present
    medical_reports = getattr(health_data, 'medical_reports', []) or []
    for rep in medical_reports:
        for res in getattr(rep, 'results', []) or []:
            name = (getattr(res, 'test_name', '') or '').lower().replace(' ', '_')
            val = getattr(res, 'result_numeric', None)
            if val is not None:
                if 'fsh' in name and 'lh' not in name:
                    inputs['fsh'] = float(val)
                elif 'lh' in name and 'fsh' not in name:
                    inputs['lh'] = float(val)
                elif 'amh' in name:
                    inputs['amh'] = float(val)
                elif 'tsh' in name:
                    inputs['tsh'] = float(val)
                elif 'prolactin' in name:
                    inputs['prolactin'] = float(val)
                elif 'vitamin_d' in name or 'vit_d' in name:
                    inputs['vitamin_d3'] = float(val)
                elif 'progesterone' in name:
                    inputs['progesterone'] = float(val)
                elif 'blood_sugar' in name or 'rbs' in name or 'glucose' in name:
                    inputs['rbs'] = float(val)
                elif 'hemoglobin' in name:
                    inputs['hemoglobin'] = float(val)
                elif 'systolic' in name:
                    inputs['bp_systolic'] = float(val)
                elif 'diastolic' in name:
                    inputs['bp_diastolic'] = float(val)
                elif 'pulse' in name or 'heart_rate' in name:
                    inputs['pulse_rate_bpm'] = float(val)

    # Client-side overrides (highest priority)
    if client_data:
        for k, v in client_data.items():
            if v is not None and v != '':
                inputs[k] = v

    return inputs


# ---------------------------------------------------------------------------
def _get_val(obj: Any, key: str, default: Any = None) -> Any:
    """Helper to safely get an attribute or key from either a dict or object."""
    if obj is None:
        return default
    if isinstance(obj, dict):
        return obj.get(key, default)
    return getattr(obj, key, default)


def extract_male_patient_raw_inputs(health_data: Any, passed_data: dict | None = None) -> dict[str, Any]:
    raw_inputs: dict[str, Any] = {}
    passed = passed_data or {}
    direct_keys = {
        'age', 'height_cm', 'weight_kg', 'waist_cm', 'low_energy',
        'sleep_trouble', 'low_mood', 'low_interest', 'high_blood_pressure', 'diabetes'
    }

    if "userProfile" in passed:
        p = passed["userProfile"]
    else:
        p = getattr(health_data, "profile", {}) or {}

    dob = _get_val(p, "date_of_birth") or _get_val(p, "dateOfBirth")
    age = 35.0
    if dob:
        try:
            from datetime import date
            bdate = date.fromisoformat(str(dob)[:10])
            today = date.today()
            age = float(today.year - bdate.year - ((today.month, today.day) < (bdate.month, bdate.day)))
        except Exception:
            age = 35.0

    h_cm = _get_val(p, "height_cm") or _get_val(p, "heightCm")
    w_kg = _get_val(p, "weight_kg") or _get_val(p, "weightKg")
    waist = _get_val(p, "waist_cm") or _get_val(p, "waistCm") or _get_val(p, "waist_inch")
    mh = _get_val(p, "mensHealth") or _get_val(p, "mens_health") or {}
    lifestyle = _get_val(p, "lifestyle") or {}
    conds = _get_val(p, "conditions") or _get_val(p, "diagnosedConditions") or []

    low_energy = 1 if (_get_val(mh, "energyLevel") in ["low", "very_low"] or "fatigue" in str(conds).lower()) else 0
    sleep_trouble = 1 if (_get_val(mh, "sleepQuality") in ["poor", "fair"] or float(_get_val(lifestyle, "sleepHours", _get_val(p, "sleep_hours", 7.5)) or 7.5) < 6.0) else 0
    low_mood = 1 if ("mood" in str(_get_val(mh, "moodFactors", "")).lower() or "depression" in str(conds).lower()) else 0
    low_interest = 1 if (_get_val(mh, "sexDrive") in ["low", "very_low"]) else 0
    hbp = 1 if ("hypertension" in str(conds).lower() or "blood pressure" in str(conds).lower()) else 0
    dm = 1 if ("diabetes" in str(conds).lower() or "prediabetes" in str(conds).lower()) else 0

    raw_inputs = {
        "age": age,
        "height_cm": h_cm,
        "weight_kg": w_kg,
        "waist_cm": waist,
        "low_energy": low_energy,
        "sleep_trouble": sleep_trouble,
        "low_mood": low_mood,
        "low_interest": low_interest,
        "high_blood_pressure": hbp,
        "diabetes": dm,
    }

    for k in direct_keys:
        if k in passed and passed[k] is not None and passed[k] != '':
            try:
                raw_inputs[k] = float(passed[k])
            except (ValueError, TypeError):
                raw_inputs[k] = passed[k]

    return raw_inputs


def reassess_from_current_patient_state(
    patient_uuid: str,
    module: str | None = None,
    incoming_tier1: dict[str, Any] | None = None,
    incoming_tier2: dict[str, Any] | None = None,
    remove_tier2_fields: list[str] | None = None,
    clear_tier2: bool = False,
    auth_token: str | None = None,
    client_health_data: dict | None = None,
    requested_tier: int | None = None,
) -> dict[str, Any]:
    """
    Authoritative, non-destructive reassessment engine.
    1. Loads persisted patient clinical state (Tier 1 & Tier 2).
    2. Merges incoming updates using true PATCH semantics (omitted fields preserved).
    3. Respects requested_tier if provided (Tier 1 execution never claims Tier 2/3 evidence).
       If requested_tier is None (e.g. profile update), preserves the active assessment tier level
       so a profile change never promotes a Tier 1 user to Tier 2 without explicit intent.
    4. Executes inference without destroying stored hormonal/lab values.
    5. Saves updated patient clinical state and sets new assessment active with explicit evidence provenance.
    """
    from apps.intelligence.maintenance import is_assessment_maintenance_active
    if is_assessment_maintenance_active():
        raise RuntimeError("Assessment writes blocked: BIOPULSE_ASSESSMENT_MAINTENANCE is active.")

    health_data = health_service.fetch_all(patient_uuid, auth_token=auth_token, client_health_data=client_health_data)
    p = getattr(health_data, 'profile', None)

    if not module:
        is_male_profile = (
            (p and getattr(p, 'gender', None) == 'male')
            or (isinstance(client_health_data, dict) and client_health_data.get('gender') == 'male')
            or (isinstance(incoming_tier1, dict) and incoming_tier1.get('gender') == 'male')
        )
        module = "male_hypogonadism" if is_male_profile else "female_pcos"

    # 1. Retrieve authoritative patient clinical state
    current_state = assessment_repository.get_patient_clinical_state(patient_uuid, module=module, auth_token=auth_token)
    stored_tier1 = dict(current_state.get("tier_1_inputs") or {})
    stored_tier2 = dict(current_state.get("tier_2_inputs") or {})
    stored_ultrasound = dict(current_state.get("ultrasound_inputs") or {})

    # 2. Extract baseline Tier 1 inputs & PATCH merge incoming
    # Stored inputs are the baseline; fresh profile inputs (e.g. Weight changed in Settings) take precedence!
    NON_TIER1_CLIENT_COLLECTIONS = {
        'userProfile', 'cycleRecords', 'symptomRecords', 'foodLogs', 'fitnessLogs',
        'medicationLogs', 'appointments', 'reminders', 'lifestyle', 'mensHealth',
        'waterLog', 'profile', 'healthData'
    }

    if module == "male_hypogonadism":
        baseline_t1 = extract_male_patient_raw_inputs(health_data, client_health_data or incoming_tier1)
        merged_tier1 = dict(stored_tier1)
        for k, v in baseline_t1.items():
            if v is not None and str(v).strip() != "":
                merged_tier1[k] = v
        if incoming_tier1 and isinstance(incoming_tier1, dict):
            for k, v in incoming_tier1.items():
                if k in NON_TIER1_CLIENT_COLLECTIONS:
                    continue
                if v is not None and str(v).strip() != "":
                    try:
                        merged_tier1[k] = float(v)
                    except (ValueError, TypeError):
                        merged_tier1[k] = v
    else:
        baseline_t1 = extract_patient_raw_inputs(health_data, client_health_data or incoming_tier1)
        merged_tier1 = dict(stored_tier1)
        for k, v in baseline_t1.items():
            if v is not None and str(v).strip() != "":
                merged_tier1[k] = v
        if incoming_tier1 and isinstance(incoming_tier1, dict):
            for k, v in incoming_tier1.items():
                if k in NON_TIER1_CLIENT_COLLECTIONS:
                    continue
                if v is not None and str(v).strip() != "":
                    try:
                        merged_tier1[k] = float(v)
                    except (ValueError, TypeError):
                        merged_tier1[k] = v

    # Canonical BMI recalculation & synchronization
    w_raw = merged_tier1.get("weight_kg")
    h_raw = merged_tier1.get("height_cm")
    if w_raw is not None and h_raw is not None:
        try:
            w_flt = float(w_raw)
            h_flt = float(h_raw)
            if h_flt > 0:
                merged_tier1["bmi"] = round(w_flt / ((h_flt / 100.0) ** 2), 1)
        except (ValueError, TypeError):
            pass

    # 3. PATCH Merge Tier 2 inputs
    if clear_tier2:
        merged_tier2: dict[str, Any] = {}
        assessment_repository.clear_patient_tier2_state(patient_uuid, module=module, auth_token=auth_token)
    else:
        merged_tier2 = dict(stored_tier2)
        rems = list(remove_tier2_fields or [])
        if incoming_tier2 and isinstance(incoming_tier2, dict):
            rems.extend(incoming_tier2.get('remove_fields') or [])
            rems.extend(incoming_tier2.get('removed_fields') or [])
        for rf in rems:
            merged_tier2.pop(rf, None)

        if incoming_tier2 and isinstance(incoming_tier2, dict):
            for k, v in incoming_tier2.items():
                if k in ('remove_fields', 'removed_fields'):
                    continue
                # Sanitize: empty strings or None must NEVER wipe stored lab values!
                if v is None or str(v).strip() == "":
                    continue
                if module == "male_hypogonadism":
                    parsed = validate_male_clinical_value(k, v)
                    if parsed is not None:
                        merged_tier2[k] = parsed
                else:
                    if k in CLINICAL_FIELD_RANGES:
                        parsed = validate_clinical_value(k, v)
                        if parsed is not None:
                            merged_tier2[k] = parsed

    # 4. Resolve target tier:
    # If requested_tier is explicitly provided, adhere strictly to it.
    # Otherwise, infer from active assessment so a profile update (e.g. weight change) preserves the active tier!
    if requested_tier is not None:
        target_tier = int(requested_tier)
    else:
        active_prev = assessment_repository.get_active_assessment(patient_uuid, module=module, auth_token=auth_token)
        if active_prev:
            prev_level = active_prev.get("assessment_level", "tier_1")
            if prev_level in ("tier_1_2", "tier_1_2_3"):
                can_run_t2 = (
                    male_ml_service.can_predict_tier2(merged_tier2)
                    if module == "male_hypogonadism"
                    else pcos_ml_service.can_predict_tier2(merged_tier2)
                )
                target_tier = 2 if can_run_t2 else 1
            else:
                target_tier = 1
        else:
            target_tier = 1

    # 5. Execute ML inference strictly matching target tier
    if module == "male_hypogonadism":
        if target_tier >= 2:
            can_run_t2 = male_ml_service.can_predict_tier2(merged_tier2)
            if not can_run_t2:
                if requested_tier == 2:
                    raise ValueError("Please provide at least one clinical or laboratory result to run a male Tier 2 assessment.")
                target_tier = 1

        if target_tier >= 2:
            res = male_ml_service.predict_tier2(merged_tier2, tier1_inputs=merged_tier1)
            res["assessment_level"] = "tier_1_2"
            res["tiers_included"] = [1, 2]
            res["tier_2_inputs"] = merged_tier2
            res["input_features"] = {**merged_tier1, **merged_tier2}
            res["pcom_status"] = None
            res["pcom_probability"] = None
            res["gradcam_url"] = None
            res["gradcam_b64"] = None
            res["ultrasound_report_id"] = None
            res["evidence_used"] = {
                "tier_1": True,
                "tier_2": True,
                "tier_3_ultrasound": False,
            }
            res["input_availability"] = {
                "tier_1_complete": True,
                "tier_2_clinical_available": True,
                "tier_3_ultrasound_available": False,
            }
        else:
            res = male_ml_service.predict_tier1(merged_tier1)
            res["assessment_level"] = "tier_1"
            res["tiers_included"] = [1]
            res["tier_2_inputs"] = {}
            res["input_features"] = merged_tier1
            res["pcom_status"] = None
            res["pcom_probability"] = None
            res["gradcam_url"] = None
            res["gradcam_b64"] = None
            res["ultrasound_report_id"] = None
            res["status_code"] = None
            res["notice"] = None
            res["direct_laboratory_values"] = []
            res["hormone_pattern_interpretation"] = None
            res["tier_2_available_count"] = 0
            res["tier_2_total_count"] = None
            res["tier_2_available_fields"] = []
            res["tier_2_missing_fields"] = []
            res["evidence_used"] = {
                "tier_1": True,
                "tier_2": False,
                "tier_3_ultrasound": False,
            }
            res["input_availability"] = {
                "tier_1_complete": True,
                "tier_2_clinical_available": False,
                "tier_3_ultrasound_available": False,
            }
    else:  # female_pcos
        if target_tier >= 2:
            can_run_t2 = pcos_ml_service.can_predict_tier2(merged_tier2)
            if not can_run_t2:
                if requested_tier == 2:
                    raise ValueError("At least one valid clinical or laboratory measurement is required to run a Tier 2 assessment.")
                target_tier = 1

        if target_tier >= 2:
            combined = {**merged_tier1, **merged_tier2}
            res = pcos_ml_service.predict_tier2_cumulative(combined)
            res["assessment_level"] = "tier_1_2"
            res["tiers_included"] = [1, 2]
            res["tier_2_inputs"] = merged_tier2
            res["input_features"] = combined
            res["pcom_status"] = None
            res["pcom_probability"] = None
            res["gradcam_url"] = None
            res["gradcam_b64"] = None
            res["ultrasound_report_id"] = None
            res["evidence_used"] = {
                "tier_1": True,
                "tier_2": True,
                "tier_3_ultrasound": False,
            }
            res["input_availability"] = {
                "tier_1_complete": True,
                "tier_2_clinical_available": True,
                "tier_3_ultrasound_available": False,
            }
        else:
            res = pcos_ml_service.predict_tier1(merged_tier1)
            res["assessment_level"] = "tier_1"
            res["tiers_included"] = [1]
            res["tier_2_inputs"] = {}
            res["input_features"] = merged_tier1
            res["pcom_status"] = None
            res["pcom_probability"] = None
            res["gradcam_url"] = None
            res["gradcam_b64"] = None
            res["ultrasound_report_id"] = None
            res["status_code"] = None
            res["notice"] = None
            res["direct_laboratory_values"] = []
            res["hormone_pattern_interpretation"] = None
            res["tier_2_available_count"] = 0
            res["tier_2_total_count"] = None
            res["tier_2_available_fields"] = []
            res["tier_2_missing_fields"] = []
            res["evidence_used"] = {
                "tier_1": True,
                "tier_2": False,
                "tier_3_ultrasound": False,
            }
            res["input_availability"] = {
                "tier_1_complete": True,
                "tier_2_clinical_available": False,
                "tier_3_ultrasound_available": False,
            }

    res["module"] = module
    res["available_historical_evidence"] = {
        "tier_1": bool(stored_tier1 or merged_tier1),
        "tier_2": bool(stored_tier2 or merged_tier2),
        "tier_3_ultrasound": False if module == "male_hypogonadism" else bool(stored_ultrasound),
    }

    # 6. Persist authoritative patient clinical state (preserves stored labs/ultrasound)
    assessment_repository.save_patient_clinical_state(
        user_id=patient_uuid,
        module=module,
        tier_1_inputs=merged_tier1,
        tier_2_inputs=merged_tier2,
        ultrasound_inputs=stored_ultrasound,
        auth_token=auth_token,
    )

    # 6b. Synchronize immutable metric observations (Weight, BMI, Waist, Symptoms)
    try:
        from apps.intelligence.services.observation_repository import observation_repository
        profile_ts = (
            getattr(p, 'updated_at', None)
            or getattr(p, 'created_at', None)
            or (client_health_data.get('updated_at') if isinstance(client_health_data, dict) else None)
            or (incoming_tier1.get('updated_at') if isinstance(incoming_tier1, dict) else None)
            or current_state.get('updated_at')
            or current_state.get('created_at')
        )
        observation_repository.sync_observations_from_patient_state(
            user_id=patient_uuid,
            module=module,
            current_profile=p,
            current_clinical_state={"tier_1_inputs": merged_tier1, "tier_2_inputs": merged_tier2},
            source="profile_update",
            observed_at=profile_ts,
            auth_token=auth_token,
        )
    except Exception as obs_err:
        logger.warning("Observation sync notice for patient %s: %s", patient_uuid[:8] if len(patient_uuid) >= 8 else patient_uuid, obs_err)

    # 6c. Compute longitudinal SHAP explanation comparison against latest directly comparable assessment
    try:
        if res.get("shap_explanation"):
            from apps.intelligence.services.longitudinal_shap_service import (
                compare_explanations,
                find_latest_comparable_assessment,
            )
            comparable_target = find_latest_comparable_assessment(
                user_id=patient_uuid,
                current_explanation=res["shap_explanation"],
                current_assessment_id=res.get("id"),
                auth_token=auth_token,
            )
            if comparable_target:
                res["longitudinal_shap_comparison"] = compare_explanations(res["shap_explanation"], comparable_target)
    except Exception as comp_err:
        logger.warning("Longitudinal SHAP comparison notice: %s", comp_err)

    # 7. Save assessment to repository and format
    saved = assessment_repository.save_assessment(patient_uuid, res, make_active=True, auth_token=auth_token)
    formatted = format_assessment_response(saved)
    formatted["authoritative_tier_2_inputs"] = merged_tier2
    formatted["authoritative_tier_1_inputs"] = merged_tier1
    formatted["available_historical_evidence"] = res["available_historical_evidence"]
    return formatted


def run_tier1_assessment(
    patient_uuid: str,
    auth_token: str | None = None,
    client_health_data: dict | None = None,
) -> dict[str, Any]:
    """
    Executes non-destructive reassessment for female PCOS strictly at Tier 1 without wiping stored Tier 2 values.
    """
    return reassess_from_current_patient_state(
        patient_uuid=patient_uuid,
        module="female_pcos",
        incoming_tier1=client_health_data,
        auth_token=auth_token,
        client_health_data=client_health_data,
        requested_tier=1,
    )


def run_tier2_assessment(
    patient_uuid: str,
    auth_token: str | None = None,
    client_health_data: dict | None = None,
    clinical_inputs: dict | None = None,
) -> dict[str, Any]:
    """
    Executes cumulative Tier 2 assessment (Tier 1 + Clinical Labs) for female PCOS,
    merging with persisted inputs using PATCH semantics.
    """
    st = assessment_repository.get_patient_clinical_state(patient_uuid, module="female_pcos", auth_token=auth_token)
    existing_t2 = st.get("tier_2_inputs") or {}
    has_any = (
        pcos_ml_service.can_predict_tier2(clinical_inputs)
        or pcos_ml_service.can_predict_tier2(existing_t2)
    )
    if not has_any:
        raise ValueError("At least one valid clinical or laboratory measurement is required to run a Tier 2 assessment.")

    return reassess_from_current_patient_state(
        patient_uuid=patient_uuid,
        module="female_pcos",
        incoming_tier1=client_health_data,
        incoming_tier2=clinical_inputs,
        auth_token=auth_token,
        client_health_data=client_health_data,
        requested_tier=2,
    )


def run_ultrasound_assessment(
    patient_uuid: str,
    pil_image: Image.Image,
    auth_token: str | None = None,
    client_health_data: dict | None = None,
    report_id: str | None = None,
) -> dict[str, Any]:
    """
    Processes an uploaded ultrasound image:
    - If user has completed Tier 2 (clinical labs): runs complete Tier 1+2+3 multimodal fusion and activates it.
    - If user only has Tier 1 (no clinical labs): processes ultrasound for PCOM/Grad-CAM, notes tier_1_3_model_unavailable,
      and records Tier 1+3 assessment.
    """
    logger.info(f"[ASSESSMENT_PIPELINE] STAGE: ASSESSMENT_REQUEST_RECEIVED | type=ultrasound | patient={patient_uuid}")
    health_data = health_service.fetch_all(patient_uuid, auth_token=auth_token, client_health_data=client_health_data)
    profile = getattr(health_data, 'profile', None)
    if profile and getattr(profile, 'gender', None) == 'male':
        raise ValueError("Ultrasound assessment is not applicable to the male hypogonadism pathway.")

    inputs = extract_patient_raw_inputs(health_data, client_health_data)

    # Check if clinical labs / Tier 2 are present
    active_prev = assessment_repository.get_active_assessment(patient_uuid, module="female_pcos", auth_token=auth_token)
    has_clinical = (
        (active_prev and (active_prev.get('tier_2_inputs') or active_prev.get('assessment_level') in ('tier_1_2', 'tier_1_2_3')))
        or ('fsh' in inputs and 'lh' in inputs and 'amh' in inputs)
    )

    if has_clinical:
        # Carry forward prior tier_2_inputs if available
        if active_prev and active_prev.get('tier_2_inputs'):
            inputs.update(active_prev['tier_2_inputs'])
        elif active_prev and active_prev.get('input_features'):
            for k, v in active_prev['input_features'].items():
                if k in CLINICAL_FIELD_RANGES and v is not None:
                    inputs[k] = v

        # Full Multimodal Fusion (Tier 1 + 2 + 3)
        res = pcos_ml_service.predict_tier1_2_3_multimodal(inputs, pil_image)
        res['module'] = 'female_pcos'
        res['assessment_level'] = 'tier_1_2_3'
        res['tiers_included'] = [1, 2, 3]
        res['ultrasound_report_id'] = report_id
        res['input_features'] = inputs
        if active_prev and active_prev.get('tier_2_inputs'):
            res['tier_2_inputs'] = active_prev['tier_2_inputs']
        res['evidence_used'] = {
            'tier_1': True,
            'tier_2': True,
            'tier_3_ultrasound': True,
        }
        res['input_availability'] = {
            'tier_1_complete': True,
            'tier_2_clinical_available': True,
            'tier_3_ultrasound_available': True,
        }
        # Also store ultrasound inputs in clinical state so it's tracked
        assessment_repository.save_patient_clinical_state(
            user_id=patient_uuid,
            module="female_pcos",
            tier_1_inputs=inputs,
            tier_2_inputs=res.get('tier_2_inputs'),
            ultrasound_inputs={'pcom_status': res.get('pcom_status'), 'pcom_probability': res.get('pcom_probability'), 'ultrasound_report_id': report_id},
            auth_token=auth_token,
        )
        try:
            if res.get('shap_explanation'):
                from apps.intelligence.services.longitudinal_shap_service import (
                    compare_explanations,
                    find_latest_comparable_assessment,
                )
                comparable_target = find_latest_comparable_assessment(
                    user_id=patient_uuid,
                    current_explanation=res['shap_explanation'],
                    current_assessment_id=res.get('id'),
                    auth_token=auth_token,
                )
                if comparable_target:
                    res['longitudinal_shap_comparison'] = compare_explanations(res['shap_explanation'], comparable_target)
        except Exception as comp_err:
            logger.warning("Longitudinal SHAP comparison notice (multimodal): %s", comp_err)

        saved = assessment_repository.save_assessment(patient_uuid, res, make_active=True, auth_token=auth_token)
        logger.info(f"[ASSESSMENT_PIPELINE] STAGE: ULTRASOUND_ASSESSMENT_SAVED | patient={patient_uuid} | level=tier_1_2_3")
        return format_assessment_response(saved)
    else:
        # Safe Tier 1+3 Handling: Ultrasound analyzed for morphology, but combined ML requires clinical labs
        img_res = pcos_ml_service.process_ultrasound_image(pil_image)
        active_t1 = active_prev or run_tier1_assessment(patient_uuid, auth_token=auth_token, client_health_data=client_health_data)

        # Build response with morphology details while isolating as tier_1_3
        response = dict(active_t1)
        response['module'] = 'female_pcos'
        response['assessment_level'] = 'tier_1_3'
        response['tiers_included'] = [1, 3]
        response['pcom_status'] = img_res['pcom_status']
        response['pcom_probability'] = img_res['pcom_probability']
        response['gradcam_b64'] = img_res['gradcam_b64']
        response['ultrasound_report_id'] = report_id
        response['status_code'] = 'tier_1_3_model_unavailable'
        response['notice'] = (
            "Ultrasound image was successfully processed and analyzed for polycystic ovarian morphology (PCOM). "
            "However, an integrated multimodal AI screening score requires clinical laboratory biomarkers. "
            "Please add your clinical lab results for a complete Tier 1 + Clinical + Ultrasound assessment."
        )
        response['next_available_tier'] = 2
        response['evidence_used'] = {
            'tier_1': True,
            'tier_2': False,
            'tier_3_ultrasound': True,
        }
        input_avail = dict(response.get('input_availability') or {})
        input_avail['tier_3_ultrasound_available'] = True
        response['input_availability'] = input_avail

        # Persist clinical state with ultrasound inputs
        assessment_repository.save_patient_clinical_state(
            user_id=patient_uuid,
            module="female_pcos",
            ultrasound_inputs={'pcom_status': img_res.get('pcom_status'), 'pcom_probability': img_res.get('pcom_probability'), 'ultrasound_report_id': report_id},
            auth_token=auth_token,
        )

        # Persist so refreshing or reloading doesn't wipe ultrasound analysis
        saved = assessment_repository.save_assessment(patient_uuid, response, make_active=True, auth_token=auth_token)
        logger.info(f"[ASSESSMENT_PIPELINE] STAGE: ULTRASOUND_ASSESSMENT_SAVED | patient={patient_uuid} | level=tier_1_3")
        return format_assessment_response(saved)


def run_male_tier1_assessment(
    patient_uuid: str,
    input_data: dict[str, Any] | None = None,
    auth_token: str | None = None,
    client_health_data: dict | None = None,
) -> dict[str, Any]:
    """
    Executes non-destructive reassessment for Male Hypogonadism without wiping stored Tier 2 lab values.
    Strictly assesses at Tier 1.
    """
    return reassess_from_current_patient_state(
        patient_uuid=patient_uuid,
        module="male_hypogonadism",
        incoming_tier1=(input_data or client_health_data),
        auth_token=auth_token,
        client_health_data=client_health_data,
        requested_tier=1,
    )


def run_male_tier2_assessment(
    patient_uuid: str,
    lab_inputs: dict[str, Any] | None = None,
    clinical_inputs: dict[str, Any] | None = None,
    auth_token: str | None = None,
    client_health_data: dict | None = None,
) -> dict[str, Any]:
    """
    Executes Male Hypogonadism Tier 2 clinical & laboratory assessment,
    merging with persisted inputs using PATCH semantics.
    """
    inputs = lab_inputs or clinical_inputs or {}
    st = assessment_repository.get_patient_clinical_state(patient_uuid, module="male_hypogonadism", auth_token=auth_token)
    existing_t2 = st.get("tier_2_inputs") or {}
    has_any = (
        male_ml_service.can_predict_tier2(inputs)
        or male_ml_service.can_predict_tier2(existing_t2)
    )
    if not has_any:
        raise ValueError("Please provide at least one clinical or laboratory result to run a male Tier 2 assessment.")

    return reassess_from_current_patient_state(
        patient_uuid=patient_uuid,
        module="male_hypogonadism",
        incoming_tier1=client_health_data,
        incoming_tier2=inputs,
        auth_token=auth_token,
        client_health_data=client_health_data,
        requested_tier=2,
    )


def clear_tier2_assessment(
    patient_uuid: str,
    module: str | None = None,
    auth_token: str | None = None,
) -> dict[str, Any]:
    """
    Explicitly clears Tier 2 clinical state and downgrades active assessment to Tier 1.
    """
    return reassess_from_current_patient_state(
        patient_uuid=patient_uuid,
        module=module,
        clear_tier2=True,
        auth_token=auth_token,
        requested_tier=1,
    )


def run_assessment(
    patient_uuid: str,
    auth_token: str | None = None,
    client_health_data: dict | None = None,
    module: str | None = None,
) -> dict[str, Any]:
    """
    Unified assessment endpoint: returns the active assessment if present,
    or executes reassess_from_current_patient_state.
    """
    if not module:
        try:
            health_data = health_service.fetch_all(patient_uuid, auth_token=auth_token, client_health_data=client_health_data)
            p = getattr(health_data, 'profile', None)
            if p and getattr(p, 'gender', None) == 'male':
                module = "male_hypogonadism"
            else:
                module = "female_pcos"
        except Exception:
            module = "female_pcos"

    active = assessment_repository.get_active_assessment(patient_uuid, module=module, auth_token=auth_token)
    if active:
        if client_health_data and isinstance(client_health_data, dict):
            try:
                from apps.intelligence.services.observation_repository import observation_repository
                user_prof = client_health_data.get("userProfile")
                if user_prof:
                    prof_ts = (
                        user_prof.get("updated_at")
                        or user_prof.get("created_at")
                        or (p and getattr(p, "updated_at", None))
                    )
                    observation_repository.sync_observations_from_patient_state(
                        user_id=patient_uuid,
                        module=module,
                        current_profile=user_prof,
                        source="profile_update",
                        observed_at=prof_ts,
                        auth_token=auth_token,
                    )
            except Exception:
                pass
        return format_assessment_response(active)

    from apps.intelligence.maintenance import is_assessment_maintenance_active
    if is_assessment_maintenance_active():
        raise RuntimeError("Assessment writes blocked: BIOPULSE_ASSESSMENT_MAINTENANCE is active.")

    return reassess_from_current_patient_state(
        patient_uuid=patient_uuid,
        module=module,
        auth_token=auth_token,
        client_health_data=client_health_data,
    )


def get_health_snapshot(patient_uuid: str, auth_token: str | None = None) -> dict[str, Any]:
    """
    Returns normalized health snapshot for the digital twin without running ML inference.
    """
    health_data = health_service.fetch_all(patient_uuid, auth_token=auth_token)
    p = getattr(health_data, 'profile', None)
    return {
        'patient_uuid': patient_uuid,
        'profile_complete': p is not None,
        'cycle_records_count': len(getattr(health_data, 'cycle_records', []) or []),
        'symptom_records_count': len(getattr(health_data, 'symptom_records', []) or []),
        'medical_reports_count': len(getattr(health_data, 'medical_reports', []) or []),
    }


def format_assessment_response(record: dict[str, Any]) -> dict[str, Any]:
    """
    Ensures the response dictionary strictly adheres to the unified specification
    with explicit tier isolation and evidence provenance.
    """
    prob = float(record.get('probability', 0.0) or 0.0)
    threshold = float(record.get('threshold', 0.38) or 0.38)
    level = record.get('assessment_level', 'tier_1')
    module_name = record.get('module', 'female_pcos')

    # Compute tiers included
    tiers_inc = record.get('tiers_included', [1])
    if isinstance(tiers_inc, str):
        try:
            tiers_inc = json.loads(tiers_inc)
        except Exception:
            tiers_inc = [1]

    risk_cat = record.get('risk_category', 'lower')
    default_risk_label = "Lower Screening Risk" if prob < threshold else "Higher Screening Risk"
    risk_lbl = record.get('risk_label') or default_risk_label

    is_male = module_name == 'male_hypogonadism'

    # Determine or normalize evidence_used
    raw_evidence_used = record.get('evidence_used')
    if isinstance(raw_evidence_used, dict):
        evidence_used = {
            'tier_1': bool(raw_evidence_used.get('tier_1', True)),
            'tier_2': bool(raw_evidence_used.get('tier_2', False)),
            'tier_3_ultrasound': False if is_male else bool(raw_evidence_used.get('tier_3_ultrasound', False)),
        }
    else:
        has_t1 = 1 in tiers_inc or level in ('tier_1', 'tier_1_2', 'tier_1_3', 'tier_1_2_3')
        has_t2 = 2 in tiers_inc or level in ('tier_1_2', 'tier_1_2_3')
        has_t3 = (3 in tiers_inc or level in ('tier_1_3', 'tier_1_2_3')) and not is_male
        evidence_used = {
            'tier_1': has_t1,
            'tier_2': has_t2,
            'tier_3_ultrasound': has_t3,
        }

    # Strict evidence isolation based on what was used in THIS assessment
    has_t2_evidence = bool(evidence_used.get('tier_2'))
    has_t3_evidence = bool(evidence_used.get('tier_3_ultrasound')) and not is_male

    if not has_t2_evidence:
        tier_2_inputs = {}
        authoritative_tier_2 = {}
        direct_laboratory_values = []
        hormone_pattern_interpretation = None
        tier_2_available_count = 0
        tier_2_total_count = None
        tier_2_available_fields = []
        tier_2_missing_fields = []
    else:
        tier_2_inputs = record.get('tier_2_inputs', {})
        authoritative_tier_2 = record.get('authoritative_tier_2_inputs', tier_2_inputs)
        direct_laboratory_values = record.get('direct_laboratory_values', [])
        hormone_pattern_interpretation = record.get('hormone_pattern_interpretation')
        tier_2_available_count = record.get('tier_2_available_count')
        tier_2_total_count = record.get('tier_2_total_count')
        tier_2_available_fields = record.get('tier_2_available_fields', [])
        tier_2_missing_fields = record.get('tier_2_missing_fields', [])

    if not has_t3_evidence or is_male:
        pcom_status = None
        pcom_probability = None
        gradcam_url = None
        gradcam_b64 = None
        ultrasound_report_id = None
    else:
        pcom_status = record.get('pcom_status')
        pcom_probability = record.get('pcom_probability')
        gradcam_url = record.get('gradcam_url')
        gradcam_b64 = record.get('gradcam_b64')
        ultrasound_report_id = record.get('ultrasound_report_id')

    input_features = record.get('input_features', {})
    authoritative_tier_1 = record.get('authoritative_tier_1_inputs', input_features)

    # Historical availability
    avail_hist = record.get('available_historical_evidence')
    if not isinstance(avail_hist, dict):
        avail_hist = {
            'tier_1': bool(authoritative_tier_1),
            'tier_2': bool(authoritative_tier_2 or record.get('tier_2_inputs')),
            'tier_3_ultrasound': False if is_male else bool(pcom_status or record.get('pcom_status')),
        }

    input_hash = record.get('input_hash')
    if not input_hash:
        try:
            from apps.intelligence.services.screening_hash import compute_canonical_input_hash
            raw_hash_source = authoritative_tier_1 or input_features or record.get('tier_1_inputs') or {}
            input_hash = compute_canonical_input_hash(raw_hash_source, module=module_name)
        except Exception:
            input_hash = ''

    return {
        'assessment_id': str(record.get('assessment_id') or record.get('id', '')),
        'id': str(record.get('id') or record.get('assessment_id', '')),
        'module': module_name,
        'input_hash': input_hash,
        'assessment_level': level,
        'tiers_included': tiers_inc,
        'model_version': record.get('model_version', '1.0.0'),
        'model_name': record.get('model_name', 'PMOSense Assessment Model'),
        'probability': round(prob, 4),
        'probability_percent': round(prob * 100, 1),
        'threshold': threshold,
        'risk_category': risk_cat,
        'risk_label': risk_lbl,
        'summary_text': record.get('summary_text', ''),
        'replaced_assessment_id': record.get('replaced_assessment_id'),
        'available_features': record.get('available_features', []),
        'missing_features': record.get('missing_features', []),
        'explanations': record.get('explanations', []),
        'shap_explanation': record.get('shap_explanation'),
        'longitudinal_shap_comparison': record.get('longitudinal_shap_comparison'),
        'limitations': record.get('limitations', []),
        'next_available_tier': record.get('next_available_tier'),
        'pcom_status': pcom_status,
        'pcom_probability': pcom_probability,
        'gradcam_url': gradcam_url,
        'gradcam_b64': gradcam_b64,
        'ultrasound_report_id': ultrasound_report_id,
        'is_active': bool(record.get('is_active', True)),
        'tier_2_available_count': tier_2_available_count,
        'tier_2_total_count': tier_2_total_count,
        'tier_2_available_fields': tier_2_available_fields,
        'tier_2_missing_fields': tier_2_missing_fields,
        'evidence_completeness_percent': record.get('evidence_completeness_percent'),
        'evidence_completeness': record.get('evidence_completeness', {}),
        'hormone_pattern_interpretation': hormone_pattern_interpretation,
        'direct_laboratory_values': direct_laboratory_values,
        'tier_2_inputs': tier_2_inputs,
        'authoritative_tier_2_inputs': authoritative_tier_2,
        'input_features': input_features,
        'authoritative_tier_1_inputs': authoritative_tier_1,
        'evidence_used': evidence_used,
        'available_historical_evidence': avail_hist,
        'status_code': record.get('status_code'),
        'notice': record.get('notice'),
        'next_step': record.get('next_step', ''),
        'disclaimer': record.get('disclaimer', MEDICAL_DISCLAIMER),
        'created_at': record.get('created_at'),
    }

