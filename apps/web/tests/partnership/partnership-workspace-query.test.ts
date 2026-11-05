// @vitest-environment node
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@packages/types";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getPartnershipWorkspace, summarizePartnership } from "@/lib/partnerships/admin-queries";
import type { PartnershipPageRow } from "@/lib/partnerships/queries";
import { createDefaultPartnership } from "@/components/partnerships/default-content";

const row = (id: string, status = "draft") => ({ ...createDefaultPartnership(), id, status,
    created_by: null, created_at: "2026-11-04T10:00:00+00:00", updated_at: "2026-11-04T10:00:00.123456+00:00", published_at: null,
}) as PartnershipPageRow;
let countError: { message: string } | null;
let listError: { message: string } | null;
let records: PartnershipPageRow[];
const range = vi.fn();
const order = vi.fn();
const client = { from: () => {
    let status = "draft";
    const query = {
        select: () => query,
        eq: (_field: string, value: string) => { status = value; return query; },
        order: (column: string, options: unknown) => { order(column, options); return query; },
        range: async (first: number, last: number) => {
            range(first, last);
            return { data: records.filter(item => item.status === status).slice(first, last + 1), error: listError };
        },
        then: (resolve: (value: unknown) => unknown, reject: (error: unknown) => unknown) =>
            Promise.resolve({ count: records.filter(item => item.status === status).length, error: countError }).then(resolve, reject),
    };
    return query;
} } as unknown as SupabaseClient<Database>;

beforeEach(() => {
    vi.clearAllMocks(); countError = null; listError = null;
    records = [row("draft-1"), row("draft-2"), row("draft-3"), row("draft-4"), row("live-1", "published")];
});

describe("the shared partnership workspace", () => {
    it("shows three drafts per page without imposing a storage limit", async () => {
        const result = await getPartnershipWorkspace(client, "draft", 1);
        expect(result.pages).toHaveLength(3);
        expect(result.meta).toEqual({ page: 1, pageSize: 3, total: 4, totalPages: 2, counts: { draft: 4, published: 1, archived: 0 } });
        expect(order.mock.calls).toEqual([["updated_at", { ascending: false }], ["id", { ascending: false }]]);
        expect(result.pages[0]).not.toHaveProperty("content");
    });

    it("clamps a removed or out-of-range page before issuing the row query", async () => {
        const result = await getPartnershipWorkspace(client, "draft", 100);
        expect(result.meta.page).toBe(2);
        expect(result.pages.map(item => item.id)).toEqual(["draft-4"]);
        expect(range).toHaveBeenCalledWith(3, 5);
    });

    it("keeps malformed records visible and marks their content for review", async () => {
        records[0] = { ...records[0], content: {} };
        const result = await getPartnershipWorkspace(client, "draft", 1);
        expect(result.pages[0]).toMatchObject({ id: "draft-1", content_valid: false });
        expect(result.pages[0].publish_issues.length).toBeGreaterThan(0);
    });

    it("does not turn failed count or list queries into a misleading empty workspace", async () => {
        countError = { message: "Database unavailable" };
        await expect(getPartnershipWorkspace(client, "draft", 1)).rejects.toThrow("Database unavailable");
        countError = null; listError = { message: "List failed" };
        await expect(getPartnershipWorkspace(client, "draft", 1)).rejects.toThrow("List failed");
    });

    it("does not return unsafe thumbnail URLs from malformed records", () => {
        const result = summarizePartnership({ ...row("draft-unsafe"), social_image_url: "javascript:alert(1)", content: {} });
        expect(result.thumbnail_url).toBeNull();
        expect(result.content_valid).toBe(false);
    });
});
