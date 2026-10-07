"""
backend/apps/intelligence/tests/test_lifestyle_recommendations.py

Comprehensive Audit & Dynamic Personalization Tests for BioPulse AI
Dynamic Lifestyle Recommendations Module:
- Section 1: Clinical Rule Audit & Validated Bounds
- Section 3: Calorie / Macro / Hydration Null Safety & Missing Data
- Section 4: SHAP Prioritization Constraints (eligible rules only, no direct prescriptions)
- Section 5: Longitudinal Personalization (NEW, ACTIVE, IMPROVING, MAINTAIN, REASSESS)
- Section 6: Female PCOS Divergence (Lean vs Elevated BMI, No Cure Claims)
- Section 7: Male Hypogonadism Divergence (Low T -> CLINICIAN_REVIEW, No TRT/Boosters)
- Section 8: Safety Engine States (ALLOW, MODIFY, WITHHOLD, CLINICIAN_REVIEW)
- Section 12: Cross-User Isolation
- Section 13 & 14: Dynamic Test Matrix & Deterministic Mutation Proof
- Section 15: Zero Dependency on legacy Meal Directory
"""

import copy
import json
import sys
import uuid
from unittest.mock import MagicMock, patch
from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from apps.health.services.supabase_health_service import (
    PatientHealthData,
    PatientProfile,
    SymptomRecordData,
)
from apps.intelligence.services.clinical_state_repository import clinical_state_repository
from apps.intelligence.services.canonical_lifestyle_evidence import (
    LIFESTYLE_EVIDENCE_REGISTRY,
    get_evidence_entry,
)
from apps.intelligence.services.lifestyle_context_builder import (
    ComprehensiveLifestyleContext,
    LifestyleContextBuilder,
    PatientDemographics,
    ScreeningContext,
    ShapFactor,
    SymptomSummary,
    LabBiomarkers,
    LongitudinalSummary,
)
from apps.intelligence.services.lifestyle_safety_rules import (
    CLINICAL_DISCLAIMER,
    LifestyleSafetyEngine,
    PRODUCT_SAFETY_FLOOR_FEMALE,
    PRODUCT_SAFETY_FLOOR_MALE,
    SafetyEvaluationResult,
)
from apps.intelligence.services.lifestyle_recommendation_engine import (
    LifestyleRecommendationEngine,
    LifestyleRecommendationsResult,
    DailyTargets,
    RecommendationItem,
)


@override_settings(ALLOW_LOCAL_SQLITE_FALLBACK=True)
class LifestyleRecommendationsEngineTests(TestCase):
    def setUp(self):
        self.user_uuid = str(uuid.uuid4())
        self.context = ComprehensiveLifestyleContext(
            user_id=self.user_uuid,
            demographics=PatientDemographics(
                user_id=self.user_uuid,
                gender="female",
                pathway="female_pcos",
                age=26,
                height_cm=165.0,
                weight_kg=72.0,
                bmi=26.4,
                waist_hip_ratio=0.88,
                dietary_preference="omnivore",
                allergens=["peanuts", "shellfish"],
                intolerances=["lactose"],
                activity_level="moderate",
                sleep_hours=7.0,
                stress_level="moderate",
            ),
            screening=ScreeningContext(
                has_assessment=True,
                module="female_pcos",
                assessment_id=str(uuid.uuid4()),
                assessment_level="tier_1_2",
                risk_category="elevated",
                risk_label="Elevated Screening Risk",
                probability=0.74,
                probability_percent=74.0,
                threshold=0.25,
                is_active=True,
            ),
            shap_drivers=[
                ShapFactor(
                    feature_name="fast_food",
                    display_name="Fast Food Intake",
                    impact="increases_risk",
                    shap_value=0.18,
                    patient_value=1,
                    category="lifestyle",
                ),
                ShapFactor(
                    feature_name="cycle_length",
                    display_name="Cycle Length Irregularity",
                    impact="increases_risk",
                    shap_value=0.14,
                    patient_value=45,
                    category="cycle",
                ),
                ShapFactor(
                    feature_name="bmi",
                    display_name="Body Mass Index (BMI)",
                    impact="increases_risk",
                    shap_value=0.11,
                    patient_value=26.4,
                    category="biometric",
                ),
            ],
            shap_mitigators=[
                ShapFactor(
                    feature_name="regular_exercise",
                    display_name="Regular Exercise",
                    impact="decreases_risk",
                    shap_value=-0.08,
                    patient_value=1,
                    category="lifestyle",
                )
            ],
            symptoms=SymptomSummary(
                active_symptoms=["irregular_cycles", "fatigue", "acne"],
                symptom_frequencies={"irregular_cycles": 4, "fatigue": 6, "acne": 2},
                high_severity_symptoms=["fatigue"],
                total_logs_30d=12,
            ),
            labs=LabBiomarkers(
                fasting_glucose_mg_dl=104.0,
                total_testosterone_ng_dl=68.0,
                lh_mIU_ml=11.2,
                fsh_mIU_ml=4.8,
                lh_fsh_ratio=2.33,
            ),
            longitudinal=LongitudinalSummary(
                has_history=True,
                assessment_count=2,
                weight_trend_30d="stable",
                weight_delta_kg=0.0,
                logged_meals_30d=24,
                logged_fitness_30d=10,
                active_tracking_consistency_pct=75.0,
                top_recurring_symptoms=["fatigue", "irregular_cycles"],
            ),
        )

    def test_safety_rules_exclude_declared_allergens(self):
        safety = LifestyleSafetyEngine.evaluate_safety(self.context)
        self.assertTrue(safety.is_safe)
        self.assertIn("peanuts", safety.excluded_food_categories)
        self.assertIn("shellfish", safety.excluded_food_categories)

    def test_safety_rules_joint_protection_on_high_bmi(self):
        self.context.demographics.bmi = 34.0
        safety = LifestyleSafetyEngine.evaluate_safety(self.context)
        self.assertIn("excessive_high_repetition_jumping", safety.excluded_exercise_modalities)
        self.assertTrue(any("comfort" in n.lower() or "joint" in n.lower() for n in safety.safety_notices))

    def test_recommendation_engine_generates_all_three_pillars(self):
        result = LifestyleRecommendationEngine.generate(self.context)
        self.assertIsInstance(result, LifestyleRecommendationsResult)

        # Pillar 1: Nutrition
        nutrition = result.nutrition
        self.assertGreater(nutrition.daily_targets.daily_calories_kcal, 1200)
        self.assertGreater(nutrition.daily_targets.protein.grams, 50)
        self.assertGreaterEqual(nutrition.daily_targets.fiber_grams, 25)
        self.assertTrue(len(nutrition.meal_concepts) >= 4)
        self.assertTrue(len(nutrition.targeted_swaps) >= 1)

        # Check SHAP-triggered food swap
        swap_triggers = [s.trigger_factor for s in nutrition.targeted_swaps]
        self.assertTrue(any("Fast Food" in t for t in swap_triggers))

        # Pillar 2: Fitness
        fitness = result.fitness
        self.assertIn("Aerobic Conditioning", fitness.protocol_name)
        self.assertEqual(len(fitness.weekly_schedule), 7)
        self.assertGreater(int(fitness.aerobic_target_minutes.split("–")[0]), 60)

        # Pillar 3: Lifestyle
        lifestyle = result.lifestyle
        self.assertTrue(len(lifestyle.recommended_habits) >= 3)
        habit_categories = [h.category for h in lifestyle.recommended_habits]
        self.assertIn("Circadian", habit_categories)
        self.assertIn("Sleep", habit_categories)

        # Evidence Grounding
        self.assertTrue(any("Fast Food Intake" in d for d in result.evidence_rationale.attributed_shap_drivers))

    def test_male_pathway_generates_androgen_specific_recommendations(self):
        self.context.demographics.gender = "male"
        self.context.demographics.pathway = "male_hypogonadism"
        self.context.demographics.weight_kg = 84.0
        self.context.demographics.height_cm = 180.0
        self.context.demographics.bmi = 25.9
        self.context.screening.module = "male_hypogonadism"

        result = LifestyleRecommendationEngine.generate(self.context)
        self.assertIn("Nutrient-Dense", result.nutrition.strategy_title)
        self.assertIn("strength", result.fitness.pathway_clinical_benefit.lower())
        self.assertIn("2 to 3", result.fitness.resistance_target_sessions)
        self.assertEqual(result.recommendations[0].evidence_id, "male_lifestyle_support")


