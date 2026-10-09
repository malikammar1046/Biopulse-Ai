"""
backend/apps/intelligence/services/lifestyle_recommendation_engine.py

Dynamic Rule-Based Lifestyle Recommendation Engine for BioPulse AI.
Synthesizes:
1. Comprehensive Lifestyle Context (Profile, Screening, Symptoms, Labs, Longitudinal, SHAP)
2. Safety & Eligibility Rules (Allergens, Joint Protection, Caloric Floors, Clinical Escalation)
into synchronized, personalized recommendations across 3 pillars:
- Pillar 1: Nutrition & Metabolic Health (Macros, Dietary Strategy, Food Swaps, Meal Concepts)
- Pillar 2: Fitness & Physical Conditioning (Weekly Protocol, Moderate Aerobic, Resistance, Mobility)
- Pillar 3: Circadian, Sleep & Stress Optimization (Sunlight, Sleep Hygiene, Parasympathetic Pacing)

100% rule-based, fully deterministic, zero dependency on legacy Meal Directory.
"""

from __future__ import annotations

import logging
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Set

from apps.intelligence.services.canonical_lifestyle_evidence import (
    LIFESTYLE_EVIDENCE_REGISTRY,
    get_evidence_metadata_dict,
)
from apps.intelligence.services.lifestyle_context_builder import (
    ComprehensiveLifestyleContext,
    LifestyleContextBuilder,
    ShapFactor,
)
from apps.intelligence.services.lifestyle_safety_rules import (
    ALLERGEN_INGREDIENT_MAP,
    CLINICAL_DISCLAIMER,
    LifestyleSafetyEngine,
    SafetyEvaluationResult,
    is_food_forbidden,
)

logger = logging.getLogger(__name__)


@dataclass
class MacroTarget:
    name: str
    grams: Optional[int]
    calories_kcal: Optional[int]
    percent_of_energy: Optional[int]
    guidance: str


@dataclass
class DailyTargets:
    daily_calories_kcal: Optional[int]
    calorie_range_min: Optional[int]
    calorie_range_max: Optional[int]
    protein: MacroTarget
    carbohydrates: MacroTarget
    fats: MacroTarget
    fiber_grams: Optional[int]
    hydration_liters: Optional[float]
    target_status: str = "calculated"  # 'calculated' | 'unavailable_missing_biometrics'
    guidance_note: str = ""


@dataclass
class TargetedFoodSwap:
    trigger_factor: str
    swap_title: str
    replace_food: str
    recommended_alternative: str
    clinical_mechanism: str
    impact_level: str  # 'high' | 'moderate'


@dataclass
class MealConcept:
    meal_type: str  # 'Breakfast', 'Lunch', 'Dinner', 'Snack'
    title: str
    description: str
    key_ingredients: List[str]
    hormonal_benefit: str
    est_calories: Optional[int] = None


@dataclass
class NutritionPillar:
    strategy_title: str
    strategy_summary: str
    key_guidelines: List[str]
    daily_targets: DailyTargets
    targeted_swaps: List[TargetedFoodSwap]
    meal_concepts: List[MealConcept]


@dataclass
class WorkoutSession:
    day_name: str
    focus: str
    duration_mins: int
    intensity: str  # 'low', 'moderate', 'vigorous'
    modality: str
    key_movements: List[str]
    coaching_cue: str


@dataclass
class FitnessPillar:
    protocol_name: str
    weekly_frequency: str
    overview: str
    aerobic_target_minutes: str
    resistance_target_sessions: str
    pathway_clinical_benefit: str
    weekly_schedule: List[WorkoutSession]
    recovery_guidance: str


@dataclass
class HabitRecommendation:
    category: str  # 'Circadian', 'Sleep', 'Stress', 'Environmental'
    title: str
    action_item: str
    timing: str
    rationale: str


@dataclass
class LifestylePillar:
    circadian_headline: str
    sleep_target_hours: str
    stress_management_protocol: str
    recommended_habits: List[HabitRecommendation]


@dataclass
class EvidenceRationale:
    attributed_shap_drivers: List[str]
    attributed_lab_markers: List[str]
    attributed_symptoms: List[str]
    clinical_synthesis: str


@dataclass
class RecommendationItem:
    id: str
    category: str  # 'nutrition' | 'fitness' | 'lifestyle' | 'clinical'
    title: str
    action_summary: str
    priority: str  # 'high' | 'moderate' | 'routine'
    status: str    # 'NEW' | 'ACTIVE' | 'IMPROVING' | 'MAINTAIN' | 'REASSESS'
    why_this_is_recommended: str
    based_on_patient_data: List[str]
    longitudinal_basis: str
    shap_priority_basis: Optional[str]
    safety_status: str  # 'ALLOW' | 'MODIFY' | 'WITHHOLD' | 'CLINICIAN_REVIEW'
    evidence_id: Optional[str] = None
    clinician_review: bool = False
    clinician_review_reason: Optional[str] = None


@dataclass
class LifestyleRecommendationsResult:
    user_id: str
    pathway: str
    risk_category: str
    risk_probability_percent: float
    generated_at: str
    safety_status: str  # 'ALLOW' | 'MODIFY' | 'WITHHOLD' | 'CLINICIAN_REVIEW'
    missing_data: List[str]
    clinician_review: Dict[str, Any]
    safety_notices: List[str]
    recommendations: List[RecommendationItem]
    disclaimer: str
    nutrition: NutritionPillar
    fitness: FitnessPillar
    lifestyle: LifestylePillar
    evidence_rationale: EvidenceRationale
    evidence_registry: Dict[str, Any] = field(default_factory=dict)
    context_version: str = ""
    personalization_level: str = "LEVEL_1_PROFILE"
    has_assessment: bool = True

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


