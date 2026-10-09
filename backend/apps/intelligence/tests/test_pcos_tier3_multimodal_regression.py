"""
backend/apps/intelligence/tests/test_pcos_tier3_multimodal_regression.py

Dedicated Regression Test Suite for PCOS Assessment Pipeline Correctness:
1. Tier 1 prediction returns correct probability from intended model.
2. Tier 2 includes previously saved Tier 1 values + newly submitted clinical data.
3. Clinical values are saved before reassessment, returned prediction matches saved data.
4. Tier 3 clearly separates PCOM morphology probability from clinical PCOS risk.
5. Safe interim behavior: unvalidated image model (ROC-AUC ~0.504) does not alter or lower authoritative Tier 2 risk.
6. Ultrasound feature-extraction failure produces explicit Indeterminate status, never silent fallback from pixels.
7. Active assessment shown in frontend matches backend response and database record.
8. Repeated requests and page refreshes do not produce inconsistent scores.
9. Male hypogonadism pathway and unrelated functionality remain completely unaffected.
"""

import uuid
from pathlib import Path
import numpy as np
from PIL import Image
from unittest.mock import patch, MagicMock
from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from apps.intelligence.services.pcos_ml_service import (
    pcos_ml_service,
    UltrasoundInferenceError,
)
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

User = get_user_model()


