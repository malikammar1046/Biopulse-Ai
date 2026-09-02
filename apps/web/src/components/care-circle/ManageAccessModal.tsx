import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Stethoscope,
  Heart,
  Users,
  Check,
  Lock,
  Trash2,
  Save,
  CheckCircle2,
  Building2,
  Mail,
} from 'lucide-react';
import type {
  CareCircleMember,
  CareCirclePermissionsMap,
  CareCirclePreset,
} from '../../types/careCircle';
import {
  CARE_CIRCLE_PERMISSION_DEFINITIONS,
  PRESET_PERMISSIONS,
} from '../../types/careCircle';

interface ManageAccessModalProps {
  isOpen: boolean;
  member: CareCircleMember | null;
  onClose: () => void;
  onUpdatePermissions: (memberId: string, perms: CareCirclePermissionsMap) => Promise<{ success: boolean; error?: string }>;
  onRequestRevoke: (member: CareCircleMember) => void;
}

export const ManageAccessModal: React.FC<ManageAccessModalProps> = ({
  isOpen,
  member,
  onClose,
  onUpdatePermissions,
  onRequestRevoke,
}) => {
  const [permissions, setPermissions] = useState<CareCirclePermissionsMap>(
    member?.permissions || PRESET_PERMISSIONS.private
  );
  const [preset, setPreset] = useState<CareCirclePreset>('custom');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (member) {
      setPermissions(member.permissions);
    }
  }, [member]);

  if (!isOpen || !member) return null;

  const handlePresetSelect = (selectedPreset: CareCirclePreset) => {
    setPreset(selectedPreset);
    setPermissions({ ...PRESET_PERMISSIONS[selectedPreset] });
  };

  const handleToggle = (key: keyof CareCirclePermissionsMap) => {
    setPreset('custom');
    setPermissions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setSaving(true);
    const res = await onUpdatePermissions(member.id, permissions);
    setSaving(false);
    if (res.success) {
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 1200);
    }
  };

  const IconComponent =
    member.role === 'doctor' ? Stethoscope : member.role === 'family' ? Heart : Users;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-[#10071A]/70 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-[36px] shadow-2xl border border-[#E7DFEF] flex flex-col text-left select-none z-10 overflow-hidden"
        >
          {/* Top Bar */}
          <div className="p-6 sm:p-7 border-b border-[#E7DFEF] flex items-center justify-between shrink-0 bg-gradient-to-r from-[#FAF5FF] via-white to-[#FFF5F7]">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[#EDE4F7] text-[#6E2D8B] flex items-center justify-center shadow-xs">
                <IconComponent className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold font-display text-[#1C1326]">
                  Manage Access
                </h3>
                <p className="text-xs text-[#584B68]">
                  Control what <span className="font-semibold text-[#1C1326]">{member.name}</span> can view.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-2xl text-[#8D7E9E] hover:text-[#1C1326] hover:bg-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-6">
            {/* Member Profile Badge */}
            <div className="p-4 rounded-3xl bg-[#F8F5FA] border border-[#E7DFEF] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-[#1C1326]">{member.name}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#EDE4F7] text-[#6E2D8B] font-bold capitalize">
                    {member.relationship || member.role}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#584B68]">
                  <span className="inline-flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-[#8D7E9E]" />
                    {member.email}
                  </span>
                  {member.clinicOrganization && (
                    <span className="inline-flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-[#8D7E9E]" />
                      {member.clinicOrganization}
                    </span>
                  )}
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-2">
                <span className="text-[11px] font-mono px-2.5 py-1 rounded-xl bg-[#ECFDF5] text-[#047857] font-bold">
                  ● {member.status === 'active' ? 'Connected' : 'Pending Invite'}
                </span>
              </div>
            </div>

            {/* Presets Quick Picker */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-[#1C1326] font-display block">
                Quick Access Presets
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { id: 'private', label: 'PRIVATE', desc: 'No access' },
                  { id: 'support', label: 'SUPPORT', desc: 'Cycle & Symptoms' },
                  { id: 'doctor', label: 'DOCTOR', desc: 'Clinical & Reports' },
                  { id: 'custom', label: 'CUSTOM', desc: 'Custom toggles' },
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

            {/* Granular Permission Toggles */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-[#1C1326] font-display block">
                Granular Permissions
              </span>

              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {CARE_CIRCLE_PERMISSION_DEFINITIONS.map((def) => {
                  const isEnabled = permissions[def.key];
                  return (
                    <div
                      key={def.key}
                      onClick={() => handleToggle(def.key)}
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

                      {/* Toggle Switch */}
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
          </div>

          {/* Footer Actions */}
          <div className="p-6 sm:p-7 border-t border-[#E7DFEF] bg-[#FAF5FF]/50 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
            <button
              type="button"
              onClick={() => onRequestRevoke(member)}
              className="w-full sm:w-auto px-4 py-2.5 rounded-2xl font-sans font-bold text-xs text-[#E11D48] hover:bg-[#FFE4E6]/60 border border-[#FDA4AF]/40 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Remove Access</span>
            </button>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-none px-5 py-2.5 rounded-2xl font-sans font-bold text-xs text-[#584B68] bg-white border border-[#E7DFEF] hover:bg-[#F8F5FA] transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="flex-1 sm:flex-none px-6 py-2.5 rounded-2xl font-sans font-bold text-xs text-white bg-gradient-to-r from-[#6E2D8B] via-[#8E3EAF] to-[#E87084] hover:brightness-110 shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {saving ? (
                  <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                ) : saveSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-[#34D399]" />
                    <span>Permissions Updated ✓</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
