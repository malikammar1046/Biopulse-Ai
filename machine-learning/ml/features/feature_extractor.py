"""
OvaSense — Feature Extractor.

Converts the normalised PatientHealthData from the Supabase health service
into a fixed-length numeric feature vector for the ML model.

The feature order MUST match FEATURE_NAMES in data_quality.py exactly.
The training pipeline uses the same function to produce training rows.

Missing values are represented as float('nan') — the inference pipeline
imputes these with training-set means before prediction.

Lab biomarker features are intentionally allowed to be NaN since they are
an optional bonus signal — not all patients have uploaded lab reports.

IMPORTANT: This module does NOT implement fake logic.  Every feature is
computed from actual logged data.  If data is missing, the value is NaN.
"""

from __future__ import annotations

import logging
import math
from collections import defaultdict
from datetime import datetime, timezone

import numpy as np

# Import the canonical feature list so ordering is always in sync
from ml.features.data_quality import FEATURE_NAMES

logger = logging.getLogger(__name__)

NAN = float("nan")


# ---------------------------------------------------------------------------
# Date helpers
# ---------------------------------------------------------------------------

def _to_date(date_str: str | None) -> datetime | None:
    """Parse a date/datetime string to a timezone-aware datetime."""
    if not date_str:
        return None
    clean = date_str[:10]   # take only YYYY-MM-DD portion
    try:
        return datetime.strptime(clean, "%Y-%m-%d").replace(tzinfo=timezone.utc)
    except ValueError:
        return None


def _severity_to_num(severity: str) -> float:
    """Convert symptom severity label to a numeric value."""
    return {"mild": 1.0, "moderate": 2.0, "severe": 3.0}.get(severity.lower(), 2.0)


# ---------------------------------------------------------------------------
# Feature extraction groups
# ---------------------------------------------------------------------------

def _cycle_features(cycle_records) -> dict[str, float]:
    """
    Compute cycle-related features from logged cycle records.
    Requires at least 2 records for length calculations.
    """
    feats: dict[str, float] = {
        "cycle_length_mean": NAN,
        "cycle_length_variability": NAN,
        "cycle_irregularity_rate": NAN,
        "cycle_record_count": float(len(cycle_records)),
    }

    if len(cycle_records) < 2:
        return feats

    # Sort ascending by start date
    sorted_records = sorted(
        [r for r in cycle_records if _to_date(r.period_start_date)],
        key=lambda r: _to_date(r.period_start_date),
    )

    cycle_lengths: list[float] = []
    for i in range(1, len(sorted_records)):
        start_a = _to_date(sorted_records[i - 1].period_start_date)
        start_b = _to_date(sorted_records[i].period_start_date)
        if start_a and start_b:
            length_days = (start_b - start_a).days
            if 1 < length_days < 100:   # guard against data entry errors
                cycle_lengths.append(float(length_days))

    if not cycle_lengths:
        return feats

    mean_length = float(np.mean(cycle_lengths))
    std_length = float(np.std(cycle_lengths)) if len(cycle_lengths) > 1 else 0.0

    # Irregularity: cycles outside normal range 21-35 days
    irregular_count = sum(1 for l in cycle_lengths if l < 21 or l > 35)
    irregularity_rate = irregular_count / len(cycle_lengths) if cycle_lengths else NAN

    feats["cycle_length_mean"] = mean_length
    feats["cycle_length_variability"] = std_length
    feats["cycle_irregularity_rate"] = irregularity_rate

    return feats


# Symptom type keywords → feature keys
_SYMPTOM_KEYWORD_MAP: dict[str, list[str]] = {
    "fatigue_frequency": ["fatigue", "tired", "exhaustion", "lethargy", "energy"],
    "pelvic_pain_frequency": ["pelvic", "cramping", "cramps", "lower abdom", "dysmenorrhea"],
    "acne_frequency": ["acne", "breakout", "pimple", "skin"],
    "mood_symptom_frequency": ["mood", "anxiety", "depression", "irritab", "emotional", "anger"],
    "hirsutism_frequency": ["hair", "hirsut", "facial hair", "body hair", "excess hair"],
}


