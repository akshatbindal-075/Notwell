"""
Wires Groq, OpenRouter, and Gemini into the OpenAI Agents SDK.

All three providers expose OpenAI-compatible chat-completions endpoints,
so we don't need the litellm extension — just point AsyncOpenAI clients
at each provider's base_url and wrap them in OpenAIChatCompletionsModel.

This is what lets the whole project run WITHOUT an OpenAI API key.

MULTI-KEY / MODEL FALLBACK: Groq's free tier enforces per-model daily and
per-minute token caps. To keep working when one is exhausted, this module
supports additional Groq keys via GROQ_API_KEY_2, GROQ_API_KEY_3, ... in
.env (each key has its own separate daily budget), and exposes ordered
*candidate lists* that pipeline_runner.py / structuring.py cycle through
automatically when a rate-limit error is hit — no manual intervention.
"""
import os
from openai import AsyncOpenAI
from agents import OpenAIChatCompletionsModel
from app.config import settings

# --- Clients ---
_openrouter_key = settings.OPENROUTER_API_KEY or "sk-or-placeholder"
_gemini_key = settings.GEMINI_API_KEY or "placeholder"

openrouter_client = AsyncOpenAI(api_key=_openrouter_key, base_url=settings.OPENROUTER_BASE_URL)
gemini_client = AsyncOpenAI(api_key=_gemini_key, base_url=settings.GEMINI_BASE_URL)


def _load_groq_keys() -> list[str]:
    """Primary GROQ_API_KEY plus any GROQ_API_KEY_2, GROQ_API_KEY_3, ...
    found in the environment. Each represents a separate Groq account/key
    with its own independent daily token budget."""
    keys = [settings.GROQ_API_KEY or "gsk_placeholder"]
    i = 2
    while True:
        extra = os.getenv(f"GROQ_API_KEY_{i}")
        if not extra:
            break
        keys.append(extra)
        i += 1
    return [k for k in keys if k]


_groq_keys = _load_groq_keys()
_groq_clients = [AsyncOpenAI(api_key=k, base_url=settings.GROQ_BASE_URL) for k in _groq_keys]
groq_client = _groq_clients[0]  # kept for backward compatibility / default use


def is_rate_limit_error(e: Exception) -> bool:
    """Detect a 429/rate-limit error from the exception message, so callers
    know to fall back to the next model/key candidate instead of just
    retrying the same one."""
    msg = str(e).lower()
    return "429" in msg or "rate_limit" in msg or "too many requests" in msg


def fast_model() -> OpenAIChatCompletionsModel:
    """Groq's gpt-oss-20b — supports strict structured (json_schema) output.
    Used for the lightweight structuring step and no-tool agents."""
    return OpenAIChatCompletionsModel(model=settings.MODEL_FAST, openai_client=groq_client)


def tool_model() -> OpenAIChatCompletionsModel:
    """Groq's llama-3.3-70b-versatile (primary key) — used for the free-text
    tool-calling phase of agents that use tools."""
    return OpenAIChatCompletionsModel(model="llama-3.3-70b-versatile", openai_client=groq_client)


def reasoning_model() -> OpenAIChatCompletionsModel:
    """Groq's larger gpt-oss-120b — used where multi-step reasoning quality matters."""
    return OpenAIChatCompletionsModel(model=settings.MODEL_REASONING, openai_client=groq_client)


def longcontext_model() -> OpenAIChatCompletionsModel:
    """Gemini — used where long patient-history context needs to be ingested."""
    return OpenAIChatCompletionsModel(model=settings.MODEL_LONGCTX, openai_client=gemini_client)


def tool_model_candidates() -> list[OpenAIChatCompletionsModel]:
    """Ordered fallback list for the tool-calling phase. Tries
    llama-3.3-70b-versatile on every configured Groq key first (each key =
    a separate daily-token bucket), then falls back to the smaller,
    separately-rate-limited gpt-oss-20b on the primary key as a last
    resort before giving up."""
    candidates = [
        OpenAIChatCompletionsModel(model="llama-3.3-70b-versatile", openai_client=c)
        for c in _groq_clients
    ]
    candidates.append(OpenAIChatCompletionsModel(model=settings.MODEL_FAST, openai_client=_groq_clients[0]))
    return candidates


def structuring_model_candidates() -> list[OpenAIChatCompletionsModel]:
    """Ordered fallback list for the JSON-structuring phase — same model
    across every configured Groq key, so a rate-limited key doesn't block
    structuring if another key still has budget."""
    return [
        OpenAIChatCompletionsModel(model="llama-3.3-70b-versatile", openai_client=c)
        for c in _groq_clients
    ]
