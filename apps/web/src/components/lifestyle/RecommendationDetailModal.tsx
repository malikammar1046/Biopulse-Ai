import React, { useEffect, useRef } from 'react';
import {
  X,
  Apple,
  Dumbbell,
  HeartPulse,
  Stethoscope,
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertCircle,
  BookOpen,
} from 'lucide-react';
import type { RecommendationItem, EvidenceMetadata } from '../../types/lifestyle';

interface RecommendationDetailModalProps {
  recommendation: RecommendationItem | null;
  onClose: () => void;
  evidenceRegistry?: Record<string, EvidenceMetadata>;
  isMale?: boolean;
}

export const RecommendationDetailModal: React.FC<RecommendationDetailModalProps> = ({
  recommendation,
  onClose,
  evidenceRegistry,
  isMale = false,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // Keyboard accessibility: Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (recommendation) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [recommendation, onClose]);

  if (!recommendation) return null;

  // Retrieve evidence from backend registry if available
  const evidence: EvidenceMetadata | null =
    recommendation.evidence_id && evidenceRegistry && evidenceRegistry[recommendation.evidence_id]
      ? evidenceRegistry[recommendation.evidence_id]
      : null;

  // Category Icon
  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'nutrition':
        return <Apple className="w-5 h-5 text-[#0E9EAA]" />;
      case 'fitness':
        return <Dumbbell className="w-5 h-5 text-[#0868B9]" />;
      case 'lifestyle':
        return <HeartPulse className="w-5 h-5 text-[#F43F7D]" />;
      case 'clinical':
      default:
        return <Stethoscope className="w-5 h-5 text-[#55718F]" />;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-rec-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-3xl border border-[#D7EAF2] shadow-2xl p-6 sm:p-8 space-y-6"
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-4 border-b border-[#D7EAF2] pb-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#F5FBFD] border border-[#D7EAF2] text-xs font-semibold text-[#073B72] capitalize">
                {getCategoryIcon(recommendation.category)}
                <span>{recommendation.category}</span>
              </span>

              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                  recommendation.priority === 'high'
                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                    : recommendation.priority === 'moderate'
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                {recommendation.priority} Priority
              </span>

              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <TrendingUp className="w-3 h-3" />
                <span>{recommendation.status}</span>
              </span>
            </div>

            <h2 id="modal-rec-title" className="text-xl sm:text-2xl font-bold text-[#073B72]">
              {recommendation.title}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close details"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section 1: Recommendation Action Plan */}
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#0E9EAA]">
            Action Plan
          </span>
          <p className="text-base font-semibold text-slate-900 leading-relaxed bg-[#F5FBFD] p-4 rounded-2xl border border-[#D7EAF2]">
            {recommendation.action_summary}
          </p>
        </div>

        {/* Section 2: Why BioPulse suggested this */}
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#55718F]">
            Why BioPulse Suggested This
          </span>
          <p className="text-sm text-slate-700 leading-relaxed">
            {recommendation.why_this_is_recommended}
          </p>
        </div>

        {/* Section 3: Your relevant data */}
        {recommendation.based_on_patient_data && recommendation.based_on_patient_data.length > 0 && (
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#55718F]">
              Your Relevant Health Data
            </span>
            <div className="flex flex-wrap gap-2">
              {recommendation.based_on_patient_data.map((item, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 rounded-lg bg-slate-100 border border-slate-200 text-xs font-medium text-slate-800"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Section 4: Progress since previous check-in */}
        <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 space-y-1.5">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
              Progress & Longitudinal Trajectory ({recommendation.status})
            </span>
          </div>
          <p className="text-xs sm:text-sm text-emerald-900 leading-relaxed">
            {recommendation.longitudinal_basis}
          </p>
        </div>

        {/* Section 5: How to approach it */}
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#55718F]">
            How to Approach It
          </span>
          <div className="space-y-2 text-xs sm:text-sm text-slate-700 leading-relaxed">
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/70">
              <CheckCircle2 className="w-4 h-4 text-[#16B8C4] shrink-0 mt-0.5" />
              <span>
                Start with sustainable, incremental adjustments rather than drastic changes.
              </span>
            </div>
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/70">
              <Clock className="w-4 h-4 text-[#0868B9] shrink-0 mt-0.5" />
              <span>
                Maintain consistency over intensity for hormonal and metabolic stabilization.
              </span>
            </div>
          </div>
        </div>

        {/* Section 6: Safety / Clinician Review Information */}
        {recommendation.clinician_review && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 space-y-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <strong className="text-xs font-bold uppercase tracking-wider">
                Clinical Review Information
              </strong>
            </div>
            <p className="text-xs sm:text-sm text-amber-800 leading-relaxed">
              {recommendation.clinician_review_reason ||
                'One of your recorded health values may benefit from professional medical review. Share this recommendation with your doctor or endocrinologist during your next appointment.'}
            </p>
          </div>
        )}

        {/* Section 7: Evidence & Clinical Sources */}
        <div className="pt-4 border-t border-[#D7EAF2] space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#073B72]">
            <BookOpen className="w-4 h-4 text-[#16B8C4]" />
            <span>Clinical Evidence Grounding</span>
          </div>

          {evidence ? (
            <div className="p-4 rounded-2xl bg-[#F5FBFD] border border-[#D7EAF2] space-y-2.5">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-xs font-bold text-[#073B72]">
                  {evidence.source_organization} ({evidence.publication_year})
                </span>
                <span className="px-2 py-0.5 rounded-md bg-white border border-[#D7EAF2] text-[10px] font-semibold text-[#55718F]">
                  {evidence.evidence_category}
                </span>
              </div>
              <h4 className="text-xs sm:text-sm font-semibold text-[#073B72]">
                {evidence.guideline_document}
              </h4>
              <p className="text-xs text-[#55718F] leading-relaxed">
                {evidence.patient_rationale}
              </p>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 leading-relaxed">
              Grounding: Derived from international clinical consensus guidelines and BioPulse AI
              rule-based metabolic safety guardrails.
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white shadow-xs transition-colors cursor-pointer ${
              isMale
                ? 'bg-[#0868B9] hover:bg-[#073B72]'
                : 'bg-[#0E9EAA] hover:bg-[#073B72]'
            }`}
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
};
