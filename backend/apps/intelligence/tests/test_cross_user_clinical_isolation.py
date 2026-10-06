"""
backend/apps/intelligence/tests/test_cross_user_clinical_isolation.py

Rigorous End-to-End Regression Test Suite for Multi-User Clinical Data Isolation.
Verifies that:
1. User A (Female Tier 3 with labs, ultrasound, Grad-CAM) is 100% isolated.
2. User B (Fresh Female) receives has_assessment=False initially, and upon completing
   Tier 1 receives ONLY User B's distinct Tier 1 assessment (0 labs, 0 ultrasound, 0 Grad-CAM).
3. User C (Fresh Male) receives ONLY male hypogonadism Tier 1 assessment, with ZERO female
   PCOS data, ZERO ultrasound, ZERO Grad-CAM, and ZERO female lab values.
4. User A's stored multimodal record remains completely unmodified after B and C assess.
5. Unauthenticated, empty, or placeholder user IDs fail closed.
"""

import uuid
from unittest.mock import MagicMock, patch

from django.test import TestCase, override_settings
from rest_framework.test import APIRequestFactory, force_authenticate

from apps.authentication.supabase_auth import SupabaseUser
from apps.intelligence.services.assessment_repository import (
    AssessmentRepository,
    assessment_repository,
)
from apps.intelligence.services.clinical_state_repository import (
    ClinicalStateRepository,
    clinical_state_repository,
)
from apps.intelligence.views import (
    ActiveAssessmentView,
    AssessmentHistoryView,
    MaleTier1AssessmentView,
    PatientClinicalStateView,
    Tier1AssessmentView,
    Tier2AssessmentView,
)


