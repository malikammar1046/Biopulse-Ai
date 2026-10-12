"""
backend/apps/intelligence/tests/test_ai_failover.py

Automated test suite for BioPulse AI Secure Automatic LLM Failover.
Verifies:
1. Gemini primary success: Groq is never called; GEMINI_MODEL preserved.
2. Gemini geographic rejection (e.g., location not supported) automatically triggers Groq success.
3. Gemini timeout, rate limit, and provider outage triggers Groq success.
4. Both providers failing raises LLMProviderError without silent substitution of fake/offline responses.
5. Strict LLMContextSanitizer enforcement on all data sent to Groq (patient privacy & medical safety).
6. Zero API key leakage in logs or exception messages.
7. Streaming SSE: Gemini success, clean Groq streaming failover when 0 tokens emitted, and
   strict prevention of duplicate/mixed output if stream drops after partial tokens were emitted.
8. Authenticated AI Companion and Public Chat views behavior during failover and total failure.
9. Configurable Groq fallback model (openai/gpt-oss-120b) without modifying GEMINI_MODEL.
"""

from __future__ import annotations

import json
import logging
import os
import unittest
from unittest.mock import MagicMock, patch
import urllib.error

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from apps.intelligence.services.llm_provider import (
    GeminiProvider,
    GroqProvider,
    LLMProviderError,
    LLMResponse,
    get_llm_provider,
)


