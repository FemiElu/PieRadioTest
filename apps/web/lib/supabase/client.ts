import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@packages/types'

export function createClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

    if (!url || !key) {
        console.error('Supabase credentials missing. Check your Vercel environment variables.');
        // Return a dummy client or throw a more descriptive error
        return createBrowserClient<Database>('', '');
    }

    try {
        // Ensure the URL is valid to prevent fetch 'Invalid value' errors
        new URL(url);
    } catch (e) {
        console.error('Invalid NEXT_PUBLIC_SUPABASE_URL:', url);
        return createBrowserClient<Database>('', '');
    }

    return createBrowserClient<Database>(url, key);
}
