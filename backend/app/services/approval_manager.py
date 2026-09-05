"""
Human approval gate. The Documentation Reviewer agent always flags
requires_human_approval=True — this module records the clinician's
decision and finalizes (or rejects) the pipeline run.
"""
import logging
from app.db.database import SessionLocal
from app.db.models import PipelineRun, ApprovalRecord
from app.models.schemas import ApprovalDecision

logger = logging.getLogger("approval_manager")


def record_approval_decision(decision: ApprovalDecision) -> dict:
    db = SessionLocal()
    try:
        run_row = db.query(PipelineRun).filter(PipelineRun.session_id == decision.session_id).first()
        if not run_row:
            return {"error": f"No pipeline run found for session_id={decision.session_id}"}

        approval = ApprovalRecord(
            pipeline_run_id=run_row.id,
            approved=decision.approved,
            reviewer_name=decision.reviewer_name,
            comments=decision.comments,
            edited_fields=decision.edited_fields or {},
        )
        db.add(approval)

        if decision.approved:
            run_row.status = "approved"
            if decision.edited_fields:
                merged = dict(run_row.result_json or {})
                for k, v in decision.edited_fields.items():
                    if isinstance(v, dict) and isinstance(merged.get(k), dict):
                        merged[k] = {**merged[k], **v}
                    else:
                        merged[k] = v
                run_row.result_json = merged
        else:
            run_row.status = "rejected"

        db.commit()
        logger.info(f"Session {decision.session_id} — approval={decision.approved} by {decision.reviewer_name}")
        return {"session_id": decision.session_id, "status": run_row.status}
    except Exception as e:
        logger.error(f"record_approval_decision failed: {e}")
        return {"error": str(e)}
    finally:
        db.close()
