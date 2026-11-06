# ROLE
You are a senior full-stack AI engineer and product designer. You are building "Rootline", an AI-assisted Root Cause Analysis (RCA) module for a pharmaceutical manufacturer of Active Pharmaceutical Ingredients (APIs). This is a 48-hour challenge for AIVOA.AI. It is judged on: (1) a complete, reliable, demoable end-to-end AI workflow, (2) product judgment in the quality domain, (3) distinctive, polished design, (4) the author's ability to explain every part of the code on camera.
Priority order: working end-to-end flow > correctness and grounding > design polish > extra features. Work in small steps. After each step run the app and the tests. Never leave the repo broken. Before each phase, state your plan in under 10 lines; after each phase, summarise what changed and how to verify it. Ask a question only if you are truly blocked; otherwise make a sensible decision and note it in DECISIONS.md.

# HARD CONSTRAINTS
- Mandatory stack: React + Redux (Redux Toolkit), Python + FastAPI, LangGraph + Groq, SQLAlchemy (PostgreSQL / SQLite support without requiring Docker).
- Build ONLY the Root Cause Analysis module. Do not build Customer Complaint, Deviation, or Change Control modules. The deviation/incident document is the INPUT; the RCA workflow is the PRODUCT.
- The primary workflow is: user gives the AI panel a document / pasted text / email -> AI extracts -> the RCA form is populated by the AI -> AI helps investigate -> user reviews, edits, saves. Manual typing is only for corrections. Sample-data buttons must fill the INTAKE box, never the form directly.
- AI-generated root causes are HYPOTHESES. Only a human can promote one to "Confirmed", and only with at least one linked evidence item and an attestation (name and role).
- Never invent facts. If something is not in the source, the field stays empty and appears in the missing-information list.
- Secrets only in .env (GROQ_API_KEY, DATABASE_URL). Provide .env.example. Git is local only: no remote. .gitignore must cover .env, .venv, uploads/, samples/, node_modules, __pycache__.

# [VIDEO NOTES]
REFERENCE VIDEO NOTES (authoritative: these override any layout, screen or flow suggestion elsewhere in this file, including the PRODUCT SCREENS section and the phase prompts).
Source: transcript of the reference demo (a Customer Complaint module, used ONLY to copy the interaction pattern; we build the RCA equivalent).

LAYOUT
- Split screen. LEFT: the form (here: the RCA investigation form). RIGHT: an AI co-pilot chat assistant (here: the "Rootline co-pilot"). Left about 56%, right about 44%.
- No separate intake tabs and no left section rail. Intake happens in the chat composer: typed or pasted text, or an attached PDF / email (.eml). Use a slim sticky section index at the top of the form for navigation.
- The form has the AI-populated data fields AND an "AI assessment" section filled by the AI's own reasoning. In the video this was the "AI co-pilot risk assessment" (severity, next action, other risk details). Here it holds: severity/classification, recommended next action, risk rationale, impact scope; then the investigation (5 Whys, fishbone, ranked hypotheses), missing evidence, and CAPA.

THE FORM IS NOT FILLED MANUALLY
- Structured fields are read-only for typing. The assistant fills and updates them. Corrections happen through chat.
- Each field has an "Ask AI to change" action that focuses the chat composer with "Change <field> to " prefilled.
- Direct inline editing is allowed only for human review decisions: confirming or rewording the root cause statement, and accepting / editing / rejecting CAPA wording. These are logged as human edits.

