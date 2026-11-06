# Rootline: AI-Powered Root Cause Analysis (RCA) Module

> **Pharmaceutical Active Pharmaceutical Ingredient (API) Quality Deviation & RCA System**  
> Compliant with **ICH Q7**, **ICH Q9**, **ICH Q10**, and **21 CFR 211.192**.  
> Built for the **AIVOA.AI AI Product Engineer Challenge**.

---

## 1. Key Value Proposition: The Pencil and Ink Model

In regulated Active Pharmaceutical Ingredient manufacturing, AI systems must **never** unilaterally confirm root causes or forge release determinations. Rootline introduces the **Pencil and Ink Model**:

- **Pencil (Provisional AI)**: Extracted fields, 5 Whys steps, 6M Fishbone causes, and CAPA proposals are initially stamped in **pencil** (graphite styling, dashed underline, `[AI]` badge, with verbatim source citations).
- **Ink (Qualified Human Confirmation)**: A Qualified Person (QP) or Quality Investigator reviews and explicitly promotes causes to **ink** (`[✓]` verdigris stamp) with full attestation (investigator name, role, timestamp) and append-only audit tracking.

---

## 2. Architecture & Tech Stack

- **Frontend**: React 18, Redux Toolkit, TypeScript, Tailwind CSS, Lucide Icons.
  - Split-screen workspace layout (Record Form ~56% left, Rootline Co-Pilot ~44% right).
  - Hand-crafted 6M Ishikawa Fishbone SVG & dynamic 5 Whys Descent tree.
- **Backend**: Python 3.13, FastAPI, Pydantic v2, SQLAlchemy 2.0 (Asynchronous SQLite / PostgreSQL).
  - Starlette Server-Sent Events (SSE) streaming real-time LangGraph agent trace events.
- **AI & Reasoning**: LangGraph, Groq LLM (`llama-3.3-70b-versatile` reasoning, `llama-3.1-8b-instant` fast extraction/classification).
  - Deterministic quote verification with zero catastrophic regex backtracking.
  - **Human Error Guardrail**: Rejects "operator/human error" as a terminal cause and pushes to underlying SOP, engineering, training, or instrumentation root causes.
- **Database**: Zero-Docker SQLite by default (`rootline.db`) or PostgreSQL via `DATABASE_URL`.

---

## 3. Quick Start & Execution

### Prerequisites
- Python 3.11+
- Node.js 20+

### Step 1: Backend Setup & Launch
```powershell
# 1. Activate the local virtual environment
.venv\Scripts\activate

# 2. (Optional) Provide Groq API key in .env or run with deterministic fallback
# Copy .env.example to .env and insert your GROQ_API_KEY

# 3. Launch the FastAPI server
.venv\Scripts\activate; uvicorn backend.app.main:app --reload --port 8000
```
*Backend runs at `http://127.0.0.1:8000`. Health check: `http://127.0.0.1:8000/health`.*

### Step 2: Frontend Launch
```powershell
# In a separate terminal:
npm run dev --prefix frontend
```
*Frontend runs at `http://localhost:5173` with automated API proxy to port 8000.*

---

## 4. Automated Verification & Tests

### Backend Unit Tests & Grounding Verification
```powershell
.venv\Scripts\activate; python -u backend/scripts/run_unit_tests.py
```
*Verifies quote verification (exact, whitespace-normalized, fabricated), multi-page PDF extraction, scanned PDF detection, 5 Whys deduction, 6M Fishbone generation, and natural-language minimal patch editing.*

### Frontend Production Build
```powershell
npm run build --prefix frontend
```

---

## 5. Sample Incidents Provided

| Sample | Format | Manufacturing Scenario |
| :--- | :--- | :--- |
| **Sample A** | Email (.txt) | **Amlodipine Besylate API** (Batch AMB260409B): Residual methanol OOS (3,400 ppm vs 3,000 ppm limit) following vacuum tray dryer alarm. |
| **Sample B** | PDF (2 pages) | **Metformin Hydrochloride API** (Batch MFH260712A): Crystallisation thermal excursion up to 48.5°C and D90 PSD failure caused by chilled water valve CV-102 binding. |
| **Sample C** | Sparse Note | **HPLC Impurity Peak**: Demonstrates missing critical information detection and clarifying question prompting. |

---

## 6. Regulatory Anchors

- **ICH Q7 Section 12**: Discrepancy management and mandatory investigation of API out-of-specification results.
- **ICH Q9**: Quality Risk Management and qualitative likelihood assessment.
- **ICH Q10**: Pharmaceutical Quality System and structured 3-tier CAPA (Correction, Corrective Action, Preventive Action).
- **21 CFR 211.192**: Thorough investigation of unexplained discrepancies and failure investigations.
- **ALCOA+ Principles**: Attributable, Legible, Contemporaneous, Original, and Accurate data integrity.
