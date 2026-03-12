'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { requireServerAuth } from '@/lib/auth/server-auth';
import { z } from 'zod';

// ─── Toggle Liked Show ──────────────────────────────────────────────────────

const showSchema = z.object({
    showId: z.string().min(1),
    showTitle: z.string().optional(),
    showImageUrl: z.string().optional()
});

export async function toggleLikedShow(showId: string, options?: { title?: string, image?: string }) {
    try {
        const { user } = await requireServerAuth();
        const supabase = await createClient();
        showSchema.parse({ showId, showTitle: options?.title, showImageUrl: options?.image });

        // Check if already liked (Check by showId OR title for robustness in schedules)
        const query = supabase
            .from('liked_shows')
            .select('id')
            .eq('user_id', user.id);

        if (options?.title) {
            query.or(`show_id.eq.${showId},show_title.eq."${options.title}"`);
        } else {
            query.eq('show_id', showId);
        }

        const { data: existing, error: fetchError } = await query.maybeSingle();

        if (fetchError && fetchError.code !== 'PGRST116') {
            console.error('Error fetching liked show:', fetchError);
            return { liked: false, error: 'Database error. Did you run the latest migration?' };
        }

        if (existing) {
            const { error: deleteError } = await supabase.from('liked_shows').delete().eq('id', existing.id);
            if (deleteError) throw deleteError;
            revalidatePath('/profile');
            return { liked: false };
        }

        const { error: insertError } = await supabase.from('liked_shows').insert({
            user_id: user.id,
            show_id: showId,
            show_title: options?.title || null,
            show_image_url: options?.image || null
        });
        if (insertError) throw insertError;

        revalidatePath('/profile');
        return { liked: true };
    } catch (e: any) {
        console.error('toggleLikedShow error:', e);
        return { liked: false, error: e.message || 'Failed to toggle favourite' };
    }
}

// ─── Toggle Liked Presenter ─────────────────────────────────────────────────

const presenterSchema = z.object({ presenterId: z.string().min(1) });

export async function toggleLikedPresenter(presenterId: string) {
    try {
        const { user } = await requireServerAuth();
        const supabase = await createClient();
        presenterSchema.parse({ presenterId });

        const { data: existing, error: fetchError } = await supabase
            .from('liked_presenters')
            .select('id')
            .eq('user_id', user.id)
            .eq('presenter_id', presenterId)
            .maybeSingle();

        if (fetchError && fetchError.code !== 'PGRST116') {
            console.error('Error fetching liked presenter:', fetchError);
            return { liked: false, error: 'Database error. Did you run the migration?' };
        }

        if (existing) {
            const { error: deleteError } = await supabase.from('liked_presenters').delete().eq('id', existing.id);
            if (deleteError) throw deleteError;
            revalidatePath('/profile');
            return { liked: false };
        }

        const { error: insertError } = await supabase.from('liked_presenters').insert({ user_id: user.id, presenter_id: presenterId });
        if (insertError) throw insertError;

        revalidatePath('/profile');
        return { liked: true };
    } catch (e: any) {
        console.error('toggleLikedPresenter error:', e);
        return { liked: false, error: e.message || 'Failed to toggle favourite' };
    }
}

// ─── Toggle Liked Song ──────────────────────────────────────────────────────

const songSchema = z.object({
    songTitle: z.string().min(1),
    artistName: z.string().optional().nullable(),
    coverUrl: z.string().optional().nullable(),
});

export async function toggleLikedSong(data: z.infer<typeof songSchema>) {
    try {
        const { user } = await requireServerAuth();
        const supabase = await createClient();
        const parsed = songSchema.parse(data);

        const { data: existing, error: fetchError } = await supabase
            .from('liked_songs')
            .select('id')
            .eq('user_id', user.id)
            .eq('song_title', parsed.songTitle)
            .eq('artist_name', parsed.artistName ?? '')
            .maybeSingle();

        if (fetchError && fetchError.code !== 'PGRST116') {
            console.error('Error fetching liked song:', fetchError);
            return { liked: false, error: 'Database error. Did you run the migration?' };
        }

        if (existing) {
            const { error: deleteError } = await supabase.from('liked_songs').delete().eq('id', existing.id);
            if (deleteError) throw deleteError;
            revalidatePath('/profile');
            return { liked: false };
        }

        const { error: insertError } = await supabase.from('liked_songs').insert({
            user_id: user.id,
            song_title: parsed.songTitle,
            artist_name: parsed.artistName ?? '',
            cover_url: parsed.coverUrl ?? null,
        });
        if (insertError) throw insertError;

        revalidatePath('/profile');
        return { liked: true };
    } catch (e: any) {
        console.error('toggleLikedSong error:', e);
        return { liked: false, error: e.message || 'Failed to toggle favourite' };
    }
}

// ─── Check Liked State (for initial render) ─────────────────────────────────

export async function getUserLikedIds(): Promise<{
    showIds: string[];
    presenterIds: string[];
}> {
    const { user } = await requireServerAuth();
    const supabase = await createClient();

    const [shows, presenters] = await Promise.all([
        supabase.from('liked_shows').select('show_id').eq('user_id', user.id),
        supabase.from('liked_presenters').select('presenter_id').eq('user_id', user.id),
    ]);

    return {
        showIds: (shows.data ?? []).map(r => r.show_id),
        presenterIds: (presenters.data ?? []).map(r => r.presenter_id),
    };
}