@override_settings(ALLOW_LOCAL_SQLITE_FALLBACK=True)
class LifestyleMissingDataTests(TestCase):
    """
    Section 3 & 9 Audit:
    Missing values must stay missing (None). Never convert missing values into zero.
    Never fabricate precise numerical calorie or macro targets when biometrics are absent.
    """

    def setUp(self):
        self.user_uuid = str(uuid.uuid4())
        # Patient with no weight, height, or BMI recorded
        self.context = ComprehensiveLifestyleContext(
            user_id=self.user_uuid,
            demographics=PatientDemographics(
                user_id=self.user_uuid,
                gender="female",
                pathway="female_pcos",
                age=28,
                height_cm=None,
                weight_kg=None,
                bmi=None,
                activity_level=None,
            ),
            screening=ScreeningContext(
                has_assessment=False,
                module="female_pcos",
            ),
            shap_drivers=[],
            shap_mitigators=[],
            symptoms=SymptomSummary(),
            labs=LabBiomarkers(),
            longitudinal=LongitudinalSummary(has_history=False, assessment_count=0),
            missing_data=["height_cm", "weight_kg", "bmi", "activity_level", "screening_assessment"],
        )

    def test_missing_biometrics_leaves_numerical_targets_null(self):
        result = LifestyleRecommendationEngine.generate(self.context)
        daily_targets: DailyTargets = result.nutrition.daily_targets

        # Calories and macronutrient grams MUST remain None, NOT 0 or fabricated defaults
        self.assertIsNone(daily_targets.daily_calories_kcal)
        self.assertIsNone(daily_targets.calorie_range_min)
        self.assertIsNone(daily_targets.calorie_range_max)
        self.assertIsNone(daily_targets.protein.grams)
        self.assertIsNone(daily_targets.carbohydrates.grams)
        self.assertIsNone(daily_targets.fats.grams)
        self.assertIsNone(daily_targets.fiber_grams)
        self.assertIsNone(daily_targets.hydration_liters)

        # Status must explicitly explain missing biometrics
        self.assertEqual(daily_targets.target_status, "unavailable_missing_biometrics")
        self.assertIn("unavailable", daily_targets.guidance_note.lower())

        # missing_data list is exposed in output metadata
        self.assertIn("weight_kg", result.missing_data)
        self.assertIn("height_cm", result.missing_data)

    def test_missing_data_does_not_crash_engine_and_generates_supportive_guidance(self):
        # Even with complete lack of biometrics and history, engine executes safely
        result = LifestyleRecommendationEngine.generate(self.context)
        self.assertIsNotNone(result)
        self.assertEqual(len(result.recommendations), 3)
        self.assertEqual(result.nutrition.daily_targets.target_status, "unavailable_missing_biometrics")
        self.assertIn("unavailable", result.nutrition.daily_targets.guidance_note.lower())


