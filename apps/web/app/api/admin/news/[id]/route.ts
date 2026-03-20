/**
 * Admin News Article API (single article)
 *
 * GET    /api/admin/news/[id] — fetch one article (for edit form)
 * PATCH  /api/admin/news/[id] — update article fields
 * DELETE /api/admin/news/[id] — soft-delete (sets status = 'archived')
 *
 * All endpoints require admin role.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getArticleByIdAdmin } from '@/lib/news/queries';
import { UpdateArticleSchema } from '@/lib/news/schema';

export const runtime = 'nodejs';

/** Helper: verify caller is an admin. Returns an error Response or null if OK. */
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
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await params;
        const supabase = await createClient();
        const authError = await requireAdmin(supabase);
        if (authError) return authError;

        const article = await getArticleByIdAdmin(supabase, id);
        if (!article) {
            return NextResponse.json({ error: 'Article not found' }, { status: 404 });
        }

        return NextResponse.json({ article });
    } catch (error) {
        console.error('[GET /api/admin/news/[id]] Unexpected error:', error);
        return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await params;
        const supabase = await createClient();
        const authError = await requireAdmin(supabase);
        if (authError) return authError;

        let body: unknown;
        try {
            body = await request.json();
        } catch {
            return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
        }

        const parsed = UpdateArticleSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: 'Validation failed', issues: parsed.error.flatten() },
                { status: 422 },
            );
        }

        const input = parsed.data;
        const updatePayload: Record<string, unknown> = { ...input };

        // Auto-set published_at when transitioning to published for the first time
        if (input.status === 'published') {
            const { data: existing } = await supabase
                .from('news_articles')
                .select('status, published_at')
                .eq('id', id)
                .single();

            if (existing?.status !== 'published') {
                updatePayload.published_at = new Date().toISOString();
            }
        }

        // Validate slug uniqueness if slug is being changed
        if (input.slug) {
            const { count } = await supabase
                .from('news_articles')
                .select('id', { count: 'exact', head: true })
                .eq('slug', input.slug)
                .neq('id', id);

            if ((count ?? 0) > 0) {
                return NextResponse.json(
                    { error: 'A slug with this value already exists.' },
                    { status: 409 },
                );
            }
        }

        const { error } = await supabase
            .from('news_articles')
            .update(updatePayload)
            .eq('id', id);

        if (error) {
            console.error('[PATCH /api/admin/news/[id]] DB update error:', error.message);
            return NextResponse.json({ error: 'Failed to update article' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[PATCH /api/admin/news/[id]] Unexpected error:', error);
        return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
    }
}

export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await params;
        const supabase = await createClient();
        const authError = await requireAdmin(supabase);
        if (authError) return authError;

        // Soft-delete: set status to 'archived' rather than hard-delete
        const { error } = await supabase
            .from('news_articles')
            .update({ status: 'archived' })
            .eq('id', id);

        if (error) {
            console.error('[DELETE /api/admin/news/[id]] DB error:', error.message);
            return NextResponse.json({ error: 'Failed to archive article' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[DELETE /api/admin/news/[id]] Unexpected error:', error);
        return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
    }
}
