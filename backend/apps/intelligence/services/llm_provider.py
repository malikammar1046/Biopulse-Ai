"""
OvaSense — LLM Provider Abstraction Layer.

Defines the abstract interface and concrete implementations for conversational
intelligence providers:
  - MedGemmaProvider (Primary: local/self-hosted MedGemma 4B inference for privacy & zero cloud cost)
  - GeminiProvider (Optional cloud: Google Gemini)
  - GroqProvider (Optional cloud: Llama 3.3 via Groq)
  - OpenAIProvider (Optional cloud: GPT-4o-mini)
  - OfflineDeterministicProvider (Permitted ONLY for automated tests & offline dev)

STRICT ARCHITECTURAL INVARIANTS:
1. MedGemma is the primary provider, running locally to keep patient health data on our infrastructure.
2. OfflineDeterministicProvider must NEVER be presented to the patient as real AI and must NEVER
   silently replace a failed production LLM request.
3. OvaSense AI and Digital Twin are separate systems. OvaSense AI is the conversational interface
   that explains information; the Digital Twin is the structured rule-based representation.
4. The LLM is NOT the medical source of truth. Verified records, calculations, ML outputs, and
   Digital Twin observations remain authoritative.
"""

from __future__ import annotations

import json
import logging
import os
import urllib.error
import urllib.request
from abc import ABC, abstractmethod
from dataclasses import asdict, dataclass, field
from typing import Any, List, Optional

logger = logging.getLogger(__name__)


class LLMProviderError(Exception):
    """Raised when an LLM provider request fails, times out, or cannot be fulfilled."""
    pass


@dataclass
class LLMResponse:
    """Structured response returned by any LLM provider."""
    answer: str
    confidence: str = "high"  # "high" | "moderate" | "limited"
    used_context: List[str] = field(default_factory=list)
    needs_clinician: bool = False
    safety_level: str = "normal"  # "normal" | "caution" | "urgent"
    model_name: str = "medgemma:4b"

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


class LLMProvider(ABC):
    """Abstract base class for all LLM providers."""

    @abstractmethod
    def generate_chat_response(
        self,
        system_instruction: str,
        user_message: str,
        health_context: str,
        conversation_history: Optional[List[dict[str, str]]] = None,
    ) -> LLMResponse:
        """Generates a conversational response adhering to medical safety instructions."""
        raise NotImplementedError


