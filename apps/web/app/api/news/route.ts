/**
 * GET /api/news
 * Public endpoint returning paginated published news articles.
 *
 * Query Parameters:
 *   tier     - Filter by article tier (breaking, trending, update, etc.)
 *   category - Filter by category string
 *   page     - Page number (default: 1)
 *   limit    - Items per page (default: 20, max: 50)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getPublishedArticles } from '@/lib/news/queries';
import type { NewsArticle } from '@/lib/news/types';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = request.nextUrl;

        const tier = searchParams.get('tier') as NewsArticle['tier'] | null;
        const category = searchParams.get('category');
        const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
        const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)));

        const supabase = await createClient();
        const { articles, total } = await getPublishedArticles(supabase, {
            tier: tier || null,
            category: category || null,
            page,
            limit,
        });

        return NextResponse.json(
            {
                articles,
                meta: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            },
            {
                status: 200,
                headers: {
                    // Cache at CDN edge for 60 seconds, allow stale for 10 minutes
                    'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=600',
                },
            },
        );
    } catch (error) {
        console.error('[GET /api/news] Unexpected error:', error);
        return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
    }
}
