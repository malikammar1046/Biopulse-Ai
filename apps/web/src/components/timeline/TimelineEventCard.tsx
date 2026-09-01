import React from 'react';
import {
  Calendar,
  Activity,
  FileText,
  Pill,
  Utensils,
  Dumbbell,
  Stethoscope,
  Users,
  ChevronRight,
  Star,
  Clock,
} from 'lucide-react';
import type { TimelineEvent, TimelineCategory } from '../../types/timeline';

interface TimelineEventCardProps {
  event: TimelineEvent;
  isFirst?: boolean;
  isLast?: boolean;
  onClick: () => void;
}

export const TimelineEventCard: React.FC<TimelineEventCardProps> = ({
  event,
  isLast,
  onClick,
}) => {
  const getCategoryTheme = (cat: TimelineCategory) => {
    switch (cat) {
      case 'cycle':
        return {
          icon: Calendar,
          iconBg: 'bg-[#FFE4E6]',
          iconColor: 'text-[#E11D48]',
          badgeBg: 'bg-[#FFF1F2]',
          badgeText: 'text-[#BE123C]',
        };
      case 'symptom':
        return {
          icon: Activity,
          iconBg: 'bg-[#EDE4F7]',
          iconColor: 'text-[#6E2D8B]',
          badgeBg: 'bg-[#F5F0FA]',
          badgeText: 'text-[#6E2D8B]',
        };
      case 'report':
        return {
          icon: FileText,
          iconBg: 'bg-[#DBEAFE]',
          iconColor: 'text-[#2563EB]',
          badgeBg: 'bg-[#EFF6FF]',
          badgeText: 'text-[#1D4ED8]',
        };
      case 'medication':
        return {
          icon: Pill,
          iconBg: 'bg-[#FEF3C7]',
          iconColor: 'text-[#D97706]',
          badgeBg: 'bg-[#FFFBEB]',
          badgeText: 'text-[#B45309]',
        };
      case 'nutrition':
        return {
          icon: Utensils,
          iconBg: 'bg-[#D1FAE5]',
          iconColor: 'text-[#059669]',
          badgeBg: 'bg-[#ECFDF5]',
          badgeText: 'text-[#047857]',
        };
      case 'fitness':
        return {
          icon: Dumbbell,
          iconBg: 'bg-[#FCE7F3]',
          iconColor: 'text-[#DB2777]',
          badgeBg: 'bg-[#FDF2F8]',
          badgeText: 'text-[#BE185D]',
        };
      case 'appointment':
        return {
          icon: Stethoscope,
          iconBg: 'bg-[#EDE9FE]',
          iconColor: 'text-[#7C3AED]',
          badgeBg: 'bg-[#FAF5FF]',
          badgeText: 'text-[#6D28D9]',
        };
      case 'care_circle':
      default:
        return {
          icon: Users,
          iconBg: 'bg-[#E0F2FE]',
          iconColor: 'text-[#0284C7]',
          badgeBg: 'bg-[#F0F9FF]',
          badgeText: 'text-[#0369A1]',
        };
    }
  };

  const theme = getCategoryTheme(event.category);
  const Icon = theme.icon;
  const isHighImportance = event.importance === 'high';

  // Format date display
  const eventDate = new Date(event.date);
  const formattedDate = eventDate.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="relative flex items-start gap-4 sm:gap-6 group">
      {/* Left Timeline Spine & Node */}
      <div className="flex flex-col items-center shrink-0 self-stretch">
        <div
          className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-xs transition-transform group-hover:scale-105 ${theme.iconBg} ${theme.iconColor} z-10`}
        >
          <Icon className="w-5 h-5" />
        </div>

        {/* Vertical line connecting to next node */}
        {!isLast && (
          <div className="w-0.5 flex-1 bg-gradient-to-b from-[#E7DFEF] to-[#F0EAF5] my-1" />
        )}
      </div>

      {/* Main Event Content Card */}
      <div
        onClick={onClick}
        className={`flex-1 mb-5 p-5 sm:p-6 rounded-[28px] bg-white border transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md hover:-translate-y-0.5 text-left select-none ${
          isHighImportance
            ? 'border-[#D8B4FE] hover:border-[#8E3EAF] ring-1 ring-[#EDE4F7]'
            : 'border-[#E7DFEF] hover:border-[#D8B4FE]'
        }`}
      >
        {/* Top Header Meta: Date, Time, Cycle Phase, High Importance Star */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-bold text-[#1C1326] font-display">
              {formattedDate}
            </span>

            {event.time && (
              <span className="text-[11px] font-mono text-[#8D7E9E] flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{event.time}</span>
              </span>
            )}

            {event.cycleDay && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${theme.badgeBg} ${theme.badgeText}`}>
                CD {event.cycleDay} {event.cyclePhase ? `• ${event.cyclePhase}` : ''}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isHighImportance && (
              <span className="flex items-center gap-1 text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-[#FEF3C7] text-[#B45309]">
                <Star className="w-3 h-3 fill-[#B45309]" />
                <span>Key Event</span>
              </span>
            )}

            <span className="text-[10px] font-mono text-[#8D7E9E] bg-[#F8F5FA] px-2 py-0.5 rounded-lg">
              {event.sourceModule}
            </span>
          </div>
        </div>

        {/* Event Title & Metric Pill */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
          <h3 className="text-sm sm:text-base font-bold text-[#1C1326] font-display group-hover:text-[#6E2D8B] transition-colors">
            {event.title}
          </h3>

          {event.metric && (
            <div
              className={`px-2.5 py-1 rounded-xl text-xs font-mono font-bold w-fit ${
                event.metric.status === 'attention' || event.metric.status === 'warning'
                  ? 'bg-[#FFF1F2] text-[#BE123C] border border-[#FFE4E6]'
                  : event.metric.status === 'positive'
                  ? 'bg-[#ECFDF5] text-[#047857] border border-[#D1FAE5]'
                  : 'bg-[#F8F5FA] text-[#584B68] border border-[#E7DFEF]'
              }`}
            >
              <span className="text-[10px] opacity-75 mr-1.5">{event.metric.label}:</span>
              <span>{event.metric.value}</span>
            </div>
          )}
        </div>

        {/* Short Description */}
        <p className="text-xs text-[#584B68] leading-relaxed line-clamp-2">
          {event.description}
        </p>

        {/* Bottom Clickable Hint */}
        <div className="mt-3 pt-2.5 border-t border-[#F0EAF5] flex items-center justify-between text-[11px] text-[#8D7E9E]">
          <span>Click to view longitudinal details</span>
          <div className="flex items-center gap-0.5 text-[#6E2D8B] font-bold group-hover:translate-x-1 transition-transform">
            <span>Details</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    </div>
  );
};
