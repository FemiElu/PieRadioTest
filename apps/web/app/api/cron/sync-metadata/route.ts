import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// Force dynamic to ensure it runs on every request
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    // 1. Authorization Check
    const authHeader = request.headers.get('authorization');
    const isCronAction = process.env.CRON_SECRET && authHeader === `Bearer ${process.env.CRON_SECRET}`;

    // 2. Initialize Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!supabaseUrl || !supabaseServiceKey) {
        console.error("Missing Supabase configuration");
        return NextResponse.json({ error: "Server Configuration Error" }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    try {
        // 3. Lazy Sync Check: Only fetch from AIIR if data is older than 55 seconds
        // This makes client-side polling safe and free.
        const { data: current } = await supabase.from('station_metadata').select('updated_at').eq('id', 1).single();
        const lastUpdate = current?.updated_at ? new Date(current.updated_at).getTime() : 0;
        const now = Date.now();

        if (!isCronAction && (now - lastUpdate < 55000)) {
            return NextResponse.json({ success: true, message: "Metadata is fresh", cached: true });
        }

        // 4. Fetch from AIIR
        const aiirResponse = await fetch("https://streaming-api.aiir.com/mounts/metadata/history/dnjp99nozxavv?limit=1", {
            cache: 'no-store'
        });

        if (!aiirResponse.ok) {
            throw new Error(`AIIR API failed: ${aiirResponse.statusText}`);
        }

        const data = await aiirResponse.json();

        if (!Array.isArray(data) || data.length === 0) {
            return NextResponse.json({ message: "No track data available" });
        }

        const rawTitle = data[0].title || "";
        // AIIR returns "Artist - Title" usually
        let artist = "Pie Radio";
        let title = "Live Stream";

        // Simple parsing logic
        const separatorValues = [" - ", " – ", " | "]; // Common separators
        let separatorFound = false;

        for (const sep of separatorValues) {
            if (rawTitle.includes(sep)) {
                const parts = rawTitle.split(sep);
                artist = parts[0].trim();
                title = parts.slice(1).join(sep).trim(); // Reconstruct rest if multiple separators
                separatorFound = true;
                break;
            }
        }

        if (!separatorFound && rawTitle) {
            // Fallback: If no separator, use the whole string as title unless it looks like a system msg
            title = rawTitle;
        }

        // 3. Fetch Artwork from iTunes
        let cover_url = "";
        if (artist !== "Pie Radio" && title !== "Live Stream") {
            try {
                const query = encodeURIComponent(`${artist} ${title}`);
                const itunesResponse = await fetch(`https://itunes.apple.com/search?term=${query}&entity=song&limit=1`);

                if (itunesResponse.ok) {
                    const itunesData = await itunesResponse.json();
                    if (itunesData.results && itunesData.results.length > 0) {
                        // Get high res image (600x600 is usually available by replacing 100x100)
                        const rawUrl = itunesData.results[0].artworkUrl100;
                        cover_url = rawUrl.replace("100x100bb", "600x600bb");
                    }
                }
            } catch (err) {
                console.error("iTunes lookup failed:", err);
                // Continue without artwork
            }
        }

        const payload = {
            title,
            artist,
            cover_url: cover_url || null,
            updated_at: new Date().toISOString()
        };

        const { error: updateError } = await supabase
            .from('station_metadata')
            .update(payload)
            .eq('id', 1);

        if (updateError) {
            throw updateError;
        }

        return NextResponse.json({
            success: true,
            synced: { artist, title, cover_url }
        });

    } catch (error: any) {
        console.error("Sync Error:", error);
        return NextResponse.json(
            { error: error.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}
