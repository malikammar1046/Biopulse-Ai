"""
backend/apps/intelligence/services/qwen_service.py

Dedicated Qwen3 1.7B Service for the BioPulse AI Companion.
Connects to local Ollama runtime via POST /api/chat.

Responsibilities:
- Communicates with Ollama API: http://localhost:11434/api/chat
- Uses non-streaming mode (stream: False)
- Enforces /no_think directive and strips <think>...</think> tags for clean explanations
- Configurable via Django settings and environment variables
- Provides health checking (GET /api/tags) without generating unnecessary tokens
"""

from __future__ import annotations

import json
import logging
import os
import re
from typing import Any, Dict, List, Optional

from django.conf import settings

logger = logging.getLogger(__name__)


class QwenServiceError(Exception):
    """Raised when the Qwen Ollama service encounters an error or timeout."""
    pass


class QwenOllamaService:
    """
    Dedicated client for Ollama running Qwen3 1.7B for the BioPulse AI Companion.
    """

    def __init__(
        self,
        base_url: Optional[str] = None,
        model_name: Optional[str] = None,
        timeout_seconds: Optional[int] = None,
    ) -> None:
        self.base_url = (
            base_url
            or getattr(settings, "OLLAMA_BASE_URL", None)
            or os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434")
        ).rstrip("/")

        self.model_name = (
            model_name
            or getattr(settings, "OLLAMA_MODEL", None)
            or os.environ.get("OLLAMA_MODEL", "qwen3:1.7b")
        ).strip()

        self.timeout = int(
            timeout_seconds
            or getattr(settings, "OLLAMA_TIMEOUT_SECONDS", None)
            or os.environ.get("OLLAMA_TIMEOUT_SECONDS", 30)
        )

    def _strip_think_tags(self, text: str) -> str:
        """
        Removes any <think>...</think> reasoning blocks from the model output.
        Ensures clean, friendly patient-facing responses.
        """
        if not text:
            return ""
        # Remove paired <think>...</think> tags
        cleaned = re.sub(r"<think>.*?</think>", "", text, flags=re.DOTALL)
        # Also strip any unclosed <think> tag if model cut off
        cleaned = re.sub(r"<think>.*", "", cleaned, flags=re.DOTALL)
        # Strip literal /no_think if echoed back
        cleaned = cleaned.replace("/no_think", "")
        return cleaned.strip()

    def generate_chat(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.3,
        append_no_think: bool = True,
    ) -> str:
        """
        Sends chat messages to Ollama /api/chat and returns the cleaned text response.
        """
        url = f"{self.base_url}/api/chat"

        # Apply /no_think directive if requested
        formatted_messages: List[Dict[str, str]] = []
        for msg in messages:
            role = msg.get("role", "user")
            content = msg.get("content", "")
            formatted_messages.append({"role": role, "content": content})

        if append_no_think and formatted_messages:
            # For Qwen3 thinking control, instruct no thinking in system/user message
            last_msg = formatted_messages[-1]
            if last_msg["role"] == "user" and "/no_think" not in last_msg["content"]:
                last_msg["content"] = f"{last_msg['content']}\n\n/no_think"

        payload = {
            "model": self.model_name,
            "messages": formatted_messages,
            "stream": False,
            "think": False,
            "options": {
                "temperature": temperature,
                "num_predict": 2500,
                "num_ctx": 4096,
            },
        }

        try:
            import requests

            resp = requests.post(
                url,
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=self.timeout,
            )

            if resp.status_code != 200:
                logger.error(
                    "Ollama /api/chat returned status %s: %s",
                    resp.status_code,
                    resp.text,
                )
                raise QwenServiceError(
                    f"Ollama server returned HTTP {resp.status_code}: {resp.text}"
                )

            data = resp.json()
            message_obj = data.get("message", {})
            raw_content = message_obj.get("content", "")

            if not raw_content:
                raise QwenServiceError("Ollama returned an empty response message.")

            cleaned = self._strip_think_tags(raw_content)
            return cleaned or raw_content.strip()

        except ImportError:
            # Fallback to standard library urllib.request
            import urllib.error
            import urllib.request

            req_data = json.dumps(payload).encode("utf-8")
            req = urllib.request.Request(
                url,
                data=req_data,
                headers={"Content-Type": "application/json"},
                method="POST",
            )
            try:
                with urllib.request.urlopen(req, timeout=self.timeout) as response:
                    res_body = response.read().decode("utf-8")
                    data = json.loads(res_body)
                    message_obj = data.get("message", {})
                    raw_content = message_obj.get("content", "")
                    if not raw_content:
                        raise QwenServiceError("Ollama returned empty message content.")
                    cleaned = self._strip_think_tags(raw_content)
                    return cleaned or raw_content.strip()
            except urllib.error.URLError as u_err:
                logger.error("Ollama connection error (urllib): %s", u_err)
                raise QwenServiceError(
                    f"Ollama inference server is unreachable at {self.base_url}. {u_err}"
                ) from u_err

        except requests.exceptions.Timeout as t_err:
            logger.error("Ollama request timed out after %ds: %s", self.timeout, t_err)
            raise QwenServiceError(
                f"Ollama request timed out after {self.timeout} seconds."
            ) from t_err

        except requests.exceptions.ConnectionError as c_err:
            logger.error("Could not connect to Ollama at %s: %s", self.base_url, c_err)
            raise QwenServiceError(
                f"Could not connect to Ollama at {self.base_url}. Ensure Ollama is running."
            ) from c_err

        except QwenServiceError:
            raise

        except Exception as exc:
            logger.error("Unexpected error in QwenOllamaService: %s", exc, exc_info=True)
            raise QwenServiceError(f"Unexpected error communicating with Qwen3: {exc}") from exc

    def check_health(self) -> Dict[str, Any]:
        """
        Inspects Ollama reachability and installed models via GET /api/tags without generating completions.
        """
        url = f"{self.base_url}/api/tags"
        result: Dict[str, Any] = {
            "status": "unhealthy",
            "ollama_reachable": False,
            "configured_model": self.model_name,
            "model_available": False,
            "available_models": [],
            "error": None,
        }

        try:
            import requests

            resp = requests.get(url, timeout=5)
            if resp.status_code == 200:
                result["ollama_reachable"] = True
                data = resp.json()
                models = [m.get("name") for m in data.get("models", []) if m.get("name")]
                result["available_models"] = models

                # Check if configured model or model base prefix is available
                model_base = self.model_name.split(":")[0]
                has_model = any(
                    m == self.model_name
                    or m.startswith(self.model_name)
                    or (":latest" in m and m.startswith(model_base))
                    for m in models
                )
                result["model_available"] = has_model

                if has_model:
                    result["status"] = "healthy"
                else:
                    result["status"] = "model_missing"
                    result["error"] = f"Model '{self.model_name}' not found in installed models."
            else:
                result["error"] = f"Ollama tags endpoint returned HTTP {resp.status_code}."

        except Exception as exc:
            result["error"] = f"Failed to connect to Ollama at {self.base_url}: {exc}"

        return result


# Shared singleton instance
qwen_service = QwenOllamaService()
