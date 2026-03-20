"use client";

import type { NewsArticleCard } from "@/lib/news/types";
import {
    BreakingCard,
    TrendingCard,
    UpdateCard,
    ArchiveCard,
    AudioCard
} from "./ArticleCards";
import { PollCard } from "./PollCard";
import { Button } from "@/components/ui/button";

interface NewsFeedProps {
    articles: NewsArticleCard[];
    totalArticles: number;
}

export function NewsFeed({ articles, totalArticles }: NewsFeedProps) {
    // Cadence Pattern:
    // - 4 small cards (UpdateCard)
    // - 1 medium card (TrendingCard)
    // - 4 small cards (UpdateCard)
    // - 1 audio inline card (AudioCard)
    // - 2 small cards (UpdateCard)
    // - 1 poll/engagement card (PollCard)
    // Repeat

    const renderFeed = () => {
        const feedElements = [];
        let articleIdx = 0;

        while (articleIdx < articles.length) {
            // 4 small cards
            const group1 = articles.slice(articleIdx, articleIdx + 4);
            articleIdx += 4;
            if (group1.length > 0) {
                feedElements.push(
                    <div key={`small-1-${articleIdx}`} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {group1.map(art => <UpdateCard key={art.id} article={art} />)}
                    </div>
                );
            }

            // 1 medium card
            if (articleIdx < articles.length) {
                const mediumArt = articles[articleIdx];
                articleIdx += 1;
                feedElements.push(
                    <TrendingCard key={`medium-${mediumArt.id}`} article={mediumArt} className="my-6" />
                );
            }

            // 4 small cards
            const group2 = articles.slice(articleIdx, articleIdx + 4);
            articleIdx += 4;
            if (group2.length > 0) {
                feedElements.push(
                    <div key={`small-2-${articleIdx}`} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {group2.map(art => <UpdateCard key={art.id} article={art} />)}
                    </div>
                );
            }

            // 1 audio card
            if (articleIdx < articles.length) {
                const audioArt = articles.find(a => a.tier === 'audio' && articles.indexOf(a) >= articleIdx) || articles[articleIdx];
                // Note: In real app, we'd pick the next available audio tier, but for now just take the next one
                articleIdx += 1;
                feedElements.push(
                    <AudioCard key={`audio-${audioArt.id}`} article={audioArt} className="my-6" />
                );
            }

            // 2 small cards
            const group3 = articles.slice(articleIdx, articleIdx + 2);
            articleIdx += 2;
            if (group3.length > 0) {
                feedElements.push(
                    <div key={`small-3-${articleIdx}`} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {group3.map(art => <UpdateCard key={art.id} article={art} />)}
                    </div>
                );
            }

            // 1 poll card
            if (articleIdx < articles.length) {
                const pollArt = articles.find(a => a.tier === 'poll') || articles[articleIdx];
                articleIdx += 1;
                feedElements.push(
                    <PollCard key={`poll-${pollArt.id}`} article={pollArt} className="my-6" />
                );
            }
        }

        return feedElements;
    };

    const hasMore = articles.length < totalArticles;

    return (
        <div className="flex flex-col gap-6">
            {renderFeed()}

            <div className="flex justify-center pt-12 pb-8">
                {hasMore ? (
                    <Button variant="outline" className="rounded-full px-10 h-12 font-bold hover:bg-zinc-50 transition-all">
                        Load More Articles
                    </Button>
                ) : (
                    <div className="flex flex-col items-center gap-3 text-zinc-400 animate-fade-in">
                        <div className="h-px w-12 bg-zinc-100" />
                        <p className="text-sm font-medium italic">
                            You&apos;re all caught up for now
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
