import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getEventById } from '@/lib/events/queries';
import { UpdateEventSchema } from '@/lib/events/schema';

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

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient();
        const authError = await requireAdmin(supabase);
        if (authError) return authError;

        const { id } = await params;
        const event = await getEventById(supabase, id);
        if (!event) {
            return NextResponse.json({ error: 'Event not found' }, { status: 404 });
        }

        return NextResponse.json(event);
    } catch (error) {
        console.error('[GET /api/admin/events/[id]] Unexpected error:', error);
        return NextResponse.json(
            { error: 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
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

        const parsed = UpdateEventSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: 'Validation failed', issues: parsed.error.flatten() },
                { status: 422 },
            );
        }

        const { id } = await params;
        const { data, error } = await supabase
            .from('events')
            .update(parsed.data)
            .eq('id', id)
            .select('id')
            .single();

        if (error) {
            console.error('[PATCH /api/admin/events/[id]] DB update error:', error.message);
            return NextResponse.json({ error: 'Failed to update event' }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('[PATCH /api/admin/events/[id]] Unexpected error:', error);
        return NextResponse.json(
            { error: 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient();
        const authError = await requireAdmin(supabase);
        if (authError) return authError;

        // MVP: Instead of hard delete, we set status to 'cancelled'
        const { id } = await params;
        const { error } = await supabase
            .from('events')
            .update({ status: 'cancelled' })
            .eq('id', id);

        if (error) {
            console.error('[DELETE /api/admin/events/[id]] DB update error:', error.message);
            return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[DELETE /api/admin/events/[id]] Unexpected error:', error);
        return NextResponse.json(
            { error: 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}
