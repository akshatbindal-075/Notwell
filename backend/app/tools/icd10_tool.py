"""Tool 5 — ICD-10 diagnosis code lookup via the free NLM Clinical Tables API (no key needed)."""
from agents import function_tool
import httpx
from app.config import settings
import logging

logger = logging.getLogger("tools.icd10")


@function_tool
async def lookup_icd10_code(diagnosis_term: str) -> str:
    """Look up ICD-10-CM codes matching a diagnosis term.

    Args:
        diagnosis_term: A diagnosis or condition name, e.g. "type 2 diabetes".
    """
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(
                settings.ICD10_API_BASE,
                params={"sf": "code,name", "terms": diagnosis_term, "maxList": 5},
            )
            resp.raise_for_status()
            data = resp.json()
            # NLM API returns [total, codes, extra, [ [code, name], ... ] ]
            pairs = data[3] if len(data) > 3 else []
            if not pairs:
                return f"No ICD-10 codes found for '{diagnosis_term}'."
            return "\n".join(f"{code}: {name}" for code, name in pairs)
    except Exception as e:
        logger.error(f"lookup_icd10_code failed: {e}")
        return f"Error looking up ICD-10 code: {e}"
