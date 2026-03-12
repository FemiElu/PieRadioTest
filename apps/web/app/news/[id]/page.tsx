"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
    ChevronLeft,
    Share2,
    MessageSquare,
    Heart,
    Play,
    Clock,
    ArrowLeft,
    MoreVertical,
    Bookmark
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { MOCK_ARTICLES, NewsArticle } from "@/lib/mock-news";
import { Header } from "@/components/layout/header";
import { cn } from "@/lib/utils";
import { useAudio } from "@/context/audio-context";

export default function ArticleDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { playClip } = useAudio();
    const [article, setArticle] = useState<NewsArticle | null>(null);
    const [liked, setLiked] = useState(false);
    const [likesCount, setLikesCount] = useState(0);

    useEffect(() => {
        const found = MOCK_ARTICLES.find(a => a.id === params.id);
        if (found) {
            setArticle(found);
            setLikesCount(found.likes || 0);
        }
    }, [params.id]);

    if (!article) return null;

    const handleLike = () => {
        setLiked(!liked);
        setLikesCount(prev => liked ? prev - 1 : prev + 1);
    };

    return (
        <div className="min-h-screen bg-white pb-24">
            <Header />

            {/* Mobile Top Nav (Sticky) */}
            <div className="md:hidden sticky top-16 z-40 bg-white/80 backdrop-blur-md border-b border-zinc-100 px-4 h-14 flex items-center justify-between">
                <button onClick={() => router.back()} className="p-2 -ml-2">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <span className="font-bold text-sm uppercase tracking-tight truncate max-w-[200px]">
                    {article.category}
                </span>
                <div className="flex items-center gap-1">
                    <button className="p-2"><Share2 className="w-5 h-5" /></button>
                    <button className="p-2"><MoreVertical className="w-5 h-5" /></button>
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
                    <div className="flex items-center gap-3">
                        <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] md:text-xs font-bold uppercase tracking-widest rounded-full">
                            {article.category}
                        </span>
                        <span className="text-zinc-400 text-xs md:text-sm font-medium">{article.time}</span>
                    </div>

                    <h1 className="text-3xl md:text-5xl font-bold font-display leading-tight text-zinc-900 uppercase italic">
                        {article.title}
                    </h1>

                    <div className="flex items-center justify-between py-4 border-y border-zinc-100">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-zinc-100 overflow-hidden">
                                <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-bold">
                                    {article.author?.[0]}
                                </div>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-bold">{article.author}</span>
                                <span className="text-[10px] text-zinc-400 uppercase font-medium">Verified Contributor</span>
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
                <div className="relative aspect-[16/9] w-full rounded-2xl md:rounded-3xl overflow-hidden mb-10 shadow-2xl">
                    <Image
                        src={article.imageUrl || "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&q=80&w=1200"}
                        alt={article.title}
                        fill
                        className="object-cover"
                        priority
                    />
                </div>

                {/* Article Body */}
                <div className="prose prose-zinc max-w-none mb-12">
                    <p className="text-xl md:text-2xl font-medium text-zinc-600 leading-relaxed mb-8 italic border-l-4 border-primary pl-6">
                        {article.summary}
                    </p>

                    <div className="text-lg leading-relaxed text-zinc-800 space-y-6">
                        <p>
                            Pie Radio brings you the latest from the heart of the scene. In a surprising turn of events, this headline has captured the attention of fans and industry insiders alike. Our team on the ground is working around the clock to bring you exclusive updates.
                        </p>

                        {/* Inline Audio Moments */}
                        {article.audio_moments && article.audio_moments.length > 0 && (
                            <div className="my-10 p-6 rounded-3xl bg-zinc-900 text-white flex flex-col gap-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Play className="w-4 h-4 text-primary fill-current" />
                                        <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">Audio Exclusive</span>
                                    </div>
                                    <span className="text-[10px] font-mono text-zinc-500">Listen: {article.audio_moments[0].timestamp}</span>
                                </div>
                                <h4 className="text-lg font-bold">{article.audio_moments[0].label}</h4>
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => playClip(
                                            article.audio_preview || "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
                                            article.audio_moments?.[0].label || article.title,
                                            article.author,
                                            article.imageUrl
                                        )}
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

                        <p>
                            Sources confirm that the impact of this development will be felt across the entire entertainment landscape. As we continue to monitor the situation, stay tuned to Pie Radio for more &quot;Read &amp; Listen&quot; exclusive content.
                        </p>
                    </div>
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
                            <span className="text-sm font-bold">{likesCount}</span>
                        </button>
                        <button className="flex items-center gap-2 text-zinc-500 hover:text-primary transition-colors">
                            <MessageSquare className="w-6 h-6" />
                            <span className="text-sm font-bold">{article.comments || 0}</span>
                        </button>
                    </div>
                    <button className="text-zinc-500 hover:text-primary transition-colors">
                        <Share2 className="w-6 h-6" />
                    </button>
                </div>

                {/* Comments Section Peak */}
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
                                <Button size="sm" className="rounded-full px-6">Post</Button>
                            </div>
                        </div>
                    </div>
                </div>
            </article>
        </div>
    );
}
