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
        if p.height_cm:
            inputs['height_cm'] = float(p.height_cm)
        if p.weight_kg:
            inputs['weight_kg'] = float(p.weight_kg)
        if p.cycle_length:
            try:
                inputs['cycle_length_raw'] = float(p.cycle_length)
            except Exception:
                inputs['cycle_length_raw'] = 28.0
        if p.period_regularity:
            inputs['cycle_regularity'] = 1 if 'irreg' in p.period_regularity.lower() else 0

        # Calculate approximate age from date of birth
        if p.date_of_birth:
            try:
                from datetime import date
                dob = date.fromisoformat(str(p.date_of_birth))
                today = date.today()
                inputs['age'] = float(today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day)))
            except Exception:
                inputs['age'] = 25.0

        # Common symptoms list parsing
        symptoms = [s.lower() for s in getattr(p, 'common_symptoms', []) or []]
        inputs['hirsutism'] = 1 if any('hair' in s or 'hirsutism' in s for s in symptoms) else 0
        inputs['skin_darkening'] = 1 if any('dark' in s or 'acanthosis' in s for s in symptoms) else 0
        inputs['hair_loss'] = 1 if any('loss' in s or 'thinning' in s or 'alopecia' in s for s in symptoms) else 0
        inputs['pimples_acne'] = 1 if any('acne' in s or 'pimple' in s for s in symptoms) else 0
        inputs['weight_gain'] = 1 if any('weight' in s or 'gain' in s for s in symptoms) else 0

        # Lifestyle flags
        if p.fast_food_intake:
            inputs['fast_food'] = 1 if p.fast_food_intake in ('frequent', 'daily', 'often') else 0
        if p.regular_exercise is not None:
            inputs['regular_exercise'] = 1 if p.regular_exercise else 0

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
# Progressive Assessment Execution Functions
# ---------------------------------------------------------------------------

def run_tier1_assessment(
    patient_uuid: str,
    auth_token: str | None = None,
    client_health_data: dict | None = None,
) -> dict[str, Any]:
    """
    Executes Tier 1 assessment, saves it as the active assessment, and returns standardized response.
    """
    health_data = health_service.fetch_all(patient_uuid, auth_token=auth_token, client_health_data=client_health_data)
    inputs = extract_patient_raw_inputs(health_data, client_health_data)

    res = pcos_ml_service.predict_tier1(inputs)
    res['input_features'] = inputs
    res['input_availability'] = {
        'tier_1_complete': True,
        'tier_2_clinical_available': False,
        'tier_3_ultrasound_available': False,
    }

    # Save as active in repository (transactional replacement)
    saved = assessment_repository.save_assessment(patient_uuid, res, make_active=True, auth_token=auth_token)
    return format_assessment_response(saved)


