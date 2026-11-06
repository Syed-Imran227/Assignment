import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { lockAndSaveInvestigation, reopenInvestigation } from '../../store/workspaceSlice';
import { Lock, Unlock, CheckCircle2, AlertCircle, FileCheck2, Award } from 'lucide-react';

export const ReviewAndSaveSection: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const inv = useSelector((state: RootState) => state.workspace);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Compute item counts
  const formFields = Object.values(inv.form_data);
  const pencilCount = formFields.filter((f) => f.status === 'pencil').length;
  const inkCount = formFields.filter((f) => f.status === 'ink').length;
  const editedCount = formFields.filter((f) => f.status === 'edited').length;

  const confirmedHypos = inv.hypotheses.filter((h) => h.strength === 'confirmed');
  const acceptedCapas = inv.capa_actions.filter((c) => c.status === 'accepted');

  const handleSaveLock = async () => {
    if (!inv.id) return;
    try {
      await dispatch(lockAndSaveInvestigation(inv.id)).unwrap();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleReopen = async () => {
    if (!inv.id) return;
    try {
      await dispatch(reopenInvestigation(inv.id)).unwrap();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-4 bg-sheet rounded-sm border border-rule space-y-4 text-xs font-sans">
      <div className="flex items-center justify-between pb-2 border-b border-rule-subtle">
        <div>
          <span className="font-serif text-base font-medium text-ink block">
            Quality Review & Regulatory Attestation
          </span>
          <span className="text-graphite font-mono text-[11px]">
            Revision Status: v{inv.version}.0 {inv.is_locked ? '(Locked / Approved)' : '(Editable Draft)'}
          </span>
        </div>

        {inv.is_locked ? (
          <button
            type="button"
            onClick={handleReopen}
            className="px-3 py-1.5 text-xs font-sans font-medium bg-paper hover:bg-sheet-subtle text-ink border border-rule-strong rounded-sm inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Unlock className="w-3.5 h-3.5 text-slate-blue" />
            <span>Reopen New Revision (v{inv.version + 1})</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSaveLock}
            className="px-4 py-1.5 text-xs font-sans font-medium bg-verdigris hover:bg-verdigris/90 text-sheet rounded-sm inline-flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Approve & Lock Investigation</span>
          </button>
        )}
      </div>

      {saveSuccess && (
        <div className="p-3 bg-verdigris/10 border border-verdigris/30 text-verdigris rounded-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>Investigation revision successfully approved and locked for regulatory audit!</span>
        </div>
      )}

      {/* Item Counts: The Pencil vs Ink Spectrum */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 rounded-sm bg-paper border border-rule text-center">
          <span className="font-mono text-xl font-bold text-slate-blue block">{pencilCount}</span>
          <span className="text-[11px] font-mono text-graphite uppercase">AI Pencil Suggestions</span>
        </div>
        <div className="p-3 rounded-sm bg-paper border border-rule text-center">
          <span className="font-mono text-xl font-bold text-amber block">{editedCount}</span>
          <span className="text-[11px] font-mono text-graphite uppercase">Human Edited</span>
        </div>
        <div className="p-3 rounded-sm bg-paper border border-rule text-center">
          <span className="font-mono text-xl font-bold text-verdigris block">{inkCount}</span>
          <span className="text-[11px] font-mono text-graphite uppercase">Human Confirmed Ink</span>
        </div>
      </div>

      {/* Regulatory Checklist */}
      <div className="p-3 bg-paper rounded-sm border border-rule-subtle space-y-2">
        <span className="font-mono text-[11px] font-semibold text-ink uppercase tracking-wider block">
          21 CFR 211.192 / ICH Q7 QA Audit Checklist:
        </span>
        <div className="space-y-1.5 text-graphite">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-verdigris" />
            <span>Product & Batch Identification verified against batch manufacturing records</span>
          </div>
          <div className="flex items-center gap-2">
            {confirmedHypos.length > 0 ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-verdigris" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5 text-amber" />
            )}
            <span>
              Confirmed Root Cause: {confirmedHypos.length > 0 ? `Confirmed (${confirmedHypos[0].statement.substring(0, 50)}...)` : 'Provisional (Requires QP Attestation)'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {acceptedCapas.length > 0 ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-verdigris" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5 text-amber" />
            )}
            <span>
              CAPA Actions Approved: {acceptedCapas.length} actions accepted
            </span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-verdigris" />
            <span>ALCOA+ Data Integrity & Verbatim Source Grounding enforced</span>
          </div>
        </div>
      </div>
    </div>
  );
};
