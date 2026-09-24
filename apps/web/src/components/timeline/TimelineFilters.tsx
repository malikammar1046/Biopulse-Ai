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
  SearchLg,
  Sliders01,
  Star01,
} from '@untitledui/icons';
import type { TimelineCategory, TimelineDateRange, TimelineFilterState } from '../../types/timeline';

interface TimelineFiltersProps {
  filterState: TimelineFilterState;
  onFilterChange: (newFilters: Partial<TimelineFilterState>) => void;
  categoryCounts: Record<string, number>;
}

export const TimelineFilters: React.FC<TimelineFiltersProps> = ({
  filterState,
  onFilterChange,
  categoryCounts,
}) => {
  const dateRanges: { label: string; value: TimelineDateRange }[] = [
    { label: '7 Days', value: '7d' },
    { label: '30 Days', value: '30d' },
    { label: '90 Days', value: '90d' },
    { label: '6 Months', value: '6m' },
    { label: '1 Year', value: '1y' },
    { label: 'All Time', value: 'all' },
  ];

  const categories: { label: string; value: TimelineCategory; icon: React.FC<{ className?: string }> }[] = [
    { label: 'Cycle', value: 'cycle', icon: Calendar },
    { label: 'Symptoms', value: 'symptom', icon: Activity },
    { label: 'Lab Reports', value: 'report', icon: File06 },
    { label: 'Medications', value: 'medication', icon: MedicalCross },
    { label: 'Nutrition', value: 'nutrition', icon: Scales01 },
    { label: 'Movement', value: 'fitness', icon: ActivityHeart },
    { label: 'Appointments', value: 'appointment', icon: CalendarCheck01 },
    { label: 'Care Circle', value: 'care_circle', icon: Users01 },
  ];

  const toggleCategory = (cat: TimelineCategory) => {
    if (filterState.selectedCategories.includes(cat)) {
      onFilterChange({
        selectedCategories: filterState.selectedCategories.filter((c) => c !== cat),
      });
    } else {
      onFilterChange({
        selectedCategories: [...filterState.selectedCategories, cat],
      });
    }
  };

  const selectAllCategories = () => {
    onFilterChange({ selectedCategories: [] });
  };

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-white border border-[#BAE6FD] shadow-none space-y-4 select-none">
      {/* Top Row: Date Range Buttons + Search + Milestone Toggle */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Date Range Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
          <span className="text-[11px] font-mono text-[#64748B] uppercase font-bold mr-1 flex items-center gap-1 shrink-0">
            <Sliders01 className="w-3.5 h-3.5 text-[#0288D1]" aria-hidden="true" />
            <span>Horizon:</span>
          </span>
          {dateRanges.map((range) => {
            const isSelected = filterState.dateRange === range.value;
            return (
              <button
                key={range.value}
                type="button"
                onClick={() => onFilterChange({ dateRange: range.value })}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer border ${
                  isSelected
                    ? 'bg-[#0288D1] border-[#0288D1] text-white shadow-xs'
                    : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#475569] hover:bg-[#E0F2FE] hover:text-[#0288D1]'
                }`}
              >
                {range.label}
              </button>
            );
          })}
        </div>

        {/* Search & Importance Toggle */}
        <div className="flex items-center gap-2.5">
          {/* Search Field */}
          <div className="relative flex-1 sm:w-64">
            <SearchLg className="w-3.5 h-3.5 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
            <input
              type="text"
              value={filterState.searchQuery}
              onChange={(e) => onFilterChange({ searchQuery: e.target.value })}
              placeholder="Search health events..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs bg-[#F8FAFC] border border-[#E2E8F0] focus:outline-none focus:border-[#0288D1] text-[#0F172A] placeholder-[#94A3B8]"
            />
          </div>

          {/* High Importance Only Toggle */}
          <button
            type="button"
            onClick={() => onFilterChange({ onlyImportant: !filterState.onlyImportant })}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer border ${
              filterState.onlyImportant
                ? 'bg-amber-50 text-amber-800 border-amber-300'
                : 'bg-[#F8FAFC] text-[#475569] border-[#E2E8F0] hover:bg-[#E0F2FE]'
            }`}
          >
            <Star01 className={`w-3.5 h-3.5 ${filterState.onlyImportant ? 'fill-amber-600 text-amber-600' : 'text-[#64748B]'}`} aria-hidden="true" />
            <span>Key Milestones</span>
          </button>
        </div>
      </div>

      {/* Bottom Row: Category Chips with Counts */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none pt-2 border-t border-[#E2E8F0]">
        <button
          type="button"
          onClick={selectAllCategories}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer border ${
            filterState.selectedCategories.length === 0
              ? 'bg-[#0288D1] border-[#0288D1] text-white shadow-xs'
              : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#475569] hover:bg-[#E0F2FE] hover:text-[#0288D1]'
          }`}
        >
          All Signals ({categoryCounts.all || 0})
        </button>

        {categories.map((cat) => {
          const isSelected = filterState.selectedCategories.includes(cat.value);
          const Icon = cat.icon;
          const count = categoryCounts[cat.value] || 0;

          return (
            <button
              key={cat.value}
              type="button"
              onClick={() => toggleCategory(cat.value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer border ${
                isSelected
                  ? 'bg-[#E0F2FE] text-[#01579B] border-[#0288D1]'
                  : 'bg-white text-[#475569] border-[#E2E8F0] hover:bg-[#F8FAFC]'
              }`}
            >
              <Icon className="w-3.5 h-3.5 text-[#0288D1]" />
              <span>{cat.label}</span>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                  isSelected ? 'bg-[#0288D1] text-white' : 'bg-[#E2E8F0] text-[#475569]'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
