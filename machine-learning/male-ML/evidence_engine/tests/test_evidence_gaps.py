"""
tests/test_evidence_gaps.py
---------------------------
Unit tests for Completeness Calculation, Evidence Gap Engine,
timing uncertainty flags (TEST 6), and non-prescriptive clinical language.
"""

import os
import sys
import unittest

ENGINE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ENGINE_DIR not in sys.path:
    sys.path.insert(0, ENGINE_DIR)

from evidence_state import EvidenceState
from evidence_gaps import calculate_evidence_completeness, EvidenceGapEngine


class TestEvidenceGaps(unittest.TestCase):

    def setUp(self):
        self.state = EvidenceState(patient_id="patient_test", age=42)

    def test_completeness_categorization_and_indicator(self):
        """
        Verify information completeness distinguishes Core Tier 1, Core Tier 2,
        and Supporting without diagnosing confidence.
        """
        # Tier 1 only
        self.state.set_tier1_inputs(age=42, height_cm=178.0, weight_kg=85.0, waist_cm=98.0, low_energy=1)
        rep1 = calculate_evidence_completeness(self.state)

        self.assertTrue(rep1.core_tier1_complete)
        self.assertFalse(rep1.core_tier2_complete)
        self.assertIn("Total Testosterone Blood Test", rep1.core_missing)
        self.assertIn("LH Hormone (Pituitary Signaling)", rep1.core_missing)
        self.assertEqual(rep1.tier1_completeness_pct, 100.0)
        self.assertEqual(rep1.tier2_completeness_pct, 0.0)

        # Add Core Tier 2 analytes
        self.state.add_analyte("total_testosterone", 260.0, unit="ng/dL", collection_time="08:15")
        self.state.add_analyte("lh", 4.2, unit="mIU/mL")
        self.state.add_analyte("fsh", 5.1, unit="mIU/mL")

        rep2 = calculate_evidence_completeness(self.state)
        self.assertTrue(rep2.core_tier2_complete)
        self.assertEqual(len(rep2.core_missing), 0)
        self.assertGreater(rep2.percentage, 80.0)

    def test_06_missing_collection_time_identified(self):
        """
        TEST 6: Missing collection time.
        Verify evidence gap engine identifies timing uncertainty.
        """
        self.state.set_tier1_inputs(age=40, height_cm=180.0, weight_kg=80.0, waist_cm=90.0)
        # Add testosterone without collection time
        self.state.add_analyte("total_testosterone", 280.0, unit="ng/dL", collection_time=None)

        gaps = EvidenceGapEngine.identify_gaps(self.state)
        gap_keys = [g.gap_key for g in gaps]

        self.assertIn("unconfirmed_collection_time", gap_keys)
        time_gap = next(g for g in gaps if g.gap_key == "unconfirmed_collection_time")
        self.assertIn("8:00 AM and 10:00 AM", time_gap.guidance)
        print("\n[PASS] Test 6: Missing collection time identified as timing quality gap.")

    def test_non_morning_collection_alert(self):
        """Verify afternoon collection time triggers a non-morning timing gap."""
        self.state.set_tier1_inputs(age=40, height_cm=180.0, weight_kg=80.0, waist_cm=90.0)
        self.state.add_analyte("total_testosterone", 270.0, unit="ng/dL", collection_time="14:30")

        gaps = EvidenceGapEngine.identify_gaps(self.state)
        gap_keys = [g.gap_key for g in gaps]
        self.assertIn("non_morning_collection_alert", gap_keys)

    def test_two_test_requirement_gap_for_single_low_measurement(self):
        """
        Verify that a single low testosterone measurement flags the need for
        confirmatory repeat testing per clinical guidelines.
        """
        self.state.set_tier1_inputs(age=45, height_cm=175.0, weight_kg=85.0, waist_cm=96.0)
        self.state.add_analyte("total_testosterone", 240.0, unit="ng/dL", collection_time="08:20")

        gaps = EvidenceGapEngine.identify_gaps(self.state)
        gap_keys = [g.gap_key for g in gaps]
        self.assertIn("single_low_measurement_confirmatory_needed", gap_keys)

        # Once a second measurement is recorded, the gap is resolved
        self.state.add_testosterone_measurement(255.0, unit="ng/dL", collection_time="08:15")
        gaps_after = EvidenceGapEngine.identify_gaps(self.state)
        gap_keys_after = [g.gap_key for g in gaps_after]
        self.assertNotIn("single_low_measurement_confirmatory_needed", gap_keys_after)

    def test_non_prescriptive_language_audit(self):
        """
        Verify that all gap guidance adheres to non-prescriptive, safe language:
        Must NOT prescribe or order tests. Uses 'Clinical evaluation may consider...', etc.
        """
        self.state.set_tier1_inputs(age=45, height_cm=175.0, weight_kg=90.0)
        gaps = EvidenceGapEngine.identify_gaps(self.state)

        prohibited_prescriptions = ["you must take", "order this test immediately", "we prescribe", "take testosterone"]
        for g in gaps:
            text = (g.description + " " + g.clinical_rationale + " " + g.guidance).lower()
            for prohibited in prohibited_prescriptions:
                self.assertNotIn(prohibited, text)
            # Must contain non-prescriptive wording
            self.assertTrue(
                "clinical evaluation" in text
                or "healthcare professional" in text
                or "doctor" in text
                or "may consider" in text
                or "help" in text
            )


if __name__ == "__main__":
    unittest.main()
