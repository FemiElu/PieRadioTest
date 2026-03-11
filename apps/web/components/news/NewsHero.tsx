"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, PlayCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { NewsArticle } from "@/lib/mock-news";
import Link from "next/link";

interface NewsHeroProps {
    articles: NewsArticle[];
}

export function NewsHero({ articles }: NewsHeroProps) {
    const [currentIndex, setCurrentIndex] = useState(0);

    const nextSlide = useCallback(() => {
        setCurrentIndex((prev) => (prev + 1) % articles.length);
    }, [articles.length]);

    const prevSlide = useCallback(() => {
        setCurrentIndex((prev) => (prev - 1 + articles.length) % articles.length);
    }, [articles.length]);

    useEffect(() => {
        const timer = setInterval(nextSlide, 5000);
        return () => clearInterval(timer);
    }, [nextSlide]);

    if (articles.length === 0) return null;

    const currentArticle = articles[currentIndex];

    return (
        <div className="relative group aspect-[16/9] md:aspect-[21/9] w-full overflow-hidden rounded-2xl md:rounded-3xl bg-zinc-100">
            {/* Article Image */}
            <div className="absolute inset-0 transition-transform duration-700 ease-in-out">
                <Image
                    src={currentArticle.imageUrl || "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&q=80&w=1200"}
                    alt={currentArticle.title}
                    fill
                    className="object-cover"
                    priority
                />
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            </div>

            {/* Content */}
            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 text-white">
                <div className="flex flex-col gap-3 md:gap-4 max-w-3xl">
                    <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-red-600 text-white text-[10px] md:text-xs uppercase font-bold tracking-widest rounded-full animate-pulse">
                            ● BREAKING
                        </span>
                        <span className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-[10px] md:text-xs uppercase font-bold tracking-widest rounded-full">
                            {currentArticle.category}
                        </span>
                    </div>

                    <h2 className="text-2xl md:text-5xl font-bold font-display leading-tight">
                        {currentArticle.title}
                    </h2>

                    <p className="text-zinc-200 text-sm md:text-lg line-clamp-2 md:line-clamp-none max-w-2xl">
                        {currentArticle.summary}
                    </p>

                    <div className="flex items-center gap-4 pt-2">
                        <Link href={`/news/${currentArticle.id}`}>
                            <Button className="bg-primary hover:bg-primary/90 text-white font-bold rounded-full px-6 md:px-8 py-6 flex items-center gap-2 text-sm md:text-base transition-all hover:scale-105 active:scale-95">
                                Read & Listen
                                <PlayCircle className="w-5 h-5" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="absolute top-1/2 -translate-y-1/2 left-4 right-4 flex justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={(e) => { e.preventDefault(); prevSlide(); }}
                    className="p-2 rounded-full bg-black/30 backdrop-blur-md text-white hover:bg-black/50 transition-all"
                >
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                    onClick={(e) => { e.preventDefault(); nextSlide(); }}
                    className="p-2 rounded-full bg-black/30 backdrop-blur-md text-white hover:bg-black/50 transition-all"
                >
                    <ChevronRight className="w-6 h-6" />
                </button>
            </div>

            {/* Indicators */}
            <div className="absolute bottom-4 right-6 md:bottom-10 md:right-10 flex gap-2">
                {articles.map((_, i) => (
                    <button
                        key={i}
                        onClick={() => setCurrentIndex(i)}
                        className={cn(
                            "h-1.5 transition-all duration-300 rounded-full",
                            i === currentIndex ? "w-8 bg-primary" : "w-2 bg-white/40 hover:bg-white/60"
                        )}
                    />
                ))}
            </div>
        </div>
    );
}
