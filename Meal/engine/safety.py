"""Fail-closed entity safety, including raw Phase 4 catalog adaptation.

Primary outcome precedence: known allergen, unknown allergen, known dietary
incompatibility, unknown dietary compatibility, user dislike, then safe.
All distinct exclusion codes and all human-readable reasons are retained.
Completeness defaults to unknown; only explicit true (bool or CSV True) passes.
"""

from collections.abc import Mapping
from dataclasses import dataclass, field
from typing import Dict, List, Optional
from .schemas import SafetyOutcome

_PRECEDENCE = (
    SafetyOutcome.EXCLUDED_KNOWN_ALLERGEN,
    SafetyOutcome.EXCLUDED_UNKNOWN_ALLERGEN_STATUS,
    SafetyOutcome.EXCLUDED_DIETARY_CLASS,
    SafetyOutcome.EXCLUDED_UNKNOWN_DIETARY_STATUS,
    SafetyOutcome.EXCLUDED_USER_DISLIKE,
)


def _explicit_bool(value):
    """Recognize native booleans and the locked CSV representation only."""
    if type(value) is bool:
        return value
    if isinstance(value, str):
        return {"true": True, "false": False}.get(value.strip().lower())
    return None


def _status(value):
    return value.strip().upper() if isinstance(value, str) else "UNKNOWN"


def _key(value):
    return value.strip().lower().replace(" ", "_")


@dataclass
class EntitySafetyResult:
    entity_id: str
    entity_name: str
    eligible: bool
    excluded_by_allergen: List[str] = field(default_factory=list)
    excluded_by_dietary: List[str] = field(default_factory=list)
    exclusion_reasons: List[str] = field(default_factory=list)
    primary_outcome: SafetyOutcome = SafetyOutcome.SAFE_FOR_AUTOMATED_PLANNING
    all_reasons: List[SafetyOutcome] = field(default_factory=list)

    def finalize(self):
        self.all_reasons = [code for code in _PRECEDENCE if code in self.all_reasons]
        self.eligible = not self.all_reasons
        self.primary_outcome = (
            self.all_reasons[0] if self.all_reasons
            else SafetyOutcome.SAFE_FOR_AUTOMATED_PLANNING
        )
        return self


ALLERGEN_ALIASES = {
    "milk": ("dairy", "milk"),
    "dairy": ("milk", "dairy"),
    "peanut": ("nuts", "peanut", "peanuts", "groundnut"),
    "tree_nut": ("nuts", "tree_nut", "tree_nuts"),
    "nuts": ("peanut", "tree_nut", "nuts"),
}


def check_entity_allergen_safety(
    entity_id: str,
    entity_name: str,
    entity_allergen_map: dict,
    user_allergens: List[str],
    *,
    allergen_assessment_complete=False,
) -> EntitySafetyResult:
    """Only ABSENT plus explicit complete assessment permits a relevant allergy.

    PRESENT is a known exclusion even with incomplete assessment. POSSIBLE,
    missing, malformed and unrecognized statuses are unknown exclusions.
    """
    result = EntitySafetyResult(entity_id, entity_name, True)
    statuses = entity_allergen_map if isinstance(entity_allergen_map, Mapping) else {}
    complete = _explicit_bool(allergen_assessment_complete) is True
    for allergen in sorted({_key(a) for a in user_allergens}):
        status = _status(statuses.get(allergen))
        if status == "UNKNOWN":
            for alias in ALLERGEN_ALIASES.get(allergen, ()):
                if alias in statuses:
                    cand_status = _status(statuses.get(alias))
                    if cand_status != "UNKNOWN":
                        status = cand_status
                        break
        if status == "ABSENT" and complete:
            continue
        code = (SafetyOutcome.EXCLUDED_KNOWN_ALLERGEN if status == "PRESENT"
                else SafetyOutcome.EXCLUDED_UNKNOWN_ALLERGEN_STATUS)
        result.excluded_by_allergen.append(allergen)
        result.all_reasons.append(code)
        result.exclusion_reasons.append(
            f"Allergen '{allergen}' is PRESENT in {entity_name}." if status == "PRESENT"
            else f"Allergen '{allergen}' status is UNKNOWN or assessment incomplete for {entity_name} "
                 "? excluded by precaution (known-absent ? unknown policy)."
        )
    return result.finalize()


