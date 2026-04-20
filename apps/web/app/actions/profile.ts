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

export async function updatePreferences(data: { wantsLiveShowAlerts: boolean, wantsNewsUpdates: boolean }) {
    const { user } = await requireServerAuth();
    const supabase = await createClient();

    const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
            wants_live_show_alerts: data.wantsLiveShowAlerts,
            wants_news_updates: data.wantsNewsUpdates
        } as any)
        .eq('id', user.id);

    if (profileError) {
        console.error('Failed to update preferences:', profileError);
        return { success: false, error: 'Failed to update preferences.' };
    }

    revalidatePath('/profile');
    return { success: true };
}

const updateFullProfileSchema = z.object({
    fullName: z.string().min(1, "Full name is required"),
    username: z.string().min(3, "Username must be at least 3 characters").max(30, "Username too long").regex(/^[a-zA-Z0-9_.]+$/, "Username can only contain letters, numbers, underscores, and periods"),
    bio: z.string().max(500, "Bio too long").optional(),
    avatarUrl: z.string().url("Invalid avatar URL").optional().or(z.literal('')),
    
    wantsArtistProfile: z.boolean().optional(),
    stageName: z.string().optional(),
    artistBio: z.string().max(1000, "Author bio too long").optional(),
    spotifyId: z.string().optional(),
    appleMusicId: z.string().optional(),
    featuredTrackUrl: z.string().url("Invalid tracking URL").optional().or(z.literal('')),
});

export async function updateFullProfile(data: z.infer<typeof updateFullProfileSchema>) {
    const { user, profile } = await requireServerAuth();
    const supabase = await createClient();

    const parsedData = updateFullProfileSchema.parse(data);

    // 1. Check Username Uniqueness if it changed
    if (parsedData.username && parsedData.username !== profile?.username) {
        const { data: existingUser } = await supabase
            .from('profiles')
            .select('id')
            .eq('username', parsedData.username)
            .single();

        if (existingUser) {
            return { success: false, error: 'Username is already taken.' };
        }
    }

    // 2. Update base Profile
    const { error: profileError } = await supabase
        .from('profiles')
        .update({
            full_name: parsedData.fullName,
            username: parsedData.username,
            bio: parsedData.bio,
            ...(parsedData.avatarUrl !== undefined ? { avatar_url: parsedData.avatarUrl } : {})
        })
        .eq('id', user.id);

    if (profileError) {
        console.error('Failed to update general profile:', profileError);
        return { success: false, error: 'Failed to update profile details.' };
    }

    // 3. Update Auth User Metadata
    if (parsedData.fullName !== profile?.full_name) {
        await supabase.auth.updateUser({
            data: { full_name: parsedData.fullName }
        });
    }

    // 4. Update / Create Artist Profile if necessary
    if (parsedData.wantsArtistProfile) {
        if (!parsedData.stageName || parsedData.stageName.trim() === '') {
            return { success: false, error: 'Stage name is required for an artist profile.' };
        }

        const { error: artistError } = await supabase
            .from('artist_profiles')
            .upsert({
                user_id: user.id,
                stage_name: parsedData.stageName,
                bio: parsedData.artistBio,
                spotify_id: parsedData.spotifyId,
                apple_music_id: parsedData.appleMusicId,
                ...(parsedData.featuredTrackUrl !== undefined ? { featured_track_url: parsedData.featuredTrackUrl } : {})
            }, { onConflict: 'user_id' });
            
        if (artistError) {
             console.error('Failed to upsert artist profile:', artistError);
             return { success: false, error: 'Failed to save artist details.' };
        }
    }

    revalidatePath('/profile');
    return { success: true };
}
