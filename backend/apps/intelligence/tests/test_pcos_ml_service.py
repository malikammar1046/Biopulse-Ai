import os
import sys
import unittest
from pathlib import Path

# Add backend directory to sys.path
BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

# Ensure Django settings are configured for standalone testing
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
import django
django.setup()

from apps.intelligence.services.pcos_ml_service import pcos_ml_service, TIER1_FEATURE_NAMES, TIER2_FEATURE_NAMES
from PIL import Image

class TestPCOSMLService(unittest.TestCase):
    def setUp(self):
        pcos_ml_service.load()

    def test_tier1_inference(self):
        sample_t1 = {
            'age': 24,
            'weight_kg': 54.0,
            'height_cm': 162.0,
            'waist_inch': 28.0,
            'hip_inch': 36.0,
            'cycle_length_raw': 28,
            'cycle_regularity': 0,
            'weight_gain': 0,
            'hirsutism': 0,
            'skin_darkening': 0,
            'hair_loss': 0,
            'pimples_acne': 0,
            'fast_food': 0,
            'regular_exercise': 1,
        }
        res = pcos_ml_service.predict_tier1(sample_t1)
        self.assertEqual(res['assessment_level'], 'tier_1')
        self.assertEqual(res['tiers_included'], [1])
        self.assertIn('probability', res)
        self.assertGreaterEqual(res['probability'], 0.0)
        self.assertLessEqual(res['probability'], 1.0)
        self.assertIn(res['risk_category'], ['lower', 'intermediate', 'higher'])
        self.assertIsInstance(res['explanations'], list)
        print("Tier 1 Test Result:", res['probability'], res['risk_category'], "Explanations count:", len(res['explanations']))

    def test_tier2_cumulative_inference(self):
        sample_t2 = {
            'age': 26,
            'weight_kg': 72.0,
            'height_cm': 158.0,
            'waist_inch': 36.0,
            'hip_inch': 40.0,
            'cycle_length_raw': 45,
            'cycle_regularity': 1,
            'weight_gain': 1,
            'hirsutism': 1,
            'skin_darkening': 1,
            'hair_loss': 1,
            'pimples_acne': 1,
            'fast_food': 1,
            'regular_exercise': 0,
            'pulse_rate_bpm': 78,
            'respiratory_rate': 18,
            'hemoglobin': 12.0,
            'beta_hcg_i': 1.2,
            'beta_hcg_ii': 1.1,
            'fsh': 4.5,
            'lh': 12.0,
            'tsh': 2.8,
            'amh': 7.5,
            'prolactin': 18.0,
            'vitamin_d3': 15.0,
            'progesterone': 0.4,
            'rbs': 105.0,
            'bp_systolic': 125,
            'bp_diastolic': 80,
        }
        res = pcos_ml_service.predict_tier2_cumulative(sample_t2)
        self.assertEqual(res['assessment_level'], 'tier_1_2')
        self.assertEqual(res['tiers_included'], [1, 2])
        self.assertIn('probability', res)
        self.assertGreaterEqual(res['probability'], 0.0)
        self.assertLessEqual(res['probability'], 1.0)
        print("Tier 2 Cumulative Test Result:", res['probability'], res['risk_category'], "Explanations count:", len(res['explanations']))

    def test_ultrasound_and_multimodal_inference(self):
        # Create a synthetic 224x224 grayscale/RGB ultrasound-like image
        img = Image.new('RGB', (224, 224), color=(60, 60, 60))
        img_res = pcos_ml_service.process_ultrasound_image(img)
        self.assertIn('pcom_probability', img_res)
        self.assertIn('pcom_status', img_res)

        sample_inputs = {
            'age': 25, 'weight_kg': 60, 'height_cm': 160, 'waist_inch': 30, 'hip_inch': 37,
            'cycle_length_raw': 30, 'cycle_regularity': 0, 'weight_gain': 0, 'hirsutism': 0,
            'skin_darkening': 0, 'hair_loss': 0, 'pimples_acne': 0, 'fast_food': 0, 'regular_exercise': 1,
            'pulse_rate_bpm': 72, 'respiratory_rate': 18, 'hemoglobin': 12.5, 'beta_hcg_i': 1.0,
            'beta_hcg_ii': 1.0, 'fsh': 5.5, 'lh': 5.0, 'tsh': 2.0, 'amh': 3.0, 'prolactin': 15.0,
            'vitamin_d3': 25.0, 'progesterone': 0.6, 'rbs': 90.0, 'bp_systolic': 115, 'bp_diastolic': 75
        }
        mm_res = pcos_ml_service.predict_tier1_2_3_multimodal(sample_inputs, img)
        self.assertEqual(mm_res['assessment_level'], 'tier_1_2_3')
        self.assertEqual(mm_res['tiers_included'], [1, 2, 3])
        self.assertIn('probability', mm_res)
        self.assertIn('pcom_status', mm_res)
        print("Multimodal Test Result:", mm_res['probability'], mm_res['risk_category'], "PCOM:", mm_res['pcom_status'])

    def test_screening_policy_v2_boundaries(self):
        """
        Verify exact boundary behavior for PCOS Screening Policy v2:
        - Lower: p < 0.18
        - Intermediate: 0.18 <= p < 0.25
        - Higher: p >= 0.25
        - Unrounded float precision verification
        - Missing/None/NaN safety (returns 'unavailable', never defaults to 'lower')
        """
        from apps.intelligence.services.pcos_ml_service import (
            PCOS_SCREENING_POLICY_VERSION,
            PCOS_LOWER_LIKELIHOOD_CUTOFF,
            PCOS_SCREENING_THRESHOLD,
            TIER1_SCREENING_THRESHOLD,
            TIER2_SCREENING_THRESHOLD,
            TIER3_PCOM_THRESHOLD,
            MULTIMODAL_SCREENING_THRESHOLD,
            classify_pcos_screening_likelihood,
        )
        import math

        # 1. Version and cutoff constants
        self.assertEqual(PCOS_SCREENING_POLICY_VERSION, "v2")
        self.assertEqual(PCOS_LOWER_LIKELIHOOD_CUTOFF, 0.18)
        self.assertEqual(PCOS_SCREENING_THRESHOLD, 0.25)
        self.assertEqual(TIER1_SCREENING_THRESHOLD, 0.25)
        self.assertEqual(TIER2_SCREENING_THRESHOLD, 0.25)
        self.assertEqual(TIER3_PCOM_THRESHOLD, 0.50)
        self.assertEqual(MULTIMODAL_SCREENING_THRESHOLD, 0.29)

        # 2. Exact boundary tests
        test_cases = [
            (0.0000, "lower", "Lower Likelihood"),
            (0.1799, "lower", "Lower Likelihood"),
            (0.1800, "intermediate", "Intermediate Likelihood"),
            (0.2000, "intermediate", "Intermediate Likelihood"),
            (0.2499, "intermediate", "Intermediate Likelihood"),
            (0.2500, "higher", "Higher Likelihood"),
            (0.5000, "higher", "Higher Likelihood"),
            (0.9000, "higher", "Higher Likelihood"),
            (1.0000, "higher", "Higher Likelihood"),
        ]
        for prob, expected_cat, expected_label in test_cases:
            cat, label = classify_pcos_screening_likelihood(prob)
            self.assertEqual(cat, expected_cat, f"Mismatch for prob {prob}: expected category {expected_cat}, got {cat}")
            self.assertEqual(label, expected_label, f"Mismatch for prob {prob}: expected label {expected_label}, got {label}")

        # 3. Probability precision: raw 0.2496 displays as 25% but MUST classify as Intermediate
        raw_prob = 0.2496
        self.assertEqual(round(raw_prob * 100), 25)  # Displays as 25%
        cat_raw, label_raw = classify_pcos_screening_likelihood(raw_prob)
        self.assertEqual(cat_raw, "intermediate", "Display rounding must NOT bleed into classification")
        self.assertEqual(label_raw, "Intermediate Likelihood")

        # 4. Missing data safety: None/NaN must return unavailable, NEVER lower
        cat_none, label_none = classify_pcos_screening_likelihood(None)
        self.assertEqual(cat_none, "unavailable")
        self.assertEqual(label_none, "Assessment Unavailable")

        cat_nan, label_nan = classify_pcos_screening_likelihood(math.nan)
        self.assertEqual(cat_nan, "unavailable")
        self.assertEqual(label_nan, "Assessment Unavailable")


if __name__ == '__main__':
    unittest.main()

