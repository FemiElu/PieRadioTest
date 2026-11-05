// @vitest-environment node
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/admin/partnerships/route";
import { createDefaultPartnership } from "@/components/partnerships/default-content";

const db = vi.hoisted(() => ({ getUser: vi.fn(), profile: vi.fn(), insert: vi.fn(), inserted: vi.fn(), existing: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({
    auth: { getUser: db.getUser },
    from: (table: string) => table === "profiles"
        ? { select: () => ({ eq: () => ({ single: db.profile }) }) }
        : {
            insert: db.insert,
            select: () => ({ eq: () => ({ maybeSingle: db.existing }) }),
        },
}) }));

const request = () => new NextRequest("http://localhost:3001/api/admin/partnerships", {
    method: "POST", body: JSON.stringify(createDefaultPartnership()), headers: { "Content-Type": "application/json" },
});

beforeEach(() => {
    vi.clearAllMocks();
    db.getUser.mockResolvedValue({ data: { user: { id: "admin-id" } } });
    db.profile.mockResolvedValue({ data: { role: "admin" }, error: null });
    db.insert.mockReturnValue({ select: () => ({ single: db.inserted }) });
    db.inserted.mockResolvedValue({ data: { id: "saved-page", slug: "new-partnership" }, error: null });
    db.existing.mockResolvedValue({ data: { id: "existing-page" }, error: null });
});

describe("creating a partnership page", () => {
    it("creates the page using the verified admin without a second auth lookup", async () => {
        const response = await POST(request());
        expect(response.status).toBe(201);
        expect(await response.json()).toEqual({ id: "saved-page", slug: "new-partnership" });
        expect(db.insert).toHaveBeenCalledWith(expect.objectContaining({ created_by: "admin-id", status: "draft" }));
        expect(db.getUser).toHaveBeenCalledTimes(1);
    });

    it("returns the existing page for recovery after a duplicate slug", async () => {
        db.inserted.mockResolvedValue({ data: null, error: { code: "23505" } });
        const response = await POST(request());
        expect(response.status).toBe(409);
        expect(await response.json()).toMatchObject({ code: "SLUG_IN_USE", existingPage: { id: "existing-page" } });
    });

    it("rejects unauthenticated submissions before writing", async () => {
        db.getUser.mockResolvedValue({ data: { user: null } });
        expect((await POST(request())).status).toBe(401);
        expect(db.insert).not.toHaveBeenCalled();
    });

    it("rejects authenticated users who are not admins", async () => {
        db.profile.mockResolvedValue({ data: { role: "presenter" }, error: null });
        expect((await POST(request())).status).toBe(403);
        expect(db.insert).not.toHaveBeenCalled();
    });
});
