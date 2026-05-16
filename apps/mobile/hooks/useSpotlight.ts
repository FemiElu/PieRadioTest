import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface SpotlightItem {
    id: string;
    title: string;
    artist_name: string;
    image_url: string;
    link_url: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

// In-memory cache to prevent unnecessary network requests
let spotlightCache: SpotlightItem | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export function useSpotlight() {
    const [spotlight, setSpotlight] = useState<SpotlightItem | null>(spotlightCache);
    const [loading, setLoading] = useState(!spotlightCache);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchSpotlight() {
            const now = Date.now();
            if (spotlightCache && (now - cacheTimestamp < CACHE_TTL)) {
                setSpotlight(spotlightCache);
                setLoading(false);
                return;
            }

            try {
                setError(null);

                const { data, error } = await supabase
                    .from('spotlights')
                    .select('*')
                    .eq('is_active', true)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle();

                if (error) throw error;

                if (data) {
                    spotlightCache = data;
                    cacheTimestamp = now;
                    setSpotlight(data);
                } else {
                    spotlightCache = null;
                    setSpotlight(null);
                }
            } catch (err: any) {
                console.error('Error fetching spotlight:', err);
                // Fallback to cache if available
                if (spotlightCache) {
                    setSpotlight(spotlightCache);
                } else {
                    setError('Network error: ' + err.message);
                }
            } finally {
                setLoading(false);
            }
        }

        fetchSpotlight();
    }, []);

    return { spotlight, loading, error };
}
