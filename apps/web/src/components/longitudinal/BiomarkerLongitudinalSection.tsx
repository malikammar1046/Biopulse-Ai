import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  AlertTriangle,
  FileText,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowRight,
  Info,
} from 'lucide-react';
import type { BiomarkerLongitudinalComparison } from '../../types/longitudinal';
import { ROUTES } from '../../constants/routes';

interface BiomarkerLongitudinalSectionProps {
  comparisons: BiomarkerLongitudinalComparison[];
  quarantinedCount: number;
}

export const BiomarkerLongitudinalSection: React.FC<BiomarkerLongitudinalSectionProps> = ({
  comparisons,
  quarantinedCount,
}) => {
  return (
    <div className="space-y-4 text-left">
      {/* ── Quarantined Draft Notice (Critical Trust Boundary) ── */}
      {quarantinedCount > 0 && (
        <div className="p-4 sm:p-5 rounded-[20px] bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-950 shadow-xs">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h5 className="text-sm font-bold font-display text-amber-950">
                {quarantinedCount} Unconfirmed OCR Result{quarantinedCount > 1 ? 's' : ''} Quarantined
              </h5>
              <p className="text-xs text-amber-800 leading-relaxed mt-0.5">
                To maintain clinical data integrity, unverified OCR drafts are strictly excluded from trusted longitudinal tracking until you review and confirm them.
              </p>
            </div>
          </div>
          <Link
            to={ROUTES.APP.REPORTS}
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto shrink-0 transition-colors shadow-xs cursor-pointer"
          >
            <span>Review Reports</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* ── Verified Biomarkers List ── */}
      {comparisons.length === 0 ? (
        <div className="p-8 rounded-[24px] bg-white border border-[#BAE6FD] shadow-sm text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#F0F9FF] border border-[#BAE6FD] flex items-center justify-center text-[#0288D1] mx-auto">
            <FileText className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold font-display text-[#0F172A]">
            No Comparable Verified Reports Yet
          </h4>
          <p className="text-xs sm:text-sm text-[#475569] max-w-md mx-auto leading-relaxed">
            We don’t have enough verified lab results of the same type to show changes over time. Upload and confirm subsequent laboratory tests to enable trusted biomarker comparisons.
          </p>
          <div className="pt-2">
            <Link
              to={ROUTES.APP.REPORTS}
              className="inline-flex items-center gap-1.5 text-xs text-[#0288D1] hover:text-[#0277BD] font-bold underline underline-offset-4 cursor-pointer"
            >
              <span>Go to Medical Reports</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {comparisons.map((bio) => (
            <div
              key={bio.testName}
              className="p-6 rounded-[24px] bg-white hover:border-[#0288D1] border border-[#BAE6FD] shadow-sm space-y-3.5 transition-all"
            >
              {/* Header */}
              <div className="flex items-center justify-between gap-2 border-b border-[#E2E8F0] pb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1 font-bold">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      Verified Biomarker
                    </span>
                    {bio.referenceRange && (
                      <span className="text-[10px] font-mono text-[#64748B]">
                        Ref: {bio.referenceRange}
                      </span>
                    )}
                  </div>
                  <h4 className="text-base font-bold font-display text-[#0F172A]">
                    {bio.testName}
                  </h4>
                </div>

                {bio.direction === 'increased' ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                    <TrendingUp className="w-3 h-3 text-emerald-600" /> Increased
                  </span>
                ) : bio.direction === 'decreased' ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                    <TrendingDown className="w-3 h-3 text-amber-600" /> Decreased
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-[#64748B] bg-[#F8FAFC] border border-[#E2E8F0] px-2.5 py-0.5 rounded-full">
                    <Minus className="w-3 h-3 text-[#64748B]" /> Steady
                  </span>
                )}
              </div>

              {/* Readings Comparison Box */}
              <div className="grid grid-cols-2 gap-3">
                {bio.previousValue !== undefined && bio.previousDate && (
                  <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#BAE6FD] space-y-1">
                    <span className="text-[10px] font-mono text-[#64748B] block font-medium">
                      Prior: {bio.previousDate}
                    </span>
                    <div className="text-base font-mono font-bold text-[#475569]">
                      {bio.previousValue} {bio.unit}
                    </div>
                  </div>
                )}

                <div className="p-3 rounded-xl bg-[#F0F9FF] border border-[#BAE6FD] space-y-1">
                  <span className="text-[10px] font-mono text-[#0288D1] font-bold block">
                    Latest: {bio.latestDate}
                  </span>
                  <div className="text-base font-mono font-bold text-[#0F172A]">
                    {bio.latestValue} {bio.unit}
                  </div>
                </div>
              </div>

              {/* Factual Observation */}
              <p className="text-xs text-[#0F172A] font-sans leading-relaxed font-medium">
                {bio.observation}
              </p>

              {/* Disclaimer */}
              <div className="flex items-start gap-2 pt-2 text-[11px] text-[#64748B] border-t border-[#E2E8F0]">
                <Info className="w-3.5 h-3.5 text-[#0288D1] shrink-0 mt-0.5" />
                <span className="leading-relaxed">{bio.limitation}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
