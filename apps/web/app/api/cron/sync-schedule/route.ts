import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import axios from 'axios';
import { parse } from 'csv-parse/sync';
import { addWeeks, format, startOfDay, addDays } from 'date-fns';
import { fromZonedTime } from 'date-fns-tz';
import { createHash } from 'crypto';

export const dynamic = 'force-dynamic'; // Ensure this route is never cached

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TIMEZONE = 'Europe/London';
const GOOGLE_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTlnWi9K6mC3dCzIhi5RcjOPjWbqFQUXfG8kWJpqR22gIXyiMRMBzPtxkeQt7m7etKC9hZ70RJATDrW/pub?output=csv';

export async function GET(request: Request) {
    try {
        console.log('[Cron Sync] Starting Google Sheets Schedule Sync...');

        // 1. Authorization check
        const authHeader = request.headers.get('authorization');
        const cronSecret = process.env.CRON_SECRET;

        const url = new URL(request.url);
        const secretParam = url.searchParams.get('secret');

        const isAuthorized =
            (cronSecret && authHeader === `Bearer ${cronSecret}`) ||
            (cronSecret && secretParam === cronSecret) ||
            process.env.NODE_ENV === 'development';

        if (!isAuthorized) {
            console.error('[Cron Sync] Unauthorized attempt to sync schedule');
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseServiceKey) {
            throw new Error('Missing Supabase environment variables');
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // 2. Fetch CSV
        const response = await axios.get(GOOGLE_SHEET_CSV_URL);
        const content = response.data;

        // 3. Content-Hash Check (CPU Optimization)
        const contentHash = createHash('sha256').update(content).digest('hex');
        
        // Fetch existing hash from sync_metadata
        const { data: existingMeta } = await supabase
            .from('sync_metadata')
            .select('value')
            .eq('key', 'schedule_csv_hash')
            .single();

        if (existingMeta?.value === contentHash) {
            console.log('[Cron Sync] Content hash matches previous sync. Skipping execution to save CPU.');
            return NextResponse.json({
                success: true,
                message: 'No changes detected in Google Sheet. Sync skipped.',
                hash: contentHash
            });
        }

        // 4. Parse CSV
        const records = parse(content, {
            skip_empty_lines: true,
        });

        // Find the "Time Range" header row
        let headerRowIndex = -1;
        for (let i = 0; i < records.length; i++) {
            if (records[i].includes('Time Range')) {
                headerRowIndex = i;
                break;
            }
        }

        if (headerRowIndex === -1) {
            throw new Error('Could not find "Time Range" header in CSV');
        }

        const headers = records[headerRowIndex];
        const dataRows = records.slice(headerRowIndex + 1);

        const colMap: Record<string, number> = {};
        headers.forEach((h: string, i: number) => {
            if (h) colMap[h.trim()] = i;
        });

        // 5. Fetch profiles for matching
        const { data: profiles, error: profileErr } = await supabase.from('profiles').select('id, full_name, username, presenter_alias');
        if (profileErr) throw new Error(`Profiles fetch failed: ${profileErr.message}`);

        const normaliseName = (name: string) =>
            name.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();

        const PRESENTER_MAPPING: Record<string, string> = {
            'MARION': 'Marion Taba-Goma',
            'KEMOY B': 'Kemoy Walker',
            'JASON': 'Jason Da Costa',
            'KANE': 'kane williams',
            'KANE WILLIAM': 'kane williams',
            'DJ WATTEH': 'Callum Watteh',
            'DJ MALIBU': 'DJ Malibu',
            'NANA': 'Nana Mwene',
            'APHRODITE': 'Aphrodite',
            'LADY YOLA': 'Lady Yola',
            'PELUMI JOY': 'Pelumi Joy',
            'QUAN': 'Quantel',
        };

        const profileLookup = (name: string): string | null => {
            if (!name) return null;
            const rawName = name.trim();
            const upperName = rawName.toUpperCase();
            
            const aliasMatch = profiles?.find(p => 
                p.presenter_alias?.toUpperCase().trim() === upperName ||
                (p.presenter_alias && normaliseName(p.presenter_alias) === normaliseName(rawName))
            );
            if (aliasMatch) return aliasMatch.id;

            const mappedName = PRESENTER_MAPPING[upperName];
            const lookupName = mappedName || rawName;
            const normalised = normaliseName(lookupName);
            
            const match = profiles?.find(p => {
                const byUsername = p.username ? normaliseName(p.username) : null;
                const byFullName = p.full_name ? normaliseName(p.full_name) : null;
                return byUsername === normalised || byFullName === normalised;
            });
            
            if (!match) {
                const partialMatch = profiles?.find(p => {
                    const fullName = (p.full_name || '').toLowerCase();
                    const username = (p.username || '').toLowerCase();
                    const n = normalised.toLowerCase();
                    return fullName.includes(n) || username.includes(n);
                });
                if (partialMatch) return partialMatch.id;
                return null;
            }
            return match.id;
        };

        const scheduleEntries: any[] = [];
        const lastSeenContent: Record<string, string> = {};

        // 6. Process Rows
        for (const row of dataRows) {
            const timeRange = row[colMap['Time Range']];
            if (!timeRange) continue;

            const times = timeRange.split(/[-–]/).map((s: string) => s.trim());
            if (times.length !== 2) continue;

            const parseTime = (timeStr: string) => {
                const match = timeStr.match(/(\d+)\s*(AM|PM)/i);
                if (!match) return null;
                let hour = parseInt(match[1]);
                const ampm = match[2].toUpperCase();
                if (ampm === 'PM' && hour !== 12) hour += 12;
                if (ampm === 'AM' && hour === 12) hour = 0;
                return hour;
            };

            const startHour = parseTime(times[0]);
            const endHour = parseTime(times[1]);
            if (startHour === null || endHour === null) continue;

            for (const dayName of DAYS_OF_WEEK) {
                let cellContent = row[colMap[dayName]]?.trim() || lastSeenContent[dayName];
                if (cellContent) lastSeenContent[dayName] = cellContent;
                if (!cellContent) continue;

                let title = cellContent.trim();
                let presenterName = '';
                const presenterMatch = cellContent.match(/(.+?)\s*(?:W\/|WITH)\s*(.+)/i);
                if (presenterMatch) {
                    title = presenterMatch[1].trim();
                    presenterName = presenterMatch[2].trim();
                }

                const presenterId = profileLookup(presenterName);
                const now = new Date();
                const startOfThisWeek = startOfDay(addDays(now, -now.getDay()));

                // Reduced to 2 weeks for CPU optimization
                for (let weekOffset = 0; weekOffset < 2; weekOffset++) {
                    const dayOffset = DAYS_OF_WEEK.indexOf(dayName);
                    const showDate = addDays(startOfThisWeek, dayOffset + (weekOffset * 7));
                    const yyyyMmDd = format(showDate, 'yyyy-MM-dd');
                    
                    const endShowDate = endHour <= startHour ? addDays(showDate, 1) : showDate;
                    const endYyyyMmDd = format(endShowDate, 'yyyy-MM-dd');
                    
                    const startUtc = fromZonedTime(`${yyyyMmDd} ${startHour.toString().padStart(2, '0')}:00:00`, TIMEZONE);
                    const endUtc = fromZonedTime(`${endYyyyMmDd} ${endHour.toString().padStart(2, '0')}:00:00`, TIMEZONE);

                    scheduleEntries.push({
                        title,
                        description: presenterName ? `Hosted by ${presenterName}` : '',
                        start_time: startUtc.toISOString(),
                        end_time: endUtc.toISOString(),
                        presenter_id: presenterId,
                        is_live: false,
                    });
                }
            }
        }

        // 7. Replace data in Supabase
        const startOfThisWeek = startOfDay(addDays(new Date(), -new Date().getDay()));
        const twoWeeksAhead = addWeeks(new Date(), 2);

        const { error: delError } = await supabase
            .from('schedules')
            .delete()
            .gte('start_time', startOfThisWeek.toISOString())
            .lte('start_time', twoWeeksAhead.toISOString());

        if (delError) throw new Error(`Delete failed: ${delError.message}`);

        const { error: insError } = await supabase.from('schedules').insert(scheduleEntries);
        if (insError) throw new Error(`Insert failed: ${insError.message}`);

        // 8. Update sync metadata (Save Hash)
        await supabase.from('sync_metadata').upsert({
            key: 'schedule_csv_hash',
            value: contentHash,
            updated_at: new Date().toISOString()
        });

        console.log('[Cron Sync] Completed Successfully!');

        return NextResponse.json({
            success: true,
            message: `Synched ${scheduleEntries.length} entries. Hash updated.`,
            hash: contentHash
        });

    } catch (err: any) {
        console.error('[Cron Sync] Failed:', err.message);
        return NextResponse.json(
            { success: false, error: err.message },
            { status: 500 }
        );
    }
}
