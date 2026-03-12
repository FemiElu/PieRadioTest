"use client";

import { useState } from "react";
import { Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface InterestChipsProps {
    chips: string[];
    selectedChips: string[];
    onToggle: (chip: string) => void;
    onManage: () => void;
}

export function InterestChips({
    chips,
    selectedChips,
    onToggle,
    onManage
}: InterestChipsProps) {
    return (
        <div className="flex items-center gap-2 overflow-x-auto pb-4 no-scrollbar -mx-4 px-4 md:mx-0 md:px-0 scroll-smooth">
            {chips.map((chip) => {
                const isSelected = selectedChips.includes(chip);
                return (
                    <button
                        key={chip}
                        onClick={() => onToggle(chip)}
                        className={cn(
                            "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 border",
                            isSelected
                                ? "bg-primary text-white border-primary shadow-sm"
                                : "bg-white text-zinc-600 border-zinc-200 hover:border-primary hover:text-primary"
                        )}
                    >
                        {chip}
                    </button>
                );
            })}

            <Button
                variant="ghost"
                size="sm"
                onClick={onManage}
                className="flex items-center gap-1.5 text-zinc-500 hover:text-primary rounded-full px-4"
            >
                <Settings className="w-4 h-4" />
                <span className="text-sm font-medium">Manage</span>
            </Button>
        </div>
    );
}
