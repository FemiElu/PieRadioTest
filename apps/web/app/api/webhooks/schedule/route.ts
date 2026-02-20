import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

// Schema for input validation
const ScheduleItemSchema = z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    start_time: z.string().datetime(), // ISO 8601
    end_time: z.string().datetime(),
    presenter_email: z.string().email().optional().or(z.literal('')), // Optional matching by email
    image_url: z.string().url().optional().or(z.literal('')),
    is_live: z.boolean().optional(),
});

const IngestPayloadSchema = z.array(ScheduleItemSchema);

export async function POST(req: NextRequest) {
    // 1. Security Check (CRON_SECRET or API Key)
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();

        // 2. Validate Payload
        const parseResult = IngestPayloadSchema.safeParse(body);
        if (!parseResult.success) {
            return NextResponse.json({ error: parseResult.error }, { status: 400 });
        }
        const items = parseResult.data;

        // 3. Init Supabase Admin Client (Service Role)
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // 4. Process Items
        const results = { inserted: 0, errors: [] as string[] };

        // Clear future schedule if replacing? For now, we just upsert based on time?
        // Strategy: We assume the feed contains the *entire* schedule for the day/week.
        // For MVP: Let's just insert/upsert. 
        // Ideally, we'd clear the range being updated first to handle deletions.

        // Find min and max time in payload to scope the cleanup
        if (items.length > 0) {
            const sorted = [...items].sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
            const minTime = sorted[0].start_time;
            const maxTime = sorted[sorted.length - 1].end_time;

            // Cleanup existing schedules in this range to prevent duplicates/ghost shows
            await (supabase.from('schedules' as any) as any)
                .delete()
                .gte('start_time', minTime)
                .lte('end_time', maxTime);
        }

        for (const item of items) {
            // Try to find presenter by email if provided
            let presenter_id = null;
            if (item.presenter_email) {
                const { data: presenter } = await supabase
                    .from('profiles')
                    .select('id')
                    .eq('email', item.presenter_email)
                    .single();
                if (presenter) presenter_id = presenter.id;
            }

            const { error } = await (supabase.from('schedules' as any) as any).insert({
                title: item.title,
                description: item.description,
                start_time: item.start_time,
                end_time: item.end_time,
                presenter_id: presenter_id,
                image_url: item.image_url || null,
                is_live: item.is_live || false
            });

            if (error) {
                results.errors.push(`Failed to insert ${item.title}: ${error.message}`);
            } else {
                results.inserted++;
            }
        }

        return NextResponse.json({ success: true, results });

    } catch (error) {
        console.error('Schedule Ingest Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
