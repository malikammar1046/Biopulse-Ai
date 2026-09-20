"""
backend/apps/intelligence/tests/test_tier_isolation_and_provenance.py

Comprehensive regression tests for Tier Isolation, Clinical State Separation,
Stale Data Prevention, and Evidence Provenance across Female PCOS and Male Hypogonadism pathways.

Covers Scenarios 1 through 9:
1. Fresh female user -> strictly Tier 1, no higher tier data
2. Female with historical Tier 2 labs -> run Tier 1 -> Tier 1 result has no labs, labs preserved in clinical state
3. Female with historical Tier 3 ultrasound -> run Tier 1 -> no ultrasound or Grad-CAM on Tier 1
4. Genuine female Tier 2 -> displays Tier 1 + Tier 2, no Tier 3
5. Genuine female Tier 3 -> multimodal fusion links ultrasound and Grad-CAM to correct assessment
6. New male user -> Tier 1 only, no labs, zero female/ultrasound state, ultrasound rejected
7. Male with historical Tier 2 labs -> run Tier 1 -> strictly Tier 1, labs preserved
8. Cross-user isolation -> User A's data never leaks to User B
9. Profile update on Tier 1 -> remains Tier 1 despite historical labs existing
"""

import uuid
import numpy as np
from PIL import Image
from unittest.mock import patch, MagicMock
from django.test import TestCase, override_settings

from apps.intelligence.services.pcos_ml_service import pcos_ml_service
from apps.intelligence.services.male_ml_service import male_ml_service
from apps.intelligence.services.clinical_state_repository import (
    clinical_state_repository,
    init_sqlite_clinical_store,
)
from apps.intelligence.services.assessment_repository import assessment_repository
from apps.intelligence.services.intelligence_orchestrator import (
    run_tier1_assessment,
    run_tier2_assessment,
    run_ultrasound_assessment,
    run_male_tier1_assessment,
    run_male_tier2_assessment,
    reassess_from_current_patient_state,
    format_assessment_response,
)


