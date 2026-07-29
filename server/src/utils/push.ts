/**
 * Sends push notifications via the Expo Push API.
 * Works with Expo push tokens registered by the app. Fails quietly so a push
 * error never breaks the order flow.
 */

import { User } from '../models/User.js';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

type PushMessage = { to: string; title: string; body: string; data?: Record<string, unknown>; sound: 'default' };

async function send(messages: PushMessage[]) {
  if (messages.length === 0) return;
  try {
    await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(messages),
    });
  } catch (err) {
    console.warn('Push send failed:', (err as Error).message);
  }
}

/** Notify a single user by id (no-op if they have no token). */
export async function notifyUser(userId: unknown, title: string, body: string, data?: Record<string, unknown>) {
  if (!userId) return;
  const user = await User.findById(userId).select('expoPushToken').lean();
  const token = user?.expoPushToken;
  if (!token || !token.startsWith('ExponentPushToken')) return;
  await send([{ to: token, title, body, data, sound: 'default' }]);
}
