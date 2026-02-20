import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import { parse } from 'csv-parse/sync';
import { addWeeks, format, parse as dateParse, startOfDay, addDays, setHours, setMinutes, isAfter } from 'date-fns';
import { fromZonedTime, toZonedTime } from 'date-fns-tz';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load env vars
dotenv.config({ path: resolve(__dirname, '../.env.local') });
dotenv.config({ path: resolve(__dirname, '../.env') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GOOGLE_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTlnWi9K6mC3dCzIhi5RcjOPjWbqFQUXfG8kWJpqR22gIXyiMRMBzPtxkeQt7m7etKC9hZ70RJATDrW/pub?output=csv';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TIMEZONE = 'Europe/London'; // Adjust to station's timezone

async function sync() {
    console.log('Starting Google Sheets Schedule Sync...');

    try {
        // 1. Fetch CSV
        const response = await axios.get(GOOGLE_SHEET_CSV_URL);
        const content = response.data;

        // 2. Parse CSV
        const records = parse(content, {
            skip_empty_lines: true,
        });

        // Find the header row (Time Range, Monday...)
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

        // Map column indices
        const colMap: Record<string, number> = {};
        headers.forEach((h: string, i: number) => {
            if (h) colMap[h.trim()] = i;
        });

        console.log('Found Schedule Rows:', dataRows.length);

        // 3. Fetch all profiles for presenter matching
        const { data: profiles } = await supabase.from('profiles').select('id, full_name, username');
        const profileLookup = (name: string) => {
            if (!name) return null;
            const normalized = name.toLowerCase().trim();
            return profiles?.find(p =>
                p.username?.toLowerCase() === normalized ||
                p.full_name?.toLowerCase() === normalized
            )?.id || null;
        };

        const scheduleEntries: any[] = [];

        // 4. Process each row and day
        for (const row of dataRows) {
            const timeRange = row[colMap['Time Range']];
            if (!timeRange) continue;

            // Parse "1AM - 8AM" or "11PM- 12AM"
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
                const content = row[colMap[dayName]];
                if (!content || content.toLowerCase() === 'non stop music') {
                    // We can still create "Non Stop Music" entries if we want, 
                    // or just skip and have the UI handle gaps.
                    // For now, let's create them so the list is continuous.
                    if (!content) continue;
                }

                // Extract Title and Presenter
                let title = content.trim();
                let presenterName = '';

                // Patterns like "Show Name W/ Host" or "Show Name WITH Host"
                const presenterMatch = content.match(/(.+?)\s*(?:W\/|WITH)\s*(.+)/i);
                if (presenterMatch) {
                    title = presenterMatch[1].trim();
                    presenterName = presenterMatch[2].trim();
                }

                const presenterId = profileLookup(presenterName);

                // Project for next 4 weeks
                const now = new Date();
                const startOfThisWeek = startOfDay(addDays(now, -now.getDay())); // Sunday

                for (let weekOffset = 0; weekOffset < 4; weekOffset++) {
                    const dayOffset = DAYS_OF_WEEK.indexOf(dayName);
                    const showDate = addDays(startOfThisWeek, dayOffset + (weekOffset * 7));

                    let start = setHours(setMinutes(showDate, 0), startHour);
                    let end = setHours(setMinutes(showDate, 0), endHour);

                    // Handle overflow (e.g. 11PM - 12AM)
                    if (endHour <= startHour) {
                        end = addDays(end, 1);
                    }

                    // Convert to UTC for DB
                    const startUtc = fromZonedTime(start, TIMEZONE);
                    const endUtc = fromZonedTime(end, TIMEZONE);

                    // Skip if already in the past
                    if (isAfter(endUtc, now)) {
                        scheduleEntries.push({
                            title,
                            description: presenterName ? `Hosted by ${presenterName}` : '',
                            start_time: startUtc.toISOString(),
                            end_time: endUtc.toISOString(),
                            presenter_id: presenterId,
                            is_live: false, // Computed by UI usually
                        });
                    }
                }
            }
        }

        console.log(`Prepared ${scheduleEntries.length} entries for the next 4 weeks.`);

        // 5. Cleanup and Insert
        // For a simple sync, we delete entries from "now" to 4 weeks ahead and re-insert.
        // This assumes only the Google Sheet manages this table for now.
        const fourWeeksAhead = addWeeks(new Date(), 4);

        const { error: delError } = await supabase
            .from('schedules')
            .delete()
            .gte('start_time', new Date().toISOString())
            .lte('start_time', fourWeeksAhead.toISOString());

        if (delError) throw delError;

        // Batch insert (Supabase limit is usually 1000 per request, we should be fine with ~700 entries)
        const { error: insError } = await supabase.from('schedules').insert(scheduleEntries);
        if (insError) throw insError;

        console.log('Sync Completed Successfully!');
    } catch (err: any) {
        console.error('Sync Failed:', err.message);
        process.exit(1);
    }
}

sync();