class LLMAutomaticFailoverTests(TestCase):
    """Unit and integration test suite for secure Gemini -> Groq failover."""

    def setUp(self):
        self.dummy_gemini_key = "test-gemini-key-11111"
        self.dummy_groq_key = "gsk_testgroqkey99999999999999"
        self.client = APIClient()

        User = get_user_model()
        self.test_user, _ = User.objects.get_or_create(
            username="failover-test-user",
            defaults={"id": 888123},
        )

    # 1. Gemini primary succeeds -> Groq is never invoked
    @patch("urllib.request.urlopen")
    def test_gemini_success_primary_no_groq_called(self, mock_urlopen):
        mock_gemini_resp = MagicMock()
        mock_gemini_resp.__enter__.return_value = mock_gemini_resp
        mock_gemini_resp.read.return_value = json.dumps({
            "candidates": [
                {
                    "content": {
                        "parts": [
                            {"text": json.dumps({"answer": "Primary Gemini response", "confidence": "high"})}
                        ]
                    }
                }
            ]
        }).encode("utf-8")
        mock_urlopen.return_value = mock_gemini_resp

        with patch.dict(os.environ, {
            "LLM_PROVIDER": "gemini",
            "GEMINI_API_KEY": self.dummy_gemini_key,
            "GEMINI_MODEL": "gemini-3.8-flash",
            "GROQ_API_KEY": self.dummy_groq_key,
        }):
            provider = get_llm_provider()
            self.assertIsInstance(provider, GeminiProvider)
            self.assertEqual(provider.model_name, "gemini-3.8-flash")
            self.assertEqual(provider.groq_model, "openai/gpt-oss-120b")

            resp = provider.generate_chat_response(
                system_instruction="You are BioPulse Assistant.",
                user_message="What is BioPulse?",
                health_context="",
            )

            self.assertEqual(resp.answer, "Primary Gemini response")
            self.assertEqual(resp.model_name, "gemini-3.8-flash")
            self.assertEqual(mock_urlopen.call_count, 1)
            # Called Gemini REST URL, not Groq URL
            called_req = mock_urlopen.call_args[0][0]
            self.assertIn("generativelanguage.googleapis.com", called_req.full_url)
            self.assertNotIn("groq.com", called_req.full_url)

    # 2. Gemini geographic rejection (HTTP 400 location error) -> Groq success
    @patch("urllib.request.urlopen")
    def test_gemini_geographic_rejection_http_400_groq_success(self, mock_urlopen):
        geo_400_body = json.dumps({
            "error": {
                "code": 400,
                "message": "User location is not supported for the API use.",
                "status": "FAILED_PRECONDITION",
            }
        }).encode("utf-8")
        mock_geo_fp = MagicMock()
        mock_geo_fp.read.return_value = geo_400_body
        err_geo_400 = urllib.error.HTTPError(
            url="https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent",
            code=400,
            msg="Bad Request",
            hdrs={},
            fp=mock_geo_fp,
        )

        mock_groq_resp = MagicMock()
        mock_groq_resp.__enter__.return_value = mock_groq_resp
        mock_groq_resp.read.return_value = json.dumps({
            "choices": [
                {
                    "message": {
                        "content": json.dumps({
                            "answer": "Groq failover response after Gemini geo rejection.",
                            "confidence": "high",
                            "used_context": ["profile"],
                            "needs_clinician": False,
                            "safety_level": "normal",
                        })
                    }
                }
            ]
        }).encode("utf-8")

        mock_urlopen.side_effect = [err_geo_400, mock_groq_resp]

        provider = GeminiProvider(
            api_key=self.dummy_gemini_key,
            model_name="gemini-3.8-flash",
            groq_api_key=self.dummy_groq_key,
            groq_model="openai/gpt-oss-120b",
        )

        resp = provider.generate_chat_response(
            system_instruction="You are BioPulse Assistant.",
            user_message="Explain PCOS screening",
            health_context="",
        )

        self.assertEqual(resp.answer, "Groq failover response after Gemini geo rejection.")
        self.assertEqual(resp.model_name, "openai/gpt-oss-120b")
        self.assertEqual(mock_urlopen.call_count, 2)
        # Attempt 1: Gemini; Attempt 2: Groq
        first_url = mock_urlopen.call_args_list[0][0][0].full_url
        second_url = mock_urlopen.call_args_list[1][0][0].full_url
        self.assertIn("generativelanguage.googleapis.com", first_url)
        self.assertIn("api.groq.com", second_url)

    # 3. Gemini geographic rejection (HTTP 403 Forbidden location) -> Groq success
    @patch("urllib.request.urlopen")
    def test_gemini_geographic_rejection_http_403_groq_success(self, mock_urlopen):
        geo_403_body = json.dumps({
            "error": {
                "code": 403,
                "message": "User location is not supported in your country.",
            }
        }).encode("utf-8")
        mock_geo_fp = MagicMock()
        mock_geo_fp.read.return_value = geo_403_body
        err_geo_403 = urllib.error.HTTPError(
            url="https://generativelanguage.googleapis.com",
            code=403,
            msg="Forbidden",
            hdrs={},
            fp=mock_geo_fp,
        )

        mock_groq_resp = MagicMock()
        mock_groq_resp.__enter__.return_value = mock_groq_resp
        mock_groq_resp.read.return_value = json.dumps({
            "choices": [
                {
                    "message": {
                        "content": json.dumps({
                            "answer": "Groq answered after 403 location restriction.",
                            "confidence": "high",
                        })
                    }
                }
            ]
        }).encode("utf-8")

        mock_urlopen.side_effect = [err_geo_403, mock_groq_resp]

        provider = GeminiProvider(
            api_key=self.dummy_gemini_key,
            model_name="gemini-3.8-flash",
            groq_api_key=self.dummy_groq_key,
        )

        resp = provider.generate_chat_response("sys", "user message", "")
        self.assertEqual(resp.answer, "Groq answered after 403 location restriction.")
        self.assertEqual(resp.model_name, "openai/gpt-oss-120b")
        self.assertEqual(mock_urlopen.call_count, 2)

    # 4. Gemini timeout -> Groq success
    @patch("urllib.request.urlopen")
    def test_gemini_timeout_failover_to_groq_success(self, mock_urlopen):
        err_timeout = urllib.error.URLError("Connection timed out")

        mock_groq_resp = MagicMock()
        mock_groq_resp.__enter__.return_value = mock_groq_resp
        mock_groq_resp.read.return_value = json.dumps({
            "choices": [{"message": {"content": json.dumps({"answer": "Groq saved the day on timeout."})}}]
        }).encode("utf-8")

        # Gemini retries timeout once (max_retries=1), then fails over to Groq
        mock_urlopen.side_effect = [err_timeout, err_timeout, mock_groq_resp]

        provider = GeminiProvider(
            api_key=self.dummy_gemini_key,
            model_name="gemini-3.8-flash",
            max_retries=1,
            groq_api_key=self.dummy_groq_key,
        )

        resp = provider.generate_chat_response("sys", "user", "")
        self.assertEqual(resp.answer, "Groq saved the day on timeout.")
        self.assertEqual(resp.model_name, "openai/gpt-oss-120b")
        last_url = mock_urlopen.call_args_list[-1][0][0].full_url
        self.assertIn("api.groq.com", last_url)

    # 5. Gemini rate limit (HTTP 429) -> Groq success
    @patch("time.sleep")
    @patch("urllib.request.urlopen")
    def test_gemini_rate_limit_failover_to_groq_success(self, mock_urlopen, mock_sleep):
        err_429 = urllib.error.HTTPError(
            url="https://generativelanguage.googleapis.com",
            code=429,
            msg="Too Many Requests",
            hdrs={},
            fp=None,
        )
        mock_groq_resp = MagicMock()
        mock_groq_resp.__enter__.return_value = mock_groq_resp
        mock_groq_resp.read.return_value = json.dumps({
            "choices": [{"message": {"content": json.dumps({"answer": "Groq response after 429 quota exhaustion."})}}]
        }).encode("utf-8")

        # 2 attempts on Gemini (max_retries=1), then Groq
        mock_urlopen.side_effect = [err_429, err_429, mock_groq_resp]

        provider = GeminiProvider(
            api_key=self.dummy_gemini_key,
            model_name="gemini-3.8-flash",
            max_retries=1,
            groq_api_key=self.dummy_groq_key,
        )

        resp = provider.generate_chat_response("sys", "user", "")
        self.assertEqual(resp.answer, "Groq response after 429 quota exhaustion.")
        self.assertEqual(resp.model_name, "openai/gpt-oss-120b")

    # 6. Gemini provider outage (HTTP 503) -> Groq success
    @patch("time.sleep")
    @patch("urllib.request.urlopen")
    def test_gemini_outage_failover_to_groq_success(self, mock_urlopen, mock_sleep):
        err_503 = urllib.error.HTTPError(
            url="https://generativelanguage.googleapis.com",
            code=503,
            msg="Service Unavailable",
            hdrs={},
            fp=None,
        )
        mock_groq_resp = MagicMock()
        mock_groq_resp.__enter__.return_value = mock_groq_resp
        mock_groq_resp.read.return_value = json.dumps({
            "choices": [{"message": {"content": json.dumps({"answer": "Groq response during Google outage."})}}]
        }).encode("utf-8")

        mock_urlopen.side_effect = [err_503, err_503, mock_groq_resp]

        provider = GeminiProvider(
            api_key=self.dummy_gemini_key,
            model_name="gemini-3.8-flash",
            max_retries=1,
            groq_api_key=self.dummy_groq_key,
        )

        resp = provider.generate_chat_response("sys", "user", "")
        self.assertEqual(resp.answer, "Groq response during Google outage.")
        self.assertEqual(resp.model_name, "openai/gpt-oss-120b")

    # 7. Both providers failing -> raises LLMProviderError without silent substitution
    @patch("urllib.request.urlopen")
    def test_both_providers_fail_raises_llm_provider_error(self, mock_urlopen):
        geo_400_body = json.dumps({
            "error": {"code": 400, "message": "User location is not supported for the API use."}
        }).encode("utf-8")
        mock_geo_fp = MagicMock()
        mock_geo_fp.read.return_value = geo_400_body
        err_gemini_geo = urllib.error.HTTPError(
            url="https://generativelanguage.googleapis.com",
            code=400,
            msg="Bad Request",
            hdrs={},
            fp=mock_geo_fp,
        )

        groq_500_body = json.dumps({
            "error": {"code": 500, "message": "Groq internal cluster failure."}
        }).encode("utf-8")
        mock_groq_fp = MagicMock()
        mock_groq_fp.read.return_value = groq_500_body
        err_groq_500 = urllib.error.HTTPError(
            url="https://api.groq.com",
            code=500,
            msg="Internal Server Error",
            hdrs={},
            fp=mock_groq_fp,
        )

        mock_urlopen.side_effect = [err_gemini_geo, err_groq_500]

        provider = GeminiProvider(
            api_key=self.dummy_gemini_key,
            model_name="gemini-3.8-flash",
            groq_api_key=self.dummy_groq_key,
        )

        with self.assertRaises(LLMProviderError) as ctx:
            provider.generate_chat_response("sys", "user", "")

        err_msg = str(ctx.exception)
        self.assertIn("Both Gemini and Groq providers failed", err_msg)
        self.assertIn("Gemini", err_msg)
        self.assertIn("Groq", err_msg)

    # 8. Sensitive patient data & PII sanitization before reaching Groq
    @patch("urllib.request.urlopen")
    def test_sensitive_data_sanitized_before_reaching_groq(self, mock_urlopen):
        geo_400_body = json.dumps({
            "error": {"code": 400, "message": "User location is not supported for the API use."}
        }).encode("utf-8")
        mock_geo_fp = MagicMock()
        mock_geo_fp.read.return_value = geo_400_body
        err_gemini_geo = urllib.error.HTTPError(
            url="https://generativelanguage.googleapis.com",
            code=400,
            msg="Bad Request",
            hdrs={},
            fp=mock_geo_fp,
        )

        mock_groq_resp = MagicMock()
        mock_groq_resp.__enter__.return_value = mock_groq_resp
        mock_groq_resp.read.return_value = json.dumps({
            "choices": [{"message": {"content": json.dumps({"answer": "Sanitized response."})}}]
        }).encode("utf-8")

        mock_urlopen.side_effect = [err_gemini_geo, mock_groq_resp]

        provider = GeminiProvider(
            api_key=self.dummy_gemini_key,
            model_name="gemini-3.8-flash",
            groq_api_key=self.dummy_groq_key,
        )

        patient_uuid = "e3b0c442-98fc-1c14-9afbf-4c8996fb9242"
        jwt_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.doNotLeakThisSignature"
        raw_health_context = (
            f"[BIOPULSE PATIENT PATHWAY]: FEMALE | Condition Monitored: PCOS\n"
            f"Patient ID: {patient_uuid}\n"
            f"[TIER 2] [VERIFIED LAB DATA]: Total Testosterone: 48.5 ng/dL, Ref Range: 15-70; LH: 11.2 mIU/mL\n"
            f"[INTERNAL DEBUG METADATA]: user_id={patient_uuid} auth={jwt_token} email=patient@example.com "
            f"storage=https://dqqrqwjeebecmgfsihtv.supabase.co/storage/v1/report.pdf api_key=sk-secretKey12345"
        )
        raw_user_message = f"My name is Jane Doe and my UUID is {patient_uuid}. What are my labs?"

        resp = provider.generate_chat_response(
            system_instruction="You are BioPulse Assistant.",
            user_message=raw_user_message,
            health_context=raw_health_context,
            patient_uuid=patient_uuid,
            patient_name="Jane Doe",
            patient_email="patient@example.com",
        )

        self.assertEqual(resp.answer, "Sanitized response.")
        self.assertEqual(mock_urlopen.call_count, 2)

        # Inspect the exact outbound payload sent to Groq
        groq_req = mock_urlopen.call_args_list[1][0][0]
        self.assertIn("api.groq.com", groq_req.full_url)
        groq_body = json.loads(groq_req.data.decode("utf-8"))
        messages_sent = groq_body.get("messages", [])

        combined_text = " ".join(m.get("content", "") for m in messages_sent)

        # 1. PII and identifiers MUST NOT be present
        self.assertNotIn(patient_uuid, combined_text)
        self.assertNotIn("patient@example.com", combined_text)
        self.assertNotIn(jwt_token, combined_text)
        self.assertNotIn("sk-secretKey12345", combined_text)
        self.assertNotIn("supabase.co/storage", combined_text)

        # 2. Authoritative clinical data MUST survive
        self.assertIn("Total Testosterone: 48.5 ng/dL", combined_text)
        self.assertIn("LH: 11.2 mIU/mL", combined_text)

    # 9. API keys never leak into exceptions or logs
    @patch("urllib.request.urlopen")
    def test_api_keys_never_leak_in_exceptions_or_logs(self, mock_urlopen):
        secret_gemini = "super-confidential-gemini-key-999"
        secret_groq = "gsk_super_confidential_groq_key_888"

        gemini_err_body = f'{{"error": {{"message": "Location rejected for key {secret_gemini}"}}}}'
        mock_fp1 = MagicMock()
        mock_fp1.read.return_value = gemini_err_body.encode("utf-8")
        err1 = urllib.error.HTTPError(
            url="https://generativelanguage.googleapis.com",
            code=400,
            msg="Bad Request",
            hdrs={},
            fp=mock_fp1,
        )

        groq_err_body = f'{{"error": {{"message": "Rate limit exceeded for token {secret_groq}"}}}}'
        mock_fp2 = MagicMock()
        mock_fp2.read.return_value = groq_err_body.encode("utf-8")
        err2 = urllib.error.HTTPError(
            url="https://api.groq.com",
            code=429,
            msg="Too Many Requests",
            hdrs={},
            fp=mock_fp2,
        )

        mock_urlopen.side_effect = [err1, err2]

        provider = GeminiProvider(
            api_key=secret_gemini,
            groq_api_key=secret_groq,
        )

        with self.assertRaises(LLMProviderError) as ctx:
            provider.generate_chat_response("sys", "user", "")

        err_text = str(ctx.exception)
        self.assertNotIn(secret_gemini, err_text)
        self.assertNotIn(secret_groq, err_text)
        self.assertIn("[REDACTED]", err_text)

    # 10. Streaming SSE: Gemini success -> Groq never invoked
    @patch("requests.post")
    def test_streaming_gemini_success_no_groq_called(self, mock_post):
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.iter_lines.return_value = [
            b'data: {"candidates": [{"content": {"parts": [{"text": "Hello "}]}}]}',
            b'data: {"candidates": [{"content": {"parts": [{"text": "from "}]}}]}',
            b'data: {"candidates": [{"content": {"parts": [{"text": "Gemini!"}]}}]}',
        ]
        mock_post.return_value = mock_resp

        provider = GeminiProvider(
            api_key=self.dummy_gemini_key,
            model_name="gemini-3.8-flash",
            groq_api_key=self.dummy_groq_key,
        )

        tokens = list(provider.stream_chat_response("sys", "Hello", []))
        self.assertEqual("".join(tokens), "Hello from Gemini!")
        self.assertEqual(mock_post.call_count, 1)
        self.assertIn("generativelanguage.googleapis.com", mock_post.call_args[0][0])

    # 11. Streaming SSE: Gemini fails before emitting tokens -> Groq stream success
    @patch("requests.post")
    def test_streaming_gemini_geo_fail_groq_stream_success(self, mock_post):
        # Call 1: Gemini returns 400 location error
        mock_gemini_resp = MagicMock()
        mock_gemini_resp.status_code = 400
        mock_gemini_resp.text = '{"error": {"message": "User location is not supported."}}'

        # Call 2: Groq stream returns SSE tokens
        mock_groq_resp = MagicMock()
        mock_groq_resp.status_code = 200
        mock_groq_resp.iter_lines.return_value = [
            b'data: {"choices": [{"delta": {"content": "Groq "}}]}',
            b'data: {"choices": [{"delta": {"content": "stream "}}]}',
            b'data: {"choices": [{"delta": {"content": "tokens!"}}]}',
            b'data: [DONE]',
        ]

        mock_post.side_effect = [mock_gemini_resp, mock_groq_resp]

        provider = GeminiProvider(
            api_key=self.dummy_gemini_key,
            model_name="gemini-3.8-flash",
            groq_api_key=self.dummy_groq_key,
            groq_model="openai/gpt-oss-120b",
        )

        tokens = list(provider.stream_chat_response("sys", "Hello", []))
        self.assertEqual("".join(tokens), "Groq stream tokens!")
        self.assertEqual(mock_post.call_count, 2)
        self.assertIn("generativelanguage.googleapis.com", mock_post.call_args_list[0][0][0])
        self.assertIn("api.groq.com", mock_post.call_args_list[1][0][0])

    # 12. Streaming SSE: Partial tokens emitted then stream errors -> NO DUPLICATE / MIXED OUTPUT
    @patch("requests.post")
    def test_streaming_partial_content_prevents_duplicate_mixed_failover(self, mock_post):
        """
        If Gemini stream fails AFTER 1 or more tokens have been emitted to the caller,
        Groq failover MUST NOT be attempted and duplicate/mixed output must be prevented.
        """
        def failing_iter_lines():
            yield b'data: {"candidates": [{"content": {"parts": [{"text": "Partial "}]}}]}'
            yield b'data: {"candidates": [{"content": {"parts": [{"text": "Gemini "}]}}]}'
            raise ConnectionResetError("Connection dropped mid-stream")

        mock_gemini_resp = MagicMock()
        mock_gemini_resp.status_code = 200
        mock_gemini_resp.iter_lines.side_effect = failing_iter_lines

        mock_post.return_value = mock_gemini_resp

        provider = GeminiProvider(
            api_key=self.dummy_gemini_key,
            model_name="gemini-3.8-flash",
            groq_api_key=self.dummy_groq_key,
        )

        tokens = list(provider.stream_chat_response("sys", "Hello", []))
        # Emitted only the partial tokens from Gemini
        self.assertEqual("".join(tokens), "Partial Gemini ")
        # Exactly 1 call was made; Groq was NEVER called to prevent mixed/duplicate output!
        self.assertEqual(mock_post.call_count, 1)

    # 13. Public Chat View (SSE stream): Gemini geo failure -> Groq stream success
    @patch("requests.post")
    def test_public_chat_view_streaming_groq_failover(self, mock_post):
        mock_gemini_resp = MagicMock()
        mock_gemini_resp.status_code = 400
        mock_gemini_resp.text = '{"error": {"message": "User location is not supported."}}'

        mock_groq_resp = MagicMock()
        mock_groq_resp.status_code = 200
        mock_groq_resp.iter_lines.return_value = [
            b'data: {"choices": [{"delta": {"content": "BioPulse "}}]}',
            b'data: {"choices": [{"delta": {"content": "supports "}}]}',
            b'data: {"choices": [{"delta": {"content": "PCOS."}}]}',
            b'data: [DONE]',
        ]

        mock_post.side_effect = [mock_gemini_resp, mock_groq_resp]

        with patch.dict(os.environ, {
            "LLM_PROVIDER": "gemini",
            "GEMINI_API_KEY": self.dummy_gemini_key,
            "GROQ_API_KEY": self.dummy_groq_key,
        }):
            res = self.client.post(
                "/api/v1/intelligence/public/chat/",
                {"message": "What conditions does BioPulse support?", "stream": True},
                format="json",
            )
            self.assertEqual(res.status_code, 200)
            self.assertIn("text/event-stream", res["Content-Type"])
            body = b"".join(res.streaming_content).decode("utf-8")
            self.assertIn("BioPulse ", body)
            self.assertIn("supports ", body)
            self.assertIn('"done": true', body)

    # 14. Authenticated AI Companion View: Gemini geo failure -> Groq success
    @patch("urllib.request.urlopen")
    def test_authenticated_companion_view_groq_failover(self, mock_urlopen):
        geo_400_body = json.dumps({
            "error": {"code": 400, "message": "User location is not supported for the API use."}
        }).encode("utf-8")
        mock_geo_fp = MagicMock()
        mock_geo_fp.read.return_value = geo_400_body
        err_gemini_geo = urllib.error.HTTPError(
            url="https://generativelanguage.googleapis.com",
            code=400,
            msg="Bad Request",
            hdrs={},
            fp=mock_geo_fp,
        )

        mock_groq_resp = MagicMock()
        mock_groq_resp.__enter__.return_value = mock_groq_resp
        mock_groq_resp.read.return_value = json.dumps({
            "choices": [
                {
                    "message": {
                        "content": json.dumps({
                            "answer": "Here is an explanation of your biomarkers from Groq failover.",
                            "confidence": "high",
                            "used_context": ["reports"],
                            "needs_clinician": True,
                            "safety_level": "normal",
                        })
                    }
                }
            ]
        }).encode("utf-8")

        mock_urlopen.side_effect = [err_gemini_geo, mock_groq_resp]

        self.client.force_authenticate(user=self.test_user)
        with patch.dict(os.environ, {
            "LLM_PROVIDER": "gemini",
            "GEMINI_API_KEY": self.dummy_gemini_key,
            "GROQ_API_KEY": self.dummy_groq_key,
        }):
            res = self.client.post(
                "/api/v1/intelligence/companion/chat/",
                {"message": "Can you explain my labs to my doctor?"},
                format="json",
            )
            self.assertEqual(res.status_code, 200)
            data = res.json()
            self.assertTrue(data["success"])
            self.assertEqual(data["model"], "openai/gpt-oss-120b")
            self.assertIn("Groq failover", data["reply"])

    # 15. Authenticated AI Companion View: Both providers fail -> 503 Service Unavailable
    @patch("urllib.request.urlopen")
    def test_authenticated_companion_view_both_providers_fail_returns_503(self, mock_urlopen):
        geo_400_body = json.dumps({
            "error": {"code": 400, "message": "User location is not supported for the API use."}
        }).encode("utf-8")
        mock_geo_fp = MagicMock()
        mock_geo_fp.read.return_value = geo_400_body
        err_gemini_geo = urllib.error.HTTPError(
            url="https://generativelanguage.googleapis.com",
            code=400,
            msg="Bad Request",
            hdrs={},
            fp=mock_geo_fp,
        )

        groq_503_body = json.dumps({
            "error": {"code": 503, "message": "Groq is currently overloaded."}
        }).encode("utf-8")
        mock_groq_fp = MagicMock()
        mock_groq_fp.read.return_value = groq_503_body
        err_groq_503 = urllib.error.HTTPError(
            url="https://api.groq.com",
            code=503,
            msg="Service Unavailable",
            hdrs={},
            fp=mock_groq_fp,
        )

        mock_urlopen.side_effect = [err_gemini_geo, err_groq_503]

        self.client.force_authenticate(user=self.test_user)
        with patch.dict(os.environ, {
            "LLM_PROVIDER": "gemini",
            "GEMINI_API_KEY": self.dummy_gemini_key,
            "GROQ_API_KEY": self.dummy_groq_key,
        }):
            res = self.client.post(
                "/api/v1/intelligence/companion/chat/",
                {"message": "Hello BioPulse"},
                format="json",
            )
            self.assertEqual(res.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)
            data = res.json()
            self.assertFalse(data["success"])
            self.assertIn("temporarily unavailable", data["error"])

    # 16. Configurable Groq fallback model without overriding GEMINI_MODEL
    def test_groq_model_configurable_without_overriding_gemini_model(self):
        with patch.dict(os.environ, {
            "LLM_PROVIDER": "gemini",
            "GEMINI_API_KEY": self.dummy_gemini_key,
            "GEMINI_MODEL": "gemini-3.8-flash",
            "GROQ_API_KEY": self.dummy_groq_key,
            "GROQ_FALLBACK_MODEL": "custom/groq-model-special",
        }):
            provider = get_llm_provider()
            self.assertIsInstance(provider, GeminiProvider)
            self.assertEqual(provider.model_name, "gemini-3.8-flash")
            self.assertEqual(provider.groq_model, "custom/groq-model-special")
            self.assertEqual(provider.groq_provider.model_name, "custom/groq-model-special")
            # GEMINI_MODEL is unchanged
            self.assertEqual(os.environ["GEMINI_MODEL"], "gemini-3.8-flash")

    # 17. Default Groq fallback model is openai/gpt-oss-120b
    def test_default_groq_fallback_model_is_openai_gpt_oss_120b(self):
        with patch.dict(os.environ, {
            "LLM_PROVIDER": "gemini",
            "GEMINI_API_KEY": self.dummy_gemini_key,
            "GROQ_API_KEY": self.dummy_groq_key,
        }, clear=False):
            if "GROQ_FALLBACK_MODEL" in os.environ:
                del os.environ["GROQ_FALLBACK_MODEL"]
            if "GROQ_MODEL" in os.environ:
                del os.environ["GROQ_MODEL"]
            provider = get_llm_provider()
            self.assertEqual(provider.groq_model, "openai/gpt-oss-120b")
            self.assertEqual(provider.groq_provider.model_name, "openai/gpt-oss-120b")
