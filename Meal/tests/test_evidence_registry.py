"""Meal/tests/test_evidence_registry.py - Unit tests for the Condition Evidence Registry.

Verifies schema compliance, provenance completeness, source-native grading,
BioPulse safeguard separation, and deterministic ordering against the golden fixture.
"""

import json
from pathlib import Path
import pytest

from Meal.evidence.registry import (
    DEFAULT_REGISTRY_PATH,
    EvidenceRegistry,
    RegistryValidationError,
    get_evidence_registry,
    load_evidence_registry,
    validate_rule_dict,
)
from Meal.evidence.schemas import ConditionPathway, EvidenceKind

FIXTURE_PATH = Path(__file__).parent / "fixtures" / "condition_evidence_expected.json"


@pytest.fixture
def expected_fixture() -> dict:
    with open(FIXTURE_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


class TestRegistryIntegrity:
    """Verifies the loaded registry matches golden fixture expectations."""

    def test_registry_loads_successfully(self):
        reg = get_evidence_registry(force_reload=True)
        assert isinstance(reg, EvidenceRegistry)
        assert len(reg) > 0

    def test_registry_counts_match_fixture(self, expected_fixture):
        reg = get_evidence_registry()
        meta = expected_fixture["registry_metadata"]
        assert len(reg) == meta["expected_total_rules"]
        assert len(reg.get_rules_by_condition(ConditionPathway.PCOS)) == meta["expected_pcos_rules"]
        assert len(reg.get_rules_by_condition(ConditionPathway.MALE_HYPOGONADISM)) == meta["expected_hypogonadism_rules"]
        assert len(reg.get_rules_by_condition(ConditionPathway.GENERAL)) == meta["expected_general_rules"]

    def test_registry_rule_ids_match_fixture_exactly(self, expected_fixture):
        reg = get_evidence_registry()
        actual_ids = [r.evidence_id for r in reg.rules]
        expected_ids = sorted(expected_fixture["expected_rule_ids"])
        assert actual_ids == expected_ids

    def test_deterministic_ordering(self):
        reg = get_evidence_registry()
        ids = [r.evidence_id for r in reg.rules]
        assert ids == sorted(ids)

    def test_safeguards_separated_from_clinical_recommendations(self, expected_fixture):
        reg = get_evidence_registry()
        safeguards = [r for r in reg.rules if r.evidence_kind == EvidenceKind.BIOPULSE_IMPLEMENTATION_SAFEGUARD]
        meta = expected_fixture["registry_metadata"]
        assert len(safeguards) == meta["expected_safeguard_rules"]
        for s in safeguards:
            assert "SAFEGUARD" in s.evidence_id
            assert s.source_organization == "BioPulse Team"

    def test_source_native_grading_retained(self):
        reg = get_evidence_registry(force_reload=True)
        pcos_ebr = reg.get_by_id("PCOS_EBR_001")
        assert pcos_ebr is not None
        assert pcos_ebr.source_recommendation_type == "EBR"
        assert pcos_ebr.source_evidence_grade_raw == "Very Low (⊕◯◯◯)"
        assert pcos_ebr.source_recommendation_strength_raw == "Conditional recommendation (❖❖❖)"
        assert pcos_ebr.source_recommendation_number == "Rec 3.3.1"

        eau_ebr = reg.get_by_id("HYPOGONADISM_EBR_002")
        assert eau_ebr is not None
        assert eau_ebr.source_recommendation_type == "EAU Recommendation"
        assert eau_ebr.source_evidence_grade_raw == "LE 1a"
        assert eau_ebr.source_recommendation_strength_raw == "Strong"
        assert eau_ebr.source_section == "3.4.3.a Lifestyle factors"
        assert eau_ebr.source_recommendation_section == "3.4.3.c Summary of evidence and recommendations for choice of treatment for late-onset hypogonadism"
        assert eau_ebr.source_recommendation_number == "Section 3.4.3.c"

    def test_pcos_recommendations_numbering_and_types(self):
        """Proves exact guideline recommendation numbering and types per published 2023 International Guideline:
        3.1.1 = EBR (Lifestyle intervention for metabolic health, Very Low / Strong)
        3.1.5 = PP  (Healthy lifestyle benefits even without weight loss, Practice Point)
        3.1.6 = PP  (Higher weight management context, Practice Point)
        3.1.9 = PP  (Adolescent excess weight gain prevention, Practice Point)
        3.3.1 = EBR (No evidence to support any one diet composition over another, Very Low / Conditional)
        3.3.2 = CR  (Healthy eating consistent with population guidelines, Consensus recommendation)
        3.3.3 = PP  (Flexible, preference-sensitive, avoid restrictive diets, Practice Point)
        """
        reg = get_evidence_registry(force_reload=True)

        rec_311 = reg.get_by_id("PCOS_EBR_004")
        assert rec_311.source_recommendation_number == "Rec 3.1.1"
        assert rec_311.source_recommendation_type == "EBR"
        assert "lifestyle intervention should be recommended" in rec_311.statement.lower()
        assert rec_311.source_evidence_grade_raw == "Very Low (⊕◯◯◯)"
        assert rec_311.source_recommendation_strength_raw == "Strong recommendation (❖❖❖❖)"

        rec_315 = reg.get_by_id("PCOS_PP_005")
        assert rec_315.source_recommendation_number == "Rec 3.1.5"
        assert rec_315.source_recommendation_type == "PP"
        assert "benefits to a healthy lifestyle even in the absence of weight loss" in rec_315.statement.lower()
        assert rec_315.source_evidence_grade_raw == "Not applicable"
        assert rec_315.source_recommendation_strength_raw == "Practice Point"

        rec_316 = reg.get_by_id("PCOS_PP_006")
        assert rec_316.source_recommendation_number == "Rec 3.1.6"
        assert rec_316.source_recommendation_type == "PP"
        assert "for those with higher weight" in rec_316.statement.lower()
        assert rec_316.source_evidence_grade_raw == "Not applicable"
        assert rec_316.source_recommendation_strength_raw == "Practice Point"

        rec_319 = reg.get_by_id("PCOS_PP_009")
        assert rec_319.source_recommendation_number == "Rec 3.1.9"
        assert rec_319.source_recommendation_type == "PP"
        assert "in adolescents" in rec_319.statement.lower()
        assert rec_319.source_evidence_grade_raw == "Not applicable"
        assert rec_319.source_recommendation_strength_raw == "Practice Point"

        rec_331 = reg.get_by_id("PCOS_EBR_001")
        assert rec_331.source_recommendation_number == "Rec 3.3.1"
        assert rec_331.source_recommendation_type == "EBR"
        assert "no evidence to support any one" in rec_331.statement.lower()
        assert rec_331.source_evidence_grade_raw == "Very Low (⊕◯◯◯)"
        assert rec_331.source_recommendation_strength_raw == "Conditional recommendation (❖❖❖)"

        rec_332 = reg.get_by_id("PCOS_CR_002")
        assert rec_332.source_recommendation_number == "Rec 3.3.2"
        assert rec_332.source_recommendation_type == "CR"
        assert "consistent with general population dietary guidelines" in rec_332.statement.lower()
        assert rec_332.source_evidence_grade_raw == "Consensus"
        assert rec_332.source_recommendation_strength_raw == "Consensus recommendation"

        rec_333 = reg.get_by_id("PCOS_PP_003")
        assert rec_333.source_recommendation_number == "Rec 3.3.3"
        assert rec_333.source_recommendation_type == "PP"
        assert "dietary changes should be flexible" in rec_333.statement.lower()
        assert rec_333.source_evidence_grade_raw == "Not applicable"
        assert rec_333.source_recommendation_strength_raw == "Practice Point"

    def test_eau_hypogonadism_distinguishes_evidence_level_from_recommendation_strength(self):
        """Proves EAU lifestyle rule strictly separates LE (1a) from Recommendation Strength (Strong)
        and correctly locates Section 3.4.3.a (lifestyle factors) and Section 3.4.3.c (recommendations table)."""
        reg = get_evidence_registry(force_reload=True)
        eau_rule = reg.get_by_id("HYPOGONADISM_EBR_002")
        assert eau_rule is not None
        assert eau_rule.source_organization == "European Association of Urology"
        assert eau_rule.source_section == "3.4.3.a Lifestyle factors"
        assert eau_rule.source_recommendation_section == "3.4.3.c Summary of evidence and recommendations for choice of treatment for late-onset hypogonadism"
        assert eau_rule.source_evidence_grade_raw == "LE 1a"
        assert eau_rule.source_recommendation_strength_raw == "Strong"
        assert eau_rule.source_evidence_grade_raw != eau_rule.source_recommendation_strength_raw
        assert "Strong" not in eau_rule.source_evidence_grade_raw
        assert "LE" not in eau_rule.source_recommendation_strength_raw
        assert "3.4.1" not in eau_rule.source_section

        # Direct activation applicability constraints
        assert eau_rule.minimum_age == 19.0
        assert eau_rule.target_sex == "MALE"
        assert eau_rule.requires_higher_weight_context is True
        assert eau_rule.requires_confirmed_condition is True
        assert eau_rule.required_context_status == "CLINICIAN_CONFIRMED"

    def test_zero_invented_eau_sections_or_practice_points(self):
        """Proves zero invented EAU sections (e.g. 3.4.2 General Health and Nutrition) or practice points exist."""
        reg = get_evidence_registry(force_reload=True)
        eau_rules = [r for r in reg.rules if "European Association of Urology" in r.source_organization]

        # Only valid EAU rules must exist
        assert len(eau_rules) == 1
        for r in eau_rules:
            assert r.evidence_id == "HYPOGONADISM_EBR_002"
            assert "General Health and Nutrition" not in r.source_section
            assert r.source_recommendation_type != "Practice Point"

    def test_endocrine_society_diagnostic_boundary_metadata(self):
        """Proves diagnostic boundary rule retains native Endocrine Society grading (1 | ⊕⊕⊕O)."""
        reg = get_evidence_registry(force_reload=True)
        endo_rule = reg.get_by_id("HYPOGONADISM_CONTEXT_001")
        assert endo_rule is not None
        assert endo_rule.source_organization == "Endocrine Society"
        assert endo_rule.source_title == "Testosterone Therapy in Men with Hypogonadism: An Endocrine Society Clinical Practice Guideline"
        assert endo_rule.source_year == 2018
        assert endo_rule.source_recommendation_number == "Recommendation 1.1"
        assert "⊕⊕⊕O" in endo_rule.source_evidence_grade_raw
        assert "1" in endo_rule.source_recommendation_strength_raw
        assert "LE 1a" not in endo_rule.source_evidence_grade_raw

    def test_general_dietary_guidelines_current_edition_and_unreported_grades(self):
        """Proves GENERAL_PP_001 uses current Dietary Guidelines 2025-2030 (10th Ed, 2026) and unassigned grades are UNREPORTED."""
        reg = get_evidence_registry(force_reload=True)
        gen_rule = reg.get_by_id("GENERAL_PP_001")
        assert gen_rule is not None
        assert gen_rule.source_title == "Dietary Guidelines for Americans, 2025–2030"
        assert gen_rule.source_organization == "USDA / HHS"
        assert gen_rule.source_year == 2026
        assert gen_rule.source_evidence_grade_raw == "UNREPORTED"
        assert gen_rule.source_recommendation_strength_raw == "UNREPORTED"

    def test_all_external_rules_have_complete_provenance(self):
        """Validates all externally sourced active rules have complete source title, org, year, url, section, number, type, and grade."""
        reg = get_evidence_registry(force_reload=True)
        external_rules = [r for r in reg.rules if r.evidence_kind != EvidenceKind.BIOPULSE_IMPLEMENTATION_SAFEGUARD]
        assert len(external_rules) == 11

        for r in external_rules:
            assert r.source_title and len(r.source_title) > 5
            assert r.source_organization and len(r.source_organization) > 2
            assert isinstance(r.source_year, int) and 2000 <= r.source_year <= 2026
            assert r.source_url.startswith("http")
            assert r.source_section and len(r.source_section) > 2
            assert r.source_recommendation_number != "UNREPORTED" or r.condition.value == "GENERAL" or "CONTEXT" in r.evidence_id
            assert r.source_recommendation_type != "UNREPORTED"
            assert r.statement and len(r.statement) > 30
            assert r.review_status == "REVIEWED_ACTIVE"

    def test_registry_matches_independent_source_mapping_golden_fixture(self):
        """Cross-checks every active externally sourced rule against the independent golden source-mapping fixture."""
        reg = get_evidence_registry(force_reload=True)
        golden_file = Path(__file__).parent / "fixtures" / "evidence_source_mapping_golden.json"
        assert golden_file.exists()

        with open(golden_file, "r", encoding="utf-8") as f:
            fixture = json.load(f)

        mappings = fixture["mappings"]
        assert len(mappings) == 11

        for m in mappings:
            rule = reg.get_by_id(m["evidence_id"])
            assert rule is not None, f"Missing rule {m['evidence_id']} in registry"
            assert rule.condition.value == m["condition"]
            assert rule.source_organization == m["source_organization"]
            assert rule.source_title == m["source_title"]
            assert rule.source_year == m["source_year"]
            assert rule.source_section == m["source_section"]
            assert rule.source_recommendation_section == m["source_recommendation_section"]
            assert rule.source_recommendation_number == m["source_recommendation_number"]
            assert rule.source_recommendation_type == m["source_recommendation_type"]
            assert rule.source_evidence_grade_raw == m["source_evidence_grade_raw"]
            assert rule.source_recommendation_strength_raw == m["source_recommendation_strength_raw"]
            assert m["statement_contains"].lower() in rule.statement.lower()

    def test_biopulse_safeguards_do_not_impersonate_clinical_recommendations(self):
        """Validates safeguards remain classified as BIOPULSE_IMPLEMENTATION_SAFEGUARD with UNREPORTED source grades."""
        reg = get_evidence_registry(force_reload=True)
        safeguards = [r for r in reg.rules if r.evidence_kind == EvidenceKind.BIOPULSE_IMPLEMENTATION_SAFEGUARD]
        assert len(safeguards) == 6

        for s in safeguards:
            assert s.source_organization == "BioPulse Team"
            assert s.source_recommendation_type == "SAFEGUARD"
            assert s.source_evidence_grade_raw == "UNREPORTED"
            assert s.source_recommendation_strength_raw == "UNREPORTED"
            assert s.source_recommendation_number == "UNREPORTED"
            assert "safeguard" in s.statement.lower()


class TestRegistryValidationRejections:
    """Verifies that invalid or unsafe rules are strictly rejected."""

    def test_duplicate_id_rejected(self, tmp_path):
        with open(DEFAULT_REGISTRY_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
        data["rules"].append(data["rules"][0])  # Duplicate first rule
        tmp_file = tmp_path / "_temp_dup.json"
        with open(tmp_file, "w", encoding="utf-8") as f:
            json.dump(data, f)
        with pytest.raises(RegistryValidationError, match="Duplicate evidence_id"):
            load_evidence_registry(tmp_file)

    def test_unknown_field_rejected(self):
        seen = set()
        bad_rule = {
            "evidence_id": "TEST_001",
            "unknown_field": "disallowed",
        }
        with pytest.raises(RegistryValidationError, match="unknown JSON fields"):
            validate_rule_dict(bad_rule, seen)

    def test_forbidden_executable_pattern_rejected(self):
        seen = set()
        bad_rule = {
            "evidence_id": "TEST_002",
            "statement": "eval('import os')",
        }
        with pytest.raises(RegistryValidationError, match="Forbidden executable pattern"):
            validate_rule_dict(bad_rule, seen)

    def test_unreviewed_rule_rejected(self):
        seen = set()
        rule = {
            "evidence_id": "TEST_UNREVIEWED",
            "registry_version": "1.0.0",
            "condition": "PCOS",
            "topic": "test",
            "statement": "test statement",
            "implementation_effect": "PRESERVE_NEUTRAL_TARGETS",
            "evidence_kind": "BIOPULSE_IMPLEMENTATION_SAFEGUARD",
            "evidence_strength": "NOT_APPLICABLE",
            "recommendation_strength": "NOT_APPLICABLE",
            "source_title": "Test Title",
            "source_organization": "BioPulse Team",
            "source_year": 2026,
            "source_url": "internal://test",
            "source_section": "Test",
            "review_status": "DRAFT",
            "source_recommendation_type": "SAFEGUARD",
            "source_evidence_grade_raw": "UNREPORTED",
            "source_recommendation_strength_raw": "UNREPORTED",
            "source_recommendation_number": "UNREPORTED",
            "minimum_age": 12.0,
            "maximum_age": None,
            "target_sex": "ANY",
            "required_context_status": None,
            "requires_higher_weight_context": False,
            "requires_confirmed_condition": False,
            "population_description": "test",
            "notes": None,
        }
        with pytest.raises(RegistryValidationError, match="Unreviewed or inactive rule"):
            validate_rule_dict(rule, seen)
