import { ScheduleGrid } from "@/components/schedule/schedule-grid";
import { Calendar } from "lucide-react";
import { getUserLikedIds } from "@/app/actions/favourites";

export const revalidate = 3600; // Revalidate every hour

export default async function SchedulePage() {
    let likedShowIds: string[] = [];
    try {
        const likedData = await getUserLikedIds();
        likedShowIds = likedData.showIds;
    } catch (e) {
        // Fallback for unauthenticated
    }

    return (
        <div className="flex flex-col w-full min-h-screen bg-background">
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
                <ScheduleGrid likedShowIds={likedShowIds} />
            </section>
        </div>
    );
}
