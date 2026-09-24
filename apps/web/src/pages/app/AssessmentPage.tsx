import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  CheckDone01,
  LayersThree01,
  Edit03,
  CheckCircle,
  Save01,
  RefreshCw01,
  Image01,
  Eye,
  ShieldTick,
} from '@untitledui/icons';
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
import { FemaleScreeningWorkspace } from '../../components/female';
import { PatientShapExplanation } from '../../components/explainability/PatientShapExplanation';

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
    submitTier1,
    submitMaleTier1,
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
  const isMale = pathway === 'male' || adaptiveProfile.pathway === 'male' || activeAssessment?.module === 'male_hypogonadism';
  const hasUltrasoundEvidence =
    !isMale &&
    (activeAssessment?.assessment_level === 'tier_1_3' || activeAssessment?.assessment_level === 'tier_1_2_3') &&
    Boolean(activeAssessment?.gradcam_b64);

  const handleInitializeTier1 = async () => {
    if (isMale) {
      await submitMaleTier1();
    } else {
      await submitTier1();
    }
  };

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

  if (!isMale) {
    return <FemaleScreeningWorkspace />;
  }

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
              <LayersThree01 className="w-3.5 h-3.5 text-[#BAE6FD]" aria-hidden="true" />
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
            onRefresh={handleInitializeTier1}
          />

          {/* Patient-Centered Fold-Aware SHAP Explainability Engine */}
          {activeAssessment?.shap_explanation && (
            <PatientShapExplanation
              payload={activeAssessment.shap_explanation}
              longitudinalComparison={activeAssessment.longitudinal_shap_comparison}
              pathway="male_hypogonadism"
            />
          )}

          {/* Dedicated Ultrasound AI Analysis Card (Side-by-Side Original & Grad-CAM) */}
          {hasUltrasoundEvidence && (
            <div className="p-6 sm:p-8 rounded-[32px] bg-white border border-[#BAE6FD] text-[#0F172A] shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2E8F0] pb-4">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E0F2FE] border border-[#BAE6FD] text-xs font-mono text-[#0288D1] font-bold">
                    <Image01 className="w-3.5 h-3.5 text-[#0288D1]" aria-hidden="true" />
                    <span>Tier 3 Pelvic Ultrasound Spatial Inspection</span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold font-display text-[#01579B]">
                    Ultrasound AI Analysis & Neural Focus Heatmap
                  </h3>
                  <p className="text-xs sm:text-sm text-[#475569]">
                    Visual interpretation of deep learning morphological assessment for polycystic ovarian features.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-xl text-xs font-bold font-mono border ${
                      activeAssessment.pcom_status === 'PCOM Detected'
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}
                  >
                    {activeAssessment.pcom_status || 'Ovarian Morphology Evaluated'}
                  </span>
                  {activeAssessment.pcom_probability !== undefined && activeAssessment.pcom_probability !== null && (
                    <span className="px-3 py-1 rounded-xl text-xs font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                      Probability: {(activeAssessment.pcom_probability * 100).toFixed(1)}%
                    </span>
                  )}
                </div>
              </div>

              {/* Side-by-side display */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                {/* Original Image */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#0F172A] flex items-center gap-1.5">
                      <LayersThree01 className="w-4 h-4 text-[#0288D1]" aria-hidden="true" />
                      Original Pelvic Ultrasound Scan
                    </span>
                    <span className="text-[11px] font-mono text-[#64748B]">B-mode Grayscale</span>
                  </div>
                  <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-slate-950 border border-slate-200 flex items-center justify-center shadow-inner">
                    <img
                      src={
                        (userProfile?.id && activeAssessment?.assessment_id && localStorage.getItem(`biopulse_original_ultrasound_${userProfile.id}_${activeAssessment.assessment_id}`)) ||
                        (userProfile?.id && activeAssessment?.id && localStorage.getItem(`biopulse_original_ultrasound_${userProfile.id}_${activeAssessment.id}`)) ||
                        (activeAssessment?.gradcam_b64?.startsWith('data:')
                          ? activeAssessment.gradcam_b64
                          : `data:image/png;base64,${activeAssessment?.gradcam_b64 || ''}`)
                      }
                      alt="Pelvic Ultrasound Scan"
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute bottom-2 left-2 px-2 py-1 rounded-md bg-black/60 text-[10px] font-mono text-white/80">
                      Source Scan
                    </div>
                  </div>
                  <p className="text-[11px] text-[#64748B] leading-relaxed">
                    Input transvaginal or transabdominal scan processed for acoustic and ovarian boundary attributes.
                  </p>
                </div>

                {/* Grad-CAM Heatmap */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#01579B] flex items-center gap-1.5">
                      <Eye className="w-4 h-4 text-[#0288D1]" aria-hidden="true" />
                      AI Attention Heatmap (Grad-CAM)
                    </span>
                    <span className="text-[11px] font-mono text-[#0288D1] font-bold">Jet Colormap</span>
                  </div>
                  <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-slate-950 border border-[#BAE6FD] flex items-center justify-center shadow-inner">
                    <img
                      src={
                        activeAssessment?.gradcam_b64?.startsWith('data:')
                          ? activeAssessment.gradcam_b64
                          : `data:image/png;base64,${activeAssessment?.gradcam_b64 || ''}`
                      }
                      alt="Grad-CAM Neural Focus Heatmap"
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-md bg-[#01579B]/80 backdrop-blur-xs text-[10px] font-mono text-white font-semibold">
                      Red / Warm = Higher Neural Attention
                    </div>
                  </div>
                  <p className="text-[11px] text-[#64748B] leading-relaxed">
                    Grad-CAM highlights specific follicle clusters and stromal tissue regions that most strongly drove the morphological screening result.
                  </p>
                </div>
              </div>

              {/* Clinical Non-Diagnostic Safety Callout */}
              <div className="p-4 rounded-2xl bg-[#F0F9FF] border border-[#BAE6FD] flex items-start gap-3 text-xs text-[#0F172A]">
                <ShieldTick className="w-4 h-4 text-[#0288D1] shrink-0 mt-0.5" aria-hidden="true" />
                <div className="space-y-1">
                  <p className="font-bold text-[#01579B]">
                    Informational Explainability & Spatial Visualization Only
                  </p>
                  <p className="text-[#475569] leading-relaxed">
                    This heatmap shows internal machine learning attention to assist user understanding of visual screening features. It is not an automated medical diagnosis, biopsy, or radiologist report. Clinical correlation with a gynecologist or sonographer is essential.
                  </p>
                </div>
              </div>
            </div>
          )}

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
                  <CheckDone01 className="w-5 h-5 text-white" aria-hidden="true" />
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm sm:base font-bold text-[#01579B] font-display">
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
              <Edit03 className="w-5 h-5 text-[#0288D1]" aria-hidden="true" />
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
              <CheckCircle className="w-4 h-4 text-[#059669]" aria-hidden="true" />
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
              {isSaving ? <RefreshCw01 className="w-4 h-4 animate-spin text-white" aria-hidden="true" /> : <Save01 className="w-4 h-4 text-white" aria-hidden="true" />}
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
