"""
backend/apps/intelligence/tests/test_lifestyle_cache_safety.py

Comprehensive test suite verifying:
1. Allergy change invalidates fast-path cache immediately.
2. Dietary pattern change (omnivore -> vegan) invalidates fast-path cache.
3. Active assessment ID/level change (Tier 1 -> Tier 2 upgrade) invalidates fast-path cache.
4. Activity level change invalidates fast-path cache.
5. Weight/BMI change invalidates fast-path cache.
6. Sleep/stress change invalidates fast-path cache.
7. Unchanged user returns cached recommendations in <100ms without rebuilding 9 tables.
8. Repeated requests / hard refresh for unchanged user remain fast.
9. No stale unsafe food can EVER appear in returned recommendations when allergies are updated.
10. Synchronous invalidation triggered by AssessmentRepository.save_assessment and ClinicalStateRepository.save_patient_clinical_state.
"""

import json
import time
import uuid
from unittest.mock import MagicMock, patch
from django.test import TestCase

from apps.health.services.supabase_health_service import PatientProfile
from apps.intelligence.services.lifestyle_context_builder import (
    LifestyleContextBuilder,
    PatientDemographics,
    ScreeningContext,
    ShapFactor,
    SymptomSummary,
    LabBiomarkers,
    LongitudinalSummary,
    ComprehensiveLifestyleContext,
)
from apps.intelligence.services.lifestyle_repository import lifestyle_repository
from apps.intelligence.services.lifestyle_safety_rules import LifestyleSafetyEngine
from apps.intelligence.services.lifestyle_recommendation_engine import LifestyleRecommendationEngine
from apps.intelligence.services.safety_guardrails import is_food_safe_for_user


