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
    MALE_LOWER_RISK_THRESHOLD,
    classify_male_screening_risk,
)


class TestMaleMLService(unittest.TestCase):
    def setUp(self):
        male_ml_service.load()

    def test_models_loaded_and_ready(self):
        self.assertTrue(male_ml_service.is_ready)
        self.assertIsNotNone(male_ml_service.tier1_pipeline)
        self.assertIsNotNone(male_ml_service.tier2_pipeline)

    def test_classify_male_screening_risk_boundaries(self):
        # 10.6% must be intermediate risk
        cat106, lbl106 = classify_male_screening_risk(0.106)
        self.assertEqual(cat106, 'intermediate')
        self.assertEqual(lbl106, 'Intermediate Screening Risk')

        # Below 10.0% -> lower
        cat_low, lbl_low = classify_male_screening_risk(0.099)
        self.assertEqual(cat_low, 'lower')
        self.assertEqual(lbl_low, 'Lower Screening Risk')

        # Exactly 10.0% -> intermediate
        cat_10, lbl_10 = classify_male_screening_risk(0.10)
        self.assertEqual(cat_10, 'intermediate')
        self.assertEqual(lbl_10, 'Intermediate Screening Risk')

        # Exactly threshold (0.1808) -> higher
        cat_hi, lbl_hi = classify_male_screening_risk(MALE_TIER1_SCREENING_THRESHOLD)
        self.assertEqual(cat_hi, 'higher')
        self.assertEqual(lbl_hi, 'Higher Screening Risk')

        # None / NaN -> unavailable
        cat_none, lbl_none = classify_male_screening_risk(None)
        self.assertEqual(cat_none, 'unavailable')
        self.assertEqual(lbl_none, 'Assessment Unavailable')
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
            'age': 58,
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

    def test_tier1_age_boundaries_and_missing_age(self):
        base_t1 = {
            'height_cm': 175.0,
            'weight_kg': 80.0,
            'waist_cm': 90.0,
        }

        # Missing age -> unavailable (missing_age)
        res_missing = male_ml_service.predict_tier1(base_t1)
        self.assertIsNone(res_missing['probability'])
        self.assertIsNone(res_missing['probability_percent'])
        self.assertEqual(res_missing['risk_category'], 'unavailable')
        self.assertEqual(res_missing.get('unavailable_reason'), 'missing_age')

        # Age 18 (below 19) -> unavailable (age_under_19)
        res_18 = male_ml_service.predict_tier1({**base_t1, 'age': 18})
        self.assertIsNone(res_18['probability'])
        self.assertEqual(res_18['risk_category'], 'unavailable')
        self.assertEqual(res_18.get('unavailable_reason'), 'age_under_19')

        # Age 19 (lower boundary) -> valid prediction
        res_19 = male_ml_service.predict_tier1({**base_t1, 'age': 19})
        self.assertIsNotNone(res_19['probability'])
        self.assertGreaterEqual(res_19['probability'], 0.0)
        self.assertLessEqual(res_19['probability'], 1.0)
        self.assertIn(res_19['risk_category'], ['lower', 'intermediate', 'higher'])

        # Age 60 (upper boundary) -> valid prediction
        res_60 = male_ml_service.predict_tier1({**base_t1, 'age': 60})
        self.assertIsNotNone(res_60['probability'])
        self.assertGreaterEqual(res_60['probability'], 0.0)
        self.assertLessEqual(res_60['probability'], 1.0)
        self.assertIn(res_60['risk_category'], ['lower', 'intermediate', 'higher'])

        # Age 61 (above 60) -> unavailable (age_over_60)
        res_61 = male_ml_service.predict_tier1({**base_t1, 'age': 61})
        self.assertIsNone(res_61['probability'])
        self.assertEqual(res_61['risk_category'], 'unavailable')
        self.assertEqual(res_61.get('unavailable_reason'), 'age_over_60')

    def test_tier2_age_boundaries_and_missing_age(self):
        base_t2 = {
            'shbg_nmol_l': 28.5,
            'total_testosterone': 250.0,
            'lh': 12.0,
            'glucose_mg_dl': 95.0,
        }

        # Missing age -> unavailable (missing_age)
        res_missing = male_ml_service.predict_tier2(base_t2)
        self.assertIsNone(res_missing['probability'])
        self.assertIsNone(res_missing['probability_percent'])
        self.assertEqual(res_missing['risk_category'], 'unavailable')
        self.assertEqual(res_missing.get('unavailable_reason'), 'missing_age')

        # Age 18 (below 19) -> unavailable (age_under_19)
        res_18 = male_ml_service.predict_tier2({**base_t2, 'age': 18})
        self.assertIsNone(res_18['probability'])
        self.assertEqual(res_18['risk_category'], 'unavailable')
        self.assertEqual(res_18.get('unavailable_reason'), 'age_under_19')

        # Age 19 (lower boundary) -> valid prediction
        res_19 = male_ml_service.predict_tier2({**base_t2, 'age': 19})
        self.assertIsNotNone(res_19['probability'])
        self.assertGreaterEqual(res_19['probability'], 0.0)
        self.assertLessEqual(res_19['probability'], 1.0)
        self.assertIn(res_19['risk_category'], ['lower', 'intermediate', 'higher'])

        # Age 60 (upper boundary) -> valid prediction
        res_60 = male_ml_service.predict_tier2({**base_t2, 'age': 60})
        self.assertIsNotNone(res_60['probability'])
        self.assertGreaterEqual(res_60['probability'], 0.0)
        self.assertLessEqual(res_60['probability'], 1.0)
        self.assertIn(res_60['risk_category'], ['lower', 'intermediate', 'higher'])

        # Age 61 (above 60) -> unavailable (age_over_60)
        res_61 = male_ml_service.predict_tier2({**base_t2, 'age': 61})
        self.assertIsNone(res_61['probability'])
        self.assertEqual(res_61['risk_category'], 'unavailable')
        self.assertEqual(res_61.get('unavailable_reason'), 'age_over_60')
        # Rule-based hormone pattern should still be evaluated despite unavailable ML risk
        self.assertIsNotNone(res_61['hormone_pattern_interpretation'])
        self.assertTrue(res_61['hormone_pattern_interpretation']['is_hypogonadal'])

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