def check_entity_dietary_safety(
    entity_id: str,
    entity_name: str,
    entity_dietary_map: dict,
    user_dietary_classes: List[str],
    *,
    dietary_assessment_complete=False,
) -> EntitySafetyResult:
    """Require COMPATIBLE/VERIFIED_COMPATIBLE plus complete assessment."""
    result = EntitySafetyResult(entity_id, entity_name, True)
    statuses = entity_dietary_map if isinstance(entity_dietary_map, Mapping) else {}
    complete = _explicit_bool(dietary_assessment_complete) is True
    for dietary in sorted({_key(d) for d in user_dietary_classes}):
        status = _status(statuses.get(dietary))
        if status in {"COMPATIBLE", "VERIFIED_COMPATIBLE"} and complete:
            continue
        code = (SafetyOutcome.EXCLUDED_DIETARY_CLASS if status == "INCOMPATIBLE"
                else SafetyOutcome.EXCLUDED_UNKNOWN_DIETARY_STATUS)
        result.excluded_by_dietary.append(dietary)
        result.all_reasons.append(code)
        result.exclusion_reasons.append(
            f"Dietary class '{dietary}' is INCOMPATIBLE for {entity_name}." if status == "INCOMPATIBLE"
            else f"Dietary compatibility of '{dietary}' is UNKNOWN or assessment incomplete for {entity_name} "
                 "? excluded by precaution (known-absent ? unknown policy)."
        )
    return result.finalize()


def _catalog_allergen_map(entity):
    res = {
        name: {True: "PRESENT", False: "ABSENT"}.get(
            _explicit_bool(entity.get(f"known_contains_{name}")), "UNKNOWN"
        )
        for name in ("dairy", "egg", "fish", "wheat", "nuts")
    }
    if "dairy" in res:
        res["milk"] = res["dairy"]
    if "nuts" in res:
        res["peanut"] = res["nuts"]
        res["tree_nut"] = res["nuts"]
    return res


def _catalog_dietary_map(entity):
    # Catalog allergen completeness does not establish a complete dietary
    # assessment. Known animal ingredients can exclude, but absence flags or
    # candidate dietary labels cannot establish verified compatibility.
    prohibited = {
        "vegetarian": ("meat", "fish"),
        "ovo_lacto_vegetarian": ("meat", "fish"),
        "lacto_vegetarian": ("meat", "fish", "egg"),
        "vegan": ("meat", "fish", "dairy", "egg"),
        "pescatarian": ("meat",),
    }
    return {
        diet: "INCOMPATIBLE" if any(
            _explicit_bool(entity.get(f"known_contains_{name}")) is True for name in names
        ) else "UNKNOWN"
        for diet, names in prohibited.items()
    }


def apply_safety_filter(
    entities: List[dict],
    user_allergens: List[str],
    user_dietary_classes: List[str],
    *,
    disliked_entity_ids: Optional[List[str]] = None,
) -> Dict[str, EntitySafetyResult]:
    """Accept normalized maps or locked Phase 4 master catalog rows.

    Normalized maps require their corresponding *_assessment_complete field.
    Raw catalog known_contains_* flags are adapted without modifying data.
    Raw dietary labels are candidates, not verified compatibility; callers
    need an explicit assessed dietary_map to permit a restricted diet.
    """
    results = {}
    for entity in entities:
        eid = entity.get("entity_id") or entity.get("planner_entity_id", "UNKNOWN")
        ename = entity.get("entity_name") or entity.get("entity_name_en", "Unnamed")
        allergy = check_entity_allergen_safety(
            eid, ename, entity.get("allergen_map", _catalog_allergen_map(entity)), user_allergens,
            allergen_assessment_complete=entity.get("allergen_assessment_complete"),
        )
        dietary = check_entity_dietary_safety(
            eid, ename, entity.get("dietary_map", _catalog_dietary_map(entity)), user_dietary_classes,
            dietary_assessment_complete=entity.get("dietary_assessment_complete"),
        )
        combined = EntitySafetyResult(
            eid, ename, True,
            excluded_by_allergen=allergy.excluded_by_allergen,
            excluded_by_dietary=dietary.excluded_by_dietary,
            exclusion_reasons=allergy.exclusion_reasons + dietary.exclusion_reasons,
            all_reasons=allergy.all_reasons + dietary.all_reasons,
        )
        if eid in (disliked_entity_ids or []):
            combined.all_reasons.append(SafetyOutcome.EXCLUDED_USER_DISLIKE)
            combined.exclusion_reasons.append(f"{ename} is explicitly disliked by the user.")
        results[eid] = combined.finalize()
    return results


def summarize_safety_filter_results(
    results: Dict[str, EntitySafetyResult],
) -> dict:
    """Return aggregate statistics for a safety filter pass."""
    total = len(results)
    eligible = sum(1 for r in results.values() if r.eligible)
    excluded_allergen = sum(1 for r in results.values() if r.excluded_by_allergen)
    excluded_dietary = sum(1 for r in results.values() if r.excluded_by_dietary)
    excluded_both = sum(
        1
        for r in results.values()
        if r.excluded_by_allergen and r.excluded_by_dietary
    )
    return {
        "total_entities": total,
        "eligible": eligible,
        "excluded_total": total - eligible,
        "excluded_by_allergen": excluded_allergen,
        "excluded_by_dietary": excluded_dietary,
        "excluded_by_both": excluded_both,
    }
