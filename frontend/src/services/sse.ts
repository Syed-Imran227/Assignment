import { AppDispatch } from '../store';
import {
  setFieldUpdate,
  setAssessmentUpdate,
  setAnalysisPayload,
} from '../store/workspaceSlice';
import {
  setActiveTool,
  startTraceNode,
  endTraceNode,
  setStreaming,
  appendToLastMessage,
  addMessage,
} from '../store/copilotSlice';

export async function sendCopilotMessage(
  dispatch: AppDispatch,
  investigationId: string,
  messageText: string,
  attachedFile?: File
) {
  dispatch(setStreaming(true));

  // Add User message to local state
  dispatch(
    addMessage({
      id: Math.random().toString(),
      role: 'user',
      content: messageText + (attachedFile ? ` [File: ${attachedFile.name}]` : ''),
      created_at: new Date().toISOString(),
    })
  );

  // Add initial empty Assistant message to stream deltas into
  dispatch(
    addMessage({
      id: Math.random().toString(),
      role: 'assistant',
      content: '',
      created_at: new Date().toISOString(),
    })
  );

  const formData = new FormData();
  if (messageText) formData.append('message', messageText);
  if (attachedFile) formData.append('file', attachedFile);

  try {
    const response = await fetch(`/api/investigations/${investigationId}/copilot`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Server returned HTTP ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('Response body stream not available');

    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || '';

      for (const block of lines) {
        const line = block.trim();
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            handleSSEEvent(dispatch, data);
          } catch (e) {
            console.error('Failed to parse SSE line', line, e);
          }
        }
      }
    }
  } catch (err: any) {
    console.error('SSE Error:', err);
    dispatch(
      appendToLastMessage(
        `\n\n*[Connection notice: ${err.message || 'Error communicating with assistant. Please try again.'}]*`
      )
    );
  } finally {
    dispatch(setStreaming(false));
  }
}

function handleSSEEvent(dispatch: AppDispatch, payload: any) {
  switch (payload.type) {
    case 'tool_selected':
      dispatch(setActiveTool(payload.tool));
      break;
    case 'node_start':
      dispatch(startTraceNode({ node: payload.node, time: payload.time }));
      break;
    case 'node_end':
      dispatch(endTraceNode({ node: payload.node, status: payload.status }));
      break;
    case 'field_update':
      dispatch(setFieldUpdate({ field: payload.field, data: payload.data }));
      break;
    case 'assessment_update':
      dispatch(setAssessmentUpdate(payload.data));
      break;
    case 'analysis_update':
      dispatch(setAnalysisPayload(payload));
      break;
    case 'message_delta':
      dispatch(appendToLastMessage(payload.text));
      break;
    case 'done':
      dispatch(setStreaming(false));
      break;
    default:
      break;
  }
}

