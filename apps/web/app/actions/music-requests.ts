'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * Music Request Server Actions
 * 
 * MVP: Single-station deployment (Pie Radio)
 * Admin-only management, listener submission
 */

export type SubmitRequestState = {
    message?: string;
    errors?: {
        artist_name?: string[];
        song_title?: string[];
        station_id?: string[];
        form?: string[];
    };
};

// ============================================================
// CONSTANTS
// ============================================================

/**
 * Rate limit configuration
 * - MAX_REQUESTS_PER_HOUR: Maximum requests per user per hour
 * - MAX_REQUESTS_PER_DAY: Maximum requests per user per day
 * - DUPLICATE_WINDOW_HOURS: Hours before same song can be requested again
 */
const MAX_REQUESTS_PER_HOUR = 2;
const MAX_REQUESTS_PER_DAY = 5;
const DUPLICATE_WINDOW_HOURS = 2;

// ============================================================
// LISTENER ACTIONS
// ============================================================

/**
 * Submit a new music request.
 * Authenticated users only.
 * 
 * Rate limits: 2/hour, 5/day per user
 * Duplicate check: Same song + station within 2 hours
 * 
 * MVP: Single-station assumption (station_id still required for future)
 */
export async function submitRequest(
    prevState: SubmitRequestState,
    formData: FormData
): Promise<SubmitRequestState> {
    const supabase = await createClient();

    // 1. Auth Check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        return { message: 'You must be logged in to make a request.' };
    }

    // 2. Validate Input
    const artist_name = formData.get('artist_name')?.toString().trim();
    const song_title = formData.get('song_title')?.toString().trim();
    const station_id_raw = formData.get('station_id')?.toString();
    const raw_listener_note = formData.get('listener_note');
    const listener_note = typeof raw_listener_note === 'string' ? raw_listener_note.trim() : null;
    const show_id_raw = formData.get('show_id');
    // show_id kept nullable for future presenter-specific views
    const show_id = typeof show_id_raw === 'string' && show_id_raw.length > 0 ? show_id_raw : null;

    const errors: SubmitRequestState['errors'] = {};

    if (!artist_name) errors.artist_name = ['Artist name is required'];
    if (!song_title) errors.song_title = ['Song title is required'];

    const station_id = station_id_raw ? parseInt(station_id_raw, 10) : NaN;
    if (isNaN(station_id) || station_id <= 0) errors.station_id = ['Invalid station ID'];

    if (Object.keys(errors).length > 0) {
        return { errors, message: 'Please correct the errors below.' };
    }

    // 3. Profanity Filter
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
        // 4. Validate Station Existence (MVP: single station)
        const { data: station, error: stationError } = await supabase
            .from('station_metadata')
            .select('id')
            .eq('id', station_id)
            .single();

        if (stationError || !station) {
            return { message: 'Invalid station selected.' };
        }

        // 5. Rate Limit Check - Hourly
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
        const { count: hourlyCount } = await supabase
            .from('music_requests')
            .select('id', { count: 'exact', head: true })
            .eq('requested_by_user_id', user.id)
            .gte('created_at', oneHourAgo);

        if ((hourlyCount ?? 0) >= MAX_REQUESTS_PER_HOUR) {
            return { message: `Rate limit exceeded. Maximum ${MAX_REQUESTS_PER_HOUR} requests per hour.` };
        }

        // 6. Rate Limit Check - Daily
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const { count: dailyCount } = await supabase
            .from('music_requests')
            .select('id', { count: 'exact', head: true })
            .eq('requested_by_user_id', user.id)
            .gte('created_at', oneDayAgo);

        if ((dailyCount ?? 0) >= MAX_REQUESTS_PER_DAY) {
            return { message: `Rate limit exceeded. Maximum ${MAX_REQUESTS_PER_DAY} requests per day.` };
        }

        // 7. Duplicate Check (same song within window)
        const duplicateWindowAgo = new Date(
            Date.now() - DUPLICATE_WINDOW_HOURS * 60 * 60 * 1000
        ).toISOString();

        const { data: duplicates } = await supabase
            .from('music_requests')
            .select('id')
            .eq('requested_by_user_id', user.id)
            .eq('station_id', station_id)
            .ilike('artist_name', artist_name!)
            .ilike('song_title', song_title!)
            .gte('created_at', duplicateWindowAgo)
            .maybeSingle();

        if (duplicates) {
            return {
                message: `You've already requested this song recently. Please wait ${DUPLICATE_WINDOW_HOURS} hours.`
            };
        }

        // 8. Insert Request
        const insertPayload = {
            requested_by_user_id: user.id,
            user_id: user.id, // Legacy compatibility
            artist_name: artist_name!,
            song_title: song_title!,
            station_id,
            listener_note: listener_note || null,
            show_id: show_id, // Nullable for future use
            status: 'pending',
        };

        const { error: insertError } = await supabase
            .from('music_requests')
            .insert(insertPayload as any);

        if (insertError) {
            console.error('[submitRequest] Insert Error:', insertError);
            return { message: 'Failed to submit request. Please try again.' };
        }

        revalidatePath('/admin/requests');
        return { message: 'Request submitted successfully!' };

    } catch (err) {
        console.error('[submitRequest] Unexpected error:', err);
        return { message: 'An unexpected error occurred.' };
    }
}

