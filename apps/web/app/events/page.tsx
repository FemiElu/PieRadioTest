import { createClient } from "@/lib/supabase/server";
import { getPublicEvents, getFeaturedEvents } from "@/lib/events/queries";
import { EventsClient } from "./client-page";
import { Calendar } from "lucide-react";
import { ComingSoon } from "@/components/shared/coming-soon";

export const revalidate = 3600; // Cache for 1 hour

export const metadata = {
  title: "Live Events | Pie Radio",
  description: "Discover and book tickets for live shows, festivals, and exclusive Pie Radio events.",
};

const SHOW_COMING_SOON = false;

export default async function EventsPage() {
  if (SHOW_COMING_SOON) {
    return (
      <ComingSoon
        title="Our Events Page will be "
        subtitle="Coming Soon"
        icon={Calendar}
        description="Discover and book tickets for live shows, festivals, and exclusive Pie Radio events. We're currently building a world-class booking experience for you."
      />
    );
  }

  const supabase = await createClient();
  
  // Parallel fetch featured and initial listing
  const [featuredEvents, { events: initialEvents, total }] = await Promise.all([
    getFeaturedEvents(supabase),
    getPublicEvents(supabase, { limit: 20 }),
  ]);

  return (
    <div className="flex flex-col min-h-screen pb-20">
      <div className="container mx-auto max-w-7xl space-y-8 py-6 md:py-10 px-4 md:px-0">
        {/* Header Section */}
        <div className="space-y-2">
          <h1 className="text-4xl md:text-5xl font-black font-display tracking-tight text-[#141827]">
            LIVE <span className="text-primary italic">EVENTS</span>
          </h1>
          <p className="text-zinc-500 text-lg font-medium max-w-2xl">
            Experience the sound live. From exclusive studio sessions to underground gigs and massive festivals.
          </p>
        </div>

        {/* Client side interactive part */}
        <EventsClient 
           featuredEvents={featuredEvents} 
           initialEvents={initialEvents} 
           initialTotal={total} 
        />
      </div>
    </div>
  );
}
