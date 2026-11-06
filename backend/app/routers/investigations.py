import uuid
import datetime
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from backend.app.database import get_db
from backend.app.models import (
    Investigation, AuditLog, SourceDocument, Hypothesis, 
    WhyChain, FishboneCause, MissingEvidence, CAPAAction, ChatMessage
)
from backend.app.schemas import InvestigationCreate, InvestigationUpdate, FormFields, AIAssessment

router = APIRouter()

async def generate_rca_number(db: AsyncSession) -> str:
    """Generate sequential RCA number like RCA-2026-0001."""
    now = datetime.datetime.utcnow()
    year = now.year
    prefix = f"RCA-{year}-"
    stmt = select(Investigation).where(Investigation.rca_number.like(f"{prefix}%")).order_by(desc(Investigation.created_at))
    result = await db.execute(stmt)
    latest = result.scalars().first()
    if not latest:
        return f"{prefix}0001"
    try:
        last_num = int(latest.rca_number.split("-")[-1])
        return f"{prefix}{last_num + 1:04d}"
    except Exception:
        return f"{prefix}{uuid.uuid4().hex[:4].upper()}"

@router.get("/investigations")
async def list_investigations(db: AsyncSession = Depends(get_db)):
    stmt = select(Investigation).order_by(desc(Investigation.updated_at))
    result = await db.execute(stmt)
    invs = result.scalars().all()
    return [
        {
            "id": inv.id,
            "rca_number": inv.rca_number,
            "title": inv.title,
            "product_name": inv.product_name,
            "batch_number": inv.batch_number,
            "classification": inv.classification,
            "status": inv.status,
            "version": inv.version,
            "is_locked": inv.is_locked,
            "created_at": inv.created_at.isoformat() if inv.created_at else None,
            "updated_at": inv.updated_at.isoformat() if inv.updated_at else None,
        }
        for inv in invs
    ]

@router.post("/investigations")
async def create_investigation(payload: InvestigationCreate, db: AsyncSession = Depends(get_db)):
    inv_id = str(uuid.uuid4())
    rca_no = await generate_rca_number(db)
    
    empty_form = FormFields().model_dump()
    empty_assessment = AIAssessment().model_dump()

    inv = Investigation(
        id=inv_id,
        rca_number=rca_no,
        title=payload.title or f"Investigation {rca_no}",
        classification="major",
        status="draft",
        version=1,
        is_locked=False,
        form_data=empty_form,
        ai_assessment=empty_assessment
    )
    db.add(inv)

    # Initial audit log
    audit = AuditLog(
        id=str(uuid.uuid4()),
        investigation_id=inv_id,
        actor_type="human",
        actor_label="Quality Lead",
        action="create_investigation",
        entity="investigation",
        before_state=None,
        after_state={"rca_number": rca_no, "title": inv.title}
    )
    db.add(audit)
    await db.commit()
    await db.refresh(inv)
    return {"id": inv.id, "rca_number": inv.rca_number, "status": "draft"}

