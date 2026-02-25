"use client";

import { useState, useMemo } from "react";
import { Calendar } from "lucide-react";
import { EVENTS, EventStatus } from "@/lib/dummy-data/events";
import { FeaturedCarousel } from "@/components/events/FeaturedCarousel";
import { QuickActions } from "@/components/events/QuickActions";
import { FilterBar } from "@/components/events/FilterBar";
import { EventCard } from "@/components/events/EventCard";
import { ComingSoon } from "@/components/shared/coming-soon";

const SHOW_COMING_SOON = false;

export default function EventsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeSort, setActiveSort] = useState("recommended");

  const featuredEvents = EVENTS.filter((e) => e.isFeatured);

  const filteredEvents = useMemo(() => {
    let result = EVENTS;

    // Filter by Category
    if (activeCategory !== "all") {
      result = result.filter((e) => e.category === activeCategory);
    }

    // Filter by Search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (e) =>
          e.title.toLowerCase().includes(query) ||
          e.artist.toLowerCase().includes(query) ||
          e.venue.name.toLowerCase().includes(query) ||
          e.venue.city.toLowerCase().includes(query),
      );
    }

    // Sort
    result = [...result].sort((a, b) => {
      switch (activeSort) {
        case "date_asc":
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case "price_asc":
          return a.priceRange.min - b.priceRange.min;
        case "popular":
          // Mock popularity by status
          return a.status === "soldout" ? -1 : 1;
        default: // recommended (mock)
          return 0;
      }
    });

    return result;
  }, [activeCategory, searchQuery, activeSort]);

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

  return (
    <div className="flex flex-col min-h-screen pb-20">
      <div className="container mx-auto max-w-7xl space-y-8 py-6 md:py-10">
        {/* Header Section */}
        <div className="space-y-2 px-4 md:px-0">
          <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight">
            Live Events
          </h1>
          <p className="text-muted-foreground text-lg">
            Discover and book tickets for live shows and station events
          </p>
        </div>

        {/* Featured Events */}
        <FeaturedCarousel events={featuredEvents} />

        {/* Quick Actions */}
        <QuickActions />

        {/* Main Content Area */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 px-4 md:px-0">
          {/* Filters & Search - Top on mobile, Left on desktop (planned) */}
          <div className="md:col-span-4 space-y-6">
            <FilterBar
              onSearch={setSearchQuery}
              onCategoryChange={setActiveCategory}
              onSortChange={setActiveSort}
            />

            {/* Events List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.length > 0 ? (
                filteredEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))
              ) : (
                <div className="col-span-full py-12 text-center text-muted-foreground">
                  No events found matching your criteria.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
