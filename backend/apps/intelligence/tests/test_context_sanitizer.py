"""
backend/apps/intelligence/tests/test_context_sanitizer.py

Automated test suite for BioPulse AI Companion Privacy Sanitization Boundary (LLMContextSanitizer).

Tests:
1. Female PCOS context (clinically relevant fields survive, PII/identifiers removed, probabilities & SHAP preserved, unverified OCR remains marked).
2. Male hypogonadism context (ADAM findings, testosterone labs, hormone patterns preserved, IDs removed).
3. Privacy (JWT, API keys, storage paths, report filenames, database IDs, nested PII removed, conversation history minimized).
4. Authority (sanitizer never recalculates risk, probabilities, SHAP values, or lab values).
5. Provider Boundary (Gemini receives sanitized context only, cannot be bypassed, frontend cannot inject clinical state).

All external LLM (Gemini) network calls are strictly MOCKED. Zero real API quota consumed.
"""

from __future__ import annotations

import json
from typing import Any, Dict, List
import unittest
from unittest.mock import MagicMock, patch
import urllib.request

from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIRequestFactory, force_authenticate

from apps.intelligence.services.context_sanitizer import (
    LLMContextSanitizer,
    UUID_PATTERN,
    JWT_PATTERN,
    API_KEY_PATTERNS,
)
from apps.intelligence.services.llm_provider import (
    GeminiProvider,
    LLMResponse,
)
from apps.intelligence.views import IntelligenceChatView


