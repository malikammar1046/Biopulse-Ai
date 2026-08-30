import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { SymptomRecord, SymptomRecordInput, SymptomCategory, SymptomSeverity } from '../types/symptom';

export interface DatabaseSymptomRow {
  id: string;
  user_id: string;
  symptom_type: string;
  category: string;
  severity: 'mild' | 'moderate' | 'severe';
  occurred_at: string;
  cycle_day: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

const STORAGE_SYMPTOM_KEY_PREFIX = 'ovasense_symptom_records_';

export function mapDbRowToSymptomRecord(row: DatabaseSymptomRow): SymptomRecord {
  return {
    id: row.id,
    userId: row.user_id,
    symptomType: row.symptom_type,
    category: (row.category as SymptomCategory) || 'other',
    severity: (row.severity as SymptomSeverity) || 'moderate',
    occurredAt: row.occurred_at,
    cycleDay: row.cycle_day,
    notes: row.notes || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

class SymptomService {
  private getStorageKey(userId: string): string {
    return `${STORAGE_SYMPTOM_KEY_PREFIX}${userId}`;
  }

  private getLocalCache(userId: string): SymptomRecord[] {
    try {
      const raw = localStorage.getItem(this.getStorageKey(userId));
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private setLocalCache(userId: string, records: SymptomRecord[]): void {
    try {
      localStorage.setItem(this.getStorageKey(userId), JSON.stringify(records));
    } catch {
      // ignore storage write errors
    }
  }

  /**
   * Fetches all symptom records for the authenticated user.
   */
  async fetchSymptomRecords(userId: string): Promise<{ records: SymptomRecord[]; error?: string }> {
    if (!userId) {
      return { records: [], error: 'User ID is required to fetch symptom records.' };
    }

    if (!isSupabaseConfigured()) {
      const cached = this.getLocalCache(userId);
      return { records: cached };
    }

    try {
      const { data, error } = await supabase
        .from('symptom_records')
        .select('*')
        .eq('user_id', userId)
        .order('occurred_at', { ascending: false });

      if (error) {
        console.warn('Supabase fetch symptom_records notice (using local cache):', error.message);
        const cached = this.getLocalCache(userId);
        return { records: cached };
      }

      const records = (data || []).map(mapDbRowToSymptomRecord);
      this.setLocalCache(userId, records);
      return { records };
    } catch (err: any) {
      console.warn('Network error fetching symptom records (using local cache):', err);
      const cached = this.getLocalCache(userId);
      return { records: cached };
    }
  }

  /**
   * Creates a new symptom record.
   */
  async createSymptomRecord(
    userId: string,
    input: SymptomRecordInput
  ): Promise<{ record: SymptomRecord | null; error?: string }> {
    if (!userId) {
      return { record: null, error: 'User must be authenticated to log symptoms.' };
    }

    const payload = {
      user_id: userId,
      symptom_type: input.symptomType,
      category: input.category,
      severity: input.severity,
      occurred_at: input.occurredAt,
      cycle_day: input.cycleDay ?? null,
      notes: input.notes?.trim() || '',
    };

    if (!isSupabaseConfigured()) {
      const newRecord: SymptomRecord = {
        id: 'sym_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        userId,
        symptomType: input.symptomType,
        category: input.category,
        severity: input.severity,
        occurredAt: input.occurredAt,
        cycleDay: input.cycleDay ?? null,
        notes: input.notes?.trim() || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const existing = this.getLocalCache(userId);
      const updated = [newRecord, ...existing].sort(
        (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
      );
      this.setLocalCache(userId, updated);
      return { record: newRecord };
    }

    try {
      const { data, error } = await supabase
        .from('symptom_records')
        .insert(payload)
        .select()
        .single();

      if (error) {
        console.warn(
          'Supabase insert symptom_records notice (falling back to cache):',
          error.message
        );
        const fallbackRecord: SymptomRecord = {
          id: 'sym_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
          userId,
          symptomType: input.symptomType,
          category: input.category,
          severity: input.severity,
          occurredAt: input.occurredAt,
          cycleDay: input.cycleDay ?? null,
          notes: input.notes?.trim() || '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        const existing = this.getLocalCache(userId);
        const updated = [fallbackRecord, ...existing].sort(
          (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
        );
        this.setLocalCache(userId, updated);
        return { record: fallbackRecord };
      }

      const record = mapDbRowToSymptomRecord(data);
      const existing = this.getLocalCache(userId);
      const updated = [record, ...existing.filter((r) => r.id !== record.id)].sort(
        (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
      );
      this.setLocalCache(userId, updated);

      return { record };
    } catch (err: any) {
      console.warn('Network error saving symptom record (using local cache):', err);
      const fallbackRecord: SymptomRecord = {
        id: 'sym_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        userId,
        symptomType: input.symptomType,
        category: input.category,
        severity: input.severity,
        occurredAt: input.occurredAt,
        cycleDay: input.cycleDay ?? null,
        notes: input.notes?.trim() || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const existing = this.getLocalCache(userId);
      const updated = [fallbackRecord, ...existing].sort(
        (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
      );
      this.setLocalCache(userId, updated);
      return { record: fallbackRecord };
    }
  }

  /**
   * Updates an existing symptom record.
   */
  async updateSymptomRecord(
    userId: string,
    id: string,
    input: Partial<SymptomRecordInput>
  ): Promise<{ record: SymptomRecord | null; error?: string }> {
    if (!id || !userId) {
      return { record: null, error: 'Record ID and User ID are required.' };
    }

    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (input.symptomType) updates.symptom_type = input.symptomType;
    if (input.category) updates.category = input.category;
    if (input.severity) updates.severity = input.severity;
    if (input.occurredAt) updates.occurred_at = input.occurredAt;
    if (input.cycleDay !== undefined) updates.cycle_day = input.cycleDay;
    if (input.notes !== undefined) updates.notes = input.notes.trim();

    if (!isSupabaseConfigured()) {
      const existing = this.getLocalCache(userId);
      const index = existing.findIndex((r) => r.id === id);
      if (index === -1) return { record: null, error: 'Record not found.' };

      const updatedRecord: SymptomRecord = {
        ...existing[index],
        symptomType: input.symptomType ?? existing[index].symptomType,
        category: input.category ?? existing[index].category,
        severity: input.severity ?? existing[index].severity,
        occurredAt: input.occurredAt ?? existing[index].occurredAt,
        cycleDay: input.cycleDay !== undefined ? input.cycleDay : existing[index].cycleDay,
        notes: input.notes !== undefined ? input.notes : existing[index].notes,
        updatedAt: new Date().toISOString(),
      };

      existing[index] = updatedRecord;
      const sorted = existing.sort(
        (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
      );
      this.setLocalCache(userId, sorted);
      return { record: updatedRecord };
    }

    try {
      const { data, error } = await supabase
        .from('symptom_records')
        .update(updates)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.warn('Supabase update symptom_records fallback to cache:', error.message);
        const existing = this.getLocalCache(userId);
        const index = existing.findIndex((r) => r.id === id);
        if (index === -1) return { record: null, error: error.message };

        const updatedRecord: SymptomRecord = {
          ...existing[index],
          symptomType: input.symptomType ?? existing[index].symptomType,
          category: input.category ?? existing[index].category,
          severity: input.severity ?? existing[index].severity,
          occurredAt: input.occurredAt ?? existing[index].occurredAt,
          cycleDay: input.cycleDay !== undefined ? input.cycleDay : existing[index].cycleDay,
          notes: input.notes !== undefined ? input.notes : existing[index].notes,
          updatedAt: new Date().toISOString(),
        };

        existing[index] = updatedRecord;
        const sorted = existing.sort(
          (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
        );
        this.setLocalCache(userId, sorted);
        return { record: updatedRecord };
      }

      const record = mapDbRowToSymptomRecord(data);
      const existing = this.getLocalCache(userId);
      const updated = existing.map((r) => (r.id === id ? record : r)).sort(
        (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
      );
      this.setLocalCache(userId, updated);

      return { record };
    } catch (err: any) {
      console.warn('Network error updating symptom record:', err);
      const existing = this.getLocalCache(userId);
      const index = existing.findIndex((r) => r.id === id);
      if (index !== -1) {
        const updatedRecord: SymptomRecord = {
          ...existing[index],
          symptomType: input.symptomType ?? existing[index].symptomType,
          category: input.category ?? existing[index].category,
          severity: input.severity ?? existing[index].severity,
          occurredAt: input.occurredAt ?? existing[index].occurredAt,
          cycleDay: input.cycleDay !== undefined ? input.cycleDay : existing[index].cycleDay,
          notes: input.notes !== undefined ? input.notes : existing[index].notes,
          updatedAt: new Date().toISOString(),
        };
        existing[index] = updatedRecord;
        this.setLocalCache(userId, existing);
        return { record: updatedRecord };
      }
      return { record: null, error: err?.message || 'Network error updating symptom log.' };
    }
  }

  /**
   * Deletes a symptom record.
   */
  async deleteSymptomRecord(
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
        .from('symptom_records')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) {
        console.warn('Supabase delete symptom_records fallback to cache:', error.message);
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
      console.warn('Network error deleting symptom record:', err);
      const existing = this.getLocalCache(userId);
      const filtered = existing.filter((r) => r.id !== id);
      this.setLocalCache(userId, filtered);
      return { success: true };
    }
  }
}

export const symptomService = new SymptomService();
