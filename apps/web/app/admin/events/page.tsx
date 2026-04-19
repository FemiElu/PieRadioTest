import { createClient } from "@/lib/supabase/server";
import { getAllEventsAdmin } from "@/lib/events/queries";
import { AdminEventsClient } from "./client";
import {
    Calendar,
    Ticket,
    CheckCircle2,
    XCircle,
    CalendarDays,
} from "lucide-react";

export const metadata = {
    title: "Events Management | Pie Radio Admin",
};

export default async function AdminEventsPage() {
    const supabase = await createClient();

    // Fast count queries for stats
    const [
        { count: totalCount },
        { count: upcomingCount },
        { count: pastCount },
        { count: cancelledCount },
    ] = await Promise.all([
        supabase.from("events").select("id", { count: "exact", head: true }),
        supabase
            .from("events")
            .select("id", { count: "exact", head: true })
            .eq("status", "upcoming"),
        supabase
            .from("events")
            .select("id", { count: "exact", head: true })
            .eq("status", "past"),
        supabase
            .from("events")
            .select("id", { count: "exact", head: true })
            .eq("status", "cancelled"),
    ]);

    const stats = [
        {
            title: "Total Events",
            value: totalCount ?? 0,
            icon: CalendarDays,
            description: "All time",
        },
        {
            title: "Upcoming",
            value: upcomingCount ?? 0,
            icon: CheckCircle2,
            description: "Live booking",
            trend: "text-emerald-500",
        },
        {
            title: "Past",
            value: pastCount ?? 0,
            icon: Calendar,
            description: "Historical",
            trend: "text-zinc-500",
        },
        {
            title: "Cancelled",
            value: cancelledCount ?? 0,
            icon: XCircle,
            description: "Inactive",
            trend: "text-red-500",
        },
    ];

    return (
        <div className="flex flex-col gap-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-black font-display tracking-tight text-[#141827]">
                    Events Management
                </h1>
                <p className="text-zinc-500 mt-1">
                    Create, edit, and manage events across the platform.
                </p>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {stats.map((stat, index) => (
                    <div
                        key={index}
                        className="p-6 rounded-2xl bg-white border border-border/50 shadow-sm flex flex-col gap-4"
                    >
                        <div className="flex items-start justify-between">
                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                                <stat.icon className="w-6 h-6 text-primary" />
                            </div>
                        </div>
                        <div>
                            <div className="flex items-end gap-3 mb-1">
                                <h3 className="text-3xl font-black font-display tracking-tight text-[#141827]">
                                    {stat.value}
                                </h3>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-zinc-400">
                                    {stat.title}
                                </span>
                                <span className="w-1 h-1 rounded-full bg-zinc-300" />
                                <span
                                    className={`text-xs font-bold uppercase tracking-wider ${stat.trend || "text-zinc-400"
                                        }`}
                                >
                                    {stat.description}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Table component (Client Side) */}
            <AdminEventsClient />
        </div>
    );
}
