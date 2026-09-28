"""
Phase 5A Test Suite — Nutrient Coverage Audit & Joint Macro Eligibility

Covers:
- core_macro_complete=True iff all four macros (energy, protein, carb, fat) present
- Fiber absence does not break core_macro_complete
- core_macro_optimization_eligible = True only when ALL safe entities are complete
- Entities not in safe set not counted
- None/NaN values correctly treated as absent
"""

import pytest
import math
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from Meal.engine.nutrient_coverage import (
    audit_entity_coverage,
    audit_coverage_set,
    compute_joint_macro_eligibility,
    coverage_summary,
)


def _entity(eid, energy=2000.0, protein=50.0, carb=250.0, fat=70.0, fiber=25.0):
    return {
        "entity_id": eid,
        "entity_name": f"Entity {eid}",
        "energy_kcal": energy,
        "protein_g": protein,
        "carbohydrate_g": carb,
        "fat_g": fat,
        "fiber_g": fiber,
    }


class TestEntityCoverage:
    def test_complete_entity_is_complete(self):
        e = _entity("E001")
        r = audit_entity_coverage(e)
        assert r.core_macro_complete is True
        assert r.missing_macros == []

    def test_missing_energy_is_incomplete(self):
        e = _entity("E002", energy=None)
        r = audit_entity_coverage(e)
        assert r.core_macro_complete is False
        assert "energy_kcal" in r.missing_macros

    def test_missing_protein_is_incomplete(self):
        e = _entity("E003", protein=None)
        r = audit_entity_coverage(e)
        assert not r.core_macro_complete
        assert "protein_g" in r.missing_macros

    def test_missing_carb_is_incomplete(self):
        e = _entity("E004", carb=None)
        r = audit_entity_coverage(e)
        assert not r.core_macro_complete
        assert "carbohydrate_g" in r.missing_macros

    def test_missing_fat_is_incomplete(self):
        e = _entity("E005", fat=None)
        r = audit_entity_coverage(e)
        assert not r.core_macro_complete
        assert "fat_g" in r.missing_macros

    def test_missing_fiber_does_not_break_core_complete(self):
        e = _entity("E006", fiber=None)
        r = audit_entity_coverage(e)
        assert r.core_macro_complete is True  # fiber not a core macro
        assert r.has_fiber_g is False

    def test_nan_treated_as_absent(self):
        e = _entity("E007", protein=float("nan"))
        r = audit_entity_coverage(e)
        assert not r.core_macro_complete
        assert "protein_g" in r.missing_macros

    def test_zero_is_valid_value(self):
        """Explicit 0 is a legitimate measurement, not absent."""
        e = _entity("E008", fat=0.0)
        r = audit_entity_coverage(e)
        assert r.core_macro_complete is True

    def test_has_fiber_g_true_when_present(self):
        e = _entity("E009", fiber=28.0)
        r = audit_entity_coverage(e)
        assert r.has_fiber_g is True

    def test_has_fiber_g_false_when_missing(self):
        e = _entity("E010", fiber=None)
        r = audit_entity_coverage(e)
        assert r.has_fiber_g is False


class TestCoverageSet:
    def test_audit_coverage_set_keys(self):
        entities = [_entity("E001"), _entity("E002", protein=None)]
        results = audit_coverage_set(entities)
        assert "E001" in results
        assert "E002" in results
        assert results["E001"].core_macro_complete is True
        assert results["E002"].core_macro_complete is False

    def test_coverage_summary_counts(self):
        entities = [
            _entity("A"), _entity("B"), _entity("C", fat=None), _entity("D", carb=None)
        ]
        results = audit_coverage_set(entities)
        summary = coverage_summary(results)
        assert summary["total_entities"] == 4
        assert summary["core_macro_complete"] == 2
        assert summary["core_macro_incomplete"] == 2


