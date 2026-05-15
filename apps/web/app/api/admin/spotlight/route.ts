import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

export const runtime = 'nodejs';

const SpotlightSchema = z.object({
    title: z.string().min(1),
    artist_name: z.string().min(1),
    image_url: z.string().url(),
    link_url: z.union([
        z.literal(""), 
        z.string().url(),
        z.string().startsWith("/")
    ]).optional().nullable(),
    is_active: z.boolean().default(true),
});

async function requireAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden: admin access required' }, { status: 403 });
    }
    return null;
}

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const authError = await requireAdmin(supabase);
        if (authError) return authError;

        const { data, error } = await supabase
            .from('spotlights')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error) {
            console.error('[GET /api/admin/spotlight] DB error:', error.message);
            return NextResponse.json({ error: 'Failed to fetch spotlight' }, { status: 500 });
        }

        return NextResponse.json(data || {});
    } catch (error) {
        console.error('[GET /api/admin/spotlight] Unexpected error:', error);
        return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const authError = await requireAdmin(supabase);
        if (authError) return authError;

        const body = await request.json();
        const parsed = SpotlightSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json({ error: 'Validation failed', issues: parsed.error.flatten() }, { status: 422 });
        }

        const { data, error } = await supabase
            .from('spotlights')
            .insert(parsed.data)
            .select()
            .single();

        if (error) {
            console.error('[POST /api/admin/spotlight] DB insert error:', error.message);
            return NextResponse.json({ error: 'Failed to update spotlight' }, { status: 500 });
        }

        return NextResponse.json(data, { status: 201 });
    } catch (error) {
        console.error('[POST /api/admin/spotlight] Unexpected error:', error);
        return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
    }
}
