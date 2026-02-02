"use client";

import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Event } from "@/lib/dummy-data/events";
import { EventCard } from "./EventCard";
import { cn } from "@/lib/utils";

interface FeaturedCarouselProps {
    events: Event[];
}

export function FeaturedCarousel({ events }: FeaturedCarouselProps) {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

    const checkScroll = () => {
        if (scrollContainerRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
            setCanScrollLeft(scrollLeft > 0);
            setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5); // 5px buffer
        }
    };

    const scroll = (direction: "left" | "right") => {
        if (scrollContainerRef.current) {
            const scrollAmount = scrollContainerRef.current.clientWidth * 0.8;
            scrollContainerRef.current.scrollBy({
                left: direction === "left" ? -scrollAmount : scrollAmount,
                behavior: "smooth",
            });
        }
    };

    return (
        <div className="relative group">
            <div className="flex items-center justify-between mb-4 px-4 md:px-0">
                <h2 className="text-2xl font-display font-bold">Featured Events</h2>
                <div className="hidden md:flex gap-2">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => scroll("left")}
                        disabled={!canScrollLeft}
                        className="rounded-full h-8 w-8"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => scroll("right")}
                        disabled={!canScrollRight}
                        className="rounded-full h-8 w-8"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            <div
                ref={scrollContainerRef}
                onScroll={checkScroll}
                className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory px-4 md:px-0 -mx-4 md:mx-0"
            >
                {events.map((event) => (
                    <div
                        key={event.id}
                        className="min-w-[85vw] md:min-w-[350px] lg:min-w-[400px] snap-center first:pl-0"
                    >
                        <EventCard event={event} />
                    </div>
                ))}
            </div>
        </div>
    );
}
