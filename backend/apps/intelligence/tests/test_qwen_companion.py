"""
backend/apps/intelligence/tests/test_qwen_companion.py

Automated test suite for BioPulse AI Companion (Qwen3 1.7B Integration).
Validates:
1. General knowledge and persona
2. Female PCOS screening explanation
3. Female follow-up and SHAP explanation
4. Male hypogonadism screening explanation
5. Male follow-up (testosterone interpretation)
6. Missing laboratory information handling (non-hallucination)
7. Non-diagnostic safety boundaries (screening vs diagnosis)
8. Medication safety boundaries (prevent stopping/altering medication)
9. Strict pathway isolation (male vs female)
10. Resilient error handling when Ollama is offline (friendly 503 fallback)
11. Companion health check endpoint (GET /api/v1/intelligence/companion/health/)
12. API contract compliance (POST /api/v1/intelligence/companion/chat/)
"""

from __future__ import annotations

import os
from unittest.mock import MagicMock, patch
from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from apps.intelligence.services.health_context_builder import (
    HealthContextBuilder,
    FEMALE_SYSTEM_PROMPT,
    MALE_SYSTEM_PROMPT,
)
from apps.intelligence.services.llm_provider import (
    QwenOllamaProvider,
    LLMResponse,
    LLMProviderError,
    get_llm_provider,
)
from apps.intelligence.services.qwen_service import QwenOllamaService, QwenServiceError
from apps.intelligence.services.safety_guardrails import SafetyGuardrails


class QwenServiceUnitTests(TestCase):
    """Unit tests for QwenOllamaService and QwenOllamaProvider."""

    def test_strip_think_tags(self):
        service = QwenOllamaService()
        raw_text = "<think>\nThinking about the patient's FSH and LH ratio...\nLet me calculate.\n</think>Your FSH to LH ratio is within expected reference intervals."
        cleaned = service._strip_think_tags(raw_text)
        self.assertEqual(cleaned, "Your FSH to LH ratio is within expected reference intervals.")

    def test_strip_unclosed_think_tag(self):
        service = QwenOllamaService()
        raw_text = "Here is your summary.<think>Thinking cut off"
        cleaned = service._strip_think_tags(raw_text)
        self.assertEqual(cleaned, "Here is your summary.")

    def test_append_no_think_directive(self):
        service = QwenOllamaService()
        messages = [
            {"role": "system", "content": "You are BioPulse AI Companion."},
            {"role": "user", "content": "Explain my risk"},
        ]
        with patch("requests.post") as mock_post:
            mock_resp = MagicMock()
            mock_resp.status_code = 200
            mock_resp.json.return_value = {
                "message": {"content": "<think>thinking...</think>Your risk is lower."}
            }
            mock_post.return_value = mock_resp

            reply = service.generate_chat(messages, append_no_think=True)
            self.assertEqual(reply, "Your risk is lower.")

            # Verify /no_think was appended to user message
            sent_payload = mock_post.call_args[1]["json"]
            self.assertIn("/no_think", sent_payload["messages"][-1]["content"])

    def test_health_check_healthy(self):
        service = QwenOllamaService()
        with patch("requests.get") as mock_get:
            mock_resp = MagicMock()
            mock_resp.status_code = 200
            mock_resp.json.return_value = {
                "models": [{"name": "qwen3:1.7b"}, {"name": "llama3:latest"}]
            }
            mock_get.return_value = mock_resp

            health = service.check_health()
            self.assertEqual(health["status"], "healthy")
            self.assertTrue(health["ollama_reachable"])
            self.assertTrue(health["model_available"])

    def test_health_check_model_missing(self):
        service = QwenOllamaService()
        with patch("requests.get") as mock_get:
            mock_resp = MagicMock()
            mock_resp.status_code = 200
            mock_resp.json.return_value = {
                "models": [{"name": "mistral:latest"}]
            }
            mock_get.return_value = mock_resp

            health = service.check_health()
            self.assertEqual(health["status"], "model_missing")
            self.assertTrue(health["ollama_reachable"])
            self.assertFalse(health["model_available"])

    def test_health_check_unreachable(self):
        service = QwenOllamaService()
        with patch("requests.get", side_effect=Exception("Connection refused")):
            health = service.check_health()
            self.assertEqual(health["status"], "unhealthy")
            self.assertFalse(health["ollama_reachable"])
            self.assertFalse(health["model_available"])


