import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Settings,
  User,
  HeartPulse,
  Calendar,
  Utensils,
  Target,
  ShieldCheck,
  Save,
  CheckCircle2,
  RefreshCw,
  Plus,
  X,
} from 'lucide-react';
import { useUserHealth } from '../../context/UserHealthContext';
import { useAuth } from '../../context/AuthContext';
import { ROUTES } from '../../constants/routes';
import type { UserProfile, EmergencyContact, MedicationItem } from '../../types/onboarding';
import {
  DEFAULT_ALLERGY_OPTIONS,
  DEFAULT_CONDITION_OPTIONS,
  DEFAULT_SYMPTOM_OPTIONS,
  DIETARY_PREFERENCE_OPTIONS,
  EXERCISE_PREFERENCE_OPTIONS,
  HEALTH_GOAL_OPTIONS,
} from '../../data/mockOnboardingData';

const TABS = [
  { id: 'personal', label: 'Personal & Basics', icon: User },
  { id: 'emergency', label: 'Safety & Contacts', icon: ShieldCheck },
  { id: 'medical', label: 'Medical History', icon: HeartPulse },
  { id: 'cycle', label: "Women's Health", icon: Calendar },
  { id: 'lifestyle', label: 'Lifestyle & Diet', icon: Utensils },
  { id: 'goals', label: 'Goals & Preferences', icon: Target },
];

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Not Sure'];

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80',
];

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { userProfile, updateUserProfile, resetToDefaultProfile } = useUserHealth();
  const { logout } = useAuth();

  const [activeTab, setActiveTab] = useState('personal');
  const [draft, setDraft] = useState<UserProfile>(() => JSON.parse(JSON.stringify(userProfile)));
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | undefined>(undefined);

  // Sub-form temp inputs
  const [customAllergy, setCustomAllergy] = useState('');
  const [customCondition, setCustomCondition] = useState('');
  const [newMedName, setNewMedName] = useState('');
  const [newMedDosage, setNewMedDosage] = useState('');
  const [newMedFreq, setNewMedFreq] = useState('');
  const [showAddMed, setShowAddMed] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(undefined);
    setSaveSuccess(false);

    try {
      const res = await updateUserProfile(draft);
      if (res.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        setSaveError(res.error || 'Failed to update profile.');
      }
    } catch {
      setSaveError('A connection error occurred while saving profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRestartOnboarding = () => {
    navigate(ROUTES.ONBOARDING, { state: { allowReonboard: true } });
  };

  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.LOGIN);
  };

  const handleReset = () => {
    resetToDefaultProfile();
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  const primaryContact: EmergencyContact = draft.emergencyContacts?.[0] || {
    name: '',
    relationship: 'Partner / Spouse',
    phone: '',
    isPrimary: true,
  };

  const updatePrimary = (field: keyof EmergencyContact, val: string) => {
    const list = [...(draft.emergencyContacts || [])];
    list[0] = { ...primaryContact, [field]: val, isPrimary: true };
    setDraft((prev) => ({ ...prev, emergencyContacts: list }));
  };

  const toggleAllergy = (allergy: string) => {
    const list = [...(draft.medical?.allergies || [])];
    if (allergy === 'None') {
      setDraft((prev) => ({ ...prev, medical: { ...prev.medical, allergies: ['None'] } }));
      return;
    }
    const filtered = list.filter((a) => a !== 'None');
    if (filtered.includes(allergy)) {
      setDraft((prev) => ({ ...prev, medical: { ...prev.medical, allergies: filtered.filter((a) => a !== allergy) } }));
    } else {
      setDraft((prev) => ({ ...prev, medical: { ...prev.medical, allergies: [...filtered, allergy] } }));
    }
  };

  const addCustomAllergy = () => {
    if (!customAllergy.trim()) return;
    const list = (draft.medical?.allergies || []).filter((a) => a !== 'None');
    if (!list.includes(customAllergy.trim())) {
      setDraft((prev) => ({ ...prev, medical: { ...prev.medical, allergies: [...list, customAllergy.trim()] } }));
    }
    setCustomAllergy('');
  };

  const toggleCondition = (cond: string) => {
    const list = [...(draft.medical?.conditions || [])];
    if (cond === 'None') {
      setDraft((prev) => ({ ...prev, medical: { ...prev.medical, conditions: ['None'] } }));
      return;
    }
    const filtered = list.filter((c) => c !== 'None');
    if (filtered.includes(cond)) {
      setDraft((prev) => ({ ...prev, medical: { ...prev.medical, conditions: filtered.filter((c) => c !== cond) } }));
    } else {
      setDraft((prev) => ({ ...prev, medical: { ...prev.medical, conditions: [...filtered, cond] } }));
    }
  };

  const addCustomCondition = () => {
    if (!customCondition.trim()) return;
    const list = (draft.medical?.conditions || []).filter((c) => c !== 'None');
    if (!list.includes(customCondition.trim())) {
      setDraft((prev) => ({ ...prev, medical: { ...prev.medical, conditions: [...list, customCondition.trim()] } }));
    }
    setCustomCondition('');
  };

  const handleAddMed = () => {
    if (!newMedName.trim()) return;
    const item: MedicationItem = {
      id: `med_${Date.now()}`,
      name: newMedName.trim(),
      dosage: newMedDosage.trim() || 'Standard Dose',
      frequency: newMedFreq.trim() || 'Daily',
      takenToday: false,
    };
    setDraft((prev) => ({
      ...prev,
      medical: { ...prev.medical, medications: [...(prev.medical?.medications || []), item] },
    }));
    setNewMedName('');
    setNewMedDosage('');
    setNewMedFreq('');
    setShowAddMed(false);
  };

  const removeMed = (id: string) => {
    setDraft((prev) => ({
      ...prev,
      medical: {
        ...prev.medical,
        medications: (prev.medical?.medications || []).filter((m) => m.id !== id),
      },
    }));
  };

  const toggleSymptom = (sym: string) => {
    const list = [...(draft.womensHealth?.commonSymptoms || [])];
    if (list.includes(sym)) {
      setDraft((prev) => ({ ...prev, womensHealth: { ...prev.womensHealth, commonSymptoms: list.filter((s) => s !== sym) } }));
    } else {
      setDraft((prev) => ({ ...prev, womensHealth: { ...prev.womensHealth, commonSymptoms: [...list, sym] } }));
    }
  };

  const toggleExercise = (ex: string) => {
    const list = [...(draft.lifestyle?.exercisePreferences || [])];
    if (list.includes(ex)) {
      setDraft((prev) => ({ ...prev, lifestyle: { ...prev.lifestyle, exercisePreferences: list.filter((e) => e !== ex) } }));
    } else {
      setDraft((prev) => ({ ...prev, lifestyle: { ...prev.lifestyle, exercisePreferences: [...list, ex] } }));
    }
  };

  const toggleGoal = (goal: string) => {
    const list = [...(draft.goals?.selectedGoals || [])];
    if (list.includes(goal)) {
      setDraft((prev) => ({ ...prev, goals: { ...prev.goals, selectedGoals: list.filter((g) => g !== goal) } }));
    } else {
      setDraft((prev) => ({ ...prev, goals: { ...prev.goals, selectedGoals: [...list, goal] } }));
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl mx-auto space-y-6 text-left select-none pb-16"
    >
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E7DFEF]">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-[#EDE4F7] text-[#6E2D8B]">
              <Settings className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold font-display text-[#1C1326]">
              Personal Health Profile & Settings
            </h1>
          </div>
          <p className="text-xs text-[#584B68] mt-1">
            Update your medical baselines, lifestyle rhythms, and emergency preferences. Changes dynamically update your dashboard.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleLogout}
            className="px-4 py-2.5 rounded-2xl font-sans font-bold text-xs text-[#584B68] bg-white border border-[#E7DFEF] hover:bg-[#FDF2F8] hover:text-[#FB7185] transition-all cursor-pointer"
          >
            Sign Out
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2.5 rounded-2xl font-sans font-bold text-xs text-white bg-gradient-to-r from-[#6E2D8B] via-[#8E3EAF] to-[#E87084] hover:brightness-110 shadow-md shadow-purple-950/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-70"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                <span>Saving...</span>
              </>
            ) : saveSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-[#34D399]" />
                <span>Changes Saved ✓</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Profile Changes</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Save Error Alert */}
      {saveError && (
        <div className="p-4 rounded-2xl bg-[#E87084]/15 border border-[#E87084]/40 text-xs text-[#FDA4AF]">
          {saveError}
        </div>
      )}

      {/* ── Tabs Navigation ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-[#6E2D8B] to-[#8E3EAF] text-white shadow-md'
                  : 'bg-white border border-[#E7DFEF] text-[#584B68] hover:bg-[#F2ECF7]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── Active Tab Form Card ── */}
      <div className="p-6 sm:p-8 rounded-[32px] bg-white border border-[#E7DFEF] shadow-sm space-y-6">
        <AnimatePresence mode="wait">
          {/* TAB 1: PERSONAL */}
          {activeTab === 'personal' && (
            <motion.div
              key="tab-personal"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#F0EAF5]">
                <h3 className="text-base font-bold font-display text-[#1C1326]">
                  Personal Identifiers & Biometrics
                </h3>
                <span className="text-[10px] font-mono text-[#8D7E9E]">Step 1 Baseline</span>
              </div>

              {/* Avatar Chooser */}
              <div className="p-4 rounded-2xl bg-[#F8F5FA] border border-[#E7DFEF] flex flex-col sm:flex-row items-center gap-4">
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#8E3EAF] bg-[#EDE4F7] flex items-center justify-center shrink-0">
                  {draft.avatarUrl ? (
                    <img src={draft.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-8 h-8 text-[#6E2D8B]" />
                  )}
                </div>
                <div className="space-y-1.5 flex-1 text-center sm:text-left">
                  <span className="text-xs font-bold text-[#1C1326] block font-mono uppercase">Profile Photo</span>
                  <div className="flex items-center gap-2 justify-center sm:justify-start">
                    {PRESET_AVATARS.map((url, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setDraft((p) => ({ ...p, avatarUrl: url }))}
                        className={`w-7 h-7 rounded-full overflow-hidden border-2 transition-transform cursor-pointer ${
                          draft.avatarUrl === url ? 'border-[#8E3EAF] scale-110 shadow-sm' : 'border-[#E7DFEF]'
                        }`}
                      >
                        <img src={url} alt={`Preset ${idx}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold font-mono text-[#1C1326] uppercase">Full Name *</label>
                  <input
                    type="text"
                    value={draft.fullName}
                    onChange={(e) => setDraft((p) => ({ ...p, fullName: e.target.value }))}
                    className="w-full px-4 py-3 rounded-2xl bg-[#F8F5FA] border border-[#E7DFEF] text-sm text-[#1C1326] focus:outline-none focus:ring-2 focus:ring-[#8E3EAF]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold font-mono text-[#1C1326] uppercase">Date of Birth *</label>
                  <input
                    type="date"
                    value={draft.dateOfBirth}
                    onChange={(e) => setDraft((p) => ({ ...p, dateOfBirth: e.target.value }))}
                    className="w-full px-4 py-3 rounded-2xl bg-[#F8F5FA] border border-[#E7DFEF] text-sm text-[#1C1326] focus:outline-none focus:ring-2 focus:ring-[#8E3EAF]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold font-mono text-[#1C1326] uppercase">Phone Number *</label>
                  <input
                    type="tel"
                    value={draft.phone}
                    onChange={(e) => setDraft((p) => ({ ...p, phone: e.target.value }))}
                    className="w-full px-4 py-3 rounded-2xl bg-[#F8F5FA] border border-[#E7DFEF] text-sm text-[#1C1326] focus:outline-none focus:ring-2 focus:ring-[#8E3EAF]"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold font-mono text-[#1C1326] uppercase">Email Address *</label>
                  <input
                    type="email"
                    value={draft.email}
                    onChange={(e) => setDraft((p) => ({ ...p, email: e.target.value }))}
                    className="w-full px-4 py-3 rounded-2xl bg-[#F8F5FA] border border-[#E7DFEF] text-sm text-[#1C1326] focus:outline-none focus:ring-2 focus:ring-[#8E3EAF]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold font-mono text-[#1C1326] uppercase">Height (cm)</label>
                  <input
                    type="number"
                    placeholder="e.g. 165"
                    value={draft.heightCm ?? ''}
                    onChange={(e) => setDraft((p) => ({ ...p, heightCm: e.target.value ? parseFloat(e.target.value) : null }))}
                    className="w-full px-4 py-3 rounded-2xl bg-[#F8F5FA] border border-[#E7DFEF] text-sm text-[#1C1326] focus:outline-none focus:ring-2 focus:ring-[#8E3EAF]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold font-mono text-[#1C1326] uppercase">Weight (kg)</label>
                  <input
                    type="number"
                    placeholder="e.g. 62"
                    step="0.5"
                    value={draft.weightKg ?? ''}
                    onChange={(e) => setDraft((p) => ({ ...p, weightKg: e.target.value ? parseFloat(e.target.value) : null }))}
                    className="w-full px-4 py-3 rounded-2xl bg-[#F8F5FA] border border-[#E7DFEF] text-sm text-[#1C1326] focus:outline-none focus:ring-2 focus:ring-[#8E3EAF]"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 2: EMERGENCY */}
          {activeTab === 'emergency' && (
            <motion.div
              key="tab-emergency"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#F0EAF5]">
                <h3 className="text-base font-bold font-display text-[#1C1326]">
                  Primary Emergency Contact
                </h3>
                <span className="text-[10px] font-mono text-[#047857] font-bold">Encrypted & Accessible</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold font-mono text-[#1C1326] uppercase">Contact Full Name *</label>
                  <input
                    type="text"
                    value={primaryContact.name}
                    onChange={(e) => updatePrimary('name', e.target.value)}
                    placeholder="e.g. Zubair Khan"
                    className="w-full px-4 py-3 rounded-2xl bg-[#F8F5FA] border border-[#E7DFEF] text-sm text-[#1C1326] focus:outline-none focus:ring-2 focus:ring-[#8E3EAF]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold font-mono text-[#1C1326] uppercase">Relationship *</label>
                  <input
                    type="text"
                    value={primaryContact.relationship}
                    onChange={(e) => updatePrimary('relationship', e.target.value)}
                    placeholder="e.g. Partner / Spouse, Sibling"
                    className="w-full px-4 py-3 rounded-2xl bg-[#F8F5FA] border border-[#E7DFEF] text-sm text-[#1C1326] focus:outline-none focus:ring-2 focus:ring-[#8E3EAF]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold font-mono text-[#1C1326] uppercase">Phone Number *</label>
                  <input
                    type="tel"
                    value={primaryContact.phone}
                    onChange={(e) => updatePrimary('phone', e.target.value)}
                    placeholder="+92 321 7654321"
                    className="w-full px-4 py-3 rounded-2xl bg-[#F8F5FA] border border-[#E7DFEF] text-sm text-[#1C1326] focus:outline-none focus:ring-2 focus:ring-[#8E3EAF]"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 3: MEDICAL */}
          {activeTab === 'medical' && (
            <motion.div
              key="tab-medical"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#F0EAF5]">
                <h3 className="text-base font-bold font-display text-[#1C1326]">
                  Medical History & Medications
                </h3>
                <span className="text-[10px] font-mono text-[#8D7E9E]">Optional Baselines</span>
              </div>

              {/* Blood Type */}
              <div className="space-y-2">
                <label className="text-xs font-bold font-mono text-[#1C1326] uppercase block">Blood Type</label>
                <div className="flex flex-wrap gap-2">
                  {BLOOD_TYPES.map((bt) => {
                    const isSelected = draft.medical?.bloodType === bt;
                    return (
                      <button
                        key={bt}
                        type="button"
                        onClick={() => setDraft((p) => ({ ...p, medical: { ...p.medical, bloodType: bt } }))}
                        className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#6E2D8B] text-white shadow-xs'
                            : 'bg-[#F8F5FA] border border-[#E7DFEF] text-[#584B68] hover:bg-[#EDE4F7]'
                        }`}
                      >
                        {bt}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Allergies */}
              <div className="space-y-2 pt-2 border-t border-[#F0EAF5]">
                <label className="text-xs font-bold font-mono text-[#1C1326] uppercase block">Known Allergies</label>
                <div className="flex flex-wrap gap-2">
                  {DEFAULT_ALLERGY_OPTIONS.map((a) => {
                    const isSelected = draft.medical?.allergies?.includes(a);
                    return (
                      <button
                        key={a}
                        type="button"
                        onClick={() => toggleAllergy(a)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#FB7185] text-white shadow-xs'
                            : 'bg-[#F8F5FA] border border-[#E7DFEF] text-[#584B68] hover:bg-[#FDF2F8]'
                        }`}
                      >
                        {isSelected && '✓ '}
                        {a}
                      </button>
                    );
                  })}
                </div>
                <div className="flex gap-2 pt-1 max-w-sm">
                  <input
                    type="text"
                    placeholder="Add custom allergy"
                    value={customAllergy}
                    onChange={(e) => setCustomAllergy(e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-xl bg-[#F8F5FA] border border-[#E7DFEF] text-xs text-[#1C1326]"
                  />
                  <button
                    type="button"
                    onClick={addCustomAllergy}
                    className="px-3 py-1.5 rounded-xl bg-[#6E2D8B] text-white text-xs font-bold"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Medications List */}
              <div className="space-y-3 pt-2 border-t border-[#F0EAF5]">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold font-mono text-[#1C1326] uppercase">
                    Current Medications & Supplements
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowAddMed(true)}
                    className="text-xs font-bold text-[#6E2D8B] hover:underline inline-flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Medication
                  </button>
                </div>

                {draft.medical?.medications?.length > 0 && (
                  <div className="space-y-2">
                    {draft.medical.medications.map((med) => (
                      <div
                        key={med.id}
                        className="p-3 rounded-2xl bg-[#F8F5FA] border border-[#E7DFEF] flex items-center justify-between gap-3"
                      >
                        <div>
                          <span className="text-xs font-bold text-[#1C1326] block">{med.name}</span>
                          <span className="text-[11px] text-[#8D7E9E]">
                            {med.dosage} • {med.frequency}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeMed(med.id)}
                          className="p-1 text-[#FB7185] hover:opacity-75"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {showAddMed && (
                  <div className="p-3.5 rounded-2xl bg-[#F2ECF7] border border-[#D8B4FE]/50 space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <input
                        type="text"
                        placeholder="Medication name"
                        value={newMedName}
                        onChange={(e) => setNewMedName(e.target.value)}
                        className="px-3 py-2 rounded-xl bg-white border border-[#E7DFEF] text-xs text-[#1C1326]"
                      />
                      <input
                        type="text"
                        placeholder="Dosage (e.g. 500mg)"
                        value={newMedDosage}
                        onChange={(e) => setNewMedDosage(e.target.value)}
                        className="px-3 py-2 rounded-xl bg-white border border-[#E7DFEF] text-xs text-[#1C1326]"
                      />
                      <input
                        type="text"
                        placeholder="Frequency (e.g. Daily)"
                        value={newMedFreq}
                        onChange={(e) => setNewMedFreq(e.target.value)}
                        className="px-3 py-2 rounded-xl bg-white border border-[#E7DFEF] text-xs text-[#1C1326]"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowAddMed(false)}
                        className="px-3 py-1 text-xs text-[#584B68]"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleAddMed}
                        className="px-3.5 py-1 rounded-xl bg-[#6E2D8B] text-white text-xs font-bold"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Conditions */}
              <div className="space-y-2 pt-2 border-t border-[#F0EAF5]">
                <label className="text-xs font-bold font-mono text-[#1C1326] uppercase block">Diagnosed Conditions</label>
                <div className="flex flex-wrap gap-2">
                  {DEFAULT_CONDITION_OPTIONS.map((c) => {
                    const isSelected = draft.medical?.conditions?.includes(c);
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => toggleCondition(c)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#8E3EAF] text-white shadow-xs'
                            : 'bg-[#F8F5FA] border border-[#E7DFEF] text-[#584B68] hover:bg-[#EDE4F7]'
                        }`}
                      >
                        {isSelected && '✓ '}
                        {c}
                      </button>
                    );
                  })}
                </div>
                <div className="flex gap-2 pt-1 max-w-sm">
                  <input
                    type="text"
                    placeholder="Add custom condition"
                    value={customCondition}
                    onChange={(e) => setCustomCondition(e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-xl bg-[#F8F5FA] border border-[#E7DFEF] text-xs text-[#1C1326]"
                  />
                  <button
                    type="button"
                    onClick={addCustomCondition}
                    className="px-3 py-1.5 rounded-xl bg-[#6E2D8B] text-white text-xs font-bold"
                  >
                    Add
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 4: WOMEN'S HEALTH & CYCLE */}
          {activeTab === 'cycle' && (
            <motion.div
              key="tab-cycle"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#F0EAF5]">
                <h3 className="text-base font-bold font-display text-[#1C1326]">
                  Cycle Length, Last Period & Symptoms
                </h3>
                <span className="text-[10px] font-mono text-[#6E2D8B] font-bold">Core Rhythm Engine</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2 p-4 rounded-2xl bg-[#F8F5FA] border border-[#E7DFEF]">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold font-mono text-[#1C1326] uppercase">Cycle Length (Days)</label>
                    <span className="text-xs font-mono font-bold text-[#6E2D8B]">
                      {draft.womensHealth?.cycleLength} Days
                    </span>
                  </div>
                  <input
                    type="range"
                    min="21"
                    max="45"
                    value={typeof draft.womensHealth?.cycleLength === 'number' ? draft.womensHealth.cycleLength : 28}
                    onChange={(e) =>
                      setDraft((p) => ({
                        ...p,
                        womensHealth: { ...p.womensHealth, cycleLength: parseInt(e.target.value, 10) },
                      }))
                    }
                    className="w-full accent-[#6E2D8B]"
                  />
                </div>

                <div className="space-y-1.5 p-4 rounded-2xl bg-[#F8F5FA] border border-[#E7DFEF]">
                  <label className="text-xs font-bold font-mono text-[#1C1326] uppercase block">Last Period Start Date</label>
                  <input
                    type="date"
                    value={draft.womensHealth?.lastPeriodDate || ''}
                    onChange={(e) =>
                      setDraft((p) => ({
                        ...p,
                        womensHealth: { ...p.womensHealth, lastPeriodDate: e.target.value },
                      }))
                    }
                    className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#E7DFEF] text-sm text-[#1C1326]"
                  />
                </div>
              </div>

              {/* Symptoms Checklist */}
              <div className="space-y-2 pt-2 border-t border-[#F0EAF5]">
                <label className="text-xs font-bold font-mono text-[#1C1326] uppercase block">
                  Recorded Common Symptoms
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {DEFAULT_SYMPTOM_OPTIONS.map((sym) => {
                    const isSelected = draft.womensHealth?.commonSymptoms?.includes(sym.label);
                    return (
                      <button
                        key={sym.id}
                        type="button"
                        onClick={() => toggleSymptom(sym.label)}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-[#FDF2F8] border-[#FB7185] text-[#1C1326] shadow-2xs'
                            : 'bg-[#F8F5FA] border-[#E7DFEF] text-[#584B68]'
                        }`}
                      >
                        <div>
                          <span className="text-xs font-bold block">{sym.label}</span>
                          <span className="text-[10px] text-[#8D7E9E]">{sym.desc}</span>
                        </div>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-[#FB7185]" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 5: LIFESTYLE & DIET */}
          {activeTab === 'lifestyle' && (
            <motion.div
              key="tab-lifestyle"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#F0EAF5]">
                <h3 className="text-base font-bold font-display text-[#1C1326]">
                  Nutrition, Water & Movement
                </h3>
                <span className="text-[10px] font-mono text-[#047857] font-bold">Daily Biometric Modulators</span>
              </div>

              {/* Dietary Preference */}
              <div className="space-y-2">
                <label className="text-xs font-bold font-mono text-[#1C1326] uppercase block">Primary Dietary Preference</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {DIETARY_PREFERENCE_OPTIONS.map((diet) => {
                    const isSelected = draft.lifestyle?.dietaryPreference === diet.label;
                    return (
                      <button
                        key={diet.id}
                        type="button"
                        onClick={() => setDraft((p) => ({ ...p, lifestyle: { ...p.lifestyle, dietaryPreference: diet.label } }))}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-[#ECFDF5] border-[#34D399] text-[#1C1326] shadow-2xs'
                            : 'bg-[#F8F5FA] border-[#E7DFEF] text-[#584B68]'
                        }`}
                      >
                        <div>
                          <span className="text-xs font-bold block">{diet.label}</span>
                          <span className="text-[10px] text-[#8D7E9E]">{diet.desc}</span>
                        </div>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-[#047857]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Water & Sleep Sliders */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#F0EAF5]">
                <div className="p-4 rounded-2xl bg-[#F8F5FA] border border-[#E7DFEF] space-y-2">
                  <div className="flex justify-between">
                    <label className="text-xs font-bold font-mono text-[#1C1326] uppercase">Daily Water Target</label>
                    <span className="text-xs font-mono font-bold text-[#6E2D8B]">
                      {draft.lifestyle?.dailyWaterGlasses} Glasses ({((draft.lifestyle?.dailyWaterGlasses || 8) * 0.25).toFixed(1)}L)
                    </span>
                  </div>
                  <input
                    type="range"
                    min="4"
                    max="16"
                    value={draft.lifestyle?.dailyWaterGlasses || 8}
                    onChange={(e) =>
                      setDraft((p) => ({
                        ...p,
                        lifestyle: { ...p.lifestyle, dailyWaterGlasses: parseInt(e.target.value, 10) },
                      }))
                    }
                    className="w-full accent-[#6E2D8B]"
                  />
                </div>

                <div className="p-4 rounded-2xl bg-[#F8F5FA] border border-[#E7DFEF] space-y-2">
                  <div className="flex justify-between">
                    <label className="text-xs font-bold font-mono text-[#1C1326] uppercase">Average Sleep (Hours)</label>
                    <span className="text-xs font-mono font-bold text-[#8E3EAF]">
                      {draft.lifestyle?.sleepHours}h / night
                    </span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="10"
                    step="0.5"
                    value={draft.lifestyle?.sleepHours || 7.5}
                    onChange={(e) =>
                      setDraft((p) => ({
                        ...p,
                        lifestyle: { ...p.lifestyle, sleepHours: parseFloat(e.target.value) },
                      }))
                    }
                    className="w-full accent-[#8E3EAF]"
                  />
                </div>
              </div>

              {/* Exercise Preferences */}
              <div className="space-y-2 pt-2 border-t border-[#F0EAF5]">
                <label className="text-xs font-bold font-mono text-[#1C1326] uppercase block">Preferred Exercise Styles</label>
                <div className="flex flex-wrap gap-2">
                  {EXERCISE_PREFERENCE_OPTIONS.map((ex) => {
                    const isSelected = draft.lifestyle?.exercisePreferences?.includes(ex.label);
                    return (
                      <button
                        key={ex.id}
                        type="button"
                        onClick={() => toggleExercise(ex.label)}
                        className={`px-3.5 py-2 rounded-2xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-[#6E2D8B] text-white shadow-xs'
                            : 'bg-[#F8F5FA] border border-[#E7DFEF] text-[#584B68] hover:bg-[#EDE4F7]'
                        }`}
                      >
                        {isSelected && '✓ '}
                        {ex.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 6: GOALS */}
          {activeTab === 'goals' && (
            <motion.div
              key="tab-goals"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#F0EAF5]">
                <h3 className="text-base font-bold font-display text-[#1C1326]">
                  Health Goals & Support Preferences
                </h3>
                <span className="text-[10px] font-mono text-[#8E3EAF] font-bold">Personalized Coaching Alignment</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {HEALTH_GOAL_OPTIONS.map((goal) => {
                  const isSelected = draft.goals?.selectedGoals?.includes(goal.title);
                  return (
                    <button
                      key={goal.id}
                      type="button"
                      onClick={() => toggleGoal(goal.title)}
                      className={`p-4 rounded-3xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                        isSelected
                          ? 'bg-[#FDF2F8] border-[#FB7185] shadow-xs'
                          : 'bg-[#F8F5FA] border-[#E7DFEF] text-[#584B68]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#1C1326]">{goal.title}</span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-[#FB7185]" />}
                      </div>
                      <p className="text-[11px] text-[#8D7E9E]">{goal.desc}</p>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Bar */}
        <div className="pt-4 border-t border-[#F0EAF5] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleRestartOnboarding}
              className="text-xs text-[#6E2D8B] font-bold hover:underline inline-flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Launch 7-Step Onboarding Wizard</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="w-full sm:w-auto px-6 py-3 rounded-2xl font-sans font-bold text-xs text-white bg-gradient-to-r from-[#6E2D8B] via-[#8E3EAF] to-[#E87084] hover:brightness-110 shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                <span>Saving Changes...</span>
              </>
            ) : saveSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-[#34D399]" />
                <span>Saved & Synced ✓</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Profile Changes</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Demo / Reset Options ── */}
      <div className="p-4 rounded-2xl bg-[#F8F5FA] border border-[#E7DFEF] flex items-center justify-between text-xs text-[#8D7E9E]">
        <span>Reset demo state back to default Ayesha Khan sample profile</span>
        <button
          type="button"
          onClick={handleReset}
          className="text-[#FB7185] font-bold hover:underline cursor-pointer"
        >
          Reset Demo Data
        </button>
      </div>
    </motion.div>
  );
};

export default SettingsPage;