class FemalePCOSContextTests(TestCase):
    """Verifies that female PCOS clinical context retains clinical ground truth while stripping all identifiers & PII."""

    def setUp(self):
        self.patient_uuid = "e3b0c442-98fc-1c14-9afbf-4c8996fb9242"
        self.email = "patient.jane@example.com"
        self.phone = "+1 (555) 987-6543"
        self.jwt = "eyJ" + "hbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkphbmUgRG9lIn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
        self.storage_path = "https://dqqrqwjeebecmgfsihtv.supabase.co/storage/v1/object/public/reports/ultrasound_scan_01.png"
        self.file_path = "C:\\Users\\hp\\Desktop\\Projects\\PMOSense\\reports\\lab_test_2026.pdf"

        # Raw multi-section female context with mixed clinical data, IDs, and PII
        self.raw_female_context = (
            f"[BIOPULSE PATIENT PATHWAY]: FEMALE | Condition Monitored: Polycystic Ovary Syndrome (PCOS)\n"
            f"Patient ID: {self.patient_uuid}\n\n"
            f"[TIER 4] [MODEL-DERIVED INSIGHTS - Screening Assessment (NOT a Diagnosis)]: "
            f"Active Tier: TIER 1, Category: higher_risk, "
            f"Statistical Screening Probability: 68.4% (Calibrated screening cutoff: 38%). "
            f"Primary TreeSHAP factors: Cycle Regularity (increases risk), Fasting Glucose (increases risk), BMI (increases risk).\n"
            f"• Ovarian Ultrasound Status: PCOM Positive\n"
            f"• Active System Recommendations: Consult reproductive endocrinologist; Implement Low Glycemic nutrition\n\n"
            f"[TIER 2] [VERIFIED LAB DATA - Confirmed by Patient]: "
            f"Fasting Glucose: 92.0 mg/dL, Ref Range: 70-99; "
            f"Total Testosterone: 48.5 ng/dL, Ref Range: 15-70; "
            f"LH: 11.2 mIU/mL, Ref Range: 2.4-12.6\n\n"
            f"[LABORATORY BIOMARKERS NOT RECORDED YET IN BIOPULSE]:\n"
            f"The following biomarkers have NOT been recorded in the patient's account: AMH: Not recorded yet; TSH: Not recorded yet. "
            f"If the user asks about these values, clearly inform them that they have not recorded them yet in BioPulse.\n\n"
            f"[TIER 3] [CALCULATED DATA - Deterministic Biometrics]: "
            f"Calculated BMI: 28.4 kg/m² (Height: 165cm, Weight: 77.5kg), Age: 28 years, Reported Cycle Regularity: irregular\n\n"
            f"[DIGITAL TWIN OBSERVATIONS - READ ONLY]:\n"
            f"• Menstrual Status: Day 14 (Follicular Phase) — Estrogen progressively rising.\n"
            f"• 30-Day Symptom Pattern: Acne (8x), Pelvic Pain (3x).\n"
            f"• High Severity Symptoms Noted: Pelvic Pain.\n"
            f"• Hydration Adherence: 6.5 glasses/day (81% of target).\n"
            f"• Sleep Quality: 7.5 hrs/night (Optimal target met).\n"
            f"• Nutrition & Lifestyle: Preference: Low-GI Mediterranean.\n"
            f"• Notice: Structured rule-based physiological metrics. Read-only; LLM cannot alter this state.\n\n"
            f"[TIER 5] [USER-REPORTED - Logged Symptoms]: Acne (severe); Pelvic cramps (moderate); Hirsutism (mild)\n\n"
            f"[TIER 5] [USER-REPORTED - Cycle History]: Period start: 2026-04-01 (Flow: heavy)\n\n"
            f"[TIER 5] [USER-REPORTED - Active Medications]: Metformin (500mg, twice daily); Spironolactone (25mg, daily)\n\n"
            f"[TIER 5] [USER-REPORTED - Lifestyle Logs]: 7 water log entries, 4 meal entries\n\n"
            f"[TIER 4] [ACTIVE LIFESTYLE RECOMMENDATIONS - Deterministic BioPulse Protocol]:\n"
            f"- Nutrition Strategy: Low Glycemic & Anti-Inflammatory Protocol\n"
            f"- Calorie Target: ~1850 kcal/day\n"
            f"- Recommended Swaps: White rice -> Quinoa or riced cauliflower\n"
            f"- Fitness Protocol: Zone 2 Low-Impact Aerobic & Resistance\n"
            f"- Active Priorities: Consistent post-meal walks [ACTIVE]; Hydration optimization [ACTIVE]\n"
            f"(Explain and reinforce these exact recommendations when the patient asks about diet, fitness, or recovery).\n\n"
            f"[TIER 5] [UNVERIFIED OCR DATA - Awaiting Human Confirmation]: "
            f"Fasting Insulin: 14.8 uIU/mL. "
            f"(Note: The patient has NOT yet reviewed or verified these extracted values; DO NOT treat as fact).\n\n"
            f"[INTERNAL DEBUG METADATA - MUST BE DROPPED]: "
            f"user_id={self.patient_uuid} email={self.email} phone={self.phone} auth={self.jwt} storage={self.storage_path} local_path={self.file_path}"
        )

    def test_female_pcos_clinically_relevant_fields_survive(self):
        """Clinically relevant fields (tier, category, probability, TreeSHAP, verified labs, biometrics, symptoms, lifestyle) survive sanitization."""
        sanitized = LLMContextSanitizer.sanitize_clinical_context(
            self.raw_female_context, patient_uuid=self.patient_uuid
        )

        # 1. Authoritative Pathway & Screening
        self.assertIn("[BIOPULSE PATIENT PATHWAY]: FEMALE", sanitized)
        self.assertIn("Polycystic Ovary Syndrome (PCOS)", sanitized)
        self.assertIn("Active Tier: TIER 1", sanitized)
        self.assertIn("Category: higher_risk", sanitized)
        self.assertIn("Statistical Screening Probability: 68.4%", sanitized)
        self.assertIn("Calibrated screening cutoff: 38%", sanitized)

        # 2. TreeSHAP Factors
        self.assertIn("Primary TreeSHAP factors", sanitized)
        self.assertIn("Cycle Regularity (increases risk)", sanitized)
        self.assertIn("Fasting Glucose (increases risk)", sanitized)
        self.assertIn("BMI (increases risk)", sanitized)
        self.assertIn("Ovarian Ultrasound Status: PCOM Positive", sanitized)

        # 3. Verified Labs
        self.assertIn("[TIER 2] [VERIFIED LAB DATA - Confirmed by Patient]", sanitized)
        self.assertIn("Fasting Glucose: 92.0 mg/dL", sanitized)
        self.assertIn("Ref Range: 70-99", sanitized)
        self.assertIn("Total Testosterone: 48.5 ng/dL", sanitized)

        # 4. Missing Labs
        self.assertIn("[LABORATORY BIOMARKERS NOT RECORDED YET IN BIOPULSE]", sanitized)
        self.assertIn("AMH: Not recorded yet", sanitized)

        # 5. Deterministic Biometrics
        self.assertIn("Calculated BMI: 28.4 kg/m²", sanitized)
        self.assertIn("Age: 28 years", sanitized)
        self.assertIn("Reported Cycle Regularity: irregular", sanitized)

        # 6. Symptoms & Cycle
        self.assertIn("Acne (severe)", sanitized)
        self.assertIn("Period start: 2026-04-01", sanitized)
        self.assertIn("Metformin (500mg, twice daily)", sanitized)

        # 7. Deterministic Lifestyle Protocol
        self.assertIn("Low Glycemic & Anti-Inflammatory Protocol", sanitized)
        self.assertIn("Calorie Target: ~1850 kcal/day", sanitized)

    def test_female_pcos_identifiers_and_pii_strictly_removed(self):
        """User UUID, email, phone, JWT, file paths, storage URLs, and internal debug sections are removed."""
        sanitized = LLMContextSanitizer.sanitize_clinical_context(
            self.raw_female_context, patient_uuid=self.patient_uuid
        )

        self.assertNotIn(self.patient_uuid, sanitized)
        self.assertNotIn(self.email, sanitized)
        self.assertNotIn(self.phone, sanitized)
        self.assertNotIn(self.jwt, sanitized)
        self.assertNotIn(self.storage_path, sanitized)
        self.assertNotIn(self.file_path, sanitized)
        self.assertNotIn("lab_test_2026.pdf", sanitized)
        self.assertNotIn("ultrasound_scan_01.png", sanitized)
        self.assertNotIn("[INTERNAL DEBUG METADATA", sanitized)

    def test_unverified_ocr_remains_explicitly_marked(self):
        """Unverified OCR results remain marked as unverified / awaiting confirmation and never converted to verified fact."""
        sanitized = LLMContextSanitizer.sanitize_clinical_context(
            self.raw_female_context, patient_uuid=self.patient_uuid
        )

        self.assertIn("[TIER 5] [UNVERIFIED OCR DATA - Awaiting Human Confirmation]", sanitized)
        self.assertIn("Fasting Insulin: 14.8 uIU/mL", sanitized)
        self.assertIn("Note: The patient has NOT yet reviewed or verified these extracted values; DO NOT treat as fact", sanitized)


