"""
OvaSense — Data Quality Engine.

Before running ML inference we assess whether the patient has logged enough
data for a meaningful prediction.  If data quality is insufficient, we return
`risk_pattern = insufficient_data` and skip the ML model entirely.

This prevents the model from making misleading predictions based on a handful
of days of data.

Data quality levels:
  good               — enough data for confident inference
  limited            — some data, prediction available but low confidence
  insufficient_data  — too little data, skip ML entirely

Thresholds (conservative for a health-monitoring context):
  - At least 2 cycle records   OR
  - At least 14 days of symptom/activity logs
  -> qualifies for `limited`

  - At least 3 cycle records  AND at least 30 days of other logs
  -> qualifies for `good`
"""

from __future__ import annotations
from dataclasses import dataclass, field
from datetime import datetime, timezone
import logging

logger = logging.getLogger(__name__)


@dataclass
class DataQualityReport:
    # Record counts
    total_records: int = 0
    cycle_records: int = 0
    symptom_records: int = 0
    food_records: int = 0
    fitness_records: int = 0
    water_records: int = 0
    medication_records: int = 0
    medication_log_records: int = 0
    lab_records: int = 0

    # Temporal span
    date_span_days: int = 0

    # Feature coverage
    missing_features: list[str] = field(default_factory=list)
    available_features: list[str] = field(default_factory=list)

    # Composite quality
    completeness_percentage: float = 0.0
    quality_level: str = "insufficient_data"  # good | limited | insufficient_data

    def to_dict(self) -> dict:
        return {
            "total_records": self.total_records,
            "cycle_records": self.cycle_records,
            "symptom_records": self.symptom_records,
            "food_records": self.food_records,
            "fitness_records": self.fitness_records,
            "water_records": self.water_records,
            "medication_records": self.medication_records,
            "medication_log_records": self.medication_log_records,
            "lab_records": self.lab_records,
            "date_span_days": self.date_span_days,
            "missing_features": self.missing_features,
            "available_features": self.available_features,
            "completeness_percentage": round(self.completeness_percentage, 1),
            "quality_level": self.quality_level,
        }


# The canonical ordered feature list — matches exactly what the ML model expects
FEATURE_NAMES: list[str] = [
    # === Cycle features ===
    "cycle_length_mean",           # mean days between period starts
    "cycle_length_variability",    # std of cycle lengths
    "cycle_irregularity_rate",     # fraction of cycles outside 21-35 day normal range
    "cycle_record_count",          # how many cycles have been logged

    # === Symptom features ===
    "symptom_total_count",         # total symptoms logged in window
    "symptom_severity_mean",       # mean severity (1=mild, 2=moderate, 3=severe)
    "fatigue_frequency",           # fraction of logged days with fatigue
    "pelvic_pain_frequency",       # fraction with pelvic pain
    "acne_frequency",              # fraction with acne
    "mood_symptom_frequency",      # fraction with mood symptoms
    "hirsutism_frequency",         # fraction with hirsutism/excess hair symptoms

    # === Lifestyle features ===
    "average_water_intake_glasses", # mean daily water glasses
    "average_sleep_hours",          # from profile
    "average_daily_movement_mins",  # mean daily fitness minutes
    "workout_frequency_per_week",   # workouts per week
    "food_logging_frequency",       # days with food logs / total days in window

    # === Medication features ===
    "medication_adherence_rate",    # taken / (taken + missed) over 90 days
    "active_prescription_count",    # number of active medications

    # === Lab biomarker features (NaN if not available) ===
    "homa_ir_value",                # HOMA-IR if present (higher = insulin resistance)
    "vitamin_d_value",              # Vitamin D level
    "testosterone_value",           # Total testosterone
    "lh_fsh_ratio",                 # LH:FSH ratio
]

FEATURE_COUNT = len(FEATURE_NAMES)


def _parse_date(date_str: str | None) -> datetime | None:
    """Attempt to parse a date string in various formats."""
    if not date_str:
        return None
    for fmt in ("%Y-%m-%d", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%dT%H:%M:%S.%f",
                "%Y-%m-%dT%H:%M:%SZ", "%Y-%m-%dT%H:%M:%S.%fZ"):
        try:
            return datetime.strptime(date_str[:len(fmt) + 2], fmt).replace(tzinfo=timezone.utc)
        except ValueError:
            continue
    return None


