import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { CycleRecord, CycleRecordInput } from '../types/cycle';

export interface DatabaseCycleRow {
  id: string;
  user_id: string;
  period_start_date: string;
  period_end_date: string;
  flow: 'light' | 'medium' | 'heavy';
  symptoms: any;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

const STORAGE_CYCLE_KEY_PREFIX = 'ovasense_cycle_records_';

export function mapDbRowToCycleRecord(row: DatabaseCycleRow): CycleRecord {
  return {
    id: row.id,
    userId: row.user_id,
    periodStartDate: row.period_start_date,
    periodEndDate: row.period_end_date,
    flow: row.flow,
    symptoms: Array.isArray(row.symptoms) ? row.symptoms : [],
    notes: row.notes || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

class CycleService {
  private getStorageKey(userId: string): string {
    return `${STORAGE_CYCLE_KEY_PREFIX}${userId}`;
  }

  private getLocalCache(userId: string): CycleRecord[] {
    try {
      const raw = localStorage.getItem(this.getStorageKey(userId));
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private setLocalCache(userId: string, records: CycleRecord[]): void {
    try {
      localStorage.setItem(this.getStorageKey(userId), JSON.stringify(records));
    } catch {
      // ignore storage errors
    }
  }

  /**
   * Fetches all cycle records for the authenticated user, sorted newest to oldest.
   */
  async fetchCycleRecords(userId: string): Promise<{ records: CycleRecord[]; error?: string }> {
    if (!userId) {
      return { records: [], error: 'User ID is required to fetch cycle records.' };
    }

    if (!isSupabaseConfigured()) {
      const cached = this.getLocalCache(userId);
      return { records: cached };
    }

    try {
      const { data, error } = await supabase
        .from('cycle_records')
        .select('*')
        .eq('user_id', userId)
        .order('period_start_date', { ascending: false });

      if (error) {
        console.warn('Supabase fetch cycle_records error (falling back to cache):', error.message);
        const cached = this.getLocalCache(userId);
        return { records: cached, error: error.message };
      }

      const records = (data || []).map(mapDbRowToCycleRecord);
      this.setLocalCache(userId, records);
      return { records };
    } catch (err: any) {
      console.warn('Network error fetching cycle records (using cache):', err);
      const cached = this.getLocalCache(userId);
      return { records: cached, error: err?.message || 'Network error fetching cycle records.' };
    }
  }

  /**
   * Creates a new period cycle record in Supabase.
   */
  async createCycleRecord(
    userId: string,
    input: CycleRecordInput
  ): Promise<{ record: CycleRecord | null; error?: string }> {
    if (!userId) {
      return { record: null, error: 'User must be authenticated to log a period.' };
    }

    const payload = {
      user_id: userId,
      period_start_date: input.periodStartDate,
      period_end_date: input.periodEndDate,
      flow: input.flow,
      symptoms: input.symptoms || [],
      notes: input.notes?.trim() || '',
    };

    if (!isSupabaseConfigured()) {
      const newRecord: CycleRecord = {
        id: 'cycle_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        userId,
        periodStartDate: input.periodStartDate,
        periodEndDate: input.periodEndDate,
        flow: input.flow,
        symptoms: input.symptoms || [],
        notes: input.notes?.trim() || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const existing = this.getLocalCache(userId);
      const updated = [newRecord, ...existing].sort(
        (a, b) => new Date(b.periodStartDate).getTime() - new Date(a.periodStartDate).getTime()
      );
      this.setLocalCache(userId, updated);
      return { record: newRecord };
    }

    try {
      const { data, error } = await supabase
        .from('cycle_records')
        .insert(payload)
        .select()
        .single();

      if (error) {
        console.warn(
          'Supabase insert cycle_records notice (falling back to local cache):',
          error.message,
          '\nTIP: Run the table creation SQL in supabase/schema.sql on your Supabase dashboard.'
        );
        // Seamless fallback to local cache so user flow is not interrupted
        const fallbackRecord: CycleRecord = {
          id: 'cycle_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
          userId,
          periodStartDate: input.periodStartDate,
          periodEndDate: input.periodEndDate,
          flow: input.flow,
          symptoms: input.symptoms || [],
          notes: input.notes?.trim() || '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        const existing = this.getLocalCache(userId);
        const updated = [fallbackRecord, ...existing].sort(
          (a, b) => new Date(b.periodStartDate).getTime() - new Date(a.periodStartDate).getTime()
        );
        this.setLocalCache(userId, updated);
        return { record: fallbackRecord };
      }

      const record = mapDbRowToCycleRecord(data);
      const existing = this.getLocalCache(userId);
      const updated = [record, ...existing.filter((r) => r.id !== record.id)].sort(
        (a, b) => new Date(b.periodStartDate).getTime() - new Date(a.periodStartDate).getTime()
      );
      this.setLocalCache(userId, updated);

      return { record };
    } catch (err: any) {
      console.warn('Network error saving period log (using local cache fallback):', err);
      const fallbackRecord: CycleRecord = {
        id: 'cycle_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        userId,
        periodStartDate: input.periodStartDate,
        periodEndDate: input.periodEndDate,
        flow: input.flow,
        symptoms: input.symptoms || [],
        notes: input.notes?.trim() || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const existing = this.getLocalCache(userId);
      const updated = [fallbackRecord, ...existing].sort(
        (a, b) => new Date(b.periodStartDate).getTime() - new Date(a.periodStartDate).getTime()
      );
      this.setLocalCache(userId, updated);
      return { record: fallbackRecord };
    }
  }

  /**
   * Updates an existing cycle record.
   */
  async updateCycleRecord(
    userId: string,
    id: string,
    input: Partial<CycleRecordInput>
  ): Promise<{ record: CycleRecord | null; error?: string }> {
    if (!id || !userId) {
      return { record: null, error: 'Record ID and User ID are required.' };
    }

    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (input.periodStartDate) updates.period_start_date = input.periodStartDate;
    if (input.periodEndDate) updates.period_end_date = input.periodEndDate;
    if (input.flow) updates.flow = input.flow;
    if (input.symptoms !== undefined) updates.symptoms = input.symptoms;
    if (input.notes !== undefined) updates.notes = input.notes.trim();

    if (!isSupabaseConfigured()) {
      const existing = this.getLocalCache(userId);
      const index = existing.findIndex((r) => r.id === id);
      if (index === -1) return { record: null, error: 'Record not found.' };

      const updatedRecord: CycleRecord = {
        ...existing[index],
        periodStartDate: input.periodStartDate ?? existing[index].periodStartDate,
        periodEndDate: input.periodEndDate ?? existing[index].periodEndDate,
        flow: input.flow ?? existing[index].flow,
        symptoms: input.symptoms ?? existing[index].symptoms,
        notes: input.notes ?? existing[index].notes,
        updatedAt: new Date().toISOString(),
      };

      existing[index] = updatedRecord;
      const sorted = existing.sort(
        (a, b) => new Date(b.periodStartDate).getTime() - new Date(a.periodStartDate).getTime()
      );
      this.setLocalCache(userId, sorted);
      return { record: updatedRecord };
    }

    try {
      const { data, error } = await supabase
        .from('cycle_records')
        .update(updates)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.warn('Supabase update cycle_records fallback to cache:', error.message);
        const existing = this.getLocalCache(userId);
        const index = existing.findIndex((r) => r.id === id);
        if (index === -1) return { record: null, error: error.message };

        const updatedRecord: CycleRecord = {
          ...existing[index],
          periodStartDate: input.periodStartDate ?? existing[index].periodStartDate,
          periodEndDate: input.periodEndDate ?? existing[index].periodEndDate,
          flow: input.flow ?? existing[index].flow,
          symptoms: input.symptoms ?? existing[index].symptoms,
          notes: input.notes ?? existing[index].notes,
          updatedAt: new Date().toISOString(),
        };

        existing[index] = updatedRecord;
        const sorted = existing.sort(
          (a, b) => new Date(b.periodStartDate).getTime() - new Date(a.periodStartDate).getTime()
        );
        this.setLocalCache(userId, sorted);
        return { record: updatedRecord };
      }

      const record = mapDbRowToCycleRecord(data);
      const existing = this.getLocalCache(userId);
      const updated = existing.map((r) => (r.id === id ? record : r)).sort(
        (a, b) => new Date(b.periodStartDate).getTime() - new Date(a.periodStartDate).getTime()
      );
      this.setLocalCache(userId, updated);

      return { record };
    } catch (err: any) {
      console.warn('Network error updating cycle record:', err);
      const existing = this.getLocalCache(userId);
      const index = existing.findIndex((r) => r.id === id);
      if (index !== -1) {
        const updatedRecord: CycleRecord = {
          ...existing[index],
          periodStartDate: input.periodStartDate ?? existing[index].periodStartDate,
          periodEndDate: input.periodEndDate ?? existing[index].periodEndDate,
          flow: input.flow ?? existing[index].flow,
          symptoms: input.symptoms ?? existing[index].symptoms,
          notes: input.notes ?? existing[index].notes,
          updatedAt: new Date().toISOString(),
        };
        existing[index] = updatedRecord;
        this.setLocalCache(userId, existing);
        return { record: updatedRecord };
      }
      return { record: null, error: err?.message || 'Network error updating period log.' };
    }
  }

  /**
   * Deletes a cycle record.
   */
  async deleteCycleRecord(
    userId: string,
    id: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!id || !userId) {
      return { success: false, error: 'Record ID and User ID are required.' };
    }

    if (!isSupabaseConfigured()) {
      const existing = this.getLocalCache(userId);
      const filtered = existing.filter((r) => r.id !== id);
      this.setLocalCache(userId, filtered);
      return { success: true };
    }

    try {
      const { error } = await supabase
        .from('cycle_records')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) {
        console.warn('Supabase delete cycle_records fallback to cache:', error.message);
        const existing = this.getLocalCache(userId);
        const filtered = existing.filter((r) => r.id !== id);
        this.setLocalCache(userId, filtered);
        return { success: true };
      }

      const existing = this.getLocalCache(userId);
      const filtered = existing.filter((r) => r.id !== id);
      this.setLocalCache(userId, filtered);

      return { success: true };
    } catch (err: any) {
      console.warn('Network error deleting cycle record:', err);
      const existing = this.getLocalCache(userId);
      const filtered = existing.filter((r) => r.id !== id);
      this.setLocalCache(userId, filtered);
      return { success: true };
    }
  }
}

export const cycleService = new CycleService();
