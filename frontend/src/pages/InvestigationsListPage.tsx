import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { fetchInvestigations, createInvestigation } from '../store/investigationsSlice';
import { Plus, FileText, ArrowRight, ShieldCheck, Activity } from 'lucide-react';

interface Props {
  onOpenInvestigation: (id: string) => void;
}

export const InvestigationsListPage: React.FC<Props> = ({ onOpenInvestigation }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { items, loading } = useSelector((state: RootState) => state.investigations);

  useEffect(() => {
    dispatch(fetchInvestigations());
  }, [dispatch]);

  const handleCreateNew = async () => {
    const res = await dispatch(createInvestigation('API Deviation RCA')).unwrap();
    if (res && res.id) {
      onOpenInvestigation(res.id);
    }
  };

  return (
    <div className="min-h-screen bg-paper text-ink p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between pb-4 border-b border-rule">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-sm bg-ink text-sheet flex items-center justify-center font-serif text-lg font-bold">
              R
            </div>
            <div>
              <h1 className="font-serif text-2xl font-medium text-ink">
                Rootline Investigations
              </h1>
              <p className="text-xs text-graphite font-mono">
                Active Pharmaceutical Ingredient (API) Root Cause Analysis & CAPA Management
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCreateNew}
            className="px-4 py-2 bg-ink text-sheet hover:bg-black rounded-sm text-xs font-sans font-medium inline-flex items-center gap-1.5 transition-colors shadow-subtle cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Investigation</span>
          </button>
        </div>

        {/* Quality Architecture Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs">
          <div className="p-3 bg-sheet rounded-sm border border-rule">
            <span className="font-semibold text-slate-blue block mb-1">ICH Q7 Section 12</span>
            <span className="text-graphite font-sans">Deviation intake with verbatim grounding; unconfirmed AI values stay in pencil.</span>
          </div>
          <div className="p-3 bg-sheet rounded-sm border border-rule">
            <span className="font-semibold text-verdigris block mb-1">Causal Guardrails</span>
            <span className="text-graphite font-sans">Human error rejected as terminal cause; forces evaluation of engineering & SOP systems.</span>
          </div>
          <div className="p-3 bg-sheet rounded-sm border border-rule">
            <span className="font-semibold text-amber block mb-1">ICH Q10 CAPA Integration</span>
            <span className="text-graphite font-sans">Structured Correction, Corrective Action, and Preventive Action with effectiveness checks.</span>
          </div>
        </div>

        {/* Dense Investigations Table */}
        <div className="bg-sheet rounded-sm border border-rule overflow-hidden shadow-subtle">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-sheet-subtle border-b border-rule font-mono text-[11px] text-graphite uppercase">
              <tr>
                <th className="py-2.5 px-4">RCA Number</th>
                <th className="py-2.5 px-4">Investigation Title</th>
                <th className="py-2.5 px-4">API Product</th>
                <th className="py-2.5 px-4">Batch / Lot</th>
                <th className="py-2.5 px-4">Classification</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule-subtle font-mono text-xs">
              {loading && items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-graphite-light italic font-sans">
                    Loading quality investigations...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-graphite font-sans space-y-2">
                    <p className="font-medium text-sm text-ink">No active root cause investigations logged.</p>
                    <p className="text-xs text-graphite-light max-w-sm mx-auto">
                      Click "New Investigation" above, then use the Co-Pilot panel to paste an incident notification or upload a deviation PDF.
                    </p>
                  </td>
                </tr>
              ) : (
                items.map((inv) => (
                  <tr
                    key={inv.id}
                    onClick={() => onOpenInvestigation(inv.id)}
                    className="hover:bg-sheet-subtle cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 font-bold text-ink">{inv.rca_number}</td>
                    <td className="py-3 px-4 font-sans font-medium text-ink truncate max-w-xs">{inv.title}</td>
                    <td className="py-3 px-4 font-sans text-graphite">{inv.product_name || 'Pending Extraction'}</td>
                    <td className="py-3 px-4 text-slate-blue font-semibold">{inv.batch_number || 'N/A'}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-1.5 py-0.5 rounded-sm text-[10px] font-bold uppercase ${
                          inv.classification === 'critical'
                            ? 'bg-vermilion/15 text-vermilion border border-vermilion/25'
                            : 'bg-amber/15 text-amber border border-amber/25'
                        }`}
                      >
                        {inv.classification}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {inv.is_locked ? (
                        <span className="px-1.5 py-0.5 rounded-sm bg-verdigris/15 text-verdigris text-[10px] font-bold uppercase">
                          LOCKED (v{inv.version})
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded-sm bg-slate-blue/15 text-slate-blue text-[10px] font-medium uppercase">
                          DRAFT
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenInvestigation(inv.id);
                        }}
                        className="p-1 text-graphite hover:text-ink inline-flex items-center gap-1 font-sans text-xs"
                      >
                        <span>Open</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

