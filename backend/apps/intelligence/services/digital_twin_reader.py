"""
OvaSense — Digital Twin Reader Service.

Extracts and compiles structured, rule-based physiological observations from the
patient's health records for consumption by OvaSense AI (MedGemma).

STRICT ARCHITECTURAL INVARIANT:
This service is READ-ONLY. The LLM may READ Digital Twin observations to provide
clear, empathetic explanations to the patient, but must NEVER modify the Digital Twin.
"""

from __future__ import annotations

import datetime
import logging
from typing import Any, Dict, List, Optional

from apps.health.services.supabase_health_service import PatientHealthData

logger = logging.getLogger(__name__)


class DigitalTwinReader:
    """
    Synthesizes structured rule-based physiological telemetry from health records.
    Contains strictly read-only methods.
    """

    @classmethod
    def get_observations(
        cls,
        health_data: PatientHealthData,
        client_telemetry: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Compiles structured, rule-based Digital Twin observations.
        Does NOT modify any database state or Digital Twin model.
        """
        profile = health_data.profile
        cycle_records = health_data.cycle_records
        symptoms = health_data.symptom_records
        water_logs = health_data.water_logs
        food_logs = health_data.food_logs

        # 1. Cycle day & phase calculation
        cycle_day = 0
        phase_name = "Not Logged"
        estrogen_progesterone_status = "Baseline"

        # Check client telemetry first if passed (e.g. from active React state)
        if client_telemetry and client_telemetry.get("cycleDay"):
            try:
                cycle_day = int(client_telemetry.get("cycleDay", 0))
                phase_name = str(client_telemetry.get("phaseName", "Follicular Phase"))
            except (TypeError, ValueError):
                pass
        elif cycle_records and getattr(cycle_records[0], "period_start_date", None):
            try:
                start_str = str(cycle_records[0].period_start_date)[:10]
                start_dt = datetime.date.fromisoformat(start_str)
                today = datetime.date.today()
                diff_days = (today - start_dt).days
                if 0 <= diff_days < 60:
                    cycle_day = diff_days + 1
            except Exception as exc:
                logger.debug("Error computing cycle day from cycle_records: %s", exc)

        if cycle_day > 0:
            if cycle_day <= 5:
                phase_name = "Menstrual Phase"
                estrogen_progesterone_status = "Estrogen and progesterone are at baseline levels"
            elif cycle_day <= 13:
                phase_name = "Follicular Phase"
                estrogen_progesterone_status = "Estrogen is progressively rising towards its pre-ovulatory peak"
            elif cycle_day <= 16:
                phase_name = "Ovulatory Phase"
                estrogen_progesterone_status = "LH surge peak with maximal estrogen, initiating luteinization"
            elif cycle_day <= 28:
                phase_name = "Luteal Phase"
                estrogen_progesterone_status = "Progesterone dominant, supported by secondary estrogen elevation"
            else:
                phase_name = "Extended Luteal / Delayed Cycle Phase"
                estrogen_progesterone_status = "Extended cycle duration; hormonal transition delayed"

        # 2. 30-day symptom prevalence & recurrence index
        symptom_count = len(symptoms)
        severe_symptoms: List[str] = []
        frequent_symptoms: Dict[str, int] = {}
        for s in symptoms[:30]:
            name = s.symptom_type or "General"
            frequent_symptoms[name] = frequent_symptoms.get(name, 0) + 1
            if str(s.severity).lower() in ["severe", "high"]:
                if name not in severe_symptoms:
                    severe_symptoms.append(name)

        top_symptom_summary = [
            f"{name} ({cnt}x)"
            for name, cnt in sorted(frequent_symptoms.items(), key=lambda x: x[1], reverse=True)[:3]
        ]

        # 3. Hydration adherence
        hydration_score = "No hydration logs"
        if water_logs:
            recent_glasses = []
            for w in water_logs[:7]:
                try:
                    if getattr(w, "glasses", None) is not None:
                        recent_glasses.append(float(w.glasses))
                except (TypeError, ValueError):
                    pass
            if recent_glasses:
                avg_glasses = sum(recent_glasses) / len(recent_glasses)
                adherence_pct = round(min(100.0, (avg_glasses / 8.0) * 100))
                hydration_score = f"{avg_glasses:.1f} glasses/day ({adherence_pct}% of target)"

        # 4. Sleep duration
        sleep_obs = "Standard"
        if getattr(profile, "sleep_hours", None) is not None:
            try:
                sleep_hrs = float(profile.sleep_hours)
                if sleep_hrs < 7.0:
                    sleep_obs = f"{sleep_hrs:.1f} hrs/night (Below recommended 7-9 hrs)"
                elif sleep_hrs > 9.0:
                    sleep_obs = f"{sleep_hrs:.1f} hrs/night (Above standard 7-9 hrs)"
                else:
                    sleep_obs = f"{sleep_hrs:.1f} hrs/night (Optimal target met)"
            except (TypeError, ValueError):
                pass

        # 5. Dietary & Lifestyle compliance
        diet_obs = []
        if profile.dietary_preference:
            diet_obs.append(f"Preference: {profile.dietary_preference}")
        if food_logs:
            diet_obs.append(f"{len(food_logs)} recent meals logged")

        return {
            "cycle_day": cycle_day,
            "phase_name": phase_name,
            "hormonal_curve_status": estrogen_progesterone_status,
            "symptom_log_count": symptom_count,
            "top_symptoms": top_symptom_summary,
            "severe_symptoms": severe_symptoms,
            "hydration_adherence": hydration_score,
            "sleep_status": sleep_obs,
            "dietary_lifestyle": ", ".join(diet_obs) if diet_obs else "Standard tracking",
        }

    @classmethod
    def format_as_context_block(cls, observations: Dict[str, Any]) -> str:
        """
        Formats Digital Twin observations into a concise, token-efficient,
        read-only summary string for the LLM prompt.
        """
        lines = ["[DIGITAL TWIN OBSERVATIONS - READ ONLY]:"]
        if observations.get("cycle_day", 0) > 0:
            lines.append(
                f"• Menstrual Status: Day {observations['cycle_day']} ({observations['phase_name']}) — {observations['hormonal_curve_status']}."
            )
        else:
            lines.append(f"• Menstrual Status: {observations.get('phase_name', 'Cycle not active')}.")

        if observations.get("top_symptoms"):
            lines.append(f"• 30-Day Symptom Pattern: {', '.join(observations['top_symptoms'])}.")
        if observations.get("severe_symptoms"):
            lines.append(f"• High Severity Symptoms Noted: {', '.join(observations['severe_symptoms'])}.")

        lines.append(f"• Hydration Adherence: {observations.get('hydration_adherence', 'Not recorded')}.")
        lines.append(f"• Sleep Quality: {observations.get('sleep_status', 'Not recorded')}.")
        lines.append(f"• Nutrition & Lifestyle: {observations.get('dietary_lifestyle', 'Standard')}.")
        lines.append("• Notice: Structured rule-based physiological metrics. Read-only; LLM cannot alter this state.")

        return "\n".join(lines)
