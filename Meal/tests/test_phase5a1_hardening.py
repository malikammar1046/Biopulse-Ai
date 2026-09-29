"""Regression contracts for Phase 5A.1. No condition-specific nutrition."""
import csv
import json
from dataclasses import replace
from pathlib import Path

import pytest

from Meal.engine import (
    UserNutritionProfile, PALCategory, SafetyStatus, SafetyOutcome,
    TargetResolutionStatus, NutrientClassification,
    build_nutrition_target_profile, calculate_energy_requirement,
    calculate_nutrient_targets, apply_safety_filter, audit_master_catalog,
    audit_entity_coverage, nutrient_classifications,
)
from Meal.engine.safety import check_entity_allergen_safety, check_entity_dietary_safety

DATA = Path(__file__).parents[1] / "data" / "processed"


def profile(**kwargs):
    values = dict(age=30, sex_for_reference_equation="male", height_cm=175,
                  weight_kg=75, pal_category=PALCategory.LOW_ACTIVE)
    values.update(kwargs)
    return UserNutritionProfile(**values)


def synthetic(energy=300, weight=75):
    p = profile(weight_kg=weight)
    return calculate_nutrient_targets(p, replace(calculate_energy_requirement(p), eer_kcal=energy))


class TestCarbohydrateConflict:
    def test_300_kcal_preserves_references_and_unresolved_target(self):
        t = synthetic()
        assert [t[k] for k in ("carbohydrate_rda_g", "carbohydrate_amdr_min_g", "carbohydrate_amdr_max_g")] == [130, 33.8, 48.8]
        assert t["carbohydrate_conflict"] == "TARGET_REFERENCE_CONFLICT"
        assert t["carbohydrate_target_min_g"] is t["carbohydrate_target_max_g"] is None
        assert t["target_resolution_status"] == TargetResolutionStatus.REFERENCE_CONFLICT
        assert t["nutrition_targets_optimization_ready"] is False

    def test_exact_extreme_profile(self):
        t = build_nutrition_target_profile(profile(age=100, sex_for_reference_equation="female",
                                                 height_cm=100, weight_kg=20, pal_category=PALCategory.INACTIVE))
        assert t.eer_kcal == t.energy_target_kcal == 690.1
        assert (t.carbohydrate_rda_g, t.carbohydrate_amdr_min_g, t.carbohydrate_amdr_max_g) == (130, 77.6, 112.1)
        assert t.carbohydrate_target_min_g is t.carbohydrate_target_max_g is None
        assert t.carbohydrate_conflict == "TARGET_REFERENCE_CONFLICT"
        assert t.target_resolution_status == TargetResolutionStatus.REFERENCE_CONFLICT
        assert not t.nutrition_targets_optimization_ready
        assert not t.automated_personalized_planning_allowed
        assert t.safety_status == SafetyStatus.SAFE_FOR_AUTOMATED_PLANNING
        assert not t.safety_flags  # A reference conflict is not a diagnosis.
        assert t.protein_conflict is None
        assert (t.protein_rda_floor_g, t.protein_amdr_min_g, t.protein_amdr_max_g) == (16, 17.3, 60.4)

    def test_touching_references_are_resolved(self):
        t = synthetic(800)
        assert t["carbohydrate_target_min_g"] == t["carbohydrate_target_max_g"] == 130
        assert t["carbohydrate_conflict"] is None
        assert t["nutrition_targets_optimization_ready"] is True


class TestProteinConflict:
    def test_300_kcal_preserves_references_and_unresolved_target(self):
        t = synthetic()
        assert [t[k] for k in ("protein_rda_floor_g", "protein_amdr_min_g", "protein_amdr_max_g")] == [60, 7.5, 26.2]
        assert t["protein_conflict"] == "TARGET_REFERENCE_CONFLICT"
        assert t["protein_target_min_g"] is t["protein_target_max_g"] is None
        assert not t["nutrition_targets_optimization_ready"]

    def test_protein_only_conflict_blocks_optimization(self, monkeypatch):
        p = profile(weight_kg=200)
        eer = replace(calculate_energy_requirement(p), eer_kcal=1000)
        monkeypatch.setattr("Meal.engine.orchestrator.calculate_energy_requirement", lambda _: eer)
        t = build_nutrition_target_profile(p)
        assert t.carbohydrate_conflict is None
        assert t.protein_conflict == "TARGET_REFERENCE_CONFLICT"
        assert t.protein_target_min_g is t.protein_target_max_g is None
        assert (t.protein_rda_floor_g, t.protein_amdr_min_g, t.protein_amdr_max_g) == (160, 25, 87.5)
        assert t.target_resolution_status == TargetResolutionStatus.REFERENCE_CONFLICT
        assert not t.nutrition_targets_optimization_ready
        assert not t.automated_personalized_planning_allowed

    def test_both_conflicts_survive_orchestration(self, monkeypatch):
        p = profile()
        eer = replace(calculate_energy_requirement(p), eer_kcal=300)
        monkeypatch.setattr("Meal.engine.orchestrator.calculate_energy_requirement", lambda _: eer)
        t = build_nutrition_target_profile(p)
        assert t.carbohydrate_conflict == t.protein_conflict == "TARGET_REFERENCE_CONFLICT"
        assert t.carbohydrate_target_min_g is t.carbohydrate_target_max_g is None
        assert t.protein_target_min_g is t.protein_target_max_g is None
        assert not t.nutrition_targets_optimization_ready
        assert not t.automated_personalized_planning_allowed