class MedGemmaProvider(LLMProvider):
    """
    Primary Provider: Local/Self-Hosted MedGemma Conversational Intelligence.

    Connects to a local inference runtime (e.g. Ollama or vLLM running medgemma:4b or
    google/medgemma-4b-it via an OpenAI-compatible REST interface).

    Privacy & Cost Guarantees:
      - 100% on-premise / local inference: patient health context never leaves the host.
      - Zero recurring per-token cloud costs.
      - Grounded in Google DeepMind's specialized MedGemma medical foundation model.
    """

    def __init__(
        self,
        base_url: str = "http://127.0.0.1:11434/v1",
        model_name: str = "medgemma:4b",
        api_key: str = "local",
        timeout: int = 25,
    ) -> None:
        self.base_url = base_url.rstrip("/")
        self.model_name = model_name
        self.api_key = api_key
        self.timeout = timeout

    def generate_chat_response(
        self,
        system_instruction: str,
        user_message: str,
        health_context: str,
        conversation_history: Optional[List[dict[str, str]]] = None,
    ) -> LLMResponse:
        url = f"{self.base_url}/chat/completions"

        format_prompt = (
            f"{system_instruction}\n\n"
            "CRITICAL OUTPUT REQUIREMENT:\n"
            "You must respond strictly with a valid JSON object matching this schema:\n"
            "{\n"
            '  "answer": "string containing your conversational explanation",\n'
            '  "confidence": "high" | "moderate" | "limited",\n'
            '  "used_context": ["profile", "cycle", "symptoms", "reports", "digital_twin", "ml_screening"],\n'
            '  "needs_clinician": boolean,\n'
            '  "safety_level": "normal" | "caution" | "urgent"\n'
            "}"
        )

        messages: List[dict[str, str]] = [
            {"role": "system", "content": format_prompt}
        ]

        if conversation_history:
            for item in conversation_history[-6:]:
                role = "user" if item.get("sender") == "user" else "assistant"
                messages.append({"role": role, "content": item.get("text", "")})

        prompt_with_context = (
            f"--- MINIMAL PATIENT HEALTH CONTEXT ---\n{health_context}\n\n"
            f"--- PATIENT'S QUESTION ---\n{user_message}"
        )
        messages.append({"role": "user", "content": prompt_with_context})

        request_body = {
            "model": self.model_name,
            "messages": messages,
            "temperature": 0.2,
            "max_tokens": 850,
            "response_format": {"type": "json_object"},
        }

        try:
            req_data = json.dumps(request_body).encode("utf-8")
            req = urllib.request.Request(
                url,
                data=req_data,
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {self.api_key}",
                },
                method="POST",
            )
            with urllib.request.urlopen(req, timeout=self.timeout) as resp:
                resp_json = json.loads(resp.read().decode("utf-8"))

            choices = resp_json.get("choices", [])
            if not choices:
                raise LLMProviderError("MedGemma local engine returned an empty response choices list.")

            content = choices[0].get("message", {}).get("content", "").strip()
            if not content:
                raise LLMProviderError("MedGemma local engine returned empty message content.")

            # Parse JSON output from model
            parsed = self._safe_parse_json(content)
            return LLMResponse(
                answer=parsed.get("answer", content),
                confidence=parsed.get("confidence", "high"),
                used_context=parsed.get("used_context", []),
                needs_clinician=bool(parsed.get("needs_clinician", False)),
                safety_level=parsed.get("safety_level", "normal"),
                model_name=self.model_name,
            )

        except urllib.error.URLError as exc:
            logger.error("MedGemma local inference server connection error: %s", exc)
            raise LLMProviderError(
                f"MedGemma local inference server is unreachable at {self.base_url}. "
                "Ensure Ollama/vLLM is running locally."
            ) from exc
        except json.JSONDecodeError as exc:
            logger.error("Failed to decode response from MedGemma server: %s", exc)
            raise LLMProviderError("Invalid JSON received from MedGemma local engine.") from exc
        except LLMProviderError:
            raise
        except Exception as exc:
            logger.error("Unexpected failure in MedGemma provider: %s", exc, exc_info=True)
            raise LLMProviderError(f"MedGemma provider encountered an error: {exc}") from exc

    def _safe_parse_json(self, content: str) -> dict[str, Any]:
        """Tolerant parser that extracts JSON if wrapped in markdown code blocks."""
        cleaned = content.strip()
        if cleaned.startswith("```"):
            lines = cleaned.splitlines()
            if lines[0].startswith("```"):
                lines = lines[1:]
            if lines and lines[-1].strip() == "```":
                lines = lines[:-1]
            cleaned = "\n".join(lines).strip()

        try:
            return json.loads(cleaned)
        except Exception:
            # Fallback wrapper if model output raw text
            return {
                "answer": content,
                "confidence": "moderate",
                "used_context": [],
                "needs_clinician": False,
                "safety_level": "normal",
            }


