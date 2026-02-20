"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ScheduleSlot, isSlotActive } from "@/lib/schedule";

export function useCurrentShow() {
    const [currentShow, setCurrentShow] = useState<ScheduleSlot | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSchedule = async () => {
            const supabase = createClient();
            const now = new Date().toISOString();

            // Fetch currently active shows from the schedules table
            // We prioritize shows marked as 'is_live' or shows within their time slot
            const { data, error } = await supabase
                .from("schedules")
                .select(`
                    id,
                    title,
                    description,
                    start_time,
                    end_time,
                    is_live,
                    image_url,
                    presenter: presenter_id(
                        full_name,
                        username
                    )
                `)
                .lte("start_time", now)
                .gte("end_time", now)
                .order("start_time", { ascending: false })
                .limit(1);

            if (error) {
                console.error("Error fetching current show from schedules:", error);
                setLoading(false);
                return;
            }

            if (data && data.length > 0) {
                const show = data[0];
                // Map to ScheduleSlot interface for compatibility
                setCurrentShow({
                    id: show.id,
                    show_id: null,
                    day_of_week: new Date(show.start_time).getDay(),
                    start_time: show.start_time,
                    end_time: show.end_time,
                    shows: {
                        title: show.title,
                        description: show.description,
                        host_id: (show.presenter as any)?.full_name || null,
                        cover_image_url: show.image_url
                    }
                } as ScheduleSlot);
            } else {
                setCurrentShow(null);
            }
            setLoading(false);
        };

        fetchSchedule();
        const interval = setInterval(fetchSchedule, 60000);
        return () => clearInterval(interval);
    }, []);

    return { currentShow, loading };
}
