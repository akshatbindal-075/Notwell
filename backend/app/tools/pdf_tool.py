"""Tool 4 — Generates a discharge-summary PDF from the finalized pipeline result."""
from agents import function_tool
from fpdf import FPDF
import os
import logging

logger = logging.getLogger("tools.pdf")
OUTPUT_DIR = "./generated_pdfs"
os.makedirs(OUTPUT_DIR, exist_ok=True)


def build_discharge_pdf(
    patient_name: str,
    diagnosis_summary: str,
    treatment_plan_text: str,
    followup_text: str,
    session_id: str,
    patient_id: str = "",
    consultant_name: str = "",
) -> str:
    """Plain function (not an agent tool) so it can be called directly from
    the API layer as well as wrapped as a tool below. Returns the file path."""
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Helvetica", "B", 16)
    pdf.cell(0, 10, "Discharge Summary", ln=True)
    pdf.set_font("Helvetica", "", 10)
    pdf.set_text_color(90, 90, 90)
    pdf.cell(0, 6, f"Patient: {patient_name}   |   Patient ID: {patient_id or 'N/A'}", ln=True)
    pdf.cell(0, 6, f"Consultant: {consultant_name or 'N/A'}   |   Session ID: {session_id}", ln=True)
    pdf.set_text_color(0, 0, 0)
    pdf.ln(4)

    for heading, body in [
        ("Diagnosis Summary", diagnosis_summary),
        ("Treatment Plan", treatment_plan_text),
        ("Follow-up", followup_text),
    ]:
        pdf.set_font("Helvetica", "B", 13)
        pdf.cell(0, 8, heading, ln=True)
        pdf.set_font("Helvetica", "", 11)
        pdf.multi_cell(0, 6, body or "N/A")
        pdf.ln(3)

    path = os.path.join(OUTPUT_DIR, f"discharge_{session_id}.pdf")
    pdf.output(path)
    return path


@function_tool
def generate_discharge_pdf(
    patient_name: str,
    diagnosis_summary: str,
    treatment_plan_text: str,
    followup_text: str,
    session_id: str,
    patient_id: str = "",
    consultant_name: str = "",
) -> str:
    """Generate a discharge-summary PDF and return its file path.

    Args:
        patient_name: Full name of the patient.
        diagnosis_summary: Condensed diagnosis/summary text.
        treatment_plan_text: Treatment plan and discharge instructions.
        followup_text: Follow-up recommendations.
        session_id: Pipeline session id, used to name the file.
        patient_id: The patient's unique identifier.
        consultant_name: Name of the reviewing/approving clinician.
    """
    try:
        return build_discharge_pdf(
            patient_name, diagnosis_summary, treatment_plan_text, followup_text,
            session_id, patient_id, consultant_name,
        )
    except Exception as e:
        logger.error(f"generate_discharge_pdf failed: {e}")
        return f"Error generating PDF: {e}"
