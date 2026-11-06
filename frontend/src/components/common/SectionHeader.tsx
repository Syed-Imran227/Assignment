import React from 'react';
import { useDispatch } from 'react-redux';
import { CheckCheck } from 'lucide-react';
import { confirmSectionFields } from '../../store/workspaceSlice';

interface SectionHeaderProps {
  number: string;
  title: string;
  description?: string;
  fieldKeys?: string[];
  isLocked?: boolean;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  number,
  title,
  description,
  fieldKeys = [],
  isLocked = false,
}) => {
  const dispatch = useDispatch();

  const handleConfirmAll = () => {
    if (fieldKeys.length > 0 && !isLocked) {
      dispatch(confirmSectionFields(fieldKeys));
    }
  };

  return (
    <div className="flex items-start justify-between gap-4 pb-2 mb-3 border-b border-rule">
      <div>
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-xs font-semibold text-slate-blue tracking-wide">
            {number}
          </span>
          <h3 className="font-serif text-lg font-medium text-ink tracking-tight">
            {title}
          </h3>
        </div>
        {description && (
          <p className="text-xs text-graphite mt-0.5 font-sans leading-normal">
            {description}
          </p>
        )}
      </div>

      {fieldKeys.length > 0 && !isLocked && (
        <button
          type="button"
          onClick={handleConfirmAll}
          className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-sans font-medium text-verdigris hover:bg-verdigris/10 border border-verdigris/30 rounded-sm transition-colors flex-shrink-0"
          title="Confirm all fields in this section to ink"
        >
          <CheckCheck className="w-3.5 h-3.5" />
          <span>Confirm section</span>
        </button>
      )}
    </div>
  );
};

