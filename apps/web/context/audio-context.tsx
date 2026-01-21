"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { Howl } from "howler";
import { createClient } from "@/lib/supabase/client";

interface AudioContextType {
    isPlaying: boolean;
    volume: number;
    currentTrack: { title: string; artist: string; artwork?: string } | null;
    togglePlay: () => void;
    setVolume: (val: number) => void;
    isLoading: boolean;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

const STREAM_URL = "https://stream.aiir.com/dnjp99nozxavv";

export function AudioProvider({ children }: { children: React.ReactNode }) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolumeState] = useState(1.0);
    const [isLoading, setIsLoading] = useState(false);
    const [currentTrack, setCurrentTrack] = useState({
        title: "Pie Radio Live",
        artist: "The Number One Station",
        artwork: "/placeholder-cover.jpg" // We will replace this later
    });

    const soundRef = useRef<Howl | null>(null);

    useEffect(() => {
        // Initialize Howl
        soundRef.current = new Howl({
            src: [STREAM_URL],
            html5: true, // Force HTML5 Audio for streaming
            format: ["mp3"],
            volume: volume,
            onload: () => setIsLoading(false),
            onplay: () => {
                setIsPlaying(true);
                setIsLoading(false);
            },
            onpause: () => setIsPlaying(false),
            onstop: () => setIsPlaying(false),
            onloaderror: (_id, err) => {
                console.error("Stream Load Error", err);
                setIsLoading(false);
            },
            onplayerror: (_id, err) => {
                console.error("Stream Play Error", err);
                setIsLoading(false);
            }
        });

        return () => {
            soundRef.current?.unload();
        };
    }, []); // Run once on mount

    // Realtime Metadata
    useEffect(() => {
        const supabase = createClient();

        const fetchInitial = async () => {
            const { data } = await supabase.from('station_metadata').select('*').eq('id', 1).single();
            if (data) {
                setCurrentTrack({
                    title: data.title || "Pie Radio Live",
                    artist: data.artist || "The Number One Station",
                    artwork: data.cover_url || "/placeholder-cover.jpg"
                });
            }
        };

        fetchInitial();

        const channel = supabase
            .channel('station_metadata_updates')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'station_metadata',
                    filter: 'id=eq.1'
                },
                (payload) => {
                    const newData = payload.new as any; // Type assertion since payload.new is generic
                    setCurrentTrack({
                        title: newData.title || "Pie Radio Live",
                        artist: newData.artist || "The Number One Station",
                        artwork: newData.cover_url || "/placeholder-cover.jpg"
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const togglePlay = () => {
        if (!soundRef.current) return;

        if (isPlaying) {
            soundRef.current.pause();
        } else {
            setIsLoading(true);
            soundRef.current.play();
        }
    };

    const setVolume = (val: number) => {
        setVolumeState(val);
        if (soundRef.current) {
            soundRef.current.volume(val);
        }
    };

    return (
        <AudioContext.Provider value={{ isPlaying, volume, currentTrack, togglePlay, setVolume, isLoading }}>
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
