import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export interface CurrentShow {
    id: string;
    title: string;
    description: string | null;
    start_time: string;
    end_time: string;
    is_live: boolean;
    image_url: string | null;
    presenter_name: string | null;
}

export function useCurrentShow() {
    const [currentShow, setCurrentShow] = useState<CurrentShow | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCurrentShow = async () => {
            const now = new Date().toISOString();

            try {
                const { data, error } = await supabase
                    .from("schedules")
                    .select(`
                        id,
                        title,
                        description,
                        start_time,
                        end_time,
                        is_live,
                        image_url,
                        presenter: presenter_id(
                            full_name,
                            username
                        )
                    `)
                    .lte("start_time", now)
                    .gte("end_time", now)
                    .order("start_time", { ascending: false })
                    .limit(1);

                if (error) throw error;

                if (data && data.length > 0) {
                    const show = data[0];
                    setCurrentShow({
                        id: show.id,
                        title: show.title,
                        description: show.description,
                        start_time: show.start_time,
                        end_time: show.end_time,
                        is_live: !!show.is_live,
                        image_url: show.image_url,
                        presenter_name: (show.presenter as any)?.full_name || (show.presenter as any)?.username || "Pie Radio Presenter"
                    });
                } else {
                    setCurrentShow(null);
                }
            } catch (err) {
                console.error("Error fetching current show:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchCurrentShow();
        const interval = setInterval(fetchCurrentShow, 60000);
        return () => clearInterval(interval);
    }, []);

    return { currentShow, loading };
}
