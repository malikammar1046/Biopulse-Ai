import React from 'react';
import { Link } from 'react-router-dom';
import {
  GitBranch,
  Calendar,
  Activity,
  FileText,
  Pill,
  Utensils,
  Dumbbell,
  Stethoscope,
  Users,
  ArrowRight,
} from 'lucide-react';
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
        return <Calendar className="w-3.5 h-3.5 text-[#FB7185]" />;
      case 'symptom':
        return <Activity className="w-3.5 h-3.5 text-[#A21CAF]" />;
      case 'report':
        return <FileText className="w-3.5 h-3.5 text-[#38BDF8]" />;
      case 'medication':
        return <Pill className="w-3.5 h-3.5 text-[#F59E0B]" />;
      case 'nutrition':
        return <Utensils className="w-3.5 h-3.5 text-[#34D399]" />;
      case 'fitness':
        return <Dumbbell className="w-3.5 h-3.5 text-[#8E3EAF]" />;
      case 'appointment':
        return <Stethoscope className="w-3.5 h-3.5 text-[#6E2D8B]" />;
      case 'care_circle':
      default:
        return <Users className="w-3.5 h-3.5 text-[#6366F1]" />;
    }
  };

  const displayEvents = recentEvents.slice(0, 4);

  return (
    <div className="p-6 sm:p-7 rounded-[32px] bg-white border border-[#E7DFEF] shadow-sm flex flex-col justify-between select-none text-left space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-xl bg-[#EDE4F7] text-[#6E2D8B]">
            <GitBranch className="w-4 h-4" />
          </span>
          <h3 className="text-base font-bold font-display text-[#1C1326]">
            Your Health Journey
          </h3>
        </div>

        <Link
          to={ROUTES.APP.TIMELINE}
          className="text-xs font-mono font-bold text-[#6E2D8B] hover:text-[#A21CAF] flex items-center gap-1 transition-colors"
        >
          <span>Timeline</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Events List */}
      <div className="space-y-2.5 flex-1">
        {displayEvents.length === 0 ? (
          <div className="p-5 rounded-2xl bg-[#F8F5FA] border border-dashed border-[#E7DFEF] text-center">
            <p className="text-xs text-[#8D7E9E]">
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
                className="p-3 rounded-2xl bg-[#F8F5FA] hover:bg-[#F2ECF7] border border-[#E7DFEF] flex items-center justify-between gap-3 transition-all duration-200 group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 rounded-xl bg-white border border-[#E7DFEF] shrink-0">
                    {getCategoryIcon(evt.category)}
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-[#1C1326] block truncate group-hover:text-[#6E2D8B] transition-colors">
                      {evt.title}
                    </span>
                    <span className="text-[10px] font-mono text-[#8D7E9E]">
                      {dateDisplay} {evt.time ? `• ${evt.time}` : ''}
                    </span>
                  </div>
                </div>

                {evt.metric && (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-white border border-[#E7DFEF] text-[#6E2D8B] shrink-0">
                    {evt.metric.value}
                  </span>
                )}
              </Link>
            );
          })
        )}
      </div>

      {/* Footer CTA */}
      <div className="pt-2 border-t border-[#F0EAF5]">
        <Link
          to={ROUTES.APP.TIMELINE}
          className="inline-flex items-center justify-between w-full text-xs font-bold text-[#6E2D8B] hover:text-[#A21CAF] transition-colors"
        >
          <span>View Longitudinal Timeline</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};
