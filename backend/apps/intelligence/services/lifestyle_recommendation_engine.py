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
    CLINICAL_DISCLAIMER,
    LifestyleSafetyEngine,
    SafetyEvaluationResult,
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
                note = "Maintaining energy balance is prioritized to support consistent vitality and overall hormonal wellness without caloric deficit."
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

            key_guidelines = [
                "Include a quality source of protein and fiber-rich vegetables or legumes with your main meals.",
                "Enjoy a diverse variety of whole foods—such as lentils, chickpeas, walnuts, and citrus fruits—to support balanced dietary quality.",
                "Choose unsweetened beverages such as water, spearmint tea, or herbal infusions in place of sugary drinks.",
                "Pair carbohydrates with protein or healthy fats (like nuts or plain yogurt) for steadier energy.",
                "Establish a regular, consistent meal schedule and allow an unforced 10-to-12-hour overnight window between dinner and breakfast.",
            ]
        else:
            strat_title = "Nutrient-Dense Balanced Nutrition for Men"
            strat_summary = (
                "Focuses on wholesome proteins, colorful vegetables, and essential minerals to support "
                "body composition, metabolic health, and physical vitality."
            )
            key_guidelines = [
                "Include nutrient-dense protein sources (such as eggs, poultry, fish, beans, and pumpkin seeds) with each meal.",
                "Eat a colorful variety of vegetables, including cruciferous vegetables like broccoli and cabbage, for micronutrient support.",
                "Choose healthy cooking fats like extra virgin olive oil or mustard oil while limiting deep-fried and highly processed foods.",
                "Limit evening alcohol and sugary snacks to promote restorative overnight sleep.",
                "Maintain consistent, adequate daily nutrition rather than extreme restrictive diets.",
            ]

        # Targeted Food Swaps (driven by SHAP & Patient Factors)
        targeted_swaps: List[TargetedFoodSwap] = []
        shap_feat_names = {f.feature_name.lower(): f for f in shap_drivers}

        # Swap 1: Glycemic / Carbohydrates
        if "fast_food" in shap_feat_names or demo.fast_food_intake in ("frequent", "occasional") or (labs.fasting_glucose_mg_dl and labs.fasting_glucose_mg_dl > 100):
            targeted_swaps.append(
                TargetedFoodSwap(
                    trigger_factor="Fast Food / Glycemic Load",
                    swap_title="Slower-Release Complex Grains Swap",
                    replace_food="White paratha, naan, or deep-fried samosas",
                    recommended_alternative="Whole grain barley roti, multigrain paratha with minimal oil, or roasted chickpeas",
                    clinical_mechanism="Complex whole grains digest more gradually, supporting steadier blood sugar levels after eating.",
                    impact_level="high",
                )
            )

        # Swap 2: Healthy Fats & Heart Health
        if "weight_gain" in shap_feat_names or (demo.bmi and demo.bmi >= 25.0):
            targeted_swaps.append(
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
        targeted_swaps.append(
            TargetedFoodSwap(
                trigger_factor="Refined Sugar Intake",
                swap_title="Unsweetened Herbal Tea Swap",
                replace_food="Sweetened doodh patti chai (with 2-3 tsp sugar)",
                recommended_alternative="Unsweetened spearmint, green, or cinnamon herbal tea with a splash of milk",
                clinical_mechanism="Replacing sugar-sweetened beverages with unsweetened herbal tea reduces added sugar intake and prevents rapid blood sugar spikes.",
                impact_level="moderate",
            )
        )

        # Swap 4: Protein Satiety
        targeted_swaps.append(
            TargetedFoodSwap(
                trigger_factor="Protein-to-Carb Ratio",
                swap_title="Protein-First Satiety Swap",
                replace_food="Plain white rice with oily potato curry",
                recommended_alternative="Brown basmati or daal-rich khichdi topped with grilled chicken, eggs, or paneer",
                clinical_mechanism="Balancing carbohydrates with quality protein and fiber helps you stay full longer and supports smoother digestion.",
                impact_level="moderate",
            )
        )

        # Meal Concepts
        meal_concepts = [
            MealConcept(
                meal_type="Breakfast",
                title="Protein-Anchored Omelet with Spiced Veggies",
                description="2-egg omelet (or spiced tofu scramble) prepared with spinach, tomatoes, and mushrooms, served with 1 small whole-wheat or barley roti.",
                key_ingredients=["Eggs / Tofu", "Spinach", "Tomatoes", "Barley / Whole Wheat"],
                hormonal_benefit="Quality protein and vegetables provide steady morning energy without a mid-morning crash.",
                est_calories=380 if has_biometrics else None,
            ),
            MealConcept(
                meal_type="Lunch",
                title="Lentil Daal Bowl with Lean Protein & Cucumber Salad",
                description="Bowl of yellow moong or masoor daal topped with grilled chicken or paneer, a side of crisp cucumber-radish salad dressed with lemon and cold-pressed mustard oil.",
                key_ingredients=["Moong Daal", "Grilled Chicken / Paneer", "Cucumber Salad", "Olive / Mustard Oil"],
                hormonal_benefit="Dietary fiber and lean protein support digestive health, steady fullness, and balanced energy.",
                est_calories=490 if has_biometrics else None,
            ),
            MealConcept(
                meal_type="Dinner",
                title="Baked Herb Fish or Spiced Chickpea Stir-Fry",
                description="Baked white fish, salmon, or chickpea-vegetable medley sauteed in cumin and coriander, paired with steamed cauliflower rice or small portion of brown rice.",
                key_ingredients=["Fish / Chickpeas", "Cauliflower", "Coriander & Cumin", "Zucchini"],
                hormonal_benefit="Wholesome protein and vegetables provide essential minerals and support restful overnight recovery.",
                est_calories=440 if has_biometrics else None,
            ),
            MealConcept(
                meal_type="Snack",
                title="Roasted Chana & Raw Walnuts with Green Tea",
                description="Handful of dry-roasted chickpeas (chana) paired with 3-4 raw walnut halves and freshly steeped green tea.",
                key_ingredients=["Roasted Chana", "Walnuts", "Green Tea"],
                hormonal_benefit="Crunchy fiber and healthy fats provide a satisfying afternoon bridge without a blood sugar spike.",
                est_calories=170 if has_biometrics else None,
            ),
        ]

        nutrition_pillar = NutritionPillar(
            strategy_title=strat_title,
            strategy_summary=strat_summary,
            key_guidelines=key_guidelines,
            daily_targets=daily_targets,
            targeted_swaps=targeted_swaps,
            meal_concepts=meal_concepts,
        )

        # -------------------------------------------------------------
        # 3. Fitness Pillar (Non-Dogmatic, Supportive Guidance)
        # -------------------------------------------------------------
        if safety.joint_protection_active:
            protocol_name = "Joint-Friendly Moderate Aerobic & Supported Strength"
            aerobic_target = "120–150 minutes weekly of low-impact movement"
            resistance_target = "2 sessions weekly with supported form"
            overview = (
                "Lower-impact activity (such as brisk walking, cycling, water exercise, or supported resistance) "
                "may be a more comfortable starting option depending on your current fitness level and joint comfort."
            )
            recovery_text = "Prioritize joint comfort and recovery days. Supported machine-based exercises or seated bands provide excellent metabolic stimulus without joint strain."
        else:
            protocol_name = "Progressive Aerobic Conditioning & Resistance Protocol"
            aerobic_target = "120–150 minutes weekly of moderate-intensity movement"
            resistance_target = "2 to 3 sessions weekly targeting major muscle groups"
            overview = (
                "Build a consistent routine of moderate aerobic movement across the week, combined with 2 to 3 "
                "strength sessions to support muscle tone, metabolic health, and physical stamina."
            )
            recovery_text = "Allow 48 hours of recovery between challenging strength sessions for the same muscle group to give your muscles time to rest and rebuild."

        if is_female_pcos:
            pathway_benefit = (
                "Regular physical activity helps your muscles use glucose efficiently, supports cardiovascular fitness, "
                "and promotes steady daily energy."
            )
        else:
            pathway_benefit = (
                "Regular resistance and aerobic training supports physical strength, body composition, metabolic health, "
                "and everyday vitality."
            )

        weekly_schedule = [
            WorkoutSession(
                day_name="Monday",
                focus="Full Body Strength (Compound Movements)",
                duration_mins=35,
                intensity="moderate",
                modality="Resistance",
                key_movements=["Goblet Squats or Seated Leg Press", "Push-ups (incline)", "Dumbbell Rows", "Glute Bridges"],
                coaching_cue="Focus on controlled 3-second lowering (eccentric phase); avoid holding your breath.",
            ),
            WorkoutSession(
                day_name="Tuesday",
                focus="Moderate Aerobic Conditioning",
                duration_mins=30,
                intensity="moderate",
                modality="Cardio",
                key_movements=["Brisk Outdoor Walking", "Stationary Cycling", "Elliptical"],
                coaching_cue="Keep intensity conversational—you should be able to speak in short sentences without gasping.",
            ),
            WorkoutSession(
                day_name="Wednesday",
                focus="Active Recovery & Gentle Mobility",
                duration_mins=20,
                intensity="low",
                modality="Mobility / Rest",
                key_movements=["Cat-Cow Stretches", "Hip Flexor Openers", "Light Walking"],
                coaching_cue="Nourish joint circulation and promote relaxation through gentle pacing and calm breathing.",
            ),
            WorkoutSession(
                day_name="Thursday",
                focus="Upper Body & Core Stability",
                duration_mins=35,
                intensity="moderate",
                modality="Resistance",
                key_movements=["Dumbbell Overhead Press", "Lat Pulldowns or Band Rows", "Bird-Dogs", "Plank Holds"],
                coaching_cue="Engage deep abdominal wall; stop each set 1-2 repetitions before total muscular failure.",
            ),
            WorkoutSession(
                day_name="Friday",
                focus="Moderate Aerobic Conditioning",
                duration_mins=30,
                intensity="moderate",
                modality="Cardio",
                key_movements=["Incline Treadmill Walk", "Swimming", "Outdoor Cycling"],
                coaching_cue="Maintain a steady, comfortable pace to build aerobic endurance and support cardiovascular health.",
            ),
            WorkoutSession(
                day_name="Saturday",
                focus="Posterior Chain & Functional Strength",
                duration_mins=30,
                intensity="moderate",
                modality="Resistance",
                key_movements=["Romanian Deadlifts (light dumbbells)", "Step-ups", "Face Pulls", "Side Planks"],
                coaching_cue="Maintain neutral spine throughout all hip-hinge patterns.",
            ),
            WorkoutSession(
                day_name="Sunday",
                focus="Restorative Rest & Parasympathetic Walk",
                duration_mins=25,
                intensity="low",
                modality="Active Rest",
                key_movements=["Leisurely Nature Walk", "Gentle Stretching"],
                coaching_cue="Unplug from digital screens; allow your body time to rest and recover from weekly activities.",
            ),
        ]

        fitness_pillar = FitnessPillar(
            protocol_name=protocol_name,
            weekly_frequency="3-4 movement days per week",
            overview=overview,
            aerobic_target_minutes=aerobic_target,
            resistance_target_sessions=resistance_target,
            pathway_clinical_benefit=pathway_benefit,
            weekly_schedule=weekly_schedule,
            recovery_guidance=recovery_text,
        )

        # -------------------------------------------------------------
        # 4. Lifestyle Pillar (Circadian, Sleep, Stress)
        # -------------------------------------------------------------
        lifestyle_habits = [
            HabitRecommendation(
                category="Circadian",
                title="Morning Natural Light Exposure",
                action_item="Spend 10 to 15 minutes outdoors in natural sunlight within 60 minutes of waking.",
                timing="Morning (within 1 hr of waking)",
                rationale="Natural morning light helps set your internal body clock, promoting daytime alertness and easier sleep at night.",
            ),
            HabitRecommendation(
                category="Sleep",
                title="Consistent 7 to 9 Hours of Sleep",
                action_item="Maintain a regular bedtime and wake time within a 30-minute window, keeping bedroom cool (18-20°C) and quiet.",
                timing="Nightly",
                rationale="Adequate uninterrupted sleep gives your body time for essential physical recovery, cognitive focus, and balanced hormones.",
            ),
            HabitRecommendation(
                category="Stress",
                title="Breath-Paced Relaxation Pause",
                action_item="Take 3 to 5 slow, deep breaths (two quick inhales through your nose followed by a long, slow exhale through your mouth) when feeling tense.",
                timing="As needed / Midday pause",
                rationale="Slow, intentional breathing signals your nervous system to ease tension and encourages a calmer state.",
            ),
            HabitRecommendation(
                category="Environmental",
                title="Mindful Food Storage & Containers",
                action_item="Use glass, ceramic, or stainless steel containers when warming food or storing hot beverages.",
                timing="Daily lifestyle",
                rationale="Using glass or stainless steel for hot foods and drinks reduces exposure to plastic chemicals and supports overall environmental wellness.",
            ),
        ]

        lifestyle_pillar = LifestylePillar(
            circadian_headline="Consistent Sleep & Daily Rest Patterns",
            sleep_target_hours="7 to 9 hours nightly",
            stress_management_protocol="Brief relaxation breathing pauses during the day and a 30-to-60-minute screen-free wind-down before bed.",
            recommended_habits=lifestyle_habits,
        )

        # -------------------------------------------------------------
        # 5. Evidence Rationale
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

        clinical_synthesis = (
            f"Recommendations are dynamically derived from your active {screening.module.replace('_', ' ').title()} "
            f"screening profile (Category: {screening.risk_category.title()}, Probability: {screening.probability_percent:.1f}%). "
            f"The rule-based engine incorporates {len(attr_shap)} model-attributed risk factors, {len(attr_labs)} verified laboratory markers, "
            f"and {len(attr_symptoms)} reported symptoms to calibrate nutritional distribution, physical movement, and circadian recovery."
        )

        evidence_rationale = EvidenceRationale(
            attributed_shap_drivers=attr_shap,
            attributed_lab_markers=attr_labs,
            attributed_symptoms=attr_symptoms,
            clinical_synthesis=clinical_synthesis,
        )

        # -------------------------------------------------------------
        # 6. Structured Recommendation Items (Answering all 5 Audit Questions)
        # -------------------------------------------------------------
        recommendations: List[RecommendationItem] = []

        # Determine Longitudinal Status helper
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

        # SHAP priority check for Nutrition
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

        # SHAP priority check for Exercise / Activity
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
            fit_action_summary = overview

        fit_evidence_id = "joint_friendly_movement" if safety.joint_protection_active else "who_aerobic_activity"

        recommendations.append(
            RecommendationItem(
                id="fit-protocol-primary",
                category="fitness",
                title=protocol_name,
                action_summary=fit_action_summary,
                priority=fit_priority,
                status=fitness_status,
                why_this_is_recommended=pathway_benefit,
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

        sleep_priority = "high" if (demo.sleep_hours and demo.sleep_hours < 6.5) or demo.stress_level in ("high", "severe") else "moderate"

        recommendations.append(
            RecommendationItem(
                id="life-circadian-sleep",
                category="lifestyle",
                title="Natural Morning Light & Consistent Sleep",
                action_summary="Spend 10-15 minutes in natural morning sunlight and establish a consistent 7-9 hour nightly sleep window.",
                priority=sleep_priority,
                status=sleep_status,
                why_this_is_recommended="Consistent sleep and morning daylight support daytime alertness, metabolic health, and restorative rest.",
                based_on_patient_data=sleep_data_used,
                longitudinal_basis=sleep_long_basis,
                shap_priority_basis=None,
                safety_status="ALLOW",
                evidence_id="aasm_sleep_duration",
                clinician_review=False,
            )
        )

        # Recommendation 4: Clinical Review Item if flagged by Safety Engine
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
            risk_category=screening.risk_category,
            risk_probability_percent=screening.probability_percent,
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
        )
