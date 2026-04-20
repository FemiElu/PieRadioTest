"use client";

import { useState } from "react";
import { Search, SlidersHorizontal, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { EVENT_CATEGORIES, EVENT_CATEGORY_LABELS } from "@/lib/events/types";

const CATEGORIES = [
    { id: "all", label: "All" },
    ...EVENT_CATEGORIES.map(cat => ({ id: cat, label: EVENT_CATEGORY_LABELS[cat] }))
];

interface FilterBarProps {
    onSearch: (query: string) => void;
    onCategoryChange: (category: string) => void;
    onSortChange: (sort: string) => void;
    resultsCount: number;
}

export function FilterBar({ onSearch, onCategoryChange, onSortChange, resultsCount }: FilterBarProps) {
    const [activeCategory, setActiveCategory] = useState("all");
    const [isFiltersOpen, setIsFiltersOpen] = useState(false);

    const handleCategoryClick = (id: string) => {
        setActiveCategory(id);
        onCategoryChange(id);
    };

    return (
        <div className="space-y-4">
            {/* Search and Main Controls */}
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search events, artists, venues..."
                        className="pl-9 bg-muted/30 border-border/50"
                        onChange={(e) => onSearch(e.target.value)}
                    />
                </div>
                <Button
                    variant="outline"
                    size="icon"
                    className={cn("shrink-0", isFiltersOpen && "bg-primary/10 text-primary border-primary/50")}
                    onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                >
                    <SlidersHorizontal className="w-4 h-4" />
                </Button>
            </div>

            {/* Category Chips - Scrollable on mobile */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
                {CATEGORIES.map((cat) => (
                    <button
                        key={cat.id}
                        onClick={() => handleCategoryClick(cat.id)}
                        className={cn(
                            "px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-widest whitespace-nowrap transition-all border",
                            activeCategory === cat.id
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground border-transparent"
                        )}
                    >
                        {cat.label}
                    </button>
                ))}
            </div>

            {/* Results Count & Sort */}
            <div className="flex items-center justify-between pt-2">
                <span className="text-sm font-bold text-zinc-400 uppercase tracking-widest">
                    {resultsCount} {resultsCount === 1 ? 'event' : 'events'} found
                </span>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 gap-1 text-zinc-500 font-bold uppercase tracking-widest hover:text-primary transition-colors text-[10px]">
                            Sort <ChevronDown className="w-3 h-3" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onSortChange("recommended")} className="font-bold text-xs uppercase tracking-widest">Recommended</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onSortChange("date_asc")} className="font-bold text-xs uppercase tracking-widest">Date (Soonest)</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onSortChange("price_asc")} className="font-bold text-xs uppercase tracking-widest">Price (Low to High)</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onSortChange("popular")} className="font-bold text-xs uppercase tracking-widest">Popular</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
}
