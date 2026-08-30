import React from 'react';
import { Sparkles, TrendingUp, Compass, Clock, ShieldCheck } from 'lucide-react';
import type { SymptomPatternObservation } from '../../types/symptom';

interface SymptomPatternSectionProps {
  observations: SymptomPatternObservation[];
  totalLoggedCount: number;
}

export const SymptomPatternSection: React.FC<SymptomPatternSectionProps> = ({
  observations,
  totalLoggedCount,
}) => {
  const hasPatterns = observations.length > 0 && totalLoggedCount >= 3;

  return (
    <div className="p-6 sm:p-8 rounded-[32px] bg-white border border-[#E7DFEF] shadow-sm text-left select-none space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EDE4F7] text-[#6E2D8B] text-xs font-mono font-bold">
            <Compass className="w-3.5 h-3.5 text-[#8E3EAF]" />
            <span>Health Intelligence</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold font-display text-[#1C1326]">
            Your Patterns
          </h3>
          <p className="text-xs text-[#584B68]">
            Observations gathered from your personal symptom check-ins over time.
          </p>
        </div>

        <div className="shrink-0">
          <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-[#F8F5FA] text-[#8E3EAF] border border-[#E7DFEF]">
            {totalLoggedCount} logs analyzed
          </span>
        </div>
      </div>

      {/* Content */}
      {!hasPatterns ? (
        <div className="p-6 rounded-2xl bg-[#F8F5FA] border border-[#E7DFEF] flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="p-3 rounded-2xl bg-[#EDE4F7] text-[#6E2D8B] shrink-0">
            <Sparkles className="w-5 h-5 text-[#8E3EAF]" />
          </div>
          <div className="space-y-0.5">
            <h4 className="text-sm font-bold text-[#1C1326] font-display">
              We're still learning your pattern
            </h4>
            <p className="text-xs text-[#584B68] leading-relaxed">
              Keep logging your daily symptoms over your cycles. Once you have a few entries, OvaSense will highlight when symptoms commonly occur and how they shift over time.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {observations.map((obs) => {
            const getIcon = () => {
              switch (obs.type) {
                case 'timing':
                  return <Clock className="w-4 h-4 text-[#FB7185]" />;
                case 'severity':
                  return <TrendingUp className="w-4 h-4 text-[#8E3EAF]" />;
                case 'frequency':
                default:
                  return <Sparkles className="w-4 h-4 text-[#6E2D8B]" />;
              }
            };

            const getBgGradient = () => {
              switch (obs.type) {
                case 'timing':
                  return 'from-[#FFF1F2]/60 to-white border-[#FDA4AF]/40';
                case 'severity':
                  return 'from-[#FAF5FF]/60 to-white border-[#D8B4FE]/40';
                case 'frequency':
                default:
                  return 'from-[#EDE4F7]/40 to-white border-[#D8B4FE]/50';
              }
            };

            return (
              <div
                key={obs.id}
                className={`p-5 rounded-3xl bg-gradient-to-br ${getBgGradient()} border shadow-2xs space-y-2.5 flex flex-col justify-between`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-xl bg-white shadow-2xs">{getIcon()}</span>
                    <span className="text-xs font-bold font-display text-[#1C1326]">{obs.title}</span>
                  </div>
                  <p className="text-xs text-[#584B68] leading-relaxed font-sans">
                    {obs.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-[#E7DFEF]/40 flex items-center justify-between text-[11px] font-mono text-[#8D7E9E]">
                  <span>Factual log data</span>
                  <span className="font-bold text-[#6E2D8B]">{obs.occurrenceCount} logs</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Safety Note */}
      <div className="p-3.5 rounded-2xl bg-[#F8F5FA] border border-[#E7DFEF] flex items-start gap-2.5 text-[11px] text-[#584B68] leading-relaxed">
        <ShieldCheck className="w-4 h-4 text-[#8E3EAF] shrink-0 mt-0.5" />
        <span>
          OvaSense reflects observations from your logged data and does not provide a medical diagnosis. If you have concerns about any symptoms, always speak with your healthcare professional.
        </span>
      </div>
    </div>
  );
};
