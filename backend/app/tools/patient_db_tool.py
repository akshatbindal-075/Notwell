"""Tool 1 — Patient DB query. Lets agents pull structured patient records."""
from agents import function_tool
from app.db.database import SessionLocal
from app.db.models import Patient, Visit
import logging

logger = logging.getLogger("tools.patient_db")


@function_tool
def get_patient_record(patient_id: str) -> str:
    """Fetch a patient's stored record: conditions, medications, allergies.

    Args:
        patient_id: The unique patient identifier.
    """
    db = SessionLocal()
    try:
        patient = db.query(Patient).filter(Patient.id == patient_id).first()
        if not patient:
            return f"No record found for patient_id={patient_id}."
        return (
            f"Name: {patient.name}\nDOB: {patient.dob}\n"
            f"Conditions: {patient.conditions}\nMedications: {patient.medications}\n"
            f"Allergies: {patient.allergies}"
        )
    except Exception as e:
        logger.error(f"get_patient_record failed: {e}")
        return f"Error fetching patient record: {e}"
    finally:
        db.close()


@function_tool
def get_past_visits(patient_id: str, limit: int = 5) -> str:
    """Fetch a patient's most recent past visit summaries.

    Args:
        patient_id: The unique patient identifier.
        limit: Max number of past visits to return.
    """
    db = SessionLocal()
    try:
        visits = (
            db.query(Visit)
            .filter(Visit.patient_id == patient_id)
            .filter(~Visit.summary_text.like("%SCHEDULED FOLLOW-UP%"))
            .order_by(Visit.date.desc())
            .limit(limit)
            .all()
        )
        if not visits:
            return "No past visits on record."
        return "\n---\n".join(f"{v.date}: {v.summary_text or v.transcript[:300]}" for v in visits)
    except Exception as e:
        logger.error(f"get_past_visits failed: {e}")
        return f"Error fetching past visits: {e}"
    finally:
        db.close()
