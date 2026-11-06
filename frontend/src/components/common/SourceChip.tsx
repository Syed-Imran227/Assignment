import React from 'react';
import { useDispatch } from 'react-redux';
import { FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { setActiveSourceViewer } from '../../store/workspaceSlice';
import { setSourceDrawerOpen } from '../../store/uiSlice';

interface SourceChipProps {
  source?: {
    quote: string;
    start?: number;
    end?: number;
    page?: number;
    verified: boolean;
  } | null;
  rationale?: string | null;
}

export const SourceChip: React.FC<SourceChipProps> = ({ source, rationale }) => {
  const dispatch = useDispatch();

  if (!source || !source.quote) return null;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch(setActiveSourceViewer(source));
    dispatch(setSourceDrawerOpen(true));
  };

  return (
    <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px]">
      <button
        type="button"
        onClick={handleClick}
        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm bg-paper hover:bg-sheet-subtle border border-rule text-graphite hover:text-ink transition-colors cursor-pointer"
        title="Click to view verified source quote in context"
      >
        <FileText className="w-3 h-3 text-slate-blue" />
        <span className="font-mono text-[10px] text-slate-blue">Source:</span>
        <span className="truncate max-w-[220px] italic">"{source.quote}"</span>
        {source.verified ? (
          <span title="Verbatim Quote Verified">
            <CheckCircle2 className="w-2.5 h-2.5 text-verdigris inline-block flex-shrink-0" />
          </span>
        ) : (
          <span title="Unverified Quote">
            <AlertCircle className="w-2.5 h-2.5 text-amber inline-block flex-shrink-0" />
          </span>
        )}
      </button>
      {rationale && (
        <span className="text-[11px] text-graphite-light truncate max-w-[260px]" title={rationale}>
          ({rationale})
        </span>
      )}
    </div>
  );
};