class MaleHypogonadismContextTests(TestCase):
    """Verifies that male hypogonadism context preserves ADAM questionnaire findings, testosterone labs, and hormone patterns."""

    def setUp(self):
        self.patient_uuid = "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d"
        self.raw_male_context = (
            f"[BIOPULSE PATIENT PATHWAY]: MALE | Condition Monitored: Male Hypogonadism\n"
            f"user_id: {self.patient_uuid}\n\n"
            f"[TIER 4] [MODEL-DERIVED INSIGHTS - Screening Assessment (NOT a Diagnosis)]: "
            f"Active Tier: TIER 2, Category: higher_risk, "
            f"Statistical Screening Probability: 44.8% (Calibrated screening cutoff: 33.8%). "
            f"Primary clinical contributing factors: Morning Total Testosterone (increases risk), Decreased Energy (increases risk), Libido Decline (increases risk).\n"
            f"• Hormone Classification Pattern: Primary Hypogonadism (Elevated gonadotropins LH/FSH with sub-physiological testosterone)\n"
            f"• Active System Recommendations: Consult urologist/endocrinologist; Repeat morning fasting testosterone test\n\n"
            f"[TIER 2] [VERIFIED LAB DATA - Confirmed by Patient]: "
            f"Total Testosterone: 185.0 ng/dL, Ref Range: 300-1000; "
            f"Free Testosterone: 4.8 pg/mL, Ref Range: 9.3-26.5; "
            f"LH: 14.2 mIU/mL, Ref Range: 1.7-8.6; "
            f"FSH: 12.8 mIU/mL, Ref Range: 1.5-12.4\n\n"
            f"[TIER 3] [CALCULATED DATA - Deterministic Biometrics]: "
            f"Calculated BMI: 29.2 kg/m² (Height: 178cm, Weight: 92.5kg), Age: 44 years\n\n"
            f"[TIER 5] [USER-REPORTED - Logged Symptoms]: "
            f"Low Libido (severe); Morning Fatigue (severe); Decreased Muscle Strength (moderate); Erectile Dysfunction (mild)\n\n"
            f"[TIER 4] [ACTIVE LIFESTYLE RECOMMENDATIONS - Deterministic BioPulse Protocol]:\n"
            f"- Nutrition Strategy: Micronutrient Dense & Androgen Support Protocol\n"
            f"- Calorie Target: ~2200 kcal/day\n"
            f"- Fitness Protocol: Progressive Heavy Compound Resistance Training\n"
            f"- Active Priorities: Consistent 8h sleep schedule [ACTIVE]; Vitamin D & Zinc intake [ACTIVE]\n\n"
            f"[SYSTEM_TELEMETRY]: session_id=sess_998877 client_ip=192.168.1.100 appointment_id=appt_4433 doctor_id=doc_1122"
        )

    def test_male_context_preserves_adam_and_androgen_findings(self):
        """ADAM findings, testosterone labs, and hormone pattern survive sanitization."""
        sanitized = LLMContextSanitizer.sanitize_clinical_context(
            self.raw_male_context, patient_uuid=self.patient_uuid
        )

        self.assertIn("[BIOPULSE PATIENT PATHWAY]: MALE", sanitized)
        self.assertIn("Male Hypogonadism", sanitized)
        self.assertIn("Active Tier: TIER 2", sanitized)
        self.assertIn("Statistical Screening Probability: 44.8%", sanitized)
        self.assertIn("Calibrated screening cutoff: 33.8%", sanitized)
        self.assertIn("Hormone Classification Pattern: Primary Hypogonadism", sanitized)
        self.assertIn("Total Testosterone: 185.0 ng/dL", sanitized)
        self.assertIn("Ref Range: 300-1000", sanitized)
        self.assertIn("Calculated BMI: 29.2 kg/m²", sanitized)
        self.assertIn("Age: 44 years", sanitized)
        self.assertIn("Low Libido (severe)", sanitized)
        self.assertIn("Morning Fatigue (severe)", sanitized)
        self.assertIn("Progressive Heavy Compound Resistance Training", sanitized)

    def test_male_context_strips_internal_identifiers_and_telemetry(self):
        """User UUID, database IDs, session IDs, appointment IDs, and telemetry are stripped."""
        sanitized = LLMContextSanitizer.sanitize_clinical_context(
            self.raw_male_context, patient_uuid=self.patient_uuid
        )

        self.assertNotIn(self.patient_uuid, sanitized)
        self.assertNotIn("session_id", sanitized)
        self.assertNotIn("sess_998877", sanitized)
        self.assertNotIn("appointment_id", sanitized)
        self.assertNotIn("appt_4433", sanitized)
        self.assertNotIn("doctor_id", sanitized)
        self.assertNotIn("doc_1122", sanitized)
        self.assertNotIn("[SYSTEM_TELEMETRY]", sanitized)


