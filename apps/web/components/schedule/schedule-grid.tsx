"use client";

import { useState, useMemo, useEffect } from "react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { ChevronDown, Play, Pause, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSchedule } from "@/hooks/use-schedule";
import { useAudio } from "@/context/audio-context";
import { Skeleton } from "@/components/ui/skeleton";

// --- HELPERS ---
const formatDayName = (date: Date) =>
  date.toLocaleDateString("en-US", { weekday: "long" });
const formatDayShort = (date: Date) =>
  date.toLocaleDateString("en-US", { weekday: "short" });
const formatDatePart = (date: Date) =>
  date.toLocaleDateString("en-US", { month: "long", day: "numeric" }); // e.g. January 1
const formatDateShort = (date: Date) =>
  date.toLocaleDateString("en-US", { day: "numeric", month: "short" }); // e.g. 1st Jan (simplified)

const getOrdinal = (n: number) => {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

const formatDayFull = (date: Date) => {
  const dayName = formatDayShort(date);
  const dayOfMonth = date.getDate();
  return `${dayName} ${getOrdinal(dayOfMonth)}`;
};

// Helper to format time "HH:mm" in London Time
const formatTime = (isoString: string) => {
  return new Date(isoString).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/London",
  });
};

// Blinking Live Indicator Component
function BlinkingDot() {
  return (
    <span className="relative flex h-3 w-3">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
    </span>
  );
}

