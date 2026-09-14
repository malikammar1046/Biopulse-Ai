"""
backend/apps/intelligence/tests/test_tier2_partial_assessment.py
Unit tests for Partial Tier 2 Clinical & Laboratory Assessment Integration in PCOS-ML.
"""

import math
import numpy as np
import pandas as pd
from django.test import TestCase

from apps.intelligence.services.pcos_ml_service import (
    pcos_ml_service,
    TIER2_SCREENING_THRESHOLD,
    TIER2_CLINICAL_INPUT_FIELDS,
)
from apps.intelligence.services.intelligence_orchestrator import (
    run_tier1_assessment,
    run_tier2_assessment,
    validate_clinical_value,
    CLINICAL_FIELD_RANGES,
)
from apps.intelligence.services.assessment_repository import assessment_repository


class Tier2PartialAssessmentTests(TestCase):
    """
    Test suite for partial Tier 2 clinical and laboratory features,
    imputation behavior, PATCH updates, evidence completeness, and history preservation.
    """

    def setUp(self):
        pcos_ml_service.load()
        self.patient_uuid = "test-patient-partial-tier2-uuid-001"
        self.tier1_profile = {
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

    def test_single_tier2_value_submission(self):
        """Tier 2 submission with exactly one available value succeeds and executes real ML inference."""
        t1_res = run_tier1_assessment(
            self.patient_uuid,
            client_health_data=self.tier1_profile,
        )
        self.assertEqual(t1_res["assessment_level"], "tier_1")
        self.assertTrue(t1_res["is_active"])

        # Submit only TSH = 2.5
        t2_res = run_tier2_assessment(
            self.patient_uuid,
            client_health_data=self.tier1_profile,
            clinical_inputs={"tsh": 2.5},
        )

        self.assertEqual(t2_res["assessment_level"], "tier_1_2")
        self.assertTrue(t2_res["is_active"])
        self.assertEqual(t2_res["replaced_assessment_id"], t1_res["id"])
        self.assertIsInstance(t2_res["probability"], float)
        self.assertTrue(0.0 <= t2_res["probability"] <= 1.0)
        self.assertFalse(math.isnan(t2_res["probability"]))
        self.assertEqual(t2_res["threshold"], TIER2_SCREENING_THRESHOLD)
        self.assertEqual(t2_res["tier_2_available_count"], 1)
        self.assertEqual(t2_res["tier_2_total_count"], len(TIER2_CLINICAL_INPUT_FIELDS))
        self.assertIn("tsh", t2_res["tier_2_available_fields"])
        self.assertNotIn("tsh", t2_res["tier_2_missing_fields"])
        self.assertAlmostEqual(
            t2_res["evidence_completeness_percent"],
            round((1 / len(TIER2_CLINICAL_INPUT_FIELDS)) * 100, 2),
            places=2,
        )
        self.assertIn(
            "This assessment used the available clinical results. Additional laboratory evidence may refine the estimate.",
            t2_res["limitations"],
        )

    def test_several_missing_values_and_imputer_preservation(self):
        """Multiple missing values are passed as NaN and handled natively by the saved pipeline imputer."""
        raw_inputs = {
            **self.tier1_profile,
            "tsh": 3.1,
            "amh": 7.4,
            "rbs": 110.0,
            # Remaining 12 Tier 2 features are omitted (missing)
        }

        df_t2 = pcos_ml_service.prepare_tier2_features(raw_inputs)
        # Check that missing columns are NaN, not 0
        self.assertTrue(np.isnan(df_t2["fsh"].iloc[0]))
        self.assertTrue(np.isnan(df_t2["lh"].iloc[0]))
        self.assertTrue(np.isnan(df_t2["fsh_lh_ratio"].iloc[0]))
        self.assertTrue(np.isnan(df_t2["prolactin"].iloc[0]))
        self.assertTrue(np.isnan(df_t2["vitamin_d3"].iloc[0]))
        self.assertEqual(df_t2["tsh"].iloc[0], 3.1)
        self.assertEqual(df_t2["amh"].iloc[0], 7.4)
        self.assertEqual(df_t2["rbs"].iloc[0], 110.0)

        # Predict probability directly
        pred = pcos_ml_service.predict_tier2_cumulative(raw_inputs)
        self.assertTrue(0.0 <= pred["probability"] <= 1.0)
        self.assertFalse(math.isnan(pred["probability"]))
        self.assertEqual(pred["tier_2_available_count"], 3)
        self.assertIn("tsh", pred["tier_2_available_fields"])
        self.assertIn("amh", pred["tier_2_available_fields"])
        self.assertIn("rbs", pred["tier_2_available_fields"])

    def test_actual_zero_distinct_from_missing(self):
        """An actual numeric zero (e.g. beta_hcg_i = 0.0) is preserved as 0.0, not converted to NaN."""
        raw_with_zero = {
            **self.tier1_profile,
            "beta_hcg_i": 0.0,
            "progesterone": 0.0,
        }
        df = pcos_ml_service.prepare_tier2_features(raw_with_zero)
        self.assertEqual(df["beta_hcg_i"].iloc[0], 0.0)
        self.assertEqual(df["progesterone"].iloc[0], 0.0)
        self.assertTrue(np.isnan(df["tsh"].iloc[0]))

    def test_invalid_values_rejected(self):
        """Out-of-range or negative values are rejected with informative ValueError."""
        # Negative value
        with self.assertRaises(ValueError) as cm:
            validate_clinical_value("tsh", -1.5)
        self.assertIn("outside medically plausible range", str(cm.exception))

        # Implausibly high value
        with self.assertRaises(ValueError) as cm2:
            validate_clinical_value("rbs", 1200.0)
        self.assertIn("outside medically plausible range", str(cm2.exception))

        # Non-numeric garbage
        with self.assertRaises(ValueError) as cm3:
            validate_clinical_value("fsh", "not-a-number")
        self.assertIn("must be a valid number", str(cm3.exception))

    def test_zero_tier2_values_rejected(self):
        """Submitting Tier 2 with no clinical measurements raises a clean validation error."""
        with self.assertRaises(ValueError) as cm:
            run_tier2_assessment(
                "patient-no-tier2",
                client_health_data=self.tier1_profile,
                clinical_inputs={},
            )
        self.assertIn("At least one valid clinical or laboratory measurement is required", str(cm.exception))

    def test_patch_style_merge_and_progressive_completion(self):
        """Adding additional laboratory tests progressively merges with previous Tier 2 data without wiping omitted fields."""
        patient_id = "test-patient-patch-merge-002"

        # Step 1: Initial Tier 2 submission with TSH and AMH
        t2_step1 = run_tier2_assessment(
            patient_id,
            client_health_data=self.tier1_profile,
            clinical_inputs={"tsh": 2.4, "amh": 6.8},
        )
        self.assertEqual(t2_step1["tier_2_available_count"], 2)
        self.assertIn("tsh", t2_step1["tier_2_available_fields"])
        self.assertIn("amh", t2_step1["tier_2_available_fields"])
        self.assertEqual(t2_step1["tier_2_inputs"]["tsh"], 2.4)
        self.assertEqual(t2_step1["tier_2_inputs"]["amh"], 6.8)

        # Step 2: Later user adds FSH, LH, and RBS (omits TSH and AMH in payload)
        t2_step2 = run_tier2_assessment(
            patient_id,
            client_health_data=self.tier1_profile,
            clinical_inputs={"fsh": 5.2, "lh": 6.1, "rbs": 98.0},
        )

        # All 5 fields must be present in merged result
        self.assertEqual(t2_step2["tier_2_available_count"], 5)
        self.assertEqual(t2_step2["tier_2_inputs"]["tsh"], 2.4)  # Preserved from previous!
        self.assertEqual(t2_step2["tier_2_inputs"]["amh"], 6.8)  # Preserved from previous!
        self.assertEqual(t2_step2["tier_2_inputs"]["fsh"], 5.2)
        self.assertEqual(t2_step2["tier_2_inputs"]["lh"], 6.1)
        self.assertEqual(t2_step2["tier_2_inputs"]["rbs"], 98.0)
        self.assertEqual(t2_step2["replaced_assessment_id"], t2_step1["id"])

        # Check history preserves previous assessment
        history = assessment_repository.get_assessment_history(patient_id)
        self.assertEqual(len(history), 2)
        active_records = [h for h in history if h.get("is_active")]
        self.assertEqual(len(active_records), 1)
        self.assertEqual(active_records[0]["id"], t2_step2["id"])

    def test_explicit_field_removal(self):
        """User can explicitly remove a previously saved value using remove_fields."""
        patient_id = "test-patient-explicit-remove-003"

        # Step 1: Submit TSH and AMH
        run_tier2_assessment(
            patient_id,
            client_health_data=self.tier1_profile,
            clinical_inputs={"tsh": 2.4, "amh": 6.8},
        )

        # Step 2: Add RBS and explicitly remove TSH
        t2_step2 = run_tier2_assessment(
            patient_id,
            client_health_data=self.tier1_profile,
            clinical_inputs={
                "rbs": 95.0,
                "remove_fields": ["tsh"],
            },
        )

        self.assertNotIn("tsh", t2_step2["tier_2_inputs"])
        self.assertIn("amh", t2_step2["tier_2_inputs"])
        self.assertIn("rbs", t2_step2["tier_2_inputs"])
        self.assertEqual(t2_step2["tier_2_available_count"], 2)

    def test_completeness_distinct_from_confidence(self):
        """Evidence completeness metadata is calculated purely from test counts, not prediction confidence."""
        res = pcos_ml_service.predict_tier2_cumulative({
            **self.tier1_profile,
            "tsh": 2.2,
        })
        self.assertIn("evidence_completeness_percent", res)
        # Completeness is 1/15 = 6.67%
        self.assertAlmostEqual(res["evidence_completeness_percent"], 6.67, places=1)
        # Probability is the model's calibrated probability (e.g. > 0.50), not 6.67%
        self.assertNotEqual(res["probability"], res["evidence_completeness_percent"])
        self.assertTrue(0.0 <= res["probability"] <= 1.0)
