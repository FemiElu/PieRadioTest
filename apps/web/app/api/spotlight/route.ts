import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function GET() {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('spotlights')
            .select('title, artist_name, image_url, link_url')
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error) {
            console.error('[GET /api/spotlight] DB error:', error.message);
            return NextResponse.json({ error: 'Failed to fetch spotlight' }, { status: 500 });
        }

        return NextResponse.json(data || null);
    } catch (error) {
        console.error('[GET /api/spotlight] Unexpected error:', error);
        return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
    }
}
