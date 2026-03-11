'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { requireServerAuth } from '@/lib/auth/server-auth';
import { z } from 'zod';

const onboardingSchema = z.object({
    type: z.enum(['listener', 'artist']),
    interests: z.array(z.string()).optional(),
    stageName: z.string().optional(),
    bio: z.string().optional(),
    spotifyId: z.string().optional(),
    appleMusicId: z.string().optional(),
});

export async function submitOnboarding(data: z.infer<typeof onboardingSchema>) {
    const { user, profile } = await requireServerAuth();
    const supabase = await createClient();

    const parsedData = onboardingSchema.parse(data);

    if (parsedData.type === 'listener') {
        // Only update interests or basic profile
        // Currently interests are not in schema, so we can ignore or store in a separate column/table later.
    } else if (parsedData.type === 'artist') {
        // Create or update artist profile
        const { error } = await supabase.from('artist_profiles').upsert({
            user_id: user.id,
            stage_name: parsedData.stageName,
            bio: parsedData.bio,
            spotify_id: parsedData.spotifyId,
            apple_music_id: parsedData.appleMusicId,
            is_verified: false,
        });

        if (error) {
            console.error('Failed to update artist profile:', error);
            return { success: false, error: 'Failed to create artist profile. Please try again later.' };
        }
    }

    // Optionally mark profile step as completed if needed

    revalidatePath('/profile');
    return { success: true };
}

export async function updateProfile(data: { fullName: string }) {
    const { user } = await requireServerAuth();
    const supabase = await createClient();

    if (!data.fullName || data.fullName.trim() === '') {
        return { success: false, error: 'Full name is required.' };
    }

    const { error: profileError } = await supabase
        .from('profiles')
        .update({ full_name: data.fullName })
        .eq('id', user.id);

    if (profileError) {
        console.error('Failed to update profile details:', profileError);
        return { success: false, error: 'Failed to update profile. Please try again later.' };
    }

    // Attempt to sync with Supabase Auth metadata
    await supabase.auth.updateUser({
        data: { full_name: data.fullName }
    });

    revalidatePath('/profile');
    return { success: true };
}
