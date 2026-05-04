"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Play, Calendar, Clock, Music, Loader2 } from "lucide-react";
import { useAudio } from "@/context/audio-context";
import { format } from "date-fns";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface Episode {
    id: string;
    title: string;
    description: string | null;
    file_key: string | null;
    cover_image_url: string | null;
    aired_at: string | null;
    duration_seconds: number | null;
}

interface ShowPreviewDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    episodes: Episode[];
    loading?: boolean;
    showName: string;
    brandName?: string;
}

export function ShowPreviewDialog({
    open,
    onOpenChange,
    episodes,
    loading,
    showName,
    brandName = "Pie Radio"
}: ShowPreviewDialogProps) {
    const { playClip, currentTrack, isPlaying } = useAudio();

    const handlePlay = (episode: Episode) => {
        if (!episode.file_key) return;

        const audioUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/pie-episodes/${episode.file_key}`;

        playClip(
            audioUrl,
            episode.title,
            brandName,
            episode.cover_image_url || undefined
        );
    };

    const formatDuration = (seconds: number | null) => {
        if (!seconds) return null;
        const mins = Math.floor(seconds / 60);
        const remainingSecs = seconds % 60;
        return `${mins}:${remainingSecs.toString().padStart(2, "0")}`;
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden bg-white border-none shadow-2xl">
                <DialogHeader className="p-8 pb-6 bg-gradient-to-br from-popeyes-orange to-cajun-red text-white">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                            <Music className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-widest opacity-80">
                            Partner Spotlight
                        </span>
                    </div>
                    <DialogTitle className="text-3xl font-black font-display tracking-tight leading-none uppercase italic">
                        {showName}
                    </DialogTitle>
                    <DialogDescription className="text-white/80 font-medium mt-2">
                        Listen back to the latest episodes of our sponsored show.
                    </DialogDescription>
                </DialogHeader>

                <div className="p-4 max-h-[60vh] overflow-y-auto">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-3 text-zinc-400">
                            <Loader2 className="w-8 h-8 animate-spin" />
                            <p className="text-sm font-bold uppercase tracking-widest">Loading episodes...</p>
                        </div>
                    ) : episodes.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-zinc-50 flex items-center justify-center border border-dashed border-zinc-200">
                                <Music className="w-8 h-8 text-zinc-200" />
                            </div>
                            <div>
                                <p className="font-bold text-zinc-900">No episodes available yet</p>
                                <p className="text-sm text-zinc-500">Check back soon for the latest aired shows.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {episodes.map((episode) => {
                                const isCurrent = currentTrack?.url?.includes(episode.file_key || "NONE");

                                return (
                                    <div
                                        key={episode.id}
                                        className={cn(
                                            "group relative flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 border border-transparent",
                                            isCurrent
                                                ? "bg-popeyes-orange/5 border-popeyes-orange/20"
                                                : "hover:bg-zinc-50 hover:border-zinc-100"
                                        )}
                                    >
                                        <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-zinc-100 shadow-sm">
                                            {episode.cover_image_url ? (
                                                <Image
                                                    src={episode.cover_image_url}
                                                    alt={episode.title}
                                                    fill
                                                    className="object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-zinc-300">
                                                    <Music className="w-6 h-6" />
                                                </div>
                                            )}
                                            <button
                                                onClick={() => handlePlay(episode)}
                                                className={cn(
                                                    "absolute inset-0 bg-black/40 flex items-center justify-center text-white transition-opacity duration-300",
                                                    isCurrent ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                                                )}
                                            >
                                                {isCurrent && isPlaying ? (
                                                    <div className="flex gap-1 items-end h-4">
                                                        <div className="w-1 bg-white animate-music-bar-1" style={{ height: '60%' }} />
                                                        <div className="w-1 bg-white animate-music-bar-2" style={{ height: '100%' }} />
                                                        <div className="w-1 bg-white animate-music-bar-3" style={{ height: '80%' }} />
                                                    </div>
                                                ) : (
                                                    <Play className="w-8 h-8 fill-current" />
                                                )}
                                            </button>
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <h3 className={cn(
                                                "font-bold text-[#141827] truncate transition-colors",
                                                isCurrent ? "text-popeyes-orange" : "group-hover:text-popeyes-orange"
                                            )}>
                                                {episode.title}
                                            </h3>
                                            <div className="flex items-center gap-4 mt-1 text-[10px] font-black uppercase tracking-widest text-zinc-400">
                                                {episode.aired_at && (
                                                    <div className="flex items-center gap-1">
                                                        <Calendar className="w-3 h-3" />
                                                        {format(new Date(episode.aired_at), "MMM d, yyyy")}
                                                    </div>
                                                )}
                                                {episode.duration_seconds && (
                                                    <div className="flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        {formatDuration(episode.duration_seconds)}
                                                    </div>
                                                )}
                                            </div>
                                            {episode.description && (
                                                <p className="text-xs text-zinc-500 mt-1 line-clamp-1 italic">
                                                    {episode.description}
                                                </p>
                                            )}
                                        </div>

                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className={cn(
                                                "rounded-full shrink-0",
                                                isCurrent ? "text-popeyes-orange bg-popeyes-orange/10" : "hover:text-popeyes-orange hover:bg-popeyes-orange/10"
                                            )}
                                            onClick={() => handlePlay(episode)}
                                        >
                                            <Play className={cn("w-5 h-5", isCurrent && isPlaying ? "fill-current" : "")} />
                                        </Button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="p-4 bg-zinc-50 border-t border-zinc-100 text-center">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                        Powered by Pie Radio
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}
