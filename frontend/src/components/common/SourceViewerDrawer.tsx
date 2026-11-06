import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { clearActiveSourceViewer } from '../../store/workspaceSlice';
import { setSourceDrawerOpen } from '../../store/uiSlice';
import { X, CheckCircle2, AlertCircle, FileText } from 'lucide-react';

export const SourceViewerDrawer: React.FC = () => {
  const dispatch = useDispatch();
  const isOpen = useSelector((state: RootState) => state.ui.sourceDrawerOpen);
  const activeViewer = useSelector((state: RootState) => state.workspace.activeSourceViewer);
  const sources = useSelector((state: RootState) => state.workspace.sources);

  if (!isOpen || !activeViewer) return null;

  const handleClose = () => {
    dispatch(setSourceDrawerOpen(false));
    dispatch(clearActiveSourceViewer());
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/20 flex justify-end">
      <div className="w-full max-w-lg bg-sheet h-full shadow-popover border-l border-rule flex flex-col animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 border-b border-rule flex items-center justify-between bg-paper">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-blue" />
            <h4 className="font-serif text-base font-medium text-ink">
              Grounded Source Evidence
            </h4>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1 text-graphite hover:text-ink rounded-sm transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quote Verification Card */}
        <div className="p-4 border-b border-rule-subtle bg-sheet-subtle">
          <div className="flex items-center justify-between text-xs mb-1.5 font-mono">
            <span className="text-graphite">Verification Status:</span>
            {activeViewer.verified ? (
              <span className="inline-flex items-center gap-1 text-verdigris font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Verbatim Verified</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-amber font-semibold">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Contextual Inference</span>
              </span>
            )}
          </div>
          <blockquote className="p-2.5 bg-paper border-l-2 border-slate-blue text-sm italic font-sans text-ink">
            "{activeViewer.quote}"
          </blockquote>
        </div>

        {/* Document Context View */}
        <div className="flex-1 p-4 overflow-y-auto">
          <h5 className="text-xs font-mono font-medium text-graphite mb-2 uppercase tracking-wider">
            Available Ingested Documents
          </h5>
          {sources.length === 0 ? (
            <div className="text-xs text-graphite-light italic py-4">
              Direct text intake was provided via Co-Pilot prompt.
            </div>
          ) : (
            sources.map((s) => (
              <div key={s.id} className="mb-4 p-3 rounded-sm bg-paper border border-rule text-xs font-mono">
                <div className="flex items-center justify-between mb-2 pb-1 border-b border-rule-subtle">
                  <span className="font-semibold text-ink">{s.filename || 'Source Document'}</span>
                  <span className="text-graphite uppercase">{s.kind}</span>
                </div>
                <div className="whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-graphite max-h-60 overflow-y-auto">
                  {s.text_snippet || 'Document loaded'}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-rule bg-paper text-right">
          <button
            type="button"
            onClick={handleClose}
            className="px-3 py-1 text-xs font-medium bg-ink text-sheet rounded-sm hover:bg-black transition-colors"
          >
            Close Viewer
          </button>
        </div>
      </div>
    </div>
  );
};
