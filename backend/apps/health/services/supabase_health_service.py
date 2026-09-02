"""
OvaSense Supabase Health Data Repository.

This service is the single point of contact between Django and the Supabase
health data store.  ALL queries are scoped to the authenticated patient UUID —
it is impossible for a caller to retrieve another patient's data through this
service as long as they supply the correct authenticated user_id.

The service uses the Supabase Python client with the SERVICE_ROLE_KEY so it
can bypass row-level security for server-to-server reads.  This is intentional
and safe because:
  1. The service key is only present in the Django backend environment.
  2. Every query explicitly filters on user_id = patient_uuid.
  3. The service key is NEVER returned to or exposed in any API response.

Tables accessed (matching the existing Supabase schema):
  - profiles
  - cycle_records
  - symptom_records
  - medical_reports
  - report_results
  - food_logs
  - water_logs
  - fitness_logs
  - medications
  - medication_logs
  - appointments
"""

import logging
import os
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from typing import Any

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Normalised data containers — raw Supabase dicts never leak out of this module
# ---------------------------------------------------------------------------

@dataclass
class PatientProfile:
    user_id: str
    height_cm: float | None = None
    weight_kg: float | None = None
    date_of_birth: str | None = None
    cycle_length: str | None = None        # e.g. "28" or "irregular"
    period_duration: int | None = None
    last_period_date: str | None = None
    period_regularity: str | None = None   # "regular" | "irregular" | "very_irregular"
    common_symptoms: list[str] = field(default_factory=list)
    activity_level: str | None = None
    sleep_hours: float | None = None
    daily_water_glasses: int | None = None
    dietary_preference: str | None = None
    conditions: list[str] = field(default_factory=list)
    medications_profile: list[str] = field(default_factory=list)


@dataclass
class CycleRecordData:
    id: str
    period_start_date: str
    period_end_date: str | None
    flow: str | None
    created_at: str


@dataclass
class SymptomRecordData:
    id: str
    symptom_type: str
    category: str
    severity: str      # mild | moderate | severe
    occurred_at: str
    cycle_day: int | None


@dataclass
class FoodLogData:
    id: str
    meal_type: str
    food_name: str
    calories: float | None
    protein_g: float | None
    carbs_g: float | None
    fat_g: float | None
    logged_at: str


@dataclass
class WaterLogData:
    id: str
    glasses: int
    logged_date: str


@dataclass
class FitnessLogData:
    id: str
    activity_type: str
    duration_minutes: int | None
    occurred_at: str


@dataclass
class MedicationData:
    id: str
    name: str
    frequency: str
    is_active: bool
    start_date: str | None


@dataclass
class MedicationLogData:
    id: str
    medication_id: str
    status: str          # taken | missed | skipped
    scheduled_for: str


@dataclass
class ReportResultData:
    id: str
    report_id: str
    test_name: str
    result_numeric: float | None
    unit: str
    reference_low: float | None
    reference_high: float | None
    status: str          # normal | high | low | critical
    report_date: str | None


@dataclass
class PatientHealthData:
    """
    Complete normalised health snapshot for a patient.
    This is what the intelligence orchestrator receives.
    """
    profile: PatientProfile
    cycle_records: list[CycleRecordData] = field(default_factory=list)
    symptom_records: list[SymptomRecordData] = field(default_factory=list)
    food_logs: list[FoodLogData] = field(default_factory=list)
    water_logs: list[WaterLogData] = field(default_factory=list)
    fitness_logs: list[FitnessLogData] = field(default_factory=list)
    medications: list[MedicationData] = field(default_factory=list)
    medication_logs: list[MedicationLogData] = field(default_factory=list)
    report_results: list[ReportResultData] = field(default_factory=list)
    fetch_errors: list[str] = field(default_factory=list)


# ---------------------------------------------------------------------------
# Supabase client factory
# ---------------------------------------------------------------------------

def _get_supabase_client():
    """
    Create a Supabase client using SERVICE_ROLE_KEY (preferred) or ANON_KEY (fallback).
    The service role key must never be returned in API responses or logs.
    """
    from supabase import create_client, Client

    url: str = os.environ.get("SUPABASE_URL", "") or os.environ.get("VITE_SUPABASE_URL", "")
    key: str = (
        os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
        or os.environ.get("SUPABASE_ANON_KEY", "")
        or os.environ.get("VITE_SUPABASE_ANON_KEY", "")
    )

    if not url or not key:
        raise RuntimeError(
            "Supabase credentials not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY."
        )

    return create_client(url, key)


