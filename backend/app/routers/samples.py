from pathlib import Path
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from backend.app.config import ROOT_DIR

router = APIRouter()
SAMPLES_DIR = ROOT_DIR / "samples"

@router.get("/samples")
async def list_samples():
    return [
        {
            "id": "sample_a",
            "title": "Amlodipine Besylate API - Tray Dryer Residual Methanol OOS",
            "type": "email",
            "description": "Email reporting residual methanol 3,400 ppm (limit 3,000 ppm) with vacuum pump alarm and operator mention.",
            "prompt_text": "Tray dryer TD-204 was stopped about 2 hours early on batch AMB260409B of amlodipine besylate API after a vacuum pump alarm. Final QC reported residual methanol at 3,400 ppm against a limit of 3,000 ppm. Two HDPE drums, about 60 kg. Please start an RCA."
        },
        {
            "id": "sample_b",
            "title": "Metformin Hydrochloride API - Crystallisation Excursion (2-Page PDF)",
            "type": "pdf",
            "description": "Full 2-page deviation report with temperature excursion, D90 PSD failure, and chilled water valve CV-102 binding.",
            "prompt_text": "Please extract and investigate the attached deviation report for Metformin hydrochloride API crystallisation temperature excursion and D90 particle size OOS on batch MFH260712A."
        },
        {
            "id": "sample_c",
            "title": "Unidentified HPLC Impurity Peak (Sparse Note)",
            "type": "note",
            "description": "Brief, vague forwarded note with missing critical information to test gap detection and clarifying questions.",
            "prompt_text": "Please check: HPLC impurity peak at RRT 1.42 is higher than typical baseline on the last API batch processed in Block 4. No OOS formally logged yet, but need QA review on whether to hold milling."
        }
    ]

@router.get("/samples/{sample_id}/download")
async def download_sample_file(sample_id: str):
    if sample_id == "sample_b":
        pdf_path = SAMPLES_DIR / "sample_b_metformin_deviation.pdf"
        if pdf_path.exists():
            return FileResponse(pdf_path, media_type="application/pdf", filename="sample_b_metformin_deviation.pdf")
    elif sample_id == "sample_a":
        txt_path = SAMPLES_DIR / "sample_a_amlodipine_email.txt"
        if txt_path.exists():
            return FileResponse(txt_path, media_type="text/plain", filename="sample_a_amlodipine_email.txt")
    elif sample_id == "sample_c":
        txt_path = SAMPLES_DIR / "sample_c_sparse_hplc_note.txt"
        if txt_path.exists():
            return FileResponse(txt_path, media_type="text/plain", filename="sample_c_sparse_hplc_note.txt")
    raise HTTPException(status_code=404, detail="Sample not found")

@router.get("/samples/{sample_id}/content")
async def get_sample_content(sample_id: str):
    if sample_id == "sample_a":
        path = SAMPLES_DIR / "sample_a_amlodipine_email.txt"
        return {"content": path.read_text(encoding="utf-8"), "kind": "email"}
    elif sample_id == "sample_c":
        path = SAMPLES_DIR / "sample_c_sparse_hplc_note.txt"
        return {"content": path.read_text(encoding="utf-8"), "kind": "text"}
    elif sample_id == "sample_b":
        return {"content": "sample_b_metformin_deviation.pdf", "kind": "pdf", "download_url": "/api/samples/sample_b/download"}
    raise HTTPException(status_code=404, detail="Sample not found")
