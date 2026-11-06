import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface SourceQuote {
  quote: string;
  start?: number;
  end?: number;
  page?: number;
  verified: boolean;
}

export interface FieldValue {
  value: string | null;
  status: 'empty' | 'pencil' | 'edited' | 'ink';
  confidence: 'low' | 'medium' | 'high';
  source?: SourceQuote | null;
  rationale?: string | null;
}

export interface Hypothesis {
  id: string;
  statement: string;
  category: string;
  qualitative_likelihood: 'high' | 'medium' | 'low';
  strength: 'hypothesis' | 'supported' | 'corroborated' | 'confirmed';
  rank: number;
  evidence_for: Array<{ quote: string }>;
  evidence_against: Array<{ quote: string }>;
  evidence_needed: string[];
  confirmed_by?: string | null;
  confirmed_role?: string | null;
  confirmed_at?: string | null;
}

export interface WhyStep {
  level: number;
  why: string;
  answer: string;
  evidence_quote?: string;
}

export interface WhyChain {
  id: string;
  branch_title: string;
  steps: WhyStep[];
  terminal_cause?: string;
  category?: string;
}

export interface FishboneCause {
  id: string;
  category: 'Man' | 'Machine' | 'Material' | 'Method' | 'Measurement' | 'Milieu' | string;
  cause_text: string;
  status: 'pencil' | 'edited' | 'ink';
  evidence_quote?: string;
}

export interface MissingEvidenceItem {
  id: string;
  item_title: string;
  why_it_matters: string;
  priority: 'low' | 'medium' | 'high';
  status: 'open' | 'requested' | 'received';
  linked_hypothesis_id?: string;
  requested_at?: string;
  received_at?: string;
  received_content?: string;
}

export interface CAPAItem {
  id: string;
  action_type: 'correction' | 'corrective' | 'preventive';
  description: string;
  rationale: string;
  owner_role: string;
  due_offset_days: number;
  target_date?: string;
  priority: 'minor' | 'major' | 'critical';
  effectiveness_check: {
    metric?: string;
    method?: string;
    timing_months?: number;
  };
  status: 'proposed' | 'accepted' | 'edited' | 'rejected';
  linked_hypothesis_id?: string;
}

export interface AuditLogItem {
  id: string;
  actor_type: 'human' | 'ai' | 'system';
  actor_label: string;
  action: string;
  entity: string;
  before_state?: any;
  after_state?: any;
  created_at: string;
}

export interface WorkspaceState {
  id: string | null;
  rca_number: string;
  title: string;
  product_name?: string;
  batch_number?: string;
  classification: string;
  status: string;
  version: number;
  is_locked: boolean;
  form_data: Record<string, FieldValue>;
  ai_assessment: {
    severity: string;
    recommended_action: string;
    risk_rationale: string;
    impact_scope: string;
    compliance_anchors: string[];
  };
  sources: Array<{ id: string; kind: string; filename?: string; text_snippet?: string }>;
  hypotheses: Hypothesis[];
  why_chains: WhyChain[];
  fishbone_causes: FishboneCause[];
  missing_evidence: MissingEvidenceItem[];
  capa_actions: CAPAItem[];
  audit_logs: AuditLogItem[];
  activeSourceViewer: { quote: string; verified: boolean; start?: number; end?: number } | null;
  loading: boolean;
  error: string | null;
}

const initialState: WorkspaceState = {
  id: null,
  rca_number: '',
  title: '',
  classification: 'major',
  status: 'draft',
  version: 1,
  is_locked: false,
  form_data: {},
  ai_assessment: {
    severity: 'major',
    recommended_action: '',
    risk_rationale: '',
    impact_scope: '',
    compliance_anchors: [],
  },
  sources: [],
  hypotheses: [],
  why_chains: [],
  fishbone_causes: [],
  missing_evidence: [],
  capa_actions: [],
  audit_logs: [],
  activeSourceViewer: null,
  loading: false,
  error: null,
};

export const fetchInvestigationById = createAsyncThunk(
  'workspace/fetchById',
  async (id: string) => {
    const res = await fetch(`/api/investigations/${id}`);
    if (!res.ok) throw new Error('Investigation not found');
    return await res.json();
  }
);

export const confirmHypothesisThunk = createAsyncThunk(
  'workspace/confirmHypothesis',
  async ({ id, name, role }: { id: string; name: string; role: string }) => {
    const res = await fetch(`/api/hypotheses/${id}/confirm`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirmed_by: name, confirmed_role: role }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Confirmation failed');
    }
    return await res.json();
  }
);

