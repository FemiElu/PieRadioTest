import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@packages/types'

export function createClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

    if (!url || !key) {
        console.error('Supabase credentials missing. Check your Vercel environment variables.');
        return createBrowserClient<Database>(url ?? '', key ?? '');
    }

    try {
        // Ensure the URL is valid to prevent fetch 'Invalid value' errors
        new URL(url);
    } catch (e) {
        console.error('Invalid NEXT_PUBLIC_SUPABASE_URL:', url);
        return createBrowserClient<Database>(url ?? '', key ?? '');
    }

    return createBrowserClient<Database>(url, key);
}
