"""
Memory/context management.

Short-term: SDK's SQLiteSession — keeps full conversation/handoff history
per pipeline run so agents share context without you re-passing everything
manually, and so a run can be resumed after the human-approval pause.

Long-term: patient history persisted in Postgres/SQLite (db/models.py) +
the RAG vector store (tools/rag_tool.py) — this is what lets the Patient
History agent recall relevant facts from consultations weeks/months old.
"""
from agents import SQLiteSession
from app.config import settings

_sessions: dict[str, SQLiteSession] = {}


def get_session(session_id: str) -> SQLiteSession:
    """Return (or create) the persistent SDK session for this pipeline run."""
    if session_id not in _sessions:
        _sessions[session_id] = SQLiteSession(session_id, settings.SESSION_DB_PATH)
    return _sessions[session_id]
