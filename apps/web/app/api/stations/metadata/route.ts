import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import {
    requirePresenterOrAdmin,
    handleAuthError,
    isAuthError
} from "@/lib/auth/role-guards";

/**
 * POST /api/stations/metadata
 * 
 * Update the current station metadata (now playing info).
 * 
 * Required Role: presenter or admin
 * 
 * Body:
 * - title: string (required) - Song/show title
 * - artist: string (required) - Artist/presenter name
 * - cover_url: string (optional) - Album art URL
 */
export async function POST(request: Request) {
    try {
        // 1. Authentication & Authorization
        // Only presenters and admins can update station metadata
        const { user, profile } = await requirePresenterOrAdmin();

        // 2. Parse and validate request body
        const body = await request.json();
        const { title, artist, cover_url } = body;

        if (!title || !artist) {
            return NextResponse.json(
                { error: "Missing required fields: title and artist" },
                { status: 400 }
            );
        }

        // 3. Get Supabase client (with user context for RLS)
        const supabase = await createClient();

        // 4. Update Current Metadata (ID=1)
        const { error: updateError } = await (supabase.from('station_metadata' as any) as any)
            .update({
                title,
                artist,
                cover_url: cover_url || null,
                updated_at: new Date().toISOString()
            })
            .eq('id', 1);

        if (updateError) {
            console.error("Metadata update error:", updateError);
            throw new Error("Failed to update station metadata");
        }

        // 5. Log History
        const { error: historyError } = await (supabase.from('station_metadata_history' as any) as any)
            .insert({
                metadata_id: 1,
                title,
                artist,
                cover_url: cover_url || null
            });

        if (historyError) {
            // Non-critical - log but don't fail the request
            console.error("Failed to save metadata history:", historyError);
        }

        return NextResponse.json({
            success: true,
            message: "Metadata updated",
            updated_by: profile.username || user.email
        });

    } catch (error: unknown) {
        // Handle auth errors with appropriate status codes
        if (isAuthError(error)) {
            return handleAuthError(error);
        }

        // Handle other errors
        console.error("Metadata API Error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Internal server error" },
            { status: 500 }
        );
    }
}
