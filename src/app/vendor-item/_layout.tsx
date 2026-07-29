import { Redirect, Stack } from 'expo-router';

import { useAuth } from '@/context/store';

export default function VendorItemLayout() {
  const { user } = useAuth();
  if (!user || user.role !== 'vendor') {
    return <Redirect href="/role-select" />;
  }
  return <Stack screenOptions={{ headerShown: false }} />;
}
