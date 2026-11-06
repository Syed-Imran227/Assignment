import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface InvestigationSummary {
  id: string;
  rca_number: string;
  title: string;
  product_name?: string;
  batch_number?: string;
  classification: string;
  status: string;
  version: number;
  is_locked: boolean;
  created_at?: string;
  updated_at?: string;
}

interface InvestigationsState {
  items: InvestigationSummary[];
  loading: boolean;
  error: string | null;
}

const initialState: InvestigationsState = {
  items: [],
  loading: false,
  error: null,
};

export const fetchInvestigations = createAsyncThunk(
  'investigations/fetchAll',
  async () => {
    const res = await fetch('/api/investigations');
    if (!res.ok) throw new Error('Failed to fetch investigations');
    return (await res.json()) as InvestigationSummary[];
  }
);

export const createInvestigation = createAsyncThunk(
  'investigations/create',
  async (title?: string) => {
    const res = await fetch('/api/investigations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    });
    if (!res.ok) throw new Error('Failed to create investigation');
    return (await res.json()) as { id: string; rca_number: string };
  }
);

export const investigationsSlice = createSlice({
  name: 'investigations',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchInvestigations.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchInvestigations.fulfilled, (state, action: PayloadAction<InvestigationSummary[]>) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchInvestigations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Error loading investigations';
      });
  },
});

export default investigationsSlice.reducer;

