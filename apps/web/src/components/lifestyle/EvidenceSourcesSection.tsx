import React, { useState } from 'react';
import { BookOpen, ChevronDown, ChevronUp, Info } from 'lucide-react';
import type {
  EvidenceMetadata,
  EvidenceRationale,
  RecommendationItem,
} from '../../types/lifestyle';

interface EvidenceSourcesSectionProps {
  evidenceRegistry?: Record<string, EvidenceMetadata>;
  evidenceRationale?: EvidenceRationale;
  recommendations?: RecommendationItem[];
  disclaimer?: string;
  isMale?: boolean;
}

export const EvidenceSourcesSection: React.FC<EvidenceSourcesSectionProps> = ({
  evidenceRegistry,
  evidenceRationale,
  recommendations = [],
  disclaimer,
  isMale = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const registryItems = evidenceRegistry ? Object.values(evidenceRegistry) : [];

  // Map each evidence item to any linked recommendation title
  const getLinkedRecTitle = (evidenceId: string): string | null => {
    const matched = recommendations.find((r) => r.evidence_id === evidenceId);
    return matched ? matched.title : null;
  };

  return (
    <section
      aria-label="Evidence and Clinical Sources"
      className="rounded-2xl bg-white border border-[#D7EAF2] overflow-hidden shadow-xs transition-all"
    >
      {/* Header Button (Collapsed by Default) */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between gap-4 text-left cursor-pointer hover:bg-[#F5FBFD] transition-colors focus:outline-none"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              isMale ? 'bg-sky-50 text-[#0868B9]' : 'bg-teal-50 text-[#0E9EAA]'
            }`}
          >
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-[#073B72]">
              Evidence & Clinical Sources
            </h3>
            <p className="text-xs text-[#55718F]">
              Grounded in published clinical guidelines and rule-based consensus
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-[#55718F]">
          <span>{isOpen ? 'Hide sources' : 'View sources'}</span>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Expanded Accordion Body */}
      {isOpen && (
        <div className="px-6 pb-6 pt-2 border-t border-[#D7EAF2] space-y-6 animate-fadeIn">
          {/* Engine Clinical Synthesis */}
          {evidenceRationale?.clinical_synthesis && (
            <div className="p-4 rounded-xl bg-[#F5FBFD] border border-[#D7EAF2] text-xs sm:text-sm text-slate-700 leading-relaxed space-y-1">
              <strong className="block text-xs font-bold uppercase tracking-wider text-[#073B72]">
                Clinical Synthesis & Evidence Model
              </strong>
              <p>{evidenceRationale.clinical_synthesis}</p>
            </div>
          )}

          {/* Qualitative Attribution Overview (Strict SHAP Boundary: NO raw numeric weights!) */}
          {evidenceRationale && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Factor Drivers (Qualitative names only) */}
              {evidenceRationale.attributed_shap_drivers?.length > 0 && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#073B72] block">
                    Model Priority Drivers
                  </span>
                  <ul className="text-xs text-slate-700 space-y-1">
                    {evidenceRationale.attributed_shap_drivers.map((driver, idx) => {
                      // Strip any raw numeric weights if present to enforce strict SHAP UI boundary
                      const cleanDriver = driver.replace(/\s*\(\+?[0-9.]+.*?\)/g, '');
                      return (
                        <li key={idx} className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#16B8C4] shrink-0" />
                          <span>{cleanDriver}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {/* Lab Markers */}
              {evidenceRationale.attributed_lab_markers?.length > 0 && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#073B72] block">
                    Laboratory Biomarkers
                  </span>
                  <ul className="text-xs text-slate-700 space-y-1">
                    {evidenceRationale.attributed_lab_markers.map((lab, idx) => (
                      <li key={idx} className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#0868B9] shrink-0" />
                        <span>{lab}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Reported Symptoms */}
              {evidenceRationale.attributed_symptoms?.length > 0 && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#073B72] block">
                    Reported Symptoms
                  </span>
                  <ul className="text-xs text-slate-700 space-y-1">
                    {evidenceRationale.attributed_symptoms.map((sym, idx) => (
                      <li key={idx} className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#F43F7D] shrink-0" />
                        <span>{sym}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Guideline Registry Table/Cards */}
          <div className="space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#073B72] block">
              Authoritative Guideline Sources
            </span>

            {registryItems.length === 0 ? (
              <p className="text-xs text-[#55718F]">
                Standard BioPulse Clinical Safety and Metabolic Guidelines applied.
              </p>
            ) : (
              <div className="space-y-3">
                {registryItems.map((item) => {
                  const linkedTitle = getLinkedRecTitle(item.evidence_id);
                  return (
                    <div
                      key={item.evidence_id}
                      className="p-4 rounded-xl bg-[#F5FBFD] border border-[#D7EAF2] space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="font-bold text-[#073B72]">
                          {item.source_organization} ({item.publication_year})
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-white border border-[#D7EAF2] text-[10px] font-semibold text-[#55718F]">
                          {item.evidence_category}
                        </span>
                      </div>

                      <h4 className="font-semibold text-slate-900">
                        {item.guideline_document}
                      </h4>

                      {linkedTitle && (
                        <div className="text-[11px] text-[#0E9EAA] font-medium">
                          Linked Recommendation: {linkedTitle}
                        </div>
                      )}

                      <p className="text-slate-600 leading-relaxed">
                        {item.patient_rationale}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Non-Diagnostic Disclaimer Note */}
          {disclaimer && (
            <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-900 leading-relaxed flex items-start gap-2.5">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>{disclaimer}</span>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