class OfflineDeterministicProvider(LLMProvider):
    """
    Offline Deterministic Provider.

    STRICT CONSTRAINTS:
    - Permitted ONLY for automated test suites and air-gapped development environments.
    - Must NEVER be presented to the patient as real AI.
    - Must NEVER silently replace a failed production LLM request.
    - Generates canned rule-based responses strictly adhering to safety tiers.
    """

    def generate_chat_response(
        self,
        system_instruction: str,
        user_message: str,
        health_context: str,
        conversation_history: Optional[List[dict[str, str]]] = None,
    ) -> LLMResponse:
        msg_lower = user_message.lower()
        used: List[str] = []

        # 1. Doctor consultation / prep questions
        if any(w in msg_lower for w in ["doctor", "physician", "ask", "appointment", "consultation"]):
            used.extend(["reports", "symptoms", "cycle"])
            answer = (
                "Here are four structured topics to bring to your healthcare provider based on your records:\n\n"
                "1. **Cycle & Ovulation Patterns**: Review your recorded cycle regularity and current phase transitions.\n"
                "2. **Laboratory Biomarkers**: Discuss any verified laboratory findings (such as hormone ratios or metabolic markers) and compare them with your lab's reference ranges.\n"
                "3. **Symptom Duration & Severity**: Share your logged symptoms over the past 30 days to evaluate potential hormonal fluctuations.\n"
                "4. **Personalized Strategy**: Ask about nutrition, sleep, and lifestyle approaches that best support your individual hormone sensitivity.\n\n"
                "Tip: You can use the Clinician Summary export feature to bring a structured printout to your appointment."
            )
            return LLMResponse(
                answer=answer,
                confidence="high",
                used_context=used,
                needs_clinician=True,
                safety_level="normal",
                model_name="offline-deterministic-testing",
            )

        # 2. Screening, Risk score, or TreeSHAP factors
        if any(w in msg_lower for w in ["screening", "risk", "shap", "factor", "probability", "model"]):
            used.extend(["ml_screening", "shap_factors"])
            answer = (
                "Your PCOS screening assessment is produced by the OvaSense ExtraTrees machine learning model "
                "(calibrated at a 38% screening cutoff) paired with TreeSHAP factor explainability.\n\n"
                "• **How it works**: The model evaluates 16 clinical, menstrual, metabolic, and lifestyle indicators simultaneously.\n"
                "• **Key Influences**: Factors such as menstrual cycle regularity, BMI or weight trends, and androgen markers "
                "(e.g., hair growth or acne patterns) carry the highest predictive importance.\n"
                "• **Clinical Role**: This assessment is an educational screening aid designed to prepare you for clinical conversations, "
                "not a formal medical diagnosis."
            )
            return LLMResponse(
                answer=answer,
                confidence="high",
                used_context=used,
                needs_clinician=False,
                safety_level="normal",
                model_name="offline-deterministic-testing",
            )

        # 3. Medical report / lab tests / Vitamin D / LH / Testosterone
        if any(w in msg_lower for w in ["report", "lab", "result", "vitamin", "testosterone", "glucose", "insulin", "lh", "fsh", "amh"]):
            used.append("reports")
            if "vitamin d" in msg_lower or "vit d" in msg_lower:
                answer = (
                    "Vitamin D (25-OH) is a hormone precursor that plays a vital role in calcium absorption, insulin receptor "
                    "sensitivity, and ovarian follicle development. In medical reports, laboratories typically identify values "
                    "between 30.0 and 100.0 ng/mL as adequate. If your report shows a number outside your lab's stated reference interval, "
                    "it is advisable to review supplementation or dietary sources with your doctor."
                )
            elif "lh" in msg_lower or "fsh" in msg_lower:
                answer = (
                    "Luteinizing Hormone (LH) and Follicle-Stimulating Hormone (FSH) coordinate egg maturation and ovulation. "
                    "In women with cycle irregularities or PCOS, the LH-to-FSH ratio is sometimes observed to be elevated relative to "
                    "typical mid-follicular ranges. Your laboratory report's stated range is the authoritative baseline for comparison."
                )
            else:
                answer = (
                    "When reviewing medical reports, OvaSense prioritizes the reference intervals printed by your specific testing "
                    "facility. Laboratory ranges vary by testing assay and instrumentation. If any biomarker is flagged as outside "
                    "the reference interval, we recommend noting it down for discussion during your next medical consultation."
                )

            return LLMResponse(
                answer=answer,
                confidence="high",
                used_context=used,
                needs_clinician=True,
                safety_level="normal",
                model_name="offline-deterministic-testing",
            )

        # 4. Cycle and Period questions
        if any(w in msg_lower for w in ["cycle", "period", "phase", "ovulat", "follicular", "luteal"]):
            used.append("cycle")
            answer = (
                "Your menstrual cycle consists of four distinct phases: Menstrual, Follicular (when an egg develops), Ovulatory "
                "(when an egg is released), and Luteal (the days following ovulation). Hormonal transitions during these phases "
                "influence your daily energy levels, insulin sensitivity, and mood. Logging period start dates consistently in the "
                "'Your Cycle' tab helps refine your personal rhythm predictions."
            )
            return LLMResponse(
                answer=answer,
                confidence="high",
                used_context=used,
                needs_clinician=False,
                safety_level="normal",
                model_name="offline-deterministic-testing",
            )

        # 5. Symptoms & trend questions
        if any(w in msg_lower for w in ["symptom", "bloat", "cramp", "acne", "hair", "fatigue", "trend", "worse"]):
            used.append("symptoms")
            answer = (
                "Symptoms such as bloating, fatigue, or pelvic cramps often track closely with monthly hormonal shifts. "
                "Recording symptom severity (mild, moderate, or severe) over multiple consecutive cycles enables OvaSense to surface "
                "meaningful recurrence patterns for you and your physician to evaluate."
            )
            return LLMResponse(
                answer=answer,
                confidence="moderate",
                used_context=used,
                needs_clinician=False,
                safety_level="normal",
                model_name="offline-deterministic-testing",
            )

        # Default helpful assistant response
        used.extend(["profile", "cycle"])
        return LLMResponse(
            answer=(
                "I am OvaSense AI, your educational health companion. (Running in offline deterministic test mode). "
                "I can explain your cycle phases, interpret logged symptoms, summarize verified laboratory report findings "
                "against stated lab ranges, and help prepare questions for your healthcare provider."
            ),
            confidence="moderate",
            used_context=used,
            needs_clinician=False,
            safety_level="normal",
            model_name="offline-deterministic-testing",
        )


