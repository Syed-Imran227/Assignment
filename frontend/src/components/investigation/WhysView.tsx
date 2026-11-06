import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { ArrowDown, AlertTriangle, ShieldCheck } from 'lucide-react';

export const WhysView: React.FC = () => {
  const whyChains = useSelector((state: RootState) => state.workspace.why_chains);

  if (whyChains.length === 0) {
    return (
      <div className="p-6 text-center border border-dashed border-rule rounded-sm bg-sheet text-graphite-light text-sm italic">
        The 5 Whys analysis will be derived automatically when the AI processes the incident document.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {whyChains.map((chain) => (
        <div key={chain.id} className="p-4 bg-sheet rounded-sm border border-rule">
          <div className="flex items-center justify-between pb-2 mb-4 border-b border-rule-subtle">
            <span className="font-serif text-sm font-medium text-ink">
              {chain.branch_title}
            </span>
            {chain.category && (
              <span className="font-mono text-[11px] px-2 py-0.5 rounded-sm bg-slate-blue/10 text-slate-blue border border-slate-blue/20">
                Category: {chain.category}
              </span>
            )}
          </div>

          <div className="relative pl-6 space-y-4">
            {/* Vertical descent connecting line */}
            <div className="absolute left-2.5 top-2 bottom-6 w-[1.5px] bg-rule-strong" />

            {chain.steps.map((step, idx) => (
              <div key={idx} className="relative group">
                {/* Node marker */}
                <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-paper border border-ink flex items-center justify-center text-[10px] font-mono font-bold text-ink">
                  {step.level}
                </div>

                <div className="p-3 rounded-sm bg-paper border border-rule-subtle group-hover:border-rule transition-colors">
                  <div className="text-xs font-semibold text-graphite mb-1">
                    {step.why}
                  </div>
                  <div className="text-sm font-sans text-ink leading-relaxed">
                    {step.answer}
                  </div>
                  {step.evidence_quote && (
                    <div className="mt-1.5 text-[11px] font-mono text-graphite-light italic border-l border-rule pl-2">
                      Citation: "{step.evidence_quote}"
                    </div>
                  )}
                </div>

                {idx < chain.steps.length - 1 && (
                  <div className="flex justify-start pl-2 py-1 text-graphite-light">
                    <ArrowDown className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            ))}

            {/* Terminal Root Cause Anchor Node */}
            {chain.terminal_cause && (
              <div className="relative pt-2">
                <div className="absolute -left-6 top-4 w-5 h-5 rounded-full bg-verdigris text-sheet flex items-center justify-center text-xs">
                  <ShieldCheck className="w-3.5 h-3.5 stroke-[2.5]" />
                </div>
                <div className="p-3.5 rounded-sm bg-verdigris/5 border border-verdigris/30">
                  <div className="flex items-center gap-1.5 text-xs font-mono font-semibold text-verdigris uppercase tracking-wider mb-1">
                    <span>Terminal Systemic Root Cause (ICH Q10)</span>
                  </div>
                  <div className="text-sm font-sans font-medium text-ink leading-snug">
                    {chain.terminal_cause}
                  </div>
                  <div className="mt-1 text-[11px] text-graphite font-sans">
                    * Human error rejected as terminal cause. Root cause identified at procedural/engineering control level.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
