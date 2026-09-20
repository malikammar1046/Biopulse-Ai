import os
import sys
from pathlib import Path

# Add backend directory to sys.path
BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

# Ensure Django settings are configured for standalone testing
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
import django
django.setup()

from django.test import TestCase, override_settings
from rest_framework.test import APIClient
from unittest.mock import patch, MagicMock

from apps.intelligence.services.male_ml_service import (
    male_ml_service,
    MALE_TIER1_SCREENING_THRESHOLD,
    MALE_TIER2_SCREENING_THRESHOLD,
)
from apps.intelligence.services.pcos_ml_service import pcos_ml_service
from apps.intelligence.services.intelligence_orchestrator import (
    run_male_tier1_assessment,
    run_male_tier2_assessment,
    run_tier1_assessment,
    validate_male_clinical_value,
    MALE_CLINICAL_FIELD_RANGES,
)
from apps.intelligence.services.assessment_repository import assessment_repository


@override_settings(ALLOW_LOCAL_SQLITE_FALLBACK=True)
class MaleAssessmentOrchestrationTests(TestCase):
    def setUp(self):
        self.sb_patcher1 = patch("apps.intelligence.services.clinical_state_repository.get_supabase_client", return_value=None)
        self.sb_patcher2 = patch("apps.intelligence.services.assessment_repository.get_supabase_client", return_value=None)
        self.sb_patcher3 = patch("apps.health.services.supabase_health_service.health_service.fetch_all")
        mock_fetch = self.sb_patcher3.start()

        class MockProfile:
            gender = "male"
            age = 48
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

        mock_fetch.return_value = MockHealthData()
        self.sb_patcher1.start()
        self.sb_patcher2.start()

        male_ml_service.load()
        pcos_ml_service.load()
        import uuid
        self.patient_uuid = f"test-male-patient-uuid-{uuid.uuid4().hex[:8]}"
        self.female_patient_uuid = f"test-female-patient-uuid-{uuid.uuid4().hex[:8]}"

        self.male_tier1_profile = {
            "age": 48,
            "height_cm": 178.0,
            "weight_kg": 92.0,
            "waist_cm": 98.0,
            "low_energy": 1,
            "sleep_trouble": 1,
            "low_mood": 0,
            "low_interest": 1,
            "high_blood_pressure": 1,
            "diabetes": 0,
        }

        self.male_tier2_labs = {
            "shbg_nmol_l": 25.0,
            "estradiol_pg_ml": 24.0,
            "albumin_g_dl": 4.2,
            "hba1c_pct": 5.9,
            "glucose_mg_dl": 108.0,
            "hemoglobin_g_dl": 14.8,
            "hematocrit_pct": 43.0,
            "rbc_count": 4.8,
            "alt_u_l": 32.0,
            "ast_u_l": 28.0,
            "total_bilirubin_mg_dl": 0.9,
            "creatinine_mg_dl": 1.0,
            "bun_mg_dl": 18.0,
            "uric_acid_mg_dl": 6.2,
            "hdl_mg_dl": 42.0,
            # Direct hormone panel
            "total_testosterone": 210.0,
            "lh": 2.2,
            "fsh": 2.5,
            "prolactin": 14.0,
        }

    def test_male_tier1_orchestration(self):
        result = run_male_tier1_assessment(
            self.patient_uuid,
            client_health_data=self.male_tier1_profile,
        )
        self.assertEqual(result["module"], "male_hypogonadism")
        self.assertEqual(result["assessment_level"], "tier_1")
        self.assertEqual(result["tiers_included"], [1])
        self.assertTrue(result["is_active"])
        self.assertIn("probability", result)
        self.assertIn("probability_percent", result)
        self.assertEqual(result["threshold"], MALE_TIER1_SCREENING_THRESHOLD)
        self.assertIn(result["risk_category"], ["lower", "intermediate", "higher"])
        self.assertIsInstance(result["explanations"], list)
        self.assertIn("next_step", result)

    def test_male_tier2_orchestration_and_replacement(self):
        # 1. Run Tier 1 first
        t1_res = run_male_tier1_assessment(
            self.patient_uuid,
            client_health_data=self.male_tier1_profile,
        )
        t1_id = t1_res["assessment_id"]
        self.assertTrue(t1_res["is_active"])

        # 2. Run Tier 2
        t2_res = run_male_tier2_assessment(
            self.patient_uuid,
            client_health_data=self.male_tier1_profile,
            clinical_inputs=self.male_tier2_labs,
        )
        t2_id = t2_res["assessment_id"]

        # Verify Tier 2 response
        self.assertEqual(t2_res["module"], "male_hypogonadism")
        self.assertEqual(t2_res["assessment_level"], "tier_1_2")
        self.assertEqual(t2_res["tiers_included"], [1, 2])
        self.assertTrue(t2_res["is_active"])
        self.assertEqual(t2_res["replaced_assessment_id"], t1_id)
        self.assertIsNotNone(t2_res.get("hormone_pattern_interpretation"))
        self.assertEqual(
            t2_res["hormone_pattern_interpretation"]["pattern_type"],
            "SECONDARY"
        )
        self.assertEqual(t2_res["tier_2_available_count"], 16)
        self.assertGreaterEqual(len(t2_res["direct_laboratory_values"]), 1)

        # 3. Verify Active Assessment is now Tier 2
        active = assessment_repository.get_active_assessment(
            self.patient_uuid,
            module="male_hypogonadism",
        )
        self.assertIsNotNone(active)
        self.assertEqual(str(active["id"]), str(t2_id))
        self.assertEqual(active["assessment_level"], "tier_1_2")

        # 4. Verify History preserves Tier 1
        history = assessment_repository.get_assessment_history(
            self.patient_uuid,
            module="male_hypogonadism",
        )
        self.assertGreaterEqual(len(history), 2)
        history_levels = [h["assessment_level"] for h in history]
        self.assertIn("tier_1", history_levels)
        self.assertIn("tier_1_2", history_levels)

    def test_male_female_module_isolation(self):
        # Create male assessment for male patient
        m_res = run_male_tier1_assessment(
            self.patient_uuid,
            client_health_data=self.male_tier1_profile,
        )
        # Create female assessment for female patient
        f_profile = {
            "age": 25, "weight_kg": 55.0, "height_cm": 165.0, "waist_inch": 28.0, "hip_inch": 36.0,
            "cycle_length_raw": 28, "cycle_regularity": 0, "weight_gain": 0, "hirsutism": 0,
            "skin_darkening": 0, "hair_loss": 0, "pimples_acne": 0, "fast_food": 0, "regular_exercise": 1,
        }
        f_res = run_tier1_assessment(
            self.female_patient_uuid,
            client_health_data=f_profile,
        )

        # Verify male patient active is male_hypogonadism
        m_active = assessment_repository.get_active_assessment(self.patient_uuid, module="male_hypogonadism")
        self.assertEqual(m_active["module"], "male_hypogonadism")
        self.assertIn("Logistic Regression", m_active["model_name"])

        # Verify female patient active is female_pcos
        f_active = assessment_repository.get_active_assessment(self.female_patient_uuid, module="female_pcos")
        self.assertEqual(f_active["module"], "female_pcos")
        self.assertIn("Extra Trees", f_active["model_name"])

    def test_male_clinical_value_validation(self):
        # Valid values
        self.assertEqual(validate_male_clinical_value("glucose_mg_dl", 100.0), 100.0)
        self.assertEqual(validate_male_clinical_value("glucose_mg_dl", "100.0"), 100.0)
        self.assertIsNone(validate_male_clinical_value("glucose_mg_dl", None))
        self.assertIsNone(validate_male_clinical_value("glucose_mg_dl", ""))

        # Out of range values
        with self.assertRaises(ValueError):
            validate_male_clinical_value("glucose_mg_dl", 1000.0) # > 600

        with self.assertRaises(ValueError):
            validate_male_clinical_value("total_testosterone", -5.0)

        with self.assertRaises(ValueError):
            validate_male_clinical_value("hba1c_pct", "abc")

    def tearDown(self):
        self.sb_patcher1.stop()
        self.sb_patcher2.stop()
        self.sb_patcher3.stop()
