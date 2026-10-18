import React, { useState } from 'react';
import {
  Dumbbell,
  Moon,
  Flower2,
  Droplets,
  Plus,
  Minus,
  CheckCircle2,
  Trash2,
  Clock,
  Smile,
  ShieldCheck,
  Play,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useUserHealth } from '../../../context/UserHealthContext';
import { SuggestedRoutinesSection } from '../../fitness/SuggestedRoutinesSection';
import { WeeklyMovementWidget } from '../../fitness/WeeklyMovementWidget';
import { RecentActivitiesList } from '../../fitness/RecentActivitiesList';
import { ActivityLogModal } from '../../fitness/ActivityLogModal';
import { StressLogModal } from '../StressLogModal';
import type { FitnessPillar, LifestylePillar } from '../../../types/lifestyle';
import type {
  FitnessLogEntry,
  FitnessLogInput,
  ActivityType,
  SuggestedMovementRoutine,
} from '../../../types/fitness';
import type { StressActivityType, StressSessionInput } from '../../../types/stress';
import { getWorkoutImage } from '../../../utils/lifestyleImages';

interface AndroSenseAlternateTabsViewProps {
  activeTab: 'exercise' | 'sleep' | 'stress' | 'hydration';
  fitness?: FitnessPillar;
  lifestyle?: LifestylePillar;
  waterGlasses?: number;
  targetGlasses?: number;
  onIncrementWater?: () => void;
  onDecrementWater?: () => void;
  onOpenLogActivity?: () => void;
}

