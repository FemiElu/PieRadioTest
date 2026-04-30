"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, User } from "lucide-react";
import { memo, useMemo } from "react";
import { cn } from "@/lib/utils";
import { LikeButton } from "@/components/shared/like-button";
import { toggleLikedPresenter } from "@/app/actions/favourites";

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
  role?: string | null;
  shows?: {
    title: string;
    description: string | null;
  }[];
}

// Category filter options (hardcoded as requested)
export const PRESENTER_CATEGORIES = [
  { id: "all", label: "All" },
  { id: "afrobeats", label: "Afrobeats" },
  { id: "amapiano", label: "Amapiano" },
  { id: "rap-hiphop", label: "Rap & Hiphop" },
  { id: "rnb", label: "R&B" },
  { id: "house", label: "House" },
  { id: "sports", label: "Sports" },
  { id: "alternative", label: "Alternative" },
  { id: "dancehall", label: "Dancehall" }
];

interface PresenterGridProps {
  presenters: Presenter[];
  selectedCategory?: string;
  onCategoryChange?: (category: string) => void;
  clickable?: boolean;
  likedPresenterIds?: string[];
}

const PresenterCard = memo(function PresenterCard({
  presenter,
  clickable,
  priority = false,
  isLiked = false,
}: {
  presenter: Presenter;
  clickable: boolean;
  priority?: boolean;
  isLiked?: boolean;
}) {
  const CardContent = (
    <>
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
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            priority={priority}
            className={cn(
              "object-cover transition-transform duration-700",
              clickable && "group-hover:scale-105",
            )}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-[1px]">
            <div className="relative flex flex-col items-center justify-center">
              <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center border border-white/20 shadow-xl mb-4 group-hover:scale-110 transition-transform duration-500">
                <User className="w-12 h-12 text-white/40 stroke-[1.5]" />
              </div>
              <span className="text-white/20 font-display font-black text-6xl uppercase">
                {(presenter.full_name || presenter.username || "P").charAt(0)}
              </span>
            </div>
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
        <h3
          className={cn(
            "text-lg font-bold font-display tracking-tight text-foreground transition-colors",
            clickable && "group-hover:text-primary",
          )}
        >
          {presenter.full_name || presenter.username || "Unknown Presenter"}
        </h3>

        {/* Show Info */}
        <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
          {presenter.role ||
            presenter.shows?.[0]?.title ||
            (Array.isArray(presenter.presenter_meta)
              ? presenter.presenter_meta[0]?.category
              : presenter.presenter_meta?.category) ||
            "Presenter"}
          {presenter.shows?.[0] && " • Weekdays"}
        </p>

        {/* More Link / Like Row */}
        <div className="mt-3 flex items-center justify-between">
          {clickable && (
            <div className="flex items-center gap-2 text-primary text-sm font-bold group-hover:gap-3 transition-all">
              More
              <ArrowRight className="w-4 h-4" />
            </div>
          )}
          <LikeButton
            isLiked={isLiked}
            onToggle={() => toggleLikedPresenter(presenter.id)}
            size="sm"
            className="ml-auto text-muted-foreground"
          />
        </div>
      </div>
    </>
  );

  if (!clickable) {
    return (
      <div className="group relative flex flex-col rounded-3xl overflow-hidden border border-border/50">
        {CardContent}
      </div>
    );
  }

  return (
    <Link
      href={`/presenters/${presenter.slug || presenter.username || presenter.id}`}
      className="group relative flex flex-col rounded-3xl overflow-hidden border border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2"
    >
      {CardContent}
    </Link>
  );
});

export function PresenterGrid({
  presenters,
  selectedCategory = "all",
  onCategoryChange,
  clickable = true,
  likedPresenterIds = [],
}: PresenterGridProps) {
  const filteredPresenters = useMemo(
    () =>
      selectedCategory === "all"
        ? presenters
        : presenters.filter((p) => {
          const meta = Array.isArray(p.presenter_meta)
            ? p.presenter_meta[0]
            : p.presenter_meta;
          return meta?.category?.toLowerCase() === selectedCategory;
        }),
    [presenters, selectedCategory],
  );

  if (presenters.length === 0) {
    return (
      <div className="py-24 text-center space-y-4 bg-muted/30 rounded-3xl border-2 border-dashed border-border/60">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
          <span className="text-3xl">🎙️</span>
        </div>
        <div className="space-y-1">
          <p className="text-xl font-bold font-display">No presenters found</p>
          <p className="text-muted-foreground">
            Our presenters are currently backstage. Check back soon!
          </p>
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
                  : "bg-white border-border text-foreground hover:border-zinc-300 hover:bg-zinc-50",
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>
      )}

      {/* Presenter Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredPresenters.map((presenter, index) => (
          <PresenterCard
            key={presenter.id}
            presenter={presenter}
            clickable={clickable}
            priority={index < 4}
            isLiked={likedPresenterIds.includes(presenter.id)}
          />
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
