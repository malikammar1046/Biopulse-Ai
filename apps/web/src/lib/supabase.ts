import { createClient } from '@supabase/supabase-js';

const envObj = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : (typeof globalThis !== 'undefined' && (globalThis as any).process?.env ? (globalThis as any).process.env : {});
const supabaseUrl = (envObj as any).VITE_SUPABASE_URL || '';
const supabaseAnonKey = (envObj as any).VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = (): boolean => {
  return (
    Boolean(supabaseUrl) &&
    Boolean(supabaseAnonKey) &&
    supabaseUrl !== 'https://your-project-id.supabase.co' &&
    !supabaseAnonKey.includes('placeholder')
  );
};

// Fallback dummy values to prevent runtime crash during initialization if env vars are missing
const validUrl = isSupabaseConfigured() ? supabaseUrl : 'https://placeholder.supabase.co';
const validKey = isSupabaseConfigured() ? supabaseAnonKey : 'placeholder-anon-key';

export const supabase = createClient(validUrl, validKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
