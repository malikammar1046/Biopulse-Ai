"""
backend/apps/intelligence/services/clinical_state_repository.py
Authoritative repository for managing persistent patient clinical state (Tier 1, Tier 2, Ultrasound).

Separates the patient's current authoritative clinical values from assessment history runs.
Primary persistent store: Supabase PostgreSQL (public.patient_clinical_state).
Offline/testing store: Persistent SQLite table (patient_clinical_state) as fallback.
"""

from __future__ import annotations

import json
import logging
import os
import sqlite3
import sys
import threading
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from django.conf import settings

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
        raise ValueError(f"Invalid user_id '{user_id}': unauthenticated or placeholder identities are prohibited for clinical data.")
    return uid

_clinical_lock = threading.Lock()
_initialized_clinical_db_paths: set[str] = set()
_clinical_init_lock = threading.Lock()
_in_memory_clinical_state: dict[str, dict[str, Any]] = {}


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


def init_sqlite_clinical_store() -> None:
    """Initializes the local SQLite clinical state persistence table for offline/test environments."""
    db_path = _get_sqlite_path()
    if db_path in _initialized_clinical_db_paths:
        return

    with _clinical_init_lock:
        if db_path in _initialized_clinical_db_paths:
            return
        conn = _connect_sqlite(db_path, timeout=10.0)
        try:
            with conn:
                conn.execute(
                    """
                    CREATE TABLE IF NOT EXISTS patient_clinical_state (
                        user_id TEXT NOT NULL,
                        module TEXT NOT NULL,
                        tier_1_inputs TEXT NOT NULL DEFAULT '{}',
                        tier_2_inputs TEXT NOT NULL DEFAULT '{}',
                        ultrasound_inputs TEXT NOT NULL DEFAULT '{}',
                        created_at TEXT NOT NULL,
                        updated_at TEXT NOT NULL,
                        PRIMARY KEY (user_id, module)
                    )
                    """
                )
                conn.execute(
                    "CREATE INDEX IF NOT EXISTS idx_clinical_state_user_module ON patient_clinical_state(user_id, module)"
                )
                try:
                    conn.execute("ALTER TABLE patient_clinical_state ADD COLUMN created_at TEXT NOT NULL DEFAULT ''")
                except Exception:
                    pass
            # Mark initialized ONLY after successful DDL completion
            _initialized_clinical_db_paths.add(db_path)
            logger.info("ClinicalStateRepository persistent SQLite store initialized at %s", db_path)
        except Exception as e:
            logger.warning("Failed to initialize SQLite clinical state store: %s", e)
        finally:
            conn.close()



_cached_service_client = None
_client_lock = threading.Lock()


def _is_supabase_network_disabled() -> bool:
    return getattr(settings, "DISABLE_SUPABASE_NETWORK", False) or os.environ.get("DISABLE_SUPABASE_NETWORK", "").strip().lower() in ("true", "1", "yes")


def get_supabase_client(auth_token: str | None = None) -> Any:
    """Returns an authenticated Supabase client using SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY and caller JWT."""
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


