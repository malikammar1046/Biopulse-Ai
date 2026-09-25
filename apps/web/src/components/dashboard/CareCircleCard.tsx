import React from 'react';
import { Link } from 'react-router-dom';
import {
  Users01,
  User01,
  Calendar,
  ArrowRight,
  MedicalCircle,
  ShieldTick,
  Plus,
  Heart,
} from '@untitledui/icons';
import type { CareCircleContact } from '../../types/dashboard';
import { useUserHealth } from '../../context/UserHealthContext';
import { ROUTES } from '../../constants/routes';

interface CareCircleProps {
  contacts?: CareCircleContact[];
  onPrepareAppointment?: () => void;
  pathway?: 'female' | 'male' | 'general';
}

export const CareCircleCard: React.FC<CareCircleProps> = ({
  onPrepareAppointment,
  pathway: pathwayProp,
}) => {
  const { userProfile, careCircleMembers, upcomingAppointment } = useUserHealth();
  const activeMembers = careCircleMembers.filter((m) => m.status === 'active');
  const doctor = activeMembers.find((c) => c.role === 'doctor');
  const emergencyContacts = userProfile.emergencyContacts || [];

  const pathway = pathwayProp || userProfile?.pathway || userProfile?.gender;
  const isFemale = pathway === 'female';

  const accentColor = isFemale ? 'text-[#F43F7D]' : 'text-[#0288D1]';
  const hoverColor = isFemale ? 'hover:text-[#DC326C]' : 'hover:text-[#0277BD]';
  const btnBg = isFemale ? 'bg-[#F43F7D] hover:bg-[#DC326C]' : 'bg-[#0288D1] hover:bg-[#0277BD]';
  const mutedBg = isFemale ? 'bg-[#FDE6EF]' : 'bg-[#E0F2FE]';
  const panelBg = isFemale ? 'bg-[#FFF5F8] border-[#FDE6EF]' : 'bg-[#F0F9FF] border-[#BAE6FD]';
  const panelBorder = isFemale ? 'border-[#FDE6EF]' : 'border-[#BAE6FD]';

  return (
    <div className="p-6 sm:p-7 rounded-[28px] bg-white border border-[#E2E8F0] shadow-xs flex flex-col justify-between select-none text-left space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users01 className={`w-5 h-5 ${accentColor} shrink-0`} aria-hidden="true" />
          <h3 className="text-base font-bold font-display text-[#0F172A]">
            My Care Circle
          </h3>
        </div>

        <Link
          to={ROUTES.APP.CARE_CIRCLE}
          className={`text-xs font-bold ${accentColor} ${hoverColor} transition-colors`}
        >
          {activeMembers.length > 0 ? 'Manage Care Circle' : 'Add Member'}
        </Link>
      </div>

      {/* Primary Emergency Contact Highlight */}
      {emergencyContacts.length > 0 && emergencyContacts[0]?.name ? (
        <div className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className={`p-2 rounded-xl ${mutedBg} ${accentColor} shrink-0`}>
              <ShieldTick className={`w-4 h-4 ${accentColor}`} aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <span className="text-xs font-bold text-[#0F172A] block truncate">
                {emergencyContacts[0].name}
              </span>
              <span className="text-[10px] font-mono text-[#64748B] block truncate">
                Primary Safety Contact • {emergencyContacts[0].relationship}
              </span>
            </div>
          </div>
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
            Alert Active
          </span>
        </div>
      ) : (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-between text-xs">
          <span className="text-rose-700 font-medium">Emergency contact not added</span>
          <Link
            to={ROUTES.APP.SETTINGS}
            className="text-[#0288D1] font-bold hover:underline inline-flex items-center gap-1"
          >
            <Plus className="w-3 h-3" aria-hidden="true" /> Add
          </Link>
        </div>
      )}

      {/* Connected Member Focus or Empty State */}
      {activeMembers.length > 0 ? (
        <>
          {doctor ? (
            <div className={`p-4 rounded-2xl ${panelBg} space-y-3`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl overflow-hidden border ${panelBorder} shrink-0 bg-white flex items-center justify-center`}>
                    <User01 className={`w-5 h-5 ${accentColor}`} aria-hidden="true" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#0F172A] block">{doctor.name}</span>
                    <span className="text-[10px] text-[#64748B] block">{doctor.relationship || 'Healthcare Professional'}</span>
                  </div>
                </div>

                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700">
                  Connected
                </span>
              </div>

              <div className={`flex items-center justify-between pt-2 border-t ${panelBorder} text-xs`}>
                <div className={`flex items-center gap-1.5 ${accentColor} font-semibold`}>
                  <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>
                    {upcomingAppointment
                      ? `Visit: ${upcomingAppointment.scheduledDate}`
                      : 'No visit scheduled'}
                  </span>
                </div>

                {upcomingAppointment ? (
                  onPrepareAppointment ? (
                    <button
                      type="button"
                      onClick={onPrepareAppointment}
                      className={`px-3 py-1 rounded-xl text-xs font-bold text-white ${btnBg} shadow-xs transition-all cursor-pointer`}
                    >
                      Prepare Summary
                    </button>
                  ) : (
                    <Link
                      to={ROUTES.APP.APPOINTMENTS}
                      className={`px-3 py-1 rounded-xl text-xs font-bold text-white ${btnBg} shadow-xs transition-all`}
                    >
                      Prepare Summary
                    </Link>
                  )
                ) : (
                  <Link
                    to={ROUTES.APP.APPOINTMENTS}
                    className={`px-3 py-1 rounded-xl text-xs font-bold ${accentColor} bg-white hover:bg-[#F8FAFC] border ${panelBorder} transition-all`}
                  >
                    + Book Visit
                  </Link>
                )}
              </div>
            </div>
          ) : null}

          {/* Connected Care Members Count & Mini Status */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-[#64748B] font-mono px-1">
              <span>{activeMembers.length} {activeMembers.length === 1 ? 'person has' : 'people have'} access</span>
              <span className="text-emerald-700 font-bold">✓ Permission Managed</span>
            </div>

            <div className="space-y-1.5">
              {activeMembers.slice(0, 2).map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between text-xs py-1.5 px-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {m.role === 'doctor' ? (
                      <MedicalCircle className="w-3.5 h-3.5 text-[#0288D1] shrink-0" aria-hidden="true" />
                    ) : (
                      <Heart className="w-3.5 h-3.5 text-rose-500 shrink-0" aria-hidden="true" />
                    )}
                    <span className="font-semibold text-[#0F172A] truncate">{m.name}</span>
                  </div>
                  <span className="text-[10px] font-mono text-[#64748B] capitalize shrink-0">
                    {m.relationship || m.role}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className={`p-5 rounded-2xl bg-[#F8FAFC] border border-dashed ${panelBorder} text-center space-y-2`}>
          <p className="text-xs text-[#64748B]">
            Your Care Circle is empty.
          </p>
          <Link
            to={ROUTES.APP.CARE_CIRCLE}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white ${btnBg} transition-all shadow-xs`}
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Add someone you trust</span>
          </Link>
        </div>
      )}

      {/* Footer Link */}
      <div className="pt-2 border-t border-[#E2E8F0] flex items-center justify-between">
        <Link
          to={ROUTES.APP.CARE_CIRCLE}
          className={`inline-flex items-center gap-1.5 text-xs font-bold ${accentColor} ${hoverColor} transition-colors group`}
        >
          <span>Manage Care Circle</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
        </Link>

        <span className="text-[10px] font-mono text-[#64748B]">
          Patient-Owned Data
        </span>
      </div>
    </div>
  );
};
