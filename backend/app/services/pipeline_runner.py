"""
Executes the full agent pipeline for a consultation.

DESIGN NOTES:

1. Sequential orchestration instead of autonomous SDK handoffs — when an
   agent has both output_type and a handoff option in the same turn, it
   tends to just call the handoff tool and skip emitting structured
   output. So each agent is invoked explicitly, one at a time, with each
   stage's structured output threaded into the next stage's input.

2. No agent uses the SDK's output_type / response_format=json_schema.
   Groq's gpt-oss reasoning models were found to intermittently return a
   completely empty response when asked for strict structured output
   (regardless of schema complexity), and Groq separately does not
   support combining tool-calling with response_format at all. So every
   agent responds in free text (using tools where relevant), and
   app/services/structuring.py converts that text into the required
   Pydantic schema via a second call to a non-reasoning model, with
   manual JSON parsing/validation instead of server-side strict mode.

3. No shared session across stages — each stage receives the relevant
   prior context explicitly in its input text already; sharing one
   growing SQLiteSession across 10+ calls was inflating token usage
   enough to blow through Groq's free-tier rate limits.

Still includes:
- Structured-output capture at each stage into PipelineResult
- Per-stage error handling + retries + logging (one stage failing
  doesn't crash the whole run — it's recorded and surfaced to the
  human reviewer)
- Persistence of the run + partial result to the DB after every stage
  (session persistence + lets the frontend poll for live progress)
"""
import asyncio
import logging
import uuid
from datetime import datetime

from agents import Runner
from app.agents.patient_history_agent import patient_history_agent
from app.agents.clinical_note_agent import clinical_note_agent
from app.agents.medical_summary_agent import medical_summary_agent
from app.agents.treatment_planner_agent import treatment_planner_agent
from app.agents.followup_agent import followup_agent
from app.agents.documentation_reviewer_agent import documentation_reviewer_agent
from app.services.structuring import structure_output
from app.db.database import SessionLocal
from app.db.models import PipelineRun, Visit
from app.models.schemas import (
    PipelineResult,
    ConsultationInput,
    PatientHistoryOutput,
    ClinicalNoteOutput,
    ConsultSummaryOutput,
    TreatmentPlanOutput,
    FollowUpPlanOutput,
    ReviewResultOutput,
)
from app.services.model_providers import tool_model_candidates, is_rate_limit_error
from app.tools.rag_tool import index_visit_note

logger = logging.getLogger("pipeline_runner")


def _json(obj):
    return obj.model_dump_json() if obj else "N/A"


async def _run_stage(agent, input_text, stage_name, output_type, task_desc, error_log):
    """Run an agent (tools optional) in free text, then structure the result.

    Automatically falls back across model/key candidates on rate-limit
    errors (tool_model_candidates() — llama-3.3-70b-versatile on every
    configured Groq key, then gpt-oss-20b as a last resort) instead of
    just retrying the same exhausted model. Non-rate-limit errors get one
    same-model retry with a short backoff before moving to the next
    candidate too, since transient generation failures can also occur.
    """
    candidates = tool_model_candidates()
    last_error = None

    for i, model in enumerate(candidates):
        agent.model = model
        for attempt in range(2):
            try:
                run_result = await Runner.run(agent, input_text)
                raw_text = run_result.final_output
                return await structure_output(raw_text, output_type, task_desc)
            except Exception as e:
                last_error = e
                if is_rate_limit_error(e):
                    logger.warning(
                        f"Stage '{stage_name}': rate limit on candidate {i + 1}/{len(candidates)}, "
                        f"falling back to next model/key."
                    )
                    break  # don't retry same rate-limited model — move to next candidate
                if attempt == 0:
                    await asyncio.sleep(2)

    logger.error(f"Stage '{stage_name}' failed after all model/key fallbacks: {last_error}")
    error_log.append({"stage": stage_name, "error": str(last_error), "time": datetime.utcnow().isoformat()})
    return None


