import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';

import { useAuth, useCart } from '@/context/store';
import { useTabBarOptions } from '@/hooks/use-tabbar';
import { useTheme } from '@/hooks/use-theme';

export default function CustomerLayout() {
  const theme = useTheme();
  const { user } = useAuth();
  const { cartCount } = useCart();
  const tabBar = useTabBarOptions();

  // Guard: only a logged-in customer belongs here.
  if (!user || user.role !== 'customer') {
    return <Redirect href="/role-select" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        ...tabBar,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ color, size }) => <Ionicons name="search" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Cart',
          tabBarBadge: cartCount > 0 ? cartCount : undefined,
          tabBarBadgeStyle: { backgroundColor: theme.accent, color: theme.onAccent, fontSize: 11 },
          tabBarIcon: ({ color, size }) => <Ionicons name="cart" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
          tabBarIcon: ({ color, size }) => <Ionicons name="receipt" size={size} color={color} />,
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
