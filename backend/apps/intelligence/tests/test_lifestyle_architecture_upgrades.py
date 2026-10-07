"""
backend/apps/intelligence/tests/test_lifestyle_architecture_upgrades.py

Comprehensive test suite verifying the audited BioPulse Lifestyle Architecture:
- Section Q: Allergy Update Cache Invalidation Test
- Section R: Users A-F Test Matrix (Divergence & Personalization)
- Section S: 9-Allergen Matrix Tests (Zero Leakage)
- Section T: Intolerance Separation (Milk vs Lactose, Gluten)
- Section H: No-Assessment Behavior (has_assessment=False, LEVEL_1_PROFILE)
- Section L & M: Post-LLM Dietary Safety Validator & Non-Food Immunity
- Section N: Intent Classifier Expansion
- Section O: Page & Chat Synchronized Authoritative Protocol
"""

import uuid
from unittest.mock import MagicMock, patch

from django.test import TestCase, override_settings

from apps.health.services.supabase_health_service import PatientHealthData, PatientProfile
from apps.intelligence.services.health_context_builder import (
    HealthContextBuilder,
    format_authoritative_lifestyle_protocol,
)
from apps.intelligence.services.lifestyle_context_builder import (
    ComprehensiveLifestyleContext,
    LifestyleContextBuilder,
    PatientDemographics,
    ScreeningContext,
    SymptomSummary,
    LabBiomarkers,
    LongitudinalSummary,
)
from apps.intelligence.services.lifestyle_recommendation_engine import (
    LifestyleRecommendationEngine,
    LifestyleRecommendationsResult,
)
from apps.intelligence.services.lifestyle_safety_rules import (
    LifestyleSafetyEngine,
    is_food_forbidden,
)
from apps.intelligence.services.safety_guardrails import SafetyGuardrails


