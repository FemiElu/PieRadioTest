import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireAdminApi } from "@/lib/auth/require-admin-api";
import { CreatePartnershipSchema } from "@/lib/partnerships/schema";
import { getPartnershipAdminRecord } from "@/lib/partnerships/admin-queries";
import { getPartnershipPublishIssues } from "@/components/partnerships/default-content";
import { getPartnershipCleanupStatus, runPartnershipCleanup } from "@/lib/partnerships/cleanup";
import type { PartnershipActionResult } from "@/lib/partnerships/admin-types";

export const runtime = "nodejs";
export const maxDuration = 60;

const Item = z.object({ id: z.string().uuid(), updated_at: z.string().datetime({ offset: true }) });
const Items = z.array(Item).min(1).max(3).refine(items => new Set(items.map(item => item.id)).size === items.length, "Select each draft only once");
const Action = z.discriminatedUnion("action", [
    z.object({ action: z.literal("publish"), items: Items }),
    z.object({ action: z.literal("delete_drafts"), items: Items, confirmation: z.literal("DELETE") }),
    z.object({ action: z.literal("retry_cleanup") }),
]);
const Deletion = z.object({
    outcome: z.enum(["deleted", "already_deleted", "conflict", "not_found", "blocked"]),
    page_id: z.string().uuid(), job_id: z.string().uuid().nullable().optional(), error: z.string().optional(),
});
type Client = Awaited<ReturnType<typeof createClient>>;
type SelectedItem = z.infer<typeof Item>;

async function publishDraft(supabase: Client, item: SelectedItem): Promise<PartnershipActionResult> {
    try {
        const current = await getPartnershipAdminRecord(supabase, item.id);
        if (!current) return { id: item.id, status: "not_found", message: "This draft no longer exists." };
        if (current.status !== "draft") return { id: item.id, status: "blocked", message: "Only drafts can be published from this folder." };
        const parsed = CreatePartnershipSchema.safeParse(current);
        if (!parsed.success) return {
            id: item.id, status: "blocked", message: "The saved content needs review before publishing.",
            issues: parsed.error.issues.slice(0, 12).map(issue => `${issue.path.join(".")}: ${issue.message}`),
        };
        const issues = getPartnershipPublishIssues(parsed.data);
        if (issues.length) return { id: item.id, status: "blocked", message: "Complete the required content before publishing.", issues };
        const { data, error } = await supabase.from("partnership_pages")
            .update({ status: "published", published_at: current.published_at ?? new Date().toISOString() })
            .eq("id", item.id).eq("status", "draft").eq("updated_at", item.updated_at)
            .select("id, updated_at").maybeSingle();
        if (error) throw new Error(error.message);
        if (!data) return { id: item.id, status: "conflict", message: "This draft changed. Reload it before publishing." };
        return { id: item.id, status: "published", updated_at: data.updated_at, message: "Partnership published." };
    } catch (error) {
        console.error("[partnership publish]", error);
        return { id: item.id, status: "failed", message: "Could not publish this draft. Please retry." };
    }
}

async function deleteDraft(supabase: Client, item: SelectedItem): Promise<{ result: PartnershipActionResult; jobId?: string }> {
    try {
        const { data, error } = await supabase.rpc("delete_partnership_draft", { p_id: item.id, p_updated_at: item.updated_at });
        if (error) throw new Error(error.message);
        const deletion = Deletion.parse(data);
        if (deletion.page_id !== item.id) throw new Error("Draft deletion returned an unexpected page identity");
        if (deletion.outcome === "deleted" || deletion.outcome === "already_deleted") {
            return { result: { id: item.id, status: "deleted", message: "Draft permanently deleted." }, jobId: deletion.job_id ?? undefined };
        }
        return { result: { id: item.id, status: deletion.outcome, message: deletion.error ?? "This draft could not be deleted." } };
    } catch (error) {
        console.error("[partnership delete draft]", error);
        return { result: { id: item.id, status: "failed", message: "Could not delete this draft. Please retry." } };
    }
}

function migrationRequired() {
    return NextResponse.json({ error: "Permanent deletion is not configured. Apply the partnership draft-deletion migration first.", code: "DELETION_NOT_CONFIGURED" }, { status: 503 });
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const authError = await requireAdminApi(supabase);
        if (authError) return authError;
        let body: unknown;
        try { body = await request.json(); }
        catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }
        const parsed = Action.safeParse(body);
        if (!parsed.success) return NextResponse.json({ error: "Check the selected drafts and confirmation", issues: parsed.error.flatten() }, { status: 422 });

        if (parsed.data.action === "publish") {
            const results = await Promise.all(parsed.data.items.map(item => publishDraft(supabase, item)));
            return NextResponse.json({ results });
        }
        const cleanupStatus = await getPartnershipCleanupStatus(supabase);
        if (!cleanupStatus.configured) return migrationRequired();
        if (parsed.data.action === "retry_cleanup") {
            const run = await runPartnershipCleanup(supabase, { limit: 3, force: true });
            const status = await getPartnershipCleanupStatus(supabase);
            return NextResponse.json({ cleanup: { pending: status.pendingCount, completed: run.completed, failed: run.results.filter(item => item.status === "pending").length } });
        }

        const deletions = await Promise.all(parsed.data.items.map(item => deleteDraft(supabase, item)));
        const jobIds = deletions.flatMap(item => item.jobId ? [item.jobId] : []);
        let pendingPages = new Set<string>();
        if (jobIds.length) {
            try {
                const run = await runPartnershipCleanup(supabase, { jobIds, limit: 3, force: true });
                const completedPages = new Set(run.results.filter(item => item.status === "completed").map(item => item.page_id));
                pendingPages = new Set(deletions.filter(item => item.jobId && !completedPages.has(item.result.id)).map(item => item.result.id));
            } catch (error) {
                console.error("[partnership delete cleanup]", error);
                // Database deletion already committed. A durable job owns the
                // remaining files; never report that the draft itself survived.
                pendingPages = new Set(deletions.filter(item => item.jobId).map(item => item.result.id));
            }
        }
        const results = deletions.map(({ result }) => pendingPages.has(result.id)
            ? { ...result, status: "cleanup_pending" as const, message: "Draft deleted. Media cleanup is pending; retry it from this workspace." }
            : result);
        return NextResponse.json({ results });
    } catch (error) {
        console.error("[POST partnership actions]", error);
        return NextResponse.json({ error: "Could not complete this action. Please retry." }, { status: 500 });
    }
}
