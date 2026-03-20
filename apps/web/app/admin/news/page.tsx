import { createClient } from "@/lib/supabase/server";
import { getAllArticlesAdmin } from "@/lib/news/queries";
import { AdminNewsClient } from "./client";
import {
    FileText,
    Newspaper,
    CheckCircle2,
    Archive as ArchiveIcon,
} from "lucide-react";

export const metadata = {
    title: "News Management | Pie Radio Admin",
};

export default async function AdminNewsPage() {
    const supabase = await createClient();

    // Load all articles to compute stats
    const { articles, total } = await getAllArticlesAdmin(supabase, {
        limit: 1, // We only need the total count, but we also want breakdown. Actually, easiest is no limit to compute stats, or multiple queries. 
        // To be efficient, let's just use the server client to run count queries.
    });

    // Fast count queries
    const [
        { count: totalCount },
        { count: publishedCount },
        { count: draftCount },
        { count: archivedCount },
    ] = await Promise.all([
        supabase.from("news_articles").select("id", { count: "exact", head: true }),
        supabase
            .from("news_articles")
            .select("id", { count: "exact", head: true })
            .eq("status", "published"),
        supabase
            .from("news_articles")
            .select("id", { count: "exact", head: true })
            .eq("status", "draft"),
        supabase
            .from("news_articles")
            .select("id", { count: "exact", head: true })
            .eq("status", "archived"),
    ]);

    const stats = [
        {
            title: "Total Articles",
            value: totalCount ?? 0,
            icon: Newspaper,
            description: "All time",
        },
        {
            title: "Published",
            value: publishedCount ?? 0,
            icon: CheckCircle2,
            description: "Live on site",
            trend: "text-emerald-500",
        },
        {
            title: "Drafts",
            value: draftCount ?? 0,
            icon: FileText,
            description: "Work in progress",
            trend: "text-amber-500",
        },
        {
            title: "Archived",
            value: archivedCount ?? 0,
            icon: ArchiveIcon,
            description: "Unpublished",
            trend: "text-zinc-500",
        },
    ];

    return (
        <div className="flex flex-col gap-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-black font-display tracking-tight text-[#141827]">
                    News Management
                </h1>
                <p className="text-zinc-500 mt-1">
                    Create, edit, and manage news articles across the platform.
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
            <AdminNewsClient />
        </div>
    );
}
