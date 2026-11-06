import React from 'react';
import { Check, Sparkles, Edit2 } from 'lucide-react';

interface StatusMarkProps {
  status: 'empty' | 'pencil' | 'edited' | 'ink';
  confidence?: 'low' | 'medium' | 'high';
}

export const StatusMark: React.FC<StatusMarkProps> = ({ status, confidence }) => {
  if (status === 'ink') {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-mono font-medium rounded-sm bg-verdigris/10 text-verdigris border border-verdigris/25" title="Human Confirmed & Validated">
        <Check className="w-3 h-3 stroke-[2.5]" />
        <span>INK</span>
      </span>
    );
  }

  if (status === 'edited') {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-mono font-medium rounded-sm bg-amber/10 text-amber border border-amber/25" title="Modified by Human Investigator">
        <Edit2 className="w-2.5 h-2.5 stroke-[2]" />
        <span>EDITED</span>
      </span>
    );
  }

  if (status === 'pencil') {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-mono font-medium rounded-sm bg-slate-blue/10 text-slate-blue border border-slate-blue/25" title={`AI Suggestion (Confidence: ${confidence || 'medium'})`}>
        <Sparkles className="w-2.5 h-2.5 stroke-[2]" />
        <span>AI PENCIL</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-graphite-light italic">
      Empty
    </span>
  );
};
