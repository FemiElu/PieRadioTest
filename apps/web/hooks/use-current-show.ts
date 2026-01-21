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
            const today = new Date().getDay();

            // Fetch today's slots
            const { data, error } = await supabase
                .from("schedule_slots")
                .select(`
          *,
          shows (*)
        `)
                .eq("day_of_week", today) // Optimize: only fetch today
                .order("start_time");

            if (error) {
                console.error("Error fetching schedule", error);
                setLoading(false);
                return;
            }

            // Find active slot
            const active = (data as ScheduleSlot[]).find(slot => isSlotActive(slot));
            setCurrentShow(active || null);
            setLoading(false);
        };

        fetchSchedule();
        // Re-check every minute
        const interval = setInterval(fetchSchedule, 60000);
        return () => clearInterval(interval);
    }, []);

    return { currentShow, loading };
}
