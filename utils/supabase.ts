import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gozlknklxhwvfksnrmvh.supabase.co';
const supabaseAnonKey = 'sb_publishable_zOirVz6-02N3CtgyqVAYpQ_s0QuE3ND';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true, // This is important for email confirmation callbacks
    storage: window.localStorage, // Explicitly use localStorage
    storageKey: 'sb-auth-token' // Use Supabase's default storage key
  }
});