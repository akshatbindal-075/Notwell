"""
Tool 2 — RAG retrieval over patient history.

Uses a lightweight local vector index (chromadb, embedded/on-disk — no
external service needed) so semantic search over past visit notes works
even without a hosted vector DB. Swap for pgvector/Pinecone in production
by changing only the functions below.
"""
from agents import function_tool
import chromadb
import logging

logger = logging.getLogger("tools.rag")

_client = chromadb.PersistentClient(path="./chroma_store")
_collection = _client.get_or_create_collection("patient_history")


def index_visit_note(patient_id: str, visit_id: str, text: str):
    """Call this after saving a visit — embeds and stores it for later retrieval."""
    try:
        _collection.add(
            ids=[visit_id],
            documents=[text],
            metadatas=[{"patient_id": patient_id}],
        )
    except Exception as e:
        logger.error(f"index_visit_note failed: {e}")


@function_tool
def retrieve_relevant_history(patient_id: str, query: str, top_k: int = 3) -> str:
    """Semantically search a patient's historical notes for context relevant to the query.

    Args:
        patient_id: The unique patient identifier to restrict the search to.
        query: What to search for, e.g. "prior cardiac issues".
        top_k: Number of relevant snippets to return.
    """
    try:
        results = _collection.query(
            query_texts=[query],
            n_results=top_k,
            where={"patient_id": patient_id},
        )
        docs = results.get("documents", [[]])[0]
        if not docs:
            return "No relevant historical records found."
        return "\n---\n".join(docs)
    except Exception as e:
        logger.error(f"retrieve_relevant_history failed: {e}")
        return f"Error retrieving history: {e}"
