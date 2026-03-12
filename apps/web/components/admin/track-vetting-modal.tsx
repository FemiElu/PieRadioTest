'use client';

import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Music2, CheckCircle2, XCircle, Play, Pause, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';

interface VettingModalProps {
    upload: any;
    isOpen: boolean;
    onClose: () => void;
    onAction: (id: string, action: 'approved' | 'rejected') => Promise<void>;
}

export function TrackVettingModal({ upload, isOpen, onClose, onAction }: VettingModalProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [audioSrc, setAudioSrc] = useState<string | null>(null);
    const [coverSrc, setCoverSrc] = useState<string | null>(null);
    const [isAudioLoading, setIsAudioLoading] = useState(false);

    const supabase = createClient();

    useEffect(() => {
        const loadMedia = async () => {
            if (!upload) return;
            setIsAudioLoading(true);
            try {
                // 1. Get Audio URL
                // Try 'track-submissions' first (new default)
                let { data: audioData } = await supabase.storage
                    .from('track-submissions')
                    .createSignedUrl(upload.audio_url, 3600);

                if (!audioData?.signedUrl) {
                    // Try 'music' bucket fallback
                    const { data: musicData } = await supabase.storage
                        .from('music')
                        .createSignedUrl(upload.audio_url, 3600);
                    audioData = musicData;
                }

                if (audioData?.signedUrl) {
                    setAudioSrc(audioData.signedUrl);
                }

                // 2. Get Cover URL if exists
                if (upload.cover_art_url) {
                    let { data: coverData } = await supabase.storage
                        .from('track-submissions')
                        .createSignedUrl(upload.cover_art_url, 3600);

                    if (!coverData?.signedUrl) {
                        const { data: imgData } = await supabase.storage
                            .from('images')
                            .createSignedUrl(upload.cover_art_url, 3600);
                        coverData = imgData;
                    }

                    if (coverData?.signedUrl) {
                        setCoverSrc(coverData.signedUrl);
                    }
                }
            } catch (err) {
                console.error("Error loading track media:", err);
            } finally {
                setIsAudioLoading(false);
            }
        };

        loadMedia();
    }, [upload, supabase]);

    if (!upload) return null;

    const togglePlay = () => {
        if (!audioRef.current || !audioSrc) return;
        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            audioRef.current.play().catch((e: any) => {
                console.error("Error playing audio:", e);
                console.error("Audio Source URL:", audioSrc);
                toast.error("Could not play audio. The file might be missing, inaccessible, or in an unsupported format.");
                setIsPlaying(false);
            });
            setIsPlaying(true);
        }
    };

    const handleAction = async (action: 'approved' | 'rejected') => {
        setIsProcessing(true);
        try {
            if (audioRef.current) {
                audioRef.current.pause();
                setIsPlaying(false);
            }
            await onAction(upload.id, action);
            onClose();
        } catch (error) {
            toast.error(`Failed to ${action} track.`);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            if (!open) {
                if (audioRef.current) audioRef.current.pause();
                setIsPlaying(false);
                onClose();
            }
        }}>
            <DialogContent className="sm:max-w-[600px] bg-card/95 backdrop-blur border-border/50">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl font-display uppercase italic tracking-tight">
                        <Music2 className="w-5 h-5 text-primary" />
                        Track Review
                    </DialogTitle>
                    <DialogDescription>
                        Review this submission and decide if it goes into the radio queue.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex gap-6 py-4">
                    {/* Cover Art & Player */}
                    <div className="flex flex-col items-center gap-4 w-1/3">
                        <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-muted flex items-center justify-center shadow-lg border border-border/40">
                            {coverSrc ? (
                                <Image src={coverSrc} alt="Cover" fill className="object-cover" />
                            ) : (
                                <Music2 className="w-12 h-12 text-muted-foreground/30" />
                            )}

                            <button
                                onClick={togglePlay}
                                className="absolute inset-0 flex items-center justify-center bg-black/40 hover:bg-black/50 transition-colors group"
                            >
                                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white shadow-xl transform group-hover:scale-110 transition-transform">
                                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-1" />}
                                    {isAudioLoading && <Loader2 className="absolute w-12 h-12 text-primary animate-spin opacity-50" />}
                                </div>
                            </button>
                        </div>

                        <div className="flex flex-col gap-2 w-full">
                            <Badge variant="secondary" className="uppercase text-[10px] tracking-widest w-full justify-center">
                                {upload.genre}
                            </Badge>

                            {audioSrc && (
                                <Button variant="ghost" size="sm" className="text-[10px] h-7 font-bold uppercase tracking-tighter text-muted-foreground hover:text-primary transition-colors" asChild>
                                    <a href={audioSrc} download={`${upload.title}.mp3`} target="_blank" rel="noopener noreferrer">
                                        Download File
                                    </a>
                                </Button>
                            )}
                        </div>

                        <audio
                            ref={audioRef}
                            src={audioSrc || undefined}
                            onEnded={() => setIsPlaying(false)}
                            className="hidden"
                        />
                    </div>

                    {/* Metadata */}
                    <div className="flex-1 space-y-4">
                        <div>
                            <h3 className="font-bold text-2xl truncate">{upload.title}</h3>
                            <p className="text-sm text-muted-foreground">
                                Submitted by: <span className="font-medium text-foreground">{upload.profiles?.full_name || 'Unknown Artist'}</span>
                            </p>
                        </div>

                        <div className="space-y-2">
                            <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Pitch Notes</h4>
                            <div className="bg-muted/50 p-4 rounded-xl border border-border/40 min-h-[100px] text-sm leading-relaxed max-h-[150px] overflow-y-auto">
                                {upload.pitch_notes ? upload.pitch_notes : <span className="text-muted-foreground italic">No pitch notes provided.</span>}
                            </div>
                        </div>

                        <div className="text-xs text-muted-foreground">
                            Submitted on: {new Date(upload.created_at).toLocaleString()}
                        </div>
                    </div>
                </div>

                <DialogFooter className="flex sm:justify-between items-center bg-muted/30 -mx-6 -mb-6 p-6 border-t border-border/40">
                    <Button variant="outline" onClick={onClose} disabled={isProcessing}>
                        Cancel
                    </Button>
                    <div className="flex gap-2">
                        <Button
                            variant="destructive"
                            onClick={() => handleAction('rejected')}
                            disabled={isProcessing}
                            className="uppercase tracking-wider font-bold text-xs"
                        >
                            {isProcessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}
                            Reject
                        </Button>
                        <Button
                            onClick={() => handleAction('approved')}
                            disabled={isProcessing}
                            className="uppercase tracking-wider font-bold text-xs bg-green-600 hover:bg-green-700 text-white"
                        >
                            {isProcessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                            Approve
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
