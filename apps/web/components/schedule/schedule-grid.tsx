"use client";

import { useState } from "react";
import { ScheduleSlot } from "@/lib/schedule"; // We need to export this type properly or redefine
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import Image from "next/image";
import { Calendar, Mic2, Play } from "lucide-react";

// Re-defining for client usage if import fails (or we should move type to @packages/types completely)
// For now, let's assume the type is compatible
type SlotWithShow = any;

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function ScheduleGrid({ slots }: { slots: SlotWithShow[] }) {
    const todayIndex = new Date().getDay();
    const [activeDay, setActiveDay] = useState(todayIndex);

    const filteredSlots = slots.filter((slot) => slot.day_of_week === activeDay);

    return (
        <div className="space-y-12">
            {/* Day Tabs */}
            <div className="flex overflow-x-auto pb-4 gap-3 no-scrollbar border-b border-border/40">
                {DAYS.map((day, index) => (
                    <button
                        key={day}
                        onClick={() => setActiveDay(index)}
                        className={cn(
                            "px-6 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all duration-200",
                            activeDay === index
                                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105"
                                : "bg-zinc-100 text-muted-foreground hover:bg-zinc-200 hover:text-foreground"
                        )}
                    >
                        {day}
                    </button>
                ))}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {filteredSlots.length === 0 ? (
                    <div className="col-span-full py-24 text-center space-y-4 bg-muted/30 rounded-3xl border-2 border-dashed border-border/60">
                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                            <Calendar className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-xl font-bold font-display">No shows scheduled</p>
                            <p className="text-muted-foreground">We haven&apos;t added the schedule for {DAYS[activeDay]} yet.</p>
                        </div>
                    </div>
                ) : (
                    filteredSlots.map((slot) => (
                        <div
                            key={slot.id}
                            className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/50 bg-white hover:border-primary/50 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1"
                        >
                            <div className="aspect-[16/10] relative bg-muted overflow-hidden">
                                {slot.shows?.cover_image_url ? (
                                    <Image
                                        src={slot.shows.cover_image_url}
                                        alt={slot.shows.title}
                                        fill
                                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-zinc-800 font-display font-black text-3xl select-none">
                                        PIE RADIO
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                                <div className="absolute top-4 left-4">
                                    <div className="px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-md text-white text-[11px] font-black uppercase tracking-widest border border-white/10">
                                        {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                                    </div>
                                </div>
                            </div>

                            <div className="p-5 flex-1 flex flex-col justify-between">
                                <div className="space-y-2">
                                    {slot.shows?.genre && (
                                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                                            {slot.shows.genre}
                                        </div>
                                    )}
                                    <h3 className="font-bold font-display text-xl leading-snug group-hover:text-primary transition-colors line-clamp-2">
                                        {slot.shows?.title}
                                    </h3>
                                    {slot.shows?.description && (
                                        <p className="text-sm text-muted-foreground line-clamp-2">
                                            {slot.shows.description}
                                        </p>
                                    )}
                                </div>

                                <div className="mt-4 pt-4 border-t border-border/40 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center">
                                            <Mic2 className="w-4 h-4 text-primary" />
                                        </div>
                                        <span className="text-xs font-bold text-muted-foreground">Live Host</span>
                                    </div>
                                    <Play className="w-5 h-5 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
