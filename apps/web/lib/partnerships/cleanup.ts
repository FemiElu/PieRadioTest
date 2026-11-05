import type { SupabaseClient } from "@supabase/supabase-js";

type CleanupClient = Pick<SupabaseClient<any>, "from" | "rpc" | "storage">;
export type PartnershipCleanupJobSummary = { id: string; page_id: string; last_error: string | null };
export type PartnershipCleanupStatus = { configured: boolean; pendingCount: number; jobs: PartnershipCleanupJobSummary[] };
export type PartnershipCleanupResult = { job_id: string; page_id: string; status: "completed" | "pending"; error?: string };
export type PartnershipCleanupRun = { completed: number; pending: number; failed: number; results: PartnershipCleanupResult[] };
type CleanupObject = { bucket: "news-images" | "partnership-audio"; path: string };
type ClaimedJob = { id: string; page_id: string; lock_token: string; attempts: number; status: string };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isPartnershipCleanupUnavailable(error: { code?: string; message?: string } | null | undefined) {
    return Boolean(error && (
        error.code === "42P01" || error.code === "PGRST205" || error.code === "PGRST202"
        || /could not find.*(?:partnership_cleanup|partnership_draft)|(?:partnership_cleanup_jobs).*does not exist/i.test(error.message ?? "")
    ));
}

/** Missing rollout migration is a capability state; real outages remain errors. */
export async function getPartnershipCleanupStatus(client: CleanupClient): Promise<PartnershipCleanupStatus> {
    const { data, count, error } = await client.from("partnership_cleanup_jobs")
        .select("id, page_id, last_error", { count: "exact" })
        .neq("status", "completed").order("created_at", { ascending: false }).limit(50);
    if (error) {
        if (isPartnershipCleanupUnavailable(error)) return { configured: false, pendingCount: 0, jobs: [] };
        throw new Error(`Could not load media cleanup status: ${error.message}`);
    }
    return { configured: true, pendingCount: count ?? data?.length ?? 0, jobs: (data ?? []) as PartnershipCleanupJobSummary[] };
}

function cleanupObjects(value: unknown, pageId: string): CleanupObject[] {
    if (!UUID.test(pageId) || !Array.isArray(value)) throw new Error("Invalid media cleanup manifest");
    const prefix = `partnerships/${pageId}/`;
    const unique = new Map<string, CleanupObject>();
    for (const item of value) {
        if (!item || typeof item !== "object") throw new Error("Invalid media cleanup object");
        const { bucket, path } = item as Record<string, unknown>;
        if ((bucket !== "news-images" && bucket !== "partnership-audio") || typeof path !== "string"
            || !path.startsWith(prefix) || path.length <= prefix.length
            || path.split("/").some(segment => segment === "." || segment === "..") || path.includes("\\")) {
            throw new Error("Media cleanup refused an object outside its draft namespace");
        }
        unique.set(`${bucket}:${path}`, { bucket, path });
    }
    return Array.from(unique.values());
}

function missingObject(error: { message?: string; statusCode?: string | number }) {
    const message = error.message ?? "";
    return !/bucket/i.test(message) && (/object.*not found|not found.*object|NoSuchKey/i.test(message)
        || String(error.statusCode) === "404");
}

async function manifest(client: CleanupClient, job: ClaimedJob, existingOnly = false) {
    const { data, error } = await client.rpc("get_partnership_cleanup_manifest", {
        p_job_id: job.id, p_existing_only: existingOnly, p_lock_token: job.lock_token,
    });
    if (error) throw new Error(`Could not inspect cleanup objects: ${error.message}`);
    return cleanupObjects(data, job.page_id);
}

async function finish(client: CleanupClient, job: ClaimedJob, errorMessage: string | null) {
    const now = new Date();
    const delay = Math.min(24 * 60 * 60_000, 60_000 * (2 ** Math.min(job.attempts, 10)));
    const { data, error } = await client.from("partnership_cleanup_jobs").update({
        status: errorMessage ? "pending" : "completed",
        last_error: errorMessage?.slice(0, 2_000) ?? null,
        next_attempt_at: new Date(now.getTime() + delay).toISOString(),
        completed_at: errorMessage ? null : now.toISOString(),
        locked_at: null,
        lock_token: null,
    }).eq("id", job.id).eq("lock_token", job.lock_token).select("id").maybeSingle();
    if (error) throw new Error(`Could not record media cleanup result: ${error.message}`);
    if (!data) throw new Error("Media cleanup ownership changed; another worker will finish this job");
}

