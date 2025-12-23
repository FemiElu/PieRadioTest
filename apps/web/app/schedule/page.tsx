import { createClient } from "@/lib/supabase/server";
import { ScheduleGrid } from "@/components/schedule/schedule-grid";
import { Calendar } from "lucide-react";

export const revalidate = 60; // Revalidate every minute

export default async function SchedulePage() {
    const supabase = await createClient();

    const { data: slots, error } = await supabase
        .from("schedule_slots")
        .select(`
            *,
            shows (*)
        `)
        .order("day_of_week")
        .order("start_time");

    if (error) {
        console.error("Error fetching schedule", error);
        return <div>Error loading schedule.</div>;
    }

    return (
        <div className="flex flex-col w-full">
            {/* Page Header */}
            <section className="bg-zinc-950 text-white pt-24 pb-16">
                <div className="container px-4 md:px-8 max-w-screen-2xl mx-auto">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="space-y-4 max-w-2xl">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 text-primary-foreground text-xs font-bold uppercase tracking-wider">
                                <Calendar className="w-3 h-3" />
                                Interactive
                            </div>
                            <h1 className="text-4xl md:text-6xl font-bold font-display tracking-tight leading-tight">
                                Show <span className="text-primary italic">Schedule</span>
                            </h1>
                            <p className="text-lg text-zinc-400 font-medium">
                                Find out when your favorite shows and presenters are live on Pie Radio.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Schedule Content */}
            <section className="container py-12 px-4 md:px-8 max-w-screen-2xl mx-auto">
                <ScheduleGrid slots={slots || []} />
            </section>
        </div>
    );
}
