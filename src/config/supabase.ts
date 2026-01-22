import { createClient, SupabaseClient } from '@supabase/supabase-js';

if (!process.env.SUPABASE_URL) {
    throw new Error('Missing SUPABASE_URL environment variable');
}

if (!process.env.SUPABASE_SERVICE_KEY) {
    throw new Error('Missing SUPABASE_SERVICE_KEY environment variable');
}

// Create Supabase client with service role key for backend operations
// This bypasses RLS policies for administrative operations
export const supabase: SupabaseClient = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

// Create a client for user-scoped operations (respects RLS)
export const createUserSupabaseClient = (userToken: string): SupabaseClient => {
    return createClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_ANON_KEY!,
        {
            global: {
                headers: {
                    Authorization: `Bearer ${userToken}`
                }
            }
        }
    );
};
