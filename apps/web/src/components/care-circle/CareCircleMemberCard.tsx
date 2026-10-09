import React from 'react';
import {
  MedicalCircle,
  Heart,
  Users01,
  Settings01,
  Trash01,
  Check,
  XClose,
  LinkExternal01,
  Building01,
} from '@untitledui/icons';
import type { CareCircleMember } from '../../types/careCircle';

interface CareCircleMemberCardProps {
  member: CareCircleMember;
  onManageAccess: (member: CareCircleMember) => void;
  onRevokeAccess: (member: CareCircleMember) => void;
  isFemale?: boolean;
}

export const CareCircleMemberCard: React.FC<CareCircleMemberCardProps> = ({
  member,
  onManageAccess,
  onRevokeAccess,
  isFemale = false,
}) => {
  const isDoctor = member.role === 'doctor';
  const isFamily = member.role === 'family';
  const Icon = isDoctor ? MedicalCircle : isFamily ? Heart : Users01;

  // Format relative last viewed time
  const formatLastViewed = (dateStr?: string) => {
    if (!dateStr) return 'Not viewed yet';
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffHours = Math.floor(diffMs / 3600000);
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `Today at ${new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays} days ago`;
  };

  const perms = member.permissions;

  return (
    <div className={`p-6 sm:p-7 rounded-2xl bg-white border ${isFemale ? 'border-[#F3E8EC]' : 'border-[#BAE6FD]'} shadow-sm flex flex-col justify-between select-none text-left space-y-6 hover:shadow-md transition-shadow`}>
      {/* Top Header & Identity */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
        <div className="flex items-start sm:items-center gap-3 sm:gap-3.5 min-w-0">
          <div
            className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0 ${
              isDoctor
                ? isFemale
                  ? 'bg-[#FDE6EF] text-[#F43F7D] border border-[#FDE6EF]'
                  : 'bg-[#F0F9FF] text-[#0288D1] border border-[#BAE6FD]'
                : isFamily
                ? 'bg-[#FFE4E6] text-[#E11D48] border border-[#FFE4E6]'
                : isFemale
                ? 'bg-[#FDE6EF] text-[#F43F7D] border border-[#FDE6EF]'
                : 'bg-[#F0F9FF] text-[#0288D1] border border-[#BAE6FD]'
            }`}
          >
            <Icon className="w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm sm:text-base font-bold font-display text-[#0F172A] truncate">
                {member.name}
              </h3>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase shrink-0 ${
                  member.status === 'active'
                    ? 'bg-[#ECFDF5] text-[#047857]'
                    : member.status === 'revoked'
                    ? 'bg-[#FFF1F2] text-[#E11D48]'
                    : 'bg-[#FEF3C7] text-[#D97706]'
                }`}
              >
                {member.status === 'active' ? 'Connected' : member.status}
              </span>
            </div>

            <span className="text-xs text-[#475569] block truncate mt-0.5">
              {member.relationship || (isDoctor ? 'Healthcare Professional' : 'Trusted Contact')}
            </span>

            {member.clinicOrganization && (
              <span className="text-[11px] text-[#64748B] inline-flex items-center gap-1 mt-0.5 truncate">
                <Building01 className="w-3 h-3" aria-hidden="true" />
                {member.clinicOrganization}
              </span>
            )}
          </div>
        </div>

        {/* Last Viewed Indicator */}
        <div className="text-left sm:text-right shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 flex items-center justify-between sm:block">
          <span className="text-[10px] font-mono text-[#64748B] block uppercase">
            Activity
          </span>
          <span className={`text-[11px] font-mono font-bold ${isFemale ? 'text-[#F43F7D]' : 'text-[#0288D1]'} block sm:mt-0.5`}>
            {formatLastViewed(member.lastViewedAt)}
          </span>
        </div>
      </div>

      {/* Permissions Breakdown Checklist */}
      <div className={`p-4 rounded-xl ${isFemale ? 'bg-[#FFF8FA] border-[#FDE6EF]' : 'bg-[#F0F9FF] border-[#BAE6FD]'} border space-y-2.5`}>
        <span className={`text-[10px] font-mono font-bold ${isFemale ? 'text-[#E11D48]' : 'text-[#0369A1]'} uppercase tracking-wider block`}>
          Access Granted by You
        </span>

        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
          {/* Reports */}
          <div className="flex items-center gap-1.5">
            {perms.reports ? (
              <Check className="w-3.5 h-3.5 text-[#047857] shrink-0 font-bold" aria-hidden="true" />
            ) : (
              <XClose className="w-3.5 h-3.5 text-[#94A3B8] shrink-0" aria-hidden="true" />
            )}
            <span className={perms.reports ? 'text-[#0F172A] font-medium' : 'text-[#94A3B8]'}>
              Lab Reports
            </span>
          </div>

          {/* Symptoms */}
          <div className="flex items-center gap-1.5">
            {perms.symptoms ? (
              <Check className="w-3.5 h-3.5 text-[#047857] shrink-0 font-bold" aria-hidden="true" />
            ) : (
              <XClose className="w-3.5 h-3.5 text-[#94A3B8] shrink-0" aria-hidden="true" />
            )}
            <span className={perms.symptoms ? 'text-[#0F172A] font-medium' : 'text-[#94A3B8]'}>
              Symptoms
            </span>
          </div>

          {/* Cycle */}
          <div className="flex items-center gap-1.5">
            {perms.cycle ? (
              <Check className="w-3.5 h-3.5 text-[#047857] shrink-0 font-bold" aria-hidden="true" />
            ) : (
              <XClose className="w-3.5 h-3.5 text-[#94A3B8] shrink-0" aria-hidden="true" />
            )}
            <span className={perms.cycle ? 'text-[#0F172A] font-medium' : 'text-[#94A3B8]'}>
              Cycle Rhythm
            </span>
          </div>

          {/* Weekly Summary */}
          <div className="flex items-center gap-1.5">
            {perms.weekly_summary ? (
              <Check className="w-3.5 h-3.5 text-[#047857] shrink-0 font-bold" aria-hidden="true" />
            ) : (
              <XClose className="w-3.5 h-3.5 text-[#94A3B8] shrink-0" aria-hidden="true" />
            )}
            <span className={perms.weekly_summary ? 'text-[#0F172A] font-medium' : 'text-[#94A3B8]'}>
              Weekly Summary
            </span>
          </div>

          {/* Medications */}
          <div className="flex items-center gap-1.5">
            {perms.medications ? (
              <Check className="w-3.5 h-3.5 text-[#047857] shrink-0 font-bold" aria-hidden="true" />
            ) : (
              <XClose className="w-3.5 h-3.5 text-[#94A3B8] shrink-0" aria-hidden="true" />
            )}
            <span className={perms.medications ? 'text-[#0F172A] font-medium' : 'text-[#94A3B8]'}>
              Medications
            </span>
          </div>

          {/* Private Chat Topic Summary */}
          <div className="flex items-center gap-1.5">
            {perms.chat_summary ? (
              <Check className="w-3.5 h-3.5 text-[#047857] shrink-0 font-bold" aria-hidden="true" />
            ) : (
              <XClose className="w-3.5 h-3.5 text-[#94A3B8] shrink-0" aria-hidden="true" />
            )}
            <span className={perms.chat_summary ? 'text-[#0F172A] font-medium' : 'text-[#94A3B8]'}>
              Topics Summary
            </span>
          </div>
        </div>
      </div>

      {/* Action Footer Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#E2E8F0]">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onManageAccess(member)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold text-white ${isFemale ? 'bg-[#F43F7D] hover:bg-[#E11D48]' : 'bg-[#0288D1] hover:bg-[#0277BD]'} shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer`}
          >
            <Settings01 className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Manage Access</span>
          </button>

          <a
            href={`/care-provider/${member.inviteToken}`}
            target="_blank"
            rel="noreferrer"
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold ${isFemale ? 'text-[#F43F7D] bg-white hover:bg-[#FFF8FA] border-[#FDE6EF]' : 'text-[#0288D1] bg-white hover:bg-[#F0F9FF] border-[#BAE6FD]'} border transition-colors flex items-center gap-1.5 cursor-pointer`}
          >
            <span>View Portal</span>
            <LinkExternal01 className={`w-3 h-3 ${isFemale ? 'text-[#F43F7D]' : 'text-[#0288D1]'}`} aria-hidden="true" />
          </a>
        </div>

        <button
          type="button"
          onClick={() => onRevokeAccess(member)}
          className="p-2 rounded-xl text-[#94A3B8] hover:text-[#E11D48] hover:bg-[#FFE4E6]/50 transition-colors cursor-pointer"
          title="Remove Access"
        >
          <Trash01 className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
};
