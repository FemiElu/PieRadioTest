"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { 
    Plus, 
    Music, 
    Trash2, 
    Calendar, 
    ExternalLink, 
    AlertCircle,
    Loader2,
    Play
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { UploadShowModal } from "@/components/presenters/upload-show-modal";
import { toast } from "sonner";
import { format } from "date-fns";
import Image from "next/image";
import { useAudio } from "@/context/audio-context";

interface PartnershipEpisode {
    id: string;
    title: string;
    description: string | null;
    category: string | null;
    aired_at: string | null;
    file_key: string | null;
    cover_image_url: string | null;
}

export default function AdminPartnershipsPage() {
    const supabase = createClient();
    const { playClip } = useAudio();
    const [episodes, setEpisodes] = useState<PartnershipEpisode[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploadModalOpen, setUploadModalOpen] = useState(false);
    
    // We can expand this in the future
    const CATEGORY = "partnership:popeyes-heaters_show";

    const fetchEpisodes = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("episodes")
                .select("*")
                .eq("category", CATEGORY)
                .order("aired_at", { ascending: false });

            if (error) throw error;
            setEpisodes((data as any) || []);
        } catch (error: any) {
            toast.error("Failed to load partnership episodes");
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [supabase, CATEGORY]);

    useEffect(() => {
        fetchEpisodes();
    }, [fetchEpisodes]);

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this show?")) return;

        try {
            const { error } = await supabase
                .from("episodes")
                .delete()
                .eq("id", id);

            if (error) throw error;
            toast.success("Show deleted");
            fetchEpisodes();
        } catch (error: any) {
            toast.error("Failed to delete show");
        }
    };

    const handlePlay = (episode: PartnershipEpisode) => {
        if (!episode.file_key) return;
        const audioUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/pie-episodes/${episode.file_key}`;
        playClip(
            audioUrl,
            episode.title,
            "Popeyes Heaters Show",
            episode.cover_image_url || undefined
        );
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold font-display tracking-tight text-[#141827]">
                        Partnerships
                    </h1>
                    <p className="text-zinc-500 mt-1">
                        Manage sponsored shows and brand partnership content.
                    </p>
                </div>
                <Button 
                    onClick={() => setUploadModalOpen(true)}
                    className="rounded-xl shadow-lg shadow-primary/20 gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Upload Partnership Show
                </Button>
            </div>

            <div className="grid grid-cols-1 gap-6">
                <div className="rounded-2xl border border-border/50 bg-white overflow-hidden shadow-sm">
                    <div className="p-6 border-b border-border/50 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                <Music className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <h2 className="font-bold text-[#141827]">Popeyes Heaters Show</h2>
                                <p className="text-xs text-zinc-400 font-medium tracking-wide uppercase">
                                    {CATEGORY}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="p-0">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20 text-zinc-400 gap-3">
                                <Loader2 className="w-8 h-8 animate-spin" />
                                <p className="text-sm font-medium">Loading episodes...</p>
                            </div>
                        ) : episodes.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-zinc-400 gap-4">
                                <div className="w-16 h-16 rounded-full bg-zinc-50 flex items-center justify-center border border-dashed border-zinc-200">
                                    <Music className="w-8 h-8 opacity-20" />
                                </div>
                                <div className="text-center">
                                    <p className="font-bold text-[#141827]">No shows uploaded yet</p>
                                    <p className="text-sm">Click the button above to upload the first show.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="divide-y divide-border/50">
                                {episodes.map((episode) => (
                                    <div 
                                        key={episode.id} 
                                        className="p-4 hover:bg-zinc-50 transition-colors flex items-center gap-4 group"
                                    >
                                        <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-zinc-100">
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
                                                className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                                            >
                                                <Play className="w-6 h-6 fill-current" />
                                            </button>
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-[#141827] truncate group-hover:text-primary transition-colors">
                                                {episode.title}
                                            </h3>
                                            <div className="flex items-center gap-4 mt-1 text-[11px] text-zinc-400 font-bold uppercase tracking-wider">
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {episode.aired_at ? format(new Date(episode.aired_at), "MMM d, yyyy") : "No date"}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="rounded-xl hover:bg-red-50 hover:text-red-500"
                                                onClick={() => handleDelete(episode.id)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <UploadShowModal 
                open={uploadModalOpen}
                onOpenChange={setUploadModalOpen}
                category={CATEGORY}
                onSuccess={fetchEpisodes}
            />
        </div>
    );
}
