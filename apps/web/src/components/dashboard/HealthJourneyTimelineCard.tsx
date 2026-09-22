import React from 'react';
import { Link } from 'react-router-dom';
import {
  GitBranch01,
  Calendar,
  CalendarCheck01,
  ActivityHeart,
  File01,
  MedicalCross,
  Scales01,
  Users01,
  ArrowRight,
} from '@untitledui/icons';
import type { TimelineEvent, TimelineCategory } from '../../types/timeline';
import { ROUTES } from '../../constants/routes';

interface HealthJourneyTimelineCardProps {
  recentEvents: TimelineEvent[];
}

export const HealthJourneyTimelineCard: React.FC<HealthJourneyTimelineCardProps> = ({
  recentEvents,
}) => {
  const getCategoryIcon = (cat: TimelineCategory) => {
    switch (cat) {
      case 'cycle':
        return <Calendar className="w-3.5 h-3.5 text-[#0288D1]" aria-hidden="true" />;
      case 'symptom':
        return <ActivityHeart className="w-3.5 h-3.5 text-[#0288D1]" aria-hidden="true" />;
      case 'report':
        return <File01 className="w-3.5 h-3.5 text-[#0288D1]" aria-hidden="true" />;
      case 'medication':
        return <MedicalCross className="w-3.5 h-3.5 text-[#0288D1]" aria-hidden="true" />;
      case 'nutrition':
        return <Scales01 className="w-3.5 h-3.5 text-[#059669]" aria-hidden="true" />;
      case 'fitness':
        return <ActivityHeart className="w-3.5 h-3.5 text-[#0288D1]" aria-hidden="true" />;
      case 'appointment':
        return <CalendarCheck01 className="w-3.5 h-3.5 text-[#01579B]" aria-hidden="true" />;
      case 'care_circle':
      default:
        return <Users01 className="w-3.5 h-3.5 text-[#0288D1]" aria-hidden="true" />;
    }
  };

  const displayEvents = recentEvents.slice(0, 4);

  return (
    <div className="p-6 sm:p-7 rounded-[32px] bg-white border border-[#BAE6FD] shadow-sm flex flex-col justify-between select-none text-left space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GitBranch01 className="w-5 h-5 text-[#0288D1] shrink-0" aria-hidden="true" />
          <h3 className="text-base font-bold font-display text-[#0F172A]">
            Your Health Journey
          </h3>
        </div>

        <Link
          to={ROUTES.APP.TIMELINE}
          className="text-xs font-mono font-bold text-[#0288D1] hover:text-[#01579B] flex items-center gap-1 transition-colors"
        >
          <span>Timeline</span>
          <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
        </Link>
      </div>

      {/* Events List */}
      <div className="space-y-2.5 flex-1">
        {displayEvents.length === 0 ? (
          <div className="p-5 rounded-2xl bg-[#F8FAFC] border border-dashed border-[#BAE6FD] text-center">
            <p className="text-xs text-[#64748B]">
              Your longitudinal health journey is just getting started.
            </p>
          </div>
        ) : (
          displayEvents.map((evt) => {
            const dateDisplay = new Date(evt.date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            });

            return (
              <Link
                key={evt.id}
                to={ROUTES.APP.TIMELINE}
                className="p-3 rounded-2xl bg-[#F8FAFC] hover:bg-[#F0F9FF] border border-[#E2E8F0] hover:border-[#BAE6FD] flex items-center justify-between gap-3 transition-all duration-200 group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 rounded-xl bg-white border border-[#BAE6FD]/60 shrink-0">
                    {getCategoryIcon(evt.category)}
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-[#0F172A] block truncate group-hover:text-[#0288D1] transition-colors">
                      {evt.title}
                    </span>
                    <span className="text-[10px] font-mono text-[#64748B]">
                      {dateDisplay} {evt.time ? `• ${evt.time}` : ''}
                    </span>
                  </div>
                </div>

                {evt.metric && (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-white border border-[#BAE6FD] text-[#0288D1] shrink-0">
                    {evt.metric.value}
                  </span>
                )}
              </Link>
            );
          })
        )}
      </div>

      {/* Footer CTA */}
      <div className="pt-2 border-t border-[#E2E8F0]">
        <Link
          to={ROUTES.APP.TIMELINE}
          className="inline-flex items-center justify-between w-full text-xs font-bold text-[#0288D1] hover:text-[#01579B] transition-colors"
        >
          <span>View Longitudinal Timeline</span>
          <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
};