class GeminiProvider(LLMProvider):
    """Google Gemini LLM provider using direct REST API (Optional Cloud Fallback)."""

    def __init__(self, api_key: str, model_name: str = "gemini-2.5-flash") -> None:
        self.api_key = api_key
        self.model_name = model_name

    def generate_chat_response(
        self,
        system_instruction: str,
        user_message: str,
        health_context: str,
        conversation_history: Optional[List[dict[str, str]]] = None,
    ) -> LLMResponse:
        url = (
            f"https://generativelanguage.googleapis.com/v1beta/models/{self.model_name}:generateContent"
            f"?key={self.api_key}"
        )

        contents: List[dict[str, Any]] = []

        if conversation_history:
            for item in conversation_history[-6:]:
                role = "user" if item.get("sender") == "user" else "model"
                contents.append({"role": role, "parts": [{"text": item.get("text", "")}]})

        prompt_with_context = (
            f"--- RELEVANT PATIENT HEALTH CONTEXT ---\n{health_context}\n\n"
            f"--- PATIENT'S QUESTION ---\n{user_message}"
        )
        contents.append({"role": "user", "parts": [{"text": prompt_with_context}]})

        request_body = {
            "system_instruction": {"parts": [{"text": system_instruction}]},
            "contents": contents,
            "generationConfig": {
                "temperature": 0.2,
                "maxOutputTokens": 800,
                "responseMimeType": "application/json",
            },
        }

        try:
            req_data = json.dumps(request_body).encode("utf-8")
            req = urllib.request.Request(
                url,
                data=req_data,
                headers={"Content-Type": "application/json"},
                method="POST",
            )
            with urllib.request.urlopen(req, timeout=15) as resp:
                resp_json = json.loads(resp.read().decode("utf-8"))

            candidates = resp_json.get("candidates", [])
            if candidates:
                raw_text = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                parsed = json.loads(raw_text)
                return LLMResponse(
                    answer=parsed.get("answer", raw_text),
                    confidence=parsed.get("confidence", "high"),
                    used_context=parsed.get("used_context", []),
                    needs_clinician=bool(parsed.get("needs_clinician", False)),
                    safety_level=parsed.get("safety_level", "normal"),
                    model_name=self.model_name,
                )
            raise LLMProviderError("Empty candidates list returned by Gemini.")
        except Exception as exc:
            logger.error("Gemini LLM call failed: %s", exc)
            raise LLMProviderError(f"Gemini LLM provider error: {exc}") from exc


