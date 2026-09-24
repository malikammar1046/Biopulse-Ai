import React, { useState, useEffect } from 'react';
import {
  XClose,
  BarChart01,
  ShieldTick,
  CheckCircle,
  Code01,
} from '@untitledui/icons';
import type { ExplainableInsight } from '../../types/researchIntelligence';

interface InsightExplanationModalProps {
  insight: ExplainableInsight | null;
  isOpen: boolean;
  onClose: () => void;
}

export const InsightExplanationModal: React.FC<InsightExplanationModalProps> = ({
  insight,
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'patient' | 'research'>('patient');

  // Keyboard shortcut (Escape to close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !insight) return null;

  const isRealShap = Boolean(insight.shapAttribution?.isRealShap && insight.shapAttribution?.explanations?.length);
  const maxShapMag = isRealShap
    ? Math.max(...(insight.shapAttribution?.explanations.map((e) => Math.abs(e.magnitude)) || [1]))
    : 1;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="xai-modal-title"
    >
      <div
        className="relative w-full max-w-3xl rounded-[24px] bg-white border border-[#E2E8F0] text-[#0F172A] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── 1. Modal Top Bar ────────────────────────────────────────────── */}
        <div className="p-5 sm:p-6 border-b border-[#E2E8F0] flex items-center justify-between gap-4 relative z-10 bg-[#F8FAFC]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#E0F2FE] border border-[#BAE6FD] flex items-center justify-center text-[#0288D1] shadow-xs">
              <BarChart01 className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#0288D1] font-bold">
                  Explainable Intelligence (XAI)
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white text-[#64748B] border border-[#E2E8F0]">
                  {insight.pathway.toUpperCase()} PATHWAY
                </span>
              </div>
              <h3 id="xai-modal-title" className="text-lg sm:text-xl font-bold font-display text-[#0F172A]">
                {insight.title}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white hover:bg-[#F1F5F9] flex items-center justify-center text-[#64748B] hover:text-[#0F172A] border border-[#E2E8F0] transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <XClose className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* ── 2. View Mode Toggle: Patient View vs Research View ─────────── */}
        <div className="px-5 sm:px-6 pt-4 pb-2 flex items-center justify-between border-b border-[#E2E8F0] bg-[#F8FAFC]">
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white border border-[#E2E8F0]">
            <button
              type="button"
              onClick={() => setActiveTab('patient')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-sans font-semibold transition-all cursor-pointer ${
                activeTab === 'patient'
                  ? 'bg-[#0288D1] text-white shadow-xs'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              Patient View (Accessible)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('research')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-sans font-semibold transition-all cursor-pointer ${
                activeTab === 'research'
                  ? 'bg-[#0288D1] text-white shadow-xs'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              <Code01 className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Research View (Technical)</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-xs text-emerald-700 font-mono font-bold">
            <ShieldTick className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
            <span>Non-Diagnostic</span>
          </div>
        </div>

        {/* ── 3. Modal Scrollable Content ─────────────────────────────────── */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-left relative z-10 bg-white">
          {activeTab === 'patient' ? (
            /* ─────────────────────────────────────────────────────────────── */
            /* PATIENT VIEW                                                    */
            /* ─────────────────────────────────────────────────────────────── */
            <div className="space-y-5">
              {/* Question 1: WHAT did BioPulse AI notice? */}
              <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1.5">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#0288D1] font-bold block">
                  1. What did BioPulse AI notice?
                </span>
                <p className="text-sm sm:text-base font-semibold text-[#0F172A]">
                  {insight.summary}
                </p>
              </div>

              {/* Question 2: WHY did it notice it? */}
              <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1.5">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#0288D1] font-bold block">
                  2. Why did it notice it?
                </span>
                <p className="text-xs sm:text-sm text-[#64748B] font-sans leading-relaxed">
                  {insight.why}
                </p>
              </div>

              {/* Question 3: BASED ON WHAT? Real Data Sources */}
              <div className="space-y-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#64748B] font-bold block">
                  3. Based on what actual data?
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {insight.dataSources.map((ds, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#0F172A]">{ds.label}</span>
                        <span className="text-[10px] font-mono text-[#0288D1] bg-[#E0F2FE] px-2 py-0.5 rounded">
                          {ds.recordCount} record{ds.recordCount === 1 ? '' : 's'}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#64748B]">{ds.description}</p>
                      <div className="pt-1 flex items-center gap-1 text-[10px] font-mono text-emerald-700">
                        <CheckCircle className="w-3 h-3 text-emerald-600" />
                        <span>Trust level: {ds.trustLevel.replace('_', ' ')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Question 4: HOW CERTAIN? Signal Strength */}
              <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1.5">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#0288D1] font-bold block">
                  4. How certain is this signal?
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-[#0F172A]">
                    {insight.confidenceLabel || 'Observation Pattern'}
                  </span>
                  <span className="text-xs font-mono text-[#0288D1] bg-[#E0F2FE] px-2.5 py-0.5 rounded-full border border-[#BAE6FD]">
                    {insight.signalStrength ? insight.signalStrength.replace('_', ' ') : 'stable'}
                  </span>
                </div>
                <p className="text-xs text-[#64748B] font-sans">
                  BioPulse AI does not fabricate arbitrary confidence percentages. Signal strength reflects the consistency and depth of real records logged in your account.
                </p>
              </div>

              {/* Next Steps & Limitations */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-1.5">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-700 font-bold block">
                    What you can do
                  </span>
                  <p className="text-xs sm:text-sm text-[#0F172A] leading-relaxed">
                    {insight.recommendedAction}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-1.5">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-rose-700 font-bold block">
                    What this does NOT mean
                  </span>
                  <p className="text-xs sm:text-sm text-rose-900 leading-relaxed">
                    {insight.whatThisDoesNotMean}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* ─────────────────────────────────────────────────────────────── */
            /* RESEARCH VIEW (TECHNICAL & TREE-SHAP)                            */
            /* ─────────────────────────────────────────────────────────────── */
            <div className="space-y-6">
              {/* Architecture & Engine Metadata */}
              <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#0288D1] font-bold">
                    Intelligence Engine Architecture
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#E0F2FE] text-[#0288D1] font-bold border border-[#BAE6FD]">
                    {insight.engineType.toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                  <div className="p-2 rounded-xl bg-white border border-[#E2E8F0]">
                    <span className="text-[10px] text-[#64748B] block">Insight ID</span>
                    <span className="text-[#0F172A] truncate block font-bold">{insight.id}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-white border border-[#E2E8F0]">
                    <span className="text-[10px] text-[#64748B] block">Category</span>
                    <span className="text-[#0F172A] capitalize block font-bold">{insight.type}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-white border border-[#E2E8F0]">
                    <span className="text-[10px] text-[#64748B] block">Status</span>
                    <span className="text-[#0F172A] capitalize block font-bold">{insight.status}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-white border border-[#E2E8F0]">
                    <span className="text-[10px] text-[#64748B] block">Timestamp</span>
                    <span className="text-[#0F172A] truncate block font-bold">{new Date(insight.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* TreeSHAP Feature Importance (If Authentic SHAP Exists) */}
              {isRealShap && insight.shapAttribution ? (
                <div className="p-4 sm:p-5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#0288D1]">
                          TreeSHAP Local Feature Attributions
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                          Real Model Inference
                        </span>
                      </div>
                      <p className="text-[11px] text-[#64748B] font-sans">
                        Calculated via explainable feature attributions for this screening result.
                      </p>
                    </div>

                    <div className="text-right font-mono text-xs">
                      <span className="text-[#64748B] text-[10px] block">Screening Threshold</span>
                      <span className="text-[#0F172A] font-bold">
                        {((insight.shapAttribution.screeningThreshold || 0.38) * 100).toFixed(0)}% Cutoff
                      </span>
                    </div>
                  </div>

                  {/* SHAP Bars Table */}
                  <div className="space-y-3 pt-2">
                    {insight.shapAttribution.explanations.map((exp, idx) => {
                      const isRisk = exp.direction === 'increases_risk' || exp.direction === 'positive';
                      const pct = maxShapMag > 0 ? (Math.abs(exp.magnitude) / maxShapMag) * 100 : 50;

                      return (
                        <div key={idx} className="p-3 rounded-xl bg-white border border-[#E2E8F0] space-y-2">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-[#0F172A]">{exp.human_label || exp.feature}</span>
                              <span className="text-[10px] font-mono text-[#64748B] hidden sm:inline">
                                ({exp.feature})
                              </span>
                            </div>
                            <div className="flex items-center gap-2 font-mono text-[11px]">
                              <span className={isRisk ? 'text-rose-600 font-bold' : 'text-emerald-700 font-bold'}>
                                {isRisk ? '↑ Increases Risk' : '↓ Protective Factor'}
                              </span>
                              <span className="text-[#64748B]">
                                |SHAP| {Math.abs(exp.magnitude).toFixed(3)}
                              </span>
                            </div>
                          </div>

                          {/* Relative Magnitude Bar */}
                          <div className="w-full h-2 rounded-full bg-[#E2E8F0] overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                isRisk ? 'bg-rose-500' : 'bg-emerald-600'
                              }`}
                              style={{ width: `${Math.max(8, Math.min(100, pct))}%` }}
                            />
                          </div>

                          <p className="text-[11px] text-[#64748B] font-sans">
                            {exp.patient_explanation}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* Non-ML Engine: Show Deterministic Methodology & Future MedGemma Contract */
                <div className="p-4 sm:p-5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#0288D1]">
                        Pattern Methodology & Future ML Schema
                      </span>
                      <p className="text-[11px] text-[#64748B]">
                        This insight is derived from deterministic rules and tracking consistency. No fake SHAP values are generated.
                      </p>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#E0F2FE] text-[#0288D1] border border-[#BAE6FD]">
                      Deterministic v1.2
                    </span>
                  </div>

                  {/* Future MedGemma Contract Schema */}
                  <div className="p-3.5 rounded-xl bg-white border border-[#E2E8F0] space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-mono text-[#0288D1] font-bold">
                      <span>ML Team Integration Contract (Phases 9–10)</span>
                      <span>MedGemma Contract Ready</span>
                    </div>
                    <pre className="text-[10px] font-mono text-[#0F172A] overflow-x-auto p-2 rounded bg-[#F8FAFC] border border-[#E2E8F0]">
{`interface MedGemmaContract {
  model: "medgemma-7b-vitasense",
  modelVersion: "1.0-pending-finetuning",
  inputFeatures: { pathway: "${insight.pathway}", records: ${insight.dataSources.reduce((acc, d) => acc + d.recordCount, 0)} },
  prediction: "Multimodal clinical narrative synthesis",
  status: "pending_ml_team_release"
}`}
                    </pre>
                  </div>
                </div>
              )}

              {/* Data Provenance Audit Table */}
              <div className="space-y-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#0288D1] font-bold block">
                  Complete Data Provenance Audit
                </span>
                <div className="overflow-x-auto rounded-xl border border-[#E2E8F0]">
                  <table className="w-full text-left text-xs font-sans">
                    <thead className="bg-[#F8FAFC] text-[10px] font-mono uppercase text-[#64748B] border-b border-[#E2E8F0]">
                      <tr>
                        <th className="p-3">Data Source</th>
                        <th className="p-3">Stored Records</th>
                        <th className="p-3">Trust Level</th>
                        <th className="p-3">Audit Scope</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E8F0] bg-white">
                      {insight.dataSources.map((ds, idx) => (
                        <tr key={idx} className="hover:bg-[#F8FAFC]">
                          <td className="p-3 font-medium text-[#0F172A]">{ds.label}</td>
                          <td className="p-3 font-mono text-[#0288D1] font-bold">{ds.recordCount}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#E0F2FE] text-[#0288D1] border border-[#BAE6FD]">
                              {ds.trustLevel}
                            </span>
                          </td>
                          <td className="p-3 text-[11px] text-[#64748B]">{ds.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Clinical Safety & Limitations Box */}
              <div className="p-4 rounded-2xl bg-[#F0F9FF] border border-[#BAE6FD] space-y-1 text-xs">
                <span className="font-mono text-[10px] uppercase font-bold text-emerald-700 block">
                  BioPulse AI Research Protocol & Clinical Disclaimer
                </span>
                <p className="text-[11px] text-[#0F172A] leading-relaxed">
                  BioPulse AI algorithms operate in strict compliance with human-in-the-loop clinical protocols. This system provides non-diagnostic screening aids, educational pattern intelligence, and habit tracking. It does not replace ultrasound imaging, clinical blood venipunctures, or professional medical diagnosis.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── 4. Modal Bottom Footer ──────────────────────────────────────── */}
        <div className="p-4 sm:p-5 border-t border-[#E2E8F0] flex items-center justify-between bg-[#F8FAFC]">
          <span className="text-[11px] font-mono text-[#64748B]">
            Phase 7 Explainable Intelligence Architecture
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#0288D1] hover:bg-[#0277BD] text-xs font-sans font-semibold text-white transition-colors cursor-pointer shadow-xs"
          >
            Close Explanation
          </button>
        </div>
      </div>
    </div>
  );
};