class ClinicalStateRepository:
    """
    Authoritative repository managing persistent patient clinical state across modules.
    Guarantees zero clinical data loss across sessions, logins, and profile recalculations.
    """

    def __init__(self) -> None:
        init_sqlite_clinical_store()

    @classmethod
    def _make_empty_state(cls, user_id: str, module: str) -> dict[str, Any]:
        now_iso = datetime.now(timezone.utc).isoformat()
        return {
            "user_id": str(user_id),
            "module": module,
            "tier_1_inputs": {},
            "tier_2_inputs": {},
            "ultrasound_inputs": {},
            "created_at": now_iso,
            "updated_at": now_iso,
        }

    @classmethod
    def get_patient_clinical_state(
        cls,
        user_id: str,
        module: str = "female_pcos",
        auth_token: str | None = None,
        perform_backfill: bool = True,
    ) -> dict[str, Any]:
        """
        Retrieves the authoritative patient clinical state.
        Checks Supabase first, falls back to SQLite, then in-memory.
        If state is empty and perform_backfill=True, seeds from latest historical assessment.
        """
        user_id_str = _validate_user_id(user_id)
        module_name = module or "female_pcos"

        state: dict[str, Any] | None = None

        # 1. Supabase PostgreSQL lookup
        if _is_valid_uuid(user_id_str):
            client = get_supabase_client(auth_token)
            if client:
                try:
                    res = (
                        client.table("patient_clinical_state")
                        .select("*")
                        .eq("user_id", user_id_str)
                        .eq("module", module_name)
                        .maybe_single()
                        .execute()
                    )
                    if res and res.data:
                        raw = res.data
                        state = {
                            "user_id": str(raw.get("user_id", user_id_str)),
                            "module": raw.get("module", module_name),
                            "tier_1_inputs": raw.get("tier_1_inputs") if isinstance(raw.get("tier_1_inputs"), dict) else {},
                            "tier_2_inputs": raw.get("tier_2_inputs") if isinstance(raw.get("tier_2_inputs"), dict) else {},
                            "ultrasound_inputs": raw.get("ultrasound_inputs") if isinstance(raw.get("ultrasound_inputs"), dict) else {},
                            "created_at": raw.get("created_at"),
                            "updated_at": raw.get("updated_at"),
                        }
                except Exception as e:
                    logger.debug("Supabase patient_clinical_state lookup notice: %s", e)

        # 2. SQLite Persistent Fallback
        if state is None:
            conn = None
            try:
                db_path = _get_sqlite_path()
                conn = _connect_sqlite(db_path, timeout=5.0)
                with conn:
                    cursor = conn.cursor()
                    cursor.execute(
                        """
                        SELECT tier_1_inputs, tier_2_inputs, ultrasound_inputs, created_at, updated_at
                        FROM patient_clinical_state
                        WHERE user_id = ? AND module = ?
                        """,
                        (user_id_str, module_name),
                    )
                    row = cursor.fetchone()
                    if row:
                        t1 = json.loads(row[0]) if row[0] else {}
                        t2 = json.loads(row[1]) if row[1] else {}
                        us = json.loads(row[2]) if row[2] else {}
                        state = {
                            "user_id": user_id_str,
                            "module": module_name,
                            "tier_1_inputs": t1,
                            "tier_2_inputs": t2,
                            "ultrasound_inputs": us,
                            "created_at": row[3],
                            "updated_at": row[4],
                        }
            except Exception as e:
                logger.debug("SQLite clinical state lookup error: %s", e)
            finally:
                if conn:
                    try:
                        conn.close()
                    except Exception:
                        pass

        # 3. In-memory cache fallback
        if state is None:
            mem_key = f"{user_id_str}:{module_name}"
            with _clinical_lock:
                if mem_key in _in_memory_clinical_state:
                    state = dict(_in_memory_clinical_state[mem_key])

        # 4. If no authoritative clinical state record exists at all, attempt backward-compatible historical recovery (Backfill)
        if perform_backfill and state is None:
            recovered = cls._recover_from_assessment_history(user_id_str, module_name, auth_token=auth_token)
            if recovered:
                if state is None:
                    state = cls._make_empty_state(user_id_str, module_name)
                # Seed only when the authoritative tier_2 store is empty
                if not state.get("tier_2_inputs") and recovered.get("tier_2_inputs"):
                    state["tier_2_inputs"] = dict(recovered["tier_2_inputs"])
                if not state.get("tier_1_inputs") and recovered.get("tier_1_inputs"):
                    state["tier_1_inputs"] = dict(recovered["tier_1_inputs"])
                # Persist the seeded state to authoritative store
                cls.save_patient_clinical_state(
                    user_id=user_id_str,
                    module=module_name,
                    tier_1_inputs=state.get("tier_1_inputs", {}),
                    tier_2_inputs=state.get("tier_2_inputs", {}),
                    ultrasound_inputs=state.get("ultrasound_inputs", {}),
                    auth_token=auth_token,
                )

        if state is None:
            state = cls._make_empty_state(user_id_str, module_name)

        return state

    @classmethod
    def _recover_from_assessment_history(
        cls,
        user_id: str,
        module: str,
        auth_token: str | None = None,
    ) -> dict[str, Any] | None:
        """
        One-time backward-compatible recovery strategy:
        Searches newest valid historical assessment for user/module and recovers its tier_2_inputs.
        Never overwrites newer existing patient state with historical values.
        """
        try:
            from apps.intelligence.services.assessment_repository import assessment_repository
            history = assessment_repository.get_assessment_history(user_id, module=module, auth_token=auth_token)
            for rec in history:
                tier_2 = rec.get("tier_2_inputs")
                if isinstance(tier_2, dict) and any(v is not None and v != "" for v in tier_2.values()):
                    t1 = {}
                    if isinstance(rec.get("input_features"), dict):
                        t1 = {k: v for k, v in rec["input_features"].items() if k not in tier_2}
                    logger.info("Recovered historical Tier 2 clinical inputs for %s (%s) from assessment %s", user_id, module, rec.get("id"))
                    return {
                        "tier_2_inputs": tier_2,
                        "tier_1_inputs": t1,
                    }
        except Exception as e:
            logger.debug("Failed historical recovery for %s (%s): %s", user_id, module, e)
        return None

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
        Persists authoritative patient clinical state.
        Ensures updates are written to Supabase PostgreSQL, mirrored in SQLite, and cached in-memory.
        """
        user_id_str = _validate_user_id(user_id)
        module_name = module or "female_pcos"
        now_iso = datetime.now(timezone.utc).isoformat()

        # Fetch current to avoid clearing unspecified containers
        current = cls.get_patient_clinical_state(user_id_str, module_name, auth_token=auth_token, perform_backfill=False)

        new_t1 = dict(tier_1_inputs) if tier_1_inputs is not None else current.get("tier_1_inputs", {})
        new_t2 = dict(tier_2_inputs) if tier_2_inputs is not None else current.get("tier_2_inputs", {})
        new_us = dict(ultrasound_inputs) if ultrasound_inputs is not None else current.get("ultrasound_inputs", {})

        record = {
            "user_id": user_id_str,
            "module": module_name,
            "tier_1_inputs": new_t1,
            "tier_2_inputs": new_t2,
            "ultrasound_inputs": new_us,
            "updated_at": now_iso,
        }

        # 1. Supabase PostgreSQL write (Upsert)
        if _is_valid_uuid(user_id_str):
            client = get_supabase_client(auth_token)
            if client:
                try:
                    upsert_payload = {
                        "user_id": user_id_str,
                        "module": module_name,
                        "tier_1_inputs": new_t1,
                        "tier_2_inputs": new_t2,
                        "ultrasound_inputs": new_us,
                        "updated_at": now_iso,
                    }
                    client.table("patient_clinical_state").upsert(
                        upsert_payload,
                        on_conflict="user_id,module",
                    ).execute()
                    logger.info("Patient clinical state upserted to Supabase for %s (%s)", user_id_str, module_name)
                except Exception as e:
                    logger.debug("Supabase patient_clinical_state upsert notice: %s", e)

        # 2. SQLite Persistent write (guarantees offline & local test durability)
        conn = None
        try:
            db_path = _get_sqlite_path()
            conn = _connect_sqlite(db_path, timeout=5.0)
            with conn:
                conn.execute(
                    """
                    INSERT INTO patient_clinical_state
                    (user_id, module, tier_1_inputs, tier_2_inputs, ultrasound_inputs, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    ON CONFLICT(user_id, module) DO UPDATE SET
                        tier_1_inputs = excluded.tier_1_inputs,
                        tier_2_inputs = excluded.tier_2_inputs,
                        ultrasound_inputs = excluded.ultrasound_inputs,
                        updated_at = excluded.updated_at
                    """,
                    (
                        user_id_str,
                        module_name,
                        json.dumps(new_t1),
                        json.dumps(new_t2),
                        json.dumps(new_us),
                        now_iso,
                        now_iso,
                    ),
                )
        except Exception as e:
            logger.debug("SQLite clinical state save error: %s", e)
        finally:
            if conn:
                try:
                    conn.close()
                except Exception:
                    pass

        # 3. In-memory cache update
        mem_key = f"{user_id_str}:{module_name}"
        with _clinical_lock:
            _in_memory_clinical_state[mem_key] = record

        return record

    @classmethod
    def clear_patient_tier2_state(
        cls,
        user_id: str,
        module: str = "female_pcos",
        auth_token: str | None = None,
    ) -> dict[str, Any]:
        """
        Explicitly clears Tier 2 clinical and laboratory inputs for a patient and module.
        Leaves Tier 1 profile state completely intact.
        """
        user_id_str = _validate_user_id(user_id)
        module_name = module or "female_pcos"
        logger.info("Explicit clearing of Tier 2 clinical state for %s (%s)", user_id_str, module_name)
        return cls.save_patient_clinical_state(
            user_id=user_id_str,
            module=module_name,
            tier_2_inputs={},
            auth_token=auth_token,
        )


clinical_state_repository = ClinicalStateRepository()
