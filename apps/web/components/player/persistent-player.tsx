"use client";

import { useAudio } from "@/context/audio-context";
import { useCurrentShow } from "@/hooks/use-current-show";
import { Button } from "@/components/ui/button";
import { Play, Pause, Volume2, Loader2, Music2, Radio } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import RequestSongModal from "@/components/requests/RequestSongModal";

export function PersistentPlayer() {
    const { isPlaying, togglePlay, currentTrack, isLoading } = useAudio();
    const { currentShow } = useCurrentShow();

    const isGenericMetadata = !currentTrack ||
        currentTrack.title === "Pie Radio Live" ||
        currentTrack.title === "Pie Radio" ||
        currentTrack.title === "Live Stream";

    const title = !isGenericMetadata
        ? currentTrack.title
        : (currentShow?.shows?.title || "Pie Radio");

    const artist = !isGenericMetadata
        ? currentTrack.artist
        : (currentShow?.shows?.host_id || "Live Stream");

    const artwork = (!isGenericMetadata && currentTrack.artwork && currentTrack.artwork !== "/placeholder-cover.jpg")
        ? currentTrack.artwork
        : (currentShow?.shows?.cover_image_url || "");

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-800 bg-black/95 backdrop-blur-xl supports-[backdrop-filter]:bg-black/80 px-4 py-3 md:px-8 shadow-[0_-10px_40px_rgba(0,0,0,0.4)] transition-all duration-300">
            <div className="container mx-auto flex max-w-screen-2xl items-center justify-between gap-4 md:gap-8">

                {/* Track Info */}
                <div className="flex items-center gap-3 flex-1 min-w-0 md:w-1/3">
                    <div className="relative h-12 w-12 md:h-14 md:w-14 shrink-0 overflow-hidden rounded-xl bg-zinc-900 border border-white/5 shadow-2xl">
                        {artwork && artwork !== "/placeholder-cover.jpg" ? (
                            <Image src={artwork} alt={title} fill className="object-cover" />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center bg-zinc-900 text-zinc-700">
                                <Music2 className="h-6 w-6" />
                            </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                    </div>
                    <div className="flex flex-col overflow-hidden min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="truncate text-[13px] md:text-sm font-black font-display tracking-tight text-white uppercase italic px-1">
                                {title}
                            </span>
                            <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded-sm bg-primary/20 text-primary text-[8px] font-black uppercase tracking-[0.2em]">
                                <div className="w-1 h-1 rounded-full bg-primary animate-pulse" />
                                Live
                            </div>
                        </div>
                        <span className="truncate text-[9px] md:text-xs font-bold text-zinc-500 uppercase tracking-widest mt-0.5">
                            {artist}
                        </span>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-center shrink-0 md:w-1/3">
                    <Button
                        size="icon"
                        variant="default"
                        className="h-12 w-12 md:h-14 md:w-14 rounded-full shadow-[0_0_20px_rgba(51,74,255,0.3)] hover:scale-105 active:scale-95 transition-all bg-primary hover:bg-primary/90 text-white border-0"
                        onClick={togglePlay}
                    >
                        {isLoading ? (
                            <Loader2 className="h-6 w-6 animate-spin" />
                        ) : isPlaying ? (
                            <Pause className="h-6 w-6 fill-current" />
                        ) : (
                            <Play className="h-6 w-6 fill-current ml-1" />
                        )}
                        <span className="sr-only">{isPlaying ? "Pause" : "Play"}</span>
                    </Button>
                </div>

                {/* Volume / Extra - Hidden on very small screens */}
                <div className="hidden md:flex items-center justify-end gap-4 w-1/3">
                    <div className="flex items-center gap-3">
                        <Volume2 className="h-4 w-4 text-zinc-500" />
                        <div className="group relative h-1.5 w-24 rounded-full bg-zinc-800 overflow-hidden cursor-pointer">
                            <div className="h-full w-2/3 rounded-full bg-primary transition-all group-hover:bg-primary/80"></div>
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="w-full h-full bg-white/10" />
                            </div>
                        </div>
                    </div>

                    <RequestSongModal />

                    <button className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-zinc-500 hover:text-white">
                        <Radio className="w-4 h-4" />
                    </button>
                </div>

                {/* Mobile Request Button (Absolute on Right) */}
                <div className="md:hidden flex items-center shrink-0">
                    <RequestSongModal />
                </div>

            </div>
        </div>
    );
}