class TestTargetRangeContract:
    @pytest.mark.parametrize("energy", [1, 300, 690.1, 800, 1000, 2000, 4000])
    def test_no_reversed_ranges(self, energy):
        t = synthetic(energy)
        for nutrient in ("carbohydrate", "protein"):
            lo, hi = (t[f"{nutrient}_target_{edge}_g"] for edge in ("min", "max"))
            assert (lo is None and hi is None) or (lo is not None and hi is not None and lo <= hi)
        assert t["fat_amdr_min_g"] <= t["fat_amdr_max_g"]

    @pytest.mark.parametrize("energy", [0, -1, float("nan"), float("inf"), -float("inf")])
    def test_invalid_energy_cannot_emit_ranges(self, energy):
        with pytest.raises(ValueError, match="finite and positive"):
            synthetic(energy)

    def test_all_golden_profiles_resolve(self):
        cases = json.loads((Path(__file__).parent / "fixtures/nasem_2023_eer_golden.json").read_text())
        assert len(cases) == 24
        for case in cases:
            p = profile(age=case["age_years_decimal"], sex_for_reference_equation=case["sex_for_reference_equation"],
                        height_cm=case["height_cm"], weight_kg=case["weight_kg"], pal_category=PALCategory(case["pal_category"]))
            t = build_nutrition_target_profile(p)
            assert abs(t.eer_kcal - case["expected_eer_kcal"]) < 0.5
            assert t.target_resolution_status == TargetResolutionStatus.RESOLVED
            assert t.nutrition_targets_optimization_ready
            assert t.carbohydrate_target_min_g <= t.carbohydrate_target_max_g
            assert t.protein_target_min_g <= t.protein_target_max_g

    def test_medical_restriction_is_independent_of_target_resolution(self):
        t = build_nutrition_target_profile(profile(relevant_medical_nutrition_flags=["kidney"] ))
        assert t.nutrition_targets_optimization_ready
        assert not t.automated_personalized_planning_allowed


BAD_STATUSES = ["", " ", None, float("nan"), "UNKNOWN", "unexpected", {}, [], True, 0]
BAD_COMPLETENESS = [False, None, "", " ", float("nan"), "unknown", "False", 1, {}, []]


class TestMalformedAllergenSafety:
    @pytest.mark.parametrize("status", BAD_STATUSES)
    def test_malformed_status(self, status):
        r = check_entity_allergen_safety("X", "Food", {"dairy": status}, ["dairy"], allergen_assessment_complete=True)
        assert not r.eligible
        assert r.primary_outcome == SafetyOutcome.EXCLUDED_UNKNOWN_ALLERGEN_STATUS

    @pytest.mark.parametrize("complete", BAD_COMPLETENESS)
    def test_incomplete_assessment(self, complete):
        r = check_entity_allergen_safety("X", "Food", {"dairy": "ABSENT"}, ["dairy"], allergen_assessment_complete=complete)
        assert r.primary_outcome == SafetyOutcome.EXCLUDED_UNKNOWN_ALLERGEN_STATUS

    def test_missing_key(self):
        r = check_entity_allergen_safety("X", "Food", {}, ["dairy"], allergen_assessment_complete=True)
        assert r.primary_outcome == SafetyOutcome.EXCLUDED_UNKNOWN_ALLERGEN_STATUS

    def test_omitted_completeness(self):
        assert not check_entity_allergen_safety("X", "Food", {"dairy": "ABSENT"}, ["dairy"]).eligible

    @pytest.mark.parametrize("mapping", [None, float("nan"), [], "ABSENT"])
    def test_malformed_map(self, mapping):
        assert not check_entity_allergen_safety("X", "Food", mapping, ["dairy"], allergen_assessment_complete=True).eligible


