// @vitest-environment node
import { NextRequest, NextResponse } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/admin/partnerships/route";

const mock = vi.hoisted(() => ({ auth: vi.fn(), workspace: vi.fn(), status: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({}) }));
vi.mock("@/lib/auth/require-admin-api", () => ({ requireAdminApi: mock.auth, getAdminApiAccess: vi.fn() }));
vi.mock("@/lib/partnerships/admin-queries", () => ({ getPartnershipWorkspace: mock.workspace }));
vi.mock("@/lib/partnerships/cleanup", () => ({ getPartnershipCleanupStatus: mock.status }));
const request = (query = "") => new NextRequest(`http://localhost:3001/api/admin/partnerships${query}`);

beforeEach(() => {
    vi.clearAllMocks();
    mock.auth.mockResolvedValue(null);
    mock.workspace.mockResolvedValue({ pages: [{ id: "saved-draft" }], meta: { page: 1, pageSize: 3, total: 1, totalPages: 1, counts: { draft: 1, published: 0, archived: 0 } } });
    mock.status.mockResolvedValue({ configured: false, pendingCount: 0, jobs: [] });
});

describe("workspace API", () => {
    it("lists drafts even before permanent deletion is configured", async () => {
        const response = await GET(request());
        expect(response.status).toBe(200);
        expect(response.headers.get("Cache-Control")).toBe("no-store");
        expect(await response.json()).toMatchObject({ pages: [{ id: "saved-draft" }], cleanup: { available: false, pending: 0 } });
        expect(mock.workspace).toHaveBeenCalledWith(expect.anything(), "draft", 1);
    });

    it("passes the requested status and page to the bounded workspace query", async () => {
        await GET(request("?status=published&page=2"));
        expect(mock.workspace).toHaveBeenCalledWith(expect.anything(), "published", 2);
    });

    it("reports server failures as failures rather than empty lists", async () => {
        mock.workspace.mockRejectedValue(new Error("Unavailable"));
        expect((await GET(request())).status).toBe(500);
    });

    it.each(["?status=all", "?page=0", "?page=abc"])("rejects invalid workspace input %s", async query => {
        expect((await GET(request(query))).status).toBe(422);
        expect(mock.workspace).not.toHaveBeenCalled();
    });

    it("rejects callers denied by the admin guard", async () => {
        mock.auth.mockResolvedValue(NextResponse.json({ error: "Forbidden" }, { status: 403 }));
        expect((await GET(request())).status).toBe(403);
        expect(mock.workspace).not.toHaveBeenCalled();
    });
});
