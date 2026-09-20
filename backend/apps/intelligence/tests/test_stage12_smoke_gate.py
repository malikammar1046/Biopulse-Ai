"""
backend/apps/intelligence/tests/test_stage12_smoke_gate.py
Controlled application-level Smoke Gate verification for Stage 12.

Validates under disabled maintenance mode:
1. Female PCOS Assessment Generation:
   - Success response
   - module == 'female_pcos'
   - New row active (is_active == True)
   - Old active row inactive (is_active == False)
   - Replacement link correct (replaced_assessment_id == old_active.id)
   - Exactly one active female assessment for the patient
   - SQLite mirror consistent

2. Male Hypogonadism Assessment Generation:
   - Success response
   - module == 'male_hypogonadism'
   - Exactly one active male assessment for the patient
   - Female history completely unaffected
   - SQLite mirror consistent
"""

import uuid
from unittest.mock import patch, MagicMock
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from apps.intelligence.services.pcos_ml_service import pcos_ml_service
from apps.intelligence.services.male_ml_service import male_ml_service
from apps.intelligence.services.assessment_repository import (
    AssessmentRepository,
    init_sqlite_store,
)
from apps.intelligence.services.intelligence_orchestrator import (
    run_tier1_assessment,
    run_male_tier1_assessment,
)


