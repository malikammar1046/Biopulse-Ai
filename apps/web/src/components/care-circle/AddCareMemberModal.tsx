import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Stethoscope,
  Heart,
  Users,
  Check,
  Shield,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Copy,
  CheckCircle2,
  Lock,
  Building2,
  Mail,
  User,
  MessageSquare,
  AlertCircle,
} from 'lucide-react';
import type {
  CareCircleRole,
  CareCirclePreset,
  CareCirclePermissionsMap,
  CareCircleInviteInput,
} from '../../types/careCircle';
import {
  CARE_CIRCLE_PERMISSION_DEFINITIONS,
  PRESET_PERMISSIONS,
} from '../../types/careCircle';

interface AddCareMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: CareCircleInviteInput) => Promise<{ success: boolean; inviteLink?: string; error?: string }>;
  initialRole?: CareCircleRole;
}

export const AddCareMemberModal: React.FC<AddCareMemberModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialRole = 'doctor',
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [role, setRole] = useState<CareCircleRole>(initialRole);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [relationship, setRelationship] = useState('');
  const [clinicOrganization, setClinicOrganization] = useState('');
  const [preset, setPreset] = useState<CareCirclePreset>('doctor');
  const [permissions, setPermissions] = useState<CareCirclePermissionsMap>(PRESET_PERMISSIONS.doctor);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [generatedInviteLink, setGeneratedInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Sync preset choice to permissions
  const handlePresetSelect = (selectedPreset: CareCirclePreset) => {
    setPreset(selectedPreset);
    setPermissions({ ...PRESET_PERMISSIONS[selectedPreset] });
  };

  const handleTogglePermission = (key: keyof CareCirclePermissionsMap) => {
    setPreset('custom');
    setPermissions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const resetForm = () => {
    setStep(1);
    setRole(initialRole);
    setName('');
    setEmail('');
    setRelationship('');
    setClinicOrganization('');
    setPreset(initialRole === 'doctor' ? 'doctor' : 'support');
    setPermissions(initialRole === 'doctor' ? PRESET_PERMISSIONS.doctor : PRESET_PERMISSIONS.support);
    setErrorMessage(null);
    setGeneratedInviteLink(null);
    setCopied(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleRoleSelect = (selectedRole: CareCircleRole) => {
    setRole(selectedRole);
    if (selectedRole === 'doctor') {
      setPreset('doctor');
      setPermissions({ ...PRESET_PERMISSIONS.doctor });
      if (!relationship) setRelationship('Gynecologist / Reproductive Endocrinologist');
    } else if (selectedRole === 'family') {
      setPreset('support');
      setPermissions({ ...PRESET_PERMISSIONS.support });
      if (!relationship) setRelationship('Sister');
    } else {
      setPreset('support');
      setPermissions({ ...PRESET_PERMISSIONS.support });
      if (!relationship) setRelationship('Trusted Friend');
    }
    setStep(2);
  };

  const handleStep2Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setErrorMessage('Please enter both name and email address.');
      return;
    }
    setErrorMessage(null);
    setStep(3);
  };

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);

    const input: CareCircleInviteInput = {
      role,
      name: name.trim(),
      email: email.trim(),
      relationship: relationship.trim() || (role === 'doctor' ? 'Doctor' : 'Trusted Contact'),
      clinicOrganization: clinicOrganization.trim() || undefined,
      preset,
      permissions,
    };

    const res = await onSubmit(input);
    setIsSubmitting(false);

    if (res.success && res.inviteLink) {
      setGeneratedInviteLink(res.inviteLink);
      setStep(4);
    } else {
      setErrorMessage(res.error || 'Failed to create care invitation.');
    }
  };

  const handleCopyLink = () => {
    if (generatedInviteLink) {
      navigator.clipboard.writeText(generatedInviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="fixed inset-0 bg-[#10071A]/70 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-[36px] shadow-2xl border border-[#E7DFEF] flex flex-col text-left select-none z-10 overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 sm:p-7 border-b border-[#E7DFEF] flex items-center justify-between shrink-0 bg-gradient-to-r from-[#FAF5FF] via-white to-[#FFF5F7]">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-xl bg-[#EDE4F7] text-[#6E2D8B]">
                  <Users className="w-4 h-4" />
                </span>
                <h3 className="text-xl font-bold font-display text-[#1C1326]">
                  {step === 4 ? 'Invitation Created' : 'Add to Care Circle'}
                </h3>
              </div>
              <p className="text-xs text-[#584B68]">
                {step === 1 && 'Step 1 of 3: Choose who can support your health journey.'}
                {step === 2 && 'Step 2 of 3: Enter contact information.'}
                {step === 3 && 'Step 3 of 3: Set granular access permissions.'}
                {step === 4 && 'Your invite link is ready to share.'}
              </p>
            </div>

            <button
              type="button"
              onClick={handleClose}
              className="p-2 rounded-2xl text-[#8D7E9E] hover:text-[#1C1326] hover:bg-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Content Body */}
          <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-6">
            {errorMessage && (
              <div className="p-4 rounded-2xl bg-[#FFF1F2] border border-[#FFE4E6] flex items-center gap-3 text-xs text-[#E11D48]">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* ── STEP 1: ROLE SELECTION ── */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="text-center sm:text-left space-y-1">
                  <h4 className="text-base font-bold font-display text-[#1C1326]">
                    Who are you adding?
                  </h4>
                  <p className="text-xs text-[#584B68]">
                    You remain the owner of your data. You decide what they can see.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  {/* Doctor Card */}
                  <button
                    type="button"
                    onClick={() => handleRoleSelect('doctor')}
                    className="p-6 rounded-3xl border-2 text-left transition-all flex flex-col justify-between gap-4 group cursor-pointer hover:border-[#6E2D8B] hover:bg-[#FAF5FF] border-[#E7DFEF] bg-white shadow-xs"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-[#EDE4F7] text-[#6E2D8B] flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Stethoscope className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="font-bold text-sm text-[#1C1326] block">
                        Doctor / Clinician
                      </span>
                      <span className="text-[11px] text-[#584B68] block mt-1 leading-snug">
                        Gynecologist, endocrinologist, or fertility specialist.
                      </span>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-[#6E2D8B] inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      Select Doctor <ArrowRight className="w-3 h-3" />
                    </span>
                  </button>

                  {/* Family Member Card */}
                  <button
                    type="button"
                    onClick={() => handleRoleSelect('family')}
                    className="p-6 rounded-3xl border-2 text-left transition-all flex flex-col justify-between gap-4 group cursor-pointer hover:border-[#E87084] hover:bg-[#FFF5F7] border-[#E7DFEF] bg-white shadow-xs"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-[#FFE4E6] text-[#E11D48] flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Heart className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="font-bold text-sm text-[#1C1326] block">
                        Family Member
                      </span>
                      <span className="text-[11px] text-[#584B68] block mt-1 leading-snug">
                        Mother, sister, partner, or daughter for personal support.
                      </span>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-[#E11D48] inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      Select Family <ArrowRight className="w-3 h-3" />
                    </span>
                  </button>

                  {/* Trusted Person Card */}
                  <button
                    type="button"
                    onClick={() => handleRoleSelect('trusted_person')}
                    className="p-6 rounded-3xl border-2 text-left transition-all flex flex-col justify-between gap-4 group cursor-pointer hover:border-[#8E3EAF] hover:bg-[#FAF5FF] border-[#E7DFEF] bg-white shadow-xs"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-[#EDE4F7] text-[#8E3EAF] flex items-center justify-center group-hover:scale-110 transition-transform">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="font-bold text-sm text-[#1C1326] block">
                        Trusted Person
                      </span>
                      <span className="text-[11px] text-[#584B68] block mt-1 leading-snug">
                        Close friend, wellness advocate, or personal caregiver.
                      </span>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-[#8E3EAF] inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      Select Trusted <ArrowRight className="w-3 h-3" />
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 2: DETAILS ENTRY ── */}
            {step === 2 && (
              <form onSubmit={handleStep2Submit} className="space-y-4">
                <div className="p-3.5 rounded-2xl bg-[#F8F5FA] border border-[#E7DFEF] flex items-center justify-between text-xs">
                  <span className="text-[#584B68]">Adding as:</span>
                  <span className="font-mono font-bold px-3 py-1 rounded-full bg-[#EDE4F7] text-[#6E2D8B] capitalize">
                    {role === 'doctor' ? 'Doctor / Healthcare Professional' : role === 'family' ? 'Family Member' : 'Trusted Person'}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#1C1326] font-display">
                    Full Name *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-[#8D7E9E] absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      required
                      placeholder={role === 'doctor' ? 'e.g. Dr. Sarah Malik' : 'e.g. Mariam Khan'}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#F8F5FA] border border-[#E7DFEF] text-sm text-[#1C1326] focus:outline-hidden focus:border-[#6E2D8B] focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#1C1326] font-display">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#8D7E9E] absolute left-3.5 top-3.5" />
                    <input
                      type="email"
                      required
                      placeholder="e.g. sarah.malik@clinic.org"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#F8F5FA] border border-[#E7DFEF] text-sm text-[#1C1326] focus:outline-hidden focus:border-[#6E2D8B] focus:bg-white transition-all"
                    />
                  </div>
                  <span className="text-[10px] text-[#8D7E9E] block">
                    They will receive a private invitation link to view your permitted health summary.
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#1C1326] font-display">
                    Relationship / Role
                  </label>
                  <input
                    type="text"
                    placeholder={
                      role === 'doctor'
                        ? 'e.g. Gynecologist, Reproductive Endocrinologist'
                        : role === 'family'
                        ? 'e.g. Mother, Sister, Husband, Partner'
                        : 'e.g. Close Friend, Nutrition Coach'
                    }
                    value={relationship}
                    onChange={(e) => setRelationship(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-[#F8F5FA] border border-[#E7DFEF] text-sm text-[#1C1326] focus:outline-hidden focus:border-[#6E2D8B] focus:bg-white transition-all"
                  />
                </div>

                {role === 'doctor' && (
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-[#1C1326] font-display">
                      Clinic / Organization (Optional)
                    </label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 text-[#8D7E9E] absolute left-3.5 top-3.5" />
                      <input
                        type="text"
                        placeholder="e.g. Harley St. Women’s Health, City Hospital"
                        value={clinicOrganization}
                        onChange={(e) => setClinicOrganization(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#F8F5FA] border border-[#E7DFEF] text-sm text-[#1C1326] focus:outline-hidden focus:border-[#6E2D8B] focus:bg-white transition-all"
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-[#E7DFEF]">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-4 py-2.5 rounded-2xl font-sans font-bold text-xs text-[#584B68] bg-[#F8F5FA] hover:bg-[#EDE4F7] transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>

                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-2xl font-sans font-bold text-xs text-white bg-gradient-to-r from-[#6E2D8B] via-[#8E3EAF] to-[#E87084] hover:brightness-110 shadow-md transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <span>Choose Permissions</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            )}

            {/* ── STEP 3: GRANULAR PERMISSIONS & PRESETS ── */}
            {step === 3 && (
              <div className="space-y-6">
                {/* Presets Header */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-[#1C1326] font-display block">
                    Access Level Presets
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {[
                      { id: 'private', label: 'PRIVATE', desc: 'No sharing' },
                      { id: 'support', label: 'SUPPORT', desc: 'Cycle & Symptoms' },
                      { id: 'doctor', label: 'DOCTOR', desc: 'Clinical & Reports' },
                      { id: 'custom', label: 'CUSTOM', desc: 'Custom choice' },
                    ].map((p) => {
                      const isSelected = preset === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handlePresetSelect(p.id as CareCirclePreset)}
                          className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#180A26] border-[#6E2D8B] text-white shadow-md'
                              : 'bg-[#F8F5FA] border-[#E7DFEF] text-[#1C1326] hover:bg-[#EDE4F7]'
                          }`}
                        >
                          <span className={`text-[11px] font-mono font-bold block ${isSelected ? 'text-[#FDA4AF]' : 'text-[#6E2D8B]'}`}>
                            {p.label}
                          </span>
                          <span className={`text-[10px] block truncate ${isSelected ? 'text-[#CDBDD8]' : 'text-[#584B68]'}`}>
                            {p.desc}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Privacy Guarantee Note */}
                <div className="p-4 rounded-2xl bg-[#EDE4F7]/60 border border-[#D8B4FE]/50 flex items-start gap-3">
                  <Shield className="w-4 h-4 text-[#6E2D8B] shrink-0 mt-0.5" />
                  <div className="text-xs space-y-0.5">
                    <span className="font-bold text-[#1C1326] block">
                      Patient Ownership Guarantee
                    </span>
                    <span className="text-[#584B68] text-[11px] leading-relaxed block">
                      You can instantly revoke access or adjust any of these toggles anytime from your Care Circle dashboard.
                    </span>
                  </div>
                </div>

                {/* Granular Permission Toggles List */}
                <div className="space-y-3">
                  <span className="text-xs font-bold text-[#1C1326] font-display block">
                    What {name || 'they'} can see:
                  </span>

                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {CARE_CIRCLE_PERMISSION_DEFINITIONS.map((def) => {
                      const isEnabled = permissions[def.key];
                      return (
                        <div
                          key={def.key}
                          onClick={() => handleTogglePermission(def.key)}
                          className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-4 cursor-pointer ${
                            isEnabled
                              ? 'bg-[#FAF5FF] border-[#D8B4FE]'
                              : 'bg-white border-[#E7DFEF] hover:bg-[#F8F5FA]'
                          }`}
                        >
                          <div className="space-y-0.5 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-[#1C1326]">{def.label}</span>
                              {def.isSensitive && (
                                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-[#FFE4E6] text-[#E11D48] font-bold">
                                  Sensitive
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-[#584B68] leading-tight">
                              {def.description}
                            </p>
                          </div>

                          {/* Switch Switcher */}
                          <div
                            className={`w-11 h-6 rounded-full transition-colors relative shrink-0 p-0.5 ${
                              isEnabled ? 'bg-gradient-to-r from-[#6E2D8B] to-[#E87084]' : 'bg-[#D1C7DC]'
                            }`}
                          >
                            <motion.div
                              layout
                              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                              className={`w-5 h-5 rounded-full bg-white shadow-sm flex items-center justify-center ${
                                isEnabled ? 'ml-auto' : 'ml-0'
                              }`}
                            >
                              {isEnabled ? (
                                <Check className="w-3 h-3 text-[#6E2D8B]" />
                              ) : (
                                <Lock className="w-2.5 h-2.5 text-[#8D7E9E]" />
                              )}
                            </motion.div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* AI Chat Topics Clarification */}
                <div className="p-3.5 rounded-2xl bg-[#FFFBEB] border border-[#FDE68A] flex items-start gap-2.5 text-xs text-[#92400E]">
                  <MessageSquare className="w-4 h-4 shrink-0 mt-0.5 text-[#D97706]" />
                  <p className="text-[11px] leading-relaxed">
                    <strong>Zero-Compromise Chat Privacy:</strong> Enabling "Health Topics Summary" only shares broad discussion themes (e.g. cycle timing queries). Raw private conversation transcripts are never shared with doctors or family.
                  </p>
                </div>

                {/* Footer Navigation */}
                <div className="flex items-center justify-between pt-4 border-t border-[#E7DFEF]">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    disabled={isSubmitting}
                    className="px-4 py-2.5 rounded-2xl font-sans font-bold text-xs text-[#584B68] bg-[#F8F5FA] hover:bg-[#EDE4F7] transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleFinalSubmit}
                    disabled={isSubmitting}
                    className="px-6 py-3 rounded-2xl font-sans font-bold text-xs text-white bg-gradient-to-r from-[#6E2D8B] via-[#8E3EAF] to-[#E87084] hover:brightness-110 shadow-lg shadow-purple-950/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                        <span>Creating Invitation...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-[#FDA4AF]" />
                        <span>Send Invitation & Generate Link</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 4: INVITATION READY / LINK GENERATION ── */}
            {step === 4 && generatedInviteLink && (
              <div className="space-y-6 text-center">
                <div className="w-16 h-16 rounded-3xl bg-[#ECFDF5] text-[#047857] flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 className="w-8 h-8" />
                </div>

                <div className="space-y-1">
                  <h4 className="text-xl font-bold font-display text-[#1C1326]">
                    {name} has been invited!
                  </h4>
                  <p className="text-xs text-[#584B68] max-w-md mx-auto leading-relaxed">
                    An invitation was created for <span className="font-semibold text-[#1C1326]">{email}</span>. Share the private portal link below with them to activate their view.
                  </p>
                </div>

                {/* Copyable Link Box */}
                <div className="p-4 rounded-3xl bg-[#F8F5FA] border border-[#E7DFEF] space-y-3 text-left">
                  <span className="text-[10px] font-mono text-[#8D7E9E] uppercase block font-bold">
                    Direct Care Provider Link
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={generatedInviteLink}
                      className="flex-1 px-3.5 py-2.5 rounded-xl bg-white border border-[#E7DFEF] font-mono text-xs text-[#6E2D8B] truncate focus:outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="px-4 py-2.5 rounded-xl font-sans font-bold text-xs text-white bg-gradient-to-r from-[#6E2D8B] to-[#8E3EAF] hover:brightness-110 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
                    >
                      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Copied!' : 'Copy Link'}</span>
                    </button>
                  </div>
                </div>

                {/* View/Test Portal Link Action */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  <a
                    href={generatedInviteLink}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full sm:w-auto px-6 py-3 rounded-2xl font-sans font-bold text-xs text-[#6E2D8B] bg-[#EDE4F7] hover:bg-[#E7DFEF] transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Preview Doctor / Portal View</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>

                  <button
                    type="button"
                    onClick={handleClose}
                    className="w-full sm:w-auto px-8 py-3 rounded-2xl font-sans font-bold text-xs text-white bg-[#180A26] hover:bg-[#2A1143] transition-all cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
