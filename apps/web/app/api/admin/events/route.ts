import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAllEventsAdmin } from '@/lib/events/queries';
import { CreateEventSchema } from '@/lib/events/schema';
import type { EventStatus } from '@/lib/events/types';

export const runtime = 'nodejs';

/** Helper: verify caller is an admin. */
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

        const { searchParams } = request.nextUrl;
        const status = (searchParams.get('status') ?? 'all') as EventStatus | 'all';
        const search = searchParams.get('search');
        const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
        const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)));

        const { events, total } = await getAllEventsAdmin(supabase, {
            status,
            search,
            page,
            limit,
        });

        return NextResponse.json({
            events,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('[GET /api/admin/events] Unexpected error:', error);
        return NextResponse.json(
            { error: 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const authError = await requireAdmin(supabase);
        if (authError) return authError;

        let body: unknown;
        try {
            body = await request.json();
        } catch {
            return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
        }

        const parsed = CreateEventSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: 'Validation failed', issues: parsed.error.flatten() },
                { status: 422 },
            );
        }

        const { data: { user } } = await supabase.auth.getUser();

        const { data, error } = await supabase
            .from('events')
            .insert({
                ...parsed.data,
                created_by: user?.id,
            })
            .select('id')
            .single();

        if (error) {
            console.error('[POST /api/admin/events] DB insert error:', error.message);
            return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
        }

        return NextResponse.json(data, { status: 201 });
    } catch (error) {
        console.error('[POST /api/admin/events] Unexpected error:', error);
        return NextResponse.json(
            { error: 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}
