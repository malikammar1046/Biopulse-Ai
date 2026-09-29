"""Meal/daily/schemas.py - Data schemas and contracts for Phase 6D Deterministic Full-Day Meal Planning.

Defines schemas, schedules, reconciliation records, daily aggregation structures,
and top-level generation results for full-day meal planning.

Strict Architectural Invariants:
1. Coordination Hierarchy:
   - Phase 6D coordinates meals.
   - Phase 6C selects food combinations.
   - Phase 6B selects gram quantities.
   Phase 6D NEVER duplicates or bypasses Phase 6B or 6C logic.
2. Explicit Meal Schedules:
   - Phase 6D does NOT invent a universal clinical split.
   - Schedules must be explicitly caller-supplied or clearly labeled as non-clinical engineering defaults.
3. Daily Feasibility vs Meal Feasibility:
   - Meal-level feasibility (J*=0) does not imply daily target achievement.
   - Both meal-level and day-level deviations are tracked transparently.
4. Condition Isolation:
   - GENERAL, PCOS, and MALE_HYPOGONADISM produce identical meal compositions,
     gram quantities, daily nutrient totals, and rankings.
5. Strict Fiber Semantics:
   - Preserves Phase 5 / Phase 6B fiber semantics (COMPLETE, PARTIAL, UNAVAILABLE).
   - Missing fiber is NEVER converted to zero.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional

from Meal.composition.schemas import (
    MealCombinationPolicy,
    MealFeasibilityClass,
    RecipeCoverageStatus,
    SingleMealPlan,
)
from Meal.engine.schemas import NutritionTargetProfile
from Meal.optimizer.schemas import (
    FiberCoverageStatus,
    NutrientDeviation,
    PortionConstraint,
    PortionOptimizationTarget,
)
from Meal.planner.schemas import MealRole


class DailyFeasibilityClass(str, Enum):
    """Categorization of full-day aggregate nutrition feasibility against Phase 5A targets."""
    FEASIBLE = "FEASIBLE"
    OPTIMAL_WITH_DAILY_DEVIATIONS = "OPTIMAL_WITH_DAILY_DEVIATIONS"
    INFEASIBLE = "INFEASIBLE"


class FullDayGenerationStatus(str, Enum):
    """Top-level status of the Phase 6D full-day meal generation engine."""
    FULL_DAILY_TARGETS_MET = "FULL_DAILY_TARGETS_MET"
    BEST_AVAILABLE_WITH_DAILY_DEVIATIONS = "BEST_AVAILABLE_WITH_DAILY_DEVIATIONS"
    PARTIAL_DAY_GENERATED = "PARTIAL_DAY_GENERATED"
    NO_VALID_DAY_PLAN = "NO_VALID_DAY_PLAN"
    INVALID_DAY_SCHEDULE = "INVALID_DAY_SCHEDULE"


class DailyReconciliationStatus(str, Enum):
    """Status of schedule allocation target sum comparison against Phase 5A daily target."""
    RECONCILED_EXACT = "RECONCILED_EXACT"
    RECONCILED_WITHIN_TOLERANCE = "RECONCILED_WITHIN_TOLERANCE"
    DAILY_ALLOCATION_TARGET_CONFLICT = "DAILY_ALLOCATION_TARGET_CONFLICT"


@dataclass(frozen=True)
class MealAllocation:
    """Explicit allocation of target nutrition and constraints for a single meal role.
    
    ENGINEERING & PROVENANCE NOTICE:
    Every meal allocation must explicitly declare target_source and target_scope
    to prevent unverified test allocations from being misrepresented as dietary standards.
    """
    role: MealRole
    target: PortionOptimizationTarget
    target_source: str = "CALLER_DEFINED"  # CALLER_DEFINED, USER_DEFINED, ENGINEERING_DEFAULT, FUTURE_ALLOCATION_POLICY
    target_scope: str = "MEAL_ALLOCATION"
    required_entity_ids: List[str] = field(default_factory=list)
    preferred_entity_ids: List[str] = field(default_factory=list)
    explicitly_excluded_ids: List[str] = field(default_factory=list)
    constraints: Optional[List[PortionConstraint]] = None
    policy: Optional[MealCombinationPolicy] = None

    def __post_init__(self) -> None:
        if not isinstance(self.role, MealRole):
            raise TypeError(f"role must be a MealRole enum, got {type(self.role)}")
        if not isinstance(self.target, PortionOptimizationTarget):
            raise TypeError(f"target must be a PortionOptimizationTarget, got {type(self.target)}")


@dataclass(frozen=True)
class DailyMealSchedule:
    """Explicit daily meal schedule defining the sequence and targets of meals in a day.
    
    CRITICAL DISCLAIMER:
    BioPulse does NOT assume a universal clinical split (such as 25%/35%/30%/10%).
    Schedules are caller-supplied or explicitly flagged as non-clinical engineering defaults.
    """
    allocations: List[MealAllocation]
    schedule_name: str = "Custom Schedule"
    schedule_source: str = "CALLER_DEFINED"
    is_engineering_default: bool = False
    notes: Optional[str] = None

    def __post_init__(self) -> None:
        if not self.allocations:
            raise ValueError("DailyMealSchedule must contain at least one MealAllocation.")
        # Check role uniqueness within a single day schedule
        roles = [alloc.role for alloc in self.allocations]
        if len(roles) != len(set(roles)):
            raise ValueError(f"Duplicate meal roles in DailyMealSchedule: {roles}")

    @property
    def roles(self) -> List[MealRole]:
        return [alloc.role for alloc in self.allocations]

    @property
    def meal_count(self) -> int:
        return len(self.allocations)

    def get_allocation(self, role: MealRole) -> Optional[MealAllocation]:
        for alloc in self.allocations:
            if alloc.role == role:
                return alloc
        return None


@dataclass(frozen=True)
class DailyAllocationReconciliation:
    """Detailed reconciliation comparing scheduled meal target sums against the Phase 5A target."""
    status: DailyReconciliationStatus
    scheduled_energy_target_sum: float
    daily_energy_target_kcal: float
    energy_difference_kcal: float
    energy_within_tolerance: bool
    
    scheduled_protein_min_sum: float
    scheduled_protein_max_sum: float
    daily_protein_min_g: float
    daily_protein_max_g: float
    protein_ranges_compatible: bool

    scheduled_carbohydrate_min_sum: float
    scheduled_carbohydrate_max_sum: float
    daily_carbohydrate_min_g: float
    daily_carbohydrate_max_g: float
    carbohydrate_ranges_compatible: bool

    scheduled_fat_min_sum: float
    scheduled_fat_max_sum: float
    daily_fat_min_g: float
    daily_fat_max_g: float
    fat_ranges_compatible: bool

    tolerance_kcal: float
    warnings: List[str] = field(default_factory=list)


@dataclass(frozen=True)
class DailyFiberResult:
    """Daily dietary fiber aggregation preserving Phase 5 missingness semantics."""
    known_fiber_total_g: Optional[float]
    fiber_coverage_status: FiberCoverageStatus
    missing_fiber_entity_ids: List[str]
    total_entities_evaluated: int
    entities_with_known_fiber: int
    daily_ai_reference_g: Optional[float] = None


@dataclass(frozen=True)
class FullDayMealPlan:
    """Complete, evaluated full-day meal plan coordinating individual SingleMealPlans.
    
    Strict Invariants:
    1. Unrounded floating-point summation across all optimized meal components.
    2. Fiber coverage status strictly preserves missingness (COMPLETE, PARTIAL, UNAVAILABLE).
    3. Day-level feasibility is independent of meal-level J*=0.
    4. Lexicographic ranking is strictly deterministic.
    """
    canonical_day_id: str
    plan_day_index: int
    date: Optional[str]
    meals: Dict[MealRole, SingleMealPlan]
    
    daily_energy_kcal: float
    daily_protein_g: float
    daily_carbohydrate_g: float
    daily_fat_g: float
    
    fiber_result: DailyFiberResult
    feasibility_class: DailyFeasibilityClass
    daily_primary_objective: float  # J_day (normalized daily deviation sum)
    daily_target_deviations: Dict[str, NutrientDeviation]
    all_daily_core_targets_within_range: bool
    
    recipe_instruction_coverage_status: RecipeCoverageStatus
    matched_preferred_entity_count: int
    total_valid_preferred_entity_count: int
    preference_coverage: float
    
    entity_occurrence_counts: Dict[str, int]
    equivalence_concept_occurrence_counts: Dict[str, int]
    dish_repetition_counts: Dict[str, int]
    
    warnings: List[str] = field(default_factory=list)
    trace: List[str] = field(default_factory=list)

    @property
    def meal_count(self) -> int:
        return len(self.meals)

    @property
    def meal_roles(self) -> List[MealRole]:
        return list(self.meals.keys())


@dataclass(frozen=True)
class FullDayPlanningPolicy:
    """Policy governing full-day orchestration, reconciliation tolerances, and partial-day rules.
    
    ENGINEERING NOTICE:
    These tolerances and limits are computational parameters, NOT clinical directives.
    They govern search space exploration and combinatorial bounds.
    """
    require_all_meals: bool = True
    energy_tolerance_kcal: float = 100.0
    allow_cross_meal_entity_repetition: bool = True
    maximum_meal_candidates_per_role: int = 3
    maximum_day_combinations_evaluated: int = 50
    maximum_alternative_day_plans: int = 3

    def __post_init__(self) -> None:
        if self.energy_tolerance_kcal < 0.0:
            raise ValueError(f"energy_tolerance_kcal must be >= 0, got {self.energy_tolerance_kcal}")
        if self.maximum_meal_candidates_per_role < 1:
            raise ValueError(
                f"maximum_meal_candidates_per_role must be >= 1, got {self.maximum_meal_candidates_per_role}"
            )
        if self.maximum_day_combinations_evaluated < 1:
            raise ValueError(
                f"maximum_day_combinations_evaluated must be >= 1, got {self.maximum_day_combinations_evaluated}"
            )
        if self.maximum_alternative_day_plans < 0:
            raise ValueError(
                f"maximum_alternative_day_plans must be >= 0, got {self.maximum_alternative_day_plans}"
            )

    @property
    def maximum_candidate_days_evaluated(self) -> int:
        """Backward-compatible alias for maximum_day_combinations_evaluated."""
        return self.maximum_day_combinations_evaluated


@dataclass(frozen=True)
class FullDayGenerationResult:
    """Top-level immutable result of the Phase 6D full-day meal planning engine."""
    status: FullDayGenerationStatus
    daily_target: NutritionTargetProfile
    meal_schedule: DailyMealSchedule
    reconciliation: DailyAllocationReconciliation
    meals_requested: int
    meals_generated: int
    meals_failed: List[MealRole]
    failed_meal_details: Dict[MealRole, str]
    best_day_plan: Optional[FullDayMealPlan]
    alternative_day_plans: List[FullDayMealPlan]
    
    # Day-search diagnostics
    meal_candidates_by_role: Dict[MealRole, int]
    total_possible_day_combinations: int
    day_combinations_evaluated: int
    day_search_truncated: bool
    day_search_exhaustive: bool
    
    warnings: List[str] = field(default_factory=list)
    trace: List[str] = field(default_factory=list)

    @property
    def search_exhaustive(self) -> bool:
        """Backward-compatible alias for day_search_exhaustive."""
        return self.day_search_exhaustive

    @property
    def is_successful(self) -> bool:
        return self.status in (
            FullDayGenerationStatus.FULL_DAILY_TARGETS_MET,
            FullDayGenerationStatus.BEST_AVAILABLE_WITH_DAILY_DEVIATIONS,
        )
