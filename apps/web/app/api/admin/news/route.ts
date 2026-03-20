/**
 * Admin News API
 *
 * GET  /api/admin/news  — paginated list of ALL articles (any status)
 * POST /api/admin/news  — create a new article
 *
 * Both endpoints require admin role (checked via Supabase RLS + explicit session check).
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAllArticlesAdmin } from '@/lib/news/queries';
import { CreateArticleSchema } from '@/lib/news/schema';
import type { NewsArticle } from '@/lib/news/types';

export const runtime = 'nodejs';

/** Helper: verify caller is an admin. Returns null if OK, or a 401/403 Response. */
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
        const status = (searchParams.get('status') ?? 'all') as NewsArticle['status'] | 'all';
        const tier = searchParams.get('tier') as NewsArticle['tier'] | null;
        const search = searchParams.get('search');
        const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
        const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)));

        const { articles, total } = await getAllArticlesAdmin(supabase, {
            status,
            tier: tier || null,
            search: search || null,
            page,
            limit,
        });

        return NextResponse.json({ articles, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } });
    } catch (error) {
        console.error('[GET /api/admin/news] Unexpected error:', error);
        return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
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

        const parsed = CreateArticleSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: 'Validation failed', issues: parsed.error.flatten() },
                { status: 422 },
            );
        }

        const input = parsed.data;

        // Set published_at timestamp when status is 'published'
        const published_at = input.status === 'published' ? new Date().toISOString() : null;

        // Check slug uniqueness
        const { count } = await supabase
            .from('news_articles')
            .select('id', { count: 'exact', head: true })
            .eq('slug', input.slug);

        if ((count ?? 0) > 0) {
            return NextResponse.json({ error: 'A slug with this value already exists. Please choose a unique slug.' }, { status: 409 });
        }

        const { data, error } = await supabase
            .from('news_articles')
            .insert({
                ...input,
                audio_moments: input.audio_moments ?? [],
                published_at,
            })
            .select('id, slug')
            .single();

        if (error) {
            console.error('[POST /api/admin/news] DB insert error:', error.message);
            return NextResponse.json({ error: 'Failed to create article' }, { status: 500 });
        }

        return NextResponse.json({ id: data.id, slug: data.slug }, { status: 201 });
    } catch (error) {
        console.error('[POST /api/admin/news] Unexpected error:', error);
        return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
    }
}
