import { createClient } from '@/lib/supabase/server';
import { sendTrackDecisionEmail } from '@/lib/notifications/email';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { uploadId, action } = await request.json();

        if (!uploadId || !action) {
            return NextResponse.json({ error: 'Missing uploadId or action' }, { status: 400 });
        }

        const supabase = await createClient();

        // 1. Fetch upload details and artist info
        // We fetch from 'artist_uploads' and join with 'profiles'
        const { data: upload, error } = await supabase
            .from('artist_uploads')
            .select(`
                title,
                artist_id,
                profiles!artist_id (
                    full_name,
                    email
                )
            `)
            .eq('id', uploadId)
            .single();

        if (error || !upload) {
            console.error('[Notify API] Failed to fetch upload:', error);
            return NextResponse.json({ error: 'Upload not found' }, { status: 404 });
        }

        // 2. Send the email
        const artist = Array.isArray(upload.profiles) ? upload.profiles[0] : upload.profiles;

        if (!artist?.email) {
            console.warn('[Notify API] No email found for artist');
            return NextResponse.json({ error: 'Artist email missing' }, { status: 400 });
        }

        const emailResult = await sendTrackDecisionEmail({
            toEmail: artist.email,
            userName: artist.full_name || 'Artist',
            trackTitle: upload.title,
            action: action as 'approved' | 'rejected',
        });

        // 2.5 Send In-App Notification
        if (upload.artist_id) {
            import('@/lib/notifications/in-app').then(({ createInAppNotification }) => {
                const isApproved = action === 'approved';
                createInAppNotification({
                    userId: upload.artist_id as string,
                    type: 'track_update',
                    title: isApproved ? 'Track Approved' : 'Track Status Update',
                    message: isApproved 
                        ? `Congratulations! Your track "${upload.title}" has been approved for airplay.`
                        : `Your track submission "${upload.title}" was reviewed. Check your email for more details.`,
                }).catch(err => console.error('[In-App] Failed:', err));
            });
        }

        if (!emailResult.success) {
            return NextResponse.json({ error: emailResult.error }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[Notify API] Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
