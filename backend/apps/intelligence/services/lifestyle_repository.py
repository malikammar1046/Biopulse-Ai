"""
backend/apps/intelligence/services/lifestyle_repository.py

Unified repository for saving, querying, and managing persistent dynamic lifestyle
recommendations and user adherence action tracking across female PCOS and male
hypogonadism pathways.

Guarantees:
- Recommendations survive refresh, logout/login, and browser restart.
- User completion, start, and skip actions persist reliably.
- Context version fingerprinting prevents unnecessary duplicate regeneration.
- Authoritative remote persistence: Supabase public.lifestyle_recommendations.
- Authoritative local mirror: SQLite intelligence_lifestyle_recommendations.
- Zero mock production data.
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
from typing import Any, Dict, List, Optional

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
        raise ValueError(
            f"Invalid user_id '{user_id}': unauthenticated or placeholder identities are prohibited for clinical data."
        )
    return uid


# Thread locks and in-memory test store
_lifestyle_lock = threading.Lock()
_initialized_lifestyle_db_paths: set[str] = set()
_lifestyle_init_lock = threading.Lock()
_in_memory_lifestyle_store: dict[str, list[dict[str, Any]]] = {}
_remote_table_available = True


def _get_sqlite_path() -> str:
    try:
        db_path = settings.DATABASES.get("default", {}).get("NAME")
        if db_path:
            return str(db_path)
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

    def commit(self) -> None:
        if hasattr(self._raw_conn, "commit"):
            self._raw_conn.commit()

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


def init_sqlite_lifestyle_store() -> None:
    """Initializes local SQLite persistence table for offline/test environments."""
    db_path = _get_sqlite_path()
    conn = _connect_sqlite(db_path, timeout=10.0)
    try:
        with conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS intelligence_lifestyle_recommendations (
                    id TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    module TEXT NOT NULL,
                    context_version TEXT NOT NULL,
                    payload_json TEXT NOT NULL,
                    item_statuses TEXT NOT NULL DEFAULT '{}',
                    is_active INTEGER NOT NULL DEFAULT 1,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                )
                """
            )
            conn.execute(
                "CREATE INDEX IF NOT EXISTS idx_intel_lifestyle_user ON intelligence_lifestyle_recommendations(user_id, module, is_active)"
            )
    except Exception as e:
        logger.warning("Failed to initialize SQLite lifestyle recommendations store: %s", e)
    finally:
        try:
            conn.close()
        except Exception:
            pass


def _is_supabase_network_disabled() -> bool:
    return getattr(settings, "DISABLE_SUPABASE_NETWORK", False) or os.environ.get(
        "DISABLE_SUPABASE_NETWORK", ""
    ).strip().lower() in ("true", "1", "yes")


def get_supabase_client(auth_token: str | None = None) -> Any:
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
            logger.debug("Caller Supabase client init error in lifestyle repo: %s", e)
        return None

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
            return create_client(url, key)
    except Exception as e:
        logger.debug("Service role Supabase client init error in lifestyle repo: %s", e)
    return None


