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
    hasError: boolean;
    errorMessage: string;
    currentTrack: Track | null;
    togglePlay: () => Promise<void>;
    retry: () => Promise<void>;
}

const MobileAudioContext = createContext<MobileAudioContextType | undefined>(undefined);

const STREAM_URL = "https://stream.aiir.com/dnjp99nozxavv";

export function MobileAudioProvider({ children }: { children: React.ReactNode }) {
    const [sound, setSound] = useState<Audio.Sound | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [currentTrack, setCurrentTrack] = useState<Track | null>({
        title: "Pie Radio Live",
        artist: "The Number One Station",
        artwork: undefined
    });

    const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const retryCountRef = useRef(0);
    const MAX_RETRIES = 3;

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
                console.warn("Error configuring audio mode", e);
            }
        };
        configureAudio();
    }, []);

    // Realtime Metadata
    useEffect(() => {
        const fetchInitial = async () => {
            const { data } = await supabase.from('station_metadata').select('*').eq('id', 1 as any).single();
            if (data) {
                const metadata = data as any;
                setCurrentTrack({
                    title: metadata.title || "Pie Radio Live",
                    artist: metadata.artist || "The Number One Station",
                    artwork: metadata.cover_url || undefined
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

    const initAudio = async (attempt = 1) => {
        setIsLoading(true);
        setHasError(false);
        setErrorMessage("");

        try {
            if (sound) {
                await sound.unloadAsync();
                setSound(null);
            }

            const { sound: newSound } = await Audio.Sound.createAsync(
                { uri: STREAM_URL },
                { shouldPlay: true }
            );
            
            setSound(newSound);
            setIsPlaying(true);
            retryCountRef.current = 0; // reset on success

            newSound.setOnPlaybackStatusUpdate((status) => {
                if (status.isLoaded) {
                    setIsPlaying(status.isPlaying);
                    // If live stream finishes unexpectedly, it's often a network interrupt
                    if (status.didJustFinish) {
                        setIsPlaying(false);
                        scheduleReconnect();
                    }
                } else {
                    if (status.error) {
                        setHasError(true);
                        setErrorMessage("Playback dropped. Trying to reconnect...");
                        scheduleReconnect();
                    }
                }
            });

        } catch (error: any) {
            setHasError(true);
            setIsPlaying(false);
            
            if (attempt <= MAX_RETRIES) {
                setErrorMessage(`Connection failed. Retrying... (${attempt}/${MAX_RETRIES})`);
                scheduleReconnect(attempt);
            } else {
                setErrorMessage(error.message || "Unable to connect to the live stream.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const scheduleReconnect = (attempt = retryCountRef.current + 1) => {
        if (attempt > MAX_RETRIES) {
            setErrorMessage("Stream disconnected. Please try playing again.");
            return;
        }

        retryCountRef.current = attempt;
        if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
        
        // Exponential backoff: 2s, 4s, 8s
        const backoffMs = Math.pow(2, attempt) * 1000;
        
        retryTimeoutRef.current = setTimeout(() => {
            initAudio(attempt + 1);
        }, backoffMs);
    };

    const togglePlay = async () => {
        if (isLoading) return;

        if (hasError) {
            // Manual retry resets the flow
            retryCountRef.current = 0;
            if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
            await initAudio(1);
            return;
        }

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
                await initAudio(1);
            }
        } catch (error) {
            setHasError(true);
            setErrorMessage("Playback failed. Please try again.");
            setIsPlaying(false);
        }
    };

    const retry = async () => {
        retryCountRef.current = 0;
        if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
        await initAudio(1);
    };

    useEffect(() => {
        return () => {
            if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
            if (sound) {
                sound.unloadAsync();
            }
        };
    }, [sound]);

    return (
        <MobileAudioContext.Provider value={{ isPlaying, isLoading, hasError, errorMessage, currentTrack, togglePlay, retry }}>
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
