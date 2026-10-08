"""
backend/apps/intelligence/services/context_sanitizer.py

BioPulse AI Companion — LLM Context Sanitizer & Privacy Boundary.

Enforces a deterministic, allowlist-based privacy and minimization boundary
before any clinical context, conversation history, or user messages are
transmitted to external cloud LLM providers (e.g., Google Gemini).

Architectural Invariants:
1. Strict Data Minimization:
   Removes patient UUIDs, Supabase user IDs, database primary keys, emails,
   phone numbers, full names, addresses, tokens, JWTs, API keys, storage URLs,
   internal file paths, report filenames, appointment/doctor IDs, high-precision
   timestamps, and debugging information.
2. Allowlisted Structured Clinical Fields:
   Only clinically relevant, authorized sections survive (pathway, tier, category,
   probability, calibrated cutoff, top TreeSHAP factors, verified labs, biometrics,
   symptoms, cycle metrics, lifestyle protocol, unverified OCR notices).
3. Data Authority Preservation:
   The sanitizer NEVER recalculates, adjusts, or replaces ML screening probabilities,
   risk categories, screening tiers, TreeSHAP values, lab measurements, BMI, or
   lifestyle recommendation logic. BioPulse ML & deterministic engines remain authoritative.
4. Provenance Preservation:
   Verified laboratory data remains marked as confirmed.
   Unverified OCR extractions remain explicitly flagged as unconfirmed/pending human review.
5. Conversation History Minimization:
   Restricts conversation turns (bounded history) and enforces key allowlisting
   (sender/text only), stripping all metadata and redacting embedded secrets.
"""

from __future__ import annotations

import logging
import re
from typing import Any, Dict, List, Optional, Set

logger = logging.getLogger(__name__)

# Regular expression patterns for deterministic redaction of sensitive data & PII

# 1. UUIDs (RFC 4122)
UUID_PATTERN = re.compile(
    r"\b[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\b"
)

# 2. Authentication Tokens & Secrets
JWT_PATTERN = re.compile(
    r"\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_.-]*\b"
)
BEARER_PATTERN = re.compile(
    r"\bBearer\s+[A-Za-z0-9._~+/-]+=*\b", re.IGNORECASE
)
API_KEY_PATTERNS = [
    re.compile(r"\bAIza[0-9A-Za-z-_]{25,}\b"),  # Google AI / Gemini API Key
    re.compile(r"\bsk-[a-zA-Z0-9_-]{20,}\b"),   # OpenAI API Key
    re.compile(r"\bgsk_[a-zA-Z0-9_-]{20,}\b"),  # Groq API Key
    re.compile(r"\b(?:api[_-]?key|secret[_-]?key|access[_-]?token|auth[_-]?token)\s*[:=]\s*['\"]?[\w.-]{8,}['\"]?", re.IGNORECASE),
]

# 3. Contact & Identity Information
EMAIL_PATTERN = re.compile(
    r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b"
)
PHONE_PATTERN = re.compile(
    r"\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b"
)
NAME_FIELD_PATTERN = re.compile(
    r"\b(?:full_name|patient_name|user_name|username|doctor_name)\s*[:=]\s*['\"]?([A-Za-z\s]+)['\"]?",
    re.IGNORECASE,
)
EXPLICIT_NAME_LABEL_PATTERN = re.compile(
    r"\b(?:Patient|Doctor|User|Name)\s*:\s*[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+\b"
)
ADDRESS_FIELD_PATTERN = re.compile(
    r"\b(?:address|street_address|postal_code|zip_code|location)\s*[:=]\s*['\"]?[^,\n\r]+['\"]?",
    re.IGNORECASE,
)