class TestMalformedDietarySafety:
    @pytest.mark.parametrize("status", BAD_STATUSES)
    def test_malformed_status(self, status):
        r = check_entity_dietary_safety("X", "Food", {"vegan": status}, ["vegan"], dietary_assessment_complete=True)
        assert not r.eligible
        assert r.primary_outcome == SafetyOutcome.EXCLUDED_UNKNOWN_DIETARY_STATUS

    @pytest.mark.parametrize("complete", BAD_COMPLETENESS)
    def test_incomplete_assessment(self, complete):
        r = check_entity_dietary_safety("X", "Food", {"vegan": "COMPATIBLE"}, ["vegan"], dietary_assessment_complete=complete)
        assert r.primary_outcome == SafetyOutcome.EXCLUDED_UNKNOWN_DIETARY_STATUS

    def test_missing_key(self):
        assert not check_entity_dietary_safety("X", "Food", {}, ["vegan"], dietary_assessment_complete=True).eligible

    def test_omitted_completeness(self):
        assert not check_entity_dietary_safety("X", "Food", {"vegan": "COMPATIBLE"}, ["vegan"]).eligible

    @pytest.mark.parametrize("mapping", [None, float("nan"), [], "COMPATIBLE"])
    def test_malformed_map(self, mapping):
        assert not check_entity_dietary_safety("X", "Food", mapping, ["vegan"], dietary_assessment_complete=True).eligible


class TestStructuredSafetyOutcomes:
    @pytest.mark.parametrize("status", ["COMPATIBLE", "VERIFIED_COMPATIBLE"])
    @pytest.mark.parametrize("diet", ["vegetarian", "vegan", "pescatarian"])
    def test_explicit_compatible_with_complete_assessment(self, status, diet):
        r = check_entity_dietary_safety("X", "Food", {diet: status}, [diet], dietary_assessment_complete=True)
        assert r.eligible and r.primary_outcome == SafetyOutcome.SAFE_FOR_AUTOMATED_PLANNING

    def test_safe(self):
        r = check_entity_allergen_safety("X", "Food", {"dairy": "ABSENT"}, ["dairy"], allergen_assessment_complete="True")
        assert r.eligible and r.primary_outcome == SafetyOutcome.SAFE_FOR_AUTOMATED_PLANNING
        assert r.all_reasons == r.exclusion_reasons == []

    def test_known_allergen_even_if_assessment_incomplete(self):
        r = check_entity_allergen_safety("X", "Food", {"dairy": "PRESENT"}, ["dairy"])
        assert r.primary_outcome == SafetyOutcome.EXCLUDED_KNOWN_ALLERGEN

    def test_possible_is_unknown(self):
        r = check_entity_allergen_safety("X", "Food", {"dairy": "POSSIBLE"}, ["dairy"], allergen_assessment_complete=True)
        assert r.primary_outcome == SafetyOutcome.EXCLUDED_UNKNOWN_ALLERGEN_STATUS

    def test_known_dietary_incompatibility(self):
        r = check_entity_dietary_safety("X", "Food", {"vegan": "INCOMPATIBLE"}, ["vegan"])
        assert r.primary_outcome == SafetyOutcome.EXCLUDED_DIETARY_CLASS

    def test_all_reasons_and_precedence(self):
        entity = dict(entity_id="X", allergen_map={"egg": "PRESENT"},
                      dietary_map={"vegan": "INCOMPATIBLE"})
        expected = [SafetyOutcome.EXCLUDED_KNOWN_ALLERGEN, SafetyOutcome.EXCLUDED_UNKNOWN_ALLERGEN_STATUS,
                    SafetyOutcome.EXCLUDED_DIETARY_CLASS, SafetyOutcome.EXCLUDED_UNKNOWN_DIETARY_STATUS,
                    SafetyOutcome.EXCLUDED_USER_DISLIKE]
        for allergies in (["egg", "dairy"], ["dairy", "egg"]):
            r = apply_safety_filter([entity], allergies, ["vegan", "vegetarian"], disliked_entity_ids=["X"])["X"]
            assert r.primary_outcome == expected[0]
            assert r.all_reasons == expected
            assert len(r.exclusion_reasons) == 5

    def test_dislike(self):
        r = apply_safety_filter([dict(entity_id="X")], [], [], disliked_entity_ids=["X"])["X"]
        assert r.primary_outcome == SafetyOutcome.EXCLUDED_USER_DISLIKE