/** An upload finishing after deletion can reopen only its existing durable job. */
export async function requeuePartnershipCleanup(client: CleanupClient, pageId: string, errorMessage: string): Promise<void> {
    if (!UUID.test(pageId)) throw new Error("Invalid deleted draft identity");
    const { data, error } = await client.from("partnership_cleanup_jobs").update({
        status: "pending",
        completed_at: null,
        next_attempt_at: new Date().toISOString(),
        locked_at: null,
        lock_token: null,
        last_error: errorMessage.slice(0, 2_000),
    }).eq("page_id", pageId).select("id").maybeSingle();
    if (error) throw new Error(`Could not requeue late upload cleanup: ${error.message}`);
    if (!data) throw new Error("No durable cleanup job exists for this deleted draft");
}

/** Storage deletion is idempotent; SQL only owns queue metadata, never bytes. */
export async function runPartnershipCleanup(
    client: CleanupClient,
    options: { jobIds?: string[]; pageIds?: string[]; limit?: number; force?: boolean } = {},
): Promise<PartnershipCleanupRun> {
    const limit = Math.max(1, Math.min(20, options.limit ?? 20));
    let query = client.from("partnership_cleanup_jobs").select("id, page_id");
    if (!options.jobIds && !options.pageIds) query = query.neq("status", "completed");
    query = query.order("next_attempt_at", { ascending: true }).limit(limit);
    if (options.jobIds) {
        if (!options.jobIds.length) return { completed: 0, pending: 0, failed: 0, results: [] };
        query = query.in("id", options.jobIds.slice(0, 20));
    }
    if (options.pageIds) {
        if (!options.pageIds.length) return { completed: 0, pending: 0, failed: 0, results: [] };
        query = query.in("page_id", options.pageIds.slice(0, 20));
    }
    const { data: jobs, error: jobsError } = await query;
    if (jobsError) throw new Error(`Could not load media cleanup jobs: ${jobsError.message}`);
    const results: PartnershipCleanupResult[] = [];

    for (const summary of jobs ?? []) {
        let job: ClaimedJob | null = null;
        try {
            const { data, error } = await client.rpc("claim_partnership_cleanup_job", {
                p_job_id: summary.id, p_force: options.force ?? false,
            });
            if (error) throw new Error(`Could not claim media cleanup job: ${error.message}`);
            if (!data) {
                results.push({ job_id: summary.id, page_id: summary.page_id, status: "pending" });
                continue;
            }
            job = data as ClaimedJob;
            if (job.status === "completed") {
                results.push({ job_id: job.id, page_id: job.page_id, status: "completed" });
                continue;
            }
            if (!UUID.test(job.id) || !UUID.test(job.page_id) || !UUID.test(job.lock_token)) throw new Error("Invalid cleanup job identity");
            const objects = await manifest(client, job);
            for (const bucket of ["news-images", "partnership-audio"] as const) {
                const paths = objects.filter(object => object.bucket === bucket).map(object => object.path);
                for (let offset = 0; offset < paths.length; offset += 100) {
                    const { error: removeError } = await client.storage.from(bucket).remove(paths.slice(offset, offset + 100));
                    if (removeError && !missingObject(removeError)) throw new Error(`Could not remove ${bucket} media: ${removeError.message}`);
                }
            }
            if ((await manifest(client, job, true)).length) throw new Error("Some media remains or an upload is still completing. Cleanup will retry.");
            await finish(client, job, null);
            results.push({ job_id: job.id, page_id: job.page_id, status: "completed" });
        } catch (error) {
            let message = error instanceof Error ? error.message : "Media cleanup failed";
            if (job && job.status !== "completed") {
                try { await finish(client, job, message); }
                catch (saveError) { message += ` ${saveError instanceof Error ? saveError.message : "Could not save retry status."}`; }
            }
            results.push({ job_id: summary.id, page_id: summary.page_id, status: "pending", error: message });
        }
    }
    return {
        completed: results.filter(result => result.status === "completed").length,
        pending: results.filter(result => result.status === "pending").length,
        failed: results.filter(result => result.error).length,
        results,
    };
}
