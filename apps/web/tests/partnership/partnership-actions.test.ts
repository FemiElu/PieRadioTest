// @vitest-environment node
import { NextRequest, NextResponse } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/admin/partnerships/actions/route";
import { createDefaultPartnership } from "@/components/partnerships/default-content";

const mocks = vi.hoisted(() => ({ auth: vi.fn(), record: vi.fn(), update: vi.fn(), eq: vi.fn(), saved: vi.fn(), rpc: vi.fn(), status: vi.fn(), cleanup: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ from: () => ({ update: mocks.update }), rpc: mocks.rpc }) }));
vi.mock("@/lib/auth/require-admin-api", () => ({ requireAdminApi: mocks.auth }));
vi.mock("@/lib/partnerships/admin-queries", () => ({ getPartnershipAdminRecord: mocks.record }));
vi.mock("@/lib/partnerships/cleanup", () => ({ getPartnershipCleanupStatus: mocks.status, runPartnershipCleanup: mocks.cleanup }));
const id = "11111111-1111-4111-8111-111111111111";
const otherId = "22222222-2222-4222-8222-222222222222";
const jobId = "33333333-3333-4333-8333-333333333333";
const version = "2026-11-04T10:00:00.123456+00:00";
const item = { id, updated_at: version };
function readyPage(pageId = id) {
    const page = { ...createDefaultPartnership(), id: pageId, updated_at: version, published_at: null };
    for (const image of [page.content.hero.background, page.content.hero.stationLogo, page.content.hero.partnerLogo, page.content.event.flyer]) {
        image.src = "/assets/test.webp"; image.alt = "Campaign image";
    }
    page.content.gallery.images = [{ src: "/assets/gallery.webp", alt: "Campaign event" }];
    page.content.socials.links.forEach(link => { link.href = "https://example.com"; });
    return page;
}
const request = (body: unknown) => new NextRequest("http://localhost:3001/api/admin/partnerships/actions", { method: "POST", body: JSON.stringify(body), headers: { "Content-Type": "application/json" } });

beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue(null);
    mocks.record.mockImplementation(async (_client, pageId) => readyPage(pageId));
    mocks.update.mockReturnValue({ eq: mocks.eq });
    mocks.eq.mockReturnValue({ eq: mocks.eq, select: () => ({ maybeSingle: mocks.saved }) });
    mocks.saved.mockResolvedValue({ data: { id, updated_at: version }, error: null });
    mocks.rpc.mockResolvedValue({ data: { outcome: "deleted", page_id: id, job_id: jobId }, error: null });
    mocks.status.mockResolvedValue({ configured: true, pendingCount: 0, jobs: [] });
    mocks.cleanup.mockResolvedValue({ completed: 1, pending: 0, failed: 0, results: [{ job_id: jobId, page_id: id, status: "completed" }] });
});

