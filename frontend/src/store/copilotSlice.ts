import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ChatMessageItem {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  tool_calls?: Array<{ tool: string }>;
  created_at?: string;
}

export interface TraceNode {
  id: string;
  node: string;
  time?: string;
  status: 'running' | 'completed' | 'failed';
}

interface CopilotState {
  messages: ChatMessageItem[];
  activeTool: string | null;
  agentTrace: TraceNode[];
  isStreaming: boolean;
  composerText: string;
  suggestedPrompts: Array<{ label: string; text: string }>;
}

const initialState: CopilotState = {
  messages: [],
  activeTool: null,
  agentTrace: [],
  isStreaming: false,
  composerText: '',
  suggestedPrompts: [
    {
      label: 'Sample A: Amlodipine Tray Dryer OOS',
      text: 'Tray dryer TD-204 was stopped about 2 hours early on batch AMB260409B of amlodipine besylate API after a vacuum pump alarm. Final QC reported residual methanol at 3,400 ppm against a limit of 3,000 ppm. Two HDPE drums, about 60 kg. Please start an RCA.',
    },
    {
      label: 'Sample B: Metformin PDF Excursion',
      text: 'Please extract and investigate the attached deviation report for Metformin hydrochloride API crystallisation temperature excursion and D90 particle size OOS on batch MFH260712A.',
    },
    {
      label: 'Natural Language Correction',
      text: 'Sorry, the batch number is AMB260409C and the affected quantity is 48 kg in 2 HDPE drums.',
    },
  ],
};

export const copilotSlice = createSlice({
  name: 'copilot',
  initialState,
  reducers: {
    addMessage(state, action: PayloadAction<ChatMessageItem>) {
      state.messages.push(action.payload);
    },
    appendToLastMessage(state, action: PayloadAction<string>) {
      if (state.messages.length > 0) {
        const last = state.messages[state.messages.length - 1];
        if (last.role === 'assistant') {
          last.content += action.payload;
        }
      }
    },
    setActiveTool(state, action: PayloadAction<string | null>) {
      state.activeTool = action.payload;
    },
    startTraceNode(state, action: PayloadAction<{ node: string; time?: string }>) {
      const existing = state.agentTrace.find((t) => t.node === action.payload.node);
      if (!existing) {
        state.agentTrace.push({
          id: Math.random().toString(),
          node: action.payload.node,
          time: action.payload.time,
          status: 'running',
        });
      }
    },
    endTraceNode(state, action: PayloadAction<{ node: string; status?: 'completed' | 'failed' }>) {
      const target = state.agentTrace.find((t) => t.node === action.payload.node);
      if (target) {
        target.status = action.payload.status || 'completed';
      }
    },
    clearTrace(state) {
      state.agentTrace = [];
    },
    setStreaming(state, action: PayloadAction<boolean>) {
      state.isStreaming = action.payload;
    },
    setComposerText(state, action: PayloadAction<string>) {
      state.composerText = action.payload;
    },
    setChatHistory(state, action: PayloadAction<ChatMessageItem[]>) {
      state.messages = action.payload;
    },
  },
});

export const {
  addMessage,
  appendToLastMessage,
  setActiveTool,
  startTraceNode,
  endTraceNode,
  clearTrace,
  setStreaming,
  setComposerText,
  setChatHistory,
} = copilotSlice.actions;

export default copilotSlice.reducer;

