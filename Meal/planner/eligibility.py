"""Meal/planner/eligibility.py - Fail-closed candidate eligibility and disposition assignment.

Integrates Phase 5A.1 safety filtering, meal-role gating, core-macro
completeness classification, and nutrient consistency auditing for the 71-entity planner catalog.

Strict Invariants:
- Reuses Phase 5A.1 safety filter directly (zero duplicated safety logic).
- Assigns exactly one primary disposition per entity according to strict precedence:
    1. HARD_SAFETY_EXCLUDED
    2. USER_EXCLUDED
    3. ROLE_INELIGIBLE
    4. DISPLAY_ONLY_INCOMPLETE_CORE_MACROS
    5. DISPLAY_ONLY_NUTRITION_REVIEW_REQUIRED
    6. ELIGIBLE_FOR_OPTIMIZATION
- Incomplete core-macro entities and severe nutrient inconsistencies are isolated
  into display_only_candidates and are never eligible for optimization.
"""

from __future__ import annotations

import math
from typing import Dict, List, Optional, Tuple

from Meal.engine.safety import EntitySafetyResult, apply_safety_filter
from Meal.engine.schemas import SafetyOutcome
from Meal.planner.catalog import PlannerCatalogEntity
from Meal.planner.schemas import (
    CandidateSelectionContext,
    MealRole,
    NutritionConsistencyStatus,
    PrimaryDisposition,
)


def _has_finite_float(val: Optional[float]) -> bool:
    if val is None:
        return False
    try:
        return math.isfinite(float(val))
    except (TypeError, ValueError, OverflowError):
        return False


def check_core_macro_completeness(entity: PlannerCatalogEntity) -> Tuple[bool, List[str]]:
    """Evaluates presence of all 4 normalized core macros without substituting zeros."""
    missing: List[str] = []
    if not _has_finite_float(entity.normalized_energy_kcal_per_100g):
        missing.append("energy_kcal")
    if not _has_finite_float(entity.normalized_protein_g_per_100g):
        missing.append("protein_g")
    if not _has_finite_float(entity.normalized_fat_g_per_100g):
        missing.append("fat_g")
    if not _has_finite_float(entity.normalized_carb_g_per_100g):
        missing.append("carb_g")

    complete = len(missing) == 0
    return complete, missing


def check_nutrition_consistency(
    entity: PlannerCatalogEntity,
) -> Tuple[NutritionConsistencyStatus, Optional[float], Optional[float], Optional[float]]:
    """Evaluates agreement between reported energy and Atwater macronutrient-derived energy."""
    e_rep = entity.normalized_energy_kcal_per_100g
    p_g = entity.normalized_protein_g_per_100g
    f_g = entity.normalized_fat_g_per_100g
    c_g = entity.normalized_carb_g_per_100g

    if not (_has_finite_float(e_rep) and _has_finite_float(p_g) and _has_finite_float(f_g) and _has_finite_float(c_g)):
        return NutritionConsistencyStatus.NOT_ASSESSABLE, float(e_rep) if _has_finite_float(e_rep) else None, None, None

    macro_e = round(4.0 * float(p_g) + 9.0 * float(f_g) + 4.0 * float(c_g), 2)
    abs_diff = round(abs(float(e_rep) - macro_e), 2)
    rel_diff = round(abs_diff / float(e_rep) if float(e_rep) > 0 else 0.0, 4)

    if rel_diff <= 0.15:
        status = NutritionConsistencyStatus.CONSISTENT
    elif rel_diff <= 0.50 and abs_diff <= 25.0:
        status = NutritionConsistencyStatus.MINOR_DIFFERENCE
    else:
        status = NutritionConsistencyStatus.REVIEW_REQUIRED

    return status, float(e_rep), macro_e, rel_diff


