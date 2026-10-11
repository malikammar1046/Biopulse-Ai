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

interface OvaSenseAlternateTabsViewProps {
  activeTab: 'exercise' | 'sleep' | 'stress' | 'hydration';
  fitness?: FitnessPillar;
  lifestyle?: LifestylePillar;
  waterGlasses?: number;
  targetGlasses?: number;
  onIncrementWater?: () => void;
  onDecrementWater?: () => void;
  onOpenLogActivity?: () => void;
}

export const OvaSenseAlternateTabsView: React.FC<OvaSenseAlternateTabsViewProps> = ({
  activeTab,
  fitness,
  lifestyle,
  waterGlasses = 0,
  targetGlasses = 8,
  onIncrementWater,
  onDecrementWater,
}) => {
  const { t } = useTranslation();
  const {
    snapshotMetrics,
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
  const [initialStressType, setInitialStressType] = useState<StressActivityType>('deep_breathing');
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
    type: StressActivityType = 'deep_breathing',
    name: string = '4-7-8 Deep Breathing',
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

  // Stress Activities Catalog
  const stressActivities = [
    {
      id: 'deep_breathing',
      type: 'deep_breathing' as StressActivityType,
      title: '4-7-8 Parasympathetic Breathing',
      duration: 5,
      description: 'Inhale 4s through nose, hold 7s, long exhale 8s. Stimulates vagus nerve activation to down-regulate acute cortisol surges.',
      badge: 'Vagal Reset',
      tagColor: 'bg-teal-50 text-[#0E9EAA] border-teal-100',
    },
    {
      id: 'box_breathing',
      type: 'box_breathing' as StressActivityType,
      title: 'Box Breathing (4-4-4-4 Tactical Calm)',
      duration: 5,
      description: 'Equal 4-count inhale, hold, exhale, hold. Restores autonomic nervous balance and clears sympathetic tension.',
      badge: 'Acute Calm',
      tagColor: 'bg-pink-50 text-[#BE185D] border-pink-100',
    },
    {
      id: 'mindfulness',
      type: 'mindfulness' as StressActivityType,
      title: 'Mindfulness & Sensory Grounding',
      duration: 10,
      description: '5-4-3-2-1 sensory awareness and breath tracking to reduce mental overwhelm and emotional fatigue.',
      badge: 'Mental Clarity',
      tagColor: 'bg-purple-50 text-[#8B5CF6] border-purple-100',
    },
    {
      id: 'progressive_muscle_relaxation',
      type: 'progressive_muscle_relaxation' as StressActivityType,
      title: 'Progressive Muscle Relaxation (PMR)',
      duration: 15,
      description: 'Systematic tension-and-release across major muscle groups from toes to forehead to release stored somatic stress.',
      badge: 'Somatic Release',
      tagColor: 'bg-rose-50 text-[#E11D48] border-rose-100',
    },
    {
      id: 'guided_relaxation',
      type: 'guided_relaxation' as StressActivityType,
      title: 'Guided Body Scan & Decompression',
      duration: 12,
      description: 'Attentive somatic check-in releasing jaw, neck, and pelvic tension without judgment or physical exertion.',
      badge: 'Adrenal Recovery',
      tagColor: 'bg-indigo-50 text-[#6366F1] border-indigo-100',
    },
    {
      id: 'gentle_stretching',
      type: 'gentle_stretching' as StressActivityType,
      title: 'Gentle Somatic Stretching',
      duration: 10,
      description: 'Passive floor stretches paired with slow breathing to relieve neuromuscular stiffness without elevating heart rate.',
      badge: 'Restorative Mobility',
      tagColor: 'bg-emerald-50 text-[#059669] border-emerald-100',
    },
  ];

  // ══════════════════════════════════════════════════════════════════════════
  // TAB 1: EXERCISE & PHYSICAL ACTIVITY
  // ══════════════════════════════════════════════════════════════════════════
  if (activeTab === 'exercise') {
    return (
      <div className="space-y-6 animate-fadeIn text-left">
        {/* 1. Movement Overview Card */}
        <div className="rounded-3xl bg-white border border-[#FCE7F0] p-6 sm:p-7 shadow-sm space-y-4">
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
                    t(
                      'movementSection.subtitle',
                      'Targeted movement that optimizes insulin sensitivity without spiking stress cortisol'
                    )}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleOpenNewActivity}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#0E9EAA] hover:bg-[#0c858f] text-white text-xs font-bold shadow-xs cursor-pointer transition shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Movement</span>
            </button>
          </div>

          {/* Quick Target Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3.5 rounded-2xl bg-[#F0FDF9] border border-teal-100 space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 block">Aerobic Target</span>
              <span className="text-base font-bold text-slate-800 font-mono">
                {fitness?.aerobic_target_minutes || '150 mins / week'}
              </span>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#FFF0F5] border border-pink-100 space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 block">Resistance Sessions</span>
              <span className="text-base font-bold text-slate-800 font-mono">
                {fitness?.resistance_target_sessions || '2-3 sessions'}
              </span>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#FAF5FF] border border-purple-100 space-y-1 col-span-2 sm:col-span-1">
              <span className="text-[11px] font-semibold text-slate-500 block">Metabolic Focus</span>
              <span className="text-xs font-bold text-[#8B5CF6] block leading-tight">
                {fitness?.pathway_clinical_benefit || 'Insulin-sensitizing glucose clearance'}
              </span>
            </div>
          </div>
        </div>

        {/* 2. Suggested Routines Section */}
        <SuggestedRoutinesSection
          phaseName={snapshotMetrics.phaseName || 'Follicular Phase'}
          routines={suggestedFitnessRoutines}
          onQuickComplete={handleQuickCompleteRoutine}
          isMale={false}
        />

        {/* 3. Weekly Movement Progress & Recent Activities */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5">
            <WeeklyMovementWidget
              stats={weeklyFitnessStats}
              todayMinutes={todayFitnessMinutes}
              isMale={false}
            />
          </div>

          <div className="lg:col-span-7">
            <RecentActivitiesList
              logs={fitnessLogs}
              onOpenLogModal={handleOpenNewActivity}
              onEditActivity={handleEditActivity}
              onDeleteActivity={deleteFitnessActivity}
              isMale={false}
            />
          </div>
        </div>

        {/* 4. Weekly Movement Protocol Schedule (if provided by recommendation) */}
        {fitness?.weekly_schedule && fitness.weekly_schedule.length > 0 && (
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-slate-800">Prescribed Weekly Movement Schedule</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {fitness.weekly_schedule.map((session, idx) => {
                const visual = getWorkoutImage(session.modality, session.focus);
                return (
                  <div
                    key={idx}
                    className="rounded-3xl bg-white border border-[#FCE7F0] overflow-hidden shadow-sm flex flex-col justify-between"
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
          isMale={false}
        />
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // TAB 2: SLEEP & CIRCADIAN RHYTHMS
  // ══════════════════════════════════════════════════════════════════════════
  if (activeTab === 'sleep') {
    return (
      <div className="space-y-6 animate-fadeIn text-left">
        <div className="rounded-3xl bg-white border border-[#FCE7F0] p-6 sm:p-7 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <Moon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">
                {t('sleepSection.title', 'Sleep Rhythm & Cortisol Balance')}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {lifestyle?.circadian_headline ||
                  t(
                    'sleepSection.subtitle',
                    'Consistent circadian rhythms are essential for hormone synthesis and recovery'
                  )}
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#FAF5FF] border border-purple-100 flex items-center justify-between gap-4">
            <div>
              <span className="text-xs font-semibold text-slate-500 block">Recommended Sleep Window</span>
              <span className="text-xl font-black text-slate-800 font-mono">
                {lifestyle?.sleep_target_hours || '7–8 hours'}
              </span>
            </div>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-purple-100 text-purple-700">
              Optimal REM & Deep
            </span>
          </div>

          {/* Sleep Hygiene List */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Circadian Sleep Protocol
            </h4>
            <div className="space-y-2 text-xs text-slate-700">
              <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-50">
                <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                <span>
                  {t('sleepSection.sleepHygiene1', 'Avoid heavy caffeine or chai within 6 hours of bedtime')}
                </span>
              </div>
              <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-50">
                <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                <span>
                  {t('sleepSection.sleepHygiene2', 'Keep sleeping room cool, quiet and dark')}
                </span>
              </div>
              <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-50">
                <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                <span>
                  {t('sleepSection.sleepHygiene3', 'Wind down screen usage 45 minutes prior to sleep')}
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
      <div className="space-y-6 animate-fadeIn text-left">
        {/* 1. Stress Overview & Today's Summary Card */}
        <div className="rounded-3xl bg-white border border-[#FCE7F0] p-6 sm:p-7 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-pink-50 text-[#BE185D] flex items-center justify-center shrink-0">
                <Flower2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Stress & Cortisol Regulation</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {lifestyle?.stress_management_protocol ||
                    'Parasympathetic pacing to protect adrenal reserves and reduce stress-induced androgen surges.'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleOpenNewStress()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#BE185D] hover:bg-[#a0144e] text-white text-xs font-bold shadow-xs cursor-pointer transition shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Relaxation Session</span>
            </button>
          </div>

          {/* Today's Relaxation Progress Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3.5 rounded-2xl bg-[#FFF0F5] border border-pink-100 space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 block">Sessions Today</span>
              <span className="text-lg font-black text-[#BE185D] font-mono">
                {todayStressStats.completedSessionsToday} session{todayStressStats.completedSessionsToday !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#F0FDF9] border border-teal-100 space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 block">Relaxation Time</span>
              <span className="text-lg font-black text-[#0D9488] font-mono">
                {todayStressStats.totalMinutesToday} mins
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#FAF5FF] border border-purple-100 space-y-1 col-span-2 sm:col-span-1">
              <span className="text-[11px] font-semibold text-slate-500 block">Reported Relief</span>
              <span className="text-xs font-bold text-[#8B5CF6] block leading-tight">
                {todayStressStats.averageStressChange !== undefined && todayStressStats.averageStressChange > 0
                  ? `-${todayStressStats.averageStressChange.toFixed(1)} pts avg decrease`
                  : todayStressStats.completedSessionsToday > 0
                  ? 'Sessions recorded'
                  : 'Track before & after rating'}
              </span>
            </div>
          </div>

          {/* Clinical Non-Intervention Safety Note */}
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 leading-relaxed flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
            <span>
              <strong>Clinical Context:</strong> Mindful relaxation and breathing exercises support autonomic parasympathetic tone and restorative sleep. They do not substitute for medical treatment or directly alter endocrine lab values. Reported changes reflect subjective self-evaluations.
            </span>
          </div>
        </div>

        {/* 2. Interactive Recommended Relaxation Activities */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-800">Recommended Relaxation Exercises</h4>
            <span className="text-xs text-slate-400 font-mono">Parasympathetic down-regulation</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stressActivities.map((act) => (
              <div
                key={act.id}
                className="rounded-3xl bg-white border border-[#FCE7F0] p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-pink-200 transition"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-full font-bold border ${act.tagColor}`}>
                      {act.badge}
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {act.duration} mins
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-800">{act.title}</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">{act.description}</p>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenNewStress(act.type, act.title, act.duration)}
                  className="w-full py-2.5 px-3 rounded-2xl bg-pink-50 hover:bg-pink-100 text-[#BE185D] text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Start & Log ({act.duration}m)</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Recent Relaxation Sessions History */}
        <div className="rounded-3xl bg-white border border-[#FCE7F0] p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Flower2 className="w-4 h-4 text-[#BE185D]" />
              <h4 className="text-sm font-bold text-slate-800">Recent Relaxation Sessions</h4>
            </div>

            <span className="text-xs text-slate-400 font-mono">
              {stressSessions.length} logged
            </span>
          </div>

          {stressSessions.length === 0 ? (
            <div className="py-8 text-center space-y-3 bg-[#FFF8FA] rounded-2xl border border-dashed border-[#FCE7F0]">
              <div className="w-10 h-10 rounded-full bg-pink-50 text-[#BE185D] flex items-center justify-center mx-auto">
                <Smile className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-700">No relaxation sessions logged yet</p>
                <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                  Take a 5-minute pause for 4-7-8 deep breathing or box breathing today to soothe nervous system tension.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleOpenNewStress()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#BE185D] hover:bg-[#a0144e] text-white text-xs font-bold cursor-pointer transition shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Log Your First Session</span>
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
                      <div className="w-8 h-8 rounded-xl bg-pink-50 text-[#BE185D] flex items-center justify-center shrink-0 mt-0.5">
                        <Flower2 className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-slate-800 block truncate">
                          {sess.activityName}
                        </span>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono mt-0.5">
                          <span>{sess.occurredAt}</span>
                          <span>•</span>
                          <span>{sess.durationMinutes} mins</span>
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
                          Stress: {sess.stressBefore} → {sess.stressAfter}{' '}
                          {diff > 0 ? `(-${diff})` : diff === 0 ? '(steady)' : `(+${Math.abs(diff)})`}
                        </span>
                      ) : sess.stressBefore !== undefined ? (
                        <span className="text-[11px] font-mono text-slate-500 bg-slate-50 px-2 py-0.5 rounded-full">
                          Stress before: {sess.stressBefore}/10
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">No ratings</span>
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
          isMale={false}
        />
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // TAB 4: HYDRATION TRACKING (PRESERVED)
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="space-y-6 animate-fadeIn text-left">
      <div className="rounded-3xl bg-white border border-[#FCE7F0] p-6 sm:p-7 shadow-sm space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
              <Droplets className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Daily Hydration Tracking</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Optimal cellular hydration promotes nutrient transport and hormone clearance.
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-2xl font-black text-[#0284C7] font-mono">
              {waterGlasses} / {targetGlasses}
            </span>
            <span className="text-xs text-slate-400 block font-sans">glasses</span>
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

export default OvaSenseAlternateTabsView;
