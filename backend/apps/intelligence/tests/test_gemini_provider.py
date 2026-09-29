"""
backend/apps/intelligence/tests/test_gemini_provider.py

Automated test suite for GeminiProvider and get_llm_provider() Gemini integration.
All tests strictly mock network requests (CI / automated tests never make real Gemini calls).
"""

from __future__ import annotations

import json
import os
import unittest
from unittest.mock import MagicMock, patch
import urllib.error

from django.test import TestCase

from apps.intelligence.services.llm_provider import (
    GeminiProvider,
    LLMProviderError,
    LLMResponse,
    get_llm_provider,
)


class GeminiProviderUnitTests(TestCase):
    """Unit test suite for GeminiProvider and model resolution logic."""

    def setUp(self):
        self.dummy_api_key = "test-secret-gemini-key-12345"
        self.provider = GeminiProvider(
            api_key=self.dummy_api_key,
            model_name="gemini-3.8-flash",
            timeout=5,
            max_retries=2,
        )

    # 1. Model resolution: GEMINI_MODEL takes precedence
    def test_gemini_model_takes_precedence(self):
        with patch.dict(os.environ, {
            "LLM_PROVIDER": "gemini",
            "GEMINI_API_KEY": self.dummy_api_key,
            "GEMINI_MODEL": "gemini-3.8-flash",
            "LLM_MODEL": "gemini-2.5-flash",
        }):
            provider = get_llm_provider()
            self.assertIsInstance(provider, GeminiProvider)
            self.assertEqual(provider.model_name, "gemini-3.8-flash")

    # 2. Model resolution: LLM_MODEL works as secondary override
    def test_llm_model_secondary_override(self):
        env = {
            "LLM_PROVIDER": "gemini",
            "GEMINI_API_KEY": self.dummy_api_key,
            "LLM_MODEL": "custom-override-model",
        }
        # Ensure GEMINI_MODEL is not set
        with patch.dict(os.environ, env, clear=False):
            if "GEMINI_MODEL" in os.environ:
                del os.environ["GEMINI_MODEL"]
            provider = get_llm_provider()
            self.assertIsInstance(provider, GeminiProvider)
            self.assertEqual(provider.model_name, "custom-override-model")

    # 3. Model resolution: default Gemini model is gemini-3.8-flash
    def test_default_gemini_model_is_3_8_flash(self):
        env = {
            "LLM_PROVIDER": "gemini",
            "GEMINI_API_KEY": self.dummy_api_key,
        }
        with patch.dict(os.environ, env, clear=False):
            if "GEMINI_MODEL" in os.environ:
                del os.environ["GEMINI_MODEL"]
            if "LLM_MODEL" in os.environ:
                del os.environ["LLM_MODEL"]
            provider = get_llm_provider()
            self.assertIsInstance(provider, GeminiProvider)
            self.assertEqual(provider.model_name, "gemini-3.8-flash")

    # 4. API key missing raises LLMProviderError
    def test_missing_api_key_raises_error(self):
        with patch.dict(os.environ, {
            "LLM_PROVIDER": "gemini",
        }, clear=False):
            if "GEMINI_API_KEY" in os.environ:
                del os.environ["GEMINI_API_KEY"]
            if "LLM_API_KEY" in os.environ:
                del os.environ["LLM_API_KEY"]
            with self.assertRaises(LLMProviderError) as ctx:
                get_llm_provider()
            self.assertIn("no GEMINI_API_KEY is configured", str(ctx.exception))

    # 5. Plain-text response parsing
    @patch("urllib.request.urlopen")
    def test_plain_text_response_handling(self, mock_urlopen):
        mock_response_data = {
            "candidates": [
                {
                    "content": {
                        "parts": [
                            {"text": "Your fasting glucose biomarker is within expected reference intervals."}
                        ]
                    }
                }
            ]
        }
        mock_resp = MagicMock()
        mock_resp.read.return_value = json.dumps(mock_response_data).encode("utf-8")
        mock_urlopen.return_value.__enter__.return_value = mock_resp

        response = self.provider.generate_chat_response(
            system_instruction="You are BioPulse AI Companion.",
            user_message="What does my lab report say?",
            health_context="Fasting Glucose: 85 mg/dL",
        )

        self.assertIsInstance(response, LLMResponse)
        self.assertEqual(response.answer, "Your fasting glucose biomarker is within expected reference intervals.")
        self.assertEqual(response.confidence, "moderate")
        self.assertEqual(response.safety_level, "normal")
        self.assertEqual(response.model_name, "gemini-3.8-flash")
        self.assertEqual(response.used_context, [])

    # 6. Structured JSON response parsing
    @patch("urllib.request.urlopen")
    def test_structured_json_response_handling(self, mock_urlopen):
        json_payload = {
            "answer": "Your progesterone levels indicate normal luteal phase transition.",
            "confidence": "high",
            "used_context": ["cycle", "reports"],
            "needs_clinician": False,
            "safety_level": "normal",
        }
        mock_response_data = {
            "candidates": [
                {
                    "content": {
                        "parts": [
                            {"text": json.dumps(json_payload)}
                        ]
                    }
                }
            ]
        }
        mock_resp = MagicMock()
        mock_resp.read.return_value = json.dumps(mock_response_data).encode("utf-8")
        mock_urlopen.return_value.__enter__.return_value = mock_resp

        response = self.provider.generate_chat_response(
            system_instruction="You are BioPulse AI Companion.",
            user_message="Explain my progesterone",
            health_context="Progesterone: 12 ng/mL",
        )

        self.assertIsInstance(response, LLMResponse)
        self.assertEqual(response.answer, "Your progesterone levels indicate normal luteal phase transition.")
        self.assertEqual(response.confidence, "high")
        self.assertEqual(response.used_context, ["cycle", "reports"])
        self.assertFalse(response.needs_clinician)
        self.assertEqual(response.safety_level, "normal")
        self.assertEqual(response.model_name, "gemini-3.8-flash")

    # 7. Malformed JSON-like text safely treated as plain text
    @patch("urllib.request.urlopen")
    def test_malformed_json_treated_as_plain_text(self, mock_urlopen):
        # Starts with { and ends with }, but contains invalid JSON syntax
        malformed_text = "{answer: this is not valid JSON, unquoted strings without commas}"
        mock_response_data = {
            "candidates": [
                {
                    "content": {
                        "parts": [
                            {"text": malformed_text}
                        ]
                    }
                }
            ]
        }
        mock_resp = MagicMock()
        mock_resp.read.return_value = json.dumps(mock_response_data).encode("utf-8")
        mock_urlopen.return_value.__enter__.return_value = mock_resp

        # Must not raise json.JSONDecodeError!
        response = self.provider.generate_chat_response(
            system_instruction="Sys",
            user_message="Hello",
            health_context="Ctx",
        )

        self.assertIsInstance(response, LLMResponse)
        self.assertEqual(response.answer, malformed_text)
        self.assertEqual(response.model_name, "gemini-3.8-flash")

    # 8. Markdown code fence wrapped JSON safely parsed
    @patch("urllib.request.urlopen")
    def test_markdown_code_fenced_json(self, mock_urlopen):
        fenced_json = "```json\n{\"answer\": \"Clean answer from code block\", \"confidence\": \"moderate\"}\n```"
        mock_response_data = {
            "candidates": [
                {
                    "content": {
                        "parts": [
                            {"text": fenced_json}
                        ]
                    }
                }
            ]
        }
        mock_resp = MagicMock()
        mock_resp.read.return_value = json.dumps(mock_response_data).encode("utf-8")
        mock_urlopen.return_value.__enter__.return_value = mock_resp

        response = self.provider.generate_chat_response(
            system_instruction="Sys",
            user_message="Hello",
            health_context="Ctx",
        )

        self.assertEqual(response.answer, "Clean answer from code block")
        self.assertEqual(response.confidence, "moderate")

    # 9 & 10. Conversation history mapping and correct user/model roles
    @patch("urllib.request.urlopen")
    def test_conversation_history_mapping_roles(self, mock_urlopen):
        mock_response_data = {
            "candidates": [{"content": {"parts": [{"text": "Understood."}]}}]
        }
        mock_resp = MagicMock()
        mock_resp.read.return_value = json.dumps(mock_response_data).encode("utf-8")
        mock_urlopen.return_value.__enter__.return_value = mock_resp

        history = [
            {"sender": "user", "text": "What is my LH level?"},
            {"sender": "companion", "text": "Your LH level was 6.2 IU/L."},
            {"sender": "user", "text": "Is that normal?"},
        ]

        self.provider.generate_chat_response(
            system_instruction="Sys",
            user_message="What about FSH?",
            health_context="LH: 6.2, FSH: 5.1",
            conversation_history=history,
        )

        # Inspect sent payload in urllib.request.Request
        called_req = mock_urlopen.call_args[0][0]
        sent_body = json.loads(called_req.data.decode("utf-8"))
        contents = sent_body.get("contents", [])

        # History should have 3 items + 1 current prompt item = 4 contents items
        self.assertEqual(len(contents), 4)
        self.assertEqual(contents[0]["role"], "user")
        self.assertEqual(contents[0]["parts"][0]["text"], "What is my LH level?")
        self.assertEqual(contents[1]["role"], "model")
        self.assertEqual(contents[1]["parts"][0]["text"], "Your LH level was 6.2 IU/L.")
        self.assertEqual(contents[2]["role"], "user")
        self.assertEqual(contents[2]["parts"][0]["text"], "Is that normal?")
        self.assertEqual(contents[3]["role"], "user")
        self.assertIn("What about FSH?", contents[3]["parts"][0]["text"])

    # 11. Model name returned correctly
    @patch("urllib.request.urlopen")
    def test_model_name_reported_accurately(self, mock_urlopen):
        mock_response_data = {
            "candidates": [{"content": {"parts": [{"text": "Affirmative."}]}}]
        }
        mock_resp = MagicMock()
        mock_resp.read.return_value = json.dumps(mock_response_data).encode("utf-8")
        mock_urlopen.return_value.__enter__.return_value = mock_resp

        provider = GeminiProvider(api_key="k", model_name="gemini-3.8-flash")
        resp = provider.generate_chat_response("sys", "user", "ctx")
        self.assertEqual(resp.model_name, "gemini-3.8-flash")

    # 12. 503 retry behavior (transient error succeeded on retry)
    @patch("time.sleep")
    @patch("urllib.request.urlopen")
    def test_503_retry_and_eventual_success(self, mock_urlopen, mock_sleep):
        # Attempt 1: 503 error; Attempt 2: 200 OK
        err_503 = urllib.error.HTTPError(
            url="https://generativelanguage.googleapis.com",
            code=503,
            msg="Service Unavailable",
            hdrs={},
            fp=None,
        )
        mock_success = MagicMock()
        mock_success.__enter__.return_value = mock_success
        mock_success.read.return_value = json.dumps({
            "candidates": [{"content": {"parts": [{"text": "Recovered after high demand."}]}}]
        }).encode("utf-8")

        mock_urlopen.side_effect = [err_503, mock_success]

        response = self.provider.generate_chat_response("sys", "Hello", "ctx")
        self.assertEqual(response.answer, "Recovered after high demand.")
        self.assertEqual(mock_urlopen.call_count, 2)
        mock_sleep.assert_called_once()

    # 13. 429 retry behavior (rate limit transient retry)
    @patch("time.sleep")
    @patch("urllib.request.urlopen")
    def test_429_retry_and_eventual_success(self, mock_urlopen, mock_sleep):
        err_429 = urllib.error.HTTPError(
            url="https://generativelanguage.googleapis.com",
            code=429,
            msg="Too Many Requests",
            hdrs={},
            fp=None,
        )
        mock_success = MagicMock()
        mock_success.__enter__.return_value = mock_success
        mock_success.read.return_value = json.dumps({
            "candidates": [{"content": {"parts": [{"text": "Rate limit cleared."}]}}]
        }).encode("utf-8")

        mock_urlopen.side_effect = [err_429, mock_success]

        response = self.provider.generate_chat_response("sys", "Hello", "ctx")
        self.assertEqual(response.answer, "Rate limit cleared.")
        self.assertEqual(mock_urlopen.call_count, 2)

    # 14. 401 is not retried (fails immediately on first attempt)
    @patch("urllib.request.urlopen")
    def test_401_fails_immediately_no_retry(self, mock_urlopen):
        err_401 = urllib.error.HTTPError(
            url="https://generativelanguage.googleapis.com",
            code=401,
            msg="Unauthorized",
            hdrs={},
            fp=None,
        )
        mock_urlopen.side_effect = err_401

        with self.assertRaises(LLMProviderError) as ctx:
            self.provider.generate_chat_response("sys", "Hello", "ctx")

        self.assertIn("401", str(ctx.exception))
        # Should be called exactly once, no retries
        self.assertEqual(mock_urlopen.call_count, 1)

    # 15. 403 is not retried (fails immediately on first attempt)
    @patch("urllib.request.urlopen")
    def test_403_fails_immediately_no_retry(self, mock_urlopen):
        err_403 = urllib.error.HTTPError(
            url="https://generativelanguage.googleapis.com",
            code=403,
            msg="Forbidden",
            hdrs={},
            fp=None,
        )
        mock_urlopen.side_effect = err_403

        with self.assertRaises(LLMProviderError) as ctx:
            self.provider.generate_chat_response("sys", "Hello", "ctx")

        self.assertIn("403", str(ctx.exception))
        self.assertEqual(mock_urlopen.call_count, 1)

    # 16. 404 is not retried (fails immediately on first attempt)
    @patch("urllib.request.urlopen")
    def test_404_fails_immediately_no_retry(self, mock_urlopen):
        err_404 = urllib.error.HTTPError(
            url="https://generativelanguage.googleapis.com",
            code=404,
            msg="Not Found",
            hdrs={},
            fp=None,
        )
        mock_urlopen.side_effect = err_404

        with self.assertRaises(LLMProviderError) as ctx:
            self.provider.generate_chat_response("sys", "Hello", "ctx")

        self.assertIn("404", str(ctx.exception))
        self.assertEqual(mock_urlopen.call_count, 1)

    # 17. Retry exhaustion raises controlled error
    @patch("time.sleep")
    @patch("urllib.request.urlopen")
    def test_retry_exhaustion_raises_llm_provider_error(self, mock_urlopen, mock_sleep):
        err_503 = urllib.error.HTTPError(
            url="https://generativelanguage.googleapis.com",
            code=503,
            msg="Service Unavailable",
            hdrs={},
            fp=None,
        )
        # 1 initial + 2 retries = 3 attempts total
        mock_urlopen.side_effect = [err_503, err_503, err_503]

        with self.assertRaises(LLMProviderError) as ctx:
            self.provider.generate_chat_response("sys", "Hello", "ctx")

        self.assertIn("503", str(ctx.exception))
        self.assertEqual(mock_urlopen.call_count, 3)
        self.assertEqual(mock_sleep.call_count, 2)

    # 18. API key never appears in raised/logged errors
    @patch("urllib.request.urlopen")
    def test_api_key_never_appears_in_exception(self, mock_urlopen):
        secret_key = "very-secret-gemini-token-xyz999"
        leaky_body = f'{{"error": {{"message": "Invalid call with key {secret_key}"}}}}'
        mock_fp = MagicMock()
        mock_fp.read.return_value = leaky_body.encode("utf-8")

        err = urllib.error.HTTPError(
            url=f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key={secret_key}",
            code=400,
            msg="Bad Request",
            hdrs={},
            fp=mock_fp,
        )
        mock_urlopen.side_effect = err

        provider = GeminiProvider(api_key=secret_key, max_retries=0)
        with self.assertRaises(LLMProviderError) as ctx:
            provider.generate_chat_response("sys", "Hello", "ctx")

        err_str = str(ctx.exception)
        self.assertNotIn(secret_key, err_str)
        self.assertIn("[REDACTED]", err_str)

    # 19. Fallback: primary success -> fallback never called
    @patch("urllib.request.urlopen")
    def test_primary_success_fallback_never_called(self, mock_urlopen):
        provider = GeminiProvider(
            api_key=self.dummy_api_key,
            model_name="gemini-3.8-flash",
            fallback_model="gemini-2.5-flash",
            max_retries=1,
        )
        mock_success = MagicMock()
        mock_success.__enter__.return_value = mock_success
        mock_success.read.return_value = json.dumps({
            "candidates": [{"content": {"parts": [{"text": "Primary model answer."}]}}]
        }).encode("utf-8")
        mock_urlopen.return_value = mock_success

        resp = provider.generate_chat_response("sys", "Hello", "ctx")
        self.assertEqual(resp.answer, "Primary model answer.")
        self.assertEqual(resp.model_name, "gemini-3.8-flash")
        # Exactly one request made, directed to primary model
        self.assertEqual(mock_urlopen.call_count, 1)
        called_url = mock_urlopen.call_args[0][0].full_url
        self.assertIn("gemini-3.8-flash", called_url)
        self.assertNotIn("gemini-2.5-flash", called_url)

    # 20. Fallback: primary transient exhaustion -> fallback called and succeeds
    @patch("time.sleep")
    @patch("urllib.request.urlopen")
    def test_primary_transient_exhaustion_fallback_called(self, mock_urlopen, mock_sleep):
        provider = GeminiProvider(
            api_key=self.dummy_api_key,
            model_name="gemini-3.8-flash",
            fallback_model="gemini-2.5-flash",
            max_retries=1,  # 1 initial + 1 retry = 2 attempts for primary
        )
        err_503 = urllib.error.HTTPError(
            url="https://generativelanguage.googleapis.com",
            code=503,
            msg="Service Unavailable",
            hdrs={},
            fp=None,
        )
        mock_fallback_resp = MagicMock()
        mock_fallback_resp.__enter__.return_value = mock_fallback_resp
        mock_fallback_resp.read.return_value = json.dumps({
            "candidates": [{"content": {"parts": [{"text": "Fallback model answer."}]}}]
        }).encode("utf-8")

        # Calls: primary attempt 1 (503), primary attempt 2 (503), fallback attempt 1 (200)
        mock_urlopen.side_effect = [err_503, err_503, mock_fallback_resp]

        resp = provider.generate_chat_response("sys", "Hello", "ctx")
        self.assertEqual(resp.answer, "Fallback model answer.")
        self.assertEqual(resp.model_name, "gemini-2.5-flash")
        self.assertEqual(mock_urlopen.call_count, 3)

        # Verify last call was directed to fallback model
        last_called_url = mock_urlopen.call_args_list[-1][0][0].full_url
        self.assertIn("gemini-2.5-flash", last_called_url)

    # 21. Fallback: primary 401 -> fallback NOT called
    @patch("urllib.request.urlopen")
    def test_primary_401_fallback_not_called(self, mock_urlopen):
        provider = GeminiProvider(
            api_key=self.dummy_api_key,
            model_name="gemini-3.8-flash",
            fallback_model="gemini-2.5-flash",
        )
        err_401 = urllib.error.HTTPError(
            url="https://generativelanguage.googleapis.com",
            code=401,
            msg="Unauthorized",
            hdrs={},
            fp=None,
        )
        mock_urlopen.side_effect = err_401

        with self.assertRaises(LLMProviderError):
            provider.generate_chat_response("sys", "Hello", "ctx")

        self.assertEqual(mock_urlopen.call_count, 1)

    # 22. Fallback: primary 403 -> fallback NOT called
    @patch("urllib.request.urlopen")
    def test_primary_403_fallback_not_called(self, mock_urlopen):
        provider = GeminiProvider(
            api_key=self.dummy_api_key,
            model_name="gemini-3.8-flash",
            fallback_model="gemini-2.5-flash",
        )
        err_403 = urllib.error.HTTPError(
            url="https://generativelanguage.googleapis.com",
            code=403,
            msg="Forbidden",
            hdrs={},
            fp=None,
        )
        mock_urlopen.side_effect = err_403

        with self.assertRaises(LLMProviderError):
            provider.generate_chat_response("sys", "Hello", "ctx")

        self.assertEqual(mock_urlopen.call_count, 1)

    # 23. Fallback: primary 404 -> fallback NOT called
    @patch("urllib.request.urlopen")
    def test_primary_404_fallback_not_called(self, mock_urlopen):
        provider = GeminiProvider(
            api_key=self.dummy_api_key,
            model_name="gemini-3.8-flash",
            fallback_model="gemini-2.5-flash",
        )
        err_404 = urllib.error.HTTPError(
            url="https://generativelanguage.googleapis.com",
            code=404,
            msg="Not Found",
            hdrs={},
            fp=None,
        )
        mock_urlopen.side_effect = err_404

        with self.assertRaises(LLMProviderError):
            provider.generate_chat_response("sys", "Hello", "ctx")

        self.assertEqual(mock_urlopen.call_count, 1)

    # 24. Fallback: no fallback configured -> existing single-model behavior preserved
    @patch("time.sleep")
    @patch("urllib.request.urlopen")
    def test_no_fallback_configured_preserves_single_model_behavior(self, mock_urlopen, mock_sleep):
        provider = GeminiProvider(
            api_key=self.dummy_api_key,
            model_name="gemini-3.8-flash",
            fallback_model=None,
            max_retries=1,
        )
        err_503 = urllib.error.HTTPError(
            url="https://generativelanguage.googleapis.com",
            code=503,
            msg="Service Unavailable",
            hdrs={},
            fp=None,
        )
        mock_urlopen.side_effect = [err_503, err_503]

        with self.assertRaises(LLMProviderError) as ctx:
            provider.generate_chat_response("sys", "Hello", "ctx")

        self.assertIn("503", str(ctx.exception))
        self.assertEqual(mock_urlopen.call_count, 2)

    # 25. Fallback: both primary and fallback unavailable -> controlled LLMProviderError
    @patch("time.sleep")
    @patch("urllib.request.urlopen")
    def test_both_primary_and_fallback_unavailable_controlled_error(self, mock_urlopen, mock_sleep):
        provider = GeminiProvider(
            api_key=self.dummy_api_key,
            model_name="gemini-3.8-flash",
            fallback_model="gemini-2.5-flash",
            max_retries=1,  # 2 attempts primary
        )
        err_503 = urllib.error.HTTPError(
            url="https://generativelanguage.googleapis.com",
            code=503,
            msg="Service Unavailable",
            hdrs={},
            fp=None,
        )
        # Primary: 2 attempts (503). Fallback: 2 attempts (503). Total = 4 attempts.
        mock_urlopen.side_effect = [err_503, err_503, err_503, err_503]

        with self.assertRaises(LLMProviderError) as ctx:
            provider.generate_chat_response("sys", "Hello", "ctx")

        self.assertIn("503", str(ctx.exception))
        self.assertEqual(mock_urlopen.call_count, 4)

    # 26. Factory function sets fallback_model from GEMINI_FALLBACK_MODEL
    def test_gemini_fallback_model_from_env_in_factory(self):
        with patch.dict(os.environ, {
            "LLM_PROVIDER": "gemini",
            "GEMINI_API_KEY": self.dummy_api_key,
            "GEMINI_MODEL": "gemini-3.8-flash",
            "GEMINI_FALLBACK_MODEL": "gemini-2.5-flash",
        }):
            provider = get_llm_provider()
            self.assertIsInstance(provider, GeminiProvider)
            self.assertEqual(provider.model_name, "gemini-3.8-flash")
            self.assertEqual(provider.fallback_model, "gemini-2.5-flash")

    # 27. Primary model (gemini-3.8-flash) retains thinkingConfig in generationConfig
    @patch("urllib.request.urlopen")
    def test_gemini_3_8_flash_retains_thinking_config(self, mock_urlopen):
        config = self.provider._build_generation_config("gemini-3.8-flash")
        self.assertEqual(config.get("temperature"), 0.2)
        self.assertEqual(config.get("maxOutputTokens"), 1000)
        self.assertIn("thinkingConfig", config)
        self.assertEqual(config["thinkingConfig"].get("thinkingBudget"), 0)

        # Verify sent payload over wire
        mock_success = MagicMock()
        mock_success.__enter__.return_value = mock_success
        mock_success.read.return_value = json.dumps({
            "candidates": [{"content": {"parts": [{"text": "3.8 response"}]}}]
        }).encode("utf-8")
        mock_urlopen.return_value = mock_success

        resp = self.provider.generate_chat_response("sys", "Hello", "ctx")
        self.assertEqual(resp.model_name, "gemini-3.8-flash")
        self.assertEqual(mock_urlopen.call_count, 1)

        sent_body = json.loads(mock_urlopen.call_args[0][0].data.decode("utf-8"))
        self.assertIn("thinkingConfig", sent_body["generationConfig"])
        self.assertEqual(sent_body["generationConfig"]["thinkingConfig"]["thinkingBudget"], 0)

    # 28. Fallback model (gemini-3.5-flash-lite) omits thinkingConfig from generationConfig
    @patch("urllib.request.urlopen")
    def test_gemini_3_5_flash_lite_omits_thinking_config(self, mock_urlopen):
        config = self.provider._build_generation_config("gemini-3.5-flash-lite")
        self.assertEqual(config.get("temperature"), 0.2)
        self.assertEqual(config.get("maxOutputTokens"), 1000)
        self.assertNotIn("thinkingConfig", config)

        # Verify sent payload over wire when gemini-3.5-flash-lite is the called model
        provider_lite = GeminiProvider(
            api_key=self.dummy_api_key,
            model_name="gemini-3.5-flash-lite",
        )
        mock_success = MagicMock()
        mock_success.__enter__.return_value = mock_success
        mock_success.read.return_value = json.dumps({
            "candidates": [{"content": {"parts": [{"text": "3.5-lite response"}]}}]
        }).encode("utf-8")
        mock_urlopen.return_value = mock_success

        resp = provider_lite.generate_chat_response("sys", "Hello", "ctx")
        self.assertEqual(resp.model_name, "gemini-3.5-flash-lite")
        self.assertEqual(mock_urlopen.call_count, 1)

        sent_body = json.loads(mock_urlopen.call_args[0][0].data.decode("utf-8"))
        self.assertNotIn("thinkingConfig", sent_body["generationConfig"])
        self.assertEqual(sent_body["generationConfig"].get("temperature"), 0.2)
        self.assertEqual(sent_body["generationConfig"].get("maxOutputTokens"), 1000)

    # 29. Primary transient exhaustion -> fallback constructed without thinkingConfig & reports model_name
    @patch("time.sleep")
    @patch("urllib.request.urlopen")
    def test_primary_transient_fallback_constructed_without_thinking_config(self, mock_urlopen, mock_sleep):
        provider = GeminiProvider(
            api_key=self.dummy_api_key,
            model_name="gemini-3.8-flash",
            fallback_model="gemini-3.5-flash-lite",
            max_retries=1,  # 2 attempts primary
        )
        err_503 = urllib.error.HTTPError(
            url="https://generativelanguage.googleapis.com",
            code=503,
            msg="Service Unavailable",
            hdrs={},
            fp=None,
        )
        mock_fallback_resp = MagicMock()
        mock_fallback_resp.__enter__.return_value = mock_fallback_resp
        mock_fallback_resp.read.return_value = json.dumps({
            "candidates": [{"content": {"parts": [{"text": "Compatible fallback response without thinkingConfig."}]}}]
        }).encode("utf-8")

        mock_urlopen.side_effect = [err_503, err_503, mock_fallback_resp]

        resp = provider.generate_chat_response("sys", "Hello", "ctx")
        self.assertEqual(resp.answer, "Compatible fallback response without thinkingConfig.")
        self.assertEqual(resp.model_name, "gemini-3.5-flash-lite")
        self.assertEqual(mock_urlopen.call_count, 3)

        # Primary request 1: has thinkingConfig
        primary_body = json.loads(mock_urlopen.call_args_list[0][0][0].data.decode("utf-8"))
        self.assertIn("thinkingConfig", primary_body["generationConfig"])
        self.assertIn("gemini-3.8-flash", mock_urlopen.call_args_list[0][0][0].full_url)

        # Fallback request 3: does NOT have thinkingConfig
        fallback_req = mock_urlopen.call_args_list[2][0][0]
        fallback_body = json.loads(fallback_req.data.decode("utf-8"))
        self.assertNotIn("thinkingConfig", fallback_body["generationConfig"])
        self.assertIn("gemini-3.5-flash-lite", fallback_req.full_url)
        self.assertEqual(fallback_body["generationConfig"].get("temperature"), 0.2)
        self.assertEqual(fallback_body["generationConfig"].get("maxOutputTokens"), 1000)

    # 30. Generic HTTP 400 remains strictly non-retryable and does not strip arbitrary parameters
    @patch("urllib.request.urlopen")
    def test_generic_http_400_remains_non_retryable_no_parameter_stripping(self, mock_urlopen):
        provider = GeminiProvider(
            api_key=self.dummy_api_key,
            model_name="gemini-3.8-flash",
            fallback_model="gemini-3.5-flash-lite",
            max_retries=2,
        )
        generic_400_body = '{"error": {"code": 400, "message": "Request contains an invalid argument."}}'
        mock_fp = MagicMock()
        mock_fp.read.return_value = generic_400_body.encode("utf-8")
        err_400 = urllib.error.HTTPError(
            url="https://generativelanguage.googleapis.com",
            code=400,
            msg="Bad Request",
            hdrs={},
            fp=mock_fp,
        )
        mock_urlopen.side_effect = err_400

        with self.assertRaises(LLMProviderError) as ctx:
            provider.generate_chat_response("sys", "Hello", "ctx")

        # Must fail immediately on attempt 1 without retries or fallback
        self.assertEqual(mock_urlopen.call_count, 1)
        self.assertIn("400", str(ctx.exception))
        self.assertIn("Request contains an invalid argument.", str(ctx.exception))

    # 31. Generic HTTP 400 protects API key from leakage
    @patch("urllib.request.urlopen")
    def test_generic_http_400_protects_api_key(self, mock_urlopen):
        secret_key = "super-confidential-gemini-key-998877"
        leaky_body = f'{{"error": {{"code": 400, "message": "Invalid argument for key {secret_key}"}}}}'
        mock_fp = MagicMock()
        mock_fp.read.return_value = leaky_body.encode("utf-8")
        err_400 = urllib.error.HTTPError(
            url="https://generativelanguage.googleapis.com",
            code=400,
            msg="Bad Request",
            hdrs={},
            fp=mock_fp,
        )
        mock_urlopen.side_effect = err_400

        provider = GeminiProvider(api_key=secret_key, max_retries=1)
        with self.assertRaises(LLMProviderError) as ctx:
            provider.generate_chat_response("sys", "Hello", "ctx")

        self.assertEqual(mock_urlopen.call_count, 1)
        err_msg = str(ctx.exception)
        self.assertNotIn(secret_key, err_msg)
        self.assertIn("[REDACTED]", err_msg)

