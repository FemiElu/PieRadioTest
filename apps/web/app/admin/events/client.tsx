"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import NextImage from "next/image";
import { useRouter } from "next/navigation";
import {
    Search,
    Filter,
    Plus,
    Edit2,
    Trash2,
    RefreshCw,
    Calendar,
    Eye,
    MapPin,
    ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Event, EventStatus } from "@/lib/events/types";
import { formatEventPrice, EVENT_CATEGORY_LABELS } from "@/lib/events/types";
import { format } from "date-fns";

export function AdminEventsClient() {
    const router = useRouter();
    const [events, setEvents] = useState<Event[]>([]);
    const [total, setTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    const fetchEvents = useCallback(async () => {
        setIsLoading(true);
        try {
            const qs = new URLSearchParams({
                page: page.toString(),
                limit: "20",
                status: statusFilter,
            });
            if (searchQuery) qs.set("search", searchQuery);

            const res = await fetch(`/api/admin/events?${qs.toString()}`);
            if (!res.ok) throw new Error("Failed to fetch events");

            const data = await res.json();
            setEvents(data.events);
            setTotal(data.meta.total);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [page, searchQuery, statusFilter]);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    const handleDelete = async (id: string, currentStatus: EventStatus) => {
        if (currentStatus === "cancelled") return;
        if (!confirm("Are you sure you want to cancel this event?")) return;

        try {
            const res = await fetch(`/api/admin/events/${id}`, { method: "DELETE" });
            if (res.ok) {
                fetchEvents();
            } else {
                throw new Error("Failed to delete");
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="bg-white rounded-2xl border border-border/50 shadow-sm overflow-hidden flex flex-col mt-4">
            <div className="p-6 border-b border-border/50 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-zinc-50/50">
                <div className="flex flex-col sm:flex-row gap-4 flex-1">
                    {/* Search Box */}
                    <div className="relative group w-full sm:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="Search events by title, artist, venue..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-11 bg-white border border-border/50 rounded-xl pl-10 pr-4 text-sm outline-none transition-all placeholder:text-zinc-400 hover:border-zinc-300 focus:border-primary focus:ring-4 focus:ring-primary/10 shadow-sm"
                            onKeyDown={(e) => e.key === "Enter" && fetchEvents()}
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="h-11 bg-white border border-border/50 rounded-xl flex items-center px-4 gap-2 shadow-sm relative focus-within:ring-2 ring-primary/20 transition-all">
                            <Filter className="w-4 h-4 text-zinc-400" />
                            <select
                                className="bg-transparent text-sm font-bold text-[#141827] outline-none appearance-none pr-4 cursor-pointer"
                                value={statusFilter}
                                onChange={(e) => {
                                    setStatusFilter(e.target.value);
                                    setPage(1);
                                }}
                            >
                                <option value="all">All Status</option>
                                <option value="upcoming">Upcoming</option>
                                <option value="past">Past</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                        </div>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={fetchEvents}
                            className="h-11 w-11 rounded-xl"
                        >
                            <RefreshCw
                                className={cn("w-4 h-4", isLoading && "animate-spin")}
                            />
                        </Button>
                    </div>
                </div>

                <Link href="/admin/events/new">
                    <Button className="h-11 px-6 rounded-xl shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all gap-2 group whitespace-nowrap">
                        <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                        New Event
                    </Button>
                </Link>
            </div>

            {isLoading ? (
                <div className="py-20 flex flex-col items-center justify-center text-zinc-400 min-h-[400px]">
                    <RefreshCw className="w-8 h-8 animate-spin mb-4 text-primary" />
                    <p className="font-bold">Loading events...</p>
                </div>
            ) : events.length === 0 ? (
                <div className="py-20 flex flex-col items-center justify-center text-zinc-400 min-h-[400px]">
                    <Calendar className="w-12 h-12 mb-4 text-zinc-200" />
                    <p className="font-bold text-lg text-zinc-500">No events found</p>
                    <p className="text-sm">Try adjusting your filters or create a new one.</p>
                </div>
            ) : (
                <div className="overflow-x-auto min-h-[400px]">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-zinc-50/80 text-zinc-500 text-xs uppercase tracking-wider font-bold">
                                <th className="px-6 py-4 border-b border-border/50 whitespace-nowrap">
                                    Event Info
                                </th>
                                <th className="px-6 py-4 border-b border-border/50">Status</th>
                                <th className="px-6 py-4 border-b border-border/50">Pricing</th>
                                <th className="px-6 py-4 border-b border-border/50 text-right">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50 text-sm">
                            {events.map((event) => (
                                <tr
                                    key={event.id}
                                    className="hover:bg-zinc-50 transition-colors group"
                                >
                                    <td className="px-6 py-4 align-top">
                                        <div className="flex gap-4">
                                            {event.cover_image_url ? (
                                                <div className="relative w-16 h-16 shrink-0 mt-1">
                                                    <NextImage
                                                        src={event.cover_image_url}
                                                        alt={event.title}
                                                        fill
                                                        className="object-cover rounded-xl shadow-sm"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="w-16 h-16 rounded-xl bg-zinc-100 flex items-center justify-center mt-1 border border-zinc-200 shadow-sm shrink-0">
                                                    <Calendar className="w-6 h-6 text-zinc-300" />
                                                </div>
                                            )}
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    {event.is_featured && (
                                                        <span className="px-2 py-0.5 bg-primary/10 text-primary font-bold uppercase tracking-wider text-[10px] rounded leading-none shrink-0 border border-primary/20">
                                                            Featured
                                                        </span>
                                                    )}
                                                    <p className="font-bold font-display text-base text-[#141827] line-clamp-1">
                                                        {event.title}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-xs text-zinc-500 mb-2">
                                                    <MapPin className="w-3 h-3" />
                                                    <span className="truncate">{event.venue_name || event.location || "TBA"}</span>
                                                    <span>•</span>
                                                    <span>{format(new Date(event.start_time), "MMM d, yyyy")}</span>
                                                </div>
                                                <div className="flex items-center gap-3 text-xs font-bold text-zinc-500 uppercase tracking-wider">
                                                    <span className="text-primary truncate max-w-[120px]">
                                                        {EVENT_CATEGORY_LABELS[event.category]}
                                                    </span>
                                                    {event.artist_name && (
                                                        <>
                                                            <span className="w-1 h-1 rounded-full bg-zinc-300" />
                                                            <span className="truncate max-w-[150px]">
                                                                {event.artist_name}
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </td>

                                    <td className="px-6 py-4">
                                        <div className={cn(
                                            "inline-flex items-center gap-2 px-3 py-1 text-xs uppercase font-bold tracking-wider rounded-full",
                                            event.status === "upcoming"
                                                ? "bg-emerald-100 text-emerald-700"
                                                : event.status === "cancelled"
                                                    ? "bg-red-100 text-red-700"
                                                    : "bg-zinc-100 text-zinc-600"
                                        )}>
                                            <span className={cn(
                                                "w-1.5 h-1.5 rounded-full inline-block",
                                                event.status === "upcoming" ? "bg-emerald-500" : event.status === "cancelled" ? "bg-red-500" : "bg-zinc-400"
                                            )} />
                                            {event.status}
                                        </div>
                                    </td>

                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            <span className="font-bold text-[#141827]">
                                                {formatEventPrice(event)}
                                            </span>
                                            {event.ticket_url && (
                                                <a
                                                    href={event.ticket_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1 text-[10px] uppercase font-black text-primary hover:underline"
                                                >
                                                    Ticket Link <ExternalLink className="w-2 h-2" />
                                                </a>
                                            )}
                                        </div>
                                    </td>

                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2 text-right">
                                            <Link
                                                href={`/admin/events/${event.id}/edit`}
                                                className="p-2 text-zinc-400 hover:bg-zinc-100 hover:text-[#141827] rounded-xl transition-all"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </Link>
                                            <Link
                                                href={`/events/${event.slug}`}
                                                target="_blank"
                                                className="p-2 text-zinc-400 hover:bg-primary/10 hover:text-primary rounded-xl transition-all"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(event.id, event.status)}
                                                disabled={event.status === "cancelled"}
                                                className={cn(
                                                    "p-2 rounded-xl transition-all",
                                                    event.status === "cancelled"
                                                        ? "text-zinc-200 cursor-not-allowed"
                                                        : "text-red-400 hover:bg-red-50 hover:text-red-600"
                                                )}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="p-4 border-t border-border/50 flex items-center justify-between text-sm bg-zinc-50/50">
                        <span className="font-bold text-zinc-500">
                            Showing {(page - 1) * 20 + 1} to{" "}
                            {Math.min(page * 20, total)} of {total} events
                        </span>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={page === 1}
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                className="font-bold rounded-xl"
                            >
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={page * 20 >= total}
                                onClick={() => setPage((p) => p + 1)}
                                className="font-bold rounded-xl"
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