from django.test import SimpleTestCase, override_settings
from apps.intelligence.services.male_ml_service import MaleMLService, MALE_TIER1_7FEAT_FEATURE_NAMES


@override_settings(ENABLE_MALE_TIER1_CLEAN_7FEAT=True)
class TestMaleTier1Clean7FeatCandidate(SimpleTestCase):
    """
    Verification tests for the staged 7-feature clean biometric Male Tier 1 candidate model
    operating behind the ENABLE_MALE_TIER1_CLEAN_7FEAT feature flag.
    """

    def setUp(self):
        self.service = MaleMLService()
        self.service.load()

    def test_candidate_features_and_threshold(self):
        self.assertTrue(self.service.is_ready)
        # Features must strictly match the 7 legitimate biometric features
        self.assertEqual(self.service.tier1_feature_names, MALE_TIER1_7FEAT_FEATURE_NAMES)
        self.assertEqual(len(self.service.tier1_feature_names), 7)
        self.assertNotIn('low_energy', self.service.tier1_feature_names)
        self.assertNotIn('low_interest', self.service.tier1_feature_names)
        self.assertNotIn('sleep_trouble', self.service.tier1_feature_names)
        self.assertNotIn('low_mood', self.service.tier1_feature_names)

        # Threshold must be 0.1799
        self.assertAlmostEqual(self.service.tier1_screening_threshold, 0.1799, places=3)

    def test_candidate_prediction_and_version(self):
        sample_inputs = {
            'age': 45,
            'height_cm': 175.0,
            'weight_kg': 95.0,
            'waist_cm': 105.0,
            'high_blood_pressure': 1,
            'diabetes': 0,
            # Even if symptom fields are passed in payload, 7-feat model does not use them
            'low_energy': 1,
            'low_interest': 1,
        }
        res = self.service.predict_tier1(sample_inputs)
        self.assertEqual(res['assessment_level'], 'tier_1')
        self.assertEqual(res['module'], 'male_hypogonadism')
        self.assertEqual(res['model_version'], 'Male-ML v2.0-T1-Clean7')
        self.assertAlmostEqual(res['threshold'], 0.1799, places=3)
        self.assertIsNotNone(res['probability'])
        self.assertGreaterEqual(res['probability'], 0.0)
        self.assertLessEqual(res['probability'], 1.0)
        # Model input features must strictly contain the 7 features
        self.assertEqual(list(res['input_features'].keys()), MALE_TIER1_7FEAT_FEATURE_NAMES)

    def test_candidate_missing_waist_handling(self):
        # Missing waist produces an incomplete assessment and explicit notice
        inputs_no_waist = {
            'age': 35,
            'height_cm': 180.0,
            'weight_kg': 80.0,
            'high_blood_pressure': 0,
            'diabetes': 0,
        }
        res = self.service.predict_tier1(inputs_no_waist)
        self.assertIsNotNone(res['probability'])
        self.assertIn(res['risk_category'], ['lower', 'intermediate', 'higher'])
        self.assertFalse(res['is_complete'])
        self.assertEqual(res['assessment_status'], 'incomplete')
        self.assertIsNotNone(res['notice'])
        self.assertIn('Waist circumference was not provided', res['notice'])
        self.assertIn('waist_cm', res['missing_features'])

    def test_candidate_medical_history_yes_no_unsure(self):
        # Yes -> 1.0, No -> 0.0, Unsure -> None in missing_features
        base = {'age': 40, 'height_cm': 175.0, 'weight_kg': 80.0, 'waist_cm': 92.0}

        # Explicit Yes
        res_yes = self.service.predict_tier1({**base, 'high_blood_pressure': 'yes', 'diabetes': 1})
        self.assertEqual(res_yes['input_features']['high_blood_pressure'], 1.0)
        self.assertEqual(res_yes['input_features']['diabetes'], 1.0)
        self.assertNotIn('high_blood_pressure', res_yes['missing_features'])
        self.assertNotIn('diabetes', res_yes['missing_features'])

        # Explicit No
        res_no = self.service.predict_tier1({**base, 'high_blood_pressure': 'no', 'diabetes': 0})
        self.assertEqual(res_no['input_features']['high_blood_pressure'], 0.0)
        self.assertEqual(res_no['input_features']['diabetes'], 0.0)
        self.assertNotIn('high_blood_pressure', res_no['missing_features'])
        self.assertNotIn('diabetes', res_no['missing_features'])

        # Unsure / Unknown -> mapped to None and added to missing_features (never equated to No)
        res_unsure = self.service.predict_tier1({**base, 'high_blood_pressure': 'unsure', 'diabetes': 'unknown'})
        self.assertIsNone(res_unsure['input_features']['high_blood_pressure'])
        self.assertIsNone(res_unsure['input_features']['diabetes'])
        self.assertIn('high_blood_pressure', res_unsure['missing_features'])
        self.assertIn('diabetes', res_unsure['missing_features'])

    def test_candidate_age_boundaries_enforced(self):
        base = {'height_cm': 175.0, 'weight_kg': 80.0, 'waist_cm': 90.0}
        # Age 18 -> unavailable
        res_18 = self.service.predict_tier1({**base, 'age': 18})
        self.assertEqual(res_18['risk_category'], 'unavailable')
        self.assertEqual(res_18['unavailable_reason'], 'age_under_19')

        # Age 61 -> unavailable
        res_61 = self.service.predict_tier1({**base, 'age': 61})
        self.assertEqual(res_61['risk_category'], 'unavailable')
        self.assertEqual(res_61['unavailable_reason'], 'age_over_60')

        # Age 19 -> valid
        res_19 = self.service.predict_tier1({**base, 'age': 19})
        self.assertIsNotNone(res_19['probability'])

        # Age 60 -> valid
        res_60 = self.service.predict_tier1({**base, 'age': 60})
        self.assertIsNotNone(res_60['probability'])


if __name__ == '__main__':
    unittest.main()