class BioPulseContextAndPathwayTests(TestCase):
    """Validates patient context building, sex-specific pathway isolation, and missing data."""

    def test_female_system_prompt_identity(self):
        self.assertIn("BioPulse AI Companion", FEMALE_SYSTEM_PROMPT)
        self.assertIn("PCOS", FEMALE_SYSTEM_PROMPT)
        self.assertIn("CLEARLY DISTINGUISH SCREENING FROM DIAGNOSIS", FEMALE_SYSTEM_PROMPT)
        self.assertIn("NEVER say: \"You have PCOS\"", FEMALE_SYSTEM_PROMPT)

    def test_male_system_prompt_isolation(self):
        self.assertIn("BioPulse AI Companion", MALE_SYSTEM_PROMPT)
        self.assertIn("hypogonadism", MALE_SYSTEM_PROMPT)
        self.assertIn("CLEARLY DISTINGUISH SCREENING FROM DIAGNOSIS", MALE_SYSTEM_PROMPT)
        self.assertIn("STRICT ISOLATION: DO NOT mention PCOS, PMOS, or OvaSense", MALE_SYSTEM_PROMPT)

    def test_female_context_builder_includes_pcos_data(self):
        with patch("apps.health.services.supabase_health_service.health_service.fetch_all") as mock_fetch, \
             patch("apps.intelligence.services.assessment_repository.assessment_repository.get_active_assessment") as mock_active, \
             patch("apps.intelligence.services.clinical_state_repository.clinical_state_repository.get_patient_clinical_state") as mock_clin:

            mock_health = MagicMock()
            mock_health.profile.gender = "female"
            mock_health.profile.pathway = "female"
            mock_health.report_results = []
            mock_health.cycle_records = []
            mock_health.symptom_records = []
            mock_health.medications = []
            mock_health.food_logs = []
            mock_health.water_logs = []
            mock_fetch.return_value = mock_health

            mock_active.return_value = {
                "assessment_level": "tier_1_2",
                "risk_category": "higher",
                "probability": 0.745,
                "threshold": 0.25,
                "explanations": [
                    {"friendly_name": "Cycle Irregularity", "direction": "increases_risk"},
                    {"friendly_name": "Elevated LH:FSH", "direction": "increases_risk"},
                ],
                "recommendations": ["Discuss glucose tolerance test with doctor."],
            }
            mock_clin.return_value = {
                "tier_1_inputs": {"cycle_regularity": "irregular"},
                "tier_2_inputs": {"fasting_glucose": 105.0},
            }

            sys_prompt, ctx, used = HealthContextBuilder.build_context("user-female-1", "Explain my result")

            self.assertIn("BioPulse AI Companion", sys_prompt)
            self.assertIn("PCOS", sys_prompt)
            self.assertIn("[BIOPULSE PATIENT PATHWAY]: FEMALE", ctx)
            self.assertIn("74.5%", ctx)
            self.assertIn("HIGHER", ctx.upper())
            self.assertIn("Cycle Irregularity (increases risk)", ctx)
            self.assertIn("Fasting Glucose: 105.0", ctx)

    def test_male_context_builder_isolation_and_hormones(self):
        with patch("apps.health.services.supabase_health_service.health_service.fetch_all") as mock_fetch, \
             patch("apps.intelligence.services.assessment_repository.assessment_repository.get_active_assessment") as mock_active, \
             patch("apps.intelligence.services.clinical_state_repository.clinical_state_repository.get_patient_clinical_state") as mock_clin:

            mock_health = MagicMock()
            mock_health.profile.gender = "male"
            mock_health.profile.pathway = "male"
            mock_health.report_results = []
            mock_health.cycle_records = []
            mock_health.symptom_records = []
            mock_health.medications = []
            mock_health.food_logs = []
            mock_health.water_logs = []
            mock_fetch.return_value = mock_health

            mock_active.return_value = {
                "assessment_level": "tier_1_2",
                "risk_category": "higher",
                "probability": 0.682,
                "threshold": 0.50,
                "explanations": [
                    {"friendly_name": "Low Morning Testosterone", "direction": "increases_risk"},
                    {"friendly_name": "Low Libido", "direction": "increases_risk"},
                ],
                "hormone_pattern": {
                    "pattern_name": "Secondary Hypogonadism (Hypogonadotropic)",
                    "pattern_description": "Low testosterone with inappropriately normal or low LH/FSH",
                    "is_hypogonadal": True,
                },
                "recommendations": ["Repeat 8 AM fasting morning total testosterone."],
            }
            mock_clin.return_value = {
                "tier_1_inputs": {"age": 45, "bmi": 28.5},
                "tier_2_inputs": {"total_testosterone": 210.0, "lh": 2.1},
            }

            sys_prompt, ctx, used = HealthContextBuilder.build_context("user-male-1", "Explain my result")

            self.assertIn("BioPulse AI Companion", sys_prompt)
            self.assertIn("hypogonadism", sys_prompt)
            # Verify male prompt strictly does not mention PCOS
            self.assertNotIn("PCOS", ctx)
            self.assertNotIn("OvaSense", ctx)
            self.assertIn("[BIOPULSE PATIENT PATHWAY]: MALE", ctx)
            self.assertIn("68.2%", ctx)
            self.assertIn("Secondary Hypogonadism", ctx)
            self.assertIn("Total Testosterone: 210.0", ctx)

    def test_missing_biomarker_explicitly_flagged(self):
        with patch("apps.health.services.supabase_health_service.health_service.fetch_all") as mock_fetch, \
             patch("apps.intelligence.services.assessment_repository.assessment_repository.get_active_assessment") as mock_active, \
             patch("apps.intelligence.services.clinical_state_repository.clinical_state_repository.get_patient_clinical_state") as mock_clin:

            mock_health = MagicMock()
            mock_health.profile.gender = "male"
            mock_health.report_results = []
            mock_health.symptom_records = []
            mock_health.medications = []
            mock_health.food_logs = []
            mock_health.water_logs = []
            mock_fetch.return_value = mock_health
            mock_active.return_value = None
            mock_clin.return_value = {"tier_1_inputs": {}, "tier_2_inputs": {}}

            sys_prompt, ctx, used = HealthContextBuilder.build_context("user-male-2", "What is my testosterone?")

            # Missing labs must be listed explicitly to prevent hallucination
            self.assertIn("[LABORATORY BIOMARKERS NOT RECORDED YET IN BIOPULSE]", ctx)
            self.assertIn("Total Testosterone: Not recorded yet", ctx)
            self.assertIn("Prolactin: Not recorded yet", ctx)


