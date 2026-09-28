"""Meal/daily/orchestrator.py - Public Entry Point for Phase 6D Full-Day Meal Planning.

Coordinates:
- Explicit daily meal schedules and targets.
- Target reconciliation against Phase 5A neutral daily nutrition profiles.
- Role-specific candidate ranking (Phase 6A) and combinatorial meal generation (Phase 6C).
- Unrounded daily nutrient summation and strict Phase 5 fiber coverage semantics.
- Day-level feasibility evaluation against Phase 5A targets.
- Lexicographic day ranking:
  1. complete valid day > partial/invalid
  2. all daily core targets met
  3. lower normalized daily target deviation (J_day)
  4. explicit user preference coverage
  5. deterministic canonical day ID
- Strict Condition Isolation (zero numerical disease manipulation).
"""

from __future__ import annotations

import itertools
from pathlib import Path
from typing import Dict, List, Optional

from Meal.composition.orchestrator import generate_single_meal
from Meal.composition.schemas import (
    MealCombinationPolicy,
    SingleMealGenerationContext,
    SingleMealGenerationResult,
    SingleMealPlan,
)
from Meal.daily.aggregation import (
    assemble_full_day_meal_plan,
)
from Meal.daily.reconciliation import reconcile_daily_schedule
from Meal.daily.schemas import (
    DailyMealSchedule,
    FullDayGenerationResult,
    FullDayGenerationStatus,
    FullDayMealPlan,
    FullDayPlanningPolicy,
    MealAllocation,
)
from Meal.engine.schemas import NutritionTargetProfile
from Meal.evidence.schemas import ConditionNutritionProfile
from Meal.optimizer.schemas import PortionConstraint
from Meal.planner.orchestrator import rank_meal_candidates
from Meal.planner.schemas import CandidateSelectionContext, MealRole


def compute_day_ranking_key(plan: FullDayMealPlan) -> tuple:
    """Deterministic lexicographic ranking key for candidate full-day plans.
    
    Order:
    1. complete valid day > partial/invalid
    2. all daily core targets met (0 if all met, 1 otherwise)
    3. lower normalized daily target deviation (J_day)
    4. explicit user preference coverage (higher is better -> negative)
    5. deterministic canonical day ID
    
    STRICT INVARIANT:
    No condition score, PCOS score, hypogonadism score, Phase 6B secondary objective,
    or protein/fiber concentration is used as a hidden weight.
    """
    validity_rank = 0  # Complete day
    targets_met_rank = 0 if plan.all_daily_core_targets_within_range else 1
    j_day = round(plan.daily_primary_objective, 8)
    neg_pref_cov = -round(plan.preference_coverage, 6)
    canonical_id = plan.canonical_day_id

    return (validity_rank, targets_met_rank, j_day, neg_pref_cov, canonical_id)


