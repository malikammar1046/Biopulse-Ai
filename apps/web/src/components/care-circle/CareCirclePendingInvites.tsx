import React, { useState } from 'react';
import { Clock, Copy, Check, Trash2, ExternalLink, Stethoscope, Heart, Users } from 'lucide-react';
import type { CareCircleInvitation } from '../../types/careCircle';

interface CareCirclePendingInvitesProps {
  invitations: CareCircleInvitation[];
  onDeleteInvite: (inviteId: string) => Promise<{ success: boolean; error?: string }>;
}

export const CareCirclePendingInvites: React.FC<CareCirclePendingInvitesProps> = ({
  invitations,
  onDeleteInvite,
}) => {
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  if (invitations.length === 0) return null;

  const handleCopy = (token: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    navigator.clipboard.writeText(`${origin}/care-provider/${token}`);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2500);
  };

  return (
    <div className="p-6 sm:p-8 rounded-[32px] bg-white border border-[#E7DFEF] shadow-sm text-left select-none space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-xl bg-[#FEF3C7] text-[#D97706]">
            <Clock className="w-4 h-4" />
          </span>
          <h2 className="text-base font-bold font-display text-[#1C1326]">
            Pending Invitations
          </h2>
        </div>
        <span className="text-xs font-mono font-bold text-[#8D7E9E]">
          {invitations.length} Pending
        </span>
      </div>

      <div className="space-y-3">
        {invitations.map((inv) => {
          const isDoctor = inv.role === 'doctor';
          const isFamily = inv.role === 'family';
          const Icon = isDoctor ? Stethoscope : isFamily ? Heart : Users;

          return (
            <div
              key={inv.id}
              className="p-4 sm:p-5 rounded-2xl bg-[#FFFBEB]/50 border border-[#FDE68A]/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                    isDoctor
                      ? 'bg-[#EDE4F7] text-[#6E2D8B]'
                      : isFamily
                      ? 'bg-[#FFE4E6] text-[#E11D48]'
                      : 'bg-[#EDE4F7] text-[#8E3EAF]'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[#1C1326] truncate">
                      {inv.memberName}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#FEF3C7] text-[#B45309] font-bold capitalize">
                      {inv.relationship || inv.role}
                    </span>
                  </div>
                  <span className="text-xs text-[#584B68] block truncate mt-0.5">
                    {inv.inviteEmail}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleCopy(inv.token)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-[#6E2D8B] bg-white border border-[#E7DFEF] hover:bg-[#EDE4F7] transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  {copiedToken === inv.token ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#047857]" />
                      <span className="text-[#047857]">Link Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Link</span>
                    </>
                  )}
                </button>

                <a
                  href={`/care-provider/${inv.token}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-[#584B68] bg-white border border-[#E7DFEF] hover:bg-[#F8F5FA] transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span>Portal</span>
                  <ExternalLink className="w-3 h-3 text-[#8D7E9E]" />
                </a>

                <button
                  type="button"
                  onClick={() => onDeleteInvite(inv.id)}
                  className="p-1.5 rounded-xl text-[#8D7E9E] hover:text-[#E11D48] hover:bg-[#FFE4E6]/50 transition-colors cursor-pointer"
                  title="Cancel Invitation"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
