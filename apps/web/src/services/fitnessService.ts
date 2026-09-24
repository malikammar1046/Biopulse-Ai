import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { UserProfile } from '../types/onboarding';
import type {
  FitnessLogEntry,
  FitnessLogInput,
  ActivityType,
  SuggestedMovementRoutine,
  WeeklyFitnessStats,
  WeeklyFitnessDaySummary,
} from '../types/fitness';

const STORAGE_FITNESS_LOGS_PREFIX = 'ovasense_fitness_logs_';

class FitnessService {
  private getStorageKey(userId: string): string {
    return `${STORAGE_FITNESS_LOGS_PREFIX}${userId}`;
  }

  // --- Local Cache Helpers ---
  private getLocalLogs(userId: string): FitnessLogEntry[] {
    try {
      const raw = localStorage.getItem(this.getStorageKey(userId));
      if (raw) return JSON.parse(raw);
      return [];
    } catch {
      return [];
    }
  }

  private setLocalLogs(userId: string, logs: FitnessLogEntry[]): void {
    try {
      localStorage.setItem(this.getStorageKey(userId), JSON.stringify(logs));
    } catch {
      // ignore
    }
  }

  // --- CRUD Operations ---
  async fetchFitnessLogs(
    userId: string
  ): Promise<{ logs: FitnessLogEntry[]; error?: string }> {
    const local = this.getLocalLogs(userId);

    if (!isSupabaseConfigured()) {
      return { logs: local };
    }

    try {
      const { data, error } = await supabase
        .from('fitness_logs')
        .select('*')
        .eq('user_id', userId)
        .order('occurred_at', { ascending: false });

      if (error) {
        console.warn('Supabase fetchFitnessLogs warning (using local cache):', error.message);
        return { logs: local };
      }

      if (data && data.length > 0) {
        const mapped: FitnessLogEntry[] = data.map((row) => ({
          id: row.id,
          userId: row.user_id,
          activityType: row.activity_type as ActivityType,
          activityName: row.activity_name,
          durationMinutes: Number(row.duration_minutes) || 0,
          energyLevel: row.energy_level || undefined,
          notes: row.notes || '',
          occurredAt: row.occurred_at,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        }));
        this.setLocalLogs(userId, mapped);
        return { logs: mapped };
      }

      return { logs: local };
    } catch (err: any) {
      console.warn('Unexpected error in fetchFitnessLogs:', err);
      return { logs: local };
    }
  }

