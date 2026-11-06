import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UIState {
  activeSection: string;
  investigationMethod: 'whys' | 'fishbone';
  commandPaletteOpen: boolean;
  sourceDrawerOpen: boolean;
}

const initialState: UIState = {
  activeSection: '01',
  investigationMethod: 'whys',
  commandPaletteOpen: false,
  sourceDrawerOpen: false,
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setActiveSection(state, action: PayloadAction<string>) {
      state.activeSection = action.payload;
    },
    setInvestigationMethod(state, action: PayloadAction<'whys' | 'fishbone'>) {
      state.investigationMethod = action.payload;
    },
    setCommandPaletteOpen(state, action: PayloadAction<boolean>) {
      state.commandPaletteOpen = action.payload;
    },
    setSourceDrawerOpen(state, action: PayloadAction<boolean>) {
      state.sourceDrawerOpen = action.payload;
    },
  },
});

export const {
  setActiveSection,
  setInvestigationMethod,
  setCommandPaletteOpen,
  setSourceDrawerOpen,
} = uiSlice.actions;

export default uiSlice.reducer;

