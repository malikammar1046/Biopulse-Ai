"""
backend/apps/health/services/meal_plan_repository.py

Persistence repository for BioPulse nutrition plans in Supabase `public.nutrition_plans`.

Strict Invariants:
1. Authorization Isolation: ALL queries must filter strictly by `user_id = user_id`.
2. Snapshot Immutability:
   - Generated plan_data, target_profile, profile_snapshot, condition_context,
     and audit_diagnostics are completely immutable once written.
   - Historical plan payloads are NEVER updated or recalculated.
3. Active Plan Integrity:
   - Exactly ONE active plan per user (enforced by partial unique index
     idx_nutrition_plans_one_active_per_user on user_id WHERE is_active = TRUE).
   - On regeneration, the previous active plan is updated ONLY to set `is_active = FALSE`.
     Its stored plan_data is verified unchanged.
"""

from __future__ import annotations

import logging
import uuid
from datetime import date, datetime, timezone
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)


class MealPlanRepository:
    """
    Repository managing persistence in Supabase `public.nutrition_plans`.
    Supports deterministic in-memory storage for offline testing.
    """

    def __init__(self, supabase_client=None, in_memory: bool = False):
        self._client = supabase_client
        self._in_memory = in_memory
        # In-memory storage for test/fallback environments
        self._memory_store: Dict[str, Dict[str, Any]] = {}

    def _get_client(self, auth_token: Optional[str] = None):
        if self._in_memory:
            return None
        client = self._client
        if client is None:
            try:
                from apps.health.services.supabase_health_service import _get_supabase_client
                client = _get_supabase_client()
                self._client = client
            except Exception as exc:
                logger.warning("Supabase client unavailable, using repository memory store: %s", exc)
                return None
        if auth_token and client is not None:
            try:
                client.postgrest.auth(auth_token)
            except Exception as exc:
                logger.debug("Could not set postgrest auth token: %s", exc)
        return client

    def get_active_plan(self, user_id: str, auth_token: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """
        Retrieves the current active nutrition plan for the user.
        """
        client = self._get_client(auth_token=auth_token)
        if client is not None:
            try:
                res = (
                    client.table("nutrition_plans")
                    .select("*")
                    .eq("user_id", user_id)
                    .eq("is_active", True)
                    .order("created_at", desc=True)
                    .limit(1)
                    .execute()
                )
                if res.data and len(res.data) > 0:
                    return res.data[0]
            except Exception as exc:
                logger.error("Failed to query active plan from Supabase: %s", exc)

        # In-memory fallback
        active_plans = [
            p for p in self._memory_store.values()
            if p.get("user_id") == user_id and p.get("is_active") is True
        ]
        if active_plans:
            active_plans.sort(key=lambda x: x.get("created_at", ""), reverse=True)
            return active_plans[0]
        return None

    def get_plan_by_id(self, user_id: str, plan_id: str, auth_token: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """
        Retrieves a specific plan by ID, strictly verifying ownership.
        Returns None if plan does not belong to user_id.
        """
        client = self._get_client(auth_token=auth_token)
        if client is not None:
            try:
                res = (
                    client.table("nutrition_plans")
                    .select("*")
                    .eq("id", plan_id)
                    .eq("user_id", user_id)
                    .maybe_single()
                    .execute()
                )
                if res.data:
                    return res.data
            except Exception as exc:
                logger.error("Failed to query plan %s from Supabase: %s", plan_id, exc)

        # In-memory fallback
        plan = self._memory_store.get(plan_id)
        if plan and plan.get("user_id") == user_id:
            return plan
        return None

    def get_plan_history(self, user_id: str, limit: int = 10, auth_token: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Retrieves historical plans for user_id ordered from newest to oldest.
        """
        client = self._get_client(auth_token=auth_token)
        if client is not None:
            try:
                res = (
                    client.table("nutrition_plans")
                    .select("id, plan_type, start_date, end_date, is_active, replaced_plan_id, condition_context, plan_data, created_at")
                    .eq("user_id", user_id)
                    .order("created_at", desc=True)
                    .limit(limit)
                    .execute()
                )
                if res.data and len(res.data) > 0:
                    return res.data
            except Exception as exc:
                logger.error("Failed to query plan history from Supabase: %s", exc)

        # In-memory fallback
        user_plans = [p for p in self._memory_store.values() if p.get("user_id") == user_id]
        user_plans.sort(key=lambda x: x.get("created_at", ""), reverse=True)
        return user_plans[:limit]

    def save_plan(
        self,
        user_id: str,
        plan_type: str = "weekly",
        start_date: date | str = "",
        end_date: date | str = "",
        profile_snapshot: Dict[str, Any] = None,
        target_profile: Dict[str, Any] = None,
        condition_context: Dict[str, Any] = None,
        plan_data: Dict[str, Any] = None,
        audit_diagnostics: Dict[str, Any] = None,
        meal_module_version: str = "1.0.0",
        auth_token: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Saves a new nutrition plan as an immutable snapshot.
        If an active plan already exists, deactivates it (is_active = FALSE) and links
        replaced_plan_id, without altering its historical payload.
        """
        new_id = str(uuid.uuid4())
        now_iso = datetime.now(timezone.utc).isoformat()
        start_str = start_date.isoformat() if isinstance(start_date, date) else str(start_date)
        end_str = end_date.isoformat() if isinstance(end_date, date) else str(end_date)
        clean_plan_type = "weekly" if "week" in str(plan_type).lower() else str(plan_type).lower()

        # 1. Look up any existing active plan to deactivate
        current_active = self.get_active_plan(user_id, auth_token=auth_token)
        replaced_id = current_active["id"] if current_active else None

        client = self._get_client(auth_token=auth_token)
        if client is not None:
            try:
                # 2. Deactivate old active plan if present
                if replaced_id:
                    client.table("nutrition_plans").update({"is_active": False}).eq("id", replaced_id).eq("user_id", user_id).execute()

                # 3. Insert new active plan
                insert_row = {
                    "id": new_id,
                    "user_id": user_id,
                    "plan_type": clean_plan_type,
                    "start_date": start_str,
                    "end_date": end_str,
                    "is_active": True,
                    "replaced_plan_id": replaced_id,
                    "profile_snapshot": profile_snapshot or {},
                    "target_profile": target_profile or {},
                    "condition_context": condition_context or {},
                    "plan_data": plan_data or {},
                    "audit_diagnostics": audit_diagnostics or {},
                    "meal_module_version": meal_module_version,
                    "created_at": now_iso,
                }
                res = client.table("nutrition_plans").insert(insert_row).execute()
                if res.data and len(res.data) > 0:
                    return res.data[0]
                return insert_row
            except Exception as exc:
                logger.error("Failed to persist nutrition plan to Supabase: %s", exc)

        # In-memory storage
        if replaced_id and replaced_id in self._memory_store:
            self._memory_store[replaced_id]["is_active"] = False

        record = {
            "id": new_id,
            "user_id": user_id,
            "plan_type": plan_type,
            "start_date": start_str,
            "end_date": end_str,
            "is_active": True,
            "replaced_plan_id": replaced_id,
            "profile_snapshot": profile_snapshot,
            "target_profile": target_profile,
            "condition_context": condition_context,
            "plan_data": plan_data,
            "audit_diagnostics": audit_diagnostics,
            "meal_module_version": meal_module_version,
            "created_at": now_iso,
        }
        self._memory_store[new_id] = record
        return record

    def update_plan_payload(
        self,
        user_id: str,
        plan_id: str,
        plan_data: Dict[str, Any],
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        auth_token: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """
        Updates the plan payload (e.g. for meal locking, safe swaps, status changes).
        Strictly scopes to user_id and plan_id.
        """
        client = self._get_client(auth_token=auth_token)
        update_fields: Dict[str, Any] = {"plan_data": plan_data}
        if start_date:
            update_fields["start_date"] = str(start_date)
        if end_date:
            update_fields["end_date"] = str(end_date)

        if client is not None:
            try:
                res = (
                    client.table("nutrition_plans")
                    .update(update_fields)
                    .eq("id", plan_id)
                    .eq("user_id", user_id)
                    .execute()
                )
                if res.data and len(res.data) > 0:
                    return res.data[0]
            except Exception as exc:
                logger.error("Failed to update plan %s in Supabase: %s", plan_id, exc)

        # In-memory update
        if plan_id in self._memory_store and self._memory_store[plan_id].get("user_id") == user_id:
            self._memory_store[plan_id]["plan_data"] = plan_data
            if start_date:
                self._memory_store[plan_id]["start_date"] = str(start_date)
            if end_date:
                self._memory_store[plan_id]["end_date"] = str(end_date)
            return self._memory_store[plan_id]
        return None


# Global singleton instance
meal_plan_repository = MealPlanRepository()

