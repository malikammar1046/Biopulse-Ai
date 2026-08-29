import React from 'react';
import { Link } from 'react-router-dom';
import { Users, Calendar, ArrowRight, UserCheck, Stethoscope } from 'lucide-react';
import type { CareCircleContact } from '../../types/dashboard';
import { ROUTES } from '../../constants/routes';

interface CareCircleProps {
  contacts: CareCircleContact[];
  onPrepareAppointment?: () => void;
}

export const CareCircleCard: React.FC<CareCircleProps> = ({
  contacts,
  onPrepareAppointment,
}) => {
  const doctor = contacts.find((c) => c.role === 'doctor');

  return (
    <div className="p-6 sm:p-7 rounded-[32px] bg-white border border-[#E7DFEF] shadow-sm flex flex-col justify-between select-none text-left space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-xl bg-[#EDE4F7] text-[#6E2D8B]">
            <Users className="w-4 h-4" />
          </span>
          <h3 className="text-base font-bold font-display text-[#1C1326]">
            Your Care Circle
          </h3>
        </div>

        <Link
          to={ROUTES.APP.CARE_CIRCLE}
          className="text-xs font-bold text-[#6E2D8B] hover:text-[#A21CAF] transition-colors"
        >
          Manage Access
        </Link>
      </div>

      {/* Upcoming Clinician Appointment Focus */}
      {doctor && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-[#6E2D8B]/10 via-[#8E3EAF]/10 to-[#FB7185]/10 border border-[#D8B4FE]/50 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl overflow-hidden border border-[#D8B4FE] shrink-0 bg-[#EDE4F7] flex items-center justify-center">
                {doctor.avatar ? (
                  <img src={doctor.avatar} alt={doctor.name} className="w-full h-full object-cover" />
                ) : (
                  <Stethoscope className="w-5 h-5 text-[#6E2D8B]" />
                )}
              </div>
              <div>
                <span className="text-xs font-bold text-[#1C1326] block">{doctor.name}</span>
                <span className="text-[10px] text-[#584B68] block">{doctor.specialty}</span>
              </div>
            </div>

            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#EDE4F7] text-[#6E2D8B]">
              Full Access
            </span>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-[#E7DFEF]/60 text-xs">
            <div className="flex items-center gap-1.5 text-[#6E2D8B] font-semibold">
              <Calendar className="w-3.5 h-3.5" />
              <span>{doctor.nextAppointment || 'May 28, 2025 at 11:00 AM'}</span>
            </div>

            <button
              type="button"
              onClick={onPrepareAppointment}
              className="px-3 py-1 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#6E2D8B] to-[#8E3EAF] hover:brightness-110 shadow-xs transition-all cursor-pointer"
            >
              Prepare Summary
            </button>
          </div>
        </div>
      )}

      {/* Connected Care Members Permission Status */}
      <div className="space-y-2">
        {contacts.map((c) => (
          <div
            key={c.id}
            className="flex items-center justify-between text-xs py-1.5 px-3 rounded-xl bg-[#F8F5FA] border border-[#E7DFEF]/60"
          >
            <div className="flex items-center gap-2">
              <UserCheck className="w-3.5 h-3.5 text-[#047857]" />
              <span className="font-semibold text-[#1C1326]">{c.name}</span>
            </div>
            <span className="text-[10px] font-mono text-[#8D7E9E] capitalize">
              {c.accessLevel === 'full' ? '✓ Full Patient Record' : '✓ Summary Only (Protected)'}
            </span>
          </div>
        ))}
      </div>

      {/* Footer Link */}
      <div className="pt-2 border-t border-[#F0EAF5] flex items-center justify-between">
        <Link
          to={ROUTES.APP.CARE_CIRCLE}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#6E2D8B] hover:text-[#A21CAF] transition-colors group"
        >
          <span>Share Care Summary Link</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
        </Link>

        <span className="text-[10px] font-mono text-[#8D7E9E]">
          Patient-Controlled Sharing
        </span>
      </div>
    </div>
  );
};