@router.get("/investigations/{inv_id}")
async def get_investigation(inv_id: str, db: AsyncSession = Depends(get_db)):
    inv = await db.get(Investigation, inv_id)
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation not found")

    # Fetch related collections
    sources_res = await db.execute(select(SourceDocument).where(SourceDocument.investigation_id == inv_id))
    hypotheses_res = await db.execute(select(Hypothesis).where(Hypothesis.investigation_id == inv_id).order_by(Hypothesis.rank))
    whys_res = await db.execute(select(WhyChain).where(WhyChain.investigation_id == inv_id))
    fishbone_res = await db.execute(select(FishboneCause).where(FishboneCause.investigation_id == inv_id))
    missing_res = await db.execute(select(MissingEvidence).where(MissingEvidence.investigation_id == inv_id))
    capa_res = await db.execute(select(CAPAAction).where(CAPAAction.investigation_id == inv_id))
    chat_res = await db.execute(select(ChatMessage).where(ChatMessage.investigation_id == inv_id).order_by(ChatMessage.created_at))

    return {
        "id": inv.id,
        "rca_number": inv.rca_number,
        "title": inv.title,
        "product_name": inv.product_name,
        "batch_number": inv.batch_number,
        "classification": inv.classification,
        "status": inv.status,
        "version": inv.version,
        "is_locked": inv.is_locked,
        "form_data": inv.form_data or {},
        "ai_assessment": inv.ai_assessment or {},
        "created_at": inv.created_at.isoformat() if inv.created_at else None,
        "updated_at": inv.updated_at.isoformat() if inv.updated_at else None,
        "sources": [
            {
                "id": s.id, "kind": s.kind, "filename": s.filename,
                "created_at": s.created_at.isoformat() if s.created_at else None,
                "text_snippet": s.raw_text[:200] + "..." if len(s.raw_text) > 200 else s.raw_text
            }
            for s in sources_res.scalars().all()
        ],
        "hypotheses": [
            {
                "id": h.id, "statement": h.statement, "category": h.category,
                "qualitative_likelihood": h.qualitative_likelihood, "strength": h.strength,
                "rank": h.rank, "evidence_for": h.evidence_for or [],
                "evidence_against": h.evidence_against or [], "evidence_needed": h.evidence_needed or [],
                "confirmed_by": h.confirmed_by, "confirmed_role": h.confirmed_role,
                "confirmed_at": h.confirmed_at.isoformat() if h.confirmed_at else None
            }
            for h in hypotheses_res.scalars().all()
        ],
        "why_chains": [
            {
                "id": w.id, "branch_title": w.branch_title, "steps": w.steps or [],
                "terminal_cause": w.terminal_cause, "category": w.category
            }
            for w in whys_res.scalars().all()
        ],
        "fishbone_causes": [
            {
                "id": f.id, "category": f.category, "cause_text": f.cause_text,
                "status": f.status, "evidence_quote": f.evidence_quote
            }
            for f in fishbone_res.scalars().all()
        ],
        "missing_evidence": [
            {
                "id": m.id, "item_title": m.item_title, "why_it_matters": m.why_it_matters,
                "priority": m.priority, "status": m.status, "linked_hypothesis_id": m.linked_hypothesis_id,
                "requested_at": m.requested_at.isoformat() if m.requested_at else None,
                "received_at": m.received_at.isoformat() if m.received_at else None,
                "received_content": m.received_content
            }
            for m in missing_res.scalars().all()
        ],
        "capa_actions": [
            {
                "id": c.id, "action_type": c.action_type, "description": c.description,
                "rationale": c.rationale, "owner_role": c.owner_role,
                "due_offset_days": c.due_offset_days, "target_date": c.target_date,
                "priority": c.priority, "effectiveness_check": c.effectiveness_check or {},
                "status": c.status, "linked_hypothesis_id": c.linked_hypothesis_id
            }
            for c in capa_res.scalars().all()
        ],
        "chat_messages": [
            {
                "id": msg.id, "role": msg.role, "content": msg.content,
                "tool_calls": msg.tool_calls or [],
                "created_at": msg.created_at.isoformat() if msg.created_at else None
            }
            for msg in chat_res.scalars().all()
        ]
    }