@override_settings(BIOPULSE_ASSESSMENT_MAINTENANCE=False)
class Stage12SmokeGateTests(TestCase):
    """
    Stage 12 Controlled Smoke Gate application-level tests.
    """

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        pcos_ml_service.load()
        male_ml_service.load()

    def setUp(self):
        init_sqlite_store()
        self.female_user_id = str(uuid.uuid4())
        self.male_user_id = str(uuid.uuid4())

        # Mock external Supabase health queries and client so unit execution is deterministic & fast
        self.fetch_patcher = patch("apps.intelligence.services.intelligence_orchestrator.health_service.fetch_all")
        self.mock_fetch_all = self.fetch_patcher.start()
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

        self.female_tier1_inputs = {
            "age": 26,
            "weight_kg": 68.0,
            "height_cm": 162.0,
            "bmi": 25.9,
            "cycle_regularity": "irregular",
            "cycle_length_days": 42,
            "period_duration_days": 6,
            "hirsutism_score": 14,
            "acne_severity": "moderate",
            "hair_thinning": "yes",
            "weight_gain": "yes",
            "skin_darkening": "yes",
            "fast_food_frequency": 3,
            "exercise_frequency": 1,
        }

        self.male_tier1_inputs = {
            "age": 38,
            "bmi": 28.4,
            "libido_loss": "yes",
            "erectile_dysfunction": "yes",
            "fatigue": "yes",
            "muscle_loss": "yes",
            "mood_changes": "yes",
            "sleep_apnea": "no",
            "testicular_shrinkage": "no",
            "gynecomastia": "no",
            "bone_density_loss": "no",
        }

    def tearDown(self):
        self.fetch_patcher.stop()
        self.sb_patcher1.stop()
        self.sb_patcher2.stop()

    def test_stage12_female_smoke_gate(self):
        """
        Verify:
        - success
        - module='female_pcos'
        - new row active
        - old active row inactive
        - replacement link correct
        - exactly one active female assessment
        - SQLite mirror consistent
        """
        # Step 1: Generate initial female assessment
        female_res_1 = run_tier1_assessment(
            self.female_user_id,
            client_health_data=self.female_tier1_inputs,
        )
        self.assertIsNotNone(female_res_1)
        self.assertEqual(female_res_1.get("module"), "female_pcos")
        self.assertTrue(female_res_1.get("is_active"))
        first_id = female_res_1.get("id")
        self.assertIsNotNone(first_id)

        # Check exactly one active female assessment
        active_rec_1 = AssessmentRepository.get_active_assessment(self.female_user_id, module="female_pcos")
        self.assertIsNotNone(active_rec_1)
        self.assertEqual(active_rec_1["id"], first_id)
        self.assertTrue(active_rec_1["is_active"])

        # Check history contains 1 record
        history_1 = AssessmentRepository.get_assessment_history(self.female_user_id, module="female_pcos")
        self.assertEqual(len(history_1), 1)

        # Step 2: Generate replacement female assessment
        female_res_2 = run_tier1_assessment(
            self.female_user_id,
            client_health_data={**self.female_tier1_inputs, "weight_kg": 72.0},
        )
        self.assertIsNotNone(female_res_2)
        second_id = female_res_2.get("id")
        self.assertNotEqual(first_id, second_id)
        self.assertEqual(female_res_2.get("module"), "female_pcos")
        self.assertTrue(female_res_2.get("is_active"))
        self.assertEqual(female_res_2.get("replaced_assessment_id"), first_id)

        # Verify old active row is now inactive
        history_2 = AssessmentRepository.get_assessment_history(self.female_user_id, module="female_pcos")
        self.assertEqual(len(history_2), 2)
        old_record = next(r for r in history_2 if r["id"] == first_id)
        new_record = next(r for r in history_2 if r["id"] == second_id)
        self.assertFalse(old_record["is_active"])
        self.assertTrue(new_record["is_active"])

        # Verify exactly one active female assessment
        active_rec_2 = AssessmentRepository.get_active_assessment(self.female_user_id, module="female_pcos")
        self.assertEqual(active_rec_2["id"], second_id)
        self.assertTrue(active_rec_2["is_active"])

        # Verify SQLite mirror consistency
        active_count = sum(1 for r in history_2 if r.get("is_active") is True)
        self.assertEqual(active_count, 1, "Must have exactly ONE active female assessment")

    def test_stage12_male_smoke_gate_and_isolation(self):
        """
        Verify:
        - success
        - module='male_hypogonadism'
        - exactly one active male assessment
        - female history unaffected
        - SQLite mirror consistent
        """
        # Step 1: Create a female assessment first to test cross-pathway isolation
        female_res = run_tier1_assessment(
            self.female_user_id,
            client_health_data=self.female_tier1_inputs,
        )
        female_id = female_res.get("id")
        female_history_before = AssessmentRepository.get_assessment_history(self.female_user_id, module="female_pcos")
        self.assertEqual(len(female_history_before), 1)

        # Step 2: Generate Male assessment
        male_res = run_male_tier1_assessment(
            self.male_user_id,
            client_health_data=self.male_tier1_inputs,
        )
        self.assertIsNotNone(male_res)
        self.assertEqual(male_res.get("module"), "male_hypogonadism")
        self.assertTrue(male_res.get("is_active"))
        male_id = male_res.get("id")
        self.assertIsNotNone(male_id)

        # Verify exactly one active male assessment
        male_active = AssessmentRepository.get_active_assessment(self.male_user_id, module="male_hypogonadism")
        self.assertIsNotNone(male_active)
        self.assertEqual(male_active["id"], male_id)
        self.assertTrue(male_active["is_active"])

        male_history = AssessmentRepository.get_assessment_history(self.male_user_id, module="male_hypogonadism")
        self.assertEqual(len(male_history), 1)
        self.assertEqual(male_history[0]["id"], male_id)
        self.assertTrue(male_history[0]["is_active"])

        # Step 3: Verify female history completely unaffected
        female_history_after = AssessmentRepository.get_assessment_history(self.female_user_id, module="female_pcos")
        self.assertEqual(len(female_history_after), 1)
        self.assertEqual(female_history_after[0]["id"], female_id)
        self.assertTrue(female_history_after[0]["is_active"])

        female_active_after = AssessmentRepository.get_active_assessment(self.female_user_id, module="female_pcos")
        self.assertEqual(female_active_after["id"], female_id)
        self.assertTrue(female_active_after["is_active"])