def generate_full_day_plan(
    neutral_profile: NutritionTargetProfile,
    condition_profile: ConditionNutritionProfile,
    schedule: DailyMealSchedule,
    policy: Optional[FullDayPlanningPolicy] = None,
    base_context: Optional[CandidateSelectionContext] = None,
    day_preferred_entity_ids: Optional[List[str]] = None,
    day_excluded_ids: Optional[List[str]] = None,
    catalog_path: Optional[Path] = None,
    default_constraints: Optional[List[PortionConstraint]] = None,
    plan_day_index: int = 1,
    date: Optional[str] = None,
) -> FullDayGenerationResult:
    """Public Phase 6D API for deterministic full-day meal planning.
    
    Coordinates Phase 6A and Phase 6C for each scheduled meal allocation,
    aggregates actual daily totals, evaluates day-level feasibility against Phase 5A targets,
    and returns a structured FullDayGenerationResult.
    """
    if not isinstance(neutral_profile, NutritionTargetProfile):
        raise TypeError(f"neutral_profile must be NutritionTargetProfile, got {type(neutral_profile)}")
    if not isinstance(condition_profile, ConditionNutritionProfile):
        raise TypeError(f"condition_profile must be ConditionNutritionProfile, got {type(condition_profile)}")
    if not isinstance(schedule, DailyMealSchedule):
        raise TypeError(f"schedule must be DailyMealSchedule, got {type(schedule)}")

    active_policy = policy if policy is not None else FullDayPlanningPolicy()
    trace: List[str] = []
    warnings: List[str] = []

    trace.append(f"Initiating Phase 6D full-day planning for {schedule.meal_count} scheduled meals.")

    # 1. Target reconciliation
    reconciliation = reconcile_daily_schedule(
        schedule=schedule,
        daily_target=neutral_profile,
        tolerance_kcal=active_policy.energy_tolerance_kcal,
    )
    warnings.extend(reconciliation.warnings)
    trace.append(f"Schedule target reconciliation status: {reconciliation.status.value}")

    # 2. Meal-by-meal generation via Phase 6A -> Phase 6C
    generated_best_meals: Dict[MealRole, SingleMealPlan] = {}
    meal_options_by_role: Dict[MealRole, List[SingleMealPlan]] = {}
    failed_roles: List[MealRole] = []
    failed_details: Dict[MealRole, str] = {}

    day_pref = day_preferred_entity_ids or []
    day_excl = day_excluded_ids or []

    for alloc in schedule.allocations:
        role = alloc.role
        trace.append(f"Generating meal for role {role.value}...")

        # Consolidate exclusions: base_context + day_excl + alloc.explicitly_excluded_ids
        base_excl = base_context.requested_exclusions if base_context else []
        meal_exclusions = list(dict.fromkeys(base_excl + day_excl + alloc.explicitly_excluded_ids))

        # Consolidate preferences: alloc.preferred first, then day_pref
        meal_prefs = list(dict.fromkeys(alloc.preferred_entity_ids + day_pref))

        # Determine constraints
        constraints = alloc.constraints if alloc.constraints is not None else (default_constraints or [])

        # Build candidate selection context for Phase 6A
        pctx = CandidateSelectionContext(
            meal_role=role,
            allergies=base_context.allergies if base_context else [],
            dietary_class=base_context.dietary_class if base_context else None,
            dislikes=base_context.dislikes if base_context else [],
            requested_exclusions=meal_exclusions,
            preferred_entity_ids=meal_prefs,
            cultural_preferences=base_context.cultural_preferences if base_context else [],
        )

        # Call Phase 6A
        candidate_result = rank_meal_candidates(
            neutral_profile=neutral_profile,
            condition_profile=condition_profile,
            context=pctx,
            catalog_path=catalog_path,
        )

        # Build single-meal generation context for Phase 6C
        mctx = SingleMealGenerationContext(
            meal_role=role,
            required_entity_ids=alloc.required_entity_ids,
            preferred_entity_ids=meal_prefs,
            explicitly_excluded_ids=meal_exclusions,
        )

        # Ensure meal policy requests sufficient alternatives for full-day cross-meal exploration
        meal_policy = alloc.policy
        if meal_policy is None:
            meal_policy = MealCombinationPolicy(
                maximum_alternatives=max(0, active_policy.maximum_meal_candidates_per_role - 1)
            )

        # Call Phase 6C
        single_result: SingleMealGenerationResult = generate_single_meal(
            neutral_profile=neutral_profile,
            condition_profile=condition_profile,
            candidate_result=candidate_result,
            target=alloc.target,
            constraints=constraints,
            context=mctx,
            policy=meal_policy,
        )

        if single_result.is_successful and single_result.best_meal is not None:
            generated_best_meals[role] = single_result.best_meal
            options = [single_result.best_meal] + single_result.alternative_meals
            meal_options_by_role[role] = options
            trace.append(
                f"Role {role.value} succeeded: best meal [{single_result.best_meal.canonical_combination_id}] "
                f"with J*={single_result.best_meal.primary_objective:.6f}, {len(single_result.alternative_meals)} alternatives."
            )
        else:
            failed_roles.append(role)
            reason = f"{single_result.status.value}"
            if single_result.required_entity_failure_reason:
                reason += f" ({single_result.required_entity_failure_reason.value})"
            if single_result.failure_details:
                reason += f": {'; '.join(single_result.failure_details)}"
            failed_details[role] = reason
            trace.append(f"Role {role.value} FAILED: {reason}")
            warnings.append(f"Meal generation failed for role {role.value}: {reason}")

    # 3. Check for partial-day or total failure
    if failed_roles:
        diag_candidates = {role: len(meal_options_by_role.get(role, [])) for role in schedule.roles}
        if active_policy.require_all_meals:
            status = (
                FullDayGenerationStatus.PARTIAL_DAY_GENERATED
                if generated_best_meals
                else FullDayGenerationStatus.NO_VALID_DAY_PLAN
            )
            return FullDayGenerationResult(
                status=status,
                daily_target=neutral_profile,
                meal_schedule=schedule,
                reconciliation=reconciliation,
                meals_requested=schedule.meal_count,
                meals_generated=len(generated_best_meals),
                meals_failed=failed_roles,
                failed_meal_details=failed_details,
                best_day_plan=None,
                alternative_day_plans=[],
                meal_candidates_by_role=diag_candidates,
                total_possible_day_combinations=0,
                day_combinations_evaluated=0,
                day_search_truncated=False,
                day_search_exhaustive=True,
                warnings=warnings,
                trace=trace,
            )
        else:
            # Caller allows partial day
            if not generated_best_meals:
                return FullDayGenerationResult(
                    status=FullDayGenerationStatus.NO_VALID_DAY_PLAN,
                    daily_target=neutral_profile,
                    meal_schedule=schedule,
                    reconciliation=reconciliation,
                    meals_requested=schedule.meal_count,
                    meals_generated=0,
                    meals_failed=failed_roles,
                    failed_meal_details=failed_details,
                    best_day_plan=None,
                    alternative_day_plans=[],
                    meal_candidates_by_role=diag_candidates,
                    total_possible_day_combinations=0,
                    day_combinations_evaluated=0,
                    day_search_truncated=False,
                    day_search_exhaustive=True,
                    warnings=warnings,
                    trace=trace,
                )
            # Assemble partial plan with surviving meals
            partial_plan = assemble_full_day_meal_plan(
                meals=generated_best_meals,
                daily_target=neutral_profile,
                plan_day_index=plan_day_index,
                date=date,
                energy_tolerance_kcal=active_policy.energy_tolerance_kcal,
                warnings=[f"Partial day: missing meal roles {', '.join(r.value for r in failed_roles)}"],
                trace=trace,
            )
            return FullDayGenerationResult(
                status=FullDayGenerationStatus.PARTIAL_DAY_GENERATED,
                daily_target=neutral_profile,
                meal_schedule=schedule,
                reconciliation=reconciliation,
                meals_requested=schedule.meal_count,
                meals_generated=len(generated_best_meals),
                meals_failed=failed_roles,
                failed_meal_details=failed_details,
                best_day_plan=partial_plan,
                alternative_day_plans=[],
                meal_candidates_by_role=diag_candidates,
                total_possible_day_combinations=0,
                day_combinations_evaluated=0,
                day_search_truncated=False,
                day_search_exhaustive=True,
                warnings=warnings,
                trace=trace,
            )

    # 4. Form candidate day configurations from Phase 6C meal alternatives
    meal_candidates_by_role: Dict[MealRole, int] = {}
    role_options: List[List[SingleMealPlan]] = []
    total_possible_day_combos = 1

    for role in schedule.roles:
        options = meal_options_by_role.get(role, [])
        selected = options[:active_policy.maximum_meal_candidates_per_role]
        role_options.append(selected)
        meal_candidates_by_role[role] = len(selected)
        total_possible_day_combos *= len(options) if options else 1

    capped_possible = 1
    for sel in role_options:
        capped_possible *= len(sel) if sel else 1

    candidate_day_plans: List[FullDayMealPlan] = []
    seen_canonical_ids: set[str] = set()

    combos_evaluated = 0
    for combo in itertools.product(*role_options):
        if combos_evaluated >= active_policy.maximum_day_combinations_evaluated:
            break
        combos_evaluated += 1
        day_meals = {role: meal for role, meal in zip(schedule.roles, combo)}
        day_plan = assemble_full_day_meal_plan(
            meals=day_meals,
            daily_target=neutral_profile,
            plan_day_index=plan_day_index,
            date=date,
            energy_tolerance_kcal=active_policy.energy_tolerance_kcal,
            warnings=warnings,
            trace=trace,
        )
        if day_plan.canonical_day_id not in seen_canonical_ids:
            seen_canonical_ids.add(day_plan.canonical_day_id)
            candidate_day_plans.append(day_plan)

    day_search_truncated = (
        (combos_evaluated < capped_possible) or
        (capped_possible < total_possible_day_combos)
    )
    day_search_exhaustive = not day_search_truncated

    if day_search_truncated:
        trunc_warn = "BETTER_UNEVALUATED_DAY_MAY_EXIST: Day search was truncated by candidate or combination bounds."
        if trunc_warn not in warnings:
            warnings.append(trunc_warn)

    if not candidate_day_plans:
        return FullDayGenerationResult(
            status=FullDayGenerationStatus.NO_VALID_DAY_PLAN,
            daily_target=neutral_profile,
            meal_schedule=schedule,
            reconciliation=reconciliation,
            meals_requested=schedule.meal_count,
            meals_generated=len(generated_best_meals),
            meals_failed=[],
            failed_meal_details={},
            best_day_plan=None,
            alternative_day_plans=[],
            meal_candidates_by_role=meal_candidates_by_role,
            total_possible_day_combinations=total_possible_day_combos,
            day_combinations_evaluated=0,
            day_search_truncated=day_search_truncated,
            day_search_exhaustive=day_search_exhaustive,
            warnings=warnings,
            trace=trace,
        )

    # 5. Deterministic Lexicographic Ranking
    candidate_day_plans.sort(key=compute_day_ranking_key)

    best_day = candidate_day_plans[0]
    alternatives = candidate_day_plans[1 : 1 + active_policy.maximum_alternative_day_plans]

    if best_day.all_daily_core_targets_within_range:
        status = FullDayGenerationStatus.FULL_DAILY_TARGETS_MET
    else:
        status = FullDayGenerationStatus.BEST_AVAILABLE_WITH_DAILY_DEVIATIONS

    trace.append(
        f"Full-day generation complete. Best plan [{best_day.canonical_day_id}] "
        f"status: {status.value}, J_day={best_day.daily_primary_objective:.6f}, "
        f"energy={best_day.daily_energy_kcal:.1f} kcal, "
        f"protein={best_day.daily_protein_g:.1f} g, carb={best_day.daily_carbohydrate_g:.1f} g, fat={best_day.daily_fat_g:.1f} g."
    )

    return FullDayGenerationResult(
        status=status,
        daily_target=neutral_profile,
        meal_schedule=schedule,
        reconciliation=reconciliation,
        meals_requested=schedule.meal_count,
        meals_generated=len(generated_best_meals),
        meals_failed=[],
        failed_meal_details={},
        best_day_plan=best_day,
        alternative_day_plans=alternatives,
        meal_candidates_by_role=meal_candidates_by_role,
        total_possible_day_combinations=total_possible_day_combos,
        day_combinations_evaluated=combos_evaluated,
        day_search_truncated=day_search_truncated,
        day_search_exhaustive=day_search_exhaustive,
        warnings=warnings,
        trace=trace,
    )
