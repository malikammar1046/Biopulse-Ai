"""
Authoritative Longitudinal Health Service for BioPulse AI.
Assembles historical monitoring data across the Female PCOS and Male Hypogonadism pathways.
Preserves strict pathway isolation, data integrity, user-scoping, and non-diagnostic deterministic computation.
"""

from datetime import datetime, timezone, timedelta
import logging
from typing import Any

from apps.intelligence.services.canonical_metrics import (
    CANONICAL_METRICS,
    get_metrics_for_pathway,
    is_metric_allowed_for_pathway,
    calculate_objective_delta,
)
from apps.intelligence.services.assessment_repository import (
    assessment_repository,
    get_supabase_client,
)
from apps.intelligence.services.clinical_state_repository import (
    clinical_state_repository,
)

logger = logging.getLogger(__name__)


class LongitudinalHealthService:
    """
    Authoritative query engine for longitudinal health trends, risk trajectories,
    biomarker series, and chronological health events.
    """

    VALID_PERIODS = {"30d": 30, "90d": 90, "180d": 180, "1y": 365, "all": None}

    @classmethod
    def _parse_timestamp(cls, ts_val: Any) -> datetime | None:
        if not ts_val:
            return None
        if isinstance(ts_val, datetime):
            return ts_val if ts_val.tzinfo else ts_val.replace(tzinfo=timezone.utc)
        try:
            # Handle ISO format strings
            clean_ts = str(ts_val).replace("Z", "+00:00")
            dt = datetime.fromisoformat(clean_ts)
            return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)
        except Exception:
            return None

    @classmethod
    def _is_within_period(cls, dt: datetime | None, cutoff: datetime | None) -> bool:
        if not dt:
            return False
        if cutoff is None:
            return True
        return dt >= cutoff

    @classmethod
    def get_longitudinal_health_summary(
        cls,
        user_id: str,
        module: str = "female_pcos",
        period: str = "90d",
        auth_token: str | None = None,
    ) -> dict[str, Any]:
        """
        Builds the unified longitudinal health response for the authenticated user.
        Strictly enforces user isolation and clinical pathway boundaries.
        """
        user_id_str = str(user_id)
        normalized_module = (
            "female_pcos"
            if "female" in module or "pcos" in module
            else "male_hypogonadism"
        )
        normalized_period = period if period in cls.VALID_PERIODS else "90d"
        days_limit = cls.VALID_PERIODS[normalized_period]

        cutoff_dt: datetime | None = None
        if days_limit is not None:
            cutoff_dt = datetime.now(timezone.utc) - timedelta(days=days_limit)

        allowed_metrics = get_metrics_for_pathway(normalized_module)

        # 1. Fetch Assessment History
        raw_assessments = assessment_repository.get_assessment_history(
            user_id_str, module=normalized_module, auth_token=auth_token
        ) or []

        # 2. Fetch Active Assessment & Authoritative Cumulative Clinical State
        active_assessment = assessment_repository.get_active_assessment(
            user_id_str, module=normalized_module, auth_token=auth_token
        )
        clinical_state = clinical_state_repository.get_patient_clinical_state(
            user_id_str, module=normalized_module, auth_token=auth_token
        )

        # 3. Fetch Verified Lab Reports from Supabase (or fallback)
        verified_labs = cls._fetch_verified_labs(
            user_id_str, normalized_module, cutoff_dt, auth_token=auth_token
        )

        # 4. Fetch Symptom & Cycle Records
        symptom_logs = cls._fetch_symptom_records(
            user_id_str, normalized_module, cutoff_dt, auth_token=auth_token
        )
        cycle_logs = []
        if normalized_module == "female_pcos":
            cycle_logs = cls._fetch_cycle_records(
                user_id_str, cutoff_dt, auth_token=auth_token
            )

        # 5. Process Screening History Points (Filtered by period, sorted ASCENDING for charts)
        filtered_assessments = []
        for ass in raw_assessments:
            dt = cls._parse_timestamp(ass.get("created_at"))
            if cls._is_within_period(dt, cutoff_dt):
                filtered_assessments.append(ass)

        # Sort chronological (oldest to newest for plotting)
        filtered_assessments.sort(
            key=lambda x: cls._parse_timestamp(x.get("created_at")) or datetime.min.replace(tzinfo=timezone.utc)
        )

        screening_history = []
        for ass in filtered_assessments:
            screening_history.append(
                {
                    "id": ass.get("id"),
                    "assessment_level": ass.get("assessment_level", "tier_1"),
                    "tiers_included": ass.get("tiers_included", [1]),
                    "probability": float(ass.get("probability", 0.0)),
                    "probability_percent": float(ass.get("probability_percent", 0.0)),
                    "threshold": float(ass.get("threshold", 0.38)),
                    "risk_category": ass.get("risk_category", "lower"),
                    "risk_label": ass.get("risk_label", "Lower Screening Risk"),
                    "created_at": ass.get("created_at"),
                    "is_active": bool(ass.get("is_active", False)),
                }
            )

        # 6. Build Metric Time-Series (Anthropometrics from assessments + Verified Labs)
        metric_series_map: dict[str, list[dict[str, Any]]] = {}

        # 6a. Extract Anthropometrics from historical assessments
        for ass in filtered_assessments:
            created_at = ass.get("created_at")
            features = ass.get("input_features") or {}
            for metric_key in ("weight_kg", "bmi", "waist_circumference", "waist_hip_ratio"):
                if metric_key not in allowed_metrics:
                    continue
                val = features.get(metric_key)
                if val is None:
                    # Also check synonyms
                    if metric_key == "waist_circumference":
                        val = features.get("waist_cm") or (
                            float(features.get("waist_inch")) * 2.54 if features.get("waist_inch") else None
                        )
                if val is not None:
                    try:
                        num_val = round(float(val), allowed_metrics[metric_key].decimal_precision)
                        metric_series_map.setdefault(metric_key, []).append(
                            {
                                "timestamp": created_at,
                                "value": num_val,
                                "source": "screening_assessment",
                                "is_verified": True,
                            }
                        )
                    except (ValueError, TypeError):
                        pass

        # 6b. Extract Screening Probability Series
        prob_metric_key = (
            "pcos_screening_probability"
            if normalized_module == "female_pcos"
            else "hypogonadism_screening_probability"
        )
        if prob_metric_key in allowed_metrics:
            for ass in filtered_assessments:
                metric_series_map.setdefault(prob_metric_key, []).append(
                    {
                        "timestamp": ass.get("created_at"),
                        "value": float(ass.get("probability_percent", 0.0)),
                        "source": "screening_assessment",
                        "is_verified": True,
                        "metadata": {
                            "level": ass.get("assessment_level"),
                            "risk_category": ass.get("risk_category"),
                        },
                    }
                )

        # 6c. Add Verified Lab Biomarkers
        for lab in verified_labs:
            metric_key = lab["metric_key"]
            if metric_key in allowed_metrics:
                metric_series_map.setdefault(metric_key, []).append(
                    {
                        "timestamp": lab["timestamp"],
                        "value": lab["value"],
                        "source": "verified_lab_report",
                        "is_verified": True,
                        "metadata": {
                            "test_name": lab.get("test_name"),
                            "report_id": lab.get("report_id"),
                        },
                    }
                )

        # 6d. Add Cycle Length data points (Female pathway only)
        if normalized_module == "female_pcos":
            for i in range(len(cycle_logs) - 1):
                c_curr = cls._parse_timestamp(cycle_logs[i].get("period_start_date"))
                c_prev = cls._parse_timestamp(cycle_logs[i + 1].get("period_start_date"))
                if c_curr and c_prev:
                    c_days = (c_curr - c_prev).days
                    if 15 <= c_days <= 120:
                        metric_series_map.setdefault("cycle_length", []).append(
                            {
                                "timestamp": cycle_logs[i].get("period_start_date"),
                                "value": float(c_days),
                                "source": "cycle_record",
                                "is_verified": True,
                            }
                        )

        # Format metric series according to schema
        formatted_metric_series: dict[str, Any] = {}
        for m_key, defn in allowed_metrics.items():
            raw_points = metric_series_map.get(m_key, [])
            if raw_points:
                # Deduplicate and sort by timestamp
                raw_points.sort(
                    key=lambda x: cls._parse_timestamp(x.get("timestamp")) or datetime.min.replace(tzinfo=timezone.utc)
                )
                formatted_metric_series[m_key] = {
                    "metric_key": defn.key,
                    "label": defn.label,
                    "unit": defn.unit,
                    "category": defn.category,
                    "is_graphable": defn.is_graphable,
                    "data_points": raw_points,
                }

        # 7. Calculate Current Summary and Objective Deltas
        key_metrics_current: dict[str, float | None] = {}
        metric_deltas: dict[str, Any] = {}

        # Prioritize values from latest active assessment, falling back to clinical_state
        latest_inputs = {}
        if active_assessment and active_assessment.get("input_features"):
            latest_inputs.update(active_assessment["input_features"])
        if clinical_state:
            latest_inputs.update(clinical_state.get("tier_1_inputs") or {})
            latest_inputs.update(clinical_state.get("tier_2_inputs") or {})

        for m_key in ("weight_kg", "bmi", "waist_circumference", "waist_hip_ratio", "fasting_glucose", "hba1c"):
            if m_key not in allowed_metrics:
                continue
            series_pts = metric_series_map.get(m_key, [])
            curr_val = None
            prev_val = None
            if len(series_pts) >= 1:
                curr_val = series_pts[-1]["value"]
            if len(series_pts) >= 2:
                prev_val = series_pts[-2]["value"]
            elif m_key in latest_inputs:
                try:
                    curr_val = float(latest_inputs[m_key])
                except (ValueError, TypeError):
                    pass

            key_metrics_current[m_key] = curr_val
            metric_deltas[m_key] = calculate_objective_delta(m_key, prev_val, curr_val)

        # Risk delta
        prob_pts = metric_series_map.get(prob_metric_key, [])
        curr_prob = prob_pts[-1]["value"] if len(prob_pts) >= 1 else (
            float(active_assessment.get("probability_percent", 0.0)) if active_assessment else None
        )
        prev_prob = prob_pts[-2]["value"] if len(prob_pts) >= 2 else None
        metric_deltas["screening_risk"] = calculate_objective_delta(prob_metric_key, prev_prob, curr_prob)

        current_summary = {
            "active_assessment_id": active_assessment.get("id") if active_assessment else None,
            "assessment_level": active_assessment.get("assessment_level") if active_assessment else None,
            "screening_probability": float(active_assessment.get("probability", 0.0)) if active_assessment else None,
            "screening_probability_percent": float(active_assessment.get("probability_percent", 0.0)) if active_assessment else None,
            "risk_category": active_assessment.get("risk_category") if active_assessment else None,
            "risk_label": active_assessment.get("risk_label") if active_assessment else None,
            "last_assessed_at": active_assessment.get("created_at") if active_assessment else None,
            "key_metrics": key_metrics_current,
            "metric_deltas": metric_deltas,
        }

        # 8. Assemble Unified Chronological Timeline Events (Sorted DESCENDING)
        timeline_events = []

        for ass in filtered_assessments:
            level = ass.get("assessment_level", "tier_1")
            level_label = {
                "tier_1": "Tier 1 Questionnaire",
                "tier_1_2": "Tier 2 Clinical Labs",
                "tier_1_3": "Tier 3 Ultrasound",
                "tier_1_2_3": "Tier 3 Multi-Modal",
            }.get(level, level)

            timeline_events.append(
                {
                    "id": f"ass_{ass.get('id')}",
                    "event_type": "screening_assessment",
                    "title": f"Screening Assessment Completed ({level_label})",
                    "description": f"Calculated screening risk: {ass.get('probability_percent', 0.0):.1f}% ({ass.get('risk_label', 'Assessment completed')}).",
                    "timestamp": ass.get("created_at"),
                    "metadata": {
                        "assessment_id": ass.get("id"),
                        "level": level,
                        "risk_category": ass.get("risk_category"),
                    },
                }
            )

        for lab in verified_labs:
            timeline_events.append(
                {
                    "id": f"lab_{lab.get('id')}",
                    "event_type": "verified_lab_report",
                    "title": f"Verified Clinical Lab Result ({lab.get('label')})",
                    "description": f"Recorded {lab.get('value')} {lab.get('unit')} from verified report.",
                    "timestamp": lab.get("timestamp"),
                    "metadata": {
                        "test_name": lab.get("test_name"),
                        "report_id": lab.get("report_id"),
                    },
                }
            )

        for sym in symptom_logs:
            timeline_events.append(
                {
                    "id": f"sym_{sym.get('id')}",
                    "event_type": "symptom_entry",
                    "title": f"Symptom Recorded ({sym.get('symptom_type', '').title()})",
                    "description": f"Severity: {sym.get('severity', 'moderate').title()}",
                    "timestamp": sym.get("occurred_at"),
                    "metadata": sym,
                }
            )

        for cyc in cycle_logs:
            timeline_events.append(
                {
                    "id": f"cyc_{cyc.get('id')}",
                    "event_type": "cycle_entry",
                    "title": "Menstrual Period Logged",
                    "description": f"Flow intensity: {str(cyc.get('flow', 'medium')).title()}.",
                    "timestamp": cyc.get("period_start_date") or cyc.get("created_at"),
                    "metadata": cyc,
                }
            )

        # Sort timeline descending (most recent first)
        timeline_events.sort(
            key=lambda x: cls._parse_timestamp(x.get("timestamp")) or datetime.min.replace(tzinfo=timezone.utc),
            reverse=True,
        )

        return {
            "patient_id": user_id_str,
            "module": normalized_module,
            "period": normalized_period,
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "disclaimer": (
                "Longitudinal health trends provide educational and screening context only. "
                "They do not constitute diagnostic medical conclusions. Always consult a qualified physician."
            ),
            "current_summary": current_summary,
            "screening_history": screening_history,
            "metric_series": formatted_metric_series,
            "symptom_history": symptom_logs,
            "cycle_history": cycle_logs if normalized_module == "female_pcos" else [],
            "timeline_events": timeline_events,
        }

    # -----------------------------------------------------------------------
    # Helper Data Fetchers
    # -----------------------------------------------------------------------

    @classmethod
    def _fetch_verified_labs(
        cls,
        patient_uuid: str,
        pathway: str,
        cutoff_dt: datetime | None,
        auth_token: str | None = None,
    ) -> list[dict[str, Any]]:
        """
        Fetches verified laboratory biomarker results from medical_reports and report_results.
        Strictly excludes unverified OCR records (user_verified = false).
        """
        client = get_supabase_client(auth_token)
        if not client:
            return []

        try:
            # Query report_results joined with medical_reports
            # Ensure only user_verified reports or records are included
            query = (
                client.table("report_results")
                .select(
                    "id, report_id, test_name, result_numeric, unit, user_verified, "
                    "medical_reports!inner(user_id, report_date)"
                )
                .eq("medical_reports.user_id", patient_uuid)
                .eq("user_verified", True)
                .not_.is_("result_numeric", "null")
            )
            res = query.execute()
            rows = res.data or []
        except Exception as e:
            logger.debug("Supabase report_results fetch notice: %s", e)
            return []

        # Name mapping to canonical metric keys
        LAB_NAME_TO_KEY = {
            # Shared
            "fasting glucose": "fasting_glucose",
            "fasting blood glucose": "fasting_glucose",
            "blood glucose": "fasting_glucose",
            "glucose": "fasting_glucose",
            "hba1c": "hba1c",
            "glycated hemoglobin": "hba1c",
            # Female
            "fsh": "fsh",
            "follicle stimulating hormone": "fsh",
            "lh": "lh",
            "luteinizing hormone": "lh",
            "lh/fsh ratio": "lh_fsh_ratio",
            "amh": "amh",
            "anti-mullerian hormone": "amh",
            "anti-müllerian hormone": "amh",
            "tsh": "tsh",
            "thyroid stimulating hormone": "tsh",
            "prolactin": "prolactin",
            "progesterone": "progesterone",
            "vitamin d": "vitamin_d3",
            "vitamin d3": "vitamin_d3",
            "25-hydroxy vitamin d": "vitamin_d3",
            # Male
            "total testosterone": "total_testosterone",
            "testosterone": "total_testosterone",
            "free testosterone": "free_testosterone",
            "shbg": "shbg",
        }

        verified_biomarkers = []
        for r in rows:
            rep = r.get("medical_reports") or {}
            rep_date = rep.get("report_date")
            dt = cls._parse_timestamp(rep_date)
            if not cls._is_within_period(dt, cutoff_dt):
                continue

            test_raw = (r.get("test_name") or "").strip().lower()
            metric_key = LAB_NAME_TO_KEY.get(test_raw)
            if not metric_key:
                continue

            if not is_metric_allowed_for_pathway(metric_key, pathway):
                continue

            metric_def = CANONICAL_METRICS.get(metric_key)
            if not metric_def:
                continue

            try:
                num_val = round(float(r["result_numeric"]), metric_def.decimal_precision)
                verified_biomarkers.append(
                    {
                        "id": r["id"],
                        "report_id": r.get("report_id"),
                        "metric_key": metric_key,
                        "label": metric_def.label,
                        "value": num_val,
                        "unit": r.get("unit") or metric_def.unit,
                        "test_name": r.get("test_name"),
                        "timestamp": rep_date,
                    }
                )
            except (ValueError, TypeError):
                continue

        return verified_biomarkers

    @classmethod
    def _fetch_symptom_records(
        cls,
        patient_uuid: str,
        pathway: str,
        cutoff_dt: datetime | None,
        auth_token: str | None = None,
    ) -> list[dict[str, Any]]:
        client = get_supabase_client(auth_token)
        if not client:
            return []

        try:
            query = (
                client.table("symptom_records")
                .select("id, symptom_type, severity, occurred_at, cycle_day")
                .eq("user_id", patient_uuid)
            )
            if cutoff_dt:
                query = query.gte("occurred_at", cutoff_dt.isoformat())
            res = query.order("occurred_at", desc=True).limit(100).execute()
            return res.data or []
        except Exception as e:
            logger.debug("Supabase symptom_records fetch notice: %s", e)
            return []

    @classmethod
    def _fetch_cycle_records(
        cls,
        patient_uuid: str,
        cutoff_dt: datetime | None,
        auth_token: str | None = None,
    ) -> list[dict[str, Any]]:
        client = get_supabase_client(auth_token)
        if not client:
            return []

        try:
            query = (
                client.table("cycle_records")
                .select("id, period_start_date, period_end_date, flow, created_at")
                .eq("user_id", patient_uuid)
            )
            if cutoff_dt:
                query = query.gte("period_start_date", cutoff_dt.date().isoformat())
            res = query.order("period_start_date", desc=True).limit(50).execute()
            return res.data or []
        except Exception as e:
            logger.debug("Supabase cycle_records fetch notice: %s", e)
            return []


longitudinal_health_service = LongitudinalHealthService()
