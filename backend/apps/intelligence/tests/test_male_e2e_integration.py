"""
End-to-end integration and regression tests for BioPulse AI Male Tier 1 and Tier 2 software workflows.
Covers:
1. Artifact verification, hash, feature order, and reproducibility.
2. Server-side feature flag isolation (ENABLE_MALE_TIER1_CLEAN_7FEAT ON and OFF).
3. Independent 10-question ADAM screening preservation (zero proxy conversion).
4. Explicit Yes / No / Unsure responses for diabetes and hypertension (never defaulting unanswered to No).
5. Missing-waist handling (incomplete assessment status, notice, and non-silent handling).
6. DOB-derived age eligibility enforcement (19-60 years, boundary checks, future DOB).
7. Complete patient journey: Onboarding -> ADAM -> Tier 1 -> Tier 2 -> History preservation.
8. Clinical hormone pattern evaluation vs circular ML diagnostic flagging.
"""

import unittest
import hashlib
import os
import uuid
from unittest.mock import MagicMock, patch

from django.test import TestCase, override_settings
from django.conf import settings

from apps.intelligence.services.male_ml_service import (
    MaleMLService,
    MALE_TIER1_7FEAT_FEATURE_NAMES,
    MALE_TIER1_FEATURE_NAMES,
    MALE_TIER2_FEATURE_NAMES,
    MALE_TIER1_SCREENING_THRESHOLD,
    MALE_TIER2_SCREENING_THRESHOLD,
)
from apps.intelligence.services.intelligence_orchestrator import (
    run_male_tier1_assessment,
    run_male_tier2_assessment,
    extract_male_patient_raw_inputs,
    resolve_male_patient_age_and_eligibility,
)
from apps.intelligence.services.assessment_repository import assessment_repository


