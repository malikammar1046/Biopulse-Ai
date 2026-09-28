"""
backend/apps/intelligence/services/observation_repository.py
Authoritative repository for managing immutable patient metric observations.

Provides a unified, reliable longitudinal health observation store across:
- Profile updates (e.g. Weight, Waist, Height saved in Settings)
- Screening assessment snapshots (legacy fallback & model inputs)
- Verified laboratory reports
- Patient symptom logs and cycle records

Primary persistent store: Supabase PostgreSQL (public.patient_metric_observations).
Offline/testing store: Persistent SQLite table (patient_metric_observations) and in-memory cache.
"""

from __future__ import annotations

import json
import logging
import os
import sqlite3
import threading
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from django.conf import settings
from apps.intelligence.services.canonical_metrics import CANONICAL_METRICS, get_metric_definition

logger = logging.getLogger(__name__)

def _is_valid_uuid(val: Any) -> bool:
    try:
        uuid.UUID(str(val))
        return True
    except (ValueError, AttributeError, TypeError):
        return False


def _validate_user_id(user_id: Any) -> str:
    if not user_id:
        raise ValueError("Invalid user_id: user_id cannot be null or empty.")
    uid = str(user_id).strip()
    if not uid or uid.lower() in ("none", "null", "undefined", "default", "guest", "demo-user-id"):
        raise ValueError(f"Invalid user_id '{user_id}': unauthenticated or placeholder identities are prohibited.")
    return uid


_observation_lock = threading.Lock()
_sqlite_observations_initialized = False
# In-memory storage for test suites & mocks: user_id -> list of observation dicts
_in_memory_observations: dict[str, list[dict[str, Any]]] = {}


def _get_sqlite_path() -> str:
    try:
        db_path = settings.DATABASES.get("default", {}).get("NAME")
        if db_path:
            return str(db_path)
    except Exception:
        pass
    default_path = Path(__file__).resolve().parent.parent.parent.parent / "db.sqlite3"
    return str(default_path)


_initialized_observation_db_paths: set[str] = set()
_observation_init_lock = threading.Lock()


class _DjangoSQLiteWrapper:
    def __init__(self, django_conn: Any):
        self._django_conn = django_conn
        self._raw_conn = django_conn.connection

    @property
    def row_factory(self):
        return getattr(self._raw_conn, "row_factory", None)

    @row_factory.setter
    def row_factory(self, val):
        self._raw_conn.row_factory = val

    def cursor(self):
        return self._raw_conn.cursor()

    def execute(self, sql: str, params: Any = ()):
        return self._raw_conn.execute(sql, params)

    def executemany(self, sql: str, seq_of_params: Any):
        return self._raw_conn.executemany(sql, seq_of_params)

    def close(self) -> None:
        pass

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        return False


def _connect_sqlite(db_path: str | None = None, timeout: float = 15.0) -> Any:
    if db_path is None:
        db_path = _get_sqlite_path()
    try:
        from django.db import connection
        default_name = settings.DATABASES.get("default", {}).get("NAME")
        if default_name and str(default_name) == str(db_path):
            connection.ensure_connection()
            if connection.connection:
                return _DjangoSQLiteWrapper(connection)
    except Exception:
        pass
    is_uri = str(db_path).startswith("file:")
    conn = sqlite3.connect(db_path, timeout=timeout, uri=is_uri)
    try:
        conn.execute("PRAGMA busy_timeout = 15000;")
    except Exception:
        pass
    return conn


