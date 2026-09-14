import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ClipboardCheck,
  Layers,
  Edit3,
  CheckCircle2,
  Save,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useUserHealth } from '../../context/UserHealthContext';
import type { TierLevel } from '../../types/adaptiveScreening';
import type { UserProfile } from '../../types/onboarding';
import {
  ProfileCompletenessCard,
  ScreeningTierNavigator,
  InformationGapAnalysisCard,
  CostAwarePrioritizationCard,
  ExplainabilityPlaceholderCard,
  ADAMQuestionnaireModal,
  ProgressiveAssessmentCard,
  ClinicalLabsModal,
  MaleClinicalLabsModal,
  UltrasoundUploadModal,
  AssessmentHistoryModal,
} from '../../components/adaptive';

export const AssessmentPage: React.FC = () => {
  const { userProfile, updateUserProfile } = useAuth();
  const {
    adaptiveProfile,
    reports,
    verifyReportBiomarker,
    saveADAMResponses,
    refreshMlAssessment,
    activeAssessment,
    assessmentLoading,
    refreshActiveAssessment,
  } = useUserHealth();

  // Active view tab: 'overview' (4-tier progressive profile) or 'intake' (quick update)
  const [activeTab, setActiveTab] = useState<'overview' | 'intake'>('overview');
  const [selectedTier, setSelectedTier] = useState<TierLevel>('tier_1');
  const [isAdamModalOpen, setIsAdamModalOpen] = useState(false);

  // Progressive Assessment Modals
  const [isClinicalModalOpen, setIsClinicalModalOpen] = useState(false);
  const [isUltrasoundModalOpen, setIsUltrasoundModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  // Intake / Update Form state
  const [heightCm, setHeightCm] = useState<number>(userProfile.heightCm || 165);
  const [weightKg, setWeightKg] = useState<number>(userProfile.weightKg || 65);
  const [waistCm, setWaistCm] = useState<number>(userProfile.waistCm || 80);
  const [sleepHours, setSleepHours] = useState<number>(userProfile.lifestyle?.sleepHours || 7.5);
  const [activityLevel, setActivityLevel] = useState<string>(userProfile.lifestyle?.activityLevel || 'moderate');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const pathway = adaptiveProfile.pathway;

  const handleSaveIntake = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload: Partial<UserProfile> = {
        heightCm,
        weightKg,
        waistCm,
        lifestyle: {
          ...userProfile.lifestyle,
          sleepHours,
          activityLevel: activityLevel as any,
        },
      };
      await updateUserProfile(payload);
      await refreshMlAssessment();
      await refreshActiveAssessment();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save updated biometrics:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="max-w-7xl mx-auto space-y-6 sm:space-y-8 pb-20 text-left select-none"
    >
      {/* ── 1. Top Executive Banner ───────────────────────────────────────── */}
      <div className="relative p-6 sm:p-8 rounded-[32px] bg-[#01579B] border border-[#BAE6FD] text-white shadow-sm overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 border border-white/25 text-xs font-mono text-white">
              <Layers className="w-3.5 h-3.5 text-[#BAE6FD]" />
              <span>{adaptiveProfile.screeningPathwayName}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-white">
              Adaptive Health Profile & Screening
            </h1>
            <p className="text-xs sm:text-sm text-sky-100 font-sans max-w-2xl leading-relaxed">
              Start with what you know → understand available information → identify gaps → progressively build your profile without mandatory testing.
            </p>
          </div>

          {/* Navigation Toggle between 4-Tier System and Quick Profile Editor */}
          <div className="flex items-center gap-2 p-1 rounded-2xl bg-black/20 border border-white/15 self-start md:self-auto">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-xl text-xs font-sans font-bold transition-all cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-white text-[#01579B] shadow-sm'
                  : 'text-sky-100 hover:text-white'
              }`}
            >
              {pathway === 'male' ? '2-Tier Screening' : '3-Tier Screening'}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('intake')}
              className={`px-4 py-2 rounded-xl text-xs font-sans font-bold transition-all cursor-pointer ${
                activeTab === 'intake'
                  ? 'bg-white text-[#01579B] shadow-sm'
                  : 'text-sky-100 hover:text-white'
              }`}
            >
              Update Biometrics
            </button>
          </div>
        </div>
      </div>

      {/* ── 2. Primary 4-Tier Screening Content ────────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="space-y-6 sm:space-y-8">
          {/* Progressive Clinical Assessment Card (Tier 1 / Tier 1+2 / Tier 1+2+3 Multimodal) */}
          <ProgressiveAssessmentCard
            assessment={activeAssessment}
            loading={assessmentLoading}
            onOpenClinicalModal={() => setIsClinicalModalOpen(true)}
            onOpenUltrasoundModal={() => setIsUltrasoundModalOpen(true)}
            onOpenHistoryModal={() => setIsHistoryModalOpen(true)}
            onRefresh={refreshActiveAssessment}
          />

          {/* Master Profile Completeness & Readiness Card */}
          <ProfileCompletenessCard
            profile={adaptiveProfile}
            onSelectTier={(tier) => setSelectedTier(tier)}
          />

          {/* Dedicated Male ADAM Questionnaire Action Button for Tier 1 */}
          {pathway === 'male' && (
            <div className="p-4 sm:p-5 rounded-2xl bg-[#F0F9FF] border border-[#BAE6FD] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[#0F172A] shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#0288D1] flex items-center justify-center text-white shrink-0 shadow-xs">
                  <ClipboardCheck className="w-5 h-5" />
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm sm:text-base font-bold text-[#01579B] font-display">
                      ADAM Questionnaire (Tier 1 Screening Tool)
                    </h4>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#E0F2FE] text-[#0288D1] border border-[#BAE6FD] font-bold">
                      Standardized
                    </span>
                  </div>
                  <p className="text-xs text-[#475569]">
                    10-item validated symptom screening questionnaire for self-reported male vitality and stamina.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsAdamModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-[#0288D1] hover:bg-[#0277BD] text-white text-xs font-bold font-sans transition-all flex items-center gap-1.5 cursor-pointer shadow-xs self-start sm:self-auto shrink-0"
              >
                <span>Take / Review Questionnaire</span>
              </button>
            </div>
          )}

          {/* Interactive Screening Tier Navigator & Disclosure */}
          <ScreeningTierNavigator
            tiers={adaptiveProfile.tiers}
            selectedTier={selectedTier}
            onSelectTier={setSelectedTier}
            pathway={pathway === 'male' ? 'male' : 'female'}
            onVerifyBiomarker={async (itemId, reportId, resultId) => {
              if (reportId && resultId) {
                await verifyReportBiomarker(reportId, resultId);
                return;
              }
              // Fallback lookup if direct reportId/resultId were not attached
              for (const rep of reports) {
                const matched = rep.results?.find(
                  (r) =>
                    (r.id === itemId ||
                      r.testName.toLowerCase().replace(/[^a-z0-9]/g, '') ===
                        itemId.toLowerCase().replace(/[^a-z0-9]/g, '')) &&
                    !r.userVerified
                );
                if (matched) {
                  await verifyReportBiomarker(rep.id, matched.id);
                  break;
                }
              }
            }}
          />

          {/* Information Gap Analysis */}
          <InformationGapAnalysisCard gaps={adaptiveProfile.gaps} />

          {/* Cost-Aware Prioritization (Placeholder for ML ranking) */}
          {adaptiveProfile.isSpecializedPathway && (
            <CostAwarePrioritizationCard
              recommendations={adaptiveProfile.prioritizedRecommendations}
            />
          )}

          {/* Explainability Summary (Placeholder for TreeSHAP) */}
          {adaptiveProfile.explainability.features.length > 0 && (
            <ExplainabilityPlaceholderCard
              summary={adaptiveProfile.explainability}
            />
          )}
        </div>
      )}

      {/* ── 3. Quick Biometrics & Habits Intake Tab ────────────────────────── */}
      {activeTab === 'intake' && (
        <form
          onSubmit={handleSaveIntake}
          className="p-6 sm:p-8 rounded-[32px] bg-white border border-[#BAE6FD] text-[#0F172A] shadow-xs space-y-6 max-w-2xl mx-auto"
        >
          <div className="border-b border-[#E2E8F0] pb-4 space-y-1">
            <h3 className="text-lg font-bold font-display text-[#01579B] flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-[#0288D1]" />
              <span>Update Tier 1 Biometrics & Habits</span>
            </h3>
            <p className="text-xs text-[#475569]">
              Modifying these accessible metrics automatically recalculates your BMI and tier completeness.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-mono uppercase text-[#475569] font-semibold">
                Height (cm)
              </label>
              <input
                type="number"
                min={100}
                max={250}
                value={heightCm}
                onChange={(e) => setHeightCm(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl bg-[#F8FAFC] border border-[#BAE6FD]/80 text-[#0F172A] text-sm focus:outline-none focus:border-[#0288D1] focus:bg-white transition-colors font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-mono uppercase text-[#475569] font-semibold">
                Weight (kg)
              </label>
              <input
                type="number"
                min={30}
                max={250}
                value={weightKg}
                onChange={(e) => setWeightKg(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl bg-[#F8FAFC] border border-[#BAE6FD]/80 text-[#0F172A] text-sm focus:outline-none focus:border-[#0288D1] focus:bg-white transition-colors font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-mono uppercase text-[#475569] font-semibold">
                Waist (cm)
              </label>
              <input
                type="number"
                min={40}
                max={180}
                value={waistCm}
                onChange={(e) => setWaistCm(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl bg-[#F8FAFC] border border-[#BAE6FD]/80 text-[#0F172A] text-sm focus:outline-none focus:border-[#0288D1] focus:bg-white transition-colors font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-mono uppercase text-[#475569] font-semibold">
                Average Sleep Duration (Hours)
              </label>
              <input
                type="number"
                step="0.5"
                min={4}
                max={12}
                value={sleepHours}
                onChange={(e) => setSleepHours(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl bg-[#F8FAFC] border border-[#BAE6FD]/80 text-[#0F172A] text-sm focus:outline-none focus:border-[#0288D1] focus:bg-white transition-colors font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-mono uppercase text-[#475569] font-semibold">
                Physical Activity Level
              </label>
              <select
                value={activityLevel}
                onChange={(e) => setActivityLevel(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#F8FAFC] border border-[#BAE6FD]/80 text-[#0F172A] text-sm focus:outline-none focus:border-[#0288D1] focus:bg-white transition-colors font-medium"
              >
                <option value="sedentary">Sedentary (Little or no exercise)</option>
                <option value="light">Light (Exercise 1–3 days/week)</option>
                <option value="moderate">Moderate (Exercise 3–5 days/week)</option>
                <option value="very_active">Very Active (Intense 6–7 days/week)</option>
              </select>
            </div>
          </div>

          {saveSuccess && (
            <div className="p-3 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] text-xs text-[#065F46] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#059669]" />
              <span>Biometrics saved successfully! Tier 1 profile has been refreshed.</span>
            </div>
          )}

          <div className="pt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className="px-4 py-2 rounded-xl bg-[#F8FAFC] hover:bg-[#E0F2FE] text-xs text-[#475569] hover:text-[#01579B] font-medium transition-colors cursor-pointer border border-[#BAE6FD]"
            >
              {pathway === 'male' ? 'Back to 2-Tier View' : 'Back to 3-Tier View'}
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-[#0288D1] hover:bg-[#0277BD] text-white text-xs font-bold font-sans transition-all flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Save & Update Profile</span>
            </button>
          </div>
        </form>
      )}

      {/* ── 4. Progressive Assessment Modals ───────────────────────────────── */}
      {pathway === 'male' ? (
        <MaleClinicalLabsModal
          isOpen={isClinicalModalOpen}
          onClose={() => setIsClinicalModalOpen(false)}
          onSuccess={() => refreshActiveAssessment()}
        />
      ) : (
        <ClinicalLabsModal
          isOpen={isClinicalModalOpen}
          onClose={() => setIsClinicalModalOpen(false)}
          onSuccess={() => refreshActiveAssessment()}
        />
      )}

      <UltrasoundUploadModal
        isOpen={isUltrasoundModalOpen}
        onClose={() => setIsUltrasoundModalOpen(false)}
        onSuccess={() => refreshActiveAssessment()}
      />

      <AssessmentHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
      />

      {/* ── 5. ADAM Questionnaire Modal (Male) ────────────────────────────── */}
      <ADAMQuestionnaireModal
        isOpen={isAdamModalOpen}
        onClose={() => setIsAdamModalOpen(false)}
        onSave={(adamState) => {
          saveADAMResponses(adamState);
          setSaveSuccess(true);
          setTimeout(() => setSaveSuccess(false), 3000);
        }}
      />
    </motion.div>
  );
};

export default AssessmentPage;
