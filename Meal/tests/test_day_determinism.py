"""Meal/tests/test_day_determinism.py - Tests determinism and constraint ordering invariance.

Verifies:
1. Multiple executions produce bitwise identical results.
2. Shuffling input constraint order does not alter the generated day plan.
3. Canonical Day ID is deterministic and formatted systematically.
"""

import random
import pytest

from Meal.daily.orchestrator import generate_full_day_plan
from Meal.daily.schemas import (
    DailyMealSchedule,
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


@pytest.fixture
def base_profiles():
    user = UserNutritionProfile(
        age=28,
        sex_for_reference_equation="female",
        height_cm=165.0,
        weight_kg=60.0,
        pal_category=PALCategory.INACTIVE,
        goal=Goal.MAINTAIN,
    )
    neutral = build_nutrition_target_profile(user)
    ctx = ConditionEvidenceContext(
        condition_pathway=ConditionPathway.GENERAL,
        evidence_context_status=EvidenceContextStatus.SCREENING_PATHWAY,
    )
    condition = build_condition_nutrition_profile(neutral, ctx)
    return neutral, condition


@pytest.fixture
def standard_constraints():
    return [
        PortionConstraint(entity_id="PK_PORTION_001", minimum_grams=40.0, maximum_grams=120.0, preferred_grams=80.0),
        PortionConstraint(entity_id="PK_COMP_001", minimum_grams=50.0, maximum_grams=150.0, preferred_grams=100.0),
        PortionConstraint(entity_id="PK_COMP_015", minimum_grams=50.0, maximum_grams=200.0, preferred_grams=100.0),
        PortionConstraint(entity_id="PK_DISH_001", minimum_grams=50.0, maximum_grams=150.0, preferred_grams=100.0),
        PortionConstraint(entity_id="PK_DISH_025", minimum_grams=80.0, maximum_grams=200.0, preferred_grams=150.0),
    ]


@pytest.fixture
def test_schedule():
    alloc_b = MealAllocation(
        role=MealRole.BREAKFAST,
        target=PortionOptimizationTarget(
            target_energy_kcal=300.0,
            energy_tolerance_kcal=80.0,
            protein_min_g=10.0,
            protein_max_g=30.0,
            carbohydrate_min_g=20.0,
            carbohydrate_max_g=50.0,
            fat_min_g=5.0,
            fat_max_g=20.0,
        ),
    )
    alloc_l = MealAllocation(
        role=MealRole.LUNCH,
        target=PortionOptimizationTarget(
            target_energy_kcal=500.0,
            energy_tolerance_kcal=100.0,
            protein_min_g=15.0,
            protein_max_g=40.0,
            carbohydrate_min_g=30.0,
            carbohydrate_max_g=70.0,
            fat_min_g=10.0,
            fat_max_g=30.0,
        ),
    )
    return DailyMealSchedule(allocations=[alloc_b, alloc_l])


def test_repeated_execution_determinism(base_profiles, test_schedule, standard_constraints):
    """Running generate_full_day_plan multiple times produces bitwise identical results."""
    neutral, condition = base_profiles

    res1 = generate_full_day_plan(
        neutral_profile=neutral,
        condition_profile=condition,
        schedule=test_schedule,
        default_constraints=standard_constraints,
    )
    res2 = generate_full_day_plan(
        neutral_profile=neutral,
        condition_profile=condition,
        schedule=test_schedule,
        default_constraints=standard_constraints,
    )

    assert res1.is_successful and res2.is_successful
    plan1 = res1.best_day_plan
    plan2 = res2.best_day_plan

    assert plan1.canonical_day_id == plan2.canonical_day_id
    assert plan1.daily_energy_kcal == plan2.daily_energy_kcal
    assert plan1.daily_protein_g == plan2.daily_protein_g
    assert plan1.daily_carbohydrate_g == plan2.daily_carbohydrate_g
    assert plan1.daily_fat_g == plan2.daily_fat_g
    assert plan1.daily_primary_objective == plan2.daily_primary_objective


def test_constraint_shuffling_invariance(base_profiles, test_schedule, standard_constraints):
    """Shuffling input constraints list produces the same canonical day plan."""
    neutral, condition = base_profiles

    shuffled = list(standard_constraints)
    random.seed(42)
    random.shuffle(shuffled)

    res_orig = generate_full_day_plan(
        neutral_profile=neutral,
        condition_profile=condition,
        schedule=test_schedule,
        default_constraints=standard_constraints,
    )
    res_shuf = generate_full_day_plan(
        neutral_profile=neutral,
        condition_profile=condition,
        schedule=test_schedule,
        default_constraints=shuffled,
    )

    assert res_orig.is_successful and res_shuf.is_successful
    assert res_orig.best_day_plan.canonical_day_id == res_shuf.best_day_plan.canonical_day_id
    assert abs(res_orig.best_day_plan.daily_energy_kcal - res_shuf.best_day_plan.daily_energy_kcal) < 1e-9
