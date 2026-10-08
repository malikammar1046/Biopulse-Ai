"""
backend/apps/intelligence/services/lifestyle_context_builder.py

Lifestyle Context Builder for BioPulse AI.
Gathers and normalizes comprehensive patient context across:
- Patient Profile (biometrics, demographics, dietary preferences, restrictions)
- Screening Result (active assessment, probability, risk level, assessment tier)
- Logged Symptoms (recent frequency, severity, active clinical patterns)
- Verified Laboratory Biomarkers (glucose, insulin, testosterone, lipids, etc.)
- Longitudinal Trends (weight trajectory, activity adherence, biomarker trends)
- SHAP Feature Attributions (top driving risk factors & protective factors)

Guarantees 100% independence from legacy Meal Directory.
"""

from __future__ import annotations

import hashlib
import json
import logging
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Set

from apps.health.services.supabase_health_service import health_service, PatientHealthData
from apps.health.nutrition_vocabularies import (
    normalize_food_allergens,
    normalize_food_intolerances,
    normalize_dietary_pattern,
    CanonicalAllergen,
    CanonicalIntolerance,
    DietaryPattern,
)
from apps.intelligence.services.assessment_repository import assessment_repository
from apps.intelligence.services.clinical_state_repository import clinical_state_repository
from apps.intelligence.services.canonical_shap_registry import CANONICAL_SHAP_REGISTRY, get_feature_metadata

logger = logging.getLogger(__name__)


@dataclass
class PatientDemographics:
    user_id: str
    gender: str  # 'female' | 'male'
    pathway: str  # 'female_pcos' | 'male_hypogonadism' | 'general'
    age: Optional[int] = None
    height_cm: Optional[float] = None
    weight_kg: Optional[float] = None
    bmi: Optional[float] = None
    waist_cm: Optional[float] = None
    waist_inch: Optional[float] = None
    hip_inch: Optional[float] = None
    waist_hip_ratio: Optional[float] = None
    dietary_preference: str = "omnivore"  # 'omnivore', 'halal_omnivore', 'vegetarian', 'vegan', 'pescatarian'
    allergens: List[str] = field(default_factory=list)
    intolerances: List[str] = field(default_factory=list)
    allergy_status: str = "unrecorded"  # 'unrecorded' | 'confirmed_none' | 'active_allergens'
    non_food_allergies: List[str] = field(default_factory=list)
    activity_level: Optional[str] = None  # 'sedentary', 'light', 'moderate', 'active', 'very_active'
    sleep_hours: Optional[float] = None
    stress_level: Optional[str] = None  # 'low', 'moderate', 'high', 'severe'
    regular_exercise: Optional[bool] = None
    fast_food_intake: Optional[str] = None  # 'frequent', 'occasional', 'rare_never'
    period_regularity: Optional[str] = None  # 'regular', 'irregular', 'very_irregular'
    skin_darkening: Optional[bool] = None
    hair_growth: Optional[bool] = None
    acne: Optional[bool] = None
    profile_updated_at: Optional[str] = None


@dataclass
class ScreeningContext:
    has_assessment: bool = False
    module: str = "female_pcos"
    assessment_id: Optional[str] = None
    assessment_level: str = "tier_1"  # 'tier_1', 'tier_1_2', 'tier_1_2_3'
    risk_category: str = "lower"  # 'lower', 'moderate', 'elevated'
    risk_label: str = "Lower Screening Risk"
    probability: float = 0.0
    probability_percent: float = 0.0
    threshold: float = 0.25
    is_active: bool = False
    created_at: Optional[str] = None


@dataclass
class ShapFactor:
    feature_name: str
    display_name: str
    impact: str  # 'increases_risk' | 'decreases_risk'
    shap_value: float
    patient_value: Any
    category: str
    unit: str = ""
    clinical_note: str = ""


@dataclass
class SymptomSummary:
    active_symptoms: List[str] = field(default_factory=list)
    symptom_frequencies: Dict[str, int] = field(default_factory=dict)
    high_severity_symptoms: List[str] = field(default_factory=list)
    total_logs_30d: int = 0


@dataclass
class LabBiomarkers:
    fasting_glucose_mg_dl: Optional[float] = None
    hba1c_percent: Optional[float] = None
    fasting_insulin_uIU_ml: Optional[float] = None
    total_testosterone_ng_dl: Optional[float] = None
    free_testosterone_pg_ml: Optional[float] = None
    lh_mIU_ml: Optional[float] = None
    fsh_mIU_ml: Optional[float] = None
    lh_fsh_ratio: Optional[float] = None
    prolactin_ng_ml: Optional[float] = None
    dhea_s_ug_dl: Optional[float] = None
    triglycerides_mg_dl: Optional[float] = None
    hdl_mg_dl: Optional[float] = None
    ldl_mg_dl: Optional[float] = None
    total_cholesterol_mg_dl: Optional[float] = None
    crp_mg_l: Optional[float] = None
    vitamin_d_ng_ml: Optional[float] = None
    raw_markers: Dict[str, Any] = field(default_factory=dict)


@dataclass
class LongitudinalSummary:
    has_history: bool = False
    assessment_count: int = 0
    weight_trend_30d: Optional[str] = None  # 'stable', 'increasing', 'decreasing', None
    weight_delta_kg: Optional[float] = None
    probability_trend: Optional[str] = None  # 'improving', 'worsening', 'stable', None
    probability_delta: Optional[float] = None
    activity_adherence_improved: Optional[bool] = None
    symptoms_improved: Optional[bool] = None
    logged_meals_30d: int = 0
    logged_fitness_30d: int = 0
    active_tracking_consistency_pct: float = 0.0
    top_recurring_symptoms: List[str] = field(default_factory=list)


