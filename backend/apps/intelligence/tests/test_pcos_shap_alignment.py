import unittest
from unittest.mock import patch, MagicMock
import pandas as pd
import numpy as np

from apps.intelligence.services.pcos_ml_service import pcos_ml_service, TIER1_FEATURE_NAMES, TIER2_FEATURE_NAMES
from apps.intelligence.services.health_context_builder import HealthContextBuilder


class TestPCOSShapAlignment(unittest.TestCase):
    """
    Regression tests verifying that PCOS TreeSHAP attributions align
    strictly with the ColumnTransformer feature output order for both Tier 1 and Tier 2.
    """

    @classmethod
    def setUpClass(cls):
        pcos_ml_service.load()

    def test_preprocessor_extraction(self):
        """Verify preprocessor is correctly extracted from CalibratedClassifierCV pipelines."""
        prep1 = pcos_ml_service._extract_preprocessor(pcos_ml_service._t1_model)
        self.assertIsNotNone(prep1, "Tier 1 preprocessor should be extracted")
        self.assertTrue(hasattr(prep1, "get_feature_names_out"))

        prep2 = pcos_ml_service._extract_preprocessor(pcos_ml_service._t2_pipeline)
        self.assertIsNotNone(prep2, "Tier 2 preprocessor should be extracted")
        self.assertTrue(hasattr(prep2, "get_feature_names_out"))

    def test_feature_mapping_differs_from_legacy_static_arrays(self):
        """
        Verify that _get_feature_mapping returns the true transformer column order,
        which differs from the legacy scrambled static arrays.
        """
        aligned_t1 = pcos_ml_service._get_feature_mapping(pcos_ml_service._t1_model, TIER1_FEATURE_NAMES)
        self.assertEqual(len(aligned_t1), 16)
        # In legacy static array, index 4 was cycle_regularity; in ColumnTransformer it is hip_inch
        self.assertEqual(aligned_t1[4], 'hip_inch')
        self.assertEqual(aligned_t1[5], 'waist_inch')
        self.assertEqual(aligned_t1[8], 'cycle_regularity')

        aligned_t2 = pcos_ml_service._get_feature_mapping(pcos_ml_service._t2_pipeline, TIER2_FEATURE_NAMES)
        self.assertEqual(len(aligned_t2), 32)
        # In legacy static array, index 8 was cycle_regularity; in ColumnTransformer it is pulse_rate_bpm
        self.assertEqual(aligned_t2[8], 'pulse_rate_bpm')
        self.assertEqual(aligned_t2[16], 'tsh')
        self.assertEqual(aligned_t2[24], 'cycle_regularity')

    def test_tier1_explanation_mapping(self):
        """Verify Tier 1 inference generates explanations mapped to correct features."""
        inputs = {
            'age': 25,
            'weight_kg': 85.0,
            'height_cm': 160.0,
            'waist_inch': 42.0,
            'hip_inch': 44.0,
            'cycle_length_raw': 28.0,
            'cycle_regularity': 0,
            'weight_gain': 1,
            'hirsutism': 1,
            'skin_darkening': 1,
            'hair_loss': 0,
            'pimples_acne': 1,
            'fast_food': 1,
            'regular_exercise': 0
        }
        res = pcos_ml_service.predict_tier1(inputs)
        exps = res['explanations']
        self.assertTrue(len(exps) > 0)
        for exp in exps:
            self.assertIn(exp['feature_key'], TIER1_FEATURE_NAMES)
            self.assertIn('feature_name', exp)
            self.assertIn('impact_score', exp)
            self.assertIn('direction', exp)
            if exp['value'] is not None and exp['feature_key'] in inputs:
                self.assertEqual(exp['value'], float(inputs[exp['feature_key']]))

    def test_tier2_explanation_mapping(self):
        """Verify Tier 2 cumulative inference generates explanations correctly attributed."""
        inputs = {
            'age': 29,
            'weight_kg': 78.0,
            'height_cm': 165.0,
            'waist_inch': 38.0,
            'hip_inch': 40.0,
            'cycle_length_raw': 50.0,
            'cycle_regularity': 1,
            'weight_gain': 1,
            'hirsutism': 1,
            'skin_darkening': 1,
            'hair_loss': 1,
            'pimples_acne': 1,
            'fast_food': 1,
            'regular_exercise': 0,
            'fsh': 3.5,
            'lh': 14.2,
            'amh': 9.8,
            'tsh': 1.9,
            'prolactin': 16.0,
            'vitamin_d3': 12.0,
            'progesterone': 0.3,
            'rbs': 115.0,
            'hemoglobin': 11.8,
            'pulse_rate_bpm': 78.0,
            'respiratory_rate': 18.0,
            'bp_systolic': 122.0,
            'bp_diastolic': 82.0
        }
        res = pcos_ml_service.predict_tier2_cumulative(inputs)
        exps = res['explanations']
        self.assertTrue(len(exps) > 0)
        for exp in exps:
            self.assertIn(exp['feature_key'], TIER2_FEATURE_NAMES)
            if exp['value'] is not None and exp['feature_key'] in inputs:
                self.assertEqual(exp['value'], float(inputs[exp['feature_key']]))

    def test_health_context_builder_receives_aligned_feature_names(self):
        """Verify HealthContextBuilder formats the aligned explanations into prompt."""
        mock_assessment = {
            'assessment_level': 'tier_2',
            'probability': 0.81,
            'screening_threshold': 0.29,
            'risk_category': 'high_risk',
            'explanations': [
                {
                    'feature_key': 'skin_darkening',
                    'feature_name': 'Skin Darkening (Acanthosis Nigricans)',
                    'value': 1.0,
                    'direction': 'increases_risk',
                    'impact_score': 0.1281
                },
                {
                    'feature_key': 'hirsutism',
                    'feature_name': 'Excess Hair Growth (Hirsutism)',
                    'value': 1.0,
                    'direction': 'increases_risk',
                    'impact_score': 0.1113
                }
            ]
        }
        with patch('apps.intelligence.services.health_context_builder.health_service.fetch_all') as mock_fetch, \
             patch('apps.intelligence.services.health_context_builder.clinical_state_repository.get_patient_clinical_state') as mock_state, \
             patch('apps.intelligence.services.health_context_builder.assessment_repository.get_active_assessment') as mock_get_active:
            
            mock_fetch.return_value.profile.gender = 'female'
            mock_state.return_value = {}
            mock_get_active.return_value = mock_assessment

            sys_prompt, ctx, used = HealthContextBuilder.build_context(
                patient_uuid='test-female-uuid',
                user_message='What is driving my risk score?',
                explicit_pathway='female'
            )

            self.assertTrue(used['ml_screening'])
            self.assertIn('Skin Darkening (Acanthosis Nigricans) (increases risk)', ctx)
            self.assertIn('Excess Hair Growth (Hirsutism) (increases risk)', ctx)


if __name__ == '__main__':
    unittest.main()
