import React, { useState, useMemo } from 'react';
import {
  MedicalCircle,
  AlertCircle,
  RefreshCw01,
  SearchMd,
} from '@untitledui/icons';
import { useDoctors } from '../../services/doctorService';
import type { Doctor } from '../../types/doctor';
import { SpecialistCard } from './SpecialistCard';
import { SpecialistFilters } from './SpecialistFilters';
import { SpecialistProfileModal } from './SpecialistProfileModal';
import {
  getRelevantDoctorsForPathway,
} from '../../utils/doctorPathway';

export interface SpecialistDirectoryProps {
  pathway: 'female' | 'male' | string;
  onBookDoctor: (doctor: Doctor) => void;
}

export const SpecialistDirectory: React.FC<SpecialistDirectoryProps> = ({
  pathway,
  onBookDoctor,
}) => {
  const isFemale = pathway === 'female';
  const defaultPathwayParam = isFemale ? 'female_pcos' : 'male_hypogonadism';

  // Fetch doctors from backend with strict pathway isolation
  const { doctors, loading, error, refetch } = useDoctors({
    pathway: defaultPathwayParam,
    strict: true,
  });

  // Filter & sort states
  const [searchQuery, setSearchQuery] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState('all');
  const [consultationTypeFilter, setConsultationTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'recommended' | 'experience' | 'fee-asc' | 'fee-desc' | 'rating' | 'name'>('recommended');

  // Profile modal state
  const [profileDoctor, setProfileDoctor] = useState<Doctor | null>(null);

  // Extract distinct specialties from loaded doctors
  const availableSpecialties = useMemo(() => {
    const specs = new Set<string>();
    for (const doc of doctors) {
      if (doc.specialty) {
        // Extract main specialty term
        const parts = doc.specialty.split(/[,/•&]/).map((p) => p.trim());
        for (const p of parts) {
          if (p.length > 3 && p.length < 30) {
            specs.add(p);
          }
        }
      }
    }
    return Array.from(specs).slice(0, 5);
  }, [doctors]);

  // Filtered & sorted doctor list
  const filteredDoctors = useMemo(() => {
    let result = getRelevantDoctorsForPathway(doctors, pathway, {
      strict: true, // Strict clinical relevance for authenticated patient experience
      searchQuery,
      specialtyFilter,
      sortBy,
    });

    if (consultationTypeFilter === 'video') {
      result = result.filter(
        (d) =>
          d.location?.toLowerCase().includes('video') ||
          d.services_offered?.toLowerCase().includes('video') ||
          d.short_bio?.toLowerCase().includes('video')
      );
    } else if (consultationTypeFilter === 'clinic') {
      result = result.filter(
        (d) =>
          !d.location?.toLowerCase().includes('video only')
      );
    }

    return result;
  }, [doctors, pathway, searchQuery, specialtyFilter, consultationTypeFilter, sortBy]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSpecialtyFilter('all');
    setConsultationTypeFilter('all');
    setSortBy('recommended');
  };

  const headerBadgeBg = isFemale ? '#FDE6EF' : '#E1F5FE';
  const headerBadgeBorder = isFemale ? 'border-pink-200/80' : 'border-sky-200/80';
  const headerBadgeText = isFemale ? 'text-[#BE185D]' : 'text-[#0288D1]';

  return (
    <div className="space-y-6 text-left select-none">
      {/* ── 1. Contextual Pathway Header Banner ── */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white border border-[#EAECF0] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${headerBadgeBorder} ${headerBadgeText}`}
              style={{ backgroundColor: headerBadgeBg }}
            >
              <MedicalCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>{isFemale ? 'OvaSense PCOS Network' : 'AndroSense Men’s Health'}</span>
            </span>
            <span className="text-xs text-[#667085]">Verified Clinical Specialists</span>
          </div>

          <h2 className="text-lg sm:text-xl font-bold text-[#111318] font-display">
            {isFemale ? 'PCOS & Reproductive Health Specialists' : 'Male Hormone & Andrology Specialists'}
          </h2>

          <p className="text-xs sm:text-sm text-[#475569] max-w-2xl leading-relaxed">
            {isFemale
              ? 'Connect with clinicians experienced in polycystic ovary syndrome, cycle irregularity, and reproductive endocrinology.'
              : 'Connect with clinicians experienced in male hypogonadism, androgen evaluation, and endocrine vitality.'}
          </p>
        </div>

        <div className="shrink-0 self-start sm:self-center">
          <span className="px-3.5 py-1.5 rounded-xl bg-[#F8FAFC] border border-[#EAECF0] text-xs font-mono font-semibold text-[#344054]">
            {filteredDoctors.length} {filteredDoctors.length === 1 ? 'Doctor' : 'Doctors'} Available
          </span>
        </div>
      </div>

      {/* ── 2. Filter Controls ── */}
      <SpecialistFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        specialtyFilter={specialtyFilter}
        onSpecialtyChange={setSpecialtyFilter}
        availableSpecialties={availableSpecialties}
        consultationTypeFilter={consultationTypeFilter}
        onConsultationTypeChange={setConsultationTypeFilter}
        sortBy={sortBy}
        onSortChange={setSortBy}
        onResetFilters={handleResetFilters}
        totalFilteredCount={filteredDoctors.length}
      />

      {/* ── 3. Doctor Cards Grid / Loading / Error / Empty States ── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-6 rounded-3xl bg-white border border-[#EAECF0] space-y-4 animate-pulse"
            >
              <div className="flex items-center justify-between">
                <div className="w-24 h-5 rounded-full bg-slate-100" />
                <div className="w-20 h-4 rounded bg-slate-100" />
              </div>
              <div className="flex items-start gap-4">
                <div className="w-18 h-18 rounded-2xl bg-slate-200 shrink-0" />
                <div className="space-y-2 flex-1">
                  <div className="w-32 h-5 rounded bg-slate-200" />
                  <div className="w-40 h-4 rounded bg-slate-100" />
                  <div className="w-24 h-3 rounded bg-slate-100" />
                </div>
              </div>
              <div className="w-full h-12 rounded-xl bg-slate-100" />
              <div className="w-full h-10 rounded-xl bg-slate-200 mt-4" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="p-8 sm:p-10 rounded-3xl bg-white border border-[#EAECF0] text-center space-y-4 shadow-xs">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center">
            <AlertCircle className="w-6 h-6" aria-hidden="true" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-base font-bold text-[#111318]">
              We couldn't load specialists
            </h3>
            <p className="text-xs text-[#667085]">
              There was an issue connecting to the medical directory. Please check your network and retry.
            </p>
          </div>
          <button
            type="button"
            onClick={() => refetch()}
            className="px-4 py-2 rounded-xl bg-[#111318] hover:bg-slate-800 text-white font-semibold text-xs shadow-xs transition-all cursor-pointer inline-flex items-center gap-2"
          >
            <RefreshCw01 className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Retry Loading Directory</span>
          </button>
        </div>
      ) : filteredDoctors.length === 0 ? (
        <div className="p-10 sm:p-12 rounded-3xl bg-white border border-[#EAECF0] text-center space-y-4 shadow-xs">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-100 border border-slate-200 text-slate-500 flex items-center justify-center">
            <SearchMd className="w-6 h-6" aria-hidden="true" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-base font-bold text-[#111318]">
              No specialists match your search criteria
            </h3>
            <p className="text-xs text-[#667085]">
              Try adjusting your search keywords, clearing specialty filters, or resetting the filter options.
            </p>
          </div>
          <button
            type="button"
            onClick={handleResetFilters}
            className="px-4 py-2 rounded-xl border border-[#D0D5DD] hover:bg-slate-50 text-xs font-semibold text-[#344054] transition-all cursor-pointer inline-flex items-center gap-1.5"
          >
            <RefreshCw01 className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Reset All Filters</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {filteredDoctors.map((doctor) => (
            <SpecialistCard
              key={doctor.id}
              doctor={doctor}
              pathway={pathway}
              onSelectDoctor={(doc) => setProfileDoctor(doc)}
              onBookAppointment={(doc) => onBookDoctor(doc)}
            />
          ))}
        </div>
      )}

      {/* ── 4. Specialist Profile Detail Modal ── */}
      <SpecialistProfileModal
        doctor={profileDoctor}
        pathway={pathway}
        isOpen={Boolean(profileDoctor)}
        onClose={() => setProfileDoctor(null)}
        onBookAppointment={(doc) => {
          setProfileDoctor(null);
          onBookDoctor(doc);
        }}
      />
    </div>
  );
};