@override_settings(ALLOW_LOCAL_SQLITE_FALLBACK=True)
class CrossUserClinicalIsolationTests(TestCase):
    """
    Hermetic multi-user integration tests verifying real repository persistence,
    endpoint responses, and strict clinical isolation across 3 users:
    - User A: Female Tier 3 (labs + ultrasound + Grad-CAM)
    - User B: Fresh Female (starts with no assessment, then Tier 1 only)
    - User C: Fresh Male (starts with no assessment, then Male Tier 1 only)
    """

    def setUp(self):
        self.factory = APIRequestFactory()

        # Three distinct UUIDs
        self.user_a_uuid = str(uuid.uuid4())
        self.user_b_uuid = str(uuid.uuid4())
        self.user_c_uuid = str(uuid.uuid4())

        self.user_a = SupabaseUser(
            id=self.user_a_uuid,
            email="user_a_female@example.com",
            role="authenticated",
            raw_token=f"jwt-token-{self.user_a_uuid}",
        )
        self.user_b = SupabaseUser(
            id=self.user_b_uuid,
            email="user_b_female@example.com",
            role="authenticated",
            raw_token=f"jwt-token-{self.user_b_uuid}",
        )
        self.user_c = SupabaseUser(
            id=self.user_c_uuid,
            email="user_c_male@example.com",
            role="authenticated",
            raw_token=f"jwt-token-{self.user_c_uuid}",
        )

        # Mock health_service.fetch_all to provide distinct profile for each user
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
            if patient_uuid == self.user_a_uuid:
                p.gender = "female"
                p.pathway = "female_pcos"
                p.age = 29
                p.height_cm = 162.0
                p.weight_kg = 68.0
                p.cycle_length = 36.0
                p.period_regularity = "irregular"
            elif patient_uuid == self.user_b_uuid:
                p.gender = "female"
                p.pathway = "female_pcos"
                p.age = 24
                p.height_cm = 168.0
                p.weight_kg = 54.0
                p.cycle_length = 28.0
                p.period_regularity = "regular"
            elif patient_uuid == self.user_c_uuid:
                p.gender = "male"
                p.pathway = "male_hypogonadism"
                p.age = 45
                p.height_cm = 178.0
                p.weight_kg = 88.0
                p.waist_cm = 98.0
            else:
                p.gender = "female"
                p.pathway = "female_pcos"

            class MockHealthData:
                profile = p
                reports = []
                symptom_records = []
                medical_reports = []

            return MockHealthData()

        self.mock_fetch_all.side_effect = side_effect_fetch_all

    def tearDown(self):
        self.health_patcher.stop()

    def test_three_user_clinical_and_assessment_isolation(self):
        """
        Complete lifecycle test across User A (Tier 3 multimodal), User B (fresh Tier 1),
        and User C (fresh male Tier 1).
        """
        # ===================================================================
        # STEP 1: User A creates Tier 1, adds Tier 2 labs, and saves Tier 3 ultrasound
        # ===================================================================
        user_a_t3_record = {
            "module": "female_pcos",
            "assessment_level": "tier_1_2_3",
            "tiers_included": [1, 2, 3],
            "probability": 0.546,
            "probability_percent": 54.6,
            "threshold": 0.25,
            "risk_category": "higher",
            "risk_label": "Higher Screening Risk",
            "summary_text": "Multimodal analysis indicates elevated PCOS risk pattern.",
            "tier_2_inputs": {
                "fsh": 4.8,
                "lh": 12.2,
                "amh": 7.4,
                "testosterone_total": 68.0,
            },
            "pcom_status": "PCOM Detected",
            "pcom_probability": 0.78,
            "gradcam_url": "https://storage.biopulse.ai/ultrasound/user_a_heatmap.png",
            "gradcam_b64": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
            "ultrasound_report_id": "us_report_user_a_001",
        }

        # Save User A's clinical state
        clinical_state_repository.save_patient_clinical_state(
            user_id=self.user_a_uuid,
            module="female_pcos",
            tier_1_inputs={"age": 29, "bmi": 25.9, "cycle_regularity": 0},
            tier_2_inputs=user_a_t3_record["tier_2_inputs"],
            ultrasound_inputs={"report_id": "us_report_user_a_001", "pcom_status": "PCOM Detected"},
        )

        saved_a = assessment_repository.save_assessment(
            user_id=self.user_a_uuid,
            assessment_data=user_a_t3_record,
            make_active=True,
        )
        user_a_assessment_id = saved_a["id"]
        self.assertIsNotNone(user_a_assessment_id)

        # ===================================================================
        # STEP 2: Fresh User B arrives (Incognito scenario)
        # ===================================================================
        # User B makes GET /api/v1/intelligence/assessment/active/
        req_b_active = self.factory.get("/api/v1/intelligence/assessment/active/?module=female_pcos")
        force_authenticate(req_b_active, user=self.user_b)
        res_b_active = ActiveAssessmentView.as_view()(req_b_active)

        self.assertEqual(res_b_active.status_code, 200)
        self.assertFalse(res_b_active.data.get("has_assessment"))
        self.assertIsNone(res_b_active.data.get("assessment"))
        self.assertEqual(res_b_active.data.get("patient_id"), self.user_b_uuid)

        # User B makes GET /api/v1/intelligence/clinical-state/
        req_b_state = self.factory.get("/api/v1/intelligence/clinical-state/?module=female_pcos")
        force_authenticate(req_b_state, user=self.user_b)
        res_b_state = PatientClinicalStateView.as_view()(req_b_state)

        self.assertEqual(res_b_state.status_code, 200)
        self.assertEqual(res_b_state.data.get("tier_1_inputs"), {})
        self.assertEqual(res_b_state.data.get("tier_2_inputs"), {})
        self.assertEqual(res_b_state.data.get("ultrasound_inputs"), {})
        self.assertEqual(res_b_state.data.get("user_id"), self.user_b_uuid)

        # User B makes GET /api/v1/intelligence/assessment/history/
        req_b_history = self.factory.get("/api/v1/intelligence/assessment/history/?module=female_pcos")
        force_authenticate(req_b_history, user=self.user_b)
        res_b_history = AssessmentHistoryView.as_view()(req_b_history)

        self.assertEqual(res_b_history.status_code, 200)
        self.assertEqual(res_b_history.data.get("count"), 0)
        self.assertEqual(res_b_history.data.get("history"), [])

        # ===================================================================
        # STEP 3: User B completes fresh Tier 1 assessment
        # ===================================================================
        req_b_t1 = self.factory.post(
            "/api/v1/intelligence/assessment/tier1/",
            {"age": 24, "height_cm": 168.0, "weight_kg": 54.0, "cycle_regularity": 1},
            format="json",
        )
        force_authenticate(req_b_t1, user=self.user_b)
        res_b_t1 = Tier1AssessmentView.as_view()(req_b_t1)

        self.assertEqual(res_b_t1.status_code, 200)
        user_b_assessment_id = res_b_t1.data.get("id") or res_b_t1.data.get("assessment_id")

        # Invariant 1: Assessment IDs must be distinct
        self.assertNotEqual(user_b_assessment_id, user_a_assessment_id)

        # Invariant 2: User B assessment must be Tier 1 with zero higher tier leaks
        self.assertEqual(res_b_t1.data.get("assessment_level"), "tier_1")
        self.assertEqual(res_b_t1.data.get("tiers_included"), [1])
        self.assertEqual(res_b_t1.data.get("tier_2_inputs"), {})
        self.assertIsNone(res_b_t1.data.get("pcom_status"))
        self.assertIsNone(res_b_t1.data.get("gradcam_url"))
        self.assertIsNone(res_b_t1.data.get("gradcam_b64"))
        self.assertIsNone(res_b_t1.data.get("ultrasound_report_id"))

        # User B now requests active assessment
        req_b_active2 = self.factory.get("/api/v1/intelligence/assessment/active/?module=female_pcos")
        force_authenticate(req_b_active2, user=self.user_b)
        res_b_active2 = ActiveAssessmentView.as_view()(req_b_active2)

        self.assertEqual(res_b_active2.status_code, 200)
        self.assertTrue(res_b_active2.data.get("has_assessment"))
        self.assertEqual(res_b_active2.data.get("patient_id"), self.user_b_uuid)
        self.assertEqual(res_b_active2.data.get("id"), user_b_assessment_id)
        self.assertEqual(res_b_active2.data.get("assessment_level"), "tier_1")
        self.assertIsNone(res_b_active2.data.get("gradcam_url"))

        # ===================================================================
        # STEP 4: Fresh Male User C arrives
        # ===================================================================
        # User C initial active assessment check
        req_c_active = self.factory.get("/api/v1/intelligence/assessment/active/?module=male_hypogonadism")
        force_authenticate(req_c_active, user=self.user_c)
        res_c_active = ActiveAssessmentView.as_view()(req_c_active)

        self.assertEqual(res_c_active.status_code, 200)
        self.assertFalse(res_c_active.data.get("has_assessment"))
        self.assertIsNone(res_c_active.data.get("assessment"))
        self.assertEqual(res_c_active.data.get("patient_id"), self.user_c_uuid)

        # User C completes Male Tier 1
        req_c_t1 = self.factory.post(
            "/api/v1/intelligence/assessment/male/tier1/",
            {
                "age": 45,
                "height_cm": 178.0,
                "weight_kg": 88.0,
                "waist_cm": 98.0,
                "low_energy": 1,
                "low_mood": 0,
                "sleep_trouble": 1,
                "low_interest": 1,
                "high_blood_pressure": 0,
                "diabetes": 0,
            },
            format="json",
        )
        force_authenticate(req_c_t1, user=self.user_c)
        res_c_t1 = MaleTier1AssessmentView.as_view()(req_c_t1)

        self.assertEqual(res_c_t1.status_code, 200)
        user_c_assessment_id = res_c_t1.data.get("id") or res_c_t1.data.get("assessment_id")

        self.assertNotEqual(user_c_assessment_id, user_a_assessment_id)
        self.assertNotEqual(user_c_assessment_id, user_b_assessment_id)
        self.assertEqual(res_c_t1.data.get("module"), "male_hypogonadism")
        self.assertEqual(res_c_t1.data.get("assessment_level"), "tier_1")
        self.assertEqual(res_c_t1.data.get("tier_2_inputs"), {})

        # User C must NEVER have female PCOS / ultrasound fields
        self.assertIsNone(res_c_t1.data.get("pcom_status"))
        self.assertIsNone(res_c_t1.data.get("gradcam_url"))
        self.assertIsNone(res_c_t1.data.get("gradcam_b64"))
        self.assertIsNone(res_c_t1.data.get("ultrasound_report_id"))

        # ===================================================================
        # STEP 5: Log back into User A and confirm complete data integrity
        # ===================================================================
        req_a_active = self.factory.get("/api/v1/intelligence/assessment/active/?module=female_pcos")
        force_authenticate(req_a_active, user=self.user_a)
        res_a_active = ActiveAssessmentView.as_view()(req_a_active)

        self.assertEqual(res_a_active.status_code, 200)
        self.assertTrue(res_a_active.data.get("has_assessment"))
        self.assertEqual(res_a_active.data.get("patient_id"), self.user_a_uuid)
        self.assertEqual(res_a_active.data.get("id"), user_a_assessment_id)
        self.assertEqual(res_a_active.data.get("assessment_level"), "tier_1_2_3")
        self.assertEqual(res_a_active.data.get("probability_percent"), 54.6)
        self.assertEqual(res_a_active.data.get("pcom_status"), "PCOM Detected")
        self.assertEqual(
            res_a_active.data.get("gradcam_url"),
            "https://storage.biopulse.ai/ultrasound/user_a_heatmap.png",
        )
        self.assertEqual(
            res_a_active.data.get("authoritative_tier_2_inputs", {}).get("amh"),
            7.4,
        )

        # ===================================================================
        # STEP 6: Negative Security Tests (Unauthenticated & Placeholder IDs)
        # ===================================================================
        with self.assertRaises(ValueError):
            assessment_repository.get_active_assessment("")

        with self.assertRaises(ValueError):
            assessment_repository.get_active_assessment("guest")

        with self.assertRaises(ValueError):
            assessment_repository.get_active_assessment("demo-user-id")

        with self.assertRaises(ValueError):
            clinical_state_repository.get_patient_clinical_state("")

        with self.assertRaises(ValueError):
            clinical_state_repository.get_patient_clinical_state("none")
