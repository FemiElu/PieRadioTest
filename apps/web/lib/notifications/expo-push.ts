import { createClient } from '@/lib/supabase/server';

interface ExpoPushMessage {
  to: string;
  sound: 'default';
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export async function sendExpoPushNotification(
  userId: string,
  title: string,
  message: string,
  data?: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    // 1. Fetch push tokens for this user
    const { data: tokens, error: tokensError } = await supabase
      .from('push_tokens')
      .select('token')
      .eq('user_id', userId);

    if (tokensError) {
      console.error('[Expo Push] Failed to fetch push tokens:', tokensError);
      return { success: false, error: tokensError.message };
    }

    if (!tokens || tokens.length === 0) {
      // No tokens for user, simply return success (nothing to send)
      return { success: true };
    }

    // 2. Prepare messages
    const messages: ExpoPushMessage[] = tokens.map((t) => ({
      to: t.token,
      sound: 'default',
      title,
      body: message,
      data,
    }));

    // 3. Send to Expo via HTTP API
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    });

    const responseBody = await response.text();
    if (!response.ok) {
      console.error('[Expo Push] Failed to send push notification:', response.status, responseBody);
      return { success: false, error: 'Expo API error' };
    }

    const results = JSON.parse(responseBody);
    if (Array.isArray(results) && results.some((item) => item.status !== 'ok')) {
      console.warn('[Expo Push] Some push messages failed:', results);
      return { success: false, error: 'Partial Expo push failure' };
    }

    if (results.errors) {
      console.error('[Expo Push] Designated errors returned:', results.errors);
      return { success: false, error: 'Expo push returned errors' };
    }

    console.log(`[Expo Push] Successfully sent to ${messages.length} devices.`);
    return { success: true };
  } catch (error) {
    console.error('[Expo Push] Unexpected error:', error);
    return { success: false, error: 'Internal error' };
  }
}
