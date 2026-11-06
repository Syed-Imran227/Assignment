# Video 1: Product Demonstration Script (Target: 5–8 minutes)

> **Guidelines for Recording**: Record in 1080p at full screen. Keep code off screen. Speak calmly and deliberately. Use clear cursor movements.

---

### [0:00 – 0:30] Introduction & The Problem
- **What to show**: The Rootline home screen (`http://localhost:5173`) displaying the dense table of past investigations, then click **"New Investigation"**.
- **What to say**:
  > "Welcome to Rootline. In Active Pharmaceutical Ingredient (API) manufacturing, when a quality deviation or out-of-specification result occurs, quality investigators often spend days piecing together maintenance logbooks, SCADA historian alarms, and batch manufacturing records into a formal Root Cause Analysis.
  >
  > Rootline is an AI-powered RCA module designed specifically for pharmaceutical manufacturers under ICH Q7, ICH Q9, and 21 CFR 211.192. It assists quality professionals by ingesting incident records, performing causal analysis, and formulating CAPAs—while adhering to the core principle: *the AI writes in pencil; a qualified human inks it in.* Let's start an investigation."

---

### [0:30 – 1:30] Incident Intake & Real-Time LangGraph Agent Trace
- **What to show**: In the workspace split-screen, point out the calm record form on the left (~56%) and the Rootline Co-Pilot on the right (~44%). In the Co-Pilot panel, click the suggested prompt chip **"Sample A: Amlodipine Tray Dryer OOS"** (or paste the email text), then click **"Send"**.
- **What to say**:
  > "Here we have our split-screen workspace: on the left is 'The Record'—the formal RCA investigation document; on the right is the Rootline Co-Pilot. Intake occurs naturally in the chat composer: users can paste emails, write free-text summaries, or attach deviation PDFs.
  >
  > Notice what happens when we send this incident notification regarding Amlodipine Besylate batch AMB260409B: the real-time LangGraph execution trace immediately activates. It displays actual server-side execution nodes—reading and classifying the document, extracting structured entities, and verifying quotes against the source text."

---

### [1:30 – 2:30] Sequential Field "Stamp-In", Pencil State & Verbatim Grounding
- **What to show**: Show the fields on the left stamping into the form sequentially. Point out the graphite text, dashed underline, and `[AI PENCIL]` indicator. Click a **Source Citation Chip** to open the **Source Evidence Drawer** showing the exact quote highlighted.
- **What to say**:
  > "Notice how the fields stamp into the form sequentially at 70-millisecond intervals. In accordance with ALCOA+ data integrity, every extracted field is rendered in **pencil**—graphite text with a dashed underline and an AI marker. Nothing is marked as final until a qualified human validates it.
  >
  > Every field carries a grounded source chip. When I click on the residual methanol specification or the 60 kg batch quantity, the Source Evidence Drawer opens on the right, confirming the exact quote in the original text. Crucially, Rootline never invents facts: unstated fields remain empty and are registered as open investigation gaps."

---

### [2:30 – 4:00] Dual-View RCA: 5 Whys Descent, 6M Fishbone, & Human Error Guardrail
- **What to show**: Scroll down to Section 04. Show the **5 Whys Descent tree** with its vertical connecting line. Highlight that Level 5 pushes past the operator reset to the systemic SOP/vacuum deficit. Toggle to the **6M Fishbone SVG** view and click a cause node. Then show the **Ranked Hypotheses** list.
- **What to say**:
  > "Rootline provides two synchronized views over the causal analysis. Here is our 5 Whys Descent tree. Notice our **Human Error Guardrail**: the incident mentioned an apprentice operator resetting an alarm, but Rootline enforces regulatory compliance by rejecting 'operator error' as a terminal root cause. Instead, it drives deeper into why the system allowed the discrepancy—revealing ambiguous SOP decision trees and condenser tube fouling.
  >
  > We can seamlessly toggle to our custom, hand-crafted 6M Ishikawa Fishbone diagram, categorizing factors into Man, Machine, Material, Method, Measurement, and Milieu. Below it, hypotheses are ranked with qualitative likelihood—high, medium, or low—avoiding false mathematical precision. Under our guardrail, the AI can only rate a cause as 'supported', never 'confirmed'."

---

### [4:00 – 5:00] Missing Evidence & Dynamic Re-Analysis
- **What to show**: Navigate to Section 05. Click **"Draft Request"** on the vacuum pump logbook item to copy formal request text. Then click **"Provide Evidence"**, paste a short snippet (e.g., `Engineering inspection confirms condenser tube scale fouling and seal pressure degradation`), click **"Submit & Re-analyse"**, and show the Co-Pilot re-assessing and updating the record.
- **What to say**:
  > "Real investigations are iterative. Section 05 registers missing evidence items. If an investigator needs an engineering logbook, clicking 'Draft Request' copies a pre-formatted, regulatory-compliant request to the clipboard.
  >
  > When that evidence arrives, we paste the engineering excerpt directly into the register and click 'Submit & Re-analyse'. The Co-Pilot processes the new finding, marks the item as received, and visibly re-evaluates the causal ranking."

---

### [5:00 – 5:50] Natural Language Edit & Human Attestation (Pencil to Ink)
- **What to show**: In the Co-Pilot chat composer, type: `Sorry, the batch number is AMB260409C and the affected quantity is 48 kg in 2 HDPE drums.` Send it and show only those two fields updating while preserving everything else. Then click **"Confirm as Root Cause"** on Hypothesis #1, fill in the Qualified Person name/role, and submit to convert it to **INK** (`[✓]` verdigris).
- **What to say**:
  > "Investigators never have to fight a rigid form. If batch details need correction, the user simply tells the Co-Pilot in natural language: 'Sorry, the batch number is AMB260409C and quantity is 48 kg.' The tool computes a minimal patch, deterministic merge applies it, and dependent scopes update while preserving all other values.
  >
  > Now, for regulatory compliance: only a qualified human can promote a cause to 'Confirmed'. I click 'Confirm as Root Cause', enter my name and Qualified Person role, and submit. The provisional pencil transitions permanently to **Ink**—solid text with an official verdigris attestation stamp."

---

### [5:50 – 6:30] 3-Tier CAPA, Review, Locking & Audit Trail
- **What to show**: Show Section 06 CAPA table with Correction, Corrective Action, and Preventive Action. Accept one CAPA, reject another (showing it struck through). Then scroll to Section 07, click **"Approve & Lock Investigation"**, and show the immutable record locked at v1.0. Scroll to Section 08 to show the append-only audit trail.
- **What to say**:
  > "In Section 06, Rootline proposes a complete 3-tier CAPA plan under ICH Q10: Correction to disposition the affected batch, Corrective Action on pump seals, and Preventive Action for BMR automated interlocks. We accept the corrective action and reject an unneeded item, which remains visible for auditability.
  >
  > Finally, in Section 07, our validation checklist confirms all required fields and attestations are satisfied. Clicking 'Approve & Lock Investigation' locks revision 1.0 against tampering. In Section 08, the ALCOA+ append-only audit trail logs every AI suggestion, natural language edit, and human sign-off.
  >
  > Rootline keeps the investigator in full control while accelerating investigation velocity."
