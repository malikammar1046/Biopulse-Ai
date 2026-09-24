"""backend/apps/health/services/meal_constraint_provider.py - Integration-Owned Verified Portion Registry & Eligibility Gate.

Provides deterministic, source-backed portion constraints for automated Pakistani meal planning.
Enforces the strict Solution A Constrained Sub-Catalog MVP policy:
- Rejects ENGINEERING_ONLY and UNSUPPORTED portion specifications.
- Permits only SOURCE_EXACT and SOURCE_DERIVED_WITH_EXPLICIT_RULE classifications.
- Leaves uncalibrated composite recipes in the catalog for display/research under PORTION_CALIBRATION_REQUIRED.
- Intersects Phase 6A candidate pools with production-eligible entities before Phase 6C/6D/6E optimization.
"""

from __future__ import annotations

import csv
from dataclasses import dataclass, replace
from pathlib import Path
from typing import Dict, List, Optional, Set

from Meal.optimizer.schemas import PortionConstraint
from Meal.planner.catalog import PlannerCatalogEntity, load_master_planner_catalog
from Meal.planner.schemas import (
    CandidateEvaluation,
    CandidateRankingResult,
    PrimaryDisposition,
)

# Canonical path to the integration-owned verified portion registry
DEFAULT_VERIFIED_CONSTRAINTS_CSV = (
    Path(__file__).resolve().parent.parent / "data" / "verified_meal_portion_constraints.csv"
)

ALLOWED_CLASSIFICATIONS: Set[str] = {
    "SOURCE_EXACT",
    "SOURCE_DERIVED_WITH_EXPLICIT_RULE",
}

DISALLOWED_CLASSIFICATIONS: Set[str] = {
    "ENGINEERING_ONLY",
    "UNSUPPORTED",
}


@dataclass(frozen=True)
class VerifiedPortionConstraintRecord:
    """Full-provenance representation of a production portion constraint."""
    planner_entity_id: str
    entity_name: str
    minimum_grams: float
    preferred_grams: float
    maximum_grams: float
    source_document: str
    source_reference: str
    source_serving_grams: float
    derivation_rule: str
    constraint_classification: str
    review_status: str
    notes: str