@router.patch("/investigations/{inv_id}")
async def update_investigation(inv_id: str, payload: InvestigationUpdate, db: AsyncSession = Depends(get_db)):
    inv = await db.get(Investigation, inv_id)
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation not found")
    if inv.is_locked:
        raise HTTPException(status_code=400, detail="Cannot edit a locked investigation revision. Reopen to edit.")

    before_state = {
        "title": inv.title,
        "classification": inv.classification,
        "status": inv.status,
        "form_data": inv.form_data
    }

    if payload.title is not None:
        inv.title = payload.title
    if payload.classification is not None:
        inv.classification = payload.classification
    if payload.status is not None:
        inv.status = payload.status
    if payload.ai_assessment is not None:
        inv.ai_assessment = payload.ai_assessment
    if payload.form_data is not None:
        # Merge form fields
        current = inv.form_data or {}
        for k, v in payload.form_data.items():
            current[k] = v
        inv.form_data = current

        # Update top-level shortcuts
        if "product_name" in current and isinstance(current["product_name"], dict):
            inv.product_name = current["product_name"].get("value")
        if "batch_number" in current and isinstance(current["batch_number"], dict):
            inv.batch_number = current["batch_number"].get("value")

    inv.updated_at = datetime.datetime.utcnow()

    # Write audit log
    audit = AuditLog(
        id=str(uuid.uuid4()),
        investigation_id=inv_id,
        actor_type="human",
        actor_label="Quality Investigator",
        action="patch_investigation",
        entity="investigation",
        before_state=before_state,
        after_state={"title": inv.title, "form_data": inv.form_data}
    )
    db.add(audit)
    await db.commit()
    await db.refresh(inv)
    return {"status": "ok", "version": inv.version}

@router.post("/investigations/{inv_id}/save")
async def save_investigation(inv_id: str, db: AsyncSession = Depends(get_db)):
    """Validation checklist, bumps version, and locks record."""
    inv = await db.get(Investigation, inv_id)
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation not found")

    # Fetch hypotheses and capa to validate
    hypo_res = await db.execute(select(Hypothesis).where(Hypothesis.investigation_id == inv_id))
    hypos = hypo_res.scalars().all()
    confirmed_hypos = [h for h in hypos if h.strength == "confirmed"]

    capa_res = await db.execute(select(CAPAAction).where(CAPAAction.investigation_id == inv_id))
    capas = capa_res.scalars().all()
    accepted_capas = [c for c in capas if c.status == "accepted"]

    # Validation checklist
    checklist = {
        "product_specified": bool(inv.product_name or (inv.form_data or {}).get("product_name", {}).get("value")),
        "batch_specified": bool(inv.batch_number or (inv.form_data or {}).get("batch_number", {}).get("value")),
        "root_cause_addressed": len(confirmed_hypos) > 0 or len(hypos) > 0,
        "capa_defined": len(accepted_capas) > 0 or len(capas) > 0,
        "attestation_recorded": any(h.confirmed_by for h in confirmed_hypos) if confirmed_hypos else True
    }

    inv.status = "reviewed"
    inv.is_locked = True
    inv.updated_at = datetime.datetime.utcnow()

    audit = AuditLog(
        id=str(uuid.uuid4()),
        investigation_id=inv_id,
        actor_type="human",
        actor_label="Quality Lead (Signed)",
        action="lock_and_save_revision",
        entity="investigation",
        before_state={"is_locked": False, "version": inv.version},
        after_state={"is_locked": True, "version": inv.version, "checklist": checklist}
    )
    db.add(audit)
    await db.commit()
    return {"status": "locked", "version": inv.version, "checklist": checklist}

@router.post("/investigations/{inv_id}/reopen")
async def reopen_investigation(inv_id: str, db: AsyncSession = Depends(get_db)):
    """Creates a new editable draft revision."""
    inv = await db.get(Investigation, inv_id)
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation not found")

    inv.version += 1
    inv.is_locked = False
    inv.status = "draft"
    inv.updated_at = datetime.datetime.utcnow()

    audit = AuditLog(
        id=str(uuid.uuid4()),
        investigation_id=inv_id,
        actor_type="human",
        actor_label="Quality Lead",
        action="reopen_new_version",
        entity="investigation",
        before_state={"version": inv.version - 1, "is_locked": True},
        after_state={"version": inv.version, "is_locked": False}
    )
    db.add(audit)
    await db.commit()
    return {"status": "reopened", "version": inv.version}

