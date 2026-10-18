import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarCheck01,
  MedicalCircle,
  ArrowRight,
} from '@untitledui/icons';
import { useDoctors } from '../../services/doctorService';
import { getDashboardRelevantDoctors, getDoctorInitials } from '../../utils/doctorPathway';

export interface SpecialistCareModuleCardProps {
  pathway: 'female' | 'male' | string;
  className?: string;
}

export const SpecialistCareModuleCard: React.FC<SpecialistCareModuleCardProps> = ({
  pathway,
  className = '',
}) => {
  const navigate = useNavigate();
  const isFemale = pathway === 'female';

  // Fetch relevant specialists
  const { doctors, loading } = useDoctors({
    pathway: isFemale ? 'female_pcos' : 'male_hypogonadism',
    strict: true,
  });

  const relevantSpecialists = useMemo(() => {
    return getDashboardRelevantDoctors(doctors, pathway, 3);
  }, [doctors, pathway]);

  // Design tokens aligned with Female and Male Visual Identities
  const title = isFemale ? 'PCOS Care' : 'Male Hormone Care';
  const subtitle = isFemale
    ? 'Connect with specialists experienced in PCOS and reproductive hormone care.'
    : 'Connect with specialists in endocrine, androgen and male reproductive health.';

  const accentColor = isFemale ? '#F43F7D' : '#0288D1';
  const iconBg = isFemale ? '#FDE6EF' : '#E1F5FE';
  const badgeBorder = isFemale ? 'border-pink-200/80' : 'border-sky-200/80';
  const badgeText = isFemale ? 'text-[#BE185D]' : 'text-[#0288D1]';
  const primaryBtnClass = isFemale
    ? 'bg-[#F43F7D] hover:bg-[#DC326C] text-white shadow-xs'
    : 'bg-[#0288D1] hover:bg-[#0277BD] text-white shadow-xs';

  return (
    <div
      className={`rounded-2xl sm:rounded-3xl bg-white border border-[#EAECF0] p-5 sm:p-6 shadow-xs flex flex-col justify-between text-left select-none transition-all duration-200 hover:shadow-sm ${className}`}
    >
      <div className="space-y-4">
        {/* Module Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${badgeBorder}`}
              style={{ backgroundColor: iconBg, color: accentColor }}
            >
              <MedicalCircle className="w-5 h-5" aria-hidden="true" />
            </div>

            <div className="space-y-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-[#111318] font-display">
                  {title}
                </h3>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${badgeBorder} ${badgeText}`}
                  style={{ backgroundColor: iconBg }}
                >
                  Specialist Hub
                </span>
              </div>
              <p className="text-xs text-[#667085] leading-relaxed max-w-xl">
                {subtitle}
              </p>
            </div>
          </div>
        </div>

        {/* Doctor Previews (Max 3) */}
        <div className="space-y-2.5 pt-1">
          {loading ? (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-[#EAECF0] animate-pulse"
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-200 shrink-0" />
                  <div className="space-y-1.5 flex-1">
                    <div className="w-28 h-3.5 rounded bg-slate-200" />
                    <div className="w-36 h-3 rounded bg-slate-100" />
                  </div>
                </div>
              ))}
            </div>
          ) : relevantSpecialists.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {relevantSpecialists.map((doc) => {
                const initials = getDoctorInitials(doc.name);
                return (
                  <div
                    key={doc.id}
                    onClick={() => navigate('/app/appointments?tab=specialists')}
                    className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#F8FAFC] border border-[#EAECF0] hover:border-slate-300 hover:bg-white transition-all cursor-pointer group"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') navigate('/app/appointments?tab=specialists');
                    }}
                  >
                    {/* Small Doctor Avatar */}
                    {doc.profile_image ? (
                      <img
                        src={doc.profile_image}
                        alt={doc.name}
                        className="w-10 h-10 rounded-xl object-cover border border-[#EAECF0] shrink-0"
                        loading="lazy"
                      />
                    ) : (
                      <div
                        className="w-10 h-10 rounded-xl border border-[#EAECF0] flex items-center justify-center shrink-0"
                        style={{ backgroundColor: iconBg, color: accentColor }}
                      >
                        <span className="text-xs font-bold font-display">{initials}</span>
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <h4
                        className={`text-xs font-bold text-[#111318] truncate transition-colors ${
                          isFemale ? 'group-hover:text-[#F43F7D]' : 'group-hover:text-[#0288D1]'
                        }`}
                      >
                        {doc.name}
                      </h4>
                      <p className="text-[11px] text-[#667085] truncate">
                        {doc.specialty || (isFemale ? 'Gynecologist' : 'Endocrinologist')}
                      </p>
                      {doc.fee && (
                        <p className="text-[10px] font-semibold text-[#16A34A] truncate">
                          {doc.fee}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-slate-50 border border-dashed border-[#EAECF0] text-center text-xs text-[#667085]">
              Explore our network of certified clinicians for your pathway.
            </div>
          )}
        </div>
      </div>

      {/* Action Footer: Primary Find a Specialist, Secondary My Appointments */}
      <div className="mt-4 pt-4 border-t border-[#F2F4F7] flex flex-col sm:flex-row items-center justify-between gap-2.5">
        <button
          type="button"
          onClick={() => navigate('/app/appointments?tab=upcoming')}
          className="w-full sm:w-auto px-4 py-2 rounded-xl border border-[#D0D5DD] hover:bg-slate-50 text-xs font-semibold text-[#344054] transition-all cursor-pointer flex items-center justify-center gap-1.5"
        >
          <CalendarCheck01 className="w-3.5 h-3.5 text-[#667085]" aria-hidden="true" />
          <span>My Appointments</span>
        </button>

        <button
          type="button"
          onClick={() => navigate('/app/appointments?tab=specialists')}
          className={`w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-[0.98] ${primaryBtnClass}`}
        >
          <span>Find a Specialist</span>
          <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
};
