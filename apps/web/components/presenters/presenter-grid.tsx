"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

// Presenter type matching database schema
export interface Presenter {
    id: string;
    full_name: string | null;
    username: string | null;
    slug: string | null;
    avatar_url: string | null;
    bio: string | null;
    is_live: boolean | null;
    presenter_meta?: {
        category: string | null;
        instagram_handle: string | null;
        twitter_handle: string | null;
    } | null;
    shows?: {
        title: string;
        description: string | null;
    }[];
}

// Category filter options (hardcoded as requested)
export const PRESENTER_CATEGORIES = [
    { id: "all", label: "Main Station" },
    { id: "80s", label: "80s Hits" },
    { id: "afrobeats", label: "Afrobeats" },
    { id: "chill", label: "Chill Vibes" },
    { id: "rock", label: "Rock Classics" },
];

interface PresenterGridProps {
    presenters: Presenter[];
    selectedCategory?: string;
    onCategoryChange?: (category: string) => void;
}

export function PresenterGrid({ presenters, selectedCategory = "all", onCategoryChange }: PresenterGridProps) {
    // Filter presenters by category if not "all"
    const filteredPresenters = selectedCategory === "all"
        ? presenters
        : presenters.filter(p => p.presenter_meta?.category?.toLowerCase() === selectedCategory);

    if (presenters.length === 0) {
        return (
            <div className="py-24 text-center space-y-4 bg-muted/30 rounded-3xl border-2 border-dashed border-border/60">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                    <span className="text-3xl">🎙️</span>
                </div>
                <div className="space-y-1">
                    <p className="text-xl font-bold font-display">No presenters found</p>
                    <p className="text-muted-foreground">Our presenters are currently backstage. Check back soon!</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Category Filter Pills */}
            {onCategoryChange && (
                <div className="flex flex-wrap items-center justify-center gap-3">
                    {PRESENTER_CATEGORIES.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => onCategoryChange(cat.id)}
                            className={cn(
                                "px-6 py-3 rounded-full text-sm font-bold transition-all duration-200 border-2",
                                selectedCategory === cat.id
                                    ? "bg-primary border-primary text-white shadow-lg shadow-primary/20"
                                    : "bg-white border-border text-foreground hover:border-zinc-300 hover:bg-zinc-50"
                            )}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>
            )}

            {/* Presenter Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredPresenters.map((presenter) => (
                    <Link
                        key={presenter.id}
                        href={`/presenters/${presenter.slug || presenter.username || presenter.id}`}
                        className="group relative flex flex-col rounded-3xl overflow-hidden border border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2"
                    >
                        {/* Image Area with Gradient Background */}
                        <div className="aspect-[4/5] relative overflow-hidden">
                            {/* Gradient Background */}
                            <div className="absolute inset-0 bg-gradient-to-br from-primary via-violet-600 to-purple-700" />

                            {/* Presenter Image */}
                            {presenter.avatar_url ? (
                                <Image
                                    src={presenter.avatar_url}
                                    alt={presenter.full_name || presenter.username || "Presenter"}
                                    fill
                                    className="object-cover object-top transition-transform duration-700 group-hover:scale-105"
                                />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-white/20 font-display font-black text-8xl">
                                        {(presenter.full_name || presenter.username || "P").charAt(0).toUpperCase()}
                                    </span>
                                </div>
                            )}

                            {/* Live Indicator */}
                            {presenter.is_live && (
                                <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600 text-white text-[10px] font-black uppercase tracking-widest animate-pulse shadow-lg">
                                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                    On Air
                                </div>
                            )}

                            {/* Gradient Overlay at Bottom */}
                            <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/40 to-transparent" />
                        </div>

                        {/* Info Area */}
                        <div className="p-5 bg-white">
                            <h3 className="text-lg font-bold font-display tracking-tight text-foreground group-hover:text-primary transition-colors">
                                {presenter.full_name || presenter.username || "Unknown Presenter"}
                            </h3>

                            {/* Show Info */}
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                                {presenter.shows?.[0]?.title || presenter.presenter_meta?.category || "Presenter"}
                                {presenter.shows?.[0] && " • Weekdays"}
                            </p>

                            {/* More Link */}
                            <div className="mt-3 flex items-center gap-2 text-primary text-sm font-bold group-hover:gap-3 transition-all">
                                More
                                <ArrowRight className="w-4 h-4" />
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {/* Empty state for filtered results */}
            {filteredPresenters.length === 0 && presenters.length > 0 && (
                <div className="py-16 text-center text-muted-foreground">
                    No presenters found in this category.
                </div>
            )}
        </div>
    );
}
