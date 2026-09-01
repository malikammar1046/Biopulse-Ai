import React from 'react';
import { Link } from 'react-router-dom';
import { Users, Calendar, ArrowRight, Stethoscope, ShieldCheck, Plus, Heart } from 'lucide-react';
import type { CareCircleContact } from '../../types/dashboard';
import { useUserHealth } from '../../context/UserHealthContext';
import { ROUTES } from '../../constants/routes';

interface CareCircleProps {
  contacts?: CareCircleContact[];
  onPrepareAppointment?: () => void;
}

export const CareCircleCard: React.FC<CareCircleProps> = ({
  onPrepareAppointment,
}) => {
  const { userProfile, careCircleMembers, upcomingAppointment } = useUserHealth();
  const activeMembers = careCircleMembers.filter((m) => m.status === 'active');
  const doctor = activeMembers.find((c) => c.role === 'doctor');
  const emergencyContacts = userProfile.emergencyContacts || [];

  return (
    <div className="p-6 sm:p-7 rounded-[32px] bg-white border border-[#E7DFEF] shadow-sm flex flex-col justify-between select-none text-left space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-xl bg-[#EDE4F7] text-[#6E2D8B]">
            <Users className="w-4 h-4" />
          </span>
          <h3 className="text-base font-bold font-display text-[#1C1326]">
            My Care Circle
          </h3>
        </div>

        <Link
          to={ROUTES.APP.CARE_CIRCLE}
          className="text-xs font-bold text-[#6E2D8B] hover:text-[#A21CAF] transition-colors"
        >
          {activeMembers.length > 0 ? 'Manage Care Circle' : 'Add Member'}
        </Link>
      </div>

      {/* Primary Emergency Contact Highlight */}
      {emergencyContacts.length > 0 && emergencyContacts[0]?.name ? (
        <div className="p-3.5 rounded-2xl bg-[#F8F5FA] border border-[#E7DFEF] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="p-2 rounded-xl bg-[#EDE4F7] text-[#6E2D8B] shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </span>
            <div className="min-w-0">
              <span className="text-xs font-bold text-[#1C1326] block truncate">
                {emergencyContacts[0].name}
              </span>
              <span className="text-[10px] font-mono text-[#8D7E9E] block truncate">
                Primary Safety Contact • {emergencyContacts[0].relationship}
              </span>
            </div>
          </div>
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#ECFDF5] text-[#047857] shrink-0">
            Alert Active
          </span>
        </div>
      ) : (
        <div className="p-3.5 rounded-2xl bg-[#FDF2F8] border border-[#FDA4AF]/40 flex items-center justify-between text-xs">
          <span className="text-[#FB7185] font-medium">Emergency contact not added</span>
          <Link
            to={ROUTES.APP.SETTINGS}
            className="text-[#6E2D8B] font-bold hover:underline inline-flex items-center gap-1"
          >
            <Plus className="w-3 h-3" /> Add
          </Link>
        </div>
      )}

      {/* Connected Member Focus or Empty State */}
      {activeMembers.length > 0 ? (
        <>
          {doctor ? (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-[#6E2D8B]/10 via-[#8E3EAF]/10 to-[#FB7185]/10 border border-[#D8B4FE]/50 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl overflow-hidden border border-[#D8B4FE] shrink-0 bg-[#EDE4F7] flex items-center justify-center">
                    <Stethoscope className="w-5 h-5 text-[#6E2D8B]" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#1C1326] block">{doctor.name}</span>
                    <span className="text-[10px] text-[#584B68] block">{doctor.relationship || 'Healthcare Professional'}</span>
                  </div>
                </div>

                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#ECFDF5] text-[#047857]">
                  Connected
                </span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#E7DFEF]/60 text-xs">
                <div className="flex items-center gap-1.5 text-[#6E2D8B] font-semibold">
                  <Calendar className="w-3.5 h-3.5" />
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
                      className="px-3 py-1 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#6E2D8B] to-[#8E3EAF] hover:brightness-110 shadow-xs transition-all cursor-pointer"
                    >
                      Prepare Summary
                    </button>
                  ) : (
                    <Link
                      to={ROUTES.APP.APPOINTMENTS}
                      className="px-3 py-1 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#6E2D8B] to-[#8E3EAF] hover:brightness-110 shadow-xs transition-all"
                    >
                      Prepare Summary
                    </Link>
                  )
                ) : (
                  <Link
                    to={ROUTES.APP.APPOINTMENTS}
                    className="px-3 py-1 rounded-xl text-xs font-bold text-[#6E2D8B] bg-[#EDE4F7] hover:bg-[#E5D4F5] transition-all"
                  >
                    + Book Visit
                  </Link>
                )}
              </div>
            </div>
          ) : null}

          {/* Connected Care Members Count & Mini Status */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-[#584B68] font-mono px-1">
              <span>{activeMembers.length} {activeMembers.length === 1 ? 'person has' : 'people have'} access</span>
              <span className="text-[#047857] font-bold">✓ Permission Managed</span>
            </div>

            <div className="space-y-1.5">
              {activeMembers.slice(0, 2).map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between text-xs py-1.5 px-3 rounded-xl bg-[#F8F5FA] border border-[#E7DFEF]/60"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {m.role === 'doctor' ? (
                      <Stethoscope className="w-3.5 h-3.5 text-[#6E2D8B] shrink-0" />
                    ) : (
                      <Heart className="w-3.5 h-3.5 text-[#E11D48] shrink-0" />
                    )}
                    <span className="font-semibold text-[#1C1326] truncate">{m.name}</span>
                  </div>
                  <span className="text-[10px] font-mono text-[#8D7E9E] capitalize shrink-0">
                    {m.relationship || m.role}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="p-5 rounded-2xl bg-[#F8F5FA] border border-dashed border-[#D8B4FE] text-center space-y-2">
          <p className="text-xs text-[#584B68]">
            Your Care Circle is empty.
          </p>
          <Link
            to={ROUTES.APP.CARE_CIRCLE}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#6E2D8B] to-[#8E3EAF] hover:brightness-110 transition-all shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add someone you trust</span>
          </Link>
        </div>
      )}

      {/* Footer Link */}
      <div className="pt-2 border-t border-[#F0EAF5] flex items-center justify-between">
        <Link
          to={ROUTES.APP.CARE_CIRCLE}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#6E2D8B] hover:text-[#A21CAF] transition-colors group"
        >
          <span>Manage Care Circle</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
        </Link>

        <span className="text-[10px] font-mono text-[#8D7E9E]">
          Patient-Owned Data
        </span>
      </div>
    </div>
  );
};
