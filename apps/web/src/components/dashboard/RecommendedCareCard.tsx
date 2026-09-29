import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Stethoscope, ArrowRight, Sparkles, MapPin, Calendar } from 'lucide-react';
import { useDoctors } from '../../services/doctorService';
import type { Doctor } from '../../types/doctor';

interface RecommendedCareCardProps {
  pathway: 'female' | 'male';
}

export const RecommendedCareCard: React.FC<RecommendedCareCardProps> = ({ pathway }) => {
  const navigate = useNavigate();
  const isMale = pathway === 'male';

  const { doctors, loading } = useDoctors({
    pathway: isMale ? 'male_hypogonadism' : 'female_pcos',
    strict: true,
  });

  // Take top 2 pathway-relevant specialists
  const specialists = doctors.slice(0, 2);

  const title = 'Recommended Care';
  const subtitle = isMale
    ? 'Specialists relevant to male hormonal health'
    : 'Based on your current PCOS screening pathway';

  const badgeBg = isMale ? 'bg-sky-50 text-sky-800 border-sky-200' : 'bg-pink-50 text-pink-800 border-pink-200';
  const buttonStyle = isMale
    ? 'text-[#0288D1] hover:text-[#0277BD]'
    : 'text-[#F43F7D] hover:text-[#DC326C]';

  if (loading && specialists.length === 0) {
    return (
      <div className="rounded-2xl bg-white border border-[#EAECF0] p-5 shadow-xs select-none">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-slate-200 rounded w-1/3"></div>
          <div className="h-3 bg-slate-100 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (specialists.length === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl bg-white border border-[#EAECF0] p-5 sm:p-6 shadow-xs select-none space-y-4 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#F2F4F7] pb-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${badgeBg}`}
            >
              <Sparkles className="w-3 h-3 shrink-0" />
              {title}
            </span>
          </div>
          <h3 className="text-sm sm:text-base font-bold text-[#111318] pt-1">
            {subtitle}
          </h3>
        </div>

        <button
          type="button"
          onClick={() =>
            navigate(`/doctors?pathway=${isMale ? 'male_hypogonadism' : 'female_pcos'}`)
          }
          className={`text-xs font-bold inline-flex items-center gap-1 transition-colors cursor-pointer self-start sm:self-auto ${buttonStyle}`}
        >
          <span>View all specialists</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Mini Specialists Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1">
        {specialists.map((doc: Doctor) => (
          <div
            key={doc.id}
            className="p-4 rounded-xl bg-white border border-[#E4E7EC] hover:border-[#D0D5DD] transition-all flex flex-col justify-between space-y-3 shadow-2xs hover:shadow-xs group"
          >
            <div className="space-y-2">
              <div className="flex items-start gap-3">
                {doc.profile_image ? (
                  <img
                    src={doc.profile_image}
                    alt={doc.name}
                    className="w-11 h-11 rounded-xl object-cover border border-[#EAECF0] shrink-0"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-xl bg-slate-50 border border-[#EAECF0] flex items-center justify-center text-slate-500 shrink-0">
                    <Stethoscope className="w-5 h-5 text-slate-600" />
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-[#101828] truncate group-hover:text-[#073B72] transition-colors">
                    {doc.name}
                  </h4>
                  <p className="text-[11px] font-medium text-[#667085] truncate">
                    {doc.specialty}
                  </p>
                </div>
              </div>

              {doc.relevance_reason && (
                <div className="text-[10px] font-semibold text-emerald-800 bg-emerald-50/80 border border-emerald-200/60 px-2 py-0.5 rounded-md truncate">
                  {doc.relevance_reason}
                </div>
              )}

              {doc.location && (
                <div className="flex items-center gap-1 text-[11px] text-[#667085] truncate">
                  <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                  <span className="truncate">{doc.location}</span>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-[#F2F4F7] flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold text-[#344054]">
                {doc.fee || 'Fee on Request'}
              </span>

              <button
                type="button"
                onClick={() => navigate(`/doctors?doctorId=${doc.id}&intent=book`)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#F8FAFC] hover:bg-slate-100 text-[#0F172A] border border-[#EAECF0] transition-colors cursor-pointer"
              >
                <Calendar className="w-3 h-3 text-slate-500" />
                <span>Consult</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
