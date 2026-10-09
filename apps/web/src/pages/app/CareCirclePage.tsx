import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  Users01,
  Plus,
  MedicalCircle,
  Heart,
  ShieldTick,
  Lock01,
} from '@untitledui/icons';
import { useUserHealth } from '../../context/UserHealthContext';
import type { CareCircleMember, CareCircleRole } from '../../types/careCircle';
import { AddCareMemberModal } from '../../components/care-circle/AddCareMemberModal';
import { ManageAccessModal } from '../../components/care-circle/ManageAccessModal';
import { RevokeAccessConfirmModal } from '../../components/care-circle/RevokeAccessConfirmModal';
import { CareCircleMemberCard } from '../../components/care-circle/CareCircleMemberCard';
import { CareCirclePendingInvites } from '../../components/care-circle/CareCirclePendingInvites';
import { resolvePathway } from '../../types/onboarding';

export const CareCirclePage: React.FC = () => {
  const { t } = useTranslation(['careCircle', 'common']);
  const {
    userProfile,
    careCircleMembers,
    careCircleInvitations,
    careCircleLoading,
    addCareMember,
    updateMemberPermissions,
    revokeMemberAccess,
    deleteCareMember,
    openAiChatWithPrompt,
  } = useUserHealth();

  const pathway = resolvePathway(userProfile?.gender, userProfile?.pathway);
  const isFemale = pathway === 'female';

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [initialAddRole, setInitialAddRole] = useState<CareCircleRole>('doctor');
  const [selectedMemberForManage, setSelectedMemberForManage] = useState<CareCircleMember | null>(null);
  const [selectedMemberForRevoke, setSelectedMemberForRevoke] = useState<CareCircleMember | null>(null);
  const [isRevoking, setIsRevoking] = useState(false);

  const emergencyContacts = userProfile.emergencyContacts || [];
  const activeMembers = careCircleMembers.filter((m) => m.status === 'active');
  const pendingMembers = careCircleMembers.filter((m) => m.status === 'pending');

  const handleOpenAddModal = (role: CareCircleRole) => {
    setInitialAddRole(role);
    setIsAddModalOpen(true);
  };

  const handleConfirmRevoke = async (memberId: string) => {
    setIsRevoking(true);
    await revokeMemberAccess(memberId);
    setIsRevoking(false);
    setSelectedMemberForRevoke(null);
    if (selectedMemberForManage?.id === memberId) {
      setSelectedMemberForManage(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl mx-auto space-y-6 sm:space-y-8 text-left select-none pb-16"
    >
      {/* ── 1. HERO & OWNERSHIP BANNER ── */}
      <div className="rounded-2xl bg-white border border-[#EAECF0] p-5 sm:p-6 shadow-xs select-none">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2.5 max-w-2xl text-left">
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${isFemale ? 'bg-[#FDE6EF] text-[#E11D48] border-[#F43F7D]/20' : 'bg-[#F0F9FF] text-[#0288D1] border-[#BAE6FD]'} text-xs font-mono font-semibold border`}>
              <ShieldTick className={`w-3.5 h-3.5 ${isFemale ? 'text-[#E11D48]' : 'text-[#0288D1]'}`} aria-hidden="true" />
              <span>{t('careCircle:title', { defaultValue: 'Zero-Compromise Patient Consent' })}</span>
            </div>

            {/* Quick Stat Badges */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="px-3 py-1.5 rounded-xl bg-[#F8FAFC] border border-[#EAECF0] text-xs font-mono text-[#0F172A]">
                <span className={`${isFemale ? 'text-[#F43F7D]' : 'text-[#0288D1]'} font-bold`}>{activeMembers.length}</span> {t('careCircle:status.accepted', { defaultValue: 'Active Connections' })}
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-[#F8FAFC] border border-[#EAECF0] text-xs font-mono text-[#0F172A]">
                <span className="text-[#F79009] font-bold">{careCircleInvitations.length || pendingMembers.length}</span> {t('careCircle:status.pending', { defaultValue: 'Pending' })}
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-mono text-emerald-700 flex items-center gap-1.5 font-medium">
                <Lock01 className="w-3 h-3 text-emerald-600" aria-hidden="true" />
                <span>{t('careCircle:status.revoked', { defaultValue: 'Instant Revocation Enabled' })}</span>
              </div>
            </div>
          </div>

          {/* Quick Action Button Group */}
          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            <button
              type="button"
              onClick={() => handleOpenAddModal('doctor')}
              className={`px-4 py-2.5 rounded-xl font-sans font-semibold text-xs sm:text-sm text-white ${isFemale ? 'bg-[#F43F7D] hover:bg-[#E11D48]' : 'bg-[#0288D1] hover:bg-[#0277BD]'} shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]`}
            >
              <MedicalCircle className="w-4 h-4 text-white" aria-hidden="true" />
              <span>{t('careCircle:inviteMember', { defaultValue: 'Add Doctor / Clinician' })}</span>
            </button>

            <button
              type="button"
              onClick={() => handleOpenAddModal('family')}
              className="px-4 py-2.5 rounded-xl font-sans font-semibold text-xs sm:text-sm text-[#344054] bg-[#FAFAFC] hover:bg-[#F2F4F7] border border-[#EAECF0] shadow-2xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
            >
              <Heart className="w-4 h-4 text-[#F43F7D]" aria-hidden="true" />
              <span>{t('careCircle:inviteMember', { defaultValue: 'Add Family Member' })}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── 2. ACTIVE CONNECTIONS SECTION ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`p-1.5 rounded-xl ${isFemale ? 'bg-[#FDE6EF] text-[#F43F7D] border-[#FDE6EF]' : 'bg-[#F0F9FF] text-[#0288D1] border-[#BAE6FD]'} border`}>
              <Users01 className={`w-4 h-4 ${isFemale ? 'text-[#F43F7D]' : 'text-[#0288D1]'}`} aria-hidden="true" />
            </span>
            <h2 className="text-lg font-bold font-display text-[#0F172A]">
              Active Connections ({activeMembers.length})
            </h2>
          </div>

          <button
            type="button"
            onClick={() => handleOpenAddModal('trusted_person')}
            className={`text-xs font-bold ${isFemale ? 'text-[#F43F7D] hover:text-[#BE185D]' : 'text-[#0288D1] hover:text-[#01579B]'} transition-colors inline-flex items-center gap-1 cursor-pointer`}
          >
            <Plus className={`w-3.5 h-3.5 ${isFemale ? 'text-[#F43F7D]' : 'text-[#0288D1]'}`} aria-hidden="true" />
            <span>Add Trusted Person</span>
          </button>
        </div>

        {careCircleLoading && careCircleMembers.length === 0 ? (
          <div className={`p-12 rounded-2xl bg-white border ${isFemale ? 'border-[#FDE6EF]' : 'border-[#BAE6FD]'} text-center space-y-3`}>
            <div className={`w-8 h-8 rounded-full border-2 ${isFemale ? 'border-[#F43F7D]' : 'border-[#0288D1]'} border-t-transparent animate-spin mx-auto`} />
            <span className="text-xs font-mono text-[#64748B] block">
              Loading Care Circle members...
            </span>
          </div>
        ) : activeMembers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {activeMembers.map((member) => (
              <CareCircleMemberCard
                key={member.id}
                member={member}
                isFemale={isFemale}
                onManageAccess={(m) => setSelectedMemberForManage(m)}
                onRevokeAccess={(m) => setSelectedMemberForRevoke(m)}
              />
            ))}
          </div>
        ) : (
          <div className={`p-8 sm:p-12 rounded-2xl bg-white border border-dashed ${isFemale ? 'border-[#FDE6EF]' : 'border-[#BAE6FD]'} text-center space-y-4`}>
            <div className={`w-14 h-14 rounded-2xl ${isFemale ? 'bg-[#FDE6EF] text-[#F43F7D] border-[#FDE6EF]' : 'bg-[#F0F9FF] text-[#0288D1] border-[#BAE6FD]'} border flex items-center justify-center mx-auto`}>
              <Users01 className={`w-7 h-7 ${isFemale ? 'text-[#F43F7D]' : 'text-[#0288D1]'}`} aria-hidden="true" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold font-display text-[#0F172A]">
                Your Care Circle is empty
              </h3>
              <p className="text-xs text-[#475569] max-w-md mx-auto leading-relaxed">
                {isFemale
                  ? 'Connect your gynecologist, reproductive endocrinologist, or family members to share longitudinal summaries on your terms.'
                  : 'Connect your andrologist, endocrinologist, or family members to share longitudinal summaries on your terms.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleOpenAddModal('doctor')}
              className={`px-6 py-2.5 rounded-xl font-sans font-semibold text-xs text-white ${isFemale ? 'bg-[#F43F7D] hover:bg-[#E11D48]' : 'bg-[#0288D1] hover:bg-[#0277BD]'} shadow-sm transition-all inline-flex items-center gap-2 cursor-pointer`}
            >
              <Plus className="w-3.5 h-3.5 text-white" aria-hidden="true" />
              <span>Add Someone You Trust</span>
            </button>
          </div>
        )}
      </div>

      {/* ── 3. PENDING INVITATIONS ── */}
      <CareCirclePendingInvites
        invitations={careCircleInvitations}
        isFemale={isFemale}
        onDeleteInvite={async (id) => {
          return await deleteCareMember(id);
        }}
      />

      {/* ── 4. EMERGENCY SAFETY CONTACTS ── */}
      <div className={`p-6 sm:p-8 rounded-2xl bg-white border ${isFemale ? 'border-[#F3E8EC]' : 'border-[#BAE6FD]'} shadow-sm space-y-4`}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold font-display text-[#0F172A]">
              Emergency Safety Contacts
            </h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              Contacts designated to receive critical alerts during unexpected health anomalies.
            </p>
          </div>
          <button
            type="button"
            onClick={() => openAiChatWithPrompt('How do I update my emergency safety contacts?')}
            className={`text-xs font-bold ${isFemale ? 'text-[#F43F7D] hover:text-[#BE185D]' : 'text-[#0288D1] hover:text-[#01579B]'} transition-colors`}
          >
            Update Contacts
          </button>
        </div>

        {emergencyContacts.length > 0 && emergencyContacts[0]?.name ? (
          <div className="space-y-3">
            {emergencyContacts.map((contact, idx) => (
              <div
                key={contact.id || idx}
                className={`p-5 rounded-xl ${isFemale ? 'bg-[#FFF8FA] border-[#FDE6EF]' : 'bg-[#F0F9FF] border-[#BAE6FD]'} border flex flex-col sm:flex-row sm:items-center justify-between gap-4`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[#0F172A]">{contact.name}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#ECFDF5] text-[#047857] font-bold">
                      {contact.isPrimary ? 'Primary Safety Contact' : 'Secondary'}
                    </span>
                  </div>
                  <span className="text-xs text-[#475569] block mt-0.5">
                    {contact.relationship} • {contact.phone}
                  </span>
                </div>

                <span className="text-xs font-mono text-[#047857] font-bold flex items-center gap-1">
                  <ShieldTick className="w-4 h-4 text-[#047857]" aria-hidden="true" />
                  <span>Instant Safety Alert Active</span>
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 rounded-xl bg-[#F8FAFC] border border-dashed border-[#E2E8F0] text-center">
            <p className="text-xs text-[#64748B]">No emergency contacts registered in your profile.</p>
          </div>
        )}
      </div>

      {/* ── 5. MODALS ── */}
      <AddCareMemberModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        initialRole={initialAddRole}
        onSubmit={async (input) => {
          return await addCareMember(input);
        }}
      />

      <ManageAccessModal
        isOpen={!!selectedMemberForManage}
        member={selectedMemberForManage}
        onClose={() => setSelectedMemberForManage(null)}
        onUpdatePermissions={async (memberId, perms) => {
          return await updateMemberPermissions(memberId, perms);
        }}
        onRequestRevoke={(member) => {
          setSelectedMemberForRevoke(member);
        }}
      />

      <RevokeAccessConfirmModal
        isOpen={!!selectedMemberForRevoke}
        member={selectedMemberForRevoke}
        onClose={() => setSelectedMemberForRevoke(null)}
        onConfirm={handleConfirmRevoke}
        loading={isRevoking}
      />
    </motion.div>
  );
};

export default CareCirclePage;
