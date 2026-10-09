import React from 'react';
import {
  SearchMd,
  FilterFunnel01,
  XClose,
  ChevronDown,
  RefreshCw01,
} from '@untitledui/icons';

export interface SpecialistFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  specialtyFilter: string;
  onSpecialtyChange: (specialty: string) => void;
  availableSpecialties: string[];
  consultationTypeFilter: string;
  onConsultationTypeChange: (type: string) => void;
  sortBy: 'recommended' | 'experience' | 'fee-asc' | 'fee-desc' | 'rating' | 'name';
  onSortChange: (sort: 'recommended' | 'experience' | 'fee-asc' | 'fee-desc' | 'rating' | 'name') => void;
  onResetFilters: () => void;
  totalFilteredCount: number;
  isFemale?: boolean;
}

export const SpecialistFilters: React.FC<SpecialistFiltersProps> = ({
  searchQuery,
  onSearchChange,
  specialtyFilter,
  onSpecialtyChange,
  availableSpecialties,
  consultationTypeFilter,
  onConsultationTypeChange,
  sortBy,
  onSortChange,
  onResetFilters,
  totalFilteredCount,
  isFemale = false,
}) => {
  const focusRing = isFemale
    ? 'focus:ring-[#F43F7D]/20 focus:border-[#F43F7D]'
    : 'focus:ring-[#0288D1]/20 focus:border-[#0288D1]';
  const resetBtnClass = isFemale
    ? 'text-[#F43F7D] hover:text-[#DC326C]'
    : 'text-[#0288D1] hover:text-[#0277BD]';

  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    specialtyFilter !== 'all' ||
    consultationTypeFilter !== 'all' ||
    sortBy !== 'recommended';

  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#EAECF0] p-4 sm:p-5 shadow-xs space-y-4 text-left select-none">
      {/* Row 1: Search & Sort Controls */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <SearchMd className="w-4 h-4 text-[#98A2B3] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by doctor name, specialty, or clinic area (e.g. Shadman, Lahore)..."
            className={`w-full pl-10 pr-9 py-2.5 rounded-xl bg-[#F8FAFC] border border-[#D0D5DD] text-xs sm:text-sm font-medium text-[#111318] placeholder:text-[#98A2B3] focus:outline-none focus:ring-2 ${focusRing} transition-all`}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#98A2B3] hover:text-[#111318] p-0.5 rounded cursor-pointer"
              aria-label="Clear search"
            >
              <XClose className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Right: Results Count & Sort Dropdown */}
        <div className="flex items-center justify-between md:justify-end gap-3 shrink-0">
          <span className="text-xs text-[#667085] font-medium">
            Showing <strong className="text-[#111318] font-bold">{totalFilteredCount}</strong> specialists
          </span>

          <div className="relative inline-flex items-center">
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value as any)}
              className={`appearance-none pl-3 pr-8 py-2 rounded-xl bg-[#F8FAFC] border border-[#D0D5DD] text-xs font-semibold text-[#344054] focus:outline-none focus:ring-2 ${focusRing} cursor-pointer`}
              aria-label="Sort specialists"
            >
              <option value="recommended">Sort: Relevant to Pathway</option>
              <option value="experience">Experience (Highest)</option>
              <option value="fee-asc">Consultation Fee (Low to High)</option>
              <option value="fee-desc">Consultation Fee (High to Low)</option>
              <option value="rating">Top Rated (Verified)</option>
              <option value="name">Name (A-Z)</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[#667085] absolute right-2.5 pointer-events-none" aria-hidden="true" />
          </div>
        </div>
      </div>

      {/* Row 2: Specialty & Consultation Filters */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pt-3 border-t border-[#F2F4F7]">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-[#667085] flex items-center gap-1 mr-1">
            <FilterFunnel01 className="w-3.5 h-3.5 text-[#98A2B3]" aria-hidden="true" />
            Specialty:
          </span>

          <button
            type="button"
            onClick={() => onSpecialtyChange('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              specialtyFilter === 'all'
                ? 'bg-[#111318] text-white shadow-2xs'
                : 'bg-[#F8FAFC] text-[#475569] hover:bg-slate-100 border border-[#EAECF0]'
            }`}
          >
            All Specialties
          </button>

          {availableSpecialties.map((spec) => (
            <button
              key={spec}
              type="button"
              onClick={() => onSpecialtyChange(spec)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                specialtyFilter.toLowerCase() === spec.toLowerCase()
                  ? 'bg-[#111318] text-white shadow-2xs'
                  : 'bg-[#F8FAFC] text-[#475569] hover:bg-slate-100 border border-[#EAECF0]'
              }`}
            >
              {spec}
            </button>
          ))}

          {/* Consultation Type Toggle */}
          <div className="hidden sm:flex items-center gap-1.5 ml-2 pl-2 border-l border-[#EAECF0]">
            <span className="text-xs text-[#667085] font-medium">Type:</span>
            <select
              value={consultationTypeFilter}
              onChange={(e) => onConsultationTypeChange(e.target.value)}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-[#F8FAFC] border border-[#D0D5DD] text-[#344054] cursor-pointer"
            >
              <option value="all">All Modes</option>
              <option value="video">Online Video</option>
              <option value="clinic">In-Clinic Visit</option>
            </select>
          </div>
        </div>

        {/* Reset Filter Button */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className={`inline-flex items-center gap-1.5 text-xs font-semibold ${resetBtnClass} cursor-pointer p-1 rounded-lg`}
          >
            <RefreshCw01 className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Reset Filters</span>
          </button>
        )}
      </div>
    </div>
  );
};
