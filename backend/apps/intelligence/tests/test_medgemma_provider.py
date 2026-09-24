"""
OvaSense — MedGemma Provider Automated Test Suite.

Validates MedGemma local inference provider, error handling,
zero silent fallback, and privacy-preserving context minimization.
"""

import json
import os
import unittest
from unittest.mock import MagicMock, patch

from django.test import TestCase

from apps.intelligence.services.llm_provider import (
    LLMProviderError,
    LLMResponse,
    MedGemmaProvider,
    OfflineDeterministicProvider,
    get_llm_provider,
)
from apps.intelligence.services.health_context_builder import HealthContextBuilder


class MedGemmaProviderTests(TestCase):
    """Test suite for MedGemmaProvider and local inference semantics."""

    def setUp(self):
        self.provider = MedGemmaProvider(
            base_url="http://127.0.0.1:11434/v1",
            model_name="medgemma:4b",
            api_key="local-key",
            timeout=5,
        )

    def test_default_initialization(self):
        self.assertEqual(self.provider.base_url, "http://127.0.0.1:11434/v1")
        self.assertEqual(self.provider.model_name, "medgemma:4b")
        self.assertEqual(self.provider.api_key, "local-key")

    @patch("urllib.request.urlopen")
    def test_successful_inference_json_response(self, mock_urlopen):
        mock_resp_data = {
            "choices": [
                {
                    "message": {
                        "content": json.dumps({
                            "answer": "Your follicular phase estrogen transition is proceeding normally.",
                            "confidence": "high",
                            "used_context": ["digital_twin", "cycle"],
                            "needs_clinician": False,
                            "safety_level": "normal",
                        })
                    }
                }
            ]
        }
        mock_resp = MagicMock()
        mock_resp.read.return_value = json.dumps(mock_resp_data).encode("utf-8")
        mock_resp.__enter__.return_value = mock_resp
        mock_urlopen.return_value = mock_resp

        resp = self.provider.generate_chat_response(
            system_instruction="You are OvaSense AI",
            user_message="Explain my phase",
            health_context="Cycle Day 10",
        )

        self.assertIsInstance(resp, LLMResponse)
        self.assertIn("follicular phase estrogen", resp.answer)
        self.assertEqual(resp.confidence, "high")
        self.assertEqual(resp.model_name, "medgemma:4b")
        self.assertIn("digital_twin", resp.used_context)

    @patch("urllib.request.urlopen")
    def test_inference_markdown_wrapped_json_parsing(self, mock_urlopen):
        wrapped_json = (
            "```json\n"
            "{\n"
            '  "answer": "Vitamin D is important for insulin receptor sensitivity.",\n'
            '  "confidence": "high",\n'
            '  "used_context": ["reports"],\n'
            '  "needs_clinician": false,\n'
            '  "safety_level": "normal"\n'
            "}\n"
            "```"
        )
        mock_resp_data = {"choices": [{"message": {"content": wrapped_json}}]}
        mock_resp = MagicMock()
        mock_resp.read.return_value = json.dumps(mock_resp_data).encode("utf-8")
        mock_resp.__enter__.return_value = mock_resp
        mock_urlopen.return_value = mock_resp

        resp = self.provider.generate_chat_response("sys", "Vitamin D?", "ctx")
        self.assertEqual(resp.answer, "Vitamin D is important for insulin receptor sensitivity.")
        self.assertEqual(resp.confidence, "high")

    @patch("urllib.request.urlopen")
    def test_unreachable_server_raises_provider_error(self, mock_urlopen):
        import urllib.error
        mock_urlopen.side_effect = urllib.error.URLError("Connection refused")

        with self.assertRaises(LLMProviderError) as ctx:
            self.provider.generate_chat_response("sys", "Hello", "ctx")

        self.assertIn("unreachable", str(ctx.exception).lower())

    def test_factory_defaults_to_medgemma(self):
        prev = os.environ.get("LLM_PROVIDER")
        try:
            os.environ["LLM_PROVIDER"] = "medgemma"
            provider = get_llm_provider()
            self.assertIsInstance(provider, MedGemmaProvider)
            self.assertEqual(provider.model_name, "medgemma:4b")
        finally:
            if prev is not None:
                os.environ["LLM_PROVIDER"] = prev
            else:
                os.environ.pop("LLM_PROVIDER", None)

    def test_factory_offline_deterministic_restricted_to_explicit_setting(self):
        prev = os.environ.get("LLM_PROVIDER")
        try:
            os.environ["LLM_PROVIDER"] = "offline"
            provider = get_llm_provider()
            self.assertIsInstance(provider, OfflineDeterministicProvider)
        finally:
            if prev is not None:
                os.environ["LLM_PROVIDER"] = prev
            else:
                os.environ.pop("LLM_PROVIDER", None)

    def test_context_builder_privacy_no_exact_dob_or_uuid(self):
        """Validates that context builder computes age and omits raw DOB, UUIDs, and tokens."""
        with patch("apps.health.services.supabase_health_service.health_service.fetch_all") as mock_fetch:
            mock_data = MagicMock()
            mock_data.profile.date_of_birth = "1998-05-15"
            mock_data.profile.height_cm = 165
            mock_data.profile.weight_kg = 68
            mock_data.profile.period_regularity = "Regular"
            mock_data.profile.sleep_hours = 7.5
            mock_data.cycle_records = []
            mock_data.symptom_records = []
            mock_data.food_logs = []
            mock_data.water_logs = []
            mock_data.medications = []
            mock_data.report_results = []
            mock_fetch.return_value = mock_data

            sys_prompt, ctx, used = HealthContextBuilder.build_context(
                patient_uuid="secret-user-uuid-12345",
                user_message="My details",
                auth_token="secret-jwt-token-9999",
            )

            # Assert no sensitive tokens or exact date of birth leak into context
            self.assertNotIn("1998-05-15", ctx)
            self.assertNotIn("secret-user-uuid-12345", ctx)
            self.assertNotIn("secret-jwt-token-9999", ctx)
            # Assert calculated age is present
            self.assertIn("Age: ", ctx)
            self.assertIn("Calculated BMI: 25.0", ctx)
