import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Calendar,
  Activity,
  FileText,
  Pill,
  Utensils,
  Dumbbell,
  Stethoscope,
  Users,
  ExternalLink,
  Clock,
  Sparkles,
} from 'lucide-react';
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
        return <Calendar className="w-5 h-5 text-[#E11D48]" />;
      case 'symptom':
        return <Activity className="w-5 h-5 text-[#6E2D8B]" />;
      case 'report':
        return <FileText className="w-5 h-5 text-[#2563EB]" />;
      case 'medication':
        return <Pill className="w-5 h-5 text-[#D97706]" />;
      case 'nutrition':
        return <Utensils className="w-5 h-5 text-[#059669]" />;
      case 'fitness':
        return <Dumbbell className="w-5 h-5 text-[#DB2777]" />;
      case 'appointment':
        return <Stethoscope className="w-5 h-5 text-[#7C3AED]" />;
      case 'care_circle':
      default:
        return <Users className="w-5 h-5 text-[#0284C7]" />;
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#10071A]/70 backdrop-blur-xs select-none">
      <div className="relative w-full max-w-lg rounded-[36px] bg-white border border-[#E7DFEF] shadow-2xl p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-200 text-left">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full text-[#8D7E9E] hover:text-[#1C1326] hover:bg-[#F8F5FA] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with Icon & Category */}
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-2xl bg-[#F8F5FA] border border-[#E7DFEF] shrink-0">
            {getCategoryIcon(event.category)}
          </div>

          <div className="space-y-1 pr-6">
            <span className="text-[10px] font-mono text-[#8D7E9E] uppercase font-bold tracking-wider">
              {event.sourceModule} • {event.category.toUpperCase()}
            </span>
            <h2 className="text-lg sm:text-xl font-bold font-display text-[#1C1326] leading-snug">
              {event.title}
            </h2>
          </div>
        </div>

        {/* Meta Pills: Date, Time, Cycle Day, Metric */}
        <div className="p-4 rounded-2xl bg-[#FAF5FF] border border-[#EDE4F7] flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-[#1C1326] font-semibold">
            <Calendar className="w-3.5 h-3.5 text-[#6E2D8B]" />
            <span>{formattedDate}</span>
          </div>

          {event.time && (
            <div className="flex items-center gap-1.5 text-[#584B68]">
              <Clock className="w-3.5 h-3.5 text-[#8D7E9E]" />
              <span>{event.time}</span>
            </div>
          )}

          {event.cycleDay && (
            <span className="px-2.5 py-1 rounded-full bg-[#EDE4F7] text-[#6E2D8B] font-mono font-bold text-[10px]">
              Cycle Day {event.cycleDay} {event.cyclePhase ? `(${event.cyclePhase})` : ''}
            </span>
          )}

          {event.metric && (
            <div className="px-2.5 py-1 rounded-xl bg-white border border-[#E7DFEF] font-mono font-bold text-[#1C1326]">
              <span className="text-[10px] text-[#8D7E9E] mr-1">{event.metric.label}:</span>
              <span>{event.metric.value}</span>
            </div>
          )}
        </div>

        {/* Description & Clinical Context */}
        <div className="space-y-2">
          <span className="text-[10px] font-mono uppercase font-bold text-[#8D7E9E]">
            Event Summary & Record
          </span>
          <p className="text-xs sm:text-sm text-[#1C1326] leading-relaxed bg-[#F8F5FA] p-4 rounded-2xl border border-[#E7DFEF]">
            {event.description}
          </p>
        </div>

        {/* Metadata Details if present */}
        {event.metadata && Object.keys(event.metadata).length > 0 && (
          <div className="space-y-2">
            <span className="text-[10px] font-mono uppercase font-bold text-[#8D7E9E]">
              Additional Health Attributes
            </span>
            <div className="p-3 rounded-xl bg-white border border-[#E7DFEF] space-y-1 text-xs">
              {Object.entries(event.metadata).map(([k, v]) => {
                if (v === undefined || v === null || Array.isArray(v) && v.length === 0) return null;
                const displayVal = Array.isArray(v) ? v.join(', ') : typeof v === 'object' ? JSON.stringify(v) : String(v);
                return (
                  <div key={k} className="flex items-center justify-between text-[#584B68]">
                    <span className="capitalize text-[#8D7E9E]">{k.replace(/([A-Z])/g, ' $1')}:</span>
                    <span className="font-semibold text-[#1C1326]">{displayVal}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Educational Safe Guard Notice */}
        <div className="p-3.5 rounded-2xl bg-[#FFFBEB] border border-[#FEF3C7] flex items-start gap-2.5 text-xs text-[#B45309]">
          <Sparkles className="w-4 h-4 shrink-0 text-[#D97706] mt-0.5" />
          <p className="text-[11px] leading-relaxed">
            Longitudinal records help build patterns for discussion with your healthcare provider. OvaSense provides educational synthesis, not clinical diagnosis.
          </p>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between gap-3 pt-2 border-t border-[#F0EAF5]">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-2xl text-xs font-bold text-[#584B68] bg-[#F8F5FA] hover:bg-[#EDE4F7] transition-all cursor-pointer"
          >
            Close
          </button>

          <button
            type="button"
            onClick={handleNavigateToSource}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold text-white bg-gradient-to-r from-[#6E2D8B] to-[#8E3EAF] hover:brightness-110 shadow-xs transition-all cursor-pointer"
          >
            <span>Open in {event.sourceModule}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
