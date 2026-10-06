import uuid
from unittest.mock import MagicMock, patch

from django.test import TestCase, override_settings
from rest_framework.test import APIRequestFactory, force_authenticate

from apps.authentication.supabase_auth import SupabaseUser
from apps.intelligence.services.assessment_repository import (
    AssessmentRepository,
    PersistenceError,
    assessment_repository,
)
from apps.intelligence.services.intelligence_orchestrator import (
    clear_tier2_assessment,
    reassess_from_current_patient_state,
    run_tier1_assessment,
    run_tier2_assessment,
)
from apps.intelligence.views import PatientClinicalStateView


class PersistenceAndAuthSecurityTests(TestCase):
    """
    Test suite for Stage 2 (Authoritative Persistence & Fallback Policies)
    and Stage 5 (Strict Authenticated Identity derivation).
    Hermetic and offline-safe.
    """

    def setUp(self):
        self.factory = APIRequestFactory()
        self.patient_uuid = str(uuid.uuid4())
        self.attacker_uuid = str(uuid.uuid4())
        self.test_user = SupabaseUser(
            id=self.patient_uuid,
            email="patient@example.com",
            role="authenticated",
            raw_token="fake-jwt-token",
        )
        self.health_patcher = patch("apps.health.services.supabase_health_service.health_service.fetch_all")
        self.mock_fetch_all = self.health_patcher.start()
        
        class MockProfile:
            gender = "female"
            age = 28
            height_cm = None
            weight_kg = None
            cycle_length = None
            period_regularity = None
            date_of_birth = None
            common_symptoms = []
            fast_food_intake = None
            regular_exercise = None

        class MockHealthData:
            profile = MockProfile()
            reports = []
            symptom_records = []
            medical_reports = []

        self.mock_fetch_all.return_value = MockHealthData()

    def tearDown(self):
        self.health_patcher.stop()

    def test_supabase_persistence_success(self):
        """When Supabase RPC succeeds, record is returned with remote ID."""
        mock_client = MagicMock()
        mock_client.table.return_value.select.return_value.eq.return_value.eq.return_value.eq.return_value.order.return_value.limit.return_value.execute.return_value.data = []
        mock_client.rpc.return_value.execute.return_value.data = {
            "id": "remote-supabase-uuid-1234",
            "created_at": "2026-09-18T12:00:00Z",
        }

        with patch("apps.intelligence.services.assessment_repository.get_supabase_client", return_value=mock_client), \
             patch.dict("os.environ", {"SUPABASE_URL": "https://test.supabase.co"}):
            rec = assessment_repository.save_assessment(
                user_id=self.patient_uuid,
                assessment_data={
                    "module": "female_pcos",
                    "assessment_level": "tier_1",
                    "probability": 0.25,
                },
                make_active=True,
            )
            self.assertEqual(rec["id"], "remote-supabase-uuid-1234")

    @override_settings(ALLOW_LOCAL_SQLITE_FALLBACK=False)
    def test_supabase_failure_raises_persistence_error_when_fallback_disabled(self):
        """When Supabase fails and fallback is disallowed, PersistenceError is raised."""
        mock_client = MagicMock()
        mock_client.table.return_value.select.return_value.eq.return_value.eq.return_value.eq.return_value.order.return_value.limit.return_value.execute.return_value.data = []
        mock_client.rpc.side_effect = Exception("Permission denied 42501")

        with patch("apps.intelligence.services.assessment_repository.get_supabase_client", return_value=mock_client), \
             patch.dict("os.environ", {"SUPABASE_URL": "https://test.supabase.co", "ALLOW_LOCAL_SQLITE_FALLBACK": "false"}):
            with self.assertRaises(PersistenceError):
                assessment_repository.save_assessment(
                    user_id=self.patient_uuid,
                    assessment_data={
                        "module": "female_pcos",
                        "assessment_level": "tier_1",
                        "probability": 0.25,
                    },
                    make_active=True,
                )

    @override_settings(ALLOW_LOCAL_SQLITE_FALLBACK=True)
    def test_supabase_failure_falls_back_to_sqlite_when_fallback_enabled(self):
        """When Supabase fails and fallback is enabled, local SQLite is used gracefully."""
        mock_client = MagicMock()
        mock_client.table.return_value.select.return_value.eq.return_value.eq.return_value.eq.return_value.order.return_value.limit.return_value.execute.return_value.data = []
        mock_client.rpc.side_effect = Exception("Permission denied 42501")

        with patch("apps.intelligence.services.assessment_repository.get_supabase_client", return_value=mock_client), \
             patch.dict("os.environ", {"SUPABASE_URL": "https://test.supabase.co", "ALLOW_LOCAL_SQLITE_FALLBACK": "true"}):
            rec = assessment_repository.save_assessment(
                user_id=self.patient_uuid,
                assessment_data={
                    "module": "female_pcos",
                    "assessment_level": "tier_1",
                    "probability": 0.30,
                },
                make_active=True,
            )
            self.assertIsNotNone(rec["id"])
            self.assertEqual(rec["user_id"], self.patient_uuid)

    @override_settings(ALLOW_LOCAL_SQLITE_FALLBACK=True)
    def test_tier2_assessment_preserved_on_tier1_resubmission(self):
        """
        Submitting a Tier 1 questionnaire when the patient already has Tier 2 clinical inputs
        must produce a strictly Tier 1 assessment while preserving stored Tier 2 labs in state.
        """
        with patch("apps.intelligence.services.clinical_state_repository.get_supabase_client", return_value=None), \
             patch("apps.intelligence.services.assessment_repository.get_supabase_client", return_value=None), \
             patch.dict("os.environ", {"ALLOW_LOCAL_SQLITE_FALLBACK": "true"}):
            # Save Tier 2 inputs
            assessment_repository.save_patient_clinical_state(
                user_id=self.patient_uuid,
                module="female_pcos",
                tier_1_inputs={"age": 28, "bmi": 24.5},
                tier_2_inputs={"fasting_glucose": 95.0, "fsh": 6.5, "lh": 13.0},
            )

            # Run Tier 1 assessment
            res = run_tier1_assessment(
                patient_uuid=self.patient_uuid,
                client_health_data={"age": 28, "bmi": 24.5},
            )
            # The active assessment generated is strictly Tier 1
            self.assertEqual(res["assessment_level"], "tier_1")
            # But historical labs are preserved in patient_clinical_state!
            preserved_state = assessment_repository.get_patient_clinical_state(self.patient_uuid, module="female_pcos")
            self.assertIn("fasting_glucose", preserved_state["tier_2_inputs"])
            self.assertEqual(preserved_state["tier_2_inputs"]["fasting_glucose"], 95.0)
            self.assertTrue(res["available_historical_evidence"]["tier_2"])

    @override_settings(ALLOW_LOCAL_SQLITE_FALLBACK=True)
    def test_clear_tier2_assessment_explicitly_downgrades_to_tier1(self):
        """
        Calling clear_tier2_assessment explicitly wipes Tier 2 and recalculates baseline Tier 1.
        """
        with patch("apps.intelligence.services.clinical_state_repository.get_supabase_client", return_value=None), \
             patch("apps.intelligence.services.assessment_repository.get_supabase_client", return_value=None), \
             patch.dict("os.environ", {"ALLOW_LOCAL_SQLITE_FALLBACK": "true"}):
            # Save Tier 2 inputs
            assessment_repository.save_patient_clinical_state(
                user_id=self.patient_uuid,
                module="female_pcos",
                tier_1_inputs={"age": 28, "bmi": 24.5},
                tier_2_inputs={"fasting_glucose": 95.0},
            )

            # Clear Tier 2
            res = clear_tier2_assessment(
                patient_uuid=self.patient_uuid,
                module="female_pcos",
            )
            self.assertEqual(res["assessment_level"], "tier_1")
            self.assertEqual(res["authoritative_tier_2_inputs"], {})

    def test_patient_clinical_state_view_ignores_client_user_id_query_param(self):
        """
        STAGE 5 REGRESSION TEST:
        Client-supplied ?user_id=query_param must NEVER override the authenticated user's identity.
        """
        view = PatientClinicalStateView.as_view()
        # Authenticated user is self.test_user, but client sends query param ?user_id=attacker_uuid
        request = self.factory.get(f"/api/v1/intelligence/clinical-state/?user_id={self.attacker_uuid}")
        force_authenticate(request, user=self.test_user)

        with patch("apps.intelligence.services.clinical_state_repository.clinical_state_repository.get_patient_clinical_state") as mock_get:
            mock_get.return_value = {"user_id": self.patient_uuid, "tier_1_inputs": {}}
            response = view(request)
            self.assertEqual(response.status_code, 200)
            # The repository MUST be called with self.patient_uuid, NOT self.attacker_uuid
            mock_get.assert_called_once()
            called_user_id = mock_get.call_args[0][0]
            self.assertEqual(called_user_id, self.patient_uuid)
            self.assertNotEqual(called_user_id, self.attacker_uuid)
