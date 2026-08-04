"""
Tool 6 — Follow-up appointment scheduling.
Stores scheduled follow-ups in the DB. Swap the body for a real Google
Calendar / hospital scheduling-system API call in production — the
function signature agents call stays the same.
"""
from agents import function_tool
from app.db.database import SessionLocal
from app.db.models import Visit
from datetime import datetime, timedelta
import logging
import re

logger = logging.getLogger("tools.calendar")


def _resolve_date(suggested_date: str) -> str:
    """Best-effort parse of relative dates like '2 weeks from discharge'."""
    match = re.search(r"(\d+)\s*(day|week|month)", suggested_date.lower())
    if not match:
        return suggested_date
    n, unit = int(match.group(1)), match.group(2)
    days = {"day": 1, "week": 7, "month": 30}[unit] * n
    return (datetime.utcnow() + timedelta(days=days)).date().isoformat()


@function_tool
def schedule_followup(patient_id: str, reason: str, suggested_date: str, department: str = "General") -> str:
    """Schedule a follow-up appointment for a patient.

    Args:
        patient_id: The unique patient identifier.
        reason: Reason for the follow-up.
        suggested_date: Target date, absolute (YYYY-MM-DD) or relative ('2 weeks from discharge').
        department: Department/specialty for the follow-up.
    """
    try:
        resolved = _resolve_date(suggested_date)
        db = SessionLocal()
        try:
            note = Visit(
                patient_id=patient_id,
                summary_text=f"[SCHEDULED FOLLOW-UP] {department} — {reason} on {resolved}",
            )
            db.add(note)
            db.commit()
        finally:
            db.close()
        return f"Follow-up scheduled: {department} on {resolved} — reason: {reason}"
    except Exception as e:
        logger.error(f"schedule_followup failed: {e}")
        return f"Error scheduling follow-up: {e}"
