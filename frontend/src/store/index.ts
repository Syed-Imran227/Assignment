import { configureStore } from '@reduxjs/toolkit';
import investigationsReducer from './investigationsSlice';
import workspaceReducer from './workspaceSlice';
import copilotReducer from './copilotSlice';
import uiReducer from './uiSlice';

export const store = configureStore({
  reducer: {
    investigations: investigationsReducer,
    workspace: workspaceReducer,
    copilot: copilotReducer,
    ui: uiReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

