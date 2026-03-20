"use client";

import Image from "next/image";
import Link from "next/link";
import { MessageSquare, Share2, Heart, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NewsArticleCard } from "@/lib/news/types";
import { useAudio } from "@/context/audio-context";
import { Button } from "../ui/button";

interface CardProps {
    article: NewsArticleCard;
    className?: string;
}

function formatDisplayTime(ts: string | null): string {
    if (!ts) return "";
    try {
        return new Intl.DateTimeFormat("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric"
        }).format(new Date(ts));
    } catch {
        return ts;
    }
}

// Tier 1: Breaking (Already covered by Hero, but maybe a smaller version for feed)
export function BreakingCard({ article, className }: CardProps) {
    return (
        <Link
            href={`/news/${article.slug}`}
            className={cn("group relative block overflow-hidden rounded-3xl bg-zinc-900 aspect-[16/10]", className)}
        >
            <Image
                src={article.cover_image_url || ""}
                alt={article.title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105 opacity-80"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
            <div className="absolute bottom-0 p-6 text-white">
                <span className="inline-block px-2 py-0.5 bg-red-600 text-[10px] font-bold rounded-full mb-3 uppercase tracking-wider">
                    Breaking
                </span>
                <h3 className="text-xl md:text-2xl font-bold font-display group-hover:text-primary transition-colors line-clamp-2">
                    {article.title}
                </h3>
                <p className="mt-2 text-sm text-zinc-300 line-clamp-1">{article.summary}</p>
            </div>
        </Link>
    );
}

// Tier 2: Trending (Medium)
export function TrendingCard({ article, className }: CardProps) {
    return (
        <Link
            href={`/news/${article.slug}`}
            className={cn("group flex flex-col gap-4 p-4 rounded-3xl bg-white border border-zinc-100 hover:border-primary/20 hover:shadow-xl transition-all duration-300", className)}
        >
            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl">
                <Image
                    src={article.cover_image_url || ""}
                    alt={article.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute top-3 left-3">
                    <span className="px-2 py-1 bg-white/90 backdrop-blur-sm text-[10px] font-bold rounded-lg text-zinc-800 uppercase">
                        {article.category}
                    </span>
                </div>
            </div>
            <div className="flex flex-col gap-2">
                <h3 className="text-lg font-bold font-display leading-tight group-hover:text-primary transition-colors line-clamp-2">
                    {article.title}
                </h3>
                <p className="text-sm text-zinc-500 line-clamp-2">{article.summary}</p>
                <div className="flex items-center justify-between mt-2 pt-4 border-t border-zinc-50">
                    <div className="flex items-center gap-3 text-zinc-400">
                        <span className="flex items-center gap-1 text-xs">
                            <Heart className="w-3.5 h-3.5" /> {article.likes_count}
                        </span>
                        <span className="flex items-center gap-1 text-xs">
                            <MessageSquare className="w-3.5 h-3.5" /> {article.comments_count}
                        </span>
                    </div>
                    <span className="text-[10px] text-zinc-400 font-medium uppercase">{formatDisplayTime(article.published_at ?? article.created_at)}</span>
                </div>
            </div>
        </Link>
    );
}

// Tier 3: Update (Small)
export function UpdateCard({ article, className }: CardProps) {
    return (
        <Link
            href={`/news/${article.slug}`}
            className={cn("group flex gap-4 p-3 rounded-2xl hover:bg-zinc-50 transition-colors", className)}
        >
            <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-zinc-100">
                <Image
                    src={article.cover_image_url || "/assets/placeholder.png"}
                    alt={article.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                />
            </div>
            <div className="flex flex-col justify-center gap-1">
                <span className="text-[10px] text-primary font-bold uppercase tracking-wider">{article.category}</span>
                <h3 className="text-sm font-bold leading-snug group-hover:text-primary transition-colors line-clamp-2">
                    {article.title}
                </h3>
                <span className="text-[10px] text-zinc-400">{formatDisplayTime(article.published_at ?? article.created_at)}</span>
            </div>
        </Link>
    );
}

// Tier 4: Archive (Minimal)
export function ArchiveCard({ article, className }: CardProps) {
    return (
        <Link
            href={`/news/${article.slug}`}
            className={cn("group flex items-center justify-between py-4 border-b border-zinc-100 hover:px-2 transition-all", className)}
        >
            <div className="flex flex-col gap-1">
                <h3 className="text-sm font-semibold group-hover:text-primary transition-colors">
                    {article.title}
                </h3>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] px-1.5 py-0.5 bg-zinc-100 text-zinc-500 rounded uppercase font-bold">{article.category}</span>
                    <span className="text-[10px] text-zinc-400">{formatDisplayTime(article.published_at ?? article.created_at)}</span>
                </div>
            </div>
            <Share2 className="w-4 h-4 text-zinc-300 group-hover:text-primary transition-colors" />
        </Link>
    );
}

// Audio Inline Card
export function AudioCard({ article, className }: CardProps) {
    const { playClip } = useAudio();

    return (
        <div className={cn("p-6 rounded-3xl bg-zinc-900 text-white relative overflow-hidden", className)}>
            <div className="absolute top-0 right-0 p-4 opacity-20">
                <Play className="w-24 h-24 text-white" />
            </div>
            <div className="relative z-10 flex flex-col gap-4">
                <div className="flex items-center gap-2">
                    <div className="px-2 py-0.5 bg-primary text-[10px] font-bold rounded-full uppercase">Audio Exclusive</div>
                    <span className="text-[10px] text-zinc-400">{article.category}</span>
                </div>
                <h3 className="text-xl font-bold font-display">{article.title}</h3>
                <p className="text-sm text-zinc-400 line-clamp-2">{article.summary}</p>

                <div className="flex items-center gap-4 mt-2">
                    <Button
                        onClick={() => playClip(
                            article.audio_preview_url || "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
                            article.title,
                            article.author_name ?? "Pie Radio",
                            article.cover_image_url ?? undefined
                        )}
                        className="bg-white text-black hover:bg-zinc-200 rounded-full font-bold flex items-center gap-2"
                    >
                        <Play className="w-4 h-4 fill-current" />
                        Play Clip
                    </Button>
                    <div className="flex-1 h-1 bg-zinc-800 rounded-full relative overflow-hidden">
                        <div className="absolute inset-y-0 left-0 w-1/3 bg-primary" />
                    </div>
                    <span className="text-xs font-mono text-zinc-500">02:00</span>
                </div>
            </div>
        </div>
    );
}
