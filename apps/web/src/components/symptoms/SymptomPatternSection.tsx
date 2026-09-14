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
    <div className="p-6 sm:p-8 rounded-[28px] bg-white border border-[#E2E8F0] shadow-xs text-left select-none space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E0F2FE] text-[#0288D1] text-xs font-mono font-bold border border-[#BAE6FD]">
            <Compass className="w-3.5 h-3.5 text-[#0288D1]" />
            <span>Health Intelligence</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold font-display text-[#0F172A]">
            Your Patterns
          </h3>
          <p className="text-xs text-[#64748B]">
            Observations gathered from your personal symptom check-ins over time.
          </p>
        </div>

        <div className="shrink-0">
          <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-[#F8FAFC] text-[#0288D1] border border-[#E2E8F0]">
            {totalLoggedCount} logs analyzed
          </span>
        </div>
      </div>

      {/* Content */}
      {!hasPatterns ? (
        <div className="p-6 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="p-3 rounded-2xl bg-[#E0F2FE] border border-[#BAE6FD] text-[#0288D1] shrink-0">
            <Sparkles className="w-5 h-5 text-[#0288D1]" />
          </div>
          <div className="space-y-0.5">
            <h4 className="text-sm font-bold text-[#0F172A] font-display">
              We're still learning your pattern
            </h4>
            <p className="text-xs text-[#64748B] leading-relaxed">
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
                  return <Clock className="w-4 h-4 text-[#0288D1]" />;
                case 'severity':
                  return <TrendingUp className="w-4 h-4 text-[#0288D1]" />;
                case 'frequency':
                default:
                  return <Sparkles className="w-4 h-4 text-[#0288D1]" />;
              }
            };

            return (
              <div
                key={obs.id}
                className="p-5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] shadow-xs space-y-2.5 flex flex-col justify-between"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-xl bg-white border border-[#E2E8F0] shadow-xs">{getIcon()}</span>
                    <span className="text-xs font-bold font-display text-[#0F172A]">{obs.title}</span>
                  </div>
                  <p className="text-xs text-[#64748B] leading-relaxed font-sans">
                    {obs.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-[#E2E8F0] flex items-center justify-between text-[11px] font-mono text-[#64748B]">
                  <span>Factual log data</span>
                  <span className="font-bold text-[#0288D1]">{obs.occurrenceCount} logs</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Safety Note */}
      <div className="p-3.5 rounded-2xl bg-[#F0F9FF] border border-[#BAE6FD] flex items-start gap-2.5 text-[11px] text-[#475569] leading-relaxed">
        <ShieldCheck className="w-4 h-4 text-[#0288D1] shrink-0 mt-0.5" />
        <span>
          OvaSense reflects observations from your logged data and does not provide a medical diagnosis. If you have concerns about any symptoms, always speak with your healthcare professional.
        </span>
      </div>
    </div>
  );
};
