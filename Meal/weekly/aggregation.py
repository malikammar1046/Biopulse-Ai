"""Meal/weekly/aggregation.py - Aggregates nutrients, fiber, recipes, and preferences across 7 days.

Provides:
- Unrounded floating-point summation of multi-day macronutrients.
- Preservation of daily deviations and statuses (sum_J_day, mean_J_day, max_J_day).
  Daily nutritional failures are NEVER averaged away by acceptable weekly totals.
- Strict preservation of Phase 5 / Phase 6B fiber missingness semantics.
- Weekly recipe coverage aggregation.
- User preference aggregation across the planned sequence.
- Assembly of complete WeeklyMealPlan objects with deterministic canonical week IDs.
"""

from __future__ import annotations

from typing import List, Optional

from Meal.composition.schemas import RecipeCoverageStatus
from Meal.daily.schemas import DailyFeasibilityClass, FullDayMealPlan
from Meal.evidence.schemas import ConditionNutritionProfile
from Meal.optimizer.schemas import FiberCoverageStatus
from Meal.weekly.repetition import evaluate_weekly_repetition
from Meal.weekly.schemas import (
    WeeklyFiberSummary,
    WeeklyMealPlan,
    WeeklyNutritionSummary,
    WeeklyRepetitionMetrics,
    WeeklyVarietyPolicy,
)


def aggregate_weekly_nutrition(day_plans: List[FullDayMealPlan]) -> WeeklyNutritionSummary:
    """Aggregates nutritional totals, J_day statistics, and compliance across days.
    
    STRICT INVARIANT:
    Daily deviations are preserved in full. Days with deviations are explicitly tracked
    and cannot be hidden behind a healthy weekly average.
    """
    weekly_energy = sum(d.daily_energy_kcal for d in day_plans)
    weekly_prot = sum(d.daily_protein_g for d in day_plans)
    weekly_carb = sum(d.daily_carbohydrate_g for d in day_plans)
    weekly_fat = sum(d.daily_fat_g for d in day_plans)

    j_days = [d.daily_primary_objective for d in day_plans]
    sum_j_day = sum(j_days)
    mean_j_day = (sum_j_day / len(day_plans)) if day_plans else 0.0
    max_j_day = max(j_days) if j_days else 0.0

    days_met = sum(1 for d in day_plans if d.all_daily_core_targets_within_range)
    days_dev = len(day_plans) - days_met
    daily_statuses = [d.feasibility_class for d in day_plans]

    return WeeklyNutritionSummary(
        days_full_targets_met=days_met,
        days_with_target_deviations=days_dev,
        daily_statuses=daily_statuses,
        sum_J_day=round(sum_j_day, 6),
        mean_J_day=round(mean_j_day, 6),
        max_J_day=round(max_j_day, 6),
        worst_day_deviation=round(max_j_day, 6),
        weekly_energy_known_total=weekly_energy,
        weekly_protein_known_total=weekly_prot,
        weekly_carbohydrate_known_total=weekly_carb,
        weekly_fat_known_total=weekly_fat,
    )


def aggregate_weekly_fiber(day_plans: List[FullDayMealPlan]) -> WeeklyFiberSummary:
    """Aggregates dietary fiber across days while strictly preserving missingness semantics.
    
    STRICT INVARIANT:
    Missing fiber is NEVER converted to zero. Weekly fiber coverage is COMPLETE only
    if every constituent item in every planned day has known fiber.
    """
    days_complete = 0
    days_partial = 0
    days_unavailable = 0

    missing_eids: List[str] = []
    total_entities = 0
    known_entities = 0
    known_sum = 0.0
    has_any_known = False

    for d in day_plans:
        f_res = d.fiber_result
        if f_res.fiber_coverage_status == FiberCoverageStatus.COMPLETE:
            days_complete += 1
        elif f_res.fiber_coverage_status == FiberCoverageStatus.PARTIAL:
            days_partial += 1
        else:
            days_unavailable += 1

        total_entities += f_res.total_entities_evaluated
        known_entities += f_res.entities_with_known_fiber

        if f_res.known_fiber_total_g is not None:
            known_sum += f_res.known_fiber_total_g
            has_any_known = True

        for eid in f_res.missing_fiber_entity_ids:
            if eid not in missing_eids:
                missing_eids.append(eid)

    if not missing_eids and total_entities > 0 and days_complete == len(day_plans):
        status = FiberCoverageStatus.COMPLETE
        known_total = known_sum
    elif has_any_known:
        status = FiberCoverageStatus.PARTIAL
        known_total = known_sum
    else:
        status = FiberCoverageStatus.UNAVAILABLE
        known_total = None

    return WeeklyFiberSummary(
        known_weekly_fiber_g=known_total,
        fiber_coverage_status=status,
        days_fiber_complete=days_complete,
        days_fiber_partial=days_partial,
        days_fiber_unavailable=days_unavailable,
        missing_fiber_entity_ids=missing_eids,
        total_entities_evaluated=total_entities,
        entities_with_known_fiber=known_entities,
    )


