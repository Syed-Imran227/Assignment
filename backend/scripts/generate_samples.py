import os
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent.parent
SAMPLES_DIR = ROOT_DIR / "samples"
SAMPLES_DIR.mkdir(parents=True, exist_ok=True)

SAMPLE_A_EMAIL = """From: patel.s@sunshine-api-pharma.com
To: qa-investigations@sunshine-api-pharma.com, dev-leads@sunshine-api-pharma.com
Date: Mon, 14 Apr 2026 09:15:22 +0530
Subject: Deviation Alert: Residual Methanol OOS on Amlodipine Besylate API Batch AMB260409B

Quality Team,

During final QC release testing of Amlodipine Besylate API (USP Grade), batch AMB260409B, gas chromatography indicated residual methanol of 3,400 ppm against the specification limit of not more than 3,000 ppm (ICH Q3C Option 1).

Batch Details:
- Product: Amlodipine Besylate API
- Strength/Grade: USP Grade
- Batch Number: AMB260409B
- Affected Quantity: 60 kg packed in 2 HDPE drums
- Manufacturing Stage: Final Vacuum Tray Drying (TD-204)
- Discovery Date: 14-Apr-2026 08:30 IST
- Occurrence Date: 12-Apr-2026 14:00 IST
- Detected By: S. Patel (Senior QC Analyst) via GC headspace test QC-MET-204

Preliminary Observation:
Tray dryer TD-204 was stopped approximately 2 hours earlier than the validated 16-hour drying cycle following an intermittent vacuum pump (VP-02) seal differential pressure alarm at 12:45 IST. 
Note: An apprentice operator was on shift who reset the vacuum alarm, but engineering logs show mechanical vacuum loss in the condenser loop.

Immediate Containment:
Batch AMB260409B has been placed on physical and SAP Quality Hold in Quarantine Bay 3. Yellow quarantine labels applied to both HDPE drums. Adjacent batch AMB260409A released last week complied with 1,820 ppm methanol.

Please initiate an urgent Root Cause Analysis.
"""

SAMPLE_C_NOTE = """From: r.sharma@qc-lab.local
Date: 15-Apr-2026 11:20
Subject: FW: Unidentified peak on HPLC run

Please check: HPLC impurity peak at RRT 1.42 is higher than typical baseline on the last API batch processed in Block 4. 
No OOS formally logged yet, but need QA review on whether to hold milling.
"""

