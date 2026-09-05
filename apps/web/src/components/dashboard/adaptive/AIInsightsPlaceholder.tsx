import React from 'react';
import { Brain, Cpu, Sparkles } from 'lucide-react';
import type { HealthPathway } from '../../../types/onboarding';

interface AIInsightsPlaceholderProps {
  pathway: HealthPathway;
}

export const AIInsightsPlaceholder: React.FC<AIInsightsPlaceholderProps> = ({
  pathway,
}) => {
  const pathwayConfig = {
    female: {
      accent: 'text-[#FDA4AF]',
      border: 'border-[#FB7185]/20',
      badgeBg: 'bg-[#FB7185]/10',
      badgeText: 'text-[#FDA4AF]',
      domain: 'OvaSense Explainable AI (XAI)',
      subtext:
        'Phase 7 will deliver MedGemma-grounded feature importance explanations, breaking down how cycle irregularities, hormonal ratios, and metabolic indicators interact.',
    },
    male: {
      accent: 'text-sky-300',
      border: 'border-sky-500/20',
      badgeBg: 'bg-sky-500/10',
      badgeText: 'text-sky-300',
      domain: 'AndroSense Explainable AI (XAI)',
      subtext:
        'Phase 7 will deliver clinical SHAP factor contribution maps, illustrating how morning testosterone diurnal levels, fatigue scores, and metabolic markers synthesize.',
    },
    general: {
      accent: 'text-purple-300',
      border: 'border-purple-500/20',
      badgeBg: 'bg-purple-500/10',
      badgeText: 'text-purple-300',
      domain: 'VITASense Clinical Intelligence (XAI)',
      subtext:
        'Phase 7 will deliver multi-modal biomarker synthesis, correlating sleep metrics, metabolic health, and preventive longevity patterns.',
    },
  }[pathway];

  return (
    <div
      className={`p-6 sm:p-7 rounded-[32px] bg-gradient-to-br from-[#180A26] via-[#120520] to-[#0A0213] border ${pathwayConfig.border} shadow-xl text-left relative overflow-hidden text-white select-none`}
      id="xai-insights-architecture-slot"
    >
      {/* Volumetric glow */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-br from-[#8E3EAF]/15 to-[#FB7185]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-white shrink-0">
              <Brain className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#CDBDD8] font-bold">
                  Phase 7 Architecture
                </span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${pathwayConfig.badgeBg} ${pathwayConfig.badgeText} font-bold border border-white/10`}>
                  Coming Next
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold font-display text-white">
                {pathwayConfig.domain}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-[#CDBDD8] font-mono self-start sm:self-auto bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
            <Cpu className="w-3.5 h-3.5 text-emerald-400" />
            <span>MedGemma & SHAP Pipeline</span>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-[#CDBDD8] font-sans leading-relaxed max-w-3xl">
          {pathwayConfig.subtext}
        </p>

        {/* Feature Preview Skeleton Slots */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
          <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/[0.08] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-[#FDA4AF] font-bold">
                Feature Influence (SHAP)
              </span>
              <Sparkles className="w-3.5 h-3.5 text-[#FDA4AF]/60" />
            </div>
            <p className="text-[11px] text-[#A898B6] font-sans">
              Dynamic percentage ranking of clinical biomarkers driving your current assessment tier.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/[0.08] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-sky-300 font-bold">
                MedGemma Clinical Narrative
              </span>
              <Sparkles className="w-3.5 h-3.5 text-sky-300/60" />
            </div>
            <p className="text-[11px] text-[#A898B6] font-sans">
              Non-diagnostic, clinician-aligned plain English explanations of complex multi-panel lab correlations.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/[0.08] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-purple-300 font-bold">
                Cost-Aware Gap Reduction
              </span>
              <Sparkles className="w-3.5 h-3.5 text-purple-300/60" />
            </div>
            <p className="text-[11px] text-[#A898B6] font-sans">
              Prioritizes the lowest-cost, highest-value missing labs to advance your screening confidence.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
