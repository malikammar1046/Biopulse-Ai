import React from 'react';
import { Sliders01, CpuChip01, BarChart01, MessageChatCircle, LineChartUp01 } from '@untitledui/icons';
import type { HealthPathway } from '../../../types/onboarding';

interface AIInsightsPlaceholderProps {
  pathway: HealthPathway;
}

export const AIInsightsPlaceholder: React.FC<AIInsightsPlaceholderProps> = ({
  pathway,
}) => {
  const pathwayConfig = {
    female: {
      accent: 'text-[#0288D1]',
      border: 'border-[#BAE6FD]',
      badgeBg: 'bg-[#E0F2FE]',
      badgeText: 'text-[#0288D1]',
      domain: 'PCOS Explainable AI (XAI)',
      subtext:
        'Phase 7 delivers MedGemma-grounded feature importance explanations, breaking down how cycle irregularities, hormonal ratios, and metabolic indicators interact.',
    },
    male: {
      accent: 'text-[#0288D1]',
      border: 'border-[#BAE6FD]',
      badgeBg: 'bg-[#E0F2FE]',
      badgeText: 'text-[#0288D1]',
      domain: 'Hypogonadism Explainable AI (XAI)',
      subtext:
        'Phase 7 delivers clinical SHAP factor contribution maps, illustrating how morning testosterone diurnal levels, fatigue scores, and metabolic markers synthesize.',
    },
    general: {
      accent: 'text-[#0288D1]',
      border: 'border-[#BAE6FD]',
      badgeBg: 'bg-[#E0F2FE]',
      badgeText: 'text-[#0288D1]',
      domain: 'BioPulse AI Clinical Intelligence (XAI)',
      subtext:
        'Phase 7 delivers multi-modal biomarker synthesis, correlating sleep metrics, metabolic health, and preventive longevity patterns.',
    },
  }[pathway];

  return (
    <div
      className="p-6 sm:p-7 rounded-[28px] bg-white border border-[#E2E8F0] shadow-xs text-left relative overflow-hidden text-[#0F172A] select-none"
      id="xai-insights-architecture-slot"
    >
      <div className="relative z-10 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Sliders01 className="w-5 h-5 text-[#0288D1] shrink-0" aria-hidden="true" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#64748B] font-bold">
                  Phase 7 Architecture
                </span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${pathwayConfig.badgeBg} ${pathwayConfig.badgeText} font-bold border border-[#BAE6FD]`}>
                  Active Pipeline
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold font-display text-[#0F172A]">
                {pathwayConfig.domain}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-[#64748B] font-mono self-start sm:self-auto bg-[#F8FAFC] px-3 py-1.5 rounded-xl border border-[#E2E8F0]">
            <CpuChip01 className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
            <span>MedGemma & SHAP Pipeline</span>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-[#475569] font-sans leading-relaxed max-w-3xl">
          {pathwayConfig.subtext}
        </p>

        {/* Feature Preview Skeleton Slots */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
          <div className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-[#0288D1] font-bold">
                Feature Influence (SHAP)
              </span>
              <BarChart01 className="w-3.5 h-3.5 text-[#0288D1]" aria-hidden="true" />
            </div>
            <p className="text-[11px] text-[#64748B] font-sans">
              Dynamic percentage ranking of clinical biomarkers driving your current assessment tier.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-[#0288D1] font-bold">
                MedGemma Clinical Narrative
              </span>
              <MessageChatCircle className="w-3.5 h-3.5 text-[#0288D1]" aria-hidden="true" />
            </div>
            <p className="text-[11px] text-[#64748B] font-sans">
              Non-diagnostic, clinician-aligned plain English explanations of complex multi-panel lab correlations.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-[#0288D1] font-bold">
                Cost-Aware Gap Reduction
              </span>
              <LineChartUp01 className="w-3.5 h-3.5 text-[#0288D1]" aria-hidden="true" />
            </div>
            <p className="text-[11px] text-[#64748B] font-sans">
              Prioritizes the lowest-cost, highest-value missing labs to advance your screening confidence.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
