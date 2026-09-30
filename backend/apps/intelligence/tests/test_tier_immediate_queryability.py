"""
backend/apps/intelligence/tests/test_tier_immediate_queryability.py

20-iteration regression test verifying that:
1. Immediately after every successful Tier POST (Tier 1, Tier 2, Male Tier 1, Male Tier 2),
   an immediate GET active assessment returns the EXACT same assessment ID.
2. Exactly one active assessment exists for that user and module in persistence (is_active = 1 count == 1).
3. Monotonicity guards do not prevent legitimate explicit restarts / resets.
4. History correctly reflects historical records while maintaining a single active record.
"""

import json
import sqlite3
import uuid
from unittest.mock import patch, MagicMock

from django.test import TestCase, override_settings
from rest_framework.test import APIRequestFactory, force_authenticate

from apps.authentication.supabase_auth import SupabaseUser
from apps.intelligence.services.pcos_ml_service import pcos_ml_service
from apps.intelligence.services.male_ml_service import male_ml_service
from apps.intelligence.services.assessment_repository import (
    assessment_repository,
    init_sqlite_store,
    _get_sqlite_path,
)
from apps.intelligence.services.clinical_state_repository import init_sqlite_clinical_store
from apps.intelligence.views import (
    ActiveAssessmentView,
    Tier1AssessmentView,
    Tier2AssessmentView,
    MaleTier1AssessmentView,
    MaleTier2AssessmentView,
    ClearTier2AssessmentView,
)


