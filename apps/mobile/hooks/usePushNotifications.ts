import { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { supabase } from '../lib/supabase';

let Notifications: any = null;

try {
  Notifications = require('expo-notifications');
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
} catch (error) {
  console.log("Push notifications handler disabled (Likely Expo Go on Android).");
}

export function usePushNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<any>(null);
  const notificationListener = useRef<any>();
  const responseListener = useRef<any>();

  useEffect(() => {
    let isMounted = true;

    async function registerForPushNotificationsAsync() {
      let token;

      if (Platform.OS === 'android') {
        Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#8B5CF6', // Primary color
        });
      }

      if (Device.isDevice && Notifications) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        if (finalStatus !== 'granted') {
          console.warn('Failed to get push token for push notification!');
          return;
        }
        try {
          const projectId =
            Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
          if (!projectId) {
            console.warn('Project ID not found in app.json. Run `eas init` to configure Expo Push.');
            // Using a dummy fallback for local development without EAS
            token = await Notifications.getExpoPushTokenAsync({ projectId: 'your-project-id' }).catch(e => {
                console.log("Failed to get Expo token without projectId", e);
                return null;
            });
          } else {
             token = await Notifications.getExpoPushTokenAsync({ projectId });
          }
          
          if (token) {
            console.log('Expo Push Token generated: ', token.data);
          }
        } catch (e) {
          console.warn('Error getting expo push token', e);
        }
      } else {
        console.warn('Must use physical device for Push Notifications');
      }

      return token?.data;
    }

    registerForPushNotificationsAsync()
      .then(async (token) => {
        if (!isMounted || !token) return;
        setExpoPushToken(token);

        // Save token to Supabase if authenticated
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
           try {
             await supabase.from('push_tokens').upsert({
                user_id: user.id,
                token: token,
                platform: `expo_${Platform.OS}`,
             }, { onConflict: 'user_id,token' });
           } catch(err) {
              console.error('Failed to save push token to DB:', err);
           }
        }
      })
      .catch((err) => console.log('Push notification registration failed or bypassed:', err.message));

    if (Notifications) {
      notificationListener.current = Notifications.addNotificationReceivedListener((notification: any) => {
        setNotification(notification);
      });

      responseListener.current = Notifications.addNotificationResponseReceivedListener((response: any) => {
        console.log('Notification tapped:', response);
        // Could handle deep linking here if URL is passed in notification data
      });
    }

    return () => {
      isMounted = false;
      if (Notifications) {
        if (notificationListener.current) {
          Notifications.removeNotificationSubscription(notificationListener.current);
        }
        if (responseListener.current) {
          Notifications.removeNotificationSubscription(responseListener.current);
        }
      }
    };
  }, []);

  return { expoPushToken, notification };
}
