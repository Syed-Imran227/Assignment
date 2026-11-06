import uuid
import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.app.database import get_db
from backend.app.models import Hypothesis, MissingEvidence, AuditLog
from backend.app.schemas import HypothesisConfirmRequest, MissingEvidenceAddRequest

router = APIRouter()

@router.patch("/hypotheses/{hypo_id}/confirm")
async def confirm_hypothesis(
    hypo_id: str,
    payload: HypothesisConfirmRequest,
    db: AsyncSession = Depends(get_db)
):
    hypo = await db.get(Hypothesis, hypo_id)
    if not hypo:
        raise HTTPException(status_code=404, detail="Hypothesis not found")

    if not payload.confirmed_by or not payload.confirmed_role:
        raise HTTPException(status_code=400, detail="Confirmation requires investigator name and qualified role.")

    # Rule: Confirming requires at least one linked evidence item
    evidence_count = len(payload.evidence_ids) or len(hypo.evidence_for or [])
    if evidence_count == 0:
        raise HTTPException(
            status_code=400,
            detail="A root cause cannot be confirmed without at least one supporting evidence item."
        )

    before_state = {
        "strength": hypo.strength,
        "confirmed_by": hypo.confirmed_by
    }

    hypo.strength = "confirmed"
    hypo.confirmed_by = payload.confirmed_by
    hypo.confirmed_role = payload.confirmed_role
    hypo.confirmed_at = datetime.datetime.utcnow()

    audit = AuditLog(
        id=str(uuid.uuid4()),
        investigation_id=hypo.investigation_id,
        actor_type="human",
        actor_label=f"{payload.confirmed_by} ({payload.confirmed_role})",
        action="confirm_root_cause",
        entity="hypothesis",
        before_state=before_state,
        after_state={
            "hypothesis_id": hypo.id,
            "statement": hypo.statement,
            "strength": "confirmed",
            "confirmed_by": hypo.confirmed_by,
            "confirmed_role": hypo.confirmed_role
        }
    )
    db.add(audit)
    await db.commit()
    await db.refresh(hypo)

    return {
        "id": hypo.id,
        "strength": hypo.strength,
        "confirmed_by": hypo.confirmed_by,
        "confirmed_role": hypo.confirmed_role,
        "confirmed_at": hypo.confirmed_at.isoformat()
    }

@router.post("/investigations/{inv_id}/evidence")
async def add_missing_evidence(
    inv_id: str,
    payload: MissingEvidenceAddRequest,
    db: AsyncSession = Depends(get_db)
):
    now = datetime.datetime.utcnow()
    item_id = str(uuid.uuid4())

    item = MissingEvidence(
        id=item_id,
        investigation_id=inv_id,
        item_title=payload.item_title or "Supplemental Investigation Evidence",
        why_it_matters="Investigator supplemental input",
        linked_hypothesis_id=payload.linked_hypothesis_id,
        priority="medium",
        status="received",
        received_at=now,
        received_content=payload.received_content
    )
    db.add(item)

    audit = AuditLog(
        id=str(uuid.uuid4()),
        investigation_id=inv_id,
        actor_type="human",
        actor_label="Quality Investigator",
        action="provide_supplemental_evidence",
        entity="missing_evidence",
        before_state=None,
        after_state={"item_title": item.item_title, "content_len": len(payload.received_content)}
    )
    db.add(audit)
    await db.commit()
    await db.refresh(item)

    return {
        "id": item.id,
        "item_title": item.item_title,
        "status": item.status,
        "received_at": item.received_at.isoformat() if item.received_at else None
    }

