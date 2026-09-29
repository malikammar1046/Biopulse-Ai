"""
Phase 5A Test Suite — Safety Filter

Covers:
- Allergen PRESENT → excluded
- Allergen UNKNOWN → excluded (known-absent ≠ unknown policy)
- Allergen ABSENT (explicitly known) → not excluded
- Allergen POSSIBLE → excluded
- Dietary INCOMPATIBLE → excluded
- Dietary UNKNOWN → excluded (same policy)
- Dietary COMPATIBLE → not excluded
- Vegetarian/vegan/pescatarian dietary classes treated identically
- Multiple allergens: excluded if ANY is unsafe
"""

import pytest
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from Meal.engine.safety import (
    check_entity_allergen_safety,
    check_entity_dietary_safety,
    apply_safety_filter,
    summarize_safety_filter_results,
)


class TestAllergenSafety:
    def test_allergen_present_excludes(self):
        r = check_entity_allergen_safety(
            "E001", "Dal", {"gluten": "PRESENT"}, ["gluten"], allergen_assessment_complete=True
        )
        assert not r.eligible
        assert "gluten" in r.excluded_by_allergen

    def test_allergen_unknown_excludes(self):
        """UNKNOWN must exclude — known-absent ≠ unknown."""
        r = check_entity_allergen_safety(
            "E002", "Rice", {"gluten": "UNKNOWN"}, ["gluten"], allergen_assessment_complete=True
        )
        assert not r.eligible
        assert "gluten" in r.excluded_by_allergen

    def test_allergen_absent_does_not_exclude(self):
        """Explicitly ABSENT = safe."""
        r = check_entity_allergen_safety(
            "E003", "Chawal", {"gluten": "ABSENT"}, ["gluten"], allergen_assessment_complete=True
        )
        assert r.eligible
        assert r.excluded_by_allergen == []

    def test_allergen_possible_excludes(self):
        r = check_entity_allergen_safety(
            "E004", "Paratha", {"gluten": "POSSIBLE"}, ["gluten"], allergen_assessment_complete=True
        )
        assert not r.eligible

    def test_multiple_allergens_any_unsafe_excludes(self):
        r = check_entity_allergen_safety(
            "E005", "Chicken Karahi",
            {"gluten": "ABSENT", "dairy": "PRESENT"},
            ["gluten", "dairy"], allergen_assessment_complete=True
        )
        assert not r.eligible
        assert "dairy" in r.excluded_by_allergen

    def test_no_declared_allergens_always_eligible(self):
        r = check_entity_allergen_safety(
            "E006", "Biryani", {"gluten": "PRESENT"}, [], allergen_assessment_complete=True
        )
        assert r.eligible

    def test_missing_allergen_key_treated_as_unknown(self):
        """If allergen key absent from entity map → defaults to UNKNOWN → excluded."""
        r = check_entity_allergen_safety(
            "E007", "Halwa", {}, ["peanuts"], allergen_assessment_complete=True
        )
        assert not r.eligible  # UNKNOWN (missing key)

    def test_exclusion_reason_mentions_unknown_policy(self):
        r = check_entity_allergen_safety(
            "E008", "Samosa", {"gluten": "UNKNOWN"}, ["gluten"], allergen_assessment_complete=True
        )
        assert any("known-absent" in reason or "UNKNOWN" in reason for reason in r.exclusion_reasons)


