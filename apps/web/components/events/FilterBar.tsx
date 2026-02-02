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
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const CATEGORIES = [
    { id: "all", label: "All" },
    { id: "pop", label: "Pop" },
    { id: "jazz", label: "Jazz" },
    { id: "electronic", label: "Electronic" },
    { id: "rock", label: "Rock" },
    { id: "hiphop", label: "Hip Hop" },
    { id: "acoustic", label: "Acoustic" },
];

interface FilterBarProps {
    onSearch: (query: string) => void;
    onCategoryChange: (category: string) => void;
    onSortChange: (sort: string) => void;
}

export function FilterBar({ onSearch, onCategoryChange, onSortChange }: FilterBarProps) {
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
                            "px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                            activeCategory === cat.id
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                    >
                        {cat.label}
                    </button>
                ))}
            </div>

            {/* Results Count & Sort (Visual only for now) */}
            <div className="flex items-center justify-between pt-2">
                <span className="text-sm text-muted-foreground">6 events found</span>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 gap-1 text-muted-foreground hover:text-foreground">
                            Recommended <ChevronDown className="w-4 h-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onSortChange("recommended")}>Recommended</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onSortChange("date_asc")}>Date (Soonest)</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onSortChange("price_asc")}>Price (Low to High)</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onSortChange("popular")}>Popular</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
}
