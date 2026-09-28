"""Meal/weekly/schemas.py - Data schemas and contracts for Phase 6E Deterministic 7-Day Meal Planning.

Defines schemas, policies, multi-level repetition tracking structures,
weekly nutrition summaries, and top-level weekly generation results.

Strict Architectural Invariants:
1. FullDayMealPlan as Atomic Unit:
   - Phase 6E sequences complete FullDayMealPlan objects.
   - Phase 6E NEVER alters meal combinations, food selections, or portions.
2. Hard vs Soft Constraint Semantics:
   - HARD variety violations reject the candidate week entirely.
   - Rejected weeks NEVER enter the valid ranking pool, best_week, or alternative_weeks.
   - SOFT variety penalties guide ranking only among hard-valid candidate weeks.
   - Nutrition strictly takes priority over SOFT variety penalties.
3. Multi-Level Repetition Tracking:
   - Tracks entity occurrences, equivalence concept occurrences (e.g. EQ_CHAPATI),
     meal combination occurrences, day plan occurrences, and consecutive runs.
   - Switching entity IDs within the same equivalence group cannot fake diversity.
4. Daily Nutrition Preservation:
   - Preserves per-day J_day, deviations, and feasibility classes.
   - Daily failures are NEVER averaged away by acceptable weekly totals.
5. Condition Isolation:
   - GENERAL, PCOS, and MALE_HYPOGONADISM produce identical sequences, selections,
     metrics, and rankings. Condition evidence provides annotations only.
6. Strict Fiber Missingness:
   - Missing fiber is NEVER converted to zero.
   - Weekly fiber status is COMPLETE only if all items across all days have known fiber.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional

from Meal.composition.schemas import RecipeCoverageStatus
from Meal.daily.schemas import DailyFeasibilityClass, FullDayMealPlan
from Meal.optimizer.schemas import FiberCoverageStatus
from Meal.planner.schemas import MealRole


class WeeklyGenerationStatus(str, Enum):
    """Top-level status of the Phase 6E weekly meal planning engine."""
    FULL_WEEK_GENERATED = "FULL_WEEK_GENERATED"
    FULL_WEEK_WITH_DAILY_DEVIATIONS = "FULL_WEEK_WITH_DAILY_DEVIATIONS"
    PARTIAL_WEEK_GENERATED = "PARTIAL_WEEK_GENERATED"
    NO_VALID_WEEK_PLAN = "NO_VALID_WEEK_PLAN"
    INVALID_WEEK_POLICY = "INVALID_WEEK_POLICY"


class ConstraintEnforcementMode(str, Enum):
    """Enforcement mode for weekly variety and occurrence constraints."""
    HARD = "HARD"  # Must be satisfied; non-compliance rejects candidate week sequence
    SOFT = "SOFT"  # Non-compliance applies a numerical penalty; does not reject week


@dataclass(frozen=True)
class WeeklyRequiredOccurrence:
    """Explicit requirement for an entity or equivalence concept to appear within the week.
    
    ENGINEERING NOTICE:
    BioPulse does not invent clinical occurrence mandates. These constraints are enforced
    only when explicitly supplied by the caller.
    """
    entity_or_concept_id: str
    minimum_occurrences: int = 1
    maximum_occurrences: Optional[int] = None
    enforcement: ConstraintEnforcementMode = ConstraintEnforcementMode.SOFT
    description: Optional[str] = None

    def __post_init__(self) -> None:
        if not self.entity_or_concept_id:
            raise ValueError("entity_or_concept_id cannot be empty.")
        if self.minimum_occurrences < 0:
            raise ValueError(f"minimum_occurrences must be >= 0, got {self.minimum_occurrences}")
        if self.maximum_occurrences is not None and self.maximum_occurrences < self.minimum_occurrences:
            raise ValueError(
                f"maximum_occurrences ({self.maximum_occurrences}) cannot be less than "
                f"minimum_occurrences ({self.minimum_occurrences})."
            )


@dataclass(frozen=True)
class WeeklyVarietyPolicy:
    """Policy governing multi-day sequence repetition limits, variety penalties, and search bounds.
    
    ENGINEERING NOTICE:
    These repetition thresholds and search limits are computational heuristics designed to
    reduce dietary monotony. They are NOT medical or clinical frequency limits.
    """
    maximum_same_entity_occurrences_per_week: int = 14
    maximum_same_equivalence_concept_occurrences_per_week: int = 14
    maximum_same_meal_combination_occurrences_per_week: int = 4
    maximum_same_day_plan_occurrences_per_week: int = 2
    maximum_consecutive_day_entity_repetition: int = 3
    maximum_consecutive_day_meal_combination_repetition: int = 1
    maximum_consecutive_day_role_combination_repetition: int = 1

    # Enforcement modes for individual rules
    entity_occurrence_enforcement: ConstraintEnforcementMode = ConstraintEnforcementMode.SOFT
    concept_occurrence_enforcement: ConstraintEnforcementMode = ConstraintEnforcementMode.SOFT
    meal_combination_enforcement: ConstraintEnforcementMode = ConstraintEnforcementMode.SOFT
    day_plan_enforcement: ConstraintEnforcementMode = ConstraintEnforcementMode.SOFT
    consecutive_run_enforcement: ConstraintEnforcementMode = ConstraintEnforcementMode.SOFT

    # Search space exploration bounds
    maximum_candidate_days_per_slot: int = 3
    maximum_week_candidate_sequences_evaluated: int = 250
    maximum_week_alternatives: int = 3
    require_full_week: bool = True

    # Caller-specified occurrence requirements
    required_occurrences: List[WeeklyRequiredOccurrence] = field(default_factory=list)

    def __post_init__(self) -> None:
        if self.maximum_same_entity_occurrences_per_week < 1:
            raise ValueError("maximum_same_entity_occurrences_per_week must be >= 1.")
        if self.maximum_same_equivalence_concept_occurrences_per_week < 1:
            raise ValueError("maximum_same_equivalence_concept_occurrences_per_week must be >= 1.")
        if self.maximum_same_meal_combination_occurrences_per_week < 1:
            raise ValueError("maximum_same_meal_combination_occurrences_per_week must be >= 1.")
        if self.maximum_candidate_days_per_slot < 1:
            raise ValueError("maximum_candidate_days_per_slot must be >= 1.")
        if self.maximum_week_candidate_sequences_evaluated < 1:
            raise ValueError("maximum_week_candidate_sequences_evaluated must be >= 1.")
        if self.maximum_week_alternatives < 0:
            raise ValueError("maximum_week_alternatives must be >= 0.")


@dataclass(frozen=True)
class WeeklyRepetitionMetrics:
    """Detailed audit metrics of food and combination repetition across a planned week."""
    entity_occurrence_counts: Dict[str, int]
    equivalence_concept_occurrence_counts: Dict[str, int]
    meal_combination_occurrence_counts: Dict[str, int]
    day_plan_occurrence_counts: Dict[str, int]
    consecutive_entity_runs: Dict[str, int]
    consecutive_concept_runs: Dict[str, int]
    consecutive_meal_combination_runs: Dict[str, int]
    role_specific_combination_runs: Dict[MealRole, Dict[str, int]]
    
    # Violations and penalties
    hard_variety_violations: List[str]
    soft_repetition_penalty: float
    soft_violation_details: List[str] = field(default_factory=list)

    @property
    def is_hard_valid(self) -> bool:
        return len(self.hard_variety_violations) == 0


@dataclass(frozen=True)
class WeeklyFiberSummary:
    """Dietary fiber aggregation across the week preserving Phase 5 missingness semantics."""
    known_weekly_fiber_g: Optional[float]
    fiber_coverage_status: FiberCoverageStatus
    days_fiber_complete: int
    days_fiber_partial: int
    days_fiber_unavailable: int
    missing_fiber_entity_ids: List[str]
    total_entities_evaluated: int
    entities_with_known_fiber: int


@dataclass(frozen=True)
class WeeklyNutritionSummary:
    """Weekly nutritional totals and daily compliance statistics.
    
    CRITICAL ARCHITECTURAL INVARIANT:
    Daily deviations and failures are NEVER averaged away.
    sum_J_day, mean_J_day, worst_day_deviation, and daily_statuses are preserved in full.
    """
    days_full_targets_met: int
    days_with_target_deviations: int
    daily_statuses: List[DailyFeasibilityClass]
    sum_J_day: float
    mean_J_day: float
    max_J_day: float
    worst_day_deviation: float
    
    weekly_energy_known_total: float
    weekly_protein_known_total: float
    weekly_carbohydrate_known_total: float
    weekly_fat_known_total: float


@dataclass(frozen=True)
class WeeklyMealPlan:
    """Immutable representation of an evaluated multi-day / 7-day meal plan."""
    canonical_week_id: str
    planning_days: int
    day_plans: List[FullDayMealPlan]
    nutrition_summary: WeeklyNutritionSummary
    fiber_summary: WeeklyFiberSummary
    repetition_metrics: WeeklyRepetitionMetrics
    recipe_instruction_coverage_status: RecipeCoverageStatus
    matched_preferred_entity_count: int
    total_valid_preferred_entity_count: int
    preference_coverage: float
    
    condition_evidence_annotations: List[str] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)
    trace: List[str] = field(default_factory=list)

    @property
    def day_count(self) -> int:
        return len(self.day_plans)


@dataclass(frozen=True)
class WeeklyGenerationResult:
    """Top-level immutable result of the Phase 6E weekly meal planning engine."""
    status: WeeklyGenerationStatus
    planning_days_requested: int
    planning_days_generated: int
    best_week: Optional[WeeklyMealPlan]
    alternative_weeks: List[WeeklyMealPlan]
    
    # Combinatorial and diagnostic search tracking
    candidate_days_per_slot: Dict[int, int]
    total_possible_week_sequences: int
    week_sequences_evaluated: int
    weeks_rejected_hard_constraints: int
    hard_valid_sequences_evaluated: int
    unique_canonical_weeks_evaluated: int
    duplicate_week_sequences_collapsed: int
    weeks_remaining_after_hard_filtering: int
    hard_constraint_rejection_reasons: Dict[str, int]
    week_search_truncated: bool
    week_search_exhaustive: bool
    
    warnings: List[str] = field(default_factory=list)
    trace: List[str] = field(default_factory=list)

    @property
    def is_successful(self) -> bool:
        return self.status in (
            WeeklyGenerationStatus.FULL_WEEK_GENERATED,
            WeeklyGenerationStatus.FULL_WEEK_WITH_DAILY_DEVIATIONS,
        )