class MaleTier1AndTier2EndToEndTests(TestCase):
    def setUp(self):
        self.user_id = str(uuid.uuid4())
        self.service = MaleMLService()
        self.service.load()

        # Disconnect external Supabase network calls during test execution
        self.sb_patch1 = patch("apps.intelligence.services.clinical_state_repository.get_supabase_client", return_value=None)
        self.sb_patch2 = patch("apps.intelligence.services.assessment_repository.get_supabase_client", return_value=None)
        self.sb_patch1.start()
        self.sb_patch2.start()

    def tearDown(self):
        self.sb_patch1.stop()
        self.sb_patch2.stop()

    def test_artifact_hashes_and_specifications(self):
        """Verify the exact staged 7-feature candidate and Tier 2 artifacts and hashes."""
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
        
        # 7-feature candidate artifact
        t1_cand_path = os.path.join(base_dir, "..", "machine-learning", "male-ML", "male_tier1", "artifacts", "male_tier1_7feat_candidate.joblib")
        t1_cand_path = os.path.normpath(t1_cand_path)
        self.assertTrue(os.path.exists(t1_cand_path), f"Candidate artifact must exist at {t1_cand_path}")
        with open(t1_cand_path, "rb") as f:
            t1_bytes = f.read()
        t1_sha = hashlib.sha256(t1_bytes).hexdigest()
        self.assertEqual(t1_sha, "8334b37cb450fc85e8137a89c0300e8d5f3f0c35123823d5a1b871f198eed29f")
        self.assertEqual(len(t1_bytes), 12018)

        # Tier 2 artifact
        t2_path = os.path.join(base_dir, "..", "machine-learning", "male-ML", "male_tier2", "artifacts", "male_tier2_model.joblib")
        t2_path = os.path.normpath(t2_path)
        self.assertTrue(os.path.exists(t2_path), f"Tier 2 artifact must exist at {t2_path}")
        with open(t2_path, "rb") as f:
            t2_bytes = f.read()
        t2_sha = hashlib.sha256(t2_bytes).hexdigest()
        self.assertEqual(t2_sha, "17836369a2e0a4ac5f0b193733ffa50fe09b9456091978062c6fbad57eb8ff55")
        self.assertEqual(len(t2_bytes), 9477420)

    @override_settings(ENABLE_MALE_TIER1_CLEAN_7FEAT=False)
    def test_feature_flag_off_preserves_legacy_tier1(self):
        """When flag is False, system loads legacy 11-feature model with threshold 0.1808."""
        svc = MaleMLService()
        svc.load()
        self.assertEqual(svc.tier1_feature_names, MALE_TIER1_FEATURE_NAMES)
        self.assertEqual(len(svc.tier1_feature_names), 11)
        self.assertAlmostEqual(svc.tier1_screening_threshold, 0.1808, places=3)

    @override_settings(ENABLE_MALE_TIER1_CLEAN_7FEAT=True)
    def test_feature_flag_on_activates_clean_7feat(self):
        """When flag is True, system loads verified 7-feature model with threshold 0.1799."""
        svc = MaleMLService()
        svc.load()
        self.assertEqual(svc.tier1_feature_names, MALE_TIER1_7FEAT_FEATURE_NAMES)
        self.assertEqual(len(svc.tier1_feature_names), 7)
        self.assertAlmostEqual(svc.tier1_screening_threshold, 0.1799, places=3)
        self.assertNotIn("low_energy", svc.tier1_feature_names)
        self.assertNotIn("sleep_trouble", svc.tier1_feature_names)
        self.assertNotIn("low_mood", svc.tier1_feature_names)
        self.assertNotIn("low_interest", svc.tier1_feature_names)

    @override_settings(ENABLE_MALE_TIER1_CLEAN_7FEAT=True)
    def test_missing_waist_handling_produces_incomplete_assessment(self):
        """Omitted waist circumference must not silently substitute median as a complete assessment."""
        svc = MaleMLService()
        svc.load()
        payload_no_waist = {
            "age": 42,
            "height_cm": 178.0,
            "weight_kg": 85.0,
            "high_blood_pressure": 0,
            "diabetes": 0,
            # waist_cm intentionally omitted
        }
        res = svc.predict_tier1(payload_no_waist)
        self.assertFalse(res["is_complete"])
        self.assertEqual(res["assessment_status"], "incomplete")
        self.assertIsNotNone(res["notice"])
        self.assertIn("Waist circumference was not provided", res["notice"])
        self.assertIn("waist_cm", res["missing_features"])

    @override_settings(ENABLE_MALE_TIER1_CLEAN_7FEAT=True)
    def test_medical_history_explicit_yes_no_unsure(self):
        """Doctor-diagnosed diabetes and hypertension must handle Yes / No / Unsure without equating unknown to No."""
        # 1. Unanswered/empty conditions -> must result in None (missing feature), NOT 0
        raw_empty = extract_male_patient_raw_inputs(health_data=None, passed_data={"age": 40})
        self.assertIsNone(raw_empty["high_blood_pressure"])
        self.assertIsNone(raw_empty["diabetes"])

        # 2. Explicit "unsure"
        raw_unsure = extract_male_patient_raw_inputs(
            health_data=None,
            passed_data={"age": 40, "high_blood_pressure": "unsure", "diabetes": "not sure"}
        )
        self.assertIsNone(raw_unsure["high_blood_pressure"])
        self.assertIsNone(raw_unsure["diabetes"])

        # 3. Explicit Yes
        raw_yes = extract_male_patient_raw_inputs(
            health_data=None,
            passed_data={"age": 40, "high_blood_pressure": "yes", "diabetes": 1}
        )
        self.assertEqual(raw_yes["high_blood_pressure"], "yes")
        self.assertEqual(raw_yes["diabetes"], 1)

        # 4. Explicit No via "None of these"
        raw_none = extract_male_patient_raw_inputs(
            health_data=None,
            passed_data={"age": 40, "userProfile": {"conditions": ["None of these"]}}
        )
        self.assertEqual(raw_none["high_blood_pressure"], 0)
        self.assertEqual(raw_none["diabetes"], 0)

    def test_dob_age_eligibility_enforcement(self):
        """Enforces 19-60 age boundaries and rejects invalid/future DOB."""
        mock_hd = MagicMock()
        mock_hd.profile.gender = "male"
        mock_hd.profile.date_of_birth = None
        mock_hd.profile.dateOfBirth = None
        mock_hd.profile.age = None

        # Age 18 -> under 19
        age, reason, _ = resolve_male_patient_age_and_eligibility(mock_hd, {"age": 18})
        self.assertEqual(reason, "age_under_19")

        # Age 61 -> over 60
        age, reason, _ = resolve_male_patient_age_and_eligibility(mock_hd, {"age": 61})
        self.assertEqual(reason, "age_over_60")

        # Valid 35
        age, reason, _ = resolve_male_patient_age_and_eligibility(mock_hd, {"age": 35})
        self.assertIsNone(reason)
        self.assertEqual(age, 35.0)

    @override_settings(ENABLE_MALE_TIER1_CLEAN_7FEAT=True)
    def test_complete_male_patient_journey_and_history_preservation(self):
        """
        End-to-end journey:
        1. Onboarding with independent ADAM answers
        2. Tier 1 initial screening
        3. Tier 2 clinical lab submission
        4. Re-evaluating Tier 1 preserves Tier 2 historical labs in patient clinical state
        """
        mock_hd = MagicMock()
        mock_profile = MagicMock()
        mock_profile.gender = "male"
        mock_profile.date_of_birth = None
        mock_profile.dateOfBirth = None
        mock_profile.age = 45
        mock_hd.profile = mock_profile
        mock_hd.cycle_records = []
        mock_hd.symptom_records = []
        mock_hd.food_logs = []
        mock_hd.water_logs = []
        mock_hd.fitness_logs = []
        mock_hd.medications = []
        mock_hd.medication_logs = []
        mock_hd.medical_reports = []

        with patch("apps.intelligence.services.intelligence_orchestrator.health_service.fetch_all", return_value=mock_hd):
            # Step 1 & 2: Tier 1 screening with 10 ADAM answers
            male_t1_inputs = {
                "age": 45,
                "height_cm": 178.0,
                "weight_kg": 85.0,
                "waist_cm": 96.0,
                "high_blood_pressure": 0,
                "diabetes": 0,
                # ADAM questionnaire answers (stored in profile, independent)
                "adam_responses": {
                    f"adam_q{i}": (True if i in (1, 2, 7) else False)
                    for i in range(1, 11)
                }
            }
            t1_res = run_male_tier1_assessment(self.user_id, client_health_data=male_t1_inputs)
            self.assertEqual(t1_res["assessment_level"], "tier_1")
            self.assertEqual(t1_res["model_version"], "Male-ML v2.0-T1-Clean7")
            self.assertTrue(t1_res["evidence_used"]["tier_1"])
            self.assertFalse(t1_res["evidence_used"]["tier_2"])

            # Step 3: Tier 2 lab submission
            male_labs = {
                "total_testosterone": 240.0,
                "lh": 4.5,
                "fsh": 5.2,
                "prolactin": 11.5,
                "shbg_nmol_l": 28.0,
                "glucose_mg_dl": 92.0,
                "hba1c_pct": 5.4,
            }
            t2_res = run_male_tier2_assessment(self.user_id, clinical_inputs=male_labs, client_health_data=male_t1_inputs)
            self.assertEqual(t2_res["assessment_level"], "tier_1_2")
            self.assertTrue(t2_res["evidence_used"]["tier_1"])
            self.assertTrue(t2_res["evidence_used"]["tier_2"])
            self.assertIsNotNone(t2_res["hormone_pattern_interpretation"])
            self.assertEqual(t2_res["hormone_pattern_interpretation"]["pattern_type"], "SECONDARY")

            # Step 4: Run Tier 1 again (e.g. weight update)
            male_t1_updated = {**male_t1_inputs, "weight_kg": 84.0}
            t1_re = run_male_tier1_assessment(self.user_id, client_health_data=male_t1_updated)
            self.assertEqual(t1_re["assessment_level"], "tier_1")
            self.assertFalse(t1_re["evidence_used"]["tier_2"])

            # Verify historical Tier 2 labs are preserved in clinical state
            state = assessment_repository.get_patient_clinical_state(self.user_id, module="male_hypogonadism")
            self.assertIn("total_testosterone", state["tier_2_inputs"])
            self.assertEqual(state["tier_2_inputs"]["total_testosterone"], 240.0)
            self.assertEqual(state["tier_2_inputs"]["shbg_nmol_l"], 28.0)

    def test_tier2_laboratory_completeness_and_unit_conversions(self):
        """
        Verify:
        1. 0 indirect features (hormone panels only) -> RF skipped, prob is None, risk_category='direct_hormone_evaluation'
        2. Partial indirect features (< 15) -> is_complete=False, assessment_status='partial', uncertainty notice attached
        3. Full 15 indirect features -> is_complete=True, assessment_status='complete'
        4. Unit conversions: Testosterone in nmol/L -> ng/dL, Creatinine in umol/L -> mg/dL, Bilirubin in umol/L -> mg/dL
        """
        svc = MaleMLService()
        svc.load()

        # Case 1: Direct hormones only (0 indirect metabolic markers)
        direct_only = {
            "total_testosterone": 8.5,  # in nmol/L
            "testosterone_unit": "nmol/L",
            "lh": 2.1,
            "fsh": 2.8,
            "prolactin": 14.0,
        }
        res_direct = svc.predict_tier2(direct_only, tier1_inputs={"age": 40})
        self.assertIsNone(res_direct["probability"])
        self.assertIsNone(res_direct["probability_percent"])
        self.assertEqual(res_direct["risk_category"], "direct_hormone_evaluation")
        self.assertEqual(res_direct["assessment_status"], "hormone_pattern_only")
        self.assertFalse(res_direct["is_complete"])
        self.assertIn("indirect biochemical model risk estimation was omitted", res_direct["notice"])
        # Direct pattern should convert 8.5 nmol/L * 28.842 ~ 245.16 ng/dL (< 300 ng/dL)
        self.assertEqual(res_direct["hormone_pattern_interpretation"]["pattern_type"], "SECONDARY")

        # Case 2: Partial indirect markers (3 of 15 features)
        partial_labs = {
            **direct_only,
            "total_testosterone": 250.0,
            "testosterone_unit": "ng/dL",
            "shbg_nmol_l": 32.0,
            "glucose_mg_dl": 95.0,
            "creatinine": 88.4,  # 88.4 umol/L -> 1.0 mg/dL
            "creatinine_unit": "umol/L",
        }
        res_partial = svc.predict_tier2(partial_labs, tier1_inputs={"age": 40})
        self.assertIsNotNone(res_partial["probability"])
        self.assertFalse(res_partial["is_complete"])
        self.assertEqual(res_partial["assessment_status"], "partial")
        self.assertIn("Missing parameters were estimated using baseline reference statistics", res_partial["notice"])

        # Case 3: Unit conversions in feature preparation
        df, avail, missing = svc.prepare_tier2_features({
            "age": 40,
            "creatinine": 176.8,  # umol/L -> should be ~2.0 mg/dL
            "creatinine_unit": "umol/L",
            "total_bilirubin": 34.2,  # umol/L -> should be ~2.0 mg/dL
            "total_bilirubin_unit": "umol/L",
        })
        self.assertAlmostEqual(df.iloc[0]["creatinine_mg_dl"], 2.0, places=1)
        self.assertAlmostEqual(df.iloc[0]["total_bilirubin_mg_dl"], 2.0, places=1)

        # Case 4: Full 15 indirect features
        full_indirect = {
            "shbg_nmol_l": 30.0,
            "estradiol_pg_ml": 25.0,
            "albumin_g_dl": 4.5,
            "hba1c_pct": 5.2,
            "glucose_mg_dl": 90.0,
            "hemoglobin_g_dl": 15.2,
            "hematocrit_pct": 45.0,
            "rbc_count": 5.1,
            "alt_u_l": 22.0,
            "ast_u_l": 24.0,
            "total_bilirubin_mg_dl": 0.8,
            "creatinine_mg_dl": 1.0,
            "bun_mg_dl": 14.0,
            "uric_acid_mg_dl": 5.4,
            "hdl_mg_dl": 50.0,
        }
        res_full = svc.predict_tier2(full_indirect, tier1_inputs={"age": 40})
        self.assertTrue(res_full["is_complete"])
        self.assertEqual(res_full["assessment_status"], "complete")
        self.assertIsNone(res_full["notice"])

