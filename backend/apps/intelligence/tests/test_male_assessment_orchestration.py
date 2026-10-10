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
from apps.intelligence.views import (
    MaleTier1AssessmentView,
    MaleTier2AssessmentView,
)
from rest_framework.test import APIRequestFactory, force_authenticate


@override_settings(ALLOW_LOCAL_SQLITE_FALLBACK=True)
class MaleAssessmentOrchestrationTests(TestCase):
    def setUp(self):
        self.sb_patcher1 = patch("apps.intelligence.services.clinical_state_repository.get_supabase_client", return_value=None)
        self.sb_patcher2 = patch("apps.intelligence.services.assessment_repository.get_supabase_client", return_value=None)
        self.sb_patcher3 = patch("apps.health.services.supabase_health_service.health_service.fetch_all")
        mock_fetch = self.sb_patcher3.start()

        class MockProfile:
            gender = "male"
            age = None
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

    def test_male_tier1_api_direct_eligibility_enforcement(self):
        factory = APIRequestFactory()
        mock_user = MagicMock()
        mock_user.id = self.patient_uuid
        mock_user.raw_token = "mock-token"
        mock_user.is_authenticated = True

        base_payload = {
            "height_cm": 178.0,
            "weight_kg": 85.0,
            "waist_cm": 92.0,
            "low_energy": 1,
            "sleep_trouble": 0,
            "low_mood": 0,
            "low_interest": 0,
            "high_blood_pressure": 0,
            "diabetes": 0,
        }

        # 1. Underage (18) direct API request -> HTTP 400 Bad Request
        req_18 = factory.post("/api/v1/intelligence/assessment/male/tier1/", {**base_payload, "age": 18}, format="json")
        force_authenticate(req_18, user=mock_user)
        res_18 = MaleTier1AssessmentView.as_view()(req_18)
        self.assertEqual(res_18.status_code, 400)
        self.assertEqual(res_18.data.get("reason"), "age_under_19")
        self.assertFalse(res_18.data.get("eligible"))

        # Verify persistence prevention: Ineligible request must NEVER persist an active assessment
        active_after_18 = assessment_repository.get_active_assessment(self.patient_uuid, module="male_hypogonadism")
        self.assertIsNone(active_after_18, "Rejected assessment must not persist or create an active assessment record")

        # 2. Lower boundary (19) direct API request -> HTTP 200 OK
        req_19 = factory.post("/api/v1/intelligence/assessment/male/tier1/", {**base_payload, "age": 19}, format="json")
        force_authenticate(req_19, user=mock_user)
        res_19 = MaleTier1AssessmentView.as_view()(req_19)
        self.assertEqual(res_19.status_code, 200)
        self.assertIn("probability", res_19.data)

        # 3. Upper boundary (60) direct API request -> HTTP 200 OK
        req_60 = factory.post("/api/v1/intelligence/assessment/male/tier1/", {**base_payload, "age": 60}, format="json")
        force_authenticate(req_60, user=mock_user)
        res_60 = MaleTier1AssessmentView.as_view()(req_60)
        self.assertEqual(res_60.status_code, 200)
        self.assertIn("probability", res_60.data)

        # 4. Over 60 (61) direct API request -> HTTP 400 Bad Request
        req_61 = factory.post("/api/v1/intelligence/assessment/male/tier1/", {**base_payload, "age": 61}, format="json")
        force_authenticate(req_61, user=mock_user)
        res_61 = MaleTier1AssessmentView.as_view()(req_61)
        self.assertEqual(res_61.status_code, 400)
        self.assertEqual(res_61.data.get("reason"), "age_over_60")
        self.assertFalse(res_61.data.get("eligible"))

        # 5. Future DOB direct API request -> HTTP 400 Bad Request
        future_dob = "2030-01-01"
        req_future = factory.post("/api/v1/intelligence/assessment/male/tier1/", {**base_payload, "date_of_birth": future_dob, "age": None}, format="json")
        force_authenticate(req_future, user=mock_user)
        res_future = MaleTier1AssessmentView.as_view()(req_future)
        self.assertEqual(res_future.status_code, 400)
        self.assertEqual(res_future.data.get("reason"), "future_dob")

        # 6. Invalid / Corrupted DOB format -> HTTP 400 Bad Request
        req_corrupt = factory.post("/api/v1/intelligence/assessment/male/tier1/", {**base_payload, "date_of_birth": "invalid-calendar-date", "age": None}, format="json")
        force_authenticate(req_corrupt, user=mock_user)
        res_corrupt = MaleTier1AssessmentView.as_view()(req_corrupt)
        self.assertEqual(res_corrupt.status_code, 400)
        self.assertEqual(res_corrupt.data.get("reason"), "invalid_dob")

        # 7. Contradictory submitted age and DOB -> HTTP 400 Bad Request
        req_conflict = factory.post("/api/v1/intelligence/assessment/male/tier1/", {**base_payload, "date_of_birth": "2000-01-01", "age": 55}, format="json")
        force_authenticate(req_conflict, user=mock_user)
        res_conflict = MaleTier1AssessmentView.as_view()(req_conflict)
        self.assertEqual(res_conflict.status_code, 400)
        self.assertEqual(res_conflict.data.get("reason"), "conflicting_age_and_dob")

    def test_male_tier1_spoofed_age_on_ineligible_account_blocked(self):
        """
        Security verification: An existing user account with an ineligible profile DOB (e.g. age 17)
        CANNOT bypass screening by submitting a forged eligible age (e.g. 25) or fake DOB in the request body.
        """
        factory = APIRequestFactory()
        mock_user = MagicMock()
        mock_user.id = f"ineligible-account-{self.patient_uuid}"
        mock_user.raw_token = "mock-token"
        mock_user.is_authenticated = True

        from datetime import date
        today = date.today()
        # DOB that makes user exactly 17 years old
        ineligible_dob = f"{today.year - 17:04d}-{today.month:02d}-{today.day:02d}"

        class IneligibleProfile:
            gender = "male"
            date_of_birth = ineligible_dob
            age = 17
            height_cm = 175.0
            weight_kg = 75.0
            waist_cm = 85.0
            conditions = []
            mens_health = {}
            lifestyle = {}

        class IneligibleHealthData:
            profile = IneligibleProfile()
            medical_reports = []

        with patch("apps.health.services.supabase_health_service.health_service.fetch_all", return_value=IneligibleHealthData()):
            base_payload = {
                "height_cm": 175.0,
                "weight_kg": 75.0,
                "waist_cm": 85.0,
                "low_energy": 0,
                "sleep_trouble": 0,
                "low_mood": 0,
                "low_interest": 0,
                "high_blood_pressure": 0,
                "diabetes": 0,
            }

            # Attempt A: User makes request without age -> blocked by authoritative profile DOB (age 17)
            req_a = factory.post("/api/v1/intelligence/assessment/male/tier1/", base_payload, format="json")
            force_authenticate(req_a, user=mock_user)
            res_a = MaleTier1AssessmentView.as_view()(req_a)
            self.assertEqual(res_a.status_code, 400)
            self.assertEqual(res_a.data.get("reason"), "age_under_19")

            # Attempt B: User tries to spoof an eligible age (25) in request payload -> rejected due to profile conflict
            req_b = factory.post("/api/v1/intelligence/assessment/male/tier1/", {**base_payload, "age": 25}, format="json")
            force_authenticate(req_b, user=mock_user)
            res_b = MaleTier1AssessmentView.as_view()(req_b)
            self.assertEqual(res_b.status_code, 400)
            self.assertEqual(res_b.data.get("reason"), "conflicting_age_and_dob")

            # Attempt C: User tries to spoof a forged eligible DOB (1995-01-01) in request payload -> rejected due to profile conflict
            req_c = factory.post("/api/v1/intelligence/assessment/male/tier1/", {**base_payload, "date_of_birth": "1995-01-01"}, format="json")
            force_authenticate(req_c, user=mock_user)
            res_c = MaleTier1AssessmentView.as_view()(req_c)
            self.assertEqual(res_c.status_code, 400)
            self.assertEqual(res_c.data.get("reason"), "conflicting_age_and_dob")

            # Attempt D: User tries to send both forged age 25 and forged DOB 1995-01-01 -> rejected due to profile conflict
            req_d = factory.post("/api/v1/intelligence/assessment/male/tier1/", {**base_payload, "date_of_birth": "1995-01-01", "age": 25}, format="json")
            force_authenticate(req_d, user=mock_user)
            res_d = MaleTier1AssessmentView.as_view()(req_d)
            self.assertEqual(res_d.status_code, 400)
            self.assertEqual(res_d.data.get("reason"), "conflicting_age_and_dob")

            # Verify no assessment record was persisted for any of these attempts
            active_rec = assessment_repository.get_active_assessment(mock_user.id, module="male_hypogonadism")
            self.assertIsNone(active_rec, "Spoofed requests on ineligible account must never persist an assessment")

    def test_male_tier1_initial_onboarding_without_persisted_profile(self):
        """
        Initial onboarding support: Before profile persistence, user can submit a validated DOB.
        Eligible DOB (19–60) is accepted; ineligible DOB (<19 or >60) is rejected.
        """
        factory = APIRequestFactory()
        mock_user = MagicMock()
        mock_user.id = f"onboarding-new-{self.patient_uuid}"
        mock_user.raw_token = "mock-token"
        mock_user.is_authenticated = True

        class EmptyHealthData:
            profile = None
            medical_reports = []

        with patch("apps.health.services.supabase_health_service.health_service.fetch_all", return_value=EmptyHealthData()):
            from datetime import date
            today = date.today()
            valid_dob = f"{today.year - 25:04d}-{today.month:02d}-{today.day:02d}"
            underage_dob = f"{today.year - 18:04d}-{today.month:02d}-{today.day:02d}"

            base_payload = {
                "height_cm": 178.0,
                "weight_kg": 80.0,
                "waist_cm": 88.0,
                "low_energy": 0,
                "sleep_trouble": 0,
                "low_mood": 0,
                "low_interest": 0,
                "high_blood_pressure": 0,
                "diabetes": 0,
            }

            # 1. Eligible DOB during onboarding -> HTTP 200 OK
            req_ok = factory.post("/api/v1/intelligence/assessment/male/tier1/", {**base_payload, "date_of_birth": valid_dob}, format="json")
            force_authenticate(req_ok, user=mock_user)
            res_ok = MaleTier1AssessmentView.as_view()(req_ok)
            self.assertEqual(res_ok.status_code, 200)

            # 2. Ineligible DOB (18) during onboarding -> HTTP 400 Bad Request
            req_bad = factory.post("/api/v1/intelligence/assessment/male/tier1/", {**base_payload, "date_of_birth": underage_dob}, format="json")
            force_authenticate(req_bad, user=mock_user)
            res_bad = MaleTier1AssessmentView.as_view()(req_bad)
            self.assertEqual(res_bad.status_code, 400)
            self.assertEqual(res_bad.data.get("reason"), "age_under_19")

            # 3. Missing DOB & missing age during onboarding -> HTTP 400 Bad Request
            req_missing = factory.post("/api/v1/intelligence/assessment/male/tier1/", base_payload, format="json")
            force_authenticate(req_missing, user=mock_user)
            res_missing = MaleTier1AssessmentView.as_view()(req_missing)
            self.assertEqual(res_missing.status_code, 400)
            self.assertEqual(res_missing.data.get("reason"), "missing_age")

    def test_male_tier2_api_direct_eligibility_enforcement(self):
        factory = APIRequestFactory()
        mock_user = MagicMock()
        mock_user.id = self.patient_uuid
        mock_user.raw_token = "mock-token"
        mock_user.is_authenticated = True

        # Underage (18) direct Tier 2 API request -> HTTP 400 Bad Request
        t2_payload_18 = {**self.male_tier2_labs, "age": 18}
        req_t2_18 = factory.post("/api/v1/intelligence/assessment/male/tier2/", t2_payload_18, format="json")
        force_authenticate(req_t2_18, user=mock_user)
        res_t2_18 = MaleTier2AssessmentView.as_view()(req_t2_18)
        self.assertEqual(res_t2_18.status_code, 400)
        self.assertEqual(res_t2_18.data.get("reason"), "age_under_19")

        # Over 60 (61) direct Tier 2 API request -> HTTP 400 Bad Request
        t2_payload_61 = {**self.male_tier2_labs, "age": 61}
        req_t2_61 = factory.post("/api/v1/intelligence/assessment/male/tier2/", t2_payload_61, format="json")
        force_authenticate(req_t2_61, user=mock_user)
        res_t2_61 = MaleTier2AssessmentView.as_view()(req_t2_61)
        self.assertEqual(res_t2_61.status_code, 400)
        self.assertEqual(res_t2_61.data.get("reason"), "age_over_60")

        # Conflicting age and DOB in Tier 2 request -> HTTP 400 Bad Request
        t2_payload_conflict = {**self.male_tier2_labs, "date_of_birth": "2000-01-01", "age": 55}
        req_t2_conflict = factory.post("/api/v1/intelligence/assessment/male/tier2/", t2_payload_conflict, format="json")
        force_authenticate(req_t2_conflict, user=mock_user)
        res_t2_conflict = MaleTier2AssessmentView.as_view()(req_t2_conflict)
        self.assertEqual(res_t2_conflict.status_code, 400)
        self.assertEqual(res_t2_conflict.data.get("reason"), "conflicting_age_and_dob")

    def tearDown(self):
        self.sb_patcher1.stop()
        self.sb_patcher2.stop()
        self.sb_patcher3.stop()
