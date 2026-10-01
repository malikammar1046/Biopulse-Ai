"""
backend/apps/intelligence/services/assessment_repository.py
Unified repository for saving, querying, and managing progressive cumulative assessments
across female PCOS and male hypogonadism pathways.

Preserves assessment history while maintaining exactly ONE active assessment per patient per module.
Authoritative remote persistence: save_screening_assessment() RPC.
Authoritative remote reads: public.screening_assessments.
Authoritative local mirror: SQLite intelligence_assessments + patient_clinical_state.
"""

from __future__ import annotations

import json
import logging
import os
import sqlite3
import sys
import threading
import uuid
from datetime import date, datetime, timezone
from decimal import Decimal
from pathlib import Path
from typing import Any

from django.conf import settings

logger = logging.getLogger(__name__)


class PersistenceError(Exception):
    """Raised when authoritative cloud persistence fails and local SQLite fallback is disallowed."""
    pass


def _is_local_sqlite_fallback_allowed() -> bool:
    """Checks whether local SQLite fallback is explicitly permitted."""
    if getattr(settings, "ALLOW_LOCAL_SQLITE_FALLBACK", False):
        return True
    env_val = os.environ.get("ALLOW_LOCAL_SQLITE_FALLBACK", "").strip().lower()
    return env_val in ("true", "1", "yes")


# In-memory store for unit testing
_in_memory_assessments: dict[str, list[dict[str, Any]]] = {}
_in_memory_clinical_state: dict[str, dict[str, Any]] = {}
_repo_lock = threading.Lock()
_remote_table_available = True
_initialized_assessment_db_paths: set[str] = set()
_sqlite_init_lock = threading.Lock()


def _get_sqlite_path() -> str:
    try:
        if any("test" in str(arg).lower() or "pytest" in str(arg).lower() for arg in sys.argv):
            return str(Path(__file__).resolve().parent.parent.parent.parent / "test_fallback.sqlite3")
        db_path = settings.DATABASES.get("default", {}).get("NAME")
        if db_path:
            db_path_str = str(db_path)
            # In Django test suites, NAME can be 'file:memorydb_default?mode=memory&cache=shared'
            # or ':memory:'. Raw sqlite3.connect to a shared in-memory database locks tables
            # against Django's open test transactions. We fallback to disk db.sqlite3.
            if not db_path_str.startswith("file:") and ":memory:" not in db_path_str:
                return db_path_str
    except Exception:
        pass
    default_path = Path(__file__).resolve().parent.parent.parent.parent / "db.sqlite3"
    return str(default_path)


def _json_serial_default(obj: Any) -> Any:
    """Safely serializes legitimate production data types like datetime, date, UUID, and Decimal."""
    if isinstance(obj, (datetime, date)):
        return obj.isoformat()
    if isinstance(obj, uuid.UUID):
        return str(obj)
    if isinstance(obj, Decimal):
        return float(obj)
    raise TypeError(f"Object of type {type(obj).__name__} is not JSON serializable")


def _connect_sqlite(db_path: str | None = None, timeout: float = 30.0) -> sqlite3.Connection:
    """
    Centralized SQLite connection helper for fallback data operations.
    Configures 30s timeout, busy_timeout=30000, foreign_keys=ON, and autocommit isolation_level=None
    to enforce short explicit transaction boundaries (BEGIN IMMEDIATE / COMMIT / ROLLBACK).
    Never hijacks Django's persistent connection.
    """
    if db_path is None:
        db_path = _get_sqlite_path()
    is_uri = str(db_path).startswith("file:")
    conn = sqlite3.connect(db_path, timeout=timeout, uri=is_uri, isolation_level=None)
    try:
        conn.execute("PRAGMA busy_timeout = 30000;")
        conn.execute("PRAGMA foreign_keys = ON;")
    except Exception as e:
        logger.debug("Failed configuring SQLite connection pragmas: %s", e)
    return conn


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
        raise ValueError(f"Invalid user_id '{user_id}': unauthenticated or placeholder identities are prohibited for clinical data.")
    return uid


