"""Meal/evidence/registry.py - Loader and strict validator for the Nutrition Evidence Registry.

Enforces schema compliance, provenance completeness, source-native grading,
and absence of executable or unreviewed rules.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Dict, List, Optional, Set

from Meal.evidence.schemas import (
    ConditionEvidenceRule,
    ConditionPathway,
    EvidenceKind,
    EvidenceStrength,
    ImplementationEffect,
    RecommendationStrength,
)

# Registry file location relative to this file
DEFAULT_REGISTRY_PATH = (
    Path(__file__).resolve().parent.parent / "data" / "evidence" / "nutrition_evidence_registry.json"
)

ALLOWED_RULE_KEYS: Set[str] = {
    "evidence_id",
    "registry_version",
    "condition",
    "topic",
    "statement",
    "implementation_effect",
    "evidence_kind",
    "evidence_strength",
    "recommendation_strength",
    "source_recommendation_type",
    "source_evidence_grade_raw",
    "source_recommendation_strength_raw",
    "source_recommendation_number",
    "minimum_age",
    "maximum_age",
    "target_sex",
    "required_context_status",
    "requires_higher_weight_context",
    "requires_confirmed_condition",
    "population_description",
    "source_title",
    "source_organization",
    "source_year",
    "source_url",
    "source_section",
    "source_recommendation_section",
    "review_status",
    "notes",
}

FORBIDDEN_STRING_PATTERNS = [
    "__import__",
    "eval(",
    "exec(",
    "os.system",
    "subprocess",
    "lambda ",
]


class RegistryValidationError(ValueError):
    """Raised when evidence registry fails validation."""
    pass


class EvidenceRegistry:
    """In-memory loaded and validated evidence registry."""

    def __init__(self, rules: List[ConditionEvidenceRule], registry_version: str):
        self.rules: List[ConditionEvidenceRule] = sorted(rules, key=lambda r: r.evidence_id)
        self.registry_version: str = registry_version
        self._by_id: Dict[str, ConditionEvidenceRule] = {r.evidence_id: r for r in self.rules}

    def get_by_id(self, evidence_id: str) -> Optional[ConditionEvidenceRule]:
        return self._by_id.get(evidence_id)

    def get_rules_by_condition(self, condition: ConditionPathway) -> List[ConditionEvidenceRule]:
        return [r for r in self.rules if r.condition == condition]

    def __len__(self) -> int:
        return len(self.rules)


def validate_rule_dict(d: dict, seen_ids: Set[str]) -> ConditionEvidenceRule:
    """Strictly validates a raw JSON dict against schema constraints."""
    extra_keys = set(d.keys()) - ALLOWED_RULE_KEYS
    if extra_keys:
        raise RegistryValidationError(f"Rule contains unknown JSON fields: {extra_keys}")

    # Check for executable code patterns
    for k, v in d.items():
        if isinstance(v, str):
            for pat in FORBIDDEN_STRING_PATTERNS:
                if pat in v:
                    raise RegistryValidationError(f"Forbidden executable pattern '{pat}' in field '{k}'")

    evidence_id = d.get("evidence_id")
    if not evidence_id or not isinstance(evidence_id, str):
        raise RegistryValidationError(f"Missing or invalid evidence_id: {evidence_id}")
    if evidence_id in seen_ids:
        raise RegistryValidationError(f"Duplicate evidence_id: {evidence_id}")
    seen_ids.add(evidence_id)

    # Condition
    raw_condition = d.get("condition")
    try:
        condition = ConditionPathway(raw_condition)
    except Exception as e:
        raise RegistryValidationError(f"Invalid condition '{raw_condition}' in {evidence_id}") from e

    # Effect
    raw_effect = d.get("implementation_effect")
    try:
        effect = ImplementationEffect(raw_effect)
    except Exception as e:
        raise RegistryValidationError(f"Invalid implementation_effect '{raw_effect}' in {evidence_id}") from e

    # Kind
    raw_kind = d.get("evidence_kind")
    try:
        kind = EvidenceKind(raw_kind)
    except Exception as e:
        raise RegistryValidationError(f"Invalid evidence_kind '{raw_kind}' in {evidence_id}") from e

    # Separation rule: safeguards must not be labeled clinical recommendations
    if "SAFEGUARD" in evidence_id and kind != EvidenceKind.BIOPULSE_IMPLEMENTATION_SAFEGUARD:
        raise RegistryValidationError(
            f"Safeguard rule {evidence_id} must have kind BIOPULSE_IMPLEMENTATION_SAFEGUARD, got {kind}"
        )
    if kind == EvidenceKind.BIOPULSE_IMPLEMENTATION_SAFEGUARD and effect not in {
        ImplementationEffect.PRESERVE_NEUTRAL_TARGETS,
        ImplementationEffect.NO_THERAPEUTIC_FOOD_CLAIMS,
        ImplementationEffect.NO_SPECIFIC_DIET_SUPPORTED,
    }:
        raise RegistryValidationError(
            f"BioPulse safeguard {evidence_id} has non-safeguard effect {effect}"
        )

    # Strengths
    raw_ev_str = d.get("evidence_strength")
    try:
        ev_strength = EvidenceStrength(raw_ev_str)
    except Exception as e:
        raise RegistryValidationError(f"Invalid evidence_strength '{raw_ev_str}' in {evidence_id}") from e

    raw_rec_str = d.get("recommendation_strength")
    try:
        rec_strength = RecommendationStrength(raw_rec_str)
    except Exception as e:
        raise RegistryValidationError(f"Invalid recommendation_strength '{raw_rec_str}' in {evidence_id}") from e

    # Provenance
    source_title = d.get("source_title", "")
    source_org = d.get("source_organization", "")
    source_year = d.get("source_year", 0)
    source_url = d.get("source_url", "")
    source_section = d.get("source_section", "")

    if not source_title or not source_org or not source_section:
        raise RegistryValidationError(f"Incomplete source citation in {evidence_id}")
    if not isinstance(source_year, int) or source_year < 1900 or source_year > 2030:
        raise RegistryValidationError(f"Invalid source_year {source_year} in {evidence_id}")

    # Review status
    review_status = d.get("review_status")
    if review_status != "REVIEWED_ACTIVE":
        raise RegistryValidationError(f"Unreviewed or inactive rule in production registry: {evidence_id} ({review_status})")

    # Age applicability
    min_age = d.get("minimum_age")
    max_age = d.get("maximum_age")
    if min_age is not None and max_age is not None:
        if min_age > max_age:
            raise RegistryValidationError(f"minimum_age ({min_age}) > maximum_age ({max_age}) in {evidence_id}")

    return ConditionEvidenceRule(
        evidence_id=evidence_id,
        registry_version=d.get("registry_version", "1.0.0"),
        condition=condition,
        topic=d.get("topic", ""),
        statement=d.get("statement", ""),
        implementation_effect=effect,
        evidence_kind=kind,
        evidence_strength=ev_strength,
        recommendation_strength=rec_strength,
        source_recommendation_type=d.get("source_recommendation_type", "UNREPORTED"),
        source_evidence_grade_raw=d.get("source_evidence_grade_raw", "UNREPORTED"),
        source_recommendation_strength_raw=d.get("source_recommendation_strength_raw", "UNREPORTED"),
        source_recommendation_number=d.get("source_recommendation_number", "UNREPORTED"),
        minimum_age=min_age,
        maximum_age=max_age,
        target_sex=d.get("target_sex"),
        required_context_status=d.get("required_context_status"),
        requires_higher_weight_context=bool(d.get("requires_higher_weight_context", False)),
        requires_confirmed_condition=bool(d.get("requires_confirmed_condition", False)),
        population_description=d.get("population_description", ""),
        source_title=source_title,
        source_organization=source_org,
        source_year=source_year,
        source_url=source_url,
        source_section=source_section,
        source_recommendation_section=d.get("source_recommendation_section"),
        review_status=review_status,
        notes=d.get("notes"),
    )


def load_evidence_registry(registry_path: Optional[Path] = None) -> EvidenceRegistry:
    """Loads and validates the evidence registry from JSON file."""
    path = registry_path or DEFAULT_REGISTRY_PATH
    if not path.exists():
        raise FileNotFoundError(f"Evidence registry not found at {path}")

    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)

    if not isinstance(data, dict):
        raise RegistryValidationError("Registry root must be a JSON object")

    registry_version = data.get("registry_version", "1.0.0")
    raw_rules = data.get("rules")
    if not isinstance(raw_rules, list) or len(raw_rules) == 0:
        raise RegistryValidationError("Registry must contain a non-empty 'rules' array")

    seen_ids: Set[str] = set()
    validated_rules: List[ConditionEvidenceRule] = []
    for r in raw_rules:
        validated_rules.append(validate_rule_dict(r, seen_ids))

    return EvidenceRegistry(rules=validated_rules, registry_version=registry_version)


_GLOBAL_REGISTRY: Optional[EvidenceRegistry] = None


def get_evidence_registry(force_reload: bool = False) -> EvidenceRegistry:
    """Returns the singleton evidence registry instance."""
    global _GLOBAL_REGISTRY
    if _GLOBAL_REGISTRY is None or force_reload:
        _GLOBAL_REGISTRY = load_evidence_registry()
    return _GLOBAL_REGISTRY
