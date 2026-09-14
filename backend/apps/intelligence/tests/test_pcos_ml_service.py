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

if __name__ == '__main__':
    unittest.main()
