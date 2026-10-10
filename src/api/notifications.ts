/**
 * Safe accessor for expo-notifications.
 *
 * In Expo Go (SDK 53+) merely *importing* expo-notifications runs a push
 * auto-registration side-effect that throws ("removed from Expo Go — use a
 * development build"), which crashes the whole app at startup. So we only load
 * the module where it actually works — development/standalone builds and web —
 * and expose `null` in Expo Go, where notifications simply no-op.
 */

import Constants from 'expo-constants';

const isExpoGo = Constants.executionEnvironment === 'storeClient';

export const Notifications: typeof import('expo-notifications') | null = isExpoGo
  ? null
  : // eslint-disable-next-line @typescript-eslint/no-require-imports
    (require('expo-notifications') as typeof import('expo-notifications'));

/** True when expo-notifications is loaded (i.e. not running inside Expo Go). */
export const notificationsAvailable = Notifications !== null;
