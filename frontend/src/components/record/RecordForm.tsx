import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { setInvestigationMethod } from '../../store/uiSlice';
import { SectionHeader } from '../common/SectionHeader';
import { FieldContainer } from '../common/FieldContainer';
import { WhysView } from '../investigation/WhysView';
import { FishboneView } from '../investigation/FishboneView';
import { HypothesesList } from '../investigation/HypothesesList';
import { MissingEvidenceSection } from '../investigation/MissingEvidenceSection';
import { CAPASection } from '../investigation/CAPASection';
import { ReviewAndSaveSection } from '../investigation/ReviewAndSaveSection';
import { AuditTrailSection } from '../investigation/AuditTrailSection';
import { GitBranch, Network, AlertOctagon, CheckCircle2 } from 'lucide-react';

export const RecordForm: React.FC = () => {
  const dispatch = useDispatch();
  const inv = useSelector((state: RootState) => state.workspace);
  const method = useSelector((state: RootState) => state.ui.investigationMethod);
  const formData = inv.form_data;
  const assessment = inv.ai_assessment;
  const isLocked = inv.is_locked;

  const section1Fields = [
    'product_name',
    'strength_grade',
    'batch_number',
    'manufacturing_date',
    'retest_expiry_date',
    'affected_quantity',
    'equipment_id',
    'manufacturing_stage',
    'reporter_name_role',
    'detection_method',
    'occurrence_date',
    'discovery_date',
  ];

  const section2Fields = ['deviation_description', 'immediate_containment'];

  return (
    <div className="h-full overflow-y-auto p-6 space-y-8 bg-paper">
      {/* Document Header */}
      <div className="bg-sheet p-5 rounded-sm border border-rule shadow-subtle">
        <div className="flex items-start justify-between gap-4 mb-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-sm bg-ink text-sheet">
                {inv.rca_number || 'RCA-2026-XXXX'}
              </span>
              <span className="font-mono text-xs text-graphite">
                Revision: v{inv.version}.0
              </span>
              {isLocked ? (
                <span className="px-1.5 py-0.5 text-[10px] font-mono font-medium rounded-sm bg-verdigris text-sheet">
                  LOCKED
                </span>
              ) : (
                <span className="px-1.5 py-0.5 text-[10px] font-mono font-medium rounded-sm bg-amber/15 text-amber border border-amber/30">
                  DRAFT REVISION
                </span>
              )}
            </div>
            <h1 className="font-serif text-2xl font-medium text-ink leading-tight">
              {inv.title || 'API Quality Incident Root Cause Analysis'}
            </h1>
          </div>

          <div className="text-right font-mono text-[11px] text-graphite-light">
            <div>ICH Q7 / Q10 Compliant</div>
            <div>21 CFR 211.192 Validated</div>
          </div>
        </div>
      </div>

      {/* 01 Event & Batch Intake */}
      <section id="section-01" className="bg-sheet p-5 rounded-sm border border-rule shadow-subtle">
        <SectionHeader
          number="01"
          title="Deviation Identification & Batch Specifics"
          description="Factual parameters extracted from deviation notice, incident memo, or production notification."
          fieldKeys={section1Fields}
          isLocked={isLocked}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <FieldContainer fieldKey="product_name" label="Product Name (API)" fieldData={formData['product_name']} isLocked={isLocked} />
          <FieldContainer fieldKey="strength_grade" label="Pharmacopeial Grade" fieldData={formData['strength_grade']} isLocked={isLocked} />
          <FieldContainer fieldKey="batch_number" label="Batch / Lot Number" fieldData={formData['batch_number']} isLocked={isLocked} />
          <FieldContainer fieldKey="affected_quantity" label="Affected Quantity & Packaging" fieldData={formData['affected_quantity']} isLocked={isLocked} />
          <FieldContainer fieldKey="equipment_id" label="Equipment Train ID" fieldData={formData['equipment_id']} isLocked={isLocked} />
          <FieldContainer fieldKey="manufacturing_stage" label="Manufacturing Process Stage" fieldData={formData['manufacturing_stage']} isLocked={isLocked} />
          <FieldContainer fieldKey="reporter_name_role" label="Detected / Reported By" fieldData={formData['reporter_name_role']} isLocked={isLocked} />
          <FieldContainer fieldKey="detection_method" label="Detection Method" fieldData={formData['detection_method']} isLocked={isLocked} />
          <FieldContainer fieldKey="occurrence_date" label="Occurrence Timestamp" fieldData={formData['occurrence_date']} isLocked={isLocked} />
          <FieldContainer fieldKey="discovery_date" label="Discovery Timestamp" fieldData={formData['discovery_date']} isLocked={isLocked} />
        </div>
      </section>

      {/* 02 Immediate Containment */}
      <section id="section-02" className="bg-sheet p-5 rounded-sm border border-rule shadow-subtle">
        <SectionHeader
          number="02"
          title="Incident Narrative & Immediate Containment"
          description="Description of the discrepancy and physical/systemic quarantine actions taken."
          fieldKeys={section2Fields}
          isLocked={isLocked}
        />
        <div className="space-y-3">
          <FieldContainer fieldKey="deviation_description" label="Deviation Incident Description" fieldData={formData['deviation_description']} isLocked={isLocked} />
          <FieldContainer fieldKey="immediate_containment" label="Immediate Containment Actions (Quarantine & Segregation)" fieldData={formData['immediate_containment']} isLocked={isLocked} />
        </div>
      </section>

      {/* 03 AI Risk Assessment */}
      <section id="section-03" className="bg-sheet p-5 rounded-sm border border-rule shadow-subtle">
        <SectionHeader
          number="03"
          title="AI Co-Pilot Risk & Impact Assessment"
          description="Automated risk classification and immediate regulatory action formulation (ICH Q9)."
        />
        <div className="p-4 bg-sheet-subtle rounded-sm border border-rule text-xs font-sans space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-rule-subtle font-mono">
            <span className="text-graphite font-semibold">Classification:</span>
            <span
              className={`px-2 py-0.5 rounded-sm font-bold uppercase text-[11px] ${
                assessment?.severity === 'critical'
                  ? 'bg-vermilion text-sheet'
                  : 'bg-amber text-sheet'
              }`}
            >
              {assessment?.severity || 'MAJOR'} CLASSIFICATION
            </span>
          </div>

          <div>
            <span className="font-mono text-[11px] font-semibold text-ink block mb-0.5">
              Recommended Next Regulatory Action:
            </span>
            <p className="text-ink font-medium leading-relaxed">
              {assessment?.recommended_action || 'Hold batch and initiate QA discrepancy investigation.'}
            </p>
          </div>

          <div>
            <span className="font-mono text-[11px] font-semibold text-ink block mb-0.5">
              Risk Rationale (ICH Q9 Quality Risk Management):
            </span>
            <p className="text-graphite leading-relaxed">
              {assessment?.risk_rationale || 'Evaluation of critical quality attribute impact and patient safety.'}
            </p>
          </div>

          <div>
            <span className="font-mono text-[11px] font-semibold text-ink block mb-0.5">
              Scope of Impact & Adjacent Lots:
            </span>
            <p className="text-graphite leading-relaxed">
              {assessment?.impact_scope || 'Isolated to current batch; verify cleaning validation and equipment train integrity.'}
            </p>
          </div>
        </div>
      </section>

      {/* 04 Investigation (5 Whys / 6M Fishbone) */}
      <section id="section-04" className="bg-sheet p-5 rounded-sm border border-rule shadow-subtle">
        <div className="flex items-center justify-between pb-2 mb-3 border-b border-rule">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-xs font-semibold text-slate-blue tracking-wide">04</span>
              <h3 className="font-serif text-lg font-medium text-ink">Root Cause Analysis Investigation</h3>
            </div>
            <p className="text-xs text-graphite mt-0.5">
              Dual-view causal deduction with Human Error guardrail and ranked hypothesis evaluation.
            </p>
          </div>

          {/* Toggle between 5 Whys and Fishbone */}
          <div className="flex items-center gap-1 bg-paper p-1 rounded-sm border border-rule">
            <button
              type="button"
              onClick={() => dispatch(setInvestigationMethod('whys'))}
              className={`px-2.5 py-1 text-xs font-sans font-medium rounded-sm inline-flex items-center gap-1 transition-colors ${
                method === 'whys'
                  ? 'bg-ink text-sheet'
                  : 'text-graphite hover:text-ink'
              }`}
            >
              <GitBranch className="w-3.5 h-3.5" />
              <span>5 Whys Descent</span>
            </button>
            <button
              type="button"
              onClick={() => dispatch(setInvestigationMethod('fishbone'))}
              className={`px-2.5 py-1 text-xs font-sans font-medium rounded-sm inline-flex items-center gap-1 transition-colors ${
                method === 'fishbone'
                  ? 'bg-ink text-sheet'
                  : 'text-graphite hover:text-ink'
              }`}
            >
              <Network className="w-3.5 h-3.5" />
              <span>6M Fishbone SVG</span>
            </button>
          </div>
        </div>

        {/* Dynamic Investigation Method View */}
        <div className="mb-6">
          {method === 'whys' ? <WhysView /> : <FishboneView />}
        </div>

        {/* Ranked Hypotheses Section */}
        <div className="pt-4 border-t border-rule-subtle">
          <h4 className="font-serif text-base font-medium text-ink mb-2">
            Ranked Causal Hypotheses & QP Attestation
          </h4>
          <HypothesesList />
        </div>
      </section>

      {/* 05 Missing Evidence */}
      <section id="section-05" className="bg-sheet p-5 rounded-sm border border-rule shadow-subtle">
        <SectionHeader
          number="05"
          title="Missing Evidence & Investigation Checklist"
          description="Register of open documentation gaps required to corroborate or refute provisional hypotheses."
        />
        <MissingEvidenceSection />
      </section>

      {/* 06 CAPA */}
      <section id="section-06" className="bg-sheet p-5 rounded-sm border border-rule shadow-subtle">
        <SectionHeader
          number="06"
          title="Corrective & Preventive Action (CAPA) Plan"
          description="3-tier structured actions (Correction, Corrective Action, Preventive Action) per ICH Q10."
        />
        <CAPASection />
      </section>

      {/* 07 Review & Save */}
      <section id="section-07" className="bg-sheet p-5 rounded-sm border border-rule shadow-subtle">
        <SectionHeader
          number="07"
          title="Regulatory Attestation & Record Locking"
          description="Formal validation checklist, revision control, and locking for audit submission."
        />
        <ReviewAndSaveSection />
      </section>

      {/* 08 Audit Trail */}
      <section id="section-08" className="bg-sheet p-5 rounded-sm border border-rule shadow-subtle">
        <SectionHeader
          number="08"
          title="ALCOA+ Append-Only Audit Trail"
          description="Complete chronological log of every AI extraction, natural language edit, and human confirmation."
        />
        <AuditTrailSection />
      </section>
    </div>
  );
};

