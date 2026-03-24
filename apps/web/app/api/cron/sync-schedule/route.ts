import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import axios from 'axios';
import { parse } from 'csv-parse/sync';
import { addWeeks, format, startOfDay, addDays } from 'date-fns';
import { fromZonedTime } from 'date-fns-tz';

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

        // In a real Vercel environment, headers are used.
        // We also allow a query param ?secret=xx for manual triggering via browser if needed by admins
        const url = new URL(request.url);
        const secretParam = url.searchParams.get('secret');

        const isAuthorized =
            (cronSecret && authHeader === `Bearer ${cronSecret}`) ||
            (cronSecret && secretParam === cronSecret) ||
            process.env.NODE_ENV === 'development'; // Allow local dev testing

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

        // 3. Parse CSV
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

        // 4. Fetch all profiles for presenter matching
        // Fetch all profiles to link presenters by name/alias.
        // We include the new presenter_alias column which is the primary bridge to the Google Sheet.
        const { data: profiles, error: profileErr } = await supabase.from('profiles').select('id, full_name, username, presenter_alias');
        if (profileErr) throw new Error(`Profiles fetch failed: ${profileErr.message}`);

        // Normalise a name string for fuzzy matching: lowercase, strip non-alphanumeric
        // characters (except spaces), then collapse multiple spaces. This lets us match
        // "Joe Shamz" in the sheet to "joe shamz" in the DB, and handles cases like
        // trailing punctuation or unicode apostrophes.
        const normaliseName = (name: string) =>
            name.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();

        // Mapping of spreadsheet names (aliases) to DB profile names or usernames.
        // This handles cases like "MARION" in the sheet matching "Marion Taba-Goma" in the DB.
        const PRESENTER_MAPPING: Record<string, string> = {
            'MARION': 'Marion Taba-Goma',
            'KEMOY B': 'Kemoy Walker',
            'JASON': 'Jason Da Costa',
            'KANE': 'kane williams',
            'KANE WILLIAM': 'kane williams',
            'DJ WATTEH': 'Callum Watteh',
            'DJ MALIBU': 'DJ Malibu',
            'NANA': 'Nana Mwene',
            'APHRODITE': 'Aphrodite', // Placeholder if exists
            'LADY YOLA': 'Lady Yola', // Placeholder if exists
            'PELUMI JOY': 'Pelumi Joy', // Placeholder if exists
            'QUAN': 'Quantel', // Placeholder if exists
        };

        const profileLookup = (name: string): string | null => {
            if (!name) return null;
            
            const rawName = name.trim();
            const upperName = rawName.toUpperCase();
            
            // 1. Try exact match on the new presenter_alias column (Highest priority)
            const aliasMatch = profiles?.find(p => 
                p.presenter_alias?.toUpperCase().trim() === upperName ||
                (p.presenter_alias && normaliseName(p.presenter_alias) === normaliseName(rawName))
            );
            if (aliasMatch) return aliasMatch.id;

            // 2. Try hard coded mapping table (Transition support)
            const mappedName = PRESENTER_MAPPING[upperName];
            const lookupName = mappedName || rawName;
            
            const normalised = normaliseName(lookupName);
            const match = profiles?.find(p => {
                const byUsername = p.username ? normaliseName(p.username) : null;
                const byFullName = p.full_name ? normaliseName(p.full_name) : null;
                return byUsername === normalised || byFullName === normalised;
            });
            
            if (!match) {
                // 3. Try partial match as fallback
                const partialMatch = profiles?.find(p => {
                    const fullName = (p.full_name || '').toLowerCase();
                    const username = (p.username || '').toLowerCase();
                    const n = normalised.toLowerCase();
                    return fullName.includes(n) || username.includes(n);
                });
                
                if (partialMatch) return partialMatch.id;
                
                console.warn(`[Cron Sync] No DB presenter matched for name: "${name}"`);
                return null;
            }
            return match.id;
        };

        const scheduleEntries: any[] = [];
        const lastSeenContent: Record<string, string> = {};

        // 5. Process Rows
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
                let cellContent = row[colMap[dayName]]?.trim();

                // Carry forward logic for merged cells
                if (!cellContent) {
                    cellContent = lastSeenContent[dayName];
                } else {
                    lastSeenContent[dayName] = cellContent;
                }

                if (!cellContent) continue;

                let title = cellContent.trim();
                let presenterName = '';

                const presenterMatch = cellContent.match(/(.+?)\s*(?:W\/|WITH)\s*(.+)/i);
                if (presenterMatch) {
                    title = presenterMatch[1].trim();
                    presenterName = presenterMatch[2].trim();
                }

                const presenterId = profileLookup(presenterName);

                // Project for next 4 weeks
                const now = new Date();
                const startOfThisWeek = startOfDay(addDays(now, -now.getDay()));

                for (let weekOffset = 0; weekOffset < 4; weekOffset++) {
                    const dayOffset = DAYS_OF_WEEK.indexOf(dayName);
                    const showDate = addDays(startOfThisWeek, dayOffset + (weekOffset * 7));

                    const yyyyMmDd = format(showDate, 'yyyy-MM-dd');
                    const startLocalString = `${yyyyMmDd} ${startHour.toString().padStart(2, '0')}:00:00`;

                    const endShowDate = endHour <= startHour ? addDays(showDate, 1) : showDate;
                    const endYyyyMmDd = format(endShowDate, 'yyyy-MM-dd');
                    const endLocalString = `${endYyyyMmDd} ${endHour.toString().padStart(2, '0')}:00:00`;

                    const startUtc = fromZonedTime(startLocalString, TIMEZONE);
                    const endUtc = fromZonedTime(endLocalString, TIMEZONE);

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

        console.log(`[Cron Sync] Prepared ${scheduleEntries.length} entries for the next 4 weeks.`);

        // 6. Replace data in Supabase
        const startOfThisWeek = startOfDay(addDays(new Date(), -new Date().getDay()));
        const fourWeeksAhead = addWeeks(new Date(), 4);

        const { error: delError } = await supabase
            .from('schedules')
            .delete()
            .gte('start_time', startOfThisWeek.toISOString())
            .lte('start_time', fourWeeksAhead.toISOString());

        if (delError) throw new Error(`Delete failed: ${delError.message}`);

        const { error: insError } = await supabase.from('schedules').insert(scheduleEntries);
        if (insError) throw new Error(`Insert failed: ${insError.message}`);

        console.log('[Cron Sync] Completed Successfully!');

        return NextResponse.json({
            success: true,
            message: `Synched ${scheduleEntries.length} schedule entries.`
        });

    } catch (err: any) {
        console.error('[Cron Sync] Failed:', err.message);
        return NextResponse.json(
            { success: false, error: err.message },
            { status: 500 }
        );
    }
}