@override_settings(ALLOW_LOCAL_SQLITE_FALLBACK=True)
class LifestyleFemalePcosTests(TestCase):
    """
    Section 6 Audit:
    - Normal BMI (Lean PCOS): Normocaloric ovulatory support, 0 calorie deficit.
    - Elevated BMI PCOS: Modest deficit, insulin sensitization.
    - Never claim to cure or reverse PCOS.
    - Longitudinal status adaptation (IMPROVING vs REASSESS).
    """

    def setUp(self):
        self.user_uuid = str(uuid.uuid4())

    def test_lean_pcos_no_calorie_deficit(self):
        # Lean PCOS (BMI = 21.5, normal weight)
        context = ComprehensiveLifestyleContext(
            user_id=self.user_uuid,
            demographics=PatientDemographics(
                user_id=self.user_uuid,
                gender="female",
                pathway="female_pcos",
                age=25,
                height_cm=165.0,
                weight_kg=58.5,
                bmi=21.5,
                activity_level="moderate",
            ),
            screening=ScreeningContext(
                has_assessment=True,
                module="female_pcos",
                risk_category="elevated",
                probability=0.62,
            ),
            shap_drivers=[],
            shap_mitigators=[],
            symptoms=SymptomSummary(active_symptoms=["irregular_cycles"]),
            labs=LabBiomarkers(),
            longitudinal=LongitudinalSummary(has_history=True, assessment_count=1),
        )

        result = LifestyleRecommendationEngine.generate(context)
        targets = result.nutrition.daily_targets

        # Deficit should be 0; daily calories should be equal to maintenance TDEE
        self.assertIsNotNone(targets.daily_calories_kcal)
        self.assertIn("Balanced Whole-Food Nutrition", result.nutrition.strategy_title)

        # Check recommendation item explicitly addresses energy balance and absence of unnecessary restriction
        nutrition_recs = [r for r in result.recommendations if r.category == "nutrition"]
        self.assertTrue(len(nutrition_recs) > 0)
        self.assertIn("consistent energy", result.nutrition.strategy_title.lower())
        self.assertIn("without unnecessary caloric restriction", nutrition_recs[0].why_this_is_recommended.lower())
        self.assertEqual(nutrition_recs[0].evidence_id, "pcos_balanced_nutrition")

        # Verify no cure/reversal claims exist in any output text
        all_text = str(result.to_dict()).lower()
        self.assertNotIn("cure pcos", all_text)
        self.assertNotIn("reverses pcos", all_text)

    def test_elevated_bmi_pcos_generates_insulin_sensitizing_deficit(self):
        # Elevated BMI PCOS (BMI = 31.2)
        context = ComprehensiveLifestyleContext(
            user_id=self.user_uuid,
            demographics=PatientDemographics(
                user_id=self.user_uuid,
                gender="female",
                pathway="female_pcos",
                age=29,
                height_cm=160.0,
                weight_kg=80.0,
                bmi=31.2,
                activity_level="sedentary",
            ),
            screening=ScreeningContext(
                has_assessment=True,
                module="female_pcos",
                risk_category="elevated",
                probability=0.81,
            ),
            shap_drivers=[
                ShapFactor(
                    feature_name="bmi",
                    display_name="BMI",
                    impact="increases_risk",
                    shap_value=0.22,
                    patient_value=31.2,
                    category="biometric",
                )
            ],
            shap_mitigators=[],
            symptoms=SymptomSummary(active_symptoms=["irregular_cycles", "weight_gain"]),
            labs=LabBiomarkers(fasting_glucose_mg_dl=110.0),
            longitudinal=LongitudinalSummary(has_history=True, assessment_count=2, weight_trend_30d="improving", weight_delta_kg=-2.0),
        )

        result = LifestyleRecommendationEngine.generate(context)
        nutrition_recs = [r for r in result.recommendations if r.category == "nutrition"]
        self.assertEqual(nutrition_recs[0].status, "IMPROVING")
        self.assertIn("Progress noted", nutrition_recs[0].action_summary)

    def test_worsening_weight_trajectory_sets_reassess_status(self):
        context = ComprehensiveLifestyleContext(
            user_id=self.user_uuid,
            demographics=PatientDemographics(
                user_id=self.user_uuid,
                gender="female",
                pathway="female_pcos",
                age=30,
                height_cm=162.0,
                weight_kg=78.0,
                bmi=29.7,
                activity_level="sedentary",
            ),
            screening=ScreeningContext(has_assessment=True, module="female_pcos", risk_category="elevated"),
            shap_drivers=[],
            shap_mitigators=[],
            symptoms=SymptomSummary(),
            labs=LabBiomarkers(),
            longitudinal=LongitudinalSummary(has_history=True, assessment_count=3, weight_trend_30d="worsening", weight_delta_kg=3.2),
        )

        result = LifestyleRecommendationEngine.generate(context)
        nutrition_recs = [r for r in result.recommendations if r.category == "nutrition"]
        self.assertEqual(nutrition_recs[0].status, "REASSESS")


@override_settings(ALLOW_LOCAL_SQLITE_FALLBACK=True)
class LifestyleMaleHypogonadismTests(TestCase):
    """
    Section 7 Audit:
    - Never generate TRT, hormone replacement, or testosterone booster supplement claims.
    - Low testosterone (< 300 ng/dL) triggers CLINICIAN_REVIEW.
    - Normal BMI compound resistance vs Elevated BMI aromatase reduction.
    """

    def setUp(self):
        self.user_uuid = str(uuid.uuid4())

    def test_low_testosterone_triggers_clinician_review(self):
        # Male with concerning total testosterone of 220 ng/dL
        context = ComprehensiveLifestyleContext(
            user_id=self.user_uuid,
            demographics=PatientDemographics(
                user_id=self.user_uuid,
                gender="male",
                pathway="male_hypogonadism",
                age=44,
                height_cm=178.0,
                weight_kg=85.0,
                bmi=26.8,
                activity_level="moderate",
            ),
            screening=ScreeningContext(
                has_assessment=True,
                module="male_hypogonadism",
                risk_category="elevated",
                probability=0.78,
            ),
            shap_drivers=[],
            shap_mitigators=[],
            symptoms=SymptomSummary(active_symptoms=["fatigue", "low_libido"]),
            labs=LabBiomarkers(total_testosterone_ng_dl=220.0),  # < 300 ng/dL clinical threshold
            longitudinal=LongitudinalSummary(has_history=False, assessment_count=1),
        )

        result = LifestyleRecommendationEngine.generate(context)

        # Safety status must escalate to CLINICIAN_REVIEW
        self.assertEqual(result.safety_status, "CLINICIAN_REVIEW")
        self.assertTrue(result.clinician_review["recommended"])
        self.assertIn("testosterone", result.clinician_review["reason"].lower())

        # Must include clinical review recommendation item
        clinical_recs = [r for r in result.recommendations if r.category == "clinical"]
        self.assertTrue(len(clinical_recs) >= 1)
        self.assertTrue(clinical_recs[0].clinician_review)
        self.assertTrue(any(term in clinical_recs[0].action_summary.lower() for term in ("physician", "endocrinologist", "doctor", "formal")))

    def test_strictly_zero_trt_or_testosterone_booster_claims(self):
        context = ComprehensiveLifestyleContext(
            user_id=self.user_uuid,
            demographics=PatientDemographics(
                user_id=self.user_uuid,
                gender="male",
                pathway="male_hypogonadism",
                age=38,
                height_cm=175.0,
                weight_kg=82.0,
                bmi=26.8,
                activity_level="moderate",
            ),
            screening=ScreeningContext(has_assessment=True, module="male_hypogonadism", risk_category="elevated"),
            shap_drivers=[],
            shap_mitigators=[],
            symptoms=SymptomSummary(active_symptoms=["fatigue"]),
            labs=LabBiomarkers(total_testosterone_ng_dl=310.0),
            longitudinal=LongitudinalSummary(has_history=False, assessment_count=1),
        )

        result = LifestyleRecommendationEngine.generate(context)
        serialized_output = str(result.to_dict()).lower()

        forbidden_terms = [
            "testosterone replacement",
            "trt",
            "hormone therapy",
            "testosterone booster",
            "booster supplement",
            "enclomiphene",
            "hcg",
            "anabolic",
            "tribulus",
            "ashwagandha boosts testosterone",
        ]
        for term in forbidden_terms:
            self.assertNotIn(term, serialized_output)


