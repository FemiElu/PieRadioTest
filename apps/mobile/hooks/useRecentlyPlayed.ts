import { useState, useEffect } from 'react';

export interface PlayedTrack {
    title: string;
    artist: string;
    time: string;
}

export function useRecentlyPlayed() {
    const [recentlyPlayed, setRecentlyPlayed] = useState<PlayedTrack[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchRecentTracks = async () => {
        try {
            const res = await fetch(
                "https://streaming-api.aiir.com/mounts/metadata/history/dnjp99nozxavv?limit=10"
            );

            if (!res.ok) throw new Error("Failed to fetch recent tracks");

            const data = await res.json();

            const parsed = data.map((item: any) => {
                // Parse AIIR format "Artist - Title"
                const splitIndex = item.title.indexOf("-");
                let artist = "Unknown Artist";
                let songTitle = item.title;

                if (splitIndex !== -1) {
                    artist = item.title.substring(0, splitIndex).trim();
                    songTitle = item.title.substring(splitIndex + 1).trim();
                }

                // Relative time calculation
                const timestamp = new Date(item.timestamp);
                const now = new Date();
                const diffMs = now.getTime() - timestamp.getTime();
                const diffMins = Math.round(diffMs / 60000);

                let relativeTime = "Just now";
                if (diffMins > 0) {
                    relativeTime = diffMins === 1 ? "1 min ago" : `${diffMins} mins ago`;
                }
                if (diffMins >= 60) {
                    const diffHrs = Math.floor(diffMins / 60);
                    relativeTime = diffHrs === 1 ? "1 hour ago" : `${diffHrs} hours ago`;
                }

                return {
                    title: songTitle,
                    artist: artist,
                    time: relativeTime,
                };
            });

            setRecentlyPlayed(parsed);
        } catch (error) {
            console.error("Error fetching recent tracks:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRecentTracks();
        const interval = setInterval(fetchRecentTracks, 60000);
        return () => clearInterval(interval);
    }, []);

    return { recentlyPlayed, loading, refresh: fetchRecentTracks };
}