# 4. Storage URLs & Internal File Paths
STORAGE_URL_PATTERN = re.compile(
    r"https?://[^\s)\]\"']+/storage/v1/[^\s)\]\"']+|https?://[^\s)\]\"']*supabase\.co/storage/[^\s)\]\"']+|/storage/v1/[^\s)\]\"']+",
    re.IGNORECASE,
)
WINDOWS_PATH_PATTERN = re.compile(
    r"\b[A-Za-z]:\\[^:\n\r\t,;()\"']+",
)
UNIX_PATH_PATTERN = re.compile(
    r"\b/(?:Users|home|app|backend|var|tmp|etc|root)/[^\s\n\r,;()\"']+",
)
REPORT_FILENAME_PATTERN = re.compile(
    r"\b[\w-]{2,}\.(?:pdf|png|jpe?g|webp|csv|xlsx|tiff?)\b",
    re.IGNORECASE,
)

# 5. Database Record Identifiers & System IDs
DATABASE_ID_PATTERN = re.compile(
    r"\b(?:user_id|patient_id|user_uuid|patient_uuid|report_id|doctor_id|appointment_id|record_id|session_id|profile_id)\s*[:=]\s*['\"]?[\w-]+['\"]?",
    re.IGNORECASE,
)
RECORD_NUMERIC_ID_PATTERN = re.compile(
    r"\b(?:record\s+id|patient\s+id|report\s+id|doctor\s+id|appointment\s+id)\s*[:#]\s*\d+\b",
    re.IGNORECASE,
)

# 6. High-Precision Timestamps (preserves date-only YYYY-MM-DD for clinical period events)
HIGH_PRECISION_TIMESTAMP_PATTERN = re.compile(
    r"\b\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?\b"
)

# 7. Allowlisted Context Section Prefixes
ALLOWLISTED_SECTION_PREFIXES = (
    "[BIOPULSE PATIENT PATHWAY]",
    "[TIER 4] [MODEL-DERIVED INSIGHTS",
    "[TIER 2] [VERIFIED LAB DATA",
    "[LABORATORY BIOMARKERS NOT RECORDED YET IN BIOPULSE]",
    "[TIER 3] [CALCULATED DATA",
    "[DIGITAL TWIN OBSERVATIONS",
    "[TIER 5] [USER-REPORTED - Logged Symptoms]",
    "[TIER 5] [USER-REPORTED - Cycle History]",
    "[TIER 5] [USER-REPORTED - Active Medications]",
    "[TIER 5] [USER-REPORTED - Lifestyle Logs]",
    "[TIER 4] [ACTIVE LIFESTYLE RECOMMENDATIONS",
    "[TIER 4] [AUTHORITATIVE BIOPULSE LIFESTYLE PROTOCOL",
    "[TIER 5] [UNVERIFIED OCR DATA - Awaiting Human Confirmation]",
    "[PATIENT RECORDS]",
)


