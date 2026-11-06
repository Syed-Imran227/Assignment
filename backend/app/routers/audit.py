from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from backend.app.database import get_db
from backend.app.models import AuditLog

router = APIRouter()

@router.get("/investigations/{inv_id}/audit")
async def get_audit_trail(
    inv_id: str,
    actor_type: Optional[str] = Query(None, description="Filter by human, ai, or system"),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(AuditLog).where(AuditLog.investigation_id == inv_id)
    if actor_type:
        stmt = stmt.where(AuditLog.actor_type == actor_type)
    stmt = stmt.order_by(desc(AuditLog.created_at))

    result = await db.execute(stmt)
    logs = result.scalars().all()

    return [
        {
            "id": log.id,
            "actor_type": log.actor_type,
            "actor_label": log.actor_label,
            "action": log.action,
            "entity": log.entity,
            "before_state": log.before_state,
            "after_state": log.after_state,
            "created_at": log.created_at.isoformat() if log.created_at else None
        }
        for log in logs
    ]
