import { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from '@supabase/supabase-js';

// Load environment variables (in case dotenv hasn't been loaded yet)
import dotenv from 'dotenv';
import { resolve } from 'path';

// Load .env from project root
dotenv.config({ path: resolve(process.cwd(), '.env') });

// Create Supabase client with service role key for backend operations
// This bypasses RLS policies for administrative operations
// Use environment variables if available, otherwise fall back to defaults
const supabaseUrl = process.env.SUPABASE_URL || 'https://gozlknklxhwvfksnrmvh.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_publishable_zOirVz6-02N3CtgyqVAYpQ_s0QuE3ND';

console.log('[Supabase Config] URL:', supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'NOT SET');
console.log('[Supabase Config] Service Key:', supabaseServiceKey ? supabaseServiceKey.substring(0, 20) + '...' : 'NOT SET');
console.log('[Supabase Config] Service Key type:', supabaseServiceKey?.startsWith('eyJ') ? 'JWT (Legacy Service Role)' : supabaseServiceKey?.startsWith('sb_') ? 'Publishable Key (New Format)' : 'Unknown');

export const supabase: SupabaseClient = createClient(
    supabaseUrl,
    supabaseServiceKey,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

// Create a client for user-scoped operations (respects RLS)
const createUserSupabaseClient = (userToken: string) => {
    return createClient(
        supabaseUrl,
        supabaseServiceKey,
        {
            global: {
                headers: {
                    Authorization: `Bearer ${userToken}`
                }
            }
        }
    );
};

export { createUserSupabaseClient };
