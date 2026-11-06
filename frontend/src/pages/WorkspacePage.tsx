import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { fetchInvestigationById } from '../store/workspaceSlice';
import { TopSectionNav } from '../components/common/TopSectionNav';
import { RecordForm } from '../components/record/RecordForm';
import { CopilotPanel } from '../components/copilot/CopilotPanel';
import { SourceViewerDrawer } from '../components/common/SourceViewerDrawer';
import { ArrowLeft, Shield, Clock } from 'lucide-react';

interface Props {
  investigationId: string;
  onBackToList: () => void;
}

export const WorkspacePage: React.FC<Props> = ({ investigationId, onBackToList }) => {
  const dispatch = useDispatch<AppDispatch>();
  const inv = useSelector((state: RootState) => state.workspace);

  useEffect(() => {
    if (investigationId) {
      dispatch(fetchInvestigationById(investigationId));
    }
  }, [dispatch, investigationId]);

  return (
    <div className="h-screen flex flex-col bg-paper text-ink overflow-hidden font-sans">
      {/* Top Application Bar */}
      <header className="h-11 bg-sheet border-b border-rule px-4 flex items-center justify-between flex-shrink-0 z-30">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToList}
            className="p-1 rounded-sm text-graphite hover:text-ink hover:bg-sheet-subtle transition-colors flex items-center gap-1 text-xs font-sans"
            title="Return to investigations list"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Investigations</span>
          </button>

          <span className="text-rule-strong">/</span>

          <span className="font-mono text-xs font-bold text-ink">
            {inv.rca_number || 'Loading...'}
          </span>

          {inv.product_name && (
            <span className="text-xs text-graphite font-sans truncate max-w-xs">
              — {inv.product_name}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="text-graphite flex items-center gap-1">
            <Clock className="w-3 h-3 text-graphite-light" />
            <span>v{inv.version}.0</span>
          </span>

          {inv.is_locked ? (
            <span className="px-2 py-0.5 rounded-sm bg-verdigris text-sheet font-medium flex items-center gap-1">
              <Shield className="w-3 h-3" />
              <span>RECORD LOCKED</span>
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-sm bg-amber/15 text-amber border border-amber/30 font-medium">
              DRAFT
            </span>
          )}
        </div>
      </header>

      {/* Sticky Section Navigation Index */}
      <TopSectionNav />

      {/* Main Split Screen Area: Left 56% Record, Right 44% Co-Pilot */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left ~56%: The Record (RCA Form) */}
        <div className="w-[56%] h-full overflow-hidden border-r border-rule">
          <RecordForm />
        </div>

        {/* Right ~44%: The Analyst / Co-Pilot */}
        <div className="w-[44%] h-full overflow-hidden">
          <CopilotPanel />
        </div>
      </div>

      {/* Source Viewer Drawer for Citation Verification */}
      <SourceViewerDrawer />
    </div>
  );
};
