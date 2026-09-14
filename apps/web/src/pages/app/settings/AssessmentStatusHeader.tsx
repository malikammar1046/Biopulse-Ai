import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { useUserHealth } from '../../../context/UserHealthContext';
import { getRiskPatternDisplay } from '../../../services/intelligenceService';

interface AssessmentStatusHeaderProps {
  isMale: boolean;
  onRefreshSuccess?: () => void;
}

export const AssessmentStatusHeader: React.FC<AssessmentStatusHeaderProps> = ({
  isMale,
  onRefreshSuccess,
}) => {
  const { activeAssessment, assessmentLoading, submitTier1, userProfile } = useUserHealth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshNotice, setRefreshNotice] = useState<string | null>(null);

  // Check if profile was updated after the last assessment
  const isStale = React.useMemo(() => {
    if (!activeAssessment || !userProfile?.updatedAt) return false;
    try {
      const profileTime = new Date(userProfile.updatedAt).getTime();
      const assessmentTime = new Date(
        activeAssessment.created_at || (activeAssessment as any).timestamp || 0
      ).getTime();
      return profileTime > assessmentTime + 10000; // 10 second buffer
    } catch {
      return false;
    }
  }, [activeAssessment, userProfile?.updatedAt]);

  const handleRefresh = async () => {
    if (isRefreshing || assessmentLoading) return;
    setIsRefreshing(true);
    setRefreshNotice(null);
    try {
      const res = await submitTier1();
      if (res) {
        setRefreshNotice('Screening result refreshed successfully.');
        if (onRefreshSuccess) onRefreshSuccess();
        setTimeout(() => setRefreshNotice(null), 4000);
      } else {
        setRefreshNotice('Could not refresh assessment. Please verify your connection.');
      }
    } catch (err: any) {
      setRefreshNotice(err?.message || 'Error triggering reassessment.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const riskPattern = getRiskPatternDisplay(
    activeAssessment?.risk_category || (activeAssessment as any)?.risk_pattern,
    activeAssessment?.risk_label
  );

  const probabilityDisplay =
    activeAssessment?.probability_percent !== undefined && activeAssessment?.probability_percent !== null
      ? `${activeAssessment.probability_percent}%`
      : activeAssessment?.probability !== undefined && activeAssessment?.probability !== null
      ? `${Math.round(activeAssessment.probability * 100)}%`
      : null;

  const formattedDate = React.useMemo(() => {
    const rawDate = activeAssessment?.created_at || (activeAssessment as any)?.timestamp;
    if (!rawDate) return 'Not yet assessed';
    try {
      return new Date(rawDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return 'Recent';
    }
  }, [activeAssessment]);

  return (
    <div
      className={`rounded-2xl p-5 border transition-all ${
        isStale
          ? 'bg-amber-50/70 border-amber-200/80 shadow-sm'
          : isMale
          ? 'bg-gradient-to-r from-teal-50/80 via-cyan-50/50 to-white border-teal-200/80 shadow-xs'
          : 'bg-gradient-to-r from-teal-50/80 via-rose-50/30 to-white border-teal-200/80 shadow-xs'
      }`}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Status & Context */}
        <div className="flex items-start gap-3.5">
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
              isStale
                ? 'bg-amber-100 text-amber-600'
                : 'bg-[#0E9EAA] text-white'
            }`}
          >
            {isStale ? (
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            ) : (
              <Activity className="w-5 h-5 text-white" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-slate-800">
                {isMale ? 'Male Hypogonadism Screening' : 'PCOS Risk Screening'}
              </h3>

              {activeAssessment ? (
                <div className="flex items-center gap-1.5">
                  <span
                    className="px-3 py-1 rounded-full text-xs font-bold border shadow-2xs"
                    style={{
                      backgroundColor: `${riskPattern.color}18`,
                      color: riskPattern.color,
                      borderColor: `${riskPattern.color}40`,
                    }}
                  >
                    {activeAssessment.risk_label || riskPattern.label}
                  </span>
                  {probabilityDisplay && (
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                      {probabilityDisplay} Probability
                    </span>
                  )}
                </div>
              ) : (
                <span className="px-3 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                  Intake Pending
                </span>
              )}

              {isStale && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                  Result may be outdated
                </span>
              )}
            </div>

            <p className="text-xs text-slate-500 mt-1">
              {isStale ? (
                <span>
                  Your health profile was updated after your last assessment. Refresh to recalculate risk estimates with current data.
                </span>
              ) : activeAssessment ? (
                <span>
                  Last evaluated: <strong className="text-slate-700">{formattedDate}</strong> • Protocol: <strong className="text-slate-700">{activeAssessment.assessment_level === 'tier_1_2' ? 'Tier 2 Clinical' : activeAssessment.assessment_level === 'tier_1_2_3' ? 'Tier 3 Multimodal' : 'Tier 1 Baseline'}</strong> • Source data: Synchronized
                </span>
              ) : (
                <span>
                  Save your baseline health information to generate an automated screening assessment.
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Right: Refresh Action */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing || assessmentLoading}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white transition-all shadow-sm ${
              isStale
                ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20'
                : 'bg-[#0E9EAA] hover:bg-[#0C8B96] shadow-[#0E9EAA]/25'
            } disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer`}
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-white ${isRefreshing || assessmentLoading ? 'animate-spin' : ''}`}
            />
            <span className="text-white">
              {isRefreshing || assessmentLoading ? 'Evaluating...' : isStale ? 'Refresh Screening' : 'Recalculate Result'}
            </span>
          </button>
        </div>
      </div>

      {refreshNotice && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg flex items-center gap-2"
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>{refreshNotice}</span>
        </motion.div>
      )}
    </div>
  );
};
