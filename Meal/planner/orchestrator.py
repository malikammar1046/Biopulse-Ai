"""Meal/planner/orchestrator.py - Public entry point for candidate filtering and ranking.

Coordinates catalog loading, fail-closed safety filtering, role gating,
core-macro completeness audit, nutrient consistency verification, transparent scoring,
and deterministic ranking.

Strict Invariants:
- Exactly 71 entities evaluated from locked master catalog.
- Sum of mutually exclusive primary dispositions equals exactly 71.
- Incomplete core-macro entities and severe nutrient inconsistencies are partitioned into
  display_only_candidates, never entering ranked_optimization_candidates.
- Upstream NutritionTargetProfile and ConditionNutritionProfile are immutable.
- Tie-breaking is deterministic: candidate_priority_score DESC, planner_entity_id ASC.
"""

from __future__ import annotations

from pathlib import Path
from typing import Dict, List, Optional

from Meal.engine.schemas import NutritionTargetProfile
from Meal.evidence.schemas import ConditionNutritionProfile
from Meal.planner.catalog import PlannerCatalogEntity, load_master_planner_catalog
from Meal.planner.condition_scoring import get_candidate_condition_metadata
from Meal.planner.eligibility import check_core_macro_completeness, run_batch_eligibility
from Meal.planner.schemas import (
    CandidateEvaluation,
    CandidateRankingResult,
    CandidateSelectionContext,
    PrimaryDisposition,
)
from Meal.planner.scoring import compute_candidate_signals


