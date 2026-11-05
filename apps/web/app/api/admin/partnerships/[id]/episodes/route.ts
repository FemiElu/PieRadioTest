import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdminApi } from "@/lib/auth/require-admin-api";
import { getPartnershipById } from "@/lib/partnerships/queries";

export const runtime = "nodejs";

const EpisodeInput = z.object({
    title: z.string().trim().min(1).max(200),
    description: z.string().max(5_000).nullable().default(null),
    aired_at: z.string().date(),
    file_key: z.string().min(1).max(500),
    cover_image_url: z.string().max(2_048).nullable().default(null),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteContext) {
    try {
        const supabase = await createClient();
        const authError = await requireAdminApi(supabase);
        if (authError) return authError;
        const { id } = await params;
        if (!await getPartnershipById(supabase, id)) {
            return NextResponse.json({ error: "Partnership page not found" }, { status: 404 });
        }

        const { data, error } = await supabase
            .from("episodes")
            .select("id, title, description, aired_at, file_key, cover_image_url, duration_seconds")
            .eq("partnership_page_id", id)
            .order("aired_at", { ascending: false });
        if (error) {
            console.error("[GET partnership episodes]", error.message);
            return NextResponse.json({ error: "Failed to load audio" }, { status: 500 });
        }
        return NextResponse.json({ episodes: data ?? [] });
    } catch (error) {
        console.error("[GET partnership episodes]", error);
        return NextResponse.json({ error: "Failed to load audio" }, { status: 500 });
    }
}

export async function POST(request: NextRequest, { params }: RouteContext) {
    try {
        const supabase = await createClient();
        const authError = await requireAdminApi(supabase);
        if (authError) return authError;
        const { id } = await params;
        if (!await getPartnershipById(supabase, id)) {
            return NextResponse.json({ error: "Partnership page not found" }, { status: 404 });
        }

        let body: unknown;
        try {
            body = await request.json();
        } catch {
            return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
        }
        const parsed = EpisodeInput.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ error: "Check the audio details", issues: parsed.error.flatten() }, { status: 422 });
        }

        const prefix = `partnerships/${id}/`;
        if (!parsed.data.file_key.startsWith(prefix) || !parsed.data.file_key.toLowerCase().endsWith(".mp3")) {
            return NextResponse.json({ error: "Audio must be an MP3 uploaded to this page" }, { status: 422 });
        }

        const relativeKey = parsed.data.file_key.slice(prefix.length);
        const { data: objects, error: listError } = await supabase.storage
            .from("partnership-audio")
            .list(`partnerships/${id}`);
        if (listError || !objects?.some((object) => object.name === relativeKey)) {
            return NextResponse.json({ error: "Upload the audio file before saving it" }, { status: 422 });
        }

        const { data, error } = await supabase
            .from("episodes")
            .insert({
                ...parsed.data,
                partnership_page_id: id,
                category: null,
                presenter_id: null,
                published_at: new Date().toISOString(),
            })
            .select("id, title, description, aired_at, file_key, cover_image_url, duration_seconds")
            .single();

        if (error) {
            console.error("[POST partnership episode]", error.message);
            return NextResponse.json({ error: "Failed to save this audio" }, { status: 500 });
        }
        return NextResponse.json({ episode: data }, { status: 201 });
    } catch (error) {
        console.error("[POST partnership episode]", error);
        return NextResponse.json({ error: "Failed to save this audio" }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
    try {
        const supabase = await createClient();
        const authError = await requireAdminApi(supabase);
        if (authError) return authError;
        const { id } = await params;
        if (!await getPartnershipById(supabase, id)) {
            return NextResponse.json({ error: "Partnership page not found" }, { status: 404 });
        }

        let body: { episodeId?: unknown };
        try {
            body = await request.json();
        } catch {
            return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
        }
        const episodeId = z.string().uuid().safeParse(body.episodeId);
        if (!episodeId.success) {
            return NextResponse.json({ error: "Invalid audio selection" }, { status: 422 });
        }

        const { data: episode } = await supabase
            .from("episodes")
            .select("id, file_key")
            .eq("id", episodeId.data)
            .eq("partnership_page_id", id)
            .maybeSingle();
        if (!episode) {
            return NextResponse.json({ error: "Audio not found" }, { status: 404 });
        }

        const { error } = await supabase
            .from("episodes")
            .delete()
            .eq("id", episodeId.data)
            .eq("partnership_page_id", id);
        if (error) {
            console.error("[DELETE partnership episode]", error.message);
            return NextResponse.json({ error: "Failed to remove this audio" }, { status: 500 });
        }

        if (episode.file_key?.startsWith(`partnerships/${id}/`)) {
            const { error: storageError } = await supabase.storage.from("partnership-audio").remove([episode.file_key]);
            if (storageError) console.error("[DELETE partnership episode] Storage cleanup failed:", storageError.message);
        }
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[DELETE partnership episode]", error);
        return NextResponse.json({ error: "Failed to remove this audio" }, { status: 500 });
    }
}
