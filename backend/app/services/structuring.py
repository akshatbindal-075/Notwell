"""
Converts an agent's free-text output into a structured Pydantic object.

IMPORTANT DESIGN NOTE: this deliberately does NOT use the Agents SDK's
Runner.run() for the structuring step. The SDK adds extra properties
(e.g. 'verbosity') to the API request body that Groq rejects with a
400 "property 'verbosity' is unsupported" error. Instead we call the
Groq AsyncOpenAI client directly — same result, no SDK overhead, no
unsupported fields in the request.
"""
import json
import logging
import asyncio
from app.config import settings
from app.services.model_providers import _groq_clients, is_rate_limit_error

logger = logging.getLogger("structuring")

MODEL = settings.MODEL_FAST


def _strip_code_fences(text: str) -> str:
    text = text.strip()
    if text.startswith("```"):
        text = text.strip("`")
        if text.lower().startswith("json"):
            text = text[4:]
    return text.strip()


async def structure_output(raw_text: str, output_type, task_description: str):
    """Convert free-text agent output into a structured Pydantic object.

    Calls the Groq chat-completions endpoint directly (no Agents SDK),
    falling back across every configured Groq key on rate-limit errors.
    """
    schema = output_type.model_json_schema()

    prompt = (
        f"{task_description}\n\n"
        "Convert the text below into a single JSON object that exactly matches this "
        f"JSON schema:\n{json.dumps(schema)}\n\n"
        "Respond with ONLY the raw JSON object as plain text — no markdown code fences, "
        "no explanation, no text before or after it. Do not invent information that is not "
        "present or reasonably implied in the text below.\n\n"
        f"TEXT:\n{raw_text}"
    )

    last_error = None

    for i, client in enumerate(_groq_clients):
        for attempt in range(2):
            try:
                response = await client.chat.completions.create(
                    model=MODEL,
                    messages=[
                        {"role": "system", "content": "You are a precise JSON formatter. Output only valid JSON."},
                        {"role": "user",   "content": prompt},
                    ],
                    temperature=0.1,
                    max_completion_tokens=8192,
                )
                raw_json = response.choices[0].message.content or ""
                cleaned  = _strip_code_fences(raw_json)
                return output_type.model_validate_json(cleaned)

            except Exception as e:
                last_error = e
                if is_rate_limit_error(e):
                    logger.warning(
                        f"structure_output: rate limit on key {i + 1}/{len(_groq_clients)}, "
                        f"trying next key."
                    )
                    break  # move to next client
                logger.warning(f"structure_output attempt failed: {e}")
                if attempt == 0:
                    await asyncio.sleep(1)

    raise last_error or RuntimeError("structure_output: no clients available")