class PrivacySanitizationTests(TestCase):
    """Verifies deterministic stripping of tokens, API keys, paths, database IDs, and history metadata."""

    def test_jwt_and_bearer_tokens_removed(self):
        token_sample = "eyJ" + "hbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiMTIzIn0.abcdef1234567890-XYZ"
        text = f"Authorization token is Bearer {token_sample}"
        cleaned = LLMContextSanitizer.strip_identifiers_and_pii(text)
        self.assertNotIn("eyJ" + "hbGciOi", cleaned)
        self.assertIn("[REDACTED_TOKEN]", cleaned)

    def test_api_keys_removed(self):
        text = (
            "Google AI: AIzaSyD9876543210abcdefghijklmnopqrs_TUV, "
            "OpenAI: sk-proj-1234567890abcdefghijklmnopqrstuv, "
            "Groq: gsk_abcdefghijklmnopqrstuvwxyz1234567890, "
            "Generic: api_key='my_super_secret_key_12345'"
        )
        cleaned = LLMContextSanitizer.strip_identifiers_and_pii(text)
        self.assertNotIn("AIzaSyD", cleaned)
        self.assertNotIn("sk-proj-", cleaned)
        self.assertNotIn("gsk_", cleaned)
        self.assertNotIn("my_super_secret_key", cleaned)
        self.assertIn("[REDACTED_KEY]", cleaned)

    def test_storage_paths_and_filenames_removed(self):
        text = (
            "Report stored at https://myproject.supabase.co/storage/v1/object/public/reports/patient_scan_99.pdf. "
            "Local backup is C:\\Users\\hp\\Desktop\\BioPulse\\reports\\scan_99.pdf and /app/backend/data/scan_99.png"
        )
        cleaned = LLMContextSanitizer.strip_identifiers_and_pii(text)
        self.assertNotIn("https://myproject.supabase.co/storage", cleaned)
        self.assertNotIn("patient_scan_99.pdf", cleaned)
        self.assertNotIn("C:\\Users\\hp", cleaned)
        self.assertNotIn("/app/backend/data", cleaned)
        self.assertNotIn("scan_99.png", cleaned)

    def test_database_record_ids_removed(self):
        text = "Patient user_id=f47ac10b-58cc-4372-a567-0e02b2c3d479 with report_id=987123 and doctor_id=doc_55."
        cleaned = LLMContextSanitizer.strip_identifiers_and_pii(text)
        self.assertNotIn("f47ac10b-58cc-4372-a567-0e02b2c3d479", cleaned)
        self.assertNotIn("987123", cleaned)
        self.assertNotIn("doc_55", cleaned)

    def test_conversation_history_sanitization(self):
        raw_history = [
            {"sender": "user", "text": "Hello", "user_id": "usr-1", "jwt": "eyJ..."},
            {"sender": "companion", "text": "Hi Jane, your report scan_42.pdf is ready.", "timestamp": 1727539200},
            {"sender": "user", "text": "My API key is AIzaSyD9876543210abcdefghijklmnopqrs_TUV and email is jane@test.com", "metadata": {"ip": "1.1.1.1"}},
        ]

        sanitized_history = LLMContextSanitizer.sanitize_conversation_history(raw_history, max_turns=2)

        # 1. Bounded to last 2 turns
        self.assertEqual(len(sanitized_history), 2)

        # 2. Structured key allowlisting: strictly 'sender' and 'text'
        for turn in sanitized_history:
            self.assertEqual(set(turn.keys()), {"sender", "text"})
            self.assertNotIn("user_id", turn)
            self.assertNotIn("jwt", turn)
            self.assertNotIn("timestamp", turn)
            self.assertNotIn("metadata", turn)

        # 3. Text content is scrubbed of PII and secrets
        last_turn_text = sanitized_history[1]["text"]
        self.assertNotIn("AIzaSyD", last_turn_text)
        self.assertNotIn("jane@test.com", last_turn_text)
        self.assertIn("[REDACTED_KEY]", last_turn_text)
        self.assertIn("[REDACTED_EMAIL]", last_turn_text)

        first_turn_text = sanitized_history[0]["text"]
        self.assertNotIn("scan_42.pdf", first_turn_text)


