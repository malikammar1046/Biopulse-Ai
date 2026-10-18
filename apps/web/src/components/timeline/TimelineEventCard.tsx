import React from 'react';
import {
  Calendar,
  Activity,
  File06,
  MedicalCross,
  Scales01,
  ActivityHeart,
  CalendarCheck01,
  Users01,
  ChevronRight,
  Star01,
  Clock,
} from '@untitledui/icons';
import type { TimelineEvent, TimelineCategory } from '../../types/timeline';

interface TimelineEventCardProps {
  event: TimelineEvent;
  isFirst?: boolean;
  isLast?: boolean;
  onClick: () => void;
  isFemale?: boolean;
}

export const TimelineEventCard: React.FC<TimelineEventCardProps> = ({
  event,
  isLast,
  onClick,
  isFemale = false,
}) => {
  const getCategoryTheme = (cat: TimelineCategory) => {
    switch (cat) {
      case 'cycle':
        return {
          icon: Calendar,
          iconBg: isFemale ? 'bg-[#FDE6EF]' : 'bg-[#F0F9FF]',
          iconColor: isFemale ? 'text-[#F43F7D]' : 'text-[#0288D1]',
          badgeBg: isFemale ? 'bg-[#FDE6EF]' : 'bg-[#E0F2FE]',
          badgeText: isFemale ? 'text-[#BE185D]' : 'text-[#01579B]',
        };
      case 'symptom':
        return {
          icon: Activity,
          iconBg: isFemale ? 'bg-[#FDE6EF]' : 'bg-[#F0F9FF]',
          iconColor: isFemale ? 'text-[#F43F7D]' : 'text-[#0288D1]',
          badgeBg: isFemale ? 'bg-[#FDE6EF]' : 'bg-[#E0F2FE]',
          badgeText: isFemale ? 'text-[#BE185D]' : 'text-[#0288D1]',
        };
      case 'report':
        return {
          icon: File06,
          iconBg: isFemale ? 'bg-[#FDE6EF]' : 'bg-[#F0F9FF]',
          iconColor: isFemale ? 'text-[#F43F7D]' : 'text-[#0288D1]',
          badgeBg: isFemale ? 'bg-[#FDE6EF]' : 'bg-[#E0F2FE]',
          badgeText: isFemale ? 'text-[#BE185D]' : 'text-[#0288D1]',
        };
      case 'medication':
        return {
          icon: MedicalCross,
          iconBg: 'bg-amber-50',
          iconColor: 'text-amber-700',
          badgeBg: 'bg-amber-50',
          badgeText: 'text-amber-800',
        };
      case 'nutrition':
        return {
          icon: Scales01,
          iconBg: 'bg-emerald-50',
          iconColor: 'text-emerald-700',
          badgeBg: 'bg-emerald-50',
          badgeText: 'text-emerald-800',
        };
      case 'fitness':
        return {
          icon: ActivityHeart,
          iconBg: 'bg-sky-50',
          iconColor: 'text-sky-700',
          badgeBg: 'bg-sky-50',
          badgeText: 'text-sky-800',
        };
      case 'appointment':
        return {
          icon: CalendarCheck01,
          iconBg: 'bg-[#F0F9FF]',
          iconColor: 'text-[#01579B]',
          badgeBg: 'bg-[#E0F2FE]',
          badgeText: 'text-[#01579B]',
        };
      case 'care_circle':
      default:
        return {
          icon: Users01,
          iconBg: 'bg-[#F0F9FF]',
          iconColor: 'text-[#0284C7]',
          badgeBg: 'bg-[#E0F2FE]',
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
          <div className={`w-0.5 flex-1 ${isFemale ? 'bg-[#FDE6EF]' : 'bg-[#BAE6FD]'} my-1`} />
        )}
      </div>

      {/* Main Event Content Card */}
      <div
        onClick={onClick}
        className={`flex-1 mb-5 p-5 sm:p-6 rounded-2xl bg-white border transition-all duration-200 cursor-pointer shadow-none ${
          isFemale ? 'hover:border-[#F43F7D]' : 'hover:border-[#0288D1]'
        } text-left select-none ${
          isHighImportance
            ? isFemale
              ? 'border-[#F43F7D] ring-1 ring-[#FDE6EF]'
              : 'border-[#0288D1] ring-1 ring-[#BAE6FD]'
            : isFemale
            ? 'border-[#FDE6EF]'
            : 'border-[#BAE6FD]'
        }`}
      >
        {/* Top Header Meta: Date, Time, Cycle Phase, High Importance Star */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-bold text-[#0F172A]">
              {formattedDate}
            </span>

            {event.time && (
              <span className="text-[11px] font-mono text-[#64748B] flex items-center gap-1">
                <Clock className="w-3 h-3" aria-hidden="true" />
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
              <span className="flex items-center gap-1 text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                <Star01 className="w-3 h-3 fill-amber-600 text-amber-600" aria-hidden="true" />
                <span>Key Event</span>
              </span>
            )}

            <span className="text-[10px] font-mono text-[#64748B] bg-[#F8FAFC] px-2 py-0.5 rounded-lg border border-[#E2E8F0]">
              {event.sourceModule}
            </span>
          </div>
        </div>

        {/* Event Title & Metric Pill */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
          <h3
            className={`text-sm sm:text-base font-bold text-[#0F172A] ${
              isFemale ? 'group-hover:text-[#F43F7D]' : 'group-hover:text-[#0288D1]'
            } transition-colors`}
          >
            {event.title}
          </h3>

          {event.metric && (
            <div
              className={`px-2.5 py-1 rounded-xl text-xs font-mono font-bold w-fit ${
                event.metric.status === 'attention' || event.metric.status === 'warning'
                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                  : event.metric.status === 'positive'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-[#F8FAFC] text-[#475569] border border-[#E2E8F0]'
              }`}
            >
              <span className="text-[10px] opacity-75 mr-1.5">{event.metric.label}:</span>
              <span>{event.metric.value}</span>
            </div>
          )}
        </div>

        {/* Short Description */}
        <p className="text-xs text-[#475569] leading-relaxed line-clamp-2">
          {event.description}
        </p>

        {/* Bottom Clickable Hint */}
        <div className="mt-3 pt-2.5 border-t border-[#E2E8F0] flex items-center justify-between text-[11px] text-[#64748B]">
          <span>Click to view longitudinal details</span>
          <div
            className={`flex items-center gap-0.5 ${
              isFemale ? 'text-[#F43F7D]' : 'text-[#0288D1]'
            } font-semibold group-hover:translate-x-1 transition-transform`}
          >
            <span>Details</span>
            <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
          </div>
        </div>
      </div>
    </div>
  );
};
