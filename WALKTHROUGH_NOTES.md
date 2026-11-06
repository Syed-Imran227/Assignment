# Video 2: Technical Walkthrough & Code Explanation Script (Target: 8–9 minutes)

> **Guidelines for Recording**: Open VS Code / IDE with the codebase. Open `docs/ARCHITECTURE.md` as your visual spine. Have the file explorer open on the left.

---

### [0:00 – 0:45] Repository Map & Architectural Overview
- **Files to show**: Project root directory and `docs/ARCHITECTURE.md`.
- **What to say**:
  > "Hello, in this technical walkthrough I'll explain the implementation of Rootline, our AI-powered Root Cause Analysis module.
  >
  > Here is our repository structure:
  > - `/backend`: A FastAPI service built with SQLAlchemy 2.0 async models, Pydantic v2 schemas, and our LangGraph and grounding reasoning pipeline.
  > - `/frontend`: A clean React 18 + Redux Toolkit application styled with Tailwind CSS, adhering to our lab-notebook design tokens.
  > - `/docs`: Contains our DESIGN.md specification and ARCHITECTURE.md diagram.
  > - `/samples`: Generated regulatory test documents, including multi-page PDFs and email records.
  >
  > As shown in our architecture diagram, communication flows from the split-screen UI via Redux through REST and Server-Sent Events (SSE) to FastAPI, which orchestrates LangGraph, Groq, and our database."

---

### [0:45 – 2:45] Frontend Structure & The Pencil/Ink Redux Architecture
- **Files to show**: `frontend/src/store/workspaceSlice.ts`, `frontend/src/components/common/FieldContainer.tsx`, and `frontend/src/services/sse.ts`.
- **What to say**:
  > "Let's examine the frontend. State management is centered in `frontend/src/store/workspaceSlice.ts`.
  >
  > Notice the `FieldValue` interface: every field contains not just a `value`, but a `status` ('empty' | 'pencil' | 'edited' | 'ink'), a `confidence` metric, a `source` quote object, and an explanatory `rationale`.
  >
  > In `FieldContainer.tsx`, the component binds directly to this store. When status is 'pencil', it renders with graphite dashed underlines and an AI chip. When confirmed by the user, `confirmField` transitions the status to 'ink', changing styling to solid ink with a verdigris checkmark.
  >
  > In `frontend/src/services/sse.ts`, `sendCopilotMessage` handles the streaming response from `POST /api/investigations/{id}/copilot`. As events arrive, `field_update` events dispatch to the store with a sequential 70ms interval, producing the stamp-in effect."

---

### [2:45 – 3:45] Backend Routing & Pydantic Validation
- **Files to show**: `backend/app/main.py`, `backend/app/schemas.py`, and `backend/app/routers/investigations.py`.
- **What to say**:
  > "Turning to the backend in `backend/app/main.py`, we have modular routers mounted under `/api`.
  >
  > In `schemas.py`, Pydantic v2 enforces strict type contracts for `FieldValue`, `SourceQuote`, `AIAssessment`, and `FormFields`.
  >
  > In `investigations.py`, we handle the investigation lifecycle. Sequential RCA identifiers like `RCA-2026-0001` are generated server-side. In `/api/investigations/{id}/save`, we enforce a regulatory validation checklist verifying that product, batch, and at least one confirmed root cause or rationale is attested before locking the revision and bumping the version."

---

### [3:45 – 4:45] Document Ingestion & Scanned Image Protection
- **Files to show**: `backend/app/services/document_ingest.py`.
- **What to say**:
  > "Incident intake supports raw text, RFC 822 `.eml` emails, and multi-page PDFs.
  >
  > In `document_ingest.py`, `extract_text_from_pdf` utilizes `pdfplumber` with fallback to `pypdf`, extracting page-by-page text into a `page_map` dictionary.
  >
  > Here is a critical GMP guardrail: if a user uploads a scanned image PDF without an embedded text layer, the function counts non-whitespace characters. If fewer than 30 characters exist, it immediately raises a clear, descriptive ValueError explaining that a text-searchable PDF or OCR layer is required, rather than crashing or hallucinating."

---

### [4:45 – 7:15] LangGraph Pipeline, Grounding & Human Error Guardrail
- **Files to show**: `backend/app/services/graph.py` and `backend/app/services/grounding.py`.
- **What to say**:
  > "Now let's examine the AI core in `backend/app/services/graph.py` and `grounding.py`.
  >
  > In `grounding.py`, we implement deterministic quote verification in `verify_quote_in_source`. Rather than trusting an LLM's claim of truth, we verify the quote in Python code via exact match, case-insensitive match, and normalized whitespace substring checks. This eliminates catastrophic regex backtracking while guaranteeing verified start and end offsets.
  >
  > In `graph.py`, our pipeline executes in structured stages:
  > 1. `extract_fields_from_text`: Extracts structured fields with verbatim quotes using our fast model (`llama-3.1-8b-instant`).
  > 2. `generate_ai_assessment`: Evaluates severity, immediate next action, and impact scope under ICH Q9.
  > 3. `run_rca_investigation`: Generates the 5 Whys chain and 6M Fishbone causes.
  >
  > Here is our **Human Error Guardrail**: In pharmaceutical manufacturing, blaming an operator is unacceptable under FDA 21 CFR 211.192. Our prompt rules and causal parser explicitly reject operator errors as terminal causes, pushing the root cause to equipment interlocks, procedure ambiguities, or condenser fouling.
  >
  > Furthermore, under our safety guardrail, AI-generated hypotheses can only possess a strength of 'hypothesis' or 'supported'; they can **never** be marked as 'confirmed' by the machine.
  >
  > Finally, `execute_natural_language_edit` handles corrections: when a user says 'Change batch to AMB260409C', the model outputs a minimal JSON patch of only that field. A deterministic merge updates that field and its dependent risk assessment, preserving all untouched fields."

---

### [7:15 – 8:15] Database Schema, Versioning & Audit Trail
- **Files to show**: `backend/app/models.py`.
- **What to say**:
  > "Our data model in `backend/app/models.py` uses SQLAlchemy 2.0 with async engine support, configured for zero-Docker SQLite (`rootline.db`) or PostgreSQL.
  >
  > We have 10 dedicated relational models:
  > - `investigations`: Manages lifecycle, versioning, and locked flags.
  > - `source_documents`: Stores raw text and page maps.
  > - `hypotheses`: Stores causal statements, categories, likelihood, evidence arrays, and QP attestation signatures.
  > - `why_chains` & `fishbone_causes`: Underpin our dual investigation views.
  > - `capa_actions`: Captures 3-tier actions with ICH Q10 effectiveness checks.
  > - `audit_log`: An append-only log capturing actor type ('human', 'ai', 'system'), action, before_state, and after_state JSON.
  >
  > In `database.py`, table creation is synchronous and rock-solid on startup, preventing any thread contention."

---

### [8:15 – 9:00] Summary & Next Steps
- **What to say**:
  > "To verify this implementation, our automated test suite in `backend/scripts/run_unit_tests.py` validates all quote grounding, PDF extraction, 5 Whys generation, and natural-language patch merges across all test samples.
  >
  > For future production expansion, natural next steps include:
  > 1. Adding optical character recognition (OCR) using Tesseract for scanned paper BMR pages.
  > 2. Direct webhooks into enterprise eQMS platforms like TrackWise or Veeva Vault.
  > 3. 21 CFR Part 11 compliant digital cryptographic signature PKI workflows.
  >
  > Thank you."

