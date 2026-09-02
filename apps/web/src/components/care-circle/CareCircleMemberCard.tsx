import React from 'react';
import {
  Stethoscope,
  Heart,
  Users,
  Settings,
  Trash2,
  Check,
  X,
  ExternalLink,
  Building2,
} from 'lucide-react';
import type { CareCircleMember } from '../../types/careCircle';

interface CareCircleMemberCardProps {
  member: CareCircleMember;
  onManageAccess: (member: CareCircleMember) => void;
  onRevokeAccess: (member: CareCircleMember) => void;
}

export const CareCircleMemberCard: React.FC<CareCircleMemberCardProps> = ({
  member,
  onManageAccess,
  onRevokeAccess,
}) => {
  const isDoctor = member.role === 'doctor';
  const isFamily = member.role === 'family';
  const Icon = isDoctor ? Stethoscope : isFamily ? Heart : Users;

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
    <div className="p-6 sm:p-7 rounded-[32px] bg-white border border-[#E7DFEF] shadow-sm flex flex-col justify-between select-none text-left space-y-6 hover:shadow-md transition-shadow">
      {/* Top Header & Identity */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3.5 min-w-0">
          <div
            className={`w-13 h-13 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
              isDoctor
                ? 'bg-[#EDE4F7] text-[#6E2D8B]'
                : isFamily
                ? 'bg-[#FFE4E6] text-[#E11D48]'
                : 'bg-[#EDE4F7] text-[#8E3EAF]'
            }`}
          >
            <Icon className="w-6 h-6" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold font-display text-[#1C1326] truncate">
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

            <span className="text-xs text-[#584B68] block truncate mt-0.5">
              {member.relationship || (isDoctor ? 'Healthcare Professional' : 'Trusted Contact')}
            </span>

            {member.clinicOrganization && (
              <span className="text-[11px] text-[#8D7E9E] inline-flex items-center gap-1 mt-0.5 truncate">
                <Building2 className="w-3 h-3" />
                {member.clinicOrganization}
              </span>
            )}
          </div>
        </div>

        {/* Last Viewed Indicator */}
        <div className="text-right shrink-0">
          <span className="text-[10px] font-mono text-[#8D7E9E] block uppercase">
            Activity
          </span>
          <span className="text-[11px] font-mono font-bold text-[#6E2D8B] block mt-0.5">
            {formatLastViewed(member.lastViewedAt)}
          </span>
        </div>
      </div>

      {/* Permissions Breakdown Checklist */}
      <div className="p-4 rounded-2xl bg-[#F8F5FA] border border-[#E7DFEF] space-y-2.5">
        <span className="text-[10px] font-mono font-bold text-[#8D7E9E] uppercase tracking-wider block">
          Access Granted by You
        </span>

        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
          {/* Reports */}
          <div className="flex items-center gap-1.5">
            {perms.reports ? (
              <Check className="w-3.5 h-3.5 text-[#047857] shrink-0 font-bold" />
            ) : (
              <X className="w-3.5 h-3.5 text-[#9CA3AF] shrink-0" />
            )}
            <span className={perms.reports ? 'text-[#1C1326] font-medium' : 'text-[#9CA3AF]'}>
              Lab Reports
            </span>
          </div>

          {/* Symptoms */}
          <div className="flex items-center gap-1.5">
            {perms.symptoms ? (
              <Check className="w-3.5 h-3.5 text-[#047857] shrink-0 font-bold" />
            ) : (
              <X className="w-3.5 h-3.5 text-[#9CA3AF] shrink-0" />
            )}
            <span className={perms.symptoms ? 'text-[#1C1326] font-medium' : 'text-[#9CA3AF]'}>
              Symptoms
            </span>
          </div>

          {/* Cycle */}
          <div className="flex items-center gap-1.5">
            {perms.cycle ? (
              <Check className="w-3.5 h-3.5 text-[#047857] shrink-0 font-bold" />
            ) : (
              <X className="w-3.5 h-3.5 text-[#9CA3AF] shrink-0" />
            )}
            <span className={perms.cycle ? 'text-[#1C1326] font-medium' : 'text-[#9CA3AF]'}>
              Cycle Rhythm
            </span>
          </div>

          {/* Weekly Summary */}
          <div className="flex items-center gap-1.5">
            {perms.weekly_summary ? (
              <Check className="w-3.5 h-3.5 text-[#047857] shrink-0 font-bold" />
            ) : (
              <X className="w-3.5 h-3.5 text-[#9CA3AF] shrink-0" />
            )}
            <span className={perms.weekly_summary ? 'text-[#1C1326] font-medium' : 'text-[#9CA3AF]'}>
              Weekly Summary
            </span>
          </div>

          {/* Medications */}
          <div className="flex items-center gap-1.5">
            {perms.medications ? (
              <Check className="w-3.5 h-3.5 text-[#047857] shrink-0 font-bold" />
            ) : (
              <X className="w-3.5 h-3.5 text-[#9CA3AF] shrink-0" />
            )}
            <span className={perms.medications ? 'text-[#1C1326] font-medium' : 'text-[#9CA3AF]'}>
              Medications
            </span>
          </div>

          {/* Private Chat Topic Summary */}
          <div className="flex items-center gap-1.5">
            {perms.chat_summary ? (
              <Check className="w-3.5 h-3.5 text-[#047857] shrink-0 font-bold" />
            ) : (
              <X className="w-3.5 h-3.5 text-[#9CA3AF] shrink-0" />
            )}
            <span className={perms.chat_summary ? 'text-[#1C1326] font-medium' : 'text-[#9CA3AF]'}>
              Topics Summary
            </span>
          </div>
        </div>
      </div>

      {/* Action Footer Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#F0EAF5]">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onManageAccess(member)}
            className="px-4 py-2 rounded-xl text-xs font-bold text-[#6E2D8B] bg-[#EDE4F7] hover:bg-[#E7DFEF] transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Manage Access</span>
          </button>

          <a
            href={`/care-provider/${member.inviteToken}`}
            target="_blank"
            rel="noreferrer"
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-[#584B68] bg-[#F8F5FA] hover:bg-[#EDE4F7] border border-[#E7DFEF] transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <span>View Portal</span>
            <ExternalLink className="w-3 h-3 text-[#8D7E9E]" />
          </a>
        </div>

        <button
          type="button"
          onClick={() => onRevokeAccess(member)}
          className="p-2 rounded-xl text-[#9CA3AF] hover:text-[#E11D48] hover:bg-[#FFE4E6]/50 transition-colors cursor-pointer"
          title="Remove Access"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