def rank_meal_candidates(
    neutral_profile: NutritionTargetProfile,
    condition_profile: ConditionNutritionProfile,
    context: CandidateSelectionContext,
    catalog_path: Optional[Path] = None,
) -> CandidateRankingResult:
    """Filters, audits, scores, and ranks candidate entities from the master planner catalog."""
    if not isinstance(context, CandidateSelectionContext):
        raise TypeError(f"context must be a CandidateSelectionContext instance, got {type(context)}")
    if not isinstance(neutral_profile, NutritionTargetProfile):
        raise TypeError(f"neutral_profile must be a NutritionTargetProfile instance, got {type(neutral_profile)}")
    if not isinstance(condition_profile, ConditionNutritionProfile):
        raise TypeError(f"condition_profile must be a ConditionNutritionProfile instance, got {type(condition_profile)}")

    # 1. Load locked 71-entity catalog
    catalog = load_master_planner_catalog(catalog_path)
    total_entities = len(catalog)

    # 2. Run batch eligibility and disposition assignment
    batch_eligibility = run_batch_eligibility(catalog, context)

    # 3. Evaluate each entity
    all_evaluations: List[CandidateEvaluation] = []
    active_components_seen: set[str] = set()

    for eid, entity in catalog.items():
        (
            primary_disp,
            reasons,
            outcomes,
            disp_elig,
            opt_elig,
            safety_res,
            cons_status,
            rep_e,
            macro_e,
            rel_diff,
        ) = batch_eligibility[eid]
        _, missing_macros = check_core_macro_completeness(entity)

        # Compute transparent portion-independent scoring signals
        (
            candidate_priority_score,
            base_candidate_score,
            fiber_bonus,
            preference_bonus,
            breakdown,
            weights_used,
            avail_comps,
            unavail_comps,
        ) = compute_candidate_signals(entity, context, primary_disp, cons_status)

        for comp in avail_comps:
            active_components_seen.add(comp)

        # Extract safe condition metadata and explainability tokens
        tokens, condition_effects, evidence_ids = get_candidate_condition_metadata(
            entity, context, condition_profile, primary_disp
        )

        # Strict recipe instruction availability: True ONLY for READY_RECIPE_AND_NUTRITION
        recipe_available = (entity.planner_readiness.strip() == "READY_RECIPE_AND_NUTRITION")

        evaluation = CandidateEvaluation(
            entity_id=entity.planner_entity_id,
            display_name=entity.entity_name_en,
            canonical_name=entity.canonical_or_component_source_id,
            category=entity.category,
            supported_meal_roles=list(entity.meal_roles),
            requested_meal_role=context.meal_role,
            primary_disposition=primary_disp,
            hard_excluded=(primary_disp in (
                PrimaryDisposition.HARD_SAFETY_EXCLUDED,
                PrimaryDisposition.USER_EXCLUDED,
            )),
            safety_primary_outcome=safety_res.primary_outcome,
            all_safety_outcomes=outcomes,
            all_exclusion_reasons=reasons,
            candidate_display_eligible=disp_elig,
            core_macro_optimization_eligible=opt_elig,
            recipe_instruction_available=recipe_available,
            energy_kcal=entity.normalized_energy_kcal_per_100g,
            protein_g=entity.normalized_protein_g_per_100g,
            fat_g=entity.normalized_fat_g_per_100g,
            carb_g=entity.normalized_carb_g_per_100g,
            fiber_g=entity.normalized_fiber_g_per_100g,
            protein_concentration_percentile=breakdown.protein_concentration_percentile if breakdown else None,
            fiber_concentration_percentile=breakdown.fiber_concentration_percentile if breakdown else None,
            missing_macros=missing_macros,
            reported_energy_kcal=rep_e,
            macro_derived_energy_kcal=macro_e,
            energy_macro_relative_difference=rel_diff,
            nutrition_consistency_status=cons_status,
            score_breakdown=breakdown,
            score_weights_used=weights_used,
            available_score_components=avail_comps,
            unavailable_score_components=unavail_comps,
            candidate_priority_score=candidate_priority_score,
            base_candidate_score=base_candidate_score,
            fiber_bonus=fiber_bonus,
            preference_bonus=preference_bonus,
            total_score=candidate_priority_score,
            explanation_tokens=tokens,
            applicable_condition_effects=condition_effects,
            evidence_ids_used=evidence_ids,
            planner_readiness=entity.planner_readiness,
            nutrition_basis=entity.native_nutrition_basis,
            traceability_id=entity.canonical_or_component_source_id,
        )
        all_evaluations.append(evaluation)

    # 4. Partition candidates based on primary disposition
    optimization_candidates: List[CandidateEvaluation] = []
    display_only_candidates: List[CandidateEvaluation] = []
    excluded_candidates: List[CandidateEvaluation] = []

    for ev in all_evaluations:
        if ev.primary_disposition == PrimaryDisposition.ELIGIBLE_FOR_OPTIMIZATION:
            optimization_candidates.append(ev)
        elif ev.primary_disposition in (
            PrimaryDisposition.DISPLAY_ONLY_INCOMPLETE_CORE_MACROS,
            PrimaryDisposition.DISPLAY_ONLY_NUTRITION_REVIEW_REQUIRED,
        ):
            display_only_candidates.append(ev)
        else:
            excluded_candidates.append(ev)

    # 5. Deterministic sorting (Score DESC, entity_id ASC)
    optimization_candidates.sort(
        key=lambda x: (-(x.candidate_priority_score if x.candidate_priority_score is not None else -1.0), x.entity_id)
    )
    display_only_candidates.sort(
        key=lambda x: (-(x.candidate_priority_score if x.candidate_priority_score is not None else -1.0), x.entity_id)
    )
    excluded_candidates.sort(key=lambda x: x.entity_id)

    # 6. Disposition counts
    hard_safety_count = sum(1 for e in all_evaluations if e.primary_disposition == PrimaryDisposition.HARD_SAFETY_EXCLUDED)
    user_excl_count = sum(1 for e in all_evaluations if e.primary_disposition == PrimaryDisposition.USER_EXCLUDED)
    role_inel_count = sum(1 for e in all_evaluations if e.primary_disposition == PrimaryDisposition.ROLE_INELIGIBLE)
    display_incomplete_count = sum(1 for e in all_evaluations if e.primary_disposition == PrimaryDisposition.DISPLAY_ONLY_INCOMPLETE_CORE_MACROS)
    display_nutrition_review_count = sum(1 for e in all_evaluations if e.primary_disposition == PrimaryDisposition.DISPLAY_ONLY_NUTRITION_REVIEW_REQUIRED)
    opt_eligible_count = sum(1 for e in all_evaluations if e.primary_disposition == PrimaryDisposition.ELIGIBLE_FOR_OPTIMIZATION)

    # 7. Invariant verifications:
    # 7a. Global 71 disposition closure
    sum_counts = (
        hard_safety_count
        + user_excl_count
        + role_inel_count
        + display_incomplete_count
        + display_nutrition_review_count
        + opt_eligible_count
    )
    if sum_counts != total_entities:
        raise ValueError(
            f"Primary disposition count invariant violated: sum {sum_counts} != total {total_entities}"
        )

    # 7b. Raw role entity membership & role-specific closure
    raw_role_eids = {
        eid for eid, e in catalog.items() if e.supports_meal_role(context.meal_role)
    }
    raw_role_count = len(raw_role_eids)

    role_supporting_hard_safety_count = sum(
        1 for e in all_evaluations
        if e.primary_disposition == PrimaryDisposition.HARD_SAFETY_EXCLUDED and e.entity_id in raw_role_eids
    )
    role_supporting_user_excl_count = sum(
        1 for e in all_evaluations
        if e.primary_disposition == PrimaryDisposition.USER_EXCLUDED and e.entity_id in raw_role_eids
    )

    role_closure_count = (
        role_supporting_hard_safety_count
        + role_supporting_user_excl_count
        + display_incomplete_count
        + display_nutrition_review_count
        + opt_eligible_count
    )
    if role_closure_count != raw_role_count:
        raise ValueError(
            f"Role-specific partition closure invariant violated for role '{context.meal_role.value}': "
            f"sum {role_closure_count} != raw supporting entities {raw_role_count}"
        )

    # 7c. Invariant: Downstream candidates MUST be strict subset of raw role entities
    opt_eids = {c.entity_id for c in optimization_candidates}
    disp_eids = {c.entity_id for c in display_only_candidates}
    downstream_eids = opt_eids | disp_eids

    if not downstream_eids.issubset(raw_role_eids):
        leaked = downstream_eids - raw_role_eids
        raise ValueError(
            f"Role gating leak invariant violated: entities {leaked} appear downstream but do not support {context.meal_role.value}"
        )

    # 7d. Invariant: Intersection of downstream and role-ineligible MUST be empty
    role_ineligible_eids = {
        e.entity_id for e in all_evaluations if e.primary_disposition == PrimaryDisposition.ROLE_INELIGIBLE
    }
    leak_intersection = downstream_eids & role_ineligible_eids
    if leak_intersection:
        raise ValueError(
            f"Role gating leak invariant violated: entities {leak_intersection} are ROLE_INELIGIBLE but appear downstream"
        )

    result = CandidateRankingResult(
        requested_meal_role=context.meal_role,
        total_catalog_entities=total_entities,
        hard_safety_excluded_count=hard_safety_count,
        user_excluded_count=user_excl_count,
        role_ineligible_count=role_inel_count,
        display_only_incomplete_count=display_incomplete_count,
        display_only_nutrition_review_count=display_nutrition_review_count,
        optimization_eligible_count=opt_eligible_count,
        ranked_optimization_candidates=optimization_candidates,
        display_only_candidates=display_only_candidates,
        excluded_candidates=excluded_candidates,
        raw_role_entity_count=raw_role_count,
        role_supporting_hard_safety_excluded_count=role_supporting_hard_safety_count,
        role_supporting_user_excluded_count=role_supporting_user_excl_count,
        scoring_version="1.1.0",
        catalog_version="1.0.0",
        condition_profile_version=condition_profile.evidence_context_status.value,
        active_score_components=sorted(active_components_seen),
        unavailable_global_components=[
            "budget",
            "cooking_time",
            "cultural_fit",
            "condition_context",
        ],
        warnings=[],
    )

    return result
