"""Meal/composition/orchestrator.py - Public Entry Point for Phase 6C Single-Meal Generation.

Coordinates:
- Upstream candidate pool validation and requested meal-role alignment.
- Deterministic search policy bounds checking.
- Explicit classification of required and preferred entities.
- Search space calculation and preference-driven combination generation.
- Dispatch to Phase 6B portion optimization engine.
- Tracking of optimizer rejections and strict exclusion from returned meal plans.
- Lexicographic meal ranking (feasibility, J*, preference coverage, canonical combination ID).
- Assembly of best meal and alternative meals with full recipe coverage diagnostics.
"""

from __future__ import annotations

from typing import Dict, List, Optional

from Meal.composition.combinations import (
    classify_preferred_entities,
    generate_and_order_combinations,
    validate_required_entities,
    validate_search_policy,
)
from Meal.composition.equivalence import validate_combination_equivalence
from Meal.composition.ranking import (
    assemble_single_meal_plan,
    compute_meal_ranking_key,
)
from Meal.composition.schemas import (
    MealCombinationPolicy,
    MealFeasibilityClass,
    PreferredEntityStatus,
    SelectionScope,
    SingleMealGenerationContext,
    SingleMealGenerationResult,
    SingleMealGenerationStatus,
    SingleMealPlan,
)
from Meal.engine.schemas import NutritionTargetProfile
from Meal.evidence.schemas import ConditionNutritionProfile
from Meal.optimizer.orchestrator import optimize_portions
from Meal.optimizer.schemas import (
    PortionConstraint,
    PortionOptimizationStatus,
    PortionOptimizationTarget,
)
from Meal.planner.catalog import PlannerCatalogEntity, load_master_planner_catalog
from Meal.planner.schemas import CandidateEvaluation, CandidateRankingResult


