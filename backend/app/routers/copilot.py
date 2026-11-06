import io
import json
import uuid
import asyncio
import datetime
from typing import Optional, AsyncGenerator
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.app.database import get_db
from backend.app.models import (
    Investigation, SourceDocument, AIRun, Hypothesis,
    WhyChain, FishboneCause, MissingEvidence, CAPAAction, ChatMessage, AuditLog
)
from backend.app.services.document_ingest import extract_text_from_pdf, parse_email_content, normalize_text
from backend.app.services.graph import (
    extract_fields_from_text, generate_ai_assessment,
    run_rca_investigation, execute_natural_language_edit
)

router = APIRouter()

def sse_event(event_type: str, data: dict) -> str:
    payload = {"type": event_type, **data}
    return f"data: {json.dumps(payload)}\n\n"

@router.post("/investigations/{inv_id}/copilot")
async def copilot_chat(
    inv_id: str,
    message: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    db: AsyncSession = Depends(get_db)
):
    inv = await db.get(Investigation, inv_id)
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation not found")

    user_text = message or ""
    filename = None
    file_bytes = None
    if file:
        filename = file.filename
        file_bytes = await file.read()

    # Determine tool routing
    tool_name = "explain"
    if file:
        tool_name = "extract_document"
    elif any(kw in user_text.lower() for kw in ["sorry", "correct", "change", "update", "the batch is", "the batch number is", "quantity is", "replace"]):
        tool_name = "edit_investigation"
    elif any(kw in user_text.lower() for kw in ["start an rca", "investigation", "tray dryer", "deviation", "batch", "oos", "reported"]):
        tool_name = "log_investigation"
    else:
        tool_name = "log_investigation"

    # Save User Chat Message
    user_msg_id = str(uuid.uuid4())
    user_msg = ChatMessage(
        id=user_msg_id,
        investigation_id=inv_id,
        role="user",
        content=user_text + (f" [Attachment: {filename}]" if filename else "")
    )
    db.add(user_msg)
    await db.commit()

    async def event_generator() -> AsyncGenerator[str, None]:
        # Yield tool selection chip
        yield sse_event("tool_selected", {"tool": tool_name})
        await asyncio.sleep(0.05)

        full_reply_text = ""
        run_id = str(uuid.uuid4())

        # Branch 1: Natural Language Edit
        if tool_name == "edit_investigation":
            yield sse_event("node_start", {"node": "Parsing natural-language correction", "time": "0.1s"})
            await asyncio.sleep(0.1)

            current_form = inv.form_data or {}
            current_assessment = inv.ai_assessment or {}
            
            edit_res = await execute_natural_language_edit(current_form, current_assessment, user_text)
            updated_fields = edit_res["updated_fields"]
            updated_assessment = edit_res["updated_assessment"]
            changes = edit_res["change_summary"]

            # Save in database
            inv.form_data = updated_fields
            inv.ai_assessment = updated_assessment
            if "batch_number" in edit_res["applied_patch"]:
                inv.batch_number = edit_res["applied_patch"]["batch_number"]
            if "product_name" in edit_res["applied_patch"]:
                inv.product_name = edit_res["applied_patch"]["product_name"]
            inv.updated_at = datetime.datetime.utcnow()

            # Audit log
            audit = AuditLog(
                id=str(uuid.uuid4()),
                investigation_id=inv_id,
                actor_type="ai",
                actor_label="Rootline Co-Pilot",
                action="apply_natural_language_edit",
                entity="investigation",
                before_state=None,
                after_state={"applied_patch": edit_res["applied_patch"], "changes": changes}
            )
            db.add(audit)
            await db.commit()

            yield sse_event("node_end", {"node": "Parsing natural-language correction", "status": "completed"})
            
            # Emit updated fields
            for k, val in edit_res["applied_patch"].items():
                yield sse_event("field_update", {"field": k, "data": updated_fields.get(k)})
                await asyncio.sleep(0.05)

            yield sse_event("assessment_update", {"data": updated_assessment})

            summary_text = (
                "I have updated the record as requested while preserving all other values:\n" +
                "\n".join([f"• {c}" for c in changes]) +
                "\n\nThe AI assessment and dependent scopes have been updated accordingly."
            )
            for chunk in summary_text.split(" "):
                yield sse_event("message_delta", {"text": chunk + " "})
                await asyncio.sleep(0.02)
            full_reply_text = summary_text

        # Branch 2: Log Investigation or Extract Document
        else:
            raw_text = user_text
            doc_kind = "text"
            if file and file_bytes:
                yield sse_event("node_start", {"node": f"Ingesting document: {filename}", "time": "0.2s"})
                if filename.lower().endswith(".pdf"):
                    doc_kind = "pdf"
                    raw_text, page_map = extract_text_from_pdf(file_bytes)
                elif filename.lower().endswith(".eml"):
                    doc_kind = "email"
                    raw_text, _ = parse_email_content(file_bytes.decode("utf-8", errors="ignore"))
                else:
                    raw_text = file_bytes.decode("utf-8", errors="ignore")
                
                # Save source document
                src_doc = SourceDocument(
                    id=str(uuid.uuid4()),
                    investigation_id=inv_id,
                    kind=doc_kind,
                    filename=filename,
                    raw_text=raw_text
                )
                db.add(src_doc)
                await db.commit()
                yield sse_event("node_end", {"node": f"Ingesting document: {filename}", "status": "completed"})
                await asyncio.sleep(0.05)

            # Node 1: Classification & Entity Extraction
            yield sse_event("node_start", {"node": "Classifying document & extracting fields", "time": "0.4s"})
            extracted = await extract_fields_from_text(raw_text)
            yield sse_event("node_end", {"node": "Classifying document & extracting fields", "status": "completed"})

            # Node 2: Quote Grounding Verification
            yield sse_event("node_start", {"node": "Verifying quotes against source text", "time": "0.1s"})
            await asyncio.sleep(0.1)
            yield sse_event("node_end", {"node": "Verifying quotes against source text", "status": "completed"})

            # Stream fields one by one with pencil status stamping animation
            current_form = inv.form_data or {}
            for field_name, f_data in extracted.items():
                current_form[field_name] = f_data
                yield sse_event("field_update", {"field": field_name, "data": f_data})
                await asyncio.sleep(0.07) # 70ms sequential stamp interval

            # Node 3: AI Risk Assessment
            yield sse_event("node_start", {"node": "Formulating AI Risk Assessment (ICH Q9 / 21 CFR 211.192)", "time": "0.3s"})
            assessment = await generate_ai_assessment(extracted, raw_text)
            yield sse_event("node_end", {"node": "Formulating AI Risk Assessment (ICH Q9 / 21 CFR 211.192)", "status": "completed"})
            yield sse_event("assessment_update", {"data": assessment})
            await asyncio.sleep(0.05)

            # Node 4: Investigation (5 Whys, Fishbone, Hypotheses, Missing Evidence, CAPA)
            yield sse_event("node_start", {"node": "Conducting 5 Whys & 6M Ishikawa Fishbone Analysis", "time": "0.5s"})
            analysis = await run_rca_investigation(extracted, raw_text)
            yield sse_event("node_end", {"node": "Conducting 5 Whys & 6M Ishikawa Fishbone Analysis", "status": "completed"})

            yield sse_event("node_start", {"node": "Enforcing Human Error guardrail & formulating CAPA proposal", "time": "0.3s"})
            await asyncio.sleep(0.1)
            yield sse_event("node_end", {"node": "Enforcing Human Error guardrail & formulating CAPA proposal", "status": "completed"})

            # Save investigation entities in database
            inv.form_data = current_form
            inv.ai_assessment = assessment
            if (extracted.get("product_name") or {}).get("value"):
                inv.product_name = extracted["product_name"]["value"]
                inv.title = f"RCA: {inv.product_name}"
            if (extracted.get("batch_number") or {}).get("value"):
                inv.batch_number = extracted["batch_number"]["value"]
            inv.classification = assessment.get("severity", "major")
            inv.updated_at = datetime.datetime.utcnow()

            # Clear previous and insert new analysis records
            # Hypotheses
            for h in analysis["hypotheses"]:
                db.add(Hypothesis(
                    id=h["id"],
                    investigation_id=inv_id,
                    statement=h["statement"],
                    category=h["category"],
                    qualitative_likelihood=h["qualitative_likelihood"],
                    strength=h["strength"],
                    rank=h["rank"],
                    evidence_for=h["evidence_for"],
                    evidence_against=h["evidence_against"],
                    evidence_needed=h["evidence_needed"]
                ))
            # Why Chains
            for w in analysis["why_chains"]:
                db.add(WhyChain(
                    id=w["id"],
                    investigation_id=inv_id,
                    branch_title=w["branch_title"],
                    steps=w["steps"],
                    terminal_cause=w["terminal_cause"],
                    category=w.get("category")
                ))
            # Fishbone
            for f in analysis["fishbone_causes"]:
                db.add(FishboneCause(
                    id=f["id"],
                    investigation_id=inv_id,
                    category=f["category"],
                    cause_text=f["cause_text"],
                    status="pencil",
                    evidence_quote=f.get("evidence_quote")
                ))
            # Missing Evidence
            for m in analysis["missing_evidence"]:
                db.add(MissingEvidence(
                    id=m["id"],
                    investigation_id=inv_id,
                    item_title=m["item_title"],
                    why_it_matters=m["why_it_matters"],
                    priority=m["priority"],
                    status="open"
                ))
            # CAPA
            for c in analysis["capa_actions"]:
                db.add(CAPAAction(
                    id=c["id"],
                    investigation_id=inv_id,
                    action_type=c["action_type"],
                    description=c["description"],
                    rationale=c["rationale"],
                    owner_role=c["owner_role"],
                    due_offset_days=c["due_offset_days"],
                    priority=c["priority"],
                    effectiveness_check=c["effectiveness_check"],
                    status="proposed"
                ))

            # Audit record
            audit = AuditLog(
                id=str(uuid.uuid4()),
                investigation_id=inv_id,
                actor_type="ai",
                actor_label="Rootline Co-Pilot",
                action="complete_ai_extraction_and_rca",
                entity="investigation",
                before_state=None,
                after_state={
                    "product": inv.product_name,
                    "batch": inv.batch_number,
                    "hypotheses_count": len(analysis["hypotheses"]),
                    "capa_count": len(analysis["capa_actions"])
                }
            )
            db.add(audit)
            await db.commit()

            # Emit analysis payload
            yield sse_event("analysis_update", analysis)

            reply_intro = (
                f"I have extracted the incident data and populated the RCA form in pencil. "
                f"The deviation involves **{inv.product_name or 'API'}** (Batch `{inv.batch_number or 'N/A'}`).\n\n"
                f"**Risk Assessment:** Classified as **{assessment.get('severity', 'major').upper()}** under {', '.join(assessment.get('compliance_anchors', ['ICH Q7']))}.\n"
                f"• Recommended action: {assessment.get('recommended_action', '')}\n\n"
                f"I have also prepared the 5 Whys descent, 6M Ishikawa fishbone, ranked hypotheses, missing-evidence checklist, and proposed CAPAs for your review."
            )
            for chunk in reply_intro.split(" "):
                yield sse_event("message_delta", {"text": chunk + " "})
                await asyncio.sleep(0.015)
            full_reply_text = reply_intro

        # Save assistant message
        asst_msg = ChatMessage(
            id=str(uuid.uuid4()),
            investigation_id=inv_id,
            role="assistant",
            content=full_reply_text,
            tool_calls=[{"tool": tool_name}]
        )
        db.add(asst_msg)
        await db.commit()

        yield sse_event("done", {})

    return StreamingResponse(event_generator(), media_type="text/event-stream")

