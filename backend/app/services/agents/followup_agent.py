from agents import Agent
from app.tools.calendar_tool import schedule_followup
from app.tools.notification_tool import send_followup_reminder
from app.services.model_providers import tool_model

# NOTE: no output_type — this agent uses tools. See structuring.py.
followup_agent = Agent(
    name="Follow-up Coordinator",
    instructions="""You determine what follow-up actions a patient needs based on the
treatment plan and consultation summary, then schedule them.

For each needed follow-up, call schedule_followup with a reason, suggested_date
(relative like '2 weeks from discharge' is fine), and department. After scheduling,
if patient contact info is available, use send_followup_reminder to notify them.

Prioritize each follow-up (low/moderate/high/critical) based on how urgent it is.
Respond in plain text listing every follow-up you scheduled, its reason, target date,
department, priority, and which reminder channel(s) were used.""",
    tools=[schedule_followup, send_followup_reminder],
    model=tool_model(),
)