def generate_pdf_deviation_report(pdf_path: Path):
    from reportlab.lib.pagesizes import letter
    from reportlab.lib import colors
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

    doc = SimpleDocTemplate(
        str(pdf_path),
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=16,
        leading=20,
        textColor=colors.HexColor('#15181B')
    )
    h2_style = ParagraphStyle(
        'H2',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor('#1F7A66'),
        spaceBefore=10,
        spaceAfter=6
    )
    body_style = ParagraphStyle(
        'Body',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13,
        textColor=colors.HexColor('#15181B')
    )

    story = []

    # Header Banner
    story.append(Paragraph("APEX PHARMACEUTICAL INGREDIENTS LTD. — QUALITY ASSURANCE", h2_style))
    story.append(Paragraph("PLANNED/UNPLANNED DEVIATION REPORT (FORM QA-DEV-04)", title_style))
    story.append(Spacer(1, 10))

    # Section 1: Overview Table
    data1 = [
        [Paragraph("<b>Deviation Number:</b> DEV-2026-0891", body_style), Paragraph("<b>Classification:</b> MAJOR", body_style)],
        [Paragraph("<b>Product Name:</b> Metformin Hydrochloride API", body_style), Paragraph("<b>Pharmacopeial Grade:</b> IP/BP", body_style)],
        [Paragraph("<b>Batch / Lot Number:</b> MFH260712A", body_style), Paragraph("<b>Affected Quantity:</b> 50 kg in 2 HDPE Drums", body_style)],
        [Paragraph("<b>Manufacturing Stage:</b> Crystallisation & Isolation", body_style), Paragraph("<b>Equipment ID:</b> CR-102 (Glass-lined Reactor)", body_style)],
        [Paragraph("<b>Date & Time of Occurrence:</b> 12-Jul-2026 03:15 IST", body_style), Paragraph("<b>Date & Time of Discovery:</b> 12-Jul-2026 09:30 IST", body_style)],
        [Paragraph("<b>Reported By:</b> V. Ramanathan, Shift Lead Chemist", body_style), Paragraph("<b>Department:</b> Active Pharmaceutical Ingredients Mfg", body_style)]
    ]
    t1 = Table(data1, colWidths=[260, 260])
    t1.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#FBF9F4')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#B9B2A0')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#D8D2C3')),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t1)
    story.append(Spacer(1, 12))

    # Section 2: Deviation Description
    story.append(Paragraph("1.0 INCIDENT DESCRIPTION & SEQUENCE OF EVENTS", h2_style))
    desc_p1 = (
        "During the cooling crystallisation phase of Metformin Hydrochloride batch MFH260712A in reactor CR-102, "
        "the batch temperature spiked from the programmed cooling ramp of 15°C/hr up to 48.5°C over a 42-minute interval. "
        "The recipe parameters stipulate controlled linear cooling between 65°C down to 10°C to achieve uniform supersaturation. "
        "Subsequent IPC and QC particle size distribution (PSD) analysis by laser diffraction demonstrated out-of-specification "
        "D90 particle size of 245 µm (Specification: 90 - 180 µm). Bulk density was also elevated at 0.72 g/mL (limit: 0.55-0.65 g/mL)."
    )
    story.append(Paragraph(desc_p1, body_style))
    story.append(Spacer(1, 10))

    # Section 3: DCS and Historian Findings
    story.append(Paragraph("2.0 DISTRIBUTED CONTROL SYSTEM (DCS) & UTILITY DATA", h2_style))
    dcs_text = (
        "DCS SCADA log review showed that secondary chilled water control valve CV-102 failed to modulate beyond 12% open position "
        "despite controller output reaching 100%. The electro-pneumatic positioner on CV-102 had moisture ingress in the supply airline, "
        "causing mechanical binding. The backup brine chiller cooling circuit was manually engaged 40 minutes late."
    )
    story.append(Paragraph(dcs_text, body_style))
    story.append(Spacer(1, 10))

    # Section 4: Immediate Containment
    story.append(Paragraph("3.0 IMMEDIATE CONTAINMENT & DISPOSITION", h2_style))
    cont_text = (
        "Batch MFH260712A has been segregated into Locked Quarantine Room B, Drums 1 and 2 labeled with RED QA HOLD tags. "
        "Downstream milling operation suspended. Maintenance work order WO-8842 issued for pneumatic positioner inspection on CV-102."
    )
    story.append(Paragraph(cont_text, body_style))
    story.append(PageBreak())

    # Page 2: Impact Assessment & Regulatory Anchors
    story.append(Paragraph("4.0 PRELIMINARY IMPACT ASSESSMENT (ICH Q7 / ICH Q9)", h2_style))
    
    impact_data = [
        [Paragraph("<b>Quality Attribute</b>", body_style), Paragraph("<b>Observation & Assessment</b>", body_style)],
        [Paragraph("Critical Quality Attribute (CQA)", body_style), Paragraph("Particle Size Distribution (D90) exceeded upper limit; dissolution rate may be altered.", body_style)],
        [Paragraph("Equipment Train Integrity", body_style), Paragraph("Reactor CR-102 chilled water loop compromised by pneumatic instrument air moisture.", body_style)],
        [Paragraph("Adjacent Batches", body_style), Paragraph("Batches MFH260710B and MFH260711A were processed prior to valve sticking; parameters verified normal.", body_style)],
        [Paragraph("Regulatory Compliance", body_style), Paragraph("Requires investigation under 21 CFR 211.192 and ICH Q7 Section 2.5 discrepancy management.", body_style)]
    ]
    t2 = Table(impact_data, colWidths=[180, 340])
    t2.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#F0EDE4')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#B9B2A0')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#D8D2C3')),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t2)
    story.append(Spacer(1, 15))

    story.append(Paragraph("5.0 REQUIRED ROOT CAUSE ANALYSIS & ACTIONS", h2_style))
    req_text = (
        "Full 5 Whys and 6M Fishbone investigation required to evaluate why instrument air dryer failed to prevent moisture "
        "accumulation at chilled water valve positioner CV-102. Determine preventative maintenance frequency and air header filtration integrity."
    )
    story.append(Paragraph(req_text, body_style))

    doc.build(story)

def create_all_samples():
    # 1. Sample A (Email)
    with open(SAMPLES_DIR / "sample_a_amlodipine_email.txt", "w", encoding="utf-8") as f:
        f.write(SAMPLE_A_EMAIL)

    # 2. Sample B (PDF)
    pdf_path = SAMPLES_DIR / "sample_b_metformin_deviation.pdf"
    generate_pdf_deviation_report(pdf_path)

    # 3. Sample C (Sparse Note)
    with open(SAMPLES_DIR / "sample_c_sparse_hplc_note.txt", "w", encoding="utf-8") as f:
        f.write(SAMPLE_C_NOTE)

    print(f"Generated samples in {SAMPLES_DIR}")

if __name__ == "__main__":
    create_all_samples()
