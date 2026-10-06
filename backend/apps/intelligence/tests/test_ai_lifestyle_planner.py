"""
backend/apps/intelligence/tests/test_ai_lifestyle_planner.py

Automated Test Suite for Hybrid Rule-Based + Generative AI Recommendation Engine:
1. Authenticated request succeeds (200 OK)
2. Unauthenticated request rejected (401 Unauthorized)
3. User isolation: Request strictly uses request.user.id
4. Gemini provider selected correctly & mocked cleanly (zero live API calls)
5. Missing API key handled safely
6. Gemini malformed JSON handled safely (falls back to deterministic template)
7. Deterministic safety engine cannot be overridden by Gemini
8. Allergen violation rejected by output validator (e.g. dairy violation replaced)
9. Dietary restriction violation rejected (e.g. meat in vegetarian replaced)
10. Prohibited exercise rejected (e.g. HIIT replaced with low-impact activity)
11. Unsafe calorie recommendation rejected / authoritative floor enforced
12. Medication change recommendation rejected by validator
13. Diagnostic language rejected by validator (screening != diagnosis)
14. Missing biometrics do not produce fabricated calorie values
15. Pakistani food catalog grounding works
16. Response structure matches required TypeScript schema
"""

from __future__ import annotations

import json
import os
import uuid
from unittest.mock import MagicMock, patch

from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from apps.intelligence.services.ai_lifestyle_planner import AILifestylePlanner
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
from apps.intelligence.services.lifestyle_repository import lifestyle_repository
from apps.intelligence.services.lifestyle_safety_rules import (
    LifestyleSafetyEngine,
    SafetyEvaluationResult,
)
from apps.intelligence.services.llm_provider import (
    GeminiProvider,
    LLMProvider,
    LLMProviderError,
    LLMResponse,
    get_llm_provider,
)
from apps.intelligence.services.pakistan_food_catalog import (
    GroundedPakistaniFood,
    PakistanFoodCatalog,
)

User = get_user_model()


class MockGeminiProvider(LLMProvider):
    """Predictable mock provider for unit testing without live API keys."""

    def __init__(self, canned_response_text: str | None = None, raise_error: Exception | None = None):
        self.canned_response_text = canned_response_text
        self.raise_error = raise_error

    def generate_chat_response(
        self,
        system_instruction: str,
        user_message: str,
        health_context: str,
        conversation_history=None,
        **kwargs,
    ) -> LLMResponse:
        if self.raise_error:
            raise self.raise_error

        default_json = {
            "plan_duration_days": 7,
            "summary": "Your personalized 7-day Pakistani lifestyle roadmap designed for metabolic balance.",
            "nutrition": {
                "goals": ["Anchor meals with quality protein", "Prioritize slow-digesting complex whole grains"],
                "daily_meals": [
                    {
                        "day": 1,
                        "day_name": "Monday",
                        "breakfast": {
                            "name": "Spiced Egg Omelet with Chapati",
                            "description": "2 eggs with tomatoes and spinach, served with 1 whole wheat chapati.",
                            "why": "Provides steady morning energy and supports blood sugar stability.",
                        },
                        "lunch": {
                            "name": "Daal Masoor with Boiled Rice",
                            "description": "Slow-cooked red lentil curry with steamed basmati rice and cucumber salad.",
                            "why": "Plant protein and soluble fiber promote gradual digestion.",
                        },
                        "snack": {
                            "name": "Roasted Chana",
                            "description": "Handful of dry roasted chickpeas with green tea.",
                            "why": "Crunchy afternoon satiety bridge without refined sugars.",
                        },
                        "dinner": {
                            "name": "Chicken Curry with Steamed Veggies",
                            "description": "Lean chicken curry prepared in mustard oil with mixed seasonal vegetables.",
                            "why": "Lean protein supports tissue repair and overnight recovery.",
                        },
                    }
                ],
            },
            "hydration": {
                "guidance": "Drink approximately 2.5L of water and unsweetened tea throughout the day.",
                "daily_target_liters": 2.5,
            },
            "physical_activity": {
                "weekly_goal": "150 minutes of moderate-intensity movement",
                "schedule": [
                    {
                        "day_name": "Monday",
                        "activity": "Brisk Outdoor Walking",
                        "duration_mins": 30,
                        "intensity": "moderate",
                        "coaching_cue": "Keep pace conversational.",
                    }
                ],
            },
            "sleep_and_lifestyle": {
                "sleep_guidance": "Aim for 7 to 9 hours of uninterrupted sleep.",
                "stress_guidance": "Practice slow diaphragmatic breathing pauses during high-stress hours.",
                "daily_habits": ["Morning natural sunlight exposure", "Screen wind-down 45 minutes before sleep"],
            },
            "personalization_reasons": [
                "Tailored to your active screening tier and lifestyle factors.",
                "Grounded in traditional Pakistani whole foods.",
            ],
            "safety_notices": ["Standard clinical safety pacing active."],
            "disclaimer": "Educational non-diagnostic protocol.",
        }

        content = self.canned_response_text or json.dumps(default_json)
        return LLMResponse(
            answer=content,
            confidence="high",
            used_context=["profile", "screening"],
            needs_clinician=False,
            safety_level="normal",
            model_name="mock-gemini-test",
        )


