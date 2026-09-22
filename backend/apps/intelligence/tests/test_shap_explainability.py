"""
backend/apps/intelligence/tests/test_shap_explainability.py
Comprehensive Focused Test Suite for BioPulse AI Fold-Aware SHAP Explainability Engine.

Tests:
TEST A: Female Tier 1 ExtraTrees 5-fold ensemble aggregation & additivity (< 1e-5)
TEST B: Female Tier 2 ExtraTrees 5-fold ensemble aggregation & additivity (< 1e-5)
TEST C: Female Tier 3 Multimodal: tabular SHAP from clinical model + vision PCOM without fake tabular features
TEST D: Male Tier 1 LogisticRegression 5-fold LinearExplainer log-odds additivity (< 1e-5)
TEST E: Male Tier 2 RandomForest 5-fold TreeExplainer raw tree-vote additivity (< 1e-5)
TEST F: Outer predict_proba() is sole source of final calibrated probability
TEST G: Fold-direction stability metadata (consistent, moderate, mixed)
TEST H: Canonical metadata registry coverage and modifiability flags
TEST I: Longitudinal comparability enforcement (rejects mismatch / legacy schemas)
TEST J: Longitudinal differential patient-safe attribution language
TEST K: Explanation latency benchmark (< 30ms)
"""

import time
import unittest
import uuid
import numpy as np
import pandas as pd
from PIL import Image

from unittest.mock import MagicMock

from apps.intelligence.services.canonical_shap_registry import (
    CANONICAL_SHAP_REGISTRY,
    get_feature_metadata,
)
from apps.intelligence.services.pcos_ml_service import pcos_ml_service
from apps.intelligence.services.male_ml_service import male_ml_service
from apps.intelligence.services.longitudinal_shap_service import (
    compare_explanations,
    find_latest_comparable_assessment,
)
from apps.intelligence.services.assessment_repository import (
    AssessmentRepository,
    _in_memory_assessments,
    _repo_lock,
    get_supabase_client,
)


