import React, { useState } from 'react';
import { Sparkles, FileDown, CheckCircle2 } from 'lucide-react';
import { useUserHealth } from '../../context/UserHealthContext';
import { resolvePathway, type HealthPathway } from '../../types/onboarding';

interface WeeklyHealthSummaryProps {
  pathway?: HealthPathway;
}

export const WeeklyHealthSummary: React.FC<WeeklyHealthSummaryProps> = ({
  pathway: pathwayProp,
}) => {
  const { userProfile, snapshotMetrics, careCircle, activeAssessment } = useUserHealth();
  const [downloading, setDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const activePathway = pathwayProp || resolvePathway(userProfile.gender, userProfile.pathway);
  const isMale = activePathway === 'male';
  const isFemale = activePathway === 'female';

  const doctor = careCircle.find((c) => c.role === 'doctor');
  const sleepHours = userProfile.lifestyle?.sleepHours || 7.5;
  const symptomsCount = snapshotMetrics.symptomsCountToday;

  const handleExportSummary = () => {
    setDownloading(true);
    setTimeout(() => {
      setDownloading(false);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);
    }, 1200);
  };

  const title = isFemale
    ? 'Your Week in OvaSense'
    : isMale
    ? 'Your Week in BIOPulse AI'
    : 'Your Week in BIOPulse AI';

  const subtitle = isFemale
    ? 'A continuous, longitudinal summary ready to share with your gynecologist or endocrinologist.'
    : isMale
    ? "A continuous, longitudinal summary ready to share with your endocrinologist or men's health specialist."
    : 'A continuous, longitudinal summary ready to share with your healthcare provider or specialist.';

  return (
    <div className="p-6 sm:p-8 rounded-[28px] bg-white border border-[#E2E8F0] text-[#0F172A] shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden select-none text-left">
      {/* Left Column: Summary Stats */}
      <div className="relative z-10 space-y-4 max-w-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E0F2FE] border border-[#BAE6FD] text-xs font-mono font-bold text-[#0288D1] mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Executive Health Brief</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold font-display text-[#0F172A]">
            {title}
          </h3>
          <p className="text-xs text-[#64748B] font-sans">
            {subtitle}
          </p>
        </div>

        {/* Highlight Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          <div className="p-3 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]">
            <span className="text-[10px] font-mono text-[#64748B] uppercase block">
              {isFemale ? 'Cycle Phase' : isMale ? 'Screening Tier' : 'Health Baseline'}
            </span>
            <span className="text-xs font-bold text-[#0F172A] font-mono truncate block mt-0.5">
              {isFemale
                ? `Day ${snapshotMetrics.cycleDay} • ${snapshotMetrics.phaseName.replace(' Phase', '')}`
                : isMale
                ? `${activeAssessment?.assessment_level === 'tier_1_2' ? 'Tier 2' : 'Tier 1'} • Active`
                : 'Active Monitoring'}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]">
            <span className="text-[10px] font-mono text-[#64748B] uppercase block">Logged Symptoms</span>
            <span className="text-xs font-bold text-[#0288D1] font-mono mt-0.5 block">
              {symptomsCount} {symptomsCount === 1 ? 'Entry' : 'Entries'}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]">
            <span className="text-[10px] font-mono text-[#64748B] uppercase block">Hydration Goal</span>
            <span className="text-xs font-bold text-[#0288D1] font-mono mt-0.5 block">
              {((userProfile.lifestyle?.dailyWaterGlasses || 8) * 0.25).toFixed(1)}L / day
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]">
            <span className="text-[10px] font-mono text-[#64748B] uppercase block">Average Sleep</span>
            <span className="text-xs font-bold text-emerald-700 font-mono mt-0.5 block">
              {sleepHours}h / night
            </span>
          </div>
        </div>
      </div>

      {/* Right Column: PDF Export Action */}
      <div className="relative z-10 shrink-0 w-full md:w-auto">
        <button
          type="button"
          onClick={handleExportSummary}
          disabled={downloading}
          className="w-full md:w-auto px-6 py-3.5 rounded-2xl font-sans font-bold text-xs text-white bg-[#0288D1] hover:bg-[#0277BD] shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
        >
          {downloading ? (
            <>
              <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              <span>Generating Clinical Summary...</span>
            </>
          ) : downloadSuccess ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-white" />
              <span>Summary Downloaded ✓</span>
            </>
          ) : (
            <>
              <FileDown className="w-4 h-4" />
              <span>Export Clinician Summary PDF</span>
            </>
          )}
        </button>

        <span className="text-[10px] font-mono text-[#64748B] text-center md:text-right block mt-2">
          {doctor ? `Prepared for ${doctor.name}` : 'Prepared for Clinical Consultation'}
        </span>
      </div>
    </div>
  );
};
