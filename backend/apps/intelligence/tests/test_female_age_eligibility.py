import os
import sys
from datetime import date
from pathlib import Path
from unittest.mock import patch, MagicMock

# Add backend directory to sys.path
BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

# Ensure Django settings are configured for standalone testing
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
import django
django.setup()

from django.test import TestCase, override_settings
from rest_framework.test import APIRequestFactory, force_authenticate

from apps.intelligence.services.female_eligibility_service import (
    evaluate_female_eligibility,
    FemaleEligibilityResult,
    PCOS_MODEL_MIN_AGE,
    PCOS_MODEL_MAX_AGE,
    FEMALE_ONBOARDING_MIN_AGE,
)
from apps.intelligence.services.intelligence_orchestrator import (
    reassess_from_current_patient_state,
    run_tier1_assessment,
    run_ultrasound_assessment,
)
from apps.intelligence.views import Tier1AssessmentView


@override_settings(ALLOW_LOCAL_SQLITE_FALLBACK=True)
class FemaleAgeEligibilityUnitTests(TestCase):
    def test_constants_grounded_in_evidence(self):
        self.assertEqual(PCOS_MODEL_MIN_AGE, 20)
        self.assertEqual(PCOS_MODEL_MAX_AGE, 48)
        self.assertEqual(FEMALE_ONBOARDING_MIN_AGE, 13)

    def test_missing_dob(self):
        res = evaluate_female_eligibility({}, {})
        self.assertFalse(res.is_valid_dob)
        self.assertEqual(res.eligibility_status, "missing_dob")
        self.assertFalse(res.can_run_ml_model)

    def test_future_dob(self):
        res = evaluate_female_eligibility({"date_of_birth": "2099-01-01"})
        self.assertFalse(res.is_valid_dob)
        self.assertEqual(res.eligibility_status, "future_dob")
        self.assertFalse(res.can_run_ml_model)

    def test_invalid_dob(self):
        res = evaluate_female_eligibility({"date_of_birth": "not-a-valid-date"})
        self.assertFalse(res.is_valid_dob)
        self.assertEqual(res.eligibility_status, "invalid_dob")

    def test_conflicting_age_and_dob(self):
        res = evaluate_female_eligibility(
            {"date_of_birth": "2000-01-01"},
            {"age": 35},
            ref_date=date(2026, 10, 10),
        )
        self.assertFalse(res.is_valid_dob)
        self.assertEqual(res.eligibility_status, "conflicting_age_and_dob")

    def test_pediatric_under_13_rejected(self):
        res = evaluate_female_eligibility(
            {"date_of_birth": "2014-05-10"},
            ref_date=date(2026, 10, 10),
        )
        self.assertTrue(res.is_valid_dob)
        self.assertEqual(res.age, 12.0)
        self.assertEqual(res.life_stage, "child_under_13")
        self.assertEqual(res.eligibility_status, "ineligible_child")
        self.assertFalse(res.can_run_ml_model)
        self.assertFalse(res.ultrasound_morphology_valid)

    def test_pre_menarche_normal_puberty(self):
        res = evaluate_female_eligibility(
            {"date_of_birth": "2013-05-10", "has_had_period": False},
            ref_date=date(2026, 10, 10),
        )
        self.assertEqual(res.age, 13.0)
        self.assertEqual(res.life_stage, "pre_menarche")
        self.assertEqual(res.eligibility_status, "pre_menarche_normal")
        self.assertFalse(res.can_run_ml_model)
        self.assertFalse(res.ultrasound_morphology_valid)

    def test_pre_menarche_delayed_primary_amenorrhea(self):
        res = evaluate_female_eligibility(
            {"date_of_birth": "2010-02-10", "has_had_period": False},
            ref_date=date(2026, 10, 10),
        )
        self.assertEqual(res.age, 16.0)
        self.assertEqual(res.life_stage, "pre_menarche")
        self.assertEqual(res.eligibility_status, "pre_menarche_delayed")
        self.assertIn("Primary Amenorrhea", res.title)
        self.assertFalse(res.can_run_ml_model)

    def test_early_adolescent_year1_developmental(self):
        res = evaluate_female_eligibility(
            {
                "date_of_birth": "2012-04-10",
                "has_had_period": True,
                "age_at_menarche": 14,
                "cycle_length": "irregular",
            },
            ref_date=date(2026, 10, 10),
        )
        self.assertEqual(res.age, 14.0)
        self.assertEqual(res.life_stage, "adolescent_early")
        self.assertEqual(res.eligibility_status, "adolescent_developmental")
        self.assertFalse(res.can_run_ml_model)
        self.assertFalse(res.ultrasound_morphology_valid)
        self.assertFalse(res.amh_valid)

    def test_mid_adolescent_cycle_boundaries(self):
        # 1-3 years post-menarche, 28 days -> regular
        res_reg = evaluate_female_eligibility(
            {
                "date_of_birth": "2011-04-10",
                "has_had_period": True,
                "age_at_menarche": 13,
                "cycle_length": 28,
            },
            ref_date=date(2026, 10, 10),
        )
        self.assertEqual(res_reg.life_stage, "adolescent_mid")
        self.assertEqual(res_reg.eligibility_status, "adolescent_developmental")
        self.assertFalse(res_reg.has_ovulatory_dysfunction)

        # 1-3 years post-menarche, 48 days -> abnormal >45 days
        res_irreg = evaluate_female_eligibility(
            {
                "date_of_birth": "2011-04-10",
                "has_had_period": True,
                "age_at_menarche": 13,
                "cycle_length": 48,
            },
            ref_date=date(2026, 10, 10),
        )
        self.assertEqual(res_irreg.life_stage, "adolescent_mid")
        self.assertTrue(res_irreg.has_ovulatory_dysfunction)
        self.assertEqual(res_irreg.eligibility_status, "adolescent_at_risk")

    def test_adolescent_both_criteria_met(self):
        res = evaluate_female_eligibility(
            {
                "date_of_birth": "2010-06-15",
                "has_had_period": True,
                "age_at_menarche": 13,
                "cycle_length": 50,
                "hirsutism": 8,
            },
            ref_date=date(2026, 10, 10),
        )
        self.assertEqual(res.life_stage, "adolescent_late")
        self.assertEqual(res.eligibility_status, "adolescent_at_risk")
        self.assertTrue(res.has_ovulatory_dysfunction)
        self.assertTrue(res.has_hyperandrogenism)
        self.assertIn("Adolescent PCOS Evaluation Warranted", res.title)
        self.assertFalse(res.ultrasound_morphology_valid)
        self.assertFalse(res.amh_valid)

    def test_adult_reproductive_in_distribution(self):
        res = evaluate_female_eligibility(
            {
                "date_of_birth": "1998-05-15",
                "has_had_period": True,
                "age_at_menarche": 13,
            },
            ref_date=date(2026, 10, 10),
        )
        self.assertEqual(res.age, 28.0)
        self.assertEqual(res.life_stage, "adult_reproductive")
        self.assertEqual(res.eligibility_status, "eligible_adult_ml")
        self.assertTrue(res.can_run_ml_model)
        self.assertTrue(res.ultrasound_morphology_valid)
        self.assertTrue(res.amh_valid)

    def test_young_adult_outside_training_distribution(self):
        res = evaluate_female_eligibility(
            {
                "date_of_birth": "2007-06-15",
                "has_had_period": True,
                "age_at_menarche": 12,
            },
            ref_date=date(2026, 10, 10),
        )
        self.assertEqual(res.age, 19.0)
        self.assertEqual(res.life_stage, "adult_young")
        self.assertEqual(res.eligibility_status, "eligible_young_adult")
        self.assertFalse(res.can_run_ml_model)
        self.assertIn("Young Adult", res.badge_label)

    def test_perimenopausal_guidance(self):
        res = evaluate_female_eligibility(
            {
                "date_of_birth": "1977-03-20",
                "has_had_period": True,
                "age_at_menarche": 13,
                "menopausal_status": "perimenopausal",
            },
            ref_date=date(2026, 10, 10),
        )
        self.assertEqual(res.age, 49.0)
        self.assertEqual(res.life_stage, "perimenopausal")
        self.assertEqual(res.eligibility_status, "perimenopausal_guidance")
        self.assertFalse(res.can_run_ml_model)

    def test_postmenopausal_guidance(self):
        res = evaluate_female_eligibility(
            {
                "date_of_birth": "1970-01-10",
                "has_had_period": True,
                "is_menopausal": True,
                "menopausal_status": "postmenopausal",
            },
            ref_date=date(2026, 10, 10),
        )
        self.assertEqual(res.age, 56.0)
        self.assertEqual(res.life_stage, "postmenopausal")
        self.assertEqual(res.eligibility_status, "postmenopausal_guidance")
        self.assertFalse(res.can_run_ml_model)


