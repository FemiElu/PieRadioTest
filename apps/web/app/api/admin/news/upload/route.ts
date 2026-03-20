/**
 * POST /api/admin/news/upload
 * Uploads a news article cover image to the `news-images` Supabase Storage bucket.
 *
 * - Requires admin role
 * - Accepts multipart/form-data with a `file` field
 * - Max file size: 5 MB
 * - Accepted types: image/jpeg, image/png, image/webp, image/gif
 * - Returns: { publicUrl: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const BUCKET = 'news-images';

/** Helper: verify caller is an admin. */
async function requireAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden: admin access required' }, { status: 403 });
    }
    return null;
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const authError = await requireAdmin(supabase);
        if (authError) return authError;

        let formData: FormData;
        try {
            formData = await request.formData();
        } catch {
            return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
        }

        const file = formData.get('file');
        if (!file || !(file instanceof File)) {
            return NextResponse.json({ error: 'No file provided. Include a "file" field in the form data.' }, { status: 400 });
        }

        // Validate type
        if (!ALLOWED_TYPES.includes(file.type)) {
            return NextResponse.json(
                { error: `File type not allowed. Accepted: ${ALLOWED_TYPES.join(', ')}` },
                { status: 415 },
            );
        }

        // Validate size
        if (file.size > MAX_FILE_SIZE_BYTES) {
            return NextResponse.json({ error: 'File exceeds the 5 MB size limit.' }, { status: 413 });
        }

        // Build a unique storage path to avoid collisions
        const ext = file.name.split('.').pop() ?? 'jpg';
        const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
        const storagePath = `covers/${uniqueName}`;

        const { error: uploadError } = await supabase.storage
            .from(BUCKET)
            .upload(storagePath, file, {
                contentType: file.type,
                upsert: false,
            });

        if (uploadError) {
            console.error('[POST /api/admin/news/upload] Storage upload error:', uploadError.message);
            return NextResponse.json({ error: 'Image upload failed' }, { status: 500 });
        }

        const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);

        return NextResponse.json({ publicUrl: urlData.publicUrl }, { status: 201 });
    } catch (error) {
        console.error('[POST /api/admin/news/upload] Unexpected error:', error);
        return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
    }
}
