"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { ChevronDown, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// --- DUMMY DATA ---
const DAYS = [
    { name: "Monday", date: "1st", full: "Mon 1st" },
    { name: "Tuesday", date: "2nd", full: "Tue 2nd", isCurrent: true },
    { name: "Wednesday", date: "3rd", full: "Wed 3rd" },
    { name: "Thursday", date: "4th", full: "Thu 4th" },
    { name: "Friday", date: "5th", full: "Fri 5th" },
    { name: "Saturday", date: "6th", full: "Sat 6th" },
    { name: "Sunday", date: "7th", full: "Sun 7th" },
];

const DUMMY_SCHEDULE = [
    {
        id: "1",
        startTime: "06:00",
        endTime: "10:00",
        title: "Morning Rise",
        host: "Alex Thompson",
        image: "/assets/artist-spotlight.jpg",
        description: "Start your day with the best mix of news, music, and entertainment. Wake up with energy and positivity.",
        isLive: false,
    },
    {
        id: "2",
        startTime: "10:00",
        endTime: "14:00",
        title: "Midday Mix",
        host: "Jamie Lee & Sarah Wilson",
        image: "/assets/featured-event.jpg",
        description: "The perfect soundtrack to your workday. Chart hits, classic throwbacks, and guest interviews with your favorite artists.",
        isLive: true, // Currently live
    },
    {
        id: "3",
        startTime: "14:00",
        endTime: "18:00",
        title: "Afternoon Sessions",
        host: "Marcus Chen",
        image: "/assets/hero-main.jpg",
        description: "Deep dives into history, exclusive sessions, and artist spotlights. Discover new music.",
        isLive: false,
    },
    {
        id: "4",
        startTime: "18:00",
        endTime: "20:00",
        title: "Drive Time",
        host: "Rachel Martinez",
        image: "/assets/artist-spotlight.jpg",
        description: "Your nonstop companion with the biggest hits, traffic updates, and conversations.",
        isLive: false,
    },
];

// Blinking Live Indicator Component
function BlinkingDot() {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const interval = setInterval(() => {
            setIsVisible((prev) => !prev);
        }, 600);
        return () => clearInterval(interval);
    }, []);

    return (
        <div
            className={cn(
                "absolute top-2 left-2 w-3 h-3 rounded-full bg-red-500 border-2 border-white shadow-lg transition-opacity duration-150",
                isVisible ? "opacity-100" : "opacity-30"
            )}
        />
    );
}

export function ScheduleGrid() {
    const currentDayIndex = DAYS.findIndex((d) => d.isCurrent) || 1;
    const [activeDay, setActiveDay] = useState(currentDayIndex);

    // For demo, show same schedule for all days
    const activeSchedule = DUMMY_SCHEDULE;

    return (
        <div className="space-y-8">
            {/* --- Date Selection Controls --- */}

            {/* Mobile: Select Dropdown */}
            <div className="md:hidden">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-full h-12 justify-between text-base font-semibold rounded-xl border bg-card px-4">
                            <span>{DAYS[activeDay].name}, {DAYS[activeDay].date}</span>
                            <ChevronDown className="w-5 h-5 opacity-50" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-[calc(100vw-32px)]">
                        {DAYS.map((day, index) => (
                            <DropdownMenuItem
                                key={day.name}
                                onClick={() => setActiveDay(index)}
                                className="text-base py-3 font-medium cursor-pointer"
                            >
                                {day.name}, {day.date}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Desktop: Horizontal Pills */}
            <div className="hidden md:flex flex-wrap gap-3">
                {DAYS.map((day, index) => (
                    <button
                        key={day.name}
                        onClick={() => setActiveDay(index)}
                        className={cn(
                            "px-6 py-3 rounded-full text-base font-bold transition-all duration-200 border-2",
                            activeDay === index
                                ? "bg-primary border-primary text-white shadow-lg shadow-primary/20 scale-105"
                                : "bg-white border-border text-foreground hover:border-zinc-300 hover:bg-zinc-50"
                        )}
                    >
                        {day.full}
                    </button>
                ))}
            </div>

            {/* --- Show List --- */}
            <div className="space-y-4">
                {activeSchedule.length === 0 ? (
                    <div className="py-20 text-center text-muted-foreground">No shows for this day.</div>
                ) : (
                    activeSchedule.map((show) => {
                        const isLive = show.isLive;

                        return (
                            <div
                                key={show.id}
                                className={cn(
                                    "group relative flex flex-col md:flex-row items-center gap-6 p-6 rounded-3xl border-2 transition-all duration-300 hover:scale-[1.01]",
                                    isLive
                                        ? "bg-white border-primary/30 shadow-xl shadow-primary/10 ring-2 ring-primary/20"
                                        : "bg-white border-border hover:border-zinc-300 hover:shadow-lg"
                                )}
                            >
                                {/* Time Column */}
                                <div className="flex flex-col items-start justify-center min-w-[100px] shrink-0">
                                    <span className="text-3xl font-bold text-foreground tracking-tight leading-none">
                                        {show.startTime}
                                    </span>
                                    <span className="text-sm font-medium text-muted-foreground mt-1">
                                        {show.endTime}
                                    </span>
                                </div>

                                {/* Content Container */}
                                <div className="flex-1 flex flex-col md:flex-row gap-6 items-center w-full">
                                    {/* Image */}
                                    <div className="relative w-28 h-28 md:w-32 md:h-32 shrink-0 rounded-2xl overflow-hidden bg-zinc-100 shadow-md">
                                        <Image
                                            src={show.image}
                                            alt={show.title}
                                            fill
                                            className="object-cover"
                                        />
                                        {isLive && <BlinkingDot />}
                                    </div>

                                    {/* Text Info */}
                                    <div className="flex-1 text-center md:text-left space-y-2">
                                        <div className="flex items-center justify-center md:justify-start gap-3">
                                            <h3 className="text-xl md:text-2xl font-bold text-foreground leading-tight">
                                                {show.title}
                                            </h3>
                                            {isLive && (
                                                <span className="px-2.5 py-1 rounded-md bg-red-500 text-white text-[10px] font-black uppercase tracking-wider shadow-sm">
                                                    Live Now
                                                </span>
                                            )}
                                        </div>
                                        <p className="font-semibold text-muted-foreground text-sm">{show.host}</p>
                                        <p className="text-sm text-zinc-600 leading-relaxed max-w-2xl">
                                            {show.description}
                                        </p>
                                    </div>

                                    {/* Action Button */}
                                    <div className="shrink-0 mt-4 md:mt-0">
                                        {isLive ? (
                                            <Button
                                                size="lg"
                                                className="rounded-full px-8 py-6 font-bold text-base shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
                                            >
                                                Listen Live
                                            </Button>
                                        ) : (
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="w-12 h-12 rounded-full border-2 hover:border-primary hover:bg-primary/5 hover:text-primary transition-all"
                                            >
                                                <Play className="w-5 h-5 ml-0.5" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
