"""
backend/apps/intelligence/services/assessment_repository.py
Repository for saving, querying, and managing progressive cumulative PCOS assessments.

Preserves assessment history while maintaining exactly ONE active assessment per patient.
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

logger = logging.getLogger(__name__)

# In-memory store for unit testing
_in_memory_assessments: dict[str, list[dict[str, Any]]] = {}
_repo_lock = threading.Lock()
_remote_table_available = True
_sqlite_initialized = False


def _get_sqlite_path() -> str:
    try:
        db_path = settings.DATABASES.get("default", {}).get("NAME")
        if db_path:
            return str(db_path)
    except Exception:
        pass
    default_path = Path(__file__).resolve().parent.parent.parent.parent / "db.sqlite3"
    return str(default_path)


def init_sqlite_store() -> None:
    """Initializes the local SQLite assessment persistence table."""
    global _sqlite_initialized
    if _sqlite_initialized:
        return
    with _repo_lock:
        if _sqlite_initialized:
            return
        db_path = _get_sqlite_path()
        try:
            conn = sqlite3.connect(db_path, timeout=10.0)
            with conn:
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
            conn.close()
            _sqlite_initialized = True
            logger.info("AssessmentRepository persistent SQLite store initialized at %s", db_path)
        except Exception as e:
            logger.warning("Failed to initialize SQLite assessment store: %s", e)


def get_supabase_client(auth_token: str | None = None) -> Any:
    """Returns an authenticated Supabase client using SUPABASE_ANON_KEY and caller JWT."""
    global _remote_table_available
    if not _remote_table_available:
        return None
    try:
        from supabase import create_client
        url = os.environ.get("SUPABASE_URL", "") or os.environ.get("VITE_SUPABASE_URL", "")
        key = (
            os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
            or os.environ.get("SUPABASE_ANON_KEY", "")
            or os.environ.get("VITE_SUPABASE_ANON_KEY", "")
        )
        if url and key:
            client = create_client(url, key)
            if auth_token:
                try:
                    client.postgrest.auth(auth_token)
                except Exception:
                    pass
            return client
    except Exception as e:
        logger.debug("Supabase client init error: %s", e)
    return None


class AssessmentRepository:
    """
    Manages persistence of progressive assessments across female PCOS and male hypogonadism modules.
    Ensures 100% data persistence by backing records in SQLite with optional Supabase synchronization.
    """

    def __init__(self) -> None:
        init_sqlite_store()

    @classmethod
    def init_sqlite_store(cls) -> None:
        init_sqlite_store()

    @classmethod
    def get_active_assessment(
        cls,
        user_id: str,
        module: str | None = None,
        auth_token: str | None = None,
    ) -> dict[str, Any] | None:
        """
        Retrieves the latest active assessment for the specified patient and module.
        Checks Supabase first, falls back to persistent SQLite, then in-memory store.
        """
        global _remote_table_available
        module_name = module or "female_pcos"
        user_id_str = str(user_id)

        # 1. Supabase Check
        client = get_supabase_client(auth_token)
        if client and _remote_table_available:
            try:
                query = (
                    client.table("pcos_assessments")
                    .select("*")
                    .eq("user_id", user_id_str)
                    .eq("is_active", True)
                )
                res = query.order("created_at", desc=True).limit(5).execute()
                if res.data:
                    for item in res.data:
                        if item.get("module", "female_pcos") == module_name:
                            return item
                    return res.data[0]
            except Exception as e:
                err_str = str(e)
                if "PGRST205" in err_str or "Could not find the table" in err_str:
                    _remote_table_available = False
                logger.debug("Supabase active assessment lookup: %s", e)

        # 2. SQLite Persistent Fallback
        init_sqlite_store()
        conn = None
        try:
            db_path = _get_sqlite_path()
            conn = sqlite3.connect(db_path, timeout=5.0)
            with conn:
                cursor = conn.cursor()
                cursor.execute(
                    """
                    SELECT payload_json FROM intelligence_assessments
                    WHERE user_id = ? AND is_active = 1 AND module = ?
                    ORDER BY created_at DESC LIMIT 1
                    """,
                    (user_id_str, module_name),
                )
                row = cursor.fetchone()
                if row and row[0]:
                    rec = json.loads(row[0])
                    return rec
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
                    if rec.get("module", "female_pcos") == module_name:
                        return rec
            # Fallback if module was not explicitly matched
            for rec in reversed(user_records):
                if rec.get("is_active", False):
                    return rec
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
        """
        global _remote_table_available
        user_id_str = str(user_id)
        module_name = module

        # 1. Supabase Check
        client = get_supabase_client(auth_token)
        if client and _remote_table_available:
            try:
                query = client.table("pcos_assessments").select("*").eq("user_id", user_id_str)
                res = query.order("created_at", desc=True).execute()
                if res.data:
                    if module_name:
                        return [r for r in res.data if r.get("module", "female_pcos") == module_name]
                    return res.data
            except Exception as e:
                err_str = str(e)
                if "PGRST205" in err_str or "Could not find the table" in err_str:
                    _remote_table_available = False
                logger.debug("Supabase history lookup: %s", e)

        # 2. SQLite Persistent Fallback
        init_sqlite_store()
        conn = None
        try:
            db_path = _get_sqlite_path()
            conn = sqlite3.connect(db_path, timeout=5.0)
            with conn:
                cursor = conn.cursor()
                if module_name:
                    cursor.execute(
                        """
                        SELECT payload_json FROM intelligence_assessments
                        WHERE user_id = ? AND module = ?
                        ORDER BY created_at DESC
                        """,
                        (user_id_str, module_name),
                    )
                else:
                    cursor.execute(
                        """
                        SELECT payload_json FROM intelligence_assessments
                        WHERE user_id = ?
                        ORDER BY created_at DESC
                        """,
                        (user_id_str,),
                    )
                rows = cursor.fetchall()
                if rows:
                    return [json.loads(r[0]) for r in rows if r[0]]
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
            return sorted(user_records, key=lambda x: x.get("created_at", ""), reverse=True)

    @classmethod
    def save_assessment(
        cls,
        user_id: str,
        assessment_data: dict[str, Any],
        make_active: bool = True,
        auth_token: str | None = None,
    ) -> dict[str, Any]:
        """
        Saves an assessment record with guaranteed persistence in SQLite and synchronization to Supabase.
        If make_active=True, deactivates previous active assessments of the same module.
        """
        user_id_str = str(user_id)
        now_iso = datetime.now(timezone.utc).isoformat()
        new_id = str(uuid.uuid4())
        module_name = assessment_data.get("module", "female_pcos")
        level = assessment_data.get("assessment_level", "tier_1")

        previous_active = cls.get_active_assessment(user_id_str, module=module_name, auth_token=auth_token) if make_active else None
        replaced_id = previous_active["id"] if previous_active else None

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
            "tier_2_inputs": assessment_data.get("tier_2_inputs", {}),
            "tier_2_available_count": assessment_data.get("tier_2_available_count"),
            "tier_2_total_count": assessment_data.get("tier_2_total_count"),
            "tier_2_available_fields": assessment_data.get("tier_2_available_fields", []),
            "tier_2_missing_fields": assessment_data.get("tier_2_missing_fields", []),
            "evidence_completeness_percent": assessment_data.get("evidence_completeness_percent"),
            "evidence_completeness": assessment_data.get("evidence_completeness", {}),
            "hormone_pattern_interpretation": assessment_data.get("hormone_pattern_interpretation"),
            "direct_laboratory_values": assessment_data.get("direct_laboratory_values", []),
            "explanations": assessment_data.get("explanations", []),
            "limitations": assessment_data.get("limitations", []),
            "next_available_tier": assessment_data.get("next_available_tier"),
            "pcom_status": assessment_data.get("pcom_status"),
            "pcom_probability": assessment_data.get("pcom_probability"),
            "gradcam_url": assessment_data.get("gradcam_url"),
            "gradcam_b64": assessment_data.get("gradcam_b64"),
            "ultrasound_report_id": assessment_data.get("ultrasound_report_id"),
            "status_code": assessment_data.get("status_code"),
            "notice": assessment_data.get("notice"),
            "next_step": assessment_data.get("next_step", ""),
            "disclaimer": assessment_data.get("disclaimer", ""),
            "created_at": now_iso,
            "updated_at": now_iso,
        }

        # 1. Persist to SQLite Store (Guaranteed durability)
        init_sqlite_store()
        conn = None
        try:
            db_path = _get_sqlite_path()
            conn = sqlite3.connect(db_path, timeout=10.0)
            with conn:
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
                        now_iso,
                        json.dumps(record),
                    ),
                )
            logger.info("Assessment %s (level: %s, module: %s) persisted to SQLite store.", new_id, level, module_name)
        except Exception as e:
            logger.error("Failed to write assessment to SQLite: %s", e)
        finally:
            if conn:
                try:
                    conn.close()
                except Exception:
                    pass

        # 2. Synchronize to Supabase (if table exists)
        global _remote_table_available
        client = get_supabase_client(auth_token)
        if client and _remote_table_available:
            try:
                # Prepare payload compatible with Supabase schema
                supabase_record = {
                    "id": new_id,
                    "user_id": user_id_str,
                    "assessment_level": level if level in ('tier_1', 'tier_1_2', 'tier_1_3', 'tier_1_2_3') else 'tier_1',
                    "tiers_included": assessment_data.get("tiers_included", [1]),
                    "model_name": assessment_data.get("model_name", "PMOSense Model"),
                    "model_version": assessment_data.get("model_version", "1.0.0"),
                    "probability": assessment_data.get("probability", 0.0),
                    "probability_percent": assessment_data.get("probability_percent", 0.0),
                    "threshold": assessment_data.get("threshold", 0.38),
                    "risk_category": assessment_data.get("risk_category", "lower"),
                    "is_active": make_active,
                    "replaced_assessment_id": replaced_id,
                    "input_availability": assessment_data.get("input_availability", {}),
                    "input_features": assessment_data.get("input_features", {}),
                    "explanations": assessment_data.get("explanations", []),
                    "limitations": assessment_data.get("limitations", []),
                    "next_available_tier": assessment_data.get("next_available_tier"),
                    "pcom_status": assessment_data.get("pcom_status"),
                    "pcom_probability": assessment_data.get("pcom_probability"),
                    "gradcam_url": assessment_data.get("gradcam_url"),
                    "ultrasound_report_id": assessment_data.get("ultrasound_report_id"),
                    "disclaimer": assessment_data.get("disclaimer", ""),
                    "created_at": now_iso,
                    "updated_at": now_iso,
                }
                if make_active and replaced_id:
                    client.table("pcos_assessments").update({"is_active": False}).eq("user_id", user_id_str).eq("is_active", True).execute()
                client.table("pcos_assessments").insert(supabase_record).execute()
            except Exception as e:
                err_str = str(e)
                if "PGRST205" in err_str or "Could not find the table" in err_str:
                    _remote_table_available = False
                logger.debug("Supabase insert assessment notice (SQLite holds authoritative copy): %s", e)

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