# ---------------------------------------------------------------------------
# Cutoff date helper
# ---------------------------------------------------------------------------

def _cutoff_date(days: int = 180) -> str:
    """Return an ISO date string N days in the past (used to scope queries)."""
    return (datetime.now(timezone.utc) - timedelta(days=days)).date().isoformat()


# ---------------------------------------------------------------------------
# Main health data repository
# ---------------------------------------------------------------------------

class SupabaseHealthService:
    """
    Centralised repository for reading patient health data from Supabase.

    All methods accept a patient_uuid (str) and scope every query to that UUID.
    The caller must supply the authenticated user's UUID from the verified JWT —
    never from user-supplied request data.
    """

    def __init__(self):
        self._client = None   # lazy initialised

    def _client_or_raise(self, auth_token: str | None = None):
        if self._client is None:
            self._client = _get_supabase_client()
        if auth_token:
            try:
                self._client.postgrest.auth(auth_token)
            except Exception as e:
                logger.debug("Could not set postgrest auth: %s", e)
        return self._client

    # ------------------------------------------------------------------
    # Profile
    # ------------------------------------------------------------------

    def fetch_profile(self, patient_uuid: str, auth_token: str | None = None) -> PatientProfile:
        try:
            client = self._client_or_raise(auth_token)
            res = (
                client.table("profiles")
                .select(
                    "id,height_cm,weight_kg,date_of_birth,cycle_length,"
                    "period_duration,last_period_date,period_regularity,"
                    "common_symptoms,activity_level,sleep_hours,"
                    "daily_water_glasses,dietary_preference,conditions,medications"
                )
                .eq("id", patient_uuid)
                .maybe_single()
                .execute()
            )
            row: dict[str, Any] = res.data or {}
        except Exception as exc:
            logger.warning("profile fetch failed for %s: %s", patient_uuid, exc)
            row = {}

        def _safe_list(val) -> list:
            if isinstance(val, list):
                return val
            return []

        def _extract_med_names(meds) -> list[str]:
            if not isinstance(meds, list):
                return []
            names = []
            for m in meds:
                if isinstance(m, dict) and m.get("name"):
                    names.append(m["name"])
                elif isinstance(m, str):
                    names.append(m)
            return names

        return PatientProfile(
            user_id=patient_uuid,
            height_cm=row.get("height_cm"),
            weight_kg=row.get("weight_kg"),
            date_of_birth=row.get("date_of_birth"),
            cycle_length=row.get("cycle_length"),
            period_duration=row.get("period_duration"),
            last_period_date=row.get("last_period_date"),
            period_regularity=row.get("period_regularity"),
            common_symptoms=_safe_list(row.get("common_symptoms")),
            activity_level=row.get("activity_level"),
            sleep_hours=row.get("sleep_hours"),
            daily_water_glasses=row.get("daily_water_glasses"),
            dietary_preference=row.get("dietary_preference"),
            conditions=_safe_list(row.get("conditions")),
            medications_profile=_extract_med_names(row.get("medications")),
        )

    # ------------------------------------------------------------------
    # Cycle records
    # ------------------------------------------------------------------

    def fetch_cycle_records(self, patient_uuid: str, days: int = 365, auth_token: str | None = None) -> list[CycleRecordData]:
        try:
            client = self._client_or_raise(auth_token)
            res = (
                client.table("cycle_records")
                .select("id,period_start_date,period_end_date,flow,created_at")
                .eq("user_id", patient_uuid)
                .gte("period_start_date", _cutoff_date(days))
                .order("period_start_date", desc=True)
                .limit(100)
                .execute()
            )
            rows = res.data or []
        except Exception as exc:
            logger.warning("cycle_records fetch failed: %s", exc)
            return []

        return [
            CycleRecordData(
                id=r["id"],
                period_start_date=r.get("period_start_date", ""),
                period_end_date=r.get("period_end_date"),
                flow=r.get("flow"),
                created_at=r.get("created_at", ""),
            )
            for r in rows
        ]

    # ------------------------------------------------------------------
    # Symptom records
    # ------------------------------------------------------------------

    def fetch_symptom_records(self, patient_uuid: str, days: int = 180, auth_token: str | None = None) -> list[SymptomRecordData]:
        try:
            client = self._client_or_raise(auth_token)
            res = (
                client.table("symptom_records")
                .select("id,symptom_type,category,severity,occurred_at,cycle_day")
                .eq("user_id", patient_uuid)
                .gte("occurred_at", _cutoff_date(days))
                .order("occurred_at", desc=True)
                .limit(500)
                .execute()
            )
            rows = res.data or []
        except Exception as exc:
            logger.warning("symptom_records fetch failed: %s", exc)
            return []

        return [
            SymptomRecordData(
                id=r["id"],
                symptom_type=r.get("symptom_type", ""),
                category=r.get("category", "other"),
                severity=r.get("severity", "moderate"),
                occurred_at=r.get("occurred_at", ""),
                cycle_day=r.get("cycle_day"),
            )
            for r in rows
        ]

    # ------------------------------------------------------------------
    # Food logs
    # ------------------------------------------------------------------

    def fetch_food_logs(self, patient_uuid: str, days: int = 90, auth_token: str | None = None) -> list[FoodLogData]:
        try:
            client = self._client_or_raise(auth_token)
            res = (
                client.table("food_logs")
                .select("id,meal_type,food_name,calories,protein_g,carbs_g,fat_g,logged_at")
                .eq("user_id", patient_uuid)
                .gte("logged_at", _cutoff_date(days))
                .order("logged_at", desc=True)
                .limit(500)
                .execute()
            )
            rows = res.data or []
        except Exception as exc:
            logger.warning("food_logs fetch failed: %s", exc)
            return []

        return [
            FoodLogData(
                id=r["id"],
                meal_type=r.get("meal_type", ""),
                food_name=r.get("food_name", ""),
                calories=r.get("calories"),
                protein_g=r.get("protein_g"),
                carbs_g=r.get("carbs_g"),
                fat_g=r.get("fat_g"),
                logged_at=r.get("logged_at", ""),
            )
            for r in rows
        ]

    # ------------------------------------------------------------------
    # Water logs
    # ------------------------------------------------------------------

    def fetch_water_logs(self, patient_uuid: str, days: int = 90, auth_token: str | None = None) -> list[WaterLogData]:
        try:
            client = self._client_or_raise(auth_token)
            res = (
                client.table("water_logs")
                .select("id,glasses,logged_date")
                .eq("user_id", patient_uuid)
                .gte("logged_date", _cutoff_date(days))
                .order("logged_date", desc=True)
                .limit(200)
                .execute()
            )
            rows = res.data or []
        except Exception as exc:
            logger.warning("water_logs fetch failed: %s", exc)
            return []

        return [
            WaterLogData(
                id=r["id"],
                glasses=int(r.get("glasses", 0)),
                logged_date=r.get("logged_date", ""),
            )
            for r in rows
        ]

    # ------------------------------------------------------------------
    # Fitness logs
    # ------------------------------------------------------------------

    def fetch_fitness_logs(self, patient_uuid: str, days: int = 90, auth_token: str | None = None) -> list[FitnessLogData]:
        try:
            client = self._client_or_raise(auth_token)
            res = (
                client.table("fitness_logs")
                .select("id,activity_type,duration_minutes,occurred_at")
                .eq("user_id", patient_uuid)
                .gte("occurred_at", _cutoff_date(days))
                .order("occurred_at", desc=True)
                .limit(500)
                .execute()
            )
            rows = res.data or []
        except Exception as exc:
            logger.warning("fitness_logs fetch failed: %s", exc)
            return []

        return [
            FitnessLogData(
                id=r["id"],
                activity_type=r.get("activity_type", ""),
                duration_minutes=r.get("duration_minutes"),
                occurred_at=r.get("occurred_at", ""),
            )
            for r in rows
        ]

    # ------------------------------------------------------------------
    # Medications
    # ------------------------------------------------------------------

    def fetch_medications(self, patient_uuid: str, auth_token: str | None = None) -> list[MedicationData]:
        try:
            client = self._client_or_raise(auth_token)
            res = (
                client.table("medications")
                .select("id,name,frequency,is_active,start_date")
                .eq("user_id", patient_uuid)
                .execute()
            )
            rows = res.data or []
        except Exception as exc:
            logger.warning("medications fetch failed: %s", exc)
            return []

        return [
            MedicationData(
                id=r["id"],
                name=r.get("name", ""),
                frequency=r.get("frequency", ""),
                is_active=bool(r.get("is_active", True)),
                start_date=r.get("start_date"),
            )
            for r in rows
        ]

    def fetch_medication_logs(self, patient_uuid: str, days: int = 90, auth_token: str | None = None) -> list[MedicationLogData]:
        try:
            client = self._client_or_raise(auth_token)
            res = (
                client.table("medication_logs")
                .select("id,medication_id,status,scheduled_for")
                .eq("user_id", patient_uuid)
                .gte("scheduled_for", _cutoff_date(days))
                .order("scheduled_for", desc=True)
                .limit(1000)
                .execute()
            )
            rows = res.data or []
        except Exception as exc:
            logger.warning("medication_logs fetch failed: %s", exc)
            return []

        return [
            MedicationLogData(
                id=r["id"],
                medication_id=r.get("medication_id", ""),
                status=r.get("status", "taken"),
                scheduled_for=r.get("scheduled_for", ""),
            )
            for r in rows
        ]

    # ------------------------------------------------------------------
    # Lab report results
    # ------------------------------------------------------------------

    def fetch_report_results(self, patient_uuid: str, auth_token: str | None = None) -> list[ReportResultData]:
        """
        Fetch lab biomarker results from medical_reports + report_results.
        Only returns numeric results that can be used for feature engineering.
        """
        try:
            client = self._client_or_raise(auth_token)
            # Join via report_results which references medical_reports
            res = (
                client.table("report_results")
                .select(
                    "id,report_id,test_name,result_numeric,unit,"
                    "reference_low,reference_high,status,"
                    "medical_reports!inner(user_id,report_date)"
                )
                .eq("medical_reports.user_id", patient_uuid)
                .not_.is_("result_numeric", "null")
                .order("medical_reports.report_date", desc=True)
                .limit(200)
                .execute()
            )
            rows = res.data or []
        except Exception as exc:
            logger.warning("report_results fetch failed: %s", exc)
            return []

        results = []
        for r in rows:
            report_info = r.get("medical_reports") or {}
            results.append(
                ReportResultData(
                    id=r["id"],
                    report_id=r.get("report_id", ""),
                    test_name=r.get("test_name", ""),
                    result_numeric=r.get("result_numeric"),
                    unit=r.get("unit", ""),
                    reference_low=r.get("reference_low"),
                    reference_high=r.get("reference_high"),
                    status=r.get("status", "normal"),
                    report_date=report_info.get("report_date"),
                )
            )
        return results

    # ------------------------------------------------------------------
    # Aggregate fetch — full health snapshot
    # ------------------------------------------------------------------

    def fetch_all(self, patient_uuid: str, auth_token: str | None = None) -> PatientHealthData:
        """
        Retrieve the complete patient health dataset required for ML inference.
        All sub-fetches are best-effort; failures are logged but don't crash the pipeline.
        """
        errors: list[str] = []

        profile = self.fetch_profile(patient_uuid, auth_token=auth_token)

        def safe(name: str, fn):
            try:
                return fn()
            except Exception as exc:
                logger.error("fetch_all sub-fetch '%s' error: %s", name, exc)
                errors.append(f"{name}: {exc}")
                return []

        return PatientHealthData(
            profile=profile,
            cycle_records=safe("cycle_records", lambda: self.fetch_cycle_records(patient_uuid, auth_token=auth_token)),
            symptom_records=safe("symptom_records", lambda: self.fetch_symptom_records(patient_uuid, auth_token=auth_token)),
            food_logs=safe("food_logs", lambda: self.fetch_food_logs(patient_uuid, auth_token=auth_token)),
            water_logs=safe("water_logs", lambda: self.fetch_water_logs(patient_uuid, auth_token=auth_token)),
            fitness_logs=safe("fitness_logs", lambda: self.fetch_fitness_logs(patient_uuid, auth_token=auth_token)),
            medications=safe("medications", lambda: self.fetch_medications(patient_uuid, auth_token=auth_token)),
            medication_logs=safe("medication_logs", lambda: self.fetch_medication_logs(patient_uuid, auth_token=auth_token)),
            report_results=safe("report_results", lambda: self.fetch_report_results(patient_uuid, auth_token=auth_token)),
            fetch_errors=errors,
        )


# Singleton instance — shared across Django views within a worker process
health_service = SupabaseHealthService()
