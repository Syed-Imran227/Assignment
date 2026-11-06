import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { MessageSquarePlus, Check, Edit3 } from 'lucide-react';
import { FieldValue, confirmField, inlineEditField } from '../../store/workspaceSlice';
import { setComposerText } from '../../store/copilotSlice';
import { StatusMark } from './StatusMark';
import { SourceChip } from './SourceChip';

interface FieldContainerProps {
  fieldKey: string;
  label: string;
  fieldData?: FieldValue;
  isLocked?: boolean;
}

export const FieldContainer: React.FC<FieldContainerProps> = ({
  fieldKey,
  label,
  fieldData,
  isLocked = false,
}) => {
  const dispatch = useDispatch();
  const [isEditingInline, setIsEditingInline] = useState(false);
  const [inlineValue, setInlineValue] = useState(fieldData?.value || '');

  const status = fieldData?.status || 'empty';
  const value = fieldData?.value;

  const handleAskAIToChange = () => {
    dispatch(setComposerText(`Change ${label} to `));
    const composer = document.getElementById('copilot-composer');
    if (composer) {
      composer.focus();
    }
  };

  const handleConfirmInk = () => {
    if (!isLocked) {
      dispatch(confirmField(fieldKey));
    }
  };

  const handleSaveInline = () => {
    dispatch(inlineEditField({ field: fieldKey, value: inlineValue }));
    setIsEditingInline(false);
  };

  return (
    <div className="py-2.5 px-3 rounded-sm border border-transparent hover:border-rule-subtle transition-all group bg-sheet">
      <div className="flex items-center justify-between gap-2 mb-1">
        <label className="text-[12px] font-sans font-medium text-graphite tracking-tight flex items-center gap-1.5">
          <span>{label}</span>
          <StatusMark status={status} confidence={fieldData?.confidence} />
        </label>

        {!isLocked && (
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
            {status === 'pencil' && (
              <button
                type="button"
                onClick={handleConfirmInk}
                className="px-1.5 py-0.5 text-[11px] font-sans font-medium rounded-sm text-verdigris hover:bg-verdigris/10 border border-transparent hover:border-verdigris/30 inline-flex items-center gap-1 transition-colors"
                title="Confirm and convert to ink"
              >
                <Check className="w-3 h-3" />
                <span>Confirm</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleAskAIToChange}
              className="px-1.5 py-0.5 text-[11px] font-sans font-medium rounded-sm text-slate-blue hover:bg-slate-blue/10 border border-transparent hover:border-slate-blue/30 inline-flex items-center gap-1 transition-colors"
              title="Pre-fills co-pilot chat to request change"
            >
              <MessageSquarePlus className="w-3 h-3" />
              <span>Ask AI to change</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setInlineValue(value || '');
                setIsEditingInline(!isEditingInline);
              }}
              className="p-1 rounded-sm text-graphite-light hover:text-ink hover:bg-sheet-subtle transition-colors"
              title="Direct edit (recorded in audit log)"
            >
              <Edit3 className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {isEditingInline ? (
        <div className="flex items-center gap-2 mt-1">
          <input
            type="text"
            value={inlineValue}
            onChange={(e) => setInlineValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSaveInline();
              if (e.key === 'Escape') setIsEditingInline(false);
            }}
            className="flex-1 px-2 py-1 text-sm bg-paper border border-rule-strong rounded-sm focus:outline-none focus:border-ink font-sans text-ink"
            autoFocus
          />
          <button
            type="button"
            onClick={handleSaveInline}
            className="px-2 py-1 text-xs font-medium bg-ink text-sheet rounded-sm hover:bg-black transition-colors"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => setIsEditingInline(false)}
            className="px-2 py-1 text-xs text-graphite hover:text-ink transition-colors"
          >
            Cancel
          </button>
        </div>
      ) : (
        <div
          onClick={() => {
            if (status === 'pencil' && !isLocked) handleConfirmInk();
          }}
          className={`text-[14px] leading-relaxed transition-all cursor-default ${
            status === 'pencil'
              ? 'text-graphite font-normal border-b border-dashed border-graphite/40 hover:border-verdigris hover:text-ink cursor-pointer'
              : status === 'ink'
              ? 'text-ink font-medium border-b border-solid border-verdigris/40'
              : status === 'edited'
              ? 'text-ink font-normal border-b border-solid border-amber/40'
              : 'text-graphite-light italic border-b border-dotted border-rule'
          }`}
          title={status === 'pencil' ? 'Click or press Enter to confirm this AI value into ink' : undefined}
        >
          {value || <span className="text-graphite-light/70 font-sans text-xs">Not specified in record</span>}
        </div>
      )}

      {fieldData?.source && (
        <SourceChip source={fieldData.source} rationale={fieldData.rationale} />
      )}
    </div>
  );
};
