"""
backend/apps/intelligence/services/longitudinal_shap_service.py
Longitudinal SHAP Comparability & Differential Analysis Engine for BioPulse AI.

Integrates with the Longitudinal Health architecture to evaluate:
"What changed since my previous comparable assessment?"

Invariants:
1. Strict scientific comparability: pathway, tier, model version, explained_model_stage,
   fold count, and schema_version (1.1) must match.
2. Legacy single-fold explanations or schema < 1.1 are cleanly rejected with:
   "Historical model explanation is not directly comparable because the explanation method has changed."
3. Explanations never state that factor changes caused medical risk reduction;
   language is strictly model-attribution centric.
4. Historical values are read strictly from historical assessment snapshots, never today's profile.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)


def is_schema_compatible(current_schema: Any, previous_schema: Any) -> bool:
    """
    Validates SHAP explanation schema compatibility for longitudinal comparison.
    Current fold-aware explanations use schema '1.1'.
    Legacy single-fold schema '1.0' uses single-estimator diagnostics and is strictly incompatible
    with fold-aware ensemble aggregation.
    """
    if not current_schema or not previous_schema:
        return False
    curr_s = str(current_schema).strip()
    prev_s = str(previous_schema).strip()
    # Strictly reject legacy 1.0 single-fold schema
    if curr_s == "1.0" or prev_s == "1.0":
        return False
    # Valid fold-aware schemas (must be 1.1 or compatible fold-aware versions)
    valid_fold_aware_versions = {"1.1"}
    return (curr_s in valid_fold_aware_versions) and (prev_s in valid_fold_aware_versions)


def find_latest_comparable_assessment(
    user_id: str,
    current_explanation: Dict[str, Any],
    current_assessment_id: Optional[str] = None,
    auth_token: Optional[str] = None,
) -> Optional[Dict[str, Any]]:
    """
    Finds the latest historical DIRECTLY COMPARABLE assessment for the patient.
    Strictly verifies:
    - same user
    - same pathway
    - same tier
    - same model_version
    - same explained_model_stage
    - same output_space
    - compatible schema/aggregation semantics (schema 1.1 fold-aware)
    - must NOT be the current assessment
    """
    from apps.intelligence.services.assessment_repository import AssessmentRepository
    module = current_explanation.get("pathway")
    if not module:
        return None

    history = AssessmentRepository.get_assessment_history(user_id=user_id, module=module, auth_token=auth_token)
    if not history:
        return None

    curr_id = current_assessment_id or current_explanation.get("assessment_id") or current_explanation.get("id")
    curr_pathway = current_explanation.get("pathway")
    curr_tier = current_explanation.get("tier")
    curr_version = current_explanation.get("model_version")
    curr_stage = current_explanation.get("explained_model_stage")
    curr_space = current_explanation.get("output_space")
    curr_schema = current_explanation.get("schema_version")

    for rec in history:
        rec_id = rec.get("id") or rec.get("assessment_id")
        if curr_id and rec_id == curr_id:
            # The current active assessment must never compare against itself
            continue

        prev_expl = rec.get("shap_explanation")
        if not isinstance(prev_expl, dict):
            raw_exps = rec.get("explanations")
            if isinstance(raw_exps, dict) and "factors" in raw_exps:
                prev_expl = raw_exps
            else:
                continue

        # Check user
        if rec.get("user_id") and user_id and rec.get("user_id") != user_id:
            continue

        # Check pathway
        prev_pathway = prev_expl.get("pathway") or rec.get("module")
        if curr_pathway and prev_pathway and curr_pathway != prev_pathway:
            continue

        # Check tier
        prev_tier = prev_expl.get("tier") or rec.get("assessment_level")
        if curr_tier and prev_tier and curr_tier != prev_tier:
            continue

        # Check model version
        prev_version = prev_expl.get("model_version") or rec.get("model_version")
        if curr_version and prev_version and curr_version != prev_version:
            continue

        # Check explained model stage
        if curr_stage and prev_expl.get("explained_model_stage") != curr_stage:
            continue

        # Check schema version: strictly requires fold-aware schema semantics (rejects legacy 1.0)
        if not is_schema_compatible(curr_schema, prev_expl.get("schema_version")):
            continue

        # Check output space
        if curr_space and prev_expl.get("output_space") != curr_space:
            continue

        # Found the latest directly comparable historical assessment!
        return rec

    return None


def compare_explanations(
    current_explanation: Dict[str, Any],
    previous_assessment: Optional[Dict[str, Any]],
) -> Dict[str, Any]:
    """
    Compares current assessment explanation against the latest historical directly
    comparable assessment of the same patient.
    """
    if not previous_assessment:
        return {
            "is_comparable": False,
            "reason": "no_previous_assessment",
            "message": "No previous assessment found for longitudinal comparison.",
            "comparisons": [],
        }

    # 0. The current assessment must never compare against itself
    curr_id = current_explanation.get("assessment_id") or current_explanation.get("id")
    prev_id = previous_assessment.get("id") or previous_assessment.get("assessment_id")
    if curr_id and prev_id and curr_id == prev_id:
        return {
            "is_comparable": False,
            "reason": "self_comparison_prohibited",
            "message": "Current assessment cannot compare against itself.",
            "comparisons": [],
        }

    # Verify patient user_id if present
    curr_user = current_explanation.get("user_id")
    prev_user = previous_assessment.get("user_id")
    if curr_user and prev_user and curr_user != prev_user:
        return {
            "is_comparable": False,
            "reason": "user_mismatch",
            "message": "Assessments belong to different patients and cannot be compared.",
            "comparisons": [],
        }

    # Extract historical explanation payload
    prev_expl = previous_assessment.get("shap_explanation")
    if not isinstance(prev_expl, dict):
        # Check if stored inside explanations dict
        raw_explanations = previous_assessment.get("explanations")
        if isinstance(raw_explanations, dict) and "factors" in raw_explanations:
            prev_expl = raw_explanations
        else:
            return {
                "is_comparable": False,
                "reason": "missing_historical_shap",
                "message": "Historical factor explanation is unavailable for this previous assessment.",
                "comparisons": [],
            }

    # 1. Enforce strict comparability preconditions
    curr_pathway = current_explanation.get("pathway")
    prev_pathway = prev_expl.get("pathway") or previous_assessment.get("module")
    if curr_pathway and prev_pathway and curr_pathway != prev_pathway:
        return {
            "is_comparable": False,
            "reason": "pathway_mismatch",
            "message": "Assessments belong to different clinical pathways and cannot be compared.",
            "comparisons": [],
        }

    curr_tier = current_explanation.get("tier")
    prev_tier = prev_expl.get("tier") or previous_assessment.get("assessment_level")
    # Normalize tier representations (e.g. 'tier_1' == 'tier_1')
    if curr_tier and prev_tier and curr_tier != prev_tier:
        return {
            "is_comparable": False,
            "reason": "tier_mismatch",
            "message": "Assessments used different screening tiers and are not directly comparable.",
            "comparisons": [],
        }

    curr_version = current_explanation.get("model_version")
    prev_version = prev_expl.get("model_version") or previous_assessment.get("model_version")
    if curr_version and prev_version and curr_version != prev_version:
        return {
            "is_comparable": False,
            "reason": "model_version_mismatch",
            "message": "Model explanation changed after a model-version update and is not directly comparable.",
            "comparisons": [],
        }

    curr_stage = current_explanation.get("explained_model_stage")
    prev_stage = prev_expl.get("explained_model_stage")
    if curr_stage != prev_stage:
        return {
            "is_comparable": False,
            "reason": "model_stage_mismatch",
            "message": "Historical model explanation is not directly comparable because the explanation method has changed.",
            "comparisons": [],
        }

    curr_schema = current_explanation.get("schema_version")
    prev_schema = prev_expl.get("schema_version")
    if not is_schema_compatible(curr_schema, prev_schema):
        return {
            "is_comparable": False,
            "reason": "schema_incompatible",
            "message": "Historical model explanation is not directly comparable because the explanation method has changed.",
            "comparisons": [],
        }

    curr_space = current_explanation.get("output_space")
    prev_space = prev_expl.get("output_space")
    if curr_space != prev_space:
        return {
            "is_comparable": False,
            "reason": "output_space_mismatch",
            "message": "Model explanation output spaces differ and are not directly comparable.",
            "comparisons": [],
        }

    # 2. Extract and index historical factors
    prev_factors_list = prev_expl.get("factors", [])
    prev_factors_by_key: Dict[str, Dict[str, Any]] = {
        f.get("feature_key"): f for f in prev_factors_list if f.get("feature_key")
    }

    curr_factors_list = current_explanation.get("factors", [])
    comparisons: List[Dict[str, Any]] = []

    # Compare factors that are in top higher/lower or have changed significantly
    for curr_f in curr_factors_list:
        fkey = curr_f.get("feature_key")
        if not fkey:
            continue

        prev_f = prev_factors_by_key.get(fkey)
        if not prev_f:
            continue

        curr_val = curr_f.get("patient_value")
        prev_val = prev_f.get("patient_value")

        curr_inf = curr_f.get("influence_level", "minimal")
        prev_inf = prev_f.get("influence_level", "minimal")

        curr_dir = curr_f.get("direction", "neutral")
        prev_dir = prev_f.get("direction", "neutral")

        curr_shap = curr_f.get("shap_value", 0.0)
        prev_shap = prev_f.get("shap_value", 0.0)

        curr_share = curr_f.get("explanation_share_percent", 0.0)
        prev_share = prev_f.get("explanation_share_percent", 0.0)

        # Generate patient-safe differential narrative
        val_changed = str(curr_val).strip() != str(prev_val).strip()
        inf_ranks = {"strong": 3, "moderate": 2, "mild": 1, "minimal": 0}
        curr_rank = inf_ranks.get(curr_inf, 0)
        prev_rank = inf_ranks.get(prev_inf, 0)

        label = curr_f.get("patient_label", fkey.replace("_", " ").title())

        if val_changed:
            if curr_rank < prev_rank:
                narrative = (
                    f"Your recorded {label.lower()} changed ({prev_val} → {curr_val}), "
                    f"and the model relied on this factor less strongly in your latest assessment."
                )
            elif curr_rank > prev_rank:
                narrative = (
                    f"Your recorded {label.lower()} changed ({prev_val} → {curr_val}), "
                    f"and the model relied on this factor more strongly in your latest assessment."
                )
            else:
                narrative = (
                    f"Your recorded {label.lower()} changed ({prev_val} → {curr_val}), "
                    f"maintaining a similar level of relative influence in the model."
                )
        else:
            if curr_rank < prev_rank:
                narrative = (
                    f"Your recorded {label.lower()} was unchanged, but the model relied on this "
                    f"factor less strongly due to changes in other indicators."
                )
            elif curr_rank > prev_rank:
                narrative = (
                    f"Your recorded {label.lower()} was unchanged, but the model relied on this "
                    f"factor more strongly in the context of your latest profile."
                )
            else:
                narrative = (
                    f"Your recorded {label.lower()} maintained a consistent level of influence "
                    f"across both assessments."
                )

        comparisons.append({
            "feature_key": fkey,
            "patient_label": label,
            "category": curr_f.get("category"),
            "previous_value": prev_val,
            "current_value": curr_val,
            "value_changed": val_changed,
            "previous_influence_level": prev_inf,
            "current_influence_level": curr_inf,
            "previous_direction": prev_dir,
            "current_direction": curr_dir,
            "previous_shap_value": prev_shap,
            "current_shap_value": curr_shap,
            "previous_share_percent": prev_share,
            "current_share_percent": curr_share,
            "patient_narrative": narrative,
        })

    # Prioritize comparisons where value or influence level actually changed
    comparisons.sort(
        key=lambda x: (
            x["value_changed"],
            abs(x["current_share_percent"] - x["previous_share_percent"]),
        ),
        reverse=True,
    )

    prev_date = previous_assessment.get("created_at", "")

    return {
        "is_comparable": True,
        "previous_assessment_id": previous_assessment.get("id") or previous_assessment.get("assessment_id"),
        "previous_assessment_date": prev_date,
        "previous_calibrated_probability": prev_expl.get("final_calibrated_probability") or previous_assessment.get("probability"),
        "current_calibrated_probability": current_explanation.get("final_calibrated_probability"),
        "total_factors_compared": len(comparisons),
        "comparisons": comparisons[:5],  # Display top 5 meaningful factor transitions
    }
