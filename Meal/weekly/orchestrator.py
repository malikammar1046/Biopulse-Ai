"""Meal/weekly/orchestrator.py - Public Entry Point for Phase 6E Deterministic 7-Day Meal Planning.

Coordinates:
- Sequencing of complete Phase 6D FullDayMealPlan units across N planning days (default 7).
- Multi-level repetition tracking and variety evaluation.
- Hard variety constraint rejection (violating sequences are rejected entirely).
- Deterministic bounded search space exploration with truncation detection.
- Deterministic lexicographic ranking among hard-valid candidate weeks:
  1. Complete valid week > partial
  2. Fewer daily nutritional failures (days_with_target_deviations)
  3. Lower aggregate daily nutrition deviation (sum_J_day)
  4. Lower soft repetition penalty
  5. Higher explicit user preference coverage
  6. Deterministic canonical week ID
- Strict Condition Isolation (zero numerical disease manipulation).
"""

from __future__ import annotations

import itertools
from pathlib import Path
from typing import Dict, List, Optional

from Meal.daily.orchestrator import generate_full_day_plan
from Meal.daily.schemas import (
    DailyMealSchedule,
    FullDayGenerationResult,
    FullDayMealPlan,
    FullDayPlanningPolicy,
)
from Meal.engine.schemas import NutritionTargetProfile
from Meal.evidence.schemas import ConditionNutritionProfile
from Meal.optimizer.schemas import PortionConstraint
from Meal.planner.schemas import CandidateSelectionContext
from Meal.weekly.aggregation import assemble_weekly_meal_plan
from Meal.weekly.repetition import evaluate_weekly_repetition
from Meal.weekly.schemas import (
    WeeklyGenerationResult,
    WeeklyGenerationStatus,
    WeeklyMealPlan,
    WeeklyVarietyPolicy,
)


def compute_week_ranking_key(plan: WeeklyMealPlan, expected_days: int) -> tuple:
    """Deterministic lexicographic ranking key for candidate weeks.
    
    Order:
    1. Complete valid week (0 if day_count == expected_days, 1 otherwise)
    2. Fewer daily nutritional failures (days_with_target_deviations)
    3. Lower aggregate daily nutrition deviation (sum_J_day)
    4. Lower soft repetition penalty
    5. Higher explicit user preference coverage (higher is better -> negative)
    6. Deterministic canonical week ID
    
    STRICT ARCHITECTURAL INVARIANT:
    - HARD variety violations are rejected before ranking; no hard_violations term exists here.
    - Nutrition strictly takes priority over SOFT variety penalties.
    - Zero condition score, PCOS score, hypogonadism score, Phase 6B secondary objective,
      or nutrient concentration is used as a hidden weight.
    """
    complete_rank = 0 if plan.day_count == expected_days else 1
    target_failures = plan.nutrition_summary.days_with_target_deviations
    sum_j = round(plan.nutrition_summary.sum_J_day, 6)
    soft_penalty = round(plan.repetition_metrics.soft_repetition_penalty, 4)
    neg_pref_cov = -round(plan.preference_coverage, 6)
    canonical_id = plan.canonical_week_id

    return (complete_rank, target_failures, sum_j, soft_penalty, neg_pref_cov, canonical_id)


def sort_candidate_days_deterministically(candidate_days: List[FullDayMealPlan]) -> List[FullDayMealPlan]:
    """Sorts candidate days deterministically for sequence generation.
    
    Order:
    1. Lower daily primary objective (J_day)
    2. Higher explicit preference coverage
    3. Canonical day ID
    """
    return sorted(
        candidate_days,
        key=lambda d: (
            round(d.daily_primary_objective, 8),
            -round(d.preference_coverage, 6),
            d.canonical_day_id,
        ),
    )


def deduplicate_candidate_days_by_canonical_id(candidate_days: List[FullDayMealPlan]) -> List[FullDayMealPlan]:
    """Deduplicates candidate day plans by canonical_day_id, deterministically preserving
    the highest-ranked occurrence.
    """
    sorted_days = sort_candidate_days_deterministically(candidate_days)
    unique_days: List[FullDayMealPlan] = []
    seen_ids: set[str] = set()
    for d in sorted_days:
        if d.canonical_day_id not in seen_ids:
            seen_ids.add(d.canonical_day_id)
            unique_days.append(d)
    return unique_days


