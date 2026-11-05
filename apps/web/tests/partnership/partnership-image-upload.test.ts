// @vitest-environment node
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/admin/partnerships/[id]/upload/route";

const storage = vi.hoisted(() => ({ upload: vi.fn(), from: vi.fn(), convert: vi.fn(), authorize: vi.fn(), parent: vi.fn(), remove: vi.fn(), requeue: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ storage: { from: storage.from } }) }));
vi.mock("@/lib/auth/require-admin-api", () => ({ requireAdminApi: storage.authorize }));
vi.mock("@/lib/partnerships/queries", () => ({ getPartnershipById: async () => ({ id: "saved-page" }) }));
vi.mock("@/lib/partnerships/admin-queries", () => ({ getPartnershipAdminRecord: storage.parent }));
vi.mock("@/lib/partnerships/cleanup", () => ({ requeuePartnershipCleanup: storage.requeue }));
vi.mock("sharp", () => ({ default: () => ({ rotate: () => ({ webp: () => ({ toBuffer: storage.convert }) }) }) }));

const context = { params: Promise.resolve({ id: "saved-page" }) };
function request(type = "image/png") {
    const data = new FormData();
    data.set("file", new File(["test-image"], "logo.png", { type }));
    return new NextRequest("http://localhost:3001/api/admin/partnerships/saved-page/upload", { method: "POST", body: data });
}

beforeEach(() => {
    vi.clearAllMocks();
    storage.authorize.mockResolvedValue(null);
    storage.convert.mockResolvedValue(Buffer.from("converted-webp"));
    storage.upload.mockResolvedValue({ error: null });
    storage.parent.mockResolvedValue({ id: "saved-page" });
    storage.remove.mockResolvedValue({ error: null });
    storage.requeue.mockResolvedValue(undefined);
    storage.from.mockReturnValue({
        upload: storage.upload,
        remove: storage.remove,
        getPublicUrl: (path: string) => ({ data: { publicUrl: `https://example.supabase.co/storage/v1/object/public/news-images/${path}` } }),
    });
});

describe("partnership image storage", () => {
    it("uploads the converted image to the partnership path and returns its public URL", async () => {
        const response = await POST(request(), context);
        expect(response.status).toBe(201);
        expect(storage.from).toHaveBeenCalledWith("news-images");
        expect(storage.upload).toHaveBeenCalledWith(expect.stringMatching(/^partnerships\/saved-page\/.+\.webp$/), Buffer.from("converted-webp"), { contentType: "image/webp", upsert: false });
        expect((await response.json()).src).toContain("/news-images/partnerships/saved-page/");
    });

    it("explains the missing bucket instead of hiding it as a generic upload failure", async () => {
        storage.upload.mockResolvedValue({ error: { message: "Bucket not found" } });
        const response = await POST(request(), context);
        expect(response.status).toBe(503);
        expect(await response.json()).toMatchObject({ code: "IMAGE_STORAGE_NOT_CONFIGURED", error: expect.stringContaining("migration") });
    });

    it("explains missing storage permissions without bypassing RLS", async () => {
        storage.upload.mockResolvedValue({ error: { message: "new row violates row-level security policy" } });
        const response = await POST(request(), context);
        expect(response.status).toBe(503);
        expect((await response.json()).code).toBe("IMAGE_STORAGE_PERMISSIONS_MISSING");
    });

    it("rejects an encoded image larger than the bucket limit before attempting upload", async () => {
        storage.convert.mockResolvedValue(Buffer.alloc(5 * 1024 * 1024 + 1));
        expect((await POST(request(), context)).status).toBe(413);
        expect(storage.upload).not.toHaveBeenCalled();
    });

    it("rejects an unsupported file before conversion or upload", async () => {
        expect((await POST(request("application/pdf"), context)).status).toBe(415);
        expect(storage.convert).not.toHaveBeenCalled();
        expect(storage.upload).not.toHaveBeenCalled();
    });

    it("removes an image whose draft was deleted while the upload was in flight", async () => {
        storage.parent.mockResolvedValue(null);
        expect((await POST(request(), context)).status).toBe(410);
        expect(storage.remove).toHaveBeenCalledWith([expect.stringMatching(/^partnerships\/saved-page\/.+\.webp$/)]);
    });

    it("reopens durable cleanup when a late upload cannot be removed immediately", async () => {
        storage.parent.mockResolvedValue(null);
        storage.remove.mockResolvedValue({ error: { message: "Storage unavailable" } });
        expect((await POST(request(), context)).status).toBe(410);
        expect(storage.requeue).toHaveBeenCalledWith(expect.anything(), "saved-page", expect.stringContaining("Storage unavailable"));
    });
});
