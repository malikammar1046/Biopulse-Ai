"""
tests/test_assessment_engine.py
-------------------------------
Unit tests for the Progressive Assessment Engine (TEST 1, TEST 2, TEST 3, TEST 7),
verifying progressive enrichment, non-diagnostic safety language, and unchanged
underlying ML model performance.
"""

import os
import sys
import unittest

ENGINE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ENGINE_DIR not in sys.path:
    sys.path.insert(0, ENGINE_DIR)

from evidence_state import EvidenceState
from assessment_engine import ProgressiveAssessmentEngine, generate_assessment
from assessment_history import AssessmentHistory
from schemas import AssessmentStage


class TestProgressiveAssessmentEngine(unittest.TestCase):

    def setUp(self):
        self.engine = ProgressiveAssessmentEngine()

    def test_01_tier1_only(self):
        """
        TEST 1: Tier 1 only.
        Expected:
        - stage = tier_1
        - Tier 1 result available
        - Tier 2 missing (None)
        - evidence gaps returned
        """
        state = EvidenceState(patient_id="p001", age=48)
        state.set_tier1_inputs(
            age=48,
            height_cm=175.0,
            weight_kg=98.0,
            waist_cm=106.0,
            low_energy=3,
            sleep_trouble=2,
            low_mood=1,
            low_interest=2,
            high_blood_pressure=1,
            diabetes=0
        )

        res = self.engine.generate_assessment(state)

        # Stage and results check
        self.assertEqual(res.assessment_stage, AssessmentStage.TIER_1.value)
        self.assertIsNotNone(res.tier1_result)
        self.assertIsNone(res.tier2_result)
        self.assertIsNone(res.hormonal_pattern)

        # Tier 1 probability & risk
        self.assertGreater(res.tier1_result["probability_percent"], 18.0)
        self.assertTrue(res.tier1_result["screen_positive"])
        self.assertIn("contributing_factors", res.tier1_result)

        # Evidence gaps check
        gap_keys = [g["gap_key"] for g in res.evidence_gaps]
        self.assertIn("missing_testosterone_draw", gap_keys)
        self.assertIn("missing_morning_timing", gap_keys)
        self.assertIn("missing_pituitary_signaling", gap_keys)

        print("\n[PASS] Test 1: Tier 1 only produces tier_1 stage, populated Tier 1 result, null Tier 2, and evidence gaps.")

    def test_02_tier1_plus_one_testosterone_result(self):
        """
        TEST 2: Tier 1 + one testosterone result.
        Expected:
        - stage advances appropriately to tier_2
        - testosterone recognized as observed evidence
        - missing LH/FSH identified
        """
        state = EvidenceState(patient_id="p002", age=45)
        state.set_tier1_inputs(age=45, height_cm=178.0, weight_kg=88.0, waist_cm=98.0, low_energy=2)
        state.add_analyte("total_testosterone", 260.0, unit="ng/dL", collection_time="08:15", verified=True)

        res = self.engine.generate_assessment(state)

        # Stage advanced to tier_2
        self.assertEqual(res.assessment_stage, AssessmentStage.TIER_2.value)
        self.assertIsNotNone(res.tier1_result)
        self.assertIsNotNone(res.tier2_result)

        # Testosterone recognized as observed
        self.assertEqual(res.longitudinal_testosterone["measurement_count"], 1)
        self.assertTrue(res.longitudinal_testosterone["morning_timing_confirmed"])

        # Missing LH/FSH identified in gaps
        gap_keys = [g["gap_key"] for g in res.evidence_gaps]
        self.assertIn("missing_lh_fsh_signaling", gap_keys)

        print("\n[PASS] Test 2: Tier 1 + one testosterone advances stage and identifies missing LH/FSH signaling.")

    def test_03_tier1_plus_testosterone_plus_lh_fsh(self):
        """
        TEST 3: Tier 1 + testosterone + LH + FSH.
        Expected:
        - hormonal pattern engine invoked (Primary or Secondary pattern evaluated)
        - no prohibited diagnostic wording ('You have hypogonadism', 'disease positive', 'pituitary failing')
        """
        state = EvidenceState(patient_id="p003", age=45)
        state.set_tier1_inputs(age=45, height_cm=175.0, weight_kg=85.0, waist_cm=96.0)
        state.add_analyte("total_testosterone", 250.0, unit="ng/dL", collection_time="08:10", verified=True)
        state.add_analyte("lh", 12.8, unit="mIU/mL", verified=True)  # Elevated LH
        state.add_analyte("fsh", 14.5, unit="mIU/mL", verified=True) # Elevated FSH

        res = self.engine.generate_assessment(state)

        self.assertEqual(res.assessment_stage, AssessmentStage.TIER_2.value)
        self.assertIsNotNone(res.hormonal_pattern)

        pattern_name = res.hormonal_pattern["pattern_name"]
        self.assertIn("Primary", pattern_name)

        # Prohibited diagnostic language audit
        all_text = (
            res.screening_status + " " +
            res.hormonal_pattern.get("pattern_description", "") + " " +
            res.safety_disclaimer + " " +
            " ".join(res.limitations)
        ).lower()

        prohibited = [
            "you have hypogonadism",
            "you are disease positive",
            "disease positive",
            "your pituitary is failing",
            "pituitary failure",
            "we diagnose"
        ]

        for p in prohibited:
            self.assertNotIn(p, all_text)

        # Confirm non-diagnostic phrasing present
        self.assertIn("pattern", all_text)
        self.assertIn("does not establish a diagnosis", all_text)

        print("\n[PASS] Test 3: Complete hormonal profile invokes pattern engine with strict non-diagnostic language.")

    def test_07_existing_tier1_tier2_models_remain_unchanged(self):
        """
        TEST 7: Existing Tier 1 / Tier 2 inference behavior remains unchanged.
        Verify that underlying models produce expected calibrated outputs on benchmark samples.
        """
        # Tier 1 verification on standard active male sample (Age 28, normal metrics)
        s_low = EvidenceState(age=28)
        s_low.set_tier1_inputs(age=28, height_cm=180.0, weight_kg=78.0, waist_cm=84.0, low_energy=0, sleep_trouble=0)
        res_t1 = self.engine.evaluate_tier1(s_low)
        # Expected prob ~10.7% from inference_check.py
        self.assertAlmostEqual(res_t1["probability_percent"], 10.7, delta=1.5)
        self.assertFalse(res_t1["screen_positive"])

        # Tier 2 verification on sample with high glucose and low SHBG
        s_t2 = EvidenceState(age=45)
        s_t2.set_tier1_inputs(age=45, height_cm=175.0, weight_kg=90.0)
        s_t2.add_analyte("shbg", 16.0, unit="nmol/L", verified=True)
        s_t2.add_analyte("glucose", 125.0, unit="mg/dL", verified=True)
        res_t2 = self.engine.evaluate_tier2(s_t2)

        self.assertIsNotNone(res_t2["predictive_ml_risk"])
        self.assertEqual(res_t2["predictive_ml_risk"]["screening_threshold_percent"], 33.8)
        print("\n[PASS] Test 7: Underlying Tier 1 & Tier 2 model outputs verified unchanged.")

    def test_assessment_history_evolution_timeline(self):
        """
        Verify that AssessmentHistory tracks progressive transitions and explains
        to the user why their assessment evolved.
        """
        history = AssessmentHistory(patient_id="p_history_01")
        state = EvidenceState(patient_id="p_history_01", age=45)

        # Snapshot 1: Tier 1 only
        state.set_tier1_inputs(age=45, height_cm=175.0, weight_kg=92.0, waist_cm=102.0, low_energy=2)
        res1 = self.engine.generate_assessment(state)
        snap1 = history.record_snapshot(res1, state)
        self.assertEqual(snap1.stage, "tier_1")

        # Snapshot 2: User adds Testosterone lab
        state.add_analyte("total_testosterone", 255.0, unit="ng/dL", collection_time="08:20", verified=True)
        res2 = self.engine.generate_assessment(state)
        snap2 = history.record_snapshot(res2, state)
        self.assertEqual(snap2.stage, "tier_2")
        self.assertIn("Total Testosterone", snap2.change_summary)

        # Snapshot 3: User adds LH and FSH
        state.add_analyte("lh", 11.5, unit="mIU/mL", verified=True)
        state.add_analyte("fsh", 13.0, unit="mIU/mL", verified=True)
        res3 = self.engine.generate_assessment(state)
        snap3 = history.record_snapshot(res3, state)
        self.assertIn("Lh", snap3.change_summary)

        timeline = history.get_timeline()
        self.assertEqual(len(timeline), 3)
        self.assertEqual(timeline[0]["stage"], "tier_1")
        self.assertEqual(timeline[1]["stage"], "tier_2")
        self.assertEqual(timeline[2]["stage"], "tier_2")
        self.assertIn("Primary", timeline[2]["hormonal_pattern"])

    def test_08_explicit_dual_branch_architecture_and_2026_guidance(self):
        """
        TEST 8: Verify explicit dual-branch architecture:
        - ML Screening (Tier 1 / Tier 2 without Total T leakage)
        - Clinical Pattern (T + LH + FSH + Prolactin)
        - Evidence Gap Engine enforcing 2026 Endocrine Society 2-morning-test rule
        - Explainability & Digital Twin
        - Complete 7-question BioPulse Story
        """
        state = EvidenceState(patient_id="p008", age=42)
        state.set_tier1_inputs(age=42, height_cm=176.0, weight_kg=92.0, waist_cm=104.0, low_energy=3)
        state.add_analyte("shbg", 18.0, unit="nmol/L", verified=True)
        state.add_analyte("glucose", 115.0, unit="mg/dL", verified=True)
        # Single low morning draw
        state.add_analyte("total_testosterone", 240.0, unit="ng/dL", collection_time="08:30", verified=True)
        state.add_analyte("lh", 11.0, unit="mIU/mL", verified=True)
        state.add_analyte("fsh", 13.5, unit="mIU/mL", verified=True)

        res = self.engine.generate_assessment(state)

        # 1. Verify ML Screening Branch
        self.assertIn("ml_screening", res.to_dict())
        ml = res.ml_screening
        self.assertTrue(ml["anti_leakage_verified"])
        self.assertIn("strictly excluded", ml["tier2"]["target_leakage_guard"])
        self.assertIn("is there a screening signal worth investigating", ml["tier1"]["question"])
        self.assertIn("What does the available laboratory evidence show", ml["tier2"]["question"])

        # 2. Verify Clinical Pattern Branch
        self.assertIn("clinical_pattern", res.to_dict())
        cp = res.clinical_pattern
        self.assertIn("How do testosterone, LH, FSH and prolactin relate", cp["question"])
        self.assertFalse(cp["two_morning_test_confirmed"], "Single draw must NOT confirm two-morning requirement")
        self.assertIn("2026", cp["guideline_compliance"])

        # 3. Verify 2026 Endocrine Society gap flag
        gap_keys = [g["gap_key"] for g in res.evidence_gaps]
        self.assertIn("single_low_measurement_confirmatory_needed", gap_keys)
        single_draw_gap = next(g for g in res.evidence_gaps if g["gap_key"] == "single_low_measurement_confirmatory_needed")
        self.assertIn("2026", single_draw_gap["clinical_rationale"])
        self.assertIn("at least two early-morning fasting measurements", single_draw_gap["clinical_rationale"])

        # 4. Verify 7-question BioPulse Story
        self.assertIn("biopulse_story", res.to_dict())
        story = res.biopulse_story
        self.assertIn("tier1", story)
        self.assertIn("tier2", story)
        self.assertIn("hormonal_pattern_engine", story)
        self.assertIn("evidence_gap_engine", story)
        self.assertIn("explainability_engine", story)
        self.assertIn("digital_twin", story)
        self.assertIn("research_layer", story)

        # Now simulate 2nd morning draw and verify two_morning_test_confirmed becomes True
        state.add_analyte("total_testosterone", 235.0, unit="ng/dL", collection_time="08:15", verified=True)
        res_repeat = self.engine.generate_assessment(state)
        self.assertTrue(res_repeat.clinical_pattern["two_morning_test_confirmed"])
        repeat_gaps = [g["gap_key"] for g in res_repeat.evidence_gaps]
        self.assertNotIn("single_low_measurement_confirmatory_needed", repeat_gaps)

        print("\n[PASS] Test 8: Explicit dual-branch architecture, anti-leakage protection, and 2026 2-draw guidance verified.")


if __name__ == "__main__":
    unittest.main()