describe("partnership draft actions", () => {
    it("publishes ready saved drafts while reporting incomplete drafts independently", async () => {
        mocks.record.mockImplementation(async (_client, pageId) => pageId === id ? readyPage() : { ...createDefaultPartnership(), id: otherId, updated_at: version });
        const response = await POST(request({ action: "publish", items: [item, { id: otherId, updated_at: version }] }));
        expect(response.status).toBe(200);
        const { results } = await response.json();
        expect(results[0].status).toBe("published");
        expect(results[1]).toMatchObject({ id: otherId, status: "blocked" });
        expect(results[1].issues.length).toBeGreaterThan(0);
        expect(mocks.update).toHaveBeenCalledTimes(1);
        expect(mocks.eq).toHaveBeenCalledWith("status", "draft");
        expect(mocks.eq).toHaveBeenCalledWith("updated_at", version);
    });

    it("does not publish a stale version when the atomic update finds no matching draft", async () => {
        mocks.saved.mockResolvedValue({ data: null, error: null });
        const response = await POST(request({ action: "publish", items: [item] }));
        expect((await response.json()).results[0].status).toBe("conflict");
    });

    it("keeps malformed saved content visible as a blocked publish result", async () => {
        mocks.record.mockResolvedValue({ ...readyPage(), content: {} });
        const response = await POST(request({ action: "publish", items: [item] }));
        expect((await response.json()).results[0].status).toBe("blocked");
        expect(mocks.update).not.toHaveBeenCalled();
    });

    it.each([
        { items: [] },
        { items: [item, item] },
        { items: [item, { ...item, id: otherId }, { ...item, id: jobId }, { ...item, id: "44444444-4444-4444-8444-444444444444" }] },
    ])("rejects empty, duplicate, or oversized selections", async ({ items }) => {
        expect((await POST(request({ action: "publish", items }))).status).toBe(422);
        expect(mocks.update).not.toHaveBeenCalled();
    });

    it.each([401, 403])("rejects access denied by the admin guard (%s)", async status => {
        mocks.auth.mockResolvedValue(NextResponse.json({ error: "Denied" }, { status }));
        expect((await POST(request({ action: "publish", items: [item] }))).status).toBe(status);
        expect(mocks.record).not.toHaveBeenCalled();
        expect(mocks.rpc).not.toHaveBeenCalled();
    });

    it("requires typed confirmation before permanent deletion", async () => {
        expect((await POST(request({ action: "delete_drafts", items: [item] }))).status).toBe(422);
        expect(mocks.rpc).not.toHaveBeenCalled();
    });

    it("disables deletion until the migration is configured", async () => {
        mocks.status.mockResolvedValue({ configured: false, pendingCount: 0, jobs: [] });
        const response = await POST(request({ action: "delete_drafts", items: [item], confirmation: "DELETE" }));
        expect(response.status).toBe(503);
        expect((await response.json()).code).toBe("DELETION_NOT_CONFIGURED");
        expect(mocks.rpc).not.toHaveBeenCalled();
    });

    it("deletes through the transactional RPC then runs durable storage cleanup", async () => {
        const response = await POST(request({ action: "delete_drafts", items: [item], confirmation: "DELETE" }));
        expect((await response.json()).results[0].status).toBe("deleted");
        expect(mocks.rpc).toHaveBeenCalledWith("delete_partnership_draft", { p_id: id, p_updated_at: version });
        expect(mocks.cleanup).toHaveBeenCalledWith(expect.anything(), { jobIds: [jobId], limit: 3, force: true });
    });

    it("does not claim media was removed when cleanup fails after the page was deleted", async () => {
        mocks.cleanup.mockRejectedValue(new Error("Storage temporarily unavailable"));
        const response = await POST(request({ action: "delete_drafts", items: [item], confirmation: "DELETE" }));
        expect((await response.json()).results[0].status).toBe("cleanup_pending");
    });

    it("reports missing explicit job results as pending instead of silently complete", async () => {
        mocks.cleanup.mockResolvedValue({ completed: 0, pending: 0, failed: 0, results: [] });
        const response = await POST(request({ action: "delete_drafts", items: [item], confirmation: "DELETE" }));
        expect((await response.json()).results[0].status).toBe("cleanup_pending");
    });

    it("preserves an imported/shared draft when the RPC blocks deletion", async () => {
        mocks.rpc.mockResolvedValue({ data: { outcome: "blocked", page_id: id, error: "Resolve imported mixes first." }, error: null });
        const response = await POST(request({ action: "delete_drafts", items: [item], confirmation: "DELETE" }));
        expect((await response.json()).results[0].status).toBe("blocked");
        expect(mocks.cleanup).not.toHaveBeenCalled();
    });

    it("maps a missing draft with a null job id without turning it into a server failure", async () => {
        mocks.rpc.mockResolvedValue({ data: { outcome: "not_found", page_id: id, job_id: null }, error: null });
        const response = await POST(request({ action: "delete_drafts", items: [item], confirmation: "DELETE" }));
        expect((await response.json()).results[0].status).toBe("not_found");
    });

    it("offers an authenticated cleanup retry with real remaining job counts", async () => {
        mocks.status.mockResolvedValue({ configured: true, pendingCount: 2, jobs: [] });
        const response = await POST(request({ action: "retry_cleanup" }));
        expect(await response.json()).toEqual({ cleanup: { pending: 2, completed: 1, failed: 0 } });
    });
});