@dataclass
class ComprehensiveLifestyleContext:
    user_id: str
    demographics: PatientDemographics
    screening: ScreeningContext = field(default_factory=ScreeningContext)
    shap_drivers: List[ShapFactor] = field(default_factory=list)
    shap_mitigators: List[ShapFactor] = field(default_factory=list)
    symptoms: SymptomSummary = field(default_factory=SymptomSummary)
    labs: LabBiomarkers = field(default_factory=LabBiomarkers)
    longitudinal: LongitudinalSummary = field(default_factory=LongitudinalSummary)
    missing_data: List[str] = field(default_factory=list)
    personalization_level: str = "LEVEL_1_PROFILE"  # 'LEVEL_1_PROFILE', 'LEVEL_2_SCREENING', 'LEVEL_3_CLINICAL', 'LEVEL_4_LONGITUDINAL'
    context_version: str = ""
    generated_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class LifestyleContextBuilder:
    """
    Authoritative builder that constructs ComprehensiveLifestyleContext from verified
    patient health records, active screening assessments, and longitudinal trends.
    """

    @staticmethod
    def normalize_module(module: Optional[str], gender: Optional[str] = None) -> str:
        m = str(module or "").strip().lower()
        if m in ("ovasense", "pcos", "female_pcos", "female"):
            return "female_pcos"
        if m in ("androsense", "hypogonadism", "male_hypogonadism", "male"):
            return "male_hypogonadism"
        g = str(gender or "").strip().lower()
        if g == "male":
            return "male_hypogonadism"
        return "female_pcos"

    @classmethod
    def build_context(
        cls,
        user_id: str,
        module: Optional[str] = None,
        auth_token: Optional[str] = None,
    ) -> ComprehensiveLifestyleContext:
        user_id_str = str(user_id).strip()

        # 1. Fetch raw health data bundle scoped to authenticated patient
        try:
            health_data = health_service.fetch_all(user_id_str, auth_token=auth_token)
        except Exception as e:
            logger.warning("Failed fetching health data for user %s: %s", user_id_str[:8], e)
            health_data = None

        profile_obj = getattr(health_data, "profile", None) if health_data else None

        # 2. Extract demographics with robust pathway resolution
        gender = None
        pathway = None
        if profile_obj:
            gender = getattr(profile_obj, "gender", None) or (
                profile_obj.get("gender") if isinstance(profile_obj, dict) else None
            )
            pathway = getattr(profile_obj, "pathway", None) or (
                profile_obj.get("pathway") if isinstance(profile_obj, dict) else None
            )

        if not gender and not pathway and auth_token:
            try:
                import jwt
                payload = jwt.decode(auth_token, options={"verify_signature": False})
                user_meta = payload.get("user_metadata", {}) or {}
                gender = user_meta.get("gender")
                pathway = user_meta.get("pathway")
            except Exception:
                pass

        if not gender and not pathway and not module:
            try:
                act_m = assessment_repository.get_active_assessment(
                    user_id_str, module="male_hypogonadism", auth_token=auth_token
                )
                if act_m and act_m.get("has_assessment") is not False:
                    gender = "male"
                    pathway = "male_hypogonadism"
            except Exception:
                pass

        canonical_module = cls.normalize_module(module or pathway, gender=gender)
        module = canonical_module
        pathway = canonical_module
        gender = "male" if canonical_module == "male_hypogonadism" else "female"
        age = None
        height_cm = None
        weight_kg = None
        waist_cm = None
        waist_inch = None
        hip_inch = None
        raw_dietary_pref = "omnivore"
        raw_allergens_list: List[str] = []
        raw_intolerances_list: List[str] = []
        activity_level = None
        sleep_hours = None
        stress_level = None
        regular_exercise = None
        fast_food_intake = None
        period_regularity = None
        skin_darkening = None
        hair_growth = None
        acne = None

        if profile_obj:
            age = getattr(profile_obj, "age", None) or (
                profile_obj.get("age") if isinstance(profile_obj, dict) else None
            )
            # Canonical derivation from date_of_birth if age is not stored directly
            dob_val = (
                getattr(profile_obj, "date_of_birth", None)
                or (profile_obj.get("date_of_birth") if isinstance(profile_obj, dict) else None)
                or getattr(profile_obj, "dateOfBirth", None)
                or (profile_obj.get("dateOfBirth") if isinstance(profile_obj, dict) else None)
            )
            if age is None and dob_val:
                try:
                    from apps.health.services.meal_profile_builder import calculate_age_and_decimal
                    derived_age, _ = calculate_age_and_decimal(dob_val)
                    age = derived_age
                except Exception:
                    try:
                        from datetime import date, datetime
                        dob_str = str(dob_val)[:10]
                        dob_dt = datetime.strptime(dob_str, "%Y-%m-%d").date()
                        today = date.today()
                        age = today.year - dob_dt.year - ((today.month, today.day) < (dob_dt.month, dob_dt.day))
                    except Exception:
                        pass

            height_cm = getattr(profile_obj, "height_cm", None) or (
                profile_obj.get("height_cm") if isinstance(profile_obj, dict) else None
            )
            weight_kg = getattr(profile_obj, "weight_kg", None) or (
                profile_obj.get("weight_kg") if isinstance(profile_obj, dict) else None
            )
            waist_cm = getattr(profile_obj, "waist_cm", None) or (
                profile_obj.get("waist_cm") if isinstance(profile_obj, dict) else None
            )
            waist_inch = getattr(profile_obj, "waist_inch", None) or (
                profile_obj.get("waist_inch") if isinstance(profile_obj, dict) else None
            )
            hip_inch = getattr(profile_obj, "hip_inch", None) or (
                profile_obj.get("hip_inch") if isinstance(profile_obj, dict) else None
            )
            if waist_inch is None and getattr(profile_obj, "waist_cm", None) is not None:
                try:
                    waist_inch = round(float(profile_obj.waist_cm) / 2.54, 1)
                except (ValueError, TypeError):
                    pass
            if hip_inch is None and getattr(profile_obj, "hip_cm", None) is not None:
                try:
                    hip_inch = round(float(profile_obj.hip_cm) / 2.54, 1)
                except (ValueError, TypeError):
                    pass
            regular_exercise = getattr(profile_obj, "regular_exercise", None)
            fast_food_intake = getattr(profile_obj, "fast_food_intake", None)
            period_regularity = getattr(profile_obj, "period_regularity", None)
            activity_level = getattr(profile_obj, "activity_level", None)
            sleep_hours = getattr(profile_obj, "sleep_hours", None)

            # Direct waist conversion if waist_inch missing but waist_cm present
            if waist_inch is None and waist_cm is not None:
                try:
                    waist_inch = round(float(waist_cm) / 2.54, 1)
                except (ValueError, TypeError):
                    pass

            # Direct dietary preference extraction
            raw_dietary_pref = (
                getattr(profile_obj, "dietary_preference", None)
                or raw_dietary_pref
            )

            # Direct authoritative allergy sources from PatientProfile
            if getattr(profile_obj, "allergies", None):
                raw_allergens_list.extend(getattr(profile_obj, "allergies", []))
            if getattr(profile_obj, "food_allergies", None):
                raw_allergens_list.extend(getattr(profile_obj, "food_allergies", []))
            if getattr(profile_obj, "food_intolerances", None):
                raw_intolerances_list.extend(getattr(profile_obj, "food_intolerances", []))

            # Common symptoms list
            cs = [str(s).lower() for s in (getattr(profile_obj, "common_symptoms", []) or [])]
            skin_darkening = any("dark" in s or "acanthosis" in s for s in cs)
            hair_growth = any("hair" in s or "hirsutism" in s for s in cs)
            acne = any("acne" in s or "pimple" in s for s in cs)

            # Preferences & lifestyle overrides
            lifestyle_data = getattr(profile_obj, "lifestyle", {})
            if isinstance(lifestyle_data, dict):
                raw_dietary_pref = (
                    lifestyle_data.get("dietaryPreference")
                    or lifestyle_data.get("dietary_preference")
                    or raw_dietary_pref
                )
                if lifestyle_data.get("allergens"):
                    raw_allergens_list.extend(lifestyle_data["allergens"])
                if lifestyle_data.get("intolerances"):
                    raw_intolerances_list.extend(lifestyle_data["intolerances"])
                activity_level = lifestyle_data.get("activityLevel") or lifestyle_data.get("activity_level") or activity_level
                if sleep_hours is None and (lifestyle_data.get("sleepHours") or lifestyle_data.get("sleep_hours")):
                    try:
                        sleep_hours = float(lifestyle_data.get("sleepHours") or lifestyle_data.get("sleep_hours"))
                    except (ValueError, TypeError):
                        pass
                stress_level = lifestyle_data.get("stressLevel") or lifestyle_data.get("stress_level") or stress_level

        # --- Canonical Normalization Layer ---
        # 1. Allergies & Intolerances normalization (handling None, synonyms, non-food exclusions)
        has_explicit_none = any(str(x).strip().lower() in ("none", "no allergies", "no known allergies", "[]") for x in raw_allergens_list)
        norm_allergens, non_food_allergens, unmapped_from_allergies = normalize_food_allergens(raw_allergens_list)
        norm_intolerances, _ = normalize_food_intolerances(raw_intolerances_list + unmapped_from_allergies)

        # Distinguish Dairy Allergy vs Lactose Intolerance:
        # If user explicitly entered "Dairy / Lactose" or "lactose", ensure lactose intolerance is captured
        is_lactose_mentioned = any("lactose" in str(x).lower() for x in (raw_allergens_list + raw_intolerances_list))
        if is_lactose_mentioned and CanonicalIntolerance.LACTOSE.value not in norm_intolerances:
            norm_intolerances.append(CanonicalIntolerance.LACTOSE.value)

        # Ensure "none" is never stored as an allergen
        final_allergens = sorted([a for a in norm_allergens if a and a != "none"])
        final_intolerances = sorted([i for i in norm_intolerances if i and i != "none"])

        if final_allergens or final_intolerances:
            allergy_status = "active_allergens"
        elif has_explicit_none:
            allergy_status = "confirmed_none"
        else:
            allergy_status = "unrecorded"

        # 2. Dietary Pattern normalization
        norm_diet = normalize_dietary_pattern(raw_dietary_pref)
        canonical_dietary_pattern = norm_diet.value if norm_diet else "omnivore"

        # 3. Retrieve Active Screening Assessment (Respecting true no-assessment state)
        active_rec = assessment_repository.get_active_assessment(user_id_str, module=module, auth_token=auth_token)
        has_assessment = bool(
            active_rec
            and not active_rec.get("error")
            and active_rec.get("has_assessment") is not False
        )

        screening = ScreeningContext(
            has_assessment=has_assessment,
            module=module,
            assessment_id=active_rec.get("id") if has_assessment else None,
            assessment_level=active_rec.get("assessment_level", "tier_1") if has_assessment else "none",
            risk_category=active_rec.get("risk_category", "unscreened") if has_assessment else "unscreened",
            risk_label=active_rec.get("risk_label", "Screening Pending") if has_assessment else "Screening Pending",
            probability=float(active_rec.get("probability", 0.0)) if has_assessment else 0.0,
            probability_percent=float(active_rec.get("probability_percent", 0.0)) if has_assessment else 0.0,
            threshold=float(active_rec.get("threshold", 0.25)) if has_assessment else 0.25,
            is_active=bool(active_rec.get("is_active", False)) if has_assessment else False,
            created_at=active_rec.get("created_at") if has_assessment else None,
        )

        # Cross-reference active assessment features if profile fields were missing
        if active_rec and isinstance(active_rec.get("features"), dict):
            feats = active_rec["features"]
            if weight_kg is None and ("weight" in feats or "weight_kg" in feats):
                try:
                    weight_kg = float(feats.get("weight") or feats.get("weight_kg"))
                except (ValueError, TypeError):
                    pass
            if height_cm is None and ("height" in feats or "height_cm" in feats):
                try:
                    height_cm = float(feats.get("height") or feats.get("height_cm"))
                except (ValueError, TypeError):
                    pass
            if age is None and "age" in feats:
                try:
                    age = int(feats.get("age"))
                except (ValueError, TypeError):
                    pass
            if regular_exercise is None and "exercise" in feats:
                regular_exercise = bool(feats["exercise"])
            if fast_food_intake is None and "fast_food" in feats:
                fast_food_intake = str(feats["fast_food"])
            if skin_darkening is None and "skin_darkening" in feats:
                skin_darkening = bool(feats["skin_darkening"])
            if hair_growth is None and "hair_growth" in feats:
                hair_growth = bool(feats["hair_growth"])
            if acne is None and "acne" in feats:
                acne = bool(feats["acne"])

        # Calculate BMI strictly from real data
        bmi = None
        if isinstance(weight_kg, (int, float)) and isinstance(height_cm, (int, float)) and height_cm > 0:
            bmi = round(float(weight_kg) / ((float(height_cm) / 100.0) ** 2), 1)

        # Calculate WHR
        waist_hip_ratio = None
        if isinstance(waist_inch, (int, float)) and isinstance(hip_inch, (int, float)) and hip_inch > 0:
            waist_hip_ratio = round(float(waist_inch) / float(hip_inch), 3)

        demographics = PatientDemographics(
            user_id=user_id_str,
            gender=gender,
            pathway=pathway,
            age=int(age) if age is not None else None,
            height_cm=float(height_cm) if height_cm is not None else None,
            weight_kg=float(weight_kg) if weight_kg is not None else None,
            bmi=bmi,
            waist_cm=float(waist_cm) if waist_cm is not None else None,
            waist_inch=float(waist_inch) if waist_inch is not None else None,
            hip_inch=float(hip_inch) if hip_inch is not None else None,
            waist_hip_ratio=waist_hip_ratio,
            dietary_preference=canonical_dietary_pattern,
            allergens=final_allergens,
            intolerances=final_intolerances,
            allergy_status=allergy_status,
            non_food_allergies=non_food_allergens,
            activity_level=str(activity_level).lower() if activity_level else None,
            sleep_hours=float(sleep_hours) if sleep_hours is not None else None,
            stress_level=str(stress_level).lower() if stress_level else None,
            regular_exercise=regular_exercise,
            fast_food_intake=fast_food_intake,
            period_regularity=period_regularity,
            skin_darkening=skin_darkening,
            hair_growth=hair_growth,
            acne=acne,
            profile_updated_at=str(getattr(profile_obj, "updated_at", "") or (profile_obj.get("updated_at", "") if isinstance(profile_obj, dict) else "") or ""),
        )

        # 4. Extract SHAP Factors from Active Assessment
        shap_drivers: List[ShapFactor] = []
        shap_mitigators: List[ShapFactor] = []

        if active_rec:
            features_list: List[Any] = []
            shap_dict = active_rec.get("shap_explanation")
            if isinstance(shap_dict, dict):
                features_list = shap_dict.get("factors") or shap_dict.get("features") or []
            if not features_list and isinstance(active_rec.get("explanations"), list):
                features_list = active_rec.get("explanations") or []

            if isinstance(features_list, list):
                for f in features_list:
                    if not isinstance(f, dict):
                        continue
                    feat_name = f.get("feature_name") or f.get("feature") or f.get("name") or ""
                    raw_val = (
                        f.get("shap_value")
                        if f.get("shap_value") is not None
                        else (f.get("attribution") if f.get("attribution") is not None else f.get("value"))
                    )
                    try:
                        val = float(raw_val or 0.0)
                    except (ValueError, TypeError):
                        val = 0.0

                    patient_val = f.get("patient_value") or f.get("value")
                    meta = get_feature_metadata(feat_name)
                    disp_name = meta.patient_label if meta else (f.get("factor_label") or feat_name.replace("_", " ").title())
                    category = meta.category if meta else "clinical"
                    unit = getattr(meta, "unit", "") or ""

                    factor = ShapFactor(
                        feature_name=feat_name,
                        display_name=disp_name,
                        impact="increases_risk" if val > 0 else "decreases_risk",
                        shap_value=round(val, 4),
                        patient_value=patient_val,
                        category=category,
                        unit=unit,
                        clinical_note=meta.why_model_uses_it if meta else "",
                    )
                    if val > 0:
                        shap_drivers.append(factor)
                    elif val < 0:
                        shap_mitigators.append(factor)

            shap_drivers.sort(key=lambda x: abs(x.shap_value), reverse=True)
            shap_mitigators.sort(key=lambda x: abs(x.shap_value), reverse=True)

        # 5. Extract Symptoms Summary
        symptom_records = getattr(health_data, "symptom_records", []) if health_data else []
        active_symptoms_set: Set[str] = set()
        symptom_counts: Dict[str, int] = {}
        high_severity: List[str] = []

        for r in symptom_records:
            sym_name = None
            raw_severity = 1
            if isinstance(r, dict):
                sym_name = r.get("symptom_type") or r.get("symptom_name") or r.get("name")
                raw_severity = r.get("severity")
            else:
                sym_name = (
                    getattr(r, "symptom_type", None)
                    or getattr(r, "symptom_name", None)
                    or getattr(r, "name", None)
                )
                raw_severity = getattr(r, "severity", 1)

            # Robust severity parsing: handles ints, numeric strings, and descriptive labels ('mild', 'moderate', 'severe')
            severity = 1
            if isinstance(raw_severity, (int, float)):
                try:
                    severity = int(raw_severity)
                except (ValueError, TypeError):
                    severity = 1
            elif isinstance(raw_severity, str):
                s_str = raw_severity.strip().lower()
                if s_str.isdigit():
                    try:
                        severity = int(s_str)
                    except (ValueError, TypeError):
                        severity = 1
                elif any(word in s_str for word in ("sev", "high", "crit")):
                    severity = 3
                elif any(word in s_str for word in ("mod", "med")):
                    severity = 2
                elif any(word in s_str for word in ("mild", "low")):
                    severity = 1

            if sym_name:
                s_clean = str(sym_name).strip().lower()
                active_symptoms_set.add(s_clean)
                symptom_counts[s_clean] = symptom_counts.get(s_clean, 0) + 1
                if severity >= 3 and s_clean not in high_severity:
                    high_severity.append(s_clean)

        # Include profile-level common symptoms if available
        if profile_obj and getattr(profile_obj, "common_symptoms", None):
            for s in profile_obj.common_symptoms:
                if s:
                    s_clean = str(s).strip().lower()
                    active_symptoms_set.add(s_clean)
                    symptom_counts[s_clean] = symptom_counts.get(s_clean, 0) + 1

        symptoms = SymptomSummary(
            active_symptoms=sorted(list(active_symptoms_set)),
            symptom_frequencies=symptom_counts,
            high_severity_symptoms=high_severity,
            total_logs_30d=len(symptom_records),
        )

        # 6. Extract Lab Biomarkers from all available clinical sources:
        # A) Authoritative patient clinical state (Tier 2 labs)
        # B) Active assessment features
        # C) Supabase report_results / medical_reports
        lab_markers = LabBiomarkers()
        raw_labs: Dict[str, Any] = {}

        def _record_lab(key_name: str, val_num: Any) -> None:
            if val_num is None:
                return
            try:
                fval = float(val_num)
            except (ValueError, TypeError):
                return
            k = str(key_name).lower().strip()
            raw_labs[k] = fval
            if "glucose" in k and lab_markers.fasting_glucose_mg_dl is None:
                lab_markers.fasting_glucose_mg_dl = fval
            elif "hba1c" in k and lab_markers.hba1c_percent is None:
                lab_markers.hba1c_percent = fval
            elif "insulin" in k and lab_markers.fasting_insulin_uIU_ml is None:
                lab_markers.fasting_insulin_uIU_ml = fval
            elif "total_testosterone" in k or ("testosterone" in k and "free" not in k):
                if lab_markers.total_testosterone_ng_dl is None:
                    lab_markers.total_testosterone_ng_dl = fval
            elif "free_testosterone" in k and lab_markers.free_testosterone_pg_ml is None:
                lab_markers.free_testosterone_pg_ml = fval
            elif k in ("lh", "luteinizing_hormone") and lab_markers.lh_mIU_ml is None:
                lab_markers.lh_mIU_ml = fval
            elif k in ("fsh", "follicle_stimulating_hormone") and lab_markers.fsh_mIU_ml is None:
                lab_markers.fsh_mIU_ml = fval
            elif "prolactin" in k and lab_markers.prolactin_ng_ml is None:
                lab_markers.prolactin_ng_ml = fval
            elif "dhea" in k and lab_markers.dhea_s_ug_dl is None:
                lab_markers.dhea_s_ug_dl = fval
            elif "triglyceride" in k and lab_markers.triglycerides_mg_dl is None:
                lab_markers.triglycerides_mg_dl = fval
            elif "hdl" in k and lab_markers.hdl_mg_dl is None:
                lab_markers.hdl_mg_dl = fval
            elif "ldl" in k and lab_markers.ldl_mg_dl is None:
                lab_markers.ldl_mg_dl = fval
            elif "cholesterol" in k and lab_markers.total_cholesterol_mg_dl is None:
                lab_markers.total_cholesterol_mg_dl = fval
            elif "crp" in k and lab_markers.crp_mg_l is None:
                lab_markers.crp_mg_l = fval
            elif "vitamin_d" in k and lab_markers.vitamin_d_ng_ml is None:
                lab_markers.vitamin_d_ng_ml = fval

        # A) From Clinical State Repository (Tier 2 labs)
        try:
            clin_state = clinical_state_repository.get_patient_clinical_state(user_id_str, module=module, auth_token=auth_token)
            if clin_state and isinstance(clin_state.get("tier_2_inputs"), dict):
                for k, v in clin_state["tier_2_inputs"].items():
                    _record_lab(k, v)
        except Exception as e:
            logger.debug("Failed querying clinical_state in lifestyle context: %s", e)

        # B) From Active Assessment features
        if active_rec and isinstance(active_rec.get("features"), dict):
            for k, v in active_rec["features"].items():
                _record_lab(k, v)

        # C) From Supabase report_results
        report_results = getattr(health_data, "report_results", []) if health_data else []
        for rep in report_results:
            t_name = getattr(rep, "test_name", None) or (rep.get("test_name") if isinstance(rep, dict) else None)
            res_num = getattr(rep, "result_numeric", None) or (rep.get("result_numeric") if isinstance(rep, dict) else None)
            if t_name and res_num is not None:
                _record_lab(t_name, res_num)

        # D) From legacy medical_reports if present
        medical_reports = getattr(health_data, "medical_reports", []) if health_data else []
        for rep in medical_reports:
            results = getattr(rep, "results", None) or (rep.get("results") if isinstance(rep, dict) else None)
            if isinstance(results, list):
                for marker in results:
                    if isinstance(marker, dict):
                        k = marker.get("marker_key") or marker.get("name") or ""
                        val = marker.get("value")
                        _record_lab(k, val)

        if lab_markers.lh_mIU_ml and lab_markers.fsh_mIU_ml and lab_markers.fsh_mIU_ml > 0:
            lab_markers.lh_fsh_ratio = round(lab_markers.lh_mIU_ml / lab_markers.fsh_mIU_ml, 2)
        lab_markers.raw_markers = raw_labs

        # 7. Extract Longitudinal Assessment History & Biometric Trends
        history = assessment_repository.get_assessment_history(user_id_str, module=module, auth_token=auth_token)
        has_history = len(history) > 1
        assessment_count = len(history)

        weight_trend = None
        weight_delta = None
        prob_trend = None
        prob_delta = None

        if has_history:
            curr = history[0]
            prev = history[1]
            try:
                curr_prob = float(curr.get("probability", 0.0) or 0.0)
                prev_prob = float(prev.get("probability", 0.0) or 0.0)
                prob_delta = round(curr_prob - prev_prob, 3)
                if prob_delta < -0.04:
                    prob_trend = "improving"
                elif prob_delta > 0.04:
                    prob_trend = "worsening"
                else:
                    prob_trend = "stable"
            except (ValueError, TypeError):
                pass

            # Check weight delta from assessment features or profile
            curr_w = None
            prev_w = None
            if isinstance(curr.get("features"), dict):
                curr_w = curr["features"].get("weight") or curr["features"].get("weight_kg")
            if isinstance(prev.get("features"), dict):
                prev_w = prev["features"].get("weight") or prev["features"].get("weight_kg")
            if curr_w is None and demographics.weight_kg is not None:
                curr_w = demographics.weight_kg

            if curr_w is not None and prev_w is not None:
                try:
                    w_diff = float(curr_w) - float(prev_w)
                    weight_delta = round(w_diff, 1)
                    if w_diff < -0.5:
                        weight_trend = "decreasing"
                    elif w_diff > 0.5:
                        weight_trend = "increasing"
                    else:
                        weight_trend = "stable"
                except (ValueError, TypeError):
                    pass

        food_logs = getattr(health_data, "food_logs", []) if health_data else []
        fitness_logs = getattr(health_data, "fitness_logs", []) if health_data else []

        longitudinal = LongitudinalSummary(
            has_history=has_history,
            assessment_count=assessment_count,
            weight_trend_30d=weight_trend,
            weight_delta_kg=weight_delta,
            probability_trend=prob_trend,
            probability_delta=prob_delta,
            logged_meals_30d=len(food_logs),
            logged_fitness_30d=len(fitness_logs),
            active_tracking_consistency_pct=min(100.0, round((len(food_logs) + len(fitness_logs) + len(symptom_records)) / 30.0 * 100.0, 1)),
            top_recurring_symptoms=[s for s, count in sorted(symptom_counts.items(), key=lambda item: item[1], reverse=True)[:3]],
        )

        # 8. Missing Data Audit
        missing_data: List[str] = []
        if demographics.weight_kg is None:
            missing_data.append("weight_kg")
        if demographics.height_cm is None:
            missing_data.append("height_cm")
        if demographics.bmi is None:
            missing_data.append("bmi")
        if demographics.age is None:
            missing_data.append("age")
        if demographics.activity_level is None and demographics.regular_exercise is None:
            missing_data.append("activity_information")
        if not screening.has_assessment:
            missing_data.append("screening_assessment")
        elif not shap_drivers and not shap_mitigators:
            missing_data.append("shap_factors")
        if not symptoms.active_symptoms:
            missing_data.append("symptom_logs")
        if not lab_markers.raw_markers:
            missing_data.append("laboratory_biomarkers")
        if not longitudinal.has_history:
            missing_data.append("longitudinal_history")

        # 9. Determine Explicit Personalization Level
        # LEVEL 1: Profile-only (no assessment completed)
        # LEVEL 2: Profile + Active Screening + SHAP Drivers
        # LEVEL 3: Level 2 + Verified Labs / Reported Symptoms
        # LEVEL 4: Level 3 + Multi-assessment Longitudinal History & Adherence Trends
        if screening.has_assessment:
            if longitudinal.has_history and longitudinal.assessment_count > 1:
                personalization_level = "LEVEL_4_LONGITUDINAL"
            elif (lab_markers.raw_markers and len(lab_markers.raw_markers) > 0) or (symptoms.active_symptoms and len(symptoms.active_symptoms) > 0):
                personalization_level = "LEVEL_3_CLINICAL"
            else:
                personalization_level = "LEVEL_2_SCREENING"
        else:
            personalization_level = "LEVEL_1_PROFILE"

        ctx = ComprehensiveLifestyleContext(
            user_id=user_id_str,
            demographics=demographics,
            screening=screening,
            shap_drivers=shap_drivers[:5],
            shap_mitigators=shap_mitigators[:5],
            symptoms=symptoms,
            labs=lab_markers,
            longitudinal=longitudinal,
            missing_data=missing_data,
            personalization_level=personalization_level,
        )
        ctx.context_version = cls.compute_context_version(ctx)
        return ctx

    @classmethod
    def compute_context_version(cls, context: ComprehensiveLifestyleContext) -> str:
        """
        Computes a deterministic 16-character SHA-256 fingerprint of the patient's
        clinically relevant state:
        - pathway / demographics (weight, height, age, bmi, waist_cm, activity, sleep, stress, diet, allergens, intolerances)
        - personalization level
        - screening assessment (has_assessment, id, level, probability, risk_category)
        - top SHAP drivers
        - laboratory biomarkers (fasting glucose, hba1c, testosterone, insulin, lipids)
        - longitudinal trajectory (weight delta, probability trend)
        """
        demo = context.demographics
        screening = context.screening
        labs = context.labs
        longitudinal = context.longitudinal

        state_digest = {
            "pathway": demo.pathway,
            "age": demo.age,
            "weight_kg": round(demo.weight_kg, 1) if demo.weight_kg is not None else None,
            "height_cm": round(demo.height_cm, 1) if demo.height_cm is not None else None,
            "waist_cm": round(demo.waist_cm, 1) if demo.waist_cm is not None else None,
            "bmi": round(demo.bmi, 1) if demo.bmi is not None else None,
            "activity_level": demo.activity_level or "",
            "sleep_hours": round(demo.sleep_hours, 1) if demo.sleep_hours is not None else None,
            "stress_level": demo.stress_level or "",
            "dietary_preference": demo.dietary_preference or "",
            "allergens": sorted(demo.allergens or []),
            "intolerances": sorted(demo.intolerances or []),
            "personalization_level": getattr(context, "personalization_level", "LEVEL_1_PROFILE"),
            "has_assessment": screening.has_assessment,
            "assessment_id": screening.assessment_id or "",
            "assessment_level": screening.assessment_level,
            "risk_category": screening.risk_category,
            "probability": round(screening.probability, 3) if screening.has_assessment else None,
            "shap_drivers": sorted([d.feature_name for d in context.shap_drivers]),
            "symptoms": sorted(context.symptoms.active_symptoms),
            "fasting_glucose": labs.fasting_glucose_mg_dl,
            "hba1c": labs.hba1c_percent,
            "total_t": labs.total_testosterone_ng_dl,
            "fasting_insulin": labs.fasting_insulin_uIU_ml,
            "weight_trend_30d": longitudinal.weight_trend_30d,
            "probability_trend": longitudinal.probability_trend,
        }
        encoded = json.dumps(state_digest, sort_keys=True, default=str).encode("utf-8")
        return hashlib.sha256(encoded).hexdigest()[:16]

    @classmethod
    def extract_freshness_inputs_from_profile_and_assessment(
        cls,
        profile_obj: Any,
        active_assessment: Optional[Dict[str, Any]],
        pathway: str,
    ) -> Dict[str, Any]:
        """
        Extracts normalized lightweight inputs needed to test cache freshness
        without querying non-profile tables (symptoms, logs, vitals).
        """
        raw_allergens_list: List[str] = []
        raw_intolerances_list: List[str] = []
        raw_dietary_pref = "omnivore"
        activity_level = None
        sleep_hours = None
        stress_level = None
        weight_kg = None
        height_cm = None
        waist_cm = None
        profile_updated_at = ""

        if profile_obj:
            if isinstance(profile_obj, dict):
                weight_kg = profile_obj.get("weight_kg")
                height_cm = profile_obj.get("height_cm")
                waist_cm = profile_obj.get("waist_cm")
                activity_level = profile_obj.get("activity_level")
                sleep_hours = profile_obj.get("sleep_hours")
                stress_level = profile_obj.get("stress_level")
                profile_updated_at = str(profile_obj.get("updated_at") or "")
                raw_dietary_pref = profile_obj.get("dietary_preference") or raw_dietary_pref
                if profile_obj.get("allergies"):
                    raw_allergens_list.extend(profile_obj["allergies"])
                if profile_obj.get("food_allergies"):
                    raw_allergens_list.extend(profile_obj["food_allergies"])
                if profile_obj.get("food_intolerances"):
                    raw_intolerances_list.extend(profile_obj["food_intolerances"])
                # nested lifestyle
                ls = profile_obj.get("lifestyle", {})
                if isinstance(ls, dict):
                    raw_dietary_pref = ls.get("dietaryPreference") or ls.get("dietary_preference") or raw_dietary_pref
                    if ls.get("allergens"):
                        raw_allergens_list.extend(ls["allergens"])
                    if ls.get("intolerances"):
                        raw_intolerances_list.extend(ls["intolerances"])
                    activity_level = ls.get("activityLevel") or ls.get("activity_level") or activity_level
                    if sleep_hours is None and (ls.get("sleepHours") or ls.get("sleep_hours")):
                        try:
                            sleep_hours = float(ls.get("sleepHours") or ls.get("sleep_hours"))
                        except (ValueError, TypeError):
                            pass
                    stress_level = ls.get("stressLevel") or ls.get("stress_level") or stress_level
            else:
                weight_kg = getattr(profile_obj, "weight_kg", None)
                height_cm = getattr(profile_obj, "height_cm", None)
                waist_cm = getattr(profile_obj, "waist_cm", None)
                activity_level = getattr(profile_obj, "activity_level", None)
                sleep_hours = getattr(profile_obj, "sleep_hours", None)
                stress_level = getattr(profile_obj, "stress_level", None)
                profile_updated_at = str(getattr(profile_obj, "updated_at", "") or "")
                raw_dietary_pref = getattr(profile_obj, "dietary_preference", None) or raw_dietary_pref
                if getattr(profile_obj, "allergies", None):
                    raw_allergens_list.extend(getattr(profile_obj, "allergies", []))
                if getattr(profile_obj, "food_allergies", None):
                    raw_allergens_list.extend(getattr(profile_obj, "food_allergies", []))
                if getattr(profile_obj, "food_intolerances", None):
                    raw_intolerances_list.extend(getattr(profile_obj, "food_intolerances", []))
                # Check nested lifestyle attribute if any
                ls = getattr(profile_obj, "lifestyle", {})
                if isinstance(ls, dict):
                    raw_dietary_pref = ls.get("dietaryPreference") or ls.get("dietary_preference") or raw_dietary_pref
                    if ls.get("allergens"):
                        raw_allergens_list.extend(ls["allergens"])
                    if ls.get("intolerances"):
                        raw_intolerances_list.extend(ls["intolerances"])
                    activity_level = ls.get("activityLevel") or ls.get("activity_level") or activity_level
                    if sleep_hours is None and (ls.get("sleepHours") or ls.get("sleep_hours")):
                        try:
                            sleep_hours = float(ls.get("sleepHours") or ls.get("sleep_hours"))
                        except (ValueError, TypeError):
                            pass
                    stress_level = ls.get("stressLevel") or ls.get("stress_level") or stress_level

        norm_allergens, _, unmapped_from_allergies = normalize_food_allergens(raw_allergens_list)
        norm_intolerances, _ = normalize_food_intolerances(raw_intolerances_list + unmapped_from_allergies)
        final_allergens = sorted([a for a in norm_allergens if a and a != "none"])
        final_intolerances = sorted([i for i in norm_intolerances if i and i != "none"])
        norm_diet = normalize_dietary_pattern(raw_dietary_pref)
        canonical_diet = norm_diet.value if norm_diet else "omnivore"

        # Numerical biometrics
        w_val = None
        if weight_kg is not None:
            try:
                w_val = round(float(weight_kg), 1)
            except (ValueError, TypeError):
                pass
        h_val = None
        if height_cm is not None:
            try:
                h_val = round(float(height_cm), 1)
            except (ValueError, TypeError):
                pass
        bmi_val = None
        if w_val is not None and h_val is not None and h_val > 0:
            bmi_val = round(float(w_val) / ((float(h_val) / 100.0) ** 2), 1)
        waist_val = None
        if waist_cm is not None:
            try:
                waist_val = round(float(waist_cm), 1)
            except (ValueError, TypeError):
                pass
        sleep_val = None
        if sleep_hours is not None:
            try:
                sleep_val = round(float(sleep_hours), 1)
            except (ValueError, TypeError):
                pass

        # Assessment fields
        has_assessment = bool(
            active_assessment
            and not active_assessment.get("error")
            and active_assessment.get("has_assessment") is not False
        )
        assessment_id = str(active_assessment.get("id") or "") if has_assessment else ""
        assessment_level = str(active_assessment.get("assessment_level") or "none") if has_assessment else "none"
        risk_category = str(active_assessment.get("risk_category") or "unscreened") if has_assessment else "unscreened"
        assessment_updated_at = str(
            active_assessment.get("updated_at") or active_assessment.get("created_at") or ""
        ) if has_assessment else ""

        return {
            "pathway": pathway,
            "allergens": final_allergens,
            "intolerances": final_intolerances,
            "dietary_preference": canonical_diet,
            "activity_level": str(activity_level).lower().strip() if activity_level else "",
            "weight_kg": w_val,
            "height_cm": h_val,
            "waist_cm": waist_val,
            "bmi": bmi_val,
            "sleep_hours": sleep_val,
            "stress_level": str(stress_level).lower().strip() if stress_level else "",
            "profile_updated_at": profile_updated_at,
            "has_assessment": has_assessment,
            "assessment_id": assessment_id,
            "assessment_level": assessment_level,
            "risk_category": risk_category,
            "assessment_updated_at": assessment_updated_at,
        }

    @classmethod
    def extract_freshness_inputs_from_context(
        cls,
        context: ComprehensiveLifestyleContext,
    ) -> Dict[str, Any]:
        """
        Extracts identical freshness inputs from a fully built context.
        """
        demo = context.demographics
        screening = context.screening
        return {
            "pathway": demo.pathway,
            "allergens": sorted(demo.allergens or []),
            "intolerances": sorted(demo.intolerances or []),
            "dietary_preference": demo.dietary_preference or "omnivore",
            "activity_level": str(demo.activity_level or "").lower().strip(),
            "weight_kg": round(float(demo.weight_kg), 1) if demo.weight_kg is not None else None,
            "height_cm": round(float(demo.height_cm), 1) if demo.height_cm is not None else None,
            "waist_cm": round(float(demo.waist_cm), 1) if demo.waist_cm is not None else None,
            "bmi": round(float(demo.bmi), 1) if demo.bmi is not None else None,
            "sleep_hours": round(float(demo.sleep_hours), 1) if demo.sleep_hours is not None else None,
            "stress_level": str(demo.stress_level or "").lower().strip(),
            "profile_updated_at": getattr(demo, "profile_updated_at", "") or "",
            "has_assessment": screening.has_assessment,
            "assessment_id": str(screening.assessment_id or "") if screening.has_assessment else "",
            "assessment_level": str(screening.assessment_level or "none") if screening.has_assessment else "none",
            "risk_category": str(screening.risk_category or "unscreened") if screening.has_assessment else "unscreened",
            "assessment_updated_at": str(screening.created_at or "") if screening.has_assessment else "",
        }

    @classmethod
    def compute_freshness_fingerprint(cls, freshness_inputs: Dict[str, Any]) -> str:
        """
        Computes a deterministic 16-character SHA-256 hash of the lightweight freshness inputs.
        """
        encoded = json.dumps(freshness_inputs, sort_keys=True, default=str).encode("utf-8")
        return hashlib.sha256(encoded).hexdigest()[:16]

    @classmethod
    def is_cache_fresh(
        cls,
        user_id: str,
        canonical_module: str,
        cached_record: Dict[str, Any],
        auth_token: Optional[str] = None,
        profile_override: Any = None,
        assessment_override: Optional[Dict[str, Any]] = None,
    ) -> tuple[bool, str]:
        """
        Performs a CHEAP freshness verification (<50ms) using ONLY profile + active assessment.
        Does NOT rebuild all 9 tables.
        Returns (is_fresh: bool, reason: str).
        """
        if not cached_record:
            return False, "no_cached_record"

        payload = cached_record.get("payload")
        if not payload or not isinstance(payload, dict):
            return False, "invalid_cached_payload"

        cached_fingerprint = payload.get("freshness_fingerprint")
        cached_inputs = payload.get("freshness_inputs")

        if not cached_fingerprint or not cached_inputs or not isinstance(cached_inputs, dict):
            # Legacy cache before freshness fingerprinting -> invalidate and regenerate once
            return False, "missing_freshness_metadata"

        # 1. Fetch lightweight inputs (ONLY profile + active assessment)
        try:
            if profile_override is not None:
                profile_obj = profile_override
            else:
                profile_obj = health_service.fetch_profile(user_id, auth_token=auth_token)
        except Exception as e:
            logger.warning("Lightweight profile fetch failed for freshness check: %s", e)
            return False, "profile_fetch_failed"

        try:
            if assessment_override is not None:
                active_assessment = assessment_override
            else:
                active_assessment = assessment_repository.get_active_assessment(
                    user_id, module=canonical_module, auth_token=auth_token
                )
        except Exception as e:
            logger.warning("Lightweight assessment fetch failed for freshness check: %s", e)
            return False, "assessment_fetch_failed"

        # 2. Extract current lightweight inputs
        curr_inputs = cls.extract_freshness_inputs_from_profile_and_assessment(
            profile_obj=profile_obj,
            active_assessment=active_assessment,
            pathway=canonical_module,
        )

        # 3. Synchronous Clinical Safety & Profile Invalidation Checks
        if curr_inputs["allergens"] != cached_inputs.get("allergens"):
            return False, f"allergy_changed: {cached_inputs.get('allergens')} -> {curr_inputs['allergens']}"

        if curr_inputs["intolerances"] != cached_inputs.get("intolerances"):
            return False, f"intolerance_changed: {cached_inputs.get('intolerances')} -> {curr_inputs['intolerances']}"

        if curr_inputs["dietary_preference"] != cached_inputs.get("dietary_preference"):
            return False, f"diet_changed: {cached_inputs.get('dietary_preference')} -> {curr_inputs['dietary_preference']}"

        if curr_inputs["assessment_id"] != cached_inputs.get("assessment_id") or curr_inputs["assessment_level"] != cached_inputs.get("assessment_level"):
            return False, f"assessment_tier_changed: id={cached_inputs.get('assessment_id')}->{curr_inputs['assessment_id']}, lvl={cached_inputs.get('assessment_level')}->{curr_inputs['assessment_level']}"

        if curr_inputs["activity_level"] != cached_inputs.get("activity_level"):
            return False, f"activity_changed: {cached_inputs.get('activity_level')} -> {curr_inputs['activity_level']}"

        if curr_inputs["weight_kg"] != cached_inputs.get("weight_kg") or curr_inputs["bmi"] != cached_inputs.get("bmi"):
            return False, f"biometrics_changed: wt={cached_inputs.get('weight_kg')}->{curr_inputs['weight_kg']}, bmi={cached_inputs.get('bmi')}->{curr_inputs['bmi']}"

        if curr_inputs["sleep_hours"] != cached_inputs.get("sleep_hours") or curr_inputs["stress_level"] != cached_inputs.get("stress_level"):
            return False, f"sleep_stress_changed: sleep={cached_inputs.get('sleep_hours')}->{curr_inputs['sleep_hours']}, stress={cached_inputs.get('stress_level')}->{curr_inputs['stress_level']}"

        if curr_inputs["assessment_updated_at"] and cached_inputs.get("assessment_updated_at") and curr_inputs["assessment_updated_at"] != cached_inputs.get("assessment_updated_at"):
            return False, "assessment_reevaluated"

        if curr_inputs["profile_updated_at"] and cached_inputs.get("profile_updated_at") and curr_inputs["profile_updated_at"] != cached_inputs.get("profile_updated_at"):
            return False, "profile_updated_timestamp_changed"

        # 4. Fingerprint Hash Check
        curr_fingerprint = cls.compute_freshness_fingerprint(curr_inputs)
        if curr_fingerprint != cached_fingerprint:
            return False, f"fingerprint_mismatch_{cached_fingerprint}_vs_{curr_fingerprint}"

        # 5. Defense-in-depth Safety Scan: verify NO declared allergen violates cached foods
        if curr_inputs["allergens"] or curr_inputs["intolerances"]:
            from apps.intelligence.services.safety_guardrails import is_food_safe_for_user
            nutrition_data = payload.get("nutrition", {})
            for concept in nutrition_data.get("meal_concepts", []):
                for fkey in ("breakfast", "lunch", "dinner", "snack"):
                    food_text = concept.get(fkey, "")
                    if food_text and not is_food_safe_for_user(food_text, curr_inputs["allergens"], curr_inputs["intolerances"]):
                        return False, f"payload_allergen_conflict_in_meal: {food_text[:30]}"
            for swap in nutrition_data.get("smart_swaps", []):
                for skey in ("from_food", "to_food"):
                    sfood = swap.get(skey, "")
                    if sfood and not is_food_safe_for_user(sfood, curr_inputs["allergens"], curr_inputs["intolerances"]):
                        return False, f"payload_allergen_conflict_in_swap: {sfood[:30]}"

        return True, "fresh"
