import React, { useEffect } from 'react';
import {
  XClose,
  LayersThree01,
  ShieldTick,
  LineChartUp01,
  ActivityHeart,
  CheckCircle,
  HelpCircle,
} from '@untitledui/icons';
import type { ExplainableDimensionNode } from '../../types/researchIntelligence';
import type { HealthPathway } from '../../types/onboarding';

interface DigitalTwinExplainableDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  dimensions: ExplainableDimensionNode[];
  pathway: HealthPathway;
}

export const DigitalTwinExplainableDrawer: React.FC<DigitalTwinExplainableDrawerProps> = ({
  isOpen,
  onClose,
  dimensions,
  pathway,
}) => {
  // ESC key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const changeBadge = (change: ExplainableDimensionNode['change']) => {
    switch (change) {
      case 'improving':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#34D399]/20 text-[#34D399] border border-[#34D399]/30">
            <LineChartUp01 className="w-2.5 h-2.5" aria-hidden="true" />
            Improving
          </span>
        );
      case 'changing':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <ActivityHeart className="w-2.5 h-2.5" aria-hidden="true" />
            Changing Pattern
          </span>
        );
      case 'insufficient_data':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
            <HelpCircle className="w-2.5 h-2.5" aria-hidden="true" />
            Insufficient Data
          </span>
        );
      case 'stable':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white/10 text-[#CDBDD8] border border-white/10">
            <CheckCircle className="w-2.5 h-2.5" aria-hidden="true" />
            Stable Baseline
          </span>
        );
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dt-drawer-title"
    >
      <div
        className="relative w-full max-w-3xl rounded-[24px] bg-white border border-[#E2E8F0] text-[#0F172A] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="p-5 sm:p-6 border-b border-[#E2E8F0] flex items-center justify-between gap-4 relative z-10 bg-[#F8FAFC]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#E0F2FE] border border-[#BAE6FD] flex items-center justify-center text-[#0288D1] shrink-0">
              <LayersThree01 className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#0288D1] font-bold">
                  Longitudinal Health Summary
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white text-[#64748B] border border-[#E2E8F0]">
                  {pathway.toUpperCase()} PROFILE
                </span>
              </div>
              <h3 id="dt-drawer-title" className="text-lg sm:text-xl font-bold font-display text-[#0F172A]">
                Explainable Physiological Dimensions
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white hover:bg-[#F1F5F9] flex items-center justify-center text-[#64748B] hover:text-[#0F172A] border border-[#E2E8F0] transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <XClose className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Informative Subtext */}
        <div className="px-5 sm:px-6 py-3 bg-[#F0F9FF] border-b border-[#BAE6FD] flex items-center justify-between text-xs text-[#0F172A]">
          <p>
            This longitudinal summary is a structured, data-driven representation of your recorded history. It never fabricates values or predicts unverified outcomes.
          </p>
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-emerald-700 font-mono font-bold">
            <ShieldTick className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
            <span>Deterministic</span>
          </div>
        </div>

        {/* Dimensions List */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-left relative z-10 bg-white">
          {dimensions.map((dim) => (
            <div
              key={dim.id}
              className="p-4 sm:p-5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-3"
            >
              {/* Node Title & Change Status */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <h4 className="text-base font-bold font-display text-[#0F172A]">
                    {dim.title}
                  </h4>
                  <span className="text-[9px] font-mono uppercase px-2 py-0.5 rounded bg-white text-[#64748B] border border-[#E2E8F0]">
                    {dim.category}
                  </span>
                </div>
                {changeBadge(dim.change)}
              </div>

              {/* 1. Current State & Historical State */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="p-3 rounded-xl bg-white border border-[#E2E8F0] space-y-0.5">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#0288D1] font-bold block">
                    Current State
                  </span>
                  <p className="text-xs sm:text-sm text-[#0F172A] font-sans">
                    {dim.currentState}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-white border border-[#E2E8F0] space-y-0.5">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#64748B] font-bold block">
                    Historical State & Baseline
                  </span>
                  <p className="text-xs sm:text-sm text-[#64748B] font-sans">
                    {dim.historicalState || 'Baseline accumulating through regular tracking.'}
                  </p>
                </div>
              </div>

              {/* 2. Supporting Data with Provenance */}
              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#64748B] font-bold block">
                  Supporting Real Data
                </span>
                <div className="flex flex-wrap gap-2">
                  {dim.supportingData.map((sd, sIdx) => (
                    <div
                      key={sIdx}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white border border-[#E2E8F0] text-xs text-[#0F172A]"
                    >
                      <span>{sd.label}</span>
                      <span className="text-[10px] font-mono text-[#0288D1] bg-[#E0F2FE] px-1 rounded">
                        {sd.recordCount} entries
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. Change Trajectory & Limitation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <div className="p-2.5 rounded-xl bg-white border border-[#E2E8F0]">
                  <span className="text-[9px] font-mono uppercase text-[#64748B] block">
                    Trajectory
                  </span>
                  <p className="text-[11px] text-[#64748B]">
                    {dim.changeDescription}
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200">
                  <span className="text-[9px] font-mono uppercase text-amber-700 font-bold block">
                    Known Limitation
                  </span>
                  <p className="text-[11px] text-[#0F172A]">
                    {dim.limitation}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Modal Bottom Footer */}
        <div className="p-4 sm:p-5 border-t border-[#E2E8F0] flex items-center justify-between bg-[#F8FAFC]">
          <span className="text-[11px] font-mono text-[#64748B]">
            Structured Physiology State
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#0288D1] hover:bg-[#0277BD] text-xs font-sans font-semibold text-white transition-colors cursor-pointer shadow-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
