import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, CheckCircle2, FlaskConical, FileWarning, AlertCircle } from 'lucide-react';
import type { HealthPathway } from '../../types/onboarding';
import type { DashboardAction } from '../../utils/dashboardActions';
import { ROUTES } from '../../constants/routes';

interface NextBestActionCardProps {
  pathway: HealthPathway;
  hasAssessment: boolean;
  assessmentLevel?: string;
  unverifiedReportsCount?: number;
  topAction?: DashboardAction | null;
  onOpenLabsModal?: () => void;
}

export const NextBestActionCard: React.FC<NextBestActionCardProps> = ({
  pathway,
  hasAssessment,
  assessmentLevel = 'tier_1',
  unverifiedReportsCount = 0,
  topAction,
  onOpenLabsModal,
}) => {
  const isMale = pathway === 'male';

  // ── 1. Priority A: Unverified Lab Reports ──────────────────────────────────
  if (unverifiedReportsCount > 0) {
    return (
      <div className="p-5 sm:p-6 rounded-[24px] bg-white border border-[#E2E8F0] shadow-sm flex flex-col justify-between text-left space-y-4 select-none">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
              <FileWarning className="w-4 h-4" />
            </span>
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-800">
              Recommended Next Step
            </span>
          </div>

          <h3 className="text-base font-bold text-[#0F172A]">
            Review & Verify Lab Results
          </h3>
          <p className="text-xs text-[#475569] leading-relaxed">
            You have {unverifiedReportsCount} unconfirmed lab {unverifiedReportsCount === 1 ? 'result' : 'results'} from recent uploads. Reviewing and confirming these values ensures accurate screening.
          </p>
        </div>

        <div className="pt-2 border-t border-[#E2E8F0]">
          <Link
            to={ROUTES.APP.REPORTS}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0288D1] hover:bg-[#0277BD] text-white text-xs font-bold shadow-sm transition-all"
          >
            <span>Review Reports</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    );
  }

  // ── 2. Priority B: No Assessment Completed Yet ─────────────────────────────
  if (!hasAssessment) {
    return (
      <div className="p-5 sm:p-6 rounded-[24px] bg-white border border-[#E2E8F0] shadow-sm flex flex-col justify-between text-left space-y-4 select-none">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[#E0F2FE] text-[#0288D1] border border-[#BAE6FD]">
              <Sparkles className="w-4 h-4" />
            </span>
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#0288D1]">
              Recommended Next Step
            </span>
          </div>

          <h3 className="text-base font-bold text-[#0F172A]">
            Complete Initial Screening
          </h3>
          <p className="text-xs text-[#475569] leading-relaxed">
            Answer your preliminary health and lifestyle questions to establish your baseline screening risk score.
          </p>
        </div>

        <div className="pt-2 border-t border-[#E2E8F0]">
          <Link
            to={ROUTES.APP.ASSESSMENT}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0288D1] hover:bg-[#0277BD] text-white text-xs font-bold shadow-sm transition-all"
          >
            <span>Start Screening</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    );
  }

  // ── 3. Priority C: Tier 1 Complete, Tier 2 Missing ──────────────────────────
  const isTier1Only = assessmentLevel === 'tier_1';

  if (isTier1Only) {
    if (isMale) {
      return (
        <div className="p-5 sm:p-6 rounded-[24px] bg-white border border-[#E2E8F0] shadow-sm flex flex-col justify-between text-left space-y-4 select-none">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-[#E0F2FE] text-[#0288D1] border border-[#BAE6FD]">
                <FlaskConical className="w-4 h-4" />
              </span>
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#0288D1]">
                Recommended Next Step
              </span>
            </div>

            <h3 className="text-base font-bold text-[#0F172A]">
              Add Hormone Lab Results
            </h3>
            <p className="text-xs text-[#475569] leading-relaxed">
              If available, adding your morning total testosterone and related lab values refines your screening to Tier 2.
            </p>
          </div>

          <div className="pt-2 border-t border-[#E2E8F0]">
            {onOpenLabsModal ? (
              <button
                type="button"
                onClick={onOpenLabsModal}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0288D1] hover:bg-[#0277BD] text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
              >
                <span>Add Hormone Results</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <Link
                to={ROUTES.APP.ASSESSMENT}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0288D1] hover:bg-[#0277BD] text-white text-xs font-bold shadow-sm transition-all"
              >
                <span>Add Hormone Results</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>
      );
    }

    // Female: Add Clinical Labs (LH/FSH/Glucose)
    return (
      <div className="p-5 sm:p-6 rounded-[24px] bg-white border border-[#E2E8F0] shadow-sm flex flex-col justify-between text-left space-y-4 select-none">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[#E0F2FE] text-[#0288D1] border border-[#BAE6FD]">
              <FlaskConical className="w-4 h-4" />
            </span>
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#0288D1]">
              Recommended Next Step
            </span>
          </div>

          <h3 className="text-base font-bold text-[#0F172A]">
            Add Clinical Lab Values
          </h3>
          <p className="text-xs text-[#475569] leading-relaxed">
            Adding available blood panels (such as LH, FSH, or fasting glucose) refines your screening assessment to Tier 2.
          </p>
        </div>

        <div className="pt-2 border-t border-[#E2E8F0]">
          <Link
            to={ROUTES.APP.ASSESSMENT}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0288D1] hover:bg-[#0277BD] text-white text-xs font-bold shadow-sm transition-all"
          >
            <span>Add Lab Results</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    );
  }

  // ── 4. Priority D: Critical/High Action from Action Engine ──────────────────
  if (topAction && topAction.priority === 'critical') {
    return (
      <div className="p-5 sm:p-6 rounded-[24px] bg-white border border-[#E2E8F0] shadow-sm flex flex-col justify-between text-left space-y-4 select-none">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200">
              <AlertCircle className="w-4 h-4" />
            </span>
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-rose-700">
              Recommended Next Step
            </span>
          </div>

          <h3 className="text-base font-bold text-[#0F172A]">
            {topAction.title}
          </h3>
          <p className="text-xs text-[#475569] leading-relaxed">
            {topAction.description}
          </p>
        </div>

        <div className="pt-2 border-t border-[#E2E8F0]">
          <Link
            to={topAction.route || ROUTES.APP.SETTINGS}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0288D1] hover:bg-[#0277BD] text-white text-xs font-bold shadow-sm transition-all"
          >
            <span>{topAction.actionLabel}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    );
  }

  // ── 5. Default / Completed State: Screening is Up to Date ──────────────────
  return (
    <div className="p-5 sm:p-6 rounded-[24px] bg-white border border-[#E2E8F0] shadow-sm flex flex-col justify-between text-left space-y-4 select-none">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-4 h-4" />
          </span>
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-800">
            Screening Status
          </span>
        </div>

        <h3 className="text-base font-bold text-[#0F172A]">
          Your Screening is Up to Date
        </h3>
        <p className="text-xs text-[#475569] leading-relaxed">
          Your current screening information is actively synthesized. View your longitudinal trends and progress.
        </p>
      </div>

      <div className="pt-2 border-t border-[#E2E8F0]">
        <Link
          to={ROUTES.APP.PROGRESS}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-[#CBD5E1] text-[#0F172A] text-xs font-semibold shadow-xs transition-all"
        >
          <span>View Progress</span>
          <ArrowRight className="w-3.5 h-3.5 text-[#0288D1]" />
        </Link>
      </div>
    </div>
  );
};

export default NextBestActionCard;
