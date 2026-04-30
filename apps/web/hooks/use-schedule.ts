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
    id?: string;
    full_name: string | null;
    username: string | null;
    slug?: string | null;
    avatar_url?: string | null;
  } | null;
}

// In-memory cache to survive component unmounts and brief network drops
const scheduleCache = new Map<string, ScheduleItem[]>();

export function useSchedule(date: Date) {
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshCount, setRefreshCount] = useState(0);

  const refresh = () => setRefreshCount((c) => c + 1);

  useEffect(() => {
    const fetchSchedule = async () => {
      // Calculate start and end of the selected date (local time to UTC)
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const cacheKey = startOfDay.toISOString();

      // Optimistic load from cache (only if not a manual refresh)
      if (scheduleCache.has(cacheKey) && refreshCount === 0) {
        setSchedule(scheduleCache.get(cacheKey)!);
        setLoading(false);
      } else {
        setLoading(true);
      }

      try {
        setError(null);
        const supabase = createClient();

        const { data, error } = await (supabase.from("schedules" as any) as any)
          .select(
            `
                        *,
                        presenter: presenter_id(
                            id,
                            full_name,
                            username,
                            slug,
                            avatar_url
                        )
                    `,
          )
          .lt("start_time", endOfDay.toISOString())
          .gt("end_time", startOfDay.toISOString())
          .order("start_time", { ascending: true });

        if (error) throw error;

        const fetchedData = data || [];
        scheduleCache.set(cacheKey, fetchedData);
        setSchedule(fetchedData);
      } catch (err: any) {
        console.error("Error fetching schedule:", err);

        if (scheduleCache.has(cacheKey)) {
          console.warn("Network error. Falling back to cached schedule data.");
          setSchedule(scheduleCache.get(cacheKey)!);
          setError(null);
        } else {
          setError("Network error: " + err.message);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();

    // Revalidate every 5 minutes to catch updates without refresh
    const interval = setInterval(fetchSchedule, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [date, refreshCount]);

  return { schedule, loading, error, refresh };
}
