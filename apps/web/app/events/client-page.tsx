"use client";

import { useState, useCallback, useEffect } from "react";
import { FeaturedCarousel } from "@/components/events/FeaturedCarousel";
import { FilterBar } from "@/components/events/FilterBar";
import { EventCard } from "@/components/events/EventCard";
import type { Event, EventCategory } from "@/lib/events/types";
import { RefreshCw, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface EventsClientProps {
    featuredEvents: Event[];
    initialEvents: Event[];
    initialTotal: number;
}

export function EventsClient({ featuredEvents, initialEvents, initialTotal }: EventsClientProps) {
    const [events, setEvents] = useState<Event[]>(initialEvents);
    const [total, setTotal] = useState(initialTotal);
    const [isLoading, setIsLoading] = useState(false);
    
    const [searchQuery, setSearchQuery] = useState("");
    const [activeCategory, setActiveCategory] = useState("all");
    const [activeSort, setActiveSort] = useState("date_asc");
    const [page, setPage] = useState(1);

    const fetchFilteredEvents = useCallback(async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                category: activeCategory,
                sort: activeSort,
            });
            if (searchQuery) params.set("search", searchQuery);

            const res = await fetch(`/api/events?${params.toString()}`);
            if (!res.ok) throw new Error("Failed to fetch events");
            
            const data = await res.json();
            setEvents(data.events);
            setTotal(data.meta.total);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }, [activeCategory, searchQuery, activeSort, page]);

    // Re-fetch when filters change (debounced search handled by component)
    useEffect(() => {
        // Skip first mount if using initial data
        if (activeCategory === 'all' && searchQuery === '' && activeSort === 'date_asc' && page === 1) {
            return;
        }
        fetchFilteredEvents();
    }, [fetchFilteredEvents, activeCategory, activeSort, page, searchQuery]);

    // Handle search separately to avoid too many requests
    useEffect(() => {
        if (!searchQuery) {
            if (events.length !== initialEvents.length) {
                setEvents(initialEvents);
                setTotal(initialTotal);
            }
            return;
        }
        
        const timer = setTimeout(() => {
            setPage(1);
            fetchFilteredEvents();
        }, 500);
        
        return () => clearTimeout(timer);
    }, [searchQuery, events.length, fetchFilteredEvents, initialEvents, initialTotal]);

    return (
        <div className="space-y-12">
            {/* Featured Section */}
            {featuredEvents.length > 0 && (
                <div className="pt-4">
                    <FeaturedCarousel events={featuredEvents} />
                </div>
            )}

            {/* Filtering and Results */}
            <div className="space-y-8">
                <FilterBar
                    onSearch={setSearchQuery}
                    onCategoryChange={(cat) => { setActiveCategory(cat); setPage(1); }}
                    onSortChange={(sort) => { setActiveSort(sort); setPage(1); }}
                    resultsCount={total}
                />

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
                        <RefreshCw className="w-10 h-10 animate-spin mb-4 text-primary" />
                        <p className="font-bold uppercase tracking-widest text-xs">Syncing events...</p>
                    </div>
                ) : events.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                        {events.map((event) => (
                            <EventCard key={event.id} event={event} />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-24 text-center bg-zinc-50 rounded-3xl border-2 border-dashed border-zinc-200">
                        <Calendar className="w-16 h-16 text-zinc-200 mb-4" />
                        <h3 className="text-xl font-black font-display text-[#141827]">
                            {searchQuery || activeCategory !== "all" ? "No events found" : "No upcoming events"}
                        </h3>
                        <p className="text-zinc-500 max-w-xs mt-2">
                           {searchQuery || activeCategory !== "all"
                               ? "Try adjusting your filters or search query to find what you're looking for."
                               : "New events appear here. Check back later for the latest events from Pie Radio."}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
