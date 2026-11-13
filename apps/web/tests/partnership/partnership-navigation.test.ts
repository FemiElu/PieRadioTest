import { describe, expect, it, vi } from "vitest";
import { getPublishedPartnershipLinks } from "@/lib/partnerships/navigation";

function client() {
    const query = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        abortSignal: vi.fn(),
    };
    return { supabase: { from: vi.fn(() => query) }, query };
}

describe("published partnership navigation", () => {
    it("selects only published public link fields and retrieves every page", async () => {
        const { supabase, query } = client();
        const firstPage = Array.from({ length: 500 }, (_, id) => ({ id: String(id), title: `Partner ${id}`, slug: `partner-${id}` }));
        const lastPage = [{ id: "last", title: "Zebra", slug: "zebra" }];
        query.abortSignal.mockResolvedValueOnce({ data: firstPage, error: null }).mockResolvedValueOnce({ data: lastPage, error: null });
        const signal = new AbortController().signal;
        const result = await getPublishedPartnershipLinks(supabase as never, signal);
        expect(result).toEqual([...firstPage, ...lastPage]);
        expect(supabase.from).toHaveBeenCalledWith("partnership_pages");
        expect(query.select).toHaveBeenCalledWith("id,slug,title");
        expect(query.eq).toHaveBeenCalledWith("status", "published");
        expect(query.order).toHaveBeenCalledWith("title", { ascending: true });
        expect(query.order).toHaveBeenCalledWith("id", { ascending: true });
        expect(query.range.mock.calls).toEqual([[0, 499], [500, 999]]);
        expect(query.abortSignal).toHaveBeenCalledWith(signal);
    });

    it("propagates database errors instead of reporting an empty list", async () => {
        const { supabase, query } = client();
        query.abortSignal.mockResolvedValue({ data: null, error: { message: "Unavailable" } });
        await expect(getPublishedPartnershipLinks(supabase as never, new AbortController().signal)).rejects.toThrow("Unavailable");
    });
});