class LifestyleRecommendationEngine:
    """
    Authoritative engine that takes patient context and safety constraints to
    generate personalized, synchronized nutrition, fitness, and lifestyle guidance.
    """

    @classmethod
    def generate(
        cls,
        context: ComprehensiveLifestyleContext,
        safety: Optional[SafetyEvaluationResult] = None,
    ) -> LifestyleRecommendationsResult:
        if safety is None:
            safety = LifestyleSafetyEngine.evaluate_safety(context)

        demo = context.demographics
        screening = context.screening
        shap_drivers = context.shap_drivers
        labs = context.labs
        symptoms = context.symptoms
        longitudinal = context.longitudinal
        missing_data = list(context.missing_data)

        is_female_pcos = demo.pathway == "female_pcos" or demo.gender == "female"
        has_biometrics = (demo.weight_kg is not None and demo.height_cm is not None)

        # -------------------------------------------------------------
        # 1. Calibrated Energy & Macronutrient Calculation
        # -------------------------------------------------------------
        daily_targets: DailyTargets

        if not has_biometrics:
            # Strictly DO NOT fabricate numbers when biometrics are missing
            daily_targets = DailyTargets(
                daily_calories_kcal=None,
                calorie_range_min=None,
                calorie_range_max=None,
                protein=MacroTarget(
                    name="Protein",
                    grams=None,
                    calories_kcal=None,
                    percent_of_energy=None,
                    guidance="Prioritize a palm-sized portion of protein (eggs, poultry, tofu, lentils, fish) with each main meal.",
                ),
                carbohydrates=MacroTarget(
                    name="Complex Carbohydrates",
                    grams=None,
                    calories_kcal=None,
                    percent_of_energy=None,
                    guidance="Focus on whole, intact low-glycemic carbohydrates (legumes, intact oats, barley, roasted chickpeas).",
                ),
                fats=MacroTarget(
                    name="Healthy Fats",
                    grams=None,
                    calories_kcal=None,
                    percent_of_energy=None,
                    guidance="Include unsaturated plant oils (extra virgin olive oil, mustard oil), raw nuts, and seeds.",
                ),
                fiber_grams=None,
                hydration_liters=None,
                target_status="unavailable_missing_biometrics",
                guidance_note="Personalized calorie and macronutrient targets are unavailable with current data. Please update your weight and height in Settings to receive calibrated targets.",
            )
        else:
            weight = float(demo.weight_kg)
            height = float(demo.height_cm)
            age = int(demo.age or 28)

            if demo.gender == "male":
                bmr = (10.0 * weight) + (6.25 * height) - (5.0 * age) + 5.0
            else:
                bmr = (10.0 * weight) + (6.25 * height) - (5.0 * age) - 161.0

            pal_map = {
                "sedentary": 1.2,
                "light": 1.375,
                "moderate": 1.55,
                "active": 1.725,
                "very_active": 1.9,
            }
            pal = pal_map.get(demo.activity_level or "", 1.4)
            tdee = bmr * pal

            # Lean PCOS vs Elevated BMI Deficit
            is_lean_pcos = is_female_pcos and (demo.bmi is not None and demo.bmi < 25.0)
            is_underweight = (demo.bmi is not None and demo.bmi < 18.5)

            if is_underweight:
                target_cals = round(tdee + 250.0)
                note = "Nutrient density and adequate daily energy intake are prioritized to support healthy weight restoration."
            elif is_lean_pcos:
                # Do NOT prescribe deficit to lean PCOS
                target_cals = max(safety.min_safe_calories_kcal, round(tdee))
                note = "Maintaining energy balance is prioritized to support consistent energy and general hormonal wellbeing without caloric deficit."
            elif demo.bmi and demo.bmi >= 25.0:
                deficit = min(safety.max_safe_deficit_kcal, 350.0)
                raw_cals = round(tdee - deficit)
                target_cals = max(safety.min_safe_calories_kcal, raw_cals)
                if target_cals == safety.min_safe_calories_kcal and raw_cals < safety.min_safe_calories_kcal:
                    safety.caloric_floor_enforced = True
                note = (
                    f"Moderate caloric pacing with a product safety floor of {int(safety.min_safe_calories_kcal)} kcal/day. "
                    "This serves as a conservative system guardrail rather than an individualized clinical prescription."
                )
            else:
                target_cals = max(safety.min_safe_calories_kcal, round(tdee))
                note = "Energy intake calibrated for weight maintenance and metabolic equilibrium."

            cal_min = int(target_cals - 100)
            cal_max = int(target_cals + 100)

            # Protein: 1.2 - 1.5g per kg
            protein_factor = 1.4 if demo.gender == "male" else 1.25
            protein_g = max(60, min(160, round(weight * protein_factor)))
            protein_cals = protein_g * 4
            protein_pct = round((protein_cals / target_cals) * 100)

            # Fats: ~30%
            fat_cals = round(target_cals * 0.30)
            fat_g = round(fat_cals / 9.0)
            fat_pct = 30

            # Carbs: Remaining
            carb_cals = max(300, target_cals - protein_cals - fat_cals)
            carb_g = round(carb_cals / 4.0)
            carb_pct = round((carb_cals / target_cals) * 100)

            fiber_g = 28 if demo.gender == "female" else 35
            # Broad general wellness fluid reference baseline (IOM: ~2.0-2.7L female, ~2.5-3.5L male)
            hydration_l = 2.2 if demo.gender == "female" else 3.0

            daily_targets = DailyTargets(
                daily_calories_kcal=int(target_cals),
                calorie_range_min=cal_min,
                calorie_range_max=cal_max,
                protein=MacroTarget(
                    name="Protein",
                    grams=int(protein_g),
                    calories_kcal=int(protein_cals),
                    percent_of_energy=int(protein_pct),
                    guidance="Supports muscle maintenance, steady energy, and mealtime fullness.",
                ),
                carbohydrates=MacroTarget(
                    name="Complex Carbohydrates",
                    grams=int(carb_g),
                    calories_kcal=int(carb_cals),
                    percent_of_energy=int(carb_pct),
                    guidance="Wholesome legumes, whole grains, and fiber-rich vegetables that digest steadily.",
                ),
                fats=MacroTarget(
                    name="Healthy Fats",
                    grams=int(fat_g),
                    calories_kcal=int(fat_cals),
                    percent_of_energy=int(fat_pct),
                    guidance="Heart-healthy fats such as olive oil, nuts, and seeds.",
                ),
                fiber_grams=int(fiber_g),
                hydration_liters=float(hydration_l),
                target_status="calculated",
                guidance_note=(
                    f"{note} General fluid reference: approximately 2.0–2.7 L (women) / 2.5–3.5 L (men) "
                    "from all beverages and water-rich foods, adjusting for climate and activity. "
                    "Anyone with renal or cardiac fluid restrictions should consult their doctor."
                ),
            )

        # -------------------------------------------------------------
        # 2. Nutrition Strategy & Dynamic Swaps
        # -------------------------------------------------------------
        if is_female_pcos:
            if demo.bmi and demo.bmi < 25.0:
                strat_title = "Balanced Whole-Food Nutrition (Consistent Energy Support)"
                strat_summary = (
                    "Focuses on nutrient-dense meals, steady energy throughout the day, and gentle blood sugar "
                    "balance without unnecessary caloric restriction."
                )
            else:
                strat_title = "Balanced Low-Glycemic Nutrition"
                strat_summary = (
                    "Emphasizes fiber-rich whole foods, quality protein, and minimally processed ingredients to "
                    "support steady blood sugar levels and sustained daily energy."
                )
        else:
            is_male_risk = bool(
                screening.has_assessment and (
                    screening.risk_category in ("moderate", "high", "elevated")
                    or (labs.total_testosterone_ng_dl is not None and labs.total_testosterone_ng_dl < 300.0)
                )
            )
            if is_male_risk:
                strat_title = "Nutrient-Dense Metabolic Vitality & Endocrine Support for Men"
                strat_summary = (
                    "Emphasizes zinc-, magnesium-, and antioxidant-rich whole foods, high-quality proteins, and healthy dietary fats "
                    "to support metabolic health, essential micronutrient cofactors, and sustained physical vitality."
                )
            else:
                strat_title = "Nutrient-Dense Balanced Nutrition for Men"
                strat_summary = (
                    "Focuses on wholesome proteins, colorful vegetables, and essential minerals to support "
                    "body composition, metabolic health, and physical vitality."
                )

        key_guidelines = cls._build_key_guidelines(is_female_pcos, safety, demo)
        targeted_swaps = cls._build_targeted_swaps(context, safety, is_female_pcos)
        meal_concepts = cls._build_personalized_meal_concepts(
            context=context,
            safety=safety,
            has_biometrics=has_biometrics,
            is_female_pcos=is_female_pcos,
            target_cals=daily_targets.daily_calories_kcal,
        )

        nutrition_pillar = NutritionPillar(
            strategy_title=strat_title,
            strategy_summary=strat_summary,
            key_guidelines=key_guidelines,
            daily_targets=daily_targets,
            targeted_swaps=targeted_swaps,
            meal_concepts=meal_concepts,
        )

        # -------------------------------------------------------------
        # 3. Fitness Pillar (Persona-Driven, Supportive Movement)
        # -------------------------------------------------------------
        fitness_pillar = cls._build_fitness_pillar(context, safety, is_female_pcos)

        # -------------------------------------------------------------
        # 4. Lifestyle Pillar (Personalized Sleep, Stress & Circadian)
        # -------------------------------------------------------------
        lifestyle_pillar = cls._build_lifestyle_pillar(context)

        # -------------------------------------------------------------
        # 5. Evidence Rationale (Answering No-Assessment vs Screened)
        # -------------------------------------------------------------
        attr_shap: List[str] = []
        for factor in shap_drivers[:4]:
            attr_shap.append(f"{factor.display_name} (+{factor.shap_value:.2f} model impact)")

        attr_labs: List[str] = []
        if labs.fasting_glucose_mg_dl:
            attr_labs.append(f"Fasting Glucose: {labs.fasting_glucose_mg_dl} mg/dL")
        if labs.hba1c_percent:
            attr_labs.append(f"HbA1c: {labs.hba1c_percent}%")
        if labs.fasting_insulin_uIU_ml:
            attr_labs.append(f"Fasting Insulin: {labs.fasting_insulin_uIU_ml} uIU/mL")
        if labs.total_testosterone_ng_dl:
            attr_labs.append(f"Total Testosterone: {labs.total_testosterone_ng_dl} ng/dL")
        if labs.lh_fsh_ratio:
            attr_labs.append(f"LH:FSH Ratio: {labs.lh_fsh_ratio}")

        attr_symptoms: List[str] = [s.title() for s in symptoms.active_symptoms[:4]]

        if screening.has_assessment:
            clinical_synthesis = (
                f"Recommendations are dynamically derived from your active {screening.module.replace('_', ' ').title()} "
                f"screening profile (Category: {screening.risk_category.title()}, Probability: {screening.probability_percent:.1f}%). "
                f"The rule-based engine incorporates {len(attr_shap)} model-attributed risk factors, {len(attr_labs)} verified laboratory markers, "
                f"and {len(attr_symptoms)} reported symptoms to calibrate nutritional distribution, physical movement, and circadian recovery."
            )
            final_risk_category = screening.risk_category
            final_prob_pct = screening.probability_percent
        else:
            clinical_synthesis = (
                "Recommendations are established from your foundational profile and lifestyle baseline "
                "(Personalization: Level 1 - Profile Baseline). Complete a health screening assessment "
                "to incorporate clinical risk modeling, probability scoring, and SHAP feature attribution."
            )
            final_risk_category = "unscreened"
            final_prob_pct = 0.0

        evidence_rationale = EvidenceRationale(
            attributed_shap_drivers=attr_shap,
            attributed_lab_markers=attr_labs,
            attributed_symptoms=attr_symptoms,
            clinical_synthesis=clinical_synthesis,
        )

        # -------------------------------------------------------------
        # 6. Structured Recommendation Items & Priority Ordering
        # -------------------------------------------------------------
        recommendations: List[RecommendationItem] = []
        has_prior_history = longitudinal.has_history and longitudinal.assessment_count > 1

        # Recommendation 1: Nutrition Strategy
        nutr_status = "NEW"
        nutr_long_basis = "Initial baseline recommendation established from current assessment."
        if has_prior_history:
            if longitudinal.weight_trend_30d in ("decreasing", "improving") and demo.bmi and demo.bmi >= 25.0:
                nutr_status = "IMPROVING"
                nutr_long_basis = f"Positive progress observed: Weight has trended downward ({longitudinal.weight_delta_kg} kg over recent period). Continuing focus on sustainable habit maintenance."
            elif longitudinal.weight_trend_30d in ("increasing", "worsening") and demo.bmi and demo.bmi >= 25.0:
                nutr_status = "REASSESS"
                nutr_long_basis = "Weight has trended upward over recent check-ins. Review portion calibration and simple carbohydrate frequency."
            else:
                nutr_status = "ACTIVE"
                nutr_long_basis = "Ongoing nutritional pacing based on current biometrics and metabolic check-ins."

        nutr_priority = "moderate"
        nutr_shap_basis = None
        for d in shap_drivers:
            if any(k in d.feature_name.lower() for k in ("bmi", "weight", "fast_food")):
                nutr_priority = "high"
                nutr_shap_basis = f"Elevated to high priority: Model attribution identified '{d.display_name}' as a notable risk contributor."
                break

        nutr_data_used = [f"Pathway: {demo.pathway.replace('_', ' ').title()}"]
        if demo.bmi:
            nutr_data_used.append(f"BMI: {demo.bmi}")
        if demo.dietary_preference:
            nutr_data_used.append(f"Diet: {demo.dietary_preference.title()}")
        if demo.fast_food_intake:
            nutr_data_used.append(f"Fast Food: {demo.fast_food_intake.title()}")
        if demo.allergens:
            nutr_data_used.append(f"Allergens: {', '.join(demo.allergens)}")

        nutr_action = key_guidelines[0]
        if nutr_status == "IMPROVING":
            nutr_action = f"Progress noted: Continue adhering to calibrated nutrition guidelines ({key_guidelines[0]})."

        nutr_evidence_id = "pcos_balanced_nutrition" if is_female_pcos else "male_lifestyle_support"

        recommendations.append(
            RecommendationItem(
                id="nutr-strategy-primary",
                category="nutrition",
                title=strat_title,
                action_summary=nutr_action,
                priority=nutr_priority,
                status=nutr_status,
                why_this_is_recommended=strat_summary,
                based_on_patient_data=nutr_data_used,
                longitudinal_basis=nutr_long_basis,
                shap_priority_basis=nutr_shap_basis,
                safety_status=safety.safety_status,
                evidence_id=nutr_evidence_id,
                clinician_review=False,
            )
        )

        # Recommendation 2: Physical Movement Protocol
        fitness_status = "NEW"
        fitness_long_basis = "Initial baseline movement protocol."
        if has_prior_history:
            if demo.regular_exercise or longitudinal.logged_fitness_30d >= 3:
                fitness_status = "MAINTAIN"
                fitness_long_basis = "Consistent movement habits confirmed in tracking. Maintaining routine without unnecessary escalation."
            else:
                fitness_status = "ACTIVE"
                fitness_long_basis = "Active progressive exercise guideline based on current fitness level."

        fit_priority = "moderate"
        fit_shap_basis = None
        for d in shap_drivers:
            if any(k in d.feature_name.lower() for k in ("exercise", "activity", "physical")):
                fit_priority = "high"
                fit_shap_basis = f"Elevated to high priority: Model attribution identified '{d.display_name}' as an active contributor."
                break

        fit_data_used = []
        if demo.activity_level:
            fit_data_used.append(f"Activity Level: {demo.activity_level.title()}")
        if demo.regular_exercise is not None:
            fit_data_used.append(f"Regular Exercise: {'Yes' if demo.regular_exercise else 'No'}")
        if demo.bmi:
            fit_data_used.append(f"BMI: {demo.bmi}")

        if demo.regular_exercise or fitness_status == "MAINTAIN":
            fit_action_summary = "Continue regular moderate-intensity aerobic activity across most days, paired with progressive resistance training to sustain metabolic health."
        else:
            fit_action_summary = fitness_pillar.overview

        fit_evidence_id = "joint_friendly_movement" if safety.joint_protection_active else "who_aerobic_activity"

        recommendations.append(
            RecommendationItem(
                id="fit-protocol-primary",
                category="fitness",
                title=fitness_pillar.protocol_name,
                action_summary=fit_action_summary,
                priority=fit_priority,
                status=fitness_status,
                why_this_is_recommended=fitness_pillar.pathway_clinical_benefit,
                based_on_patient_data=fit_data_used,
                longitudinal_basis=fitness_long_basis,
                shap_priority_basis=fit_shap_basis,
                safety_status="MODIFY" if safety.joint_protection_active else "ALLOW",
                evidence_id=fit_evidence_id,
                clinician_review=False,
            )
        )

        # Recommendation 3: Circadian & Sleep Alignment
        sleep_status = "NEW"
        sleep_long_basis = "Baseline circadian anchoring protocol."
        if has_prior_history:
            sleep_status = "ACTIVE"
            sleep_long_basis = "Continuous circadian alignment."

        sleep_data_used = []
        if demo.sleep_hours:
            sleep_data_used.append(f"Reported Sleep: {demo.sleep_hours} hrs/night")
        if demo.stress_level:
            sleep_data_used.append(f"Stress Level: {demo.stress_level.title()}")

        is_short_sleep = bool(demo.sleep_hours and demo.sleep_hours < 6.5)
        is_high_stress = bool(demo.stress_level in ("high", "severe"))

        if is_short_sleep:
            sleep_priority = "high"
            sleep_title = "Sleep Window Expansion & Evening Recovery"
            sleep_action = (
                f"Your logged sleep ({demo.sleep_hours} hrs/night) makes expanding your nightly sleep window Priority #1 "
                "to support restorative sleep, healthy body composition, and consistent daytime energy."
            )
            sleep_why = "Short sleep duration can challenge daily energy, metabolic balance, and restorative recovery."
        elif is_high_stress:
            sleep_priority = "high"
            sleep_title = "Parasympathetic Nervous System Recovery Protocol"
            sleep_action = "Incorporate cyclic physiological sigh breathing pauses and establish a screen-free wind-down buffer before bed."
            sleep_why = "Elevated stress benefits from targeted calming pauses to support metabolic health and restorative sleep."
        else:
            sleep_priority = "routine"
            sleep_title = "Natural Morning Light & Consistent Sleep Rhythm"
            sleep_action = "Spend 10-15 minutes in natural morning sunlight and sustain your consistent 7-9 hour nightly sleep window."
            sleep_why = "Healthy sleep and circadian consistency support daytime alertness and metabolic equilibrium."

        recommendations.append(
            RecommendationItem(
                id="life-circadian-sleep",
                category="lifestyle",
                title=sleep_title,
                action_summary=sleep_action,
                priority=sleep_priority,
                status=sleep_status,
                why_this_is_recommended=sleep_why,
                based_on_patient_data=sleep_data_used,
                longitudinal_basis=sleep_long_basis,
                shap_priority_basis=None,
                safety_status="ALLOW",
                evidence_id="aasm_sleep_duration",
                clinician_review=False,
            )
        )

        # Recommendation 4: Clinical Review Escalation
        if safety.clinician_review_needed:
            clin_ev_id = None
            reason_lower = (safety.clinician_review_reason or "").lower()
            if "testosterone" in reason_lower:
                clin_ev_id = "aua_endocrine_testosterone_threshold"
            elif "glycemic" in reason_lower or "hba1c" in reason_lower or "glucose" in reason_lower:
                clin_ev_id = "ada_glycemic_threshold"
            elif "prolactin" in reason_lower:
                clin_ev_id = "endocrine_society_hyperprolactinemia"

            recommendations.append(
                RecommendationItem(
                    id="clin-review-escalation",
                    category="clinical",
                    title="Formal Physician Clinical Review Recommended",
                    action_summary=safety.clinician_review_reason or "Consult your qualified physician for formal evaluation.",
                    priority="high",
                    status="REASSESS",
                    why_this_is_recommended="Verified laboratory markers or clinical findings warrant medical evaluation beyond educational lifestyle guidance.",
                    based_on_patient_data=attr_labs if attr_labs else ["Biomarker thresholds exceeded"],
                    longitudinal_basis="Triggered by current laboratory or clinical indicators.",
                    shap_priority_basis=None,
                    safety_status="CLINICIAN_REVIEW",
                    evidence_id=clin_ev_id,
                    clinician_review=True,
                    clinician_review_reason=safety.clinician_review_reason,
                )
            )

        # Sort recommendations by clinical priority: high -> moderate -> routine
        priority_rank = {"high": 0, "moderate": 1, "routine": 2}
        recommendations.sort(key=lambda x: priority_rank.get(x.priority, 1))

        clinician_review_dict = {
            "recommended": safety.clinician_review_needed,
            "reason": safety.clinician_review_reason,
        }

        # Build evidence registry dictionary for referenced evidence IDs
        evidence_registry: Dict[str, Any] = {}
        for r in recommendations:
            if r.evidence_id:
                meta = get_evidence_metadata_dict(r.evidence_id)
                if meta:
                    evidence_registry[r.evidence_id] = meta

        return LifestyleRecommendationsResult(
            user_id=context.user_id,
            pathway=demo.pathway,
            risk_category=final_risk_category,
            risk_probability_percent=final_prob_pct,
            generated_at=context.generated_at,
            safety_status=safety.safety_status,
            missing_data=missing_data,
            clinician_review=clinician_review_dict,
            safety_notices=safety.safety_notices,
            recommendations=recommendations,
            disclaimer=safety.disclaimer,
            nutrition=nutrition_pillar,
            fitness=fitness_pillar,
            lifestyle=lifestyle_pillar,
            evidence_rationale=evidence_rationale,
            evidence_registry=evidence_registry,
            context_version=getattr(context, "context_version", ""),
            personalization_level=getattr(context, "personalization_level", "LEVEL_1_PROFILE"),
            has_assessment=screening.has_assessment,
        )

    # -------------------------------------------------------------------------
    # Helper Methods for Allergen Safety, Swaps, Fitness, and Lifestyle
    # -------------------------------------------------------------------------

    @classmethod
    def _sanitize_food_text(cls, text: str, excluded_cats: List[str]) -> str:
        """
        Substitutes allergenic or forbidden food terms with verified-safe, nutrient-dense alternatives.
        """
        if not text or not excluded_cats:
            return text
        import re
        res = text
        seeds_excluded = any(c in excluded_cats for c in ("seed", "seeds", "sesame"))
        # 1. Tree nuts & Peanuts
        if any(c in excluded_cats for c in ("tree_nut", "tree_nuts", "peanut", "peanuts", "nuts")):
            nut_sub = "roasted chickpeas" if seeds_excluded else "pumpkin seeds"
            butter_sub = "an allergy-compatible spread" if seeds_excluded else "sunflower seed butter"
            res = re.sub(r"\b(?:walnuts?|raw walnuts?|almonds?|badam|akhrot|cashews?|kaju|pistachios?|pista|peanuts?|groundnuts?|mixed nuts)\b", nut_sub, res, flags=re.IGNORECASE)
            res = re.sub(r"\b(?:nut butter|peanut butter|almond butter)\b", butter_sub, res, flags=re.IGNORECASE)

        # Seeds & Spreads sanitization if seeds are excluded
        if seeds_excluded:
            res = re.sub(r"\b(?:seed butter alternative|sunflower seed butter|pumpkin seed butter|seed butter|seed-based spread|tahini)\b", "an allergy-compatible spread", res, flags=re.IGNORECASE)
            res = re.sub(r"\b(?:sunflower seeds?|pumpkin seeds?|chia seeds?|flaxseeds?|sesame seeds?|sesame|til|seeds?)\b", "roasted chickpeas", res, flags=re.IGNORECASE)
        # 2. Eggs
        if any(c in excluded_cats for c in ("egg", "eggs")):
            res = re.sub(r"\b(?:2-egg omelet|omelet|omelette)\b", "spiced savory moong daal pancake", res, flags=re.IGNORECASE)
            res = re.sub(r"\b(?:eggs?|egg white|egg whites|boiled eggs?)\b", "spiced organic tofu (or chickpeas)", res, flags=re.IGNORECASE)
        # 3. Dairy / Milk / Lactose
        if any(c in excluded_cats for c in ("dairy", "milk", "lactose")):
            res = re.sub(r"\bpaneer\b", "spiced organic tofu", res, flags=re.IGNORECASE)
            res = re.sub(r"\b(?:greek yogurt|yogurt|hung curd|dahi)\b", "coconut yogurt", res, flags=re.IGNORECASE)
            res = re.sub(r"\b(?:splash of milk|milk)\b", "unsweetened oat milk", res, flags=re.IGNORECASE)
            res = re.sub(r"\b(?:cheese|butter|ghee|cream|malai)\b", "cold-pressed olive oil", res, flags=re.IGNORECASE)
        # 4. Wheat / Gluten
        if any(c in excluded_cats for c in ("gluten", "wheat")):
            res = re.sub(r"\b(?:whole-wheat or barley roti|barley roti|whole-wheat roti|roti|paratha|naan|bread)\b", "sorghum/jowar millet flatbread", res, flags=re.IGNORECASE)
            res = re.sub(r"\b(?:wheat|barley|semolina|sooji|atta|maida)\b", "foxtail millet or brown rice", res, flags=re.IGNORECASE)
        # 5. Poultry / Red Meat
        if any(c in excluded_cats for c in ("poultry", "chicken", "red_meat", "meat")):
            res = re.sub(r"\b(?:grilled chicken breast|grilled chicken|chicken|poultry)\b", "pan-seared spiced tofu or daal", res, flags=re.IGNORECASE)
            res = re.sub(r"\b(?:beef|mutton|lamb|veal|pork|steak|keema)\b", "spiced chickpeas", res, flags=re.IGNORECASE)
        # 6. Fish / Seafood / Shellfish
        if any(c in excluded_cats for c in ("fish", "shellfish", "seafood")):
            res = re.sub(r"\b(?:baked herb wild fish|baked herb fish|baked white fish|salmon|tuna|fish|prawn|shrimp|machli|seafood)\b", "spiced chickpea sauté", res, flags=re.IGNORECASE)
        # 7. Soy
        if any(c in excluded_cats for c in ("soy",)):
            res = re.sub(r"\b(?:organic tofu|tofu scramble|tofu|edamame|tempeh|soya)\b", "sprouted moong daal or chickpeas", res, flags=re.IGNORECASE)
        return res

    @classmethod
    def _validate_and_finalize_concept(
        cls,
        concept: MealConcept,
        excluded: List[str],
        fallback: MealConcept,
    ) -> MealConcept:
        clean_title = cls._sanitize_food_text(concept.title, excluded)
        clean_desc = cls._sanitize_food_text(concept.description, excluded)
        clean_ingredients = [cls._sanitize_food_text(i, excluded) for i in concept.key_ingredients]

        for text in [clean_title, clean_desc] + clean_ingredients:
            is_forbidden, matched = is_food_forbidden(text, excluded)
            if is_forbidden:
                logger.debug(
                    "Meal concept '%s' contains forbidden element '%s' after sanitization. Falling back to universal hypoallergenic concept '%s'.",
                    clean_title, matched, fallback.title
                )
                return fallback

        return MealConcept(
            meal_type=concept.meal_type,
            title=clean_title,
            description=clean_desc,
            key_ingredients=clean_ingredients,
            hormonal_benefit=concept.hormonal_benefit,
            est_calories=concept.est_calories,
        )

    @classmethod
    def _build_key_guidelines(
        cls,
        is_female_pcos: bool,
        safety: SafetyEvaluationResult,
        demo: PatientDemographics,
    ) -> List[str]:
        excluded = safety.excluded_food_categories
        guidelines: List[str] = []
        seeds_excluded = any(c in excluded for c in ("seed", "seeds", "sesame"))
        if is_female_pcos:
            if any(c in excluded for c in ("tree_nut", "tree_nuts", "peanut", "peanuts", "nuts")):
                nut_word = "roasted chickpeas" if seeds_excluded else "pumpkin seeds"
            else:
                nut_word = "walnuts"
            dairy_word = ("avocado puree" if seeds_excluded else "avocado or seed dip") if any(c in excluded for c in ("dairy", "milk", "lactose")) else "plain yogurt"
            guidelines = [
                "Include a quality source of protein and fiber-rich vegetables or legumes with your main meals.",
                f"Enjoy a diverse variety of whole foods—such as lentils, chickpeas, {nut_word}, and citrus fruits—to support balanced dietary quality.",
                "Choose unsweetened beverages such as water, spearmint tea, or herbal infusions in place of sugary drinks.",
                f"Pair carbohydrates with protein or healthy fats (like {nut_word} or {dairy_word}) for steadier energy.",
                "Establish a regular, consistent meal schedule and allow an unforced 10-to-12-hour overnight window between dinner and breakfast.",
            ]
        else:
            prot_seed = "roasted chickpeas" if seeds_excluded else "pumpkin seeds"
            if demo.dietary_preference == "vegan":
                prot_sources = f"organic tofu, lentils, beans, and {prot_seed}"
            elif demo.dietary_preference in ("vegetarian", "pescatarian"):
                prot_sources = f"wild fish, eggs, paneer, and {prot_seed}" if demo.dietary_preference == "pescatarian" else f"eggs, paneer, lentils, and {prot_seed}"
            else:
                prot_sources = f"eggs, poultry, fish, beans, and {prot_seed}"
            prot_clean = cls._sanitize_food_text(prot_sources, excluded)
            guidelines = [
                f"Include nutrient-dense protein sources (such as {prot_clean}) with each meal.",
                "Eat a colorful variety of vegetables, including cruciferous vegetables like broccoli and cabbage, for micronutrient support.",
                "Choose healthy cooking fats like extra virgin olive oil or mustard oil while limiting deep-fried and highly processed foods.",
                "Limit evening alcohol and sugary snacks to promote restorative overnight sleep.",
                "Maintain consistent, adequate daily nutrition rather than extreme restrictive diets.",
            ]

        if demo.allergens or demo.allergy_status == "active_allergens":
            guidelines.append("Check packaged-food labels and cross-contact warnings for your declared allergens.")

        return guidelines

    @classmethod
    def _build_targeted_swaps(
        cls,
        context: ComprehensiveLifestyleContext,
        safety: SafetyEvaluationResult,
        is_female_pcos: bool = True,
    ) -> List[TargetedFoodSwap]:
        demo = context.demographics
        excluded = safety.excluded_food_categories
        diet = demo.dietary_preference or "omnivore"
        is_vegan = diet == "vegan"
        is_vegetarian = diet in ("vegetarian", "vegan")
        is_pescatarian = diet == "pescatarian"

        swaps: List[TargetedFoodSwap] = []
        shap_feat_names = {f.feature_name.lower(): f for f in context.shap_drivers}

        # Swap 1: Glycemic / Carbohydrates
        if "fast_food" in shap_feat_names or demo.fast_food_intake in ("frequent", "occasional") or (context.labs.fasting_glucose_mg_dl and context.labs.fasting_glucose_mg_dl > 100):
            if any(c in excluded for c in ("gluten", "wheat")):
                rec_alt = "Sorghum (jowar) or foxtail millet flatbread, or roasted chickpeas"
            else:
                rec_alt = "Whole grain barley roti, multigrain paratha with minimal oil, or roasted chickpeas"
            swaps.append(
                TargetedFoodSwap(
                    trigger_factor="Fast Food / Glycemic Load",
                    swap_title="Slower-Release Complex Grains Swap",
                    replace_food="White paratha, naan, or deep-fried samosas",
                    recommended_alternative=rec_alt,
                    clinical_mechanism="Complex whole grains digest more gradually, supporting steadier blood sugar levels after eating.",
                    impact_level="high",
                )
            )

        # Swap 2: Healthy Fats & Heart Health
        if "weight_gain" in shap_feat_names or (demo.bmi and demo.bmi >= 25.0):
            swaps.append(
                TargetedFoodSwap(
                    trigger_factor="Visceral Adiposity / Lipid Quality",
                    swap_title="Heart-Healthy Monounsaturated Oil Swap",
                    replace_food="Commercial banaspati ghee or reused vegetable cooking oils",
                    recommended_alternative="Cold-pressed mustard oil or extra virgin olive oil in measured portions",
                    clinical_mechanism="Replaces reused cooking oils with heart-healthy monounsaturated fats that support cardiovascular and metabolic wellness.",
                    impact_level="high",
                )
            )

        # Swap 3: Sweetened Beverages
        if is_female_pcos:
            if any(c in excluded for c in ("dairy", "milk", "lactose")):
                tea_alt = "Unsweetened spearmint, green, or cinnamon herbal infusion"
            else:
                tea_alt = "Unsweetened spearmint, green, or cinnamon herbal tea with a splash of milk"
        else:
            if any(c in excluded for c in ("dairy", "milk", "lactose")):
                tea_alt = "Unsweetened green tea, cardamom tea, or ginger-cinnamon herbal infusion"
            else:
                tea_alt = "Unsweetened green tea, cardamom tea, or ginger-cinnamon herbal tea with a splash of milk"
        swaps.append(
            TargetedFoodSwap(
                trigger_factor="Refined Sugar Intake",
                swap_title="Unsweetened Herbal Tea Swap",
                replace_food="Sweetened doodh patti chai (with 2-3 tsp sugar)",
                recommended_alternative=tea_alt,
                clinical_mechanism="Replacing sugar-sweetened beverages with unsweetened herbal tea reduces added sugar intake and prevents rapid blood sugar spikes.",
                impact_level="moderate",
            )
        )

        # Swap 4: Protein Satiety
        if is_vegan:
            prot_alt = "Brown basmati or daal-rich khichdi topped with spiced organic tofu or roasted chickpeas"
        elif is_vegetarian:
            if any(c in excluded for c in ("dairy", "milk", "lactose")):
                prot_alt = "Brown basmati or daal-rich khichdi topped with spiced organic tofu and moong daal"
            else:
                prot_alt = "Brown basmati or daal-rich khichdi topped with grilled paneer and moong daal"
        elif is_pescatarian:
            prot_alt = "Brown basmati or daal-rich khichdi topped with grilled wild fish or boiled eggs"
        else:
            prot_alt = "Brown basmati or daal-rich khichdi topped with grilled chicken, eggs, or paneer"

        clean_prot_alt = cls._sanitize_food_text(prot_alt, excluded)
        swaps.append(
            TargetedFoodSwap(
                trigger_factor="Protein-to-Carb Ratio",
                swap_title="Protein-First Satiety Swap",
                replace_food="Plain white rice with oily potato curry",
                recommended_alternative=clean_prot_alt,
                clinical_mechanism="Balancing carbohydrates with quality protein and fiber helps you stay full longer and supports smoother digestion.",
                impact_level="moderate",
            )
        )

        return swaps

    @classmethod
    def _build_personalized_meal_concepts(
        cls,
        context: ComprehensiveLifestyleContext,
        safety: SafetyEvaluationResult,
        has_biometrics: bool,
        is_female_pcos: bool,
        target_cals: Optional[int],
    ) -> List[MealConcept]:
        demo = context.demographics
        excluded = safety.excluded_food_categories
        diet = demo.dietary_preference or "omnivore"
        is_vegan = diet == "vegan"
        is_vegetarian = diet in ("vegetarian", "vegan")
        is_pescatarian = diet == "pescatarian"
        seeds_excluded = any(c in excluded for c in ("seed", "seeds", "sesame"))

        if not is_female_pcos:
            # -------------------------------------------------------------
            # DEDICATED MALE PERSONALIZED MEAL CONCEPTS
            # Grounded in authentic Pakistani & South Asian foods,
            # condition-aware for male metabolic and endocrine vitality.
            # STRICT ZERO PCOS REFERENCES.
            # -------------------------------------------------------------
            is_male_risk = bool(
                context.screening.has_assessment and (
                    context.screening.risk_category in ("moderate", "high", "elevated")
                    or (context.labs.total_testosterone_ng_dl is not None and context.labs.total_testosterone_ng_dl < 300.0)
                )
            )

            # Hypoallergenic Universal Fallbacks for Men
            fb_m_breakfast = MealConcept(
                meal_type="Breakfast",
                title="Savory Moong Daal & Spiced Spinach Chilla",
                description="Slow-cooked savory lentil crepe griddled with fresh baby spinach, cumin, and cold-pressed oil, served with fresh mint chutney.",
                key_ingredients=["Moong Daal", "Baby Spinach", "Cumin", "Fresh Mint Chutney"],
                hormonal_benefit="Clean plant protein and dietary fiber ensure steady glycogen replenishment and sustained morning stamina.",
                est_calories=420 if has_biometrics else None,
            )
            fb_m_lunch = MealConcept(
                meal_type="Lunch",
                title="Hearty Daal Chana Bowl with Steamed Brown Basmati & Fresh Kachumber",
                description="Slow-simmered split Bengal gram (daal chana) served with steamed brown basmati rice, crisp radish-cucumber kachumber salad, and cold-pressed mustard oil.",
                key_ingredients=["Daal Chana", "Brown Basmati Rice", "Kachumber Salad", "Cold-Pressed Mustard Oil"],
                hormonal_benefit="Slow-digesting complex pulses supply dietary fiber and plant zinc to sustain metabolic rate and steady post-meal fullness.",
                est_calories=540 if has_biometrics else None,
            )
            fb_m_dinner = MealConcept(
                meal_type="Dinner",
                title="Fragrant Palak (Spinach) Chickpea Stew with Brown Basmati",
                description="Chickpeas and dark leafy greens simmered with ginger, garlic, turmeric, and cumin, served with steamed brown rice.",
                key_ingredients=["Chickpeas", "Fresh Palak (Spinach)", "Ginger & Garlic", "Brown Basmati Rice"],
                hormonal_benefit="Magnesium and plant polyphenols support nocturnal relaxation, muscle recovery, and restorative sleep.",
                est_calories=480 if has_biometrics else None,
            )
            fb_m_snack = MealConcept(
                meal_type="Snack",
                title="Bhuna Chana (Dry-Roasted Chickpeas) & Cucumber Slices with Green Tea",
                description="Dry-roasted whole chickpeas tossed with Himalayan pink salt, cumin, and lemon, served with crisp cucumber rounds and unsweetened green tea.",
                key_ingredients=["Bhuna Chana", "Cucumber Slices", "Himalayan Pink Salt", "Green Tea"],
                hormonal_benefit="Crunchy low-glycemic plant fuel supports steady afternoon satiety and sustained focus without energy dips.",
                est_calories=200 if has_biometrics else None,
            )

            # 1. Male Breakfast Candidate
            if is_vegan or any(c in excluded for c in ("egg", "eggs")):
                mb_title = "Golden Spiced Tofu Bhurji with Baby Spinach & Warm Flatbread"
                mb_desc = "Crumbled organic tofu sautéed with cumin, turmeric, diced tomatoes, and baby spinach, served with a warm whole-wheat or sorghum flatbread."
                mb_ings = ["Organic Tofu", "Baby Spinach", "Cumin & Turmeric", "Whole-Wheat Flatbread"]
                mb_benefit = (
                    "Plant protein enriched with zinc and magnesium cofactors supports cellular metabolic health and sustained morning stamina."
                    if is_male_risk else
                    "Clean plant protein and dietary fiber provide sustained morning energy and steady fullness."
                )
            else:
                mb_title = "High-Protein Herb Omelet with Spiced Spinach & Whole Wheat Roti"
                mb_desc = "2-to-3 egg omelet prepared with baby spinach, diced tomatoes, green chilies, and black pepper, served with a small whole-wheat or barley roti."
                mb_ings = ["Eggs", "Baby Spinach", "Tomatoes & Green Chilies", "Whole-Wheat / Barley Roti"]
                mb_benefit = (
                    "Quality whole egg nutrients, choline, and healthy fats supply essential precursors for healthy endocrine balance and metabolic vitality."
                    if is_male_risk else
                    "High-quality egg protein and leafy greens deliver clean amino acids for morning muscle maintenance and sustained physical vitality."
                )

            raw_mb = MealConcept(
                meal_type="Breakfast",
                title=mb_title,
                description=mb_desc,
                key_ingredients=mb_ings,
                hormonal_benefit=mb_benefit,
                est_calories=420 if has_biometrics else None,
            )
            final_breakfast = cls._validate_and_finalize_concept(raw_mb, excluded, fb_m_breakfast)

            # 2. Male Lunch Candidate
            if not is_vegetarian and not is_pescatarian and not any(c in excluded for c in ("poultry", "chicken")):
                ml_title = "High-Protein Daal Chana Bowl with Char-Grilled Chicken Tikka & Kachumber"
                ml_desc = "Hearty split Bengal gram (daal chana) paired with lean spiced chicken tikka strips, crisp kachumber salad (onion, cucumber, tomato, lemon), and a portion of brown basmati rice."
                ml_ings = ["Daal Chana", "Grilled Chicken Tikka", "Kachumber Salad", "Brown Basmati Rice"]
                ml_benefit = (
                    "Zinc-rich legumes and lean poultry supply bioavailable zinc, magnesium, and lean amino acids crucial for male metabolic and endocrine vitality."
                    if is_male_risk else
                    "High biological value protein combined with slow-digesting complex pulses supports sustained metabolic rate and lean muscle maintenance."
                )
            elif is_pescatarian and not any(c in excluded for c in ("fish", "seafood")):
                ml_title = "Slow-Simmered Daal Chana with Pan-Seared River Fish & Fresh Kachumber"
                ml_desc = "Bengal gram daal paired with pan-seared spiced river fish or pomfret in cold-pressed mustard oil, served with fresh kachumber salad and brown basmati rice."
                ml_ings = ["Daal Chana", "Seared River Fish", "Kachumber Salad", "Cold-Pressed Mustard Oil"]
                ml_benefit = "Omega-3 fatty acids and zinc from fish support vascular health, endothelial function, and cellular vitality."
            elif is_vegetarian and not any(c in excluded for c in ("dairy", "milk", "lactose")):
                ml_title = "Lentil Daal Chana with Pan-Seared Spiced Paneer & Fresh Kachumber"
                ml_desc = "Split Bengal gram daal paired with griddled spiced paneer cubes, crisp kachumber salad, and a portion of brown basmati rice."
                ml_ings = ["Daal Chana", "Spiced Paneer", "Kachumber Salad", "Brown Basmati Rice"]
                ml_benefit = "Quality casein and whey proteins paired with zinc-rich pulses sustain amino acid availability and metabolic vitality."
            else:
                ml_title = "Daal Chana & Spiced Organic Tofu Bowl with Fresh Kachumber & Brown Rice"
                ml_desc = "Slow-cooked Bengal gram daal paired with turmeric-crusted tofu cutlets, crisp kachumber salad, and cold-pressed mustard oil."
                ml_ings = ["Daal Chana", "Organic Tofu", "Kachumber Salad", "Brown Basmati Rice"]
                ml_benefit = "Plant-derived zinc, iron, and slow-release complex carbohydrates promote steady postprandial glucose stability and endurance."

            raw_ml = MealConcept(
                meal_type="Lunch",
                title=ml_title,
                description=ml_desc,
                key_ingredients=ml_ings,
                hormonal_benefit=ml_benefit,
                est_calories=540 if has_biometrics else None,
            )
            final_lunch = cls._validate_and_finalize_concept(raw_ml, excluded, fb_m_lunch)

            # 3. Male Dinner Candidate
            if (is_pescatarian or not is_vegetarian) and not any(c in excluded for c in ("fish", "seafood")):
                md_title = "Steamed Herb Wild Fish or Salmon with Spiced Palak & Brown Basmati"
                md_desc = "Delicately spiced baked wild fish fillet served over a bed of simmered spinach and garlic, with a portion of brown basmati rice."
                md_ings = ["Wild Fish", "Fresh Palak (Spinach)", "Garlic & Cumin", "Brown Basmati Rice"]
                md_benefit = "EPA/DHA omega-3 fatty acids and magnesium promote cardiovascular elasticity, lower systemic inflammation, and enhance sleep quality."
            elif not is_vegetarian and not any(c in excluded for c in ("poultry", "chicken")):
                md_title = "Lean Palak Chicken with Steamed Brown Basmati & Low-Starch Salad"
                md_desc = "Slow-braised chicken breast simmered in iron-rich spiced spinach puree (palak) with garlic and ginger, paired with a portion of brown basmati rice."
                md_ings = ["Chicken Breast", "Fresh Palak (Spinach)", "Ginger & Garlic", "Brown Basmati Rice"]
                md_benefit = (
                    "Magnesium from dark leafy greens combined with lean zinc-rich poultry facilitates healthy nighttime recovery and tissue repair."
                    if is_male_risk else
                    "Iron, magnesium, and lean amino acids support nocturnal muscle recovery and physical stamina without heavy digestive burden."
                )
            elif is_vegetarian and not any(c in excluded for c in ("dairy", "milk", "lactose")):
                md_title = "Fragrant Palak Paneer with Light Garlic Tadka & Whole Wheat Roti"
                md_desc = "Fresh spinach puree with lightly seared paneer cubes tempered with cumin and garlic, served with a single whole-wheat roti."
                md_ings = ["Fresh Palak", "Paneer", "Garlic Tadka", "Whole-Wheat Roti"]
                md_benefit = "Natural calcium and magnesium nourish neurological relaxation, muscle recovery, and restorative overnight sleep."
            else:
                md_title = "Fragrant Palak Tofu & Chickpea Stew with Brown Rice"
                md_desc = "Pan-seared tofu and chickpeas folded into garlic-infused spinach curry, served with steamed brown basmati rice."
                md_ings = ["Fresh Palak", "Organic Tofu", "Chickpeas", "Brown Basmati Rice"]
                md_benefit = "Plant magnesium and antioxidant polyphenols reduce oxidative stress and encourage deep overnight restorative sleep."

            raw_md = MealConcept(
                meal_type="Dinner",
                title=md_title,
                description=md_desc,
                key_ingredients=md_ings,
                hormonal_benefit=md_benefit,
                est_calories=480 if has_biometrics else None,
            )
            final_dinner = cls._validate_and_finalize_concept(raw_md, excluded, fb_m_dinner)

            # 4. Male Snack Candidate
            if seeds_excluded or any(c in excluded for c in ("tree_nut", "tree_nuts", "peanut", "peanuts", "nuts")):
                ms_title = "Crisp Bhuna Chana with Cucumber Slices & Green Tea"
                ms_desc = "Dry-roasted whole chickpeas seasoned with chaat masala and lemon juice, served alongside fresh cucumber rounds and green tea."
                ms_ings = ["Bhuna Chana", "Cucumber Slices", "Lemon & Chaat Masala", "Green Tea"]
                ms_benefit = "Hypoallergenic complex plant fuel and polyphenol antioxidants support cellular energy, vascular tone, and midday satiety."
            else:
                ms_title = "Roasted Chana (Chickpeas) & Raw Pumpkin Seeds with Green Tea"
                ms_desc = "Dry-roasted chickpeas (bhuna chana) and zinc-rich raw pumpkin seeds tossed with Himalayan pink salt, accompanied by unsweetened hot steeped green tea."
                ms_ings = ["Bhuna Chana (Roasted Chickpeas)", "Pumpkin Seeds", "Himalayan Pink Salt", "Green Tea"]
                ms_benefit = (
                    "Pumpkin seeds are among the richest dietary sources of zinc and magnesium—vital micronutrients for maintaining healthy endocrine balance and cellular vitality."
                    if is_male_risk else
                    "Dense dietary fiber and plant zinc deliver steady afternoon satiety, preventing blood sugar crashes and mid-afternoon fatigue."
                )

            raw_ms = MealConcept(
                meal_type="Snack",
                title=ms_title,
                description=ms_desc,
                key_ingredients=ms_ings,
                hormonal_benefit=ms_benefit,
                est_calories=200 if has_biometrics else None,
            )
            final_snack = cls._validate_and_finalize_concept(raw_ms, excluded, fb_m_snack)

            return [final_breakfast, final_lunch, final_dinner, final_snack]

        # -------------------------------------------------------------
        # FEMALE PCOS MEAL CONCEPTS (Preserved Completely Intact)
        # -------------------------------------------------------------
        # Hypoallergenic Universal Fallbacks
        fb_breakfast = MealConcept(
            meal_type="Breakfast",
            title="Savory Moong Daal Chilla with Wilted Spinach",
            description="Slow-cooked savory lentil pancake griddled with fresh baby spinach, cumin, and cold-pressed oil, served with fresh mint chutney.",
            key_ingredients=["Moong Daal", "Spinach", "Cumin", "Fresh Mint Chutney"],
            hormonal_benefit="Clean plant protein supports consistent morning energy and steady fullness.",
            est_calories=380 if has_biometrics else None,
        )
        fb_lunch = MealConcept(
            meal_type="Lunch",
            title="High-Fiber Daal Bowl with Steamed Brown Basmati & Cucumber Salad",
            description="Slow-simmered yellow moong daal served with a small portion of brown basmati rice, crisp radish-cucumber salad, and cold-pressed mustard oil.",
            key_ingredients=["Yellow Moong Daal", "Brown Basmati Rice", "Cucumber Salad", "Cold-Pressed Mustard Oil"],
            hormonal_benefit="Complex carbohydrates and fiber nourish the gut microbiome and promote steady satiety.",
            est_calories=490 if has_biometrics else None,
        )
        fb_dinner = MealConcept(
            meal_type="Dinner",
            title="Spiced Vegetable & Chickpea Stew with Cauliflower",
            description="Chickpeas braised with zucchini, cauliflower florets, ginger, coriander, and turmeric, served with steamed brown rice.",
            key_ingredients=["Chickpeas", "Cauliflower", "Zucchini", "Ginger & Turmeric"],
            hormonal_benefit="Light, nourishing dinner supports restorative sleep and calm overnight digestion.",
            est_calories=440 if has_biometrics else None,
        )
        if seeds_excluded:
            fb_snack = MealConcept(
                meal_type="Snack",
                title="Crispy Roasted Chickpeas (Chana) & Fresh Cucumber Slices",
                description="Dry-roasted seasoned chickpeas tossed with Himalayan pink salt, cumin, and lemon, served with fresh cucumber slices and green tea.",
                key_ingredients=["Roasted Chickpeas (Chana)", "Cucumber Slices", "Himalayan Pink Salt", "Green Tea"],
                hormonal_benefit="Crunchy fiber and clean plant nourishment provide steady afternoon satiety.",
                est_calories=170 if has_biometrics else None,
            )
        else:
            fb_snack = MealConcept(
                meal_type="Snack",
                title="Crispy Roasted Foxnuts (Makhana) & Pumpkin Seeds",
                description="Dry-roasted lotus seed pops (makhana) and raw pumpkin seeds tossed with Himalayan pink salt and turmeric, served with green tea.",
                key_ingredients=["Foxnuts (Makhana)", "Pumpkin Seeds", "Himalayan Pink Salt", "Green Tea"],
                hormonal_benefit="Naturally crunchy snack rich in wholesome food nutrients and antioxidants.",
                est_calories=170 if has_biometrics else None,
            )

        # 1. Breakfast Candidate
        if is_vegan or any(c in excluded for c in ("egg", "eggs")):
            b_title = "Golden Spiced Tofu Scramble with Sautéed Greens"
            b_desc = "Spiced organic tofu scramble (or savory lentil chilla) prepared with spinach, tomatoes, and mushrooms, served with warm jowar millet flatbread."
            b_ings = ["Organic Tofu", "Spinach", "Tomatoes", "Millet Flatbread"]
        else:
            b_title = "Protein-Anchored Omelet with Spiced Veggies"
            b_desc = "2-egg omelet prepared with baby spinach, tomatoes, and mushrooms, served with 1 small whole-wheat or barley roti."
            b_ings = ["Eggs", "Spinach", "Tomatoes", "Barley / Whole Wheat"]

        raw_b = MealConcept(
            meal_type="Breakfast",
            title=b_title,
            description=b_desc,
            key_ingredients=b_ings,
            hormonal_benefit="Quality protein and vegetables provide steady morning energy without a mid-morning crash.",
            est_calories=380 if has_biometrics else None,
        )
        final_breakfast = cls._validate_and_finalize_concept(raw_b, excluded, fb_breakfast)

        # 2. Lunch Candidate
        if not is_vegetarian and not is_pescatarian and not any(c in excluded for c in ("poultry", "chicken")):
            l_title = "Lentil Daal Bowl with Herb-Grilled Chicken & Cucumber Salad"
            l_desc = "Bowl of yellow moong or masoor daal topped with grilled chicken breast, paired with a crisp cucumber-radish salad dressed with lemon and cold-pressed mustard oil."
            l_ings = ["Moong Daal", "Grilled Chicken", "Cucumber Salad", "Olive / Mustard Oil"]
        elif is_pescatarian and not any(c in excluded for c in ("fish", "seafood")):
            l_title = "Lentil Daal Bowl with Herb-Seared Wild Fish & Cucumber Salad"
            l_desc = "Bowl of yellow moong or masoor daal topped with pan-seared wild fish, accompanied by crisp cucumber-radish salad dressed with lemon and cold-pressed oil."
            l_ings = ["Moong Daal", "Wild Fish", "Cucumber Salad", "Cold-Pressed Oil"]
        elif is_vegetarian and not any(c in excluded for c in ("dairy", "milk", "lactose")):
            l_title = "Lentil Daal Bowl with Pan-Seared Paneer & Cucumber Salad"
            l_desc = "Bowl of yellow moong daal topped with lightly griddled paneer and a crisp cucumber-radish salad dressed with lemon and cold-pressed mustard oil."
            l_ings = ["Moong Daal", "Paneer", "Cucumber Salad", "Mustard Oil"]
        else:
            l_title = "High-Fiber Daal Bowl with Spiced Tofu & Cucumber Salad"
            l_desc = "Bowl of yellow moong or masoor daal topped with sautéed spiced organic tofu and a crisp cucumber-radish salad dressed with lemon and cold-pressed mustard oil."
            l_ings = ["Moong Daal", "Organic Tofu", "Cucumber Salad", "Mustard Oil"]

        raw_l = MealConcept(
            meal_type="Lunch",
            title=l_title,
            description=l_desc,
            key_ingredients=l_ings,
            hormonal_benefit="Dietary fiber and lean protein support digestive health, steady fullness, and balanced energy.",
            est_calories=490 if has_biometrics else None,
        )
        final_lunch = cls._validate_and_finalize_concept(raw_l, excluded, fb_lunch)

        # 3. Dinner Candidate
        if (is_pescatarian or not is_vegetarian) and not any(c in excluded for c in ("fish", "seafood")):
            d_title = "Baked Herb Wild Fish with Low-Starch Roasted Vegetables"
            d_desc = "Baked white fish or wild salmon sautéed with cumin and coriander, paired with steamed cauliflower rice or a small portion of brown rice."
            d_ings = ["Wild Fish", "Cauliflower", "Coriander & Cumin", "Zucchini"]
        elif not is_vegetarian and not any(c in excluded for c in ("poultry", "chicken")):
            d_title = "Herb-Roasted Lean Chicken Breast with Steamed Cruciferous Medley"
            d_desc = "Herb-marinated chicken breast braised with broccoli, cauliflower, and zucchini in cold-pressed mustard or olive oil, served with a small brown basmati portion."
            d_ings = ["Chicken Breast", "Broccoli & Cauliflower", "Cumin & Garlic", "Olive Oil"]
        elif is_vegetarian and not any(c in excluded for c in ("dairy", "milk", "lactose")):
            d_title = "Fragrant Palak Paneer with Spiced Low-Starch Medley"
            d_desc = "Fresh spinach puree with pan-seared paneer cubes, seasoned with ginger, cumin, and garlic, served with steamed brown rice."
            d_ings = ["Spinach", "Paneer", "Ginger & Garlic", "Brown Rice"]
        else:
            d_title = "Spiced Chickpea & Roasted Vegetable Stir-Fry"
            d_desc = "Chickpeas and seasonal vegetables sautéed in cumin and coriander, paired with steamed cauliflower rice or a small portion of brown rice."
            d_ings = ["Chickpeas", "Cauliflower", "Coriander & Cumin", "Zucchini"]

        raw_d = MealConcept(
            meal_type="Dinner",
            title=d_title,
            description=d_desc,
            key_ingredients=d_ings,
            hormonal_benefit="Wholesome protein and vegetables provide essential minerals and support restful overnight recovery.",
            est_calories=440 if has_biometrics else None,
        )
        final_dinner = cls._validate_and_finalize_concept(raw_d, excluded, fb_dinner)

        # 4. Snack Candidate
        if any(c in excluded for c in ("tree_nut", "tree_nuts", "peanut", "peanuts", "nuts")):
            if seeds_excluded:
                s_title = "Roasted Chana & Fresh Cucumber Slices with Green Tea"
                s_desc = "Handful of dry-roasted chickpeas (chana) paired with fresh cucumber slices and freshly steeped green tea."
                s_ings = ["Roasted Chana", "Cucumber Slices", "Green Tea"]
            else:
                s_title = "Roasted Chana & Pumpkin Seeds with Green Tea"
                s_desc = "Handful of dry-roasted chickpeas (chana) paired with raw pumpkin seeds and freshly steeped green tea."
                s_ings = ["Roasted Chana", "Pumpkin Seeds", "Green Tea"]
        else:
            s_title = "Roasted Chana & Raw Walnuts with Green Tea"
            s_desc = "Handful of dry-roasted chickpeas (chana) paired with 3-4 raw walnut halves and freshly steeped green tea."
            s_ings = ["Roasted Chana", "Walnuts", "Green Tea"]

        raw_s = MealConcept(
            meal_type="Snack",
            title=s_title,
            description=s_desc,
            key_ingredients=s_ings,
            hormonal_benefit="Crunchy fiber and healthy fats provide a satisfying afternoon bridge that supports consistent energy.",
            est_calories=170 if has_biometrics else None,
        )
        final_snack = cls._validate_and_finalize_concept(raw_s, excluded, fb_snack)

        return [final_breakfast, final_lunch, final_dinner, final_snack]

    @classmethod
    def _build_fitness_pillar(
        cls,
        context: ComprehensiveLifestyleContext,
        safety: SafetyEvaluationResult,
        is_female_pcos: bool,
    ) -> FitnessPillar:
        demo = context.demographics
        is_sedentary_beginner = (demo.activity_level in ("sedentary", "light") and not demo.regular_exercise)
        is_high_bmi_joint = bool(safety.joint_protection_active or (demo.bmi and demo.bmi >= 32.0))
        is_high_stress_fatigue = bool(safety.recovery_first_active or demo.stress_level == "severe" or (demo.activity_level == "sedentary" and "fatigue" in context.symptoms.high_severity_symptoms and not demo.regular_exercise))
        is_active_advanced = bool(demo.activity_level in ("active", "very_active") and demo.regular_exercise)

        if is_female_pcos:
            pathway_benefit = (
                "Regular physical activity supports cardiometabolic health, healthy body composition, "
                "and steady daily energy."
            )
        else:
            pathway_benefit = (
                "Regular resistance and aerobic training supports strength and metabolic health, healthy body composition, "
                "and consistent energy."
            )

        # 1. High BMI / Joint Protection Persona
        if is_high_bmi_joint:
            protocol_name = "Joint-Friendly Low-Impact Cardio & Supported Strength"
            weekly_freq = "3-4 movement days per week"
            aerobic_target = "120–150 minutes weekly of low-impact movement"
            resistance_target = "2 sessions weekly with supported machine or seated resistance"
            overview = (
                "Prioritize low-impact aerobic movement (such as stationary cycling, incline walking, or swimming) "
                "and supported strength training to support strength and metabolic health while protecting knee and lumbar joints."
            )
            recovery_text = "Prioritize joint comfort and recovery days. Supported machine-based exercises or seated bands provide excellent metabolic stimulus without joint strain."
            schedule = [
                WorkoutSession("Monday", "Supported Machine Strength", 30, "moderate", "Resistance", ["Seated Leg Press", "Seated Chest Press with Bands", "Lat Pulldown", "Supported Glute Bridges"], "Focus on smooth control; avoid breath-holding and knee lockouts."),
                WorkoutSession("Tuesday", "Low-Impact Cardio (Stationary Cycling)", 30, "moderate", "Cardio", ["Stationary Cycling", "Incline Treadmill Walk"], "Zero pounding impact; maintain steady conversational breathing."),
                WorkoutSession("Wednesday", "Joint Decompression & Gentle Mobility", 20, "low", "Mobility", ["Cat-Cow Stretches", "Seated Spinal Twists", "Ankle Circles"], "Promote joint circulation without spinal axial load."),
                WorkoutSession("Thursday", "Upper Body & Core Stabilization", 30, "moderate", "Resistance", ["Seated Dumbbell Overhead Press", "Band Rows", "Bird-Dogs from Knees", "Deadbug Holds"], "Engage abdominal brace; stop sets 2 reps before fatigue."),
                WorkoutSession("Friday", "Low-Impact Cardio (Incline Walking)", 30, "moderate", "Cardio", ["Incline Treadmill Walk", "Elliptical (low resistance)"], "Continuous fluid movement with zero shock to knees."),
                WorkoutSession("Saturday", "Functional Glute & Posterior Chain", 25, "moderate", "Resistance", ["Dumbbell Romanian Deadlifts (light)", "Seated Leg Curls", "Band Pull-Throughs"], "Hinge smoothly at the hips; maintain neutral spine."),
                WorkoutSession("Sunday", "Restorative Nature Walk & Active Rest", 25, "low", "Active Rest", ["Flat-ground nature stroll", "Deep Diaphragm Breathing"], "Allow tendons and connective tissue full rest and rejuvenation."),
            ]

        # 2. Sedentary Beginner Persona
        elif is_sedentary_beginner:
            protocol_name = "Foundational Movement & Gentle Aerobic Conditioning"
            weekly_freq = "3 movement days, 4 recovery-focused days"
            aerobic_target = "60–90 minutes weekly of gentle walking"
            resistance_target = "1 to 2 short foundational mobility and bodyweight sessions"
            overview = (
                "Build a consistent routine and establish an achievable movement habit without exhaustion. Gentle walking, foundational mobility, "
                "and supported bodyweight exercises build stamina safely."
            )
            recovery_text = "Adequate recovery is foundational. Take restorative rest days between movement sessions to prevent muscular soreness and burnout."
            schedule = [
                WorkoutSession("Monday", "Gentle Brisk Walking & Posture", 20, "low", "Walking", ["Flat-ground walking", "Arm swings", "Shoulder rolls"], "Comfortable conversational pace; breathe through your nose."),
                WorkoutSession("Tuesday", "Full Rest & Recovery", 0, "low", "Rest", ["Full Rest", "Hydration Pacing"], "Allow your muscles time to adapt to your new routine."),
                WorkoutSession("Wednesday", "Foundational Mobility & Core Awakening", 20, "low", "Mobility", ["Cat-Cow Stretches", "Chair Squats", "Wall Push-ups", "Seated Torso Twists"], "Move within your comfortable, pain-free range of motion."),
                WorkoutSession("Thursday", "Gentle Brisk Walking", 20, "low", "Walking", ["Outdoor walking", "Gentle calf raises"], "Aim for a steady, relaxed cadence."),
                WorkoutSession("Friday", "Active Recovery & Gentle Stretch", 15, "low", "Mobility", ["Seated Hamstring Stretch", "Chest Openers", "Deep Breathing"], "Release shoulder and neck tension with long exhales."),
                WorkoutSession("Saturday", "Supported Strength & Balance", 20, "low", "Resistance", ["Supported Chair Squats", "Incline Countertop Push-ups", "Bird-Dog Holds", "Glute Bridges"], "Control every movement; 3 seconds down, 1 second pause."),
                WorkoutSession("Sunday", "Restorative Leisure Walk & Family Rest", 20, "low", "Active Rest", ["Leisurely stroll", "Mindful breathing"], "Enjoy fresh air and unplug from digital devices."),
            ]

        # 3. High Fatigue / Severe Stress Persona
        elif is_high_stress_fatigue:
            protocol_name = "Restorative Aerobic Conditioning & Parasympathetic Pacing"
            weekly_freq = "3 gentle movement days, 4 restorative days"
            aerobic_target = "80–110 minutes weekly of restorative pacing"
            resistance_target = "2 to 3 gentle restorative mobility and light strength sessions"
            overview = (
                "When systemic fatigue or nervous system stress is elevated, prioritizing restorative movement and gentle pacing supports recovery without overtaxing your energy reserves. "
                "We emphasize calm pacing, restorative walks, and gentle mobility."
            )
            recovery_text = "Deep recovery is training. Avoid high-intensity straining; prioritize parasympathetic rest and restful sleep."
            schedule = [
                WorkoutSession("Monday", "Parasympathetic Nature Walk & Breath Pacing", 25, "low", "Walking", ["Outdoor walk in green space", "Physiological sigh breathing"], "Do not push pace; let your nervous system downshift."),
                WorkoutSession("Tuesday", "Restorative Yoga & Joint Mobility", 25, "low", "Mobility", ["Child's Pose", "Supported Bridge with Cushion", "Cat-Cow", "Legs-Up-the-Wall"], "Breathe deeply into your lower abdomen; release muscle tension."),
                WorkoutSession("Wednesday", "Rest & Sleep Priority", 0, "low", "Rest", ["Full recovery", "Midday 15-minute rest"], "Honor your body's energy budget with restorative downtime."),
                WorkoutSession("Thursday", "Gentle Low-Volume Resistance", 25, "low", "Resistance", ["Light Dumbbell Goblet Squats", "Incline Push-ups", "Resistance Band Face Pulls"], "Stop every set 3-4 repetitions before fatigue; zero straining."),
                WorkoutSession("Friday", "Restorative Aerobic Stroll", 25, "low", "Walking", ["Conversational walking", "Shoulder & neck release"], "Keep heart rate low and steady."),
                WorkoutSession("Saturday", "Mindful Mobility & Core Relaxation", 20, "low", "Mobility", ["Pelvic clocks", "Gentle spinal twists", "Diaphragmatic breathing"], "Release chronic tension in hip flexors and jaw."),
                WorkoutSession("Sunday", "Restorative Sunshine Walk & Epsom Soak", 25, "low", "Active Rest", ["Morning sunlight walk", "Warm bath / muscle relaxation"], "Restore circadian rhythm and prepare for the week ahead."),
            ]

        # 4. Active / Advanced Persona
        elif is_active_advanced:
            protocol_name = "Progressive Overload Strength & Aerobic Conditioning"
            weekly_freq = "4 to 5 training days per week"
            aerobic_target = "150+ minutes weekly of combined moderate and interval movement"
            resistance_target = "3 progressive strength sessions targeting all major muscle groups"
            overview = (
                "Comprehensive conditioning featuring structured progressive resistance training to support strength and metabolic health, "
                "healthy body composition, and consistent energy."
            )
            recovery_text = "Allow 48 hours of recovery between challenging strength sessions for the same muscle group to give your muscles time to rest and rebuild."
            schedule = [
                WorkoutSession("Monday", "Lower Body Compound Strength", 40, "moderate", "Resistance", ["Goblet or Barbell Squats", "Romanian Deadlifts", "Walking Lunges", "Calf Raises"], "Control eccentric descent for 3 seconds; drive through mid-foot."),
                WorkoutSession("Tuesday", "Moderate Aerobic Conditioning", 35, "moderate", "Cardio", ["Outdoor running / brisk incline walk", "Rowing machine", "Stationary cycling"], "Sustain steady Zone 2 aerobic pace (conversational breath)."),
                WorkoutSession("Wednesday", "Active Mobility & Core Stability", 25, "low", "Mobility", ["Cat-Cow", "World's Greatest Stretch", "Bird-Dogs", "Side Planks"], "Decompress spine and restore hip range of motion."),
                WorkoutSession("Thursday", "Upper Body Hypertrophy & Power", 40, "moderate", "Resistance", ["Overhead Dumbbell Press", "Dumbbell Chest Press", "Chest-Supported Rows", "Lat Pulldowns"], "Keep shoulder blades retracted and depressed; avoid shrugging."),
                WorkoutSession("Friday", "High-Intensity Interval or Aerobic Pacing", 30, "vigorous", "Cardio", ["Incline intervals (30s on / 60s off)", "Tempo cycling", "Lap swimming"], "Push power on work intervals; actively recover during rest windows."),
                WorkoutSession("Saturday", "Full Body Functional & Posterior Chain", 35, "moderate", "Resistance", ["Kettlebell Swings", "Step-ups with Dumbbells", "Face Pulls", "Hanging Knee Raises"], "Explosive hip extension with neutral lumbar spine."),
                WorkoutSession("Sunday", "Restorative Nature Walk & Parasympathetic Recovery", 30, "low", "Active Rest", ["Trail walk", "Gentle foam rolling"], "Complete relaxation to facilitate neuromuscular recovery."),
            ]

        # 5. Moderately Active Baseline Persona
        else:
            protocol_name = "Progressive Aerobic Conditioning & Resistance Protocol"
            weekly_freq = "3-4 movement days per week"
            aerobic_target = "120–150 minutes weekly of moderate-intensity movement"
            resistance_target = "2 to 3 sessions weekly targeting major muscle groups"
            overview = (
                "Build a consistent routine of moderate aerobic movement across the week, combined with 2 to 3 "
                "strength sessions to support muscle tone, metabolic health, and physical stamina."
            )
            recovery_text = "Allow 48 hours of recovery between challenging strength sessions for the same muscle group to give your muscles time to rest and rebuild."
            schedule = [
                WorkoutSession("Monday", "Full Body Strength (Compound Movements)", 35, "moderate", "Resistance", ["Goblet Squats or Seated Leg Press", "Push-ups (incline)", "Dumbbell Rows", "Glute Bridges"], "Focus on controlled 3-second lowering; avoid holding your breath."),
                WorkoutSession("Tuesday", "Moderate Aerobic Conditioning", 30, "moderate", "Cardio", ["Brisk Outdoor Walking", "Stationary Cycling", "Elliptical"], "Keep intensity conversational—you should be able to speak in short sentences."),
                WorkoutSession("Wednesday", "Active Recovery & Gentle Mobility", 20, "low", "Mobility", ["Cat-Cow Stretches", "Hip Flexor Openers", "Light Walking"], "Nourish joint circulation through gentle pacing and calm breathing."),
                WorkoutSession("Thursday", "Upper Body & Core Stability", 35, "moderate", "Resistance", ["Dumbbell Overhead Press", "Lat Pulldowns or Band Rows", "Bird-Dogs", "Plank Holds"], "Engage deep abdominal wall; stop each set 1-2 reps before failure."),
                WorkoutSession("Friday", "Moderate Aerobic Conditioning", 30, "moderate", "Cardio", ["Incline Treadmill Walk", "Swimming", "Outdoor Cycling"], "Maintain steady, comfortable pace to build aerobic endurance."),
                WorkoutSession("Saturday", "Posterior Chain & Functional Strength", 30, "moderate", "Resistance", ["Romanian Deadlifts (light dumbbells)", "Step-ups", "Face Pulls", "Side Planks"], "Maintain neutral spine throughout all hip-hinge patterns."),
                WorkoutSession("Sunday", "Restorative Rest & Parasympathetic Walk", 25, "low", "Active Rest", ["Leisurely Nature Walk", "Gentle Stretching"], "Unplug from digital screens; allow your body time to rest."),
            ]

        return FitnessPillar(
            protocol_name=protocol_name,
            weekly_frequency=weekly_freq,
            overview=overview,
            aerobic_target_minutes=aerobic_target,
            resistance_target_sessions=resistance_target,
            pathway_clinical_benefit=pathway_benefit,
            weekly_schedule=schedule,
            recovery_guidance=recovery_text,
        )

    @classmethod
    def _build_lifestyle_pillar(
        cls,
        context: ComprehensiveLifestyleContext,
    ) -> LifestylePillar:
        demo = context.demographics
        is_short_sleep = bool(demo.sleep_hours and demo.sleep_hours < 6.5)
        is_high_stress = bool(demo.stress_level in ("high", "severe"))
        is_healthy_sleep = bool(demo.sleep_hours and demo.sleep_hours >= 7.5 and demo.stress_level in ("low", "minimal"))

        habits: List[HabitRecommendation] = []

        # Habit 1: Sleep or Circadian Anchor
        if is_short_sleep:
            headline = "Prioritize Sleep Extension & Circadian Recovery"
            sleep_target = f"Expand sleep from recorded {demo.sleep_hours}h towards 7.5–8.5 hours nightly"
            habits.append(
                HabitRecommendation(
                    category="Sleep",
                    title="Sleep Opportunity Window Extension",
                    action_item="Advance your bedtime by 30 to 45 minutes and enforce a strict screen curfew 60 minutes before lights out.",
                    timing="Nightly (starting 60 mins before sleep)",
                    rationale=f"Your logged {demo.sleep_hours} hours is below restorative baseline. Expanding your sleep window supports restorative sleep, healthy body composition, and consistent daytime energy.",
                )
            )
        else:
            headline = "Consistent Sleep & Daily Rest Patterns"
            sleep_target = "7 to 9 hours nightly" if not is_healthy_sleep else "Maintain healthy 7.5 to 8.5 hours nightly"
            habits.append(
                HabitRecommendation(
                    category="Circadian",
                    title="Morning Natural Light Exposure",
                    action_item="Spend 10 to 15 minutes outdoors in natural sunlight within 60 minutes of waking.",
                    timing="Morning (within 1 hr of waking)",
                    rationale="Natural morning light helps set your internal body clock, promoting daytime alertness and easier sleep at night.",
                )
            )

        # Habit 2: Sleep Hygiene or Stress
        if is_high_stress:
            stress_protocol = "Structured cyclic sighing pauses (2x daily) and a dedicated 45-minute evening parasympathetic buffer zone."
            habits.append(
                HabitRecommendation(
                    category="Stress",
                    title="Physiological Sigh & Parasympathetic Downregulation",
                    action_item="Practice 3 minutes of cyclic physiological sighing (two quick inhales through your nose followed by a long, slow exhale through your mouth) at midday and 6 PM.",
                    timing="Midday & Late Afternoon",
                    rationale="Cyclic sighing encourages parasympathetic relaxation, helping ease acute tension and support calm focus.",
                )
            )
        else:
            stress_protocol = "Brief relaxation breathing pauses during the day and a 30-to-60-minute screen-free wind-down before bed."
            habits.append(
                HabitRecommendation(
                    category="Sleep",
                    title="Consistent Sleep & Dark Cool Environment",
                    action_item="Maintain a regular bedtime and wake time within a 30-minute window, keeping bedroom cool (18-20°C) and dark.",
                    timing="Nightly",
                    rationale="Adequate uninterrupted sleep gives your body time for essential physical recovery, cognitive focus, and general hormonal wellbeing.",
                )
            )

        # Habit 3: Mindful Pause / Breathing
        if not is_high_stress:
            habits.append(
                HabitRecommendation(
                    category="Stress",
                    title="Breath-Paced Relaxation Pause",
                    action_item="Take 3 to 5 slow, deep breaths when feeling tense or transitioning between tasks.",
                    timing="As needed / Midday pause",
                    rationale="Slow, intentional breathing signals your nervous system to ease tension and encourages a calmer state.",
                )
            )

        # Habit 4: Environmental Wellness
        habits.append(
            HabitRecommendation(
                category="Environmental",
                title="Mindful Food Storage & Containers",
                action_item="Use glass, ceramic, or stainless steel containers when warming food or storing hot beverages.",
                timing="Daily lifestyle",
                rationale="Using glass or stainless steel for hot foods and drinks reduces exposure to plastic chemicals and supports overall environmental wellness.",
            )
        )

        return LifestylePillar(
            circadian_headline=headline,
            sleep_target_hours=sleep_target,
            stress_management_protocol=stress_protocol,
            recommended_habits=habits,
        )