class AuthorityPreservationTests(TestCase):
    """Verifies that LLMContextSanitizer preserves data authority and never recalculates or alters clinical outputs."""

    def test_sanitizer_does_not_alter_probabilities(self):
        probs = ["0.1808", "0.29", "0.3379", "0.38", "38.0%", "44.8%", "68.4%", "82.5%"]
        for p in probs:
            context = f"[TIER 4] [MODEL-DERIVED INSIGHTS - Screening Assessment (NOT a Diagnosis)]: Statistical Screening Probability: {p}"
            sanitized = LLMContextSanitizer.sanitize_clinical_context(context)
            self.assertIn(f"Statistical Screening Probability: {p}", sanitized)

    def test_sanitizer_does_not_alter_shap_factors(self):
        factors = (
            "Cycle Regularity (increases risk), Fasting Glucose (increases risk), "
            "BMI (increases risk), LH:FSH Ratio (neutral), Total Testosterone (decreases risk)"
        )
        context = f"[TIER 4] [MODEL-DERIVED INSIGHTS - Screening Assessment (NOT a Diagnosis)]: Primary TreeSHAP factors: {factors}"
        sanitized = LLMContextSanitizer.sanitize_clinical_context(context)
        self.assertIn(factors, sanitized)

    def test_sanitizer_does_not_alter_lab_values_or_ranges(self):
        labs = "Fasting Glucose: 92.5 mg/dL, Ref Range: 70.0-99.0; Total Testosterone: 180.0 ng/dL, Ref Range: 300-1000"
        context = f"[TIER 2] [VERIFIED LAB DATA - Confirmed by Patient]: {labs}"
        sanitized = LLMContextSanitizer.sanitize_clinical_context(context)
        self.assertIn(labs, sanitized)

    def test_sanitizer_has_no_recalculation_methods(self):
        """Sanitizer is purely a privacy and minimization boundary and contains no inference or recalculation logic."""
        self.assertFalse(hasattr(LLMContextSanitizer, "predict"))
        self.assertFalse(hasattr(LLMContextSanitizer, "calculate_risk"))
        self.assertFalse(hasattr(LLMContextSanitizer, "calculate_bmi"))
        self.assertFalse(hasattr(LLMContextSanitizer, "compute_shap"))


