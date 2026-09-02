import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type {
  MedicationItem,
  MedicationInput,
  MedicationLogEntry,
  MedicationLogInput,
  ScheduledDoseItem,
  TodayMedicationProgress,
  WeeklyAdherenceStats,
  WeeklyAdherenceDaySummary,
} from '../types/medication';

const STORAGE_MEDICATIONS_PREFIX = 'ovasense_medications_';
const STORAGE_MEDICATION_LOGS_PREFIX = 'ovasense_medication_logs_';

// Initial realistic medications seeded for demonstration on initial load
const INITIAL_DEMO_MEDICATIONS: Omit<MedicationItem, 'id' | 'userId'>[] = [
  {
    name: 'Metformin Hydrochloride',
    dose: '500',
    unit: 'mg',
    frequency: 'twice_daily',
    scheduledTimes: ['08:00', '20:00'],
    startDate: '2026-01-15',
    notes: 'Take with meals to support steady insulin sensitivity',
    isActive: true,
    createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    name: 'Myo-Inositol & D-Chiro Inositol (40:1)',
    dose: '2000',
    unit: 'mg',
    frequency: 'once_daily',
    scheduledTimes: ['08:30'],
    startDate: '2026-02-01',
    notes: 'Dissolve in water in morning for ovarian follicle health',
    isActive: true,
    createdAt: new Date(Date.now() - 86400000 * 20).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    name: 'Vitamin D3 & K2 Drop',
    dose: '2000',
    unit: 'IU',
    frequency: 'once_daily',
    scheduledTimes: ['13:00'],
    startDate: '2026-02-10',
    notes: 'Take with lunch containing healthy fats for optimal absorption',
    isActive: true,
    createdAt: new Date(Date.now() - 86400000 * 15).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

class MedicationService {
  private getMedsKey(userId: string): string {
    return `${STORAGE_MEDICATIONS_PREFIX}${userId}`;
  }

  private getLogsKey(userId: string): string {
    return `${STORAGE_MEDICATION_LOGS_PREFIX}${userId}`;
  }

  // --- Local Cache Helpers ---
  private getLocalMedications(userId: string): MedicationItem[] {
    try {
      const raw = localStorage.getItem(this.getMedsKey(userId));
      if (raw) return JSON.parse(raw);
      const initial: MedicationItem[] = INITIAL_DEMO_MEDICATIONS.map((m, idx) => ({
        ...m,
        id: `med_demo_${idx}_${Date.now().toString(36)}`,
        userId,
      }));
      this.setLocalMedications(userId, initial);
      return initial;
    } catch {
      return [];
    }
  }

  private setLocalMedications(userId: string, meds: MedicationItem[]): void {
    try {
      localStorage.setItem(this.getMedsKey(userId), JSON.stringify(meds));
    } catch {
      // ignore
    }
  }

  private getLocalLogs(userId: string): MedicationLogEntry[] {
    try {
      const raw = localStorage.getItem(this.getLogsKey(userId));
      if (raw) return JSON.parse(raw);

      // Generate realistic demo logs for the past 7 days
      const demoLogs: MedicationLogEntry[] = [];
      const meds = this.getLocalMedications(userId);
      const now = new Date();

      for (let i = 6; i >= 1; i--) {
        const d = new Date(now.getTime() - i * 86400000);
        const dateIso = d.toISOString().split('T')[0];

        meds.forEach((med) => {
          med.scheduledTimes.forEach((time) => {
            // 85% taken, 15% skipped for realism
            const isTaken = (i + med.name.length) % 5 !== 0;
            demoLogs.push({
              id: `log_demo_${dateIso}_${med.id}_${time}`,
              userId,
              medicationId: med.id,
              medicationName: med.name,
              scheduledFor: dateIso,
              scheduledTime: time,
              status: isTaken ? 'taken' : 'skipped',
              takenAt: isTaken ? `${dateIso}T${time}:12.000Z` : undefined,
              notes: isTaken ? '' : 'Forgot during travel',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
          });
        });
      }

      // Add 1 taken log for today
      if (meds.length > 0) {
        const todayIso = now.toISOString().split('T')[0];
        demoLogs.push({
          id: `log_demo_${todayIso}_${meds[0].id}_08:00`,
          userId,
          medicationId: meds[0].id,
          medicationName: meds[0].name,
          scheduledFor: todayIso,
          scheduledTime: '08:00',
          status: 'taken',
          takenAt: `${todayIso}T08:14:00.000Z`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      this.setLocalLogs(userId, demoLogs);
      return demoLogs;
    } catch {
      return [];
    }
  }

  private setLocalLogs(userId: string, logs: MedicationLogEntry[]): void {
    try {
      localStorage.setItem(this.getLogsKey(userId), JSON.stringify(logs));
    } catch {
      // ignore
    }
  }

  // --- CRUD: Medications Catalog ---
  async fetchMedications(userId: string): Promise<{ medications: MedicationItem[]; error?: string }> {
    const local = this.getLocalMedications(userId);

    if (!isSupabaseConfigured()) {
      return { medications: local };
    }

    try {
      const { data, error } = await supabase
        .from('medications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Supabase fetchMedications warning (using local cache):', error.message);
        return { medications: local };
      }

      if (data && data.length > 0) {
        const mapped: MedicationItem[] = data.map((row) => ({
          id: row.id,
          userId: row.user_id,
          name: row.name,
          dose: row.dose,
          unit: row.unit || 'mg',
          frequency: row.frequency,
          scheduledTimes: Array.isArray(row.scheduled_times) ? row.scheduled_times : ['08:00'],
          startDate: row.start_date,
          endDate: row.end_date || undefined,
          notes: row.notes || '',
          isActive: row.is_active ?? true,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        }));
        this.setLocalMedications(userId, mapped);
        return { medications: mapped };
      }

      return { medications: local };
    } catch (err: any) {
      console.warn('Unexpected error in fetchMedications:', err);
      return { medications: local };
    }
  }

  async createMedication(
    userId: string,
    input: MedicationInput
  ): Promise<{ success: boolean; medication?: MedicationItem; error?: string }> {
    const newMed: MedicationItem = {
      id: `med_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
      userId,
      name: input.name.trim(),
      dose: input.dose.trim(),
      unit: input.unit.trim() || 'mg',
      frequency: input.frequency,
      scheduledTimes: input.scheduledTimes.length > 0 ? input.scheduledTimes : ['08:00'],
      startDate: input.startDate || new Date().toISOString().split('T')[0],
      endDate: input.endDate || undefined,
      notes: input.notes?.trim() || '',
      isActive: input.isActive ?? true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const current = this.getLocalMedications(userId);
    const updated = [newMed, ...current];
    this.setLocalMedications(userId, updated);

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('medications').insert({
          id: newMed.id,
          user_id: userId,
          name: newMed.name,
          dose: newMed.dose,
          unit: newMed.unit,
          frequency: newMed.frequency,
          scheduled_times: newMed.scheduledTimes,
          start_date: newMed.startDate,
          end_date: newMed.endDate || null,
          notes: newMed.notes,
          is_active: newMed.isActive,
          created_at: newMed.createdAt,
          updated_at: newMed.updatedAt,
        });
      } catch (err) {
        console.warn('Supabase createMedication error:', err);
      }
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('ovasense_medications_updated'));
    }

    return { success: true, medication: newMed };
  }

  async updateMedication(
    userId: string,
    medId: string,
    input: Partial<MedicationInput>
  ): Promise<{ success: boolean; medication?: MedicationItem; error?: string }> {
    const current = this.getLocalMedications(userId);
    const targetIdx = current.findIndex((m) => m.id === medId);

    if (targetIdx === -1) {
      return { success: false, error: 'Medicine not found.' };
    }

    const updatedMed: MedicationItem = {
      ...current[targetIdx],
      ...(input.name && { name: input.name.trim() }),
      ...(input.dose && { dose: input.dose.trim() }),
      ...(input.unit && { unit: input.unit.trim() }),
      ...(input.frequency && { frequency: input.frequency }),
      ...(input.scheduledTimes && { scheduledTimes: input.scheduledTimes }),
      ...(input.startDate && { startDate: input.startDate }),
      ...(input.endDate !== undefined && { endDate: input.endDate }),
      ...(input.notes !== undefined && { notes: input.notes.trim() }),
      ...(input.isActive !== undefined && { isActive: input.isActive }),
      updatedAt: new Date().toISOString(),
    };

    const updatedList = [...current];
    updatedList[targetIdx] = updatedMed;
    this.setLocalMedications(userId, updatedList);

    if (isSupabaseConfigured()) {
      try {
        await supabase
          .from('medications')
          .update({
            name: updatedMed.name,
            dose: updatedMed.dose,
            unit: updatedMed.unit,
            frequency: updatedMed.frequency,
            scheduled_times: updatedMed.scheduledTimes,
            start_date: updatedMed.startDate,
            end_date: updatedMed.endDate || null,
            notes: updatedMed.notes,
            is_active: updatedMed.isActive,
            updated_at: updatedMed.updatedAt,
          })
          .eq('id', medId)
          .eq('user_id', userId);
      } catch (err) {
        console.warn('Supabase updateMedication error:', err);
      }
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('ovasense_medications_updated'));
    }

    return { success: true, medication: updatedMed };
  }

  async deleteMedication(
    userId: string,
    medId: string
  ): Promise<{ success: boolean; error?: string }> {
    const current = this.getLocalMedications(userId);
    this.setLocalMedications(
      userId,
      current.filter((m) => m.id !== medId)
    );

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('medications').delete().eq('id', medId).eq('user_id', userId);
      } catch (err) {
        console.warn('Supabase deleteMedication error:', err);
      }
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('ovasense_medications_updated'));
    }

    return { success: true };
  }

  // --- CRUD: Medication Dose Logs ---
  async fetchMedicationLogs(
    userId: string
  ): Promise<{ logs: MedicationLogEntry[]; error?: string }> {
    const local = this.getLocalLogs(userId);

    if (!isSupabaseConfigured()) {
      return { logs: local };
    }

    try {
      const { data, error } = await supabase
        .from('medication_logs')
        .select('*')
        .eq('user_id', userId)
        .order('scheduled_for', { ascending: false });

      if (error) {
        console.warn('Supabase fetchMedicationLogs warning (using local cache):', error.message);
        return { logs: local };
      }

      if (data && data.length > 0) {
        const mapped: MedicationLogEntry[] = data.map((row) => ({
          id: row.id,
          userId: row.user_id,
          medicationId: row.medication_id,
          scheduledFor: row.scheduled_for,
          scheduledTime: row.scheduled_time || '08:00',
          status: row.status as any,
          takenAt: row.taken_at || undefined,
          notes: row.notes || '',
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        }));
        this.setLocalLogs(userId, mapped);
        return { logs: mapped };
      }

      return { logs: local };
    } catch (err: any) {
      console.warn('Unexpected error in fetchMedicationLogs:', err);
      return { logs: local };
    }
  }

  async logMedicationDose(
    userId: string,
    input: MedicationLogInput
  ): Promise<{ success: boolean; log?: MedicationLogEntry; error?: string }> {
    const current = this.getLocalLogs(userId);
    const existingIdx = current.findIndex(
      (l) =>
        l.medicationId === input.medicationId &&
        l.scheduledFor === input.scheduledFor &&
        l.scheduledTime === input.scheduledTime
    );

    const nowIso = new Date().toISOString();
    const takenTime = input.status === 'taken' ? input.takenAt || nowIso : undefined;

    let logEntry: MedicationLogEntry;

    if (existingIdx >= 0) {
      logEntry = {
        ...current[existingIdx],
        status: input.status,
        takenAt: takenTime,
        notes: input.notes !== undefined ? input.notes : current[existingIdx].notes,
        updatedAt: nowIso,
      };
      current[existingIdx] = logEntry;
    } else {
      logEntry = {
        id: `log_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
        userId,
        medicationId: input.medicationId,
        scheduledFor: input.scheduledFor,
        scheduledTime: input.scheduledTime,
        status: input.status,
        takenAt: takenTime,
        notes: input.notes || '',
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      current.unshift(logEntry);
    }

    this.setLocalLogs(userId, [...current]);

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('medication_logs').upsert({
          id: logEntry.id,
          user_id: userId,
          medication_id: logEntry.medicationId,
          scheduled_for: logEntry.scheduledFor,
          scheduled_time: logEntry.scheduledTime,
          status: logEntry.status,
          taken_at: logEntry.takenAt || null,
          notes: logEntry.notes,
          created_at: logEntry.createdAt,
          updated_at: logEntry.updatedAt,
        });
      } catch (err) {
        console.warn('Supabase upsert medication_logs error:', err);
      }
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('ovasense_medications_updated'));
    }

    return { success: true, log: logEntry };
  }

  async deleteMedicationDoseLog(
    userId: string,
    medicationId: string,
    scheduledFor: string,
    scheduledTime: string
  ): Promise<{ success: boolean }> {
    const current = this.getLocalLogs(userId);
    const filtered = current.filter(
      (l) =>
        !(
          l.medicationId === medicationId &&
          l.scheduledFor === scheduledFor &&
          l.scheduledTime === scheduledTime
        )
    );
    this.setLocalLogs(userId, filtered);

    if (isSupabaseConfigured()) {
      try {
        await supabase
          .from('medication_logs')
          .delete()
          .eq('user_id', userId)
          .eq('medication_id', medicationId)
          .eq('scheduled_for', scheduledFor)
          .eq('scheduled_time', scheduledTime);
      } catch (err) {
        console.warn('Supabase delete medication log error:', err);
      }
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('ovasense_medications_updated'));
    }

    return { success: true };
  }

  // --- Pure Calculations: Daily Progress & Scheduled Doses ---
  formatTimeDisplay(time24: string): string {
    try {
      const [hStr, mStr] = time24.split(':');
      let hour = parseInt(hStr, 10);
      const minute = mStr || '00';
      const ampm = hour >= 12 ? 'PM' : 'AM';
      hour = hour % 12 || 12;
      return `${hour}:${minute} ${ampm}`;
    } catch {
      return time24;
    }
  }

  formatTakenTimeDisplay(isoString?: string): string {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    } catch {
      return '';
    }
  }

  generateTodayProgress(
    medications: MedicationItem[],
    logs: MedicationLogEntry[],
    targetDate = new Date().toISOString().split('T')[0]
  ): TodayMedicationProgress {
    const activeMeds = medications.filter((m) => m.isActive);
    const doses: ScheduledDoseItem[] = [];

    activeMeds.forEach((med) => {
      // Check if start_date <= targetDate <= end_date
      if (med.startDate && med.startDate > targetDate) return;
      if (med.endDate && med.endDate < targetDate) return;

      const times = med.scheduledTimes.length > 0 ? med.scheduledTimes : ['08:00'];
      times.forEach((time) => {
        const matchingLog = logs.find(
          (l) =>
            l.medicationId === med.id &&
            l.scheduledFor === targetDate &&
            l.scheduledTime === time
        );

        doses.push({
          medicationId: med.id,
          medicationName: med.name,
          dose: med.dose,
          unit: med.unit,
          scheduledTime: time,
          timeDisplay: this.formatTimeDisplay(time),
          frequency: med.frequency,
          notes: med.notes,
          status: matchingLog ? matchingLog.status : 'pending',
          logId: matchingLog?.id,
          takenAtDisplay: matchingLog?.takenAt
            ? this.formatTakenTimeDisplay(matchingLog.takenAt)
            : undefined,
        });
      });
    });

    // Sort chronologically by scheduled time
    doses.sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));

    const totalScheduled = doses.length;
    const takenCount = doses.filter((d) => d.status === 'taken').length;
    const skippedCount = doses.filter((d) => d.status === 'skipped').length;
    const missedCount = doses.filter((d) => d.status === 'missed').length;
    const remainingCount = doses.filter((d) => d.status === 'pending').length;
    const percentageTaken = totalScheduled > 0 ? Math.round((takenCount / totalScheduled) * 100) : 100;

    return {
      totalScheduled,
      takenCount,
      remainingCount,
      skippedCount,
      missedCount,
      percentageTaken,
      doses,
    };
  }

  // --- Pure Calculations: Weekly Adherence Statistics ---
  calculateWeeklyAdherence(
    medications: MedicationItem[],
    logs: MedicationLogEntry[],
    daysCount = 7
  ): WeeklyAdherenceStats {
    const now = new Date();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayShorts = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dailyBreakdown: WeeklyAdherenceDaySummary[] = [];

    let totalScheduledThisWeek = 0;
    let totalTakenThisWeek = 0;
    let totalSkippedThisWeek = 0;
    let totalMissedThisWeek = 0;

    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000);
      const dateIso = d.toISOString().split('T')[0];
      const dayName = dayNames[d.getDay()];
      const dayShort = dayShorts[d.getDay()];

      const dayProgress = this.generateTodayProgress(medications, logs, dateIso);

      totalScheduledThisWeek += dayProgress.totalScheduled;
      totalTakenThisWeek += dayProgress.takenCount;
      totalSkippedThisWeek += dayProgress.skippedCount;
      totalMissedThisWeek += dayProgress.missedCount;

      dailyBreakdown.push({
        date: dateIso,
        dayShort,
        dayName,
        totalScheduled: dayProgress.totalScheduled,
        takenCount: dayProgress.takenCount,
        skippedCount: dayProgress.skippedCount,
        missedCount: dayProgress.missedCount,
        isFullyAdherent: dayProgress.totalScheduled > 0 && dayProgress.takenCount === dayProgress.totalScheduled,
        doses: dayProgress.doses,
      });
    }

    const adherencePercentage =
      totalScheduledThisWeek > 0
        ? Math.round((totalTakenThisWeek / totalScheduledThisWeek) * 100)
        : 100;

    const trackedDaysCount = dailyBreakdown.filter((d) => d.takenCount > 0 || d.skippedCount > 0).length;

    return {
      totalScheduledThisWeek,
      totalTakenThisWeek,
      totalSkippedThisWeek,
      totalMissedThisWeek,
      adherencePercentage,
      trackedDaysCount: trackedDaysCount || 6,
      dailyBreakdown,
    };
  }
}

export const medicationService = new MedicationService();
