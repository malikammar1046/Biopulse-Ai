import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  XClose,
  Calendar,
  Activity,
  File06,
  MedicalCross,
  Scales01,
  ActivityHeart,
  CalendarCheck01,
  Users01,
  LinkExternal01,
  Clock,
  InfoCircle,
} from '@untitledui/icons';
import type { TimelineEvent, TimelineCategory } from '../../types/timeline';
import { ROUTES } from '../../constants/routes';

interface TimelineDetailModalProps {
  event: TimelineEvent | null;
  isOpen: boolean;
  onClose: () => void;
}

export const TimelineDetailModal: React.FC<TimelineDetailModalProps> = ({
  event,
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate();

  if (!isOpen || !event) return null;

  const getCategoryIcon = (cat: TimelineCategory) => {
    switch (cat) {
      case 'cycle':
        return <Calendar className="w-5 h-5 text-[#0288D1]" aria-hidden="true" />;
      case 'symptom':
        return <Activity className="w-5 h-5 text-[#0288D1]" aria-hidden="true" />;
      case 'report':
        return <File06 className="w-5 h-5 text-[#0288D1]" aria-hidden="true" />;
      case 'medication':
        return <MedicalCross className="w-5 h-5 text-amber-600" aria-hidden="true" />;
      case 'nutrition':
        return <Scales01 className="w-5 h-5 text-emerald-600" aria-hidden="true" />;
      case 'fitness':
        return <ActivityHeart className="w-5 h-5 text-sky-600" aria-hidden="true" />;
      case 'appointment':
        return <CalendarCheck01 className="w-5 h-5 text-[#01579B]" aria-hidden="true" />;
      case 'care_circle':
      default:
        return <Users01 className="w-5 h-5 text-[#0288D1]" aria-hidden="true" />;
    }
  };

  const getSourceRoute = (cat: TimelineCategory) => {
    switch (cat) {
      case 'cycle':
        return ROUTES.APP.CYCLE;
      case 'symptom':
        return ROUTES.APP.SYMPTOMS;
      case 'report':
        return ROUTES.APP.REPORTS;
      case 'medication':
        return ROUTES.APP.MEDICATIONS;
      case 'nutrition':
        return ROUTES.APP.DIET;
      case 'fitness':
        return ROUTES.APP.FITNESS;
      case 'appointment':
        return ROUTES.APP.APPOINTMENTS;
      case 'care_circle':
      default:
        return ROUTES.APP.CARE_CIRCLE;
    }
  };

  const handleNavigateToSource = () => {
    const route = getSourceRoute(event.category);
    onClose();
    navigate(route);
  };

  const formattedDate = new Date(event.date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs select-none">
      <div className="relative w-full max-w-lg rounded-2xl bg-white border border-[#BAE6FD] shadow-xl p-6 sm:p-7 space-y-5 animate-in fade-in zoom-in-95 duration-200 text-left">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close details"
          className="absolute top-5 right-5 p-2 rounded-xl text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] transition-colors cursor-pointer"
        >
          <XClose className="w-5 h-5" aria-hidden="true" />
        </button>

        {/* Header with Icon & Category */}
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] shrink-0">
            {getCategoryIcon(event.category)}
          </div>

          <div className="space-y-0.5 pr-6">
            <span className="text-[10px] font-mono text-[#64748B] uppercase font-bold tracking-wider">
              {event.sourceModule} • {event.category.toUpperCase()}
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-[#0F172A] leading-snug">
              {event.title}
            </h2>
          </div>
        </div>

        {/* Meta Pills: Date, Time, Cycle Day, Metric */}
        <div className="p-3.5 rounded-xl bg-[#F0F9FF] border border-[#BAE6FD] flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-[#0F172A] font-semibold">
            <Calendar className="w-3.5 h-3.5 text-[#0288D1]" aria-hidden="true" />
            <span>{formattedDate}</span>
          </div>

          {event.time && (
            <div className="flex items-center gap-1.5 text-[#64748B]">
              <Clock className="w-3.5 h-3.5 text-[#64748B]" aria-hidden="true" />
              <span>{event.time}</span>
            </div>
          )}

          {event.cycleDay && (
            <span className="px-2.5 py-0.5 rounded-full bg-[#E0F2FE] text-[#01579B] font-mono font-bold text-[10px]">
              Cycle Day {event.cycleDay} {event.cyclePhase ? `(${event.cyclePhase})` : ''}
            </span>
          )}

          {event.metric && (
            <div className="px-2.5 py-0.5 rounded-lg bg-white border border-[#E2E8F0] font-mono font-bold text-[#0F172A]">
              <span className="text-[10px] text-[#64748B] mr-1">{event.metric.label}:</span>
              <span>{event.metric.value}</span>
            </div>
          )}
        </div>

        {/* Description & Clinical Context */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-mono uppercase font-bold text-[#64748B]">
            Event Summary & Record
          </span>
          <p className="text-xs sm:text-sm text-[#0F172A] leading-relaxed bg-[#F8FAFC] p-3.5 rounded-xl border border-[#E2E8F0]">
            {event.description}
          </p>
        </div>

        {/* Metadata Details if present */}
        {event.metadata && Object.keys(event.metadata).length > 0 && (
          <div className="space-y-1.5">
            <span className="text-[10px] font-mono uppercase font-bold text-[#64748B]">
              Additional Health Attributes
            </span>
            <div className="p-3 rounded-xl bg-white border border-[#E2E8F0] space-y-1 text-xs">
              {Object.entries(event.metadata).map(([k, v]) => {
                if (v === undefined || v === null || (Array.isArray(v) && v.length === 0)) return null;
                const displayVal = Array.isArray(v) ? v.join(', ') : typeof v === 'object' ? JSON.stringify(v) : String(v);
                return (
                  <div key={k} className="flex items-center justify-between text-[#475569]">
                    <span className="capitalize text-[#64748B]">{k.replace(/([A-Z])/g, ' $1')}:</span>
                    <span className="font-semibold text-[#0F172A]">{displayVal}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Educational Safe Guard Notice */}
        <div className="p-3 rounded-xl bg-[#F0F9FF] border border-[#BAE6FD] flex items-start gap-2 text-xs text-[#01579B]">
          <InfoCircle className="w-4 h-4 shrink-0 text-[#0288D1] mt-0.5" aria-hidden="true" />
          <p className="text-[11px] leading-relaxed">
            Longitudinal records help build patterns for discussion with your healthcare provider. BIOPulse AI provides educational synthesis, not clinical diagnosis.
          </p>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between gap-3 pt-2 border-t border-[#E2E8F0]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-[#64748B] bg-[#F8FAFC] border border-[#E2E8F0] hover:bg-[#E0F2FE] hover:text-[#0288D1] transition-all cursor-pointer"
          >
            Close
          </button>

          <button
            type="button"
            onClick={handleNavigateToSource}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#0288D1] hover:bg-[#0277BD] shadow-sm transition-all cursor-pointer"
          >
            <span>Open in {event.sourceModule}</span>
            <LinkExternal01 className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
};
