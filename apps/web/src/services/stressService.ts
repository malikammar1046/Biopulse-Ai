import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type {
  StressSessionLog,
  StressSessionInput,
  StressActivityType,
  StressStats,
} from '../types/stress';

const STORAGE_STRESS_PREFIX = 'biopulse_stress_logs_';

class StressService {
  private getStorageKey(userId: string): string {
    return `${STORAGE_STRESS_PREFIX}${userId}`;
  }

  // --- Local Cache Helpers ---
  private getLocalLogs(userId: string): StressSessionLog[] {
    try {
      const raw = localStorage.getItem(this.getStorageKey(userId));
      if (raw) return JSON.parse(raw);
      return [];
    } catch {
      return [];
    }
  }

  private setLocalLogs(userId: string, logs: StressSessionLog[]): void {
    try {
      localStorage.setItem(this.getStorageKey(userId), JSON.stringify(logs));
    } catch {
      // ignore
    }
  }

  // --- Fetch Logs ---
  async fetchStressLogs(userId: string): Promise<{ logs: StressSessionLog[]; error?: string }> {
    const local = this.getLocalLogs(userId);

    if (!isSupabaseConfigured()) {
      return { logs: local };
    }

    try {
      const { data, error } = await supabase
        .from('lifestyle_recommendations')
        .select('*')
        .eq('user_id', userId)
        .eq('category', 'STRESS_LOG')
        .order('created_at', { ascending: false });

      if (error || !data || data.length === 0) {
        return { logs: local };
      }

      const remoteLogs: StressSessionLog[] = data.map((row) => ({
        id: row.id,
        userId: row.user_id,
        activityType: (row.metadata?.activity_type as StressActivityType) || 'deep_breathing',
        activityName: row.title || 'Stress Session',
        durationMinutes: Number(row.metadata?.duration_minutes) || 10,
        occurredAt: row.metadata?.occurred_at || (row.created_at ? row.created_at.split('T')[0] : new Date().toISOString().split('T')[0]),
        stressBefore: row.metadata?.stress_before ?? null,
        stressAfter: row.metadata?.stress_after ?? null,
        notes: row.description || '',
        createdAt: row.created_at || new Date().toISOString(),
      }));

      // Merge remote with local ensuring user isolation
      const byId = new Map<string, StressSessionLog>();
      for (const log of local) byId.set(log.id, log);
      for (const log of remoteLogs) byId.set(log.id, log);
      const merged = Array.from(byId.values()).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      this.setLocalLogs(userId, merged);
      return { logs: merged };
    } catch (err: any) {
      console.warn('StressService remote lookup notice:', err);
      return { logs: local };
    }
  }

  // --- Log Stress Session ---
  async logStressSession(
    userId: string,
    input: StressSessionInput
  ): Promise<{ success: boolean; entry?: StressSessionLog; error?: string }> {
    const today = input.occurredAt || new Date().toISOString().split('T')[0];
    const nowIso = new Date().toISOString();

    const newEntry: StressSessionLog = {
      id: `stress_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
      userId,
      activityType: input.activityType,
      activityName: input.activityName.trim() || 'Relaxation Session',
      durationMinutes: Math.max(1, Math.round(input.durationMinutes)),
      occurredAt: today,
      stressBefore: input.stressBefore !== undefined ? input.stressBefore : null,
      stressAfter: input.stressAfter !== undefined ? input.stressAfter : null,
      notes: input.notes?.trim() || '',
      createdAt: nowIso,
      isPendingSync: true,
      isCloudPersisted: false,
      syncStatus: 'pending',
    };

    let cloudPersisted = false;
    let cloudError: string | null = null;

    // 1. Remote persistence to authoritative Supabase datastore
    if (isSupabaseConfigured()) {
      try {
        const res = await supabase.from('lifestyle_recommendations').insert({
          id: newEntry.id,
          user_id: userId,
          category: 'STRESS_LOG',
          title: newEntry.activityName,
          description: newEntry.notes || 'Completed relaxation session',
          status: 'COMPLETED',
          priority: 'MEDIUM',
          source: 'USER_LOGGED',
          is_active: true,
          metadata: {
            activity_type: newEntry.activityType,
            duration_minutes: newEntry.durationMinutes,
            occurred_at: newEntry.occurredAt,
            stress_before: newEntry.stressBefore,
            stress_after: newEntry.stressAfter,
          },
          created_at: newEntry.createdAt,
          updated_at: newEntry.createdAt,
        });

        if (res.error) {
          cloudError = res.error.message || 'Supabase stress session write error';
          console.error('Supabase logStressSession response error:', res.error);
        } else {
          cloudPersisted = true;
        }
      } catch (err: any) {
        cloudError = err?.message || 'Exception during Supabase stress session write';
        console.error('Supabase logStressSession exception:', err);
      }
    } else {
      cloudError = 'Cloud database is not configured';
    }

    newEntry.isCloudPersisted = cloudPersisted;
    newEntry.isPendingSync = !cloudPersisted;
    newEntry.syncStatus = cloudPersisted ? 'synced' : 'pending';

    // 2. Local persistence (cached with pending sync status)
    const current = this.getLocalLogs(userId);
    this.setLocalLogs(userId, [newEntry, ...current]);

    // 3. Dispatch reactive event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('biopulse_stress_updated', { detail: { entry: newEntry } }));
    }

    if (!cloudPersisted) {
      return {
        success: false,
        entry: newEntry,
        error: cloudError || 'Failed to persist stress session to cloud storage',
      };
    }

    return { success: true, entry: newEntry };
  }

  // --- Delete Stress Session ---
  async deleteStressSession(
    userId: string,
    id: string
  ): Promise<{ success: boolean; error?: string }> {
    const current = this.getLocalLogs(userId);
    const filtered = current.filter((s) => s.id !== id);
    this.setLocalLogs(userId, filtered);

    if (isSupabaseConfigured()) {
      try {
        await supabase
          .from('lifestyle_recommendations')
          .delete()
          .eq('id', id)
          .eq('user_id', userId);
      } catch (err) {
        console.warn('Supabase deleteStressSession notice:', err);
      }
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('biopulse_stress_updated'));
    }

    return { success: true };
  }

  // --- Calculate Daily Stats ---
  getTodayStressStats(userId: string, dateIso?: string): StressStats {
    const today = dateIso || new Date().toISOString().split('T')[0];
    const logs = this.getLocalLogs(userId);
    const todayLogs = logs.filter((l) => l.occurredAt === today);

    const totalMinutes = todayLogs.reduce((sum, l) => sum + (l.durationMinutes || 0), 0);
    const ratedLogs = todayLogs.filter(
      (l) => l.stressBefore != null && l.stressAfter != null
    );
    const avgChange =
      ratedLogs.length > 0
        ? ratedLogs.reduce((sum, l) => sum + ((l.stressBefore ?? 0) - (l.stressAfter ?? 0)), 0) / ratedLogs.length
        : undefined;

    return {
      completedSessionsToday: todayLogs.length,
      totalRelaxationMinutesToday: totalMinutes,
      totalMinutesToday: totalMinutes,
      averageStressChange: avgChange,
      recentSessions: logs.slice(0, 10),
    };
  }
}

export const stressService = new StressService();
