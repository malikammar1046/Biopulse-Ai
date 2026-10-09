"""
backend/apps/intelligence/tests/test_male_lifestyle_recipe.py

Comprehensive test suite verifying:
1. Male Lifestyle & Nutrition Engine Personalization:
   - Authentic Pakistani meal concepts tailored to men
   - Condition-aware guidance for hypogonadism/endocrine risk vs general vitality
   - Zero mention of PCOS, ovaries, menstrual cycles, or female health terms in male outputs
   - Anti-androgenic tea safety (spearmint excluded for males)
   - Female PCOS recommendations preserved 100% intact
2. LLM-Powered AI Recipe Generator:
   - Structured JSON output with all required clinical/culinary fields
   - Deterministic allergen exclusion gating (peanuts, dairy, etc.)
   - Missing biometrics gating (numerical calories withheld when height/weight absent)
   - Automatic PCOS/female terminology scrubbing in male mode
   - Graceful error handling on LLM network failure or malformed output
3. LifestyleRecipeView DRF API:
   - Authorization required (401 unauthenticated)
   - Isolated user access
   - POST generates and caches recipe
   - GET returns latest recipe
"""

import json
from dataclasses import asdict
from unittest.mock import MagicMock, patch

from django.contrib.auth.models import User
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from apps.intelligence.services.ai_recipe_generator import (
    AIRecipeGenerator,
    AIRecipeGeneratorError,
)
from apps.intelligence.services.lifestyle_context_builder import (
    ComprehensiveLifestyleContext,
    LabBiomarkers,
    LongitudinalSummary,
    PatientDemographics,
    ScreeningContext,
    SymptomSummary,
)
from apps.intelligence.services.lifestyle_recommendation_engine import (
    LifestyleRecommendationEngine,
)
from apps.intelligence.services.lifestyle_safety_rules import (
    LifestyleSafetyEngine,
)
from apps.intelligence.services.pakistan_food_catalog import (
    PakistanFoodCatalog,
)


