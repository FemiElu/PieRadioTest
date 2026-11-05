import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { createClient } from "@/lib/supabase/server";
import { requireAdminApi } from "@/lib/auth/require-admin-api";
import { getPartnershipById } from "@/lib/partnerships/queries";
import { getPartnershipAdminRecord } from "@/lib/partnerships/admin-queries";
import { requeuePartnershipCleanup } from "@/lib/partnerships/cleanup";

export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const IMAGE_BUCKET = "news-images";
const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const supabase = await createClient();
        const authError = await requireAdminApi(supabase);
        if (authError) return authError;

        const { id } = await params;
        if (!await getPartnershipById(supabase, id)) {
            return NextResponse.json({ error: "Partnership page not found" }, { status: 404 });
        }

        let formData: FormData;
        try {
            formData = await request.formData();
        } catch {
            return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
        }
        const file = formData.get("file");
        if (!(file instanceof File)) {
            return NextResponse.json({ error: "Choose an image to upload" }, { status: 400 });
        }
        if (!IMAGE_TYPES.has(file.type)) {
            return NextResponse.json({ error: "Use a JPEG, PNG, WebP or GIF image" }, { status: 415 });
        }
        if (file.size > MAX_IMAGE_SIZE) {
            return NextResponse.json({ error: "Images must be 5 MB or smaller" }, { status: 413 });
        }

        let webp: Buffer;
        try {
            webp = await sharp(Buffer.from(await file.arrayBuffer()), { limitInputPixels: 40_000_000 })
                .rotate()
                .webp({ quality: 88 })
                .toBuffer();
        } catch {
            return NextResponse.json({ error: "The uploaded file is not a readable image" }, { status: 415 });
        }
        if (webp.length > MAX_IMAGE_SIZE) {
            return NextResponse.json({ error: "The converted image exceeds 5 MB. Choose a smaller image." }, { status: 413 });
        }

        const storagePath = `partnerships/${id}/${randomUUID()}.webp`;
        const { error: uploadError } = await supabase.storage
            .from(IMAGE_BUCKET)
            .upload(storagePath, webp, { contentType: "image/webp", upsert: false });
        if (uploadError) {
            console.error("[POST /api/admin/partnerships/[id]/upload]", uploadError.message);
            if (/bucket.*not found/i.test(uploadError.message)) {
                return NextResponse.json({
                    error: "Image storage is not configured. Apply the partnership image-storage migration to this Supabase project, then retry.",
                    code: "IMAGE_STORAGE_NOT_CONFIGURED",
                }, { status: 503 });
            }
            if (/row.level security|unauthorized|not authorized|permission denied/i.test(uploadError.message)) {
                return NextResponse.json({
                    error: "Image storage does not allow admin uploads. Apply the partnership image-storage migration to this Supabase project, then retry.",
                    code: "IMAGE_STORAGE_PERMISSIONS_MISSING",
                }, { status: 503 });
            }
            return NextResponse.json({ error: "Image upload failed" }, { status: 500 });
        }

        const discardUnattachedUpload = async () => {
            const { error } = await supabase.storage.from(IMAGE_BUCKET).remove([storagePath]);
            if (error) await requeuePartnershipCleanup(supabase, id, `A late image upload still needs removal: ${error.message}`);
        };
        let parent;
        try { parent = await getPartnershipAdminRecord(supabase, id); }
        catch (error) {
            await discardUnattachedUpload().catch(cleanupError => console.error("[partnership upload cleanup]", cleanupError));
            throw error;
        }
        if (!parent) {
            await discardUnattachedUpload().catch(cleanupError => console.error("[partnership upload cleanup]", cleanupError));
            return NextResponse.json({ error: "This partnership was deleted while the image was uploading." }, { status: 410 });
        }
        const { data } = supabase.storage.from(IMAGE_BUCKET).getPublicUrl(storagePath);
        return NextResponse.json({ src: data.publicUrl }, { status: 201 });
    } catch (error) {
        console.error("[POST /api/admin/partnerships/[id]/upload]", error);
        return NextResponse.json({ error: "Image upload failed" }, { status: 500 });
    }
}