def generate_single_meal(
    neutral_profile: NutritionTargetProfile,
    condition_profile: ConditionNutritionProfile,
    candidate_result: CandidateRankingResult,
    target: PortionOptimizationTarget,
    constraints: List[PortionConstraint],
    context: SingleMealGenerationContext,
    policy: Optional[MealCombinationPolicy] = None,
) -> SingleMealGenerationResult:
    """Public Phase 6C API for deterministic single-meal composition and generation.

    Generates feasible, mathematically optimized food combinations from a vetted
    Phase 6A candidate pool against caller-supplied meal targets and portion bounds.
    """
    trace: List[str] = []
    warnings: List[str] = []

    # 1. Document computational default boundaries
    active_policy = policy or MealCombinationPolicy()
    trace.append(
        "Search complexity defaults: minimum_items=%d, maximum_items=%d, "
        "maximum_combinations_evaluated=%d, maximum_alternatives=%d. "
        "NOTE: These values control search complexity and are engineering limits, "
        "not dietary or clinical recommendations."
        % (
            active_policy.minimum_items,
            active_policy.maximum_items,
            active_policy.maximum_combinations_evaluated,
            active_policy.maximum_alternatives,
        )
    )

    # 2. Validate requested meal role alignment with upstream Phase 6A pool
    if candidate_result.requested_meal_role != context.meal_role:
        role_err = (
            f"Role mismatch: candidate pool was vetted for role "
            f"'{candidate_result.requested_meal_role.value}', but context requested "
            f"'{context.meal_role.value}'."
        )
        return SingleMealGenerationResult(
            status=SingleMealGenerationStatus.NO_VALID_COMBINATION,
            requested_meal_role=context.meal_role,
            best_meal=None,
            alternative_meals=[],
            total_possible_combinations=0,
            combinations_generated=0,
            combinations_evaluated=0,
            optimizer_success_count=0,
            optimizer_rejected_count=0,
            optimizer_rejections={},
            search_truncated=False,
            search_exhaustive=True,
            selection_scope=SelectionScope.EXHAUSTIVE_SEARCH,
            preferred_entity_matches=0,
            preferred_entity_ids_requested=list(context.preferred_entity_ids),
            valid_preferred_entity_ids=[],
            preferred_validation_records=[],
            preference_status=PreferredEntityStatus.UNAVAILABLE,
            preference_coverage=0.0,
            failure_details=[role_err],
            warnings=warnings,
            trace=trace,
        )

    # 3. Validate search policy
    is_valid_policy, policy_err = validate_search_policy(active_policy)
    if not is_valid_policy:
        return SingleMealGenerationResult(
            status=SingleMealGenerationStatus.INVALID_SEARCH_POLICY,
            requested_meal_role=context.meal_role,
            best_meal=None,
            alternative_meals=[],
            total_possible_combinations=0,
            combinations_generated=0,
            combinations_evaluated=0,
            optimizer_success_count=0,
            optimizer_rejected_count=0,
            optimizer_rejections={},
            search_truncated=False,
            search_exhaustive=True,
            selection_scope=SelectionScope.EXHAUSTIVE_SEARCH,
            preferred_entity_matches=0,
            preferred_entity_ids_requested=list(context.preferred_entity_ids),
            valid_preferred_entity_ids=[],
            preferred_validation_records=[],
            preference_status=PreferredEntityStatus.UNAVAILABLE,
            preference_coverage=0.0,
            failure_details=[str(policy_err)],
            warnings=warnings,
            trace=trace,
        )

    # 4. Load master planner catalog and index constraints / candidates
    master_catalog = load_master_planner_catalog()
    constraints_by_id: Dict[str, PortionConstraint] = {c.entity_id: c for c in constraints}
    evals_by_id: Dict[str, CandidateEvaluation] = {
        c.entity_id: c for c in candidate_result.ranked_optimization_candidates
    }

    # 5. Validate required entities
    req_valid, req_reason, req_details, valid_unique_req_ids = validate_required_entities(
        context=context,
        candidate_result=candidate_result,
        constraints_by_id=constraints_by_id,
        policy=active_policy,
    )
    if not req_valid:
        return SingleMealGenerationResult(
            status=SingleMealGenerationStatus.INVALID_REQUIRED_ENTITY,
            requested_meal_role=context.meal_role,
            best_meal=None,
            alternative_meals=[],
            total_possible_combinations=0,
            combinations_generated=0,
            combinations_evaluated=0,
            optimizer_success_count=0,
            optimizer_rejected_count=0,
            optimizer_rejections={},
            search_truncated=False,
            search_exhaustive=True,
            selection_scope=SelectionScope.EXHAUSTIVE_SEARCH,
            preferred_entity_matches=0,
            preferred_entity_ids_requested=list(context.preferred_entity_ids),
            valid_preferred_entity_ids=[],
            preferred_validation_records=[],
            preference_status=PreferredEntityStatus.UNAVAILABLE,
            preference_coverage=0.0,
            required_entity_failure_reason=req_reason,
            failure_details=req_details,
            warnings=warnings,
            trace=trace,
        )

    # 6. Classify preferred entities
    valid_pref_ids, pref_records, pref_status, pref_warnings = classify_preferred_entities(
        context=context,
        candidate_result=candidate_result,
        constraints_by_id=constraints_by_id,
        master_catalog=master_catalog,
    )
    warnings.extend(pref_warnings)
    valid_pref_set = set(valid_pref_ids)

    # 7. Identify optional candidates with allowable constraints and no exclusions
    excluded_set = set(context.explicitly_excluded_ids) | {
        c.entity_id for c in candidate_result.excluded_candidates
    }
    req_set = set(valid_unique_req_ids)

    optional_candidate_ids: List[str] = [
        c.entity_id
        for c in candidate_result.ranked_optimization_candidates
        if c.entity_id not in req_set
        and c.entity_id not in excluded_set
        and c.entity_id in constraints_by_id
    ]

    # 8. Generate and deterministically order combinations
    (
        evaluated_combs,
        total_possible,
        search_truncated,
        selection_scope,
        search_warnings,
    ) = generate_and_order_combinations(
        required_ids=valid_unique_req_ids,
        optional_candidate_ids=optional_candidate_ids,
        valid_preferred_ids=valid_pref_set,
        policy=active_policy,
    )
    warnings.extend(search_warnings)

    if total_possible == 0 or len(evaluated_combs) == 0:
        return SingleMealGenerationResult(
            status=SingleMealGenerationStatus.NO_VALID_COMBINATION,
            requested_meal_role=context.meal_role,
            best_meal=None,
            alternative_meals=[],
            total_possible_combinations=total_possible,
            combinations_generated=0,
            combinations_evaluated=0,
            optimizer_success_count=0,
            optimizer_rejected_count=0,
            optimizer_rejections={},
            search_truncated=search_truncated,
            search_exhaustive=(not search_truncated),
            selection_scope=selection_scope,
            preferred_entity_matches=0,
            preferred_entity_ids_requested=list(context.preferred_entity_ids),
            valid_preferred_entity_ids=valid_pref_ids,
            preferred_validation_records=pref_records,
            preference_status=pref_status,
            preference_coverage=0.0,
            failure_details=[
                "No valid combinations could be formed given item bounds and portion constraint availability."
            ],
            warnings=warnings,
            trace=trace,
        )

    # 9. Evaluate combinations with Phase 6B Portion Optimizer
    combinations_generated = len(evaluated_combs)
    combinations_evaluated = 0
    optimizer_success_count = 0
    optimizer_rejected_count = 0
    optimizer_rejections: Dict[str, str] = {}
    successful_plans: List[SingleMealPlan] = []

    cond_annotations = []
    if condition_profile and hasattr(condition_profile, "condition_name"):
        cond_annotations.append(f"condition:{condition_profile.condition_name}")

    for comb_tuple in evaluated_combs:
        combinations_evaluated += 1
        comb_ids = list(comb_tuple)

        # Pre-optimizer equivalence check safeguard: combinations with semantic duplicates must NEVER reach Phase 6B
        is_equiv_valid, equiv_reason = validate_combination_equivalence(
            comb_ids, active_policy.equivalence_groups
        )
        if not is_equiv_valid:
            optimizer_rejected_count += 1
            cid = "+".join(sorted(comb_ids))
            optimizer_rejections[cid] = f"REJECTED_BEFORE_OPTIMIZER: {equiv_reason}"
            continue

        comb_constraints = [constraints_by_id[eid] for eid in comb_ids]

        opt_result = optimize_portions(
            neutral_profile=neutral_profile,
            condition_profile=condition_profile,
            candidate_result=candidate_result,
            selected_entity_ids=comb_ids,
            target=target,
            constraints=comb_constraints,
        )

        if opt_result.status in (
            PortionOptimizationStatus.OPTIMAL_WITHIN_ALL_TARGET_RANGES,
            PortionOptimizationStatus.OPTIMAL_WITH_TARGET_DEVIATIONS,
        ):
            plan = assemble_single_meal_plan(
                optimization_result=opt_result,
                candidate_evaluations_by_id=evals_by_id,
                master_catalog=master_catalog,
                valid_preferred_ids=valid_pref_set,
                condition_annotations=cond_annotations,
                equivalence_groups=active_policy.equivalence_groups,
            )
            successful_plans.append(plan)
            optimizer_success_count += 1
        else:
            optimizer_rejected_count += 1
            cid = "+".join(sorted(comb_ids))
            rej_msg = (
                f"{opt_result.status.value}: "
                f"{opt_result.solver_message or opt_result.explanation_notes or 'Optimization constraints unsatisfied'}"
            )
            optimizer_rejections[cid] = rej_msg

    # 10. Handle outcomes
    if not successful_plans:
        status = (
            SingleMealGenerationStatus.OPTIMIZER_FAILED
            if optimizer_rejected_count > 0
            else SingleMealGenerationStatus.NO_VALID_COMBINATION
        )
        return SingleMealGenerationResult(
            status=status,
            requested_meal_role=context.meal_role,
            best_meal=None,
            alternative_meals=[],
            total_possible_combinations=total_possible,
            combinations_generated=combinations_generated,
            combinations_evaluated=combinations_evaluated,
            optimizer_success_count=0,
            optimizer_rejected_count=optimizer_rejected_count,
            optimizer_rejections=optimizer_rejections,
            search_truncated=search_truncated,
            search_exhaustive=(not search_truncated),
            selection_scope=selection_scope,
            preferred_entity_matches=0,
            preferred_entity_ids_requested=list(context.preferred_entity_ids),
            valid_preferred_entity_ids=valid_pref_ids,
            preferred_validation_records=pref_records,
            preference_status=pref_status,
            preference_coverage=0.0,
            failure_details=["All evaluated combinations were rejected by the portion optimizer."],
            warnings=warnings,
            trace=trace,
        )

    # 11. Lexicographic Ranking of successful plans
    # Uses strictly: (feasibility_rank, primary_objective, -preference_coverage, canonical_combination_id)
    # Secondary objective is completely excluded!
    sorted_plans = sorted(successful_plans, key=compute_meal_ranking_key)

    best_meal = sorted_plans[0]
    alternatives = sorted_plans[1 : 1 + active_policy.maximum_alternatives]

    gen_status = (
        SingleMealGenerationStatus.FEASIBLE
        if best_meal.feasibility_class == MealFeasibilityClass.FEASIBLE
        else SingleMealGenerationStatus.OPTIMAL_WITH_TARGET_DEVIATIONS
    )

    return SingleMealGenerationResult(
        status=gen_status,
        requested_meal_role=context.meal_role,
        best_meal=best_meal,
        alternative_meals=alternatives,
        total_possible_combinations=total_possible,
        combinations_generated=combinations_generated,
        combinations_evaluated=combinations_evaluated,
        optimizer_success_count=optimizer_success_count,
        optimizer_rejected_count=optimizer_rejected_count,
        optimizer_rejections=optimizer_rejections,
        search_truncated=search_truncated,
        search_exhaustive=(not search_truncated),
        selection_scope=selection_scope,
        preferred_entity_matches=best_meal.matched_preferred_entity_count,
        preferred_entity_ids_requested=list(context.preferred_entity_ids),
        valid_preferred_entity_ids=valid_pref_ids,
        preferred_validation_records=pref_records,
        preference_status=pref_status,
        preference_coverage=best_meal.preference_coverage,
        required_entity_failure_reason=None,
        failure_details=[],
        warnings=warnings,
        trace=trace,
    )
