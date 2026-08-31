import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Plus,
  Stethoscope,
  Heart,
  ShieldCheck,
  Lock,
} from 'lucide-react';
import { useUserHealth } from '../../context/UserHealthContext';
import type { CareCircleMember, CareCircleRole } from '../../types/careCircle';
import { AddCareMemberModal } from '../../components/care-circle/AddCareMemberModal';
import { ManageAccessModal } from '../../components/care-circle/ManageAccessModal';
import { RevokeAccessConfirmModal } from '../../components/care-circle/RevokeAccessConfirmModal';
import { CareCircleMemberCard } from '../../components/care-circle/CareCircleMemberCard';
import { CareCirclePendingInvites } from '../../components/care-circle/CareCirclePendingInvites';

export const CareCirclePage: React.FC = () => {
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
      <div className="relative p-6 sm:p-10 rounded-[36px] bg-gradient-to-r from-[#180A26] via-[#150824] to-[#250F38] text-white shadow-xl border border-white/10 overflow-hidden">
        {/* Ambient volumetric light */}
        <div className="absolute top-0 right-10 w-96 h-96 bg-[#6E2D8B]/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/3 w-64 h-64 bg-[#E87084]/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-mono font-bold text-[#FDA4AF] backdrop-blur-md">
              <ShieldCheck className="w-3.5 h-3.5 text-[#FB7185]" />
              <span>Zero-Compromise Patient Consent</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold font-display text-white tracking-tight">
              My Care Circle
            </h1>

            <p className="text-xs sm:text-sm text-[#CDBDD8] font-sans leading-relaxed">
              Choose who can support you and control what they can see. People you trust can support your health journey — with your permission.
            </p>

            {/* Quick Stat Badges */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <div className="px-3.5 py-1.5 rounded-xl bg-white/[0.07] border border-white/10 text-xs font-mono text-white">
                <span className="text-[#FDA4AF] font-bold">{activeMembers.length}</span> Active Connections
              </div>
              <div className="px-3.5 py-1.5 rounded-xl bg-white/[0.07] border border-white/10 text-xs font-mono text-white">
                <span className="text-[#FCD34D] font-bold">{careCircleInvitations.length || pendingMembers.length}</span> Pending
              </div>
              <div className="px-3.5 py-1.5 rounded-xl bg-white/[0.07] border border-white/10 text-xs font-mono text-[#34D399] flex items-center gap-1.5">
                <Lock className="w-3 h-3" />
                <span>Instant Revocation Enabled</span>
              </div>
            </div>
          </div>

          {/* Quick Action Button Group */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
            <button
              type="button"
              onClick={() => handleOpenAddModal('doctor')}
              className="px-5 py-3 rounded-2xl font-sans font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-[#6E2D8B] via-[#8E3EAF] to-[#E87084] hover:brightness-110 shadow-lg shadow-purple-950/40 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Stethoscope className="w-4 h-4 text-[#FDA4AF]" />
              <span>Add Doctor / Clinician</span>
            </button>

            <button
              type="button"
              onClick={() => handleOpenAddModal('family')}
              className="px-5 py-3 rounded-2xl font-sans font-bold text-xs sm:text-sm text-[#1C1326] bg-white hover:bg-[#FAF5FF] shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Heart className="w-4 h-4 text-[#E11D48]" />
              <span>Add Family Member</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── 2. ACTIVE CONNECTIONS SECTION ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-[#EDE4F7] text-[#6E2D8B]">
              <Users className="w-4 h-4" />
            </span>
            <h2 className="text-lg font-bold font-display text-[#1C1326]">
              Active Connections ({activeMembers.length})
            </h2>
          </div>

          <button
            type="button"
            onClick={() => handleOpenAddModal('trusted_person')}
            className="text-xs font-bold text-[#6E2D8B] hover:text-[#A21CAF] transition-colors inline-flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Trusted Person</span>
          </button>
        </div>

        {careCircleLoading ? (
          <div className="p-12 rounded-[32px] bg-white border border-[#E7DFEF] text-center space-y-3">
            <div className="w-8 h-8 rounded-full border-2 border-[#6E2D8B] border-t-transparent animate-spin mx-auto" />
            <span className="text-xs font-mono text-[#8D7E9E] block">
              Loading Care Circle members...
            </span>
          </div>
        ) : activeMembers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {activeMembers.map((member) => (
              <CareCircleMemberCard
                key={member.id}
                member={member}
                onManageAccess={(m) => setSelectedMemberForManage(m)}
                onRevokeAccess={(m) => setSelectedMemberForRevoke(m)}
              />
            ))}
          </div>
        ) : (
          <div className="p-8 sm:p-12 rounded-[32px] bg-white border border-dashed border-[#D8B4FE] text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-[#EDE4F7] text-[#6E2D8B] flex items-center justify-center mx-auto">
              <Users className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold font-display text-[#1C1326]">
                Your Care Circle is empty
              </h3>
              <p className="text-xs text-[#584B68] max-w-md mx-auto leading-relaxed">
                Connect your gynecologist, reproductive endocrinologist, or family members to share longitudinal summaries on your terms.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleOpenAddModal('doctor')}
              className="px-6 py-2.5 rounded-2xl font-sans font-bold text-xs text-white bg-gradient-to-r from-[#6E2D8B] to-[#8E3EAF] hover:brightness-110 shadow-md transition-all inline-flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Someone You Trust</span>
            </button>
          </div>
        )}
      </div>

      {/* ── 3. PENDING INVITATIONS ── */}
      <CareCirclePendingInvites
        invitations={careCircleInvitations}
        onDeleteInvite={async (id) => {
          return await deleteCareMember(id);
        }}
      />

      {/* ── 4. EMERGENCY SAFETY CONTACTS ── */}
      <div className="p-6 sm:p-8 rounded-[32px] bg-white border border-[#E7DFEF] shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold font-display text-[#1C1326]">
              Emergency Safety Contacts
            </h2>
            <p className="text-xs text-[#584B68] mt-0.5">
              Contacts designated to receive critical alerts during unexpected health anomalies.
            </p>
          </div>
          <button
            type="button"
            onClick={() => openAiChatWithPrompt('How do I update my emergency safety contacts?')}
            className="text-xs font-bold text-[#6E2D8B] hover:text-[#A21CAF] transition-colors"
          >
            Update Contacts
          </button>
        </div>

        {emergencyContacts.length > 0 && emergencyContacts[0]?.name ? (
          <div className="space-y-3">
            {emergencyContacts.map((contact, idx) => (
              <div
                key={contact.id || idx}
                className="p-5 rounded-2xl bg-[#F8F5FA] border border-[#E7DFEF] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[#1C1326]">{contact.name}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#ECFDF5] text-[#047857] font-bold">
                      {contact.isPrimary ? 'Primary Safety Contact' : 'Secondary'}
                    </span>
                  </div>
                  <span className="text-xs text-[#584B68] block mt-0.5">
                    {contact.relationship} • {contact.phone}
                  </span>
                </div>

                <span className="text-xs font-mono text-[#047857] font-bold flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Instant Safety Alert Active</span>
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 rounded-2xl bg-[#F8F5FA] border border-dashed border-[#E7DFEF] text-center">
            <p className="text-xs text-[#584B68]">No emergency contacts registered in your profile.</p>
          </div>
        )}
      </div>

      {/* ── 5. MODALS ── */}
      <AddCareMemberModal
        isOpen={isAddModalOpen}
        initialRole={initialAddRole}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={async (input) => {
          return await addCareMember(input);
        }}
      />

      <ManageAccessModal
        isOpen={Boolean(selectedMemberForManage)}
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
        isOpen={Boolean(selectedMemberForRevoke)}
        member={selectedMemberForRevoke}
        loading={isRevoking}
        onClose={() => setSelectedMemberForRevoke(null)}
        onConfirm={handleConfirmRevoke}
      />
    </motion.div>
  );
};

export default CareCirclePage;
