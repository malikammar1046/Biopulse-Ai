import React from 'react';
import { BarChart01, CheckCircle, MessageChatCircle, ArrowUpRight, InfoCircle } from '@untitledui/icons';
import type { HealthPatternCorrelation } from '../../types/timeline';

interface HealthPatternsCardProps {
  patterns: HealthPatternCorrelation[];
  onAskAiPattern?: (pattern: HealthPatternCorrelation) => void;
}

export const HealthPatternsCard: React.FC<HealthPatternsCardProps> = ({
  patterns,
  onAskAiPattern,
}) => {
  return (
    <div className="p-6 sm:p-7 rounded-2xl bg-white border border-[#BAE6FD] shadow-none space-y-6 select-none text-left">
      {/* Card Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <BarChart01 className="w-5 h-5 text-[#0288D1] shrink-0" aria-hidden="true" />
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-[#0F172A]">
              Patterns BIOPulse AI Found
            </h2>
            <p className="text-xs text-[#64748B]">
              Deterministic correlations across your cycle, symptoms, diet, and movement.
            </p>
          </div>
        </div>

        <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#E0F2FE] text-[#01579B] border border-[#BAE6FD] w-fit">
          {patterns.length} Pattern{patterns.length !== 1 ? 's' : ''} Identified
        </span>
      </div>

      {/* Grid of Correlation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {patterns.map((pat) => (
          <div
            key={pat.id}
            className="p-5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#0288D1] shadow-none space-y-3.5 transition-all flex flex-col justify-between"
          >
            <div className="space-y-2.5">
              {/* Pattern Title & Badges */}
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-bold text-[#0F172A] leading-snug">
                  {pat.title}
                </h3>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                  {pat.confidence.toUpperCase()} CONFIDENCE
                </span>
              </div>

              {/* Signals tags */}
              <div className="flex flex-wrap items-center gap-1.5">
                {pat.signals.map((s, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-white text-[#64748B] border border-[#E2E8F0]"
                  >
                    {s}
                  </span>
                ))}
              </div>

              {/* Observed vs Interpretation */}
              <div className="space-y-2 text-xs">
                {/* Observed Fact */}
                <div className="p-3 rounded-xl bg-white border border-[#E2E8F0] text-[#0F172A] space-y-1">
                  <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-[#0288D1] uppercase">
                    <CheckCircle className="w-3 h-3 text-emerald-600" aria-hidden="true" />
                    <span>Observed Data</span>
                  </div>
                  <p className="text-xs text-[#0F172A] leading-relaxed">
                    {pat.observation.replace(/^Observed:\s*/, '')}
                  </p>
                </div>

                {/* BIOPulse Interpretation */}
                <div className="p-3 rounded-xl bg-[#F0F9FF] border border-[#BAE6FD] text-[#475569] space-y-1">
                  <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-[#0288D1] uppercase">
                    <MessageChatCircle className="w-3 h-3 text-[#0288D1]" aria-hidden="true" />
                    <span>Clinical Interpretation</span>
                  </div>
                  <p className="text-xs text-[#475569] leading-relaxed">
                    {pat.interpretation.replace(/^(OvaSense|BIOPulse)\s*Interpretation:\s*/i, '')}
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom Tip & Action */}
            <div className="pt-2 border-t border-[#E2E8F0] flex items-center justify-between gap-2 text-xs">
              {pat.actionTip ? (
                <p className="text-[11px] text-[#64748B] italic line-clamp-1">
                  Tip: {pat.actionTip}
                </p>
              ) : <div />}

              {onAskAiPattern && (
                <button
                  type="button"
                  onClick={() => onAskAiPattern(pat)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#0288D1] hover:text-[#01579B] shrink-0 cursor-pointer"
                >
                  <span>Explore in AI</span>
                  <ArrowUpRight className="w-3 h-3" aria-hidden="true" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Safety Notice */}
      <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-center gap-2 text-xs text-amber-800">
        <InfoCircle className="w-4 h-4 shrink-0 text-amber-600" aria-hidden="true" />
        <span className="text-[11px]">
          Observed correlations are derived from user-reported and lab logs to empower consultation conversations. They do not constitute diagnostic claims.
        </span>
      </div>
    </div>
  );
};