  async createFitnessLog(
    userId: string,
    input: FitnessLogInput
  ): Promise<{ success: boolean; entry?: FitnessLogEntry; error?: string }> {
    const today = input.occurredAt || new Date().toISOString().split('T')[0];
    const newEntry: FitnessLogEntry = {
      id: `fit_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
      userId,
      activityType: input.activityType,
      activityName: input.activityName.trim() || 'Movement Activity',
      durationMinutes: Math.max(1, Math.round(input.durationMinutes)),
      energyLevel: input.energyLevel,
      notes: input.notes?.trim() || '',
      occurredAt: today,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const current = this.getLocalLogs(userId);
    const updated = [newEntry, ...current];
    this.setLocalLogs(userId, updated);

    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.from('fitness_logs').insert({
          id: newEntry.id,
          user_id: userId,
          activity_type: newEntry.activityType,
          activity_name: newEntry.activityName,
          duration_minutes: newEntry.durationMinutes,
          energy_level: newEntry.energyLevel || null,
          notes: newEntry.notes,
          occurred_at: newEntry.occurredAt,
          created_at: newEntry.createdAt,
          updated_at: newEntry.updatedAt,
        });

        if (error) {
          console.warn('Supabase insert fitness_logs error:', error);
        }
      } catch (err) {
        console.warn('Supabase createFitnessLog error:', err);
      }
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('ovasense_fitness_updated'));
    }

    return { success: true, entry: newEntry };
  }

  async updateFitnessLog(
    userId: string,
    logId: string,
    input: Partial<FitnessLogInput>
  ): Promise<{ success: boolean; entry?: FitnessLogEntry; error?: string }> {
    const current = this.getLocalLogs(userId);
    const targetIdx = current.findIndex((l) => l.id === logId);

    if (targetIdx === -1) {
      return { success: false, error: 'Activity not found.' };
    }

    const updatedEntry: FitnessLogEntry = {
      ...current[targetIdx],
      ...(input.activityType && { activityType: input.activityType }),
      ...(input.activityName && { activityName: input.activityName.trim() }),
      ...(input.durationMinutes && { durationMinutes: Math.max(1, Math.round(input.durationMinutes)) }),
      ...(input.energyLevel !== undefined && { energyLevel: input.energyLevel }),
      ...(input.notes !== undefined && { notes: input.notes.trim() }),
      ...(input.occurredAt && { occurredAt: input.occurredAt }),
      updatedAt: new Date().toISOString(),
    };

    const updatedList = [...current];
    updatedList[targetIdx] = updatedEntry;
    this.setLocalLogs(userId, updatedList);

    if (isSupabaseConfigured()) {
      try {
        await supabase
          .from('fitness_logs')
          .update({
            activity_type: updatedEntry.activityType,
            activity_name: updatedEntry.activityName,
            duration_minutes: updatedEntry.durationMinutes,
            energy_level: updatedEntry.energyLevel || null,
            notes: updatedEntry.notes,
            occurred_at: updatedEntry.occurredAt,
            updated_at: updatedEntry.updatedAt,
          })
          .eq('id', logId)
          .eq('user_id', userId);
      } catch (err) {
        console.warn('Supabase updateFitnessLog error:', err);
      }
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('ovasense_fitness_updated'));
    }

    return { success: true, entry: updatedEntry };
  }

  async deleteFitnessLog(
    userId: string,
    logId: string
  ): Promise<{ success: boolean; error?: string }> {
    const current = this.getLocalLogs(userId);
    this.setLocalLogs(
      userId,
      current.filter((l) => l.id !== logId)
    );

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('fitness_logs').delete().eq('id', logId).eq('user_id', userId);
      } catch (err) {
        console.warn('Supabase delete fitness log error:', err);
      }
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('ovasense_fitness_updated'));
    }

    return { success: true };
  }

  // --- 7-Day Weekly Calculation Helper ---
  calculateWeeklyStats(
    logs: FitnessLogEntry[],
    weeklyTargetMinutes = 150
  ): WeeklyFitnessStats {
    const now = new Date();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayShorts = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dailySummaries: WeeklyFitnessDaySummary[] = [];

    const dailyTarget = Math.round(weeklyTargetMinutes / 7);

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000);
      const dateIso = d.toISOString().split('T')[0];
      const dayName = dayNames[d.getDay()];
      const dayShort = dayShorts[d.getDay()];

      const dayActivities = logs.filter((l) => l.occurredAt === dateIso);
      const totalMinutes = dayActivities.reduce((sum, a) => sum + a.durationMinutes, 0);

      dailySummaries.push({
        date: dateIso,
        dayName,
        dayShort,
        totalMinutes,
        activityCount: dayActivities.length,
        activities: dayActivities,
        targetMinutes: dailyTarget,
      });
    }

    const totalMinutesThisWeek = dailySummaries.reduce((sum, d) => sum + d.totalMinutes, 0);
    const activeDaysCount = dailySummaries.filter((d) => d.totalMinutes > 0).length;
    const totalActivitiesCount = dailySummaries.reduce((sum, d) => sum + d.activityCount, 0);
    const averageMinutesPerActiveDay =
      activeDaysCount > 0 ? Math.round(totalMinutesThisWeek / activeDaysCount) : 0;

    return {
      totalMinutesThisWeek,
      targetMinutesThisWeek: weeklyTargetMinutes,
      activeDaysCount,
      totalActivitiesCount,
      averageMinutesPerActiveDay,
      dailySummaries,
    };
  }

  // --- Dynamic Phase-Aligned Movement Suggestions ---
  generateSuggestedRoutines(
    _profile: UserProfile,
    currentPhaseName = 'Follicular Phase',
    todayLogs: FitnessLogEntry[] = []
  ): SuggestedMovementRoutine[] {
    const phaseLower = currentPhaseName.toLowerCase();
    const routines: SuggestedMovementRoutine[] = [];

    const completedNames = todayLogs.map((l) => l.activityName.toLowerCase());

    if (phaseLower.includes('menstrual') || phaseLower.includes('period')) {
      routines.push(
        {
          id: 'routine_m_1',
          title: 'Gentle Pelvic & Lower Back Release',
          category: 'stretching',
          durationMinutes: 15,
          intensity: 'Restorative',
          focus: 'Cramp Relief & Lower Back Ease',
          whyThisPhase:
            'During your period, progesterone and estrogen are at baseline. Low-stress gentle stretching eases abdominal pressure without draining energy.',
          steps: [
            '5 mins Child’s Pose (Balasana) with slow diaphragmatic breaths',
            '5 mins Cat-Cow spine waves to mobilize the lower back',
            '5 mins Reclined Bound Angle with pillow support under knees',
          ],
        },
        {
          id: 'routine_m_2',
          title: 'Mindful 20-Minute Fresh Air Walk',
          category: 'walking',
          durationMinutes: 20,
          intensity: 'Gentle',
          focus: 'Pelvic Circulation & Lymphatic Flow',
          whyThisPhase:
            'A gentle walk promotes oxygen flow to uterine muscles, helping naturally relieve mild period discomfort.',
          steps: [
            'Walk at a comfortable, conversational pace',
            'Keep shoulders relaxed and breathe deeply through your nose',
            'Hydrate with water or warm herbal tea after your walk',
          ],
        },
        {
          id: 'routine_m_3',
          title: 'Restorative Rest & Deep Breathing',
          category: 'rest_recovery',
          durationMinutes: 15,
          intensity: 'Restorative',
          focus: 'Nervous System Calm & Cortisol Reset',
          whyThisPhase:
            'Rest is an active recovery state that supports adrenal calm during the early days of your cycle.',
          steps: [
            'Lie comfortably with legs elevated on a couch or bed (Viparita Karani)',
            'Practice 4-second inhales and 6-second slow exhales',
            'Listen to calming ambient music or simply enjoy quiet stillness',
          ],
        }
      );
    } else if (phaseLower.includes('ovulat')) {
      routines.push(
        {
          id: 'routine_o_1',
          title: 'Energized Strength & Core Support',
          category: 'strength',
          durationMinutes: 25,
          intensity: 'Moderate',
          focus: 'Muscle Tone & Insulin Sensitivity',
          whyThisPhase:
            'Peak estrogen right before ovulation supports muscular strength, joint mobility, and optimal glucose uptake.',
          steps: [
            'Warm-up: 3 mins arm circles and torso rotations',
            '3 sets of 12 Bodyweight Squats & Glute Bridges',
            '3 sets of 10 Incline Push-ups or Wall Push-ups',
            '2 mins standing quad and hip flexor stretches',
          ],
        },
        {
          id: 'routine_o_2',
          title: 'Brisk 30-Minute Outdoor Cardio Walk',
          category: 'low_impact_cardio',
          durationMinutes: 30,
          intensity: 'Moderate',
          focus: 'Cardiovascular Vitality & Mood Lift',
          whyThisPhase:
            'Higher energy and dopamine during ovulation make brisk movement feel enjoyable and invigorating.',
          steps: [
            '5 mins easy warm-up pace',
            '20 mins steady brisk walking (swinging arms with purpose)',
            '5 mins gentle cool-down stroll and hydration',
          ],
        },
        {
          id: 'routine_o_3',
          title: 'Dynamic Hip & Spine Flow',
          category: 'yoga',
          durationMinutes: 20,
          intensity: 'Low-Impact',
          focus: 'Pelvic Alignment & Hip Mobility',
          whyThisPhase:
            'Supports pelvic floor balance during your peak cycle fertility window.',
          steps: [
            'Warrior II and Triangle Pose for lower body stamina',
            'Wide-legged forward fold for hamstring ease',
            'Low lunge hip openers on each side',
          ],
        }
      );
    } else if (phaseLower.includes('luteal')) {
      routines.push(
        {
          id: 'routine_l_1',
          title: 'Low-Impact Slow Strength & Stability',
          category: 'strength',
          durationMinutes: 20,
          intensity: 'Low-Impact',
          focus: 'Metabolic Support Without Cortisol Spikes',
          whyThisPhase:
            'In the luteal phase, rising progesterone increases core body temperature. Slow, steady strength training prevents fatigue.',
          steps: [
            '3 sets of 10 slow tempo Goblet or Bodyweight Squats',
            '3 sets of 10 Bird-Dog core holds (5 sec hold per rep)',
            '3 sets of 12 Standing Calf Raises and Glute Kickbacks',
            'Finish with gentle seated side-body stretches',
          ],
        },
        {
          id: 'routine_l_2',
          title: 'Evening Sunset Walk & Wind-Down',
          category: 'walking',
          durationMinutes: 25,
          intensity: 'Gentle',
          focus: 'Blood Sugar Smoothing & Better Sleep',
          whyThisPhase:
            'A post-dinner walk clears glucose after meals and helps balance evening progesterone for sound sleep.',
          steps: [
            'Head out 15–30 minutes after dinner',
            'Walk at a calm, soothing pace without rushing',
            'Enjoy the ambient evening calm and disconnect from screens',
          ],
        },
        {
          id: 'routine_l_3',
          title: 'Yin Yoga & Hip Unwinding',
          category: 'yoga',
          durationMinutes: 20,
          intensity: 'Restorative',
          focus: 'PMS Calm & Emotional Grounding',
          whyThisPhase:
            'Longer passive holds soothe the central nervous system when PMS irritability or mood changes arise.',
          steps: [
            '4 mins Butterfly Pose (Baddha Konasana)',
            '4 mins Sphinx Pose for gentle spine decompression',
            '4 mins Reclined Spinal Twist on each side',
          ],
        }
      );
    } else {
      // Follicular Phase (Default)
      routines.push(
        {
          id: 'routine_f_1',
          title: 'Follicular Home Strength & Posture',
          category: 'strength',
          durationMinutes: 25,
          intensity: 'Low-Impact',
          focus: 'Building Lean Muscle & Steady Metabolism',
          whyThisPhase:
            'As estrogen rises in your follicular phase, your body recovers faster and builds strength efficiently.',
          steps: [
            '3 sets of 12 Bodyweight Squats',
            '3 sets of 10 Glute Bridges with 2-second squeeze at the top',
            '3 sets of 10 Wall Push-ups & Plank holds (20 secs)',
            '3 mins shoulder and hamstring cool-down stretch',
          ],
        },
        {
          id: 'routine_f_2',
          title: 'Brisk Morning Walk & Sunlight Exposure',
          category: 'walking',
          durationMinutes: 30,
          intensity: 'Moderate',
          focus: 'Circadian Rhythm & Steady Glucose',
          whyThisPhase:
            'Natural morning light combined with walking sets your circadian rhythm, improving nighttime melatonin release.',
          steps: [
            'Walk within 1–2 hours of waking up',
            'Maintain a steady, purposeful pace',
            'Stay hydrated with a glass of water before heading out',
          ],
        },
        {
          id: 'routine_f_3',
          title: 'Energizing Hatha Yoga Flow',
          category: 'yoga',
          durationMinutes: 20,
          intensity: 'Low-Impact',
          focus: 'Total Body Mobility & Stress Relief',
          whyThisPhase:
            'A fluid yoga practice pairs rising follicular energy with mindful breathing.',
          steps: [
            '5 rounds of gentle Sun Salutations (Surya Namaskar)',
            'Standing Tree Pose for balance and focus',
            'Downward-Facing Dog and Cobra Pose for spine opening',
          ],
        }
      );
    }

    // Check completion status against today's logs
    return routines.map((r) => {
      const isCompleted = completedNames.some(
        (name) => name.includes(r.title.toLowerCase()) || name.includes(r.category)
      );
      return {
        ...r,
        isCompletedToday: isCompleted,
      };
    });
  }
}

export const fitnessService = new FitnessService();
