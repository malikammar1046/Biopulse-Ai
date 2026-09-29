"""Meal/daily - Phase 6D Deterministic Full-Day Meal Planning Module.

Coordinates:
- Explicit daily meal schedules and targets.
- Allocation target reconciliation against Phase 5A neutral daily nutrition profiles.
- Role-specific candidate ranking (Phase 6A) and combinatorial meal generation (Phase 6C).
- Unrounded daily nutrient aggregation and strict Phase 5 fiber coverage semantics.
- Day-level feasibility evaluation against Phase 5A targets.
- Deterministic lexicographic ranking across alternative day configurations.
- Condition Isolation (GENERAL, PCOS, MALE_HYPOGONADISM produce identical numerical outputs).
"""

from Meal.daily.aggregation import (
    aggregate_daily_nutrients,
    assemble_full_day_meal_plan,
    evaluate_daily_nutrient_deviations,
)
from Meal.daily.orchestrator import (
    compute_day_ranking_key,
    generate_full_day_plan,
)
from Meal.daily.reconciliation import (
    create_engineering_default_schedule,
    reconcile_daily_schedule,
)
from Meal.daily.schemas import (
    DailyAllocationReconciliation,
    DailyFeasibilityClass,
    DailyFiberResult,
    DailyMealSchedule,
    DailyReconciliationStatus,
    FullDayGenerationResult,
    FullDayGenerationStatus,
    FullDayMealPlan,
    FullDayPlanningPolicy,
    MealAllocation,
)

__all__ = [
    "DailyAllocationReconciliation",
    "DailyFeasibilityClass",
    "DailyFiberResult",
    "DailyMealSchedule",
    "DailyReconciliationStatus",
    "FullDayGenerationResult",
    "FullDayGenerationStatus",
    "FullDayMealPlan",
    "FullDayPlanningPolicy",
    "MealAllocation",
    "aggregate_daily_nutrients",
    "assemble_full_day_meal_plan",
    "compute_day_ranking_key",
    "create_engineering_default_schedule",
    "evaluate_daily_nutrient_deviations",
    "generate_full_day_plan",
]
