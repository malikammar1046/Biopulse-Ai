import React from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  ShieldTick,
  LayersThree01,
  File06,
  Heart,
  Calendar,
  InfoCircle,
} from '@untitledui/icons';
import type { HealthPathway, UserProfile } from '../../types/onboarding';
import { ROUTES } from '../../constants/routes';
import { formatClinicalDate } from '../../utils/longitudinalCalculations';

interface EmptyBaselineStateProps {
  pathway: HealthPathway;
  userProfile?: UserProfile | null;
  activeAssessment?: any;
  symptomCount?: number;
  reportCount?: number;
  cycleCount?: number;
}

export const EmptyBaselineState: React.FC<EmptyBaselineStateProps> = ({
  pathway,
  userProfile,
  activeAssessment,
  symptomCount = 0,
  reportCount = 0,
  cycleCount = 0,
}) => {
  const isMale = pathway === 'male';
  const assessmentRoute = isMale ? ROUTES.APP.ANDROSENSE : ROUTES.APP.OVASENSE;

  const weightKg = userProfile?.weightKg ?? null;
  const heightCm = userProfile?.heightCm ?? null;
  const bmi =
    weightKg && heightCm
      ? Math.round((weightKg / Math.pow(heightCm / 100, 2)) * 10) / 10
      : null;

  const hasAssessment = Boolean(activeAssessment && (activeAssessment.has_assessment || activeAssessment.probability !== undefined));
  const rawDate = (userProfile as any)?.createdAt || (userProfile as any)?.created_at;
  const trackingDate = rawDate ? formatClinicalDate(rawDate) : 'Today';

  return (
    <div className="bg-white border border-[#EAECF0] rounded-[24px] p-6 sm:p-10 text-left shadow-xs select-none max-w-4xl mx-auto space-y-8">
      {/* ── 1. Header & Vision Copy ── */}
      <div className="text-center max-w-xl mx-auto space-y-3">
        <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center bg-[#F8F9FC] border border-[#EAECF0]">
          <Activity
            className={`w-7 h-7 ${isMale ? 'text-[#0288D1]' : 'text-[#F43F7D]'}`}
            aria-hidden="true"
          />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-2xl sm:text-3xl font-bold font-display text-[#111318]">
            Your health timeline starts here.
          </h2>
          <p className="text-xs sm:text-sm text-[#667085] leading-relaxed">
            BioPulse will show changes in your screening results, symptoms, measurements and other health records as you add information over time.
          </p>
        </div>
      </div>

      {/* ── 2. Baseline Record Status Card ── */}
      <div className="rounded-2xl bg-[#FAFAFC] border border-[#EAECF0] p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-[#F2F4F7] pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[#475467]">
              Current Recorded Baseline
            </span>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs font-mono text-[#667085]">
            <Calendar className="w-3.5 h-3.5 text-[#98A2B3]" aria-hidden="true" />
            <span>Tracking started {trackingDate}</span>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Pathway */}
          <div className="p-3.5 rounded-xl bg-white border border-[#EAECF0] space-y-1">
            <span className="text-[11px] font-mono text-[#667085]">Active Pathway</span>
            <p className="text-sm font-semibold text-[#111318]">
              {isMale ? 'AndroSense (Male Vitality)' : 'OvaSense (Female PCOS)'}
            </p>
          </div>

          {/* Screening Status */}
          <div className="p-3.5 rounded-xl bg-white border border-[#EAECF0] space-y-1">
            <span className="text-[11px] font-mono text-[#667085]">Screening Baseline</span>
            <p className="text-sm font-semibold text-[#111318]">
              {hasAssessment
                ? `${Math.round((activeAssessment.probability ?? 0.2) * 100)}% (${activeAssessment.risk_label || 'Established'})`
                : 'Not completed yet'}
            </p>
          </div>

          {/* Anthropometrics */}
          <div className="p-3.5 rounded-xl bg-white border border-[#EAECF0] space-y-1">
            <span className="text-[11px] font-mono text-[#667085]">Recorded Measurements</span>
            <p className="text-sm font-semibold text-[#111318]">
              {bmi !== null ? `BMI ${bmi} kg/m²` : 'None logged'}
              {weightKg ? ` • ${weightKg} kg` : ''}
            </p>
          </div>

          {/* Symptoms count */}
          <div className="p-3.5 rounded-xl bg-white border border-[#EAECF0] space-y-1">
            <span className="text-[11px] font-mono text-[#667085]">Active Symptoms</span>
            <p className="text-sm font-semibold text-[#111318]">
              {symptomCount > 0 ? `${symptomCount} logged` : '0 recorded'}
            </p>
          </div>

          {/* Reports / Labs */}
          <div className="p-3.5 rounded-xl bg-white border border-[#EAECF0] space-y-1">
            <span className="text-[11px] font-mono text-[#667085]">Clinical Lab Reports</span>
            <p className="text-sm font-semibold text-[#111318]">
              {reportCount > 0 ? `${reportCount} report${reportCount > 1 ? 's' : ''}` : '0 uploaded'}
            </p>
          </div>

          {/* Reproductive / Endocrine */}
          <div className="p-3.5 rounded-xl bg-white border border-[#EAECF0] space-y-1">
            <span className="text-[11px] font-mono text-[#667085]">
              {isMale ? 'Hormonal Labs' : 'Cycle Entries'}
            </span>
            <p className="text-sm font-semibold text-[#111318]">
              {isMale
                ? userProfile?.mensHealth?.testosteroneValue
                  ? `${userProfile.mensHealth.testosteroneValue} ${userProfile.mensHealth.testosteroneUnit || 'ng/dL'}`
                  : 'Pending'
                : cycleCount > 0
                ? `${cycleCount} cycles`
                : userProfile?.womensHealth?.periodRegularity
                ? userProfile.womensHealth.periodRegularity.replace('_', ' ')
                : 'Pending'}
            </p>
          </div>
        </div>

        <div className="pt-2 text-center sm:text-left text-xs font-medium text-[#475467] flex items-center gap-1.5">
          <InfoCircle className="w-3.5 h-3.5 text-[#0288D1]" aria-hidden="true" />
          <span>More trends and trajectories will appear automatically as you add new records.</span>
        </div>
      </div>

      {/* ── 3. Meaningful Actions to Build Timeline ── */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold font-display text-[#111318]">
          Ways to build your health timeline:
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Action 1: Screening */}
          <Link
            to={assessmentRoute}
            className="p-4 rounded-xl border border-[#EAECF0] bg-white hover:border-[#D0D5DD] hover:shadow-xs transition-all flex flex-col justify-between group active:scale-[0.99]"
          >
            <div className="space-y-2">
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                  isMale ? 'bg-[#F0F9FF] text-[#0288D1]' : 'bg-[#FDE6EF] text-[#F43F7D]'
                }`}
              >
                <LayersThree01 className="w-4 h-4" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#111318]">
                  {hasAssessment ? 'Review Screening' : 'Complete Screening'}
                </p>
                <p className="text-xs text-[#667085] mt-0.5 leading-relaxed">
                  {hasAssessment
                    ? 'Take a follow-up assessment to compare progression.'
                    : 'Establish your clinical likelihood baseline.'}
                </p>
              </div>
            </div>
            <div
              className={`mt-3 inline-flex items-center gap-1 text-xs font-semibold ${
                isMale ? 'text-[#0288D1]' : 'text-[#F43F7D]'
              }`}
            >
              <span>{hasAssessment ? 'Go to assessment' : 'Start now'}</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
            </div>
          </Link>

          {/* Action 2: Add Report */}
          <Link
            to={ROUTES.APP.REPORTS}
            className="p-4 rounded-xl border border-[#EAECF0] bg-white hover:border-[#D0D5DD] hover:shadow-xs transition-all flex flex-col justify-between group active:scale-[0.99]"
          >
            <div className="space-y-2">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-[#F8F9FC] text-[#073B72]">
                <File06 className="w-4 h-4" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#111318]">Upload Lab Report</p>
                <p className="text-xs text-[#667085] mt-0.5 leading-relaxed">
                  Extract verified biomarkers (e.g. testosterone, glucose, LH/FSH) into trends.
                </p>
              </div>
            </div>
            <div className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#073B72]">
              <span>Upload report</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
            </div>
          </Link>

          {/* Action 3: Log Symptoms */}
          <Link
            to={ROUTES.APP.SYMPTOMS}
            className="p-4 rounded-xl border border-[#EAECF0] bg-white hover:border-[#D0D5DD] hover:shadow-xs transition-all flex flex-col justify-between group active:scale-[0.99]"
          >
            <div className="space-y-2">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-[#F8F9FC] text-[#0E9EAA]">
                <Heart className="w-4 h-4" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#111318]">Log Symptoms</p>
                <p className="text-xs text-[#667085] mt-0.5 leading-relaxed">
                  Track recurring symptom burden, severity shifts, and vitality scores over time.
                </p>
              </div>
            </div>
            <div className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#0E9EAA]">
              <span>Track symptoms</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
            </div>
          </Link>
        </div>
      </div>

      {/* ── 4. Privacy Footer ── */}
      <div className="pt-4 border-t border-[#F2F4F7] flex items-center justify-center gap-2 text-xs text-[#667085]">
        <ShieldTick className="w-4 h-4 text-[#16A36A]" aria-hidden="true" />
        <span>Clinical data strictly encrypted and isolated to your authenticated account</span>
      </div>
    </div>
  );
};

export default EmptyBaselineState;