@override_settings(ALLOW_LOCAL_SQLITE_FALLBACK=True)
class FemaleOrchestrationIntegrationTests(TestCase):
    def setUp(self):
        self.sb_patcher1 = patch("apps.intelligence.services.clinical_state_repository.get_supabase_client", return_value=None)
        self.sb_patcher2 = patch("apps.intelligence.services.assessment_repository.get_supabase_client", return_value=None)
        self.sb_patcher3 = patch("apps.intelligence.services.intelligence_orchestrator.health_service.fetch_all")
        self.sb_patcher1.start()
        self.sb_patcher2.start()
        self.mock_fetch = self.sb_patcher3.start()

    def tearDown(self):
        self.sb_patcher1.stop()
        self.sb_patcher2.stop()
        self.sb_patcher3.stop()

    def test_reassess_adolescent_female_returns_guidance_without_ml_scores(self):
        class MockProfile:
            gender = "female"
            date_of_birth = "2010-06-15"  # 16 years old
            has_had_period = True
            age_at_menarche = 13
            cycle_length = 50
            hirsutism = 8

        mock_hd = MagicMock()
        mock_hd.profile = MockProfile()
        mock_hd.cycle_records = []
        mock_hd.symptom_records = []
        mock_hd.medical_reports = []
        self.mock_fetch.return_value = mock_hd

        res = reassess_from_current_patient_state(patient_uuid="test-female-adolescent", ref_date=date(2026, 10, 10))
        self.assertEqual(res.get("gender"), "female")
        self.assertEqual(res.get("risk_category"), "unavailable")
        self.assertIsNone(res.get("risk_probability"))
        self.assertEqual(res.get("life_stage"), "adolescent_late")
        self.assertEqual(res.get("unavailable_reason"), "adolescent_at_risk")
        self.assertIn("Adolescent", res.get("badge_label"))
        self.assertFalse(res.get("ultrasound_morphology_valid"))
        self.assertFalse(res.get("amh_valid"))

    def test_run_ultrasound_rejects_adolescent_morphology(self):
        class MockProfile:
            gender = "female"
            date_of_birth = "2011-04-10"  # 15 years old

        mock_hd = MagicMock()
        mock_hd.profile = MockProfile()
        mock_hd.cycle_records = []
        mock_hd.symptom_records = []
        mock_hd.medical_reports = []
        self.mock_fetch.return_value = mock_hd

        mock_image = MagicMock()
        mock_image.size = 1000

        with self.assertRaises(ValueError) as ctx:
            run_ultrasound_assessment(
                patient_uuid="test-female-adolescent",
                pil_image=mock_image,
                ref_date=date(2026, 10, 10),
            )
        self.assertIn("pelvic ultrasound ovarian morphology must NOT be used for PCOS screening in adolescents", str(ctx.exception))

    def test_view_tier1_rejects_child_under_13(self):
        factory = APIRequestFactory()
        view = Tier1AssessmentView.as_view()

        request = factory.post(
            "/api/intelligence/tier1/",
            {"gender": "female", "date_of_birth": "2015-01-01"},
            format="json",
        )
        user = MagicMock()
        user.is_authenticated = True
        user.id = "test-user-child"
        force_authenticate(request, user=user)

        with patch("apps.intelligence.views.run_tier1_assessment") as mock_run:
            from rest_framework.exceptions import ValidationError
            mock_run.side_effect = ValidationError("BioPulse AI screening models are calibrated for individuals aged 13 and older.")
            response = view(request)
            self.assertEqual(response.status_code, 400)