THREE MANDATORY AI TOOLS (LangGraph tool nodes behind ONE co-pilot agent graph; show each call in the chat as a tool chip)
1. log_investigation: a free-text prompt, e.g. "Tray dryer TD-204 was stopped about 2 hours early on batch AMB260409B of amlodipine besylate API after a vacuum pump alarm. Final QC reported residual methanol at 3,400 ppm against a limit of 3,000 ppm. Two HDPE drums, about 60 kg. Please start an RCA." -> extract the details and populate the form (product name, strength/grade, batch/lot number, manufacturing date, expiry or retest date, affected quantity and packaging, equipment, manufacturing stage, reporter, how detected, description, containment) -> populate the AI assessment by reasoning (e.g. severity major, next action: hold batch and route to QA investigation) -> continue into the RCA analysis (whys, fishbone, hypotheses, missing evidence, CAPA) as a second streamed stage of the same turn.
2. edit_investigation: a natural-language correction, e.g. "Sorry, the batch number is AMB260409C and the affected quantity is 48 kg in 2 HDPE drums." -> update BOTH the form and the AI assessment while PRESERVING every other value. Implementation: the LLM returns a minimal patch containing only the fields the user referred to; a deterministic merge applies it; a field-to-assessment dependency map (e.g. quantity -> impact scope, severity, containment, CAPA scope; batch -> traceability and adjacent-batch check; dates -> timeline consistency) decides which assessment parts are re-derived; untouched fields and human-confirmed (ink) fields are never altered unless explicitly targeted. The chat reply lists exactly what changed (old -> new) and what was re-assessed. If the request is ambiguous, ask ONE short clarifying question instead of guessing.
3. extract_document: the user attaches a PDF or email in the chat -> extract -> populate the form -> populate the AI assessment by reasoning. Example sample to generate: a deviation report for Metformin hydrochloride API, grade IP/BP, batch/lot MFH260712A, 2 HDPE drums. AFTER extraction the user must still be able to modify everything in natural language, e.g. "Sorry, the batch number is CHG260712A and affected quantity is 50 kg in 2 HDPE drums" must update the batch number and quantity fields (and the dependent assessment) and nothing else.
Also support (as further tools or chat commands): run_rca (5 Whys, fishbone, hypotheses), find_missing_evidence, recommend_capa, explain (grounded answers about the current record). A deterministic shortcut routes any message with an attachment to extract_document; otherwise the router uses LLM tool-calling.
The app must handle the exact phrasings above AND the reference video's own examples (e.g. "Apollo Pharmacy reported discolored capsules in amoxicillin capsules 500 mg", "the batch number is BMX24602 and the affected quantity is 48 capsules") without errors, even though the product is a complaint, because reviewers may test with them. If a message describes a customer complaint rather than a manufacturing incident, still extract what maps to the RCA form and say in chat what it treated as the trigger event.

CHAT BEHAVIOUR
- Works like ChatGPT: streaming assistant replies, message history persisted per investigation (chat_messages table), tool chips showing which tool ran, change summaries, suggested-prompt chips that fill the COMPOSER (never the form).
- One unified endpoint drives this: POST /api/investigations/{id}/copilot (SSE; accepts message text and an optional file). Events: tool_selected, node_start, node_end, field_update, assessment_update, message_delta, done, error. The earlier separate extract / analyze endpoints may remain as internal services.

DEMO ORDER THE APP MUST SUPPORT
typed prompt -> form and assessment fill -> natural-language edit (form and assessment update, everything else preserved) -> upload PDF -> form and assessment fill -> natural-language edit -> review -> save.

# DOMAIN MODEL (what the product must reflect)
Workflow: Deviation identification -> Investigation / RCA -> CAPA -> effectiveness check -> QA closure. Rootline covers the middle of this: it ingests the deviation information and produces the investigation and the CAPA proposal.
Typical deviation facts: deviation or incident ID, date/time of occurrence, date/time of discovery, site, area/department, equipment ID, product (API name), batch/lot number, manufacturing stage (e.g. reaction, crystallisation, centrifugation, drying, milling, blending, packaging), quantity affected, how it was detected, detected by, description of what happened, immediate containment, impact assessment (product quality, patient safety, other batches/products, regulatory/filing), classification (minor/major/critical) with rationale.
RCA methods: 5 Whys (branching allowed) and Ishikawa fishbone using 6M categories: Man (people), Machine (equipment), Material, Method (procedure/batch record), Measurement (analytical/IPC/instruments), Milieu (environment/utilities).
Flow rules: contributing factors are not the same as the root cause. A root cause is the deepest cause that, if removed, would prevent recurrence. "Human error" is rarely accepted as a terminal root cause; push to why the system allowed the error (procedure ambiguity, training gap, interface/label design, workload, missing interlock).
CAPA: Correction (fix the immediate problem, e.g. reject/reprocess/retest the batch), Corrective action (remove the cause), Preventive action (prevent the same cause elsewhere or in other products). Each has owner role, due date, priority, and an effectiveness check (metric, method, timing).
Anchors to cite in the UI where relevant: ICH Q7 (GMP for APIs), ICH Q9 (quality risk management), ICH Q10 (pharmaceutical quality system, CAPA), 21 CFR 211.192 (investigation of unexplained discrepancies), ALCOA+ data integrity principles.

# THE PENCIL AND INK RULE
Every AI-written value has status: empty | pencil | edited | ink.
- pencil: written by AI, unconfirmed. Rendered in graphite-grey text with a dashed underline and a small "AI" marker.
- edited: a human changed it (solid text, small "edited" marker).
- ink: a human confirmed it (solid black, solid rule, check mark). Confirmation takes one click or Enter on a focused field.
- The transition pencil -> ink is animated.
Every AI value also has: confidence (low/medium/high), source (quote + position in the document, with verified: true/false), and a one-line rationale.

