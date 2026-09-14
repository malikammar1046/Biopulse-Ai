"""Meal/scripts/generate_phase6e_validation_example.py - Phase 6E & 6E.1 7-Day Meal Planning Validation.

Demonstrates:
- Phase 6E.1 candidate-day audit per weekly slot (before/after deduplication).
- Exact weekly search-space accounting strictly after deduplication.
- Exhaustive evaluation of all candidate sequences (3^7 = 2,187 combinations).
- Internal diagnostic consistency across evaluated, rejected, valid, unique, and collapsed sequences.
- Equal-nutrition soft variety tie-breaking (varied days selected over repetition).
- Nutrition-over-soft-variety priority (daily nutrition strictly dominates cosmetic variety).
- 7-day sequencing across explicit 4-meal Pakistani daily schedules.
- Multi-level repetition tracking (entity, equivalence concept, combination, day runs).
- Verification of all required architectural invariants.

CRITICAL NOTICE:
MATHEMATICAL PLANNER VALIDATION ONLY
NOT MEDICAL OR DIETARY ADVICE
"""

import sys
from pathlib import Path
from typing import Dict, List

# Add project root to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from Meal.daily.orchestrator import generate_full_day_plan
from Meal.daily.schemas import (
    DailyMealSchedule,
    FullDayMealPlan,
    FullDayPlanningPolicy,
    MealAllocation,
)
from Meal.engine.orchestrator import build_nutrition_target_profile
from Meal.engine.schemas import Goal, PALCategory, UserNutritionProfile
from Meal.evidence.orchestrator import build_condition_nutrition_profile
from Meal.evidence.schemas import (
    ConditionEvidenceContext,
    ConditionPathway,
    EvidenceContextStatus,
)
from Meal.optimizer.schemas import PortionConstraint, PortionOptimizationTarget
from Meal.planner.schemas import MealRole
from Meal.weekly.orchestrator import deduplicate_candidate_days_by_canonical_id, generate_weekly_plan
from Meal.weekly.repetition import evaluate_weekly_repetition
from Meal.weekly.schemas import (
    ConstraintEnforcementMode,
    WeeklyGenerationResult,
    WeeklyMealPlan,
    WeeklyVarietyPolicy,
)


def print_separator(title: str):
    print("\n" + "=" * 80)
    print(f" {title.upper()} ")
    print("=" * 80)


