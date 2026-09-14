"""Meal/planner/condition_scoring.py - Safe condition evidence annotation and explainability.

Extracts condition evidence context, safe explanation tokens, and evidence IDs
from Phase 5B ConditionNutritionProfile without altering numerical scores.

Strict Invariants:
- Zero disease-specific numerical food score boosts.
- PCOS never penalizes complex carbohydrates or staples.
- Male Hypogonadism never scores foods for testosterone or androgens.
- Condition evidence context is preserved for explainability and safety only.
- Explanation tokens reflect exact Phase 4 planner readiness (no generic catch-all tokens).
"""

from __future__ import annotations

from typing import List, Tuple

from Meal.evidence.schemas import ConditionNutritionProfile, ImplementationEffect
from Meal.planner.catalog import PlannerCatalogEntity
from Meal.planner.schemas import CandidateSelectionContext, PrimaryDisposition


def get_candidate_condition_metadata(
    entity: PlannerCatalogEntity,
    context: CandidateSelectionContext,
    condition_profile: ConditionNutritionProfile,
    primary_disposition: PrimaryDisposition,
) -> Tuple[List[str], List[str], List[str]]:
    """Extracts safe explanation tokens, applicable effects, and evidence IDs for a candidate.
    
    Returns:
        (explanation_tokens, applicable_condition_effects, evidence_ids_used)
    """
    tokens: List[str] = []
    effects: List[str] = [e.value for e in condition_profile.implementation_effects]
    evidence_ids: List[str] = list(condition_profile.applicable_evidence_ids)

    # Meal role token
    if primary_disposition != PrimaryDisposition.ROLE_INELIGIBLE:
        tokens.append("MATCHES_REQUESTED_MEAL_ROLE")
        tokens.append(f"ROLE_{context.meal_role.value.upper()}")

    # Core macro completeness and consistency tokens
    if primary_disposition == PrimaryDisposition.ELIGIBLE_FOR_OPTIMIZATION:
        tokens.append("CORE_MACROS_COMPLETE")
    elif primary_disposition == PrimaryDisposition.DISPLAY_ONLY_INCOMPLETE_CORE_MACROS:
        tokens.append("CORE_MACROS_INCOMPLETE")
    elif primary_disposition == PrimaryDisposition.DISPLAY_ONLY_NUTRITION_REVIEW_REQUIRED:
        tokens.append("NUTRITION_REVIEW_REQUIRED")

    # Planner readiness and instruction provenance tokens (Strict 1-to-1 mapping)
    readiness = entity.planner_readiness.strip()
    if readiness == "READY_RECIPE_AND_NUTRITION":
        tokens.append("RECIPE_AND_NUTRITION_COMPOSITE")
        tokens.append("RECIPE_INSTRUCTIONS_AVAILABLE")
    elif readiness == "READY_NUTRITION_ONLY":
        tokens.append("NUTRITION_ONLY_COMPOSITE")
        tokens.append("RECIPE_INSTRUCTIONS_UNAVAILABLE")
    elif readiness == "READY_DIRECT_COMPONENT":
        tokens.append("DIRECT_COMPONENT")
    elif readiness == "READY_STANDARD_PORTION":
        tokens.append("STANDARD_PORTION")
    else:
        tokens.append(readiness)

    # Data completeness tokens (purely descriptive presence/absence)
    if entity.normalized_fiber_g_per_100g is not None:
        tokens.append("FIBER_DATA_AVAILABLE")
    else:
        tokens.append("FIBER_DATA_UNAVAILABLE")

    # User preference token
    if entity.planner_entity_id in context.preferred_entity_ids:
        tokens.append("EXPLICIT_USER_PREFERRED_ITEM")
    elif entity.category.lower() in [c.lower() for c in context.preferred_categories]:
        tokens.append("EXPLICIT_USER_PREFERRED_CATEGORY")

    # Safe Condition-Evidence Alignment Tokens (Purely contextual, non-numerical)
    if ImplementationEffect.PRIORITIZE_HEALTHY_EATING in condition_profile.implementation_effects:
        tokens.append("GENERAL_HEALTHY_EATING_CONTEXT_ALIGNED")

    if ImplementationEffect.PRIORITIZE_METABOLIC_HEALTH in condition_profile.implementation_effects:
        tokens.append("METABOLIC_HEALTH_CONTEXT_ALIGNED")

    if ImplementationEffect.NO_SPECIFIC_DIET_SUPPORTED in condition_profile.implementation_effects:
        tokens.append("NO_SPECIFIC_DIET_SUPERIORITY_ALIGNED")

    if ImplementationEffect.CONSIDER_WEIGHT_MANAGEMENT_CONTEXT in condition_profile.implementation_effects:
        tokens.append("WEIGHT_MANAGEMENT_CONTEXT_AWARE")

    if ImplementationEffect.PREVENT_EXCESS_WEIGHT_GAIN_ADOLESCENT in condition_profile.implementation_effects:
        tokens.append("ADOLESCENT_WEIGHT_GAIN_PREVENTION_ALIGNED")

    return tokens, effects, evidence_ids
