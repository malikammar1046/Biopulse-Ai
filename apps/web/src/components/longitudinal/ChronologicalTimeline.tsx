import React from 'react';
import {
  Activity,
  CheckCircle,
  Calendar,
  LayersThree01,
  ShieldTick,
  InfoCircle,
} from '@untitledui/icons';
import type { HealthPathway } from '../../types/onboarding';
import type { TimelineEventItem } from '../../types/longitudinalHealth';

interface ChronologicalTimelineProps {
  pathway: HealthPathway;
  events: TimelineEventItem[];
}

export const ChronologicalTimeline: React.FC<ChronologicalTimelineProps> = ({
  pathway,
  events = [],
}) => {
  const isMale = pathway === 'male';

  const themeColor = isMale ? '#0288D1' : '#F43F7D';
  const themeBgLight = isMale ? '#F0F9FF' : '#FDE6EF';
  const themeBorder = isMale ? '#BAE6FD' : '#FBCFE8';

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'screening_assessment':
        return <Activity className="w-4 h-4 text-[#0288D1]" aria-hidden="true" />;
      case 'clinical_tier_upgrade':
        return <LayersThree01 className="w-4 h-4 text-purple-600" aria-hidden="true" />;
      case 'verified_lab_report':
        return <ShieldTick className="w-4 h-4 text-[#16A36A]" aria-hidden="true" />;
      case 'cycle_entry':
        return <Calendar className="w-4 h-4 text-rose-500" aria-hidden="true" />;
      default:
        return <CheckCircle className="w-4 h-4 text-[#667085]" aria-hidden="true" />;
    }
  };

  const getEventBadge = (type: string) => {
    switch (type) {
      case 'screening_assessment':
        return (
          <span className="text-[10px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
            Assessment
          </span>
        );
      case 'clinical_tier_upgrade':
        return (
          <span className="text-[10px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
            Tier Upgrade
          </span>
        );
      case 'verified_lab_report':
        return (
          <span className="text-[10px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            Verified Labs
          </span>
        );
      case 'cycle_entry':
        return (
          <span className="text-[10px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
            Cycle Log
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-50 text-slate-700 border border-slate-200">
            Clinical Event
          </span>
        );
    }
  };

  return (
    <div className="bg-white/95 backdrop-blur-sm border border-[#EAECF0] rounded-[24px] p-6 sm:p-7 shadow-[0_2px_12px_-4px_rgba(16,24,40,0.06)] text-left select-none space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F2F4F7] pb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-xs ${isMale ? 'bg-[#F0F9FF] text-[#0288D1]' : 'bg-[#FDE6EF] text-[#F43F7D]'}`}>
            <Calendar className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold font-display text-[#111318]">
              Health Activity & Clinical Timeline
            </h2>
            <p className="text-xs text-[#667085] font-sans">
              Deduplicated chronological audit of completed clinical assessments, verified lab reports, and tracking records.
            </p>
          </div>
        </div>

        <span
          className="text-[11px] font-mono font-semibold px-3 py-1 rounded-full border self-start sm:self-center"
          style={{
            backgroundColor: themeBgLight,
            color: themeColor,
            borderColor: themeBorder,
          }}
        >
          Chronological Audit
        </span>
      </div>

      {events.length === 0 ? (
        <div className="py-8 px-4 rounded-2xl bg-[#F8F9FC] border border-[#EAECF0] text-center space-y-1.5">
          <InfoCircle className="w-5 h-5 text-[#98A2B3] mx-auto opacity-70" aria-hidden="true" />
          <p className="text-xs font-medium text-[#475467]">No chronological events logged yet.</p>
        </div>
      ) : (
        <div className="relative pl-8 space-y-4 before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#EAECF0]">
          {events.map((ev, idx) => (
            <div key={ev.id || idx} className="relative flex items-start gap-4 group">
              {/* Event Icon Node */}
              <div className="absolute -left-8 top-1 w-7 h-7 rounded-full bg-white border border-[#EAECF0] group-hover:border-[#0288D1] flex items-center justify-center transition-all shadow-xs">
                {getEventIcon(ev.event_type)}
              </div>

              {/* Event card */}
              <div className="flex-1 p-4 rounded-2xl bg-gradient-to-br from-[#FAFAFC] to-[#F8F9FC] border border-[#EAECF0] shadow-2xs group-hover:border-[#D0D5DD] transition-all">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-xs text-[#111318]">{ev.title}</span>
                    {getEventBadge(ev.event_type)}
                  </div>
                  <span className="text-[11px] font-mono text-[#667085] shrink-0">
                    {ev.observed_at || (ev.timestamp ? new Date(ev.timestamp).toLocaleDateString() : 'Recorded')}
                  </span>
                </div>
                {ev.description && (
                  <p className="text-xs text-[#475467] mt-1.5 leading-relaxed font-sans">
                    {ev.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChronologicalTimeline;
