import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { addEvidenceThunk } from '../../store/workspaceSlice';
import { sendCopilotMessage } from '../../services/sse';
import { ClipboardCopy, PlusCircle, CheckCircle2, RefreshCw } from 'lucide-react';

export const MissingEvidenceSection: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const invId = useSelector((state: RootState) => state.workspace.id);
  const missingItems = useSelector((state: RootState) => state.workspace.missing_evidence);
  const isLocked = useSelector((state: RootState) => state.workspace.is_locked);

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeAddId, setActiveAddId] = useState<string | null>(null);
  const [evidenceSnippet, setEvidenceSnippet] = useState('');

  const handleDraftRequest = (item: any) => {
    const text = `REGULATORY EVIDENCE REQUEST:\nPlease furnish copy of '${item.item_title}' for investigation RCA. Purpose: ${item.why_it_matters}. Required per ICH Q7 Section 12 GMP discrepancy audit trail.`;
    navigator.clipboard.writeText(text);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleSaveEvidence = async (itemId: string, itemTitle: string) => {
    if (!invId || !evidenceSnippet.trim()) return;

    await dispatch(
      addEvidenceThunk({
        invId,
        title: itemTitle,
        content: evidenceSnippet,
      })
    );

    // Trigger re-analysis via copilot
    sendCopilotMessage(
      dispatch,
      invId,
      `Supplemental evidence received for '${itemTitle}': "${evidenceSnippet}". Please re-evaluate root cause rankings.`
    );

    setEvidenceSnippet('');
    setActiveAddId(null);
  };

  if (missingItems.length === 0) {
    return (
      <div className="p-4 text-center border border-dashed border-rule rounded-sm bg-sheet text-graphite-light text-xs italic">
        Evidence completeness checklist will be updated during investigation.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {missingItems.map((item) => (
        <div
          key={item.id}
          className="p-3 bg-sheet rounded-sm border border-rule hover:border-rule-strong transition-all text-xs font-sans"
        >
          <div className="flex items-start justify-between gap-3 mb-1.5">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-ink text-sm font-serif">
                {item.item_title}
              </span>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.5 rounded-sm ${
                  item.priority === 'high'
                    ? 'bg-vermilion/10 text-vermilion border border-vermilion/20'
                    : 'bg-amber/10 text-amber border border-amber/20'
                }`}
              >
                {item.priority.toUpperCase()} PRIORITY
              </span>
              {item.status === 'received' && (
                <span className="inline-flex items-center gap-1 text-[10px] font-mono text-verdigris bg-verdigris/10 px-1.5 py-0.5 rounded-sm">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>RECEIVED</span>
                </span>
              )}
            </div>

            {!isLocked && (
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => handleDraftRequest(item)}
                  className="px-2 py-1 text-[11px] font-medium bg-paper hover:bg-sheet-subtle text-slate-blue border border-rule rounded-sm inline-flex items-center gap-1 transition-colors"
                  title="Copy a professional formal request text to clipboard"
                >
                  <ClipboardCopy className="w-3 h-3" />
                  <span>{copiedId === item.id ? 'Copied Request!' : 'Draft Request'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveAddId(activeAddId === item.id ? null : item.id)}
                  className="px-2 py-1 text-[11px] font-medium bg-paper hover:bg-verdigris hover:text-sheet text-ink border border-rule rounded-sm inline-flex items-center gap-1 transition-colors"
                >
                  <PlusCircle className="w-3 h-3" />
                  <span>Provide Evidence</span>
                </button>
              </div>
            )}
          </div>

          <p className="text-graphite mb-2 leading-relaxed">
            <span className="font-mono text-[11px] text-ink font-semibold">Why it matters: </span>
            {item.why_it_matters}
          </p>

          {item.received_content && (
            <div className="p-2 bg-paper rounded-sm border border-verdigris/30 text-ink text-xs mb-2">
              <span className="font-mono text-[10px] font-bold text-verdigris uppercase block mb-0.5">
                Received Evidence Record:
              </span>
              <p className="italic">"{item.received_content}"</p>
            </div>
          )}

          {activeAddId === item.id && (
            <div className="mt-2 pt-2 border-t border-rule-subtle animate-in fade-in">
              <label className="block text-[11px] font-mono font-medium text-graphite mb-1">
                Paste logbook excerpt, engineer quote, or observation:
              </label>
              <textarea
                value={evidenceSnippet}
                onChange={(e) => setEvidenceSnippet(e.target.value)}
                rows={2}
                placeholder="e.g. Work Order WO-8842 report: Moisture droplets observed inside positioner CV-102 pneumatic chamber. Air dryer unit 2 pre-filter saturated."
                className="w-full px-2 py-1 text-xs bg-paper border border-rule-strong rounded-sm text-ink focus:outline-none focus:border-ink font-sans"
              />
              <div className="flex items-center justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setActiveAddId(null)}
                  className="px-2 py-1 text-[11px] text-graphite hover:text-ink"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveEvidence(item.id, item.item_title)}
                  className="px-3 py-1 text-[11px] font-medium bg-ink text-sheet rounded-sm hover:bg-black inline-flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Submit & Re-analyse</span>
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
