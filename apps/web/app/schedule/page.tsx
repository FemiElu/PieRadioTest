import { ScheduleGrid } from "@/components/schedule/schedule-grid";
import { Calendar } from "lucide-react";

export const revalidate = 60; // Revalidate every minute

export default function SchedulePage() {
    return (
        <div className="flex flex-col w-full min-h-screen bg-background">
            {/* Page Header */}
            {/* Page Header */}
            <section className="container px-4 md:px-8 py-10 max-w-screen-2xl mx-auto">
                <div className="flex flex-col gap-2">
                    <h1 className="text-4xl md:text-5xl font-bold font-display tracking-tight text-foreground">
                        Schedule
                    </h1>
                    <p className="text-lg text-muted-foreground font-medium">
                        Plan your listening. Never miss a show.
                    </p>
                </div>
            </section>

            {/* Schedule Content */}
            <section className="container py-8 md:py-16 px-4 md:px-8 max-w-screen-2xl mx-auto">
                <ScheduleGrid />
            </section>
        </div>
    );
}