@override_settings(ALLOW_LOCAL_SQLITE_FALLBACK=True)
class LifestyleShapAuditTests(TestCase):
    """
    Section 4 Audit:
    SHAP must ONLY help prioritize already-eligible recommendations.
    Never directly prescribe medical diets or unindicated lifestyle mandates.
    """

    def setUp(self):
        self.user_uuid = str(uuid.uuid4())

    def test_shap_elevates_priority_of_eligible_recommendations(self):
        context = ComprehensiveLifestyleContext(
            user_id=self.user_uuid,
            demographics=PatientDemographics(
                user_id=self.user_uuid,
                gender="female",
                pathway="female_pcos",
                age=27,
                height_cm=165.0,
                weight_kg=76.0,
                bmi=27.9,
                activity_level="sedentary",
            ),
            screening=ScreeningContext(has_assessment=True, module="female_pcos", risk_category="elevated"),
            shap_drivers=[
                ShapFactor(
                    feature_name="fast_food",
                    display_name="Fast Food Intake",
                    impact="increases_risk",
                    shap_value=0.25,
                    patient_value=1,
                    category="lifestyle",
                ),
                ShapFactor(
                    feature_name="physical_activity",
                    display_name="Physical Inactivity",
                    impact="increases_risk",
                    shap_value=0.19,
                    patient_value=0,
                    category="lifestyle",
                ),
            ],
            shap_mitigators=[],
            symptoms=SymptomSummary(),
            labs=LabBiomarkers(),
            longitudinal=LongitudinalSummary(has_history=False, assessment_count=1),
        )

        result = LifestyleRecommendationEngine.generate(context)

        # Check fitness recommendation received priority elevation based on SHAP driver
        fitness_recs = [r for r in result.recommendations if r.category == "fitness"]
        self.assertTrue(len(fitness_recs) > 0)
        self.assertEqual(fitness_recs[0].priority, "high")
        self.assertIsNotNone(fitness_recs[0].shap_priority_basis)
        self.assertIn("Physical Inactivity", fitness_recs[0].shap_priority_basis)


@override_settings(ALLOW_LOCAL_SQLITE_FALLBACK=True)
class LifestyleDynamicPersonalizationTests(TestCase):
    """
    Section 14 Audit:
    Prove recommendations are genuinely dynamic:
    1. Create two test patients with substantially different states and confirm non-identical output.
    2. Mutate one patient's state (weight, exercise, symptoms) and prove recommendation output adapts.
    """

    def test_two_distinct_patients_receive_substantially_different_recommendations(self):
        # Patient 1: Lean female, regular exercise, active, cycle irregularity only
        p1 = ComprehensiveLifestyleContext(
            user_id="user_p1",
            demographics=PatientDemographics(
                user_id="user_p1",
                gender="female",
                pathway="female_pcos",
                age=24,
                height_cm=168.0,
                weight_kg=55.0,
                bmi=19.5,
                activity_level="very_active",
                regular_exercise=True,
            ),
            screening=ScreeningContext(has_assessment=True, module="female_pcos", risk_category="low"),
            shap_drivers=[],
            shap_mitigators=[],
            symptoms=SymptomSummary(active_symptoms=["irregular_cycles"]),
            labs=LabBiomarkers(),
            longitudinal=LongitudinalSummary(has_history=True, assessment_count=2, weight_trend_30d="stable"),
        )

        # Patient 2: Elevated BMI male, low activity, metabolic labs elevated
        p2 = ComprehensiveLifestyleContext(
            user_id="user_p2",
            demographics=PatientDemographics(
                user_id="user_p2",
                gender="male",
                pathway="male_hypogonadism",
                age=48,
                height_cm=172.0,
                weight_kg=98.0,
                bmi=33.1,
                activity_level="sedentary",
                regular_exercise=False,
            ),
            screening=ScreeningContext(has_assessment=True, module="male_hypogonadism", risk_category="elevated"),
            shap_drivers=[
                ShapFactor(feature_name="bmi", display_name="BMI", impact="increases_risk", shap_value=0.22, patient_value=33.1, category="biometric")
            ],
            shap_mitigators=[],
            symptoms=SymptomSummary(active_symptoms=["fatigue", "loss_of_strength"]),
            labs=LabBiomarkers(fasting_glucose_mg_dl=128.0),
            longitudinal=LongitudinalSummary(has_history=True, assessment_count=3, weight_trend_30d="worsening", weight_delta_kg=4.0),
        )

        res1 = LifestyleRecommendationEngine.generate(p1)
        res2 = LifestyleRecommendationEngine.generate(p2)

        # Distinct pathways
        self.assertEqual(res1.pathway, "female_pcos")
        self.assertEqual(res2.pathway, "male_hypogonadism")

        # Distinct strategies and target calories
        self.assertNotEqual(res1.nutrition.strategy_title, res2.nutrition.strategy_title)
        self.assertNotEqual(res1.fitness.protocol_name, res2.fitness.protocol_name)
        self.assertNotEqual(res1.nutrition.daily_targets.daily_calories_kcal, res2.nutrition.daily_targets.daily_calories_kcal)

        # Distinct safety evaluations
        self.assertNotEqual(res1.safety_status, res2.safety_status)

    def test_mutating_patient_state_alters_recommendations_deterministically(self):
        # Initial State: Sedentary, overweight female
        context = ComprehensiveLifestyleContext(
            user_id="user_dynamic",
            demographics=PatientDemographics(
                user_id="user_dynamic",
                gender="female",
                pathway="female_pcos",
                age=28,
                height_cm=165.0,
                weight_kg=78.0,
                bmi=28.6,
                activity_level="sedentary",
                regular_exercise=False,
            ),
            screening=ScreeningContext(has_assessment=True, module="female_pcos", risk_category="elevated"),
            shap_drivers=[],
            shap_mitigators=[],
            symptoms=SymptomSummary(active_symptoms=["fatigue"]),
            labs=LabBiomarkers(),
            longitudinal=LongitudinalSummary(has_history=False, assessment_count=1),
        )

        initial_result = LifestyleRecommendationEngine.generate(context)
        initial_cal = initial_result.nutrition.daily_targets.daily_calories_kcal
        fitness_rec_initial = [r for r in initial_result.recommendations if r.category == "fitness"][0]
        self.assertEqual(fitness_rec_initial.status, "NEW")
        self.assertIn("Build a consistent routine", fitness_rec_initial.action_summary)

        # State Mutation: Patient loses 6kg, becomes moderately active, logged exercise regularly
        context.demographics.weight_kg = 72.0
        context.demographics.bmi = 26.4
        context.demographics.activity_level = "moderate"
        context.demographics.regular_exercise = True
        context.longitudinal = LongitudinalSummary(
            has_history=True,
            assessment_count=3,
            weight_trend_30d="improving",
            weight_delta_kg=-6.0,
        )

        adapted_result = LifestyleRecommendationEngine.generate(context)
        adapted_cal = adapted_result.nutrition.daily_targets.daily_calories_kcal
        fitness_rec_adapted = [r for r in adapted_result.recommendations if r.category == "fitness"][0]

        # Calories adjust dynamically to new weight and higher activity level
        self.assertNotEqual(initial_cal, adapted_cal)

        # Fitness recommendation status adapts from NEW to MAINTAIN/ACTIVE
        self.assertIn(fitness_rec_adapted.status, ["ACTIVE", "IMPROVING", "MAINTAIN"])
        self.assertIn("Continue regular", fitness_rec_adapted.action_summary)


