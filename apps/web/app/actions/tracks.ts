'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { requireServerAuth } from '@/lib/auth/server-auth';
import { z } from 'zod';

const trackMetadataSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    genre: z.string().min(1, 'Genre is required'),
    audio_url: z.string().min(1, 'Audio file path is required'),
    cover_art_url: z.string().optional(),
    pitch_notes: z.string().optional(),
});

export async function submitTrackMetadata(data: z.infer<typeof trackMetadataSchema>) {
    const { user } = await requireServerAuth();
    const supabase = await createClient();

    // Verify user has an artist profile
    const { data: artistProfile, error: profileError } = await supabase
        .from('artist_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

    if (profileError || !artistProfile) {
        return { success: false, error: 'You must have an artist profile to submit tracks.' };
    }

    const parsedData = trackMetadataSchema.parse(data);

    const { error } = await supabase.from('artist_uploads').insert({
        artist_id: user.id, // Foreign key references profiles.id
        status: 'pending',
        title: parsedData.title,
        genre: parsedData.genre,
        audio_url: parsedData.audio_url,
        cover_art_url: parsedData.cover_art_url,
        pitch_notes: parsedData.pitch_notes,
    });

    if (error) {
        console.error('Failed to submit track metadata:', error);
        return { success: false, error: 'Failed to submit track. Please try again.' };
    }

    revalidatePath('/profile');
    revalidatePath('/profile/upload');
    revalidatePath('/admin/artist-uploads');

    return { success: true };
}
