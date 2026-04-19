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

    if (!response.ok) {
      const respText = await response.text();
      console.error('[Expo Push] Failed to send push notification:', respText);
      return { success: false, error: 'Expo API error' };
    }

    // Expo returns an array of ticket tickets
    const results = await response.json();
    console.log(`[Expo Push] Successfully sent to ${messages.length} devices.`);
    
    return { success: true };
  } catch (error) {
    console.error('[Expo Push] Unexpected error:', error);
    return { success: false, error: 'Internal error' };
  }
}
