"""
OvaSense — Conversational Medical Safety & Guardrails.

Enforces emergency symptom escalation, prompt injection prevention,
and strict non-diagnostic communication boundaries.
Prevents speculative OCR extraction or ML screening probabilities from being
treated as confirmed clinical diagnoses.
"""

from __future__ import annotations

import re
from typing import Optional, Tuple

# Urgent clinical red-flag patterns requiring immediate escalation
EMERGENCY_PATTERNS = [
    r"\b(?:severe|sudden|extreme|unbearable)\s+(?:pelvic|abdominal|stomach)\s+pain\b",
    r"\b(?:heavy\s+bleeding|hemorrhag\w*|soaking\s+(?:a\s+)?pad\s+every\s+hour)\b",
    r"\b(?:fainted|passed\s+out|loss\s+of\s+consciousness|blacked\s+out)\b",
    r"\b(?:chest\s+pain|shortness\s+of\s+breath|difficulty\s+breathing)\b",
    r"\b(?:suicid\w*|kill\s+myself|harm\s+myself)\b",
]

# Prompt injection patterns attempting to bypass safety rules
INJECTION_PATTERNS = [
    r"\bignore\s+(?:all\s+)?(?:previous\s+)?(?:instructions|rules|prompts|guardrails)\b",
    r"\bdisregard\s+(?:all\s+)?(?:previous\s+)?(?:instructions|rules|safety)\b",
    r"\bforget\s+(?:all\s+)?(?:your\s+)?(?:rules|instructions)\b",
    r"\byou\s+are\s+now\s+(?:a\s+doctor|an\s+unrestricted\s+ai|jailbroken)\b",
    r"\bdiagnose\s+me\s+(?:definitively|now|officially)\b",
]

# Mandatory medical disclaimer
MEDICAL_SAFETY_FOOTER = (
    "\n\n*Note: BioPulse AI Companion provides health monitoring information and educational support. "
    "It does not provide medical diagnoses or prescribe treatment. Please consult a qualified healthcare provider for clinical care.*"
)


class SafetyGuardrails:
    """Evaluates user input and LLM output against safety, emergency, and injection rules."""

    @staticmethod
    def check_emergency(user_message: str) -> Optional[str]:
        """
        Detects acute clinical emergency red flags.
        Returns urgent emergency advisory if detected, or None.
        """
        msg_lower = user_message.lower()
        for pattern in EMERGENCY_PATTERNS:
            if re.search(pattern, msg_lower, re.IGNORECASE):
                return (
                    "⚠️ **Immediate Medical Attention Recommended**\n\n"
                    "The symptoms you described may indicate a medical situation that requires urgent professional evaluation. "
                    "BioPulse AI is not an emergency service and cannot diagnose or treat acute conditions.\n\n"
                    "• **Action**: Please call your local emergency services (e.g. 911, 112, or local helpline) or go to the "
                    "nearest hospital emergency department immediately.\n"
                    "• If you have a trusted friend, family member, or care circle contact nearby, alert them right away."
                )
        return None

    @staticmethod
    def check_prompt_injection(user_message: str) -> Optional[str]:
        """
        Detects prompt injection attempts aiming to override clinical guardrails.
        Returns standard safety boundary refusal if detected, or None.
        """
        msg_lower = user_message.lower()
        for pattern in INJECTION_PATTERNS:
            if re.search(pattern, msg_lower, re.IGNORECASE):
                return (
                    "BioPulse AI Companion is an educational health literacy companion and operates strictly within clinical safety guidelines. "
                    "I cannot provide a formal medical diagnosis, prescribe medications, or override healthcare safety boundaries.\n\n"
                    "I am happy to help you understand your logged symptoms, explain laboratory reference intervals, or prepare a structured "
                    "list of questions for your next doctor's appointment."
                )
        return None

    @staticmethod
    def sanitize_llm_response(text: str) -> Tuple[str, str]:
        """
        Sanitizes the generated response to eliminate any inadvertent diagnostic pronouncements,
        medication adjustments, or equating ML screening / speculative OCR with confirmed diagnoses.
        Returns (cleaned_text, safety_level).
        """
        cleaned = text

        # 1. Reframe assertive diagnostic claims (PCOS and Hypogonadism)
        cleaned = re.sub(
            r"\byou\s+(?:definitely|certainly)\s+have\s+pcos\b",
            "some of your recorded features can be associated with PCOS patterns",
            cleaned,
            flags=re.IGNORECASE,
        )
        cleaned = re.sub(
            r"\byou\s+(?:definitely|certainly)\s+have\s+hypogonadism\b",
            "some of your recorded features can be associated with hypogonadism screening patterns",
            cleaned,
            flags=re.IGNORECASE,
        )
        cleaned = re.sub(
            r"\byou\s+are\s+diagnosed\s+with\b",
            "your recorded patterns show indicators that can be discussed regarding",
            cleaned,
            flags=re.IGNORECASE,
        )

        # 2. Prevent treating ML screening probability or model output as confirmed diagnosis
        cleaned = re.sub(
            r"\b(?:the\s+model|the\s+screening\s+score|your\s+score)\s+(?:confirms|diagnoses|proves)\s+(?:that\s+you\s+have\s+)?(?:pcos|hypogonadism)\b",
            "the BioPulse AI screening model identifies statistical risk indicators for discussion with your doctor",
            cleaned,
            flags=re.IGNORECASE,
        )

        # 3. Prevent treating speculative OCR extraction as verified clinical fact
        cleaned = re.sub(
            r"\b(?:the\s+scanned\s+report|the\s+ocr\s+result)\s+(?:confirms|proves)\b",
            "the scanned document shows potential values awaiting your verification",
            cleaned,
            flags=re.IGNORECASE,
        )

        # 4. Block any suggestions to alter or stop medication
        cleaned = re.sub(
            r"\b(?:increase|decrease|stop|change)\s+your\s+(?:medication|dosage|dose|prescription)\b",
            "discuss any adjustments to your medication or dosage with your prescribing physician",
            cleaned,
            flags=re.IGNORECASE,
        )

        safety_level = "normal"
        if "emergency" in cleaned.lower() or "immediate" in cleaned.lower():
            safety_level = "caution"

        return cleaned, safety_level
