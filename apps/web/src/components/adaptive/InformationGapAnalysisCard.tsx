import React from 'react';
import { CheckCircle2, HelpCircle, Layers } from 'lucide-react';
import type { InformationGapReport } from '../../types/adaptiveScreening';

interface InformationGapAnalysisCardProps {
  gaps: InformationGapReport;
}

export const InformationGapAnalysisCard: React.FC<InformationGapAnalysisCardProps> = ({
  gaps,
}) => {
  return (
    <div className="p-6 sm:p-8 rounded-[32px] bg-white border border-[#E7DFEF] shadow-sm space-y-6 text-left select-none">
      {/* Top Title Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#F0EAF5] pb-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-[#EDE4F7] text-[#6E2D8B] text-xs font-mono font-bold mb-1">
            <Layers className="w-3.5 h-3.5 text-[#8E3EAF]" />
            <span>Information Architecture</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold font-display text-[#1C1326]">
            Information Gap Analysis
          </h3>
          <p className="text-xs text-[#584B68] mt-0.5 leading-relaxed">
            Identify what health information is currently available and what optional details could enhance screening depth.
          </p>
        </div>

        <div className="text-xs font-mono text-[#584B68] self-start sm:self-auto flex items-center gap-2">
          <span className="text-[#047857] font-bold bg-[#ECFDF5] px-2.5 py-1 rounded-full border border-[#A7F3D0]/60">
            {gaps.totalAvailableCount} Available
          </span>
          <span>•</span>
          <span className="text-[#BE123C] font-bold bg-[#FFF1F2] px-2.5 py-1 rounded-full border border-[#FDA4AF]/60">
            {gaps.totalMissingCount} Unrecorded
          </span>
        </div>
      </div>

      {/* Two-Column Matrix: Available vs Missing */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* ── Left Column: Information Available (✓) ──────────────────────── */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#F0FDF4] border border-[#BBF7D0] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#047857] flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#047857]" />
              <span>Information Available ({gaps.availableItems.length})</span>
            </span>
          </div>

          {gaps.availableItems.length === 0 ? (
            <p className="text-xs text-[#584B68] italic py-4 text-center">
              No health data recorded yet. Complete Tier 1 intake to begin.
            </p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {gaps.availableItems.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl bg-white border border-[#DCFCE7] shadow-2xs flex items-center justify-between gap-2 text-xs"
                >
                  <div className="space-y-0.5">
                    <span className="font-semibold text-[#1C1326] block">{item.label}</span>
                    <span className="text-[10px] text-[#584B68] font-mono capitalize">
                      {item.category.replace(/_/g, ' ')} • {item.source || 'Self-Reported'}
                    </span>
                  </div>
                  {item.valueDisplay !== undefined && (
                    <span className="font-mono text-xs font-bold text-[#047857] bg-[#ECFDF5] px-2 py-0.5 rounded-md shrink-0 border border-[#A7F3D0]/60">
                      {String(item.valueDisplay)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Right Column: Not Yet Available (○) ─────────────────────────── */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#FAF7FC] border border-[#E7DFEF] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#6E2D8B] flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-full border border-current flex items-center justify-center text-[10px] font-bold">
                ○
              </span>
              <span>Not Yet Available ({gaps.missingPrioritizedItems.length})</span>
            </span>
            <span className="text-[10px] text-[#8D7E9E] font-medium">Optional Depth</span>
          </div>

          {gaps.missingPrioritizedItems.length === 0 ? (
            <p className="text-xs text-[#047857] font-semibold py-4 text-center">
              All progressive information tiers have recorded values!
            </p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {gaps.missingPrioritizedItems.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl bg-white border border-[#E7DFEF] shadow-2xs flex items-center justify-between gap-2 text-xs hover:border-[#D8B4FE] transition-colors"
                >
                  <div className="space-y-0.5">
                    <span className="font-medium text-[#1C1326] block">{item.label}</span>
                    <span className="text-[10px] text-[#736384] font-mono capitalize">
                      {item.tier.replace(/_/g, ' ')} • {item.category.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-[#8D7E9E] bg-[#F8F5FA] border border-[#E7DFEF] px-2 py-0.5 rounded-md shrink-0">
                    Unrecorded
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Reassurance text */}
      <div className="text-xs text-[#584B68] leading-relaxed bg-[#F8F5FA] p-3.5 rounded-xl border border-[#E7DFEF] flex items-start gap-2.5">
        <HelpCircle className="w-4 h-4 text-[#8E3EAF] shrink-0 mt-0.5" />
        <p>
          <strong className="text-[#1C1326]">Unknown ≠ Normal:</strong> Missing fields are treated strictly as unknown rather than assumed healthy or unhealthy. When you visit a healthcare professional or complete routine lab work, newly verified tests can be uploaded to enrich your profile.
        </p>
      </div>
    </div>
  );
};
