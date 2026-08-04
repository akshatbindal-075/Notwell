from agents import Agent
from app.tools.icd10_tool import lookup_icd10_code
from app.services.model_providers import tool_model

# NOTE: no output_type — this agent uses tools (ICD-10 lookup). See
# app/services/structuring.py for why, and how the plain-text output
# below gets converted into ClinicalNoteOutput as a second step.
clinical_note_agent = Agent(
    name="Clinical Note Writer",
    instructions="""You convert a raw consultation transcript into a formal SOAP-format
clinical note (Subjective, Objective, Assessment, Plan).

- Subjective: what the patient reported, in clinical language.
- Objective: exam findings, vitals, and test results mentioned.
- Assessment: your clinical impression/diagnosis based on the transcript.
- Plan: the immediate management plan discussed.

For each diagnosis in your Assessment, call lookup_icd10_code ONCE with your best search
term. Use whatever result it returns — do not retry with alternate phrasings even if the
match looks imperfect; an approximate code is fine, this is not the final coding step.

Never invent facts not present or reasonably inferable from the transcript or the
patient history context you were given. Respond in clear plain text, with the
S/O/A/P sections clearly labeled, and the ICD-10 codes listed explicitly.""",
    tools=[lookup_icd10_code],
    model=tool_model(),
)