@override_settings(ALLOW_LOCAL_SQLITE_FALLBACK=True)
class MaleLifestyleAndRecipeTests(TestCase):
    """Verifies male personalization, zero PCOS leakage, and LLM recipe generation."""

    def setUp(self):
        self.male_user = User.objects.create_user(
            username="male_test_user",
            password="testpassword123",
            id=991122,
        )
        self.female_user = User.objects.create_user(
            username="female_test_user",
            password="testpassword123",
            id=991133,
        )
        self.client = APIClient()

    def _create_male_context(
        self,
        has_assessment=False,
        risk_category="lower",
        has_hypogonadism=False,
        allergies=None,
        has_biometrics=True,
    ):
        return ComprehensiveLifestyleContext(
            user_id=str(self.male_user.id),
            demographics=PatientDemographics(
                user_id=str(self.male_user.id),
                gender="male",
                pathway="androsense",
                age=32,
                height_cm=178.0 if has_biometrics else None,
                weight_kg=80.0 if has_biometrics else None,
                bmi=25.2 if has_biometrics else None,
                allergens=allergies or [],
            ),
            screening=ScreeningContext(
                has_assessment=has_assessment,
                module="male_hypogonadism",
                risk_category=risk_category,
            ),
            shap_drivers=[],
            shap_mitigators=[],
            symptoms=SymptomSummary(),
            labs=LabBiomarkers(
                total_testosterone_ng_dl=240.0 if has_hypogonadism else None,
            ),
            longitudinal=LongitudinalSummary(),
        )

    def _create_female_context(self):
        return ComprehensiveLifestyleContext(
            user_id=str(self.female_user.id),
            demographics=PatientDemographics(
                user_id=str(self.female_user.id),
                gender="female",
                pathway="ovasense",
                age=28,
                height_cm=162.0,
                weight_kg=68.0,
                bmi=25.9,
                allergens=[],
            ),
            screening=ScreeningContext(
                has_assessment=True,
                module="female_pcos",
                risk_category="moderate",
            ),
            shap_drivers=[],
            shap_mitigators=[],
            symptoms=SymptomSummary(),
            labs=LabBiomarkers(),
            longitudinal=LongitudinalSummary(),
        )

    # =========================================================================
    # 1. MALE LIFESTYLE & NUTRITION ENGINE PERSONALIZATION
    # =========================================================================

    def test_male_receives_pakistani_male_meals_with_zero_pcos_mentions(self):
        """Male users must receive culturally grounded Pakistani meal concepts with 0 PCOS mentions."""
        context = self._create_male_context(has_assessment=True, risk_category="moderate")
        result = LifestyleRecommendationEngine.generate(context)

        nutrition = result.nutrition
        meal_concepts = nutrition.meal_concepts
        self.assertGreaterEqual(len(meal_concepts), 4)

        # Check male meal titles
        titles = [m.title for m in meal_concepts]
        self.assertTrue(any("Omelet" in t or "Chilla" in t for t in titles))
        self.assertTrue(any("Daal Chana" in t for t in titles))
        self.assertTrue(any("Palak" in t or "Fish" in t for t in titles))
        self.assertTrue(any("Bhuna Chana" in t or "Chickpea" in t or "Makhana" in t for t in titles))

        # Strict check: Zero PCOS, ovary, or menstrual cycle mentions anywhere in the result
        dumped_str = json.dumps(result.to_dict(), default=str).lower()
        forbidden_terms = [
            "pcos",
            "polycystic",
            "ovary",
            "ovarian",
            "menstrual",
            "menstruation",
            "follicular",
            "luteal",
            "ovulation",
            "theca",
        ]
        for term in forbidden_terms:
            self.assertNotIn(
                term,
                dumped_str,
                f"Forbidden female/PCOS term '{term}' leaked into male recommendations!",
            )

    def test_condition_aware_guidance_for_hypogonadism_vs_general_male(self):
        """High risk or low testosterone males receive endocrine focus; general males receive vitality focus."""
        # High risk / low testosterone male
        context_high_risk = self._create_male_context(
            has_assessment=True, risk_category="elevated", has_hypogonadism=True
        )
        result_high = LifestyleRecommendationEngine.generate(context_high_risk)
        title_high = result_high.nutrition.strategy_title
        summary_high = result_high.nutrition.strategy_summary

        self.assertIn("Metabolic Vitality & Endocrine Support", title_high)
        self.assertTrue("zinc" in summary_high.lower() or "micronutrient" in summary_high.lower() or "vitality" in summary_high.lower())

        # General male (no assessment, no diagnosed condition)
        context_general = self._create_male_context(has_assessment=False)
        result_general = LifestyleRecommendationEngine.generate(context_general)
        title_general = result_general.nutrition.strategy_title

        self.assertIn("Nutrient-Dense Balanced Nutrition for Men", title_general)
        self.assertNotIn("hypogonadism", title_general.lower())

    def test_targeted_swaps_tea_safety_male_vs_female(self):
        """Men should NOT receive anti-androgenic spearmint tea; female PCOS users should."""
        # Male context
        male_context = self._create_male_context()
        male_result = LifestyleRecommendationEngine.generate(male_context)
        male_swaps = [asdict(s) for s in male_result.nutrition.targeted_swaps]
        male_swap_text = json.dumps(male_swaps).lower()

        self.assertNotIn("spearmint", male_swap_text)
        self.assertTrue("green tea" in male_swap_text or "cardamom" in male_swap_text)

        # Female context
        female_context = self._create_female_context()
        female_result = LifestyleRecommendationEngine.generate(female_context)
        female_swaps = [asdict(s) for s in female_result.nutrition.targeted_swaps]
        female_swap_text = json.dumps(female_swaps).lower()

        self.assertIn("spearmint", female_swap_text)

    def test_female_pcos_experience_preserved_intact(self):
        """Female users continue receiving female PCOS meal concepts and clinical mechanisms."""
        female_context = self._create_female_context()
        female_result = LifestyleRecommendationEngine.generate(female_context)

        nutrition = female_result.nutrition
        meal_concepts = nutrition.meal_concepts
        titles = [m.title for m in meal_concepts]

        # Should contain female PCOS chilla/daal
        self.assertTrue(any("Omelet" in t or "Chilla" in t for t in titles))
        self.assertTrue(any("Palak" in t or "Daal" in t for t in titles))

    # =========================================================================
    # 2. LLM-POWERED AI RECIPE GENERATOR
    # =========================================================================

    @patch("apps.intelligence.services.ai_recipe_generator.get_llm_provider")
    def test_recipe_generator_produces_structured_recipe(self, mock_get_provider):
        """AI Recipe Generator returns valid structure with culinary and suitability details."""
        mock_provider = MagicMock()
        mock_llm_response = {
            "recipe_name": "Bhuna Palak Chicken with Brown Basmati",
            "short_description": "Tender chicken cooked with fresh spinach, garlic, and cumin, paired with high-fiber brown rice.",
            "prep_time_minutes": 15,
            "cook_time_minutes": 25,
            "servings": 2,
            "why_suits_profile": "Provides high bioavailable protein and zinc for healthy metabolism without insulin spikes.",
            "ingredients": [
                {"item": "Boneless Chicken Breast", "quantity": "250g", "practical_measure": "cubed", "category": "protein"},
                {"item": "Fresh Spinach (Palak)", "quantity": "2 cups", "practical_measure": "chopped", "category": "vegetable"},
                {"item": "Brown Basmati Rice", "quantity": "1 cup", "practical_measure": "cooked", "category": "grain"},
                {"item": "Cold-Pressed Mustard Oil", "quantity": "1 tbsp", "practical_measure": "15 ml", "category": "fat"},
            ],
            "instructions": [
                "Heat mustard oil in a pan, add garlic and cumin seeds.",
                "Add cubed chicken and sear until lightly golden.",
                "Stir in chopped spinach and cook until wilted and dry.",
                "Serve warm alongside cooked brown basmati rice.",
            ],
            "substitutions": [
                {"original": "Chicken", "substitute": "Firm Tofu or Paneer", "reason": "Vegetarian adaptation"}
            ],
            "nutritional_highlights": {
                "estimated_calories_per_serving": 420,
                "protein_grams": 38,
                "carbs_grams": 32,
                "fat_grams": 12,
                "fiber_grams": 6,
                "key_micronutrients": ["Zinc", "Iron", "Magnesium"],
                "qualitative_summary": "High protein, zinc-dense recovery meal.",
            },
        }
        mock_chat_response = MagicMock()
        mock_chat_response.answer = json.dumps(mock_llm_response)
        mock_provider.generate_chat_response.return_value = mock_chat_response
        mock_get_provider.return_value = mock_provider

        context = self._create_male_context()
        recipe = AIRecipeGenerator.generate_recipe(
            context,
            meal_type="Dinner",
            preference_tag="high_protein",
        )

        self.assertIsNotNone(recipe)
        self.assertEqual(recipe["recipe_name"], "Bhuna Palak Chicken with Brown Basmati")
        self.assertEqual(recipe["prep_time_minutes"], 15)
        self.assertEqual(recipe["cook_time_minutes"], 25)
        self.assertEqual(recipe["servings"], 2)
        self.assertGreaterEqual(len(recipe["ingredients"]), 4)
        self.assertGreaterEqual(len(recipe["instructions"]), 4)
        self.assertIn("why_suits_profile", recipe)

    @patch("apps.intelligence.services.ai_recipe_generator.get_llm_provider")
    def test_recipe_generator_respects_allergens(self, mock_get_provider):
        """Allergen avoidance must strictly filter or reject forbidden ingredients."""
        mock_provider = MagicMock()
        mock_forbidden_response = {
            "recipe_name": "Chicken Curry with Peanut Garnish",
            "short_description": "Curry containing crushed peanuts.",
            "prep_time_minutes": 10,
            "cook_time_minutes": 20,
            "servings": 2,
            "why_suits_profile": "Good meal.",
            "ingredients": [
                {"item": "Chicken Breast", "quantity": "200g", "practical_measure": "cubed", "category": "protein"},
                {"item": "Crushed Peanuts", "quantity": "2 tbsp", "practical_measure": "crushed", "category": "nut"},
            ],
            "instructions": ["Cook chicken and top with crushed peanuts."],
            "substitutions": [],
            "nutritional_highlights": {
                "estimated_calories_per_serving": 400,
                "protein_grams": 30,
                "carbs_grams": 10,
                "fat_grams": 15,
                "fiber_grams": 3,
                "key_micronutrients": [],
                "qualitative_summary": "Nutritious meal",
            },
        }
        mock_chat_response = MagicMock()
        mock_chat_response.answer = json.dumps(mock_forbidden_response)
        mock_provider.generate_chat_response.return_value = mock_chat_response
        mock_get_provider.return_value = mock_provider

        # User has peanut allergy -> Safety Gate blocks restricted ingredient
        context = self._create_male_context(allergies=["peanuts"])
        with self.assertRaises(AIRecipeGeneratorError) as cm:
            AIRecipeGenerator.generate_recipe(context, meal_type="Lunch")
        self.assertIn("restricted ingredient", str(cm.exception).lower())

    @patch("apps.intelligence.services.ai_recipe_generator.get_llm_provider")
    def test_recipe_generator_withholds_exact_calories_when_biometrics_missing(self, mock_get_provider):
        """When height and weight are absent, numerical calories are omitted."""
        mock_provider = MagicMock()
        mock_llm_response = {
            "recipe_name": "Simple Daal Bowl",
            "short_description": "Lentils with spices.",
            "prep_time_minutes": 10,
            "cook_time_minutes": 20,
            "servings": 2,
            "why_suits_profile": "Healthy lentil bowl.",
            "ingredients": [{"item": "Yellow Moong Daal", "quantity": "1 cup", "practical_measure": "cooked", "category": "legume"}],
            "instructions": ["Boil and temper."],
            "substitutions": [],
            "nutritional_highlights": {
                "estimated_calories_per_serving": 350,
                "protein_grams": 18,
                "carbs_grams": 40,
                "fat_grams": 4,
                "fiber_grams": 8,
                "key_micronutrients": ["Iron"],
                "qualitative_summary": "High fiber lentils.",
            },
        }
        mock_chat_response = MagicMock()
        mock_chat_response.answer = json.dumps(mock_llm_response)
        mock_provider.generate_chat_response.return_value = mock_chat_response
        mock_get_provider.return_value = mock_provider

        # Context WITHOUT biometrics (height_cm=None, weight_kg=None)
        context = self._create_male_context(has_biometrics=False)
        recipe = AIRecipeGenerator.generate_recipe(context, meal_type="Lunch")

        highlights = recipe["nutritional_highlights"]
        self.assertIsNone(highlights["estimated_calories_per_serving"])
        self.assertIn("Numerical calories withheld", highlights.get("calories_disclaimer", ""))

    @patch("apps.intelligence.services.ai_recipe_generator.get_llm_provider")
    def test_recipe_generator_rejects_pcos_hallucination_for_male(self, mock_get_provider):
        """If LLM hallucinates PCOS in male recipe output, generation is deterministically rejected."""
        mock_provider = MagicMock()
        mock_llm_response = {
            "recipe_name": "Pakistani Mixed Veggie Bowl for PCOS Management",
            "short_description": "Designed to regulate insulin and ovarian health.",
            "prep_time_minutes": 10,
            "cook_time_minutes": 20,
            "servings": 1,
            "why_suits_profile": "Supports PCOS cycle regulation.",
            "ingredients": [{"item": "Mixed Veggies", "quantity": "2 cups", "practical_measure": "steamed", "category": "veg"}],
            "instructions": ["Steam and serve."],
            "substitutions": [],
            "nutritional_highlights": {
                "estimated_calories_per_serving": 250,
                "protein_grams": 10,
                "carbs_grams": 25,
                "fat_grams": 5,
                "fiber_grams": 6,
                "key_micronutrients": [],
                "qualitative_summary": "Healthy bowl",
            },
        }
        mock_chat_response = MagicMock()
        mock_chat_response.answer = json.dumps(mock_llm_response)
        mock_provider.generate_chat_response.return_value = mock_chat_response
        mock_get_provider.return_value = mock_provider

        context = self._create_male_context()
        with self.assertRaises(AIRecipeGeneratorError) as cm:
            AIRecipeGenerator.generate_recipe(context, meal_type="Lunch")
        self.assertIn("female-specific terminology", str(cm.exception).lower())

    @patch("apps.intelligence.services.ai_recipe_generator.get_llm_provider")
    def test_recipe_generator_rejects_unsupported_cures_and_t_boosts(self, mock_get_provider):
        """Recipes claiming to cure conditions or multiply testosterone are rejected."""
        mock_provider = MagicMock()
        mock_llm_response = {
            "recipe_name": "Spiced Beef Kebab that Cures Hypogonadism",
            "short_description": "Supercharges testosterone by 500% overnight.",
            "prep_time_minutes": 10,
            "cook_time_minutes": 20,
            "servings": 2,
            "why_suits_profile": "Reverses hypogonadism and boosts testosterone.",
            "ingredients": [{"item": "Ground Beef", "quantity": "250g", "practical_measure": "lean minced", "category": "meat"}],
            "instructions": ["Grill and eat."],
            "substitutions": [],
            "nutritional_highlights": {
                "estimated_calories_per_serving": 400,
                "protein_grams": 35,
                "carbs_grams": 5,
                "fat_grams": 15,
                "fiber_grams": 2,
                "key_micronutrients": ["Zinc"],
                "qualitative_summary": "High protein meal",
            },
        }
        mock_chat_response = MagicMock()
        mock_chat_response.answer = json.dumps(mock_llm_response)
        mock_provider.generate_chat_response.return_value = mock_chat_response
        mock_get_provider.return_value = mock_provider

        context = self._create_male_context()
        with self.assertRaises(AIRecipeGeneratorError) as cm:
            AIRecipeGenerator.generate_recipe(context, meal_type="Dinner")
        err_msg = str(cm.exception).lower()
        self.assertTrue("treatment" in err_msg or "hormonal" in err_msg or "rejected" in err_msg)

    def test_allergy_derivatives_and_sauces_strictly_detected(self):
        """Common ingredient aliases, oils, powders, and sauces are caught by safety checks."""
        from apps.intelligence.services.lifestyle_safety_rules import is_food_forbidden

        # Peanut derivatives
        is_bad, _ = is_food_forbidden("2 tbsp cold-pressed peanut oil", ["peanuts"])
        self.assertTrue(is_bad)
        is_bad, _ = is_food_forbidden("groundnut oil for shallow frying", ["peanut"])
        self.assertTrue(is_bad)

        # Dairy derivatives
        is_bad, _ = is_food_forbidden("1 scoop whey protein isolate", ["dairy"])
        self.assertTrue(is_bad)
        is_bad, _ = is_food_forbidden("2 tbsp whole milk powder", ["lactose"])
        self.assertTrue(is_bad)
        is_bad, _ = is_food_forbidden("1 tbsp desi ghee", ["milk"])
        self.assertTrue(is_bad)
        is_bad, _ = is_food_forbidden("100g fresh paneer cubes", ["dairy"])
        self.assertTrue(is_bad)

        # Seafood & Fish sauces
        is_bad, _ = is_food_forbidden("1 tsp fermented fish sauce", ["fish"])
        self.assertTrue(is_bad)
        is_bad, _ = is_food_forbidden("1 tbsp oyster sauce", ["shellfish"])
        self.assertTrue(is_bad)

        # Gluten derivatives
        is_bad, _ = is_food_forbidden("1 cup suji (semolina)", ["gluten"])
        self.assertTrue(is_bad)
        is_bad, _ = is_food_forbidden("2 whole wheat rotis", ["wheat"])
        self.assertTrue(is_bad)

    @patch("apps.intelligence.services.ai_recipe_generator.get_llm_provider")
    def test_unsafe_substitutions_filtered_out(self, mock_get_provider):
        """Proposed substitutions matching user allergens are safely pruned from the returned recipe."""
        mock_provider = MagicMock()
        mock_llm_response = {
            "recipe_name": "Tofu & Palak Stir-Fry",
            "short_description": "Clean plant protein with greens.",
            "prep_time_minutes": 10,
            "cook_time_minutes": 15,
            "servings": 2,
            "why_suits_profile": "Supports daily metabolic health.",
            "ingredients": [{"item": "Firm Organic Tofu", "quantity": "250g", "practical_measure": "cubed", "category": "protein"}],
            "instructions": ["Sauté tofu with spinach."],
            "substitutions": [
                {"original": "Firm Organic Tofu", "substitute": "Paneer (250g)", "reason": "Dairy alternative"},
                {"original": "Firm Organic Tofu", "substitute": "Boiled chickpeas (1 cup)", "reason": "Legume alternative"},
            ],
            "nutritional_highlights": {
                "estimated_calories_per_serving": 320,
                "protein_grams": 22,
                "carbs_grams": 15,
                "fat_grams": 10,
                "fiber_grams": 6,
                "key_micronutrients": ["Iron", "Magnesium"],
                "qualitative_summary": "Plant protein",
            },
        }
        mock_chat_response = MagicMock()
        mock_chat_response.answer = json.dumps(mock_llm_response)
        mock_provider.generate_chat_response.return_value = mock_chat_response
        mock_get_provider.return_value = mock_provider

        # User is allergic to dairy -> paneer substitution must be filtered out!
        context = self._create_male_context(allergies=["dairy"])
        recipe = AIRecipeGenerator.generate_recipe(context, meal_type="Dinner")
        subs = recipe["substitutions"]
        self.assertEqual(len(subs), 1)
        self.assertEqual(subs[0]["substitute"], "Boiled chickpeas (1 cup)")
        self.assertNotIn("Paneer", [s["substitute"] for s in subs])

    @patch("apps.intelligence.services.ai_recipe_generator.get_llm_provider")
    def test_recipe_generator_graceful_fallback_on_provider_error(self, mock_get_provider):
        """When LLM provider raises an exception, generator raises clear safety error without crashing."""
        mock_provider = MagicMock()
        mock_provider.generate_chat_response.side_effect = Exception("LLM Provider Timeout or Rate Limit")
        mock_get_provider.return_value = mock_provider

        context = self._create_male_context()
        with self.assertRaises(AIRecipeGeneratorError) as cm:
            AIRecipeGenerator.generate_recipe(context, meal_type="Lunch")
        self.assertIn("error", str(cm.exception).lower())

    # =========================================================================
    # 3. LIFESTYLE RECIPE DRF API ENDPOINT
    # =========================================================================

    def test_recipe_view_requires_authentication(self):
        """Unauthenticated requests must be rejected with 401."""
        resp_post = self.client.post("/api/v1/intelligence/lifestyle-recipe/", {})
        self.assertEqual(resp_post.status_code, 401)

        resp_get = self.client.get("/api/v1/intelligence/lifestyle-recipe/")
        self.assertEqual(resp_get.status_code, 401)

    @patch("apps.intelligence.views_lifestyle.lifestyle_repository.get_active_recommendations")
    @patch("apps.intelligence.views_lifestyle.lifestyle_repository.save_recommendations")
    @patch("apps.intelligence.views_lifestyle.AIRecipeGenerator.generate_recipe")
    @patch("apps.intelligence.views_lifestyle.LifestyleContextBuilder.build_context")
    def test_recipe_view_post_generates_and_saves_recipe(
        self, mock_build, mock_generate, mock_save, mock_get_active
    ):
        """Authenticated POST generates recipe and saves to lifestyle repository."""
        self.client.force_authenticate(user=self.male_user)

        mock_context = self._create_male_context()
        mock_build.return_value = mock_context

        mock_recipe = {
            "recipe_name": "Char-Grilled Chicken Tikka Bowl",
            "short_description": "Lean protein with salad and mint raita.",
            "prep_time_minutes": 15,
            "cook_time_minutes": 20,
            "servings": 2,
            "meal_type": "Dinner",
            "why_suits_profile": "Provides high protein and essential cofactors.",
            "ingredients": [{"item": "Chicken Breast", "quantity": "250g", "practical_measure": "cubed"}],
            "instructions": ["Grill chicken and serve with mint raita."],
            "substitutions": [],
            "nutritional_highlights": {
                "estimated_calories_per_serving": 410,
                "protein_grams": 42,
                "carbs_grams": 15,
                "fat_grams": 12,
                "fiber_grams": 4,
                "key_micronutrients": ["Zinc", "B6"],
                "qualitative_summary": "High protein recovery meal.",
            },
        }
        mock_generate.return_value = mock_recipe
        mock_get_active.return_value = {
            "payload": {"nutrition": {}},
            "context_version": "v1",
            "item_statuses": {},
        }

        resp = self.client.post(
            "/api/v1/intelligence/lifestyle-recipe/",
            {
                "module": "androsense",
                "meal_type": "Dinner",
                "preference": "high_protein",
            },
            format="json",
        )
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["recipe_name"], "Char-Grilled Chicken Tikka Bowl")
        mock_save.assert_called_once()

        # Authenticated GET retrieves the saved recipe
        mock_get_active.return_value = {
            "payload": {"latest_recipe": mock_recipe},
        }
        resp_get = self.client.get("/api/v1/intelligence/lifestyle-recipe/?module=androsense")
        self.assertEqual(resp_get.status_code, 200)
        data_get = resp_get.json()
        self.assertEqual(data_get["recipe_name"], "Char-Grilled Chicken Tikka Bowl")

    @patch("apps.intelligence.views_lifestyle.lifestyle_repository.get_active_recommendations")
    def test_two_male_accounts_isolation_and_distinct_personalization(self, mock_get_active):
        """
        Confirms that two separate male accounts with different profiles:
        1. Produce distinct, personalized recommendations and recipe parameters.
        2. Strictly isolate data: User 1 cannot retrieve User 2's recipe, and vice versa.
        3. Do not invent missing data (User 2 has missing biometrics -> calories withheld).
        """
        male_user_2 = User.objects.create_user(
            username="male_user_two", password="testpassword123", id=991144
        )

        # Context 1: Male 1 - Omnivore, Peanut Allergy, Elevated Risk, Biometrics Present
        context_1 = ComprehensiveLifestyleContext(
            user_id=str(self.male_user.id),
            demographics=PatientDemographics(
                user_id=str(self.male_user.id),
                gender="male",
                pathway="androsense",
                age=35,
                height_cm=182.0,
                weight_kg=85.0,
                bmi=25.7,
                dietary_preference="omnivore",
                allergens=["peanuts"],
            ),
            screening=ScreeningContext(
                has_assessment=True,
                module="male_hypogonadism",
                risk_category="elevated",
            ),
        )

        # Context 2: Male 2 - Vegetarian, Dairy Allergy, No Assessment, Biometrics Missing
        context_2 = ComprehensiveLifestyleContext(
            user_id=str(male_user_2.id),
            demographics=PatientDemographics(
                user_id=str(male_user_2.id),
                gender="male",
                pathway="androsense",
                age=27,
                height_cm=None,
                weight_kg=None,
                bmi=None,
                dietary_preference="vegetarian",
                allergens=["dairy"],
            ),
            screening=ScreeningContext(
                has_assessment=False,
                module="male_hypogonadism",
                risk_category="lower",
            ),
        )

        # 1. Recommendation Engine Personalization Check
        rec_1 = LifestyleRecommendationEngine.generate(context_1)
        rec_2 = LifestyleRecommendationEngine.generate(context_2)

        # Male 1 receives endocrine & metabolic vitality focus due to elevated assessment
        self.assertIn("Endocrine Support", rec_1.nutrition.strategy_title)
        # Male 2 receives balanced vitality focus
        self.assertIn("Balanced Nutrition", rec_2.nutrition.strategy_title)

        # Biometrics calibration check: Male 1 has calibrated calories, Male 2 has unavailable
        self.assertIsNotNone(rec_1.nutrition.daily_targets.daily_calories_kcal)
        self.assertIsNone(rec_2.nutrition.daily_targets.daily_calories_kcal)
        self.assertEqual(rec_2.nutrition.daily_targets.target_status, "unavailable_missing_biometrics")

        # 2. Recipe Generator Prompt Construction Personalization
        safety_1 = LifestyleSafetyEngine.evaluate_safety(context_1)
        safety_2 = LifestyleSafetyEngine.evaluate_safety(context_2)
        foods_1 = PakistanFoodCatalog.get_eligible_foods(
            allergens=context_1.demographics.allergens,
            dietary_preference=context_1.demographics.dietary_preference,
            excluded_food_categories=safety_1.excluded_food_categories,
        )
        foods_2 = PakistanFoodCatalog.get_eligible_foods(
            allergens=context_2.demographics.allergens,
            dietary_preference=context_2.demographics.dietary_preference,
            excluded_food_categories=safety_2.excluded_food_categories,
        )

        _, user_prompt_1 = AIRecipeGenerator._build_controlled_recipe_prompts(
            context=context_1,
            safety=safety_1,
            eligible_foods=foods_1,
            meal_type="Lunch",
            preference_tag=None,
            custom_notes=None,
            is_male=True,
            has_biometrics=True,
        )
        _, user_prompt_2 = AIRecipeGenerator._build_controlled_recipe_prompts(
            context=context_2,
            safety=safety_2,
            eligible_foods=foods_2,
            meal_type="Lunch",
            preference_tag=None,
            custom_notes=None,
            is_male=True,
            has_biometrics=False,
        )

        # User 1 prompt has peanut allergy and elevated metabolic context
        self.assertIn("peanuts", user_prompt_1.lower())
        self.assertIn("elevated metabolic", user_prompt_1.lower())
        # User 2 prompt has vegetarian preference, dairy exclusion, and withheld calories schema
        self.assertIn("vegetarian", user_prompt_2.lower())
        self.assertIn("dairy", user_prompt_2.lower())
        self.assertIn('"estimated_calories_per_serving": null', user_prompt_2)

        # 3. Account Isolation at Endpoint Layer
        def mock_repo_get(user_id, module, auth_token=None):
            if str(user_id) == str(self.male_user.id):
                return {"payload": {"latest_recipe": {"recipe_name": "User 1 Chicken Tikka"}}}
            elif str(user_id) == str(male_user_2.id):
                return {"payload": {"latest_recipe": {"recipe_name": "User 2 Daal Stew"}}}
            return None

        mock_get_active.side_effect = mock_repo_get

        # Authenticated as User 1
        self.client.force_authenticate(user=self.male_user)
        # Even if attacker tries to pass ?user_id=991144 or body user_id, it is ignored
        resp_user_1 = self.client.get("/api/v1/intelligence/lifestyle-recipe/?user_id=991144")
        self.assertEqual(resp_user_1.status_code, 200)
        self.assertEqual(resp_user_1.json()["recipe_name"], "User 1 Chicken Tikka")
        self.assertNotEqual(resp_user_1.json()["recipe_name"], "User 2 Daal Stew")

        # Authenticated as User 2
        self.client.force_authenticate(user=male_user_2)
        resp_user_2 = self.client.get("/api/v1/intelligence/lifestyle-recipe/?user_id=991122")
        self.assertEqual(resp_user_2.status_code, 200)
        self.assertEqual(resp_user_2.json()["recipe_name"], "User 2 Daal Stew")
        self.assertNotEqual(resp_user_2.json()["recipe_name"], "User 1 Chicken Tikka")