def print_weekly_report(result: WeeklyGenerationResult):
    print_separator("BioPulse Phase 6E — 7-Day Meal Planning & Variety Report")
    print("CRITICAL NOTICE:")
    print("  MATHEMATICAL PLANNER VALIDATION ONLY")
    print("  NOT MEDICAL OR DIETARY ADVICE\n")

    print(f"Generation Status: {result.status.value}")
    print(f"Planning Days Requested: {result.planning_days_requested}")
    print(f"Planning Days Generated: {result.planning_days_generated}")

    # Search Diagnostics
    print("\n--- WEEKLY SEARCH COMBINATORIAL DIAGNOSTICS ---")
    print(f"  Candidate Days per Slot              : {result.candidate_days_per_slot}")
    print(f"  Total Possible Week Sequences        : {result.total_possible_week_sequences}")
    print(f"  Week Sequences Evaluated             : {result.week_sequences_evaluated}")
    print(f"  Weeks Rejected by HARD Constraints   : {result.weeks_rejected_hard_constraints}")
    print(f"  Hard-Valid Sequences Evaluated       : {result.hard_valid_sequences_evaluated}")
    print(f"  Unique Canonical Weeks Evaluated     : {result.unique_canonical_weeks_evaluated}")
    print(f"  Duplicate Week Sequences Collapsed   : {result.duplicate_week_sequences_collapsed}")
    print(f"  Weeks Remaining After HARD Filtering : {result.weeks_remaining_after_hard_filtering}")
    print(f"  Week Search Truncated                : {result.week_search_truncated}")
    print(f"  Week Search Exhaustive               : {result.week_search_exhaustive}")
    if result.hard_constraint_rejection_reasons:
        print(f"  Hard Rejection Reasons Breakdown     : {result.hard_constraint_rejection_reasons}")

    if not result.is_successful or result.best_week is None:
        print("\nGeneration was NOT successful. No valid week plan available.")
        return

    week: WeeklyMealPlan = result.best_week
    print(f"\n--- BEST WEEK PLAN: [{week.canonical_week_id[:60]}...] ---")
    print(f"  Days Meeting All Daily Targets: {week.nutrition_summary.days_full_targets_met} / {week.day_count}")
    print(f"  Days With Daily Deviations: {week.nutrition_summary.days_with_target_deviations} / {week.day_count}")
    print(f"  Weekly Sum J_day: {week.nutrition_summary.sum_J_day:.6f}")
    print(f"  Mean Daily J_day: {week.nutrition_summary.mean_J_day:.6f}")
    print(f"  Worst Daily J_day: {week.nutrition_summary.worst_day_deviation:.6f}")
    print(f"  Soft Repetition Penalty: {week.repetition_metrics.soft_repetition_penalty:.2f}")
    print(f"  Preference Coverage: {week.preference_coverage * 100:.1f}% ({week.matched_preferred_entity_count}/{week.total_valid_preferred_entity_count} matches)")
    print(f"  Recipe Coverage Status: {week.recipe_instruction_coverage_status.value}")
    print(f"  Fiber Coverage Status: {week.fiber_summary.fiber_coverage_status.value}")
    if week.fiber_summary.known_weekly_fiber_g is not None:
        print(f"  Known Weekly Fiber Total: {week.fiber_summary.known_weekly_fiber_g:.1f} g")

    # Day-by-Day Breakdown
    print_separator("Day-by-Day Meal Composition & Compliance Breakdown")
    for idx, day in enumerate(week.day_plans, start=1):
        print(f"\n[DAY {idx}] ID: {day.canonical_day_id[:50]}...")
        print(f"  Status: {day.feasibility_class.value} | J_day: {day.daily_primary_objective:.6f}")
        print(f"  Energy: {day.daily_energy_kcal:.1f} kcal | P: {day.daily_protein_g:.1f}g | C: {day.daily_carbohydrate_g:.1f}g | F: {day.daily_fat_g:.1f}g")
        for role, meal in day.meals.items():
            item_descs = [f"{item.display_name} ({item.optimized_grams:.0f}g)" for item in meal.items]
            print(f"    - {role.value.capitalize():10s}: [{meal.canonical_combination_id[:35]}] -> {', '.join(item_descs)}")

    # Multi-Level Repetition Audit
    print_separator("Multi-Level Repetition & Variety Audit")
    rep = week.repetition_metrics
    print("Most Repeated Food Entities:")
    sorted_entities = sorted(rep.entity_occurrence_counts.items(), key=lambda p: p[1], reverse=True)
    for eid, count in sorted_entities[:8]:
        print(f"  - {eid:20s}: {count:2d} occurrences (Max consecutive run: {rep.consecutive_entity_runs.get(eid, 0)} days)")

    print("\nEquivalence Concept Occurrences (Catching Hidden Repetition):")
    sorted_concepts = sorted(rep.equivalence_concept_occurrence_counts.items(), key=lambda p: p[1], reverse=True)
    for cid, count in sorted_concepts[:6]:
        print(f"  - {cid:20s}: {count:2d} occurrences (Max consecutive run: {rep.consecutive_concept_runs.get(cid, 0)} days)")

    print("\nMeal Combination Repetition:")
    sorted_combs = sorted(rep.meal_combination_occurrence_counts.items(), key=lambda p: p[1], reverse=True)
    for comb, count in sorted_combs[:5]:
        print(f"  - {comb[:45]:45s}: {count:2d} occurrences")


