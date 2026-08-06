"""SQLAlchemy models — patient records, visit history, pipeline runs, approvals."""
from sqlalchemy import Column, String, Text, DateTime, Boolean, JSON, ForeignKey
from sqlalchemy.orm import declarative_base, relationship
from datetime import datetime
import uuid

Base = declarative_base()


def gen_short_id(prefix=""):
    short_hash = uuid.uuid4().hex[:6].upper()
    return f"{prefix}-{short_hash}" if prefix else short_hash


def gen_patient_id():
    return gen_short_id("PAT")


class Patient(Base):
    __tablename__ = "patients"
    id = Column(String, primary_key=True, default=gen_patient_id)
    name = Column(String, nullable=False)
    dob = Column(String)
    conditions = Column(JSON, default=list)
    medications = Column(JSON, default=list)
    allergies = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)

    visits = relationship("Visit", back_populates="patient")


class Visit(Base):
    __tablename__ = "visits"
    id = Column(String, primary_key=True, default=gen_id)
    patient_id = Column(String, ForeignKey("patients.id"))
    date = Column(DateTime, default=datetime.utcnow)
    transcript = Column(Text)
    summary_text = Column(Text)  # embedded for RAG retrieval

    patient = relationship("Patient", back_populates="visits")


class PipelineRun(Base):
    """One full agent-pipeline execution for a consultation."""
    __tablename__ = "pipeline_runs"
    id = Column(String, primary_key=True, default=gen_id)
    session_id = Column(String, index=True)
    patient_id = Column(String, ForeignKey("patients.id"))
    status = Column(String, default="in_progress")  # in_progress | pending_approval | approved | rejected
    result_json = Column(JSON, default=dict)  # full PipelineResult snapshot
    error_log = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class ApprovalRecord(Base):
    __tablename__ = "approvals"
    id = Column(String, primary_key=True, default=gen_id)
    pipeline_run_id = Column(String, ForeignKey("pipeline_runs.id"))
    approved = Column(Boolean, default=False)
    reviewer_name = Column(String)
    comments = Column(Text)
    edited_fields = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)