// ============================================================
// ADMIN ACTIONS
// ============================================================

/**
 * Fetch all music requests for admin dashboard.
 * Excludes expired requests (>24h).
 * 
 * MVP: Single-station - no station filtering
 * Requires admin role.
 */
export async function getAdminRequests() {
    const supabase = await createClient();

    // Auth check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // Role check
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (!profile || profile.role !== 'admin') {
        console.warn('[getAdminRequests] Non-admin attempted access:', user.id);
        return [];
    }

    // Fetch non-expired requests (RLS also enforces this)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
        .from('music_requests')
        .select(`
            *,
            profiles!music_requests_requested_by_user_id_fkey(username, full_name, avatar_url, email)
        `)
        .gt('created_at', twentyFourHoursAgo)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('[getAdminRequests] Fetch error:', error);
        return [];
    }

    return data;
}

/**
 * Update request status (Admin only).
 * 
 * Valid transitions: pending → approved, pending → rejected
 * On approval: sends email notification + queues for playlist
 * 
 * Email is sent AFTER the DB commit (async, non-blocking).
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

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    // MVP: Admin only (no presenter access)
    if (!profile || profile.role !== 'admin') {
        throw new Error('Forbidden: Admin access required');
    }

    // 2. Fetch Request (with user email for notification)
    const { data: request, error: fetchError } = await supabase
        .from('music_requests')
        .select(`
            id, created_at, status, artist_name, song_title,
            profiles!music_requests_requested_by_user_id_fkey(email, full_name, username)
        `)
        .eq('id', requestId)
        .single();

    if (fetchError || !request) {
        throw new Error('Request not found');
    }

    // 3. Expiry check (server-side, DB trigger also enforces)
    const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;
    const requestTime = new Date(request.created_at || '').getTime();

    if (requestTime < twentyFourHoursAgo) {
        throw new Error('This request has expired and cannot be modified.');
    }

    // 4. Status transition check (DB trigger also enforces)
    // Valid transitions: pending -> approved/rejected, approved -> played
    if (request.status === 'rejected' || request.status === 'played') {
        throw new Error(`Request already ${request.status} - cannot modify status again.`);
    }

    if (newStatus === 'played' && request.status !== 'approved') {
        throw new Error('Can only mark as played from approved status.');
    }

    // 5. Perform Update (only mutable fields)
    const updates: Record<string, unknown> = {
        status: newStatus,
    };

    if (newStatus === 'rejected') {
        updates.rejection_reason = rejectionReason || 'No reason provided';
    }

    const { error: updateError } = await supabase
        .from('music_requests')
        .update(updates)
        .eq('id', requestId);

    if (updateError) {
        console.error('[updateRequestStatus] Update error:', updateError);
        throw new Error('Failed to update request');
    }

    // 6. AFTER commit: Send notifications (async, non-blocking)
    if (newStatus === 'approved') {
        // Get user info for notification
        const userProfile = (request as any).profiles as {
            email: string | null;
            full_name: string | null;
            username: string | null;
        } | null;

        const userEmail = userProfile?.email;
        const userName = userProfile?.full_name || userProfile?.username || 'Listener';

        // Send email notification (async, don't await)
        if (userEmail) {
            import('@/lib/notifications/email').then(({ sendApprovalEmail }) => {
                sendApprovalEmail({
                    toEmail: userEmail,
                    userName,
                    artistName: request.artist_name,
                    songTitle: request.song_title,
                }).catch(err => console.error('[Notification] Email failed:', err));
            });
        }

        // Queue for playlist (async, don't await)
        import('@/lib/playlist/enqueue').then(({ enqueuePlaylistRequest }) => {
            enqueuePlaylistRequest({
                requestId: request.id,
                artistName: request.artist_name,
                songTitle: request.song_title,
                requestedBy: userName,
                approvedAt: new Date(),
            }).catch(err => console.error('[Playlist] Enqueue failed:', err));
        });
    }

    revalidatePath('/admin/requests');
    return { success: true };
}

// ============================================================
// LEGACY: Presenter Dashboard (deprecated for MVP)
// ============================================================

/**
 * @deprecated Use getAdminRequests() for MVP
 * Kept for backward compatibility with presenter dashboard
 */
export async function getRequests(stationId: number) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
        .from('music_requests')
        .select(`
            *,
            profiles!requested_by_user_id(username, full_name, avatar_url)
        `)
        .eq('station_id', stationId)
        .gt('created_at', twentyFourHoursAgo)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('[getRequests] Fetch error:', error);
        return [];
    }

    return data;
}