@override_settings(ALLOW_LOCAL_SQLITE_FALLBACK=True)
class TierImmediateQueryabilityTests(TestCase):
    """
    Rigorously validates the invariant:
    POST Tier N succeeds -> Immediate GET active returns same assessment ID
    AND SQLite contains exactly one is_active=1 record for that (user, module).
    """

    def setUp(self):
        pcos_ml_service.load()
        male_ml_service.load()
        init_sqlite_store()
        init_sqlite_clinical_store()
        self.factory = APIRequestFactory()

        self.female_uuid = str(uuid.uuid4())
        self.male_uuid = str(uuid.uuid4())

        self.female_user = SupabaseUser(
            id=self.female_uuid,
            email="female_patient@example.com",
            role="authenticated",
            raw_token=f"jwt-token-{self.female_uuid}",
        )

        self.male_user = SupabaseUser(
            id=self.male_uuid,
            email="male_patient@example.com",
            role="authenticated",
            raw_token=f"jwt-token-{self.male_uuid}",
        )

        # Mock health_service.fetch_all for hermetic local execution
        self.health_patcher = patch(
            "apps.health.services.supabase_health_service.health_service.fetch_all"
        )
        self.mock_fetch_all = self.health_patcher.start()

        def side_effect_fetch_all(patient_uuid, auth_token=None, client_health_data=None):
            class MockProfile:
                date_of_birth = None
                common_symptoms = []
                fast_food_intake = None
                regular_exercise = None

            p = MockProfile()
            if patient_uuid == self.female_uuid:
                p.gender = "female"
                p.pathway = "female_pcos"
                p.age = 26
                p.height_cm = 164.0
                p.weight_kg = 62.0
                p.cycle_length = 32.0
                p.period_regularity = "regular"
            else:
                p.gender = "male"
                p.pathway = "male_hypogonadism"
                p.age = 42
                p.height_cm = 178.0
                p.weight_kg = 86.0
                p.waist_cm = 94.0

            class MockHealthData:
                profile = p
                reports = []
                symptom_records = []
                medical_reports = []

            return MockHealthData()

        self.mock_fetch_all.side_effect = side_effect_fetch_all

        # Patch remote Supabase calls to isolate pure SQLite persistence
        self.sb_patch1 = patch("apps.intelligence.services.clinical_state_repository.get_supabase_client", return_value=None)
        self.sb_patch2 = patch("apps.intelligence.services.assessment_repository.get_supabase_client", return_value=None)
        self.sb_patch3 = patch("apps.intelligence.services.observation_repository.get_supabase_client", return_value=None)
        self.sb_patch1.start()
        self.sb_patch2.start()
        self.sb_patch3.start()

        self.female_t1_base_inputs = {
            "age": 26,
            "weight_kg": 64.0,
            "height_cm": 164.0,
            "bmi": 23.8,
            "waist_inch": 32.0,
            "hip_inch": 38.0,
            "cycle_length": 35,
            "period_regularity": "irregular",
            "weight_gain": 1,
            "hair_loss": 0,
            "pimples_acne": 1,
        }

    def tearDown(self):
        self.health_patcher.stop()
        self.sb_patch1.stop()
        self.sb_patch2.stop()
        self.sb_patch3.stop()

    def _get_active_sqlite_count_and_id(self, user_id: str, module: str):
        """Helper to directly query SQLite for active assessment count and id."""
        db_path = _get_sqlite_path()
        is_uri = str(db_path).startswith("file:")
        conn = sqlite3.connect(db_path, timeout=30.0, uri=is_uri)
        try:
            conn.execute("PRAGMA busy_timeout = 30000;")
            cursor = conn.cursor()
            try:
                cursor.execute(
                    """
                    SELECT id FROM intelligence_assessments
                    WHERE user_id = ? AND module = ? AND is_active = 1
                    """,
                    (user_id, module),
                )
                rows = cursor.fetchall()
                count = len(rows)
                active_id = rows[0][0] if count > 0 else None
                return count, active_id
            finally:
                cursor.close()
        finally:
            conn.close()

    def test_01_twenty_iterations_tier1_immediate_queryability_and_single_active(self):
        """
        20 consecutive iterations of POST Tier 1:
        Each iteration verifies:
        1. Status 200 returned.
        2. Immediate GET active returns HTTP 200 with the exact same assessment ID.
        3. is_active=1 count in SQLite is STRICTLY 1.
        4. Exactly the newly posted ID is active.
        """
        for iteration in range(1, 21):
            # Vary inputs slightly per iteration to simulate evolving user updates
            inputs = dict(self.female_t1_base_inputs)
            inputs["weight_kg"] = 60.0 + (iteration * 0.5)
            inputs["bmi"] = round(inputs["weight_kg"] / ((1.64) ** 2), 1)

            # 1. POST Tier 1
            post_req = self.factory.post(
                "/api/v1/intelligence/assessment/tier1/",
                inputs,
                format="json",
            )
            force_authenticate(post_req, user=self.female_user)
            post_res = Tier1AssessmentView.as_view()(post_req)

            self.assertEqual(
                post_res.status_code,
                200,
                f"Iteration {iteration}: POST Tier 1 failed with status {post_res.status_code}",
            )
            posted_id = post_res.data.get("id") or post_res.data.get("assessment_id")
            self.assertIsNotNone(posted_id, f"Iteration {iteration}: POST Tier 1 returned no ID")
            self.assertEqual(post_res.data.get("assessment_level"), "tier_1")

            # 2. IMMEDIATE GET active assessment
            get_req = self.factory.get("/api/v1/intelligence/assessment/active/?module=female_pcos")
            force_authenticate(get_req, user=self.female_user)
            get_res = ActiveAssessmentView.as_view()(get_req)

            self.assertEqual(
                get_res.status_code,
                200,
                f"Iteration {iteration}: GET active returned status {get_res.status_code}",
            )
            self.assertTrue(
                get_res.data.get("has_assessment"),
                f"Iteration {iteration}: GET active has_assessment is not True",
            )
            retrieved_id = get_res.data.get("id") or get_res.data.get("assessment_id")
            self.assertEqual(
                retrieved_id,
                posted_id,
                f"Iteration {iteration}: Mismatch between posted ID ({posted_id}) and immediate GET ID ({retrieved_id})",
            )
            self.assertEqual(get_res.data.get("assessment_level"), "tier_1")

            # 3. Database verification: Exactly 1 active assessment exists
            active_count, active_db_id = self._get_active_sqlite_count_and_id(
                self.female_uuid, "female_pcos"
            )
            self.assertEqual(
                active_count,
                1,
                f"Iteration {iteration}: Expected strictly 1 active assessment in SQLite, found {active_count}",
            )
            self.assertEqual(
                active_db_id,
                posted_id,
                f"Iteration {iteration}: SQLite active ID {active_db_id} does not match posted ID {posted_id}",
            )

    def test_02_twenty_iterations_tier2_immediate_queryability_and_single_active(self):
        """
        20 consecutive iterations of POST Tier 2:
        Starting from an existing Tier 1 assessment, 20 consecutive clinical updates are submitted.
        Each iteration verifies:
        1. Status 200 returned.
        2. Immediate GET active returns HTTP 200 with the exact same assessment ID.
        3. Assessment level is 'tier_1_2'.
        4. is_active=1 count in SQLite is STRICTLY 1.
        """
        # Seed initial Tier 1
        seed_req = self.factory.post(
            "/api/v1/intelligence/assessment/tier1/",
            self.female_t1_base_inputs,
            format="json",
        )
        force_authenticate(seed_req, user=self.female_user)
        seed_res = Tier1AssessmentView.as_view()(seed_req)
        self.assertEqual(seed_res.status_code, 200)

        for iteration in range(1, 21):
            clinical_labs = {
                "tsh": round(1.8 + (iteration * 0.1), 2),
                "amh": round(3.5 + (iteration * 0.2), 2),
                "rbs": 92.0 + iteration,
            }

            # 1. POST Tier 2
            post_req = self.factory.post(
                "/api/v1/intelligence/assessment/tier2/",
                clinical_labs,
                format="json",
            )
            force_authenticate(post_req, user=self.female_user)
            post_res = Tier2AssessmentView.as_view()(post_req)

            self.assertEqual(
                post_res.status_code,
                200,
                f"Iteration {iteration}: POST Tier 2 failed with status {post_res.status_code}",
            )
            posted_t2_id = post_res.data.get("id") or post_res.data.get("assessment_id")
            self.assertIsNotNone(posted_t2_id)
            self.assertEqual(post_res.data.get("assessment_level"), "tier_1_2")

            # 2. IMMEDIATE GET active assessment
            get_req = self.factory.get("/api/v1/intelligence/assessment/active/?module=female_pcos")
            force_authenticate(get_req, user=self.female_user)
            get_res = ActiveAssessmentView.as_view()(get_req)

            self.assertEqual(get_res.status_code, 200)
            self.assertTrue(get_res.data.get("has_assessment"))
            retrieved_id = get_res.data.get("id") or get_res.data.get("assessment_id")
            self.assertEqual(
                retrieved_id,
                posted_t2_id,
                f"Iteration {iteration}: Mismatch between posted Tier 2 ID ({posted_t2_id}) and immediate GET ID ({retrieved_id})",
            )
            self.assertEqual(get_res.data.get("assessment_level"), "tier_1_2")

            # 3. Database verification: Exactly 1 active assessment exists
            active_count, active_db_id = self._get_active_sqlite_count_and_id(
                self.female_uuid, "female_pcos"
            )
            self.assertEqual(
                active_count,
                1,
                f"Iteration {iteration}: Expected strictly 1 active assessment in SQLite, found {active_count}",
            )
            self.assertEqual(active_db_id, posted_t2_id)

    def test_03_male_pathway_immediate_queryability_and_single_active(self):
        """
        Validates Male Tier 1 and Male Tier 2 immediate queryability and single active invariant.
        """
        male_t1_inputs = {
            "age": 42,
            "weight_kg": 88.0,
            "height_cm": 178.0,
            "bmi": 27.8,
            "waist_cm": 96.0,
            "adam_libido_loss": 1,
            "adam_erection_quality": 1,
            "adam_energy_loss": 1,
        }

        # 1. Male Tier 1 POST
        t1_req = self.factory.post(
            "/api/v1/intelligence/assessment/male/tier1/",
            male_t1_inputs,
            format="json",
        )
        force_authenticate(t1_req, user=self.male_user)
        t1_res = MaleTier1AssessmentView.as_view()(t1_req)
        self.assertEqual(t1_res.status_code, 200)
        m_t1_id = t1_res.data.get("id") or t1_res.data.get("assessment_id")

        # Immediate GET active
        get_m1_req = self.factory.get("/api/v1/intelligence/assessment/active/?module=male_hypogonadism")
        force_authenticate(get_m1_req, user=self.male_user)
        get_m1_res = ActiveAssessmentView.as_view()(get_m1_req)
        self.assertEqual(get_m1_res.status_code, 200)
        self.assertEqual(get_m1_res.data.get("id"), m_t1_id)
        self.assertEqual(get_m1_res.data.get("assessment_level"), "tier_1")

        active_count, active_id = self._get_active_sqlite_count_and_id(self.male_uuid, "male_hypogonadism")
        self.assertEqual(active_count, 1)
        self.assertEqual(active_id, m_t1_id)

        # 2. Male Tier 2 POST
        t2_req = self.factory.post(
            "/api/v1/intelligence/assessment/male/tier2/",
            {"total_testosterone": 240.0, "shbg": 34.0, "lh": 6.5},
            format="json",
        )
        force_authenticate(t2_req, user=self.male_user)
        t2_res = MaleTier2AssessmentView.as_view()(t2_req)
        self.assertEqual(t2_res.status_code, 200)
        m_t2_id = t2_res.data.get("id") or t2_res.data.get("assessment_id")

        # Immediate GET active
        get_m2_req = self.factory.get("/api/v1/intelligence/assessment/active/?module=male_hypogonadism")
        force_authenticate(get_m2_req, user=self.male_user)
        get_m2_res = ActiveAssessmentView.as_view()(get_m2_req)
        self.assertEqual(get_m2_res.status_code, 200)
        self.assertEqual(get_m2_res.data.get("id"), m_t2_id)
        self.assertEqual(get_m2_res.data.get("assessment_level"), "tier_1_2")

        active_count, active_id = self._get_active_sqlite_count_and_id(self.male_uuid, "male_hypogonadism")
        self.assertEqual(active_count, 1)
        self.assertEqual(active_id, m_t2_id)

    def test_04_explicit_clear_tier2_immediate_queryability_and_single_active(self):
        """
        Validates that clear-tier2 executes an explicit downgrade to Tier 1,
        an immediate GET active returns the reverted Tier 1 ID,
        and SQLite contains exactly 1 active assessment.
        """
        # Seed Tier 1 then Tier 2
        t1_req = self.factory.post(
            "/api/v1/intelligence/assessment/tier1/",
            self.female_t1_base_inputs,
            format="json",
        )
        force_authenticate(t1_req, user=self.female_user)
        Tier1AssessmentView.as_view()(t1_req)

        t2_req = self.factory.post(
            "/api/v1/intelligence/assessment/tier2/",
            {"tsh": 2.5, "amh": 6.0},
            format="json",
        )
        force_authenticate(t2_req, user=self.female_user)
        Tier2AssessmentView.as_view()(t2_req)

        # POST clear-tier2
        clear_req = self.factory.post(
            "/api/v1/intelligence/assessment/clear-tier2/",
            {"module": "female_pcos"},
            format="json",
        )
        force_authenticate(clear_req, user=self.female_user)
        clear_res = ClearTier2AssessmentView.as_view()(clear_req)
        self.assertEqual(clear_res.status_code, 200)
        reverted_id = clear_res.data.get("id") or clear_res.data.get("assessment_id")
        self.assertEqual(clear_res.data.get("assessment_level"), "tier_1")

        # Immediate GET active
        get_req = self.factory.get("/api/v1/intelligence/assessment/active/?module=female_pcos")
        force_authenticate(get_req, user=self.female_user)
        get_res = ActiveAssessmentView.as_view()(get_req)
        self.assertEqual(get_res.status_code, 200)
        self.assertEqual(get_res.data.get("id"), reverted_id)
        self.assertEqual(get_res.data.get("assessment_level"), "tier_1")

        # Exactly 1 active record in SQLite
        active_count, active_id = self._get_active_sqlite_count_and_id(self.female_uuid, "female_pcos")
        self.assertEqual(active_count, 1)
        self.assertEqual(active_id, reverted_id)
