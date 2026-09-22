import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle,
  AlertCircle,
  XClose,
  Trash01,
  ChevronRight,
  RefreshCw01,
} from '@untitledui/icons';
import { useUserHealth } from '../../context/UserHealthContext';
import { useAuth } from '../../context/AuthContext';
import { ROUTES } from '../../constants/routes';
import type { UserProfile } from '../../types/onboarding';
import {
  validateDateOfBirth,
  validatePakistaniPhone,
} from '../../utils/profileValidation';

import type { SettingsTabId } from './settings/settingsTypes';
import {
  getSettingsTabs,
  hasAssessmentRelevantEdits,
  calculateProfileCompleteness,
} from './settings/settingsTypes';
import { AssessmentStatusHeader } from './settings/AssessmentStatusHeader';
import { CompletenessCard } from './settings/CompletenessCard';
import { StickySaveBar } from './settings/StickySaveBar';
import { ReassessmentModal } from './settings/ReassessmentModal';

// Tabs
import { PersonalTab } from './settings/tabs/PersonalTab';
import { HealthProfileTab } from './settings/tabs/HealthProfileTab';
import { FemaleScreeningTab } from './settings/tabs/FemaleScreeningTab';
import { MaleScreeningTab } from './settings/tabs/MaleScreeningTab';
import { LifestyleTab } from './settings/tabs/LifestyleTab';
import { NutritionTab } from './settings/tabs/NutritionTab';
import { GoalsTab } from './settings/tabs/GoalsTab';
import { AccountTab } from './settings/tabs/AccountTab';

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { userProfile, updateUserProfile, submitTier1 } = useUserHealth();
  const { logout, deleteAccountAndData } = useAuth();

  const isMale = userProfile?.pathway === 'male' || userProfile?.gender === 'male';

  const [activeTab, setActiveTab] = useState<SettingsTabId>('personal');
  const [draft, setDraft] = useState<UserProfile>(() =>
    JSON.parse(JSON.stringify(userProfile || {}))
  );

  // Sync draft when userProfile changes initially or after a server update
  useEffect(() => {
    if (userProfile && !isSaving) {
      setDraft(JSON.parse(JSON.stringify(userProfile)));
    }
  }, [userProfile?.id, userProfile?.updatedAt]);

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Validation state
  const [validationErrors, setValidationErrors] = useState<{
    dateOfBirth?: string;
    phone?: string;
  }>({});

  // Reassessment prompt modal state
  const [showReassessPrompt, setShowReassessPrompt] = useState(false);

  // Account & Data Deletion modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Calculate change status
  const hasChanges = useMemo(() => {
    if (!userProfile) return false;
    return JSON.stringify(draft) !== JSON.stringify(userProfile);
  }, [draft, userProfile]);

  const hasAssessmentChanges = useMemo(() => {
    if (!userProfile) return false;
    return hasAssessmentRelevantEdits(draft, userProfile, isMale);
  }, [draft, userProfile, isMale]);

  // Genuine completeness score
  const completeness = useMemo(() => {
    return calculateProfileCompleteness(draft, isMale);
  }, [draft, isMale]);

  const tabs = useMemo(() => getSettingsTabs(isMale), [isMale]);

  // Validation
  const validateForm = (): boolean => {
    const dobCheck = validateDateOfBirth(draft.dateOfBirth);
    const phoneCheck = validatePakistaniPhone(draft.phone);

    const errors: { dateOfBirth?: string; phone?: string } = {};
    if (!dobCheck.isValid) {
      errors.dateOfBirth = dobCheck.error;
    }
    if (!phoneCheck.isValid) {
      errors.phone = phoneCheck.error;
    }

    setValidationErrors(errors);
    if (Object.keys(errors).length > 0) {
      setActiveTab('personal');
      setSaveError('Please correct demographic validation errors before saving.');
      return false;
    }
    return true;
  };

  // Save handler
  const handleSave = async (withReassessment = false) => {
    if (!validateForm()) return;

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const hadAssessmentChanges = hasAssessmentChanges;
      const res = await updateUserProfile(draft);
      if (res.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 4000);

        if (withReassessment) {
          // Direct Save & Recalculate
          await submitTier1();
        } else if (hadAssessmentChanges) {
          // Open prompt offering user reassessment
          setShowReassessPrompt(true);
        }
      } else {
        setSaveError(res.error || 'Failed to save profile changes.');
      }
    } catch (err: any) {
      setSaveError(err?.message || 'A network error occurred while saving profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscard = () => {
    if (userProfile) {
      setDraft(JSON.parse(JSON.stringify(userProfile)));
      setValidationErrors({});
      setSaveError(null);
    }
  };

  const handleRestartOnboarding = () => {
    navigate(ROUTES.ONBOARDING, { state: { allowReonboard: true } });
  };

  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.LOGIN);
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText.trim().toUpperCase() !== 'DELETE') {
      setDeleteError('Please type DELETE to confirm.');
    }

    setIsDeleting(true);
    setDeleteError(null);

    try {
      const res = await deleteAccountAndData();
      if (res.success) {
        setShowDeleteModal(false);
        navigate(ROUTES.LOGIN, { replace: true });
        window.location.reload();
      } else {
        setDeleteError(res.error || 'Failed to delete account and data.');
        setIsDeleting(false);
      }
    } catch (err: any) {
      setDeleteError(err?.message || 'An unexpected error occurred during deletion.');
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-28 pt-4 sm:pt-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-left">
      {/* ── 1. PAGE HEADER ── */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-[#0288D1] uppercase tracking-wider">
                Clinical Health Center
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-xs font-medium text-slate-500">
                {isMale ? 'Male Hypogonadism Protocol' : 'PCOS Screening Protocol'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Profile & Settings
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Manage your personal biometrics, clinical symptoms, and AI model inputs
            </p>
          </div>

          {/* Top Status Indicators */}
          <div className="flex items-center gap-2">
            {saveSuccess && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs"
              >
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                <span>Changes saved</span>
              </motion.div>
            )}

            {hasChanges && (
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span>Unsaved changes</span>
              </div>
            )}
          </div>
        </div>

        {/* Global Error Banner */}
        {saveError && (
          <div className="mt-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-between text-xs text-rose-700 font-medium">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" aria-hidden="true" />
              <span>{saveError}</span>
            </div>
            <button
              type="button"
              onClick={() => setSaveError(null)}
              className="p-1 hover:bg-rose-100 rounded-md cursor-pointer"
            >
              <XClose className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>

      {/* ── 2. ASSESSMENT STATUS & COMPLETENESS ROW ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-8">
        <div className="lg:col-span-7">
          <AssessmentStatusHeader isMale={isMale} />
        </div>
        <div className="lg:col-span-5">
          <CompletenessCard completeness={completeness} isMale={isMale} />
        </div>
      </div>

      {/* ── 3. MAIN WORKSPACE: LEFT-TAB NAVIGATION + CONTENT ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left-Rail Segmented Tab Navigation */}
        <div className="lg:col-span-4 xl:col-span-3 sticky top-6 z-10">
          <div className="bg-white rounded-3xl p-3 border border-slate-200/80 shadow-xs space-y-1">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full p-3 rounded-2xl text-left transition-all flex items-center justify-between group cursor-pointer ${
                    isActive
                      ? 'bg-[#F0F9FF] text-[#01579B] font-bold shadow-xs border border-[#BAE6FD]'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                        isActive
                          ? 'bg-[#0288D1] text-white shadow-xs'
                          : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200/80 group-hover:text-slate-700'
                      }`}
                    >
                      <Icon className="w-4 h-4" aria-hidden="true" />
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs truncate">{tab.label}</p>
                      <p className="text-[10px] text-slate-400 font-normal truncate">
                        {tab.description}
                      </p>
                    </div>
                  </div>

                  <ChevronRight
                    className={`w-4 h-4 shrink-0 transition-transform ${
                      isActive ? 'text-[#0288D1] translate-x-0.5' : 'text-slate-300'
                    }`}
                    aria-hidden="true"
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Tab Content Panels */}
        <div className="lg:col-span-8 xl:col-span-9">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
            >
              {activeTab === 'personal' && (
                <PersonalTab
                  draft={draft}
                  setDraft={setDraft}
                  validationErrors={validationErrors}
                  isMale={isMale}
                />
              )}

              {activeTab === 'health' && (
                <HealthProfileTab draft={draft} setDraft={setDraft} isMale={isMale} />
              )}

              {activeTab === 'screening' &&
                (isMale ? (
                  <MaleScreeningTab draft={draft} setDraft={setDraft} />
                ) : (
                  <FemaleScreeningTab draft={draft} setDraft={setDraft} />
                ))}

              {activeTab === 'lifestyle' && (
                <LifestyleTab draft={draft} setDraft={setDraft} isMale={isMale} />
              )}

              {activeTab === 'nutrition' && (
                <NutritionTab draft={draft} setDraft={setDraft} isMale={isMale} />
              )}

              {activeTab === 'goals' && (
                <GoalsTab draft={draft} setDraft={setDraft} isMale={isMale} />
              )}

              {activeTab === 'account' && (
                <AccountTab
                  draft={draft}
                  setDraft={setDraft}
                  onLogout={handleLogout}
                  onRestartOnboarding={handleRestartOnboarding}
                  onOpenDeleteModal={() => {
                    setShowDeleteModal(true);
                    setDeleteConfirmText('');
                    setDeleteError(null);
                  }}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* ── 4. STICKY SAVE ACTION BAR ── */}
      <StickySaveBar
        hasChanges={hasChanges}
        hasAssessmentChanges={hasAssessmentChanges}
        isSaving={isSaving}
        isMale={isMale}
        onDiscard={handleDiscard}
        onSave={handleSave}
      />

      {/* ── 5. REASSESSMENT OFFER MODAL ── */}
      <ReassessmentModal
        isOpen={showReassessPrompt}
        isMale={isMale}
        onClose={() => setShowReassessPrompt(false)}
      />

      {/* ── 6. DANGER ZONE: DELETE ACCOUNT MODAL ── */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-100"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <Trash01 className="w-6 h-6 text-rose-600" aria-hidden="true" />
              </div>
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <XClose className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            <h3 className="text-lg font-bold text-slate-900">Delete Account & Health Data</h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              This will permanently delete your user profile, verified assessments, reports, and meal plans from Supabase.
            </p>

            <div className="mt-4 p-3 rounded-2xl bg-rose-50/70 border border-rose-200">
              <label className="block text-xs font-semibold text-rose-900 mb-1">
                Type <span className="font-mono font-bold">DELETE</span> to confirm:
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="DELETE"
                className="w-full px-3 py-2 rounded-xl border border-rose-300 text-xs font-bold text-rose-900 focus:outline-none focus:ring-2 focus:ring-rose-400/20"
              />
            </div>

            {deleteError && (
              <p className="text-xs text-rose-600 font-medium mt-2">{deleteError}</p>
            )}

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={isDeleting || deleteConfirmText.trim().toUpperCase() !== 'DELETE'}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl disabled:opacity-40 cursor-pointer"
              >
                {isDeleting && <RefreshCw01 className="w-3.5 h-3.5 animate-spin text-white" aria-hidden="true" />}
                <span>Permanently Delete</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