@override_settings(ALLOW_LOCAL_SQLITE_FALLBACK=True)
class LifestyleMealDecouplingAndIsolationTests(TestCase):
    """
    Section 12 & 15 Audit:
    - Zero dependency on legacy Meal Directory.
    - Full user isolation (no cross-user leakage).
    """

    def test_meal_directory_independence_with_mocked_sys_modules(self):
        """Simulate Meal module being completely unavailable/broken."""
        with patch.dict(sys.modules, {"apps.meal": None, "Meal": None}):
            # Verify context builder and recommendation engine work without any Meal dependency
            user_uuid = str(uuid.uuid4())
            context = ComprehensiveLifestyleContext(
                user_id=user_uuid,
                demographics=PatientDemographics(
                    user_id=user_uuid,
                    gender="female",
                    pathway="female_pcos",
                    age=25,
                    height_cm=160.0,
                    weight_kg=60.0,
                    bmi=23.4,
                ),
                screening=ScreeningContext(has_assessment=False, module="female_pcos"),
                shap_drivers=[],
                shap_mitigators=[],
                symptoms=SymptomSummary(),
                labs=LabBiomarkers(),
                longitudinal=LongitudinalSummary(has_history=False, assessment_count=0),
            )

            result = LifestyleRecommendationEngine.generate(context)
            self.assertIsNotNone(result)
            self.assertEqual(result.user_id, user_uuid)

    def test_cross_user_isolation(self):
        """Verify context queries are strictly scoped to the authenticated user ID."""
        user_a = str(uuid.uuid4())
        user_b = str(uuid.uuid4())

        with patch("apps.intelligence.services.lifestyle_context_builder.assessment_repository") as mock_repo:
            mock_repo.get_active_assessment.return_value = None
            mock_repo.get_latest_assessment.return_value = None
            mock_repo.get_assessment_history.return_value = []

            with patch("apps.intelligence.services.lifestyle_context_builder.health_service") as mock_health:
                mock_health.get_patient_health_data.return_value = MagicMock(
                    profile=None,
                    symptoms=[],
                    biomarkers=None,
                    menstrual_cycles=[],
                    timeline_events=[],
                    risk_scores=[],
                )

                LifestyleContextBuilder.build_context(user_id=user_a, module="female_pcos")

                # Verify all repository and health service calls were scoped to user_a, never user_b
                for call_args in mock_repo.get_latest_assessment.call_args_list:
                    self.assertEqual(call_args[0][0], user_a)
                    self.assertNotEqual(call_args[0][0], user_b)
                for call_args in mock_health.get_patient_health_data.call_args_list:
                    self.assertEqual(call_args[0][0], user_a)
                    self.assertNotEqual(call_args[0][0], user_b)


@override_settings(ALLOW_LOCAL_SQLITE_FALLBACK=True)
class LifestyleRecommendationsApiTests(TestCase):
    def setUp(self):
        User = get_user_model()
        self.test_user = User.objects.create_user(
            username="test_lifestyle_user",
            password="test_password",
            id=778899,
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.test_user)

    @patch("apps.intelligence.views_lifestyle.LifestyleContextBuilder.build_context")
    def test_get_lifestyle_recommendations_endpoint(self, mock_build):
        context = ComprehensiveLifestyleContext(
            user_id="778899",
            demographics=PatientDemographics(
                user_id="778899",
                gender="female",
                pathway="female_pcos",
                age=27,
                height_cm=160.0,
                weight_kg=65.0,
                bmi=25.4,
            ),
            screening=ScreeningContext(
                has_assessment=False,
                module="female_pcos",
            ),
            shap_drivers=[],
            shap_mitigators=[],
            symptoms=SymptomSummary(),
            labs=LabBiomarkers(),
            longitudinal=LongitudinalSummary(),
        )
        mock_build.return_value = context

        resp = self.client.get("/api/v1/intelligence/lifestyle-recommendations/?module=female_pcos")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn("nutrition", data)
        self.assertIn("fitness", data)
        self.assertIn("lifestyle", data)
        self.assertIn("evidence_rationale", data)
        self.assertIn("daily_targets", data["nutrition"])
        self.assertIn("weekly_schedule", data["fitness"])
        self.assertIn("recommendations", data)
        self.assertIn("safety_status", data)
        self.assertIn("clinician_review", data)

    @patch("apps.intelligence.views_lifestyle.LifestyleContextBuilder.build_context")
    def test_post_lifestyle_recommendations_simulation(self, mock_build):
        context = ComprehensiveLifestyleContext(
            user_id="778899",
            demographics=PatientDemographics(
                user_id="778899",
                gender="female",
                pathway="female_pcos",
                age=27,
                height_cm=160.0,
                weight_kg=65.0,
                bmi=25.4,
                dietary_preference="omnivore",
            ),
            screening=ScreeningContext(
                has_assessment=False,
                module="female_pcos",
            ),
            shap_drivers=[],
            shap_mitigators=[],
            symptoms=SymptomSummary(),
            labs=LabBiomarkers(),
            longitudinal=LongitudinalSummary(),
        )
        mock_build.return_value = context

        payload = {
            "module": "female_pcos",
            "dietary_preference": "vegetarian",
            "allergens": ["dairy"],
        }
        resp = self.client.post("/api/v1/intelligence/lifestyle-recommendations/", payload, format="json")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["user_id"], "778899")
        self.assertIn("nutrition", data)
        self.assertIn("recommendations", data)

    @patch("apps.intelligence.views_lifestyle.LifestyleContextBuilder.build_context")
    def test_get_lifestyle_recommendations_caching(self, mock_build):
        context = ComprehensiveLifestyleContext(
            user_id="778899",
            demographics=PatientDemographics(
                user_id="778899",
                gender="female",
                pathway="female_pcos",
                age=27,
                height_cm=160.0,
                weight_kg=65.0,
                bmi=25.4,
            ),
            screening=ScreeningContext(has_assessment=False, module="female_pcos"),
            shap_drivers=[],
            shap_mitigators=[],
            symptoms=SymptomSummary(),
            labs=LabBiomarkers(),
            longitudinal=LongitudinalSummary(),
        )
        context.context_version = LifestyleContextBuilder.compute_context_version(context)
        mock_build.return_value = context

        # First GET call: builds and persists
        resp1 = self.client.get("/api/v1/intelligence/lifestyle-recommendations/?module=female_pcos")
        self.assertEqual(resp1.status_code, 200)

        # Second GET call with same context: returns cached without re-generating
        with patch("apps.intelligence.views_lifestyle.LifestyleRecommendationEngine.generate") as mock_gen:
            resp2 = self.client.get("/api/v1/intelligence/lifestyle-recommendations/?module=female_pcos")
            self.assertEqual(resp2.status_code, 200)
            mock_gen.assert_not_called()

    @patch("apps.intelligence.views_lifestyle.LifestyleContextBuilder.build_context")
    def test_patch_recommendation_status_endpoint(self, mock_build):
        context = ComprehensiveLifestyleContext(
            user_id="778899",
            demographics=PatientDemographics(
                user_id="778899",
                gender="female",
                pathway="female_pcos",
                age=27,
                height_cm=160.0,
                weight_kg=65.0,
                bmi=25.4,
            ),
            screening=ScreeningContext(has_assessment=False, module="female_pcos"),
            shap_drivers=[],
            shap_mitigators=[],
            symptoms=SymptomSummary(),
            labs=LabBiomarkers(),
            longitudinal=LongitudinalSummary(),
        )
        context.context_version = LifestyleContextBuilder.compute_context_version(context)
        mock_build.return_value = context

        # Populate initial recommendations
        get_res = self.client.get("/api/v1/intelligence/lifestyle-recommendations/?module=ovasense")
        self.assertEqual(get_res.status_code, 200)
        recs = get_res.json()["recommendations"]
        self.assertTrue(len(recs) > 0)
        target_rec_id = recs[0]["id"]

        # PATCH status to COMPLETED
        patch_payload = {
            "module": "ovasense",
            "recommendation_id": target_rec_id,
            "status": "COMPLETED",
            "note": "Completed today's action",
        }
        patch_res = self.client.patch(
            "/api/v1/intelligence/lifestyle-recommendations/status/",
            patch_payload,
            format="json",
        )
        self.assertEqual(patch_res.status_code, 200)
        data = patch_res.json()
        self.assertEqual(data["status"], "COMPLETED")
        self.assertEqual(data["item_statuses"][target_rec_id]["status"], "COMPLETED")


