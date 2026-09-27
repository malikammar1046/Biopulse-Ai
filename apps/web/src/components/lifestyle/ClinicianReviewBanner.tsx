import React, { useState } from 'react';
import { Stethoscope, ChevronRight, X, Info } from 'lucide-react';
import type { ClinicianReviewSummary } from '../../types/lifestyle';

interface ClinicianReviewBannerProps {
  clinicianReview: ClinicianReviewSummary;
}

export const ClinicianReviewBanner: React.FC<ClinicianReviewBannerProps> = ({
  clinicianReview,
}) => {
  const [showDetailModal, setShowDetailModal] = useState(false);

  if (!clinicianReview?.recommended) {
    return null;
  }

  return (
    <>
      <aside
        aria-label="Clinical review notice"
        className="rounded-2xl bg-amber-50/90 border border-amber-200/90 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs"
      >
        <div className="flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
            <Stethoscope className="w-5 h-5" />
          </div>
          <div className="space-y-0.5">
            <h3 className="text-sm font-bold text-amber-950">
              Clinical review suggested
            </h3>
            <p className="text-xs sm:text-sm text-amber-900 leading-relaxed">
              One of your recorded health values or metabolic indicators may benefit from professional review.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowDetailModal(true)}
          className="shrink-0 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-amber-800 hover:bg-amber-900 text-white text-xs font-semibold transition-colors cursor-pointer"
        >
          <span>See why</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </aside>

      {/* Calm Clinical Detail Modal */}
      {showDetailModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn"
          role="dialog"
          aria-modal="true"
          aria-labelledby="clinician-review-modal-title"
        >
          <div className="w-full max-w-lg bg-white rounded-3xl border border-[#D7EAF2] p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#D7EAF2] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                  <Stethoscope className="w-4 h-4" />
                </div>
                <h4 id="clinician-review-modal-title" className="text-base font-bold text-[#073B72]">
                  Clinical Review Recommendation
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setShowDetailModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-[#F5FBFD] border border-[#D7EAF2] text-xs sm:text-sm text-slate-700 leading-relaxed space-y-2">
              <strong className="block text-xs font-bold uppercase tracking-wider text-[#073B72]">
                Observation Summary
              </strong>
              <p>
                {clinicianReview.reason ||
                  'One or more recorded biomarker values or risk indicators warrant professional clinical evaluation by an endocrinologist or physician.'}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50 text-xs text-amber-900 leading-relaxed flex items-start gap-2">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                BioPulse provides educational lifestyle support and is not a medical diagnostic device.
                Always consult your healthcare provider before modifying prescribed medical therapies.
              </span>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 rounded-xl bg-[#073B72] text-white text-xs font-semibold hover:bg-[#0B4A8B] transition-colors cursor-pointer"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
