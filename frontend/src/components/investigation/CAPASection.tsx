import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { updateCAPAThunk } from '../../store/workspaceSlice';
import { Check, X, ShieldAlert, Clock, User } from 'lucide-react';

export const CAPASection: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const capaActions = useSelector((state: RootState) => state.workspace.capa_actions);
  const isLocked = useSelector((state: RootState) => state.workspace.is_locked);

  const handleUpdateStatus = (id: string, status: 'accepted' | 'rejected') => {
    if (!isLocked) {
      dispatch(updateCAPAThunk({ id, status }));
    }
  };

  if (capaActions.length === 0) {
    return (
      <div className="p-4 text-center border border-dashed border-rule rounded-sm bg-sheet text-graphite-light text-xs italic">
        CAPA proposals will be formulated upon root cause analysis.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {capaActions.map((capa) => {
        const isRejected = capa.status === 'rejected';
        const isAccepted = capa.status === 'accepted';

        return (
          <div
            key={capa.id}
            className={`p-3.5 rounded-sm border transition-all ${
              isRejected
                ? 'bg-sheet-subtle/50 border-rule opacity-60'
                : isAccepted
                ? 'bg-verdigris/5 border-verdigris/30'
                : 'bg-sheet border-rule hover:border-rule-strong'
            }`}
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-sm ${
                    capa.action_type === 'correction'
                      ? 'bg-amber/15 text-amber border border-amber/30'
                      : capa.action_type === 'corrective'
                      ? 'bg-verdigris/15 text-verdigris border border-verdigris/30'
                      : 'bg-slate-blue/15 text-slate-blue border border-slate-blue/30'
                  }`}
                >
                  {capa.action_type}
                </span>

                <span className="font-mono text-[11px] text-graphite flex items-center gap-1">
                  <User className="w-3 h-3 text-slate-blue" />
                  <span>Owner: {capa.owner_role}</span>
                </span>

                <span className="font-mono text-[11px] text-graphite flex items-center gap-1">
                  <Clock className="w-3 h-3 text-graphite-light" />
                  <span>Due: +{capa.due_offset_days} days</span>
                </span>
              </div>

              {/* Status Chips and Actions */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {isAccepted && (
                  <span className="px-2 py-0.5 text-[11px] font-mono font-medium rounded-sm bg-verdigris text-sheet">
                    ACCEPTED
                  </span>
                )}
                {isRejected && (
                  <span className="px-2 py-0.5 text-[11px] font-mono font-medium rounded-sm bg-graphite text-sheet line-through">
                    REJECTED
                  </span>
                )}
                {!isAccepted && !isRejected && (
                  <span className="px-2 py-0.5 text-[11px] font-mono text-slate-blue bg-slate-blue/10 border border-slate-blue/20 rounded-sm">
                    PROPOSED
                  </span>
                )}

                {!isLocked && (
                  <div className="flex items-center gap-1 ml-2">
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(capa.id, 'accepted')}
                      className={`p-1 rounded-sm border transition-colors ${
                        isAccepted
                          ? 'bg-verdigris text-sheet border-verdigris'
                          : 'bg-paper text-verdigris border-rule hover:border-verdigris'
                      }`}
                      title="Accept CAPA action"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(capa.id, 'rejected')}
                      className={`p-1 rounded-sm border transition-colors ${
                        isRejected
                          ? 'bg-graphite text-sheet border-graphite'
                          : 'bg-paper text-vermilion border-rule hover:border-vermilion'
                      }`}
                      title="Reject CAPA action (retained in audit log)"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            <p
              className={`text-sm font-sans font-medium text-ink leading-relaxed mb-1.5 ${
                isRejected ? 'line-through text-graphite' : ''
              }`}
            >
              {capa.description}
            </p>

            {/* Rationale */}
            <p className="text-xs text-graphite mb-2.5 font-sans">
              <span className="font-mono text-[11px] font-semibold text-ink">Rationale: </span>
              {capa.rationale}
            </p>

            {/* Effectiveness Check Box */}
            {capa.effectiveness_check && (
              <div className="p-2.5 bg-paper rounded-sm border border-rule-subtle text-xs font-sans">
                <span className="font-mono text-[10px] font-semibold text-ink uppercase tracking-wider block mb-1">
                  ICH Q10 Effectiveness Verification Plan:
                </span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-graphite">
                  <div>
                    <span className="text-graphite-light font-mono text-[10px] block">Metric:</span>
                    <span className="text-ink font-medium">{capa.effectiveness_check.metric || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-graphite-light font-mono text-[10px] block">Method:</span>
                    <span className="text-ink font-medium">{capa.effectiveness_check.method || 'Standard QC'}</span>
                  </div>
                  <div>
                    <span className="text-graphite-light font-mono text-[10px] block">Interval:</span>
                    <span className="text-ink font-medium">After {capa.effectiveness_check.timing_months || 3} months</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
