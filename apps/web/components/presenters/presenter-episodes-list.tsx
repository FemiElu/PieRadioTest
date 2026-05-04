"use client";

import { useAudio } from "@/context/audio-context";
import { Button } from "@/components/ui/button";
import { Play, Pause, Clock, Calendar } from "lucide-react";
import Image from "next/image";
import { format } from "date-fns";

interface Episode {
    id: string;
    title: string;
    description: string | null;
    file_key: string | null;
    cover_image_url: string | null;
    aired_at: string | null;
    duration_seconds: number | null;
}

interface PresenterEpisodesListProps {
    episodes: Episode[];
    presenterName: string;
}

export function PresenterEpisodesList({ episodes, presenterName }: PresenterEpisodesListProps) {
    const { isPlaying, togglePlay, playClip, isLiveStream, clipUrl } = useAudio();

    if (episodes.length === 0) return null;

    const handlePlay = (episode: Episode) => {
        if (!episode.file_key) return;

        const audioUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/pie-episodes/${episode.file_key}`;
        const isThisEpisode = clipUrl === audioUrl && !isLiveStream;

        if (isThisEpisode) {
            togglePlay();
        } else {
            playClip(
                audioUrl,
                episode.title,
                presenterName,
                episode.cover_image_url || undefined
            );
        }
    };

    const formatDuration = (seconds: number | null) => {
        if (!seconds) return "Unknown duration";
        const mins = Math.floor(seconds / 60);
        const remainingSecs = seconds % 60;
        return `${mins}:${remainingSecs.toString().padStart(2, "0")}`;
    };

    return (
        <div className="bg-white rounded-3xl border border-border p-6 md:p-8">
            <h2 className="text-2xl font-bold font-display mb-6">Recent Shows</h2>
            <div className="space-y-4">
                {episodes.map((episode) => {
                    const audioUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/pie-episodes/${episode.file_key}`;
                    const isThisEpisode = clipUrl === audioUrl && !isLiveStream;
                    const isThisPlaying = isThisEpisode && isPlaying;
                    
                    return (
                    <div 
                        key={episode.id}
                        className={`flex items-center gap-4 p-4 rounded-2xl transition-all group ${isThisEpisode ? 'bg-primary/5 border-primary/20' : 'bg-zinc-50 hover:bg-zinc-100'}`}
                    >
                        {/* Thumbnail / Play Button overlay */}
                        <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-primary/10">
                            {episode.cover_image_url ? (
                                <Image 
                                    src={episode.cover_image_url}
                                    alt={episode.title}
                                    fill
                                    className="object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    {isThisPlaying ? (
                                        <Pause className="w-6 h-6 text-primary fill-current" />
                                    ) : (
                                        <Play className="w-6 h-6 text-primary fill-current" />
                                    )}
                                </div>
                            )}
                            <button 
                                onClick={() => handlePlay(episode)}
                                className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                            >
                                {isThisPlaying ? (
                                    <Pause className="w-8 h-8 fill-current" />
                                ) : (
                                    <Play className="w-8 h-8 fill-current" />
                                )}
                            </button>
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-foreground truncate group-hover:text-primary transition-colors">
                                {episode.title}
                            </h3>
                            <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground font-medium">
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
                                <p className="text-xs text-muted-foreground mt-2 line-clamp-1 italic">
                                    {episode.description}
                                </p>
                            )}
                        </div>

                        <Button 
                            size="icon" 
                            variant="ghost" 
                            className="rounded-full hover:bg-primary/10 hover:text-primary"
                            onClick={() => handlePlay(episode)}
                        >
                            {isThisPlaying ? (
                                <Pause className="w-5 h-5 fill-current" />
                            ) : (
                                <Play className="w-5 h-5 fill-current" />
                            )}
                        </Button>
                    </div>
                )})}
            </div>
        </div>
    );
}
