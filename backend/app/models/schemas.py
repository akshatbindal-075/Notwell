"""
Structured-output contracts. Every agent returns one of these — never
free-form text — so the pipeline, DB, and frontend can all rely on shape.
"""
from pydantic import BaseModel, Field
from typing import List, Optional
from enum import Enum


class Severity(str, Enum):
    LOW = "low"
    MODERATE = "moderate"
    HIGH = "high"
    CRITICAL = "critical"


class Medication(BaseModel):
    name: str
    dosage: Optional[str] = None
    frequency: Optional[str] = None
    active: bool = True


class Allergy(BaseModel):
    substance: str
    reaction: Optional[str] = None
    severity: Optional[str] = Field(None, description="e.g. 'low', 'moderate', 'high', 'critical'")


# ---------- Patient History Agent ----------
class PatientHistoryOutput(BaseModel):
    patient_id: str
    known_conditions: List[str] = Field(default_factory=list)
    medications: List[Medication] = Field(default_factory=list)
    allergies: List[Allergy] = Field(default_factory=list)
    past_visits_summary: List[str] = Field(default_factory=list)
    relevant_flags: List[str] = Field(
        default_factory=list, description="e.g. 'diabetic — check renal function before NSAIDs'"
    )


# ---------- Clinical Note Writer Agent (SOAP format) ----------
class ClinicalNoteOutput(BaseModel):
    subjective: str = Field(description="Patient-reported symptoms, history of present illness")
    objective: str = Field(description="Exam findings, vitals, test results")
    assessment: str = Field(description="Clinical impression / diagnosis")
    plan: str = Field(description="Immediate management plan")
    icd10_codes: List[str] = Field(default_factory=list)


# ---------- Medical Summary Agent ----------
class ConsultSummaryOutput(BaseModel):
    chief_complaint: str
    summary: str = Field(description="Condensed narrative of the consultation")
    key_findings: List[str] = Field(default_factory=list)
    diagnosis: List[str] = Field(default_factory=list)
    risk_level: Severity = Severity.LOW


# ---------- Treatment Planner Agent ----------
class TreatmentStep(BaseModel):
    action: str
    rationale: Optional[str] = None
    timeframe: Optional[str] = None


class TreatmentPlanOutput(BaseModel):
    diagnosis_addressed: List[str] = Field(default_factory=list)
    treatment_steps: List[TreatmentStep] = Field(default_factory=list)
    prescribed_medications: List[Medication] = Field(default_factory=list)
    discharge_instructions: str
    precautions: List[str] = Field(default_factory=list)


# ---------- Follow-up Coordinator Agent ----------
class FollowUpItem(BaseModel):
    reason: str
    suggested_date: str = Field(description="ISO date or relative e.g. '2 weeks from discharge'")
    department: Optional[str] = None
    priority: Severity = Severity.LOW


class FollowUpPlanOutput(BaseModel):
    follow_ups: List[FollowUpItem] = Field(default_factory=list)
    reminder_channels: List[str] = Field(default_factory=list, description="e.g. ['sms', 'email']")
    notes: Optional[str] = None


# ---------- Documentation Reviewer Agent ----------
class ReviewIssue(BaseModel):
    field: str
    issue: str
    severity: Severity


class ReviewResultOutput(BaseModel):
    passed: bool
    issues: List[ReviewIssue] = Field(default_factory=list)
    requires_human_approval: bool = True
    reviewer_notes: Optional[str] = None


# ---------- Full pipeline result bundle (what the API returns) ----------
class PipelineResult(BaseModel):
    session_id: str
    patient_history: Optional[PatientHistoryOutput] = None
    clinical_note: Optional[ClinicalNoteOutput] = None
    consult_summary: Optional[ConsultSummaryOutput] = None
    treatment_plan: Optional[TreatmentPlanOutput] = None
    followup_plan: Optional[FollowUpPlanOutput] = None
    review: Optional[ReviewResultOutput] = None
    status: str = Field(default="in_progress", description="in_progress | pending_approval | approved | rejected")


# ---------- API request models ----------
class ConsultationInput(BaseModel):
    patient_id: str
    session_id: Optional[str] = None
    transcript: Optional[str] = Field(None, description="Raw consultation transcript, if already text")
    audio_url: Optional[str] = Field(None, description="URL/path to audio, if transcription needed")


class ApprovalDecision(BaseModel):
    session_id: str
    approved: bool
    reviewer_name: str
    edited_fields: Optional[dict] = None
    comments: Optional[str] = None