def load_verified_portion_records(
    csv_path: Optional[Path] = None,
) -> List[VerifiedPortionConstraintRecord]:
    """Loads and validates all portion constraint records from the verified CSV.
    
    Strictly enforces that disallowed classifications (ENGINEERING_ONLY, UNSUPPORTED)
    are discarded/rejected and cannot enter the production registry.
    """
    path = csv_path or DEFAULT_VERIFIED_CONSTRAINTS_CSV
    if not path.exists():
        raise FileNotFoundError(f"Verified portion constraints file not found: {path}")

    records: List[VerifiedPortionConstraintRecord] = []

    with open(path, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            classification = row["constraint_classification"].strip()

            # Disallow non-production classifications
            if classification in DISALLOWED_CLASSIFICATIONS or classification not in ALLOWED_CLASSIFICATIONS:
                # Disallowed rows must be rejected from the production provider
                continue

            record = VerifiedPortionConstraintRecord(
                planner_entity_id=row["planner_entity_id"].strip(),
                entity_name=row["entity_name"].strip(),
                minimum_grams=float(row["minimum_grams"]),
                preferred_grams=float(row["preferred_grams"]),
                maximum_grams=float(row["maximum_grams"]),
                source_document=row["source_document"].strip(),
                source_reference=row["source_reference"].strip(),
                source_serving_grams=float(row["source_serving_grams"]),
                derivation_rule=row["derivation_rule"].strip(),
                constraint_classification=classification,
                review_status=row["review_status"].strip(),
                notes=row["notes"].strip(),
            )
            records.append(record)

    return records


def get_production_portion_constraints(
    csv_path: Optional[Path] = None,
) -> List[PortionConstraint]:
    """Returns Meal PortionConstraint objects ONLY for verified production-eligible entities.
    
    Every constraint retains transparent source provenance in constraint_source.
    """
    records = load_verified_portion_records(csv_path=csv_path)
    constraints: List[PortionConstraint] = []

    for r in records:
        provenance = (
            f"{r.source_document} | {r.source_reference} | "
            f"serving={r.source_serving_grams}g | rule={r.derivation_rule}"
        )
        constraint = PortionConstraint(
            entity_id=r.planner_entity_id,
            minimum_grams=r.minimum_grams,
            maximum_grams=r.maximum_grams,
            preferred_grams=r.preferred_grams,
            constraint_source=provenance,
        )
        constraints.append(constraint)

    return constraints


def get_production_eligible_entity_ids(
    csv_path: Optional[Path] = None,
) -> Set[str]:
    """Returns the set of planner entity IDs eligible for automated portion optimization."""
    records = load_verified_portion_records(csv_path=csv_path)
    return {r.planner_entity_id for r in records}


def gate_phase6a_candidates(
    candidate_result: CandidateRankingResult,
    eligible_ids: Optional[Set[str]] = None,
    csv_path: Optional[Path] = None,
) -> CandidateRankingResult:
    """Integration eligibility gate.
    
    Filters the Phase 6A candidate pool against production-eligible entity IDs.
    Candidates without verified portion constraints are moved to excluded_candidates
    with reason PORTION_CALIBRATION_REQUIRED so they never enter the portion optimizer.
    
    This does NOT alter Phase 6A internals, nutritional rankings, or catalog values.
    """
    production_ids = eligible_ids if eligible_ids is not None else get_production_eligible_entity_ids(csv_path)

    retained_candidates: List[CandidateEvaluation] = []
    new_exclusions: List[CandidateEvaluation] = list(candidate_result.excluded_candidates)
    reclassified_count = 0

    for cand in candidate_result.ranked_optimization_candidates:
        if cand.entity_id in production_ids:
            retained_candidates.append(cand)
        else:
            reclassified_count += 1
            # Reclassify as excluded from automated optimization pending portion calibration
            reclassified = replace(
                cand,
                primary_disposition=PrimaryDisposition.USER_EXCLUDED,
                all_exclusion_reasons=cand.all_exclusion_reasons + [
                    f"PORTION_CALIBRATION_REQUIRED: Entity '{cand.entity_id}' ({cand.display_name}) "
                    "is an unsupported composite dish or lacks a source-backed standard portion reference. "
                    "Excluded from automated optimization."
                ],
            )
            new_exclusions.append(reclassified)

    return replace(
        candidate_result,
        ranked_optimization_candidates=retained_candidates,
        excluded_candidates=new_exclusions,
        optimization_eligible_count=len(retained_candidates),
        user_excluded_count=candidate_result.user_excluded_count + reclassified_count,
    )


def get_unsupported_catalog_entities(
    catalog_path: Optional[Path] = None,
    eligible_ids: Optional[Set[str]] = None,
    csv_path: Optional[Path] = None,
) -> List[Dict[str, object]]:
    """Returns all catalog entities that require portion calibration before automated optimization.
    
    These entities remain in the catalog for display, research, and recipe viewing.
    """
    master_catalog = load_master_planner_catalog(catalog_path)
    production_ids = eligible_ids if eligible_ids is not None else get_production_eligible_entity_ids(csv_path)

    unsupported: List[Dict[str, object]] = []
    for eid, entity in master_catalog.items():
        if eid not in production_ids:
            unsupported.append({
                "planner_entity_id": eid,
                "entity_name_en": entity.entity_name_en,
                "category": entity.category,
                "meal_roles": entity.meal_roles,
                "status": "PORTION_CALIBRATION_REQUIRED",
                "is_recipe": entity.entity_type == "COMPOSITE_DISH",
                "normalized_energy_kcal_per_100g": entity.normalized_energy_kcal_per_100g,
                "normalized_protein_g_per_100g": entity.normalized_protein_g_per_100g,
                "normalized_fat_g_per_100g": entity.normalized_fat_g_per_100g,
                "normalized_carb_g_per_100g": entity.normalized_carb_g_per_100g,
            })

    return unsupported