def init_sqlite_observation_store() -> None:
    """Initializes the local SQLite observation persistence table for offline/test environments."""
    db_path = _get_sqlite_path()
    if db_path in _initialized_observation_db_paths:
        return

    with _observation_init_lock:
        if db_path in _initialized_observation_db_paths:
            return
        conn = _connect_sqlite(db_path, timeout=10.0)
        try:
            with conn:
                conn.execute(
                    """
                    CREATE TABLE IF NOT EXISTS patient_metric_observations (
                        id TEXT PRIMARY KEY,
                        user_id TEXT NOT NULL,
                        module TEXT NOT NULL,
                        metric_key TEXT NOT NULL,
                        value REAL NOT NULL,
                        unit TEXT NOT NULL DEFAULT '',
                        observed_at TEXT NOT NULL,
                        source TEXT NOT NULL,
                        source_record_id TEXT,
                        created_at TEXT NOT NULL
                    )
                    """
                )
                conn.execute(
                    "CREATE INDEX IF NOT EXISTS idx_obs_user_metric_time ON patient_metric_observations(user_id, metric_key, observed_at)"
                )
                conn.execute(
                    "CREATE INDEX IF NOT EXISTS idx_obs_user_module ON patient_metric_observations(user_id, module)"
                )
            # Mark initialized ONLY after successful DDL completion
            _initialized_observation_db_paths.add(db_path)
            logger.info("ObservationRepository persistent SQLite store initialized at %s", db_path)
        except Exception as e:
            logger.warning("Failed to initialize SQLite observation store: %s", e)
        finally:
            conn.close()



_cached_service_client = None
_client_lock = threading.Lock()


def _is_supabase_network_disabled() -> bool:
    return getattr(settings, "DISABLE_SUPABASE_NETWORK", False) or os.environ.get("DISABLE_SUPABASE_NETWORK", "").strip().lower() in ("true", "1", "yes")


def get_supabase_client(auth_token: str | None = None) -> Any:
    """Returns an authenticated Supabase client using service key or caller JWT."""
    global _cached_service_client
    if _is_supabase_network_disabled():
        return None
    if auth_token:
        try:
            from supabase import create_client
            url = os.environ.get("SUPABASE_URL", "") or os.environ.get("VITE_SUPABASE_URL", "")
            key = os.environ.get("SUPABASE_ANON_KEY", "") or os.environ.get("VITE_SUPABASE_ANON_KEY", "")
            if url and key:
                client = create_client(url, key)
                try:
                    client.postgrest.auth(auth_token)
                except Exception:
                    pass
                return client
        except Exception as e:
            logger.debug("Caller Supabase client init error: %s", e)
        return None

    with _client_lock:
        if _cached_service_client is not None:
            return _cached_service_client
        try:
            from supabase import create_client
            url = os.environ.get("SUPABASE_URL", "") or os.environ.get("VITE_SUPABASE_URL", "")
            key = (
                os.environ.get("SUPABASE_SECRET_KEY", "")
                or os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
                or os.environ.get("SUPABASE_ANON_KEY", "")
                or os.environ.get("VITE_SUPABASE_ANON_KEY", "")
            )
            if url and key:
                _cached_service_client = create_client(url, key)
                return _cached_service_client
        except Exception as e:
            logger.debug("Supabase client init error: %s", e)
    return None


