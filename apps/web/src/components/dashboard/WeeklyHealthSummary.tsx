import React, { useState } from 'react';
import { Sparkles, FileDown, CheckCircle2 } from 'lucide-react';
import { useUserHealth } from '../../context/UserHealthContext';

export const WeeklyHealthSummary: React.FC = () => {
  const { userProfile, snapshotMetrics, careCircle } = useUserHealth();
  const [downloading, setDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

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

  return (
    <div className="p-6 sm:p-8 rounded-[36px] bg-gradient-to-r from-[#180A26] via-[#12071F] to-[#1C0D2E] text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-white/15 select-none text-left relative overflow-hidden">
      {/* Background Volumetric Light */}
      <div className="absolute top-0 right-1/4 w-80 h-80 bg-[#6E2D8B]/30 rounded-full blur-3xl pointer-events-none" />

      {/* Left Column: Summary Stats */}
      <div className="space-y-4 relative z-10 max-w-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs font-mono font-bold text-[#FDA4AF] mb-1">
            <Sparkles className="w-3.5 h-3.5 text-[#FB7185]" />
            <span>Executive Health Brief</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold font-display text-white">
            Your Week in OvaSense
          </h3>
          <p className="text-xs text-[#CDBDD8] font-sans">
            A continuous, longitudinal summary ready to share with your gynecologist or endocrinologist.
          </p>
        </div>

        {/* Highlight Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          <div className="p-3 rounded-2xl bg-white/[0.05] border border-white/10">
            <span className="text-[10px] font-mono text-[#A797BD] uppercase block">Cycle Phase</span>
            <span className="text-sm font-bold text-white font-display truncate block">
              Day {snapshotMetrics.cycleDay} • {snapshotMetrics.phaseName.replace(' Phase', '')}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-white/[0.05] border border-white/10">
            <span className="text-[10px] font-mono text-[#A797BD] uppercase block">Logged Symptoms</span>
            <span className="text-sm font-bold text-[#FB7185] font-display">
              {symptomsCount} {symptomsCount === 1 ? 'Entry' : 'Entries'}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-white/[0.05] border border-white/10">
            <span className="text-[10px] font-mono text-[#A797BD] uppercase block">Hydration Goal</span>
            <span className="text-sm font-bold text-[#34D399] font-display">
              {((userProfile.lifestyle?.dailyWaterGlasses || 8) * 0.25).toFixed(1)}L / day
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-white/[0.05] border border-white/10">
            <span className="text-[10px] font-mono text-[#A797BD] uppercase block">Average Sleep</span>
            <span className="text-sm font-bold text-[#C084FC] font-display">
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
          className="w-full md:w-auto px-6 py-3.5 rounded-2xl font-sans font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-[#6E2D8B] via-[#8E3EAF] to-[#E87084] hover:brightness-110 shadow-xl shadow-purple-950/50 transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-75"
        >
          {downloading ? (
            <>
              <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              <span>Generating Clinical Summary...</span>
            </>
          ) : downloadSuccess ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-[#34D399]" />
              <span>Summary Downloaded ✓</span>
            </>
          ) : (
            <>
              <FileDown className="w-4 h-4" />
              <span>Export Clinician Summary PDF</span>
            </>
          )}
        </button>

        <span className="text-[10px] font-mono text-[#A797BD] text-center md:text-right block mt-2">
          {doctor ? `Prepared for ${doctor.name}` : 'Prepared for Clinical Consultation'}
        </span>
      </div>
    </div>
  );
};