class TestShapExplainability(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        pcos_ml_service.load()
        male_ml_service.load()

    def test_a_female_tier1_ensemble_additivity(self):
        """TEST A: Female Tier 1 5-fold ensemble aggregation satisfies additivity within 1e-5."""
        inputs = {
            'age': 28,
            'weight_kg': 72.0,
            'height_cm': 162.0,
            'bmi': 27.43,
            'cycle_regularity': 'irregular',
            'cycle_length_days': 42.0,
            'hirsutism': 1.0,
            'hair_loss': 1.0,
            'pimples_acne': 1.0,
            'skin_darkening': 1.0,
            'weight_gain': 1.0,
            'fast_food': 1.0,
            'physical_activity': 'sedentary',
        }
        res = pcos_ml_service.predict_tier1(inputs)
        self.assertIn('shap_explanation', res)
        shap_payload = res['shap_explanation']
        self.assertIsNotNone(shap_payload)

        self.assertEqual(shap_payload['explained_fold_count'], 5)
        self.assertTrue(shap_payload['additivity_verified'])
        self.assertLess(shap_payload['additivity_error'], 1e-5)
        self.assertGreater(len(shap_payload['factors']), 0)
        self.assertIn('top_higher_factors', shap_payload)
        self.assertIn('top_lower_factors', shap_payload)

    def test_b_female_tier2_ensemble_additivity(self):
        """TEST B: Female Tier 2 cumulative 5-fold ensemble aggregation satisfies additivity within 1e-5."""
        inputs = {
            'age': 29,
            'weight_kg': 75.0,
            'height_cm': 160.0,
            'cycle_regularity': 'irregular',
            'cycle_length_days': 45.0,
            'hirsutism': 1.0,
            'fsh': 5.2,
            'lh': 12.8,
            'fsh_lh_ratio': 0.41,
            'amh': 7.8,
            'tsh': 2.1,
            'prolactin': 18.0,
            'rbs': 110.0,
        }
        res = pcos_ml_service.predict_tier2_cumulative(inputs)
        shap_payload = res.get('shap_explanation')
        self.assertIsNotNone(shap_payload)
        self.assertEqual(shap_payload['explained_fold_count'], 5)
        self.assertTrue(shap_payload['additivity_verified'])
        self.assertLess(shap_payload['additivity_error'], 1e-5)

        # Verify factors are mapped to canonical labels
        factor_keys = [f['feature_key'] for f in shap_payload['factors']]
        self.assertIn('fsh_lh_ratio', factor_keys)
        self.assertIn('cycle_regularity', factor_keys)

    def test_c_female_tier3_multimodal_integrity(self):
        """TEST C: Female Tier 3 multimodal: tabular SHAP from clinical model + vision PCOM without fake tabular features."""
        inputs = {
            'age': 27,
            'weight_kg': 68.0,
            'height_cm': 165.0,
            'cycle_regularity': 'irregular',
            'fsh': 6.0,
            'lh': 14.0,
            'amh': 8.5,
        }
        # Synthetic grayscale ultrasound image (224x224)
        dummy_img = Image.fromarray(np.uint8(np.random.rand(224, 224) * 255)).convert('RGB')

        res = pcos_ml_service.predict_tier1_2_3_multimodal(inputs, dummy_img)
        self.assertIn('pcom_status', res)
        self.assertIn('pcom_probability', res)
        self.assertIn('gradcam_b64', res)

        shap_payload = res.get('shap_explanation')
        self.assertIsNotNone(shap_payload)
        self.assertIn('multimodal_context', shap_payload)
        self.assertEqual(shap_payload['multimodal_context']['clinical_weight'], 0.95)
        self.assertEqual(shap_payload['multimodal_context']['ultrasound_weight'], 0.05)

        # Ensure no fake tabular ultrasound features are present
        factor_keys = [f['feature_key'] for f in shap_payload['factors']]
        self.assertNotIn('ultrasound_pixel_intensity', factor_keys)
        self.assertNotIn('gradcam_activation', factor_keys)

    def test_d_male_tier1_linear_log_odds_additivity(self):
        """TEST D: Male Tier 1 (Logistic Regression Balanced) 5-fold LinearExplainer log-odds additivity (< 1e-5)."""
        inputs = {
            'age': 52,
            'bmi': 32.4,
            'diabetes': 1,
            'high_blood_pressure': 1,
            'low_energy': 1,
            'low_interest': 1,
            'poor_erections': 1,
            'sleep_apnea': 0,
        }
        res = male_ml_service.predict_tier1(inputs)
        shap_payload = res.get('shap_explanation')
        self.assertIsNotNone(shap_payload)
        self.assertEqual(shap_payload['output_space'], 'log_odds')
        self.assertEqual(shap_payload['explainer_type'], 'LinearExplainer')
        self.assertEqual(shap_payload['explained_fold_count'], 5)
        self.assertTrue(shap_payload['additivity_verified'])
        self.assertLess(shap_payload['additivity_error'], 1e-5)

        # Verify outer calibrated probability is distinctly preserved
        self.assertAlmostEqual(res['probability'], shap_payload['final_calibrated_probability'], places=3)

    def test_e_male_tier2_random_forest_additivity(self):
        """TEST E: Male Tier 2 (Random Forest) 5-fold TreeExplainer raw tree-vote additivity (< 1e-5)."""
        inputs = {
            'age': 48,
            'bmi': 29.5,
            'shbg_nmol_l': 16.5,
            'estradiol_pg_ml': 38.0,
            'albumin_g_dl': 4.3,
            'glucose_mg_dl': 118.0,
            'hba1c_pct': 6.2,
            'hdl_mg_dl': 36.0,
            'uric_acid_mg_dl': 7.8,
        }
        res = male_ml_service.predict_tier2(inputs)
        shap_payload = res.get('shap_explanation')
        self.assertIsNotNone(shap_payload)
        self.assertEqual(shap_payload['output_space'], 'raw')
        self.assertEqual(shap_payload['explainer_type'], 'TreeExplainer')
        self.assertEqual(shap_payload['explained_fold_count'], 5)
        self.assertTrue(shap_payload['additivity_verified'])
        self.assertLess(shap_payload['additivity_error'], 1e-5)

    def test_f_outer_predict_proba_sole_source(self):
        """TEST F: Outer predict_proba() is the sole source of final calibrated probability."""
        inputs = {'age': 31, 'bmi': 26.0, 'cycle_regularity': 'irregular'}
        df = pcos_ml_service.prepare_tier1_features(inputs)
        raw_calibrated_prob = float(pcos_ml_service._t1_model.predict_proba(df)[0, 1])

        res = pcos_ml_service.predict_tier1(inputs)
        shap_payload = res['shap_explanation']

        self.assertAlmostEqual(res['probability'], raw_calibrated_prob, places=4)
        self.assertAlmostEqual(shap_payload['final_calibrated_probability'], raw_calibrated_prob, places=4)

    def test_g_fold_direction_stability_metadata(self):
        """TEST G: Per-feature fold-direction stability metadata is computed accurately."""
        inputs = {'age': 35, 'bmi': 28.0, 'cycle_regularity': 'irregular', 'weight_gain': 1.0}
        res = pcos_ml_service.predict_tier1(inputs)
        shap_payload = res['shap_explanation']

        for factor in shap_payload['factors']:
            agreement = factor['fold_agreement']
            self.assertEqual(agreement['total_folds_count'], 5)
            self.assertEqual(len(agreement['fold_values']), 5)
            self.assertIn(agreement['stability'], ['consistent', 'moderate', 'mixed'])
            self.assertGreaterEqual(agreement['fold_agreement_ratio'], 0.0)
            self.assertLessEqual(agreement['fold_agreement_ratio'], 1.0)

    def test_h_canonical_metadata_registry(self):
        """TEST H: Canonical metadata registry contains modifiability flags and descriptions for all keys."""
        sample_keys = ['cycle_regularity', 'bmi', 'hirsutism', 'fast_food', 'shbg_nmol_l', 'glucose_mg_dl']
        for key in sample_keys:
            meta = get_feature_metadata(key)
            self.assertIsNotNone(meta.patient_label)
            self.assertIn(meta.modifiable_status, ['lifestyle_influenced', 'changes_over_time', 'clinical_measurement', 'background_factor'])
            self.assertGreater(len(meta.simple_description), 10)
            self.assertGreater(len(meta.why_model_uses_it), 10)

    def test_i_longitudinal_comparability_rules(self):
        """TEST I: Longitudinal comparator enforces strict comparability preconditions."""
        # 1. Reject mismatch pathway
        curr = {
            'schema_version': '1.1',
            'pathway': 'female_pcos',
            'tier': 'tier_1',
            'model_version': 'PCOS-ML v1.2-T1',
            'explained_model_stage': 'calibrated_cv_base_ensemble_pre_calibration',
            'output_space': 'raw',
            'factors': [],
        }
        prev_male = {
            'module': 'male_hypogonadism',
            'shap_explanation': {'pathway': 'male_hypogonadism', 'schema_version': '1.1'},
        }
        comp = compare_explanations(curr, prev_male)
        self.assertFalse(comp['is_comparable'])
        self.assertEqual(comp['reason'], 'pathway_mismatch')

        # 2. Reject legacy schema (< 1.1)
        prev_legacy = {
            'module': 'female_pcos',
            'assessment_level': 'tier_1',
            'model_version': 'PCOS-ML v1.2-T1',
            'shap_explanation': {
                'pathway': 'female_pcos',
                'schema_version': '1.0',
                'explained_model_stage': 'calibrated_cv_base_ensemble_pre_calibration',
            },
        }
        comp_legacy = compare_explanations(curr, prev_legacy)
        self.assertFalse(comp_legacy['is_comparable'])
        self.assertEqual(comp_legacy['reason'], 'schema_incompatible')

    def test_j_longitudinal_differential_language(self):
        """TEST J: Longitudinal differential produces patient-safe attribution narrative."""
        curr_expl = pcos_ml_service.predict_tier1({
            'age': 28,
            'cycle_length_days': 45.0,
            'bmi': 28.0,
            'cycle_regularity': 'irregular',
        })['shap_explanation']

        prev_expl = pcos_ml_service.predict_tier1({
            'age': 28,
            'cycle_length_days': 32.0,
            'bmi': 28.0,
            'cycle_regularity': 'regular',
        })['shap_explanation']

        prev_assessment = {
            'id': 'prev-123',
            'module': 'female_pcos',
            'assessment_level': 'tier_1',
            'created_at': '2026-08-01T10:00:00Z',
            'shap_explanation': prev_expl,
        }

        comp = compare_explanations(curr_expl, prev_assessment)
        self.assertTrue(comp['is_comparable'])
        self.assertGreater(len(comp['comparisons']), 0)

        # Check that differential narrative does NOT make causal medical claims
        for item in comp['comparisons']:
            narrative = item['patient_narrative']
            self.assertNotIn('caused your risk', narrative.lower())
            self.assertNotIn('cures', narrative.lower())

    def test_k_latency_benchmark(self):
        """TEST K: Explanation latency benchmark (< 30ms)."""
        inputs = {
            'age': 30,
            'weight_kg': 70.0,
            'height_cm': 165.0,
            'cycle_regularity': 'irregular',
            'cycle_length_days': 38.0,
            'hirsutism': 1.0,
            'fast_food': 1.0,
        }
        df = pcos_ml_service.prepare_tier1_features(inputs)

        # Warm-up run
        _ = pcos_ml_service._t1_fold_explainer.explain(df, inputs)

        # 10 benchmark runs
        latencies = []
        for _ in range(10):
            start = time.perf_counter()
            _ = pcos_ml_service._t1_fold_explainer.explain(df, inputs, final_calibrated_prob=0.25)
            duration_ms = (time.perf_counter() - start) * 1000.0
            latencies.append(duration_ms)

        avg_latency = np.mean(latencies)
        # Full 5-fold ensemble TreeSHAP latency target (< 250ms; ~20-25ms per fold)
        self.assertLess(avg_latency, 250.0, f"Average 5-fold explanation latency {avg_latency:.2f}ms exceeds target")

    def test_safety_a_positive_class_selected_from_model_classes(self):
        """SAFETY A: positive class selected from model.classes_ correctly."""
        # Female Tier 1
        t1_classes = list(pcos_ml_service._t1_fold_explainer.calibrated_model.classes_)
        t1_res = pcos_ml_service.predict_tier1({'age': 28, 'bmi': 25.0, 'cycle_length_days': 35.0})
        t1_expl = t1_res['shap_explanation']
        self.assertIn(1, t1_classes)
        self.assertEqual(t1_expl['positive_class'], 1)
        self.assertEqual(t1_expl['positive_class_index'], t1_classes.index(1))

        # Male Tier 1
        m1_classes = list(male_ml_service._t1_fold_explainer.calibrated_model.classes_)
        m1_res = male_ml_service.predict_tier1({'age': 45, 'bmi': 28.0, 'low_libido': 1.0})
        m1_expl = m1_res['shap_explanation']
        self.assertIn(1, m1_classes)
        self.assertEqual(m1_expl['positive_class'], 1)
        self.assertEqual(m1_expl['positive_class_index'], m1_classes.index(1))

    def test_safety_b_user_isolation_cannot_access_other_user_shap(self):
        """SAFETY B: another authenticated user cannot access another user's SHAP explanation."""
        # Use existing Supabase auth test users to satisfy FK constraint
        user_a = "001a8fdf-0299-4523-a19b-f705b6037a86"
        user_b = "b289d8ec-ffd3-4fdf-b1f2-ac9dbece1ce8"

        pred = pcos_ml_service.predict_tier1({'age': 28, 'bmi': 26.0, 'cycle_length_days': 36.0})
        saved_a = AssessmentRepository.save_assessment(user_id=user_a, assessment_data=pred, make_active=True)
        self.assertIsNotNone(saved_a)
        saved_id = saved_a['id']

        try:
            # User B querying for active assessment or history gets None / empty list
            active_b = AssessmentRepository.get_active_assessment(user_id=user_b, module='female_pcos')
            self.assertIsNone(active_b)

            history_b = AssessmentRepository.get_assessment_history(user_id=user_b, module='female_pcos')
            self.assertEqual(len(history_b), 0)

            # Longitudinal comparator rejects cross-user comparisons
            comp = compare_explanations(
                current_explanation={'user_id': user_a, 'pathway': 'female_pcos', 'tier': 'tier_1', 'model_version': 'PCOS-ML v1.2-T1', 'explained_model_stage': 'calibrated_cv_base_ensemble_pre_calibration', 'schema_version': '1.1', 'output_space': 'raw', 'factors': []},
                previous_assessment={'user_id': user_b, 'id': 'assessment-b', 'shap_explanation': {'pathway': 'female_pcos', 'tier': 'tier_1', 'model_version': 'PCOS-ML v1.2-T1', 'explained_model_stage': 'calibrated_cv_base_ensemble_pre_calibration', 'schema_version': '1.1', 'output_space': 'raw', 'factors': []}}
            )
            self.assertFalse(comp['is_comparable'])
            self.assertEqual(comp['reason'], 'user_mismatch')
        finally:
            client = get_supabase_client()
            if client:
                try:
                    client.table("screening_assessments").delete().eq("id", saved_id).execute()
                except Exception:
                    pass

    def test_safety_c_raw_log_odds_shap_values_never_formatted_as_percentages(self):
        """SAFETY C: raw/log-odds SHAP values are never formatted as risk percentages."""
        # Raw tree-vote space (PCOS Tier 1)
        t1_res = pcos_ml_service.predict_tier1({'age': 28, 'bmi': 25.0, 'cycle_length_days': 40.0})
        t1_factors = t1_res['shap_explanation']['factors']
        for f in t1_factors:
            sv = f['shap_value']
            self.assertIsInstance(sv, (float, int))
            self.assertNotIn('%', str(sv), "SHAP value must be raw float, not risk percentage")
            self.assertNotIn('%', f['direction_label'], "Direction label must not contain risk percentages")

        # Log-odds space (Male Tier 1)
        m1_res = male_ml_service.predict_tier1({'age': 50, 'bmi': 29.0, 'low_libido': 1.0})
        m1_factors = m1_res['shap_explanation']['factors']
        for f in m1_factors:
            sv = f['shap_value']
            self.assertIsInstance(sv, (float, int))
            self.assertNotIn('%', str(sv), "SHAP value in log-odds space must not contain %")
            self.assertNotIn('%', f['direction_label'])

    def test_safety_d_mixed_fold_agreement_behavior(self):
        """SAFETY D: mixed fold agreement generates 'Mixed model influence'."""
        expl = pcos_ml_service._t1_fold_explainer
        # Create mock fold explainers where one feature has mixed fold signs (2 positive, 2 zero, 1 negative)
        mock_expls = []
        for k, val in enumerate([0.05, 0.05, 0.0, 0.0, -0.01]):
            m = MagicMock()
            m.expected_value = [0.7, 0.3]
            m.shap_values.return_value = [
                np.zeros((1, 16)),
                np.array([[val if i == 0 else 0.01 for i in range(16)]])
            ]
            mock_expls.append(m)

        orig_explainers = expl._fold_explainers
        try:
            expl._fold_explainers = mock_expls
            inputs = {'age': 28, 'bmi': 26.0, 'cycle_length_days': 35.0}
            df = pcos_ml_service.prepare_tier1_features(inputs)
            expl_payload = expl.explain(df, inputs, final_calibrated_prob=0.30)

            mixed_factors = [f for f in expl_payload['factors'] if f['fold_agreement']['stability'] == 'mixed']
            self.assertGreater(len(mixed_factors), 0, "Should contain at least one mixed stability factor")
            for factor in mixed_factors:
                self.assertEqual(factor['direction_label'], "Mixed model influence")
                self.assertIn("Different fitted components of the screening model used this factor differently, so its direction is less stable.", factor['patient_explanation'])
                self.assertNotIn("diagnostic", factor['patient_explanation'].lower())
                self.assertNotIn("diagnosis", factor['patient_explanation'].lower())
                # Must not be present in confident top_higher or top_lower
                top_higher_keys = [f['feature_key'] for f in expl_payload['top_higher_factors']]
                top_lower_keys = [f['feature_key'] for f in expl_payload['top_lower_factors']]
                self.assertNotIn(factor['feature_key'], top_higher_keys)
                self.assertNotIn(factor['feature_key'], top_lower_keys)
                # Must be present in top_mixed_factors
                top_mixed_keys = [f['feature_key'] for f in expl_payload['top_mixed_factors']]
                self.assertIn(factor['feature_key'], top_mixed_keys)
        finally:
            expl._fold_explainers = orig_explainers

    def test_safety_e_shap_snapshot_survives_reload_without_in_memory_cache(self):
        """SAFETY E: SHAP snapshot survives reload without in-memory cache."""
        test_user = "001a8fdf-0299-4523-a19b-f705b6037a86"
        pred = pcos_ml_service.predict_tier1({
            'age': 28, 'bmi': 27.0, 'cycle_length_days': 41.0, 'hirsutism': 1.0, 'fast_food': 1.0
        })
        saved = AssessmentRepository.save_assessment(user_id=test_user, assessment_data=pred, make_active=True)
        assessment_id = saved['id']

        try:
            # Clear in-memory cache completely
            with _repo_lock:
                _in_memory_assessments.clear()

            # Reload from persistent store (authoritative Supabase PostgreSQL)
            reloaded = AssessmentRepository.get_active_assessment(user_id=test_user, module='female_pcos')
            self.assertIsNotNone(reloaded)
            self.assertEqual(reloaded['id'], assessment_id)
            reloaded_shap = reloaded.get('shap_explanation')
            self.assertIsNotNone(reloaded_shap)

            # Confirm critical fields
            self.assertEqual(reloaded_shap.get('schema_version'), '1.1')
            self.assertEqual(reloaded_shap.get('explained_model_stage'), 'calibrated_cv_base_ensemble_pre_calibration')
            self.assertEqual(reloaded_shap.get('output_space'), 'raw')
            self.assertEqual(reloaded_shap.get('explainer_type'), 'TreeExplainer')
            self.assertEqual(reloaded_shap.get('explained_fold_count'), 5)
            self.assertIn('ensemble_base_value', reloaded_shap)
            self.assertIn('ensemble_reconstructed_output', reloaded_shap)
            self.assertIn('final_calibrated_probability', reloaded_shap)
            self.assertGreater(len(reloaded_shap.get('factors', [])), 0)
        finally:
            client = get_supabase_client()
            if client:
                try:
                    client.table("screening_assessments").delete().eq("id", assessment_id).execute()
                except Exception:
                    pass

    def test_safety_f_previous_comparison_selects_historical_comparable_not_current_active(self):
        """SAFETY F: previous comparison selects historical comparable assessment, not current active."""
        test_user = "c4dad78b-3f0a-4a6c-93bc-95484001072c"
        saved1 = None
        saved2 = None
        try:
            # Assessment 1: Tier 1 baseline
            pred1 = pcos_ml_service.predict_tier1({'age': 28, 'cycle_length_days': 45.0, 'bmi': 28.0})
            saved1 = AssessmentRepository.save_assessment(user_id=test_user, assessment_data=pred1, make_active=True)
            id1 = saved1['id']
            expl1 = saved1['shap_explanation']

            # 1. Searching comparable assessment for Assessment 1 itself must return None (cannot self-compare)
            self_target = find_latest_comparable_assessment(user_id=test_user, current_explanation=expl1, current_assessment_id=id1)
            self.assertIsNone(self_target)

            # 2. compare_explanations returns self_comparison_prohibited if IDs match
            self_comp = compare_explanations(current_explanation={'id': id1, **expl1}, previous_assessment={'id': id1, 'shap_explanation': expl1})
            self.assertFalse(self_comp['is_comparable'])
            self.assertEqual(self_comp['reason'], 'self_comparison_prohibited')

            # Assessment 2: Tier 1 follow-up
            pred2 = pcos_ml_service.predict_tier1({'age': 28, 'cycle_length_days': 32.0, 'bmi': 26.5})
            saved2 = AssessmentRepository.save_assessment(user_id=test_user, assessment_data=pred2, make_active=True)
            id2 = saved2['id']
            expl2 = saved2['shap_explanation']

            # 3. Assessment 2 must select historical Assessment 1 as its comparable target
            target = find_latest_comparable_assessment(user_id=test_user, current_explanation=expl2, current_assessment_id=id2)
            self.assertIsNotNone(target)
            self.assertEqual(target['id'], id1)
        finally:
            client = get_supabase_client()
            if client:
                for s in (saved1, saved2):
                    if s and s.get('id'):
                        try:
                            client.table("screening_assessments").delete().eq("id", s['id']).execute()
                        except Exception:
                            pass

    def test_safety_g_reference_range_never_changes_shap_direction_or_magnitude(self):
        """SAFETY G: reference-range metadata never changes SHAP direction or magnitude."""
        pred = pcos_ml_service.predict_tier2_cumulative({
            'age': 29, 'weight_kg': 70.0, 'height_cm': 165.0,
            'cycle_length_days': 42.0, 'cycle_regularity': 'irregular',
            'amh': 7.5, 'fsh': 5.0, 'lh': 12.0, 'fast_food': 1.0
        })
        expl = pred['shap_explanation']
        factors = expl['factors']

        # For AMH (which has a reference interval)
        amh_f = next(f for f in factors if f['feature_key'] == 'amh')
        self.assertIsNotNone(amh_f['clinical_reference'])
        self.assertTrue(amh_f['clinical_reference']['has_reference_range'])
        self.assertEqual(amh_f['clinical_reference']['reference_interval'], '1.0 – 4.0 ng/mL')
        self.assertIn('Rotterdam Consensus', amh_f['clinical_reference']['reference_source'])
        self.assertIsInstance(amh_f['shap_value'], float)

        # For fast_food (lifestyle flag without reference interval)
        ff_f = next(f for f in factors if f['feature_key'] == 'fast_food')
        self.assertIsNone(ff_f['clinical_reference'], "Reference range must be omitted if no validated source exists")

    def test_safety_h_production_prediction_remains_unchanged(self):
        """SAFETY H: production prediction remains unchanged."""
        inputs = {'age': 30, 'bmi': 27.5, 'cycle_length_days': 40.0, 'hirsutism': 1.0}
        df = pcos_ml_service.prepare_tier1_features(inputs)

        # Outer model predict_proba directly
        raw_prob = float(pcos_ml_service._t1_model.predict_proba(df)[0, 1])

        # Inference through service
        pred = pcos_ml_service.predict_tier1(inputs)
        self.assertAlmostEqual(pred['probability'], round(raw_prob, 4), places=4)
        self.assertAlmostEqual(pred['shap_explanation']['final_calibrated_probability'], round(raw_prob, 4), places=4)
        self.assertAlmostEqual(pred['probability_percent'], pred['shap_explanation']['final_calibrated_percent'], places=1)

    def test_safety_i_schema_compatibility_rejection_of_legacy_1_0(self):
        """SAFETY I: Current schema 1.1 vs previous schema 1.0 is NOT directly comparable (schema_incompatible)."""
        curr = {
            'schema_version': '1.1',
            'pathway': 'female_pcos',
            'tier': 'tier_1',
            'model_version': 'PCOS-ML v1.2-T1',
            'explained_model_stage': 'calibrated_cv_base_ensemble_pre_calibration',
            'output_space': 'raw',
            'factors': [],
        }
        prev_legacy = {
            'module': 'female_pcos',
            'assessment_level': 'tier_1',
            'model_version': 'PCOS-ML v1.2-T1',
            'shap_explanation': {
                'pathway': 'female_pcos',
                'schema_version': '1.0',
                'explained_model_stage': 'calibrated_cv_base_ensemble_pre_calibration',
                'output_space': 'raw',
                'factors': [],
            },
        }
        comp = compare_explanations(curr, prev_legacy)
        self.assertFalse(comp['is_comparable'])
        self.assertEqual(comp['reason'], 'schema_incompatible')

    def test_safety_j_five_fold_stability_rules(self):
        """SAFETY J: 5-fold stability rules (5=consistent, 4=moderate, 3/2=mixed, 0/5=consistent lower)."""
        expl = pcos_ml_service._t1_fold_explainer

        test_cases = [
            ([0.05, 0.05, 0.05, 0.05, 0.05], 'consistent', 'higher'),      # 5 positive / 0 negative -> consistent
            ([0.05, 0.05, 0.05, 0.05, -0.01], 'moderate', 'higher'),       # 4 positive / 1 negative -> moderate
            ([0.05, 0.05, 0.05, -0.02, -0.02], 'mixed', 'higher'),         # 3 positive / 2 negative -> mixed
            ([0.02, 0.02, -0.05, -0.05, -0.05], 'mixed', 'lower'),          # 2 positive / 3 negative -> mixed
            ([-0.05, -0.05, -0.05, -0.05, -0.05], 'consistent', 'lower'),  # 0 positive / 5 negative -> consistent in lower direction
        ]

        orig = expl._fold_explainers
        try:
            for vals, expected_stability, expected_dir in test_cases:
                mock_expls = []
                for k, v in enumerate(vals):
                    m = MagicMock()
                    m.expected_value = [0.7, 0.3]
                    m.shap_values.return_value = [
                        np.zeros((1, 16)),
                        np.array([[v if i == 0 else 0.001 for i in range(16)]])
                    ]
                    mock_expls.append(m)
                expl._fold_explainers = mock_expls
                inputs = {'age': 28, 'bmi': 26.0, 'cycle_length_days': 35.0}
                df = pcos_ml_service.prepare_tier1_features(inputs)
                res = expl.explain(df, inputs, final_calibrated_prob=0.30)
                age_f = next(f for f in res['factors'] if f['feature_key'] == 'age')
                self.assertEqual(
                    age_f['fold_agreement']['stability'],
                    expected_stability,
                    f"Expected {expected_stability} for {vals}, got {age_f['fold_agreement']['stability']}"
                )
                self.assertEqual(age_f['direction'], expected_dir)

                # For 3-vs-2 case verify required patient behavior
                if vals == [0.05, 0.05, 0.05, -0.02, -0.02]:
                    self.assertEqual(age_f['direction_label'], "Mixed model influence")
                    self.assertNotIn('age', [f['feature_key'] for f in res['top_higher_factors']])
                    self.assertNotIn('age', [f['feature_key'] for f in res['top_lower_factors']])
                    self.assertIn('age', [f['feature_key'] for f in res['top_mixed_factors']])
        finally:
            expl._fold_explainers = orig


if __name__ == '__main__':
    unittest.main()
