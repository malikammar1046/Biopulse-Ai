import React, { useState } from 'react';
import { Clock, Copy01, Check, Trash01, LinkExternal01, MedicalCircle, Heart, Users01 } from '@untitledui/icons';
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
    <div className="p-6 sm:p-8 rounded-2xl bg-white border border-[#BAE6FD] shadow-sm text-left select-none space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-[#0288D1] shrink-0" aria-hidden="true" />
          <h2 className="text-base font-bold font-display text-[#0F172A]">
            Pending Invitations
          </h2>
        </div>
        <span className="text-xs font-mono font-bold text-[#64748B]">
          {invitations.length} Pending
        </span>
      </div>

      <div className="space-y-3">
        {invitations.map((inv) => {
          const isDoctor = inv.role === 'doctor';
          const isFamily = inv.role === 'family';
          const Icon = isDoctor ? MedicalCircle : isFamily ? Heart : Users01;

          return (
            <div
              key={inv.id}
              className="p-4 sm:p-5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                    isDoctor
                      ? 'bg-[#F0F9FF] text-[#0288D1] border border-[#BAE6FD]'
                      : isFamily
                      ? 'bg-[#FFE4E6] text-[#E11D48] border border-[#FFE4E6]'
                      : 'bg-[#F0F9FF] text-[#0288D1] border border-[#BAE6FD]'
                  }`}
                >
                  <Icon className="w-5 h-5" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[#0F172A] truncate">
                      {inv.memberName}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#FEF3C7] text-[#B45309] font-bold capitalize">
                      {inv.relationship || inv.role}
                    </span>
                  </div>
                  <span className="text-xs text-[#475569] block truncate mt-0.5">
                    {inv.inviteEmail}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleCopy(inv.token)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-[#0288D1] bg-white border border-[#BAE6FD] hover:bg-[#F0F9FF] transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  {copiedToken === inv.token ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#047857]" aria-hidden="true" />
                      <span className="text-[#047857]">Link Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy01 className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Copy Link</span>
                    </>
                  )}
                </button>

                <a
                  href={`/care-provider/${inv.token}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-[#475569] bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span>Portal</span>
                  <LinkExternal01 className="w-3 h-3 text-[#64748B]" aria-hidden="true" />
                </a>

                <button
                  type="button"
                  onClick={() => onDeleteInvite(inv.id)}
                  className="p-1.5 rounded-xl text-[#94A3B8] hover:text-[#E11D48] hover:bg-[#FFE4E6]/50 transition-colors cursor-pointer"
                  title="Cancel Invitation"
                >
                  <Trash01 className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
