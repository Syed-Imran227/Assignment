import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { Hypothesis, confirmHypothesisThunk } from '../../store/workspaceSlice';
import { ShieldCheck, CheckCircle2, AlertCircle, HelpCircle, UserCheck } from 'lucide-react';

export const HypothesesList: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const hypotheses = useSelector((state: RootState) => state.workspace.hypotheses);
  const isLocked = useSelector((state: RootState) => state.workspace.is_locked);

  const [confirmModalHypo, setConfirmModalHypo] = useState<Hypothesis | null>(null);
  const [attestName, setAttestName] = useState('Dr. S. Ramanathan');
  const [attestRole, setAttestRole] = useState('Qualified Person (QP) / Head of Quality');
  const [confirmError, setConfirmError] = useState<string | null>(null);

  const handleConfirmSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmModalHypo) return;
    setConfirmError(null);

    try {
      await dispatch(
        confirmHypothesisThunk({
          id: confirmModalHypo.id,
          name: attestName,
          role: attestRole,
        })
      ).unwrap();
      setConfirmModalHypo(null);
    } catch (err: any) {
      setConfirmError(err.message || 'Failed to confirm hypothesis');
    }
  };

  if (hypotheses.length === 0) {
    return (
      <div className="p-4 text-center border border-dashed border-rule rounded-sm bg-sheet text-graphite-light text-xs italic">
        Hypotheses will be formulated upon document ingestion.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {hypotheses.map((h, idx) => {
        const isConfirmed = h.strength === 'confirmed';

        return (
          <div
            key={h.id}
            className={`p-3.5 rounded-sm border transition-all ${
              isConfirmed
                ? 'bg-verdigris/5 border-verdigris/40 shadow-sm'
                : 'bg-sheet border-rule hover:border-rule-strong'
            }`}
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-ink px-1.5 py-0.5 rounded-sm bg-paper border border-rule">
                  #{idx + 1}
                </span>
                <span className="font-mono text-[11px] uppercase tracking-wider text-graphite">
                  {h.category} Category
                </span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded-sm ${
                    h.qualitative_likelihood === 'high'
                      ? 'bg-vermilion/10 text-vermilion border border-vermilion/20'
                      : 'bg-amber/10 text-amber border border-amber/20'
                  }`}
                >
                  Likelihood: {h.qualitative_likelihood.toUpperCase()}
                </span>
              </div>

              {/* Strength Badge / Confirm Button */}
              <div>
                {isConfirmed ? (
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm bg-verdigris text-sheet text-xs font-mono font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>CONFIRMED ROOT CAUSE</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-slate-blue bg-slate-blue/10 px-2 py-0.5 rounded-sm border border-slate-blue/20">
                      Status: {h.strength.toUpperCase()}
                    </span>
                    {!isLocked && (
                      <button
                        type="button"
                        onClick={() => setConfirmModalHypo(h)}
                        className="px-2 py-1 text-xs font-sans font-medium bg-paper hover:bg-verdigris hover:text-sheet text-verdigris border border-verdigris/40 rounded-sm transition-colors inline-flex items-center gap-1 cursor-pointer"
                        title="Promote hypothesis to confirmed root cause with QP attestation"
                      >
                        <UserCheck className="w-3 h-3" />
                        <span>Confirm as Root Cause</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Statement */}
            <p className="text-sm font-sans font-medium text-ink leading-relaxed mb-3">
              {h.statement}
            </p>

            {/* Evidence For */}
            {h.evidence_for && h.evidence_for.length > 0 && (
              <div className="mb-2 text-xs font-sans">
                <span className="font-mono text-[11px] text-verdigris font-semibold uppercase block mb-1">
                  Supporting Evidence Citations:
                </span>
                <ul className="list-disc list-inside space-y-0.5 text-graphite">
                  {h.evidence_for.map((ev, eIdx) => (
                    <li key={eIdx} className="italic text-[11.5px]">
                      "{ev.quote}"
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Evidence Needed */}
            {h.evidence_needed && h.evidence_needed.length > 0 && !isConfirmed && (
              <div className="text-xs font-sans mt-2 pt-2 border-t border-rule-subtle">
                <span className="font-mono text-[11px] text-amber font-semibold uppercase block mb-1">
                  Missing Evidence Needed to Verify:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {h.evidence_needed.map((need, nIdx) => (
                    <span
                      key={nIdx}
                      className="inline-block text-[11px] bg-paper px-2 py-0.5 rounded-sm border border-rule text-graphite"
                    >
                      {need}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Qualified Person Attestation Stamp */}
            {isConfirmed && h.confirmed_by && (
              <div className="mt-3 pt-2.5 border-t border-verdigris/25 flex items-center justify-between text-xs font-mono text-verdigris">
                <span className="flex items-center gap-1.5 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Attested by: {h.confirmed_by} ({h.confirmed_role})</span>
                </span>
                <span className="text-graphite-light">
                  {h.confirmed_at ? new Date(h.confirmed_at).toLocaleDateString() : ''}
                </span>
              </div>
            )}
          </div>
        );
      })}

      {/* Confirmation Attestation Modal */}
      {confirmModalHypo && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-sheet rounded-sm shadow-popover border border-rule p-5 animate-in fade-in duration-150">
            <h4 className="font-serif text-lg font-medium text-ink mb-1">
              Confirm Root Cause Attestation
            </h4>
            <p className="text-xs text-graphite mb-4 leading-relaxed">
              In accordance with GMP (ICH Q7 Section 12 & 21 CFR 211.192), AI suggestions cannot serve as confirmed root causes without explicit Qualified Person validation and supporting evidence.
            </p>

            <div className="p-3 bg-paper rounded-sm border border-rule-subtle text-xs font-sans text-ink mb-4 italic">
              "{confirmModalHypo.statement}"
            </div>

            {confirmError && (
              <div className="mb-3 p-2 bg-vermilion/10 text-vermilion text-xs rounded-sm border border-vermilion/20">
                {confirmError}
              </div>
            )}

            <form onSubmit={handleConfirmSubmit} className="space-y-3 text-xs font-sans">
              <div>
                <label className="block text-graphite font-medium mb-1">
                  Qualified Person / Lead Investigator Name:
                </label>
                <input
                  type="text"
                  value={attestName}
                  onChange={(e) => setAttestName(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-paper border border-rule-strong rounded-sm text-ink focus:outline-none focus:border-ink font-sans"
                  required
                />
              </div>

              <div>
                <label className="block text-graphite font-medium mb-1">
                  Regulatory / QA Role:
                </label>
                <input
                  type="text"
                  value={attestRole}
                  onChange={(e) => setAttestRole(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-paper border border-rule-strong rounded-sm text-ink focus:outline-none focus:border-ink font-sans"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-rule mt-4">
                <button
                  type="button"
                  onClick={() => setConfirmModalHypo(null)}
                  className="px-3 py-1.5 text-xs text-graphite hover:text-ink transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-medium bg-verdigris text-sheet hover:bg-verdigris/90 rounded-sm transition-colors font-sans"
                >
                  Stamp & Confirm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
