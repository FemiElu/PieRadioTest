"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export interface ScheduleItem {
    id: string;
    title: string;
    description: string | null;
    start_time: string;
    end_time: string;
    image_url: string | null;
    presenter_id: string | null;
    is_live: boolean;
    presenter?: {
        full_name: string;
        username: string;
    };
}


// In-memory cache to survive component unmounts and brief network drops
const scheduleCache = new Map<string, ScheduleItem[]>();

export function useSchedule(date: Date) {
    const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchSchedule = async () => {
            // Calculate start and end of the selected date (local time to UTC)
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);

            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);

            const cacheKey = startOfDay.toISOString();

            // Optimistic load from cache
            if (scheduleCache.has(cacheKey)) {
                setSchedule(scheduleCache.get(cacheKey)!);
                setLoading(false);
            } else {
                setLoading(true);
            }

            try {
                setError(null);
                const supabase = createClient();

                const { data, error } = await (supabase.from('schedules' as any) as any)
                    .select(`
                        *,
                        presenter: presenter_id(
                            full_name,
                            username
                        )
                    `)
                    .lt('start_time', endOfDay.toISOString())
                    .gt('end_time', startOfDay.toISOString())
                    .order('start_time', { ascending: true });

                if (error) throw error;

                const fetchedData = data || [];
                scheduleCache.set(cacheKey, fetchedData);
                setSchedule(fetchedData);
            } catch (err: any) {
                console.error('Error fetching schedule:', err);

                // If we have cached data, suppress the error so the UI doesn't break
                if (scheduleCache.has(cacheKey)) {
                    console.warn('Network error. Falling back to cached schedule data.');
                    setError(null);
                } else {
                    setError('Network error: ' + err.message);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchSchedule();
    }, [date]);

    return { schedule, loading, error };
}
