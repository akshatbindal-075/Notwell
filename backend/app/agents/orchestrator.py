"""
Wires the 6 specialist agents into a handoff chain:

  Patient History -> Clinical Note Writer -> Medical Summary
    -> Treatment Planner -> Follow-up Coordinator -> Documentation Reviewer

Each agent's `handoffs` list points to the next agent, using the SDK's
native handoff() mechanism. Runner.run(patient_history_agent, ...) will
then traverse the whole chain automatically, with each agent's structured
output threaded into context for the next.

Documentation Reviewer is the terminal agent — its ReviewResultOutput
always requires_human_approval, which the API layer intercepts to pause
the pipeline for a human decision (see services/approval_manager.py).
"""
from agents import handoff
from pydantic import BaseModel, Field
from app.agents.patient_history_agent import patient_history_agent
from app.agents.clinical_note_agent import clinical_note_agent
from app.agents.medical_summary_agent import medical_summary_agent
from app.agents.treatment_planner_agent import treatment_planner_agent
from app.agents.followup_agent import followup_agent
from app.agents.documentation_reviewer_agent import documentation_reviewer_agent


class _NoHandoffData(BaseModel):
    """Minimal input schema for handoffs that pass no meaningful data.

    NOTE: an entirely empty model (no fields) still breaks Groq's strict
    schema validation — the SDK's schema-tightening step prunes the empty
    'properties' object but leaves a stray 'required' key behind. Giving
    the model one real optional field keeps 'properties' non-empty and
    avoids that bug.
    """
    reason: str = Field(default="", description="Optional short reason for this handoff.")


def _noop_on_handoff(ctx, input_data: _NoHandoffData) -> None:
    return None


def _chain(agent):
    return handoff(agent, input_type=_NoHandoffData, on_handoff=_noop_on_handoff)


# Build the chain — each agent hands off to exactly the next specialist.
patient_history_agent.handoffs = [_chain(clinical_note_agent)]
clinical_note_agent.handoffs = [_chain(medical_summary_agent)]
medical_summary_agent.handoffs = [_chain(treatment_planner_agent)]
treatment_planner_agent.handoffs = [_chain(followup_agent)]
followup_agent.handoffs = [_chain(documentation_reviewer_agent)]
# documentation_reviewer_agent is terminal — no further handoff.

# Entry point for the whole pipeline.
ENTRY_AGENT = patient_history_agent

PIPELINE_ORDER = [
    patient_history_agent,
    clinical_note_agent,
    medical_summary_agent,
    treatment_planner_agent,
    followup_agent,
    documentation_reviewer_agent,
]
