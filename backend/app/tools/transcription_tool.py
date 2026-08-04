"""
Tool 3 — Audio transcription via Groq's Whisper endpoint.
This is what satisfies the multi-modal input requirement: a doctor can
upload/record raw consultation audio and it becomes text for the pipeline.
"""
from agents import function_tool
from openai import AsyncOpenAI
from app.config import settings
import logging

logger = logging.getLogger("tools.transcription")

_groq_audio_client = AsyncOpenAI(api_key=settings.GROQ_API_KEY, base_url=settings.GROQ_BASE_URL)


@function_tool
async def transcribe_consultation_audio(audio_file_path: str) -> str:
    """Transcribe a consultation audio recording into text.

    Args:
        audio_file_path: Local path to the audio file (wav/mp3/m4a).
    """
    try:
        with open(audio_file_path, "rb") as f:
            resp = await _groq_audio_client.audio.transcriptions.create(
                model="whisper-large-v3",
                file=f,
            )
        return resp.text
    except Exception as e:
        logger.error(f"transcribe_consultation_audio failed: {e}")
        return f"Error transcribing audio: {e}"