class GroqProvider(LLMProvider):
    """Groq Cloud LLM provider (Optional Cloud Fallback)."""

    def __init__(self, api_key: str, model_name: str = "llama-3.3-70b-versatile") -> None:
        self.api_key = api_key
        self.model_name = model_name

    def generate_chat_response(
        self,
        system_instruction: str,
        user_message: str,
        health_context: str,
        conversation_history: Optional[List[dict[str, str]]] = None,
    ) -> LLMResponse:
        url = "https://api.groq.com/openai/v1/chat/completions"

        messages: List[dict[str, str]] = [
            {"role": "system", "content": system_instruction + "\nYou must respond strictly with valid JSON conforming to: {\"answer\": string, \"confidence\": \"high\"|\"moderate\"|\"limited\", \"used_context\": string[], \"needs_clinician\": boolean, \"safety_level\": \"normal\"|\"caution\"|\"urgent\"}"}
        ]

        if conversation_history:
            for item in conversation_history[-6:]:
                role = "user" if item.get("sender") == "user" else "assistant"
                messages.append({"role": role, "content": item.get("text", "")})

        prompt_with_context = (
            f"--- RELEVANT PATIENT HEALTH CONTEXT ---\n{health_context}\n\n"
            f"--- PATIENT'S QUESTION ---\n{user_message}"
        )
        messages.append({"role": "user", "content": prompt_with_context})

        request_body = {
            "model": self.model_name,
            "messages": messages,
            "temperature": 0.2,
            "max_tokens": 800,
            "response_format": {"type": "json_object"},
        }

        try:
            req_data = json.dumps(request_body).encode("utf-8")
            req = urllib.request.Request(
                url,
                data=req_data,
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {self.api_key}",
                },
                method="POST",
            )
            with urllib.request.urlopen(req, timeout=15) as resp:
                resp_json = json.loads(resp.read().decode("utf-8"))

            choices = resp_json.get("choices", [])
            if choices:
                content = choices[0].get("message", {}).get("content", "")
                parsed = json.loads(content)
                return LLMResponse(
                    answer=parsed.get("answer", content),
                    confidence=parsed.get("confidence", "high"),
                    used_context=parsed.get("used_context", []),
                    needs_clinician=bool(parsed.get("needs_clinician", False)),
                    safety_level=parsed.get("safety_level", "normal"),
                    model_name=self.model_name,
                )
            raise LLMProviderError("Empty choices list returned by Groq.")
        except Exception as exc:
            logger.error("Groq LLM call failed: %s", exc)
            raise LLMProviderError(f"Groq LLM provider error: {exc}") from exc


