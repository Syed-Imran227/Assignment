# Rootline Design System (docs/DESIGN.md)

## Metaphor
A quality control laboratory notebook and validated batch manufacturing record, modernized for precision, compliance, and calm focus. Every visual element communicates trust, auditability, and rigor. No flashy gradients, no purple AI cliches, no neon glows.

---

## 1. Color Palette & CSS Variables

```css
:root {
  /* Surfaces & Backgrounds */
  --color-paper: #F5F2EA;       /* App background, warm muted natural paper */
  --color-sheet: #FBF9F4;       /* Primary form surface, clean parchment */
  --color-sheet-subtle: #F0EDE4;/* Secondary nested card / panel background */
  
  /* Text & Ink */
  --color-ink: #15181B;         /* Primary confirmed text, crisp dark charcoal */
  --color-graphite: #5B6168;    /* Secondary labels, metadata, pencil text */
  --color-graphite-light: #8E959E; /* Dimmed placeholders and disabled states */

  /* Borders & Hairlines */
  --color-rule: #D8D2C3;        /* 1px structural dividing lines */
  --color-rule-strong: #B9B2A0; /* Active borders and emphasized boundaries */
  --color-rule-subtle: #E8E4DA; /* Inner table/row hairlines */

  /* Semantics */
  --color-verdigris: #1F7A66;   /* Confirmed / ink / validated (ICH compliant green) */
  --color-amber: #B7791F;       /* Attention required / medium-low confidence */
  --color-vermilion: #D2431F;   /* Critical deviation / reject / missing required */
  --color-slate-blue: #3E5C86;  /* AI suggestion marker / grounded link / citation */

  /* Pencil & Ink States */
  --color-pencil-text: #5B6168; /* Provisional AI suggestion */
  --color-pencil-line: #8E959E; /* Dashed underline for unconfirmed suggestions */
  --color-ink-confirmed: #15181B;/* Human validated and stamped */

  /* Typography */
  --font-serif: "Newsreader", "Georgia", serif;
  --font-sans: "IBM Plex Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --font-mono: "IBM Plex Mono", "SFMono-Regular", Consolas, monospace;

  /* Spacing (8px grid) */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;

  /* Radii & Shadows */
  --radius-sm: 2px;
  --radius-md: 4px;
  --radius-lg: 6px;
  --shadow-subtle: 0 1px 3px rgba(21, 24, 27, 0.05), 0 1px 2px rgba(21, 24, 27, 0.03);
  --shadow-popover: 0 4px 12px rgba(21, 24, 27, 0.08), 0 1px 3px rgba(21, 24, 27, 0.05);
}
```

---

## 2. Typography Hierarchy

| Style | Font Family | Size / Weight | Line Height | Tracking | Usage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Doc Title** | Newsreader | 28px / 500 | 1.25 | -0.01em | RCA Form Title, Document Header |
| **Section Head**| Newsreader | 19px / 500 | 1.35 | normal | "01 Event Details", "03 Investigation" |
| **Subsection** | IBM Plex Sans | 14px / 600 | 1.4 | +0.01em | Grouping headers, table section heads |
| **Field Label** | IBM Plex Sans | 12px / 500 | 1.2 | +0.02em | All input and data labels (uppercase/small) |
| **Body / Value**| IBM Plex Sans | 14px / 400 | 1.5 | normal | Regular content, field values, narratives |
| **Code / Data** | IBM Plex Mono | 12.5px / 400 | 1.4 | normal | Batch IDs, Lot numbers, Timestamps |
| **Badge / Tag** | IBM Plex Mono | 11px / 500 | 1.1 | +0.03em | Status markers, confidence tags, tool chips |

---

## 3. Pencil and Ink Design Pattern

| State | Text Style | Border / Underline | Marker | Meaning |
| :--- | :--- | :--- | :--- | :--- |
| `empty` | Light gray italic | 1px dotted rule | None | Field is empty / missing in source |
| `pencil` | Graphite italic-free | 1px dashed underline | Small `[AI]` slate chip | AI suggested, provisional, unconfirmed |
| `edited` | Dark ink | 1px solid rule | Small `[Edited]` amber chip | Human user edited the value |
| `ink` | Solid black (#15181B)| Solid rule | `[✓]` verdigris mark | Qualified human confirmed the value |

---

## 4. Component Inventory

1. **Button**:
   - `variant="primary"`: Solid dark ink with off-white text, 32px height, 3px radius.
   - `variant="secondary"`: Sheet background with 1px rule border and ink text.
   - `variant="ghost"`: Borderless, graphite hover state.
   - `variant="verdigris"`: Confirmed action, forest green.
2. **Field Container**:
   - Label with monospace section indicator.
   - Value display with pencil/ink transition.
   - Action icon: "Ask AI to change" (focuses co-pilot with prefilled command).
   - Source citation chip: quote snippet and verified badge.
3. **Chip & Badge**:
   - Classification: Minor (slate), Major (amber), Critical (vermilion).
   - Status: Open, In Review, Confirmed, Closed.
   - Source: Document quote with start/end position.
4. **Agent Trace Item**:
   - Monospace step title with real elapsed execution time.
   - Indicator dot (pulsing during execution, solid upon completion).
5. **6M Fishbone Diagram**:
   - Hand-crafted inline SVG.
   - Six diagonal spines: Man, Machine, Material, Method, Measurement, Milieu.
   - Cause nodes styled with pencil or ink status.
6. **5 Whys Descent**:
   - Linear tree with connecting vertical descent line.
   - Branching capability for multi-factorial root causes.
   - Terminal "Root Cause Reached" anchor node.
7. **CAPA Register**:
   - Dense table: Type (Correction, Corrective, Preventive), Action, Rationale, Linked Cause, Owner, Due Date, Effectiveness Check.
   - Action controls: Accept, Edit, Reject.

---

## 5. Three Reference Screen States

### State 1: Clean Workspace Intake
- Left: RCA form initialized with blank sections (`01 Deviation Intake`, `02 Immediate Containment`, `03 Root Cause Investigation`, `04 CAPA Proposal`).
- Right: Rootline Co-pilot welcoming the investigator with 3 sample prompt chips (Amlodipine tray dryer, Metformin crystallization PDF, HPLC impurity note).
- File upload drop-zone ready for PDF or .eml.

### State 2: Mid-Analysis & Provisional Pencil Fill
- Left: Fields streaming in sequentially with graphite color and dashed underlines (`pencil` state).
- Right: Co-pilot showing tool execution chip (`[Tool: log_investigation]`), active streaming reasoning, and live agent trace nodes.
- Investigation section populated with 6M fishbone and 5 Whys hypotheses. Missing evidence register flags open items.

### State 3: Reviewed, Confirmed & Locked Record
- All accepted fields transitioned to `ink` (solid black, verdigris checkmarks).
- Qualified person attestation signed.
- Version bumped to `v1.0` (Immutable). Save button replaced with "Reopen New Revision".
- Full append-only audit trail accessible.
