import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Debugging logs for Vercel deployment troubleshooting
console.log('--- SUPABASE ENV DEBUG ---');
console.log('VITE_SUPABASE_URL:', supabaseUrl ? 'Set (starts with ' + supabaseUrl.substring(0, 5) + '...)' : 'MISSING');
console.log('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Set (starts with ' + supabaseAnonKey.substring(0, 5) + '...)' : 'MISSING');
console.log('--------------------------');

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing Supabase environment variables. Please check your .env file.");
}

export const supabase = createClient(
    supabaseUrl || '',
    supabaseAnonKey || ''
);
