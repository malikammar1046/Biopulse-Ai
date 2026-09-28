"""Meal/weekly - Public Exports for Phase 6E Deterministic 7-Day Meal Planning.

Coordinates multi-day sequence generation, multi-level repetition tracking,
variety heuristics, and hard constraint enforcement while preserving daily
nutritional safety and deviations.
"""

from Meal.weekly.aggregation import (
    aggregate_weekly_fiber,
    aggregate_weekly_nutrition,
    aggregate_weekly_recipe_coverage,
    assemble_weekly_meal_plan,
)
from Meal.weekly.orchestrator import (
    compute_week_ranking_key,
    generate_weekly_plan,
    sort_candidate_days_deterministically,
)
from Meal.weekly.repetition import (
    compute_consecutive_runs,
    evaluate_weekly_repetition,
)
from Meal.weekly.schemas import (
    ConstraintEnforcementMode,
    WeeklyFiberSummary,
    WeeklyGenerationResult,
    WeeklyGenerationStatus,
    WeeklyMealPlan,
    WeeklyNutritionSummary,
    WeeklyRepetitionMetrics,
    WeeklyRequiredOccurrence,
    WeeklyVarietyPolicy,
)

__all__ = [
    "WeeklyGenerationStatus",
    "ConstraintEnforcementMode",
    "WeeklyRequiredOccurrence",
    "WeeklyVarietyPolicy",
    "WeeklyRepetitionMetrics",
    "WeeklyFiberSummary",
    "WeeklyNutritionSummary",
    "WeeklyMealPlan",
    "WeeklyGenerationResult",
    "evaluate_weekly_repetition",
    "compute_consecutive_runs",
    "aggregate_weekly_nutrition",
    "aggregate_weekly_fiber",
    "aggregate_weekly_recipe_coverage",
    "assemble_weekly_meal_plan",
    "compute_week_ranking_key",
    "sort_candidate_days_deterministically",
    "generate_weekly_plan",
]
