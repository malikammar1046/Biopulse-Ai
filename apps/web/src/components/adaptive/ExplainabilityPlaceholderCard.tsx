import React from 'react';
import { Sparkles, Brain, CheckCircle2 } from 'lucide-react';
import type { ExplainabilitySummary } from '../../types/adaptiveScreening';

interface ExplainabilityPlaceholderCardProps {
  summary: ExplainabilitySummary;
}

export const ExplainabilityPlaceholderCard: React.FC<ExplainabilityPlaceholderCardProps> = ({
  summary,
}) => {
  return (
    <div className="p-6 sm:p-8 rounded-[32px] bg-white border border-[#E7DFEF] shadow-sm space-y-5 text-left select-none">
      {/* ── Top Header ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-[#F0EAF5] pb-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-[#EDE4F7] text-[#6E2D8B] text-xs font-mono font-bold">
            <Brain className="w-3.5 h-3.5 text-[#8E3EAF]" />
            <span>Explainable AI Interface</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold font-display text-[#1C1326]">
            AI Screening Feature Influence
          </h3>
          <p className="text-xs text-[#584B68] leading-relaxed">
            Transparency on how verified multi-system indicators guide pattern screening.
          </p>
        </div>
      </div>

      {/* ── Mandatory Safe Approved Headline ────────────────────────────── */}
      <div className="p-4 rounded-2xl bg-[#FAF5FF] border border-[#E9D5FF] space-y-1.5">
        <h4 className="text-sm font-bold text-[#581C87] font-sans flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#8E3EAF]" />
          <span>{summary.headline}</span>
        </h4>
        <p className="text-xs text-[#6B21A8] leading-relaxed">
          {summary.disclaimer}
        </p>
      </div>

      {/* ── Feature Cards Grid ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {summary.features.map((feat) => (
          <div
            key={feat.featureId}
            className="p-4 rounded-2xl bg-white border border-[#E7DFEF] shadow-2xs hover:border-[#D8B4FE] transition-colors flex flex-col justify-between space-y-2"
          >
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] text-[#736384] font-mono">
                <span>Feature Factor</span>
                {feat.isKnown ? (
                  <span className="text-[#047857] flex items-center gap-1 font-bold">
                    <CheckCircle2 className="w-3 h-3 text-[#047857]" />
                    <span>Recorded</span>
                  </span>
                ) : (
                  <span className="text-[#BE123C] font-semibold">Unrecorded</span>
                )}
              </div>
              <h5 className="text-sm font-bold text-[#1C1326] font-display">
                {feat.label}
              </h5>
              <p className="text-xs text-[#584B68] leading-relaxed">
                {feat.patientExplanation}
              </p>
            </div>

            <div className="pt-2 border-t border-[#F0EAF5] text-[10px] font-mono text-[#736384]">
              Direction:{' '}
              <span className="text-[#6E2D8B] font-bold capitalize">
                {feat.influenceDirection.replace(/_/g, ' ')}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Reassurance text */}
      <div className="text-[11px] text-[#736384] leading-relaxed bg-[#F8F5FA] p-3 rounded-xl border border-[#E7DFEF]">
        * Statistical feature weighting describes model influence across thousands of training records. It never establishes medical causation. Consult your physician for clinical diagnosis.
      </div>
    </div>
  );
};