def evaluate_entity_eligibility(
    entity: PlannerCatalogEntity,
    context: CandidateSelectionContext,
    safety_result: EntitySafetyResult,
) -> Tuple[PrimaryDisposition, List[str], List[SafetyOutcome], bool, bool, NutritionConsistencyStatus, Optional[float], Optional[float], Optional[float]]:
    """Determines the single deterministic primary disposition for an entity.
    
    Returns:
        (primary_disposition, all_exclusion_reasons, all_safety_outcomes,
         candidate_display_eligible, core_macro_optimization_eligible,
         nutrition_consistency_status, reported_energy_kcal, macro_derived_energy_kcal, energy_macro_relative_difference)
    """
    all_reasons: List[str] = list(safety_result.exclusion_reasons)
    all_outcomes: List[SafetyOutcome] = list(safety_result.all_reasons)

    # 1. Hard Safety Exclusion (allergen or dietary class)
    safety_excluded = (
        len(safety_result.excluded_by_allergen) > 0 or len(safety_result.excluded_by_dietary) > 0
    )

    # 2. User Exclusions & Dislikes
    eid = entity.planner_entity_id
    user_excluded = (eid in context.dislikes) or (eid in context.requested_exclusions)
    if user_excluded:
        reason = f"Entity '{entity.entity_name_en}' ({eid}) is excluded by user dislike or requested exclusion."
        if reason not in all_reasons:
            all_reasons.append(reason)
        if SafetyOutcome.EXCLUDED_USER_DISLIKE not in all_outcomes:
            all_outcomes.append(SafetyOutcome.EXCLUDED_USER_DISLIKE)

    # 3. Meal Role Gating
    role_match = entity.supports_meal_role(context.meal_role)
    if not role_match:
        all_reasons.append(
            f"Entity '{entity.entity_name_en}' does not support requested meal role '{context.meal_role.value}' "
            f"(supports: {entity.meal_roles})."
        )

    # 4. Core Macro Completeness Audit
    core_complete, missing_macros = check_core_macro_completeness(entity)
    if not core_complete:
        all_reasons.append(
            f"Entity '{entity.entity_name_en}' has incomplete core macro data (missing: {missing_macros})."
        )

    # 5. Nutrition Consistency Audit
    cons_status, rep_e, macro_e, rel_diff = check_nutrition_consistency(entity)
    if cons_status == NutritionConsistencyStatus.REVIEW_REQUIRED:
        all_reasons.append(
            f"The authoritative FCT source itself contains an internal nutrient-energy "
            f"inconsistency for '{entity.entity_name_en}' ({entity.planner_entity_id}). "
            f"The exact cause cannot be established from the available source. "
            f"The reported value is preserved and the entity is quarantined from "
            f"optimization pending authoritative correction."
        )

    # Assign deterministic primary disposition according to strict precedence
    if safety_excluded:
        primary_disp = PrimaryDisposition.HARD_SAFETY_EXCLUDED
        display_eligible = False
        opt_eligible = False
    elif user_excluded:
        primary_disp = PrimaryDisposition.USER_EXCLUDED
        display_eligible = False
        opt_eligible = False
    elif not role_match:
        primary_disp = PrimaryDisposition.ROLE_INELIGIBLE
        display_eligible = False
        opt_eligible = False
    elif not core_complete:
        primary_disp = PrimaryDisposition.DISPLAY_ONLY_INCOMPLETE_CORE_MACROS
        display_eligible = True
        opt_eligible = False
    elif cons_status == NutritionConsistencyStatus.REVIEW_REQUIRED:
        primary_disp = PrimaryDisposition.DISPLAY_ONLY_NUTRITION_REVIEW_REQUIRED
        display_eligible = True
        opt_eligible = False
    else:
        primary_disp = PrimaryDisposition.ELIGIBLE_FOR_OPTIMIZATION
        display_eligible = True
        opt_eligible = True

    return (
        primary_disp,
        all_reasons,
        all_outcomes,
        display_eligible,
        opt_eligible,
        cons_status,
        rep_e,
        macro_e,
        rel_diff,
    )


def run_batch_eligibility(
    entities: Dict[str, PlannerCatalogEntity],
    context: CandidateSelectionContext,
) -> Dict[str, Tuple[PrimaryDisposition, List[str], List[SafetyOutcome], bool, bool, EntitySafetyResult, NutritionConsistencyStatus, Optional[float], Optional[float], Optional[float]]]:
    """Runs safety filtering and disposition assignment across all catalog entities."""
    # Validate context entity IDs against master catalog
    valid_eids = set(entities.keys())
    for eid in context.dislikes:
        if eid not in valid_eids:
            raise ValueError(f"Unknown planner entity ID '{eid}' in context.dislikes.")
    for eid in context.requested_exclusions:
        if eid not in valid_eids:
            raise ValueError(f"Unknown planner entity ID '{eid}' in context.requested_exclusions.")
    for eid in context.preferred_entity_ids:
        if eid not in valid_eids:
            raise ValueError(f"Unknown planner entity ID '{eid}' in context.preferred_entity_ids.")

    # Prepare raw dictionary inputs for Phase 5A.1 safety engine
    safety_dicts = [e.to_safety_dict() for e in entities.values()]
    safety_results = apply_safety_filter(
        entities=safety_dicts,
        user_allergens=context.allergies,
        user_dietary_classes=[context.dietary_class] if context.dietary_class else [],
        disliked_entity_ids=context.dislikes,
    )

    batch_out = {}
    for eid, entity in entities.items():
        s_res = safety_results[eid]
        (
            p_disp,
            reasons,
            outcomes,
            disp_elig,
            opt_elig,
            cons_status,
            rep_e,
            macro_e,
            rel_diff,
        ) = evaluate_entity_eligibility(entity, context, s_res)
        batch_out[eid] = (
            p_disp,
            reasons,
            outcomes,
            disp_elig,
            opt_elig,
            s_res,
            cons_status,
            rep_e,
            macro_e,
            rel_diff,
        )

    return batch_out
