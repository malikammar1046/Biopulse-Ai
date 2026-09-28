"""Meal/tests/test_day_safety.py - Tests strict safety exclusion inheritance across all scheduled meals.

Strict Invariants:
1. Allergen filtering: Allergens specified at base context exclude all offending entities from EVERY meal.
2. Dietary class: Vegetarian restrictions exclude non-vegetarian dishes from all meals.
3. User exclusions: Requested exclusions and dislikes are strictly inherited.
4. Metric check: Phase 6A excluded foods admitted = 0.
"""

import pytest

from Meal.daily.orchestrator import generate_full_day_plan
from Meal.daily.schemas import (
    DailyMealSchedule,
    FullDayPlanningPolicy,
    MealAllocation,
)
from Meal.engine.orchestrator import build_nutrition_target_profile
from Meal.engine.schemas import Allergen, DietaryClass, Goal, PALCategory, UserNutritionProfile
from Meal.evidence.orchestrator import build_condition_nutrition_profile
from Meal.evidence.schemas import (
    ConditionEvidenceContext,
    ConditionPathway,
    EvidenceContextStatus,
)
from Meal.optimizer.schemas import PortionConstraint, PortionOptimizationTarget
from Meal.planner.schemas import CandidateSelectionContext, MealRole


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
        PortionConstraint(entity_id="PK_COMP_001", minimum_grams=50.0, maximum_grams=150.0, preferred_grams=100.0),  # Dahi (Dairy)
        PortionConstraint(entity_id="PK_COMP_015", minimum_grams=50.0, maximum_grams=200.0, preferred_grams=100.0),
        PortionConstraint(entity_id="PK_DISH_001", minimum_grams=50.0, maximum_grams=150.0, preferred_grams=100.0),
        PortionConstraint(entity_id="PK_DISH_009", minimum_grams=80.0, maximum_grams=200.0, preferred_grams=150.0),  # Chicken Karahi (Meat)
        PortionConstraint(entity_id="PK_DISH_025", minimum_grams=80.0, maximum_grams=200.0, preferred_grams=150.0),  # Daal Chana (Vegetarian)
        PortionConstraint(entity_id="PK_COMP_010", minimum_grams=20.0, maximum_grams=100.0, preferred_grams=40.0),
    ]


def test_dairy_allergy_excludes_dairy_from_all_meals(base_profiles, standard_constraints):
    """When Dairy allergy is declared, Dahi (PK_COMP_001) must not appear in any meal of the day."""
    neutral, condition = base_profiles

    # Both breakfast and snack could otherwise choose Dahi (PK_COMP_001)
    alloc_b = MealAllocation(
        role=MealRole.BREAKFAST,
        target=PortionOptimizationTarget(
            target_energy_kcal=250.0,
            energy_tolerance_kcal=100.0,
            protein_min_g=5.0,
            protein_max_g=25.0,
            carbohydrate_min_g=10.0,
            carbohydrate_max_g=50.0,
            fat_min_g=2.0,
            fat_max_g=20.0,
        ),
    )
    alloc_s = MealAllocation(
        role=MealRole.SNACK,
        target=PortionOptimizationTarget(
            target_energy_kcal=150.0,
            energy_tolerance_kcal=80.0,
            protein_min_g=2.0,
            protein_max_g=15.0,
            carbohydrate_min_g=5.0,
            carbohydrate_max_g=35.0,
            fat_min_g=1.0,
            fat_max_g=15.0,
        ),
    )
    schedule = DailyMealSchedule(allocations=[alloc_b, alloc_s])

    base_ctx = CandidateSelectionContext(
        meal_role=MealRole.BREAKFAST,  # dummy role for base container
        allergies=[Allergen.DAIRY.value],
    )

    result = generate_full_day_plan(
        neutral_profile=neutral,
        condition_profile=condition,
        schedule=schedule,
        base_context=base_ctx,
        default_constraints=standard_constraints,
    )

    assert result.is_successful
    assert result.best_day_plan is not None

    # Check every meal item across the entire day
    for role, meal in result.best_day_plan.meals.items():
        for item in meal.items:
            assert item.entity_id != "PK_COMP_001", f"Dairy item {item.entity_id} found in meal {role.value}!"


def test_meat_dish_exclusion_from_all_meals(base_profiles, standard_constraints):
    """When a meat dish (PK_DISH_009) is excluded in base_context, it must never enter any meal."""
    neutral, condition = base_profiles

    alloc_l = MealAllocation(
        role=MealRole.LUNCH,
        target=PortionOptimizationTarget(
            target_energy_kcal=450.0,
            energy_tolerance_kcal=100.0,
            protein_min_g=15.0,
            protein_max_g=40.0,
            carbohydrate_min_g=30.0,
            carbohydrate_max_g=70.0,
            fat_min_g=10.0,
            fat_max_g=30.0,
        ),
        preferred_entity_ids=["PK_DISH_025"],
    )
    alloc_d = MealAllocation(
        role=MealRole.DINNER,
        target=PortionOptimizationTarget(
            target_energy_kcal=450.0,
            energy_tolerance_kcal=100.0,
            protein_min_g=15.0,
            protein_max_g=40.0,
            carbohydrate_min_g=30.0,
            carbohydrate_max_g=70.0,
            fat_min_g=10.0,
            fat_max_g=30.0,
        ),
        preferred_entity_ids=["PK_DISH_025"],
    )
    schedule = DailyMealSchedule(allocations=[alloc_l, alloc_d])

    base_ctx = CandidateSelectionContext(
        meal_role=MealRole.LUNCH,
        requested_exclusions=["PK_DISH_009"],  # Exclude Chicken Karahi
    )

    result = generate_full_day_plan(
        neutral_profile=neutral,
        condition_profile=condition,
        schedule=schedule,
        base_context=base_ctx,
        default_constraints=standard_constraints,
    )

    assert result.is_successful
    assert result.best_day_plan is not None

    for role, meal in result.best_day_plan.meals.items():
        for item in meal.items:
            assert item.entity_id != "PK_DISH_009", f"Excluded meat item {item.entity_id} found in meal {role.value}!"


def test_day_level_exclusion_list(base_profiles, standard_constraints):
    """When an entity is excluded via day_excluded_ids, it is absent from all meals."""
    neutral, condition = base_profiles

    alloc_b = MealAllocation(
        role=MealRole.BREAKFAST,
        target=PortionOptimizationTarget(
            target_energy_kcal=250.0,
            energy_tolerance_kcal=100.0,
            protein_min_g=5.0,
            protein_max_g=25.0,
            carbohydrate_min_g=10.0,
            carbohydrate_max_g=50.0,
            fat_min_g=2.0,
            fat_max_g=20.0,
        ),
    )
    schedule = DailyMealSchedule(allocations=[alloc_b])

    result = generate_full_day_plan(
        neutral_profile=neutral,
        condition_profile=condition,
        schedule=schedule,
        day_excluded_ids=["PK_PORTION_001"],
        default_constraints=standard_constraints,
    )

    assert result.is_successful
    assert result.best_day_plan is not None
    for item in result.best_day_plan.meals[MealRole.BREAKFAST].items:
        assert item.entity_id != "PK_PORTION_001"