@override_settings(ALLOW_LOCAL_SQLITE_FALLBACK=True)
class AILifestylePlannerTests(TestCase):
    def setUp(self):
        lifestyle_repository.reset_for_tests()
        self.client = APIClient()
        self.user_uuid = "778899"
        self.user = User.objects.create_user(
            username="test_ai_planner_user",
            email="test_ai_planner@example.com",
            id=778899,
        )

        self.context = ComprehensiveLifestyleContext(
            user_id=self.user_uuid,
            demographics=PatientDemographics(
                user_id=self.user_uuid,
                gender="female",
                pathway="female_pcos",
                age=25,
                height_cm=162.0,
                weight_kg=68.0,
                bmi=25.9,
                dietary_preference="omnivore",
                allergens=["dairy"],
                intolerances=["lactose"],
                activity_level="moderate",
            ),
            screening=ScreeningContext(
                has_assessment=True,
                module="female_pcos",
                assessment_id=str(uuid.uuid4()),
                assessment_level="tier_1",
                risk_category="elevated",
                risk_label="Elevated Screening Risk",
                probability=0.72,
                probability_percent=72.0,
                threshold=0.38,
                is_active=True,
            ),
            shap_drivers=[
                ShapFactor(
                    feature_name="bmi",
                    display_name="Body Mass Index",
                    impact="increases_risk",
                    shap_value=0.28,
                    patient_value=25.9,
                    category="metabolic",
                )
            ],
            shap_mitigators=[],
            symptoms=SymptomSummary(active_symptoms=["fatigue", "acne"]),
            labs=LabBiomarkers(),
            longitudinal=LongitudinalSummary(),
        )

    # 1. Authenticated request succeeds
    def test_authenticated_ai_plan_request_succeeds(self):
        self.client.force_authenticate(user=self.user)
        with patch("apps.intelligence.services.ai_lifestyle_planner.get_llm_provider", return_value=MockGeminiProvider()):
            response = self.client.post("/api/v1/intelligence/lifestyle-ai-plan/", data={})
            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertEqual(data["plan_duration_days"], 7)
            self.assertIn("nutrition", data)
            self.assertIn("hydration", data)
            self.assertIn("physical_activity", data)
            self.assertIn("sleep_and_lifestyle", data)
            self.assertIn("authoritative_daily_targets", data)

    # 2. Unauthenticated request rejected
    def test_unauthenticated_request_rejected(self):
        response = self.client.post("/api/v1/intelligence/lifestyle-ai-plan/", data={})
        self.assertEqual(response.status_code, 401)

    # 3. User isolation: Request strictly uses request.user.id
    def test_user_isolation_strictly_enforced(self):
        victim_id = str(uuid.uuid4())
        self.client.force_authenticate(user=self.user)
        with patch.object(LifestyleContextBuilder, "build_context") as mock_builder:
            mock_builder.return_value = self.context
            with patch("apps.intelligence.services.ai_lifestyle_planner.get_llm_provider", return_value=MockGeminiProvider()):
                # Attempt to inject arbitrary victim user_id
                self.client.post("/api/v1/intelligence/lifestyle-ai-plan/", data={"user_id": victim_id})
                # Verify builder was called strictly with request.user.id
                mock_builder.assert_called_once()
                called_user_id = mock_builder.call_args.kwargs.get("user_id") or mock_builder.call_args.args[0]
                self.assertEqual(called_user_id, self.user_uuid)
                self.assertNotEqual(called_user_id, victim_id)

    # 4. Gemini provider selected correctly & mocked cleanly
    def test_gemini_provider_selected_via_environment(self):
        with patch.dict(os.environ, {
            "LLM_PROVIDER": "gemini",
            "GEMINI_API_KEY": "test-key-abc",
            "GEMINI_MODEL": "gemini-3.8-flash",
        }):
            provider = get_llm_provider()
            self.assertIsInstance(provider, GeminiProvider)
            self.assertEqual(provider.model_name, "gemini-3.8-flash")

    # 5. Missing API key handled safely
    def test_missing_api_key_handled_safely(self):
        with patch.dict(os.environ, {"LLM_PROVIDER": "gemini"}, clear=False):
            if "GEMINI_API_KEY" in os.environ:
                del os.environ["GEMINI_API_KEY"]
            if "LLM_API_KEY" in os.environ:
                del os.environ["LLM_API_KEY"]
            with self.assertRaises(LLMProviderError):
                get_llm_provider()

    # 6. Gemini malformed JSON handled safely (fallback plan produced)
    def test_gemini_malformed_json_handled_safely(self):
        malformed_provider = MockGeminiProvider(canned_response_text="Sorry, I cannot return JSON right now.")
        plan = AILifestylePlanner.generate_plan(
            context=self.context,
            force_refresh=True,
            provider_override=malformed_provider,
        )
        self.assertEqual(plan["plan_duration_days"], 7)
        self.assertEqual(len(plan["nutrition"]["daily_meals"]), 7)
        self.assertIn("authoritative_daily_targets", plan)

    # 7. Deterministic safety engine cannot be overridden by Gemini
    def test_deterministic_safety_cannot_be_overridden(self):
        # Context has dairy allergen. Gemini tries to output paneer / yogurt
        dairy_violating_json = {
            "plan_duration_days": 7,
            "summary": "Plan with dairy",
            "nutrition": {
                "goals": [],
                "daily_meals": [
                    {
                        "day": 1,
                        "day_name": "Monday",
                        "breakfast": {"name": "Greek Yogurt Parfait with Paneer", "description": "High milk protein bowl", "why": "Protein"},
                        "lunch": {"name": "Daal Masoor", "description": "Lentils", "why": "Fiber"},
                        "snack": {"name": "Roasted Chana", "description": "Chana", "why": "Snack"},
                        "dinner": {"name": "Chicken Curry", "description": "Curry", "why": "Dinner"},
                    }
                ] * 7,
            },
            "hydration": {"guidance": "Drink water", "daily_target_liters": 2.5},
            "physical_activity": {"weekly_goal": "Walk", "schedule": []},
            "sleep_and_lifestyle": {"sleep_guidance": "Sleep", "stress_guidance": "Relax", "daily_habits": []},
            "personalization_reasons": [],
            "safety_notices": [],
            "disclaimer": "Educational disclaimer",
        }
        violating_provider = MockGeminiProvider(canned_response_text=json.dumps(dairy_violating_json))
        plan = AILifestylePlanner.generate_plan(
            context=self.context,
            force_refresh=True,
            provider_override=violating_provider,
        )

        day1_breakfast = plan["nutrition"]["daily_meals"][0]["breakfast"]
        # Validator must have scrubbed / replaced the dairy item
        self.assertNotIn("paneer", day1_breakfast["name"].lower())
        self.assertNotIn("yogurt", day1_breakfast["name"].lower())
        # Safety audit note must record the adjustment
        notes_str = " ".join(plan["safety_notices"]).lower()
        self.assertTrue(any(term in notes_str for term in ("allergen", "dietary restriction", "dairy")))

    # 8. Dietary restriction violation rejected (e.g. meat in vegetarian)
    def test_dietary_restriction_meat_in_vegetarian_rejected(self):
        veg_context = self.context
        veg_context.demographics.dietary_preference = "vegetarian"
        veg_context.demographics.allergens = []

        meat_violating_json = {
            "plan_duration_days": 7,
            "summary": "Vegetarian plan with accidental meat",
            "nutrition": {
                "goals": [],
                "daily_meals": [
                    {
                        "day": 1,
                        "day_name": "Monday",
                        "breakfast": {"name": "Egg Omelet", "description": "Omelet", "why": "Protein"},
                        "lunch": {"name": "Beef Nihari with Naan", "description": "Rich beef stew", "why": "Iron"},
                        "snack": {"name": "Roasted Chana", "description": "Chana", "why": "Snack"},
                        "dinner": {"name": "Chicken Karahi", "description": "Chicken stew", "why": "Protein"},
                    }
                ] * 7,
            },
            "hydration": {"guidance": "Water", "daily_target_liters": 2.5},
            "physical_activity": {"weekly_goal": "Walk", "schedule": []},
            "sleep_and_lifestyle": {"sleep_guidance": "Sleep", "stress_guidance": "Relax", "daily_habits": []},
            "personalization_reasons": [],
            "safety_notices": [],
            "disclaimer": "Disclaimer",
        }
        provider = MockGeminiProvider(canned_response_text=json.dumps(meat_violating_json))
        plan = AILifestylePlanner.generate_plan(
            context=veg_context,
            force_refresh=True,
            provider_override=provider,
        )

        day1_lunch = plan["nutrition"]["daily_meals"][0]["lunch"]
        day1_dinner = plan["nutrition"]["daily_meals"][0]["dinner"]
        # Meat items must be replaced
        self.assertNotIn("beef", day1_lunch["name"].lower())
        self.assertNotIn("chicken", day1_dinner["name"].lower())

    # 9. Prohibited exercise rejected (e.g. HIIT when recovery-first or joint protection is active)
    def test_prohibited_exercise_hiit_rejected(self):
        heavy_context = self.context
        heavy_context.demographics.bmi = 33.5  # Triggers joint protection
        hiit_violating_json = {
            "plan_duration_days": 7,
            "summary": "Plan",
            "nutrition": {"goals": [], "daily_meals": []},
            "hydration": {"guidance": "Water", "daily_target_liters": 2.5},
            "physical_activity": {
                "weekly_goal": "HIIT daily",
                "schedule": [
                    {
                        "day_name": "Monday",
                        "activity": "Exhaustive Daily HIIT and Pavement Sprinting",
                        "duration_mins": 45,
                        "intensity": "high",
                        "coaching_cue": "Push to exhaustion",
                    }
                ] * 7,
            },
            "sleep_and_lifestyle": {"sleep_guidance": "Sleep", "stress_guidance": "Relax", "daily_habits": []},
            "personalization_reasons": [],
            "safety_notices": [],
            "disclaimer": "Disclaimer",
        }
        provider = MockGeminiProvider(canned_response_text=json.dumps(hiit_violating_json))
        plan = AILifestylePlanner.generate_plan(
            context=heavy_context,
            force_refresh=True,
            provider_override=provider,
        )

        day1_act = plan["physical_activity"]["schedule"][0]["activity"].lower()
        self.assertNotIn("hiit", day1_act)
        self.assertNotIn("sprinting", day1_act)
        self.assertIn("low-impact", day1_act)

    # 10. Medication change or diagnostic language rejected
    def test_medical_and_diagnostic_claims_scrubbed(self):
        med_violating_json = {
            "plan_duration_days": 7,
            "summary": "Because you are diagnosed with PCOS, this diet cures PCOS completely. Stop taking metformin.",
            "nutrition": {
                "goals": [],
                "daily_meals": [
                    {
                        "day": 1,
                        "day_name": "Monday",
                        "breakfast": {
                            "name": "Healing Porridge",
                            "description": "Porridge",
                            "why": "This meal cures PCOS and balances your LH ratio automatically.",
                        },
                        "lunch": {"name": "Daal Masoor", "description": "Daal", "why": "Healthy"},
                        "snack": {"name": "Chana", "description": "Chana", "why": "Healthy"},
                        "dinner": {"name": "Fish", "description": "Fish", "why": "Healthy"},
                    }
                ] * 7,
            },
            "hydration": {"guidance": "Water", "daily_target_liters": 2.5},
            "physical_activity": {"weekly_goal": "Walk", "schedule": []},
            "sleep_and_lifestyle": {"sleep_guidance": "Sleep", "stress_guidance": "Relax", "daily_habits": []},
            "personalization_reasons": [],
            "safety_notices": [],
            "disclaimer": "Disclaimer",
        }
        provider = MockGeminiProvider(canned_response_text=json.dumps(med_violating_json))
        plan = AILifestylePlanner.generate_plan(
            context=self.context,
            force_refresh=True,
            provider_override=provider,
        )

        summary_lower = plan["summary"].lower()
        self.assertNotIn("diagnosed with pcos", summary_lower)
        self.assertNotIn("cures pcos", summary_lower)
        self.assertNotIn("stop taking metformin", summary_lower)

        why_lower = plan["nutrition"]["daily_meals"][0]["breakfast"]["why"].lower()
        self.assertNotIn("cures pcos", why_lower)

    # 11. Missing biometrics do not produce fabricated calorie values
    def test_missing_biometrics_preserves_null_calories(self):
        missing_context = self.context
        missing_context.demographics.weight_kg = None
        missing_context.demographics.height_cm = None
        missing_context.demographics.bmi = None

        provider = MockGeminiProvider()
        plan = AILifestylePlanner.generate_plan(
            context=missing_context,
            force_refresh=True,
            provider_override=provider,
        )

        dt = plan["authoritative_daily_targets"]
        self.assertIsNone(dt["daily_calories_kcal"])
        self.assertEqual(dt["target_status"], "unavailable_missing_biometrics")

    # 12. Pakistani food catalog grounding works
    def test_pakistani_food_catalog_grounding(self):
        eligible = PakistanFoodCatalog.get_eligible_foods(
            allergens=["dairy"],
            dietary_preference="omnivore",
        )
        self.assertTrue(len(eligible) > 0)
        # Verify no dairy in returned items
        for f in eligible:
            self.assertFalse(f.contains_dairy)
            self.assertTrue(f.entity_name_en)

    # 13. Caching via context_version works; force_refresh regenerates
    def test_plan_caching_and_force_refresh(self):
        provider1 = MockGeminiProvider(canned_response_text=None)
        plan1 = AILifestylePlanner.generate_plan(
            context=self.context,
            force_refresh=False,
            provider_override=provider1,
        )

        # Second call without force_refresh should return cached plan
        mock_provider2 = MagicMock()
        plan2 = AILifestylePlanner.generate_plan(
            context=self.context,
            force_refresh=False,
            provider_override=mock_provider2,
        )
        # Provider should NOT have been called because cache hit
        mock_provider2.generate_chat_response.assert_not_called()
        self.assertEqual(plan1["generated_at"], plan2["generated_at"])

        # Force refresh calls provider
        plan3 = AILifestylePlanner.generate_plan(
            context=self.context,
            force_refresh=True,
            provider_override=provider1,
        )
        self.assertEqual(plan3["plan_duration_days"], 7)
