import { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from '@supabase/supabase-js';

// Load environment variables (in case dotenv hasn't been loaded yet)
import dotenv from 'dotenv';
import { resolve } from 'path';

// Load .env from project root
dotenv.config({ path: resolve(process.cwd(), '.env') });

// Supabase client for backend operations. Configuration comes only from the environment:
// a service-role key bypasses row-level security, a publishable key respects it.
const supabaseUrl = process.env.SUPABASE_URL ?? '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Set SUPABASE_URL and SUPABASE_SERVICE_KEY (or SUPABASE_SERVICE_ROLE_KEY) in .env (see .env.example)');
}

// Log which kind of key is in use, never any part of the key itself
const keyType = supabaseServiceKey.startsWith('sb_publishable_') ? 'publishable key (respects RLS)'
    : supabaseServiceKey.startsWith('sb_secret_') ? 'secret key'
    : supabaseServiceKey.startsWith('eyJ') ? 'legacy JWT key'
    : 'unrecognised key format';
console.log(`[Supabase Config] Using a ${keyType}`);

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
