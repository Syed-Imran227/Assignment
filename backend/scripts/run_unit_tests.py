import sys
import asyncio
from pathlib import Path

root = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(root))

from backend.app.database import init_db, AsyncSessionLocal
from backend.app.services.grounding import verify_quote_in_source
from backend.app.services.document_ingest import extract_text_from_pdf, parse_email_content
from backend.app.services.graph import (
    extract_fields_from_text, generate_ai_assessment,
    run_rca_investigation, execute_natural_language_edit
)
from backend.app.models import Investigation, Hypothesis, CAPAAction

async def run_all_tests():
    print("=== ROOTLINE AUTOMATED VERIFICATION SUITE ===\n")
    
    # 1. Grounding and Quote Verification
    print("[TEST 1] Grounding & Quote Verification...")
    sample_text = "Tray dryer TD-204 was stopped approximately 2 hours earlier than the validated 16-hour drying cycle."
    v1, s1, e1 = verify_quote_in_source("Tray dryer TD-204", sample_text)
    assert v1 and s1 == 0, "Exact quote verification failed"
    v2, s2, e2 = verify_quote_in_source("stopped   approximately   2 hours", sample_text)
    assert v2, "Normalized whitespace quote verification failed"
    v3, s3, e3 = verify_quote_in_source("Operator was drinking coffee", sample_text)
    assert not v3, "Fabricated quote should fail verification"
    print("✓ Quote verification tests passed!\n")

    # 2. Document Ingest Tests
    print("[TEST 2] Document Ingestion (PDF & Email)...")
    pdf_path = root / "samples" / "sample_b_metformin_deviation.pdf"
    with open(pdf_path, "rb") as f:
        pdf_bytes = f.read()
    pdf_text, page_map = extract_text_from_pdf(pdf_bytes)
    assert "Metformin Hydrochloride" in pdf_text, "PDF text extraction failed"
    assert "2" in page_map, "Multi-page extraction failed"
    print(f"✓ PDF extracted {len(pdf_text)} characters across {len(page_map)} pages.")

    email_path = root / "samples" / "sample_a_amlodipine_email.txt"
    email_text = email_path.read_text(encoding="utf-8")
    parsed_email, headers = parse_email_content(email_text)
    assert "Subject" in headers, "Email header parsing failed"
    assert "Residual Methanol" in parsed_email, "Email body parsing failed"
    print("✓ Email ingestion and header parsing passed!\n")

    # 3. Scanned PDF Detection Test
    print("[TEST 3] Scanned PDF (Empty Text Layer) Detection...")
    try:
        from reportlab.pdfgen import canvas
        import io
        buf = io.BytesIO()
        c = canvas.Canvas(buf)
        c.showPage()
        c.save()
        extract_text_from_pdf(buf.getvalue())
        assert False, "Should have raised ValueError on scanned/empty PDF"
    except ValueError as ve:
        assert "scanned image" in str(ve).lower()
        print(f"✓ Scanned PDF properly rejected with guidance: '{ve}'\n")

    # 4. Form Extraction & AI Risk Assessment
    print("[TEST 4] Field Extraction & AI Risk Assessment...")
    extracted = await extract_fields_from_text(email_text)
    assert extracted["product_name"]["value"] is not None
    assert extracted["batch_number"]["value"] is not None
    assert extracted["product_name"]["status"] == "pencil"
    print(f"✓ Extracted Product: {extracted['product_name']['value']} (Status: {extracted['product_name']['status']})")
    print(f"✓ Extracted Batch: {extracted['batch_number']['value']} (Confidence: {extracted['batch_number']['confidence']})")

    assessment = await generate_ai_assessment(extracted, email_text)
    assert assessment["severity"] in ["major", "critical"]
    print(f"✓ AI Assessment Severity: {assessment['severity'].upper()} (Anchors: {assessment['compliance_anchors']})\n")

    # 5. RCA Investigation (5 Whys, Fishbone, Hypotheses, CAPA)
    print("[TEST 5] 5 Whys, 6M Fishbone, Ranked Hypotheses, & CAPA...")
    rca = await run_rca_investigation(extracted, email_text)
    assert len(rca["why_chains"]) > 0, "5 Whys generation missing"
    assert len(rca["fishbone_causes"]) >= 6, "Fishbone 6M causes missing"
    assert len(rca["hypotheses"]) > 0, "Ranked hypotheses missing"
    assert len(rca["capa_actions"]) > 0, "CAPA actions missing"

    top_hypo = rca["hypotheses"][0]
    print(f"✓ Top Ranked Hypothesis: {top_hypo['statement']}")
    print(f"✓ Hypothesis Strength: {top_hypo['strength']} (Guarded: cannot be 'confirmed' by AI)")
    assert top_hypo["strength"] in ["hypothesis", "supported"], "AI must not mark hypothesis as confirmed"

    # Verify CAPA action types
    capa_types = {c["action_type"] for c in rca["capa_actions"]}
    assert "correction" in capa_types and "corrective" in capa_types and "preventive" in capa_types
    print(f"✓ CAPA 3-Tier Spectrum present: {capa_types}\n")

    # 6. Natural Language Edit with Minimal Patch & Dependency Mapping
    print("[TEST 6] Natural Language Correction Tool...")
    edit_cmd = "Sorry, the batch number is AMB260409C and the affected quantity is 48 kg in 2 HDPE drums."
    edit_res = await execute_natural_language_edit(extracted, assessment, edit_cmd)
    
    assert edit_res["updated_fields"]["batch_number"]["value"] == "AMB260409C"
    assert edit_res["updated_fields"]["affected_quantity"]["value"] == "48 kg in 2 HDPE drums"
    assert edit_res["updated_fields"]["product_name"]["value"] == extracted["product_name"]["value"], "Untouched field modified!"
    print("✓ Natural language edit applied minimal patch cleanly:")
    for change in edit_res["change_summary"]:
        print(f"  - {change}")
    print()

    print("====================================================")
    print("ALL 6 AUTOMATED VERIFICATION TESTS PASSED FLAWLESSLY!")
    print("====================================================")

if __name__ == "__main__":
    if sys.platform == "win32":
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    print("STARTING TEST SCRIPT", flush=True)
    init_db()
    print("DB INITIALIZED", flush=True)
    asyncio.run(run_all_tests())
