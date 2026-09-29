"""Meal/tests/test_day_condition_isolation.py - Tests strict condition isolation across full-day planning.

Strict Invariants:
1. For identical daily neutral targets, meal allocations, candidate pools, constraints, and preferences:
   GENERAL, PCOS, and MALE_HYPOGONADISM must produce identical:
   - meal compositions
   - gram quantities
   - daily nutrient totals
   - ranking
2. Condition-specific evidence may alter explanation metadata only.
3. Condition numerical effect = 0.0.
"""

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
def base_user():
    return UserNutritionProfile(
        age=28,
        sex_for_reference_equation="female",
        height_cm=165.0,
        weight_kg=60.0,
        pal_category=PALCategory.INACTIVE,
        goal=Goal.MAINTAIN,
    )


@pytest.fixture
def universal_constraints():
    return [
        PortionConstraint(entity_id="PK_PORTION_001", minimum_grams=40.0, maximum_grams=120.0, preferred_grams=80.0),
        PortionConstraint(entity_id="PK_COMP_001", minimum_grams=50.0, maximum_grams=150.0, preferred_grams=100.0),
        PortionConstraint(entity_id="PK_COMP_015", minimum_grams=50.0, maximum_grams=200.0, preferred_grams=100.0),
        PortionConstraint(entity_id="PK_DISH_001", minimum_grams=50.0, maximum_grams=150.0, preferred_grams=100.0),
        PortionConstraint(entity_id="PK_DISH_009", minimum_grams=80.0, maximum_grams=200.0, preferred_grams=150.0),
        PortionConstraint(entity_id="PK_DISH_025", minimum_grams=80.0, maximum_grams=200.0, preferred_grams=150.0),
    ]


@pytest.fixture
def two_meal_schedule():
    alloc_b = MealAllocation(
        role=MealRole.BREAKFAST,
        target=PortionOptimizationTarget(
            target_energy_kcal=350.0,
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
    return DailyMealSchedule(
        allocations=[alloc_b, alloc_l],
        schedule_name="Condition Isolation Test Schedule",
    )


def test_condition_isolation_across_pathways(base_user, two_meal_schedule, universal_constraints):
    """GENERAL, PCOS, and MALE_HYPOGONADISM must produce identical numerical outputs."""
    neutral = build_nutrition_target_profile(base_user)

    results = {}
    pathways = [
        ConditionPathway.GENERAL,
        ConditionPathway.PCOS,
        ConditionPathway.MALE_HYPOGONADISM,
    ]

    for pathway in pathways:
        ctx = ConditionEvidenceContext(
            condition_pathway=pathway,
            evidence_context_status=EvidenceContextStatus.SCREENING_PATHWAY,
        )
        condition = build_condition_nutrition_profile(neutral, ctx)
        res = generate_full_day_plan(
            neutral_profile=neutral,
            condition_profile=condition,
            schedule=two_meal_schedule,
            default_constraints=universal_constraints,
        )
        assert res.is_successful
        assert res.best_day_plan is not None
        results[pathway] = res

    gen_plan = results[ConditionPathway.GENERAL].best_day_plan
    pcos_plan = results[ConditionPathway.PCOS].best_day_plan
    hypo_plan = results[ConditionPathway.MALE_HYPOGONADISM].best_day_plan

    # 1. Canonical Day IDs must be identical
    assert gen_plan.canonical_day_id == pcos_plan.canonical_day_id
    assert gen_plan.canonical_day_id == hypo_plan.canonical_day_id

    # 2. Daily macro nutrient totals must be bitwise identical
    assert abs(gen_plan.daily_energy_kcal - pcos_plan.daily_energy_kcal) < 1e-9
    assert abs(gen_plan.daily_energy_kcal - hypo_plan.daily_energy_kcal) < 1e-9
    assert abs(gen_plan.daily_protein_g - pcos_plan.daily_protein_g) < 1e-9
    assert abs(gen_plan.daily_protein_g - hypo_plan.daily_protein_g) < 1e-9
    assert abs(gen_plan.daily_carbohydrate_g - pcos_plan.daily_carbohydrate_g) < 1e-9
    assert abs(gen_plan.daily_carbohydrate_g - hypo_plan.daily_carbohydrate_g) < 1e-9
    assert abs(gen_plan.daily_fat_g - pcos_plan.daily_fat_g) < 1e-9
    assert abs(gen_plan.daily_fat_g - hypo_plan.daily_fat_g) < 1e-9

    # 3. Individual meal items and grams must be identical
    for role in [MealRole.BREAKFAST, MealRole.LUNCH]:
        m_gen = gen_plan.meals[role]
        m_pcos = pcos_plan.meals[role]
        m_hypo = hypo_plan.meals[role]

        assert [i.entity_id for i in m_gen.items] == [i.entity_id for i in m_pcos.items]
        assert [i.entity_id for i in m_gen.items] == [i.entity_id for i in m_hypo.items]

        for i_g, i_p, i_h in zip(m_gen.items, m_pcos.items, m_hypo.items):
            assert abs(i_g.optimized_grams - i_p.optimized_grams) < 1e-9
            assert abs(i_g.optimized_grams - i_h.optimized_grams) < 1e-9

    # 4. Objectives must be identical
    assert abs(gen_plan.daily_primary_objective - pcos_plan.daily_primary_objective) < 1e-9
    assert abs(gen_plan.daily_primary_objective - hypo_plan.daily_primary_objective) < 1e-9
