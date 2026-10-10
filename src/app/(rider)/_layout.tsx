import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';
import { useEffect, useState } from 'react';

import { RiderKycModal } from '@/components/rider-kyc-modal';
import { useAuth, useOrders } from '@/context/store';
import { useTabBarOptions } from '@/hooks/use-tabbar';
import { useTheme } from '@/hooks/use-theme';

export default function RiderLayout() {
  const theme = useTheme();
  const { user, submitKyc } = useAuth();
  const { orders } = useOrders();
  const tabBar = useTabBarOptions();

  // New riders must pass the (mock) KYC before they can work. We drive the
  // modal from local state so its success screen survives the user refresh.
  const needsKyc = user?.role === 'rider' && !!user.rider && !user.rider.verified;
  const [showKyc, setShowKyc] = useState(false);
  useEffect(() => {
    if (needsKyc) setShowKyc(true);
  }, [needsKyc]);

  if (!user || user.role !== 'rider') {
    return <Redirect href="/role-select" />;
  }

  const availableCount = orders.filter((o) => o.status === 'rider_assigned' && !o.riderAccepted).length;

  return (
    <>
    <Tabs
      screenOptions={{
        headerShown: false,
        ...tabBar,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Available',
          tabBarBadge: availableCount > 0 ? availableCount : undefined,
          tabBarBadgeStyle: { backgroundColor: theme.accent, color: theme.onAccent, fontSize: 11 },
          tabBarIcon: ({ color, size }) => <Ionicons name="flash" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="deliveries"
        options={{
          title: 'My deliveries',
          tabBarIcon: ({ color, size }) => <Ionicons name="bicycle" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />,
        }}
      />
    </Tabs>
    <RiderKycModal visible={showKyc} onSubmit={submitKyc} onDone={() => setShowKyc(false)} />
    </>
  );
}
