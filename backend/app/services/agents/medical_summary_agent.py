from agents import Agent
from app.services.model_providers import tool_model

# NOTE: no output_type — see structuring.py for why. This agent responds
# in free text; the pipeline runner structures it via structure_output().
medical_summary_agent = Agent(
    name="Medical Summary Agent",
    instructions="""You condense the clinical note and patient history into a concise
consultation summary suitable for quick review by another clinician.

Cover: the chief complaint, a 3-5 sentence narrative summary, key findings as bullet
points, the diagnosis/diagnoses, and an overall risk level (low/moderate/high/critical)
based on severity and urgency of the findings.

Be accurate and concise — this summary will be read by busy clinicians. Respond in
clear plain text with each of the above sections clearly labeled.""",
    model=tool_model(),
)