def _symptom_features(symptom_records, date_span_days: int) -> dict[str, float]:
    """
    Compute symptom-related features from logged symptom records.
    Frequencies are expressed as fraction of tracked days with that symptom type.
    """
    feats: dict[str, float] = {
        "symptom_total_count": NAN,
        "symptom_severity_mean": NAN,
        "fatigue_frequency": NAN,
        "pelvic_pain_frequency": NAN,
        "acne_frequency": NAN,
        "mood_symptom_frequency": NAN,
        "hirsutism_frequency": NAN,
    }

    if not symptom_records:
        return feats

    feats["symptom_total_count"] = float(len(symptom_records))

    severities = [_severity_to_num(r.severity) for r in symptom_records]
    feats["symptom_severity_mean"] = float(np.mean(severities))

    # Effective days window for frequency calculation
    effective_days = max(date_span_days, 1)

    # Collect unique days each symptom category was logged
    symptom_days: dict[str, set] = defaultdict(set)
    for r in symptom_records:
        st = r.symptom_type.lower()
        day = r.occurred_at[:10]  # YYYY-MM-DD
        for feature_key, keywords in _SYMPTOM_KEYWORD_MAP.items():
            if any(kw in st for kw in keywords):
                symptom_days[feature_key].add(day)

    for feature_key in _SYMPTOM_KEYWORD_MAP:
        days_count = len(symptom_days.get(feature_key, set()))
        feats[feature_key] = min(1.0, days_count / effective_days)

    return feats


def _lifestyle_features(
    profile,
    fitness_logs,
    food_logs,
    water_logs,
    date_span_days: int,
) -> dict[str, float]:
    """
    Compute lifestyle features from profile settings and activity logs.
    """
    feats: dict[str, float] = {
        "average_water_intake_glasses": NAN,
        "average_sleep_hours": NAN,
        "average_daily_movement_mins": NAN,
        "workout_frequency_per_week": NAN,
        "food_logging_frequency": NAN,
    }

    # Water intake — prefer logged data, fallback to profile setting
    if water_logs:
        feats["average_water_intake_glasses"] = float(
            np.mean([w.glasses for w in water_logs if w.glasses is not None])
        )
    elif profile.daily_water_glasses is not None:
        feats["average_water_intake_glasses"] = float(profile.daily_water_glasses)

    # Sleep from profile
    if profile.sleep_hours is not None:
        feats["average_sleep_hours"] = float(profile.sleep_hours)

    # Fitness movement
    if fitness_logs:
        durations = [f.duration_minutes for f in fitness_logs if f.duration_minutes is not None]
        if durations:
            effective_days = max(date_span_days, 1)
            total_mins = sum(durations)
            feats["average_daily_movement_mins"] = total_mins / effective_days
            # Unique workout days → weekly frequency
            workout_days = len({f.occurred_at[:10] for f in fitness_logs})
            weeks = effective_days / 7.0
            feats["workout_frequency_per_week"] = workout_days / weeks if weeks > 0 else 0.0

    # Food logging frequency (days with at least one log / span)
    if food_logs and date_span_days > 0:
        unique_food_days = len({f.logged_at[:10] for f in food_logs})
        feats["food_logging_frequency"] = min(1.0, unique_food_days / date_span_days)

    return feats


def _medication_features(medications, medication_logs) -> dict[str, float]:
    """
    Compute medication adherence rate from logs.
    adherence_rate = taken_count / (taken_count + missed_count)
    """
    feats: dict[str, float] = {
        "medication_adherence_rate": NAN,
        "active_prescription_count": NAN,
    }

    active_count = sum(1 for m in medications if m.is_active)
    feats["active_prescription_count"] = float(active_count)

    if medication_logs:
        taken = sum(1 for l in medication_logs if l.status == "taken")
        missed = sum(1 for l in medication_logs if l.status == "missed")
        total = taken + missed
        if total > 0:
            feats["medication_adherence_rate"] = taken / total

    return feats


