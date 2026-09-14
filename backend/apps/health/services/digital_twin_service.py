"""
OvaSense Health — Application-Side Digital Twin Service.

Assembles the structured patient health state tree from verified Supabase records:
Patient
├── Profile
├── Symptoms
├── Cycle Data
├── Lifestyle
├── Diet
├── Fitness
├── Medications
├── Reports
├── Assessments
└── Health History

Note: The Digital Twin is NOT an AI model; it is the structured representation
of patient physiology that can be consumed by AI and clinical intelligence layers.
"""

from __future__ import annotations

import datetime
from typing import Any, Dict, List, Optional

from apps.health.services.supabase_health_service import PatientHealthData


class DigitalTwinService:
    """Assembles structured Digital Twin JSON representation for a patient."""

    @classmethod
    def build_digital_twin(
        cls,
        health_data: HealthDataBundle,
        client_telemetry: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        profile = health_data.profile
        cycles = health_data.cycle_records
        symptoms = health_data.symptom_records
        food = health_data.food_logs
        water = health_data.water_logs
        fitness = health_data.fitness_logs
        meds = health_data.medications
        med_logs = health_data.medication_logs
        report_results = health_data.report_results

        # 1. Profile Node
        age_years = None
        if getattr(profile, "date_of_birth", None):
            try:
                dob = datetime.date.fromisoformat(str(profile.date_of_birth).strip())
                today = datetime.date.today()
                calc_age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
                if 0 <= calc_age <= 120:
                    age_years = calc_age
            except (ValueError, TypeError):
                pass

        bmi = None
        if getattr(profile, "height_cm", None) and getattr(profile, "weight_kg", None):
            try:
                h = float(profile.height_cm)
                w = float(profile.weight_kg)
                if h > 0:
                    bmi = round(w / ((h / 100) ** 2), 1)
            except (ValueError, TypeError):
                pass

        profile_node = {
            "full_name": getattr(profile, "full_name", "") or "Patient",
            "age_years": age_years,
            "height_cm": getattr(profile, "height_cm", None),
            "weight_kg": getattr(profile, "weight_kg", None),
            "calculated_bmi": bmi,
            "blood_type": getattr(profile, "blood_type", "") or "Unspecified",
            "is_pregnant": getattr(profile, "is_pregnant", False),
        }

        # 2. Symptoms Node
        freq_symptoms: Dict[str, int] = {}
        severe_symptoms: List[str] = []
        for s in symptoms[:30]:
            name = getattr(s, "symptom_type", None) or "General"
            freq_symptoms[name] = freq_symptoms.get(name, 0) + 1
            if str(getattr(s, "severity", "")).lower() == "severe":
                if name not in severe_symptoms:
                    severe_symptoms.append(name)

        symptoms_node = {
            "total_logged_30_days": len(symptoms[:30]),
            "frequent_symptoms": [
                {"name": k, "count": v}
                for k, v in sorted(freq_symptoms.items(), key=lambda x: x[1], reverse=True)[:4]
            ],
            "severe_symptoms_recent": severe_symptoms,
            "last_logged_date": str(symptoms[0].occurred_at)[:10] if symptoms and getattr(symptoms[0], "occurred_at", None) else None,
        }

        # 3. Cycle Data Node
        cycle_day = 0
        phase_name = "Not Logged"
        estrogen_state = "Baseline"
        if client_telemetry and client_telemetry.get("cycleDay"):
            try:
                cycle_day = int(client_telemetry["cycleDay"])
                phase_name = str(client_telemetry.get("phaseName", "Follicular Phase"))
            except (ValueError, TypeError):
                pass
        elif cycles and getattr(cycles[0], "period_start_date", None):
            try:
                start_dt = datetime.date.fromisoformat(str(cycles[0].period_start_date)[:10])
                diff_days = (datetime.date.today() - start_dt).days
                if 0 <= diff_days < 60:
                    cycle_day = diff_days + 1
            except Exception:
                pass

        if cycle_day > 0:
            if cycle_day <= 5:
                phase_name = "Menstrual Phase"
                estrogen_state = "Early follicular baseline"
            elif cycle_day <= 13:
                phase_name = "Follicular Phase"
                estrogen_state = "Progressively rising toward pre-ovulatory surge"
            elif cycle_day <= 16:
                phase_name = "Ovulatory Phase"
                estrogen_state = "LH surge peak with maximal estrogen transition"
            elif cycle_day <= 28:
                phase_name = "Luteal Phase"
                estrogen_state = "Progesterone dominance supported by secondary estrogen elevation"
            else:
                phase_name = "Extended Luteal / Delayed Phase"
                estrogen_state = "Extended cycle duration; hormonal transition delayed"

        cycle_node = {
            "current_cycle_day": cycle_day,
            "current_phase": phase_name,
            "estrogen_progesterone_state": estrogen_state,
            "regularity_status": getattr(profile, "period_regularity", "regular") or "regular",
            "historical_cycle_count": len(cycles),
        }

        # 4. Lifestyle Node
        sleep_hours = 7.5
        if getattr(profile, "sleep_hours", None):
            try:
                sleep_hours = float(profile.sleep_hours)
            except (ValueError, TypeError):
                pass

        water_glasses_avg = 0.0
        if water:
            glasses_vals = [float(w.glasses) for w in water[:7] if getattr(w, "glasses", None) is not None]
            if glasses_vals:
                water_glasses_avg = round(sum(glasses_vals) / len(glasses_vals), 1)

        lifestyle_node = {
            "average_sleep_hours": sleep_hours,
            "average_water_glasses_daily": water_glasses_avg,
            "activity_level": getattr(profile, "activity_level", "moderate") or "moderate",
        }

        # 5. Diet Node
        diet_node = {
            "dietary_preference": getattr(profile, "dietary_preference", "Balanced") or "Balanced",
            "total_logged_meals_30_days": len(food),
            "fast_food_frequency": getattr(profile, "fast_food_intake", "occasional") or "occasional",
        }

        # 6. Fitness Node
        total_active_mins = sum(int(f.duration_minutes or 0) for f in fitness[:7] if getattr(f, "duration_minutes", None))
        fitness_node = {
            "workouts_this_week": len(fitness[:7]),
            "active_minutes_logged_7_days": total_active_mins,
            "preferred_activities": getattr(profile, "exercise_preferences", []) or ["Walking"],
        }

        # 7. Medications Node
        active_meds = [
            {"name": m.name, "frequency": getattr(m, "frequency", "Daily")}
            for m in meds if getattr(m, "is_active", True)
        ]
        medications_node = {
            "active_count": len(active_meds),
            "active_medications": active_meds,
        }

        # 8. Reports Node
        verified_count = sum(1 for r in report_results if r.user_verified)
        pending_count = sum(1 for r in report_results if not r.user_verified)
        key_results = [
            {
                "test_name": r.test_name,
                "result_value": r.result_value,
                "unit": getattr(r, "unit", ""),
                "reference_range": getattr(r, "reference_range", ""),
                "status": getattr(r, "status", "normal"),
                "user_verified": bool(r.user_verified),
            }
            for r in report_results[:8]
        ]
        reports_node = {
            "verified_biomarkers_count": verified_count,
            "pending_verification_count": pending_count,
            "key_biomarkers_summary": key_results,
        }

        # 9. Assessments Node
        has_answers = bool(getattr(profile, "period_regularity", None) or getattr(profile, "common_symptoms", None))
        assessments_node = {
            "questionnaire_completed": has_answers,
        }

        # 10. History Node
        total_events = len(cycles) + len(symptoms) + len(food) + len(fitness) + len(meds) + len(report_results)
        history_node = {
            "total_events_logged": total_events,
            "last_active_date": datetime.date.today().isoformat(),
        }

        return {
            "patient_id": getattr(profile, "id", "current-patient"),
            "generated_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "profile": profile_node,
            "symptoms": symptoms_node,
            "cycle": cycle_node,
            "lifestyle": lifestyle_node,
            "diet": diet_node,
            "fitness": fitness_node,
            "medications": medications_node,
            "reports": reports_node,
            "assessments": assessments_node,
            "history": history_node,
        }
