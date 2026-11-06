import React, { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { setComposerText } from '../../store/copilotSlice';
import { sendCopilotMessage } from '../../services/sse';
import {
  Send,
  Paperclip,
  Sparkles,
  Cpu,
  CheckCircle2,
  Clock,
  FileText,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export const CopilotPanel: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const invId = useSelector((state: RootState) => state.workspace.id);
  const copilotState = useSelector((state: RootState) => state.copilot);
  const isStreaming = copilotState.isStreaming;
  const messages = copilotState.messages;
  const agentTrace = copilotState.agentTrace;
  const activeTool = copilotState.activeTool;
  const composerText = copilotState.composerText;

  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [showTrace, setShowTrace] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, agentTrace]);

  const handleSend = () => {
    if (!invId) return;
    if (!composerText.trim() && !attachedFile) return;

    sendCopilotMessage(dispatch, invId, composerText, attachedFile || undefined);
    dispatch(setComposerText(''));
    setAttachedFile(null);
  };

  const handlePromptChipClick = (text: string) => {
    dispatch(setComposerText(text));
    const composer = document.getElementById('copilot-composer');
    if (composer) composer.focus();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAttachedFile(e.target.files[0]);
    }
  };

  return (
    <div className="h-full flex flex-col bg-sheet border-l border-rule">
      {/* Panel Header */}
      <div className="p-3.5 border-b border-rule flex items-center justify-between bg-paper flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-sm bg-slate-blue/15 flex items-center justify-center text-slate-blue">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <h2 className="font-serif text-sm font-medium text-ink leading-tight">
              Rootline Co-Pilot
            </h2>
            <span className="text-[10px] font-mono text-graphite block">
              ICH Q7 Investigation Assistant
            </span>
          </div>
        </div>

        {/* Active Tool Chip */}
        {activeTool && (
          <span className="px-2 py-0.5 rounded-sm bg-slate-blue text-sheet font-mono text-[10.5px] font-medium flex items-center gap-1 shadow-sm animate-pulse">
            <Cpu className="w-3 h-3" />
            <span>tool: {activeTool}</span>
          </span>
        )}
      </div>

      {/* Live Agent Trace Accordion */}
      {agentTrace.length > 0 && (
        <div className="border-b border-rule bg-sheet-subtle text-xs font-mono flex-shrink-0">
          <button
            type="button"
            onClick={() => setShowTrace(!showTrace)}
            className="w-full px-3 py-1.5 flex items-center justify-between text-graphite hover:text-ink transition-colors"
          >
            <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-blue">
              <Cpu className="w-3 h-3" />
              <span>Real-Time LangGraph Execution Trace ({agentTrace.length} nodes)</span>
            </span>
            {showTrace ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showTrace && (
            <div className="px-3 pb-2.5 pt-1 space-y-1.5 max-h-36 overflow-y-auto">
              {agentTrace.map((node) => (
                <div key={node.id} className="flex items-center justify-between text-[11px] font-mono text-graphite">
                  <span className="flex items-center gap-1.5 truncate">
                    {node.status === 'completed' ? (
                      <CheckCircle2 className="w-3 h-3 text-verdigris flex-shrink-0" />
                    ) : (
                      <Clock className="w-3 h-3 text-amber animate-spin flex-shrink-0" />
                    )}
                    <span className="truncate">{node.node}</span>
                  </span>
                  {node.time && <span className="text-[10px] text-graphite-light ml-2">{node.time}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Message History */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="py-8 px-4 text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-paper border border-rule mx-auto flex items-center justify-center text-slate-blue">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-base font-medium text-ink">
              Start an Investigation
            </h3>
            <p className="text-xs text-graphite max-w-sm mx-auto leading-relaxed font-sans">
              Provide incident notes, paste an email notification, or attach a deviation report PDF.
              Rootline will extract facts into pencil and formulate the 5 Whys and Fishbone RCA.
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[90%] rounded-sm p-3 text-xs font-sans leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-ink text-sheet'
                    : 'bg-paper border border-rule text-ink shadow-subtle'
                }`}
              >
                {/* Tool call indicator if assistant ran tools */}
                {msg.tool_calls && msg.tool_calls.length > 0 && (
                  <div className="mb-1.5 pb-1 border-b border-rule-subtle font-mono text-[10px] text-slate-blue flex items-center gap-1">
                    <Cpu className="w-2.5 h-2.5" />
                    <span>Tool executed: {msg.tool_calls.map((t) => t.tool).join(', ')}</span>
                  </div>
                )}
                <div className="whitespace-pre-wrap">{msg.content}</div>
              </div>
              <span className="font-mono text-[9.5px] text-graphite-light mt-1 px-1">
                {msg.role === 'user' ? 'You' : 'Rootline AI'}
              </span>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompt Chips */}
      <div className="p-2 border-t border-rule-subtle bg-paper flex-shrink-0">
        <span className="text-[10px] font-mono text-graphite uppercase tracking-wider block mb-1 px-1">
          Demo Intake Prompts:
        </span>
        <div className="flex flex-wrap gap-1.5">
          {copilotState.suggestedPrompts.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handlePromptChipClick(p.text)}
              className="text-[11px] font-sans px-2 py-1 rounded-sm bg-sheet hover:bg-sheet-subtle border border-rule text-graphite hover:text-ink transition-colors text-left truncate max-w-[280px]"
              title={p.text}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Composer */}
      <div className="p-3 border-t border-rule bg-sheet flex-shrink-0">
        {attachedFile && (
          <div className="mb-2 p-1.5 bg-paper rounded-sm border border-slate-blue/30 text-xs font-mono flex items-center justify-between text-slate-blue">
            <span className="truncate flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{attachedFile.name} ({(attachedFile.size / 1024).toFixed(1)} KB)</span>
            </span>
            <button
              type="button"
              onClick={() => setAttachedFile(null)}
              className="text-graphite hover:text-ink px-1 text-xs"
            >
              Remove
            </button>
          </div>
        )}

        <div className="flex items-end gap-2 bg-paper p-1.5 rounded-sm border border-rule-strong focus-within:border-ink transition-colors">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".pdf,.eml,.txt"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-1.5 text-graphite hover:text-ink rounded-sm transition-colors"
            title="Attach deviation PDF or email (.eml)"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          <textarea
            id="copilot-composer"
            value={composerText}
            onChange={(e) => dispatch(setComposerText(e.target.value))}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type incident details, attach deviation PDF, or ask to change fields..."
            rows={2}
            className="flex-1 bg-transparent text-xs font-sans text-ink focus:outline-none resize-none placeholder:text-graphite-light"
          />

          <button
            type="button"
            onClick={handleSend}
            disabled={isStreaming || (!composerText.trim() && !attachedFile)}
            className="px-3 py-1.5 bg-ink text-sheet hover:bg-black disabled:opacity-40 disabled:cursor-not-allowed rounded-sm transition-colors text-xs font-sans font-medium flex items-center gap-1"
          >
            <Send className="w-3 h-3" />
            <span>Send</span>
          </button>
        </div>
      </div>
    </div>
  );
};
