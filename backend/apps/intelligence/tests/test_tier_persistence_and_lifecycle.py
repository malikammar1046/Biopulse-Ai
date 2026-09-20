"""
backend/apps/intelligence/tests/test_tier_persistence_and_lifecycle.py
Comprehensive regression tests for Tier 1 and Tier 2 clinical state persistence,
lifecycle management, PATCH semantics, male/female pathway isolation, and explicit clearing.
"""

import uuid
from unittest.mock import patch, MagicMock
from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from apps.intelligence.services.pcos_ml_service import pcos_ml_service
from apps.intelligence.services.male_ml_service import male_ml_service
from apps.intelligence.services.clinical_state_repository import (
    clinical_state_repository,
    init_sqlite_clinical_store,
)
from apps.intelligence.services.intelligence_orchestrator import (
    run_tier1_assessment,
    run_tier2_assessment,
    run_male_tier1_assessment,
    run_male_tier2_assessment,
    reassess_from_current_patient_state,
    clear_tier2_assessment,
)


@override_settings(ALLOW_LOCAL_SQLITE_FALLBACK=True)
class TierPersistenceAndLifecycleTests(TestCase):
    """
    Validates complete lifecycle and persistence guarantees:
    - Non-destructive profile reassessment
    - Authoritative patient clinical state separation
    - Additive PATCH semantics with null/empty sanitization
    - Strict female/male module isolation
    - Explicit clearing and graceful degradation to Tier 1
    - Historical backfill seeding
    - REST API endpoints for state and clear-tier2
    """

    def setUp(self):
        pcos_ml_service.load()
        male_ml_service.load()
        init_sqlite_clinical_store()
        self.client = APIClient()

        User = get_user_model()
        self.test_user = User.objects.create_user(
            username="test_clinical_user",
            password="test_password",
            id=123456,
        )

        self.female_user_id = str(uuid.uuid4())
        self.male_user_id = str(uuid.uuid4())

        # Fast in-memory mock for Supabase health queries so tests execute rapidly without network latency
        self.patcher = patch("apps.intelligence.services.intelligence_orchestrator.health_service.fetch_all")
        self.mock_fetch_all = self.patcher.start()
        mock_hd = MagicMock()
        mock_hd.profile = None
        mock_hd.cycle_records = []
        mock_hd.symptom_records = []
        mock_hd.food_logs = []
        mock_hd.water_logs = []
        mock_hd.fitness_logs = []
        mock_hd.medications = []
        mock_hd.medication_logs = []
        mock_hd.medical_reports = []
        self.mock_fetch_all.return_value = mock_hd

        self.sb_patcher1 = patch("apps.intelligence.services.clinical_state_repository.get_supabase_client", return_value=None)
        self.sb_patcher2 = patch("apps.intelligence.services.assessment_repository.get_supabase_client", return_value=None)
        self.sb_patcher1.start()
        self.sb_patcher2.start()

        self.female_tier1_data = {
            "age": 26,
            "weight_kg": 68.0,
            "height_cm": 162.0,
            "bmi": 25.9,
            "waist_inch": 34.0,
            "hip_inch": 38.0,
            "waist_hip_ratio": 0.895,
            "cycle_length": 45,
            "period_regularity": "irregular",
            "weight_gain": 1,
            "hirsutism": 1,
            "skin_darkening": 1,
            "hair_loss": 1,
            "pimples_acne": 1,
            "fast_food": 1,
            "regular_exercise": 0,
        }

        self.male_tier1_data = {
            "age": 42,
            "weight_kg": 92.0,
            "height_cm": 178.0,
            "bmi": 29.0,
            "waist_cm": 98.0,
            "energy_level": "low",
            "sex_drive": "reduced",
            "erectile_difficulties": "occasional",
            "sleep_quality": "poor",
            "muscle_weakness": 1,
            "low_libido": 1,
            "erectile_dysfunction": 1,
            "depression": 0,
        }

    def tearDown(self):
        self.patcher.stop()
        self.sb_patcher1.stop()
        self.sb_patcher2.stop()

    def test_01_tier1_then_tier2_assessment_persistence(self):
        """Tier 1 followed by Tier 2 assessment properly updates authoritative clinical state."""
        # 1. Run Tier 1
        t1 = run_tier1_assessment(self.female_user_id, client_health_data=self.female_tier1_data)
        self.assertEqual(t1["assessment_level"], "tier_1")
        self.assertTrue(t1["is_active"])

        # 2. Run Tier 2 with TSH and AMH
        t2 = run_tier2_assessment(
            self.female_user_id,
            client_health_data=self.female_tier1_data,
            clinical_inputs={"tsh": 2.5, "amh": 6.5},
        )
        self.assertEqual(t2["assessment_level"], "tier_1_2")
        self.assertTrue(t2["is_active"])
        self.assertEqual(t2["tier_2_available_count"], 2)

        # 3. Verify clinical state repository has the persisted values
        state = clinical_state_repository.get_patient_clinical_state(self.female_user_id, "female_pcos")
        self.assertEqual(state["tier_2_inputs"].get("tsh"), 2.5)
        self.assertEqual(state["tier_2_inputs"].get("amh"), 6.5)

    def test_02_profile_update_reassessment_retains_tier2_labs(self):
        """Reassessment triggered by profile update (e.g. weight change) preserves Tier 2 level and labs."""
        # Establish Tier 2
        run_tier2_assessment(
            self.female_user_id,
            client_health_data=self.female_tier1_data,
            clinical_inputs={"tsh": 3.2, "amh": 6.8},
        )

        # Update profile weight and reassess
        updated_profile = dict(self.female_tier1_data)
        updated_profile["weight_kg"] = 72.0
        updated_profile["bmi"] = 27.4

        reassessed = reassess_from_current_patient_state(
            self.female_user_id,
            module="female_pcos",
            incoming_tier1=updated_profile,
        )

        # Crucial invariant: Assessment level must REMAIN tier_1_2 and retain labs!
        self.assertEqual(reassessed["assessment_level"], "tier_1_2")
        self.assertTrue(reassessed["is_active"])
        self.assertIn("tsh", reassessed["tier_2_available_fields"])
        self.assertIn("amh", reassessed["tier_2_available_fields"])

        # Verify state is intact
        state = clinical_state_repository.get_patient_clinical_state(self.female_user_id, "female_pcos")
        self.assertEqual(state["tier_2_inputs"].get("tsh"), 3.2)
        self.assertEqual(state["tier_2_inputs"].get("amh"), 6.8)

    def test_03_patch_merge_semantics(self):
        """Submitting a single new lab merges into existing labs without erasing previous ones."""
        # Initial: TSH
        run_tier2_assessment(
            self.female_user_id,
            client_health_data=self.female_tier1_data,
            clinical_inputs={"tsh": 2.1},
        )

        # Second update: AMH only
        t2_second = run_tier2_assessment(
            self.female_user_id,
            client_health_data=self.female_tier1_data,
            clinical_inputs={"amh": 7.5},
        )

        self.assertIn("tsh", t2_second["tier_2_available_fields"])
        self.assertIn("amh", t2_second["tier_2_available_fields"])
        self.assertEqual(t2_second["tier_2_available_count"], 2)

        state = clinical_state_repository.get_patient_clinical_state(self.female_user_id, "female_pcos")
        self.assertEqual(state["tier_2_inputs"].get("tsh"), 2.1)
        self.assertEqual(state["tier_2_inputs"].get("amh"), 7.5)

    def test_04_empty_and_null_values_do_not_erase_persisted_state(self):
        """Submitting null or empty string fields does not wipe out previously stored numbers."""
        run_tier2_assessment(
            self.female_user_id,
            client_health_data=self.female_tier1_data,
            clinical_inputs={"tsh": 2.8, "rbs": 95.0},
        )

        # Attempt to overwrite with empty string and None
        run_tier2_assessment(
            self.female_user_id,
            client_health_data=self.female_tier1_data,
            clinical_inputs={"tsh": "", "rbs": None, "amh": 5.4},
        )

        state = clinical_state_repository.get_patient_clinical_state(self.female_user_id, "female_pcos")
        self.assertEqual(state["tier_2_inputs"].get("tsh"), 2.8)
        self.assertEqual(state["tier_2_inputs"].get("rbs"), 95.0)
        self.assertEqual(state["tier_2_inputs"].get("amh"), 5.4)

    def test_05_explicit_clear_tier2_reverts_to_tier1(self):
        """Calling clear_tier2_assessment removes Tier 2 labs and safely demotes to Tier 1."""
        run_tier2_assessment(
            self.female_user_id,
            client_health_data=self.female_tier1_data,
            clinical_inputs={"tsh": 3.0, "amh": 8.0},
        )

        cleared_res = clear_tier2_assessment(self.female_user_id, "female_pcos")
        self.assertIsNotNone(cleared_res)
        self.assertEqual(cleared_res["assessment_level"], "tier_1")
        self.assertTrue(cleared_res["is_active"])

        state = clinical_state_repository.get_patient_clinical_state(self.female_user_id, "female_pcos", perform_backfill=False)
        self.assertEqual(state["tier_2_inputs"], {})

    def test_06_male_module_isolation(self):
        """Male and female clinical states are strictly isolated by (user_id, module)."""
        # Save female Tier 2
        run_tier2_assessment(
            self.female_user_id,
            client_health_data=self.female_tier1_data,
            clinical_inputs={"tsh": 2.4, "amh": 6.2},
        )

        # Run male Tier 1 and Tier 2
        m1 = run_male_tier1_assessment(self.male_user_id, client_health_data=self.male_tier1_data)
        self.assertEqual(m1["assessment_level"], "tier_1")

        m2 = run_male_tier2_assessment(
            self.male_user_id,
            client_health_data=self.male_tier1_data,
            clinical_inputs={"total_testosterone": 260.0, "shbg": 32.0},
        )
        self.assertEqual(m2["assessment_level"], "tier_1_2")

        # Verify female state was untouched
        female_state = clinical_state_repository.get_patient_clinical_state(self.female_user_id, "female_pcos")
        self.assertIn("tsh", female_state["tier_2_inputs"])
        self.assertNotIn("total_testosterone", female_state["tier_2_inputs"])

        # Verify male state has only male labs
        male_state = clinical_state_repository.get_patient_clinical_state(self.male_user_id, "male_hypogonadism")
        self.assertEqual(male_state["tier_2_inputs"].get("total_testosterone"), 260.0)
        self.assertEqual(male_state["tier_2_inputs"].get("shbg"), 32.0)
        self.assertNotIn("tsh", male_state["tier_2_inputs"])

    def test_07_api_endpoints_clinical_state_and_clear(self):
        """REST API endpoints for clinical-state and clear-tier2 work as expected."""
        self.client.force_authenticate(user=self.test_user)
        user_id_str = str(self.test_user.id)

        # 1. Establish state via orchestrator
        run_tier2_assessment(
            user_id_str,
            client_health_data=self.female_tier1_data,
            clinical_inputs={"tsh": 1.9, "amh": 4.5},
        )

        # 2. Query clinical-state endpoint
        resp = self.client.get(
            f"/api/v1/intelligence/clinical-state/?module=female_pcos"
        )
        self.assertEqual(resp.status_code, 200)
        body = resp.json()
        self.assertEqual(body["tier_2_inputs"]["tsh"], 1.9)
        self.assertEqual(body["tier_2_inputs"]["amh"], 4.5)

        # 3. Call clear-tier2 endpoint
        clear_resp = self.client.post(
            "/api/v1/intelligence/assessment/clear-tier2/",
            data={"module": "female_pcos"},
            format="json",
        )
        self.assertEqual(clear_resp.status_code, 200)
        clear_body = clear_resp.json()
        self.assertEqual(clear_body["assessment_level"], "tier_1")