class ProviderBoundaryTests(TestCase):
    """Verifies that external providers (Gemini) receive sanitized context only and that frontend cannot inject clinical state."""

    def setUp(self):
        self.dummy_api_key = "test-gemini-key-12345"
        self.provider = GeminiProvider(api_key=self.dummy_api_key, model_name="gemini-3.8-flash")
        self.patient_uuid = "99887766-5544-3322-1100-aabbccddeeff"

    @patch("urllib.request.urlopen")
    def test_gemini_provider_automatically_sanitizes_context_before_transmission(self, mock_urlopen):
        """Even if unsanitized context with UUIDs, JWTs, and storage URLs is passed to GeminiProvider, Google receives sanitized payload."""
        mock_resp = MagicMock()
        mock_resp.read.return_value = json.dumps({
            "candidates": [{
                "content": {"parts": [{"text": "BioPulse AI Companion explanation of your screening result."}]}
            }]
        }).encode("utf-8")
        mock_resp.__enter__.return_value = mock_resp
        mock_urlopen.return_value = mock_resp

        raw_context = (
            f"[BIOPULSE PATIENT PATHWAY]: FEMALE\n\n"
            f"[TIER 4] [MODEL-DERIVED INSIGHTS - Screening Assessment (NOT a Diagnosis)]: "
            f"Active Tier: TIER 1, Statistical Screening Probability: 55.0% (Calibrated screening cutoff: 38%). "
            f"Primary TreeSHAP factors: Cycle Regularity (increases risk).\n\n"
            f"[TIER 2] [VERIFIED LAB DATA - Confirmed by Patient]: Fasting Glucose: 90 mg/dL\n\n"
            f"[SECRET_LEAK]: patient_uuid={self.patient_uuid} token={'eyJ' + 'hbGciOiJIUzI1NiJ9'}.eyJ1c2VyIjoiMTIzIn0.abcdef file=report_99.pdf"
        )
        dummy_tok = "eyJ" + "hbGciOiJIUzI1NiJ9.xyz.abc"
        raw_user_msg = f"Please check my report report_99.pdf with token {dummy_tok}"
        raw_history = [
            {"sender": "user", "text": "My email is user@example.com", "user_id": self.patient_uuid}
        ]

        response = self.provider.generate_chat_response(
            system_instruction="System prompt for BioPulse AI.",
            user_message=raw_user_msg,
            health_context=raw_context,
            conversation_history=raw_history,
        )

        self.assertIsInstance(response, LLMResponse)
        self.assertEqual(response.model_name, "gemini-3.8-flash")

        # Inspect the exact request sent to Google API
        self.assertTrue(mock_urlopen.called)
        sent_req = mock_urlopen.call_args[0][0]
        sent_body_str = sent_req.data.decode("utf-8")

        # 1. PII and secrets must NOT be in the body sent to Google
        self.assertNotIn(self.patient_uuid, sent_body_str)
        self.assertNotIn("eyJ" + "hbGciOiJIUzI1NiJ9.eyJ1c2VyIjoiMTIzIn0", sent_body_str)
        self.assertNotIn("report_99.pdf", sent_body_str)
        self.assertNotIn("user@example.com", sent_body_str)
        self.assertNotIn("[SECRET_LEAK]", sent_body_str)

        # 2. Authoritative clinical data MUST be preserved in the body sent to Google
        self.assertIn("Statistical Screening Probability: 55.0%", sent_body_str)
        self.assertIn("Calibrated screening cutoff: 38%", sent_body_str)
        self.assertIn("Cycle Regularity (increases risk)", sent_body_str)
        self.assertIn("Fasting Glucose: 90 mg/dL", sent_body_str)

    def test_frontend_cannot_inject_authoritative_clinical_state(self):
        """Frontend request containing fabricated clinical context or screening scores is rejected/ignored by the authoritative pipeline."""
        factory = APIRequestFactory()
        user_mock = MagicMock()
        user_mock.id = self.patient_uuid
        user_mock.is_authenticated = True
        user_mock.raw_token = "mock-auth-token"

        malicious_payload = {
            "message": "Explain my risk",
            # Attempted frontend injections of authoritative clinical state
            "probability": 0.01,
            "risk_category": "low_risk",
            "health_context": "INJECTED_FAKED_HEALTH_CONTEXT_OVERRIDE",
            "clinical_state": {"testosterone": 9999},
        }

        request = factory.post(
            "/api/v1/intelligence/companion/chat/",
            data=json.dumps(malicious_payload),
            content_type="application/json",
        )
        force_authenticate(request, user=user_mock)

        with patch("apps.intelligence.views.HealthContextBuilder.build_context") as mock_builder, \
             patch("apps.intelligence.views.get_llm_provider") as mock_get_provider:

            mock_provider = MagicMock()
            mock_provider.generate_chat_response.return_value = LLMResponse(
                answer="BioPulse verified response.",
                confidence="high",
                model_name="qwen3:1.7b",
            )
            mock_get_provider.return_value = mock_provider

            mock_builder.return_value = (
                "Authoritative system prompt",
                "[BIOPULSE PATIENT PATHWAY]: FEMALE\n\n[TIER 4] [MODEL-DERIVED INSIGHTS - Screening Assessment (NOT a Diagnosis)]: Statistical Screening Probability: 72.0%",
                {"ml_screening": True},
            )

            view = IntelligenceChatView.as_view()
            response = view(request)

            self.assertEqual(response.status_code, status.HTTP_200_OK)

            # HealthContextBuilder must be called with authoritative backend patient_uuid
            mock_builder.assert_called_once()
            call_args = mock_builder.call_args[0]
            self.assertEqual(call_args[0], self.patient_uuid)

            # The LLM provider received backend authoritative context, NOT the injected faked context
            provider_call_args = mock_provider.generate_chat_response.call_args[1]
            self.assertNotIn("INJECTED_FAKED_HEALTH_CONTEXT_OVERRIDE", provider_call_args["health_context"])
            self.assertIn("Statistical Screening Probability: 72.0%", provider_call_args["health_context"])