class TestDietarySafety:
    def test_incompatible_excludes(self):
        r = check_entity_dietary_safety(
            "D001", "Beef Pulao", {"vegetarian": "INCOMPATIBLE"}, ["vegetarian"], dietary_assessment_complete=True
        )
        assert not r.eligible
        assert "vegetarian" in r.excluded_by_dietary

    def test_unknown_dietary_excludes(self):
        """UNKNOWN dietary status must exclude (same policy as allergens)."""
        r = check_entity_dietary_safety(
            "D002", "Nihari", {"vegetarian": "UNKNOWN"}, ["vegetarian"], dietary_assessment_complete=True
        )
        assert not r.eligible

    def test_unverified_dietary_excludes(self):
        r = check_entity_dietary_safety(
            "D003", "Mixed Dish", {"halal": "UNVERIFIED"}, ["halal"], dietary_assessment_complete=True
        )
        assert not r.eligible

    def test_compatible_does_not_exclude(self):
        r = check_entity_dietary_safety(
            "D004", "Moong Dal", {"vegetarian": "COMPATIBLE"}, ["vegetarian"], dietary_assessment_complete=True
        )
        assert r.eligible

    def test_verified_compatible_does_not_exclude(self):
        r = check_entity_dietary_safety(
            "D005", "Khichdi", {"vegan": "VERIFIED_COMPATIBLE"}, ["vegan"], dietary_assessment_complete=True
        )
        assert r.eligible

    def test_vegan_treatment(self):
        r = check_entity_dietary_safety(
            "D006", "Aloo Gosht", {"vegan": "INCOMPATIBLE"}, ["vegan"], dietary_assessment_complete=True
        )
        assert not r.eligible

    def test_pescatarian_treatment(self):
        r = check_entity_dietary_safety(
            "D007", "Machli Curry", {"pescatarian": "COMPATIBLE"}, ["pescatarian"], dietary_assessment_complete=True
        )
        assert r.eligible

    def test_no_dietary_classes_declared_always_eligible(self):
        r = check_entity_dietary_safety(
            "D008", "Nihari", {"vegetarian": "INCOMPATIBLE"}, [], dietary_assessment_complete=True
        )
        assert r.eligible

    def test_missing_dietary_key_treated_as_unknown(self):
        r = check_entity_dietary_safety(
            "D009", "Mystery Dish", {}, ["halal"], dietary_assessment_complete=True
        )
        assert not r.eligible  # missing key → UNKNOWN


class TestApplySafetyFilter:
    @pytest.fixture
    def sample_entities(self):
        return [
            {
                "allergen_assessment_complete": True, "dietary_assessment_complete": True,
                "entity_id": "F001", "entity_name": "Dal Chawal",
                "allergen_map": {"gluten": "ABSENT", "dairy": "ABSENT"},
                "dietary_map": {"vegetarian": "COMPATIBLE"},
            },
            {
                "allergen_assessment_complete": True, "dietary_assessment_complete": True,
                "entity_id": "F002", "entity_name": "Roti",
                "allergen_map": {"gluten": "PRESENT"},
                "dietary_map": {"vegetarian": "COMPATIBLE"},
            },
            {
                "allergen_assessment_complete": True, "dietary_assessment_complete": True,
                "entity_id": "F003", "entity_name": "Aloo Gosht",
                "allergen_map": {"gluten": "ABSENT", "dairy": "ABSENT"},
                "dietary_map": {"vegetarian": "INCOMPATIBLE"},
            },
        ]

    def test_gluten_allergy_excludes_roti(self, sample_entities):
        results = apply_safety_filter(sample_entities, user_allergens=["gluten"], user_dietary_classes=[])
        assert results["F001"].eligible
        assert not results["F002"].eligible
        assert results["F003"].eligible

    def test_vegetarian_excludes_gosht(self, sample_entities):
        results = apply_safety_filter(sample_entities, user_allergens=[], user_dietary_classes=["vegetarian"])
        assert results["F001"].eligible
        assert results["F002"].eligible
        assert not results["F003"].eligible

    def test_both_filters_applied_simultaneously(self, sample_entities):
        results = apply_safety_filter(sample_entities, user_allergens=["gluten"], user_dietary_classes=["vegetarian"])
        assert results["F001"].eligible
        assert not results["F002"].eligible   # gluten
        assert not results["F003"].eligible   # vegetarian

    def test_summary_counts(self, sample_entities):
        results = apply_safety_filter(sample_entities, user_allergens=["gluten"], user_dietary_classes=["vegetarian"])
        summary = summarize_safety_filter_results(results)
        assert summary["total_entities"] == 3
        assert summary["eligible"] == 1
        assert summary["excluded_total"] == 2
