"""
backend/apps/intelligence/services/assessment_repository.py
Repository for saving, querying, and managing progressive cumulative PCOS assessments.

Preserves assessment history while maintaining exactly ONE active assessment per patient.
"""

from __future__ import annotations

import logging
import os
import threading
import uuid
from datetime import datetime, timezone
from typing import Any

logger = logging.getLogger(__name__)

# In-memory store for unit testing or fallback when Supabase connection is offline
_in_memory_assessments: dict[str, list[dict[str, Any]]] = {}
_repo_lock = threading.Lock()
_remote_table_available = True


def get_supabase_client(auth_token: str | None = None) -> Any:
    """Returns an authenticated Supabase client using SUPABASE_ANON_KEY and caller JWT."""
    global _remote_table_available
    if not _remote_table_available:
        return None
    try:
        from supabase import create_client
        url = os.environ.get("SUPABASE_URL", "") or os.environ.get("VITE_SUPABASE_URL", "")
        key = (
            os.environ.get("SUPABASE_ANON_KEY", "")
            or os.environ.get("VITE_SUPABASE_ANON_KEY", "")
            or os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
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
    """

    @classmethod
    def get_active_assessment(
        cls,
        user_id: str,
        module: str | None = None,
        auth_token: str | None = None,
    ) -> dict[str, Any] | None:
        """
        Retrieves the latest active assessment for the specified patient and module.
        """
        global _remote_table_available
        client = get_supabase_client(auth_token)
        if client and _remote_table_available:
            try:
                query = (
                    client.table("pcos_assessments")
                    .select("*")
                    .eq("user_id", str(user_id))
                    .eq("is_active", True)
                )
                if module:
                    query = query.eq("module", module)
                res = query.order("created_at", desc=True).limit(1).execute()
                if res.data and len(res.data) > 0:
                    return res.data[0]
            except Exception as e:
                err_str = str(e)
                if "PGRST205" in err_str or "Could not find the table" in err_str:
                    _remote_table_available = False
                logger.warning("Failed to fetch active assessment from Supabase: %s", e)

        # In-memory fallback
        with _repo_lock:
            user_records = _in_memory_assessments.get(str(user_id), [])
            for rec in reversed(user_records):
                if rec.get("is_active", False):
                    if module and rec.get("module", "female_pcos") != module:
                        continue
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
        client = get_supabase_client(auth_token)
        if client and _remote_table_available:
            try:
                query = client.table("pcos_assessments").select("*").eq("user_id", str(user_id))
                if module:
                    query = query.eq("module", module)
                res = query.order("created_at", desc=True).execute()
                if res.data:
                    return res.data
            except Exception as e:
                err_str = str(e)
                if "PGRST205" in err_str or "Could not find the table" in err_str:
                    _remote_table_available = False
                logger.warning("Failed to fetch assessment history from Supabase: %s", e)

        # In-memory fallback
        with _repo_lock:
            user_records = _in_memory_assessments.get(str(user_id), [])
            if module:
                user_records = [r for r in user_records if r.get("module", "female_pcos") == module]
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
        Saves an assessment record.
        If make_active=True, deactivates previous active assessments of the same module and links replaced_assessment_id.
        """
        user_id_str = str(user_id)
        now_iso = datetime.now(timezone.utc).isoformat()
        new_id = str(uuid.uuid4())
        module_name = assessment_data.get("module", "female_pcos")

        previous_active = cls.get_active_assessment(user_id_str, module=module_name, auth_token=auth_token) if make_active else None
        replaced_id = previous_active["id"] if previous_active else None

        record = {
            "id": new_id,
            "user_id": user_id_str,
            "module": module_name,
            "assessment_level": assessment_data.get("assessment_level", "tier_1"),
            "tiers_included": assessment_data.get("tiers_included", [1]),
            "model_name": assessment_data.get("model_name", "PCOS-ML"),
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

        # Save to Supabase
        global _remote_table_available
        client = get_supabase_client(auth_token)
        if client and _remote_table_available:
            try:
                if make_active and replaced_id:
                    # Deactivate previous active assessment of the same module
                    client.table("pcos_assessments").update({"is_active": False}).eq("user_id", user_id_str).eq("is_active", True).eq("module", module_name).execute()

                res = client.table("pcos_assessments").insert(record).execute()
                if res.data and len(res.data) > 0:
                    record = res.data[0]
            except Exception as e:
                err_str = str(e)
                if "PGRST205" in err_str or "Could not find the table" in err_str:
                    _remote_table_available = False
                logger.warning("Supabase insert assessment error, saving to memory fallback: %s", e)

        # In-memory store sync
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
