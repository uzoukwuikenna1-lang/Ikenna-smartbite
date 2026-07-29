import { DarkTheme as NavDark, DefaultTheme as NavLight, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';
import { StoreProvider } from '@/context/store';
import { useColorScheme } from '@/hooks/use-color-scheme';

function navTheme(scheme: 'light' | 'dark') {
  const base = scheme === 'dark' ? NavDark : NavLight;
  const c = Colors[scheme];
  return {
    ...base,
    colors: {
      ...base.colors,
      primary: c.primary,
      background: c.background,
      card: c.card,
      text: c.text,
      border: c.border,
    },
  };
}

export default function RootLayout() {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StoreProvider>
          <ThemeProvider value={navTheme(scheme)}>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="role-select" />
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(customer)" />
              <Stack.Screen name="(shop)" />
              <Stack.Screen name="(vendor)" />
              <Stack.Screen name="(rider)" />
              <Stack.Screen name="(admin)" />
              <Stack.Screen name="settings" />
              <Stack.Screen name="vendor-item" />
            </Stack>
            <StatusBar style="auto" />
          </ThemeProvider>
        </StoreProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