def run_tier2_assessment(
    patient_uuid: str,
    auth_token: str | None = None,
    client_health_data: dict | None = None,
    clinical_inputs: dict | None = None,
) -> dict[str, Any]:
    """
    Executes cumulative Tier 2 assessment (Tier 1 + Clinical Labs),
    supporting partial clinical inputs, PATCH-style progressive merging,
    replaces active Tier 1 result, and preserves history.
    """
    logger.info(f"[ASSESSMENT_PIPELINE] STAGE: ASSESSMENT_REQUEST_RECEIVED | type=pcos_tier2 | patient={patient_uuid}")
    health_data = health_service.fetch_all(patient_uuid, auth_token=auth_token, client_health_data=client_health_data)
    base_tier1_inputs = extract_patient_raw_inputs(health_data, client_health_data)

    # 1. Fetch previously active assessment to support PATCH merge semantics
    active_prev = assessment_repository.get_active_assessment(patient_uuid, auth_token=auth_token)
    merged_clinical: dict[str, float] = {}

    if active_prev:
        prev_inputs = active_prev.get('tier_2_inputs')
        if not prev_inputs and isinstance(active_prev.get('input_features'), dict):
            prev_inputs = {
                k: v for k, v in active_prev['input_features'].items()
                if k in CLINICAL_FIELD_RANGES and v is not None and v != '' and not (isinstance(v, float) and np.isnan(v))
            }
        if isinstance(prev_inputs, dict):
            for k, v in prev_inputs.items():
                if k in CLINICAL_FIELD_RANGES and v is not None and v != '':
                    try:
                        fval = float(v)
                        if not np.isnan(fval):
                            merged_clinical[k] = fval
                    except (ValueError, TypeError):
                        pass

    # 2. Extract explicit removals (e.g. remove_fields: ['tsh'])
    remove_fields: list[str] = []
    if clinical_inputs:
        if isinstance(clinical_inputs.get('remove_fields'), list):
            remove_fields.extend(clinical_inputs['remove_fields'])
        if isinstance(clinical_inputs.get('removed_fields'), list):
            remove_fields.extend(clinical_inputs['removed_fields'])

        for rf in remove_fields:
            merged_clinical.pop(rf, None)

        # 3. Validate and merge incoming clinical inputs
        for k, v in clinical_inputs.items():
            if k in ('remove_fields', 'removed_fields'):
                continue
            if k in CLINICAL_FIELD_RANGES:
                if k in remove_fields:
                    continue
                parsed = validate_clinical_value(k, v)
                if parsed is not None:
                    merged_clinical[k] = parsed
                # If parsed is None and not in remove_fields, do not erase previously saved value!

    # 4. Require at least one valid Tier 2 clinical/laboratory value
    if not merged_clinical:
        raise ValueError("At least one valid clinical or laboratory measurement is required to run a Tier 2 assessment.")

    # 5. Synthesize Tier 1 + merged Tier 2 data
    combined_inputs = {**base_tier1_inputs, **merged_clinical}

    # 6. Execute cumulative model inference
    res = pcos_ml_service.predict_tier2_cumulative(combined_inputs)
    res['tier_2_inputs'] = merged_clinical
    res['input_features'] = combined_inputs
    res['input_availability'] = {
        'tier_1_complete': True,
        'tier_2_clinical_available': True,
        'tier_3_ultrasound_available': False,
    }

    # 7. Save as active in repository, replacing Tier 1 (or prior partial Tier 2) while keeping history
    saved = assessment_repository.save_assessment(patient_uuid, res, make_active=True, auth_token=auth_token)
    return format_assessment_response(saved)


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
      and leaves previous Tier 1 as active assessment.
    """
    logger.info(f"[ASSESSMENT_PIPELINE] STAGE: ASSESSMENT_REQUEST_RECEIVED | type=ultrasound | patient={patient_uuid}")
    health_data = health_service.fetch_all(patient_uuid, auth_token=auth_token, client_health_data=client_health_data)
    inputs = extract_patient_raw_inputs(health_data, client_health_data)

    # Check if clinical labs / Tier 2 are present
    active_prev = assessment_repository.get_active_assessment(patient_uuid, auth_token=auth_token)
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
        res['ultrasound_report_id'] = report_id
        res['input_features'] = inputs
        if active_prev and active_prev.get('tier_2_inputs'):
            res['tier_2_inputs'] = active_prev['tier_2_inputs']
        res['input_availability'] = {
            'tier_1_complete': True,
            'tier_2_clinical_available': True,
            'tier_3_ultrasound_available': True,
        }
        saved = assessment_repository.save_assessment(patient_uuid, res, make_active=True, auth_token=auth_token)
        logger.info(f"[ASSESSMENT_PIPELINE] STAGE: ULTRASOUND_ASSESSMENT_SAVED | patient={patient_uuid} | level=tier_1_2_3")
        return format_assessment_response(saved)
    else:
        # Safe Tier 1+3 Handling: Ultrasound analyzed for morphology, but combined ML requires clinical labs
        img_res = pcos_ml_service.process_ultrasound_image(pil_image)
        active_t1 = active_prev or run_tier1_assessment(patient_uuid, auth_token=auth_token, client_health_data=client_health_data)

        # Build response with morphology details while keeping Tier 1 active
        response = dict(active_t1)
        response['pcom_status'] = img_res['pcom_status']
        response['pcom_probability'] = img_res['pcom_probability']
        response['gradcam_b64'] = img_res['gradcam_b64']
        response['status_code'] = 'tier_1_3_model_unavailable'
        response['notice'] = (
            "Ultrasound image was successfully processed and analyzed for polycystic ovarian morphology (PCOM). "
            "However, an integrated multimodal AI screening score requires clinical laboratory biomarkers. "
            "Please add your clinical lab results for a complete Tier 1 + Clinical + Ultrasound assessment."
        )
        response['next_available_tier'] = 2
        input_avail = dict(response.get('input_availability') or {})
        input_avail['tier_3_ultrasound_available'] = True
        response['input_availability'] = input_avail

        # Persist so refreshing or reloading doesn't wipe ultrasound analysis
        saved = assessment_repository.save_assessment(patient_uuid, response, make_active=True, auth_token=auth_token)
        logger.info(f"[ASSESSMENT_PIPELINE] STAGE: ULTRASOUND_ASSESSMENT_SAVED | patient={patient_uuid} | level=tier_1_3_partial")
        return format_assessment_response(saved)


def _get_val(obj: Any, key: str, default: Any = None) -> Any:
    """Helper to safely get an attribute or key from either a dict or object."""
    if obj is None:
        return default
    if isinstance(obj, dict):
        return obj.get(key, default)
    return getattr(obj, key, default)


def run_male_tier1_assessment(
    patient_uuid: str,
    input_data: dict[str, Any] | None = None,
    auth_token: str | None = None,
    client_health_data: dict | None = None,
) -> dict[str, Any]:
    """
    Executes Male Hypogonadism Tier 1 screening assessment.
    """
    raw_inputs: dict[str, Any] = {}
    passed_data = input_data or client_health_data or {}

    direct_keys = {
        'age', 'height_cm', 'weight_kg', 'waist_cm', 'low_energy',
        'sleep_trouble', 'low_mood', 'low_interest', 'high_blood_pressure', 'diabetes'
    }

    # If any direct features were passed at top level
    if any(k in passed_data for k in direct_keys):
        raw_inputs.update(passed_data)
    else:
        # Extract from profile / health service
        if "userProfile" in passed_data:
            p = passed_data["userProfile"]
        else:
            hd = health_service.fetch_all(patient_uuid, auth_token=auth_token)
            p = getattr(hd, "profile", {}) or {}

        # Calculate age from date of birth
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

    # Run inference via male_ml_service
    result = male_ml_service.predict_tier1(raw_inputs)

    # Save to assessment repository as active male assessment
    record = assessment_repository.save_assessment(
        user_id=patient_uuid,
        assessment_data=result,
        make_active=True,
        auth_token=auth_token,
    )
    return format_assessment_response(record)


def run_male_tier2_assessment(
    patient_uuid: str,
    lab_inputs: dict[str, Any] | None = None,
    clinical_inputs: dict[str, Any] | None = None,
    auth_token: str | None = None,
    client_health_data: dict | None = None,
) -> dict[str, Any]:
    """
    Executes Male Hypogonadism Tier 2 clinical & laboratory assessment.
    Merges with previous inputs using PATCH semantics.
    """
    logger.info(f"[ASSESSMENT_PIPELINE] STAGE: ASSESSMENT_REQUEST_RECEIVED | type=male_tier2 | patient={patient_uuid}")
    actual_inputs = lab_inputs or clinical_inputs or {}

    active_prev = assessment_repository.get_active_assessment(patient_uuid, module="male_hypogonadism", auth_token=auth_token)
    prev_tier2_inputs = active_prev.get("tier_2_inputs", {}) if active_prev else {}
    prev_input_features = active_prev.get("input_features", {}) if active_prev else {}

    validated_new_inputs: dict[str, Any] = {}
    remove_fields = actual_inputs.get("remove_fields", []) or actual_inputs.get("removed_fields", []) or []

    for k, v in actual_inputs.items():
        if k in ["remove_fields", "removed_fields"]:
            continue
        validated_val = validate_male_clinical_value(k, v)
        if validated_val is not None:
            validated_new_inputs[k] = validated_val

    # PATCH Merge
    merged_labs: dict[str, Any] = dict(prev_tier2_inputs)
    for k in remove_fields:
        merged_labs.pop(k, None)
    merged_labs.update(validated_new_inputs)

    # Check that at least 1 lab measurement is present
    if not merged_labs:
        raise ValueError("Please provide at least one clinical or laboratory result to run a male Tier 2 assessment.")

    # Run Tier 2 inference
    result = male_ml_service.predict_tier2(merged_labs, tier1_inputs=prev_input_features)

    # Save as active male assessment
    record = assessment_repository.save_assessment(
        user_id=patient_uuid,
        assessment_data=result,
        make_active=True,
        auth_token=auth_token,
    )
    logger.info(f"[ASSESSMENT_PIPELINE] STAGE: MALE_TIER2_SAVED | patient={patient_uuid}")
    return format_assessment_response(record)


def run_assessment(
    patient_uuid: str,
    auth_token: str | None = None,
    client_health_data: dict | None = None,
    module: str | None = None,
) -> dict[str, Any]:
    """
    Unified assessment endpoint: returns the active assessment if present,
    or executes Tier 1 / Tier 2 based on available health data.
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
        return format_assessment_response(active)

    if module == "male_hypogonadism":
        return run_male_tier1_assessment(patient_uuid, auth_token=auth_token, client_health_data=client_health_data)

    # If no active assessment exists, run female Tier 1
    return run_tier1_assessment(patient_uuid, auth_token=auth_token, client_health_data=client_health_data)


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
    Ensures the response dictionary strictly adheres to the unified specification.
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

    return {
        'assessment_id': str(record.get('assessment_id') or record.get('id', '')),
        'id': str(record.get('id') or record.get('assessment_id', '')),
        'module': module_name,
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
        'limitations': record.get('limitations', []),
        'next_available_tier': record.get('next_available_tier'),
        'pcom_status': record.get('pcom_status'),
        'pcom_probability': record.get('pcom_probability'),
        'gradcam_url': record.get('gradcam_url'),
        'gradcam_b64': record.get('gradcam_b64'),
        'is_active': bool(record.get('is_active', True)),
        'tier_2_available_count': record.get('tier_2_available_count'),
        'tier_2_total_count': record.get('tier_2_total_count'),
        'tier_2_available_fields': record.get('tier_2_available_fields', []),
        'tier_2_missing_fields': record.get('tier_2_missing_fields', []),
        'evidence_completeness_percent': record.get('evidence_completeness_percent'),
        'evidence_completeness': record.get('evidence_completeness', {}),
        'hormone_pattern_interpretation': record.get('hormone_pattern_interpretation'),
        'direct_laboratory_values': record.get('direct_laboratory_values', []),
        'tier_2_inputs': record.get('tier_2_inputs', {}),
        'input_features': record.get('input_features', {}),
        'status_code': record.get('status_code'),
        'notice': record.get('notice'),
        'next_step': record.get('next_step', ''),
        'disclaimer': record.get('disclaimer', MEDICAL_DISCLAIMER),
        'created_at': record.get('created_at'),
    }

