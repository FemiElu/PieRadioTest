import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdminApi } from "@/lib/auth/require-admin-api";
import { getPartnershipById } from "@/lib/partnerships/queries";
import { UpdatePartnershipSchema } from "@/lib/partnerships/schema";
import { isPartnershipReadyToPublish } from "@/components/partnerships/default-content";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteContext) {
    try {
        const supabase = await createClient();
        const authError = await requireAdminApi(supabase);
        if (authError) return authError;

        const { id } = await params;
        const page = await getPartnershipById(supabase, id);
        return page
            ? NextResponse.json({ page })
            : NextResponse.json({ error: "Partnership page not found" }, { status: 404 });
    } catch (error) {
        console.error("[GET /api/admin/partnerships/[id]]", error);
        return NextResponse.json({ error: "Failed to load partnership page" }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
    try {
        const supabase = await createClient();
        const authError = await requireAdminApi(supabase);
        if (authError) return authError;

        let body: unknown;
        try {
            body = await request.json();
        } catch {
            return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
        }

        const parsed = UpdatePartnershipSchema.safeParse(body);
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

        const { id } = await params;
        const current = await getPartnershipById(supabase, id);
        if (!current) {
            return NextResponse.json({ error: "Partnership page not found" }, { status: 404 });
        }

        if (current.status !== "draft" && current.slug !== parsed.data.slug) {
            return NextResponse.json(
                { error: "The URL cannot be changed after a page has been published" },
                { status: 409 },
            );
        }

        const { updated_at: _version, status, ...input } = parsed.data;
        const publishedAt = status === "published"
            ? current.published_at ?? new Date().toISOString()
            : current.published_at;

        // PostgreSQL compares timestamps by value, including microseconds, so
        // equivalent Z/+00:00 representations match while stale versions fail.
        const { data, error } = await supabase
            .from("partnership_pages")
            .update({ ...input, status, published_at: publishedAt })
            .eq("id", id)
            .eq("updated_at", parsed.data.updated_at)
            .select("id, slug, updated_at")
            .maybeSingle();

        if (error?.code === "23505") {
            return NextResponse.json({ error: "That page URL is already in use" }, { status: 409 });
        }
        if (error) {
            console.error("[PATCH /api/admin/partnerships/[id]]", error.message);
            return NextResponse.json({ error: "Failed to save partnership page" }, { status: 500 });
        }
        if (!data) {
            return NextResponse.json(
                { error: "This page changed after you opened it. Reload it before saving." },
                { status: 409 },
            );
        }
        return NextResponse.json(data);
    } catch (error) {
        console.error("[PATCH /api/admin/partnerships/[id]]", error);
        return NextResponse.json({ error: "Failed to save partnership page" }, { status: 500 });
    }
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
    try {
        const supabase = await createClient();
        const authError = await requireAdminApi(supabase);
        if (authError) return authError;

        const { id } = await params;
        const page = await getPartnershipById(supabase, id);
        if (!page) {
            return NextResponse.json({ error: "Partnership page not found" }, { status: 404 });
        }

        const { error } = await supabase
            .from("partnership_pages")
            .update({ status: "archived" })
            .eq("id", id);
        if (error) {
            console.error("[DELETE /api/admin/partnerships/[id]]", error.message);
            return NextResponse.json({ error: "Failed to archive partnership page" }, { status: 500 });
        }
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[DELETE /api/admin/partnerships/[id]]", error);
        return NextResponse.json({ error: "Failed to archive partnership page" }, { status: 500 });
    }
}
