import uuid
import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.database import get_db
from backend.app.models import CAPAAction, AuditLog
from backend.app.schemas import CAPAUpdateRequest

router = APIRouter()

@router.patch("/capa/{capa_id}")
async def update_capa(
    capa_id: str,
    payload: CAPAUpdateRequest,
    db: AsyncSession = Depends(get_db)
):
    capa = await db.get(CAPAAction, capa_id)
    if not capa:
        raise HTTPException(status_code=404, detail="CAPA action not found")

    before_state = {
        "status": capa.status,
        "description": capa.description,
        "owner_role": capa.owner_role,
        "due_offset_days": capa.due_offset_days
    }

    if payload.status is not None:
        capa.status = payload.status
    if payload.action_type is not None:
        capa.action_type = payload.action_type
    if payload.description is not None:
        capa.description = payload.description
    if payload.rationale is not None:
        capa.rationale = payload.rationale
    if payload.owner_role is not None:
        capa.owner_role = payload.owner_role
    if payload.due_offset_days is not None:
        capa.due_offset_days = payload.due_offset_days
    if payload.priority is not None:
        capa.priority = payload.priority

    audit = AuditLog(
        id=str(uuid.uuid4()),
        investigation_id=capa.investigation_id,
        actor_type="human",
        actor_label="Quality Lead",
        action="update_capa_action",
        entity="capa_action",
        before_state=before_state,
        after_state={
            "capa_id": capa.id,
            "status": capa.status,
            "description": capa.description,
            "owner_role": capa.owner_role
        }
    )
    db.add(audit)
    await db.commit()
    await db.refresh(capa)

    return {
        "id": capa.id,
        "status": capa.status,
        "action_type": capa.action_type,
        "description": capa.description,
        "owner_role": capa.owner_role,
        "due_offset_days": capa.due_offset_days
    }
