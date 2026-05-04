"use client";

import { useAudio } from "@/context/audio-context";
import { useCurrentShow } from "@/hooks/use-current-show";
import { Button } from "@/components/ui/button";
import {
  Play,
  Pause,
  Volume2,
  Loader2,
  Music2,
  Radio,
  ChevronUp,
  ChevronDown,
  SkipForward,
  SkipBack,
  Share2,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";
import RequestSongModal from "@/components/requests/RequestSongModal";
import { LikeButton } from "@/components/shared/like-button";
import { toggleLikedSong } from "@/app/actions/favourites";
import { toast } from "sonner";

export function PersistentPlayer() {
  const {
    isPlaying,
    togglePlay,
    currentTrack,
    isLoading,
    currentTime,
    duration,
    seekTo,
    volume,
    setVolume,
    isLiveStream,
    switchToLive,
  } = useAudio();
  const { currentShow } = useCurrentShow();
  const [isExpanded, setIsExpanded] = useState(false);

  const isGenericMetadata =
    !currentTrack ||
    (isLiveStream && (
      currentTrack.title === "Pie Radio Live" ||
      currentTrack.title === "Pie Radio" ||
      currentTrack.title === "Live Stream"
    ));

  const isLive = isLiveStream;

  const title = !isGenericMetadata
    ? currentTrack.title
    : currentShow?.shows?.title || "Pie Radio";

  const artist = !isGenericMetadata
    ? currentTrack.artist
    : currentShow?.shows?.host_id || "Live Stream";

  const artwork =
    !isGenericMetadata &&
    currentTrack.artwork &&
    currentTrack.artwork !== "/placeholder-cover.jpg"
      ? currentTrack.artwork
      : currentShow?.shows?.cover_image_url || "";

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleShare = async () => {
    const shareData = {
      title: "Pie Radio",
      text: `Now listening to: ${title} by ${artist} - From Pie Radio`,
      url: window.location.origin,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(
          `${shareData.text} ${shareData.url}`,
        );
        toast.success("Link copied to clipboard!");
      }
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        console.error("Error sharing", error);
        toast.error("Failed to share");
      }
    }
  };

  return (
    <div
      className={cn(
        "fixed left-0 right-0 z-50 border-t border-zinc-800 bg-black/95 backdrop-blur-xl transition-all duration-500 ease-in-out shadow-[0_-10px_40px_rgba(0,0,0,0.4)]",
        isExpanded
          ? "bottom-0 top-0 md:top-auto h-screen md:h-96"
          : "bottom-0 h-20 md:h-24",
      )}
    >
      {/* Expand Toggle (Mobile Drawer Handle) */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="md:hidden absolute -top-10 left-1/2 -translate-x-1/2 p-2  rounded-t-2xl text-zinc-500 h-4"
      >
        {isExpanded ? (
          <ChevronDown className="w-6 h-6" />
        ) : (
          <ChevronUp className="w-6 h-6 animate-bounce" />
        )}
      </button>

      <div
        className={cn(
          "container mx-auto flex max-w-screen-2xl h-full flex-col md:flex-row items-center justify-center md:justify-between gap-6 px-4 py-6 md:px-8",
          !isExpanded && "flex-row py-3",
        )}
      >
        {/* Track Info */}
        <div
          className={cn(
            "flex items-center gap-4 min-w-0 md:w-1/3 transition-all",
            isExpanded ? "flex-col text-center" : "flex-row w-auto flex-1",
          )}
        >
          <div
            className={cn(
              "relative shrink-0 overflow-hidden rounded-2xl bg-zinc-900 border border-white/5 shadow-2xl transition-all duration-500",
              isExpanded
                ? "h-64 w-64 md:h-48 md:w-48"
                : "h-12 w-12 md:h-16 md:w-16",
            )}
          >
            {artwork && artwork !== "/placeholder-cover.jpg" ? (
              <Image src={artwork} alt={title} fill className="object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-zinc-900 text-zinc-700">
                <Music2 className="h-10 w-10" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          </div>
          <div
            className={cn(
              "flex flex-col overflow-hidden min-w-0 transition-all",
              isExpanded ? "items-center" : "items-start",
            )}
          >
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "truncate font-black font-display tracking-tight text-white uppercase italic transition-all px-1",
                  isExpanded
                    ? "text-2xl md:text-3xl"
                    : "text-[13px] md:text-sm",
                )}
              >
                {title}
              </span>
              {isLive && !isExpanded && (
                <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded-sm bg-primary/20 text-primary text-[8px] font-black uppercase tracking-[0.2em]">
                  <div className="w-1 h-1 rounded-full bg-primary animate-pulse" />
                  Live
                </div>
              )}
              {!isLive && !isExpanded && (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={switchToLive}
                    className="h-6 text-[9px] font-black uppercase tracking-widest border-primary/30 hover:bg-primary/10 hover:text-primary transition-all rounded-full px-3"
                >
                    <Radio className="w-3 h-3 mr-1" />
                    Return to Live
                </Button>
              )}
            </div>
            <span
              className={cn(
                "truncate font-bold text-zinc-500 uppercase tracking-widest mt-1 transition-all",
                isExpanded ? "text-sm md:text-base" : "text-[9px] md:text-xs",
              )}
            >
              {artist}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div
          className={cn(
            "flex flex-col items-center justify-center shrink-0 md:w-1/3 transition-all",
            isExpanded ? "w-full gap-8" : "w-auto",
          )}
        >
          {isExpanded && !isLive && (
            <div className="w-full flex flex-col gap-2">
              <div
                className="h-1 bg-zinc-800 rounded-full overflow-hidden cursor-pointer relative"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const pos = (e.clientX - rect.left) / rect.width;
                  seekTo(pos * duration);
                }}
              >
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${(currentTime / duration) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] font-mono text-zinc-500">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>
          )}

          <div className="flex items-center gap-6 md:gap-8">
            {isExpanded && (
              <button
                className="text-zinc-500 hover:text-white"
                onClick={() => seekTo(Math.max(0, currentTime - 10))}
              >
                <SkipBack className="w-6 h-6" />
              </button>
            )}
            <Button
              size="icon"
              variant="default"
              className={cn(
                "rounded-full shadow-[0_0_20px_rgba(51,74,255,0.3)] hover:scale-105 active:scale-95 transition-all bg-primary hover:bg-primary/90 text-white border-0",
                isExpanded ? "h-20 w-20" : "h-12 w-12 md:h-14 md:w-14",
              )}
              onClick={isLiveStream ? togglePlay : togglePlay}
            >
              {isLoading ? (
                <Loader2 className="h-8 w-8 animate-spin" />
              ) : isPlaying ? (
                <Pause
                  className={cn(
                    "fill-current",
                    isExpanded ? "h-8 w-8" : "h-6 w-6",
                  )}
                />
              ) : (
                <Play
                  className={cn(
                    "fill-current ml-1",
                    isExpanded ? "h-8 w-8" : "h-6 w-6",
                  )}
                />
              )}
            </Button>
            {isExpanded && (
              <button
                className="text-zinc-500 hover:text-white"
                onClick={() => seekTo(Math.min(duration, currentTime + 10))}
              >
                <SkipForward className="w-6 h-6" />
              </button>
            )}
          </div>

          {isExpanded && (
            <div className="flex items-center gap-10">
              <LikeButton
                isLiked={false}
                onToggle={() =>
                  toggleLikedSong({
                    songTitle: title,
                    artistName: artist || undefined,
                    coverUrl: artwork || undefined,
                  })
                }
                size="lg"
                showLabel
                label="Save"
                className="flex-col gap-1 text-zinc-500"
              />
              <button
                onClick={handleShare}
                className="flex flex-col items-center gap-1 text-zinc-500 hover:text-primary transition-colors"
              >
                <Share2 className="w-6 h-6" />
                <span className="text-[10px] font-bold uppercase">Share</span>
              </button>
            </div>
          )}
        </div>

        {/* Volume / Extra - Hidden when expanded on mobile or always hidden on tiny mobile */}
        <div
          className={cn(
            "hidden md:flex items-center justify-end gap-6 w-1/3 transition-all",
            isExpanded ? "flex" : "md:flex",
          )}
        >
          <div className="flex items-center gap-3">
            <Volume2 className="h-4 w-4 text-zinc-500" />
            <div
              className="group relative flex items-center h-6 w-24 cursor-pointer"
              onMouseDown={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const updateVolume = (clientX: number) => {
                  const pos = Math.max(
                    0,
                    Math.min(1, (clientX - rect.left) / rect.width),
                  );
                  setVolume(pos);
                };

                updateVolume(e.clientX);

                const onMouseMove = (moveEvent: MouseEvent) => {
                  updateVolume(moveEvent.clientX);
                };

                const onMouseUp = () => {
                  window.removeEventListener("mousemove", onMouseMove);
                  window.removeEventListener("mouseup", onMouseUp);
                };

                window.addEventListener("mousemove", onMouseMove);
                window.addEventListener("mouseup", onMouseUp);
              }}
              onTouchStart={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const updateVolume = (clientX: number) => {
                  const pos = Math.max(
                    0,
                    Math.min(1, (clientX - rect.left) / rect.width),
                  );
                  setVolume(pos);
                };

                updateVolume(e.touches[0].clientX);

                const onTouchMove = (moveEvent: TouchEvent) => {
                  updateVolume(moveEvent.touches[0].clientX);
                };

                const onTouchEnd = () => {
                  window.removeEventListener("touchmove", onTouchMove);
                  window.removeEventListener("touchend", onTouchEnd);
                };

                window.addEventListener("touchmove", onTouchMove, {
                  passive: false,
                });
                window.addEventListener("touchend", onTouchEnd);
              }}
            >
              <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all group-hover:bg-primary/80"
                  style={{ width: `${volume * 100}%` }}
                />
              </div>
              {/* Drag Handle */}
              <div
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity"
                style={{ left: `calc(${volume * 100}% - 6px)` }}
              />
            </div>
          </div>

          <RequestSongModal />

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-zinc-500 hover:text-white"
          >
            {isExpanded ? (
              <ChevronDown className="w-5 h-5" />
            ) : (
              <ChevronUp className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Mobile Extra Actions when expanded */}
        {isExpanded && (
          <div className="md:hidden flex flex-col w-full gap-4 mt-auto">
            <LikeButton
              isLiked={false}
              onToggle={() =>
                toggleLikedSong({
                  songTitle: title,
                  artistName: artist || undefined,
                  coverUrl: artwork || undefined,
                })
              }
              size="lg"
              showLabel
              label="Save to Favourites"
              className="w-full justify-center py-4 bg-white/5 border border-zinc-800 rounded-2xl text-white h-14"
            />
            <RequestSongModal />
          </div>
        )}

        {/* Mobile Collapsed Actions */}
        {!isExpanded && (
          <div className="md:hidden flex items-center shrink-0">
            <RequestSongModal />
          </div>
        )}
      </div>
    </div>
  );
}
