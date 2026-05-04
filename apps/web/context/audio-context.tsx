"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

interface AudioContextType {
    isPlaying: boolean;
    volume: number;
    currentTrack: { title: string; artist: string; artwork?: string; url?: string } | null;
    togglePlay: () => void;
    setVolume: (val: number) => void;
    isLoading: boolean;
    isLiveStream: boolean;
    clipUrl: string | null;
    playClip: (url: string, title: string, artist: string, artwork?: string) => void;
    switchToLive: () => void;
    seekTo: (seconds: number) => void;
    currentTime: number;
    duration: number;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

const STREAM_URL = "https://stream.aiir.com/dnjp99nozxavv";

export function AudioProvider({ children }: { children: React.ReactNode }) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolumeState] = useState(1.0);
    const [isLoading, setIsLoading] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [currentTrack, setCurrentTrack] = useState<{ title: string; artist: string; artwork?: string; url?: string } | null>({
        title: "Pie Radio Live",
        artist: "The Number One Station",
        artwork: "/placeholder-cover.jpg",
        url: STREAM_URL
    });

    const playerRef = useRef<any>(null);
    const clipRef = useRef<HTMLAudioElement | null>(null);

    // ... fetchArtwork remains same ...
    const fetchArtwork = async (artist: string, title: string) => {
        if (artist === "Pie Radio" || title === "Live Stream") return "/placeholder-cover.jpg";
        try {
            const query = encodeURIComponent(`${artist} ${title}`);
            const res = await fetch(`https://itunes.apple.com/search?term=${query}&entity=song&limit=1`);
            if (res.ok) {
                const data = await res.json();
                if (data.results && data.results.length > 0) {
                    return data.results[0].artworkUrl100.replace("100x100bb", "600x600bb");
                }
            }
        } catch (error) {
            console.warn("iTunes lookup failed:", error);
        }
        return "/placeholder-cover.jpg";
    };

    const stopStream = () => {
        if (playerRef.current) {
            playerRef.current.stop();
        }
    };

    const stopClip = () => {
        if (clipRef.current) {
            clipRef.current.pause();
            clipRef.current.src = "";
        }
    };

    const playStream = () => {
        stopClip();
        if (playerRef.current) {
            setIsLoading(true);
            playerRef.current.play();
            setCurrentTrack({
                title: "Pie Radio Live",
                artist: "The Number One Station",
                artwork: "/placeholder-cover.jpg",
                url: STREAM_URL
            });
        }
    };

    const playClip = (url: string, title: string, artist: string, artwork?: string) => {
        stopStream();
        stopClip();

        setIsLoading(true);
        const audio = new Audio(url);
        audio.volume = volume;
        clipRef.current = audio;

        audio.oncanplay = () => {
            setIsLoading(false);
            setDuration(audio.duration);
            audio.play();
            setIsPlaying(true);
        };

        audio.ontimeupdate = () => {
            setCurrentTime(audio.currentTime);
        };

        audio.onended = () => {
            setIsPlaying(false);
        };

        setCurrentTrack({ title, artist, artwork, url });
    };

    const switchToLive = () => {
        stopClip();
        playStream();
    };

    const seekTo = (seconds: number) => {
        if (clipRef.current) {
            clipRef.current.currentTime = seconds;
            setCurrentTime(seconds);
        }
    };

    useEffect(() => {
        const initPlayer = async () => {
            const { default: IcecastMetadataPlayer } = await import("icecast-metadata-player");
            playerRef.current = new IcecastMetadataPlayer(STREAM_URL, {
                onMetadata: async (metadata: any) => {
                    if (currentTrack?.url !== STREAM_URL) return;

                    const streamTitle = metadata.StreamTitle || "";
                    let artist = "Pie Radio";
                    let title = "Live Stream";
                    const separators = [" - ", " - ", " | "];
                    let matched = false;
                    for (const sep of separators) {
                        if (streamTitle.includes(sep)) {
                            const parts = streamTitle.split(sep);
                            artist = parts[0].trim();
                            title = parts.slice(1).join(sep).trim();
                            matched = true;
                            break;
                        }
                    }
                    if (!matched && streamTitle) title = streamTitle;

                    setCurrentTrack(prev => {
                        if (prev?.title === title && prev?.artist === artist) return prev;
                        fetchArtwork(artist, title).then(artwork => {
                            setCurrentTrack(current => current ? { ...current, artwork } : null);
                        });
                        return { title, artist, artwork: prev?.artwork, url: STREAM_URL };
                    });
                },
                onPlay: () => { setIsPlaying(true); setIsLoading(false); },
                onStop: () => { setIsPlaying(false); setIsLoading(false); },
                onLoad: () => setIsLoading(false),
                onError: () => { setIsLoading(false); setIsPlaying(false); },
                metadataTypes: ["icy"]
            });
        };
        if (typeof window !== "undefined") initPlayer();
        return () => { stopStream(); stopClip(); };
    }, []);

    const togglePlay = () => {
        if (currentTrack?.url === STREAM_URL) {
            if (isPlaying) stopStream();
            else playStream();
        } else if (clipRef.current) {
            if (isPlaying) {
                clipRef.current.pause();
                setIsPlaying(false);
            } else {
                clipRef.current.play();
                setIsPlaying(true);
            }
        }
    };

    const setVolume = (val: number) => {
        setVolumeState(val);
        if (playerRef.current) {
            if (playerRef.current.audioElement) {
                playerRef.current.audioElement.volume = val;
            } else if (playerRef.current.audio) {
                playerRef.current.audio.volume = val;
            }
        }
        if (clipRef.current) clipRef.current.volume = val;
    };

    // Keep volume in sync when track changes or starts
    useEffect(() => {
        if (isPlaying && playerRef.current) {
            const player = playerRef.current;
            const audio = player.audioElement || player.audio;
            if (audio) audio.volume = volume;
        }
    }, [isPlaying, volume]);

    return (
        <AudioContext.Provider value={{
            isPlaying,
            volume,
            currentTrack,
            togglePlay,
            setVolume,
            isLoading,
            isLiveStream: currentTrack?.url === STREAM_URL,
            clipUrl: currentTrack?.url !== STREAM_URL ? currentTrack?.url || null : null,
            playClip,
            switchToLive,
            seekTo,
            currentTime,
            duration
        }}>
            {children}
        </AudioContext.Provider>
    );
}

export function useAudio() {
    const context = useContext(AudioContext);
    if (context === undefined) {
        throw new Error("useAudio must be used within an AudioProvider");
    }
    return context;
}