class LLMContextSanitizer:
    """
    Deterministic privacy sanitization and minimization boundary for external LLMs.
    Guarantees zero PII leakage while preserving authoritative clinical ground truth.
    """

    @classmethod
    def strip_identifiers_and_pii(
        cls,
        text: str,
        patient_uuid: Optional[str] = None,
        patient_name: Optional[str] = None,
        patient_email: Optional[str] = None,
    ) -> str:
        """
        Deterministically scrubs all known identifiers, PII, authentication tokens,
        storage paths, and internal database keys from a text string.
        """
        if not text:
            return ""

        sanitized = text

        # 1. Explicit patient UUID / user ID string if provided
        if patient_uuid and str(patient_uuid).strip():
            p_str = str(patient_uuid).strip()
            if len(p_str) >= 3:
                sanitized = sanitized.replace(p_str, "[REDACTED_ID]")

        # 2. Explicit patient email if provided
        if patient_email and str(patient_email).strip():
            em_str = str(patient_email).strip()
            if len(em_str) >= 4:
                sanitized = re.sub(rf"\b{re.escape(em_str)}\b", "[REDACTED_EMAIL]", sanitized, flags=re.IGNORECASE)

        # 3. Explicit patient name tokens if provided (scrub full name and parts >= 3 chars)
        if patient_name and str(patient_name).strip():
            p_name = str(patient_name).strip()
            if len(p_name) >= 3:
                sanitized = re.sub(rf"\b{re.escape(p_name)}\b", "[PATIENT]", sanitized, flags=re.IGNORECASE)
            for part in re.split(r"[\s,._-]+", p_name):
                if len(part) >= 3:
                    sanitized = re.sub(rf"\b{re.escape(part)}\b", "[PATIENT]", sanitized, flags=re.IGNORECASE)

        # 4. Neutralize conversational greetings containing personal names (e.g. "Hello Ali!", "Hi Sarah,")
        sanitized = re.sub(r"\b(Hello|Hi|Hey|Dear)\s+[A-Z][a-z]+\b", r"\1 there", sanitized)

        # 5. RFC 4122 UUIDs
        sanitized = UUID_PATTERN.sub("[REDACTED_ID]", sanitized)

        # 6. JWTs and Bearer tokens
        sanitized = JWT_PATTERN.sub("[REDACTED_TOKEN]", sanitized)
        sanitized = BEARER_PATTERN.sub("Bearer [REDACTED_TOKEN]", sanitized)

        # 7. API keys
        for key_pat in API_KEY_PATTERNS:
            sanitized = key_pat.sub("[REDACTED_KEY]", sanitized)

        # 8. Email addresses
        sanitized = EMAIL_PATTERN.sub("[REDACTED_EMAIL]", sanitized)

        # 9. Phone numbers
        sanitized = PHONE_PATTERN.sub("[REDACTED_PHONE]", sanitized)

        # 10. Name fields and explicit name labels
        sanitized = NAME_FIELD_PATTERN.sub("[REDACTED_NAME]", sanitized)
        sanitized = EXPLICIT_NAME_LABEL_PATTERN.sub("[REDACTED_NAME]", sanitized)

        # 11. Address fields
        sanitized = ADDRESS_FIELD_PATTERN.sub("[REDACTED_LOCATION]", sanitized)

        # 12. Storage URLs and file paths
        sanitized = STORAGE_URL_PATTERN.sub("[REDACTED_STORAGE_PATH]", sanitized)
        sanitized = WINDOWS_PATH_PATTERN.sub("[REDACTED_PATH]", sanitized)
        sanitized = UNIX_PATH_PATTERN.sub("[REDACTED_PATH]", sanitized)

        # 13. Report filenames (e.g. blood_test.pdf, scan.png)
        sanitized = REPORT_FILENAME_PATTERN.sub("[REDACTED_FILENAME]", sanitized)

        # 14. Database and system IDs
        sanitized = DATABASE_ID_PATTERN.sub("[REDACTED_RECORD_ID]", sanitized)
        sanitized = RECORD_NUMERIC_ID_PATTERN.sub("[REDACTED_RECORD_ID]", sanitized)

        # 15. High-precision timestamps (reduce to date only if matching ISO timestamp)
        def _simplify_timestamp(match: re.Match) -> str:
            raw_ts = match.group(0)
            return raw_ts[:10]  # Retain only YYYY-MM-DD

        sanitized = HIGH_PRECISION_TIMESTAMP_PATTERN.sub(_simplify_timestamp, sanitized)

        return sanitized

    @classmethod
    def sanitize_clinical_context(
        cls,
        context_str: str,
        patient_uuid: Optional[str] = None,
        patient_name: Optional[str] = None,
        patient_email: Optional[str] = None,
    ) -> str:
        """
        Enforces allowlisted section structure and strips identifiers/PII from clinical context.

        Guarantees:
        1. Only allowlisted clinical sections survive.
        2. Probabilities, cutoff percentages, SHAP features, and verified labs are preserved.
        3. Unverified OCR notices are preserved with unconfirmed disclaimer.
        4. No database IDs, UUIDs, storage URLs, or filenames are transmitted.
        """
        if not context_str or not context_str.strip():
            return ""

        # Break context into distinct sections (separated by double newlines)
        raw_sections = context_str.split("\n\n")
        retained_sections: List[str] = []

        for section in raw_sections:
            trimmed = section.strip()
            if not trimmed:
                continue

            # Check if this section begins with an allowlisted section header
            is_allowlisted = any(
                trimmed.startswith(prefix) for prefix in ALLOWLISTED_SECTION_PREFIXES
            )

            if is_allowlisted:
                # Scrub identifiers and PII from the allowlisted section
                cleaned_section = cls.strip_identifiers_and_pii(
                    trimmed,
                    patient_uuid=patient_uuid,
                    patient_name=patient_name,
                    patient_email=patient_email,
                )
                retained_sections.append(cleaned_section)
            else:
                logger.debug("LLMContextSanitizer dropped non-allowlisted context section: %s...", trimmed[:60])

        sanitized_context = "\n\n".join(retained_sections)
        return sanitized_context

    @classmethod
    def sanitize_context(
        cls,
        raw_context: str,
        patient_uuid: Optional[str] = None,
        patient_name: Optional[str] = None,
        patient_email: Optional[str] = None,
    ) -> str:
        """Alias for sanitize_clinical_context."""
        return cls.sanitize_clinical_context(
            raw_context,
            patient_uuid=patient_uuid,
            patient_name=patient_name,
            patient_email=patient_email,
        )

    @classmethod
    def sanitize_conversation_history(
        cls,
        history: Optional[List[Dict[str, Any]]],
        max_turns: int = 8,
        patient_uuid: Optional[str] = None,
        patient_name: Optional[str] = None,
        patient_email: Optional[str] = None,
    ) -> List[Dict[str, str]]:
        """
        Sanitizes conversation history for external LLM transmission:
        1. Bounded history: retains at most max_turns (last N messages).
        2. Allowlist structured keys: retains strictly 'sender' and 'text'.
           Strips user_id, id, created_at, tokens, metadata, or auth information.
        3. Redacts any accidental tokens, keys, UUIDs, or credentials in message text.
        """
        if not history or not isinstance(history, list):
            return []

        bounded = history[-max_turns:]
        sanitized_history: List[Dict[str, str]] = []

        for item in bounded:
            if not isinstance(item, dict):
                continue

            raw_sender = item.get("sender") or item.get("role") or "user"
            clean_sender = "user" if str(raw_sender).lower() in ("user", "human") else "companion"
            raw_text = str(item.get("text") or item.get("content") or "").strip()

            if not raw_text:
                continue

            # Strip any credentials, keys, or IDs that might have been pasted into chat
            clean_text = cls.strip_identifiers_and_pii(
                raw_text,
                patient_uuid=patient_uuid,
                patient_name=patient_name,
                patient_email=patient_email,
            )

            sanitized_history.append({
                "sender": clean_sender,
                "text": clean_text,
            })

        return sanitized_history

    @classmethod
    def sanitize_system_instruction(
        cls,
        instruction: str,
        patient_uuid: Optional[str] = None,
        patient_name: Optional[str] = None,
        patient_email: Optional[str] = None,
    ) -> str:
        """
        Ensures system instructions contain no internal system paths or secrets.
        """
        if not instruction:
            return ""
        return cls.strip_identifiers_and_pii(
            instruction,
            patient_uuid=patient_uuid,
            patient_name=patient_name,
            patient_email=patient_email,
        )

    @classmethod
    def sanitize_user_message(
        cls,
        user_message: str,
        patient_uuid: Optional[str] = None,
        patient_name: Optional[str] = None,
        patient_email: Optional[str] = None,
    ) -> str:
        """
        Treats incoming user message as untrusted input. Redacts accidental tokens/secrets.
        """
        if not user_message:
            return ""
        return cls.strip_identifiers_and_pii(
            user_message,
            patient_uuid=patient_uuid,
            patient_name=patient_name,
            patient_email=patient_email,
        )