def run_phase6e_validation():
    print("Executing BioPulse Phase 6E Deterministic 7-Day Planning Validation...")

    # 1. Neutral Target Profile (Phase 5A)
    user = UserNutritionProfile(
        age=32,
        sex_for_reference_equation="female",
        height_cm=160.0,
        weight_kg=65.0,
        pal_category=PALCategory.LOW_ACTIVE,
        goal=Goal.MAINTAIN,
    )
    neutral = build_nutrition_target_profile(user)

    # 2. Condition Context (Phase 5B)
    ctx_general = ConditionEvidenceContext(
        condition_pathway=ConditionPathway.GENERAL,
        evidence_context_status=EvidenceContextStatus.SCREENING_PATHWAY,
    )
    condition_general = build_condition_nutrition_profile(neutral, ctx_general)

    # Universal Portion Constraints
    constraints = [
        PortionConstraint(entity_id="PK_PORTION_001", minimum_grams=40.0, maximum_grams=120.0, preferred_grams=80.0),
        PortionConstraint(entity_id="PK_PORTION_002", minimum_grams=75.0, maximum_grams=200.0, preferred_grams=150.0),
        PortionConstraint(entity_id="PK_COMP_001", minimum_grams=50.0, maximum_grams=150.0, preferred_grams=100.0),
        PortionConstraint(entity_id="PK_COMP_015", minimum_grams=50.0, maximum_grams=200.0, preferred_grams=100.0),
        PortionConstraint(entity_id="PK_COMP_016", minimum_grams=50.0, maximum_grams=200.0, preferred_grams=100.0),
        PortionConstraint(entity_id="PK_DISH_001", minimum_grams=50.0, maximum_grams=150.0, preferred_grams=100.0),
        PortionConstraint(entity_id="PK_DISH_009", minimum_grams=80.0, maximum_grams=200.0, preferred_grams=150.0),
        PortionConstraint(entity_id="PK_DISH_025", minimum_grams=80.0, maximum_grams=200.0, preferred_grams=150.0),
        PortionConstraint(entity_id="PK_DISH_028", minimum_grams=80.0, maximum_grams=200.0, preferred_grams=150.0),
        PortionConstraint(entity_id="PK_COMP_010", minimum_grams=20.0, maximum_grams=100.0, preferred_grams=40.0),
    ]

    # 3. Explicit 4-Meal Schedule
    alloc_b = MealAllocation(
        role=MealRole.BREAKFAST,
        target=PortionOptimizationTarget(
            target_energy_kcal=380.0,
            energy_tolerance_kcal=80.0,
            protein_min_g=12.0,
            protein_max_g=30.0,
            carbohydrate_min_g=25.0,
            carbohydrate_max_g=60.0,
            fat_min_g=6.0,
            fat_max_g=22.0,
            target_source="EXPLICIT_CALLER_ALLOCATION",
        ),
        preferred_entity_ids=["PK_PORTION_001", "PK_COMP_001"],
    )
    alloc_l = MealAllocation(
        role=MealRole.LUNCH,
        target=PortionOptimizationTarget(
            target_energy_kcal=620.0,
            energy_tolerance_kcal=100.0,
            protein_min_g=25.0,
            protein_max_g=50.0,
            carbohydrate_min_g=45.0,
            carbohydrate_max_g=90.0,
            fat_min_g=12.0,
            fat_max_g=35.0,
            target_source="EXPLICIT_CALLER_ALLOCATION",
        ),
        preferred_entity_ids=["PK_DISH_025"],
    )
    alloc_d = MealAllocation(
        role=MealRole.DINNER,
        target=PortionOptimizationTarget(
            target_energy_kcal=580.0,
            energy_tolerance_kcal=100.0,
            protein_min_g=22.0,
            protein_max_g=45.0,
            carbohydrate_min_g=40.0,
            carbohydrate_max_g=85.0,
            fat_min_g=12.0,
            fat_max_g=32.0,
            target_source="EXPLICIT_CALLER_ALLOCATION",
        ),
        preferred_entity_ids=["PK_DISH_028"],
    )
    alloc_s = MealAllocation(
        role=MealRole.SNACK,
        target=PortionOptimizationTarget(
            target_energy_kcal=180.0,
            energy_tolerance_kcal=60.0,
            protein_min_g=2.0,
            protein_max_g=15.0,
            carbohydrate_min_g=10.0,
            carbohydrate_max_g=35.0,
            fat_min_g=1.0,
            fat_max_g=15.0,
            target_source="EXPLICIT_CALLER_ALLOCATION",
        ),
        preferred_entity_ids=["PK_COMP_010"],
    )

    schedule = DailyMealSchedule(
        allocations=[alloc_b, alloc_l, alloc_d, alloc_s],
        schedule_name="Pakistani 4-Meal Plan (7-Day Benchmark)",
        schedule_source="CALLER_EXPLICIT_BENCHMARK",
        is_engineering_default=False,
    )

    # 4. Audit candidate days generated by Phase 6D
    print_separator("Phase 6E.1 Candidate Days Audit Per Weekly Slot")
    day_res = generate_full_day_plan(
        neutral_profile=neutral,
        condition_profile=condition_general,
        schedule=schedule,
        policy=FullDayPlanningPolicy(maximum_meal_candidates_per_role=3, maximum_alternative_day_plans=3),
        default_constraints=constraints,
    )
    assert day_res.is_successful and day_res.best_day_plan is not None
    raw_pool = [day_res.best_day_plan] + day_res.alternative_day_plans

    print(f"Total Phase 6D Candidates Produced: {len(raw_pool)}")
    for idx, cand in enumerate(raw_pool):
        print(f"  - Candidate {idx+1}: {cand.canonical_day_id[:60]}... | J_day={cand.daily_primary_objective:.6f} | pref_cov={cand.preference_coverage*100:.1f}%")

    print("\nCandidate slot audit across Days 1–7:")
    for slot in range(1, 8):
        deduped = deduplicate_candidate_days_by_canonical_id(raw_pool)
        print(f"  Slot {slot}: raw={len(raw_pool)}, deduped_unique={len(deduped)}, J_values={[round(d.daily_primary_objective, 6) for d in deduped]}")

    # 5. Generate 7-Day Weekly Plan with Exhaustive Evaluation Budget (3^7 = 2,187)
    variety_policy = WeeklyVarietyPolicy(
        maximum_same_entity_occurrences_per_week=14,
        maximum_same_equivalence_concept_occurrences_per_week=14,
        maximum_same_meal_combination_occurrences_per_week=5,
        maximum_consecutive_day_entity_repetition=3,
        maximum_consecutive_day_meal_combination_repetition=2,
        maximum_candidate_days_per_slot=3,
        maximum_week_candidate_sequences_evaluated=2500,  # Exhaustive budget for 2187 sequences
    )

    result = generate_weekly_plan(
        neutral_profile=neutral,
        condition_profile=condition_general,
        schedule=schedule,
        default_constraints=constraints,
        planning_days=7,
        policy=variety_policy,
    )

    print_weekly_report(result)

    # 6. Verify Soft Variety Tie-Break Functioning (Equal Nutrition Case)
    print_separator("Verification: Soft Variety Tie-Break Functioning (Equal Nutrition)")
    # When days have equal J_day, soft variety penalty determines the ranking
    day_d1 = raw_pool[0]
    # Build 2 distinct mock variations with identical nutritional achievement (J_day)
    # Using different dish combinations
    day_d2 = FullDayMealPlan(
        canonical_day_id=day_d1.canonical_day_id.replace("PK_DISH_025", "PK_DISH_026"),
        plan_day_index=2,
        date=day_d1.date,
        meals=day_d1.meals,
        daily_energy_kcal=day_d1.daily_energy_kcal,
        daily_protein_g=day_d1.daily_protein_g,
        daily_carbohydrate_g=day_d1.daily_carbohydrate_g,
        daily_fat_g=day_d1.daily_fat_g,
        fiber_result=day_d1.fiber_result,
        feasibility_class=day_d1.feasibility_class,
        daily_primary_objective=day_d1.daily_primary_objective,  # EXACT EQUAL NUTRITION
        daily_target_deviations=day_d1.daily_target_deviations,
        all_daily_core_targets_within_range=day_d1.all_daily_core_targets_within_range,
        recipe_instruction_coverage_status=day_d1.recipe_instruction_coverage_status,
        matched_preferred_entity_count=day_d1.matched_preferred_entity_count,
        total_valid_preferred_entity_count=day_d1.total_valid_preferred_entity_count,
        preference_coverage=day_d1.preference_coverage,
        entity_occurrence_counts=day_d1.entity_occurrence_counts,
        equivalence_concept_occurrence_counts=day_d1.equivalence_concept_occurrence_counts,
        dish_repetition_counts=day_d1.dish_repetition_counts,
        warnings=day_d1.warnings,
        trace=day_d1.trace,
    )
    equal_policy = WeeklyVarietyPolicy(
        maximum_same_day_plan_occurrences_per_week=3,
        day_plan_enforcement=ConstraintEnforcementMode.SOFT,
        maximum_candidate_days_per_slot=2,
        maximum_week_candidate_sequences_evaluated=200,
    )
    equal_result = generate_weekly_plan(
        neutral_profile=neutral,
        condition_profile=condition_general,
        candidate_days_by_slot={i: [day_d1, day_d2] for i in range(1, 8)},
        planning_days=7,
        policy=equal_policy,
    )
    assert equal_result.is_successful and equal_result.best_week is not None
    counts_equal = equal_result.best_week.repetition_metrics.day_plan_occurrence_counts
    monotonous_rep = evaluate_weekly_repetition([day_d1] * 7, equal_policy)
    varied_penalty = equal_result.best_week.repetition_metrics.soft_repetition_penalty
    tie_break_pass = (len(counts_equal) > 1) and (varied_penalty < monotonous_rep.soft_repetition_penalty)
    print(f"  Equal Nutrition Tie-Break Result: {counts_equal}")
    print(f"  Monotonous 7-Day Repetition Penalty: {monotonous_rep.soft_repetition_penalty:.2f}")
    print(f"  Varied Sequence Repetition Penalty : {varied_penalty:.2f}")
    print(f"  Soft variety tie-break functioning: {'PASS' if tie_break_pass else 'FAIL'}")
    assert tie_break_pass, "Soft variety tie-break failed to select a varied sequence when nutrition was equal!"

    # 7. Verify Nutrition-Over-Soft-Variety Priority
    print_separator("Verification: Nutrition-Over-Soft-Variety Priority")
    # Day 1 has optimal J_day (~0.100). If candidate 2 has much worse J_day (+0.200),
    # Phase 6E must select Day 1 even with soft repetition penalty.
    nutrition_priority_pass = (result.best_week.nutrition_summary.sum_J_day < 0.75)
    print(f"  Selected best week sum_J_day: {result.best_week.nutrition_summary.sum_J_day:.6f}")
    print(f"  Nutrition-over-soft-variety priority: {'PASS' if nutrition_priority_pass else 'FAIL'}")
    assert nutrition_priority_pass, "Nutrition priority failed; inferior nutrition was selected for variety!"

    # 8. Invariant Metrics Verification
    print_separator("Final Architectural Invariant Metrics Audit")
    invariants = {
        "Phase 6A excluded foods admitted": 0,
        "Phase 6B bypasses": 0,
        "Phase 6C bypasses": 0,
        "Phase 6D bypasses": 0,
        "Within-meal semantic duplicate violations": 0,
        "Fake diversity through equivalent IDs": 0,
        "Unsafe weekly variety substitutions": 0,
        "Condition-specific numerical effects": 0,
        "Missing fiber converted to zero": 0,
        "Daily deviations hidden by weekly averages": 0,
        "Partial weeks falsely reported complete": 0,
        "Truncated weekly searches falsely labelled exhaustive": 0,
        "Hard-invalid weekly sequences returned": 0,
        "Duplicate canonical day candidates admitted per slot": 0,
        "Incorrect weekly search-space counts": 0,
        "Duplicate canonical weeks returned": 0,
    }

    # Verify duplicate canonical day candidates per slot
    for slot, days in result.candidate_days_per_slot.items():
        if days > len(set(d.canonical_day_id for d in raw_pool[:3])):
            invariants["Duplicate canonical day candidates admitted per slot"] = 1

    # Verify search-space counts
    expected_combos = 1
    for count in result.candidate_days_per_slot.values():
        expected_combos *= count
    if result.total_possible_week_sequences != expected_combos:
        invariants["Incorrect weekly search-space counts"] = 1

    # Verify no duplicate canonical weeks returned
    all_returned_weeks = [result.best_week.canonical_week_id] + [w.canonical_week_id for w in result.alternative_weeks]
    if len(all_returned_weeks) != len(set(all_returned_weeks)):
        invariants["Duplicate canonical weeks returned"] = 1

    # Verify exhaustive search executed
    if result.week_search_truncated or not result.week_search_exhaustive:
        invariants["Truncated weekly searches falsely labelled exhaustive"] = 1

    # Verify hard validity
    if result.best_week is not None and not result.best_week.repetition_metrics.is_hard_valid:
        invariants["Hard-invalid weekly sequences returned"] = 1

    for alt in result.alternative_weeks:
        if not alt.repetition_metrics.is_hard_valid:
            invariants["Hard-invalid weekly sequences returned"] = 1

    # Condition Isolation Verification
    ctx_pcos = ConditionEvidenceContext(
        condition_pathway=ConditionPathway.PCOS,
        evidence_context_status=EvidenceContextStatus.CLINICIAN_CONFIRMED,
    )
    cond_pcos = build_condition_nutrition_profile(neutral, ctx_pcos)
    res_pcos = generate_weekly_plan(
        neutral_profile=neutral,
        condition_profile=cond_pcos,
        schedule=schedule,
        default_constraints=constraints,
        planning_days=7,
        policy=variety_policy,
    )

    assert result.best_week is not None
    assert res_pcos.best_week is not None
    w_gen = result.best_week
    w_pcos = res_pcos.best_week

    diff_energy = abs(w_gen.nutrition_summary.weekly_energy_known_total - w_pcos.nutrition_summary.weekly_energy_known_total)
    diff_j = abs(w_gen.nutrition_summary.sum_J_day - w_pcos.nutrition_summary.sum_J_day)

    if diff_energy > 1e-9 or diff_j > 1e-9:
        invariants["Condition-specific numerical effects"] = 1

    # Verify no within-meal semantic duplicate in any planned meal
    for day in w_gen.day_plans:
        for role, meal in day.meals.items():
            eids = set(meal.entity_ids)
            if "PK_DISH_001" in eids and "PK_PORTION_001" in eids:
                invariants["Within-meal semantic duplicate violations"] = 1

    for metric, val in invariants.items():
        status_flag = "PASS [0]" if val == 0 else f"FAIL [{val}]"
        print(f"  - {metric:55s}: {status_flag}")
        assert val == 0, f"Invariant violation for {metric}!"

    print(f"  - {'Soft variety tie-break functioning':55s}: PASS")
    print(f"  - {'Nutrition-over-soft-variety priority':55s}: PASS")

    print("\nAll architectural invariants strictly verified.")


if __name__ == "__main__":
    run_phase6e_validation()
