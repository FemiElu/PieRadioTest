import { Database } from "@packages/types";

export interface ScheduleSlot {
    id: string;
    show_id: string | null;
    day_of_week: number | null;
    start_time: string;
    end_time: string;
    is_recurring?: boolean | null;
    override_date?: string | null;
    created_at?: string | null;
    shows?: {
        id?: string;
        title?: string;
        description?: string | null;
        host_id?: string | null;
        cover_image_url?: string | null;
    } | null;
}

// Map JS getDay() (0=Sun) to our DB day_of_week (assuming 0=Sun)
export function getCurrentDayOfWeek(): number {
    return new Date().getDay();
}

export function getCurrentTimeHHMM(): string {
    const now = new Date();
    return now.toTimeString().slice(0, 5); // "14:30"
}

export function isSlotActive(slot: ScheduleSlot): boolean {
    const currentDay = getCurrentDayOfWeek();
    const currentTime = getCurrentTimeHHMM();

    // Basic recurring check
    if (slot.is_recurring) {
        if (slot.day_of_week !== currentDay) return false;
        return currentTime >= slot.start_time && currentTime < slot.end_time;
    }

    // One-off check (Simplistic date string comparison)
    if (slot.override_date) {
        const todayStr = new Date().toISOString().split('T')[0];
        return slot.override_date === todayStr && currentTime >= slot.start_time && currentTime < slot.end_time;
    }

    return false;
}