class ObservationRepository:
    """
    Authoritative repository managing persistent patient metric observations.
    Ensures that real biometric and clinical updates (e.g. Weight changes in Settings)
    are recorded immutably without overwriting historical measurements or creating duplicates.
    """

    def __init__(self) -> None:
        init_sqlite_observation_store()

    @classmethod
    def clear_memory_cache(cls) -> None:
        with _observation_lock:
            _in_memory_observations.clear()

    @property
    def _memory_cache(self) -> dict[str, list[dict[str, Any]]]:
        return _in_memory_observations

    @classmethod
    def record_observation(
        cls,
        user_id: str,
        module: str,
        metric_key: str,
        value: float | int,
        unit: str = "",
        observed_at: str | datetime | None = None,
        source: str = "profile_update",
        source_record_id: str | None = None,
        auth_token: str | None = None,
    ) -> dict[str, Any]:
        """
        Appends an immutable observation record to Supabase, SQLite, and memory.
        """
        user_id_str = _validate_user_id(user_id)
        now_utc = datetime.now(timezone.utc)
        created_at_iso = now_utc.isoformat()

        if observed_at is None:
            observed_at_iso = created_at_iso
        elif isinstance(observed_at, datetime):
            if observed_at.tzinfo is None:
                observed_at = observed_at.replace(tzinfo=timezone.utc)
            observed_at_iso = observed_at.isoformat()
        else:
            observed_at_iso = str(observed_at)

        # Derive canonical unit if not provided
        if not unit:
            defn = get_metric_definition(metric_key)
            if defn:
                unit = defn.unit

        obs_id = str(uuid.uuid4())
        obs_record = {
            "id": obs_id,
            "user_id": user_id_str,
            "module": module,
            "metric_key": metric_key,
            "value": float(value),
            "unit": unit,
            "observed_at": observed_at_iso,
            "source": source,
            "source_record_id": str(source_record_id) if source_record_id else None,
            "created_at": created_at_iso,
        }

        # 1. Store in memory for instant local lookup & testing
        with _observation_lock:
            _in_memory_observations.setdefault(user_id_str, []).append(dict(obs_record))

        # 2. Supabase PostgreSQL persistence
        if _is_valid_uuid(user_id_str):
            client = get_supabase_client(auth_token)
            if client:
                try:
                    client.table("patient_metric_observations").insert(obs_record).execute()
                    return obs_record
                except Exception as e:
                    logger.warning("Supabase observation insert error: %s; falling back to SQLite", e)

        # 3. Persistent SQLite fallback
        try:
            conn = _connect_sqlite()
            with conn:
                conn.execute(
                    """
                    INSERT INTO patient_metric_observations 
                    (id, user_id, module, metric_key, value, unit, observed_at, source, source_record_id, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        obs_record["id"],
                        obs_record["user_id"],
                        obs_record["module"],
                        obs_record["metric_key"],
                        obs_record["value"],
                        obs_record["unit"],
                        obs_record["observed_at"],
                        obs_record["source"],
                        obs_record["source_record_id"],
                        obs_record["created_at"],
                    ),
                )
            conn.close()
        except Exception as e:
            logger.warning("SQLite observation insert error: %s", e)

        return obs_record

    @classmethod
    def get_latest_observation(
        cls,
        user_id: str,
        metric_key: str,
        module: str | None = None,
        auth_token: str | None = None,
    ) -> dict[str, Any] | None:
        """
        Retrieves the most recent recorded observation for a given user and metric.
        """
        user_id_str = _validate_user_id(user_id)

        # 1. Authoritative Supabase PostgreSQL lookup
        if _is_valid_uuid(user_id_str):
            client = get_supabase_client(auth_token)
            if client:
                try:
                    q = (
                        client.table("patient_metric_observations")
                        .select("*")
                        .eq("user_id", user_id_str)
                        .eq("metric_key", metric_key)
                    )
                    if module:
                        q = q.in_("module", [module, "shared"])
                    res = q.order("observed_at", desc=True).limit(1).execute()
                    if res and res.data and len(res.data) > 0:
                        return res.data[0]
                except Exception as e:
                    logger.debug("Supabase get_latest_observation error: %s", e)

        # 2. Persistent SQLite lookup (offline / local development fallback)
        try:
            conn = _connect_sqlite()
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            if module:
                cursor.execute(
                    """
                    SELECT * FROM patient_metric_observations 
                    WHERE user_id = ? AND metric_key = ? AND module IN (?, 'shared')
                    ORDER BY observed_at DESC LIMIT 1
                    """,
                    (user_id_str, metric_key, module),
                )
            else:
                cursor.execute(
                    """
                    SELECT * FROM patient_metric_observations 
                    WHERE user_id = ? AND metric_key = ?
                    ORDER BY observed_at DESC LIMIT 1
                    """,
                    (user_id_str, metric_key),
                )
            row = cursor.fetchone()
            conn.close()
            if row:
                return dict(row)
        except Exception as e:
            logger.debug("SQLite get_latest_observation error: %s", e)

        # 3. In-memory cache fallback (used in unit tests & mock environments)
        with _observation_lock:
            user_obs = _in_memory_observations.get(user_id_str, [])
            matching = [o for o in user_obs if o.get("metric_key") == metric_key]
            if module:
                matching = [o for o in matching if o.get("module") in (module, "shared")]
            if matching:
                return sorted(matching, key=lambda x: x.get("observed_at", ""))[-1]

        return None

    @classmethod
    def get_observations_for_user(
        cls,
        user_id: str,
        module: str | None = None,
        metric_key: str | None = None,
        cutoff_dt: datetime | None = None,
        auth_token: str | None = None,
    ) -> list[dict[str, Any]]:
        """
        Retrieves all recorded observations for a user in chronological order (oldest to newest).
        """
        user_id_str = _validate_user_id(user_id)
        results: list[dict[str, Any]] = []

        # 1. Fetch from Supabase
        if _is_valid_uuid(user_id_str):
            client = get_supabase_client(auth_token)
            if client:
                try:
                    q = client.table("patient_metric_observations").select("*").eq("user_id", user_id_str)
                    if module:
                        q = q.in_("module", [module, "shared"])
                    if metric_key:
                        q = q.eq("metric_key", metric_key)
                    if cutoff_dt:
                        q = q.gte("observed_at", cutoff_dt.isoformat())
                    res = q.order("observed_at", desc=False).execute()
                    if res and res.data:
                        results = res.data
                except Exception as e:
                    logger.debug("Supabase get_observations error: %s", e)

        # 2. Fallback to SQLite if empty
        if not results:
            try:
                conn = _connect_sqlite()
                conn.row_factory = sqlite3.Row
                cursor = conn.cursor()
                query = "SELECT * FROM patient_metric_observations WHERE user_id = ?"
                params: list[Any] = [user_id_str]
                if module:
                    query += " AND module IN (?, 'shared')"
                    params.append(module)
                if metric_key:
                    query += " AND metric_key = ?"
                    params.append(metric_key)
                if cutoff_dt:
                    query += " AND observed_at >= ?"
                    params.append(cutoff_dt.isoformat())
                query += " ORDER BY observed_at ASC"
                cursor.execute(query, tuple(params))
                rows = cursor.fetchall()
                conn.close()
                results = [dict(r) for r in rows]
            except Exception as e:
                logger.debug("SQLite get_observations error: %s", e)

        # 3. Merge in-memory records (ensures local updates during request/tests are visible)
        with _observation_lock:
            mem_obs = _in_memory_observations.get(user_id_str, [])
            seen_ids = {r.get("id") for r in results if r.get("id")}
            for m in mem_obs:
                if m.get("id") in seen_ids:
                    continue
                if module and m.get("module") not in (module, "shared"):
                    continue
                if metric_key and m.get("metric_key") != metric_key:
                    continue
                if cutoff_dt:
                    try:
                        obs_dt = datetime.fromisoformat(str(m.get("observed_at")).replace("Z", "+00:00"))
                        if obs_dt < cutoff_dt:
                            continue
                    except Exception:
                        pass
                results.append(dict(m))

        # Sort chronologically (oldest first)
        def _sort_key(item: dict[str, Any]) -> str:
            return str(item.get("observed_at") or "")

        results.sort(key=_sort_key)
        return results

    @classmethod
    def sync_observations_from_patient_state(
        cls,
        user_id: str,
        module: str,
        current_profile: Any = None,
        current_clinical_state: dict[str, Any] | None = None,
        source: str = "profile_update",
        observed_at: str | datetime | None = None,
        auth_token: str | None = None,
        state_dict: dict[str, Any] | None = None,
    ) -> list[dict[str, Any]]:
        """
        Authoritative observation synchronization engine.
        Inspects current profile biometrics and clinical inputs.
        If a trackable metric has changed compared to its latest recorded observation,
        or if no observation exists yet for this metric, appends a new immutable observation.
        Also guarantees canonical BMI derivation and synchronization.
        """
        if current_profile is None and state_dict is not None:
            current_profile = state_dict
        user_id_str = _validate_user_id(user_id)
        norm_module = "male_hypogonadism" if "male" in module else "female_pcos"
        clinical_state = current_clinical_state or {}
        t1_inputs = clinical_state.get("tier_1_inputs") or {}
        p = current_profile

        def _get_p_val(key: str, alt_key: str | None = None) -> Any:
            if p is None:
                return None
            if isinstance(p, dict):
                v = p.get(key)
                if v is None and alt_key:
                    v = p.get(alt_key)
                return v
            v = getattr(p, key, None)
            if v is None and alt_key:
                v = getattr(p, alt_key, None)
            return v

        # Observation timestamp semantics: must reflect when the clinical value was changed/saved
        if observed_at is None:
            observed_at = (
                _get_p_val("updated_at")
                or _get_p_val("created_at")
                or clinical_state.get("updated_at")
                or clinical_state.get("created_at")
            )

        # Helper to safely parse numeric value
        def _parse_num(v: Any) -> float | None:
            if v is None or v == "":
                return None
            try:
                fv = float(v)
                return fv if not (fv != fv) else None  # NaN check
            except (ValueError, TypeError):
                return None

        # Candidate current values map
        candidates: dict[str, tuple[float | None, str]] = {}

        # 1. Anthropometrics (Shared)
        w_kg = _parse_num(_get_p_val("weight_kg", "weightKg") or _get_p_val("weight"))
        if w_kg is None:
            w_kg = _parse_num(t1_inputs.get("weight_kg") or t1_inputs.get("weight"))
        if w_kg is not None:
            candidates["weight_kg"] = (round(w_kg, 1), "kg")

        h_cm = _parse_num(_get_p_val("height_cm", "heightCm") or _get_p_val("height"))
        if h_cm is None:
            h_cm = _parse_num(t1_inputs.get("height_cm") or t1_inputs.get("height"))
        if h_cm is not None:
            candidates["height_cm"] = (round(h_cm, 1), "cm")

        # Waist circumference
        waist = _parse_num(_get_p_val("waist_cm", "waistCm") or _get_p_val("waist"))
        if waist is None:
            waist = _parse_num(t1_inputs.get("waist_circumference") or t1_inputs.get("waist_cm") or t1_inputs.get("waist"))
        if waist is None:
            waist_inch = _parse_num(_get_p_val("waist_inch")) or _parse_num(t1_inputs.get("waist_inch"))
            if waist_inch is not None:
                waist = round(waist_inch * 2.54, 1)
        if waist is not None:
            candidates["waist_circumference"] = (round(waist, 1), "cm")

        # Waist-to-Hip Ratio
        whr = _parse_num(t1_inputs.get("waist_hip_ratio"))
        if whr is None:
            hip = _parse_num(_get_p_val("hip_cm", "hipCm") or _get_p_val("hip")) or _parse_num(t1_inputs.get("hip_inch"))
            if waist is not None and hip is not None and hip > 0:
                whr = round(waist / hip, 2)
        if whr is not None:
            candidates["waist_hip_ratio"] = (round(whr, 2), "")

        # Canonical BMI Calculation & Synchronization
        # Authoritative formula: round(weight_kg / ((height_cm / 100.0) ** 2), 1)
        if w_kg is not None and h_cm is not None and h_cm > 0:
            calc_bmi = round(w_kg / ((h_cm / 100.0) ** 2), 1)
            candidates["bmi"] = (calc_bmi, "kg/m²")
        else:
            bmi_stored = _parse_num(_get_p_val("bmi")) or _parse_num(t1_inputs.get("bmi"))
            if bmi_stored is not None:
                candidates["bmi"] = (round(bmi_stored, 1), "kg/m²")

        # 2. Pathway-specific symptoms
        if norm_module == "female_pcos":
            # Cycle regularity
            reg_val = _get_p_val("period_regularity")
            if reg_val is None:
                reg_val = t1_inputs.get("cycle_regularity")
            if reg_val is not None:
                is_reg = 0 if "irreg" in str(reg_val).lower() else 1
                candidates["cycle_regularity"] = (float(is_reg), "")

            # Cycle length
            cl = _parse_num(_get_p_val("cycle_length")) or _parse_num(t1_inputs.get("cycle_length_raw"))
            if cl is not None:
                candidates["cycle_length_raw"] = (cl, "days")

            # Binary symptoms
            symptoms = _get_p_val("common_symptoms") or []
            if isinstance(symptoms, list):
                sym_str = " ".join(str(s).lower() for s in symptoms)
            else:
                sym_str = str(symptoms).lower()

            for sym_key, keywords in [
                ("hirsutism", ("hair", "hirsutism")),
                ("skin_darkening", ("dark", "acanthosis")),
                ("hair_loss", ("loss", "thinning", "alopecia")),
                ("pimples_acne", ("acne", "pimple")),
            ]:
                val = 1.0 if any(k in sym_str for k in keywords) else _parse_num(t1_inputs.get(sym_key))
                if val is not None:
                    candidates[sym_key] = (1.0 if val > 0 else 0.0, "")

        else:  # male_hypogonadism
            # Vitality / ADAM features
            mh = _get_p_val("mens_health", "mensHealth") or {}
            conds = str(_get_p_val("conditions", "diagnosedConditions") or "").lower()

            low_energy_val = 1.0 if (mh.get("energyLevel") in ["low", "very_low"] or "fatigue" in conds) else _parse_num(t1_inputs.get("low_energy"))
            if low_energy_val is not None:
                candidates["low_energy"] = (1.0 if low_energy_val > 0 else 0.0, "")

            sleep_trouble_val = 1.0 if (mh.get("sleepQuality") in ["poor", "fair"]) else _parse_num(t1_inputs.get("sleep_trouble"))
            if sleep_trouble_val is not None:
                candidates["sleep_trouble"] = (1.0 if sleep_trouble_val > 0 else 0.0, "")

            low_mood_val = 1.0 if ("mood" in str(mh.get("moodFactors", "")).lower() or "depression" in conds) else _parse_num(t1_inputs.get("low_mood"))
            if low_mood_val is not None:
                candidates["low_mood"] = (1.0 if low_mood_val > 0 else 0.0, "")

            low_interest_val = 1.0 if (mh.get("sexDrive") in ["low", "very_low"]) else _parse_num(t1_inputs.get("low_interest"))
            if low_interest_val is not None:
                candidates["low_interest"] = (1.0 if low_interest_val > 0 else 0.0, "")

            # Specific ADAM questions if present
            for adam_key in ("adam_libido_loss", "adam_erection_quality", "adam_energy_loss"):
                av = _parse_num(t1_inputs.get(adam_key))
                if av is not None:
                    candidates[adam_key] = (1.0 if av > 0 else 0.0, "")

        # 3. Determine which metrics genuinely changed and append new observations
        newly_recorded: list[dict[str, Any]] = []

        for metric_key, (current_val, unit) in candidates.items():
            if current_val is None:
                continue

            latest_obs = cls.get_latest_observation(
                user_id_str, metric_key, module=norm_module, auth_token=auth_token
            )

            should_record = False
            if latest_obs is None:
                # First observation recorded for this patient metric
                should_record = True
            else:
                prev_val = _parse_num(latest_obs.get("value"))
                if prev_val is None:
                    should_record = True
                else:
                    defn = get_metric_definition(metric_key)
                    if defn and defn.value_type in ("boolean_symptom", "ordinal_symptom", "categorical"):
                        # Exact equality for boolean / categorical / ordinal symptoms
                        if prev_val != current_val:
                            should_record = True
                    else:
                        # Metric-specific precision tolerance for numeric metrics
                        display_prec = defn.display_precision if defn else 1
                        tol = 0.5 * (10.0 ** (-display_prec))
                        diff = abs(current_val - prev_val)
                        if diff >= tol:
                            should_record = True

            if should_record:
                obs = cls.record_observation(
                    user_id=user_id_str,
                    module=norm_module if metric_key not in ("weight_kg", "bmi", "height_cm", "waist_circumference", "waist_hip_ratio") else "shared",
                    metric_key=metric_key,
                    value=current_val,
                    unit=unit,
                    observed_at=observed_at,
                    source=source,
                    auth_token=auth_token,
                )
                newly_recorded.append(obs)

        return newly_recorded

    @classmethod
    def clear_in_memory_store(cls, user_id: str | None = None) -> None:
        """Clears in-memory observations for unit tests."""
        with _observation_lock:
            if user_id:
                _in_memory_observations.pop(str(user_id), None)
            else:
                _in_memory_observations.clear()


observation_repository = ObservationRepository()
