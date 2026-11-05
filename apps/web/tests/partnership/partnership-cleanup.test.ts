// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getPartnershipCleanupStatus, requeuePartnershipCleanup, runPartnershipCleanup } from "@/lib/partnerships/cleanup";

const PAGE = "22222222-2222-4222-8222-222222222222";
const JOB = "33333333-3333-4333-8333-333333333333";
const LOCK = "44444444-4444-4444-8444-444444444444";
const PATH = `partnerships/${PAGE}/image.webp`;

function mockClient() {
    const listResult = { data: [{ id: JOB, page_id: PAGE, last_error: null }], count: 1, error: null as { code?: string; message: string } | null };
    const list: any = { then: (resolve: (value: unknown) => unknown) => Promise.resolve(listResult).then(resolve) };
    for (const method of ["select", "neq", "order", "limit", "in"]) list[method] = vi.fn(() => list);
    const saved = vi.fn().mockResolvedValue({ data: { id: JOB }, error: null });
    const updateChain: any = { maybeSingle: saved };
    for (const method of ["eq", "select"]) updateChain[method] = vi.fn(() => updateChain);
    const update = vi.fn(() => updateChain);
    const remove = vi.fn().mockResolvedValue({ data: [], error: null });
    const claim = { id: JOB, page_id: PAGE, status: "processing", lock_token: LOCK, attempts: 1 };
    const rpc = vi.fn<(...args: any[]) => Promise<{ data: any; error: any }>>(async (name: string, args: Record<string, unknown>) => {
        if (name === "claim_partnership_cleanup_job") return { data: claim, error: null };
        return { data: args.p_existing_only ? [] : [{ bucket: "news-images", path: PATH }], error: null };
    });
    const client: any = {
        from: vi.fn(() => ({ select: list.select, update })),
        rpc,
        storage: { from: vi.fn(() => ({ remove })) },
    };
    return { client, list, listResult, update, updateChain, saved, remove, rpc, claim };
}

beforeEach(() => vi.clearAllMocks());

describe("partnership cleanup capability", () => {
    it("reports a missing rollout migration without hiding ordinary database failures", async () => {
        const db = mockClient();
        db.listResult.error = { code: "PGRST205", message: "Missing partnership_cleanup_jobs" };
        expect(await getPartnershipCleanupStatus(db.client)).toEqual({ configured: false, pendingCount: 0, jobs: [] });
        db.listResult.error = { code: "08006", message: "Connection failed" };
        await expect(getPartnershipCleanupStatus(db.client)).rejects.toThrow("Connection failed");
    });

    it("returns pending cleanup jobs for the persistent workspace notice", async () => {
        const db = mockClient();
        expect(await getPartnershipCleanupStatus(db.client)).toMatchObject({ configured: true, pendingCount: 1, jobs: [{ id: JOB, page_id: PAGE }] });
    });
});

describe("durable media cleanup", () => {
    it("removes only validated objects and completes the claimed lease", async () => {
        const db = mockClient();
        const result = await runPartnershipCleanup(db.client, { jobIds: [JOB], force: true });
        expect(result).toMatchObject({ completed: 1, pending: 0, failed: 0 });
        expect(db.remove).toHaveBeenCalledExactlyOnceWith([PATH]);
        expect(db.rpc).toHaveBeenCalledWith("get_partnership_cleanup_manifest", { p_job_id: JOB, p_existing_only: false, p_lock_token: LOCK });
        expect(db.update).toHaveBeenCalledWith(expect.objectContaining({ status: "completed", last_error: null, lock_token: null }));
        expect(db.updateChain.eq).toHaveBeenCalledWith("lock_token", LOCK);
    });

    it("treats an already absent object as an idempotent success", async () => {
        const db = mockClient();
        db.remove.mockResolvedValue({ error: { message: "Object not found", statusCode: "404" } });
        expect((await runPartnershipCleanup(db.client)).completed).toBe(1);
    });

    it("keeps bucket/configuration failures pending rather than calling them missing objects", async () => {
        const db = mockClient();
        db.remove.mockResolvedValue({ error: { message: "Bucket not found", statusCode: "404" } });
        const result = await runPartnershipCleanup(db.client);
        expect(result).toMatchObject({ completed: 0, pending: 1, failed: 1 });
        expect(db.update).toHaveBeenCalledWith(expect.objectContaining({ status: "pending", last_error: expect.stringContaining("Bucket not found"), completed_at: null }));
    });

    it("refuses out-of-namespace objects before deleting any storage data", async () => {
        const db = mockClient();
        db.rpc.mockImplementation(async name => ({ data: name === "claim_partnership_cleanup_job" ? db.claim : [{ bucket: "news-images", path: "covers/another-page.webp" }], error: null }));
        const result = await runPartnershipCleanup(db.client);
        expect(result.pending).toBe(1);
        expect(result.results[0].error).toContain("outside its draft namespace");
        expect(db.remove).not.toHaveBeenCalled();
    });

    it("leaves a job pending when another worker already holds its lease", async () => {
        const db = mockClient();
        db.rpc.mockResolvedValue({ data: null, error: null });
        const result = await runPartnershipCleanup(db.client, { jobIds: [JOB] });
        expect(result.results).toEqual([{ job_id: JOB, page_id: PAGE, status: "pending" }]);
        expect(db.remove).not.toHaveBeenCalled();
        expect(db.update).not.toHaveBeenCalled();
    });

    it("returns completed status for an explicit retry of an already completed deletion", async () => {
        const db = mockClient();
        db.rpc.mockResolvedValue({ data: { ...db.claim, status: "completed" }, error: null });
        expect((await runPartnershipCleanup(db.client, { jobIds: [JOB] })).completed).toBe(1);
        expect(db.list.neq).not.toHaveBeenCalled();
        expect(db.remove).not.toHaveBeenCalled();
    });

    it("requeues media that is still present after deletion instead of claiming success", async () => {
        const db = mockClient();
        db.rpc.mockImplementation(async name => ({ data: name === "claim_partnership_cleanup_job" ? db.claim : [{ bucket: "news-images", path: PATH }], error: null }));
        const result = await runPartnershipCleanup(db.client);
        expect(result).toMatchObject({ completed: 0, pending: 1 });
        expect(result.results[0].error).toContain("upload is still completing");
    });

    it("cannot mark a job completed after a newer retry has invalidated its lease", async () => {
        const db = mockClient();
        db.saved.mockResolvedValue({ data: null, error: null });
        const result = await runPartnershipCleanup(db.client);
        expect(result).toMatchObject({ completed: 0, pending: 1 });
        expect(result.results[0].error).toContain("ownership changed");
    });
});

describe("uploads finishing after page deletion", () => {
    it("reopens the existing job and invalidates the previous worker lease", async () => {
        const db = mockClient();
        await requeuePartnershipCleanup(db.client, PAGE, "Late upload removal failed");
        expect(db.update).toHaveBeenCalledWith(expect.objectContaining({ status: "pending", completed_at: null, locked_at: null, lock_token: null, last_error: "Late upload removal failed" }));
        expect(db.updateChain.eq).toHaveBeenCalledWith("page_id", PAGE);
    });

    it("does not invent a cleanup job when the page was never durably deleted", async () => {
        const db = mockClient();
        db.saved.mockResolvedValue({ data: null, error: null });
        await expect(requeuePartnershipCleanup(db.client, PAGE, "Late upload failed")).rejects.toThrow("No durable cleanup job");
    });
});
