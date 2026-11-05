// @vitest-environment node
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PATCH } from "@/app/api/admin/partnerships/[id]/route";
import { createDefaultPartnership } from "@/components/partnerships/default-content";

const db = vi.hoisted(() => ({ current: vi.fn(), update: vi.fn(), eq: vi.fn(), saved: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ from: () => ({ update: db.update }) }) }));
vi.mock("@/lib/auth/require-admin-api", () => ({ requireAdminApi: async () => null }));
vi.mock("@/lib/partnerships/queries", () => ({ getPartnershipById: db.current }));

const version = "2026-11-04T10:00:00.123456+00:00";
const context = { params: Promise.resolve({ id: "saved-page" }) };
const request = (updated_at: string) => new NextRequest("http://localhost:3001/api/admin/partnerships/saved-page", {
    method: "PATCH", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...createDefaultPartnership(), updated_at }),
});

beforeEach(() => {
    vi.clearAllMocks();
    db.current.mockResolvedValue({ ...createDefaultPartnership(), id: "saved-page", updated_at: version, published_at: null });
    db.update.mockReturnValue({ eq: db.eq });
    db.eq.mockReturnValue({ eq: db.eq, select: () => ({ maybeSingle: db.saved }) });
    db.saved.mockResolvedValue({ data: { id: "saved-page", slug: "new-partnership", updated_at: "2026-11-04T10:30:00.654321+00:00" }, error: null });
});

describe("updating a partnership with a database version timestamp", () => {
    it.each([version, "2026-11-04T10:00:00.123456Z"])("passes %s unchanged to the atomic database update", async (timestamp) => {
        const response = await PATCH(request(timestamp), context);
        expect(response.status).toBe(200);
        expect(db.eq).toHaveBeenCalledWith("id", "saved-page");
        expect(db.eq).toHaveBeenCalledWith("updated_at", timestamp);
        expect((await response.json()).updated_at).toBe("2026-11-04T10:30:00.654321+00:00");
    });

    it("retains conflict protection when the database rejects a version differing by one microsecond", async () => {
        db.saved.mockResolvedValue({ data: null, error: null });
        const staleVersion = "2026-11-04T10:00:00.123455+00:00";
        const response = await PATCH(request(staleVersion), context);
        expect(response.status).toBe(409);
        expect(db.eq).toHaveBeenCalledWith("updated_at", staleVersion);
        expect((await response.json()).error).toContain("changed after you opened it");
    });

    it("rejects malformed timestamps before attempting an update", async () => {
        expect((await PATCH(request("invalid"), context)).status).toBe(422);
        expect(db.update).not.toHaveBeenCalled();
    });
});