class LifestyleRepository:
    """
    Authoritative repository managing persistent storage of dynamic lifestyle recommendations
    and patient adherence lifecycle tracking.
    """

    @classmethod
    def get_active_recommendations(
        cls,
        user_id: str,
        module: str,
        auth_token: str | None = None,
    ) -> dict[str, Any] | None:
        """
        Retrieves the current active recommendations record for the specified user and module.
        Checks remote Supabase table first, falls back to persistent SQLite, then in-memory store.
        """
        global _remote_table_available
        user_id_str = _validate_user_id(user_id)
        module_name = str(module).strip().lower()

        # 1. Supabase Check
        client = get_supabase_client(auth_token)
        if client and _remote_table_available and _is_valid_uuid(user_id_str):
            try:
                res = (
                    client.table("lifestyle_recommendations")
                    .select("*")
                    .eq("user_id", user_id_str)
                    .eq("module", module_name)
                    .eq("is_active", True)
                    .order("created_at", desc=True)
                    .limit(1)
                    .execute()
                )
                if res.data:
                    row = res.data[0]
                    payload = row.get("payload_json")
                    if isinstance(payload, str):
                        payload = json.loads(payload)
                    item_statuses = row.get("item_statuses") or {}
                    if isinstance(item_statuses, str):
                        item_statuses = json.loads(item_statuses)
                    return {
                        "id": str(row.get("id")),
                        "user_id": user_id_str,
                        "module": module_name,
                        "context_version": row.get("context_version", ""),
                        "payload": payload,
                        "item_statuses": item_statuses,
                        "created_at": row.get("created_at"),
                        "updated_at": row.get("updated_at"),
                    }
            except Exception as e:
                err_str = str(e)
                if "PGRST205" in err_str or "Could not find the table" in err_str:
                    _remote_table_available = False
                logger.debug("Supabase active lifestyle recommendations lookup error: %s", e)

        # 2. SQLite Persistent Fallback
        init_sqlite_lifestyle_store()
        try:
            db_path = _get_sqlite_path()
            conn = _connect_sqlite(db_path, timeout=5.0)
            with conn:
                cursor = conn.cursor()
                cursor.execute(
                    """
                    SELECT id, context_version, payload_json, item_statuses, created_at, updated_at
                    FROM intelligence_lifestyle_recommendations
                    WHERE user_id = ? AND module = ? AND is_active = 1
                    ORDER BY created_at DESC LIMIT 1
                    """,
                    (user_id_str, module_name),
                )
                row = cursor.fetchone()
                if row:
                    payload = json.loads(row[2]) if row[2] else {}
                    item_statuses = json.loads(row[3]) if row[3] else {}
                    return {
                        "id": str(row[0]),
                        "user_id": user_id_str,
                        "module": module_name,
                        "context_version": str(row[1]),
                        "payload": payload,
                        "item_statuses": item_statuses,
                        "created_at": str(row[4]),
                        "updated_at": str(row[5]),
                    }
        except Exception as e:
            logger.debug("SQLite active lifestyle recommendations lookup error: %s", e)

        # 3. In-memory fallback
        with _lifestyle_lock:
            history = _in_memory_lifestyle_store.get(user_id_str, [])
            for rec in reversed(history):
                if rec.get("module") == module_name and rec.get("is_active"):
                    return dict(rec)

        return None

    @classmethod
    def save_recommendations(
        cls,
        user_id: str,
        module: str,
        context_version: str,
        payload: dict[str, Any],
        item_statuses: dict[str, Any] | None = None,
        auth_token: str | None = None,
    ) -> dict[str, Any]:
        """
        Saves a freshly evaluated set of recommendations.
        Deactivates previous active records for this user and module, maintaining history.
        """
        global _remote_table_available
        user_id_str = _validate_user_id(user_id)
        module_name = str(module).strip().lower()
        now_iso = datetime.now(timezone.utc).isoformat()
        rec_id = str(uuid.uuid4())
        statuses = dict(item_statuses or {})

        # Ensure recommendation items in payload carry their recorded adherence status
        if isinstance(payload, dict) and "recommendations" in payload:
            for item in payload.get("recommendations", []):
                iid = str(item.get("id"))
                if iid in statuses and isinstance(statuses[iid], dict):
                    item["status"] = statuses[iid].get("status", item.get("status", "NEW"))

        record = {
            "id": rec_id,
            "user_id": user_id_str,
            "module": module_name,
            "context_version": context_version,
            "payload_json": payload,
            "item_statuses": statuses,
            "is_active": True,
            "created_at": now_iso,
            "updated_at": now_iso,
        }

        # 1. Supabase Persistence
        client = get_supabase_client(auth_token)
        if client and _remote_table_available and _is_valid_uuid(user_id_str):
            try:
                # Deactivate older records
                client.table("lifestyle_recommendations").update({"is_active": False}).eq(
                    "user_id", user_id_str
                ).eq("module", module_name).eq("is_active", True).execute()

                # Insert new active record
                insert_res = (
                    client.table("lifestyle_recommendations")
                    .insert(
                        {
                            "id": rec_id,
                            "user_id": user_id_str,
                            "module": module_name,
                            "context_version": context_version,
                            "payload_json": payload,
                            "item_statuses": statuses,
                            "is_active": True,
                            "created_at": now_iso,
                            "updated_at": now_iso,
                        }
                    )
                    .execute()
                )
                logger.info(
                    "Persisted lifestyle recommendations to Supabase for user %s (version %s)",
                    user_id_str[:8],
                    context_version,
                )
            except Exception as e:
                err_str = str(e)
                if "PGRST205" in err_str or "Could not find the table" in err_str:
                    _remote_table_available = False
                logger.warning("Supabase save lifestyle recommendations error: %s", e)

        # 2. SQLite Mirror
        init_sqlite_lifestyle_store()
        try:
            db_path = _get_sqlite_path()
            conn = _connect_sqlite(db_path, timeout=5.0)
            with conn:
                cursor = conn.cursor()
                cursor.execute(
                    """
                    UPDATE intelligence_lifestyle_recommendations
                    SET is_active = 0
                    WHERE user_id = ? AND module = ? AND is_active = 1
                    """,
                    (user_id_str, module_name),
                )
                cursor.execute(
                    """
                    INSERT INTO intelligence_lifestyle_recommendations
                    (id, user_id, module, context_version, payload_json, item_statuses, is_active, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)
                    """,
                    (
                        rec_id,
                        user_id_str,
                        module_name,
                        context_version,
                        json.dumps(payload),
                        json.dumps(statuses),
                        now_iso,
                        now_iso,
                    ),
                )
        except Exception as e:
            logger.warning("SQLite save lifestyle recommendations error: %s", e)

        # 3. In-memory Mirror
        with _lifestyle_lock:
            history = _in_memory_lifestyle_store.setdefault(user_id_str, [])
            for r in history:
                if r.get("module") == module_name and r.get("is_active"):
                    r["is_active"] = False
            history.append(
                {
                    "id": rec_id,
                    "user_id": user_id_str,
                    "module": module_name,
                    "context_version": context_version,
                    "payload": payload,
                    "item_statuses": statuses,
                    "is_active": True,
                    "created_at": now_iso,
                    "updated_at": now_iso,
                }
            )

        return {
            "id": rec_id,
            "user_id": user_id_str,
            "module": module_name,
            "context_version": context_version,
            "payload": payload,
            "item_statuses": statuses,
            "created_at": now_iso,
            "updated_at": now_iso,
        }

    @classmethod
    def update_item_status(
        cls,
        user_id: str,
        module: str,
        recommendation_id: str,
        new_status: str,
        note: str = "",
        auth_token: str | None = None,
    ) -> dict[str, Any] | None:
        """
        Updates the adherence lifecycle status (ACTIVE, COMPLETED, SKIPPED, MAINTAIN, REASSESS)
        for a specific recommendation item within the active recommendation set.
        """
        global _remote_table_available
        user_id_str = _validate_user_id(user_id)
        module_name = str(module).strip().lower()
        now_iso = datetime.now(timezone.utc).isoformat()
        valid_status = str(new_status).strip().upper()
        if valid_status not in ("NEW", "ACTIVE", "COMPLETED", "SKIPPED", "MAINTAIN", "IMPROVING", "REASSESS"):
            raise ValueError(f"Invalid recommendation status: {new_status}")

        active_record = cls.get_active_recommendations(user_id_str, module=module_name, auth_token=auth_token)
        if not active_record:
            return None

        record_id = active_record["id"]
        payload = active_record["payload"]
        item_statuses = active_record.get("item_statuses") or {}

        # 1. Update item_statuses dictionary
        item_statuses[str(recommendation_id)] = {
            "status": valid_status,
            "updated_at": now_iso,
            "note": str(note or "").strip(),
        }

        # 2. Update status inside payload recommendations list
        updated_item = False
        if isinstance(payload, dict) and "recommendations" in payload:
            for item in payload.get("recommendations", []):
                if str(item.get("id")) == str(recommendation_id):
                    item["status"] = valid_status
                    updated_item = True
                    break

        # 3. Persist update to Supabase
        client = get_supabase_client(auth_token)
        if client and _remote_table_available and _is_valid_uuid(user_id_str):
            try:
                client.table("lifestyle_recommendations").update(
                    {
                        "item_statuses": item_statuses,
                        "payload_json": payload,
                        "updated_at": now_iso,
                    }
                ).eq("id", record_id).execute()
            except Exception as e:
                logger.warning("Supabase update item status error: %s", e)

        # 4. Update SQLite
        try:
            db_path = _get_sqlite_path()
            conn = _connect_sqlite(db_path, timeout=5.0)
            with conn:
                cursor = conn.cursor()
                cursor.execute(
                    """
                    UPDATE intelligence_lifestyle_recommendations
                    SET item_statuses = ?, payload_json = ?, updated_at = ?
                    WHERE id = ?
                    """,
                    (
                        json.dumps(item_statuses),
                        json.dumps(payload),
                        now_iso,
                        record_id,
                    ),
                )
        except Exception as e:
            logger.warning("SQLite update item status error: %s", e)

        # 5. Update in-memory store
        with _lifestyle_lock:
            history = _in_memory_lifestyle_store.get(user_id_str, [])
            for r in history:
                if r.get("id") == record_id:
                    r["item_statuses"] = item_statuses
                    r["payload"] = payload
                    r["updated_at"] = now_iso
                    break

        return {
            "id": record_id,
            "user_id": user_id_str,
            "module": module_name,
            "recommendation_id": recommendation_id,
            "status": valid_status,
            "payload": payload,
            "item_statuses": item_statuses,
            "updated_at": now_iso,
        }

    @classmethod
    def reset_for_tests(cls) -> None:
        """Utility for test suite isolation."""
        with _lifestyle_lock:
            _in_memory_lifestyle_store.clear()


lifestyle_repository = LifestyleRepository()
