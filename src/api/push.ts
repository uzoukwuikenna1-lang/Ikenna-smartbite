/**
 * Expo push notification registration.
 * Asks permission, gets the device's Expo push token and sends it to the backend
 * so the server can notify this user about their orders. Safely no-ops on web /
 * simulators / when no EAS projectId is configured.
 */

import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

import { api } from './client';
import { Notifications } from './notifications';

// Show notifications while the app is foregrounded (skipped in Expo Go, where
// expo-notifications isn't loaded).
if (Notifications) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

export async function registerForPush(): Promise<void> {
  if (Platform.OS === 'web' || !Notifications) return; // not supported on web / Expo Go
  if (!Device.isDevice) return; // needs a physical device to get a token

  try {
    let { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      status = (await Notifications.requestPermissionsAsync()).status;
    }
    if (status !== 'granted') return;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
      });
    }

    const projectId =
      (Constants.expoConfig?.extra as any)?.eas?.projectId ?? (Constants as any).easConfig?.projectId;
    if (!projectId) {
      console.log('Push: no EAS projectId set — run `eas init` to enable remote notifications.');
      return;
    }

    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    await api.patch('/api/me/push-token', { token });
  } catch (e) {
    console.log('Push registration skipped:', (e as Error).message);
  }
}
