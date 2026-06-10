"use client";

import { Fragment, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import {
    ChevronLeft,
    Share2,
    MessageSquare,
    Heart,
    Play,
    ArrowLeft,
    MoreVertical,
    Bookmark,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAudio } from "@/context/audio-context";
import { PopeyesPressRelease } from "@/components/news/PopeyesPressRelease";
import type { NewsArticle } from "@/lib/news/types";

interface ArticleDetailClientProps {
    article: NewsArticle;
}

/** Formats an ISO timestamp or legacy time string for display. */
function formatDisplayTime(ts: string | null): string {
    if (!ts) return "";
    try {
        return new Intl.DateTimeFormat("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        }).format(new Date(ts));
    } catch {
        return ts;
    }
}

/** Formats seconds into MM:SS or HH:MM:SS */
function formatSeconds(seconds: number): string {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
        return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/** Extracts YouTube Video ID from various URL formats */
function getYouTubeId(url: string | null): string | null {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

/**
 * Splits markdown content into text segments and YouTube shortcode segments.
 * Shortcode syntax: ::youtube[VIDEO_ID_OR_FULL_URL]
 * Returns an array of { type: 'text' | 'youtube', value: string }
 */
function parseYouTubeShortcodes(
    content: string,
): Array<{ type: "text"; value: string } | { type: "youtube"; videoId: string }> {
    const SHORTCODE_RE = /::youtube\[([^\]]+)\]/g;
    const segments: Array<{ type: "text"; value: string } | { type: "youtube"; videoId: string }> = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = SHORTCODE_RE.exec(content)) !== null) {
        if (match.index > lastIndex) {
            segments.push({ type: "text", value: content.slice(lastIndex, match.index) });
        }
        const videoId = getYouTubeId(match[1]) ?? match[1]; // accept raw ID or full URL
        segments.push({ type: "youtube", videoId });
        lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
        segments.push({ type: "text", value: content.slice(lastIndex) });
    }

    return segments.length > 0 ? segments : [{ type: "text", value: content }];
}

export function ArticleDetailClient({ article }: ArticleDetailClientProps) {
    const router = useRouter();
    const { playClip } = useAudio();
    const [liked, setLiked] = useState(false);
    const [likesCount, setLikesCount] = useState(article.likes_count);

    // Special Case: Popeyes Manchester Piccadilly Press Release
    // We render the custom premium layout for this specific news piece.
    if (article.slug === "popeyes-manchester-piccadilly-opening") {
        return <PopeyesPressRelease showBackToNews />;
    }

    const handleLike = () => {
        setLiked(!liked);
        setLikesCount((prev) => (liked ? prev - 1 : prev + 1));
    };

    const authorInitial = (article.author_name ?? "P").charAt(0).toUpperCase();
    const displayTime = formatDisplayTime(article.published_at ?? article.created_at);

    return (
        <div className="min-h-screen bg-white pb-24">
            {/* Mobile Top Nav (Sticky) */}
            <div className="md:hidden sticky top-16 z-40 bg-white/80 backdrop-blur-md border-b border-zinc-100 px-4 h-14 flex items-center justify-between">
                <button onClick={() => router.back()} className="p-2 -ml-2">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <span className="font-bold text-sm uppercase tracking-tight truncate max-w-[200px]">
                    {article.category}
                </span>
                <div className="flex items-center gap-1">
                    <button className="p-2">
                        <Share2 className="w-5 h-5" />
                    </button>
                    <button className="p-2">
                        <MoreVertical className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <article className="container max-w-screen-md mx-auto px-4 md:pt-10">
                {/* Desktop Back Button */}
                <button
                    onClick={() => router.back()}
                    className="hidden md:flex items-center gap-2 text-zinc-500 hover:text-primary transition-colors mb-8 group"
                >
                    <div className="p-2 rounded-full border border-zinc-100 group-hover:border-primary/20 group-hover:bg-primary/5 transition-all">
                        <ChevronLeft className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium">Back to News</span>
                </button>

                {/* Article Header */}
                <header className="flex flex-col gap-6 mb-8">
                    <div className="flex items-center gap-3 flex-wrap">
                        {article.is_breaking && (
                            <span className="px-3 py-1 bg-red-600 text-white text-[10px] md:text-xs uppercase font-bold tracking-widest rounded-full animate-pulse">
                                ● Breaking
                            </span>
                        )}
                        <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] md:text-xs font-bold uppercase tracking-widest rounded-full">
                            {article.category}
                        </span>
                        <span className="text-zinc-400 text-xs md:text-sm font-medium">{displayTime}</span>
                    </div>

                    <h1 className="text-3xl md:text-5xl font-bold font-display leading-tight text-zinc-900 uppercase italic">
                        {article.title}
                    </h1>

                    <div className="flex items-center justify-between py-4 border-y border-zinc-100">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-zinc-100 overflow-hidden flex items-center justify-center bg-primary/10 text-primary font-bold text-sm">
                                {authorInitial}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-bold">{article.author_name ?? "Pie Radio"}</span>
                                <span className="text-[10px] text-zinc-400 uppercase font-medium">
                                    Verified Contributor
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" className="rounded-full gap-2 hidden md:flex">
                                <Bookmark className="w-4 h-4" />
                                Save
                            </Button>
                            <Button size="sm" className="rounded-full gap-2">
                                <Share2 className="w-4 h-4" />
                                Share
                            </Button>
                        </div>
                    </div>
                </header>

                {/* Hero Image */}
                {article.cover_image_url && (
                    <div className="relative aspect-[16/9] w-full rounded-2xl md:rounded-3xl overflow-hidden mb-10 shadow-2xl">
                        <Image
                            src={article.cover_image_url}
                            alt={article.title}
                            fill
                            className="object-cover"
                            priority
                        />
                    </div>
                )}

                {/* Article Body */}
                <div className="prose prose-zinc max-w-none mb-12">
                    {/* Summary / Lead */}
                    {article.summary && (
                        <p className="text-xl md:text-2xl font-medium text-zinc-600 leading-relaxed mb-8 italic border-l-4 border-primary pl-6">
                            {article.summary}
                        </p>
                    )}

                    {/*
                     * Article content — supports ::youtube[VIDEO_ID_OR_URL] shortcodes
                     * embedded anywhere in the markdown body. Each shortcode is lifted
                     * out of the text and rendered as a responsive iframe.
                     */}
                    <div className="text-lg leading-relaxed text-zinc-800 space-y-6">
                        {parseYouTubeShortcodes(article.content).map((segment, i) =>
                            segment.type === "youtube" ? (
                                <div
                                    key={i}
                                    className="not-prose my-8 aspect-video w-full rounded-2xl md:rounded-3xl overflow-hidden shadow-xl border border-zinc-100"
                                >
                                    <iframe
                                        width="100%"
                                        height="100%"
                                        src={`https://www.youtube.com/embed/${segment.videoId}`}
                                        title="YouTube video player"
                                        frameBorder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    />
                                </div>
                            ) : (
                                <ReactMarkdown
                                    key={i}
                                    components={{
                                        // Ensure all links open safely in a new tab
                                        a: ({ href, children }) => (
                                            <a
                                                href={href}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors"
                                            >
                                                {children}
                                            </a>
                                        ),
                                    }}
                                >
                                    {segment.value}
                                </ReactMarkdown>
                            )
                        )}
                    </div>

                    {/* Article-level YouTube embed (set via the YouTube URL field) */}
                    {getYouTubeId(article.youtube_url) && (
                        <div className="not-prose my-10 aspect-video w-full rounded-2xl md:rounded-3xl overflow-hidden shadow-xl border border-zinc-100">
                            <iframe
                                width="100%"
                                height="100%"
                                src={`https://www.youtube.com/embed/${getYouTubeId(article.youtube_url)}`}
                                title="YouTube video player"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                        </div>
                    )}

                    {/* External Link — Button asChild renders a single <a>, avoiding invalid button-in-anchor HTML */}
                    {article.external_url && (
                        <div className="not-prose my-8 flex justify-center">
                            <Button asChild size="lg" className="rounded-full px-8 font-bold gap-2">
                                <a
                                    href={article.external_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    Read More
                                    <ArrowLeft className="w-4 h-4 rotate-180" />
                                </a>
                            </Button>
                        </div>
                    )}

                    {/* Inline Audio Moments */}
                    {article.audio_moments && article.audio_moments.length > 0 && (
                        <div className="not-prose my-10 p-6 rounded-3xl bg-zinc-900 text-white flex flex-col gap-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Play className="w-4 h-4 text-primary fill-current" />
                                    <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                                        Audio Exclusive
                                    </span>
                                </div>
                                <span className="text-[10px] font-mono text-zinc-500">
                                    Listen: {formatSeconds(article.audio_moments[0].time_seconds)}
                                </span>
                            </div>
                            <h4 className="text-lg font-bold">{article.audio_moments[0].label}</h4>
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() =>
                                        playClip(
                                            article.audio_preview_url ??
                                            "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
                                            article.audio_moments?.[0].label ?? article.title,
                                            article.author_name ?? "Pie Radio",
                                            article.cover_image_url ?? undefined,
                                        )
                                    }
                                    className="w-12 h-12 rounded-full bg-primary flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
                                >
                                    <Play className="w-5 h-5 fill-current" />
                                </button>
                                <div className="flex-1">
                                    <div className="h-1 bg-zinc-800 rounded-full relative">
                                        <div className="absolute inset-y-0 left-0 w-1/4 bg-primary rounded-full" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Engagement Shell */}
                <div className="flex items-center justify-between py-6 border-y border-zinc-100 mb-12">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={handleLike}
                            className={cn(
                                "flex items-center gap-2 transition-colors",
                                liked ? "text-primary" : "text-zinc-500 hover:text-primary"
                            )}
                        >
                            <Heart className={cn("w-6 h-6", liked && "fill-current")} />
                            <span className="text-sm font-bold">{likesCount.toLocaleString()}</span>
                        </button>
                        <button className="flex items-center gap-2 text-zinc-500 hover:text-primary transition-colors">
                            <MessageSquare className="w-6 h-6" />
                            <span className="text-sm font-bold">{article.comments_count}</span>
                        </button>
                    </div>
                    <button className="text-zinc-500 hover:text-primary transition-colors">
                        <Share2 className="w-6 h-6" />
                    </button>
                </div>

                {/* Discussion Section */}
                <div className="flex flex-col gap-6">
                    <h3 className="text-xl font-bold font-display">Discussion</h3>
                    <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-full bg-zinc-100 overflow-hidden flex-shrink-0" />
                        <div className="flex-1">
                            <textarea
                                placeholder="What's your take? Write a comment..."
                                className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[100px]"
                            />
                            <div className="flex justify-end mt-2">
                                <Button size="sm" className="rounded-full px-6">
                                    Post
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </article>
        </div>
    );
}