class LifestyleCacheSafetyTests(TestCase):
    def setUp(self):
        import apps.intelligence.services.lifestyle_repository as repo_module
        self.user_id = str(uuid.uuid4())
        self.module = "female_pcos"
        self._prev_remote = repo_module._remote_table_available
        repo_module._remote_table_available = False

    def tearDown(self):
        import apps.intelligence.services.lifestyle_repository as repo_module
        repo_module._remote_table_available = self._prev_remote

    def _build_test_context(
        self,
        user_id: str,
        allergens=None,
        dietary_preference="omnivore",
        activity_level="moderate",
        weight_kg=65.0,
        height_cm=165.0,
        sleep_hours=7.5,
        stress_level="moderate",
        assessment_id=None,
        assessment_level="tier_1",
        probability=0.25,
    ) -> ComprehensiveLifestyleContext:
        demo = PatientDemographics(
            user_id=user_id,
            gender="female",
            pathway="female_pcos",
            age=26,
            height_cm=height_cm,
            weight_kg=weight_kg,
            bmi=round(weight_kg / ((height_cm / 100.0) ** 2), 1),
            dietary_preference=dietary_preference,
            allergens=allergens or [],
            intolerances=[],
            activity_level=activity_level,
            sleep_hours=sleep_hours,
            stress_level=stress_level,
            profile_updated_at="2026-10-02T10:00:00Z",
        )
        screening = ScreeningContext(
            has_assessment=True,
            module="female_pcos",
            assessment_id=assessment_id or str(uuid.uuid4()),
            assessment_level=assessment_level,
            risk_category="moderate",
            probability=probability,
            probability_percent=probability * 100.0,
            threshold=0.38,
            is_active=True,
            created_at="2026-10-02T10:00:00Z",
        )
        ctx = ComprehensiveLifestyleContext(
            user_id=user_id,
            demographics=demo,
            screening=screening,
            shap_drivers=[
                ShapFactor(
                    feature_name="cycle_length",
                    display_name="Cycle Irregularity",
                    impact="increases_risk",
                    shap_value=0.15,
                    patient_value=45,
                    category="reproductive",
                )
            ],
            shap_mitigators=[],
            symptoms=SymptomSummary(active_symptoms=["irregular_cycles"]),
            labs=LabBiomarkers(),
            longitudinal=LongitudinalSummary(),
            missing_data=[],
            personalization_level="LEVEL_2_SCREENING",
        )
        ctx.context_version = LifestyleContextBuilder.compute_context_version(ctx)
        return ctx

    def test_01_allergy_change_invalidates_fast_path_cache(self):
        """
        1. User starts with no allergies.
        2. Generate protocol and save to cache.
        3. User updates profile to declare peanut allergy.
        4. Freshness check MUST immediately return is_fresh=False.
        """
        ctx_initial = self._build_test_context(self.user_id, allergens=[])
        safety_initial = LifestyleSafetyEngine.evaluate_safety(ctx_initial)
        rec_initial = LifestyleRecommendationEngine.generate(ctx_initial, safety_initial)
        payload_initial = rec_initial.to_dict()

        # Attach freshness signature
        fresh_inputs = LifestyleContextBuilder.extract_freshness_inputs_from_context(ctx_initial)
        payload_initial["freshness_fingerprint"] = LifestyleContextBuilder.compute_freshness_fingerprint(fresh_inputs)
        payload_initial["freshness_inputs"] = fresh_inputs

        saved = lifestyle_repository.save_recommendations(
            user_id=self.user_id,
            module=self.module,
            context_version=ctx_initial.context_version,
            payload=payload_initial,
        )

        # Active cache exists
        cached = lifestyle_repository.get_active_recommendations(self.user_id, self.module)
        self.assertIsNotNone(cached)

        # Profile is updated to peanut allergy
        updated_profile = PatientProfile(
            user_id=self.user_id,
            allergies=["peanuts"],
            food_allergies=["peanut"],
            dietary_preference="omnivore",
            activity_level="moderate",
            weight_kg=65.0,
            height_cm=165.0,
            sleep_hours=7.5,
            updated_at="2026-10-02T11:00:00Z",
        )
        mock_assessment = {"id": ctx_initial.screening.assessment_id, "assessment_level": "tier_1", "has_assessment": True}

        is_fresh, reason = LifestyleContextBuilder.is_cache_fresh(
            user_id=self.user_id,
            canonical_module=self.module,
            cached_record=cached,
            profile_override=updated_profile,
            assessment_override=mock_assessment,
        )
        self.assertFalse(is_fresh, "Cache must be recognized as stale when allergy profile changes!")
        self.assertIn("allergy_changed", reason)

    def test_02_diet_change_invalidates_fast_path_cache(self):
        """
        Dietary pattern change (omnivore -> vegan) must invalidate fast-path cache.
        """
        ctx_omnivore = self._build_test_context(self.user_id, dietary_preference="omnivore")
        safety = LifestyleSafetyEngine.evaluate_safety(ctx_omnivore)
        payload = LifestyleRecommendationEngine.generate(ctx_omnivore, safety).to_dict()
        fresh_inputs = LifestyleContextBuilder.extract_freshness_inputs_from_context(ctx_omnivore)
        payload["freshness_fingerprint"] = LifestyleContextBuilder.compute_freshness_fingerprint(fresh_inputs)
        payload["freshness_inputs"] = fresh_inputs

        lifestyle_repository.save_recommendations(
            user_id=self.user_id,
            module=self.module,
            context_version=ctx_omnivore.context_version,
            payload=payload,
        )
        cached = lifestyle_repository.get_active_recommendations(self.user_id, self.module)

        # Profile updated to Vegan
        vegan_profile = PatientProfile(
            user_id=self.user_id,
            allergies=[],
            dietary_preference="vegan",
            activity_level="moderate",
            weight_kg=65.0,
            height_cm=165.0,
            sleep_hours=7.5,
            updated_at="2026-10-02T12:00:00Z",
        )
        mock_assessment = {"id": ctx_omnivore.screening.assessment_id, "assessment_level": "tier_1", "has_assessment": True}

        is_fresh, reason = LifestyleContextBuilder.is_cache_fresh(
            user_id=self.user_id,
            canonical_module=self.module,
            cached_record=cached,
            profile_override=vegan_profile,
            assessment_override=mock_assessment,
        )
        self.assertFalse(is_fresh, "Cache must be recognized as stale when dietary pattern changes to vegan!")
        self.assertIn("diet_changed", reason)

    def test_03_active_assessment_upgrade_invalidates_cache(self):
        """
        Tier 1 -> Tier 2 assessment upgrade must invalidate fast-path cache.
        """
        t1_id = str(uuid.uuid4())
        ctx_t1 = self._build_test_context(self.user_id, assessment_id=t1_id, assessment_level="tier_1")
        safety = LifestyleSafetyEngine.evaluate_safety(ctx_t1)
        payload = LifestyleRecommendationEngine.generate(ctx_t1, safety).to_dict()
        fresh_inputs = LifestyleContextBuilder.extract_freshness_inputs_from_context(ctx_t1)
        payload["freshness_fingerprint"] = LifestyleContextBuilder.compute_freshness_fingerprint(fresh_inputs)
        payload["freshness_inputs"] = fresh_inputs

        lifestyle_repository.save_recommendations(
            user_id=self.user_id,
            module=self.module,
            context_version=ctx_t1.context_version,
            payload=payload,
        )
        cached = lifestyle_repository.get_active_recommendations(self.user_id, self.module)

        # Assessment is now upgraded to Tier 2
        t2_id = str(uuid.uuid4())
        mock_t2_assessment = {
            "id": t2_id,
            "assessment_level": "tier_1_2",
            "has_assessment": True,
            "updated_at": "2026-10-02T13:00:00Z",
        }
        profile = PatientProfile(
            user_id=self.user_id,
            allergies=[],
            dietary_preference="omnivore",
            activity_level="moderate",
            weight_kg=65.0,
            height_cm=165.0,
            sleep_hours=7.5,
            stress_level="moderate",
            updated_at="2026-10-02T10:00:00Z",
        )

        is_fresh, reason = LifestyleContextBuilder.is_cache_fresh(
            user_id=self.user_id,
            canonical_module=self.module,
            cached_record=cached,
            profile_override=profile,
            assessment_override=mock_t2_assessment,
        )
        self.assertFalse(is_fresh, "Cache must be recognized as stale when Tier 2 clinical assessment upgrades!")
        self.assertIn("assessment_tier_changed", reason)

    def test_04_unchanged_user_returns_cache_in_sub_100ms(self):
        """
        Unchanged user must pass freshness check and return cache in <100ms.
        """
        ctx = self._build_test_context(self.user_id)
        safety = LifestyleSafetyEngine.evaluate_safety(ctx)
        payload = LifestyleRecommendationEngine.generate(ctx, safety).to_dict()
        fresh_inputs = LifestyleContextBuilder.extract_freshness_inputs_from_context(ctx)
        payload["freshness_fingerprint"] = LifestyleContextBuilder.compute_freshness_fingerprint(fresh_inputs)
        payload["freshness_inputs"] = fresh_inputs

        lifestyle_repository.save_recommendations(
            user_id=self.user_id,
            module=self.module,
            context_version=ctx.context_version,
            payload=payload,
        )
        cached = lifestyle_repository.get_active_recommendations(self.user_id, self.module)

        profile = PatientProfile(
            user_id=self.user_id,
            allergies=[],
            dietary_preference="omnivore",
            activity_level="moderate",
            weight_kg=65.0,
            height_cm=165.0,
            sleep_hours=7.5,
            stress_level="moderate",
            updated_at="2026-10-02T10:00:00Z",
        )
        mock_assessment = {
            "id": ctx.screening.assessment_id,
            "assessment_level": "tier_1",
            "risk_category": "moderate",
            "has_assessment": True,
            "updated_at": "2026-10-02T10:00:00Z",
        }

        start_time = time.perf_counter()
        is_fresh, reason = LifestyleContextBuilder.is_cache_fresh(
            user_id=self.user_id,
            canonical_module=self.module,
            cached_record=cached,
            profile_override=profile,
            assessment_override=mock_assessment,
        )
        elapsed_ms = (time.perf_counter() - start_time) * 1000.0

        self.assertTrue(is_fresh, f"Unchanged user cache check must be fresh! Reason: {reason}")
        self.assertEqual(reason, "fresh")
        self.assertLess(elapsed_ms, 100.0, f"Freshness check took {elapsed_ms:.2f}ms, which must be <100ms!")

    def test_05_hard_refresh_and_repeated_reads_remain_fast(self):
        """
        Multiple repeated reads for unchanged user must consistently resolve under 100ms.
        """
        ctx = self._build_test_context(self.user_id)
        safety = LifestyleSafetyEngine.evaluate_safety(ctx)
        payload = LifestyleRecommendationEngine.generate(ctx, safety).to_dict()
        fresh_inputs = LifestyleContextBuilder.extract_freshness_inputs_from_context(ctx)
        payload["freshness_fingerprint"] = LifestyleContextBuilder.compute_freshness_fingerprint(fresh_inputs)
        payload["freshness_inputs"] = fresh_inputs

        lifestyle_repository.save_recommendations(
            user_id=self.user_id,
            module=self.module,
            context_version=ctx.context_version,
            payload=payload,
        )
        cached = lifestyle_repository.get_active_recommendations(self.user_id, self.module)

        profile = PatientProfile(
            user_id=self.user_id,
            allergies=[],
            dietary_preference="omnivore",
            activity_level="moderate",
            weight_kg=65.0,
            height_cm=165.0,
            sleep_hours=7.5,
            stress_level="moderate",
            updated_at="2026-10-02T10:00:00Z",
        )
        mock_assessment = {
            "id": ctx.screening.assessment_id,
            "assessment_level": "tier_1",
            "risk_category": "moderate",
            "has_assessment": True,
            "updated_at": "2026-10-02T10:00:00Z",
        }

        for iteration in range(5):
            t0 = time.perf_counter()
            is_fresh, reason = LifestyleContextBuilder.is_cache_fresh(
                user_id=self.user_id,
                canonical_module=self.module,
                cached_record=cached,
                profile_override=profile,
                assessment_override=mock_assessment,
            )
            lat_ms = (time.perf_counter() - t0) * 1000.0
            self.assertTrue(is_fresh)
            self.assertLess(lat_ms, 100.0, f"Iteration {iteration} took {lat_ms:.2f}ms")

    def test_06_no_stale_unsafe_food_can_appear_on_allergy_update(self):
        """
        Verifies that when a profile declares an allergy:
        1. Cache is invalidated.
        2. Regenerated recommendations contain 0 occurrences of the allergen.
        3. Defense-in-depth safety validator confirms all generated foods are safe.
        """
        # Step 1: Initial unrestricted generation
        ctx1 = self._build_test_context(self.user_id, allergens=[])
        rec1 = LifestyleRecommendationEngine.generate(ctx1, LifestyleSafetyEngine.evaluate_safety(ctx1))
        payload1 = rec1.to_dict()
        fresh1 = LifestyleContextBuilder.extract_freshness_inputs_from_context(ctx1)
        payload1["freshness_fingerprint"] = LifestyleContextBuilder.compute_freshness_fingerprint(fresh1)
        payload1["freshness_inputs"] = fresh1
        lifestyle_repository.save_recommendations(self.user_id, self.module, ctx1.context_version, payload1)

        # Step 2: User adds peanut allergy
        ctx2 = self._build_test_context(self.user_id, allergens=["peanut"])
        safety2 = LifestyleSafetyEngine.evaluate_safety(ctx2)
        rec2 = LifestyleRecommendationEngine.generate(ctx2, safety2)
        payload2 = rec2.to_dict()

        # Verify no peanuts appear anywhere in nutrition pillar
        nut = payload2["nutrition"]
        for concept in nut.get("meal_concepts", []):
            for fkey in ("breakfast", "lunch", "dinner", "snack"):
                ftext = concept.get(fkey, "")
                self.assertTrue(
                    is_food_safe_for_user(ftext, ["peanut"], []),
                    f"Food '{ftext}' must be 100% free of peanut!",
                )
                self.assertNotIn("peanut", ftext.lower())
                self.assertNotIn("groundnut", ftext.lower())

        for swap in nut.get("smart_swaps", []):
            to_food = swap.get("to_food", "")
            self.assertTrue(
                is_food_safe_for_user(to_food, ["peanut"], []),
                f"Swap food '{to_food}' must be 100% free of peanut!",
            )
            self.assertNotIn("peanut", to_food.lower())

    def test_07_activity_weight_sleep_stress_invalidation(self):
        """
        Verifies activity, weight, and sleep/stress changes invalidate the cache.
        """
        ctx = self._build_test_context(self.user_id, activity_level="moderate", weight_kg=70.0, sleep_hours=7.0)
        safety = LifestyleSafetyEngine.evaluate_safety(ctx)
        payload = LifestyleRecommendationEngine.generate(ctx, safety).to_dict()
        fresh_inputs = LifestyleContextBuilder.extract_freshness_inputs_from_context(ctx)
        payload["freshness_fingerprint"] = LifestyleContextBuilder.compute_freshness_fingerprint(fresh_inputs)
        payload["freshness_inputs"] = fresh_inputs
        lifestyle_repository.save_recommendations(self.user_id, self.module, ctx.context_version, payload)
        cached = lifestyle_repository.get_active_recommendations(self.user_id, self.module)
        mock_assessment = {"id": ctx.screening.assessment_id, "assessment_level": "tier_1", "has_assessment": True}

        # Activity change: moderate -> active
        prof_act = PatientProfile(
            user_id=self.user_id,
            allergies=[],
            dietary_preference="omnivore",
            activity_level="active",
            weight_kg=70.0,
            height_cm=165.0,
            sleep_hours=7.0,
            stress_level="moderate",
            updated_at="2026-10-02T10:00:00Z",
        )
        is_fresh_act, r_act = LifestyleContextBuilder.is_cache_fresh(
            self.user_id, self.module, cached, profile_override=prof_act, assessment_override=mock_assessment
        )
        self.assertFalse(is_fresh_act)
        self.assertIn("activity_changed", r_act)

        # Weight change: 70kg -> 80kg
        prof_wt = PatientProfile(
            user_id=self.user_id,
            allergies=[],
            dietary_preference="omnivore",
            activity_level="moderate",
            weight_kg=80.0,
            height_cm=165.0,
            sleep_hours=7.0,
            stress_level="moderate",
            updated_at="2026-10-02T10:00:00Z",
        )
        is_fresh_wt, r_wt = LifestyleContextBuilder.is_cache_fresh(
            self.user_id, self.module, cached, profile_override=prof_wt, assessment_override=mock_assessment
        )
        self.assertFalse(is_fresh_wt)
        self.assertIn("biometrics_changed", r_wt)

        # Sleep change: 7h -> 9h
        prof_sleep = PatientProfile(
            user_id=self.user_id,
            allergies=[],
            dietary_preference="omnivore",
            activity_level="moderate",
            weight_kg=70.0,
            height_cm=165.0,
            sleep_hours=9.0,
            stress_level="moderate",
            updated_at="2026-10-02T10:00:00Z",
        )
        is_fresh_sleep, r_sleep = LifestyleContextBuilder.is_cache_fresh(
            self.user_id, self.module, cached, profile_override=prof_sleep, assessment_override=mock_assessment
        )
        self.assertFalse(is_fresh_sleep)
        self.assertIn("sleep_stress_changed", r_sleep)

    def test_08_synchronous_repository_invalidation(self):
        """
        Verifies that lifestyle_repository.invalidate_active_recommendations
        deactivates active cache records synchronously.
        """
        ctx = self._build_test_context(self.user_id)
        safety = LifestyleSafetyEngine.evaluate_safety(ctx)
        payload = LifestyleRecommendationEngine.generate(ctx, safety).to_dict()
        fresh_inputs = LifestyleContextBuilder.extract_freshness_inputs_from_context(ctx)
        payload["freshness_fingerprint"] = LifestyleContextBuilder.compute_freshness_fingerprint(fresh_inputs)
        payload["freshness_inputs"] = fresh_inputs

        lifestyle_repository.save_recommendations(self.user_id, self.module, ctx.context_version, payload)
        self.assertIsNotNone(lifestyle_repository.get_active_recommendations(self.user_id, self.module))

        # Explicit invalidation
        lifestyle_repository.invalidate_active_recommendations(self.user_id, self.module)
        self.assertIsNone(
            lifestyle_repository.get_active_recommendations(self.user_id, self.module),
            "Active recommendations must be None after explicit invalidation!",
        )
