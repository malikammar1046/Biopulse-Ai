import unittest
import math

from apps.intelligence.services.pcos_ml_service import pcos_ml_service
from apps.intelligence.services.male_ml_service import male_ml_service


class TestModelSerializationAndGoldenInference(unittest.TestCase):
    """
    Stage 6 regression tests:
    1. Verifies that all 4 active production model artifacts load successfully without failure:
       - PCOS Tier 1 (ExtraTrees + CalibratedClassifierCV)
       - PCOS Tier 2 (ExtraTrees Cumulative + CalibratedClassifierCV)
       - Male Tier 1 (Calibrated LogisticRegression)
       - Male Tier 2 (Calibrated RandomForestClassifier)
    2. Verifies deterministic golden inference outputs across all 4 tiers.
    """

    @classmethod
    def setUpClass(cls):
        pcos_ml_service.load()
        male_ml_service.load()

    def test_all_models_load_successfully(self):
        """Verify that all production models load without errors."""
        self.assertTrue(pcos_ml_service.is_ready)
        self.assertIsNotNone(pcos_ml_service._t1_model)
        self.assertIsNotNone(pcos_ml_service._t2_pipeline)

        self.assertTrue(male_ml_service.is_ready)
        self.assertIsNotNone(male_ml_service._tier1_artifact)
        self.assertIsNotNone(male_ml_service._tier2_artifact)

    def test_pcos_tier1_golden_inference(self):
        """Verify deterministic golden probability for PCOS Tier 1."""
        inputs = {
            'age': 25, 'weight_kg': 65.0, 'height_cm': 165.0,
            'waist_inch': 32.0, 'hip_inch': 38.0, 'cycle_length_raw': 30.0,
            'cycle_regularity': 0, 'weight_gain': 0, 'hirsutism': 0,
            'skin_darkening': 0, 'hair_loss': 0, 'pimples_acne': 0,
            'fast_food': 0, 'regular_exercise': 1
        }
        res = pcos_ml_service.predict_tier1(inputs)
        prob = res['probability']
        self.assertAlmostEqual(prob, 0.124, places=4, msg="PCOS Tier 1 golden probability changed")
        self.assertEqual(res['risk_category'], 'lower')

    def test_pcos_tier2_golden_inference(self):
        """Verify deterministic golden probability for PCOS Tier 2 cumulative."""
        inputs = {
            'age': 25, 'weight_kg': 65.0, 'height_cm': 165.0,
            'waist_inch': 32.0, 'hip_inch': 38.0, 'cycle_length_raw': 30.0,
            'cycle_regularity': 0, 'weight_gain': 0, 'hirsutism': 0,
            'skin_darkening': 0, 'hair_loss': 0, 'pimples_acne': 0,
            'fast_food': 0, 'regular_exercise': 1,
            'fsh': 5.5, 'lh': 5.0, 'amh': 3.0, 'tsh': 2.0, 'prolactin': 15.0,
            'vitamin_d3': 25.0, 'progesterone': 0.6, 'rbs': 90.0, 'hemoglobin': 12.5,
            'pulse_rate_bpm': 72.0, 'respiratory_rate': 18.0,
            'bp_systolic': 115.0, 'bp_diastolic': 75.0
        }
        res = pcos_ml_service.predict_tier2_cumulative(inputs)
        prob = res['probability']
        self.assertAlmostEqual(prob, 0.1167, places=4, msg="PCOS Tier 2 golden probability changed")
        self.assertEqual(res['risk_category'], 'lower')

    def test_male_tier1_golden_inference(self):
        """Verify deterministic golden probability for Male Tier 1."""
        inputs = {
            "age": 45, "height_cm": 178.0, "weight_kg": 85.0, "waist_cm": 95.0,
            "low_energy": 1, "sleep_trouble": 1, "low_mood": 0, "low_interest": 1,
            "high_blood_pressure": 1, "diabetes": 0
        }
        res = male_ml_service.predict_tier1(inputs)
        prob = res['probability']
        self.assertAlmostEqual(prob, 0.1830, places=3, msg="Male Tier 1 golden probability changed")

    def test_male_tier2_golden_inference(self):
        """Verify deterministic golden probability for Male Tier 2."""
        inputs = {
            "age": 45, "shbg_nmol_l": 25.0, "estradiol_pg_ml": 22.0, "albumin_g_dl": 4.5,
            "hba1c_pct": 5.4, "glucose_mg_dl": 95.0, "hemoglobin_g_dl": 15.2,
            "hematocrit_pct": 45.0, "rbc_count": 5.0, "alt_u_l": 25.0, "ast_u_l": 22.0,
            "total_bilirubin_mg_dl": 0.8, "creatinine_mg_dl": 1.0, "bun_mg_dl": 15.0,
            "uric_acid_mg_dl": 5.5, "hdl_mg_dl": 45.0
        }
        res = male_ml_service.predict_tier2(inputs)
        prob = res['probability']
        self.assertAlmostEqual(prob, 0.2273, places=3, msg="Male Tier 2 golden probability changed")


if __name__ == '__main__':
    unittest.main()
