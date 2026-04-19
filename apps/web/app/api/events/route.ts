import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getPublicEvents } from '@/lib/events/queries';
import type { EventCategory } from '@/lib/events/types';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { searchParams } = request.nextUrl;

        const category = (searchParams.get('category') ?? 'all') as EventCategory | 'all';
        const search = searchParams.get('search');
        const sort = (searchParams.get('sort') ?? 'date_asc') as any;
        const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
        const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)));

        const { events, total } = await getPublicEvents(supabase, {
            category,
            search,
            sort,
            page,
            limit,
        });

        return NextResponse.json(
            {
                events,
                meta: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            },
            {
                headers: {
                    'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=600',
                },
            }
        );
    } catch (error) {
        console.error('[GET /api/events] Unexpected error:', error);
        return NextResponse.json(
            { error: 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}
