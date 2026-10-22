import { createClient } from '@supabase/supabase-js';

const url = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const publishableKey = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '').trim();

export const isCloudConfigured = Boolean(url && publishableKey);
export const supabase = isCloudConfigured
  ? createClient(url, publishableKey, {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: true,
        persistSession: true,
      },
      global: {
        headers: { 'x-application-name': 'your-brain-is-lying' },
      },
    })
  : null;

export function getCloudSetupMessage() {
  return 'Cloud features need VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY plus the SQL setup in supabase/phase-c-d-schema.sql. Until configured, the app keeps using device-local profiles.';
}
