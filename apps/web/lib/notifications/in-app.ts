import { createClient } from '@/lib/supabase/server';
import { sendExpoPushNotification } from './expo-push';

export type NotificationType = 'track_update' | 'song_request' | 'show_alert' | 'news' | 'system';

export interface CreateNotificationParams {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    linkUrl?: string;
}

/**
 * Creates an in-app notification for a user in the database.
 */
export async function createInAppNotification(params: CreateNotificationParams): Promise<{ success: boolean; error?: string }> {
    try {
        const supabase = await createClient();

        const { error } = await supabase
            .from('notifications' as any)
            .insert({
                user_id: params.userId,
                type: params.type,
                title: params.title,
                message: params.message,
                link_url: params.linkUrl || null,
            });

        if (error) {
            console.error('[Notification Service] Failed to insert notification:', error);
            return { success: false, error: error.message };
        }

        // Fire & forget Expo Push Notification
        sendExpoPushNotification(
            params.userId,
            params.title,
            params.message,
            params.linkUrl ? { url: params.linkUrl } : undefined
        ).catch(err => console.error('[Notification Service] Background expo push failed:', err));

        return { success: true };
    } catch (err) {
        console.error('[Notification Service] Unexpected error:', err);
        return { success: false, error: 'Failed to create notification due to an unexpected error.' };
    }
}
