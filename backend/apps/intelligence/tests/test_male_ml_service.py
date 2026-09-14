"""
backend/apps/intelligence/tests/test_male_ml_service.py
Real model inference tests for Male Hypogonadism Screening (Tier 1 and Tier 2).
"""

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

from apps.intelligence.services.male_ml_service import (
    male_ml_service,
    MALE_TIER1_FEATURE_NAMES,
    MALE_TIER2_FEATURE_NAMES,
    MALE_TIER1_SCREENING_THRESHOLD,
    MALE_TIER2_SCREENING_THRESHOLD,
)


class TestMaleMLService(unittest.TestCase):
    def setUp(self):
        male_ml_service.load()

    def test_models_loaded_and_ready(self):
        self.assertTrue(male_ml_service.is_ready)
        self.assertIsNotNone(male_ml_service.tier1_pipeline)
        self.assertIsNotNone(male_ml_service.tier2_pipeline)
        self.assertEqual(len(MALE_TIER1_FEATURE_NAMES), 11)
        self.assertEqual(len(MALE_TIER2_FEATURE_NAMES), 16)

    def test_tier1_low_risk_case(self):
        low_risk_data = {
            'age': 28,
            'height_cm': 180.0,
            'weight_kg': 75.0,
            'waist_cm': 82.0,
            'low_energy': 0,
            'sleep_trouble': 0,
            'low_mood': 0,
            'low_interest': 0,
            'high_blood_pressure': 0,
            'diabetes': 0,
        }
        res = male_ml_service.predict_tier1(low_risk_data)
        self.assertEqual(res['assessment_level'], 'tier_1')
        self.assertEqual(res['tiers_included'], [1])
        self.assertEqual(res['module'], 'male_hypogonadism')
        self.assertIn('probability', res)
        self.assertGreaterEqual(res['probability'], 0.0)
        self.assertLessEqual(res['probability'], 1.0)
        self.assertEqual(res['threshold'], MALE_TIER1_SCREENING_THRESHOLD)
        self.assertIn(res['risk_category'], ['lower', 'intermediate', 'higher'])
        self.assertIsInstance(res['explanations'], list)
        self.assertGreater(len(res['explanations']), 0)
        # Check that BMI was computed
        self.assertIn('bmi', res['input_features'])
        self.assertAlmostEqual(res['input_features']['bmi'], 23.15, places=1)

    def test_tier1_high_risk_case(self):
        high_risk_data = {
            'age': 65,
            'height_cm': 172.0,
            'weight_kg': 110.0,
            'waist_cm': 118.0,
            'low_energy': 1,
            'sleep_trouble': 1,
            'low_mood': 1,
            'low_interest': 1,
            'high_blood_pressure': 1,
            'diabetes': 1,
        }
        res = male_ml_service.predict_tier1(high_risk_data)
        self.assertEqual(res['assessment_level'], 'tier_1')
        self.assertGreaterEqual(res['probability'], MALE_TIER1_SCREENING_THRESHOLD)
        self.assertEqual(res['risk_category'], 'higher')
        self.assertEqual(res['risk_label'], 'Higher Screening Risk')

    def test_tier2_complete_labs_inference(self):
        sample_t2 = {
            'age': 52,
            'shbg_nmol_l': 28.5,
            'estradiol_pg_ml': 22.0,
            'albumin_g_dl': 4.4,
            'hba1c_pct': 5.8,
            'glucose_mg_dl': 102.0,
            'hemoglobin_g_dl': 15.1,
            'hematocrit_pct': 44.5,
            'rbc_count': 4.9,
            'alt_u_l': 26.0,
            'ast_u_l': 22.0,
            'total_bilirubin_mg_dl': 0.8,
            'creatinine_mg_dl': 1.0,
            'bun_mg_dl': 16.0,
            'uric_acid_mg_dl': 5.5,
            'hdl_mg_dl': 48.0,
        }
        res = male_ml_service.predict_tier2(sample_t2)
        self.assertEqual(res['assessment_level'], 'tier_1_2')
        self.assertEqual(res['tiers_included'], [1, 2])
        self.assertEqual(res['module'], 'male_hypogonadism')
        self.assertIn('probability', res)
        self.assertGreaterEqual(res['probability'], 0.0)
        self.assertLessEqual(res['probability'], 1.0)
        self.assertEqual(res['threshold'], MALE_TIER2_SCREENING_THRESHOLD)
        self.assertEqual(res['tier_2_available_count'], 16)
        self.assertEqual(res['tier_2_total_count'], 16)
        self.assertEqual(len(res['tier_2_missing_fields']), 0)
        self.assertIsInstance(res['explanations'], list)

    def test_tier2_partial_labs_imputation(self):
        # User only has glucose, HbA1c, ALT, AST, creatinine
        partial_t2 = {
            'age': 45,
            'hba1c_pct': 6.2,
            'glucose_mg_dl': 118.0,
            'alt_u_l': 38.0,
            'ast_u_l': 32.0,
            'creatinine_mg_dl': 1.1,
        }
        res = male_ml_service.predict_tier2(partial_t2)
        self.assertEqual(res['assessment_level'], 'tier_1_2')
        self.assertIn('probability', res)
        self.assertGreaterEqual(res['probability'], 0.0)
        self.assertLessEqual(res['probability'], 1.0)
        self.assertEqual(res['tier_2_available_count'], 6)
        self.assertEqual(res['tier_2_total_count'], 16)
        self.assertEqual(len(res['tier_2_missing_fields']), 10)
        self.assertEqual(res['evidence_completeness']['percentage'], 37.5)

    def test_hormone_pattern_rules(self):
        # Test 1: Normal Testosterone
        p1 = male_ml_service.evaluate_hormone_pattern(total_testosterone=450.0, lh=4.2, fsh=3.8)
        self.assertFalse(p1['is_hypogonadal'])
        self.assertEqual(p1['pattern_type'], 'EUGONADAL')

        # Test 2: Primary Hypogonadism (Low T, High LH/FSH)
        p2 = male_ml_service.evaluate_hormone_pattern(total_testosterone=180.0, lh=14.5, fsh=16.0)
        self.assertTrue(p2['is_hypogonadal'])
        self.assertEqual(p2['pattern_type'], 'PRIMARY')

        # Test 3: Secondary / Hypogonadotropic Hypogonadism (Low T, Low/Normal LH/FSH)
        p3 = male_ml_service.evaluate_hormone_pattern(total_testosterone=210.0, lh=2.1, fsh=2.4)
        self.assertTrue(p3['is_hypogonadal'])
        self.assertEqual(p3['pattern_type'], 'SECONDARY')

        # Test 4: Hyperprolactinemia (High prolactin)
        p4 = male_ml_service.evaluate_hormone_pattern(total_testosterone=195.0, lh=2.0, prolactin=45.0)
        self.assertTrue(p4['is_hypogonadal'])
        self.assertEqual(p4['pattern_type'], 'SECONDARY_HYPERPROLACTINEMIC')


if __name__ == '__main__':
    unittest.main()