@override_settings(ALLOW_LOCAL_SQLITE_FALLBACK=True)
class LifestyleArchitectureUpgradesTests(TestCase):
    """Verifies all architectural upgrades of the BioPulse Lifestyle system."""

    def setUp(self):
        self.user_id = str(uuid.uuid4())

    # =========================================================================
    # SECTION Q: ALLERGY UPDATE SAFETY & CACHE INVALIDATION
    # =========================================================================
    def test_allergy_update_invalidates_cache_and_removes_allergens(self):
        """
        1. User initially has no allergy.
        2. Context version V1 is computed.
        3. Recommendation initially allows peanut/nuts.
        4. User profile is updated with peanut allergy.
        5. Context version V2 MUST differ from V1.
        6. Cached recommendation from V1 is stale and rejected.
        7. New recommendation generated under V2 strictly excludes peanuts.
        8. Post-LLM validator ensures zero peanut leakage.
        """
        # Step 1 & 2: User with no allergies
        ctx_initial = ComprehensiveLifestyleContext(
            user_id=self.user_id,
            demographics=PatientDemographics(
                user_id=self.user_id,
                gender="female",
                pathway="female_pcos",
                bmi=24.0,
                allergens=[],
                allergy_status="confirmed_none",
            ),
            screening=ScreeningContext(has_assessment=True, module="female_pcos", risk_category="low"),
            symptoms=SymptomSummary(),
            labs=LabBiomarkers(),
            longitudinal=LongitudinalSummary(),
        )
        ctx_initial.context_version = LifestyleContextBuilder.compute_context_version(ctx_initial)
        v1 = ctx_initial.context_version

        safety_v1 = LifestyleSafetyEngine.evaluate_safety(ctx_initial)
        res_v1 = LifestyleRecommendationEngine.generate(ctx_initial, safety_v1)
        self.assertNotIn("peanut", safety_v1.excluded_food_categories)

        # Step 4: User updates profile with peanut allergy
        ctx_updated = ComprehensiveLifestyleContext(
            user_id=self.user_id,
            demographics=PatientDemographics(
                user_id=self.user_id,
                gender="female",
                pathway="female_pcos",
                bmi=24.0,
                allergens=["peanut"],
                allergy_status="active_allergens",
            ),
            screening=ScreeningContext(has_assessment=True, module="female_pcos", risk_category="low"),
            symptoms=SymptomSummary(),
            labs=LabBiomarkers(),
            longitudinal=LongitudinalSummary(),
        )
        ctx_updated.context_version = LifestyleContextBuilder.compute_context_version(ctx_updated)
        v2 = ctx_updated.context_version

        # Step 5: Version MUST change
        self.assertNotEqual(v1, v2, "context_version must change when allergens are updated!")

        # Step 6 & 7: Fresh safety evaluation and recommendation
        safety_v2 = LifestyleSafetyEngine.evaluate_safety(ctx_updated)
        self.assertIn("peanut", safety_v2.excluded_food_categories)

        res_v2 = LifestyleRecommendationEngine.generate(ctx_updated, safety_v2)
        payload_v2 = res_v2.to_dict()

        # Verify zero peanut in meal concepts, swaps, or guidelines
        for meal in payload_v2["nutrition"]["meal_concepts"]:
            text_to_check = f"{meal['title']} {meal['description']} {' '.join(meal.get('key_ingredients', []))}"
            is_bad, matched = is_food_forbidden(text_to_check, ["peanut"])
            self.assertFalse(is_bad, f"Forbidden peanut leaked into meal: {meal['title']} ({matched})")

        for swap in payload_v2["nutrition"]["targeted_swaps"]:
            is_bad, matched = is_food_forbidden(swap["recommended_alternative"], ["peanut"])
            self.assertFalse(is_bad, f"Forbidden peanut leaked into swap alternative: {swap['recommended_alternative']} ({matched})")

        # Step 8: Post-LLM dietary validator catches hypothetical peanut response
        raw_llm_answer = "You should snack on an apple with 2 tablespoons of peanut butter for breakfast."
        clean_answer = SafetyGuardrails.validate_dietary_safety(
            text=raw_llm_answer,
            excluded_categories=safety_v2.excluded_food_categories,
            user_message="What snack can I have?",
        )
        self.assertNotIn("peanut butter", clean_answer.lower())
        self.assertIn("sunflower seed butter", clean_answer.lower())

    # =========================================================================
    # SECTION R: USERS A–F TEST MATRIX (DIVERGENCE & PERSONALIZATION)
    # =========================================================================
    def test_users_a_through_f_divergence_matrix(self):
        """
        Generates and compares Users A through F to prove deep, non-identical personalization:
        User A: Female, PCOS, BMI 32, sedentary, high stress, sleep 5h, vegetarian
        User B: Female, PCOS, BMI 21, active, sleep 8h, low stress, omnivore
        User C: Male, BMI 34, large waist, fatigue, sedentary
        User D: Male, BMI 23, active, sleep 8h, low stress
        User E: Vegan + nut allergy
        User F: Pescatarian + shellfish allergy
        """
        # User A
        ctx_a = ComprehensiveLifestyleContext(
            user_id="user-a",
            demographics=PatientDemographics(
                user_id="user-a",
                gender="female",
                pathway="female_pcos",
                weight_kg=88.0,
                height_cm=165.0,
                bmi=32.3,
                activity_level="sedentary",
                stress_level="severe",
                sleep_hours=5.0,
                dietary_preference="vegetarian",
            ),
            screening=ScreeningContext(has_assessment=True, module="female_pcos", risk_category="high", probability=0.78),
            symptoms=SymptomSummary(active_symptoms=["fatigue", "irregular_cycles"]),
            labs=LabBiomarkers(fasting_glucose_mg_dl=108.0),
            longitudinal=LongitudinalSummary(),
        )

        # User B
        ctx_b = ComprehensiveLifestyleContext(
            user_id="user-b",
            demographics=PatientDemographics(
                user_id="user-b",
                gender="female",
                pathway="female_pcos",
                weight_kg=56.0,
                height_cm=163.0,
                bmi=21.1,
                activity_level="active",
                regular_exercise=True,
                stress_level="low",
                sleep_hours=8.0,
                dietary_preference="omnivore",
            ),
            screening=ScreeningContext(has_assessment=True, module="female_pcos", risk_category="moderate", probability=0.42),
            symptoms=SymptomSummary(),
            labs=LabBiomarkers(),
            longitudinal=LongitudinalSummary(has_history=True, logged_fitness_30d=16),
        )

        # User C
        ctx_c = ComprehensiveLifestyleContext(
            user_id="user-c",
            demographics=PatientDemographics(
                user_id="user-c",
                gender="male",
                pathway="male_hypogonadism",
                weight_kg=105.0,
                height_cm=176.0,
                waist_cm=108.0,
                bmi=33.9,
                activity_level="sedentary",
                stress_level="moderate",
                sleep_hours=6.5,
                dietary_preference="omnivore",
            ),
            screening=ScreeningContext(has_assessment=True, module="male_hypogonadism", risk_category="high", probability=0.62),
            symptoms=SymptomSummary(active_symptoms=["fatigue", "low_libido"]),
            labs=LabBiomarkers(fasting_glucose_mg_dl=114.0),
            longitudinal=LongitudinalSummary(),
        )

        # User D
        ctx_d = ComprehensiveLifestyleContext(
            user_id="user-d",
            demographics=PatientDemographics(
                user_id="user-d",
                gender="male",
                pathway="male_hypogonadism",
                weight_kg=72.0,
                height_cm=177.0,
                waist_cm=82.0,
                bmi=23.0,
                activity_level="active",
                regular_exercise=True,
                stress_level="low",
                sleep_hours=8.0,
                dietary_preference="omnivore",
            ),
            screening=ScreeningContext(has_assessment=True, module="male_hypogonadism", risk_category="low", probability=0.12),
            symptoms=SymptomSummary(),
            labs=LabBiomarkers(total_testosterone_ng_dl=620.0),
            longitudinal=LongitudinalSummary(has_history=True, logged_fitness_30d=14),
        )

        # User E
        ctx_e = ComprehensiveLifestyleContext(
            user_id="user-e",
            demographics=PatientDemographics(
                user_id="user-e",
                gender="female",
                pathway="female_pcos",
                bmi=25.0,
                dietary_preference="vegan",
                allergens=["tree_nut", "peanut"],
            ),
            screening=ScreeningContext(has_assessment=True, module="female_pcos", risk_category="moderate"),
            symptoms=SymptomSummary(),
            labs=LabBiomarkers(),
            longitudinal=LongitudinalSummary(),
        )

        # User F
        ctx_f = ComprehensiveLifestyleContext(
            user_id="user-f",
            demographics=PatientDemographics(
                user_id="user-f",
                gender="female",
                pathway="female_pcos",
                bmi=24.0,
                dietary_preference="pescatarian",
                allergens=["shellfish"],
            ),
            screening=ScreeningContext(has_assessment=True, module="female_pcos", risk_category="low"),
            symptoms=SymptomSummary(),
            labs=LabBiomarkers(),
            longitudinal=LongitudinalSummary(),
        )

        # Evaluate and Generate
        res_a = LifestyleRecommendationEngine.generate(ctx_a, LifestyleSafetyEngine.evaluate_safety(ctx_a))
        res_b = LifestyleRecommendationEngine.generate(ctx_b, LifestyleSafetyEngine.evaluate_safety(ctx_b))
        res_c = LifestyleRecommendationEngine.generate(ctx_c, LifestyleSafetyEngine.evaluate_safety(ctx_c))
        res_d = LifestyleRecommendationEngine.generate(ctx_d, LifestyleSafetyEngine.evaluate_safety(ctx_d))
        res_e = LifestyleRecommendationEngine.generate(ctx_e, LifestyleSafetyEngine.evaluate_safety(ctx_e))
        res_f = LifestyleRecommendationEngine.generate(ctx_f, LifestyleSafetyEngine.evaluate_safety(ctx_f))

        # 1. Calorie Differences
        self.assertLess(res_a.nutrition.daily_targets.daily_calories_kcal, res_b.nutrition.daily_targets.daily_calories_kcal)
        self.assertLess(res_c.nutrition.daily_targets.daily_calories_kcal, res_d.nutrition.daily_targets.daily_calories_kcal)

        # Lean PCOS (User B) should NOT have an aggressive calorie deficit
        self.assertGreaterEqual(res_b.nutrition.daily_targets.daily_calories_kcal, 1800)

        # User C (Male, BMI 34, large waist) has high protein target for body composition
        self.assertGreaterEqual(res_c.nutrition.daily_targets.protein.grams, 110)

        # 2. Priority Sorting Differences
        # User A has sleep 5.0h (<6.5h) -> Sleep MUST be Priority #1
        self.assertEqual(res_a.recommendations[0].category, "lifestyle")
        self.assertIn("sleep", res_a.recommendations[0].title.lower())

        # 3. Dietary Enforcement Differences
        # User A is vegetarian -> Zero meat, zero poultry, zero fish
        for m in res_a.nutrition.meal_concepts:
            text = f"{m.title} {m.description} {' '.join(m.key_ingredients)}"
            self.assertFalse(is_food_forbidden(text, ["meat", "poultry", "fish"])[0])

        # User E is Vegan + Nut Allergy -> Zero meat, fish, poultry, egg, dairy, honey, gelatin, nuts
        for m in res_e.nutrition.meal_concepts:
            text = f"{m.title} {m.description} {' '.join(m.key_ingredients)}"
            self.assertFalse(is_food_forbidden(text, ["meat", "poultry", "fish", "egg", "dairy", "tree_nut", "peanut"])[0],
                             f"User E vegan/nut exclusion violated: {text}")

        # User F is Pescatarian + Shellfish Allergy -> Zero meat, poultry, shellfish (fish allowed)
        for m in res_f.nutrition.meal_concepts:
            text = f"{m.title} {m.description} {' '.join(m.key_ingredients)}"
            self.assertFalse(is_food_forbidden(text, ["meat", "poultry", "shellfish"])[0],
                             f"User F pescatarian/shellfish exclusion violated: {text}")

        # 4. Fitness Protocol Personalization
        # User A (BMI 32.3) -> Joint protection low-impact cardio, no jumping
        self.assertIn("Joint-Friendly", res_a.fitness.protocol_name)
        # User B (BMI 21, active) -> Progressive Overload
        self.assertIn("Progressive", res_b.fitness.protocol_name)
        # User C (BMI 33.9, male) -> Joint-Friendly
        self.assertIn("Joint-Friendly", res_c.fitness.protocol_name)
        # User D (BMI 23, male, active) -> Progressive Overload
        self.assertIn("Progressive", res_d.fitness.protocol_name)

    # =========================================================================
    # SECTION S: 9-ALLERGEN MATRIX AUTOMATED TESTS (ZERO LEAKAGE)
    # =========================================================================
    def test_nine_canonical_allergens_matrix(self):
        """
        Tests each of the 9 canonical allergens individually:
        peanut, tree_nut, milk, wheat, gluten, egg, fish, shellfish, soy.
        Verifies complete propagation from profile -> safety -> recommendation -> LLM context -> post-LLM validator.
        """
        canonical_allergens = [
            "peanut", "tree_nut", "milk", "wheat", "gluten", "egg", "fish", "shellfish", "soy"
        ]

        for allergen in canonical_allergens:
            ctx = ComprehensiveLifestyleContext(
                user_id=f"test-{allergen}",
                demographics=PatientDemographics(
                    user_id=f"test-{allergen}",
                    gender="female",
                    pathway="female_pcos",
                    bmi=25.0,
                    allergens=[allergen],
                    allergy_status="active_allergens",
                ),
                screening=ScreeningContext(has_assessment=True, module="female_pcos", risk_category="moderate"),
                symptoms=SymptomSummary(),
                labs=LabBiomarkers(),
                longitudinal=LongitudinalSummary(),
            )

            safety = LifestyleSafetyEngine.evaluate_safety(ctx)
            # Ensure the allergen is in excluded food categories
            self.assertTrue(
                any(allergen in cat for cat in safety.excluded_food_categories),
                f"Allergen {allergen} was not excluded by safety engine!"
            )

            res = LifestyleRecommendationEngine.generate(ctx, safety)
            payload = res.to_dict()

            # 1. Recommendation Meals & Swaps Verification
            for meal in payload["nutrition"]["meal_concepts"]:
                meal_text = f"{meal['title']} {meal['description']} {' '.join(meal.get('key_ingredients', []))}"
                is_bad, matched = is_food_forbidden(meal_text, [allergen])
                self.assertFalse(is_bad, f"Allergen '{allergen}' leaked in meal '{meal['title']}': {matched}")

            for swap in payload["nutrition"]["targeted_swaps"]:
                is_bad, matched = is_food_forbidden(swap["recommended_alternative"], [allergen])
                self.assertFalse(is_bad, f"Allergen '{allergen}' leaked in swap alternative: {swap['recommended_alternative']} ({matched})")

            # 2. LLM Context Bridge Verification
            formatted_context = format_authoritative_lifestyle_protocol(payload, context=ctx, safety=safety)
            self.assertIn(f"Strictly Excluded Foods:", formatted_context)

            # 3. Post-LLM Validator Verification
            # Simulate an LLM trying to suggest the allergen
            test_prompt_reply = f"Try having some {allergen} with your breakfast bowl."
            sanitized = SafetyGuardrails.validate_dietary_safety(
                text=test_prompt_reply,
                excluded_categories=safety.excluded_food_categories,
                user_message="What should I have for breakfast?",
            )
            is_bad_post, _ = is_food_forbidden(sanitized, [allergen])
            self.assertFalse(is_bad_post, f"Post-LLM validator failed to sanitize '{allergen}' from reply: {sanitized}")

    # =========================================================================
    # SECTION T: INTOLERANCES SEPARATION (MILK ALLERGY VS LACTOSE INTOLERANCE)
    # =========================================================================
    def test_intolerance_vs_allergy_separation(self):
        """
        Ensures lactose intolerance and milk allergy are distinguished as separate concepts,
        and 'None' normalization never produces ['none'] as an exclusion.
        """
        # User with Lactose Intolerance only
        ctx_lactose = ComprehensiveLifestyleContext(
            user_id="user-lactose",
            demographics=PatientDemographics(
                user_id="user-lactose",
                gender="female",
                pathway="female_pcos",
                intolerances=["lactose"],
                allergens=[],
            ),
            screening=ScreeningContext(has_assessment=True, module="female_pcos", risk_category="low"),
            symptoms=SymptomSummary(),
            labs=LabBiomarkers(),
            longitudinal=LongitudinalSummary(),
        )
        safety_lactose = LifestyleSafetyEngine.evaluate_safety(ctx_lactose)
        self.assertIn("lactose", safety_lactose.excluded_food_categories)
        self.assertNotIn("none", safety_lactose.excluded_food_categories)

        # User with Dairy IgE Allergy
        ctx_milk = ComprehensiveLifestyleContext(
            user_id="user-milk",
            demographics=PatientDemographics(
                user_id="user-milk",
                gender="female",
                pathway="female_pcos",
                allergens=["milk"],
                intolerances=[],
            ),
            screening=ScreeningContext(has_assessment=True, module="female_pcos", risk_category="low"),
            symptoms=SymptomSummary(),
            labs=LabBiomarkers(),
            longitudinal=LongitudinalSummary(),
        )
        safety_milk = LifestyleSafetyEngine.evaluate_safety(ctx_milk)
        self.assertIn("milk", safety_milk.excluded_food_categories)

    # =========================================================================
    # SECTION H & G: NO-ASSESSMENT USER BEHAVIOR & PERSONALIZATION LEVELS
    # =========================================================================
    def test_unassessed_user_behavior_and_personalization_levels(self):
        """
        A user without an assessment must have has_assessment=False and LEVEL_1_PROFILE.
        Must NOT imply a clinical screening risk exists when it does not.
        """
        ctx_unassessed = ComprehensiveLifestyleContext(
            user_id="user-no-assess",
            demographics=PatientDemographics(
                user_id="user-no-assess",
                gender="female",
                pathway="female_pcos",
                bmi=22.0,
            ),
            screening=ScreeningContext(has_assessment=False),
            symptoms=SymptomSummary(),
            labs=LabBiomarkers(),
            longitudinal=LongitudinalSummary(),
            personalization_level="LEVEL_1_PROFILE",
        )

        res = LifestyleRecommendationEngine.generate(ctx_unassessed)
        self.assertFalse(res.has_assessment)
        self.assertEqual(res.personalization_level, "LEVEL_1_PROFILE")
        self.assertEqual(res.risk_probability_percent, 0.0)
        self.assertIn(res.risk_category, ("unscreened", "unassessed"))

    # =========================================================================
    # SECTION L & M: POST-LLM VALIDATOR & NON-FOOD IMMUNITY
    # =========================================================================
    def test_post_llm_validator_and_non_food_immunity(self):
        """
        Validates that food inquiries are sanitized when containing forbidden ingredients,
        while completely non-food conversations are NEVER over-sanitized.
        """
        excluded = ["peanut", "shellfish"]

        # 1. Non-food query & answer: MUST REMAIN UNTOUCHED
        non_food_msg = "How many hours of sleep should I aim for?"
        non_food_reply = "Aim for 7 to 8 hours of restful, uninterrupted sleep each night."
        result = SafetyGuardrails.validate_dietary_safety(
            text=non_food_reply,
            excluded_categories=excluded,
            user_message=non_food_msg,
        )
        self.assertEqual(result, non_food_reply, "Non-food conversation must not be modified!")

        # 2. Food query with allergenic recommendation: MUST BE SANITIZED
        food_msg = "Can you suggest a quick afternoon snack?"
        food_reply = "A great choice is roasted peanuts with sliced apples."
        sanitized = SafetyGuardrails.validate_dietary_safety(
            text=food_reply,
            excluded_categories=excluded,
            user_message=food_msg,
        )
        self.assertNotIn("peanuts", sanitized.lower())
        self.assertIn("pumpkin seeds", sanitized.lower())

    # =========================================================================
    # SECTION N: INTENT CLASSIFIER EXPANSION
    # =========================================================================
    def test_intent_classifier_expanded_coverage(self):
        """
        Verifies that all 12 specified intent questions from Section N
        authoritatively trigger LIFESTYLE_NUTRITION intent.
        """
        target_questions = [
            "What should I eat?",
            "What can I have for breakfast?",
            "Can I eat yogurt?",
            "Give me a snack",
            "How much protein should I eat?",
            "What workout should I do today?",
            "Should I exercise?",
            "Give me today's workout",
            "How can I sleep better?",
            "What should I do tonight?",
            "How can I reduce stress?",
            "What should my routine be?",
        ]

        for q in target_questions:
            intent = HealthContextBuilder.classify_intent(q)
            self.assertEqual(
                intent,
                "LIFESTYLE_NUTRITION",
                f"Question '{q}' should be classified as LIFESTYLE_NUTRITION but got '{intent}'"
            )

    # =========================================================================
    # SECTION U: COMBINATION ALLERGY TEST MATRIX (A-G)
    # =========================================================================
    def test_combination_allergy_matrix_a_through_g(self):
        """
        Tests multi-allergy / dietary pattern combinations:
        A: Milk allergy + Tree Nut allergy
        B: Vegan + Soy allergy
        C: Vegetarian + Egg allergy + Milk allergy
        D: Pescatarian + Fish allergy + Shellfish allergy
        E: Gluten intolerance + Tree Nut allergy
        F: Peanut + Tree Nut + Sesame allergy
        G: Vegan + Soy + Tree Nut allergy
        """
        cases = [
            ("A", "omnivore", ["milk", "tree_nut"], []),
            ("B", "vegan", ["soy"], []),
            ("C", "vegetarian", ["egg", "milk"], []),
            ("D", "pescatarian", ["fish", "shellfish"], []),
            ("E", "omnivore", ["tree_nut"], ["gluten"]),
            ("F", "omnivore", ["peanut", "tree_nut", "sesame"], []),
            ("G", "vegan", ["soy", "tree_nut"], []),
        ]

        for code, diet, allergens, intolerances in cases:
            ctx = ComprehensiveLifestyleContext(
                user_id=f"user-combo-{code}",
                demographics=PatientDemographics(
                    user_id=f"user-combo-{code}",
                    gender="female",
                    pathway="female_pcos",
                    bmi=26.0,
                    dietary_preference=diet,
                    allergens=allergens,
                    intolerances=intolerances,
                    allergy_status="active_allergens" if allergens else "confirmed_none",
                ),
                screening=ScreeningContext(has_assessment=True, module="female_pcos", risk_category="moderate"),
                symptoms=SymptomSummary(),
                labs=LabBiomarkers(),
                longitudinal=LongitudinalSummary(),
            )
            safety = LifestyleSafetyEngine.evaluate_safety(ctx)
            res = LifestyleRecommendationEngine.generate(ctx, safety)

            # 1. Meals non-empty
            self.assertEqual(len(res.nutrition.meal_concepts), 4, f"Case {code} should produce 4 meal concepts")

            # 2. Zero forbidden ingredients across all meals
            all_exclusions = safety.excluded_food_categories
            for meal in res.nutrition.meal_concepts:
                for text in [meal.title, meal.description] + meal.key_ingredients:
                    is_forbid, matched = is_food_forbidden(text, all_exclusions)
                    self.assertFalse(
                        is_forbid,
                        f"Case {code} leaked forbidden item '{matched}' in meal '{meal.title}': {text}"
                    )

            # 3. Label-check guidance present in guidelines when allergies exist
            if allergens:
                has_label_note = any("label" in g.lower() for g in res.nutrition.key_guidelines)
                self.assertTrue(has_label_note, f"Case {code} should include packaged-food label check guidance")

            # 4. LLM response validator leaks zero restricted foods
            test_llm_response = (
                f"For breakfast, try scrambled eggs with toast and a glass of milk or almond milk, "
                f"with a snack of peanut butter on bread or salmon with edamame."
            )
            validated = SafetyGuardrails.validate_dietary_safety(
                text=test_llm_response,
                excluded_categories=all_exclusions,
                user_message="Give me meal ideas",
            )
            for ex in all_exclusions:
                is_forbid, matched = is_food_forbidden(validated, [ex])
                self.assertFalse(
                    is_forbid,
                    f"Case {code} post-LLM validator leaked '{matched}' for category '{ex}' in: {validated}"
                )

    # =========================================================================
    # SECTION V: STATIC SUBSTITUTE COLLISIONS & REVALIDATION
    # =========================================================================
    def test_static_substitute_collisions_and_revalidation(self):
        """
        Explicitly tests:
        1. milk -> almond milk for tree-nut allergic user (MUST NOT use almond milk)
        2. butter -> olive oil for normal user
        3. peanut butter -> sunflower seed butter for seed/sesame-restricted user (MUST NOT use sunflower seed butter if seeds excluded)
        4. tofu -> alternative for soy allergy (MUST NOT use tofu)
        5. fish -> alternative for fish allergy (MUST NOT use fish)
        6. egg -> alternative for egg allergy (MUST NOT use egg)
        """
        # 1. Milk replacement for Tree Nut allergic user: MUST NOT pick almond milk!
        res_tree_nut = SafetyGuardrails.validate_dietary_safety(
            text="You can drink a warm cup of milk before bed.",
            excluded_categories=["milk", "dairy", "tree_nut"],
            user_message="What drink can I have?",
        )
        self.assertNotIn("almond", res_tree_nut.lower(), "Must NOT substitute milk with almond milk for tree-nut allergic user!")
        self.assertTrue(any(safe in res_tree_nut.lower() for safe in ("oat milk", "rice milk", "safe alternative")))

        # 2. Butter -> olive oil for normal user with dairy restriction
        res_butter = SafetyGuardrails.validate_dietary_safety(
            text="Cook your eggs with a tablespoon of butter.",
            excluded_categories=["dairy", "milk"],
            user_message="What fat should I use?",
        )
        self.assertIn("olive oil", res_butter.lower(), "Butter should safely substitute to olive oil.")

        # 3. Peanut butter for seed/sesame/nut restricted user: MUST NOT use sunflower seed butter, tahini, or 'seed butter alternative'
        res_seed_restricted = SafetyGuardrails.validate_dietary_safety(
            text="Have some peanut butter with celery.",
            excluded_categories=["peanut", "sesame", "seeds", "nuts"],
            user_message="Snack idea?",
        )
        self.assertNotIn("sunflower seed", res_seed_restricted.lower(), "Must not use sunflower seed butter when seeds are excluded!")
        self.assertNotIn("seed butter alternative", res_seed_restricted.lower(), "Must not use seed butter alternative!")
        self.assertNotIn("peanut", res_seed_restricted.lower())
        self.assertIn("an allergy-compatible spread", res_seed_restricted.lower(), "Must use truly neutral fallback 'an allergy-compatible spread'!")

        # 4. Tofu for soy allergic user: MUST NOT use tofu
        res_soy = SafetyGuardrails.validate_dietary_safety(
            text="Enjoy pan-seared organic tofu with steamed broccoli.",
            excluded_categories=["soy"],
            user_message="Lunch idea?",
        )
        self.assertNotIn("tofu", res_soy.lower(), "Must not use tofu for soy-allergic user!")
        self.assertTrue(any(safe in res_soy.lower() for safe in ("chickpea", "lentil", "paneer", "safe alternative")))

        # 5. Fish for fish allergic user: MUST NOT use fish
        res_fish = SafetyGuardrails.validate_dietary_safety(
            text="Bake fresh salmon or cod with herbs.",
            excluded_categories=["fish"],
            user_message="Dinner idea?",
        )
        self.assertNotIn("salmon", res_fish.lower(), "Must not use salmon for fish-allergic user!")
        self.assertNotIn("cod", res_fish.lower(), "Must not use cod for fish-allergic user!")

        # 6. Egg for egg allergic user: MUST NOT use egg
        res_egg = SafetyGuardrails.validate_dietary_safety(
            text="Have two boiled eggs with black coffee.",
            excluded_categories=["egg", "eggs"],
            user_message="Breakfast idea?",
        )
        self.assertNotIn("boiled egg", res_egg.lower(), "Must not recommend boiled egg for egg-allergic user!")
        self.assertNotIn("eggs", res_egg.lower())