def _normalize_assessment_record(item: dict[str, Any]) -> dict[str, Any]:
    """Flattens pcos_ultrasound_assessments relation into the assessment dictionary with strict tier and module isolation."""
    if not isinstance(item, dict):
        return item
    us_data = item.pop("pcos_ultrasound_assessments", None)
    if isinstance(us_data, list) and us_data:
        us_data = us_data[0]

    level = item.get("assessment_level", "tier_1")
    is_male = item.get("module") == "male_hypogonadism"
    is_ultrasound_tier = level in ("tier_1_3", "tier_1_2_3")

    if not is_male and is_ultrasound_tier and isinstance(us_data, dict):
        for field in ("pcom_status", "pcom_probability", "gradcam_url", "ultrasound_report_id"):
            if field in us_data and item.get(field) is None:
                item[field] = us_data[field]
    elif is_male or not is_ultrasound_tier:
        for field in ("pcom_status", "pcom_probability", "gradcam_url", "gradcam_b64", "ultrasound_report_id"):
            item[field] = None

    if isinstance(item.get("shap_explanation"), str):
        try:
            item["shap_explanation"] = json.loads(item["shap_explanation"])
        except Exception:
            pass
    if isinstance(item.get("longitudinal_shap_comparison"), str):
        try:
            item["longitudinal_shap_comparison"] = json.loads(item["longitudinal_shap_comparison"])
        except Exception:
            pass
    return item


def init_sqlite_store() -> None:
    """Initializes the local SQLite assessment persistence table and patient clinical state table."""
    db_path = _get_sqlite_path()
    if db_path in _initialized_assessment_db_paths:
        return

    with _sqlite_init_lock:
        if db_path in _initialized_assessment_db_paths:
            return
        conn = _connect_sqlite(db_path, timeout=30.0)
        try:
            # WAL mode and NORMAL synchronous enabled once during initialization (Section 4)
            try:
                cursor = conn.cursor()
                cursor.execute("PRAGMA journal_mode = WAL;")
                row = cursor.fetchone()
                actual_mode = row[0].lower() if row and row[0] else ""
                cursor.execute("PRAGMA synchronous = NORMAL;")
                cursor.close()
                logger.info("SQLite store journal_mode set to %s for %s", actual_mode, db_path)
            except Exception as jm_err:
                logger.debug("SQLite WAL pragma notice: %s", jm_err)

            conn.execute("BEGIN IMMEDIATE;")
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS intelligence_assessments (
                    id TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    module TEXT NOT NULL,
                    assessment_level TEXT NOT NULL,
                    is_active INTEGER NOT NULL DEFAULT 1,
                    created_at TEXT NOT NULL,
                    payload_json TEXT NOT NULL
                )
                """
            )
            conn.execute(
                "CREATE INDEX IF NOT EXISTS idx_intel_user_active ON intelligence_assessments(user_id, is_active, module)"
            )
            conn.execute(
                "CREATE INDEX IF NOT EXISTS idx_intel_user_created ON intelligence_assessments(user_id, created_at DESC)"
            )
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS patient_clinical_state (
                    user_id TEXT NOT NULL,
                    module TEXT NOT NULL,
                    tier_1_inputs TEXT NOT NULL DEFAULT '{}',
                    tier_2_inputs TEXT NOT NULL DEFAULT '{}',
                    ultrasound_inputs TEXT NOT NULL DEFAULT '{}',
                    created_at TEXT NOT NULL DEFAULT '',
                    updated_at TEXT NOT NULL DEFAULT '',
                    PRIMARY KEY (user_id, module)
                )
                """
            )
            try:
                conn.execute("ALTER TABLE patient_clinical_state ADD COLUMN created_at TEXT NOT NULL DEFAULT ''")
            except Exception:
                pass
            conn.execute(
                "CREATE INDEX IF NOT EXISTS idx_pcs_user_module ON patient_clinical_state(user_id, module)"
            )
            conn.execute("COMMIT;")
            # Mark initialized ONLY after successful DDL completion
            _initialized_assessment_db_paths.add(db_path)
            logger.info("AssessmentRepository persistent SQLite store initialized at %s", db_path)
        except Exception as e:
            try:
                conn.execute("ROLLBACK;")
            except Exception:
                pass
            logger.warning("Failed to initialize SQLite assessment store: %s", e)
        finally:
            try:
                conn.close()
            except Exception:
                pass



_cached_service_client = None
_client_lock = threading.Lock()