class AliPrivacyRegressionTests(TestCase):
    """
    BioPulse AI Companion Regression Test Suite:
    Proves that a patient profile with:
      name = "Ali"
      email = "ali@example.com"
      user UUID = synthetic UUID
    does NOT expose any PII, identifiers, or tokens in the outbound Gemini payload,
    while strictly preserving authoritative screening results, risk probability, and SHAP factors.
    """

    def setUp(self):
        self.patient_name = "Ali"
        self.patient_email = "ali@example.com"
        self.patient_uuid = "22334455-6677-8899-aabb-ccddeeff0011"
        self.profile_id = "prof-998877"
        self.supabase_id = "sb_user_12345"
        self.jwt = "eyJ" + "hbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyMjMzNDQ1NS02Njc3LTg4OTktYWFiYi1jY2RkZWVmZjAwMTEiLCJlbWFpbCI6ImFsaUBleGFtcGxlLmNvbSJ9.sig_sample"
        self.file_name = "ultrasound_ali_scan.pdf"
        self.storage_url = "https://dqqrqwjeebecmgfsihtv.supabase.co/storage/v1/object/public/reports/ultrasound_ali_scan.pdf"

    @patch("urllib.request.urlopen")
    def test_ali_profile_is_never_exposed_in_outbound_gemini_request(self, mock_urlopen):
        """
        End-to-end test of GeminiProvider outbound request construction:
        Guarantees that 'Ali', 'ali@example.com', synthetic UUID, profile ID, JWT,
        and report filenames are completely scrubbed before the HTTP request leaves the backend.
        """
        mock_resp = MagicMock()
        mock_resp.read.return_value = json.dumps({
            "candidates": [{
                "content": {"parts": [{"text": "Hello there! Here is an explanation of your screening result."}]}
            }]
        }).encode("utf-8")
        mock_resp.__enter__.return_value = mock_resp
        mock_urlopen.return_value = mock_resp

        provider = GeminiProvider(api_key="test-gemini-key", model_name="gemini-3.8-flash")

        # System instruction and context containing clinical data AND potential leaks
        system_instruction = (
            "You are BioPulse AI Companion for Male Hypogonadism screening. "
            "Patient Name: Ali. Email: ali@example.com."
        )
        health_context = (
            f"[BIOPULSE PATIENT PATHWAY]: MALE | Condition Monitored: Male Hypogonadism\n\n"
            f"[TIER 4] [MODEL-DERIVED INSIGHTS - Screening Assessment (NOT a Diagnosis)]: "
            f"Active Tier: TIER 1, Category: higher_risk, "
            f"Statistical Screening Probability: 42.5% (Calibrated screening cutoff: 18.08%). "
            f"Primary TreeSHAP factors: Total Testosterone (decreases risk), Low Libido (increases risk).\n\n"
            f"[TIER 2] [VERIFIED LAB DATA - Confirmed by Patient]: Total Testosterone: 280 ng/dL\n\n"
            f"[INTERNAL LEAK TEST]: profile_id={self.profile_id} supabase_id={self.supabase_id} "
            f"user_id={self.patient_uuid} email={self.patient_email} auth={self.jwt} storage={self.storage_url} "
            f"file={self.file_name}"
        )
        user_message = "Hello! Please explain my screening result for Ali."
        conversation_history = [
            {"sender": "assistant", "text": "Hello Ali! I am your BioPulse AI Companion."},
            {"sender": "user", "text": "Hi, my email is ali@example.com and my report is ultrasound_ali_scan.pdf"},
        ]

        response = provider.generate_chat_response(
            system_instruction=system_instruction,
            user_message=user_message,
            health_context=health_context,
            conversation_history=conversation_history,
            patient_uuid=self.patient_uuid,
            patient_name=self.patient_name,
            patient_email=self.patient_email,
        )

        self.assertIsInstance(response, LLMResponse)
        self.assertTrue(mock_urlopen.called)

        # Inspect the exact JSON payload sent to Google
        sent_req = mock_urlopen.call_args[0][0]
        sent_body = json.loads(sent_req.data.decode("utf-8"))
        sent_body_str = json.dumps(sent_body)

        # ---------------- FORBIDDEN FIELDS ----------------
        self.assertNotIn("Ali", sent_body_str, "Patient name 'Ali' must NOT appear anywhere in the outbound Gemini payload")
        self.assertNotIn("ali@example.com", sent_body_str, "Patient email must NOT appear in the outbound Gemini payload")
        self.assertNotIn(self.patient_uuid, sent_body_str, "Patient UUID must NOT appear in the outbound Gemini payload")
        self.assertNotIn(self.profile_id, sent_body_str, "Profile ID must NOT appear in the outbound Gemini payload")
        self.assertNotIn(self.supabase_id, sent_body_str, "Supabase ID must NOT appear in the outbound Gemini payload")
        self.assertNotIn(self.jwt, sent_body_str, "JWT must NOT appear in the outbound Gemini payload")
        self.assertNotIn("ultrasound_ali_scan.pdf", sent_body_str, "Filenames must NOT appear in outbound payload")
        self.assertNotIn("dqqrqwjeebecmgfsihtv.supabase.co", sent_body_str, "Storage URLs must NOT appear in outbound payload")

        # ---------------- ALLOWED CLINICAL FIELDS ----------------
        self.assertIn("Male Hypogonadism", sent_body_str, "Pathway must be retained")
        self.assertIn("Statistical Screening Probability: 42.5%", sent_body_str, "Screening probability must be retained")
        self.assertIn("higher_risk", sent_body_str, "Risk category must be retained")
        self.assertIn("TIER 1", sent_body_str, "Risk tier must be retained")
        self.assertIn("Total Testosterone (decreases risk)", sent_body_str, "SHAP factors must be retained")
        self.assertIn("Total Testosterone: 280 ng/dL", sent_body_str, "Verified lab values must be retained")

    @patch("apps.intelligence.views.get_llm_provider")
    @patch("apps.intelligence.views.HealthContextBuilder.build_context")
    def test_intelligence_chat_view_scrubs_ali_identity(self, mock_build_ctx, mock_get_provider):
        """
        Verifies that IntelligenceChatView derives identity from JWT, extracts patient name/email,
        and sanitizes outbound data before reaching the LLM provider.
        """
        factory = APIRequestFactory()
        user_mock = MagicMock()
        user_mock.id = self.patient_uuid
        user_mock.email = self.patient_email
        user_mock.is_authenticated = True
        user_mock.raw_token = self.jwt

        mock_provider = MagicMock()
        mock_provider.generate_chat_response.return_value = LLMResponse(
            answer="Here is your screening analysis.",
            confidence="high",
            model_name="gemini-3.8-flash",
        )
        mock_get_provider.return_value = mock_provider

        mock_build_ctx.return_value = (
            "System prompt for BioPulse AI.",
            f"[BIOPULSE PATIENT PATHWAY]: MALE\n\n[TIER 4] [MODEL-DERIVED INSIGHTS - Screening Assessment (NOT a Diagnosis)]: Statistical Screening Probability: 42.5%",
            {"ml_screening": True},
        )

        request_payload = {
            "message": "Explain my screening result.",
            "conversation_history": [
                {"role": "assistant", "content": "Hello Ali! How are you?"},
                {"role": "user", "content": "Hello, my email is ali@example.com"},
            ],
            "client_telemetry": {
                "pathway": "male"
            }
        }

        request = factory.post(
            "/api/v1/intelligence/companion/chat/",
            data=json.dumps(request_payload),
            content_type="application/json",
        )
        force_authenticate(request, user=user_mock)

        view = IntelligenceChatView.as_view()
        response = view(request)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Inspect provider call args
        call_kwargs = mock_provider.generate_chat_response.call_args[1]
        history_arg = call_kwargs["conversation_history"]
        history_str = json.dumps(history_arg)

        # Forbidden in sanitized conversation history
        self.assertNotIn("Ali", history_str)
        self.assertNotIn("ali@example.com", history_str)
        self.assertIn("Hello there", history_str)