class OpenAIProvider(LLMProvider):
    """OpenAI / OpenRouter provider (Optional Cloud Fallback)."""

    def __init__(self, api_key: str, model_name: str = "gpt-4o-mini") -> None:
        self.api_key = api_key
        self.model_name = model_name

    def generate_chat_response(
        self,
        system_instruction: str,
        user_message: str,
        health_context: str,
        conversation_history: Optional[List[dict[str, str]]] = None,
    ) -> LLMResponse:
        url = "https://api.openai.com/v1/chat/completions"

        messages: List[dict[str, str]] = [
            {"role": "system", "content": system_instruction + "\nRespond strictly in valid JSON format: {\"answer\": string, \"confidence\": \"high\"|\"moderate\"|\"limited\", \"used_context\": string[], \"needs_clinician\": boolean, \"safety_level\": \"normal\"|\"caution\"|\"urgent\"}"}
        ]

        if conversation_history:
            for item in conversation_history[-6:]:
                role = "user" if item.get("sender") == "user" else "assistant"
                messages.append({"role": role, "content": item.get("text", "")})

        prompt_with_context = (
            f"--- RELEVANT PATIENT HEALTH CONTEXT ---\n{health_context}\n\n"
            f"--- PATIENT'S QUESTION ---\n{user_message}"
        )
        messages.append({"role": "user", "content": prompt_with_context})

        request_body = {
            "model": self.model_name,
            "messages": messages,
            "temperature": 0.2,
            "max_tokens": 800,
            "response_format": {"type": "json_object"},
        }

        try:
            req_data = json.dumps(request_body).encode("utf-8")
            req = urllib.request.Request(
                url,
                data=req_data,
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {self.api_key}",
                },
                method="POST",
            )
            with urllib.request.urlopen(req, timeout=15) as resp:
                resp_json = json.loads(resp.read().decode("utf-8"))

            choices = resp_json.get("choices", [])
            if choices:
                content = choices[0].get("message", {}).get("content", "")
                parsed = json.loads(content)
                return LLMResponse(
                    answer=parsed.get("answer", content),
                    confidence=parsed.get("confidence", "high"),
                    used_context=parsed.get("used_context", []),
                    needs_clinician=bool(parsed.get("needs_clinician", False)),
                    safety_level=parsed.get("safety_level", "normal"),
                    model_name=self.model_name,
                )
            raise LLMProviderError("Empty choices returned by OpenAI.")
        except Exception as exc:
            logger.error("OpenAI LLM call failed: %s", exc)
            raise LLMProviderError(f"OpenAI LLM provider error: {exc}") from exc


class QwenOllamaProvider(LLMProvider):
    """
    BioPulse AI Primary Local Provider: Qwen3 1.7B via Ollama /api/chat.

    Connects to local Ollama runtime, supports non-streaming responses, enforces /no_think,
    and strips <think>...</think> tags.
    """

    def __init__(
        self,
        base_url: Optional[str] = None,
        model_name: Optional[str] = None,
        timeout: Optional[int] = None,
    ) -> None:
        from apps.intelligence.services.qwen_service import QwenOllamaService
        self.service = QwenOllamaService(
            base_url=base_url,
            model_name=model_name,
            timeout_seconds=timeout,
        )
        self.model_name = self.service.model_name

    def generate_chat_response(
        self,
        system_instruction: str,
        user_message: str,
        health_context: str,
        conversation_history: Optional[List[dict[str, str]]] = None,
    ) -> LLMResponse:
        messages: List[dict[str, str]] = []

        # System message containing role, guidelines, and patient health context
        full_system_prompt = system_instruction
        if health_context:
            full_system_prompt += f"\n\n--- AUTHORITATIVE PATIENT BIOPULSE STATE ---\n{health_context}"

        messages.append({"role": "system", "content": full_system_prompt})

        # Bounded conversation history (last 8 messages)
        if conversation_history:
            for item in conversation_history[-8:]:
                role = "user" if item.get("sender") == "user" else "assistant"
                text = item.get("text", "")
                if text:
                    messages.append({"role": role, "content": text})

        # Current user query
        messages.append({"role": "user", "content": user_message})

        try:
            from apps.intelligence.services.qwen_service import QwenServiceError
            answer = self.service.generate_chat(messages, append_no_think=True)

            # Determine safety level and clinician escalation
            needs_clinician = any(
                term in user_message.lower()
                for term in ["doctor", "physician", "prescribe", "medication", "dose", "severe", "pain"]
            )

            return LLMResponse(
                answer=answer,
                confidence="high",
                used_context=["profile", "ml_screening", "clinical_state"],
                needs_clinician=needs_clinician,
                safety_level="normal",
                model_name=self.model_name,
            )
        except Exception as exc:
            logger.error("QwenOllamaProvider failed: %s", exc)
            raise LLMProviderError(f"Qwen3 1.7B companion request failed: {exc}") from exc


