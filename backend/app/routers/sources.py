import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.database import get_db
from backend.app.models import Investigation, SourceDocument, AuditLog
from backend.app.services.document_ingest import extract_text_from_pdf, parse_email_content, normalize_text

router = APIRouter()

class TextSourceRequest(BaseModel):
    kind: str # text, email
    content: str
    filename: Optional[str] = None

@router.post("/investigations/{inv_id}/sources")
async def add_source(
    inv_id: str,
    file: Optional[UploadFile] = File(None),
    kind: Optional[str] = Form(None),
    content: Optional[str] = Form(None),
    db: AsyncSession = Depends(get_db)
):
    inv = await db.get(Investigation, inv_id)
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation not found")

    source_id = str(uuid.uuid4())
    raw_text = ""
    page_map = {}
    doc_kind = "text"
    filename = None

    if file:
        filename = file.filename or "uploaded_file"
        file_bytes = await file.read()
        if filename.lower().endswith(".pdf"):
            doc_kind = "pdf"
            try:
                raw_text, page_map = extract_text_from_pdf(file_bytes)
            except ValueError as ve:
                raise HTTPException(status_code=400, detail=str(ve))
        elif filename.lower().endswith(".eml"):
            doc_kind = "email"
            text_str = file_bytes.decode("utf-8", errors="ignore")
            raw_text, _ = parse_email_content(text_str)
        else:
            doc_kind = "text"
            raw_text = normalize_text(file_bytes.decode("utf-8", errors="ignore"))
    elif content:
        doc_kind = kind or "text"
        filename = "pasted_input.txt" if doc_kind == "text" else "pasted_email.eml"
        if doc_kind == "email":
            raw_text, _ = parse_email_content(content)
        else:
            raw_text = normalize_text(content)
    else:
        raise HTTPException(status_code=400, detail="Either file upload or text content must be provided.")

    if not raw_text.strip():
        raise HTTPException(status_code=400, detail="Extracted text is empty. Please provide readable text.")

    doc = SourceDocument(
        id=source_id,
        investigation_id=inv_id,
        kind=doc_kind,
        filename=filename,
        raw_text=raw_text,
        page_map=page_map
    )
    db.add(doc)

    audit = AuditLog(
        id=str(uuid.uuid4()),
        investigation_id=inv_id,
        actor_type="human",
        actor_label="Quality Investigator",
        action="add_source_document",
        entity="source_document",
        before_state=None,
        after_state={"filename": filename, "kind": doc_kind, "char_count": len(raw_text)}
    )
    db.add(audit)
    await db.commit()

    return {
        "id": doc.id,
        "kind": doc.kind,
        "filename": doc.filename,
        "char_count": len(doc.raw_text),
        "preview": doc.raw_text[:300]
    }

