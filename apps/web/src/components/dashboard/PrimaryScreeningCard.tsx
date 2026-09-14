import React from 'react';
import { ArrowRight, Check, Activity, Layers } from 'lucide-react';
import type { HealthPathway } from '../../types/onboarding';
import { SemicircularRiskGauge } from './SemicircularRiskGauge';

interface PrimaryScreeningCardProps {
  pathway: HealthPathway;
  hasAssessment: boolean;
  probabilityPercent: number | null;
  riskCategory?: string;
  riskLabel?: string;
  assessmentLevel?: string;
  updatedAt?: string | null;
  threshold?: number;
  onStartScreening: () => void;
  onViewAssessment: () => void;
  onSecondaryAction?: () => void;
  secondaryActionLabel?: string;
  loading?: boolean;
}

export const PrimaryScreeningCard: React.FC<PrimaryScreeningCardProps> = ({
  pathway,
  hasAssessment,
  probabilityPercent,
  riskCategory = 'lower',
  assessmentLevel = 'tier_1',
  updatedAt,
  threshold,
  onStartScreening,
  onViewAssessment,
  onSecondaryAction,
  secondaryActionLabel,
  loading = false,
}) => {
  const isMale = pathway === 'male';
  const title = isMale ? 'Hypogonadism Screening' : 'PCOS Screening';

  // Format Tier metadata
  const getTierLabel = () => {
    if (isMale) {
      if (assessmentLevel === 'tier_1_2') return 'Based on Tier 1 + Clinical Labs';
      return 'Based on Tier 1 assessment';
    }
    if (assessmentLevel === 'tier_1_2_3') return 'Based on Tier 3 Multimodal assessment';
    if (assessmentLevel === 'tier_1_2') return 'Based on Tier 2 Clinical assessment';
    return 'Based on Tier 1 assessment';
  };

  // Determine stage progression for Female (3 tiers) vs Male (2 tiers)
  const renderTierIndicator = () => {
    if (isMale) {
      const isTier2Done = assessmentLevel === 'tier_1_2';
      return (
        <div className="pt-3 border-t border-[#E2E8F0]">
          <span className="text-[11px] font-semibold text-[#64748B] block mb-2">
            Screening Progress
          </span>
          <div className="flex items-center gap-2 text-xs">
            {/* Tier 1 */}
            <div className="flex items-center gap-1.5 font-medium text-[#0F172A]">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-bold">
                <Check className="w-3 h-3" />
              </span>
              <span>Tier 1: Initial</span>
            </div>

            <div className="flex-1 h-0.5 bg-[#CBD5E1] mx-1" />

            {/* Tier 2 */}
            <div
              className={`flex items-center gap-1.5 font-medium ${
                isTier2Done ? 'text-[#0F172A]' : 'text-[#64748B]'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  isTier2Done
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'border-2 border-[#94A3B8] bg-white text-[#64748B]'
                }`}
              >
                {isTier2Done ? <Check className="w-3 h-3" /> : '2'}
              </span>
              <span>Tier 2: Hormone Labs</span>
            </div>
          </div>
        </div>
      );
    }

    // Female Pathway (3 implemented tiers: Tier 1 self-reported, Tier 2 clinical labs, Tier 3 ultrasound)
    const isTier2Done = assessmentLevel === 'tier_1_2' || assessmentLevel === 'tier_1_2_3';
    const isTier3Done = assessmentLevel === 'tier_1_2_3';

    return (
      <div className="pt-3 border-t border-[#E2E8F0]">
        <span className="text-[11px] font-semibold text-[#64748B] block mb-2">
          Screening Progress
        </span>
        <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs">
          {/* Tier 1 */}
          <div className="flex items-center gap-1.5 font-medium text-[#0F172A]">
            <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-bold shrink-0">
              <Check className="w-3 h-3" />
            </span>
            <span className="truncate">Tier 1: Symptoms</span>
          </div>

          <div className="flex-1 h-0.5 bg-[#CBD5E1] min-w-[12px]" />

          {/* Tier 2 */}
          <div
            className={`flex items-center gap-1.5 font-medium ${
              isTier2Done ? 'text-[#0F172A]' : 'text-[#64748B]'
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                isTier2Done
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'border-2 border-[#94A3B8] bg-white text-[#64748B]'
              }`}
            >
              {isTier2Done ? <Check className="w-3 h-3" /> : '2'}
            </span>
            <span className="truncate">Tier 2: Labs</span>
          </div>

          <div className="flex-1 h-0.5 bg-[#CBD5E1] min-w-[12px]" />

          {/* Tier 3 */}
          <div
            className={`flex items-center gap-1.5 font-medium ${
              isTier3Done ? 'text-[#0F172A]' : 'text-[#64748B]'
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                isTier3Done
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'border-2 border-[#94A3B8] bg-white text-[#64748B]'
              }`}
            >
              {isTier3Done ? <Check className="w-3 h-3" /> : '3'}
            </span>
            <span className="truncate">Tier 3: Ultrasound</span>
          </div>
        </div>
      </div>
    );
  };

  // ---------------------------------------------------------------------------
  // Empty State: No assessment yet
  // ---------------------------------------------------------------------------
  if (!hasAssessment || probabilityPercent === null) {
    return (
      <div className="p-6 sm:p-7 rounded-[24px] bg-white border border-[#E2E8F0] shadow-sm flex flex-col justify-between text-left space-y-6 h-full select-none">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#E0F2FE] border border-[#BAE6FD] flex items-center justify-center text-[#0288D1]">
                <Activity className="w-4 h-4" />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-[#0F172A]">
                {title}
              </h2>
            </div>
            <span className="text-[11px] font-semibold text-[#64748B] px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200">
              Not Started
            </span>
          </div>

          <div className="pt-2 space-y-1.5">
            <h3 className="text-lg font-bold text-[#0F172A]">
              No assessment yet
            </h3>
            <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">
              Complete your first screening to understand your current risk.
            </p>
          </div>
        </div>

        <div className="pt-4 border-t border-[#E2E8F0] space-y-3">
          <button
            type="button"
            onClick={onStartScreening}
            disabled={loading}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#0288D1] hover:bg-[#0277BD] text-white text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <span>Start Screening</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <p className="text-[10px] text-[#64748B] leading-relaxed">
            Evidence-based screening indicator · Does not constitute a medical diagnosis.
          </p>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Active Assessment State with Semicircular Risk Gauge
  // ---------------------------------------------------------------------------
  return (
    <div className="p-6 sm:p-7 rounded-[24px] bg-white border border-[#E2E8F0] shadow-sm flex flex-col justify-between text-left space-y-6 h-full select-none">
      <div className="space-y-4">
        {/* Card Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#E0F2FE] border border-[#BAE6FD] flex items-center justify-center text-[#0288D1]">
              <Activity className="w-4 h-4" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-[#0F172A]">
              {title}
            </h2>
          </div>

          <span className="text-xs font-medium text-[#64748B]">
            {getTierLabel()} {updatedAt ? `· Updated ${updatedAt}` : ''}
          </span>
        </div>

        {/* Semicircular Risk Gauge with Moving Needle & Real Threshold Zones */}
        <div className="py-2 flex justify-center">
          <SemicircularRiskGauge
            probabilityPercent={probabilityPercent}
            riskCategory={riskCategory}
            pathway={pathway}
            threshold={threshold}
            assessmentLevel={assessmentLevel}
          />
        </div>

        {/* Dynamic Tier Progress Bar */}
        {renderTierIndicator()}
      </div>

      {/* Action Buttons & Clinical Non-Diagnostic Disclaimer */}
      <div className="pt-4 border-t border-[#E2E8F0] space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onViewAssessment}
            className="px-5 py-2.5 rounded-xl bg-[#0288D1] hover:bg-[#0277BD] text-white text-xs font-bold shadow-sm transition-all flex items-center gap-2 cursor-pointer"
          >
            <span>View Full Assessment</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          {secondaryActionLabel && onSecondaryAction && (
            <button
              type="button"
              onClick={onSecondaryAction}
              className="px-4 py-2.5 rounded-xl bg-[#F0F9FF] hover:bg-[#E0F2FE] border border-[#BAE6FD] text-[#0288D1] text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{secondaryActionLabel}</span>
            </button>
          )}
        </div>

        <p className="text-[10px] text-[#64748B] leading-relaxed">
          Evidence-based screening indicator · Does not constitute a clinical diagnosis. Consult a qualified physician for evaluation.
        </p>
      </div>
    </div>
  );
};

export default PrimaryScreeningCard;