class TestJointMacroEligibility:
    def test_all_complete_safe_entities_eligible(self):
        entities = [_entity("E001"), _entity("E002"), _entity("E003")]
        results = audit_coverage_set(entities)
        safe_ids = {"E001", "E002", "E003"}
        eligible, n_complete, n_incomplete, incomplete_ids = compute_joint_macro_eligibility(
            safe_ids, results
        )
        assert eligible is True
        assert n_complete == 3
        assert n_incomplete == 0
        assert incomplete_ids == []

    def test_one_incomplete_safe_entity_makes_ineligible(self):
        entities = [_entity("E001"), _entity("E002", fat=None)]
        results = audit_coverage_set(entities)
        safe_ids = {"E001", "E002"}
        eligible, _, n_incomplete, incomplete_ids = compute_joint_macro_eligibility(
            safe_ids, results
        )
        assert eligible is False
        assert n_incomplete == 1
        assert "E002" in incomplete_ids

    def test_incomplete_entity_outside_safe_set_ignored(self):
        """E002 is incomplete but not in safe set — should not affect eligibility."""
        entities = [_entity("E001"), _entity("E002", fat=None)]
        results = audit_coverage_set(entities)
        safe_ids = {"E001"}  # only E001 is in safe set
        eligible, n_complete, n_incomplete, _ = compute_joint_macro_eligibility(
            safe_ids, results
        )
        assert eligible is True
        assert n_complete == 1
        assert n_incomplete == 0

    def test_empty_safe_set_is_not_eligible(self):
        results = {}
        eligible, n_complete, n_incomplete, _ = compute_joint_macro_eligibility(set(), results)
        assert eligible is False

    def test_missing_entity_in_results_treated_as_incomplete(self):
        """If an entity_id is in safe set but not in results dict, treat as incomplete."""
        results = {}
        safe_ids = {"PHANTOM_001"}
        eligible, _, n_incomplete, ids = compute_joint_macro_eligibility(safe_ids, results)
        assert eligible is False
        assert n_incomplete == 1
        assert "PHANTOM_001" in ids


class TestCoverageSummary:
    def test_missing_field_counts(self):
        entities = [
            _entity("A", protein=None),
            _entity("B", protein=None, fat=None),
            _entity("C"),
        ]
        results = audit_coverage_set(entities)
        summary = coverage_summary(results)
        assert summary["missing_field_counts"].get("protein_g", 0) == 2
        assert summary["missing_field_counts"].get("fat_g", 0) == 1

    def test_entities_with_fiber_count(self):
        entities = [_entity("A", fiber=25.0), _entity("B", fiber=None), _entity("C", fiber=30.0)]
        results = audit_coverage_set(entities)
        summary = coverage_summary(results)
        assert summary["entities_with_fiber_g"] == 2

    def test_incomplete_entity_ids_in_summary(self):
        entities = [_entity("A", protein=None), _entity("B")]
        results = audit_coverage_set(entities)
        summary = coverage_summary(results)
        assert "incomplete_entity_ids" in summary
        assert summary["incomplete_entity_ids"] == ["A"]


class TestMasterCatalogCoverage:
    def test_master_catalog_audit_counts(self):
        from Meal.engine.nutrient_coverage import audit_master_catalog

        results, summary = audit_master_catalog()
        assert summary["total_entities"] == 71
        assert summary["core_macro_optimization_eligible"] == 63
        assert summary["core_macro_optimization_ineligible"] == 8

        expected_incomplete_ids = {
            "PK_COMP_005",
            "PK_COMP_016",
            "PK_COMP_017",
            "PK_COMP_018",
            "PK_COMP_019",
            "PK_COMP_020",
            "PK_COMP_026",
            "PK_COMP_029",
        }
        assert set(summary["incomplete_entity_ids"]) == expected_incomplete_ids

        # Verify per-entity flag directly on each EntityCoverageResult
        for eid, r in results.items():
            assert hasattr(r, "core_macro_optimization_eligible")
            if eid in expected_incomplete_ids:
                assert r.core_macro_optimization_eligible is False
                assert len(r.missing_macros) > 0
            else:
                assert r.core_macro_optimization_eligible is True
                assert len(r.missing_macros) == 0

    def test_never_substitute_missing_macros_with_zero(self):
        """Verify that an entity with missing macros has missing_macros recorded, never zeros."""
        from Meal.engine.nutrient_coverage import audit_entity_coverage
        e = {"entity_id": "TEST_001", "entity_name": "Test Missing", "energy_kcal": 200.0}
        r = audit_entity_coverage(e)
        assert r.core_macro_optimization_eligible is False
        assert set(r.missing_macros) == {"protein_g", "carbohydrate_g", "fat_g"}