class BioPulseChatApiIntegrationTests(TestCase):
    """Integration tests for POST /api/v1/intelligence/companion/chat/ and safety guardrails."""

    def setUp(self):
        self.client = APIClient()
        User = get_user_model()
        self.test_user = User.objects.create_user(
            username="companion-test-user",
            password="test-password-123",
            id=999777,
        )
        self.prev_provider = os.environ.get("LLM_PROVIDER")
        os.environ["LLM_PROVIDER"] = "qwen"

    def tearDown(self):
        if self.prev_provider is not None:
            os.environ["LLM_PROVIDER"] = self.prev_provider
        else:
            os.environ.pop("LLM_PROVIDER", None)

    # 1. General: What is BioPulse AI?
    def test_general_question_authenticated(self):
        self.client.force_authenticate(user=self.test_user)
        with patch("apps.intelligence.services.qwen_service.QwenOllamaService.generate_chat") as mock_chat:
            mock_chat.return_value = (
                "BioPulse AI is a personalized health screening and literacy platform supporting "
                "women's PCOS screening and men's hormonal hypogonadism screening."
            )
            payload = {"message": "What is BioPulse AI?"}
            resp = self.client.post("/api/v1/intelligence/companion/chat/", payload, format="json")
            self.assertEqual(resp.status_code, 200)
            data = resp.json()
            self.assertTrue(data["success"])
            self.assertIn("BioPulse AI", data["reply"])
            self.assertIn("reply", data)
            self.assertIn("message", data)
            self.assertEqual(data["model"], "qwen3:1.7b")

    # 2. Female: Explain my PCOS screening result
    def test_female_explain_pcos_result(self):
        self.client.force_authenticate(user=self.test_user)
        with patch("apps.intelligence.services.health_context_builder.HealthContextBuilder.build_context") as mock_ctx, \
             patch("apps.intelligence.services.qwen_service.QwenOllamaService.generate_chat") as mock_chat:

            mock_ctx.return_value = (
                FEMALE_SYSTEM_PROMPT,
                "[BIOPULSE PATIENT PATHWAY]: FEMALE\n• Statistical Risk Probability: 72.0%\n• Category: HIGHER",
                {"ml_screening": True, "reports": False},
            )
            mock_chat.return_value = (
                "Your BioPulse screening result indicates a higher statistical risk pattern (72.0%). "
                "This is a non-diagnostic screening assessment that highlights symptom and cycle indicators."
            )

            payload = {"message": "Explain my PCOS screening result.", "pathway": "female"}
            resp = self.client.post("/api/v1/intelligence/companion/chat/", payload, format="json")
            self.assertEqual(resp.status_code, 200)
            data = resp.json()
            self.assertTrue(data["success"])
            self.assertIn("72.0%", data["reply"])
            self.assertIn("screening", data["reply"].lower())

    # 3. Female follow-up: Why is my risk high?
    def test_female_followup_shap_explanation(self):
        self.client.force_authenticate(user=self.test_user)
        with patch("apps.intelligence.services.health_context_builder.HealthContextBuilder.build_context") as mock_ctx, \
             patch("apps.intelligence.services.qwen_service.QwenOllamaService.generate_chat") as mock_chat:

            mock_ctx.return_value = (
                FEMALE_SYSTEM_PROMPT,
                "• Top Contributing SHAP Factors: Cycle Irregularity (increases risk); BMI (increases risk)",
                {"ml_screening": True},
            )
            mock_chat.return_value = (
                "The primary factors that influenced your screening score according to the model's TreeSHAP analysis "
                "were your reported cycle irregularity and BMI."
            )

            payload = {
                "message": "Why is my risk high?",
                "conversation_history": [
                    {"sender": "user", "text": "Explain my PCOS screening result."},
                    {"sender": "ai", "text": "Your screening result indicates higher risk."},
                ],
            }
            resp = self.client.post("/api/v1/intelligence/companion/chat/", payload, format="json")
            self.assertEqual(resp.status_code, 200)
            data = resp.json()
            self.assertIn("TreeSHAP", data["reply"])

    # 4. Male: Explain my hypogonadism screening result
    def test_male_explain_hypogonadism_result(self):
        self.client.force_authenticate(user=self.test_user)
        with patch("apps.intelligence.services.health_context_builder.HealthContextBuilder.build_context") as mock_ctx, \
             patch("apps.intelligence.services.qwen_service.QwenOllamaService.generate_chat") as mock_chat:

            mock_ctx.return_value = (
                MALE_SYSTEM_PROMPT,
                "[BIOPULSE PATIENT PATHWAY]: MALE\n• Statistical Risk Probability: 65.0%\n• Category: HIGHER\n• Classification: Secondary Hypogonadism",
                {"ml_screening": True},
            )
            mock_chat.return_value = (
                "Your BioPulse male health screening assessment shows a 65.0% risk probability for hypogonadism. "
                "Your morning hormone profile suggests a secondary hypogonadism pattern."
            )

            payload = {"message": "Explain my hypogonadism screening result.", "pathway": "male"}
            resp = self.client.post("/api/v1/intelligence/companion/chat/", payload, format="json")
            self.assertEqual(resp.status_code, 200)
            data = resp.json()
            self.assertIn("hypogonadism", data["reply"])
            self.assertNotIn("PCOS", data["reply"])

    # 5. Male follow-up: What does my testosterone result mean?
    def test_male_testosterone_followup(self):
        self.client.force_authenticate(user=self.test_user)
        with patch("apps.intelligence.services.health_context_builder.HealthContextBuilder.build_context") as mock_ctx, \
             patch("apps.intelligence.services.qwen_service.QwenOllamaService.generate_chat") as mock_chat:

            mock_ctx.return_value = (
                MALE_SYSTEM_PROMPT,
                "[AUTHORITATIVE LAB RESULTS - CONFIRMED]: Total Testosterone: 210.0 ng/dL [Ref: 300-1000 ng/dL]",
                {"reports": True},
            )
            mock_chat.return_value = (
                "Your recorded morning total testosterone is 210.0 ng/dL, which is below the laboratory's standard reference range of 300-1000 ng/dL."
            )

            payload = {"message": "What does my testosterone result mean?", "pathway": "male"}
            resp = self.client.post("/api/v1/intelligence/companion/chat/", payload, format="json")
            self.assertEqual(resp.status_code, 200)
            data = resp.json()
            self.assertIn("210.0 ng/dL", data["reply"])

    # 6. Missing information: Inquire about unrecorded lab
    def test_missing_information_acknowledged(self):
        self.client.force_authenticate(user=self.test_user)
        with patch("apps.intelligence.services.health_context_builder.HealthContextBuilder.build_context") as mock_ctx, \
             patch("apps.intelligence.services.qwen_service.QwenOllamaService.generate_chat") as mock_chat:

            mock_ctx.return_value = (
                MALE_SYSTEM_PROMPT,
                "[LABORATORY BIOMARKERS NOT RECORDED YET IN BIOPULSE]: Total Testosterone: Not recorded yet",
                {},
            )
            mock_chat.return_value = (
                "You haven't recorded a testosterone lab value in your BioPulse account yet. "
                "Once you log a morning lab report, I can help you interpret it against the lab's reference range."
            )

            payload = {"message": "What is my testosterone score?"}
            resp = self.client.post("/api/v1/intelligence/companion/chat/", payload, format="json")
            self.assertEqual(resp.status_code, 200)
            data = resp.json()
            self.assertIn("haven't recorded", data["reply"])

    # 7. Safety: Screening is not diagnosis
    def test_safety_screening_is_not_diagnosis(self):
        self.client.force_authenticate(user=self.test_user)
        with patch("apps.intelligence.services.health_context_builder.HealthContextBuilder.build_context") as mock_ctx, \
             patch("apps.intelligence.services.qwen_service.QwenOllamaService.generate_chat") as mock_chat:

            # Test model inadvertent diagnostic statement reframing by guardrail
            mock_ctx.return_value = (FEMALE_SYSTEM_PROMPT, "Category: HIGHER", {})
            mock_chat.return_value = "The screening score proves that you have PCOS."

            payload = {"message": "Do I definitely have PCOS?"}
            resp = self.client.post("/api/v1/intelligence/companion/chat/", payload, format="json")
            self.assertEqual(resp.status_code, 200)
            data = resp.json()
            # Guardrail rewrites assertion to non-diagnostic phrasing
            self.assertNotIn("proves that you have PCOS", data["reply"])
            self.assertIn("screening model identifies statistical risk indicators", data["reply"])

    # 8. Safety: Should I stop my medication?
    def test_safety_do_not_stop_medication(self):
        self.client.force_authenticate(user=self.test_user)
        with patch("apps.intelligence.services.health_context_builder.HealthContextBuilder.build_context") as mock_ctx, \
             patch("apps.intelligence.services.qwen_service.QwenOllamaService.generate_chat") as mock_chat:

            mock_ctx.return_value = (FEMALE_SYSTEM_PROMPT, "Medications: Metformin", {})
            mock_chat.return_value = "You can stop your medication if you feel side effects."

            payload = {"message": "Should I stop my medication?"}
            resp = self.client.post("/api/v1/intelligence/companion/chat/", payload, format="json")
            self.assertEqual(resp.status_code, 200)
            data = resp.json()
            # Guardrail rewrites any instruction to stop medication
            self.assertNotIn("stop your medication", data["reply"])
            self.assertIn("discuss any adjustments to your medication or dosage with your prescribing physician", data["reply"])

    # 9. Isolation: Male context does not receive female terms
    def test_isolation_male_patient_no_pcos_terms(self):
        self.client.force_authenticate(user=self.test_user)
        with patch("apps.intelligence.services.health_context_builder.HealthContextBuilder.build_context") as mock_ctx, \
             patch("apps.intelligence.services.qwen_service.QwenOllamaService.generate_chat") as mock_chat:

            mock_ctx.return_value = (
                MALE_SYSTEM_PROMPT,
                "[BIOPULSE PATIENT PATHWAY]: MALE | Condition Monitored: Male Hypogonadism",
                {},
            )
            mock_chat.return_value = (
                "Your hypogonadism screening is focused on hormonal vitality and testosterone balance."
            )

            payload = {"message": "What condition are you tracking for me?", "pathway": "male"}
            resp = self.client.post("/api/v1/intelligence/companion/chat/", payload, format="json")
            self.assertEqual(resp.status_code, 200)
            data = resp.json()
            self.assertNotIn("PCOS", data["reply"])
            self.assertNotIn("PMOS", data["reply"])
            self.assertNotIn("OvaSense", data["reply"])

    # 10. Ollama unavailable: Clean 503 failure state
    def test_ollama_unavailable_graceful_failure(self):
        self.client.force_authenticate(user=self.test_user)
        with patch("apps.intelligence.services.qwen_service.QwenOllamaService.generate_chat", side_effect=QwenServiceError("Connection refused")):
            payload = {"message": "Explain my screening"}
            resp = self.client.post("/api/v1/intelligence/companion/chat/", payload, format="json")
            self.assertEqual(resp.status_code, 503)
            data = resp.json()
            self.assertFalse(data["success"])
            self.assertIn("temporarily unavailable", data["message"])
            self.assertIn("screening data and other BioPulse features are unaffected", data["message"])
            # Ensure no Python traceback leaked
            self.assertNotIn("Traceback", resp.content.decode("utf-8"))

    # 11. Health check endpoint: GET /api/v1/intelligence/companion/health/
    def test_companion_health_endpoint(self):
        with patch("apps.intelligence.services.qwen_service.QwenOllamaService.check_health") as mock_health:
            mock_health.return_value = {
                "status": "healthy",
                "ollama_reachable": True,
                "configured_model": "qwen3:1.7b",
                "model_available": True,
                "available_models": ["qwen3:1.7b"],
                "error": None,
            }
            resp = self.client.get("/api/v1/intelligence/companion/health/")
            self.assertEqual(resp.status_code, 200)
            data = resp.json()
            self.assertEqual(data["status"], "healthy")
            self.assertTrue(data["ollama_reachable"])
            self.assertTrue(data["model_available"])

    # 12. Backward compatible chat endpoint: POST /api/v1/intelligence/chat/
    def test_backward_compatible_chat_alias(self):
        self.client.force_authenticate(user=self.test_user)
        with patch("apps.intelligence.services.qwen_service.QwenOllamaService.generate_chat") as mock_chat:
            mock_chat.return_value = "BioPulse AI Companion is active and ready."
            payload = {"message": "Hello"}
            resp = self.client.post("/api/v1/intelligence/chat/", payload, format="json")
            self.assertEqual(resp.status_code, 200)
            data = resp.json()
            self.assertTrue(data["success"])
            self.assertEqual(data["reply"], "BioPulse AI Companion is active and ready.")
            self.assertEqual(data["message"], "BioPulse AI Companion is active and ready.")