def get_llm_provider() -> LLMProvider:
    """
    Factory function: returns the configured LLM provider according to environment variables and Django settings.

    Defaults to QwenOllamaProvider (local self-hosted Qwen3 1.7B via Ollama) to guarantee patient privacy,
    zero recurring API costs, and compliance with the BioPulse AI Companion specification.

    OfflineDeterministicProvider is returned ONLY when LLM_PROVIDER is explicitly set to 'offline'.
    """
    from django.conf import settings

    default_provider = getattr(settings, "LLM_PROVIDER", "qwen")
    provider_name = os.environ.get("LLM_PROVIDER", default_provider).lower().strip()

    # 1. Offline Deterministic (Strictly for automated tests and offline sandbox dev)
    if provider_name == "offline":
        return OfflineDeterministicProvider()

    # 2. Qwen3 1.7B via Ollama (Primary BioPulse AI Companion Provider)
    if provider_name in ("qwen", "ollama", ""):
        base_url = getattr(settings, "OLLAMA_BASE_URL", None) or os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434")
        model_name = getattr(settings, "OLLAMA_MODEL", None) or os.environ.get("OLLAMA_MODEL", "qwen3:1.7b")
        timeout = getattr(settings, "OLLAMA_TIMEOUT_SECONDS", None) or int(os.environ.get("OLLAMA_TIMEOUT_SECONDS", "30"))
        return QwenOllamaProvider(
            base_url=base_url,
            model_name=model_name,
            timeout=timeout,
        )

    # 3. MedGemma (Legacy Self-Hosted Provider)
    if provider_name == "medgemma":
        base_url = os.environ.get("MEDGEMMA_BASE_URL", "http://127.0.0.1:11434/v1").strip()
        model_name = os.environ.get("MEDGEMMA_MODEL", "medgemma:4b").strip()
        api_key = os.environ.get("MEDGEMMA_API_KEY", "local").strip()
        timeout = int(os.environ.get("MEDGEMMA_TIMEOUT_SECONDS", "25"))
        return MedGemmaProvider(
            base_url=base_url,
            model_name=model_name,
            api_key=api_key,
            timeout=timeout,
        )

    # 4. Optional Cloud Providers (Preserved behind LLMProvider abstraction)
    model_name = os.environ.get("LLM_MODEL", "").strip()

    if provider_name == "gemini":
        api_key = os.environ.get("LLM_API_KEY") or os.environ.get("GEMINI_API_KEY", "").strip()
        if not api_key:
            raise LLMProviderError("LLM_PROVIDER is set to 'gemini' but no GEMINI_API_KEY is configured.")
        return GeminiProvider(api_key, model_name=model_name or "gemini-2.5-flash")

    if provider_name == "groq":
        api_key = os.environ.get("LLM_API_KEY") or os.environ.get("GROQ_API_KEY", "").strip()
        if not api_key:
            raise LLMProviderError("LLM_PROVIDER is set to 'groq' but no GROQ_API_KEY is configured.")
        return GroqProvider(api_key, model_name=model_name or "llama-3.3-70b-versatile")

    if provider_name == "openai":
        api_key = os.environ.get("LLM_API_KEY") or os.environ.get("OPENAI_API_KEY", "").strip()
        if not api_key:
            raise LLMProviderError("LLM_PROVIDER is set to 'openai' but no OPENAI_API_KEY is configured.")
        return OpenAIProvider(api_key, model_name=model_name or "gpt-4o-mini")

    raise LLMProviderError(f"Unsupported LLM_PROVIDER configured: '{provider_name}'.")

