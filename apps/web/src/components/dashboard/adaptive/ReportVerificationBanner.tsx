import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, ArrowRight, FileCheck2 } from 'lucide-react';
import type { MedicalReport } from '../../../types/report';
import { ROUTES } from '../../../constants/routes';

interface ReportVerificationBannerProps {
  reports: MedicalReport[];
}

export const ReportVerificationBanner: React.FC<ReportVerificationBannerProps> = ({
  reports,
}) => {
  const pendingReports = reports.filter(
    (r) => r.status === 'needs_verification' || r.results?.some((res) => !res.userVerified)
  );

  if (pendingReports.length === 0) {
    return null;
  }

  const count = pendingReports.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.3 }}
      className="w-full p-4 sm:p-5 rounded-[28px] bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-rose-500/10 border-2 border-amber-400/40 shadow-sm text-left flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden"
      id="report-verification-banner"
    >
      {/* Volumetric accent glow */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />

      <div className="flex items-start sm:items-center gap-3.5 min-w-0">
        <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-700 flex items-center justify-center shrink-0 border border-amber-500/30">
          <Clock className="w-5 h-5 animate-pulse" />
        </div>

        <div className="space-y-0.5 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-800 border border-amber-500/30">
              Awaiting Verification
            </span>
            <span className="text-xs font-bold font-display text-amber-950 truncate">
              {count} Medical Report{count === 1 ? '' : 's'} Extracted by OCR
            </span>
          </div>
          <p className="text-xs text-amber-900/80 font-sans leading-relaxed">
            Biomarkers are quarantined. Confirmed values will unlock Tier 2/3 screening and update your trusted health profile.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto">
        <Link
          to={ROUTES.APP.REPORTS}
          className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold font-sans transition-all flex items-center gap-1.5 shadow-sm hover:shadow cursor-pointer"
        >
          <FileCheck2 className="w-4 h-4" />
          <span>Review & Verify</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </motion.div>
  );
};
