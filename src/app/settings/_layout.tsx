import { Redirect, Stack } from 'expo-router';

import { useAuth } from '@/context/store';

export default function SettingsLayout() {
  const { user } = useAuth();
  // Settings are customer-only; bounce anyone else back to the role picker.
  if (!user || user.role !== 'customer') {
    return <Redirect href="/role-select" />;
  }
  return <Stack screenOptions={{ headerShown: false }} />;
}
