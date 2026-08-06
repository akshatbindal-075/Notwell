import asyncio
import logging
import os
import uuid
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from app.models.schemas import ConsultationInput, ApprovalDecision
from app.services.pipeline_runner import run_consultation_pipeline
from app.services.approval_manager import record_approval_decision
from app.tools.pdf_tool import build_discharge_pdf
from app.db.database import SessionLocal
from app.db.models import Patient, PipelineRun, ApprovalRecord

logger = logging.getLogger("api")
router = APIRouter()


@router.post("/consultations/run")
async def run_consultation(payload: ConsultationInput):
    """Kick off the agent pipeline in the background and return immediately.

    The pipeline can take a while (multiple LLM calls per stage, plus any
    provider rate-limit retries), so we don't hold the HTTP request open
    for the whole run — that's what was causing frontend timeouts. Instead
    we pre-create the DB row synchronously (so polling works right away),
    launch the run as a background task, and the frontend polls
    GET /consultations/{session_id} for live progress.
    """
    session_id = payload.session_id or str(uuid.uuid4())
    payload.session_id = session_id

    db = SessionLocal()
    try:
        existing = db.query(PipelineRun).filter(PipelineRun.session_id == session_id).first()
        if not existing:
            db.add(PipelineRun(session_id=session_id, patient_id=payload.patient_id, status="in_progress"))
            db.commit()
    finally:
        db.close()

    async def _run():
        try:
            await run_consultation_pipeline(payload)
        except Exception as e:
            logger.error(f"Background pipeline run {session_id} crashed: {e}")

    asyncio.create_task(_run())
    return {"session_id": session_id, "status": "in_progress"}


@router.get("/consultations/{session_id}")
def get_consultation_status(session_id: str):
    db = SessionLocal()
    try:
        run_row = db.query(PipelineRun).filter(PipelineRun.session_id == session_id).first()
        if not run_row:
            raise HTTPException(status_code=404, detail="Session not found")
        return {
            "session_id": run_row.session_id,
            "status": run_row.status,
            "result": run_row.result_json,
            "errors": run_row.error_log,
        }
    finally:
        db.close()


@router.post("/consultations/approve")
def approve_consultation(decision: ApprovalDecision):
    """Human clinician approves/rejects the documentation package."""
    result = record_approval_decision(decision)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result


@router.get("/consultations/{session_id}/pdf")
def download_discharge_pdf(session_id: str):
    """Generate (or reuse an already-generated) discharge-summary PDF for a
    finalized consultation and return it as a downloadable file."""
    db = SessionLocal()
    try:
        run_row = db.query(PipelineRun).filter(PipelineRun.session_id == session_id).first()
        if not run_row:
            raise HTTPException(status_code=404, detail="Session not found")
        if run_row.status != "approved":
            raise HTTPException(status_code=400, detail="Consultation must be approved before generating a PDF.")

        result = run_row.result_json or {}
        patient = db.query(Patient).filter(Patient.id == run_row.patient_id).first()
        patient_name = patient.name if patient else run_row.patient_id

        approval = (
            db.query(ApprovalRecord)
            .filter(ApprovalRecord.pipeline_run_id == run_row.id, ApprovalRecord.approved == True)  # noqa: E712
            .order_by(ApprovalRecord.created_at.desc())
            .first()
        )
        consultant_name = approval.reviewer_name if approval else ""

        # ── Extract all structured pipeline data ──────────────────────────
        patient_history = result.get("patient_history") or {}
        clinical_note   = result.get("clinical_note")   or {}
        consult_summary = result.get("consult_summary") or {}
        treatment_plan  = result.get("treatment_plan")  or {}
        followup_plan   = result.get("followup_plan")   or {}

        path = build_discharge_pdf(
            patient_name       = patient_name,
            session_id         = session_id,
            patient_id         = run_row.patient_id,
            consultant_name    = consultant_name,
            # SOAP
            subjective         = clinical_note.get("subjective", ""),
            objective          = clinical_note.get("objective", ""),
            assessment         = clinical_note.get("assessment", ""),
            plan_soap          = clinical_note.get("plan", ""),
            icd10_codes        = clinical_note.get("icd10_codes", []),
            # Summary
            chief_complaint    = consult_summary.get("chief_complaint", ""),
            diagnosis_summary  = consult_summary.get("summary", ""),
            key_findings       = consult_summary.get("key_findings", []),
            risk_level         = consult_summary.get("risk_level", "low"),
            # Treatment
            treatment_steps        = treatment_plan.get("treatment_steps", []),
            prescribed_medications = treatment_plan.get("prescribed_medications", []),
            discharge_instructions = treatment_plan.get("discharge_instructions", ""),
            precautions            = treatment_plan.get("precautions", []),
            # Follow-up
            followup_items  = followup_plan.get("follow_ups", []),
            followup_notes  = followup_plan.get("notes", ""),
            # Patient history
            known_conditions = patient_history.get("known_conditions", []),
            allergies        = patient_history.get("allergies", []),
        )


        if not os.path.exists(path):
            raise HTTPException(status_code=500, detail="PDF generation failed.")

        return FileResponse(path, media_type="application/pdf", filename=f"discharge_summary_{session_id}.pdf")
    finally:
        db.close()


@router.get("/patients")
def list_patients(limit: int = 50):
    db = SessionLocal()
    try:
        patients = db.query(Patient).order_by(Patient.created_at.desc()).limit(limit).all()
        return [
            {
                "id": p.id,
                "name": p.name,
                "dob": p.dob,
                "created_at": p.created_at.isoformat() if p.created_at else None,
            }
            for p in patients
        ]
    finally:
        db.close()


@router.post("/patients")
def create_patient(name: str, dob: str = None):
    db = SessionLocal()
    try:
        patient = Patient(name=name, dob=dob)
        db.add(patient)
        db.commit()
        db.refresh(patient)
        return {"id": patient.id, "name": patient.name}
    finally:
        db.close()


@router.get("/patients/{patient_id}")
def get_patient(patient_id: str):
    db = SessionLocal()
    try:
        patient = db.query(Patient).filter(Patient.id == patient_id).first()
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")
        return {
            "id": patient.id,
            "name": patient.name,
            "dob": patient.dob,
            "conditions": patient.conditions,
            "medications": patient.medications,
            "allergies": patient.allergies,
        }
    finally:
        db.close()


@router.get("/patients/{patient_id}/visits")
def get_patient_visits(patient_id: str):
    """Return all past visits for a patient (used by frontend sidebar to
    show prior-visit count and signal when RAG retrieval will fire)."""
    from app.db.models import Visit
    db = SessionLocal()
    try:
        patient = db.query(Patient).filter(Patient.id == patient_id).first()
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")
        visits = db.query(Visit).filter(Visit.patient_id == patient_id).order_by(Visit.date.desc()).all()
        return {
            "patient_id": patient_id,
            "visit_count": len(visits),
            "visits": [
                {
                    "id": v.id,
                    "date": v.date.isoformat() if v.date else None,
                    "summary_text": v.summary_text or "",
                }
                for v in visits
            ],
        }
    finally:
        db.close()
