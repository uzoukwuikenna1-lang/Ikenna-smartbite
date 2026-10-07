import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';

import { useAuth, useOrders } from '@/context/store';
import { useTabBarOptions } from '@/hooks/use-tabbar';
import { useTheme } from '@/hooks/use-theme';

export default function VendorLayout() {
  const theme = useTheme();
  const { user } = useAuth();
  const { orders } = useOrders();
  const tabBar = useTabBarOptions();

  if (!user || user.role !== 'vendor') {
    return <Redirect href="/role-select" />;
  }

  // Orders here are already scoped to this vendor by the API.
  const newCount = orders.filter((o) => o.status === 'placed').length;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        ...tabBar,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Orders',
          tabBarBadge: newCount > 0 ? newCount : undefined,
          tabBarBadgeStyle: { backgroundColor: theme.accent, color: theme.onAccent, fontSize: 11 },
          tabBarIcon: ({ color, size }) => <Ionicons name="receipt" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="menu"
        options={{
          title: 'Menu',
          tabBarIcon: ({ color, size }) => <Ionicons name="fast-food" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="sales"
        options={{
          title: 'Sales',
          tabBarIcon: ({ color, size }) => <Ionicons name="stats-chart" size={size} color={color} />,
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
