'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * Demo Mode Actions
 * Used for testing and demonstration purposes.
 * Restricted to Admins.
 */

async function isAuthorized() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return false;

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        return profile?.role === 'admin' || profile?.role === 'presenter';
    } catch (e) {
        console.error('[isAuthorized] Auth check failed:', e);
        return false;
    }
}

export async function createTestShow() {
    if (!await isAuthorized()) throw new Error('Unauthorized');
    
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not found');

    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

    const { data: show, error } = await supabase
        .from('schedules')
        .insert({
            title: '🔥 Live Demo Show',
            description: 'This is a temporary test show for demonstration purposes.',
            start_time: now.toISOString(),
            end_time: oneHourLater.toISOString(),
            presenter_id: user.id,
            is_live: true
        })
        .select()
        .single();

    if (error) {
        console.error('[createTestShow] Supabase Error:', error);
        throw new Error(`Database error: ${error.message}`);
    }

    revalidatePath('/dashboard/presenter');
    return { success: true, showId: show.id };
}

export async function seedTestRequests(showId: string) {
    if (!await isAuthorized()) throw new Error('Unauthorized');
    
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    const dummyRequests = [
        {
            artist_name: 'Wizkid',
            song_title: 'Bad To Me',
            listener_note: 'Shoutout to the Pie Radio crew!',
            show_id: showId,
            status: 'pending',
            requested_by_user_id: user?.id, // Can be user or null
            station_id: 1,
            user_id: user?.id,
        },
        {
            artist_name: 'Burna Boy',
            song_title: 'Last Last',
            listener_note: 'Please play this next!',
            show_id: showId,
            status: 'pending',
            requested_by_user_id: user?.id,
            station_id: 1,
            user_id: user?.id,
        },
        {
            artist_name: 'Ayra Starr',
            song_title: 'Rush',
            listener_note: 'Loooove this song!',
            show_id: showId,
            status: 'pending',
            requested_by_user_id: user?.id,
            station_id: 1,
            user_id: user?.id,
        }
    ];

    const { error } = await supabase
        .from('music_requests')
        .insert(dummyRequests);

    if (error) {
        console.error('[seedTestRequests] Supabase Error:', error);
        throw new Error(`Failed to seed requests: ${error.message}`);
    }

    return { success: true };
}
