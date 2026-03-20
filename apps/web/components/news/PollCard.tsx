"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { NewsArticleCard } from "@/lib/news/types";

interface PollCardProps {
    article: NewsArticleCard;
    className?: string;
}

export function PollCard({ article, className }: PollCardProps) {
    const [voted, setVoted] = useState(false);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);

    const totalVotes = article.results?.reduce((a, b) => a + b, 0) || 100;

    const handleVote = (index: number) => {
        if (voted) return;
        setSelectedOption(index);
        setVoted(true);
    };

    return (
        <div className={cn("p-6 rounded-3xl bg-zinc-50 border border-zinc-100 flex flex-col gap-6", className)}>
            <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Pie Radio Poll</span>
                <h3 className="text-lg font-bold font-display leading-tight">{article.title}</h3>
            </div>

            <div className="flex flex-col gap-3">
                {article.options?.map((option, index) => {
                    const percentage = Math.round(((article.results?.[index] || 0) / totalVotes) * 100);
                    const isSelected = selectedOption === index;

                    return (
                        <button
                            key={index}
                            disabled={voted}
                            onClick={() => handleVote(index)}
                            className={cn(
                                "relative w-full text-left p-4 rounded-xl border transition-all duration-300 overflow-hidden",
                                voted ? "cursor-default border-zinc-200" : "hover:border-primary border-zinc-200 hover:bg-white",
                                isSelected && "border-primary"
                            )}
                        >
                            {/* Progress Background */}
                            {voted && (
                                <div
                                    className="absolute inset-y-0 left-0 bg-primary/10 transition-all duration-1000"
                                    style={{ width: `${percentage}%` }}
                                />
                            )}

                            <div className="relative z-10 flex items-center justify-between">
                                <span className={cn("text-sm font-semibold", isSelected && "text-primary")}>
                                    {option}
                                </span>
                                {voted && (
                                    <div className="flex items-center gap-2">
                                        {isSelected && <Check className="w-4 h-4 text-primary" />}
                                        <span className="text-xs font-bold text-zinc-500">{percentage}%</span>
                                    </div>
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>

            <div className="flex items-center justify-between text-[10px] font-medium text-zinc-400 uppercase tracking-wider">
                <span>{totalVotes} Votes</span>
                {voted ? (
                    <span className="text-primary italic">Thanks for voting!</span>
                ) : (
                    <span>Select an option to vote</span>
                )}
            </div>
        </div>
    );
}
