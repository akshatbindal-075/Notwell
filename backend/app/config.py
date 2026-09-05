"""
Central configuration. All secrets come from environment variables —
never hardcode keys. Copy .env.example to .env and fill in values.
"""
import os
from dotenv import load_dotenv

load_dotenv()


BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEFAULT_DB_PATH = os.path.join(BASE_DIR, "clinical_assistant.db")
DEFAULT_SESSION_DB_PATH = os.path.join(BASE_DIR, "sessions.db")


class Settings:
    # --- LLM Providers (no OpenAI key required) ---
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    GROQ_BASE_URL: str = "https://api.groq.com/openai/v1"

    OPENROUTER_API_KEY: str = os.getenv("OPENROUTER_API_KEY", "")
    OPENROUTER_BASE_URL: str = "https://openrouter.ai/api/v1"

    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_BASE_URL: str = "https://generativelanguage.googleapis.com/v1beta/openai/"

    # --- Model assignment per agent (override via env if needed) ---
    MODEL_FAST: str = os.getenv("MODEL_FAST", "openai/gpt-oss-20b")
    MODEL_REASONING: str = os.getenv("MODEL_REASONING", "openai/gpt-oss-120b")
    MODEL_LONGCTX: str = os.getenv("MODEL_LONGCTX", "gemini-3.6-flash")

    # --- Database ---
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{DEFAULT_DB_PATH}")

    # --- Session persistence ---
    SESSION_DB_PATH: str = os.getenv("SESSION_DB_PATH", DEFAULT_SESSION_DB_PATH)

    # --- External tool APIs ---
    ICD10_API_BASE: str = "https://clinicaltables.nlm.nih.gov/api/icd10cm/v3/search"  # free, no key needed
    SENDGRID_API_KEY: str = os.getenv("SENDGRID_API_KEY", "")
    SENDGRID_FROM_EMAIL: str = os.getenv("SENDGRID_FROM_EMAIL", "noreply@example.com")

    # --- App ---
    ENV: str = os.getenv("ENV", "development")
    ALLOWED_ORIGINS: list = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")


settings = Settings()
