import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { FishboneCause } from '../../store/workspaceSlice';
import { setActiveSourceViewer } from '../../store/workspaceSlice';
import { setSourceDrawerOpen } from '../../store/uiSlice';

export const FishboneView: React.FC = () => {
  const dispatch = useDispatch();
  const fishboneCauses = useSelector((state: RootState) => state.workspace.fishbone_causes);
  const [selectedCause, setSelectedCause] = useState<FishboneCause | null>(null);

  const categories = [
    { name: 'Man', label: '01 Man (Personnel)', x: 140, yTop: true },
    { name: 'Machine', label: '02 Machine (Equipment)', x: 340, yTop: true },
    { name: 'Material', label: '03 Material (Raw/IPC)', x: 540, yTop: true },
    { name: 'Method', label: '04 Method (BMR/SOP)', x: 140, yTop: false },
    { name: 'Measurement', label: '05 Measurement (QC/IPC)', x: 340, yTop: false },
    { name: 'Milieu', label: '06 Milieu (Environment/Utility)', x: 540, yTop: false },
  ];

  const getCausesForCat = (catName: string) =>
    fishboneCauses.filter(
      (c) => c.category.toLowerCase() === catName.toLowerCase()
    );

  const handleNodeClick = (cause: FishboneCause) => {
    setSelectedCause(cause);
    if (cause.evidence_quote) {
      dispatch(setActiveSourceViewer({ quote: cause.evidence_quote, verified: true }));
      dispatch(setSourceDrawerOpen(true));
    }
  };

  if (fishboneCauses.length === 0) {
    return (
      <div className="p-6 text-center border border-dashed border-rule rounded-sm bg-sheet text-graphite-light text-sm italic">
        The 6M Ishikawa Fishbone diagram will be generated upon incident analysis.
      </div>
    );
  }

  return (
    <div className="p-4 bg-sheet rounded-sm border border-rule">
      <div className="flex items-center justify-between pb-2 mb-3 border-b border-rule-subtle">
        <span className="font-serif text-sm font-medium text-ink">
          Ishikawa 6M Cause-and-Effect Diagram
        </span>
        <span className="text-xs font-mono text-graphite-light">
          Click any factor node to view citation
        </span>
      </div>

      {/* Hand-built responsive SVG Fishbone Diagram */}
      <div className="w-full overflow-x-auto bg-paper p-3 rounded-sm border border-rule-subtle">
        <svg viewBox="0 0 820 440" className="w-full h-auto min-w-[760px] max-h-[460px]">
          {/* Main Central Spine */}
          <line x1="50" y1="220" x2="700" y2="220" stroke="#15181B" strokeWidth="2.5" />
          
          {/* Terminal Deviation Head (Fish Head) */}
          <polygon points="700,180 790,220 700,260" fill="#15181B" />
          <text x="735" y="215" fill="#FBF9F4" fontSize="11" fontWeight="bold" fontFamily="IBM Plex Sans" textAnchor="middle">
            API QUALITY
          </text>
          <text x="735" y="232" fill="#FBF9F4" fontSize="11" fontWeight="bold" fontFamily="IBM Plex Sans" textAnchor="middle">
            DEVIATION
          </text>

          {/* 6 Diagonal Ribs */}
          {categories.map((cat, idx) => {
            const startY = cat.yTop ? 50 : 390;
            const endY = 220;
            const endX = cat.x + 70;
            const causes = getCausesForCat(cat.name);

            return (
              <g key={idx}>
                {/* Diagonal Bone */}
                <line
                  x1={cat.x}
                  y1={startY}
                  x2={endX}
                  y2={endY}
                  stroke="#5B6168"
                  strokeWidth="1.5"
                  strokeDasharray={cat.yTop ? 'none' : 'none'}
                />

                {/* Bone Category Label */}
                <rect
                  x={cat.x - 65}
                  y={cat.yTop ? startY - 26 : startY + 6}
                  width="135"
                  height="22"
                  fill="#FBF9F4"
                  stroke="#B9B2A0"
                  strokeWidth="1"
                  rx="2"
                />
                <text
                  x={cat.x + 2}
                  y={cat.yTop ? startY - 11 : startY + 21}
                  fill="#15181B"
                  fontSize="10"
                  fontWeight="600"
                  fontFamily="IBM Plex Mono"
                  textAnchor="middle"
                >
                  {cat.label}
                </text>

                {/* Sub-branch Cause Nodes */}
                {causes.map((cause, cIdx) => {
                  const fraction = (cIdx + 1) / (causes.length + 1);
                  const nodeX = cat.x + (endX - cat.x) * fraction;
                  const nodeY = startY + (endY - startY) * fraction;
                  const branchEndX = nodeX - (cat.yTop ? 80 : 80);

                  return (
                    <g key={cause.id} className="cursor-pointer" onClick={() => handleNodeClick(cause)}>
                      {/* Horizontal pin to node */}
                      <line x1={nodeX} y1={nodeY} x2={branchEndX} y2={nodeY} stroke="#8E959E" strokeWidth="1" strokeDasharray="2,2" />
                      
                      {/* Small Factor Tag */}
                      <rect
                        x={branchEndX - 95}
                        y={nodeY - 11}
                        width="95"
                        height="20"
                        fill={selectedCause?.id === cause.id ? '#1F7A66' : '#FBF9F4'}
                        stroke={selectedCause?.id === cause.id ? '#1F7A66' : '#D8D2C3'}
                        strokeWidth="1"
                        rx="2"
                      />
                      <text
                        x={branchEndX - 48}
                        y={nodeY + 3}
                        fill={selectedCause?.id === cause.id ? '#FBF9F4' : '#15181B'}
                        fontSize="9"
                        fontFamily="IBM Plex Sans"
                        textAnchor="middle"
                      >
                        {cause.cause_text.length > 17
                          ? cause.cause_text.substring(0, 16) + '...'
                          : cause.cause_text}
                      </text>
                    </g>
                  );
                })}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Selected Cause Detail Pane */}
      {selectedCause && (
        <div className="mt-3 p-3 bg-sheet-subtle rounded-sm border border-rule text-xs font-sans">
          <div className="flex items-center justify-between mb-1 font-mono text-[11px]">
            <span className="font-semibold text-ink">Selected Factor ({selectedCause.category}):</span>
            <span className="text-slate-blue font-semibold uppercase">{selectedCause.status}</span>
          </div>
          <p className="text-ink font-medium">{selectedCause.cause_text}</p>
          {selectedCause.evidence_quote && (
            <div className="mt-1 text-[11px] text-graphite italic">
              Cited Evidence: "{selectedCause.evidence_quote}"
            </div>
          )}
        </div>
      )}
    </div>
  );
};

