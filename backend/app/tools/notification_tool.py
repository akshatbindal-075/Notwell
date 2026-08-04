"""
Tool 7 — Sends follow-up reminder notifications.
Uses SendGrid if SENDGRID_API_KEY is set; otherwise logs the message
(safe default for local dev / demo without needing another API key).
"""
from agents import function_tool
from app.config import settings
import logging

logger = logging.getLogger("tools.notification")


@function_tool
def send_followup_reminder(patient_contact: str, message: str, channel: str = "email") -> str:
    """Send a follow-up reminder to a patient.

    Args:
        patient_contact: Email address or phone number of the patient.
        message: The reminder text to send.
        channel: 'email' or 'sms'.
    """
    if not settings.SENDGRID_API_KEY:
        logger.info(f"[NOTIFICATION - DEMO MODE] To: {patient_contact} via {channel}: {message}")
        return f"(Demo mode — no SENDGRID_API_KEY set) Logged reminder to {patient_contact}."

    try:
        import sendgrid
        from sendgrid.helpers.mail import Mail

        sg = sendgrid.SendGridAPIClient(api_key=settings.SENDGRID_API_KEY)
        mail = Mail(
            from_email=settings.SENDGRID_FROM_EMAIL,
            to_emails=patient_contact,
            subject="Follow-up Reminder",
            plain_text_content=message,
        )
        sg.send(mail)
        return f"Reminder sent to {patient_contact} via {channel}."
    except Exception as e:
        logger.error(f"send_followup_reminder failed: {e}")
        return f"Error sending reminder: {e}"
