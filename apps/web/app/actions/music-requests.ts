'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export type SubmitRequestState = {
    message?: string;
    errors?: {
        artist_name?: string[];
        song_title?: string[];
        station_id?: string[];
        form?: string[];
    };
};

/**
 * Submit a new music request.
 * strictly authenticated users.
 */
export async function submitRequest(prevState: SubmitRequestState, formData: FormData): Promise<SubmitRequestState> {
    const supabase = await createClient();

    // 1. Auth Check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        return { message: 'You must be logged in to make a request.' };
    }

    // 2. Validate Input (Manual)
    const artist_name = formData.get('artist_name')?.toString().trim();
    const song_title = formData.get('song_title')?.toString().trim();
    const station_id_raw = formData.get('station_id')?.toString();
    const raw_listener_note = formData.get('listener_note');
    const listener_note = typeof raw_listener_note === 'string' ? raw_listener_note.trim() : null;
    const show_id_raw = formData.get('show_id');
    const show_id = typeof show_id_raw === 'string' && show_id_raw.length > 0 ? show_id_raw : null;

    const errors: SubmitRequestState['errors'] = {};

    if (!artist_name) errors.artist_name = ['Artist name is required'];
    if (!song_title) errors.song_title = ['Song title is required'];

    const station_id = station_id_raw ? parseInt(station_id_raw, 10) : NaN;
    if (isNaN(station_id) || station_id <= 0) errors.station_id = ['Invalid station ID'];

    if (Object.keys(errors).length > 0) {
        return { errors, message: 'Please correct the errors below.' };
    }

    // Profanity Filter
    const { ProfanityFilter } = await import('@/lib/profanity-filter');
    const filter = new ProfanityFilter();

    if (
        filter.isProfane(artist_name!) ||
        filter.isProfane(song_title!) ||
        (listener_note && filter.isProfane(listener_note))
    ) {
        return { message: 'Request contains inappropriate language.' };
    }

    try {
        // 3. Validate Station Existence
        const { data: station, error: stationError } = await supabase
            .from('station_metadata')
            .select('id')
            .eq('id', station_id)
            .single();

        if (stationError || !station) {
            return { message: 'Invalid station selected.' };
        }

        // 4. Duplicate Check (2 Hours)
        // Same User + Same Artist + Same Song + Same Station + Within 2h
        const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

        const { data: duplicates } = await supabase
            .from('music_requests')
            .select('id')
            .eq('requested_by_user_id', user.id)
            .eq('station_id', station_id)
            .ilike('artist_name', artist_name!)
            .ilike('song_title', song_title!)
            .gte('created_at', twoHoursAgo)
            .maybeSingle();

        if (duplicates) {
            return { message: 'You have already requested this song recently. Please wait a while before requesting it again.' };
        }

        // 5. Insert Request
        const insertPayload = {
            requested_by_user_id: user.id,
            user_id: user.id, // Legacy compatibility
            artist_name: artist_name!,
            song_title: song_title!,
            station_id,
            listener_note: listener_note || null,
            show_id: show_id,
            status: 'pending',
        };

        const { error: insertError } = await supabase
            .from('music_requests')
            .insert(insertPayload as any); // Explicit cast to bypass strict typing issues temporarily

        if (insertError) {
            console.error('Insert Error:', insertError);
            return { message: 'Failed to submit request. Please try again.' };
        }

        revalidatePath('/dashboard/presenter/requests');
        return { message: 'Request submitted successfully!' };

    } catch (err) {
        console.error('Unexpected error:', err);
        return { message: 'An unexpected error occurred.' };
    }
}

/**
 * Update request status (Admin/Presenter).
 */
export async function updateRequestStatus(
    requestId: string,
    newStatus: 'approved' | 'rejected' | 'played',
    rejectionReason?: string
) {
    const supabase = await createClient();

    // 1. Auth & Role Check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    // Check Role
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (!profile || (profile.role !== 'admin' && profile.role !== 'presenter')) {
        throw new Error('Forbidden: Insufficient permissions');
    }

    // 2. Fetch Request to check Expiry & Ownership
    const { data: request, error: fetchError } = await supabase
        .from('music_requests')
        .select('created_at, status, station_id')
        .eq('id', requestId)
        .single();

    if (fetchError || !request) throw new Error('Request not found');

    // Expiry Check (24 hours)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).getTime();
    const requestTime = new Date(request.created_at || '').getTime();

    if (requestTime < twentyFourHoursAgo) {
        throw new Error('This request has expired and cannot be modified.');
    }

    // 3. Perform Update
    const updates: any = {
        status: newStatus,
        updated_at: new Date().toISOString(),
    };

    if (newStatus === 'rejected') {
        updates.rejection_reason = rejectionReason || 'No reason provided';
    } else if (newStatus === 'approved') {
        updates.approved_at = new Date().toISOString();
    } else if (newStatus === 'played') {
        updates.played_at = new Date().toISOString();
    }

    const { error: updateError } = await supabase
        .from('music_requests')
        .update(updates)
        .eq('id', requestId);

    if (updateError) {
        throw new Error('Failed to update request');
    }

    revalidatePath('/dashboard/presenter/requests');
    return { success: true };
}

/**
 * Fetch Requests for Dashboard
 * Filters out expired (>24h).
 */
export async function getRequests(stationId: number) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // Expiry Filter
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
        .from('music_requests')
        .select(`
      *,
      profiles!requested_by_user_id(username, full_name, avatar_url)
    `)
        .eq('station_id', stationId)
        .gt('created_at', twentyFourHoursAgo) // Filter expired
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Fetch requests error:', error);
        return [];
    }

    return data;
}