def generate_weekly_plan(
    neutral_profile: NutritionTargetProfile,
    condition_profile: ConditionNutritionProfile,
    schedule: Optional[DailyMealSchedule] = None,
    candidate_days_by_slot: Optional[Dict[int, List[FullDayMealPlan]]] = None,
    candidate_day_pool: Optional[List[FullDayMealPlan]] = None,
    policy: Optional[WeeklyVarietyPolicy] = None,
    day_policy: Optional[FullDayPlanningPolicy] = None,
    base_context: Optional[CandidateSelectionContext] = None,
    planning_days: int = 7,
    catalog_path: Optional[Path] = None,
    default_constraints: Optional[List[PortionConstraint]] = None,
) -> WeeklyGenerationResult:
    """Public Phase 6E API for deterministic 7-day meal planning and variety control.
    
    Args:
        neutral_profile: Phase 5A neutral daily nutrition targets.
        condition_profile: Phase 5B condition evidence profile.
        schedule: Explicit daily meal schedule.
        candidate_days_by_slot: Optional pre-generated candidate day plans mapped by slot (1..planning_days).
        candidate_day_pool: Optional general pool of candidate day plans to use across slots.
        policy: Configured WeeklyVarietyPolicy.
        day_policy: FullDayPlanningPolicy for Phase 6D generation if candidate days are generated.
        base_context: Context for candidate food selection.
        planning_days: Number of days to plan (must be >= 1, default 7).
        catalog_path: Path to master catalog CSV.
        default_constraints: Portion constraints.
        
    Returns:
        WeeklyGenerationResult containing best_week, alternatives, and audit diagnostics.
    """
    if planning_days < 1:
        raise ValueError(f"planning_days must be >= 1, got {planning_days}")
    if not isinstance(neutral_profile, NutritionTargetProfile):
        raise TypeError(f"neutral_profile must be NutritionTargetProfile, got {type(neutral_profile)}")
    if not isinstance(condition_profile, ConditionNutritionProfile):
        raise TypeError(f"condition_profile must be ConditionNutritionProfile, got {type(condition_profile)}")

    active_policy = policy if policy is not None else WeeklyVarietyPolicy()
    trace: List[str] = []
    warnings: List[str] = []

    trace.append(f"Initiating Phase 6E weekly planning for {planning_days} days.")

    # 1. Establish candidate days per slot (1..planning_days)
    slot_candidates: Dict[int, List[FullDayMealPlan]] = {}
    candidate_counts_per_slot: Dict[int, int] = {}

    if candidate_days_by_slot is not None:
        for slot in range(1, planning_days + 1):
            days = candidate_days_by_slot.get(slot, [])
            unique_days = deduplicate_candidate_days_by_canonical_id(days)
            selected = unique_days[: active_policy.maximum_candidate_days_per_slot]
            slot_candidates[slot] = selected
            candidate_counts_per_slot[slot] = len(selected)
    elif candidate_day_pool is not None:
        unique_pool = deduplicate_candidate_days_by_canonical_id(candidate_day_pool)
        selected_pool = unique_pool[: active_policy.maximum_candidate_days_per_slot]
        for slot in range(1, planning_days + 1):
            slot_candidates[slot] = selected_pool
            candidate_counts_per_slot[slot] = len(selected_pool)
    else:
        # Generate candidate days using Phase 6D
        if schedule is None:
            raise ValueError("schedule must be provided if candidate days are not pre-supplied.")
        
        # Configure Phase 6D policy to return sufficient alternative day plans
        active_day_policy = day_policy if day_policy is not None else FullDayPlanningPolicy(
            maximum_meal_candidates_per_role=3,
            maximum_day_combinations_evaluated=50,
            maximum_alternative_day_plans=max(2, active_policy.maximum_candidate_days_per_slot - 1),
        )
        
        trace.append("Generating candidate day plans via Phase 6D orchestrator...")
        day_res: FullDayGenerationResult = generate_full_day_plan(
            neutral_profile=neutral_profile,
            condition_profile=condition_profile,
            schedule=schedule,
            policy=active_day_policy,
            base_context=base_context,
            catalog_path=catalog_path,
            default_constraints=default_constraints,
        )
        warnings.extend(day_res.warnings)

        if not day_res.is_successful or day_res.best_day_plan is None:
            trace.append("Phase 6D failed to generate any valid day plan.")
            return WeeklyGenerationResult(
                status=WeeklyGenerationStatus.NO_VALID_WEEK_PLAN,
                planning_days_requested=planning_days,
                planning_days_generated=0,
                best_week=None,
                alternative_weeks=[],
                candidate_days_per_slot={s: 0 for s in range(1, planning_days + 1)},
                total_possible_week_sequences=0,
                week_sequences_evaluated=0,
                weeks_rejected_hard_constraints=0,
                hard_valid_sequences_evaluated=0,
                unique_canonical_weeks_evaluated=0,
                duplicate_week_sequences_collapsed=0,
                weeks_remaining_after_hard_filtering=0,
                hard_constraint_rejection_reasons={},
                week_search_truncated=False,
                week_search_exhaustive=True,
                warnings=warnings + ["Underlying Phase 6D day generation produced no valid plan."],
                trace=trace,
            )

        pool = [day_res.best_day_plan] + day_res.alternative_day_plans
        unique_pool = deduplicate_candidate_days_by_canonical_id(pool)
        selected_pool = unique_pool[: active_policy.maximum_candidate_days_per_slot]
        for slot in range(1, planning_days + 1):
            slot_candidates[slot] = selected_pool
            candidate_counts_per_slot[slot] = len(selected_pool)

    # Check for single-candidate transparent notice
    max_cands = max(candidate_counts_per_slot.values(), default=0)
    if max_cands == 1:
        single_msg = "unique candidate days available = 1; weekly variety optimization unavailable because candidate pool contains only one unique day"
        if single_msg not in warnings:
            warnings.append(single_msg)
        trace.append(single_msg)

    # Validate candidate availability
    empty_slots = [slot for slot, days in slot_candidates.items() if not days]
    if empty_slots:
        trace.append(f"No candidate days available for slots: {empty_slots}")
        return WeeklyGenerationResult(
            status=WeeklyGenerationStatus.NO_VALID_WEEK_PLAN,
            planning_days_requested=planning_days,
            planning_days_generated=0,
            best_week=None,
            alternative_weeks=[],
            candidate_days_per_slot=candidate_counts_per_slot,
            total_possible_week_sequences=0,
            week_sequences_evaluated=0,
            weeks_rejected_hard_constraints=0,
            hard_valid_sequences_evaluated=0,
            unique_canonical_weeks_evaluated=0,
            duplicate_week_sequences_collapsed=0,
            weeks_remaining_after_hard_filtering=0,
            hard_constraint_rejection_reasons={},
            week_search_truncated=False,
            week_search_exhaustive=True,
            warnings=warnings + [f"No candidate days available for slots {empty_slots}."],
            trace=trace,
        )

    # 2. Combinatorial Search Diagnostics (Computed strictly after deduplication)
    total_possible_sequences = 1
    for count in candidate_counts_per_slot.values():
        total_possible_sequences *= count

    slot_lists = [slot_candidates[slot] for slot in range(1, planning_days + 1)]

    valid_candidate_weeks: List[WeeklyMealPlan] = []
    seen_canonical_week_ids: set[str] = set()

    sequences_evaluated = 0
    weeks_rejected_hard = 0
    hard_valid_sequences = 0
    unique_canonical_weeks = 0
    duplicate_weeks_collapsed = 0
    hard_rejection_reasons: Dict[str, int] = {}

    # 3. Sequence Evaluation and Hard Constraint Filtering
    for seq in itertools.product(*slot_lists):
        if sequences_evaluated >= active_policy.maximum_week_candidate_sequences_evaluated:
            break
        sequences_evaluated += 1

        day_seq = list(seq)
        metrics = evaluate_weekly_repetition(day_seq, active_policy)

        if not metrics.is_hard_valid:
            # REJECT SEQUENCE: HARD constraint violation
            weeks_rejected_hard += 1
            for viol in metrics.hard_variety_violations:
                rule_prefix = viol.split(":")[0] if ":" in viol else viol
                hard_rejection_reasons[rule_prefix] = hard_rejection_reasons.get(rule_prefix, 0) + 1
            continue

        hard_valid_sequences += 1

        # Assemble hard-valid candidate week
        week_plan = assemble_weekly_meal_plan(
            day_plans=day_seq,
            policy=active_policy,
            condition_profile=condition_profile,
            repetition_metrics=metrics,
            warnings=warnings,
            trace=trace,
        )

        if week_plan.canonical_week_id not in seen_canonical_week_ids:
            seen_canonical_week_ids.add(week_plan.canonical_week_id)
            valid_candidate_weeks.append(week_plan)
            unique_canonical_weeks += 1
        else:
            duplicate_weeks_collapsed += 1

    week_search_truncated = (
        (sequences_evaluated < total_possible_sequences) and
        (sequences_evaluated >= active_policy.maximum_week_candidate_sequences_evaluated)
    )
    week_search_exhaustive = not week_search_truncated

    if week_search_truncated:
        trunc_warn = "BETTER_UNEVALUATED_WEEK_MAY_EXIST: Weekly sequence search was truncated by evaluation limit."
        if trunc_warn not in warnings:
            warnings.append(trunc_warn)

    trace.append(
        f"Evaluated {sequences_evaluated}/{total_possible_sequences} sequences. "
        f"Rejected {weeks_rejected_hard} by HARD constraints. "
        f"{hard_valid_sequences} hard-valid sequences ({unique_canonical_weeks} unique canonical weeks, "
        f"{duplicate_weeks_collapsed} duplicate sequences collapsed)."
    )

    # 4. Check for Empty Valid Pool
    if not valid_candidate_weeks:
        trace.append("No weekly sequence satisfied all HARD constraints and requirements.")
        return WeeklyGenerationResult(
            status=WeeklyGenerationStatus.NO_VALID_WEEK_PLAN,
            planning_days_requested=planning_days,
            planning_days_generated=0,
            best_week=None,
            alternative_weeks=[],
            candidate_days_per_slot=candidate_counts_per_slot,
            total_possible_week_sequences=total_possible_sequences,
            week_sequences_evaluated=sequences_evaluated,
            weeks_rejected_hard_constraints=weeks_rejected_hard,
            hard_valid_sequences_evaluated=hard_valid_sequences,
            unique_canonical_weeks_evaluated=0,
            duplicate_week_sequences_collapsed=duplicate_weeks_collapsed,
            weeks_remaining_after_hard_filtering=0,
            hard_constraint_rejection_reasons=hard_rejection_reasons,
            week_search_truncated=week_search_truncated,
            week_search_exhaustive=week_search_exhaustive,
            warnings=warnings + ["All candidate weekly sequences violated caller-specified HARD variety constraints."],
            trace=trace,
        )

    # 5. Deterministic Lexicographic Ranking (Among Surviving Valid Weeks Only)
    valid_candidate_weeks.sort(key=lambda w: compute_week_ranking_key(w, planning_days))

    best_week = valid_candidate_weeks[0]
    alternatives = valid_candidate_weeks[1 : 1 + active_policy.maximum_week_alternatives]

    if best_week.nutrition_summary.days_with_target_deviations == 0:
        status = WeeklyGenerationStatus.FULL_WEEK_GENERATED
    else:
        status = WeeklyGenerationStatus.FULL_WEEK_WITH_DAILY_DEVIATIONS

    trace.append(
        f"Phase 6E planning complete. Best week [{best_week.canonical_week_id[:50]}...] "
        f"status: {status.value}, sum_J_day={best_week.nutrition_summary.sum_J_day:.6f}, "
        f"soft_penalty={best_week.repetition_metrics.soft_repetition_penalty:.2f}, "
        f"preference_coverage={best_week.preference_coverage*100:.1f}%."
    )

    return WeeklyGenerationResult(
        status=status,
        planning_days_requested=planning_days,
        planning_days_generated=best_week.day_count,
        best_week=best_week,
        alternative_weeks=alternatives,
        candidate_days_per_slot=candidate_counts_per_slot,
        total_possible_week_sequences=total_possible_sequences,
        week_sequences_evaluated=sequences_evaluated,
        weeks_rejected_hard_constraints=weeks_rejected_hard,
        hard_valid_sequences_evaluated=hard_valid_sequences,
        unique_canonical_weeks_evaluated=unique_canonical_weeks,
        duplicate_week_sequences_collapsed=duplicate_weeks_collapsed,
        weeks_remaining_after_hard_filtering=unique_canonical_weeks,
        hard_constraint_rejection_reasons=hard_rejection_reasons,
        week_search_truncated=week_search_truncated,
        week_search_exhaustive=week_search_exhaustive,
        warnings=warnings,
        trace=trace,
    )