class TestCatalogSafetyAdapter:
    @pytest.mark.parametrize("present,complete,outcome", [
        ("False", "True", SafetyOutcome.SAFE_FOR_AUTOMATED_PLANNING),
        (False, False, SafetyOutcome.EXCLUDED_UNKNOWN_ALLERGEN_STATUS),
        ("False", "False", SafetyOutcome.EXCLUDED_UNKNOWN_ALLERGEN_STATUS),
        ("True", "False", SafetyOutcome.EXCLUDED_KNOWN_ALLERGEN),
        (None, "True", SafetyOutcome.EXCLUDED_UNKNOWN_ALLERGEN_STATUS),
    ])
    def test_raw_catalog_boolean_contract(self, present, complete, outcome):
        row = dict(planner_entity_id="X", entity_name_en="Food", known_contains_dairy=present,
                   allergen_assessment_complete=complete)
        r = apply_safety_filter([row], ["dairy"], [])["X"]
        assert r.primary_outcome == outcome

    @pytest.mark.parametrize("diet", ["vegetarian", "vegan", "pescatarian"])
    def test_candidate_labels_do_not_establish_dietary_safety(self, diet):
        row = dict(planner_entity_id="X", dietary_class="plant_based", known_contains_meat=False,
                   allergen_assessment_complete=True)
        assert apply_safety_filter([row], [], [diet])["X"].primary_outcome == SafetyOutcome.EXCLUDED_UNKNOWN_DIETARY_STATUS

    def test_actual_catalog_rows(self):
        with (DATA / "pakistan_master_planner_catalog.csv").open(encoding="utf-8", newline="") as f:
            rows = list(csv.DictReader(f))
        results = apply_safety_filter(rows, ["dairy"], [])
        assert len(results) == 71
        for row in rows:
            expected_safe = row["known_contains_dairy"] == "False" and row["allergen_assessment_complete"] == "True"
            assert results[row["planner_entity_id"]].eligible == expected_safe


class TestRuntimeNutrientClassification:
    def test_classification_is_independent_of_availability(self):
        r = audit_entity_coverage({"entity_id": "missing"})
        for nutrient in ("energy_kcal", "protein_g", "fat_g", "carbohydrate_g"):
            assert r.nutrient_classifications[nutrient] == NutrientClassification.CORE_OPTIMIZATION_READY
            assert not r.planner_catalog_availability[nutrient]
        assert not r.core_macro_optimization_eligible
        assert r.nutrient_classifications["fiber_g"] == NutrientClassification.SOFT_TARGET_ONLY
        for nutrient in ("calcium_mg", "iron_mg", "vit_c_mg"):
            assert r.nutrient_classifications[nutrient] == NutrientClassification.INSUFFICIENT_COVERAGE

    def test_returned_classifications_are_independent(self):
        first = nutrient_classifications()
        first.clear()
        assert len(nutrient_classifications()) == 8

    def test_source_coverage_is_not_planner_exposed_coverage(self):
        _, report = audit_master_catalog()
        for nutrient, expected in {"calcium_mg": 45, "iron_mg": 44, "vit_c_mg": 30}.items():
            source = report["upstream_source_coverage"][nutrient]
            assert source["count"] == expected
            assert source["count"] == len(source["source_records"])
            assert report["planner_catalog_coverage"][nutrient]["count"] == 0
            assert all(r["source_record_id"] for r in source["source_records"])
        assert report["core_macro_optimization_eligible"] == 63
        assert report["core_macro_optimization_ineligible"] == 8

    def test_unknown_upstream_is_not_zero(self, tmp_path):
        path = tmp_path / "catalog.csv"
        path.write_text("planner_entity_id,energy_kcal\nX,200\n")
        _, report = audit_master_catalog(str(path))
        assert report["upstream_source_coverage"] is None

    def test_explicit_zero_valid_but_missing_stays_missing(self):
        r = audit_entity_coverage(dict(entity_id="X", energy_kcal=10, protein_g=0,
                                      fat_g=0, carbohydrate_g=None, calcium_mg=0))
        assert r.has_protein_g and r.has_fat_g
        assert not r.has_carbohydrate_g
        assert not r.core_macro_optimization_eligible
        assert r.planner_catalog_availability["calcium_mg"]

    def test_raw_portion_sources_are_labelled(self):
        _, report = audit_master_catalog()
        refs = report["upstream_source_coverage"]["calcium_mg"]["source_records"]
        portions = [r for r in refs if r["entity_id"].startswith("PK_PORTION_")]
        assert len(portions) == 2
        assert all(r["nutrition_basis"] == "RAW_INGREDIENT_REFERENCE_ONLY_NOT_PORTION_NUTRITION" for r in portions)