def aggregate_weekly_recipe_coverage(day_plans: List[FullDayMealPlan]) -> RecipeCoverageStatus:
    """Aggregates recipe instructions coverage across all days."""
    if not day_plans:
        return RecipeCoverageStatus.NONE
    statuses = [d.recipe_instruction_coverage_status for d in day_plans]
    if all(s == RecipeCoverageStatus.FULL for s in statuses):
        return RecipeCoverageStatus.FULL
    if all(s == RecipeCoverageStatus.NONE for s in statuses):
        return RecipeCoverageStatus.NONE
    return RecipeCoverageStatus.PARTIAL


def assemble_weekly_meal_plan(
    day_plans: List[FullDayMealPlan],
    policy: WeeklyVarietyPolicy,
    condition_profile: Optional[ConditionNutritionProfile] = None,
    repetition_metrics: Optional[WeeklyRepetitionMetrics] = None,
    warnings: Optional[List[str]] = None,
    trace: Optional[List[str]] = None,
) -> WeeklyMealPlan:
    """Assembles and evaluates a complete WeeklyMealPlan from ordered daily plans.
    
    Generates a deterministic canonical week ID:
    WEEK__D1:<day1_id>__D2:<day2_id>__...__DN:<dayN_id>
    """
    nutrition = aggregate_weekly_nutrition(day_plans)
    fiber = aggregate_weekly_fiber(day_plans)
    recipe_cov = aggregate_weekly_recipe_coverage(day_plans)

    metrics = (
        repetition_metrics
        if repetition_metrics is not None
        else evaluate_weekly_repetition(day_plans, policy)
    )

    # User preferences aggregation
    matched_prefs = sum(d.matched_preferred_entity_count for d in day_plans)
    total_prefs = sum(d.total_valid_preferred_entity_count for d in day_plans)
    pref_coverage = (matched_prefs / max(total_prefs, 1)) if total_prefs > 0 else 0.0

    # Deterministic Canonical Week ID
    day_id_parts = [f"D{i+1}:{d.canonical_day_id}" for i, d in enumerate(day_plans)]
    canonical_week_id = f"WEEK__{'__'.join(day_id_parts)}"

    # Condition evidence annotations (strictly explanatory, zero numerical score effect)
    condition_annotations: List[str] = []
    if condition_profile is not None and condition_profile.explanation_tokens:
        condition_annotations.append(
            f"Condition pathway ({condition_profile.condition_pathway.value}): "
            f"{', '.join(condition_profile.explanation_tokens)}"
        )

    warns = list(warnings or [])
    if metrics.soft_violation_details:
        warns.extend(metrics.soft_violation_details)

    trc = list(trace or [])

    return WeeklyMealPlan(
        canonical_week_id=canonical_week_id,
        planning_days=len(day_plans),
        day_plans=day_plans,
        nutrition_summary=nutrition,
        fiber_summary=fiber,
        repetition_metrics=metrics,
        recipe_instruction_coverage_status=recipe_cov,
        matched_preferred_entity_count=matched_prefs,
        total_valid_preferred_entity_count=total_prefs,
        preference_coverage=pref_coverage,
        condition_evidence_annotations=condition_annotations,
        warnings=warns,
        trace=trc,
    )