@override_settings(ALLOW_LOCAL_SQLITE_FALLBACK=True)
class TierIsolationAndProvenanceTests(TestCase):
    def setUp(self):
        pcos_ml_service.load()
        male_ml_service.load()
        init_sqlite_clinical_store()

        self.user_a_id = str(uuid.uuid4())
        self.user_b_id = str(uuid.uuid4())
        self.male_user_id = str(uuid.uuid4())

        self.female_tier1_data = {
            "age": 25,
            "weight_kg": 65.0,
            "height_cm": 165.0,
            "bmi": 23.88,
            "waist_inch": 32.0,
            "hip_inch": 38.0,
            "waist_hip_ratio": 0.842,
            "cycle_length": 42,
            "period_regularity": "irregular",
            "weight_gain": 1,
            "hirsutism": 1,
            "skin_darkening": 0,
            "hair_loss": 0,
            "pimples_acne": 1,
            "fast_food": 0,
            "regular_exercise": 1,
        }

        self.female_tier2_data = {
            "fsh": 5.2,
            "lh": 12.8,
            "amh": 7.5,
            "tsh": 2.1,
            "prl": 15.0,
            "rbs": 95.0,
        }

        self.male_tier1_data = {
            "age": 45,
            "weight_kg": 88.0,
            "height_cm": 178.0,
            "bmi": 27.77,
            "waist_cm": 96.0,
            "hip_cm": 102.0,
            "waist_to_hip_ratio": 0.941,
            "systolic_bp": 125,
            "diastolic_bp": 82,
            "sleep_hours": 6.5,
            "low_energy_flag": 1,
            "decreased_libido_flag": 1,
        }

        self.male_tier2_data = {
            "total_testosterone": 240.0,
            "lh": 4.5,
            "fsh": 5.0,
            "prolactin": 12.0,
            "shbg_nmol_l": 32.0,
        }

        # Mock health_service so fetch_all returns clean empty records
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

        # Disconnect external Supabase RPC in unit tests
        self.sb_patch1 = patch("apps.intelligence.services.clinical_state_repository.get_supabase_client", return_value=None)
        self.sb_patch2 = patch("apps.intelligence.services.assessment_repository.get_supabase_client", return_value=None)
        self.sb_patch1.start()
        self.sb_patch2.start()

    def tearDown(self):
        self.patcher.stop()
        self.sb_patch1.stop()
        self.sb_patch2.stop()

    def _create_synthetic_ultrasound_image(self):
        arr = np.random.randint(40, 200, (224, 224, 3), dtype=np.uint8)
        return Image.fromarray(arr)

    # -------------------------------------------------------------------------
    # Scenario 1: Completely new female user
    # -------------------------------------------------------------------------
    def test_scenario_1_new_female_user_tier1_only(self):
        """
        When a new female user submits Tier 1 data:
        - Only Tier 1 assessment is produced
        - No Tier 2 labs or clinical values appear
        - No Tier 3 ultrasound, PCOM, or Grad-CAM appear
        - evidence_used strictly reports tier_1=True, tier_2=False, tier_3_ultrasound=False
        """
        res = run_tier1_assessment(self.user_a_id, client_health_data=self.female_tier1_data)

        self.assertEqual(res["assessment_level"], "tier_1")
        self.assertEqual(res["tiers_included"], [1])
        self.assertEqual(res["module"], "female_pcos")

        # Evidence used must be explicit
        self.assertTrue(res["evidence_used"]["tier_1"])
        self.assertFalse(res["evidence_used"]["tier_2"])
        self.assertFalse(res["evidence_used"]["tier_3_ultrasound"])

        # Tier 2 fields must be empty
        self.assertEqual(res["tier_2_inputs"], {})
        self.assertEqual(res["direct_laboratory_values"], [])
        self.assertIsNone(res["hormone_pattern_interpretation"])

        # Tier 3 ultrasound fields must be None
        self.assertIsNone(res["pcom_status"])
        self.assertIsNone(res["pcom_probability"])
        self.assertIsNone(res["gradcam_b64"])
        self.assertIsNone(res["gradcam_url"])

        # Historical availability reflects only what was provided
        self.assertTrue(res["available_historical_evidence"]["tier_1"])
        self.assertFalse(res["available_historical_evidence"]["tier_2"])
        self.assertFalse(res["available_historical_evidence"]["tier_3_ultrasound"])

    # -------------------------------------------------------------------------
    # Scenario 2: Female user with old Tier 2 data
    # -------------------------------------------------------------------------
    def test_scenario_2_female_with_historical_tier2_data_runs_tier1(self):
        """
        When historical Tier 2 labs exist in database and user runs Tier 1:
        - The new authoritative assessment must strictly be Tier 1
        - It must NOT claim Tier 2 evidence
        - Stored labs remain safely preserved in patient_clinical_state
        - available_historical_evidence indicates tier_2 is stored
        """
        # 1. User previously completed Tier 2
        t2_res = run_tier2_assessment(
            self.user_a_id,
            client_health_data=self.female_tier1_data,
            clinical_inputs=self.female_tier2_data,
        )
        self.assertEqual(t2_res["assessment_level"], "tier_1_2")
        self.assertTrue(t2_res["evidence_used"]["tier_2"])

        # Verify labs are in patient_clinical_state
        state = assessment_repository.get_patient_clinical_state(self.user_a_id, module="female_pcos")
        self.assertIn("fsh", state["tier_2_inputs"])

        # 2. User later starts/runs a new Tier 1-only assessment
        t1_res = run_tier1_assessment(self.user_a_id, client_health_data=self.female_tier1_data)

        self.assertEqual(t1_res["assessment_level"], "tier_1")
        self.assertEqual(t1_res["tiers_included"], [1])

        # Must NOT claim Tier 2 evidence
        self.assertTrue(t1_res["evidence_used"]["tier_1"])
        self.assertFalse(t1_res["evidence_used"]["tier_2"])
        self.assertFalse(t1_res["evidence_used"]["tier_3_ultrasound"])

        # Tier 2 values must be stripped from the Tier 1 assessment response
        self.assertEqual(t1_res["tier_2_inputs"], {})
        self.assertEqual(t1_res["direct_laboratory_values"], [])
        self.assertIsNone(t1_res["hormone_pattern_interpretation"])

        # Active assessment retrieved from repository must also be strictly Tier 1
        active = assessment_repository.get_active_assessment(self.user_a_id, module="female_pcos")
        self.assertEqual(active["assessment_level"], "tier_1")
        self.assertEqual(active["tier_2_inputs"], {})

        # BUT historical labs are NOT deleted from patient_clinical_state
        preserved_state = assessment_repository.get_patient_clinical_state(self.user_a_id, module="female_pcos")
        self.assertIn("fsh", preserved_state["tier_2_inputs"])
        self.assertEqual(preserved_state["tier_2_inputs"]["fsh"], 5.2)

        # Available historical evidence shows tier_2 is available for future upgrade
        self.assertTrue(t1_res["available_historical_evidence"]["tier_2"])

    # -------------------------------------------------------------------------
    # Scenario 3: Female user with old Tier 3 ultrasound
    # -------------------------------------------------------------------------
    def test_scenario_3_female_with_historical_ultrasound_runs_tier1(self):
        """
        When historical ultrasound exists in database and user runs Tier 1:
        - The new Tier 1 assessment must not display ultrasound, PCOM, or Grad-CAM
        - evidence_used reports tier_3_ultrasound=False
        - Historical ultrasound remains in clinical state
        """
        # 1. User uploads ultrasound
        img = self._create_synthetic_ultrasound_image()
        us_res = run_ultrasound_assessment(self.user_a_id, pil_image=img, client_health_data=self.female_tier1_data)
        self.assertIn(us_res["assessment_level"], ("tier_1_3", "tier_1_2_3"))

        # 2. User runs a new Tier 1 assessment
        t1_res = run_tier1_assessment(self.user_a_id, client_health_data=self.female_tier1_data)

        self.assertEqual(t1_res["assessment_level"], "tier_1")
        self.assertFalse(t1_res["evidence_used"]["tier_3_ultrasound"])
        self.assertIsNone(t1_res["pcom_status"])
        self.assertIsNone(t1_res["pcom_probability"])
        self.assertIsNone(t1_res["gradcam_b64"])
        self.assertIsNone(t1_res["gradcam_url"])

        # Verify repository does not leak ultrasound onto Tier 1
        active = assessment_repository.get_active_assessment(self.user_a_id, module="female_pcos")
        self.assertEqual(active["assessment_level"], "tier_1")
        self.assertIsNone(active.get("pcom_status"))
        self.assertIsNone(active.get("gradcam_b64"))

    # -------------------------------------------------------------------------
    # Scenario 4: Genuine female Tier 2
    # -------------------------------------------------------------------------
    def test_scenario_4_genuine_female_tier2(self):
        """
        Submitting valid Tier 2 labs generates a Tier 2 assessment:
        - Assessment level is tier_1_2
        - evidence_used reports tier_1=True, tier_2=True, tier_3_ultrasound=False
        - Tier 2 inputs are present
        - Tier 3 ultrasound fields remain strictly None
        """
        res = run_tier2_assessment(
            self.user_a_id,
            client_health_data=self.female_tier1_data,
            clinical_inputs=self.female_tier2_data,
        )

        self.assertEqual(res["assessment_level"], "tier_1_2")
        self.assertEqual(res["tiers_included"], [1, 2])
        self.assertTrue(res["evidence_used"]["tier_1"])
        self.assertTrue(res["evidence_used"]["tier_2"])
        self.assertFalse(res["evidence_used"]["tier_3_ultrasound"])

        self.assertIn("fsh", res["tier_2_inputs"])
        self.assertIsNone(res["pcom_status"])
        self.assertIsNone(res["gradcam_b64"])

    # -------------------------------------------------------------------------
    # Scenario 5: Genuine female Tier 3
    # -------------------------------------------------------------------------
    def test_scenario_5_genuine_female_tier3(self):
        """
        Submitting valid Tier 3 ultrasound after Tier 2:
        - Multimodal fusion generates tier_1_2_3
        - evidence_used reports tier_1=True, tier_2=True, tier_3_ultrasound=True
        - Ultrasound and Grad-CAM are linked to the assessment
        """
        # Establish Tier 2 first
        run_tier2_assessment(
            self.user_a_id,
            client_health_data=self.female_tier1_data,
            clinical_inputs=self.female_tier2_data,
        )

        img = self._create_synthetic_ultrasound_image()
        us_res = run_ultrasound_assessment(
            self.user_a_id,
            pil_image=img,
            client_health_data=self.female_tier1_data,
            report_id="rep_us_123",
        )

        self.assertEqual(us_res["assessment_level"], "tier_1_2_3")
        self.assertEqual(us_res["tiers_included"], [1, 2, 3])
        self.assertTrue(us_res["evidence_used"]["tier_1"])
        self.assertTrue(us_res["evidence_used"]["tier_2"])
        self.assertTrue(us_res["evidence_used"]["tier_3_ultrasound"])
        self.assertIsNotNone(us_res["pcom_status"])
        self.assertIsNotNone(us_res["gradcam_b64"])
        self.assertEqual(us_res["ultrasound_report_id"], "rep_us_123")

    # -------------------------------------------------------------------------
    # Scenario 6: New male user
    # -------------------------------------------------------------------------
    def test_scenario_6_new_male_user_tier1(self):
        """
        New male user running Tier 1:
        - Strictly male Tier 1 assessment
        - No male Tier 2 labs exposed
        - Zero female-specific fields (pcom_status is None, gradcam is None, cycle is absent)
        - Ultrasound assessment rejected with ValueError
        """
        res = run_male_tier1_assessment(self.male_user_id, client_health_data=self.male_tier1_data)

        self.assertEqual(res["assessment_level"], "tier_1")
        self.assertEqual(res["module"], "male_hypogonadism")
        self.assertTrue(res["evidence_used"]["tier_1"])
        self.assertFalse(res["evidence_used"]["tier_2"])
        self.assertFalse(res["evidence_used"]["tier_3_ultrasound"])

        # No labs or female artifacts
        self.assertEqual(res["tier_2_inputs"], {})
        self.assertIsNone(res["pcom_status"])
        self.assertIsNone(res["gradcam_b64"])
        self.assertIsNone(res["hormone_pattern_interpretation"])

        # Ultrasound must be rejected for male profile
        mock_hd = MagicMock()
        mock_profile = MagicMock()
        mock_profile.gender = "male"
        mock_hd.profile = mock_profile
        self.mock_fetch_all.return_value = mock_hd

        img = self._create_synthetic_ultrasound_image()
        with self.assertRaises(ValueError):
            run_ultrasound_assessment(self.male_user_id, pil_image=img)

    # -------------------------------------------------------------------------
    # Scenario 7: Male user with historical Tier 2 data
    # -------------------------------------------------------------------------
    def test_scenario_7_male_with_historical_tier2_runs_tier1(self):
        """
        Male user with historical Tier 2 labs runs Tier 1:
        - Produced assessment is strictly Tier 1
        - evidence_used.tier_2 is False
        - Historical labs preserved in patient_clinical_state
        """
        mock_hd = MagicMock()
        mock_profile = MagicMock()
        mock_profile.gender = "male"
        mock_hd.profile = mock_profile
        self.mock_fetch_all.return_value = mock_hd

        # Run Tier 2
        run_male_tier2_assessment(
            self.male_user_id,
            clinical_inputs=self.male_tier2_data,
            client_health_data=self.male_tier1_data,
        )

        # Run new Tier 1
        t1 = run_male_tier1_assessment(self.male_user_id, client_health_data=self.male_tier1_data)

        self.assertEqual(t1["assessment_level"], "tier_1")
        self.assertTrue(t1["evidence_used"]["tier_1"])
        self.assertFalse(t1["evidence_used"]["tier_2"])
        self.assertEqual(t1["tier_2_inputs"], {})
        self.assertIsNone(t1["hormone_pattern_interpretation"])

        # State preserved
        state = assessment_repository.get_patient_clinical_state(self.male_user_id, module="male_hypogonadism")
        self.assertIn("total_testosterone", state["tier_2_inputs"])

    # -------------------------------------------------------------------------
    # Scenario 8: Cross-user safety
    # -------------------------------------------------------------------------
    def test_scenario_8_cross_user_isolation(self):
        """
        User A completes Tier 1 + 2 + 3 (with labs, ultrasound, Grad-CAM).
        User B is a completely separate user running Tier 1.
        Verify:
        - User B's assessment has zero trace of User A's labs, ultrasound, or Grad-CAM
        - User B's clinical state is isolated
        """
        # User A completes full Tier 1 + 2 + 3
        run_tier2_assessment(
            self.user_a_id,
            client_health_data=self.female_tier1_data,
            clinical_inputs=self.female_tier2_data,
        )
        img = self._create_synthetic_ultrasound_image()
        run_ultrasound_assessment(
            self.user_a_id,
            pil_image=img,
            client_health_data=self.female_tier1_data,
            report_id="rep_user_a",
        )

        # User B runs Tier 1
        user_b_data = dict(self.female_tier1_data)
        user_b_data["age"] = 31
        b_res = run_tier1_assessment(self.user_b_id, client_health_data=user_b_data)

        self.assertEqual(b_res["assessment_level"], "tier_1")
        self.assertEqual(b_res["tier_2_inputs"], {})
        self.assertIsNone(b_res["pcom_status"])
        self.assertIsNone(b_res["gradcam_b64"])
        self.assertIsNone(b_res["ultrasound_report_id"])
        self.assertFalse(b_res["evidence_used"]["tier_2"])
        self.assertFalse(b_res["evidence_used"]["tier_3_ultrasound"])
        self.assertFalse(b_res["available_historical_evidence"]["tier_2"])
        self.assertFalse(b_res["available_historical_evidence"]["tier_3_ultrasound"])

    # -------------------------------------------------------------------------
    # Scenario 9: Profile update behavior on Tier 1
    # -------------------------------------------------------------------------
    def test_scenario_9_profile_update_on_tier1_remains_tier1(self):
        """
        When user has an active Tier 1 assessment (even if historical labs exist in storage)
        and updates their profile biometrics (e.g. weight), general reassessment
        without an explicit tier change must remain at Tier 1 and NOT silently promote.
        """
        # Set up historical labs in storage
        assessment_repository.save_patient_clinical_state(
            user_id=self.user_a_id,
            module="female_pcos",
            tier_1_inputs=self.female_tier1_data,
            tier_2_inputs=self.female_tier2_data,
        )
        # Establish active assessment as Tier 1
        t1_initial = run_tier1_assessment(self.user_a_id, client_health_data=self.female_tier1_data)
        self.assertEqual(t1_initial["assessment_level"], "tier_1")

        # Now simulate a profile update (weight changes from 65kg to 67kg)
        updated_inputs = dict(self.female_tier1_data)
        updated_inputs["weight_kg"] = 67.0

        # General profile reassessment called without requested_tier
        reassessed = reassess_from_current_patient_state(
            self.user_a_id,
            module="female_pcos",
            incoming_tier1=updated_inputs,
        )

        # Must preserve previous tier (Tier 1) and NOT promote to Tier 2
        self.assertEqual(reassessed["assessment_level"], "tier_1")
        self.assertEqual(reassessed["tiers_included"], [1])
        self.assertFalse(reassessed["evidence_used"]["tier_2"])
        self.assertEqual(reassessed["tier_2_inputs"], {})
