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
  events,
}) => {
  const isMale = pathway === 'male';

  const themeColor = isMale ? 'var(--color-medical-primary-hover, #0288D1)' : '#F43F7D';
  const themeBgLight = isMale ? 'var(--color-medical-primary-soft, #F0F9FF)' : '#FDE6EF';
  const themeBorder = isMale ? 'var(--color-medical-primary-border, #BAE6FD)' : 'rgba(244,63,125,0.2)';

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'screening_assessment':
        return <Activity className="w-4 h-4 text-[var(--color-medical-primary-hover,#0288D1)]" aria-hidden="true" />;
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
          <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
            Assessment
          </span>
        );
      case 'clinical_tier_upgrade':
        return (
          <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
            Assessment Upgrade
          </span>
        );
      case 'verified_lab_report':
        return (
          <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
            Verified Labs
          </span>
        );
      case 'cycle_entry':
        return (
          <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
            Cycle Log
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-slate-50 text-slate-700 border border-slate-200">
            Health Log
          </span>
        );
    }
  };

  return (
    <div className="bg-white border border-[#EAECF0] rounded-[20px] sm:rounded-[24px] p-5 sm:p-6 shadow-xs text-left select-none space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#F2F4F7] pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold font-display text-[#111318]">
              Health Activity & Clinical Timeline
            </h2>
            <span
              className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border"
              style={{
                backgroundColor: themeBgLight,
                color: themeColor,
                borderColor: themeBorder,
              }}
            >
              Chronological Audit
            </span>
          </div>
          <p className="text-xs text-[#667085] mt-0.5 font-sans">
            Deduplicated log of completed clinical screenings, verified lab reports, and tracking records.
          </p>
        </div>
      </div>

      {events.length === 0 ? (
        <div className="py-8 text-center rounded-xl bg-[#F8F9FC] border border-[#EAECF0] space-y-1">
          <InfoCircle className="w-5 h-5 text-[#98A2B3] mx-auto opacity-70" aria-hidden="true" />
          <p className="text-xs text-[#667085]">
            No activity events recorded within the selected tracking window.
          </p>
        </div>
      ) : (
        <div className="relative pl-6 sm:pl-8 space-y-6 before:content-[''] before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#EAECF0]">
          {events.map((ev, idx) => (
            <div key={ev.id || idx} className="relative group">
              {/* Dot Icon Anchor */}
              <div className="absolute -left-6 sm:-left-8 top-0.5 w-6 h-6 rounded-full bg-white border border-[#EAECF0] flex items-center justify-center shadow-xs">
                {getEventIcon(ev.event_type)}
              </div>

              {/* Event Body */}
              <div className="bg-[#FAFAFC] border border-[#EAECF0] hover:border-[#D0D5DD] transition-all rounded-xl p-3.5 sm:p-4 space-y-1.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    {getEventBadge(ev.event_type)}
                    <h3 className="text-sm font-bold text-[#111318]">{ev.title}</h3>
                  </div>

                  <span className="text-[11px] font-mono text-[#667085]">
                    {new Date(ev.observed_at || ev.timestamp).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>

                <p className="text-xs text-[#475569] leading-relaxed">{ev.description}</p>

                {ev.date_source && (
                  <div className="pt-1 text-[10px] font-mono text-[#98A2B3] flex items-center gap-1">
                    <span>Source:</span>
                    <span className="capitalize">{ev.date_source.replace(/_/g, ' ')}</span>
                  </div>
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
