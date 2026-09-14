"""Meal/tests/test_candidate_catalog.py - Unit tests for 71-entity planner catalog loading.

Verifies exact entity count (71), role distribution (19/47/47/25/10/6/5/2),
standard portion references, recipe instruction availability, and macro completeness.
"""

import pytest

from Meal.planner.catalog import PlannerCatalogEntity, load_master_planner_catalog
from Meal.planner.eligibility import check_core_macro_completeness


class TestCatalogLoadingAndIntegrity:
    """Verifies invariant adherence of the 71-entity catalog."""

    def test_catalog_loads_exactly_71_entities(self):
        catalog = load_master_planner_catalog()
        assert len(catalog) == 71
        assert len(set(catalog.keys())) == 71

    def test_catalog_role_distribution_regression(self):
        """Proves exact locked Phase 4 role counts across the catalog:
        Breakfast = 19, Lunch = 47, Dinner = 47, Snack = 25,
        Side = 10, Staple = 6, Dessert = 5, Beverage = 2.
        """
        catalog = load_master_planner_catalog()
        role_counts = {
            "breakfast": 0,
            "lunch": 0,
            "dinner": 0,
            "snack": 0,
            "side": 0,
            "staple": 0,
            "dessert": 0,
            "beverage": 0,
        }

        for entity in catalog.values():
            for r in entity.meal_roles:
                if r in role_counts:
                    role_counts[r] += 1

        assert role_counts["breakfast"] == 19
        assert role_counts["lunch"] == 47
        assert role_counts["dinner"] == 47
        assert role_counts["snack"] == 25
        assert role_counts["side"] == 10
        assert role_counts["staple"] == 6
        assert role_counts["dessert"] == 5
        assert role_counts["beverage"] == 2

    def test_standard_portions_metadata_preserved(self):
        """Verifies PK_PORTION_001 (Chapati) and PK_PORTION_002 (Boiled Rice) reference data."""
        catalog = load_master_planner_catalog()

        chapati = catalog.get("PK_PORTION_001")
        assert chapati is not None
        assert chapati.entity_type == "STANDARD_PORTION"
        assert chapati.portion_weight_g == 80.0
        assert chapati.nutrition_per_portion == 214.2
        assert chapati.derived_fct_energy_kcal == 214.2
        assert chapati.derived_fct_carb_g == 45.12
        assert chapati.derived_fct_protein_g == 6.0
        assert chapati.derived_fct_fat_g == 0.72
        assert "staple" in chapati.meal_roles
        assert "breakfast" in chapati.meal_roles

        rice = catalog.get("PK_PORTION_002")
        assert rice is not None
        assert rice.entity_type == "STANDARD_PORTION"
        assert rice.portion_weight_g == 75.0
        assert rice.nutrition_per_portion == 108.0
        assert rice.derived_fct_energy_kcal == 108.0
        assert rice.derived_fct_carb_g == 23.85
        assert rice.derived_fct_protein_g == 2.01
        assert rice.derived_fct_fat_g == 0.27
        assert "staple" in rice.meal_roles
        assert "lunch" in rice.meal_roles

    def test_recipe_instruction_availability(self):
        """Verifies exactly 17 composite dishes have recipe instructions eligible."""
        catalog = load_master_planner_catalog()
        recipe_eligible = [e for e in catalog.values() if e.recipe_instruction_eligible]
        assert len(recipe_eligible) == 17
        for e in recipe_eligible:
            assert e.planner_entity_id.startswith("PK_DISH_")
            assert e.planner_readiness == "READY_RECIPE_AND_NUTRITION"

    def test_core_macro_completeness_distribution(self):
        """Verifies exactly 63 entities are core macro complete and 8 are incomplete."""
        catalog = load_master_planner_catalog()
        complete_count = 0
        incomplete_eids = set()

        for eid, entity in catalog.items():
            complete, missing = check_core_macro_completeness(entity)
            if complete:
                complete_count += 1
            else:
                incomplete_eids.add(eid)

        assert complete_count == 63
        assert len(incomplete_eids) == 8
        assert incomplete_eids == {
            "PK_COMP_005",
            "PK_COMP_016",
            "PK_COMP_017",
            "PK_COMP_018",
            "PK_COMP_019",
            "PK_COMP_020",
            "PK_COMP_026",
            "PK_COMP_029",
        }