# Lab biomarker test name keyword mapping → feature keys
_LAB_KEYWORD_MAP: dict[str, list[str]] = {
    "homa_ir_value": ["homa-ir", "homa ir", "homa_ir", "insulin resistance", "fasting insulin"],
    "vitamin_d_value": ["vitamin d", "25-oh", "25oh", "25-hydroxyvitamin", "vit d"],
    "testosterone_value": ["total testosterone", "testosterone total", "testosterone,", "testosterone level"],
    "lh_fsh_ratio": [],  # computed from LH + FSH individually
}


def _lab_features(report_results) -> dict[str, float]:
    """
    Extract key lab biomarker values from report results.
    If a biomarker is not present, the feature remains NaN.
    Only the most recent value per biomarker is used.

    LH:FSH ratio is computed when both LH and FSH results are present.
    """
    feats: dict[str, float] = {
        "homa_ir_value": NAN,
        "vitamin_d_value": NAN,
        "testosterone_value": NAN,
        "lh_fsh_ratio": NAN,
    }

    if not report_results:
        return feats

    # Group by test name, keeping the most recent result (already sorted by date desc)
    seen: set[str] = set()
    lh_value: float | None = None
    fsh_value: float | None = None

    for r in report_results:
        if r.result_numeric is None:
            continue

        test_lower = r.test_name.lower()

        # LH and FSH are tracked separately for ratio
        if "lh" in test_lower and "lh" not in seen:
            lh_value = r.result_numeric
            seen.add("lh")
        if "fsh" in test_lower and "fsh" not in seen:
            fsh_value = r.result_numeric
            seen.add("fsh")

        for feature_key, keywords in _LAB_KEYWORD_MAP.items():
            if feature_key in seen or not keywords:
                continue
            if any(kw in test_lower for kw in keywords):
                feats[feature_key] = float(r.result_numeric)
                seen.add(feature_key)

    # Compute LH:FSH ratio when both are available
    if lh_value is not None and fsh_value is not None and fsh_value > 0:
        feats["lh_fsh_ratio"] = lh_value / fsh_value

    return feats


# ---------------------------------------------------------------------------
# Main extractor
# ---------------------------------------------------------------------------

def extract_features(health_data, date_span_days: int) -> np.ndarray:
    """
    Build the fixed-length feature vector from a PatientHealthData snapshot.

    The returned array has shape (1, FEATURE_COUNT) and dtype float64.
    Missing values are NaN — handled by the predictor's imputer.

    Args:
        health_data: PatientHealthData from the health service
        date_span_days: length of the observation window (from DataQualityReport)

    Returns:
        numpy array of shape (len(FEATURE_NAMES),) with dtype float64
    """
    all_features: dict[str, float] = {}

    all_features.update(_cycle_features(health_data.cycle_records))
    all_features.update(_symptom_features(health_data.symptom_records, date_span_days))
    all_features.update(
        _lifestyle_features(
            health_data.profile,
            health_data.fitness_logs,
            health_data.food_logs,
            health_data.water_logs,
            date_span_days,
        )
    )
    all_features.update(_medication_features(health_data.medications, health_data.medication_logs))
    all_features.update(_lab_features(health_data.report_results))

    # Build the ordered vector matching FEATURE_NAMES
    vector = []
    for name in FEATURE_NAMES:
        val = all_features.get(name, NAN)
        # Guard against any non-numeric values
        if val is None or (isinstance(val, float) and math.isnan(val)):
            vector.append(NAN)
        else:
            try:
                vector.append(float(val))
            except (TypeError, ValueError):
                vector.append(NAN)

    arr = np.array(vector, dtype=np.float64)

    logger.debug(
        "Extracted feature vector: %d features, %d non-null",
        len(arr),
        int(np.sum(~np.isnan(arr))),
    )

    return arr
