import React, { useState } from 'react';
import {
  Calendar,
  Activity,
  FileText,
  Utensils,
  Dumbbell,
  Pill,
  Clock,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { ChronologicalTimelineGroup } from '../../types/longitudinal';

interface HealthTimelineViewProps {
  groups: ChronologicalTimelineGroup[];
  emptyMessage?: string;
}

export const HealthTimelineView: React.FC<HealthTimelineViewProps> = ({
  groups,
  emptyMessage = 'Your health events will appear here chronologically as you record symptoms, meals, cycles, and lab reports.',
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'cycle':
        return <Calendar className="w-4 h-4 text-[#FB7185]" />;
      case 'symptom':
        return <Activity className="w-4 h-4 text-amber-600" />;
      case 'report':
        return <FileText className="w-4 h-4 text-emerald-600" />;
      case 'nutrition':
        return <Utensils className="w-4 h-4 text-[#8E3EAF]" />;
      case 'fitness':
        return <Dumbbell className="w-4 h-4 text-blue-600" />;
      case 'medication':
        return <Pill className="w-4 h-4 text-indigo-600" />;
      default:
        return <Clock className="w-4 h-4 text-[#7A6A8B]" />;
    }
  };

  if (!groups || groups.length === 0) {
    return (
      <div className="p-8 rounded-[20px] bg-[#F8FAFC] border border-[#BAE6FD] text-center space-y-2">
        <Clock className="w-8 h-8 text-[#64748B] mx-auto opacity-50" />
        <h5 className="text-sm font-bold font-display text-[#0F172A]">No Timeline Events Recorded</h5>
        <p className="text-xs text-[#475569] max-w-sm mx-auto">{emptyMessage}</p>
      </div>
    );
  }

  // Filter events if category filter selected
  const filteredGroups = groups.map((g) => ({
    ...g,
    events: selectedCategory === 'all'
      ? g.events
      : g.events.filter((e) => e.category === selectedCategory),
  })).filter((g) => g.events.length > 0);

  return (
    <div className="space-y-4 text-left">
      {/* Category Filter Chips */}
      <div className="flex flex-wrap items-center gap-1.5 pb-3 border-b border-[#E2E8F0]">
        {[
          { id: 'all', label: 'All Events' },
          { id: 'cycle', label: 'Cycle' },
          { id: 'symptom', label: 'Symptoms' },
          { id: 'report', label: 'Reports' },
          { id: 'nutrition', label: 'Diet' },
          { id: 'fitness', label: 'Movement' },
          { id: 'medication', label: 'Medications' },
        ].map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3 py-1 rounded-xl text-[11px] font-mono font-semibold transition-all cursor-pointer ${
              selectedCategory === cat.id
                ? 'bg-[#0288D1] text-white shadow-xs'
                : 'bg-[#F8FAFC] text-[#475569] hover:bg-[#F0F9FF] hover:text-[#0F172A] border border-[#BAE6FD]'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Chronological Groups */}
      <div className="space-y-6">
        {filteredGroups.map((group) => (
          <div key={group.groupKey} className="space-y-2.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#0288D1]">
                {group.groupTitle}
              </span>
              <div className="flex-1 h-px bg-[#E2E8F0]" />
              <span className="text-[10px] font-mono text-[#64748B]">
                {group.events.length} event{group.events.length === 1 ? '' : 's'}
              </span>
            </div>

            <div className="space-y-2">
              {group.events.map((evt) => {
                const isExpanded = expandedEventId === evt.id;
                return (
                  <div
                    key={evt.id}
                    className="p-3.5 sm:p-4 rounded-xl bg-white hover:bg-[#F0F9FF] border border-[#BAE6FD] hover:border-[#0288D1] shadow-2xs transition-all cursor-pointer"
                    onClick={() => setExpandedEventId(isExpanded ? null : evt.id)}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-[#F8FAFC] border border-[#BAE6FD] flex items-center justify-center shrink-0">
                          {getCategoryIcon(evt.category)}
                        </div>
                        <div className="min-w-0 space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-[#0F172A] font-sans truncate">
                              {evt.title}
                            </span>
                            {evt.cyclePhase && (
                              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#E0F2FE] text-[#0288D1] border border-[#BAE6FD] shrink-0 hidden sm:inline-block font-bold">
                                Day {evt.cycleDay || 1} • {evt.cyclePhase}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-[#475569] font-sans truncate">
                            {evt.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] font-mono text-[#64748B]">
                          {evt.date}
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5 text-[#0F172A]" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-[#64748B]" />
                        )}
                      </div>
                    </div>

                    {/* Expanded Detail Panel */}
                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-[#E2E8F0] space-y-2 text-xs">
                        <p className="text-[#0F172A] font-sans leading-relaxed">{evt.description}</p>
                        <div className="flex flex-wrap gap-2 text-[10px] font-mono">
                          <span className="px-2 py-0.5 rounded bg-[#F8FAFC] border border-[#BAE6FD] text-[#475569]">
                            Source: {evt.sourceModule}
                          </span>
                          {evt.metric && (
                            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                              {evt.metric.label}: {evt.metric.value}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
