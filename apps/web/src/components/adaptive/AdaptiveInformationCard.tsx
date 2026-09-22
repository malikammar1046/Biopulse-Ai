import React, { useState } from 'react';
import {
  CheckCircle,
  Clock,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  ShieldTick,
  File06,
  Sun,
  UserCheck01,
} from '@untitledui/icons';
import type { AdaptiveFieldItem } from '../../types/adaptiveScreening';

interface AdaptiveInformationCardProps {
  item: AdaptiveFieldItem;
  onVerify?: (itemId: string, reportId?: string, resultId?: string) => void;
}

export const AdaptiveInformationCard: React.FC<AdaptiveInformationCardProps> = ({
  item,
  onVerify,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Status visual cues (Icon + accessible text)
  const isAvailable = item.availability === 'known';
  const isPending = item.availability === 'pending_verification';
  const isNA = item.availability === 'not_applicable';

  const statusBadge = isAvailable ? (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0]/80 shadow-2xs">
      <CheckCircle className="w-3.5 h-3.5 text-[#047857]" aria-hidden="true" />
      <span>✓ Available</span>
    </span>
  ) : isPending ? (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A] shadow-2xs">
      <Clock className="w-3.5 h-3.5 text-[#D97706]" aria-hidden="true" />
      <span>◐ Needs Verification</span>
    </span>
  ) : isNA ? (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-[#F8F5FA] text-[#8D7E9E] border border-[#E7DFEF]">
      <span>⊘ Not Applicable</span>
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-[#F8F5FA] text-[#8D7E9E] border border-[#E7DFEF]">
      <span className="w-2 h-2 rounded-full border border-current" aria-hidden="true" />
      <span>○ Not Yet Available</span>
    </span>
  );

  return (
    <div
      className={`p-4 sm:p-5 rounded-2xl border transition-all duration-200 text-left select-none ${
        isAvailable
          ? 'bg-white border-[#BAE6FD]/80 hover:border-[#0288D1] shadow-xs'
          : isPending
          ? 'bg-[#FFFDF5] border-[#FDE68A] shadow-xs'
          : 'bg-[#F8FAFC] border-[#BAE6FD]/60 hover:border-[#BAE6FD]'
      }`}
    >
      {/* ── Top Header Row ──────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          {item.isKeyPredictor && (
            <span
              title="Key Screening Feature"
              className="w-2 h-2 rounded-full bg-[#0288D1] animate-pulse"
              aria-label="Key screening predictor"
            />
          )}
          <h4 className="text-sm sm:text-base font-bold text-[#01579B] font-display">
            {item.label}
          </h4>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {statusBadge}
        </div>
      </div>

      {/* ── Value & Measurement Presentation ────────────────────────────── */}
      <div className="mt-3 flex flex-wrap items-baseline justify-between gap-3">
        <div>
          {isAvailable && item.valueDisplay !== undefined ? (
            <div className="flex items-baseline gap-2">
              <span className="text-lg sm:text-xl font-extrabold text-[#0F172A] font-mono">
                {String(item.valueDisplay)}
              </span>
              {item.referenceRange && (
                <span className="text-xs text-[#64748B] font-sans font-medium">
                  (Ref: {item.referenceRange})
                </span>
              )}
            </div>
          ) : isPending ? (
            <div className="space-y-1">
              <span className="text-sm font-mono font-bold text-[#B45309]">
                Extracted: {String(item.valueDisplay || 'Value logged')}
              </span>
              <p className="text-xs text-[#78350F]">
                Awaiting your confirmation to include in verified assessment.
              </p>
            </div>
          ) : (
            <p className="text-xs text-[#64748B] italic">
              No recorded data. Higher tiers are optional and can be added if available.
            </p>
          )}
        </div>

        {/* Source & Verification Badges */}
        {isAvailable && (
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#475569]">
            {item.source && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#E0F2FE] border border-[#BAE6FD] text-[#01579B] font-medium">
                <File06 className="w-3 h-3 text-[#0288D1]" aria-hidden="true" />
                <span>{item.source}</span>
              </span>
            )}
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#ECFDF5] border border-[#A7F3D0]/80 text-[#047857] font-semibold">
              <ShieldTick className="w-3 h-3" aria-hidden="true" />
              <span className="capitalize">{item.verification.replace(/_/g, ' ')}</span>
            </span>
          </div>
        )}
      </div>

      {/* ── Diurnal Timing Callout (Testosterone Spec) ──────────────────── */}
      {item.timingDetails && isAvailable && (
        <div className="mt-3 p-2.5 rounded-xl bg-[#F0F9FF] border border-[#BAE6FD] flex items-center justify-between text-xs text-[#0369A1]">
          <div className="flex items-center gap-2">
            <Sun className="w-3.5 h-3.5 text-[#D97706]" aria-hidden="true" />
            <span className="font-semibold">Standardized Morning Draw</span>
            {item.timingDetails.fastingStatus && (
              <span className="px-1.5 py-0.2 rounded bg-[#0284C7]/20 text-[10px] uppercase font-mono font-bold">
                Fasting
              </span>
            )}
          </div>
          {item.timingDetails.drawTime && (
            <span className="font-mono text-[11px] text-[#0284C7] font-medium">
              {item.timingDetails.drawTime}
            </span>
          )}
        </div>
      )}

      {/* ── Interactive Actions for Pending or Missing Data ─────────────── */}
      {isPending && onVerify && (
        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={() => onVerify(item.id, item.reportId, item.resultId)}
            className="px-3.5 py-1.5 rounded-xl bg-[#D97706] hover:bg-[#B45309] text-white text-xs font-bold font-sans transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <UserCheck01 className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Confirm & Verify Value</span>
          </button>
        </div>
      )}

      {/* ── Collapsible "Why It Matters" Education Block ─────────────────── */}
      <div className="mt-3 pt-2.5 border-t border-[#E2E8F0]">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-between w-full text-xs text-[#475569] hover:text-[#01579B] transition-colors cursor-pointer py-0.5"
          aria-expanded={isExpanded}
        >
          <span className="flex items-center gap-1.5 font-medium">
            <HelpCircle className="w-3.5 h-3.5 text-[#0288D1]" aria-hidden="true" />
            <span>Why this information matters</span>
          </span>
          {isExpanded ? (
            <ChevronUp className="w-3.5 h-3.5 text-[#64748B]" aria-hidden="true" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-[#64748B]" aria-hidden="true" />
          )}
        </button>

        {isExpanded && (
          <div className="mt-2 text-xs text-[#475569] space-y-1.5 bg-[#F8FAFC] p-3 rounded-xl border border-[#BAE6FD]/80">
            <p className="leading-relaxed">{item.whyItMatters}</p>
            {item.clinicalNote && (
              <p className="text-[11px] text-[#01579B] leading-normal pt-1 border-t border-[#BAE6FD]/60">
                <strong>Educational note:</strong> {item.clinicalNote}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