export const AndroSenseAlternateTabsView: React.FC<AndroSenseAlternateTabsViewProps> = ({
  activeTab,
  fitness,
  lifestyle,
  waterGlasses = 0,
  targetGlasses = 8,
  onIncrementWater,
  onDecrementWater,
}) => {
  const { t, i18n } = useTranslation();
  const isUrdu = i18n.language === 'ur';

  const {
    fitnessLogs,
    todayFitnessMinutes,
    weeklyFitnessStats,
    suggestedFitnessRoutines,
    logFitnessActivity,
    updateFitnessActivity,
    deleteFitnessActivity,
    stressSessions,
    todayStressStats,
    logStressSession,
    deleteStressSession,
  } = useUserHealth();

  // ── Exercise Logging Modal State ──
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [editingFitnessEntry, setEditingFitnessEntry] = useState<FitnessLogEntry | null>(null);
  const [initialFitnessName, setInitialFitnessName] = useState<string>('');
  const [initialFitnessType, setInitialFitnessType] = useState<ActivityType>('walking');
  const [initialFitnessDuration, setInitialFitnessDuration] = useState<number>(20);

  // ── Stress Logging Modal State ──
  const [isStressModalOpen, setIsStressModalOpen] = useState(false);
  const [initialStressType, setInitialStressType] = useState<StressActivityType>('box_breathing');
  const [initialStressName, setInitialStressName] = useState<string>('');
  const [initialStressDuration, setInitialStressDuration] = useState<number>(5);

  // --- Handlers: Exercise ---
  const handleOpenNewActivity = () => {
    setEditingFitnessEntry(null);
    setInitialFitnessName('');
    setInitialFitnessType('walking');
    setInitialFitnessDuration(20);
    setIsActivityModalOpen(true);
  };

  const handleQuickCompleteRoutine = (routine: SuggestedMovementRoutine) => {
    setEditingFitnessEntry(null);
    setInitialFitnessName(routine.title);
    setInitialFitnessType(routine.category);
    setInitialFitnessDuration(routine.durationMinutes);
    setIsActivityModalOpen(true);
  };

  const handleEditActivity = (entry: FitnessLogEntry) => {
    setEditingFitnessEntry(entry);
    setIsActivityModalOpen(true);
  };

  const handleSaveActivity = async (input: FitnessLogInput) => {
    if (editingFitnessEntry) {
      return await updateFitnessActivity(editingFitnessEntry.id, input);
    }
    return await logFitnessActivity(input);
  };

  // --- Handlers: Stress ---
  const handleOpenNewStress = (
    type: StressActivityType = 'box_breathing',
    name: string = isUrdu ? 'باکس بریتھنگ' : 'Box Breathing (4-4-4-4 Tactical Calm)',
    duration: number = 5
  ) => {
    setInitialStressType(type);
    setInitialStressName(name);
    setInitialStressDuration(duration);
    setIsStressModalOpen(true);
  };

  const handleSaveStressSession = async (input: StressSessionInput) => {
    return await logStressSession(input);
  };

  // Stress Activities Catalog (Male Hormonal & Nervous System Recovery)
  const stressActivities = [
    {
      id: 'box_breathing',
      type: 'box_breathing' as StressActivityType,
      title: isUrdu ? 'باکس بریتھنگ (4-4-4-4 ٹیکٹیکل پرسکون)' : 'Box Breathing (4-4-4-4 Tactical Calm)',
      duration: 5,
      description: isUrdu
        ? 'برابر 4 سیکنڈ سانس اندر، روکیں، باہر، روکیں۔ اعصابی تناؤ اور شدید کورٹیسول کو کم کرتا ہے۔'
        : 'Equal 4-count inhale, hold, exhale, hold. Balances autonomic nervous tone and clears acute sympathetic stress.',
      badge: isUrdu ? 'شدید تناؤ میں سکون' : 'Tactical Calm',
      tagColor: 'bg-sky-50 text-[#0868B9] border-sky-100',
    },
    {
      id: 'deep_breathing',
      type: 'deep_breathing' as StressActivityType,
      title: isUrdu ? '4-7-8 گہرے سانس کا ری سیٹ' : '4-7-8 Parasympathetic Reset',
      duration: 5,
      description: isUrdu
        ? 'ناک سے 4 سیکنڈ سانس، 7 سیکنڈ روکیں، منہ سے 8 سیکنڈ آہستہ باہر نکالیں۔ ویگس نرو کو فعال کرتا ہے۔'
        : 'Inhale 4s through nose, hold 7s, long exhale 8s. Stimulates vagal nerve activation to lower heart rate and cortisol.',
      badge: isUrdu ? 'ویگس ری سیٹ' : 'Vagal Reset',
      tagColor: 'bg-teal-50 text-[#0E9EAA] border-teal-100',
    },
    {
      id: 'mindfulness',
      type: 'mindfulness' as StressActivityType,
      title: isUrdu ? 'مائنڈفلنس اور حسی گراؤنڈنگ' : 'Mindfulness & Grounding',
      duration: 10,
      description: isUrdu
        ? 'حسی آگاہی اور سانس کی نگرانی جو ذہنی تھکاوٹ اور دباؤ کو دور کرتی ہے۔'
        : '5-4-3-2-1 sensory orientation and breath tracking to reduce mental overwhelm and performance anxiety.',
      badge: isUrdu ? 'ذہنی یکسوئی' : 'Mental Focus',
      tagColor: 'bg-blue-50 text-[#0284C7] border-blue-100',
    },
    {
      id: 'progressive_muscle_relaxation',
      type: 'progressive_muscle_relaxation' as StressActivityType,
      title: isUrdu ? 'پروگریسو مسل ریلیکسیشن (عضلاتی آرام)' : 'Progressive Muscle Relaxation (PMR)',
      duration: 15,
      description: isUrdu
        ? 'جسم کے پٹھوں کو باری باری کھینچ کر ڈھیلا چھوڑنے کی مشق تاکہ جمع شدہ تناؤ ختم ہو۔'
        : 'Systematic tension-and-release across major muscle groups from feet to jaw to release physical stress.',
      badge: isUrdu ? 'عضلاتی سکون' : 'Muscle Release',
      tagColor: 'bg-indigo-50 text-[#4F46E5] border-indigo-100',
    },
    {
      id: 'guided_relaxation',
      type: 'guided_relaxation' as StressActivityType,
      title: isUrdu ? 'ورزش کے بعد اعصابی بحالی' : 'Post-Activity Nervous Recovery',
      duration: 12,
      description: isUrdu
        ? 'ورزش کے بعد پرسکون سانس اور بحالی تاکہ جسم تیزی سے اینابولک حالت میں واپس آئے۔'
        : 'Attentive somatic rest down-regulating sympathetic drive post-exercise to facilitate anabolic hormonal recovery.',
      badge: isUrdu ? 'اینابولک بحالی' : 'Anabolic Rest',
      tagColor: 'bg-cyan-50 text-[#0891B2] border-cyan-100',
    },
    {
      id: 'gentle_stretching',
      type: 'gentle_stretching' as StressActivityType,
      title: isUrdu ? 'پرسکون کھنچاؤ کی ورزش' : 'Restorative Somatic Mobility',
      duration: 10,
      description: isUrdu
        ? 'ہلکا اور پرسکون کھنچاؤ جو بغیر تھکاوٹ اعصابی توازن اور لچک بحال کرے۔'
        : 'Low-effort restorative stretching and slow nasal breathing releasing joint stiffness without physical fatigue.',
      badge: isUrdu ? 'ریسٹوریٹو اسٹریچ' : 'Gentle Mobility',
      tagColor: 'bg-emerald-50 text-[#059669] border-emerald-100',
    },
  ];

  // ══════════════════════════════════════════════════════════════════════════
  // TAB 1: EXERCISE & PHYSICAL ACTIVITY
  // ══════════════════════════════════════════════════════════════════════════
  if (activeTab === 'exercise') {
    return (
      <div
        dir={isUrdu ? 'rtl' : 'ltr'}
        className={`space-y-6 animate-fadeIn ${isUrdu ? 'text-right' : 'text-left'}`}
      >
        {/* 1. Movement Overview Card */}
        <div className="rounded-3xl bg-white border border-sky-100 p-6 sm:p-7 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-teal-50 text-[#0E9EAA] flex items-center justify-center shrink-0">
                <Dumbbell className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  {fitness?.protocol_name || t('movementSection.title', 'Movement & Physical Activity')}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {fitness?.overview ||
                    (isUrdu
                      ? 'قوت اور ایروبک ورزش جو انسولین کی حساسیت اور مجموعی جسمانی طاقت کو بہتر بناتی ہے۔'
                      : 'Targeted progressive movement optimizing muscle glucose clearance and metabolic stamina.')}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleOpenNewActivity}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#0868B9] hover:bg-[#07589D] text-white text-xs font-bold shadow-xs cursor-pointer transition shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isUrdu ? 'ورزش درج کریں' : 'Log Movement'}</span>
            </button>
          </div>

          {/* Quick Target Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3.5 rounded-2xl bg-[#F0FDF9] border border-teal-100 space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 block">
                {isUrdu ? 'ایروبک ہدف' : 'Aerobic Target'}
              </span>
              <span className="text-base font-bold text-slate-800 font-mono">
                {fitness?.aerobic_target_minutes || '150 mins / week'}
              </span>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#F0F7FF] border border-sky-100 space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 block">
                {isUrdu ? 'مزاحمتی ورزش' : 'Resistance Sessions'}
              </span>
              <span className="text-base font-bold text-slate-800 font-mono">
                {fitness?.resistance_target_sessions || '2-3 sessions'}
              </span>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#EFF6FF] border border-blue-100 space-y-1 col-span-2 sm:col-span-1">
              <span className="text-[11px] font-semibold text-slate-500 block">
                {isUrdu ? 'میٹابولک فوکس' : 'Metabolic Focus'}
              </span>
              <span className="text-xs font-bold text-[#0868B9] block leading-tight">
                {fitness?.pathway_clinical_benefit || 'Lean mass & insulin-sensitizing glucose uptake'}
              </span>
            </div>
          </div>
        </div>

        {/* 2. Suggested Routines Section */}
        <SuggestedRoutinesSection
          phaseName={isUrdu ? 'قوت اور جسمانی توانائی' : 'Vitality & Stamina'}
          routines={suggestedFitnessRoutines}
          onQuickComplete={handleQuickCompleteRoutine}
          isMale={true}
        />

        {/* 3. Weekly Movement Progress & Recent Activities */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5">
            <WeeklyMovementWidget
              stats={weeklyFitnessStats}
              todayMinutes={todayFitnessMinutes}
              isMale={true}
            />
          </div>

          <div className="lg:col-span-7">
            <RecentActivitiesList
              logs={fitnessLogs}
              onOpenLogModal={handleOpenNewActivity}
              onEditActivity={handleEditActivity}
              onDeleteActivity={deleteFitnessActivity}
              isMale={true}
            />
          </div>
        </div>

        {/* 4. Weekly Movement Protocol Schedule (if provided by recommendation) */}
        {fitness?.weekly_schedule && fitness.weekly_schedule.length > 0 && (
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-slate-800">
              {isUrdu ? 'ہفتہ وار تجویز کردہ شیڈول' : 'Prescribed Weekly Movement Schedule'}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {fitness.weekly_schedule.map((session, idx) => {
                const visual = getWorkoutImage(session.modality, session.focus);
                return (
                  <div
                    key={idx}
                    className="rounded-3xl bg-white border border-sky-100 overflow-hidden shadow-sm flex flex-col justify-between"
                  >
                    <div className="relative h-40 w-full overflow-hidden bg-slate-100">
                      <img
                        src={visual.url}
                        alt={visual.alt}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent" />
                      <div className="absolute top-3 left-3 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/95 text-slate-800 shadow-xs">
                        {session.day_name}
                      </div>
                      <div className="absolute bottom-3 right-3 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-slate-900/80 text-white">
                        {session.duration_mins} mins
                      </div>
                    </div>
                    <div className="p-5 space-y-2">
                      <h4 className="text-sm sm:text-base font-bold text-slate-800">{session.focus}</h4>
                      <p className="text-xs text-slate-600 leading-relaxed">{session.coaching_cue}</p>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {session.key_movements?.map((m, mIdx) => (
                          <span
                            key={mIdx}
                            className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium"
                          >
                            {m}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 5. Activity Log & Edit Modal */}
        <ActivityLogModal
          isOpen={isActivityModalOpen}
          editingEntry={editingFitnessEntry}
          initialActivityName={initialFitnessName}
          initialActivityType={initialFitnessType}
          initialDurationMinutes={initialFitnessDuration}
          onClose={() => setIsActivityModalOpen(false)}
          onSave={handleSaveActivity}
          isMale={true}
        />
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // TAB 2: SLEEP & CIRCADIAN RHYTHMS
  // ══════════════════════════════════════════════════════════════════════════
  if (activeTab === 'sleep') {
    return (
      <div
        dir={isUrdu ? 'rtl' : 'ltr'}
        className={`space-y-6 animate-fadeIn ${isUrdu ? 'text-right' : 'text-left'}`}
      >
        <div className="rounded-3xl bg-white border border-sky-100 p-6 sm:p-7 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Moon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">
                {isUrdu ? 'نیند کی بحالی اور سرکیڈین توازن' : 'Sleep Recovery & Nocturnal Endocrine Health'}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {lifestyle?.circadian_headline ||
                  (isUrdu
                    ? 'گہری اور مسلسل نیند رات کے وقت جسمانی بحالی اور ہارمونز کے لیے ضروری ہے۔'
                    : 'Unfragmented nocturnal sleep is the primary driver of nocturnal recovery and neuroendocrine function.')}
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#F0F7FF] border border-sky-100 flex items-center justify-between gap-4">
            <div>
              <span className="text-xs font-semibold text-slate-500 block">
                {isUrdu ? 'تجویز کردہ نیند کا دورانیہ' : 'Recommended Sleep Window'}
              </span>
              <span className="text-xl font-black text-slate-800 font-mono">
                {lifestyle?.sleep_target_hours || '7–8 hours'}
              </span>
            </div>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-sky-100 text-[#0868B9]">
              {isUrdu ? 'گہری بحالی' : 'Optimal Slow-Wave & REM'}
            </span>
          </div>

          {/* Sleep Protocol List */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              {isUrdu ? 'سرکیڈین پروٹوکول کے رہنما اصول' : 'Circadian Sleep Hygiene Rules'}
            </h4>
            <div className="space-y-2 text-xs text-slate-700">
              <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-50">
                <CheckCircle2 className="w-4 h-4 text-[#0868B9] shrink-0 mt-0.5" />
                <span>
                  {isUrdu
                    ? 'سونے سے 6 گھنٹے قبل چائے، کافی یا کیفین والے مشروبات سے پرہیز کریں۔'
                    : 'Avoid high-stimulant intake or chai within 6 hours of scheduled sleep'}
                </span>
              </div>
              <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-50">
                <CheckCircle2 className="w-4 h-4 text-[#0868B9] shrink-0 mt-0.5" />
                <span>
                  {isUrdu
                    ? 'سونے کے کمرے کو مکمل طور پر اندھیرا، پرسکون اور ٹھنڈا رکھیں۔'
                    : 'Maintain a dark, cool (18–20°C), quiet sleep environment to optimize deep recovery'}
                </span>
              </div>
              <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-50">
                <CheckCircle2 className="w-4 h-4 text-[#0868B9] shrink-0 mt-0.5" />
                <span>
                  {isUrdu
                    ? 'سونے سے 45 منٹ قبل اسکرینوں اور نیلی روشنی سے دوری اختیار کریں۔'
                    : 'Wind down digital screens and blue light 45 minutes prior to bed'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // TAB 3: STRESS & CORTISOL REGULATION
  // ══════════════════════════════════════════════════════════════════════════
  if (activeTab === 'stress') {
    return (
      <div
        dir={isUrdu ? 'rtl' : 'ltr'}
        className={`space-y-6 animate-fadeIn ${isUrdu ? 'text-right' : 'text-left'}`}
      >
        {/* 1. Stress Overview & Today's Summary Card */}
        <div className="rounded-3xl bg-white border border-sky-100 p-6 sm:p-7 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-sky-50 text-[#0868B9] flex items-center justify-center shrink-0">
                <Flower2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  {isUrdu ? 'تناؤ کا انتظام اور اعصابی بحالی' : 'Stress Regulation & Autonomic Recovery'}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {lifestyle?.stress_management_protocol ||
                    (isUrdu
                      ? 'دباؤ اور کورٹیسول کو متوازن رکھنے کی تکنیکیں جو توانائی اور اعصابی توازن بحال کرتی ہیں۔'
                      : 'Parasympathetic down-regulation protecting against chronic cortisol elevation and supporting adrenal resilience.')}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleOpenNewStress()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#0868B9] hover:bg-[#07589D] text-white text-xs font-bold shadow-xs cursor-pointer transition shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isUrdu ? 'ریلیکسیشن سیشن درج کریں' : 'Log Relaxation Session'}</span>
            </button>
          </div>

          {/* Today's Relaxation Progress Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3.5 rounded-2xl bg-[#F0F7FF] border border-sky-100 space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 block">
                {isUrdu ? 'آج کے سیشنز' : 'Sessions Today'}
              </span>
              <span className="text-lg font-black text-[#0868B9] font-mono">
                {todayStressStats.completedSessionsToday} {isUrdu ? 'سیشن' : 'sessions'}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#F0FDF9] border border-teal-100 space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 block">
                {isUrdu ? 'آرام کا کل وقت' : 'Relaxation Time'}
              </span>
              <span className="text-lg font-black text-[#0D9488] font-mono">
                {todayStressStats.totalMinutesToday} {isUrdu ? 'منٹ' : 'mins'}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#EFF6FF] border border-blue-100 space-y-1 col-span-2 sm:col-span-1">
              <span className="text-[11px] font-semibold text-slate-500 block">
                {isUrdu ? 'تناؤ میں کمی' : 'Reported Relief'}
              </span>
              <span className="text-xs font-bold text-[#0868B9] block leading-tight">
                {todayStressStats.averageStressChange !== undefined && todayStressStats.averageStressChange > 0
                  ? isUrdu
                    ? `اوسط ${todayStressStats.averageStressChange.toFixed(1)} پوائنٹس کمی`
                    : `-${todayStressStats.averageStressChange.toFixed(1)} pts avg decrease`
                  : todayStressStats.completedSessionsToday > 0
                  ? isUrdu
                    ? 'سیشنز ریکارڈ ہو گئے'
                    : 'Sessions recorded'
                  : isUrdu
                  ? 'پہلے اور بعد کا موازنہ'
                  : 'Track before & after rating'}
              </span>
            </div>
          </div>

          {/* Clinical Non-Intervention Safety Note */}
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 leading-relaxed flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
            <span>
              <strong>{isUrdu ? 'طبی سیاق و سباق:' : 'Clinical Context:'}</strong>{' '}
              {isUrdu
                ? 'تناؤ کم کرنے والی مشقیں اعصابی بحالی اور نیند میں معاونت کرتی ہیں۔ یہ طبی معائنے کا متبادل نہیں ہیں اور نہ ہی ہارمونز کے لیبارٹری نتائج کو براہ راست تبدیل کرتی ہیں۔ دکھائے گئے نتائج ذاتی جائزہ پر مبنی ہیں۔'
                : 'Stress-relief activities support autonomic nervous balance, parasympathetic tone, and restorative sleep. They do not substitute for clinical medical evaluation or directly alter endocrine lab values. Reported changes reflect subjective self-evaluations.'}
            </span>
          </div>
        </div>

        {/* 2. Interactive Recommended Relaxation Activities */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-800">
              {isUrdu ? 'تجویز کردہ ریلیکسیشن مشقیں' : 'Recommended Relaxation Exercises'}
            </h4>
            <span className="text-xs text-slate-400 font-mono">
              {isUrdu ? 'اعصابی نظام کی بحالی' : 'Parasympathetic down-regulation'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stressActivities.map((act) => (
              <div
                key={act.id}
                className="rounded-3xl bg-white border border-sky-100 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-sky-300 transition"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-full font-bold border ${act.tagColor}`}>
                      {act.badge}
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {act.duration} {isUrdu ? 'منٹ' : 'mins'}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-800">{act.title}</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">{act.description}</p>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenNewStress(act.type, act.title, act.duration)}
                  className="w-full py-2.5 px-3 rounded-2xl bg-sky-50 hover:bg-sky-100 text-[#0868B9] text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>
                    {isUrdu ? `شروع کریں اور درج کریں (${act.duration} منٹ)` : `Start & Log (${act.duration}m)`}
                  </span>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Recent Relaxation Sessions History */}
        <div className="rounded-3xl bg-white border border-sky-100 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Flower2 className="w-4 h-4 text-[#0868B9]" />
              <h4 className="text-sm font-bold text-slate-800">
                {isUrdu ? 'حالیہ ریلیکسیشن سیشنز' : 'Recent Relaxation Sessions'}
              </h4>
            </div>

            <span className="text-xs text-slate-400 font-mono">
              {stressSessions.length} {isUrdu ? 'درج شدہ' : 'logged'}
            </span>
          </div>

          {stressSessions.length === 0 ? (
            <div className="py-8 text-center space-y-3 bg-[#F0F7FF] rounded-2xl border border-dashed border-sky-200">
              <div className="w-10 h-10 rounded-full bg-sky-100 text-[#0868B9] flex items-center justify-center mx-auto">
                <Smile className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-700">
                  {isUrdu ? 'آج کوئی ریلیکسیشن سیشن درج نہیں کیا گیا' : 'No relaxation sessions logged yet'}
                </p>
                <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                  {isUrdu
                    ? 'آج اپنے اعصابی نظام کو سکون پہنچانے کے لیے 5 منٹ کی باکس بریتھنگ یا 4-7-8 سانس کی مشق کریں۔'
                    : 'Take a 5-minute pause for tactical box breathing or 4-7-8 deep breathing today to soothe nervous system tension.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleOpenNewStress()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#0868B9] hover:bg-[#07589D] text-white text-xs font-bold cursor-pointer transition shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isUrdu ? 'پہلا سیشن درج کریں' : 'Log Your First Session'}</span>
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 space-y-2">
              {stressSessions.slice(0, 10).map((sess) => {
                const diff =
                  typeof sess.stressBefore === 'number' && typeof sess.stressAfter === 'number'
                    ? sess.stressBefore - sess.stressAfter
                    : null;

                return (
                  <div
                    key={sess.id}
                    className="pt-2 pb-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-sky-50 text-[#0868B9] flex items-center justify-center shrink-0 mt-0.5">
                        <Flower2 className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-slate-800 block truncate">
                          {sess.activityName}
                        </span>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono mt-0.5">
                          <span>{sess.occurredAt}</span>
                          <span>•</span>
                          <span>{sess.durationMinutes} {isUrdu ? 'منٹ' : 'mins'}</span>
                          {sess.notes && (
                            <>
                              <span>•</span>
                              <span className="truncate italic text-slate-400 max-w-xs">{sess.notes}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                      {diff !== null ? (
                        <span
                          className={`text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                            diff > 0
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : diff === 0
                              ? 'bg-slate-50 text-slate-600 border-slate-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {isUrdu ? 'تناؤ: ' : 'Stress: '}
                          {sess.stressBefore} → {sess.stressAfter}{' '}
                          {diff > 0
                            ? `(-${diff})`
                            : diff === 0
                            ? isUrdu
                              ? '(برقرار)'
                              : '(steady)'
                            : `(+${Math.abs(diff)})`}
                        </span>
                      ) : sess.stressBefore !== undefined ? (
                        <span className="text-[11px] font-mono text-slate-500 bg-slate-50 px-2 py-0.5 rounded-full">
                          {isUrdu ? `پہلے تناؤ: ${sess.stressBefore}/10` : `Stress before: ${sess.stressBefore}/10`}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">
                          {isUrdu ? 'کوئی ریٹنگ نہیں' : 'No ratings'}
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() => deleteStressSession(sess.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded-lg transition cursor-pointer"
                        aria-label={`Delete ${sess.activityName}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 4. Stress Log Modal */}
        <StressLogModal
          isOpen={isStressModalOpen}
          initialActivityType={initialStressType}
          initialActivityName={initialStressName}
          initialDuration={initialStressDuration}
          onClose={() => setIsStressModalOpen(false)}
          onSave={handleSaveStressSession}
          isMale={true}
        />
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // TAB 4: HYDRATION TRACKING (PRESERVED)
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div
      dir={isUrdu ? 'rtl' : 'ltr'}
      className={`space-y-6 animate-fadeIn ${isUrdu ? 'text-right' : 'text-left'}`}
    >
      <div className="rounded-3xl bg-white border border-sky-100 p-6 sm:p-7 shadow-sm space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
              <Droplets className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">
                {isUrdu ? 'روزانہ پانی کا اندراج' : 'Daily Hydration Tracking'}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {isUrdu
                  ? 'بہترین ہائیڈریشن خلیات کی صحت اور ہارمونز کے اخراج میں مدد دیتی ہے۔'
                  : 'Adequate cellular hydration optimizes blood viscosity, nutrient delivery, and metabolic recovery.'}
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-2xl font-black text-[#0868B9] font-mono">
              {waterGlasses} / {targetGlasses}
            </span>
            <span className="text-xs text-slate-400 block font-sans">
              {isUrdu ? 'گلاس' : 'glasses'}
            </span>
          </div>
        </div>

        {/* Interactive Glass Tracker */}
        <div className="p-5 rounded-2xl bg-sky-50/60 border border-sky-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 flex-wrap">
            {Array.from({ length: targetGlasses }).map((_, i) => (
              <div
                key={i}
                className={`w-7 h-9 rounded-md border flex items-center justify-center transition-all ${
                  i < waterGlasses
                    ? 'bg-sky-500 border-sky-600 text-white shadow-2xs'
                    : 'bg-white border-sky-200 text-slate-300'
                }`}
              >
                <Droplets className="w-3.5 h-3.5" />
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {onDecrementWater && (
              <button
                type="button"
                onClick={onDecrementWater}
                className="w-9 h-9 rounded-full bg-white border border-sky-200 text-slate-700 hover:bg-slate-50 flex items-center justify-center cursor-pointer shadow-xs transition"
                aria-label="Remove 1 glass of water"
              >
                <Minus className="w-4 h-4" />
              </button>
            )}
            {onIncrementWater && (
              <button
                type="button"
                onClick={onIncrementWater}
                className="w-9 h-9 rounded-full bg-sky-500 hover:bg-sky-600 text-white flex items-center justify-center cursor-pointer shadow-xs transition"
                aria-label="Add 1 glass of water"
              >
                <Plus className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AndroSenseAlternateTabsView;
