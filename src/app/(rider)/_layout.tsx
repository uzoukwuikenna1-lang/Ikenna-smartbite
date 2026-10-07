import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';

import { useAuth, useOrders } from '@/context/store';
import { useTabBarOptions } from '@/hooks/use-tabbar';
import { useTheme } from '@/hooks/use-theme';

export default function RiderLayout() {
  const theme = useTheme();
  const { user } = useAuth();
  const { orders } = useOrders();
  const tabBar = useTabBarOptions();

  if (!user || user.role !== 'rider') {
    return <Redirect href="/role-select" />;
  }

  const availableCount = orders.filter((o) => o.status === 'rider_assigned' && !o.riderAccepted).length;

  return (
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
  );
}
