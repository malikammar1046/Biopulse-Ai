"""
Canonical Screening Inputs & Hash Generation for BioPulse Screening Assessments.

Deterministic serialization:
- Sorted canonical feature keys
- Normalized types (floats rounded to stable precision, booleans to 0/1)
- SHA-256 fingerprinting
"""

import hashlib
import json
from typing import Any, Dict


FEMALE_TIER1_CANONICAL_KEYS = [
    "age",
    "weight_kg",
    "height_cm",
    "bmi",
    "cycle_regularity",
    "cycle_length_raw",
    "marriage_years",
    "pregnant",
    "abortions",
    "weight_gain",
    "hirsutism",
    "skin_darkening",
    "hair_loss",
    "pimples_acne",
    "fast_food",
    "regular_exercise",
]

MALE_TIER1_CANONICAL_KEYS = [
    "age",
    "height_cm",
    "weight_kg",
    "bmi",
    "waist_cm",
    "low_energy",
    "sleep_trouble",
    "low_mood",
    "low_interest",
    "high_blood_pressure",
    "diabetes",
]


def _normalize_num(val: Any, default: float = 0.0, precision: int = 2) -> float:
    if val is None or str(val).strip() == "":
        return default
    try:
        return round(float(val), precision)
    except (ValueError, TypeError):
        return default


def _normalize_flag(val: Any) -> int:
    if val is None:
        return 0
    if isinstance(val, (bool, int, float)):
        return 1 if val else 0
    s = str(val).strip().lower()
    return 1 if s in ("1", "true", "yes", "y", "frequent", "daily", "often", "severe", "moderate") else 0


def extract_canonical_tier1_inputs(raw: Dict[str, Any], module: str = "female_pcos") -> Dict[str, Any]:
    """Extracts and normalizes canonical Tier 1 inputs deterministically."""
    canonical: Dict[str, Any] = {}
    if module == "male_hypogonadism":
        canonical["age"] = _normalize_num(raw.get("age"), 35.0, 1)
        canonical["height_cm"] = _normalize_num(raw.get("height_cm"), 175.0, 1)
        canonical["weight_kg"] = _normalize_num(raw.get("weight_kg"), 75.0, 2)

        # Recompute BMI if possible
        h_m = canonical["height_cm"] / 100.0 if canonical["height_cm"] > 0 else 1.75
        computed_bmi = round(canonical["weight_kg"] / (h_m ** 2), 2)
        canonical["bmi"] = _normalize_num(raw.get("bmi"), computed_bmi, 2)

        canonical["waist_cm"] = _normalize_num(raw.get("waist_cm"), 85.0, 1)
        for flag in ["low_energy", "sleep_trouble", "low_mood", "low_interest", "high_blood_pressure", "diabetes"]:
            canonical[flag] = _normalize_flag(raw.get(flag))
    else:
        canonical["age"] = _normalize_num(raw.get("age"), 25.0, 1)
        canonical["weight_kg"] = _normalize_num(raw.get("weight_kg") or raw.get("weight"), 60.0, 2)
        canonical["height_cm"] = _normalize_num(raw.get("height_cm") or raw.get("height"), 160.0, 1)

        h_m = canonical["height_cm"] / 100.0 if canonical["height_cm"] > 0 else 1.6
        computed_bmi = round(canonical["weight_kg"] / (h_m ** 2), 2)
        canonical["bmi"] = _normalize_num(raw.get("bmi"), computed_bmi, 2)

        canonical["cycle_regularity"] = _normalize_flag(
            raw.get("cycle_regularity") if raw.get("cycle_regularity") is not None else raw.get("period_regularity")
        )
        canonical["cycle_length_raw"] = _normalize_num(
            raw.get("cycle_length_raw") if raw.get("cycle_length_raw") is not None else raw.get("cycle_length"),
            28.0,
            1,
        )
        canonical["marriage_years"] = _normalize_num(raw.get("marriage_years"), 0.0, 1)
        canonical["pregnant"] = _normalize_flag(
            raw.get("pregnant") if raw.get("pregnant") is not None else raw.get("pregnancy")
        )
        canonical["abortions"] = _normalize_num(raw.get("abortions") or raw.get("abortionsCount"), 0.0, 0)

        for flag in [
            "weight_gain",
            "hirsutism",
            "skin_darkening",
            "hair_loss",
            "pimples_acne",
            "fast_food",
            "regular_exercise",
        ]:
            canonical[flag] = _normalize_flag(raw.get(flag))

    return canonical


def compute_canonical_input_hash(raw: Dict[str, Any], module: str = "female_pcos") -> str:
    """Computes a deterministic SHA-256 fingerprint for canonical screening inputs."""
    canonical = extract_canonical_tier1_inputs(raw, module=module)
    serialized = json.dumps(canonical, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(serialized.encode("utf-8")).hexdigest()
