# Rootline System Architecture (docs/ARCHITECTURE.md)

## 1. Overview & System Topology

Rootline is an AI-assisted Root Cause Analysis (RCA) and CAPA recommendation module specifically engineered for Active Pharmaceutical Ingredient (API) manufacturers operating under strict cGMP regulations (ICH Q7, ICH Q9, ICH Q10, 21 CFR 211.192).

```mermaid
flowchart LR
    A["Investigator / QC Lead"] <--> B["React + Redux Frontend\n(Split Screen: Record / Co-Pilot)"]
    B <--> C["FastAPI REST & SSE Service\n(/api/investigations, /api/copilot)"]
    C <--> D["LangGraph & Reasoning Pipeline\n(Grounding Engine + Groq LLM)"]
    C <--> E["SQLAlchemy 2 Data Layer\n(SQLite / PostgreSQL)"]
    D <--> F["Sample & Ingestion Engine\n(PDF, .eml, Text, Scanned Guard)"]
```

---

## 2. Request & Execution Path

```mermaid
sequenceDiagram
    autonumber
    actor Investigator as Quality Investigator
    participant UI as React + Redux UI
    participant API as FastAPI Backend
    participant Graph as LangGraph Engine
    participant Ground as Grounding Service
    participant DB as SQLite / PostgreSQL

    Investigator->>UI: Paste deviation or attach PDF in Co-Pilot composer
    UI->>API: POST /api/investigations/{id}/copilot (multipart/form-data)
    API->>Graph: Trigger extraction & causal graph
    Graph->>Ground: Verify verbatim quotes in source document
    Ground-->>Graph: Verified bounds [start, end, verified: true]
    
    loop Streamed SSE Events
        Graph-->>API: yield field_update ("pencil" status)
        API-->>UI: data: {"type": "field_update", "field": "...", "status": "pencil"}
        UI->>UI: 70ms sequential field "stamp-in" animation
    end

    Graph-->>API: yield analysis_update (5 Whys, Fishbone, Hypotheses, CAPA)
    API-->>UI: data: {"type": "analysis_update", ...}
    UI->>UI: Render 6M Fishbone SVG & 5 Whys Tree
    
    Investigator->>UI: Click "Confirm as Root Cause"
    UI->>API: PATCH /api/hypotheses/{id}/confirm (QP Attestation)
    API->>DB: Update hypothesis to "confirmed" + Append AuditLog
    DB-->>UI: Transition to INK with Verdigris checkmark
```

---

## 3. LangGraph Workflow Architecture

```mermaid
flowchart TD
    Start([User Incident Intake]) --> Ingest[Document Ingest & Scanned PDF Check]
    Ingest --> Classify[Document Classification]
    Classify --> Extract[Structured Field Extraction]
    Extract --> VerifyQuotes[Deterministic Grounding & Quote Verification]
    VerifyQuotes --> AssessRisk[AI Risk & Regulatory Impact Assessment]
    
    AssessRisk --> Whys[5 Whys Causal Descent]
    Whys --> HumanErrorGuard{Ends in Human/Operator Error?}
    HumanErrorGuard -- Yes: Loop back to system cause --> PushSystemic[Push to SOP / Alarm / Engineering Deficit]
    PushSystemic --> Whys
    HumanErrorGuard -- No: Terminal systemic cause reached --> Fishbone[6M Ishikawa Fishbone Categorization]
    
    Fishbone --> RankHypos[Rank Hypotheses & Qualitative Likelihood]
    RankHypos --> MissingEv[Identify Missing Evidence Gaps]
    MissingEv --> CAPA[3-Tier CAPA: Correction, Corrective, Preventive]
    CAPA --> SafetyGuard[Deterministic Safety Guard & Pencil Tagging]
    SafetyGuard --> Emit([Stream SSE to Frontend])
```

---

## 4. The Pencil and Ink State Machine

Every AI-generated value follows strict regulatory immutability rules:
- `empty`: Field not present in source document. Flagged in evidence checklist, never hallucinated.
- `pencil`: Suggested by AI. Rendered with graphite color, dashed underline, and `[AI]` indicator.
- `edited`: Direct human change. Rendered with amber marker and recorded in audit log.
- `ink`: Confirmed by qualified personnel. Solid black `#15181B`, solid border, and `[✓]` verdigris stamp.

---

## 5. API Endpoints Table

| Method | Endpoint | Description | Streaming |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` | Service health & active Groq models | No |
| `GET` | `/api/investigations` | List all investigations with metadata | No |
| `POST` | `/api/investigations` | Create new blank investigation | No |
| `GET` | `/api/investigations/{id}` | Full investigation record & relations | No |
| `PATCH` | `/api/investigations/{id}` | Update fields (writes audit trail) | No |
| `POST` | `/api/investigations/{id}/copilot` | **Unified Assistant Endpoint (Chat, PDF/Email intake, natural language edit)** | **Yes (SSE)** |
| `PATCH` | `/api/hypotheses/{id}/confirm` | Promote hypothesis to confirmed root cause with QP attestation | No |
| `POST` | `/api/investigations/{id}/evidence` | Submit supplemental logbook evidence & re-analyse | No |
| `PATCH` | `/api/capa/{id}` | Accept, edit, or reject proposed CAPA | No |
| `POST` | `/api/investigations/{id}/save` | Validate checklist, lock revision, bump version | No |
| `POST` | `/api/investigations/{id}/reopen` | Reopen new draft revision (vN+1) | No |
| `GET` | `/api/investigations/{id}/audit` | Append-only ALCOA+ audit log | No |
| `GET` | `/api/samples` | List available demo incident scenarios | No |

