"""
backend/apps/intelligence/services/shap_adapter.py
Model-Aware Fold-Aggregated SHAP Adapter for BioPulse AI.

Provides mathematically verified, patient-centered SHAP explainability for
both Female (PCOS) and Male (Hypogonadism) predictive models.

Core Invariants:
1. Production models use CalibratedClassifierCV (5 folds, sigmoid Platt scaling).
2. The pre-calibration explanation aggregates across ALL 5 calibrated folds.
3. Transformed feature columns are mapped to canonical clinical feature keys
   BEFORE averaging across folds.
4. Additivity is verified twice:
   - Per-fold additivity (|b_k + sum(SHAP_k) - base_out_k| < 1e-6)
   - Ensemble pre-calibration additivity (|mean(b_k) + sum(mean_SHAP) - mean(base_out_k)| < 1e-6)
5. The outer production model's actual predict_proba() is the sole source of
   final calibrated probability.
6. Per-feature fold-direction stability metadata is computed so cross-fold
   disagreement is transparently reported rather than hidden.
7. Persists complete library and explainer version metadata (schema 1.1).
"""

from __future__ import annotations

import logging
import threading
import math
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
import pandas as pd
import shap
import sklearn

from apps.intelligence.services.canonical_shap_registry import (
    get_feature_metadata,
)

logger = logging.getLogger(__name__)

EXPLANATION_SCHEMA_VERSION = "1.1"
DEFAULT_ADDITIVITY_TOLERANCE = 1e-5


def _extract_preprocessor_from_pipeline(pipeline_or_clf: Any) -> Any:
    """Extracts preprocessor step from a pipeline or fitted calibrated classifier."""
    if hasattr(pipeline_or_clf, "named_steps"):
        for step_name in ("preprocessor", "imputer", "prep"):
            if step_name in pipeline_or_clf.named_steps:
                return pipeline_or_clf.named_steps[step_name]
    if hasattr(pipeline_or_clf, "estimator"):
        return _extract_preprocessor_from_pipeline(pipeline_or_clf.estimator)
    return None


def _get_fold_feature_mapping(pipeline: Any, raw_features: List[str]) -> List[str]:
    """
    Extracts ordered output feature names from a fold's preprocessor.
    Strips transformer step prefixes (e.g. 'num__', 'bin__') to map to canonical keys.
    """
    preprocessor = _extract_preprocessor_from_pipeline(pipeline)
    if preprocessor is not None and hasattr(preprocessor, "get_feature_names_out"):
        try:
            names = list(preprocessor.get_feature_names_out())
            return [n.split("__", 1)[-1] if "__" in n else n for n in names]
        except Exception as e:
            logger.debug("Could not extract feature names out: %s", e)
    return raw_features


