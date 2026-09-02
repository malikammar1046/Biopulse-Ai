import React from 'react';
import { Sparkles, Brain, CheckCircle, Info, ArrowUpRight } from 'lucide-react';
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
    <div className="p-6 sm:p-8 rounded-[36px] bg-gradient-to-br from-white via-[#FAF7FD] to-[#F5EEFB] border border-[#E7DFEF] shadow-sm space-y-6 select-none text-left">
      {/* Card Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-[#6E2D8B] to-[#FB7185] text-white shadow-md shadow-purple-950/20">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold font-display text-[#1C1326]">
              Patterns OvaSense Found
            </h2>
            <p className="text-xs text-[#584B68]">
              Deterministic correlations across your cycle, symptoms, diet, and movement.
            </p>
          </div>
        </div>

        <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#EDE4F7] text-[#6E2D8B] w-fit">
          {patterns.length} Pattern{patterns.length !== 1 ? 's' : ''} Identified
        </span>
      </div>

      {/* Grid of Correlation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {patterns.map((pat) => (
          <div
            key={pat.id}
            className="p-5 rounded-[26px] bg-white border border-[#E7DFEF] hover:border-[#D8B4FE] shadow-xs space-y-3.5 transition-all flex flex-col justify-between"
          >
            <div className="space-y-2.5">
              {/* Pattern Title & Badges */}
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-bold font-display text-[#1C1326] leading-snug">
                  {pat.title}
                </h3>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#ECFDF5] text-[#047857] shrink-0">
                  {pat.confidence.toUpperCase()} CONFIDENCE
                </span>
              </div>

              {/* Signals tags */}
              <div className="flex flex-wrap items-center gap-1.5">
                {pat.signals.map((s, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-[#F8F5FA] text-[#8D7E9E] border border-[#E7DFEF]"
                  >
                    {s}
                  </span>
                ))}
              </div>

              {/* Observed vs Interpretation */}
              <div className="space-y-2 text-xs">
                {/* Observed Fact */}
                <div className="p-3 rounded-xl bg-[#F8F5FA] border border-[#E7DFEF] text-[#1C1326] space-y-1">
                  <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-[#6E2D8B] uppercase">
                    <CheckCircle className="w-3 h-3 text-[#34D399]" />
                    <span>Observed Data</span>
                  </div>
                  <p className="text-xs text-[#1C1326] leading-relaxed">
                    {pat.observation.replace(/^Observed:\s*/, '')}
                  </p>
                </div>

                {/* OvaSense Interpretation */}
                <div className="p-3 rounded-xl bg-[#FAF5FF] border border-[#EDE4F7] text-[#584B68] space-y-1">
                  <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-[#8E3EAF] uppercase">
                    <Sparkles className="w-3 h-3 text-[#FB7185]" />
                    <span>OvaSense Interpretation</span>
                  </div>
                  <p className="text-xs text-[#584B68] leading-relaxed">
                    {pat.interpretation.replace(/^OvaSense Interpretation:\s*/, '')}
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom Tip & Action */}
            <div className="pt-2 border-t border-[#F0EAF5] flex items-center justify-between gap-2 text-xs">
              {pat.actionTip ? (
                <p className="text-[11px] text-[#8D7E9E] italic line-clamp-1">
                  Tip: {pat.actionTip}
                </p>
              ) : <div />}

              {onAskAiPattern && (
                <button
                  type="button"
                  onClick={() => onAskAiPattern(pat)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#6E2D8B] hover:text-[#A21CAF] shrink-0 cursor-pointer"
                >
                  <span>Explore in AI</span>
                  <ArrowUpRight className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Safety Notice */}
      <div className="p-3 rounded-2xl bg-[#FFFBEB] border border-[#FEF3C7] flex items-center gap-2 text-xs text-[#B45309]">
        <Info className="w-4 h-4 shrink-0 text-[#D97706]" />
        <span className="text-[11px]">
          Observed correlations are derived from user-reported and lab logs to empower consultation conversations. They do not constitute diagnostic claims.
        </span>
      </div>
    </div>
  );
};
