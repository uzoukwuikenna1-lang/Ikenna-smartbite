import { Redirect, Stack } from 'expo-router';

import { useAuth } from '@/context/store';

export default function ShopLayout() {
  const { user } = useAuth();
  // Customer-only detail screens (vendor, checkout, order tracking).
  if (!user || user.role !== 'customer') {
    return <Redirect href="/role-select" />;
  }
  return <Stack screenOptions={{ headerShown: false }} />;
}