async def run_consultation_pipeline(payload: ConsultationInput) -> PipelineResult:
    session_id = payload.session_id or str(uuid.uuid4())
    db = SessionLocal()

    run_row = db.query(PipelineRun).filter(PipelineRun.session_id == session_id).first()
    if not run_row:
        run_row = PipelineRun(session_id=session_id, patient_id=payload.patient_id, status="in_progress")
        db.add(run_row)
        db.commit()
        db.refresh(run_row)

    result = PipelineResult(session_id=session_id, status="in_progress")
    error_log = []

    def _save_progress():
        run_row.result_json = result.model_dump(mode="json")
        run_row.error_log = error_log
        run_row.updated_at = datetime.utcnow()
        db.commit()

    transcript = payload.transcript or ""

    # RAG optimization: retrieve_relevant_history is only useful if the
    # patient has prior visits indexed. For first-time patients (the common
    # case in testing/demo use), skip the round trip entirely by telling the
    # agent upfront — saves a full tool-call + follow-up LLM call per run.
    prior_visit_count = db.query(Visit).filter(Visit.patient_id == payload.patient_id).count()
    history_hint = (
        "This patient has no prior visits on record — do NOT call retrieve_relevant_history, "
        "there is nothing to find. Skip straight to get_patient_record and get_past_visits."
        if prior_visit_count == 0
        else "This patient has prior visits on record — use retrieve_relevant_history with the "
             "current chief complaint as the query to check for relevant history."
    )
    base_input = f"patient_id: {payload.patient_id}\nconsultation_transcript:\n{transcript}"
    stage1_input = f"{base_input}\n\n[system note] {history_hint}"

    logger.info(f"[{session_id}] Stage 1/6 — Patient History")
    result.patient_history = await _run_stage(
        patient_history_agent, stage1_input, "patient_history",
        PatientHistoryOutput, "Structure this patient history report.", error_log,
    )
    _save_progress()

    logger.info(f"[{session_id}] Stage 2/6 — Clinical Note Writer")
    stage2_input = f"{base_input}\n\npatient_history_context:\n{_json(result.patient_history)}"
    result.clinical_note = await _run_stage(
        clinical_note_agent, stage2_input, "clinical_note",
        ClinicalNoteOutput, "Structure this SOAP clinical note.", error_log,
    )
    _save_progress()

    logger.info(f"[{session_id}] Stage 3/6 — Medical Summary")
    stage3_input = (
        f"clinical_note:\n{_json(result.clinical_note)}\n\n"
        f"patient_history:\n{_json(result.patient_history)}"
    )
    result.consult_summary = await _run_stage(
        medical_summary_agent, stage3_input, "consult_summary",
        ConsultSummaryOutput, "Structure this consultation summary.", error_log,
    )
    _save_progress()

    logger.info(f"[{session_id}] Stage 4/6 — Treatment Planner")
    stage4_input = (
        f"consult_summary:\n{_json(result.consult_summary)}\n\n"
        f"clinical_note:\n{_json(result.clinical_note)}\n\n"
        f"patient_history:\n{_json(result.patient_history)}"
    )
    result.treatment_plan = await _run_stage(
        treatment_planner_agent, stage4_input, "treatment_plan",
        TreatmentPlanOutput, "Structure this treatment and discharge plan.", error_log,
    )
    _save_progress()

    logger.info(f"[{session_id}] Stage 5/6 — Follow-up Coordinator")
    stage5_input = (
        f"patient_id: {payload.patient_id}\n"
        f"treatment_plan:\n{_json(result.treatment_plan)}\n\n"
        f"consult_summary:\n{_json(result.consult_summary)}"
    )
    result.followup_plan = await _run_stage(
        followup_agent, stage5_input, "followup_plan",
        FollowUpPlanOutput, "Structure this follow-up plan.", error_log,
    )
    _save_progress()

    logger.info(f"[{session_id}] Stage 6/6 — Documentation Reviewer")
    stage6_input = (
        f"patient_history:\n{_json(result.patient_history)}\n\n"
        f"clinical_note:\n{_json(result.clinical_note)}\n\n"
        f"consult_summary:\n{_json(result.consult_summary)}\n\n"
        f"treatment_plan:\n{_json(result.treatment_plan)}\n\n"
        f"followup_plan:\n{_json(result.followup_plan)}"
    )
    result.review = await _run_stage(
        documentation_reviewer_agent, stage6_input, "review",
        ReviewResultOutput, "Structure this documentation review.", error_log,
    )

    if transcript:
        index_visit_note(payload.patient_id, f"{session_id}-visit", transcript)

    if error_log and not result.review:
        result.status = "error"
    else:
        result.status = "pending_approval" if (result.review and result.review.requires_human_approval) else "approved"

    run_row.status = result.status
    _save_progress()
    db.close()

    return result