def calculate_data_quality(health_data) -> DataQualityReport:
    """
    Assess data quality from a PatientHealthData object.

    Args:
        health_data: PatientHealthData from supabase_health_service

    Returns:
        DataQualityReport with quality_level classification
    """
    report = DataQualityReport()

    # Record counts
    report.cycle_records = len(health_data.cycle_records)
    report.symptom_records = len(health_data.symptom_records)
    report.food_records = len(health_data.food_logs)
    report.fitness_records = len(health_data.fitness_logs)
    report.water_records = len(health_data.water_logs)
    report.medication_records = len(health_data.medications)
    report.medication_log_records = len(health_data.medication_logs)
    report.lab_records = len(health_data.report_results)

    report.total_records = (
        report.cycle_records
        + report.symptom_records
        + report.food_records
        + report.fitness_records
        + report.water_records
        + report.medication_log_records
        + report.lab_records
    )

    # Date span: earliest to latest entry across all tables
    all_dates: list[datetime] = []

    for r in health_data.cycle_records:
        d = _parse_date(r.period_start_date)
        if d:
            all_dates.append(d)

    for r in health_data.symptom_records:
        d = _parse_date(r.occurred_at)
        if d:
            all_dates.append(d)

    for r in health_data.food_logs:
        d = _parse_date(r.logged_at)
        if d:
            all_dates.append(d)

    for r in health_data.fitness_logs:
        d = _parse_date(r.occurred_at)
        if d:
            all_dates.append(d)

    for r in health_data.water_logs:
        d = _parse_date(r.logged_date)
        if d:
            all_dates.append(d)

    if len(all_dates) >= 2:
        report.date_span_days = (max(all_dates) - min(all_dates)).days
    elif len(all_dates) == 1:
        report.date_span_days = 1

    # Feature availability assessment
    available: list[str] = []
    missing: list[str] = []

    def check(feature: str, condition: bool) -> None:
        if condition:
            available.append(feature)
        else:
            missing.append(feature)

    # Cycle features
    check("cycle_length_mean", report.cycle_records >= 2)
    check("cycle_length_variability", report.cycle_records >= 3)
    check("cycle_irregularity_rate", report.cycle_records >= 2)
    check("cycle_record_count", report.cycle_records >= 1)

    # Symptom features
    has_symptoms = report.symptom_records >= 5
    check("symptom_total_count", has_symptoms)
    check("symptom_severity_mean", has_symptoms)
    check("fatigue_frequency", has_symptoms)
    check("pelvic_pain_frequency", has_symptoms)
    check("acne_frequency", has_symptoms)
    check("mood_symptom_frequency", has_symptoms)
    check("hirsutism_frequency", has_symptoms)

    # Lifestyle from profile
    profile = health_data.profile
    check("average_water_intake_glasses", profile.daily_water_glasses is not None)
    check("average_sleep_hours", profile.sleep_hours is not None)
    check("average_daily_movement_mins", report.fitness_records >= 3)
    check("workout_frequency_per_week", report.fitness_records >= 3)
    check("food_logging_frequency", report.food_records >= 5)

    # Medication adherence
    check("medication_adherence_rate", report.medication_log_records >= 5)
    check("active_prescription_count", report.medication_records >= 0)  # always ok (can be 0)

    # Lab biomarkers (optional — NaN if absent)
    lab_test_names = {r.test_name.lower() for r in health_data.report_results}

    def has_lab(*keywords: str) -> bool:
        return any(
            any(kw in name for kw in keywords)
            for name in lab_test_names
        )

    check("homa_ir_value", has_lab("homa", "insulin"))
    check("vitamin_d_value", has_lab("vitamin d", "25-oh", "25oh"))
    check("testosterone_value", has_lab("testosterone"))
    check("lh_fsh_ratio", has_lab("lh", "fsh"))

    report.available_features = available
    report.missing_features = missing

    # Completeness percentage (lab features are optional bonus)
    core_feature_count = FEATURE_COUNT - 4  # exclude 4 lab features as optional
    core_available = len([f for f in available if f not in (
        "homa_ir_value", "vitamin_d_value", "testosterone_value", "lh_fsh_ratio"
    )])
    report.completeness_percentage = (core_available / core_feature_count) * 100.0

    # Classify quality level
    has_core_data = (
        report.cycle_records >= 1
        or report.symptom_records >= 5
        or (report.fitness_records >= 3 and report.food_records >= 5)
    )
    has_minimal_span = report.date_span_days >= 7
    has_good_cycle = report.cycle_records >= 3
    has_good_lifestyle = (
        report.symptom_records >= 14
        and report.date_span_days >= 30
    )

    if has_good_cycle and (has_good_lifestyle or report.date_span_days >= 30):
        report.quality_level = "good"
    elif has_core_data and has_minimal_span:
        report.quality_level = "limited"
    else:
        report.quality_level = "insufficient_data"

    logger.debug(
        "Data quality for patient: %s records, %d days, level=%s",
        report.total_records,
        report.date_span_days,
        report.quality_level,
    )

    return report
