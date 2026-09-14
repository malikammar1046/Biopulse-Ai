"""Meal/optimizer - Deterministic Portion Optimization Engine (Phase 6B).

Provides deterministic mathematical linear programming for portion sizing of
Phase 6A optimization-eligible foods against explicit targets and constraints.
"""

from Meal.optimizer.orchestrator import optimize_portions
from Meal.optimizer.schemas import (
    FiberCoverageStatus,
    MealFiberResult,
    NutrientDeviation,
    NutrientTargetStatus,
    OptimizedPortion,
    PortionConstraint,
    PortionOptimizationResult,
    PortionOptimizationStatus,
    PortionOptimizationTarget,
    TargetScope,
)
from Meal.optimizer.solver import SolverSolution, solve_portion_lp

__all__ = [
    "optimize_portions",
    "solve_portion_lp",
    "SolverSolution",
    "PortionOptimizationStatus",
    "NutrientTargetStatus",
    "FiberCoverageStatus",
    "TargetScope",
    "PortionOptimizationTarget",
    "PortionConstraint",
    "NutrientDeviation",
    "MealFiberResult",
    "OptimizedPortion",
    "PortionOptimizationResult",
]
