import { createClient } from '@supabase/supabase-js';

// Public values only. The publishable (anon) key is meant to ship to the browser;
// Postgres row-level security decides what each signed-in user can read or write.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env (see .env.example)');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true, // This is important for email confirmation callbacks
    storage: window.localStorage, // Explicitly use localStorage
    storageKey: 'sb-auth-token' // Use Supabase's default storage key
  }
});