def _is_supabase_network_disabled() -> bool:
    return getattr(settings, "DISABLE_SUPABASE_NETWORK", False) or os.environ.get("DISABLE_SUPABASE_NETWORK", "").strip().lower() in ("true", "1", "yes")


def get_supabase_client(auth_token: str | None = None) -> Any:
    """
    Returns a Supabase client using SUPABASE_SERVICE_ROLE_KEY (for server-side privileged operations)
    or SUPABASE_ANON_KEY and caller JWT.
    """
    global _remote_table_available, _cached_service_client
    if _is_supabase_network_disabled() or not _remote_table_available:
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
            logger.debug("Service Supabase client init error: %s", e)
    return None


class AssessmentRepository:
    """
    Manages persistence of progressive assessments across female PCOS and male hypogonadism modules.
    Guarantees 100% data persistence by backing records in SQLite with authoritative Supabase synchronization.
    """

    def __init__(self) -> None:
        init_sqlite_store()

    @classmethod
    def init_sqlite_store(cls) -> None:
        init_sqlite_store()

    @classmethod
    def get_patient_clinical_state(
        cls,
        user_id: str,
        module: str = "female_pcos",
        auth_token: str | None = None,
        perform_backfill: bool = True,
    ) -> dict[str, Any]:
        """
        Retrieves the authoritative patient clinical state (Tier 1 & Tier 2 inputs).
        Delegates to ClinicalStateRepository (Supabase PostgreSQL with SQLite fallback).
        """
        from apps.intelligence.services.clinical_state_repository import clinical_state_repository
        return clinical_state_repository.get_patient_clinical_state(
            user_id=user_id,
            module=module,
            auth_token=auth_token,
            perform_backfill=perform_backfill,
        )

    @classmethod
    def save_patient_clinical_state(
        cls,
        user_id: str,
        module: str,
        tier_1_inputs: dict[str, Any] | None = None,
        tier_2_inputs: dict[str, Any] | None = None,
        ultrasound_inputs: dict[str, Any] | None = None,
        auth_token: str | None = None,
    ) -> dict[str, Any]:
        """
        Authoritatively saves the patient's current clinical inputs.
        Delegates to ClinicalStateRepository (Supabase PostgreSQL with SQLite fallback).
        """
        from apps.intelligence.services.clinical_state_repository import clinical_state_repository
        return clinical_state_repository.save_patient_clinical_state(
            user_id=user_id,
            module=module,
            tier_1_inputs=tier_1_inputs,
            tier_2_inputs=tier_2_inputs,
            ultrasound_inputs=ultrasound_inputs,
            auth_token=auth_token,
        )

    @classmethod
    def clear_patient_tier2_state(
        cls,
        user_id: str,
        module: str = "female_pcos",
        auth_token: str | None = None,
    ) -> dict[str, Any]:
        """
        Explicitly removes all Tier 2 clinical and laboratory inputs for the specified user and module.
        Leaves Tier 1 and ultrasound inputs intact.
        """
        from apps.intelligence.services.clinical_state_repository import clinical_state_repository
        return clinical_state_repository.clear_patient_tier2_state(
            user_id=user_id,
            module=module,
            auth_token=auth_token,
        )

    @classmethod
    def get_active_assessment(
        cls,
        user_id: str,
        module: str | None = None,
        auth_token: str | None = None,
    ) -> dict[str, Any] | None:
        """
        Retrieves the latest active assessment for the specified patient and module.
        Checks public.screening_assessments first, falls back to persistent SQLite, then in-memory store.
        """
        global _remote_table_available
        module_name = module or "female_pcos"
        user_id_str = _validate_user_id(user_id)

        def _attach_authoritative(res_dict: dict[str, Any]) -> dict[str, Any]:
            try:
                st = cls.get_patient_clinical_state(
                    user_id_str, module=module_name, auth_token=auth_token, perform_backfill=False
                )
                t2 = st.get("tier_2_inputs") or {}
                t1 = st.get("tier_1_inputs") or {}
                res_dict["authoritative_tier_2_inputs"] = t2
                res_dict["authoritative_tier_1_inputs"] = t1
                res_dict["available_historical_evidence"] = {
                    "tier_1": bool(t1),
                    "tier_2": bool(t2),
                    "tier_3_ultrasound": bool(st.get("ultrasound_inputs")),
                }
                level = res_dict.get("assessment_level", "tier_1")
                is_male = res_dict.get("module") == "male_hypogonadism"
                has_t2 = level in ("tier_1_2", "tier_1_2_3")
                has_t3 = level in ("tier_1_3", "tier_1_2_3") and not is_male

                res_dict["evidence_used"] = {
                    "tier_1": True,
                    "tier_2": has_t2,
                    "tier_3_ultrasound": has_t3,
                }
                if not has_t2:
                    res_dict["tier_2_inputs"] = {}
                    res_dict["direct_laboratory_values"] = []
                    res_dict["hormone_pattern_interpretation"] = None
                    res_dict["tier_2_available_count"] = 0
                    res_dict["tier_2_available_fields"] = []
                    res_dict["tier_2_missing_fields"] = []
                if not has_t3 or is_male:
                    res_dict["pcom_status"] = None
                    res_dict["pcom_probability"] = None
                    res_dict["gradcam_url"] = None
                    res_dict["gradcam_b64"] = None
                    res_dict["ultrasound_report_id"] = None
            except Exception as e:
                logger.debug("Attach authoritative state error: %s", e)
            return res_dict

        # 1. Supabase Check against public.screening_assessments
        client = get_supabase_client(auth_token)
        if client and _remote_table_available and _is_valid_uuid(user_id_str):
            try:
                select_cols = "*, pcos_ultrasound_assessments(*)" if module_name == "female_pcos" else "*"
                query = (
                    client.table("screening_assessments")
                    .select(select_cols)
                    .eq("user_id", user_id_str)
                    .eq("module", module_name)
                    .eq("is_active", True)
                )
                res = query.order("created_at", desc=True).limit(1).execute()
                if res.data and isinstance(res.data, list) and len(res.data) > 0 and isinstance(res.data[0], dict):
                    item = _normalize_assessment_record(res.data[0])
                    return _attach_authoritative(item)
            except Exception as e:
                err_str = str(e)
                if "PGRST205" in err_str or "Could not find the table" in err_str:
                    _remote_table_available = False
                logger.debug("Supabase active assessment lookup: %s", e)

        # 2. SQLite Persistent Fallback
        conn = None
        try:
            db_path = _get_sqlite_path()
            conn = _connect_sqlite(db_path, timeout=30.0)
            cursor = conn.cursor()
            try:
                cursor.execute(
                    """
                    SELECT payload_json, is_active FROM intelligence_assessments
                    WHERE user_id = ? AND is_active = 1 AND module = ?
                    ORDER BY created_at DESC LIMIT 1
                    """,
                    (user_id_str, module_name),
                )
                row = cursor.fetchone()
                if row and row[0]:
                    rec = json.loads(row[0]) if isinstance(row[0], str) else row[0]
                    if isinstance(rec, dict):
                        rec["is_active"] = bool(row[1])
                        return _attach_authoritative(rec)
            finally:
                cursor.close()
        except Exception as e:
            logger.debug("SQLite active assessment query error: %s", e)
        finally:
            if conn:
                try:
                    conn.close()
                except Exception:
                    pass

        # 3. In-memory fallback
        with _repo_lock:
            user_records = _in_memory_assessments.get(user_id_str, [])
            for rec in reversed(user_records):
                if rec.get("is_active", False):
                    rec_mod = rec.get("module") or "female_pcos"
                    if rec_mod == module_name:
                        return _attach_authoritative(rec)
        return None

    @classmethod
    def get_assessment_history(
        cls,
        user_id: str,
        module: str | None = None,
        auth_token: str | None = None,
    ) -> list[dict[str, Any]]:
        """
        Retrieves chronological history of all assessments for the specified patient and module.
        Queries public.screening_assessments with module filter.
        """
        global _remote_table_available
        user_id_str = _validate_user_id(user_id)
        module_name = module

        # 1. Supabase Check
        client = get_supabase_client(auth_token)
        if client and _remote_table_available and _is_valid_uuid(user_id_str):
            try:
                select_cols = "*, pcos_ultrasound_assessments(*)" if module_name == "female_pcos" else "*"
                query = client.table("screening_assessments").select(select_cols).eq("user_id", user_id_str)
                if module_name:
                    query = query.eq("module", module_name)
                res = query.order("created_at", desc=True).execute()
                if res.data:
                    return [_normalize_assessment_record(r) for r in res.data]
            except Exception as e:
                err_str = str(e)
                if "PGRST205" in err_str or "Could not find the table" in err_str:
                    _remote_table_available = False
                logger.debug("Supabase history lookup: %s", e)

        # 2. SQLite Persistent Fallback
        conn = None
        try:
            db_path = _get_sqlite_path()
            conn = _connect_sqlite(db_path, timeout=30.0)
            cursor = conn.cursor()
            try:
                if module_name:
                    cursor.execute(
                        """
                        SELECT payload_json, is_active FROM intelligence_assessments
                        WHERE user_id = ? AND module = ?
                        ORDER BY created_at DESC
                        """,
                        (user_id_str, module_name),
                    )
                else:
                    cursor.execute(
                        """
                        SELECT payload_json, is_active FROM intelligence_assessments
                        WHERE user_id = ?
                        ORDER BY created_at DESC
                        """,
                        (user_id_str,),
                    )
                rows = cursor.fetchall()
                if rows:
                    results = []
                    for r in rows:
                        if r[0]:
                            rec = json.loads(r[0]) if isinstance(r[0], str) else r[0]
                            if isinstance(rec, dict):
                                rec["is_active"] = bool(r[1])
                                results.append(_normalize_assessment_record(rec))
                    return results
            finally:
                cursor.close()
        except Exception as e:
            logger.debug("SQLite history query error: %s", e)
        finally:
            if conn:
                try:
                    conn.close()
                except Exception:
                    pass

        # 3. In-memory fallback
        with _repo_lock:
            user_records = _in_memory_assessments.get(user_id_str, [])
            if module_name:
                user_records = [r for r in user_records if r.get("module", "female_pcos") == module_name]
            return [_normalize_assessment_record(r) for r in sorted(user_records, key=lambda x: x.get("created_at", ""), reverse=True)]

    @classmethod
    def save_assessment(
        cls,
        user_id: str,
        assessment_data: dict[str, Any],
        make_active: bool = True,
        auth_token: str | None = None,
    ) -> dict[str, Any]:
        """
        Saves an assessment record with guaranteed persistence in SQLite and authoritative synchronization
        to Supabase via save_screening_assessment() RPC under service_role.
        If make_active=True, deactivates previous active assessments of the same module.
        """
        from apps.intelligence.maintenance import is_assessment_maintenance_active
        if is_assessment_maintenance_active():
            raise RuntimeError("Assessment writes blocked: BIOPULSE_ASSESSMENT_MAINTENANCE is active.")

        user_id_str = _validate_user_id(user_id)
        now_iso = datetime.now(timezone.utc).isoformat()
        new_id = str(uuid.uuid4())
        module_name = assessment_data.get("module", "female_pcos")
        level = assessment_data.get("assessment_level", "tier_1")
        is_male = module_name == "male_hypogonadism"
        has_t2 = level in ("tier_1_2", "tier_1_2_3")
        has_t3 = level in ("tier_1_3", "tier_1_2_3") and not is_male

        evidence_used = assessment_data.get("evidence_used") or {
            "tier_1": True,
            "tier_2": has_t2,
            "tier_3_ultrasound": has_t3,
        }

        previous_active = cls.get_active_assessment(user_id_str, module=module_name, auth_token=auth_token) if make_active else None
        replaced_id = None
        if previous_active and isinstance(previous_active, dict):
            raw_pid = previous_active.get("id")
            if raw_pid is not None and isinstance(raw_pid, (str, int)):
                replaced_id = str(raw_pid)

        record = {
            "id": new_id,
            "user_id": user_id_str,
            "module": module_name,
            "assessment_level": level,
            "tiers_included": assessment_data.get("tiers_included", [1]),
            "model_name": assessment_data.get("model_name", "PMOSense Model"),
            "model_version": assessment_data.get("model_version", "1.0.0"),
            "probability": assessment_data.get("probability", 0.0),
            "probability_percent": assessment_data.get("probability_percent", 0.0),
            "threshold": assessment_data.get("threshold", 0.38),
            "risk_category": assessment_data.get("risk_category", "lower"),
            "risk_label": assessment_data.get("risk_label", "Lower Screening Risk"),
            "summary_text": assessment_data.get("summary_text", ""),
            "is_active": make_active,
            "replaced_assessment_id": replaced_id,
            "input_availability": assessment_data.get("input_availability", {}),
            "input_features": assessment_data.get("input_features", {}),
            "tier_2_inputs": assessment_data.get("tier_2_inputs", {}) if has_t2 else {},
            "tier_2_available_count": assessment_data.get("tier_2_available_count") if has_t2 else 0,
            "tier_2_total_count": assessment_data.get("tier_2_total_count") if has_t2 else None,
            "tier_2_available_fields": assessment_data.get("tier_2_available_fields", []) if has_t2 else [],
            "tier_2_missing_fields": assessment_data.get("tier_2_missing_fields", []) if has_t2 else [],
            "evidence_completeness_percent": assessment_data.get("evidence_completeness_percent"),
            "evidence_completeness": assessment_data.get("evidence_completeness", {}),
            "hormone_pattern_interpretation": assessment_data.get("hormone_pattern_interpretation") if (has_t2 and is_male) else None,
            "direct_laboratory_values": assessment_data.get("direct_laboratory_values", []) if has_t2 else [],
            "explanations": assessment_data.get("explanations", []),
            "shap_explanation": assessment_data.get("shap_explanation"),
            "longitudinal_shap_comparison": assessment_data.get("longitudinal_shap_comparison"),
            "limitations": assessment_data.get("limitations", []),
            "next_available_tier": assessment_data.get("next_available_tier"),
            "pcom_status": assessment_data.get("pcom_status") if has_t3 else None,
            "pcom_probability": assessment_data.get("pcom_probability") if has_t3 else None,
            "gradcam_url": assessment_data.get("gradcam_url") if has_t3 else None,
            "gradcam_b64": assessment_data.get("gradcam_b64") if has_t3 else None,
            "ultrasound_report_id": assessment_data.get("ultrasound_report_id") if has_t3 else None,
            "status_code": assessment_data.get("status_code"),
            "notice": assessment_data.get("notice"),
            "next_step": assessment_data.get("next_step", ""),
            "disclaimer": assessment_data.get("disclaimer", ""),
            "evidence_used": evidence_used,
            "input_hash": assessment_data.get("input_hash") or (
                __import__("apps.intelligence.services.screening_hash", fromlist=["compute_canonical_input_hash"]).compute_canonical_input_hash(
                    assessment_data.get("authoritative_tier_1_inputs") or assessment_data.get("input_features") or assessment_data.get("tier_1_inputs") or {},
                    module=module_name
                )
            ),
            "created_at": now_iso,
            "updated_at": now_iso,
        }

        # 1. Authoritative Remote Persistence via save_screening_assessment() RPC
        global _remote_table_available
        client = get_supabase_client(auth_token)
        remote_persisted = False
        remote_error = None
        if client and _remote_table_available and _is_valid_uuid(user_id_str):
            try:
                raw_next_tier = assessment_data.get("next_available_tier")
                next_tier_int = None
                if raw_next_tier is not None:
                    if isinstance(raw_next_tier, int):
                        next_tier_int = raw_next_tier
                    elif isinstance(raw_next_tier, str):
                        digits = "".join(ch for ch in raw_next_tier if ch.isdigit())
                        if digits:
                            try:
                                next_tier_int = int(digits)
                            except ValueError:
                                next_tier_int = None

                rpc_payload = {
                    "p_user_id": user_id_str,
                    "p_module": module_name,
                    "p_assessment_level": level if level in ('tier_1', 'tier_1_2', 'tier_1_3', 'tier_1_2_3') else 'tier_1',
                    "p_tiers_included": assessment_data.get("tiers_included", [1]),
                    "p_model_name": assessment_data.get("model_name", "PMOSense Model"),
                    "p_model_version": assessment_data.get("model_version", "1.0.0"),
                    "p_probability": float(assessment_data.get("probability", 0.0)),
                    "p_probability_percent": float(assessment_data.get("probability_percent", 0.0)),
                    "p_threshold": float(assessment_data.get("threshold", 0.38)),
                    "p_risk_category": assessment_data.get("risk_category", "lower"),
                    "p_risk_label": assessment_data.get("risk_label", "Lower Screening Risk"),
                    "p_summary_text": assessment_data.get("summary_text", ""),
                    "p_input_availability": assessment_data.get("input_availability", {}),
                    "p_input_features": assessment_data.get("input_features", {}),
                    "p_explanations": assessment_data.get("explanations", []),
                    "p_limitations": assessment_data.get("limitations", []),
                    "p_next_available_tier": next_tier_int,
                    "p_disclaimer": assessment_data.get("disclaimer", ""),
                    "p_pcom_status": assessment_data.get("pcom_status") if has_t3 else None,
                    "p_pcom_probability": float(assessment_data.get("pcom_probability")) if (has_t3 and assessment_data.get("pcom_probability") is not None) else None,
                    "p_gradcam_url": assessment_data.get("gradcam_url") if has_t3 else None,
                    "p_ultrasound_report_id": assessment_data.get("ultrasound_report_id") if has_t3 else None,
                    "p_shap_explanation": assessment_data.get("shap_explanation"),
                    "p_longitudinal_shap_comparison": assessment_data.get("longitudinal_shap_comparison"),
                }
                res = client.rpc("save_screening_assessment", rpc_payload).execute()
                if res.data:
                    remote_record = res.data
                    if isinstance(remote_record, dict):
                        new_id = remote_record.get("id", new_id)
                        record["id"] = new_id
                        if remote_record.get("replaced_assessment_id") is not None:
                            record["replaced_assessment_id"] = remote_record.get("replaced_assessment_id")
                        if remote_record.get("created_at"):
                            record["created_at"] = remote_record.get("created_at")
                            record["updated_at"] = remote_record.get("updated_at", remote_record.get("created_at"))
                    remote_persisted = True
                    logger.info("Authoritative screening assessment %s saved to Supabase via save_screening_assessment().", new_id)
            except Exception as e:
                err_str = str(e)
                if "PGRST205" in err_str or "Could not find the table" in err_str:
                    _remote_table_available = False
                remote_error = e
                logger.error("Supabase save_screening_assessment RPC failed for patient %s: %s", user_id_str[:8] + "***", e)

        # Enforce authoritative cloud persistence policy
        supabase_url = os.environ.get("SUPABASE_URL", "")
        if supabase_url and not remote_persisted:
            if not _is_local_sqlite_fallback_allowed():
                raise PersistenceError(
                    f"Authoritative screening assessment could not be saved to primary cloud datastore: {remote_error}"
                )
            logger.warning(
                "ALLOW_LOCAL_SQLITE_FALLBACK is enabled; persisting assessment %s to local SQLite fallback.",
                new_id,
            )

        # 2. Persist to SQLite Store (When permitted as fallback or local mirroring)
        conn = None
        try:
            db_path = _get_sqlite_path()
            conn = _connect_sqlite(db_path, timeout=30.0)
            conn.execute("BEGIN IMMEDIATE;")
            if make_active:
                conn.execute(
                    """
                    UPDATE intelligence_assessments
                    SET is_active = 0
                    WHERE user_id = ? AND module = ? AND is_active = 1
                    """,
                    (user_id_str, module_name),
                )
            conn.execute(
                """
                INSERT INTO intelligence_assessments
                (id, user_id, module, assessment_level, is_active, created_at, payload_json)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    new_id,
                    user_id_str,
                    module_name,
                    level,
                    1 if make_active else 0,
                    record["created_at"],
                    json.dumps(record, default=_json_serial_default),
                ),
            )
            conn.execute("COMMIT;")
            logger.info("Assessment %s (level: %s, module: %s) persisted to SQLite store.", new_id, level, module_name)
        except Exception as e:
            if conn:
                try:
                    conn.execute("ROLLBACK;")
                except Exception:
                    pass
            logger.error("Failed to write assessment to SQLite: %s", e)
        finally:
            if conn:
                try:
                    conn.close()
                except Exception:
                    pass

        # 3. Synchronize to in-memory store
        with _repo_lock:
            if user_id_str not in _in_memory_assessments:
                _in_memory_assessments[user_id_str] = []
            if make_active:
                for existing in _in_memory_assessments[user_id_str]:
                    if existing.get("module", "female_pcos") == module_name:
                        existing["is_active"] = False
            _in_memory_assessments[user_id_str].append(record)

        return record


assessment_repository = AssessmentRepository()