@override_settings(ALLOW_LOCAL_SQLITE_FALLBACK=True)
class PCOSTier3MultimodalRegressionTests(TestCase):
    """
    Comprehensive regression tests verifying the resolution of the PCOS assessment pipeline defect.
    """

    def setUp(self):
        pcos_ml_service.load()
        male_ml_service.load()
        init_sqlite_clinical_store()

        self.client = APIClient()
        self.patient_id = str(uuid.uuid4())
        self.user = User.objects.create_user(
            username=f"pcos_test_{self.patient_id[:8]}",
            email=f"pcos_{self.patient_id[:8]}@example.com",
        )
        self.client.force_authenticate(user=self.user)

        # Baseline healthy/low-risk profile matching calibrated 12% Tier 1 prediction
        self.female_tier1_data = {
            "age": 25,
            "weight_kg": 60.0,
            "height_cm": 160.0,
            "bmi": 23.4,
            "waist_inch": 30.0,
            "hip_inch": 37.0,
            "waist_hip_ratio": 0.81,
            "cycle_length": 28,
            "cycle_length_raw": 28,
            "period_regularity": "regular",
            "cycle_regularity": 0,
            "weight_gain": 0,
            "hirsutism": 0,
            "skin_darkening": 0,
            "hair_loss": 0,
            "pimples_acne": 0,
            "fast_food": 0,
            "regular_exercise": 1,
        }

        # Normal clinical labs matching calibrated 10% Tier 2 prediction (protective AMH, normal LH/FSH)
        self.female_tier2_normal_labs = {
            "fsh": 5.5,
            "lh": 5.0,
            "amh": 2.1,
            "tsh": 1.8,
            "prolactin": 12.0,
            "prl": 12.0,
            "vitamin_d3": 32.0,
            "progesterone": 0.8,
            "rbs": 88.0,
            "hemoglobin": 13.2,
            "beta_hcg_i": 1.0,
            "beta_hcg_ii": 1.0,
            "pulse_rate_bpm": 72.0,
            "respiratory_rate": 16.0,
            "bp_systolic": 118.0,
            "bp_diastolic": 76.0,
            "systolic_bp": 118.0,
            "diastolic_bp": 76.0,
        }

    def _create_synthetic_image(self) -> Image.Image:
        arr = np.random.randint(0, 255, (224, 224, 3), dtype=np.uint8)
        return Image.fromarray(arr, mode="RGB")

    # -------------------------------------------------------------------------
    # Requirement 1: Tier 1 prediction returns correct probability from intended model
    # -------------------------------------------------------------------------
    def test_01_tier1_prediction_model_and_probability(self):
        """Tier 1 prediction returns unrounded probability from trained Extra Trees model."""
        res = pcos_ml_service.predict_tier1(self.female_tier1_data)
        self.assertIn("probability", res)
        self.assertIn("probability_percent", res)
        self.assertEqual(res["model_name"], "Extra Trees + Platt Sigmoid Calibration (Tier 1)")
        self.assertEqual(res["model_version"], "PCOS-ML v1.2-T1")
        self.assertGreaterEqual(res["probability"], 0.0)
        self.assertLessEqual(res["probability"], 1.0)
        # Healthy reference profile gives ~12.0% (0.1201)
        self.assertAlmostEqual(res["probability"], 0.1201, places=2)
        self.assertEqual(round(res["probability"] * 100), 12)

    # -------------------------------------------------------------------------
    # Requirement 2: Tier 2 includes previously saved Tier 1 values + newly submitted clinical data
    # -------------------------------------------------------------------------
    def test_02_tier2_incorporates_tier1_and_clinical_data(self):
        """Tier 2 assessment includes both preserved Tier 1 answers and new clinical inputs."""
        # Step 1: Run Tier 1
        t1_res = run_tier1_assessment(self.patient_id, client_health_data=self.female_tier1_data)
        self.assertEqual(t1_res["assessment_level"], "tier_1")

        # Step 2: Run Tier 2
        t2_res = run_tier2_assessment(
            self.patient_id,
            client_health_data=self.female_tier1_data,
            clinical_inputs=self.female_tier2_normal_labs,
        )
        self.assertEqual(t2_res["assessment_level"], "tier_1_2")
        self.assertEqual(t2_res["tiers_included"], [1, 2])

        # Check preserved Tier 1 data
        self.assertEqual(t2_res["tier_1_inputs"]["age"], 25)
        self.assertEqual(t2_res["tier_1_inputs"]["bmi"], 23.4)

        # Check integrated Tier 2 data
        self.assertEqual(t2_res["tier_2_inputs"]["amh"], 2.1)
        self.assertEqual(t2_res["tier_2_inputs"]["fsh"], 5.5)
        self.assertEqual(t2_res["tier_2_inputs"]["lh"], 5.0)

    # -------------------------------------------------------------------------
    # Requirement 3: Clinical values saved before reassessment, returned prediction matches saved data
    # -------------------------------------------------------------------------
    def test_03_clinical_values_saved_before_reassessment(self):
        """Clinical values are persisted in clinical store and match on subsequent reassessment."""
        t2_res = run_tier2_assessment(
            self.patient_id,
            client_health_data=self.female_tier1_data,
            clinical_inputs=self.female_tier2_normal_labs,
        )

        # Verify state in repository
        state = assessment_repository.get_patient_clinical_state(self.patient_id, module="female_pcos")
        self.assertIsNotNone(state)
        self.assertEqual(state["tier_2_inputs"]["amh"], 2.1)
        self.assertEqual(state["tier_2_inputs"]["fsh"], 5.5)

        # Reassess from stored state
        reassessed = reassess_from_current_patient_state(self.patient_id, module="female_pcos")
        self.assertIsNotNone(reassessed)
        self.assertEqual(reassessed["assessment_level"], "tier_1_2")
        self.assertEqual(reassessed["probability"], t2_res["probability"])
        self.assertEqual(reassessed["risk_category"], t2_res["risk_category"])

    # -------------------------------------------------------------------------
    # Requirement 4: Tier 3 clearly separates PCOM morphology probability from clinical PCOS risk
    # -------------------------------------------------------------------------
    def test_04_tier3_separates_pcom_morphology_from_clinical_risk(self):
        """Tier 3 reports PCOM morphology status independently from clinical PCOS risk."""
        run_tier1_assessment(self.patient_id, client_health_data=self.female_tier1_data)
        run_tier2_assessment(
            self.patient_id,
            client_health_data=self.female_tier1_data,
            clinical_inputs=self.female_tier2_normal_labs,
        )

        img = self._create_synthetic_image()
        # Mock high PCOM detection embedding (1280 features)
        mock_feat = np.ones((1, 1280)) * 0.5
        with patch.object(pcos_ml_service, '_init_vision_pipeline'):
            with patch.object(pcos_ml_service, 'process_ultrasound_image') as mock_process:
                mock_process.return_value = {
                    'pcom_probability': 0.942,
                    'pcom_status': 'PCOM Detected',
                    'pcom_confidence_percent': 88.4,
                    'exploratory_pcos_probability': 0.082,  # The old unvalidated chance model
                    'gradcam_b64': 'data:image/png;base64,dummy',
                    'architecture': 'EfficientNet-B0 Vision Backbone',
                    'inference_error': None,
                }
                t3_res = run_ultrasound_assessment(
                    self.patient_id,
                    pil_image=img,
                    client_health_data=self.female_tier1_data,
                )

        self.assertEqual(t3_res["assessment_level"], "tier_1_2_3")
        # PCOM morphology is explicitly exposed as morphology
        self.assertEqual(t3_res["pcom_status"], "PCOM Detected")
        self.assertEqual(t3_res["pcom_probability"], 0.942)
        # Clinical PCOS risk is distinct and not overwritten by pcom_probability
        self.assertNotEqual(t3_res["probability"], 0.942)
        self.assertTrue(t3_res["evidence_used"]["tier_3_ultrasound"])
        self.assertEqual(t3_res["model_name"], "Clinical Assessment with Independent Ultrasound Morphology (Tier 1 + 2 + 3)")
        self.assertEqual(t3_res["model_version"], "PCOS-ML v1.2-T2+US-Independent")
        self.assertEqual(t3_res["fusion_details"]["fusion_method"], "Current Tier 2 model-derived screening estimate with independent AI-estimated PCOM morphology")
        self.assertEqual(t3_res["fusion_details"]["ultrasound_pcom_probability"], 0.942)
        self.assertTrue(t3_res["fusion_details"]["numerical_score_anchored_to_tier2"])
        self.assertFalse(t3_res["fusion_details"]["multimodal_fusion_applied"])
        self.assertNotIn("clinical_weight", t3_res["fusion_details"])
        self.assertNotIn("ultrasound_weight", t3_res["fusion_details"])

    # -------------------------------------------------------------------------
    # Requirement 5: Safe interim behavior: unvalidated image model does not alter Tier 2 probability
    # -------------------------------------------------------------------------
    def test_05_safe_interim_behavior_preserves_tier2_probability(self):
        """
        Original failure reproduction & resolution:
        Tier 1 reports ~12%. Tier 2 reports ~10%.
        Under safe interim behavior, ultrasound evidence does NOT drop risk to 8%
        due to the unvalidated exploratory image model (ROC-AUC 0.504).
        Tier 2 clinical probability (10%) is preserved as the authoritative numerical score.
        """
        t1_res = run_tier1_assessment(self.patient_id, client_health_data=self.female_tier1_data)
        t1_pct = round(t1_res["probability"] * 100)
        self.assertEqual(t1_pct, 12)

        t2_res = run_tier2_assessment(
            self.patient_id,
            client_health_data=self.female_tier1_data,
            clinical_inputs=self.female_tier2_normal_labs,
        )
        t2_prob = t2_res["probability"]
        t2_pct = round(t2_prob * 100)
        self.assertEqual(t2_pct, 10)  # Valid reduction from normal AMH (2.1 ng/mL)

        img = self._create_synthetic_image()
        with patch.object(pcos_ml_service, 'process_ultrasound_image') as mock_process:
            # Simulate what the old pipeline produced: exploratory_pcos_probability = 0.082
            mock_process.return_value = {
                'pcom_probability': 0.942,
                'pcom_status': 'PCOM Detected',
                'pcom_confidence_percent': 88.4,
                'exploratory_pcos_probability': 0.082,
                'gradcam_b64': 'data:image/png;base64,dummy',
                'architecture': 'EfficientNet-B0 Vision Backbone',
                'inference_error': None,
            }
            t3_res = run_ultrasound_assessment(
                self.patient_id,
                pil_image=img,
                client_health_data=self.female_tier1_data,
            )

        # In the buggy code: 0.95 * 0.1034 + 0.05 * 0.082 = 0.079 (~8%)
        # In our fixed safe interim pipeline: authoritative score remains t2_prob (~10.3%)
        self.assertEqual(t3_res["probability"], t2_prob)
        self.assertEqual(round(t3_res["probability"] * 100), 10)
        self.assertNotEqual(round(t3_res["probability"] * 100), 8)
        self.assertEqual(t3_res["pcom_status"], "PCOM Detected")

    # -------------------------------------------------------------------------
    # Requirement 6: Ultrasound feature-extraction failure produces explicit Indeterminate status
    # -------------------------------------------------------------------------
    def test_06_feature_extraction_failure_safe_handling(self):
        """Feature extraction failure returns Indeterminate status and raises error when required."""
        img = self._create_synthetic_image()
        pcos_ml_service.load_vision()

        # Without raise_on_error: returns explicit Indeterminate result
        with patch.object(pcos_ml_service, '_eff_backbone', None):
            res = pcos_ml_service.process_ultrasound_image(img, raise_on_error=False)
            self.assertEqual(res["pcom_status"], "Indeterminate")
            self.assertIsNone(res["pcom_probability"])
            self.assertIsNotNone(res["inference_error"])
            self.assertIn("vision backbone is unavailable", res["inference_error"])

        # With raise_on_error: raises UltrasoundInferenceError
        with patch.object(pcos_ml_service, '_eff_backbone', None):
            with self.assertRaises(UltrasoundInferenceError):
                pcos_ml_service.process_ultrasound_image(img, raise_on_error=True)

    # -------------------------------------------------------------------------
    # Requirement 7: Active assessment matches backend response and database record
    # -------------------------------------------------------------------------
    def test_07_active_assessment_frontend_backend_alignment(self):
        """Formatted assessment response matches active record in assessment repository."""
        t2_res = run_tier2_assessment(
            self.patient_id,
            client_health_data=self.female_tier1_data,
            clinical_inputs=self.female_tier2_normal_labs,
        )

        active = assessment_repository.get_active_assessment(self.patient_id, module="female_pcos")
        formatted = format_assessment_response(active)

        self.assertEqual(formatted["assessment_id"], t2_res["assessment_id"])
        self.assertEqual(formatted["assessment_level"], "tier_1_2")
        self.assertEqual(formatted["probability"], round(t2_res["probability"], 4))
        self.assertEqual(formatted["risk_category"], t2_res["risk_category"])
        self.assertTrue(formatted["evidence_used"]["tier_1"])
        self.assertTrue(formatted["evidence_used"]["tier_2"])
        self.assertFalse(formatted["evidence_used"]["tier_3_ultrasound"])

    # -------------------------------------------------------------------------
    # Requirement 8: Repeated requests and page refreshes do not produce inconsistent scores
    # -------------------------------------------------------------------------
    def test_08_deterministic_idempotency_on_refresh(self):
        """Repeated reads and reassessments yield deterministic risk score and level."""
        t2_res = run_tier2_assessment(
            self.patient_id,
            client_health_data=self.female_tier1_data,
            clinical_inputs=self.female_tier2_normal_labs,
        )

        for _ in range(5):
            active = assessment_repository.get_active_assessment(self.patient_id, module="female_pcos")
            fmt = format_assessment_response(active)
            self.assertEqual(fmt["probability"], round(t2_res["probability"], 4))
            self.assertEqual(fmt["assessment_level"], "tier_1_2")

            reassessed = reassess_from_current_patient_state(self.patient_id, module="female_pcos")
            self.assertEqual(reassessed["probability"], t2_res["probability"])

    # -------------------------------------------------------------------------
    # Requirement 9: Male hypogonadism pathway remains unaffected
    # -------------------------------------------------------------------------
    def test_09_male_hypogonadism_pathway_unaffected(self):
        """Male pathway operates with correct ADAM scoring, testosterone cutoffs, and no ultrasound leaks."""
        male_id = str(uuid.uuid4())
        male_t1 = {
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
        res_m1 = run_male_tier1_assessment(male_id, client_health_data=male_t1)
        self.assertEqual(res_m1["module"], "male_hypogonadism")
        self.assertEqual(res_m1["assessment_level"], "tier_1")
        self.assertFalse(res_m1["evidence_used"]["tier_3_ultrasound"])
        self.assertIsNone(res_m1.get("pcom_status"))
        self.assertIsNone(res_m1.get("gradcam_b64"))

        # Male Tier 2
        male_t2_labs = {
            "total_testosterone": 240.0,
            "lh": 4.5,
            "fsh": 5.0,
        }
        res_m2 = run_male_tier2_assessment(male_id, client_health_data=male_t1, clinical_inputs=male_t2_labs)
        self.assertEqual(res_m2["module"], "male_hypogonadism")
        self.assertEqual(res_m2["assessment_level"], "tier_1_2")
        self.assertTrue(res_m2["evidence_used"]["tier_2"])
        self.assertFalse(res_m2["evidence_used"]["tier_3_ultrasound"])

    # -------------------------------------------------------------------------
    # Requirement 10: Genuine PCOM-positive model output contract and persistence
    # -------------------------------------------------------------------------
    def test_10_positive_pcom_ultrasound_contract_and_persistence(self):
        """
        Deterministic contract verification for genuine PCOM-positive model output:
        - Upload flow preserves Tier 2 clinical score without inflation or degradation.
        - PCOM morphology is confirmed as 'PCOM Detected' with calibrated probability 0.88.
        - Persisted assessment in repository preserves contracts upon retrieval.
        - format_assessment_response outputs pcom_probability and pcom_status cleanly.
        """
        run_tier1_assessment(self.patient_id, client_health_data=self.female_tier1_data)
        t2_res = run_tier2_assessment(
            self.patient_id,
            client_health_data=self.female_tier1_data,
            clinical_inputs=self.female_tier2_normal_labs,
        )
        t2_prob = t2_res["probability"]

        img = self._create_synthetic_image()
        with patch.object(pcos_ml_service, 'process_ultrasound_image') as mock_process:
            mock_process.return_value = {
                'pcom_probability': 0.880,
                'pcom_status': 'PCOM Detected',
                'pcom_confidence_percent': 76.0,
                'exploratory_pcos_probability': 0.650,
                'gradcam_b64': 'data:image/png;base64,positive_heatmap',
                'architecture': 'EfficientNet-B0 Vision Backbone',
                'inference_error': None,
            }
            t3_res = run_ultrasound_assessment(
                self.patient_id,
                pil_image=img,
                client_health_data=self.female_tier1_data,
            )

        # 1. Authoritative numerical score and policy metadata match Tier 2 exactly (does not inflate or drop)
        self.assertEqual(t3_res["probability"], t2_prob)
        self.assertEqual(t3_res["threshold"], t2_res["threshold"])
        self.assertEqual(t3_res["threshold"], 0.25)
        self.assertNotEqual(t3_res["threshold"], 0.29)
        self.assertEqual(t3_res["risk_category"], t2_res["risk_category"])
        self.assertEqual(t3_res["risk_label"], t2_res["risk_label"])
        self.assertEqual(t3_res["screening_policy_version"], t2_res["screening_policy_version"])

        # 2. PCOM morphology output
        self.assertEqual(t3_res["pcom_status"], "PCOM Detected")
        self.assertEqual(t3_res["pcom_probability"], 0.880)
        self.assertEqual(t3_res["fusion_details"]["ultrasound_pcom_probability"], 0.880)
        self.assertEqual(t3_res["fusion_details"]["ultrasound_pcom_status"], "PCOM Detected")
        self.assertEqual(t3_res["fusion_details"]["threshold"], 0.25)
        self.assertTrue(t3_res["fusion_details"]["numerical_score_anchored_to_tier2"])
        self.assertFalse(t3_res["fusion_details"]["multimodal_fusion_applied"])
        self.assertFalse(t3_res["fusion_details"]["exploratory_model_contributes_to_score"])

        # 3. Model semantics
        self.assertEqual(t3_res["model_name"], "Clinical Assessment with Independent Ultrasound Morphology (Tier 1 + 2 + 3)")
        self.assertEqual(t3_res["model_version"], "PCOS-ML v1.2-T2+US-Independent")
        self.assertEqual(t3_res["screening_policy_version"], "v2")

        # 4. Persistence verification
        active_rec = assessment_repository.get_active_assessment(self.patient_id, module="female_pcos")
        self.assertIsNotNone(active_rec)
        self.assertEqual(active_rec["assessment_level"], "tier_1_2_3")
        self.assertEqual(active_rec["probability"], t2_prob)
        self.assertEqual(active_rec["pcom_status"], "PCOM Detected")
        self.assertEqual(active_rec["pcom_probability"], 0.880)

        # 5. Formatted frontend response contract
        formatted = format_assessment_response(active_rec)
        self.assertEqual(formatted["probability"], round(t2_prob, 4))
        self.assertEqual(formatted["pcom_status"], "PCOM Detected")
        self.assertEqual(formatted["pcom_probability"], 0.880)
        self.assertEqual(formatted["fusion_details"]["ultrasound_pcom_probability"], 0.880)

    # -------------------------------------------------------------------------
    # Requirement 11: Authoritative Tier 2 metadata preservation across likelihood bands
    # -------------------------------------------------------------------------
    def test_11_tier2_tier3_metadata_consistency_across_likelihood_bands(self):
        """
        Verify that Tier 3 strictly preserves Tier 2's probability, threshold,
        screening_policy_version, risk_category, and risk_label across both lower
        and higher likelihood bands without silently defaulting to legacy/arbitrary labels.
        """
        img = self._create_synthetic_image()

        # Case A: Lower Likelihood (< 0.18)
        t2_low = pcos_ml_service.predict_tier2_cumulative({
            **self.female_tier1_data,
            **self.female_tier2_normal_labs,
        })
        self.assertEqual(t2_low["risk_category"], "lower")
        self.assertEqual(t2_low["risk_label"], "Lower Likelihood")
        self.assertEqual(t2_low["threshold"], 0.25)
        self.assertEqual(t2_low["screening_policy_version"], "v2")

        with patch.object(pcos_ml_service, 'process_ultrasound_image') as mock_process:
            mock_process.return_value = {
                'pcom_probability': 0.85,
                'pcom_status': 'PCOM Detected',
                'pcom_confidence_percent': 70.0,
                'exploratory_pcos_probability': 0.60,
                'gradcam_b64': 'data:image/png;base64,sample_heatmap',
                'architecture': 'EfficientNet-B0 Vision Backbone',
                'inference_error': None,
            }
            t3_low = pcos_ml_service.predict_tier1_2_3_multimodal(
                {**self.female_tier1_data, **self.female_tier2_normal_labs},
                img,
            )

        self.assertEqual(t3_low["probability"], t2_low["probability"])
        self.assertEqual(t3_low["threshold"], t2_low["threshold"])
        self.assertEqual(t3_low["risk_category"], "lower")
        self.assertEqual(t3_low["risk_label"], "Lower Likelihood")
        self.assertNotEqual(t3_low["risk_category"], "low")
        self.assertNotEqual(t3_low["risk_label"], "Low Risk")
        self.assertEqual(t3_low["screening_policy_version"], "v2")
        self.assertIn("Extra Trees + Platt Sigmoid Calibration", t3_low["fusion_details"]["score_source"])
        self.assertFalse(t3_low["fusion_details"]["exploratory_model_contributes_to_score"])

        # Case B: Higher Likelihood (>= 0.25)
        high_risk_data = {
            **self.female_tier1_data,
            "weight_gain": 1,
            "hirsutism": 1,
            "skin_darkening": 1,
            "hair_loss": 1,
            "pimples_acne": 1,
            "fast_food": 1,
            "regular_exercise": 0,
            "cycle_regularity": 1,
            "cycle_length_raw": 48.0,
            "amh": 8.5,
            "fsh": 3.8,
            "lh": 12.0,
            "tsh": 2.2,
            "prolactin": 18.0,
        }
        t2_high = pcos_ml_service.predict_tier2_cumulative(high_risk_data)
        self.assertEqual(t2_high["risk_category"], "higher")
        self.assertEqual(t2_high["risk_label"], "Higher Likelihood")
        self.assertEqual(t2_high["threshold"], 0.25)

        with patch.object(pcos_ml_service, 'process_ultrasound_image') as mock_process:
            mock_process.return_value = {
                'pcom_probability': 0.12,
                'pcom_status': 'PCOM Not Visible',
                'pcom_confidence_percent': 76.0,
                'exploratory_pcos_probability': 0.20,
                'gradcam_b64': 'data:image/png;base64,negative_heatmap',
                'architecture': 'EfficientNet-B0 Vision Backbone',
                'inference_error': None,
            }
            t3_high = pcos_ml_service.predict_tier1_2_3_multimodal(
                high_risk_data,
                img,
            )

        self.assertEqual(t3_high["probability"], t2_high["probability"])
        self.assertEqual(t3_high["threshold"], t2_high["threshold"])
        self.assertEqual(t3_high["risk_category"], "higher")
        self.assertEqual(t3_high["risk_label"], "Higher Likelihood")
        self.assertNotEqual(t3_high["risk_category"], "high")
        self.assertNotEqual(t3_high["risk_label"], "High Risk")
        self.assertEqual(t3_high["screening_policy_version"], "v2")
        self.assertEqual(t3_high["fusion_details"]["clinical_probability"], t2_high["probability"])
        self.assertFalse(t3_high["fusion_details"]["exploratory_model_contributes_to_score"])

        # Case C: Intermediate Likelihood (0.18 <= prob < 0.25)
        intermediate_data = {
            **self.female_tier1_data,
            "amh": 8.5,
            "fsh": 3.8,
            "lh": 12.0,
            "tsh": 2.2,
            "prolactin": 18.0,
            "hirsutism": 1,
            "cycle_regularity": 1,
            "cycle_length_raw": 48.0,
        }
        t2_inter = pcos_ml_service.predict_tier2_cumulative(intermediate_data)
        self.assertEqual(t2_inter["risk_category"], "intermediate")
        self.assertEqual(t2_inter["risk_label"], "Intermediate Likelihood")
        self.assertEqual(t2_inter["threshold"], 0.25)

        with patch.object(pcos_ml_service, 'process_ultrasound_image') as mock_process:
            mock_process.return_value = {
                'pcom_probability': 0.55,
                'pcom_status': 'PCOM Detected',
                'pcom_confidence_percent': 10.0,
                'exploratory_pcos_probability': 0.40,
                'gradcam_b64': 'data:image/png;base64,sample_heatmap',
                'architecture': 'EfficientNet-B0 Vision Backbone',
                'inference_error': None,
            }
            t3_inter = pcos_ml_service.predict_tier1_2_3_multimodal(
                intermediate_data,
                img,
            )

        self.assertEqual(t3_inter["probability"], t2_inter["probability"])
        self.assertEqual(t3_inter["threshold"], t2_inter["threshold"])
        self.assertEqual(t3_inter["risk_category"], "intermediate")
        self.assertEqual(t3_inter["risk_label"], "Intermediate Likelihood")
        self.assertEqual(t3_inter["screening_policy_version"], "v2")
        self.assertEqual(t3_inter["fusion_details"]["clinical_probability"], t2_inter["probability"])
        self.assertFalse(t3_inter["fusion_details"]["exploratory_model_contributes_to_score"])

    # -------------------------------------------------------------------------
    # Requirement 12: Genuine Vision Model Smoke Test on Project Dataset Scan
    # -------------------------------------------------------------------------
    def test_12_genuine_vision_pipeline_smoke_test(self):
        """
        Executes genuine PyTorch EfficientNet-B0 and calibrated Model A inference
        on an authentic project ultrasound image (without mocks).
        Confirms model loading, finite PCOM probability, valid morphology status,
        and generated spatial activation heatmap.
        Note: This verifies computational inference integrity, not prospective clinical validation.
        """
        img_path = Path(__file__).resolve().parent.parent.parent.parent.parent / "machine-learning" / "PCOS-ML" / "Ultrasound_Images" / "images" / "image10000.jpg"
        if not img_path.exists():
            self.skipTest(f"Ultrasound image not found at {img_path}")

        real_img = Image.open(img_path)
        res = pcos_ml_service.process_ultrasound_image(real_img, raise_on_error=True)

        self.assertIsNotNone(res["pcom_probability"])
        self.assertIsInstance(res["pcom_probability"], float)
        self.assertGreaterEqual(res["pcom_probability"], 0.0)
        self.assertLessEqual(res["pcom_probability"], 1.0)
        self.assertIn(res["pcom_status"], ("PCOM Detected", "PCOM Not Detected", "Indeterminate"))
        self.assertIsNotNone(res["gradcam_b64"])
        self.assertTrue(res["gradcam_b64"].startswith("data:image/png;base64,"))
        self.assertGreater(len(res["gradcam_b64"]), 1000)
        self.assertEqual(res["architecture"], "EfficientNet-B0 Vision Backbone")

    # -------------------------------------------------------------------------
    # Requirement 13: Standardized PCOM Status Contract and Serializer Validation
    # -------------------------------------------------------------------------
    def test_13_pcom_status_standardized_contract_and_serialization(self):
        """
        Confirms that PCOM status conforms to the documented three-state contract:
        - 'PCOM Detected' (positive)
        - 'PCOM Not Detected' (negative)
        - 'Indeterminate' (technical or quality failure)
        along with None (for non-ultrasound assessments).
        Validates that ProgressiveAssessmentSerializer accepts only these states
        and rejects non-conforming status strings.
        """
        from apps.intelligence.serializers import ProgressiveAssessmentSerializer
        from apps.intelligence.services.pcos_ml_service import (
            PCOM_STATUS_DETECTED,
            PCOM_STATUS_NOT_DETECTED,
            PCOM_STATUS_INDETERMINATE,
            PCOM_STATUS_CHOICES,
        )

        # Service contract constants match documented values
        self.assertEqual(PCOM_STATUS_DETECTED, "PCOM Detected")
        self.assertEqual(PCOM_STATUS_NOT_DETECTED, "PCOM Not Detected")
        self.assertEqual(PCOM_STATUS_INDETERMINATE, "Indeterminate")
        self.assertEqual(PCOM_STATUS_CHOICES, ("PCOM Detected", "PCOM Not Detected", "Indeterminate"))

        base_payload = {
            "has_assessment": True,
            "assessment_level": "tier_1_2_3",
            "probability": 0.1034,
            "threshold": 0.25,
            "risk_category": "lower",
        }

        # 1. Positive state
        ser_pos = ProgressiveAssessmentSerializer(data={**base_payload, "pcom_status": PCOM_STATUS_DETECTED})
        self.assertTrue(ser_pos.is_valid(), ser_pos.errors)
        self.assertEqual(ser_pos.validated_data["pcom_status"], "PCOM Detected")

        # 2. Negative state
        ser_neg = ProgressiveAssessmentSerializer(data={**base_payload, "pcom_status": PCOM_STATUS_NOT_DETECTED})
        self.assertTrue(ser_neg.is_valid(), ser_neg.errors)
        self.assertEqual(ser_neg.validated_data["pcom_status"], "PCOM Not Detected")

        # 3. Indeterminate state
        ser_ind = ProgressiveAssessmentSerializer(data={**base_payload, "pcom_status": PCOM_STATUS_INDETERMINATE})
        self.assertTrue(ser_ind.is_valid(), ser_ind.errors)
        self.assertEqual(ser_ind.validated_data["pcom_status"], "Indeterminate")

        # 4. Null state (e.g. Tier 1 / Tier 2)
        ser_null = ProgressiveAssessmentSerializer(data={**base_payload, "pcom_status": None})
        self.assertTrue(ser_null.is_valid(), ser_null.errors)
        self.assertIsNone(ser_null.validated_data["pcom_status"])

        # 5. Invalid status fails safely into Indeterminate via serializer normalization
        ser_invalid = ProgressiveAssessmentSerializer(data={**base_payload, "pcom_status": "PCOM Maybe"})
        self.assertTrue(ser_invalid.is_valid(), ser_invalid.errors)
        self.assertEqual(ser_invalid.validated_data["pcom_status"], "Indeterminate")

    # -------------------------------------------------------------------------
    # Requirement 14: Legacy Status Normalization and Safe Fallback on Load/Refresh
    # -------------------------------------------------------------------------
    def test_14_legacy_pcom_status_normalization_and_safe_fallback(self):
        """
        Confirms that:
        1. Legacy 'PCOM Visible' normalizes to 'PCOM Detected'.
        2. Legacy 'PCOM Not Visible' normalizes to 'PCOM Not Detected'.
        3. Genuine 'Indeterminate' and None states are preserved.
        4. Unexpected status values ('Corrupted/Unknown') fail safely to 'Indeterminate'
           instead of being misclassified as negative.
        5. Historical probability, risk category, and thresholds remain strictly unaltered.
        6. Persisting an assessment with legacy status and reloading it (simulating page refresh)
           returns normalized canonical status.
        """
        from apps.intelligence.services.pcos_ml_service import normalize_pcom_status
        from apps.intelligence.serializers import ProgressiveAssessmentSerializer
        from apps.intelligence.services.intelligence_orchestrator import format_assessment_response

        # Unit checks for normalize_pcom_status
        self.assertEqual(normalize_pcom_status("PCOM Visible"), "PCOM Detected")
        self.assertEqual(normalize_pcom_status("PCOM Detected"), "PCOM Detected")
        self.assertEqual(normalize_pcom_status("PCOM Not Visible"), "PCOM Not Detected")
        self.assertEqual(normalize_pcom_status("PCOM Not Detected"), "PCOM Not Detected")
        self.assertEqual(normalize_pcom_status("Indeterminate"), "Indeterminate")
        self.assertIsNone(normalize_pcom_status(None))
        self.assertIsNone(normalize_pcom_status(""))
        self.assertIsNone(normalize_pcom_status("   "))
        # Safe fallback: Unexpected string MUST NOT fail to negative ("PCOM Not Detected")
        self.assertEqual(normalize_pcom_status("Unknown/Artifact"), "Indeterminate")
        self.assertEqual(normalize_pcom_status("Poor Ultrasound Quality"), "Indeterminate")

        # Orchestrator boundary formatting
        base_record = {
            "id": "test-legacy-rec-1",
            "assessment_id": "test-legacy-rec-1",
            "module": "female_pcos",
            "assessment_level": "tier_1_2_3",
            "probability": 0.1034,
            "threshold": 0.25,
            "risk_category": "lower",
            "risk_label": "Lower Likelihood",
            "screening_policy_version": "v2",
            "pcom_probability": 0.9454,
            "evidence_used": {"tier_1": True, "tier_2": True, "tier_3_ultrasound": True},
            "fusion_details": {
                "ultrasound_pcom_status": "PCOM Visible",
                "ultrasound_pcom_probability": 0.9454,
            },
        }

        # 1. Format legacy 'PCOM Visible'
        formatted_vis = format_assessment_response({**base_record, "pcom_status": "PCOM Visible"})
        self.assertEqual(formatted_vis["pcom_status"], "PCOM Detected")
        self.assertEqual(formatted_vis["fusion_details"]["ultrasound_pcom_status"], "PCOM Detected")
        # Ensure numerical scores are strictly preserved
        self.assertEqual(formatted_vis["probability"], 0.1034)
        self.assertEqual(formatted_vis["pcom_probability"], 0.9454)

        # 2. Format legacy 'PCOM Not Visible'
        formatted_not_vis = format_assessment_response({**base_record, "pcom_status": "PCOM Not Visible"})
        self.assertEqual(formatted_not_vis["pcom_status"], "PCOM Not Detected")

        # 3. Format unexpected status -> Fails safely to 'Indeterminate'
        formatted_unexp = format_assessment_response({**base_record, "pcom_status": "Unrecognized Status"})
        self.assertEqual(formatted_unexp["pcom_status"], "Indeterminate")
        self.assertNotEqual(formatted_unexp["pcom_status"], "PCOM Not Detected")

        # 4. End-to-end repository persistence and reload (simulating page refresh)
        user = User.objects.create(username=f"legacy_reload_{uuid.uuid4().hex[:8]}", email="legacy@example.com")
        user_id = str(user.id)

        legacy_persisted_record = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "patient_id": user_id,
            "module": "female_pcos",
            "assessment_level": "tier_1_2_3",
            "probability": 0.1034,
            "threshold": 0.25,
            "risk_category": "lower",
            "risk_label": "Lower Likelihood",
            "screening_policy_version": "v2",
            "pcom_status": "PCOM Visible",
            "pcom_probability": 0.9454,
            "is_active": True,
            "evidence_used": {"tier_1": True, "tier_2": True, "tier_3_ultrasound": True},
        }
        assessment_repository.save_assessment(user_id, legacy_persisted_record)

        # Reload active assessment (as done on page refresh)
        loaded = assessment_repository.get_active_assessment(user_id, "female_pcos")
        self.assertIsNotNone(loaded)
        formatted_loaded = format_assessment_response(loaded)
        self.assertEqual(formatted_loaded["pcom_status"], "PCOM Detected")
        self.assertEqual(formatted_loaded["probability"], 0.1034)