export function ScheduleGrid() {
  // Generate next 7 days
  const days = useMemo(() => {
    const result = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      result.push({
        dateObj: d,
        name: formatDayName(d),
        date: formatDatePart(d),
        full: formatDayFull(d),
        isCurrent: i === 0,
      });
    }
    return result;
  }, []);

  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const activeDateObj = days[activeDayIndex].dateObj;

  // Fetch schedule for the selected day
  const { schedule, loading: isLoading, error } = useSchedule(activeDateObj);

  // Audio context
  const { isPlaying, togglePlay, isLoading: isAudioLoading } = useAudio();

  // Dynamic current time for live indicator
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-8">
      {/* --- Date Selection Controls --- */}

      {/* Mobile: Select Dropdown */}
      <div className="md:hidden">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="w-full h-12 justify-between text-base font-semibold rounded-xl border bg-card px-4"
              disabled={isLoading}
            >
              <span>{days[activeDayIndex].full}</span>
              <ChevronDown className="w-5 h-5 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-[calc(100vw-32px)]">
            {days.map((day, index) => (
              <DropdownMenuItem
                key={day.name}
                onClick={() => setActiveDayIndex(index)}
                className="text-base py-3 font-medium cursor-pointer"
              >
                {day.full}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Desktop: Horizontal Pills */}
      <div className="hidden md:flex flex-wrap gap-3">
        {days.map((day, index) => (
          <button
            key={day.name}
            onClick={() => setActiveDayIndex(index)}
            disabled={isLoading && schedule.length === 0}
            className={cn(
              "px-6 py-3 rounded-full text-base font-bold transition-all duration-200 border-2",
              activeDayIndex === index
                ? "bg-primary border-primary text-white shadow-lg shadow-primary/20 scale-105"
                : "bg-white border-border text-foreground hover:border-zinc-300 hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed",
            )}
          >
            {day.full}
          </button>
        ))}
      </div>

      {/* --- Show List --- */}
      <div className="space-y-4 min-h-[400px]">
        {isLoading ? (
          // Loading Skeletons
          Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col md:flex-row gap-6 p-6 rounded-3xl border-2 border-border/50 bg-white"
            >
              <Skeleton className="w-24 h-12 rounded-lg" />
              <div className="flex-1 flex gap-6">
                <Skeleton className="w-28 h-28 rounded-2xl shrink-0" />
                <div className="space-y-3 flex-1">
                  <Skeleton className="h-8 w-3/4 rounded-lg" />
                  <Skeleton className="h-4 w-1/2 rounded-lg" />
                  <Skeleton className="h-16 w-full rounded-lg" />
                </div>
              </div>
            </div>
          ))
        ) : error ? (
          <div className="py-20 text-center rounded-3xl border-2 border-red-100 bg-red-50/50">
            <p className="text-red-500 font-semibold mb-2">
              Failed to load schedule
            </p>
            <p className="text-sm text-red-400">{error}</p>
          </div>
        ) : schedule.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground bg-zinc-50 rounded-3xl border-2 border-dashed border-zinc-200">
            No shows scheduled for this day.
          </div>
        ) : (
          schedule.map((show) => {
            const showStart = new Date(show.start_time);
            const showEnd = new Date(show.end_time);
            const isLive = currentTime >= showStart && currentTime < showEnd;

            return (
              <div
                key={show.id}
                className={cn(
                  "group relative flex flex-col md:flex-row items-center gap-6 p-6 rounded-3xl border-2 transition-all duration-300",
                  isLive
                    ? "bg-red-50/30 border-red-400/60 shadow-[0_0_25px_rgba(239,68,68,0.15)] ring-1 ring-red-400/50 scale-[1.02]"
                    : "bg-white border-border hover:border-zinc-300 hover:shadow-lg hover:scale-[1.01]",
                )}
              >
                {/* Time Column */}
                <div className="flex flex-col items-start justify-center min-w-[100px] shrink-0">
                  <span className="text-3xl font-bold text-foreground tracking-tight leading-none">
                    {formatTime(show.start_time)}
                  </span>
                  <span className="text-sm font-medium text-muted-foreground mt-1">
                    {formatTime(show.end_time)}
                  </span>
                </div>

                {/* Content Container */}
                <div className="flex-1 flex flex-col md:flex-row gap-6 items-center w-full">
                  {/* Image */}
                  <div className="relative w-28 h-28 md:w-32 md:h-32 shrink-0 rounded-2xl overflow-hidden bg-zinc-100 shadow-md">
                    <Image
                      src={show.image_url || "/assets/pieRadioShowImg.webp"} // Fallback image needed
                      alt={show.title}
                      fill
                      className="object-cover"
                    />
                    {isLive && (
                      <div className="absolute top-2 left-2">
                        <BlinkingDot />
                      </div>
                    )}
                  </div>

                  {/* Text Info */}
                  <div className="flex-1 text-center md:text-left space-y-2">
                    <div className="flex items-center justify-center md:justify-start gap-3">
                      <h3 className="text-xl md:text-2xl font-bold text-foreground leading-tight">
                        {show.title}
                      </h3>
                      {isLive && (
                        <span className="animate-pulse px-2.5 py-1 rounded-md bg-red-500 text-white text-[10px] font-black uppercase tracking-wider shadow-[0_0_10px_rgba(239,68,68,0.5)]">
                          Live Now
                        </span>
                      )}
                    </div>
                    <p className="font-semibold text-muted-foreground text-sm">
                      {show.presenter?.full_name || show.presenter?.username}
                    </p>
                    <p className="text-sm text-zinc-600 leading-relaxed max-w-2xl line-clamp-2">
                      {show.description}
                    </p>
                  </div>

                  {/* Action Button */}
                  <div className="shrink-0 mt-4 md:mt-0">
                    {isLive ? (
                      <Button
                        size="lg"
                        onClick={(e) => {
                          e.stopPropagation();
                          togglePlay();
                        }}
                        className="relative z-10 rounded-full px-8 py-6 font-bold text-base shadow-lg shadow-primary/20 hover:scale-105 transition-transform gap-2 bg-primary hover:bg-primary/90 text-white border-0"
                      >
                        {isAudioLoading ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : isPlaying ? (
                          <Pause className="w-5 h-5 fill-current" />
                        ) : (
                          <Play className="w-5 h-5 fill-current" />
                        )}
                        {isPlaying ? "Pause Stream" : "Listen Live"}
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="icon"
                        className="w-12 h-12 rounded-full border-2 hover:border-primary hover:bg-primary/5 hover:text-primary transition-all pointer-events-none opacity-50"
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
