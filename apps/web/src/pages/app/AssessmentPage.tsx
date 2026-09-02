import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ClipboardCheck,
  Calendar,
  Activity,
  Heart,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  Apple,
  Moon,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useUserHealth } from '../../context/UserHealthContext';
import type { UserProfile } from '../../types/onboarding';

type Step = 1 | 2 | 3 | 4;

export const AssessmentPage: React.FC = () => {
  const navigate = useNavigate();
  const { userProfile, updateUserProfile } = useAuth();
  const {
    refreshMlAssessment,
    openAiChatWithPrompt,
  } = useUserHealth();

  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Form State initialized from userProfile
  const [cycleRegularity, setCycleRegularity] = useState<string>(
    userProfile.womensHealth?.periodRegularity || 'mostly_regular'
  );
  const [cycleLengthDays, setCycleLengthDays] = useState<string>(
    String(userProfile.womensHealth?.cycleLength || '28')
  );
  const [periodDuration, setPeriodDuration] = useState<number>(
    userProfile.womensHealth?.periodDuration || 5
  );

  const [heightCm, setHeightCm] = useState<number>(userProfile.heightCm || 165);
  const [weightKg, setWeightKg] = useState<number>(userProfile.weightKg || 65);

  const [symptoms, setSymptoms] = useState<string[]>(
    userProfile.womensHealth?.commonSymptoms || []
  );

  const [fastFoodIntake, setFastFoodIntake] = useState<string>(
    userProfile.lifestyle?.fastFoodIntake || 'occasional'
  );
  const [sleepHours, setSleepHours] = useState<number>(
    userProfile.lifestyle?.sleepHours || 7.5
  );
  const [activityLevel, setActivityLevel] = useState<string>(
    userProfile.lifestyle?.activityLevel || 'moderate'
  );
  const [dietaryPreference, setDietaryPreference] = useState<string>(
    userProfile.lifestyle?.dietaryPreference || 'Balanced'
  );

  const calculatedBmi =
    heightCm > 0
      ? Math.round((weightKg / Math.pow(heightCm / 100, 2)) * 10) / 10
      : 22.0;

  const toggleSymptom = (sym: string) => {
    setSymptoms((prev) =>
      prev.includes(sym) ? prev.filter((s) => s !== sym) : [...prev, sym]
    );
  };

  const handleSaveAssessment = async () => {
    setIsSubmitting(true);
    try {
      const updatedProfile: Partial<UserProfile> = {
        heightCm,
        weightKg,
        womensHealth: {
          ...userProfile.womensHealth,
          periodRegularity: cycleRegularity as any,
          cycleLength: (cycleLengthDays === 'irregular' ? 'irregular' : Number(cycleLengthDays) || 28) as any,
          periodDuration,
          commonSymptoms: symptoms,
        },
        lifestyle: {
          ...userProfile.lifestyle,
          fastFoodIntake: fastFoodIntake as any,
          sleepHours,
          activityLevel: activityLevel as any,
          dietaryPreference: dietaryPreference as any,
        },
      };

      await updateUserProfile(updatedProfile);
      await refreshMlAssessment();
      setSavedSuccess(true);
    } catch (err) {
      console.error('Failed to update assessment:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-4xl mx-auto space-y-6 sm:space-y-8 pb-20 text-left select-none"
    >
      {/* ── Top Header Banner ── */}
      <div className="relative p-6 sm:p-8 rounded-[32px] bg-gradient-to-r from-[#180A26] via-[#240F38] to-[#12071F] border border-white/10 text-white shadow-xl overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#8E3EAF]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#6E2D8B]/30 border border-[#8E3EAF]/40 text-xs font-mono text-[#FDA4AF]">
            <ClipboardCheck className="w-3.5 h-3.5 text-[#FB7185]" />
            <span>Rotterdam-Informed Biomarker Questionnaire</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-white">
            Clinical Health & Lifestyle Assessment
          </h1>
          <p className="text-xs sm:text-sm text-[#CDBDD8] font-sans max-w-2xl leading-relaxed">
            Provide structured details about your menstrual regularity, androgenic symptoms, metabolic biometrics, and sleep habits. This directly updates your Digital Twin and ML pattern screening.
          </p>
        </div>

        {/* Stepper Dots */}
        <div className="relative z-10 flex items-center gap-3 mt-6">
          {[1, 2, 3, 4].map((stepNum) => (
            <button
              key={stepNum}
              type="button"
              onClick={() => setCurrentStep(stepNum as Step)}
              className={`flex-1 h-2 rounded-full transition-all duration-300 ${
                currentStep >= stepNum
                  ? 'bg-gradient-to-r from-[#8E3EAF] to-[#FB7185]'
                  : 'bg-white/10'
              }`}
            />
          ))}
        </div>
        <div className="relative z-10 flex justify-between text-[11px] font-mono text-[#CDBDD8] mt-2">
          <span>1. Menstrual Cycle</span>
          <span>2. Physical Markers</span>
          <span>3. Lifestyle & Habits</span>
          <span>4. Review & Sync</span>
        </div>
      </div>

      {/* ── Step Content ── */}
      <div className="p-6 sm:p-8 rounded-[32px] bg-white/[0.03] border border-white/10 shadow-lg text-white space-y-6">
        <AnimatePresence mode="wait">
          {/* STEP 1: Menstrual Cycle Rhythm */}
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-6"
            >
              <div className="border-b border-white/10 pb-4">
                <h2 className="text-lg font-bold font-display text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-[#FB7185]" />
                  <span>Cycle & Menstrual Characteristics</span>
                </h2>
                <p className="text-xs text-[#CDBDD8] mt-1">
                  Ovulatory irregularity is a primary diagnostic indicator under the Rotterdam Consensus.
                </p>
              </div>

              <div className="space-y-4">
                <label className="block text-xs font-mono uppercase tracking-wider text-[#CDBDD8]">
                  How would you describe your period regularity?
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { id: 'regular', title: 'Regular (Every 21–35 days)', desc: 'Consistent cycle within typical range' },
                    { id: 'mostly_regular', title: 'Mostly Regular (±4 days variation)', desc: 'Small monthly shifts, predictable' },
                    { id: 'irregular', title: 'Irregular (Varies by >7 days)', desc: 'Unpredictable timing or skipped months' },
                    { id: 'severely_irregular', title: 'Infrequent (<8 periods/year)', desc: 'Periods occur less than 8 times annually' },
                  ].map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setCycleRegularity(option.id)}
                      className={`p-4 rounded-2xl border text-left transition-all ${
                        cycleRegularity === option.id
                          ? 'border-[#FB7185] bg-[#FB7185]/10 text-white shadow-md'
                          : 'border-white/10 bg-white/[0.02] text-[#CDBDD8] hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-white">{option.title}</span>
                        {cycleRegularity === option.id && <CheckCircle2 className="w-4 h-4 text-[#FB7185]" />}
                      </div>
                      <p className="text-xs text-[#A898BC] mt-1">{option.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="space-y-2">
                  <label className="block text-xs font-mono uppercase tracking-wider text-[#CDBDD8]">
                    Typical Cycle Length (Days)
                  </label>
                  <input
                    type="number"
                    min={18}
                    max={90}
                    value={cycleLengthDays}
                    onChange={(e) => setCycleLengthDays(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-white/[0.05] border border-white/10 text-white text-sm focus:outline-none focus:border-[#FB7185]"
                  />
                  <p className="text-[11px] text-[#A898BC]">Standard adult menstrual cycles average 28 days.</p>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-mono uppercase tracking-wider text-[#CDBDD8]">
                    Bleeding Duration (Days)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={14}
                    value={periodDuration}
                    onChange={(e) => setPeriodDuration(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-2xl bg-white/[0.05] border border-white/10 text-white text-sm focus:outline-none focus:border-[#FB7185]"
                  />
                  <p className="text-[11px] text-[#A898BC]">Normal menses duration typically ranges between 3 and 7 days.</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 2: Physical & Androgenic Manifestations */}
          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-6"
            >
              <div className="border-b border-white/10 pb-4">
                <h2 className="text-lg font-bold font-display text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-[#FB7185]" />
                  <span>Physical & Androgenic Manifestations</span>
                </h2>
                <p className="text-xs text-[#CDBDD8] mt-1">
                  Hyperandrogenism markers (clinical or biochemical) form the second pillar of Rotterdam evaluation.
                </p>
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-mono uppercase tracking-wider text-[#CDBDD8]">
                  Select any symptoms you currently experience:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { id: 'excess_hair', title: 'Hirsutism / Coarse Facial or Body Hair', sub: 'Chin, upper lip, chest, lower abdomen' },
                    { id: 'acne', title: 'Persistent Adult or Hormonal Acne', sub: 'Jawline, cheeks, back' },
                    { id: 'hair_loss', title: 'Scalp Hair Thinning / Crown Loss', sub: 'Androgenic pattern hair shedding' },
                    { id: 'weight_gain', title: 'Rapid Unexplained Weight Gain', sub: 'Difficulty losing weight despite diet' },
                    { id: 'dark_patches', title: 'Acanthosis Nigricans (Skin Darkening)', sub: 'Velvety dark patches on neck or underarms' },
                    { id: 'fatigue', title: 'Chronic Fatigue or Post-Meal Crashes', sub: 'Fluctuations linked to insulin sensitivity' },
                    { id: 'pelvic_pain', title: 'Pelvic Discomfort or Deep Cramping', sub: 'Aches around ovaries or during ovulation' },
                    { id: 'mood_changes', title: 'Significant Mood Swings / Brain Fog', sub: 'Pre-menstrual exacerbations' },
                  ].map((sym) => {
                    const isSelected = symptoms.includes(sym.id);
                    return (
                      <button
                        key={sym.id}
                        type="button"
                        onClick={() => toggleSymptom(sym.id)}
                        className={`p-3.5 rounded-2xl border text-left transition-all ${
                          isSelected
                            ? 'border-[#FB7185] bg-[#FB7185]/10 text-white'
                            : 'border-white/10 bg-white/[0.02] text-[#CDBDD8] hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-white">{sym.title}</span>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-[#FB7185] shrink-0" />}
                        </div>
                        <p className="text-[11px] text-[#A898BC] mt-0.5">{sym.sub}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 3: Lifestyle & Metabolic Biometrics */}
          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-6"
            >
              <div className="border-b border-white/10 pb-4">
                <h2 className="text-lg font-bold font-display text-white flex items-center gap-2">
                  <Heart className="w-5 h-5 text-[#FB7185]" />
                  <span>Metabolic Biometrics & Lifestyle Habits</span>
                </h2>
                <p className="text-xs text-[#CDBDD8] mt-1">
                  Insulin resistance, BMI, and circadian patterns modulate neuroendocrine signaling.
                </p>
              </div>

              {/* Height, Weight & BMI Card */}
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                <div className="space-y-1">
                  <label className="block text-xs font-mono uppercase tracking-wider text-[#CDBDD8]">
                    Height (cm)
                  </label>
                  <input
                    type="number"
                    min={120}
                    max={220}
                    value={heightCm}
                    onChange={(e) => setHeightCm(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white text-sm focus:outline-none focus:border-[#FB7185]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-mono uppercase tracking-wider text-[#CDBDD8]">
                    Weight (kg)
                  </label>
                  <input
                    type="number"
                    min={30}
                    max={200}
                    value={weightKg}
                    onChange={(e) => setWeightKg(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white text-sm focus:outline-none focus:border-[#FB7185]"
                  />
                </div>
                <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10 text-center">
                  <span className="text-[11px] font-mono text-[#CDBDD8] uppercase block">Calculated BMI</span>
                  <span className="text-xl font-bold font-mono text-[#FDA4AF]">{calculatedBmi} kg/m²</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-xs font-mono uppercase tracking-wider text-[#CDBDD8] flex items-center gap-1.5">
                    <Apple className="w-4 h-4 text-[#FDA4AF]" />
                    <span>Fast Food / High-Sugar Intake</span>
                  </label>
                  <select
                    value={fastFoodIntake}
                    onChange={(e) => setFastFoodIntake(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#1A0B2E] border border-white/10 text-white text-sm focus:outline-none focus:border-[#FB7185]"
                  >
                    <option value="rarely">Rarely / Minimal (&lt;1 time/week)</option>
                    <option value="occasional">Occasional (1–2 times/week)</option>
                    <option value="frequent">Frequent (3–4 times/week)</option>
                    <option value="daily">Daily / High Glycemic Pattern</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-mono uppercase tracking-wider text-[#CDBDD8] flex items-center gap-1.5">
                    <Moon className="w-4 h-4 text-[#FDA4AF]" />
                    <span>Average Nightly Sleep (Hours)</span>
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min={4}
                    max={12}
                    value={sleepHours}
                    onChange={(e) => setSleepHours(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white text-sm focus:outline-none focus:border-[#FB7185]"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-mono uppercase tracking-wider text-[#CDBDD8] flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-[#FDA4AF]" />
                    <span>Activity Level</span>
                  </label>
                  <select
                    value={activityLevel}
                    onChange={(e) => setActivityLevel(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#1A0B2E] border border-white/10 text-white text-sm focus:outline-none focus:border-[#FB7185]"
                  >
                    <option value="sedentary">Sedentary</option>
                    <option value="light">Light Activity</option>
                    <option value="moderate">Moderate</option>
                    <option value="active">Very Active</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-mono uppercase tracking-wider text-[#CDBDD8] flex items-center gap-1.5">
                    <Heart className="w-4 h-4 text-[#FDA4AF]" />
                    <span>Dietary Preference</span>
                  </label>
                  <select
                    value={dietaryPreference}
                    onChange={(e) => setDietaryPreference(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#1A0B2E] border border-white/10 text-white text-sm focus:outline-none focus:border-[#FB7185]"
                  >
                    <option value="balanced">Balanced</option>
                    <option value="vegetarian">Vegetarian</option>
                    <option value="vegan">Vegan</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 4: Review & Sync with Digital Twin */}
          {currentStep === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-6"
            >
              <div className="border-b border-white/10 pb-4">
                <h2 className="text-lg font-bold font-display text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#FB7185]" />
                  <span>Review & Synchronize with Digital Twin</span>
                </h2>
                <p className="text-xs text-[#CDBDD8] mt-1">
                  Confirm your questionnaire entries. Once saved, your structured profile updates immediately.
                </p>
              </div>

              {savedSuccess ? (
                <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-3">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                  <h3 className="text-lg font-bold text-white">Questionnaire Synchronized!</h3>
                  <p className="text-xs text-[#CDBDD8] max-w-md mx-auto">
                    Your answers have been stored in your patient health record. The ML screening model and your Digital Twin have been updated.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
                    <button
                      type="button"
                      onClick={() => navigate('/app/dashboard')}
                      className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all"
                    >
                      Return to Dashboard
                    </button>
                    <button
                      type="button"
                      onClick={() => openAiChatWithPrompt('Explain how my newly logged questionnaire entries influence my health patterns.')}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#6E2D8B] to-[#FB7185] text-white text-xs font-bold transition-all"
                    >
                      Discuss with OvaSense AI
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Summary grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                    <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-1">
                      <span className="text-[#A898BC] uppercase block">Menstrual Rhythm</span>
                      <p className="text-white font-bold">{cycleRegularity.replace('_', ' ')}</p>
                      <p className="text-[#CDBDD8]">{cycleLengthDays} day cycle ({periodDuration} days menses)</p>
                    </div>

                    <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-1">
                      <span className="text-[#A898BC] uppercase block">Biometrics & BMI</span>
                      <p className="text-white font-bold">{calculatedBmi} kg/m²</p>
                      <p className="text-[#CDBDD8]">{heightCm} cm · {weightKg} kg</p>
                    </div>

                    <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-1">
                      <span className="text-[#A898BC] uppercase block">Logged Manifestations</span>
                      <p className="text-white font-bold">{symptoms.length} symptom types selected</p>
                      <p className="text-[#CDBDD8]">{symptoms.slice(0, 3).join(', ') || 'None selected'}</p>
                    </div>

                    <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-1">
                      <span className="text-[#A898BC] uppercase block">Lifestyle & Sleep</span>
                      <p className="text-white font-bold">{sleepHours} hrs sleep / night</p>
                      <p className="text-[#CDBDD8]">Fast food: {fastFoodIntake}</p>
                    </div>
                  </div>

                  {/* Non-diagnostic notice */}
                  <div className="p-4 rounded-2xl bg-[#FB7185]/10 border border-[#FB7185]/30 text-xs text-[#FDA4AF] flex items-start gap-2.5">
                    <ShieldCheck className="w-5 h-5 shrink-0 text-[#FB7185]" />
                    <p>
                      <strong>Clinical Boundary Notice:</strong> This questionnaire provides structured indicators for risk screening and health pattern tracking. It does not replace a clinical ultrasound or formal diagnosis by a licensed gynecologist.
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Navigation Buttons ── */}
        {!savedSuccess && (
          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => (prev - 1) as Step)}
                className="px-4 py-2.5 rounded-xl border border-white/10 hover:bg-white/10 text-xs font-bold text-white flex items-center gap-1.5 transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            ) : (
              <div />
            )}

            {currentStep < 4 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => (prev + 1) as Step)}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#6E2D8B] to-[#FB7185] hover:brightness-110 text-xs font-bold text-white flex items-center gap-1.5 transition-all shadow-md"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSaveAssessment}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-xs font-bold text-white flex items-center gap-1.5 transition-all shadow-md disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Saving & Calculating...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Save & Update Screening</span>
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};
