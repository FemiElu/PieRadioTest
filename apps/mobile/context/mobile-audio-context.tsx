import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { Audio, InterruptionModeIOS, InterruptionModeAndroid } from "expo-av";
import { supabase } from "../lib/supabase";

interface Track {
    title: string;
    artist: string;
    artwork?: string;
}

interface MobileAudioContextType {
    isPlaying: boolean;
    isLoading: boolean;
    currentTrack: Track | null;
    togglePlay: () => Promise<void>;
}

const MobileAudioContext = createContext<MobileAudioContextType | undefined>(undefined);

const STREAM_URL = "https://stream.aiir.com/dnjp99nozxavv";

export function MobileAudioProvider({ children }: { children: React.ReactNode }) {
    const [sound, setSound] = useState<Audio.Sound | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [currentTrack, setCurrentTrack] = useState<Track | null>({
        title: "Pie Radio Live",
        artist: "The Number One Station",
        artwork: undefined
    });

    useEffect(() => {
        // Configure Audio Mode for Background Playback
        const configureAudio = async () => {
            try {
                await Audio.setAudioModeAsync({
                    allowsRecordingIOS: false,
                    staysActiveInBackground: true,
                    playsInSilentModeIOS: true,
                    shouldDuckAndroid: true,
                    playThroughEarpieceAndroid: false,
                    interruptionModeIOS: InterruptionModeIOS.DoNotMix,
                    interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
                });
            } catch (e) {
                console.error("Error configuring audio mode", e);
            }
        };
        configureAudio();
    }, []);

    // Realtime Metadata
    useEffect(() => {
        const fetchInitial = async () => {
            const { data } = await supabase.from('station_metadata').select('*').eq('id', 1).single();
            if (data) {
                setCurrentTrack({
                    title: data.title || "Pie Radio Live",
                    artist: data.artist || "The Number One Station",
                    artwork: data.cover_url || undefined
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
                    const newData = payload.new as any;
                    setCurrentTrack({
                        title: newData.title || "Pie Radio Live",
                        artist: newData.artist || "The Number One Station",
                        artwork: newData.cover_url || undefined
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const togglePlay = async () => {
        if (isLoading) return;
        setIsLoading(true);

        try {
            if (sound) {
                if (isPlaying) {
                    await sound.pauseAsync();
                    setIsPlaying(false);
                } else {
                    await sound.playAsync();
                    setIsPlaying(true);
                }
            } else {
                // First load
                console.log("Loading Sound");
                const { sound: newSound } = await Audio.Sound.createAsync(
                    { uri: STREAM_URL },
                    { shouldPlay: true }
                );
                setSound(newSound);
                setIsPlaying(true);

                // Handle playback status updates if needed
                newSound.setOnPlaybackStatusUpdate((status) => {
                    if (status.isLoaded) {
                        setIsPlaying(status.isPlaying);
                        if (status.didJustFinish) {
                            setIsPlaying(false);
                        }
                    } else {
                        if (status.error) {
                            console.error(`Playback Error: ${status.error}`);
                        }
                    }
                });
            }
        } catch (error) {
            console.error("Error toggling audio", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (sound) {
                console.log("Unloading Sound");
                sound.unloadAsync();
            }
        };
    }, [sound]);

    return (
        <MobileAudioContext.Provider value={{ isPlaying, isLoading, currentTrack, togglePlay }}>
            {children}
        </MobileAudioContext.Provider>
    );
}

export function useMobileAudio() {
    const context = useContext(MobileAudioContext);
    if (context === undefined) {
        throw new Error("useMobileAudio must be used within a MobileAudioProvider");
    }
    return context;
}