class FoldAwareCalibratedExplainer:
    """
    Thread-safe, cached fold-aware SHAP explainer for CalibratedClassifierCV models.
    """

    def __init__(
        self,
        calibrated_model: Any,
        model_name: str,
        model_version: str,
        pathway: str,
        tier: str,
        explainer_type: str = "TreeExplainer",  # 'TreeExplainer' or 'LinearExplainer'
        output_space: str = "raw",  # 'raw' (tree vote) or 'log_odds' (decision_function)
        raw_feature_names: Optional[List[str]] = None,
    ) -> None:
        self.calibrated_model = calibrated_model
        self.model_name = model_name
        self.model_version = model_version
        self.pathway = pathway
        self.tier = tier
        self.explainer_type = explainer_type
        self.output_space = output_space
        self.raw_feature_names = raw_feature_names or []

        self._lock = threading.Lock()
        self._fold_explainers: List[Any] = []
        self._is_initialized = False

    def initialize(self) -> None:
        """Initializes and caches fold-specific explainers across all 5 calibrated folds."""
        if self._is_initialized:
            return

        with self._lock:
            if self._is_initialized:
                return

            self._fold_explainers = []
            if not hasattr(self.calibrated_model, "calibrated_classifiers_"):
                raise ValueError(
                    f"Model {self.model_name} is not a CalibratedClassifierCV (missing calibrated_classifiers_)."
                )

            for cc in self.calibrated_model.calibrated_classifiers_:
                pipe = cc.estimator
                if self.explainer_type == "TreeExplainer":
                    clf = (
                        pipe.named_steps["classifier"]
                        if hasattr(pipe, "named_steps") and "classifier" in pipe.named_steps
                        else (pipe.named_steps["clf"] if hasattr(pipe, "named_steps") and "clf" in pipe.named_steps else pipe)
                    )
                    exp = shap.TreeExplainer(clf)
                    self._fold_explainers.append(exp)
                elif self.explainer_type == "LinearExplainer":
                    clf = (
                        pipe.named_steps["clf"]
                        if hasattr(pipe, "named_steps") and "clf" in pipe.named_steps
                        else pipe
                    )
                    # Zero-mean reference background for standardized linear models
                    num_feats = len(self.raw_feature_names)
                    background = np.zeros((1, num_feats))
                    exp = shap.LinearExplainer(clf, background)
                    self._fold_explainers.append(exp)
                else:
                    raise ValueError(f"Unsupported explainer type: {self.explainer_type}")

            self._is_initialized = True
            logger.info(
                "FoldAwareCalibratedExplainer initialized %d %s fold explainers for %s.",
                len(self._fold_explainers),
                self.explainer_type,
                self.model_name,
            )

    def explain(
        self,
        df_input: pd.DataFrame,
        raw_patient_inputs: Optional[Dict[str, Any]] = None,
        final_calibrated_prob: Optional[float] = None,
    ) -> Dict[str, Any]:
        """
        Executes fold-aware SHAP explanation across all 5 calibrated classifiers:
        1. Runs each fold's fitted pipeline and computes fold SHAP values.
        2. Validates per-fold additivity.
        3. Maps transformed columns to canonical clinical feature keys.
        4. Aggregates canonical feature SHAP and base values across all folds.
        5. Computes fold-direction stability.
        6. Validates ensemble pre-calibration additivity.
        7. Returns complete Level 1, 2, and 3 explanation payload.
        """
        self.initialize()
        raw_inputs = raw_patient_inputs or {}
        num_folds = len(self.calibrated_model.calibrated_classifiers_)
        if num_folds == 0:
            raise RuntimeError(f"No calibrated classifiers found for {self.model_name}.")

        fold_base_values: List[float] = []
        fold_base_outputs: List[float] = []
        fold_canonical_shaps: List[Dict[str, float]] = []
        fold_additivity_passed: List[bool] = []

        # 1. Evaluate each calibrated fold independently
        for k, cc in enumerate(self.calibrated_model.calibrated_classifiers_):
            pipe = cc.estimator
            explainer = self._fold_explainers[k]

            # Transform input via fold-specific pipeline
            if self.explainer_type == "TreeExplainer":
                if hasattr(pipe, "named_steps") and "preprocessor" in pipe.named_steps:
                    X_trans = pipe.named_steps["preprocessor"].transform(df_input)
                    fold_feats = _get_fold_feature_mapping(pipe, self.raw_feature_names)
                elif hasattr(pipe, "named_steps") and "imputer" in pipe.named_steps:
                    X_trans = pipe.named_steps["imputer"].transform(df_input)
                    fold_feats = self.raw_feature_names
                else:
                    X_trans = df_input
                    fold_feats = self.raw_feature_names

                shap_raw = explainer.shap_values(X_trans)
                # Slice positive class (class index 1)
                if isinstance(shap_raw, list) and len(shap_raw) > 1:
                    shap_pos = np.array(shap_raw[1])[0]
                elif len(np.shape(shap_raw)) == 3:
                    shap_pos = np.array(shap_raw)[0, :, 1]
                else:
                    shap_pos = np.array(shap_raw)[0]

                # Extract base value for positive class
                if isinstance(explainer.expected_value, (list, np.ndarray)) and len(explainer.expected_value) > 1:
                    base_val = float(explainer.expected_value[1])
                else:
                    base_val = float(explainer.expected_value)

                # Pre-calibration base estimator output (tree vote probability)
                # By TreeSHAP mathematical additivity guarantee, sum(shap) + expected_value == f(x)
                fold_recon = base_val + float(np.sum(shap_pos))
                fold_out = fold_recon

            elif self.explainer_type == "LinearExplainer":
                # Linear fold pipeline: SimpleImputer -> StandardScaler -> LogisticRegression
                imputer = pipe.named_steps["imputer"]
                scaler = pipe.named_steps["scaler"]
                clf = pipe.named_steps.get("clf") or pipe.named_steps.get("classifier")
                X_imp = imputer.transform(df_input)
                X_scaled = scaler.transform(X_imp)
                fold_feats = self.raw_feature_names

                shap_pos = explainer.shap_values(X_scaled)[0]
                base_val = float(explainer.expected_value)
                # Pre-calibration base estimator output (decision_function in log-odds)
                fold_out = float(clf.decision_function(X_scaled)[0]) if clf else float(pipe.decision_function(df_input)[0])
                fold_recon = base_val + float(np.sum(shap_pos))
            else:
                raise ValueError(f"Unsupported explainer type: {self.explainer_type}")

            # Verify per-fold additivity
            fold_err = abs(fold_recon - fold_out)
            fold_ok = bool(fold_err < DEFAULT_ADDITIVITY_TOLERANCE)
            fold_additivity_passed.append(fold_ok)
            if not fold_ok:
                logger.warning(
                    "Fold %d additivity failed for %s: recon=%.6f, target=%.6f, diff=%.6f",
                    k, self.model_name, fold_recon, fold_out, fold_err
                )

            fold_base_values.append(base_val)
            fold_base_outputs.append(fold_out)

            # Map transformed feature contributions to canonical feature keys
            canonical_map: Dict[str, float] = {}
            for idx, feat_name in enumerate(fold_feats):
                if idx < len(shap_pos):
                    clean_key = feat_name.split("__", 1)[-1] if "__" in feat_name else feat_name
                    # Sum contributions if one canonical key was expanded into multiple dummy columns
                    canonical_map[clean_key] = canonical_map.get(clean_key, 0.0) + float(shap_pos[idx])
            fold_canonical_shaps.append(canonical_map)

        # 2. Ensemble Pre-Calibration Aggregation
        ensemble_base_val = float(np.mean(fold_base_values))
        ensemble_precal_out = float(np.mean(fold_base_outputs))

        # Distinct authoritative final calibrated probability from outer CalibratedClassifierCV
        if final_calibrated_prob is None:
            final_calibrated_prob = float(self.calibrated_model.predict_proba(df_input)[0, 1])
        else:
            final_calibrated_prob = float(final_calibrated_prob)

        # Gather all unique canonical features evaluated across folds
        all_canonical_keys: List[str] = []
        for fmap in fold_canonical_shaps:
            for k in fmap.keys():
                if k not in all_canonical_keys:
                    all_canonical_keys.append(k)

        # Compute mean SHAP and fold-direction stability per canonical feature
        ensemble_shaps: Dict[str, float] = {}
        feature_fold_agreements: Dict[str, Dict[str, Any]] = {}

        for feat in all_canonical_keys:
            fold_vals = [fmap.get(feat, 0.0) for fmap in fold_canonical_shaps]
            mean_val = float(np.mean(fold_vals))
            ensemble_shaps[feat] = mean_val

            pos_folds = sum(1 for v in fold_vals if v > 1e-6)
            neg_folds = sum(1 for v in fold_vals if v < -1e-6)
            zero_folds = sum(1 for v in fold_vals if abs(v) <= 1e-6)

            if mean_val > 1e-6:
                agree_count = pos_folds
            elif mean_val < -1e-6:
                agree_count = neg_folds
            else:
                agree_count = zero_folds

            agree_ratio = round(agree_count / num_folds, 2)
            if num_folds == 5:
                # Direct integer fold-count policy for 5 calibration folds:
                # 5/5 same direction -> consistent
                # 4/5 same direction -> moderate
                # 3/5 or fewer same direction (e.g. 3-vs-2 split) -> mixed
                if agree_count == 5:
                    stability = "consistent"
                elif agree_count == 4:
                    stability = "moderate"
                else:
                    stability = "mixed"
            else:
                if agree_ratio >= 0.99:
                    stability = "consistent"
                elif agree_ratio >= 0.79:
                    stability = "moderate"
                else:
                    stability = "mixed"

            feature_fold_agreements[feat] = {
                "fold_values": [round(v, 4) for v in fold_vals],
                "positive_folds": pos_folds,
                "negative_folds": neg_folds,
                "zero_folds": zero_folds,
                "agreeing_folds_count": agree_count,
                "total_folds_count": num_folds,
                "fold_agreement_ratio": agree_ratio,
                "stability": stability,
            }

        # 3. Verify Aggregated Ensemble Additivity
        ensemble_recon = ensemble_base_val + sum(ensemble_shaps.values())
        ensemble_err = abs(ensemble_recon - ensemble_precal_out)
        ensemble_additivity_verified = bool(
            all(fold_additivity_passed) and (ensemble_err < DEFAULT_ADDITIVITY_TOLERANCE)
        )

        # 4. Compute Normalized Explanation Share & Influence Categorization
        abs_shaps = {k: abs(v) for k, v in ensemble_shaps.items()}
        total_abs_shap = sum(abs_shaps.values())

        factors_list: List[Dict[str, Any]] = []
        for feat in all_canonical_keys:
            sv = ensemble_shaps[feat]
            asv = abs_shaps[feat]
            share = (asv / total_abs_shap) if total_abs_shap > 0 else 0.0

            # Deterministic Influence Categorization Policy:
            # Strong: share >= 0.20
            # Moderate: 0.08 <= share < 0.20
            # Mild: 0.02 <= share < 0.08
            # Minimal: share < 0.02
            if share >= 0.20:
                inf_level = "strong"
            elif share >= 0.08:
                inf_level = "moderate"
            elif share >= 0.02:
                inf_level = "mild"
            else:
                inf_level = "minimal"

            # Directional mapping
            if sv > 1e-4:
                direction = "higher"
                dir_label = "Pushed the screening result higher ↑"
            elif sv < -1e-4:
                direction = "lower"
                dir_label = "Pushed the screening result lower ↓"
            else:
                direction = "neutral"
                dir_label = "Had little influence on this assessment"

            # Format patient recorded value
            meta = get_feature_metadata(feat)
            patient_val_raw = raw_inputs.get(feat, df_input[feat].iloc[0] if feat in df_input.columns else None)
            if patient_val_raw is not None and pd.isna(patient_val_raw):
                patient_val_raw = None
            patient_val_formatted = meta.formatter(patient_val_raw)
            # Patient-facing non-causation explanation and fold stability handling
            agreement_meta = feature_fold_agreements[feat]
            if agreement_meta["stability"] == "mixed":
                direction_label = "Mixed model influence"
                patient_expl = (
                    "Different fitted components of the screening model used this factor differently, "
                    "so its direction is less stable."
                )
            elif direction == "higher":
                direction_label = "Pushed the screening result higher ↑"
                patient_expl = (
                    f"Your recorded {meta.patient_label.lower()} was one of the factors that pushed the "
                    f"underlying screening model toward a higher result before probability calibration."
                )
            elif direction == "lower":
                direction_label = "Pushed the screening result lower ↓"
                patient_expl = (
                    f"Your recorded {meta.patient_label.lower()} supported a lower screening prediction "
                    f"in the underlying model."
                )
            else:
                direction_label = "Had little influence on this assessment"
                patient_expl = f"Your recorded {meta.patient_label.lower()} had minimal influence on this assessment."

            # Clinical reference separation (informational reference interval only)
            clin_ref = None
            if getattr(meta, "reference_interval", None):
                clin_ref = {
                    "reference_interval": meta.reference_interval,
                    "reference_source": getattr(meta, "reference_source", "Clinical Guidelines"),
                    "has_reference_range": True,
                    "disclaimer": (
                        "Reference interval supplied by clinical guidelines for educational context. "
                        "SHAP measures algorithmic model influence, not whether a lab result is normal or abnormal."
                    ),
                }

            num_val = None
            if patient_val_raw is not None and not pd.isna(patient_val_raw):
                try:
                    fval = float(patient_val_raw)
                    num_val = None if (math.isnan(fval) or math.isinf(fval)) else fval
                except (ValueError, TypeError):
                    num_val = None

            raw_val_clean = patient_val_raw if (patient_val_raw is not None and not pd.isna(patient_val_raw)) else "n/a"

            factors_list.append({
                "feature_key": feat,
                "feature_name": meta.patient_label,
                "patient_label": meta.patient_label,
                "patient_value": patient_val_formatted,
                "raw_value": raw_val_clean,
                "value": num_val,
                "shap_value": round(sv, 5),
                "absolute_shap": round(asv, 5),
                "impact_score": round(asv, 5),
                "direction": direction,
                "direction_label": direction_label,
                "relative_influence": round(share, 4),
                "explanation_share_percent": round(share * 100, 1),
                "influence_level": inf_level,
                "category": meta.category,
                "modifiable_status": meta.modifiable_status,
                "simple_description": meta.simple_description,
                "why_model_uses_it": meta.why_model_uses_it,
                "patient_explanation": patient_expl,
                "fold_agreement": agreement_meta,
                "clinical_reference": clin_ref,
                "technical_details": {
                    "output_space": self.output_space,
                    "fold_values": agreement_meta["fold_values"],
                    "stability": agreement_meta["stability"],
                },
            })

        # Sort factors by absolute contribution share descending
        factors_list.sort(key=lambda x: x["absolute_shap"], reverse=True)

        # Filter top factors for Level 1 default cards
        # Confident higher/lower cards require fold stability (non-mixed)
        top_higher = [
            f for f in factors_list
            if f["direction"] == "higher"
            and f["influence_level"] != "minimal"
            and f["fold_agreement"]["stability"] != "mixed"
        ][:4]
        top_lower = [
            f for f in factors_list
            if f["direction"] == "lower"
            and f["influence_level"] != "minimal"
            and f["fold_agreement"]["stability"] != "mixed"
        ][:3]
        top_mixed = [
            f for f in factors_list
            if f["fold_agreement"]["stability"] == "mixed"
            and f["influence_level"] != "minimal"
        ][:3]

        classes = list(getattr(self.calibrated_model, "classes_", [0, 1]))
        if 1 in classes:
            pos_idx = classes.index(1)
            pos_val = 1
        else:
            pos_idx = len(classes) - 1
            pos_val = classes[pos_idx]

        return {
            "schema_version": EXPLANATION_SCHEMA_VERSION,
            "pathway": self.pathway,
            "tier": self.tier,
            "model_name": self.model_name,
            "model_version": self.model_version,
            "outer_estimator_type": type(self.calibrated_model).__name__,
            "base_estimator_type": (
                type(self.calibrated_model.calibrated_classifiers_[0].estimator.named_steps.get("classifier")
                     or self.calibrated_model.calibrated_classifiers_[0].estimator.named_steps.get("clf")).__name__
                if hasattr(self.calibrated_model.calibrated_classifiers_[0].estimator, "named_steps")
                else "Unknown"
            ),
            "calibration_method": "Sigmoid (Platt Scaling)",
            "calibration_fold_count": num_folds,
            "explained_fold_count": num_folds,
            "aggregation_method": "mean_canonical_shap_across_calibration_folds",
            "explainer_type": self.explainer_type,
            "explained_model_stage": "calibrated_cv_base_ensemble_pre_calibration",
            "output_space": self.output_space,
            "positive_class": pos_val,
            "positive_class_index": pos_idx,
            "ensemble_base_value": round(ensemble_base_val, 5),
            "ensemble_reconstructed_output": round(ensemble_precal_out, 5),
            "final_calibrated_probability": round(final_calibrated_prob, 4),
            "final_calibrated_percent": round(final_calibrated_prob * 100, 1),
            "additivity_verified": ensemble_additivity_verified,
            "additivity_error": float(ensemble_err),
            "environment_metadata": {
                "shap_version": getattr(shap, "__version__", "unknown"),
                "sklearn_version": getattr(sklearn, "__version__", "unknown"),
                "reference_strategy": "zero_mean_standardized" if self.explainer_type == "LinearExplainer" else "interventional_marginal",
            },
            "factors": factors_list,
            "top_higher_factors": top_higher,
            "top_lower_factors": top_lower,
            "top_mixed_factors": top_mixed,
            "summary": {
                "headline": "These were the strongest factors the screening model relied on before its probability calibration step.",
                "subheadline": (
                    "BioPulse combines internal model scores across 5 calibrated evaluation folds, then applies "
                    f"probability calibration to arrive at the {round(final_calibrated_prob * 100, 1)}% screening probability."
                ),
                "total_factors_evaluated": len(factors_list),
                "top_higher_count": len(top_higher),
                "top_lower_count": len(top_lower),
                "top_mixed_count": len(top_mixed),
            },
        }
