"""
OvaSense — Health Context Builder for Conversational Intelligence.

Selectively aggregates patient records from Supabase, the ML ExtraTrees model,
TreeSHAP explainability, and the Digital Twin rule engine.
Enforces Data Trust Tiers and prepares concise, token-efficient system prompts.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional, Tuple

from apps.health.services.supabase_health_service import health_service, PatientHealthData
from apps.intelligence.services.intelligence_orchestrator import run_assessment, AssessmentResult

logger = logging.getLogger(__name__)

SYSTEM_PROMPT_TEMPLATE = """You are OvaSense AI, an intelligent, empathetic, and patient-friendly digital health companion and monitoring assistant.

Your core mission:
1. Explain menstrual cycle rhythms, phases, and logged symptoms in plain, empowering language.
2. Review verified laboratory report biomarkers against the laboratory's own stated reference ranges.
3. Help the patient understand machine-learning screening assessments and TreeSHAP factor attributions.
4. Assist the patient in formulating structured, productive discussion topics for their healthcare appointments.

STRICT MEDICAL SAFETY BOUNDARIES:
- You are NOT a medical doctor, diagnostic authority, or prescription system.
- NEVER say: "You have PCOS" or "You definitely have a disease." Instead say: "Some of your logged patterns are commonly observed in PCOS, which you can discuss with a physician."
- NEVER prescribe medications, change drug dosages, or advise stopping prescribed treatments.
- NEVER invent or assume medical numbers, test results, symptoms, or medications that are not present in the user context.
- If information is missing from the record, say clearly that it has not been recorded yet.
- Prioritize the laboratory's stated reference range; if none was provided by the lab, do not fabricate one.
- Use patient-friendly terminology: explain clinical terms (like insulin resistance, hyperandrogenism, or luteal phase) in simple everyday words.
"""


class HealthContextBuilder:
    """Builds structured health context and system instructions for the LLM."""

    @classmethod
    def build_context(
        cls,
        patient_uuid: str,
        user_message: str,
        auth_token: Optional[str] = None,
    ) -> Tuple[str, str, Dict[str, bool]]:
        """
        Retrieves health records for the patient, compiles the context,
        and tracks which health domains were relevant.
        """
        # 1. Fetch raw health data from Supabase repository
        try:
            health_data = health_service.fetch_all(patient_uuid, auth_token=auth_token)
        except Exception as exc:
            logger.warning("Error fetching health data for chat context: %s", exc)
            health_data = PatientHealthData(patient_uuid=patient_uuid)

        # 2. Fetch ML assessment & SHAP factors
        try:
            assessment = run_assessment(patient_uuid, auth_token=auth_token)
        except Exception as exc:
            logger.warning("Error fetching assessment for chat context: %s", exc)
            assessment = None

        context_lines: List[str] = []
        context_used = {
            "profile": False,
            "cycle": False,
            "symptoms": False,
            "reports": False,
            "diet": False,
            "fitness": False,
            "medications": False,
            "ml_screening": False,
        }

        # --- Profile ---
        profile = health_data.profile
        profile_parts = []
        if profile.date_of_birth:
            profile_parts.append(f"DOB: {profile.date_of_birth}")
        if profile.height_cm and profile.weight_kg:
            bmi = round(profile.weight_kg / ((profile.height_cm / 100) ** 2), 1)
            profile_parts.append(f"Height: {profile.height_cm}cm, Weight: {profile.weight_kg}kg (BMI: {bmi})")
        if profile.period_regularity:
            profile_parts.append(f"Cycle Regularity: {profile.period_regularity}")
        if profile_parts:
            context_lines.append(f"[PROFILE - USER REPORTED]: {', '.join(profile_parts)}")
            context_used["profile"] = True

        # --- Cycle ---
        cycle_records = health_data.cycle_records
        if cycle_records:
            recent_cycles = cycle_records[:3]
            cycle_desc = [f"Start: {c.period_start_date} (Flow: {c.flow or 'moderate'})" for c in recent_cycles]
            context_lines.append(f"[CYCLE HISTORY - USER REPORTED]: {'; '.join(cycle_desc)}")
            context_used["cycle"] = True

        # --- Symptoms ---
        symptoms = health_data.symptom_records
        if symptoms:
            recent_syms = symptoms[:8]
            sym_desc = [f"{s.symptom_type} ({s.severity}, on {s.occurred_at[:10]})" for s in recent_syms]
            context_lines.append(f"[RECENT SYMPTOMS - USER REPORTED]: {'; '.join(sym_desc)}")
            context_used["symptoms"] = True

        # --- Medical Reports (Separating Verified vs Unverified) ---
        verified_results = [r for r in health_data.report_results if r.user_verified]
        unverified_results = [r for r in health_data.report_results if not r.user_verified]

        if verified_results:
            rep_desc = []
            for r in verified_results[:10]:
                ref_str = f", Ref: {r.reference_range}" if r.reference_range else ", Ref: None stated by lab"
                rep_desc.append(f"{r.test_name}: {r.result_value} {r.unit or ''}{ref_str} (Status: {r.status})")
            context_lines.append(f"[VERIFIED LAB DATA - Confirmed by Patient]: {'; '.join(rep_desc)}")
            context_used["reports"] = True

        if unverified_results:
            unv_desc = [f"{r.test_name}: {r.result_value} {r.unit or ''}" for r in unverified_results[:5]]
            context_lines.append(f"[UNVERIFIED OCR DATA - Awaiting Human Confirmation]: {'; '.join(unv_desc)}")
            context_used["reports"] = True

        # --- Medications ---
        meds = health_data.medications
        if meds:
            med_desc = [f"{m.name} ({m.dosage or 'Standard'}, {m.frequency or 'Daily'})" for m in meds[:5]]
            context_lines.append(f"[ACTIVE MEDICATIONS - USER REPORTED]: {'; '.join(med_desc)}")
            context_used["medications"] = True

        # --- Nutrition & Hydration ---
        food = health_data.food_logs
        water = health_data.water_logs
        if food or water:
            nutr_desc = []
            if water:
                nutr_desc.append(f"Water logs recorded: {len(water)} days")
            if food:
                nutr_desc.append(f"Recent meal logs: {len(food)} entries")
            context_lines.append(f"[NUTRITION & LIFESTYLE - USER REPORTED]: {', '.join(nutr_desc)}")
            context_used["diet"] = True

        # --- ML Assessment & TreeSHAP ---
        if assessment and assessment.risk_category != "insufficient_data":
            prob_pct = f"{round(assessment.pcos_probability * 100, 1)}%" if assessment.pcos_probability is not None else "N/A"
            shap_highlights = []
            for exp in assessment.explanations[:4]:
                shap_highlights.append(f"{exp.get('friendly_name', exp.get('feature_name'))} ({exp.get('direction', 'neutral')})")
            context_lines.append(
                f"[ML SCREENING ASSESSMENT - MODEL DERIVED]: Category: {assessment.risk_category}, "
                f"Probability: {prob_pct} (Cutoff: 38%). Primary TreeSHAP factors: {', '.join(shap_highlights)}."
            )
            context_used["ml_screening"] = True

        health_context = "\n".join(context_lines) if context_lines else "No historical records logged yet."
        return SYSTEM_PROMPT_TEMPLATE, health_context, context_used