export const updateCAPAThunk = createAsyncThunk(
  'workspace/updateCAPA',
  async ({ id, status, description }: { id: string; status: string; description?: string }) => {
    const res = await fetch(`/api/capa/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, description }),
    });
    if (!res.ok) throw new Error('Failed to update CAPA');
    return await res.json();
  }
);

export const addEvidenceThunk = createAsyncThunk(
  'workspace/addEvidence',
  async ({ invId, title, content }: { invId: string; title: string; content: string }) => {
    const res = await fetch(`/api/investigations/${invId}/evidence`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ item_title: title, received_content: content }),
    });
    if (!res.ok) throw new Error('Failed to add supplemental evidence');
    return await res.json();
  }
);

export const lockAndSaveInvestigation = createAsyncThunk(
  'workspace/lockAndSave',
  async (invId: string) => {
    const res = await fetch(`/api/investigations/${invId}/save`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to save and lock');
    return await res.json();
  }
);

export const reopenInvestigation = createAsyncThunk(
  'workspace/reopen',
  async (invId: string) => {
    const res = await fetch(`/api/investigations/${invId}/reopen`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to reopen revision');
    return await res.json();
  }
);

export const workspaceSlice = createSlice({
  name: 'workspace',
  initialState,
  reducers: {
    setFieldUpdate(state, action: PayloadAction<{ field: string; data: FieldValue }>) {
      const { field, data } = action.payload;
      state.form_data[field] = data;
      if (field === 'product_name' && data.value) state.product_name = data.value;
      if (field === 'batch_number' && data.value) state.batch_number = data.value;
    },
    setAssessmentUpdate(state, action: PayloadAction<any>) {
      state.ai_assessment = action.payload;
      if (action.payload.severity) state.classification = action.payload.severity;
    },
    setAnalysisPayload(state, action: PayloadAction<any>) {
      const p = action.payload;
      if (p.why_chains) state.why_chains = p.why_chains;
      if (p.fishbone_causes) state.fishbone_causes = p.fishbone_causes;
      if (p.hypotheses) state.hypotheses = p.hypotheses;
      if (p.missing_evidence) state.missing_evidence = p.missing_evidence;
      if (p.capa_actions) state.capa_actions = p.capa_actions;
    },
    confirmField(state, action: PayloadAction<string>) {
      const fieldKey = action.payload;
      if (state.form_data[fieldKey]) {
        state.form_data[fieldKey].status = 'ink';
      }
    },
    confirmSectionFields(state, action: PayloadAction<string[]>) {
      const fields = action.payload;
      fields.forEach((k) => {
        if (state.form_data[k] && state.form_data[k].value) {
          state.form_data[k].status = 'ink';
        }
      });
    },
    inlineEditField(state, action: PayloadAction<{ field: string; value: string }>) {
      const { field, value } = action.payload;
      if (state.form_data[field]) {
        state.form_data[field].value = value;
        state.form_data[field].status = 'edited';
      }
    },
    setActiveSourceViewer(state, action: PayloadAction<any>) {
      state.activeSourceViewer = action.payload;
    },
    clearActiveSourceViewer(state) {
      state.activeSourceViewer = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchInvestigationById.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchInvestigationById.fulfilled, (state, action) => {
        state.loading = false;
        const d = action.payload;
        state.id = d.id;
        state.rca_number = d.rca_number;
        state.title = d.title;
        state.product_name = d.product_name;
        state.batch_number = d.batch_number;
        state.classification = d.classification;
        state.status = d.status;
        state.version = d.version;
        state.is_locked = d.is_locked;
        state.form_data = d.form_data || {};
        state.ai_assessment = d.ai_assessment || state.ai_assessment;
        state.sources = d.sources || [];
        state.hypotheses = d.hypotheses || [];
        state.why_chains = d.why_chains || [];
        state.fishbone_causes = d.fishbone_causes || [];
        state.missing_evidence = d.missing_evidence || [];
        state.capa_actions = d.capa_actions || [];
        state.audit_logs = d.audit_logs || [];
      })
      .addCase(confirmHypothesisThunk.fulfilled, (state, action) => {
        const updated = action.payload;
        const h = state.hypotheses.find((item) => item.id === updated.id);
        if (h) {
          h.strength = 'confirmed';
          h.confirmed_by = updated.confirmed_by;
          h.confirmed_role = updated.confirmed_role;
          h.confirmed_at = updated.confirmed_at;
        }
      })
      .addCase(updateCAPAThunk.fulfilled, (state, action) => {
        const updated = action.payload;
        const c = state.capa_actions.find((item) => item.id === updated.id);
        if (c) {
          c.status = updated.status;
          if (updated.description) c.description = updated.description;
        }
      })
      .addCase(lockAndSaveInvestigation.fulfilled, (state, action) => {
        state.is_locked = true;
        state.status = 'reviewed';
      })
      .addCase(reopenInvestigation.fulfilled, (state, action) => {
        state.is_locked = false;
        state.version = action.payload.version;
        state.status = 'draft';
      });
  },
});

export const {
  setFieldUpdate,
  setAssessmentUpdate,
  setAnalysisPayload,
  confirmField,
  confirmSectionFields,
  inlineEditField,
  setActiveSourceViewer,
  clearActiveSourceViewer,
} = workspaceSlice.actions;

export default workspaceSlice.reducer;

