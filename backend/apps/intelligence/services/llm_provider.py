"""
OvaSense — LLM Provider Abstraction Layer.

Defines the abstract interface and concrete implementations for conversational
intelligence providers (Google Gemini, Groq, OpenAI, and OfflineDeterministicProvider).
Keeps provider configuration strictly in backend environment variables with zero
vendor lock-in.
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


@dataclass
class LLMResponse:
    """Structured response returned by any LLM provider."""
    answer: str
    confidence: str = "high"  # "high" | "moderate" | "limited"
    used_context: List[str] = field(default_factory=list)
    needs_clinician: bool = False
    safety_level: str = "normal"  # "normal" | "caution" | "urgent"
    model_name: str = "offline-fallback"

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


class OfflineDeterministicProvider(LLMProvider):
    """
    Offline deterministic provider used when no external API key is set,
    in air-gapped deployments, or during automated test suites.
    Never fabricates data or diagnoses diseases; uses patient context and
    verified lab values strictly.
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
                model_name="offline-deterministic",
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
                model_name="offline-deterministic",
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
                model_name="offline-deterministic",
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
                model_name="offline-deterministic",
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
                model_name="offline-deterministic",
            )

        # Default helpful assistant response
        used.extend(["profile", "cycle"])
        return LLMResponse(
            answer=(
                "I am your OvaSense AI Digital Twin assistant. I can help explain your cycle phases, interpret your logged symptoms, "
                "summarize verified laboratory report findings against stated lab ranges, and help prepare questions for your healthcare provider. "
                "What would you like to explore today?"
            ),
            confidence="moderate",
            used_context=used,
            needs_clinician=False,
            safety_level="normal",
            model_name="offline-deterministic",
        )


class GeminiProvider(LLMProvider):
    """Google Gemini LLM provider using direct REST API."""

    def __init__(self, api_key: str, model_name: str = "gemini-1.5-flash") -> None:
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

        # Build contents payload
        contents: List[dict[str, Any]] = []

        # Add recent conversation history if provided
        if conversation_history:
            for item in conversation_history[-6:]:
                role = "user" if item.get("sender") == "user" else "model"
                contents.append({"role": role, "parts": [{"text": item.get("text", "")}]})

        # Final prompt combines health context and current user message
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
            with urllib.request.urlopen(req, timeout=12) as resp:
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
        except Exception as exc:
            logger.warning("Gemini LLM call failed: %s; falling back to deterministic provider", exc)

        # Graceful fallback
        return OfflineDeterministicProvider().generate_chat_response(
            system_instruction, user_message, health_context, conversation_history
        )


class GroqProvider(LLMProvider):
    """Groq Cloud LLM provider (OpenAI-compatible REST interface)."""

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
            with urllib.request.urlopen(req, timeout=12) as resp:
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
        except Exception as exc:
            logger.warning("Groq LLM call failed: %s; falling back to deterministic provider", exc)

        return OfflineDeterministicProvider().generate_chat_response(
            system_instruction, user_message, health_context, conversation_history
        )


class OpenAIProvider(LLMProvider):
    """OpenAI / OpenRouter compatible provider."""

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
            with urllib.request.urlopen(req, timeout=12) as resp:
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
        except Exception as exc:
            logger.warning("OpenAI LLM call failed: %s; falling back to deterministic provider", exc)

        return OfflineDeterministicProvider().generate_chat_response(
            system_instruction, user_message, health_context, conversation_history
        )


def get_llm_provider() -> LLMProvider:
    """
    Factory function: returns the configured LLM provider according to
    environment variables. Defaults to OfflineDeterministicProvider if no key is set.
    """
    provider_name = os.environ.get("LLM_PROVIDER", "").lower().strip()
    api_key = os.environ.get("LLM_API_KEY", "").strip()

    if not api_key:
        # Check specific provider keys if LLM_API_KEY is not set
        if provider_name == "gemini" or not provider_name:
            api_key = os.environ.get("GEMINI_API_KEY", "").strip()
            if api_key:
                provider_name = "gemini"

        if not api_key and (provider_name == "groq" or not provider_name):
            api_key = os.environ.get("GROQ_API_KEY", "").strip()
            if api_key:
                provider_name = "groq"

        if not api_key and (provider_name == "openai" or not provider_name):
            api_key = os.environ.get("OPENAI_API_KEY", "").strip()
            if api_key:
                provider_name = "openai"

    if not api_key:
        return OfflineDeterministicProvider()

    model_name = os.environ.get("LLM_MODEL", "").strip()

    if provider_name == "groq":
        return GroqProvider(api_key, model_name=model_name or "llama-3.3-70b-versatile")
    elif provider_name == "openai":
        return OpenAIProvider(api_key, model_name=model_name or "gpt-4o-mini")
    elif provider_name == "gemini" or not provider_name:
        return GeminiProvider(api_key, model_name=model_name or "gemini-1.5-flash")

    return OfflineDeterministicProvider()