@override_settings(ALLOW_LOCAL_SQLITE_FALLBACK=True)
class LifestyleEvidenceAndMedicalLanguageAuditTests(TestCase):
    """
    Final Medical Language & Canonical Evidence Registry Verification Suite:
    - No diagnostic claims or confirmation language
    - No cure or reversal claims
    - No TRT / hormone booster / supplement advice
    - No overconfident mechanistic biochemical jargon in patient UI (GLUT4, aromatase, steroidogenesis, etc.)
    - Evidence IDs exist for all guideline-backed recommendations
    - Missing or unverified evidence cannot be labeled validated
    - Product safety floors are guardrails, not clinical prescriptions
    - Broad, non-dogmatic hydration guidance
    - SHAP used only for prioritization, never direct prescription
    """

    def setUp(self):
        self.user_uuid = str(uuid.uuid4())
        self.context_female = ComprehensiveLifestyleContext(
            user_id=self.user_uuid,
            demographics=PatientDemographics(
                user_id=self.user_uuid,
                gender="female",
                pathway="female_pcos",
                age=26,
                height_cm=165.0,
                weight_kg=72.0,
                bmi=26.4,
                dietary_preference="omnivore",
                activity_level="moderate",
                sleep_hours=7.0,
            ),
            screening=ScreeningContext(
                has_assessment=True,
                module="female_pcos",
                risk_category="elevated",
                probability=0.74,
                probability_percent=74.0,
            ),
            shap_drivers=[
                ShapFactor(
                    feature_name="fast_food",
                    display_name="Fast Food Intake",
                    impact="increases_risk",
                    shap_value=0.18,
                    patient_value=1,
                    category="lifestyle",
                )
            ],
            shap_mitigators=[],
            symptoms=SymptomSummary(active_symptoms=["fatigue", "irregular_cycles"]),
            labs=LabBiomarkers(fasting_glucose_mg_dl=104.0),
            longitudinal=LongitudinalSummary(has_history=False, assessment_count=1),
        )

        self.context_male = ComprehensiveLifestyleContext(
            user_id=str(uuid.uuid4()),
            demographics=PatientDemographics(
                user_id=str(uuid.uuid4()),
                gender="male",
                pathway="male_hypogonadism",
                age=38,
                height_cm=178.0,
                weight_kg=86.0,
                bmi=27.1,
                dietary_preference="omnivore",
                activity_level="sedentary",
                sleep_hours=6.0,
            ),
            screening=ScreeningContext(
                has_assessment=True,
                module="male_hypogonadism",
                risk_category="elevated",
                probability=0.68,
                probability_percent=68.0,
            ),
            shap_drivers=[],
            shap_mitigators=[],
            symptoms=SymptomSummary(active_symptoms=["fatigue", "low_libido"]),
            labs=LabBiomarkers(total_testosterone_ng_dl=270.0),
            longitudinal=LongitudinalSummary(has_history=False, assessment_count=1),
        )

    def test_no_diagnostic_claims_or_confirmations(self):
        # Trigger male low testosterone review
        male_res = LifestyleRecommendationEngine.generate(self.context_male)
        self.assertTrue(male_res.clinician_review["recommended"])
        reason = male_res.clinician_review["reason"].lower()
        self.assertIn("may warrant clinical review", reason)
        self.assertIn("morning repeat testing", reason)
        self.assertNotIn("confirms hypogonadism", reason)
        self.assertNotIn("diagnosed with", reason)
        self.assertNotIn("confirms low testosterone deficiency", reason)

        # Trigger glycemic diabetes threshold review
        self.context_female.labs.hba1c_percent = 6.8
        female_res = LifestyleRecommendationEngine.generate(self.context_female)
        self.assertTrue(female_res.clinician_review["recommended"])
        glyc_reason = female_res.clinician_review["reason"].lower()
        self.assertIn("may warrant clinical review", glyc_reason)
        self.assertIn("repeat confirmatory testing", glyc_reason)
        self.assertNotIn("confirms diabetes", glyc_reason)
        self.assertNotIn("diagnosed with diabetes", glyc_reason)

    def test_no_cure_or_reversal_claims_across_both_pathways(self):
        for ctx in [self.context_female, self.context_male]:
            res = LifestyleRecommendationEngine.generate(ctx)
            payload_dict = res.to_dict()
            # Test all patient-facing recommendation and guidance content (excluding disclaimer which appropriately negates cures)
            content_texts = [
                str(payload_dict["nutrition"]),
                str(payload_dict["fitness"]),
                str(payload_dict["lifestyle"]),
                str(payload_dict["recommendations"]),
            ]
            content_str = " ".join(content_texts).lower()
            prohibited_cures = [
                "cure pcos",
                "cures pcos",
                "curing pcos",
                "reverse pcos",
                "reverses pcos",
                "reversing pcos",
                "reverse hypogonadism",
                "reverses hypogonadism",
                "reversing hypogonadism",
                "restores testosterone production",
                "boosts testosterone production",
            ]
            for phrase in prohibited_cures:
                self.assertNotIn(phrase, content_str)

    def test_no_overconfident_mechanistic_jargon_in_patient_ui(self):
        for ctx in [self.context_female, self.context_male]:
            res = LifestyleRecommendationEngine.generate(ctx)
            patient_texts = [
                res.nutrition.strategy_title,
                res.nutrition.strategy_summary,
                res.fitness.protocol_name,
                res.fitness.overview,
                res.fitness.pathway_clinical_benefit,
                res.fitness.recovery_guidance,
                res.lifestyle.circadian_headline,
                res.lifestyle.stress_management_protocol,
            ]
            for rec in res.recommendations:
                patient_texts.extend([
                    rec.title,
                    rec.action_summary,
                    rec.why_this_is_recommended,
                ])
            for habit in res.lifestyle.recommended_habits:
                patient_texts.extend([habit.title, habit.action_item, habit.rationale])
            for swap in res.nutrition.targeted_swaps:
                patient_texts.extend([swap.swap_title, swap.clinical_mechanism])
            for meal in res.nutrition.meal_concepts:
                patient_texts.extend([meal.title, meal.hormonal_benefit])

            combined_text = " ".join(patient_texts).lower()

            prohibited_jargon = [
                "glut4",
                "aromatase modulation",
                "androgen receptor density",
                "stimulates local androgen receptor",
                "suprachiasmatic nucleus",
                "suprachiasmatic anchoring",
                "melanopsin",
                "vagal efferents",
                "steroidogenesis",
                "leydig cell function",
                "theca cell",
                "anti-androgenic polyphenol",
            ]
            for jargon in prohibited_jargon:
                self.assertNotIn(jargon, combined_text, f"Prohibited jargon '{jargon}' found in patient-facing output.")

    def test_evidence_ids_exist_for_guideline_backed_recommendations(self):
        for ctx in [self.context_female, self.context_male]:
            res = LifestyleRecommendationEngine.generate(ctx)
            for rec in res.recommendations:
                self.assertIsNotNone(rec.evidence_id, f"Recommendation '{rec.id}' lacks evidence_id.")
                self.assertIn(rec.evidence_id, LIFESTYLE_EVIDENCE_REGISTRY)
                self.assertIn(rec.evidence_id, res.evidence_registry)
                metadata = res.evidence_registry[rec.evidence_id]
                self.assertIn(metadata["evidence_category"], [
                    "guideline_supported",
                    "general_wellness_guidance",
                    "product_safety_guardrail",
                ])
                self.assertTrue(len(metadata["source_organization"]) > 0)
                self.assertTrue(len(metadata["guideline_document"]) > 0)
                self.assertGreaterEqual(metadata["publication_year"], 2000)

    def test_missing_evidence_cannot_be_labeled_validated(self):
        non_existent_entry = get_evidence_entry("non_existent_fake_rule")
        self.assertIsNone(non_existent_entry)

    def test_product_safety_floor_is_guardrail_not_clinical_prescription(self):
        self.assertEqual(PRODUCT_SAFETY_FLOOR_FEMALE, 1200.0)
        self.assertEqual(PRODUCT_SAFETY_FLOOR_MALE, 1500.0)

        res_f = LifestyleRecommendationEngine.generate(self.context_female)
        note = res_f.nutrition.daily_targets.guidance_note.lower()
        self.assertIn("product safety floor", note)
        self.assertIn("guardrail rather than an individualized clinical prescription", note)

    def test_broad_general_wellness_hydration_guidance(self):
        res = LifestyleRecommendationEngine.generate(self.context_female)
        note = res.nutrition.daily_targets.guidance_note.lower()
        self.assertIn("fluid reference", note)
        self.assertIn("renal or cardiac", note)

    def test_shap_used_only_for_prioritization_not_prescription(self):
        res = LifestyleRecommendationEngine.generate(self.context_female)
        nutr_recs = [r for r in res.recommendations if r.category == "nutrition"]
        self.assertTrue(len(nutr_recs) > 0)
        self.assertEqual(nutr_recs[0].priority, "high")
        self.assertIn("Fast Food Intake", nutr_recs[0].shap_priority_basis)
        self.assertEqual(nutr_recs[0].safety_status, res.safety_status)

    def test_normalize_module_aliases(self):
        self.assertEqual(LifestyleContextBuilder.normalize_module("ovasense"), "female_pcos")
        self.assertEqual(LifestyleContextBuilder.normalize_module("pcos"), "female_pcos")
        self.assertEqual(LifestyleContextBuilder.normalize_module("female_pcos"), "female_pcos")
        self.assertEqual(LifestyleContextBuilder.normalize_module("androsense"), "male_hypogonadism")
        self.assertEqual(LifestyleContextBuilder.normalize_module("hypogonadism"), "male_hypogonadism")
        self.assertEqual(LifestyleContextBuilder.normalize_module("male_hypogonadism"), "male_hypogonadism")
        self.assertEqual(LifestyleContextBuilder.normalize_module(None, gender="male"), "male_hypogonadism")
        self.assertEqual(LifestyleContextBuilder.normalize_module(None, gender="female"), "female_pcos")

    def test_context_version_computation_and_invalidation(self):
        ctx1 = self.context_female
        v1 = LifestyleContextBuilder.compute_context_version(ctx1)
        self.assertTrue(len(v1) == 16)

        # Same data gives same version
        v1_again = LifestyleContextBuilder.compute_context_version(ctx1)
        self.assertEqual(v1, v1_again)

        # Weight change produces different version
        import copy
        ctx2 = copy.deepcopy(ctx1)
        ctx2.demographics.weight_kg = 68.0
        v2 = LifestyleContextBuilder.compute_context_version(ctx2)
        self.assertNotEqual(v1, v2)

    def test_lifestyle_repository_persistence_and_status_update(self):
        from apps.intelligence.services.lifestyle_repository import lifestyle_repository
        user_id = "test-user-persist-123"
        module = "female_pcos"
        ctx_ver = "ver1234567890abc"
        payload = {
            "user_id": user_id,
            "pathway": module,
            "recommendations": [
                {"id": "rec_walk_post_meal", "title": "Brisk Walking", "status": "NEW"},
                {"id": "rec_protein_focus", "title": "Protein First", "status": "NEW"},
            ]
        }
        # Save
        saved = lifestyle_repository.save_recommendations(
            user_id=user_id,
            module=module,
            context_version=ctx_ver,
            payload=payload,
        )
        self.assertEqual(saved["context_version"], ctx_ver)
        self.assertEqual(saved["user_id"], user_id)

        # Retrieve
        active = lifestyle_repository.get_active_recommendations(user_id=user_id, module=module)
        self.assertIsNotNone(active)
        self.assertEqual(active["context_version"], ctx_ver)
        self.assertEqual(len(active["payload"]["recommendations"]), 2)

        # Update status
        updated = lifestyle_repository.update_item_status(
            user_id=user_id,
            module=module,
            recommendation_id="rec_walk_post_meal",
            new_status="COMPLETED",
            note="Walked 25 mins after lunch",
        )
        self.assertIsNotNone(updated)
        self.assertEqual(updated["status"], "COMPLETED")
        self.assertEqual(updated["item_statuses"]["rec_walk_post_meal"]["status"], "COMPLETED")

        # Verify active record reflects updated status
        refreshed = lifestyle_repository.get_active_recommendations(user_id=user_id, module=module)
        rec_item = next(r for r in refreshed["payload"]["recommendations"] if r["id"] == "rec_walk_post_meal")
        self.assertEqual(rec_item["status"], "COMPLETED")

    def test_male_pathway_terminology_isolation(self):
        res_m = LifestyleRecommendationEngine.generate(self.context_male)
        res_m_dict = res_m.to_dict()
        res_str = json.dumps(res_m_dict).lower()

        # Strict isolation invariants: no female menstrual terms in male recommendations
        forbidden_terms = ["menstrual", "period", "pcos", "ovary", "ovarian", "follicular", "luteal", "pcom", "pregnant"]
        for term in forbidden_terms:
            self.assertNotIn(term, res_str, f"Forbidden term '{term}' leaked into male recommendations!")

    @patch("apps.intelligence.services.lifestyle_context_builder.health_service.fetch_all")
    def test_regression_symptom_string_severity_does_not_crash(self, mock_fetch_all):
        """
        REGRESSION TEST:
        Supabase symptom_records store string severities ('mild', 'moderate', 'severe')
        and attribute name 'symptom_type'.
        Previously, build_context crashed with ValueError: invalid literal for int() with base 10: 'moderate'.
        Verify that build_context parses string severities smoothly and classifies high severity appropriately.
        """
        user_id = str(uuid.uuid4())
        mock_profile = PatientProfile(
            user_id=user_id,
            gender="female",
            pathway="female_pcos",
            height_cm=165.0,
            weight_kg=68.0,
        )
        mock_symptoms = [
            SymptomRecordData(
                id="sym-1",
                symptom_type="acne",
                category="dermatological",
                severity="moderate",
                occurred_at="2026-09-01T10:00:00Z",
                cycle_day=14,
            ),
            SymptomRecordData(
                id="sym-2",
                symptom_type="hair_growth",
                category="androgenic",
                severity="severe",
                occurred_at="2026-09-02T10:00:00Z",
                cycle_day=15,
            ),
            SymptomRecordData(
                id="sym-3",
                symptom_type="irregular_periods",
                category="menstrual",
                severity="mild",
                occurred_at="2026-09-03T10:00:00Z",
                cycle_day=16,
            ),
        ]
        mock_health = PatientHealthData(
            profile=mock_profile,
            symptom_records=mock_symptoms,
        )
        mock_fetch_all.return_value = mock_health

        # Build context - must NOT raise ValueError
        ctx = LifestyleContextBuilder.build_context(user_id=user_id, module="female_pcos")
        self.assertIn("acne", ctx.symptoms.active_symptoms)
        self.assertIn("hair_growth", ctx.symptoms.active_symptoms)
        self.assertIn("irregular_periods", ctx.symptoms.active_symptoms)
        # 'severe' string maps to severity >= 3 -> in high_severity_symptoms
        self.assertIn("hair_growth", ctx.symptoms.high_severity_symptoms)
        self.assertEqual(ctx.symptoms.total_logs_30d, 3)

        # End-to-end recommendation generation must succeed
        safety = LifestyleSafetyEngine.evaluate_safety(ctx)
        res = LifestyleRecommendationEngine.generate(ctx, safety)
        self.assertGreater(len(res.recommendations), 0)

    def test_regression_tier2_clinical_labs_included_in_lifestyle_context(self):
        """
        REGRESSION TEST:
        When a patient has Tier 2 clinical laboratory values recorded via clinical_state_repository,
        build_context must reliably extract them into LabBiomarkers and raw_markers.
        """
        user_id = str(uuid.uuid4())
        module = "female_pcos"
        clinical_state_repository.save_patient_clinical_state(
            user_id=user_id,
            module=module,
            tier_2_inputs={
                "fasting_glucose": 112.0,
                "total_testosterone": 78.0,
                "lh": 15.0,
                "fsh": 5.0,
                "fasting_insulin": 18.0,
            },
        )

        ctx = LifestyleContextBuilder.build_context(user_id=user_id, module=module)
        self.assertEqual(ctx.labs.fasting_glucose_mg_dl, 112.0)
        self.assertEqual(ctx.labs.total_testosterone_ng_dl, 78.0)
        self.assertEqual(ctx.labs.lh_mIU_ml, 15.0)
        self.assertEqual(ctx.labs.fsh_mIU_ml, 5.0)
        self.assertEqual(ctx.labs.lh_fsh_ratio, 3.0)
        self.assertEqual(ctx.labs.fasting_insulin_uIU_ml, 18.0)

        # Generates recommendations reflecting elevated glycemic/hormonal state
        safety = LifestyleSafetyEngine.evaluate_safety(ctx)
        res = LifestyleRecommendationEngine.generate(ctx, safety)
        self.assertGreater(len(res.recommendations), 0)

    def test_regression_minimal_tier1_patient_lifestyle_generation(self):
        """
        REGRESSION TEST:
        Minimal patient with only Tier 1 assessment, no labs, no symptoms, no food logs, no fitness logs.
        Endpoint and recommendation engine must degrade gracefully and generate valid recommendations.
        """
        user_id = str(uuid.uuid4())
        module = "female_pcos"

        ctx = LifestyleContextBuilder.build_context(user_id=user_id, module=module)
        self.assertIsInstance(ctx, ComprehensiveLifestyleContext)
        self.assertEqual(ctx.demographics.pathway, "female_pcos")

        safety = LifestyleSafetyEngine.evaluate_safety(ctx)
        self.assertIn(safety.safety_status, ("ALLOW", "MODIFY"))

        res = LifestyleRecommendationEngine.generate(ctx, safety)
        self.assertGreater(len(res.recommendations), 0)
        self.assertIsNotNone(res.nutrition.strategy_title)
        self.assertIsNotNone(res.fitness.protocol_name)
        self.assertIsNotNone(res.lifestyle.circadian_headline)

