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
  Search,
  SlidersHorizontal,
  Star,
} from 'lucide-react';
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
    { label: 'Lab Reports', value: 'report', icon: FileText },
    { label: 'Medications', value: 'medication', icon: Pill },
    { label: 'Nutrition', value: 'nutrition', icon: Utensils },
    { label: 'Movement', value: 'fitness', icon: Dumbbell },
    { label: 'Appointments', value: 'appointment', icon: Stethoscope },
    { label: 'Care Circle', value: 'care_circle', icon: Users },
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
    <div className="p-5 sm:p-6 rounded-[32px] bg-white border border-[#E7DFEF] shadow-sm space-y-4 select-none">
      {/* Top Row: Date Range Buttons + Search + Milestone Toggle */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Date Range Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
          <span className="text-[11px] font-mono text-[#8D7E9E] uppercase font-bold mr-1 flex items-center gap-1 shrink-0">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Horizon:</span>
          </span>
          {dateRanges.map((range) => {
            const isSelected = filterState.dateRange === range.value;
            return (
              <button
                key={range.value}
                type="button"
                onClick={() => onFilterChange({ dateRange: range.value })}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-[#1C0D2E] text-white shadow-xs'
                    : 'bg-[#F8F5FA] text-[#584B68] hover:bg-[#EDE4F7] hover:text-[#1C1326]'
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
            <Search className="w-3.5 h-3.5 text-[#8D7E9E] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={filterState.searchQuery}
              onChange={(e) => onFilterChange({ searchQuery: e.target.value })}
              placeholder="Search health events..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs bg-[#F8F5FA] border border-[#E7DFEF] focus:outline-hidden focus:border-[#8E3EAF] text-[#1C1326] placeholder-[#8D7E9E]"
            />
          </div>

          {/* High Importance Only Toggle */}
          <button
            type="button"
            onClick={() => onFilterChange({ onlyImportant: !filterState.onlyImportant })}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer border ${
              filterState.onlyImportant
                ? 'bg-[#FEF3C7] text-[#B45309] border-[#FDE68A]'
                : 'bg-[#F8F5FA] text-[#584B68] border-[#E7DFEF] hover:bg-[#EDE4F7]'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${filterState.onlyImportant ? 'fill-[#B45309]' : ''}`} />
            <span>Key Milestones</span>
          </button>
        </div>
      </div>

      {/* Bottom Row: Category Chips with Counts */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none pt-2 border-t border-[#F0EAF5]">
        <button
          type="button"
          onClick={selectAllCategories}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            filterState.selectedCategories.length === 0
              ? 'bg-[#6E2D8B] text-white shadow-xs'
              : 'bg-[#F8F5FA] text-[#584B68] hover:bg-[#EDE4F7]'
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
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer border ${
                isSelected
                  ? 'bg-[#EDE4F7] text-[#6E2D8B] border-[#D8B4FE]'
                  : 'bg-white text-[#584B68] border-[#E7DFEF] hover:bg-[#F8F5FA]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{cat.label}</span>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                  isSelected ? 'bg-[#6E2D8B] text-white' : 'bg-[#E7DFEF] text-[#584B68]'
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
