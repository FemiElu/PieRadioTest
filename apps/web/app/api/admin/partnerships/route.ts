import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getAdminApiAccess, requireAdminApi } from "@/lib/auth/require-admin-api";
import { CreatePartnershipSchema } from "@/lib/partnerships/schema";
import { getPartnershipWorkspace } from "@/lib/partnerships/admin-queries";
import { getPartnershipCleanupStatus } from "@/lib/partnerships/cleanup";
import { isPartnershipReadyToPublish } from "@/components/partnerships/default-content";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const authError = await requireAdminApi(supabase);
        if (authError) return authError;
        const query = z.object({
            status: z.enum(["draft", "published", "archived"]).default("draft"),
            page: z.coerce.number().int().min(1).max(1_000_000).default(1),
        }).safeParse(Object.fromEntries(new URL(request.url).searchParams));
        if (!query.success) return NextResponse.json({ error: "Invalid status or page" }, { status: 422 });
        const [workspace, cleanup] = await Promise.all([
            getPartnershipWorkspace(supabase, query.data.status, query.data.page),
            getPartnershipCleanupStatus(supabase),
        ]);
        return NextResponse.json({ ...workspace, cleanup: { pending: cleanup.pendingCount, available: cleanup.configured } }, { headers: { "Cache-Control": "no-store" } });
    } catch (error) {
        console.error("[GET /api/admin/partnerships]", error);
        return NextResponse.json({ error: "Failed to load partnership pages" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { user, error: authError } = await getAdminApiAccess(supabase);
        if (authError) return authError;

        let body: unknown;
        try {
            body = await request.json();
        } catch {
            return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
        }

        const parsed = CreatePartnershipSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: "Validation failed", issues: parsed.error.flatten() },
                { status: 422 },
            );
        }
        if (parsed.data.status === "published") {
            const readinessError = isPartnershipReadyToPublish(parsed.data);
            if (readinessError) return NextResponse.json({ error: readinessError }, { status: 422 });
        }

        const { status, ...input } = parsed.data;
        const { data, error } = await supabase
            .from("partnership_pages")
            .insert({
                ...input,
                status,
                created_by: user.id,
                published_at: status === "published" ? new Date().toISOString() : null,
            })
            .select("id, slug")
            .single();

        if (error?.code === "23505") {
            const { data: existingPage } = await supabase
                .from("partnership_pages")
                .select("id")
                .eq("slug", input.slug)
                .maybeSingle();
            return NextResponse.json({
                error: "That page URL is already in use. Edit the existing page or choose a different URL.",
                code: "SLUG_IN_USE",
                existingPage,
            }, { status: 409 });
        }
        if (error || !data) {
            console.error("[POST /api/admin/partnerships]", error?.message);
            return NextResponse.json({ error: "Failed to create partnership page" }, { status: 500 });
        }
        return NextResponse.json(data, { status: 201 });
    } catch (error) {
        console.error("[POST /api/admin/partnerships]", error);
        return NextResponse.json({ error: "Failed to create partnership page" }, { status: 500 });
    }
}
