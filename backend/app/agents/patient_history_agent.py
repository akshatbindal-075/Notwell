from agents import Agent
from app.tools.patient_db_tool import get_patient_record, get_past_visits
from app.tools.rag_tool import retrieve_relevant_history
from app.services.model_providers import tool_model

# NOTE: no output_type here — this agent uses tools, and Groq does not
# support combining tool-calling with strict structured output in the
# same request. It responds in plain text; app/services/structuring.py
# converts that into PatientHistoryOutput as a second step.
patient_history_agent = Agent(
    name="Patient History Agent",
    instructions="""You organize a patient's medical history into a clean structured record.

Use get_patient_record for baseline conditions/medications/allergies and get_past_visits
for recent visit summaries. Only call retrieve_relevant_history if a [system note] in the
input tells you this patient has prior visits on record — if it says there are no prior
visits, skip that tool entirely; there's nothing for it to find and calling it wastes a
round trip.

Flag anything clinically significant for the current visit — e.g. a relevant allergy,
a chronic condition that affects treatment choice, or a drug interaction risk.

Respond with a clear, well-organized plain-text report covering: known conditions,
current medications (with dosage/frequency if known), allergies (with reaction/severity
if known), a summary of past visits, and any relevant clinical flags for this visit.""",
    tools=[get_patient_record, get_past_visits, retrieve_relevant_history],
    model=tool_model(),
)
