import { router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius } from '@/constants/theme';
import { ROLE_META } from '@/constants/roles';
import { useAuth } from '@/context/store';
import { useTheme } from '@/hooks/use-theme';

SplashScreen.hideAsync().catch(() => {});

export default function SplashRoute() {
  const theme = useTheme();
  const { user, authLoading } = useAuth();
  const fade = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.7)).current;
  const rise = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 6, tension: 80, useNativeDriver: true }),
      Animated.timing(rise, {
        toValue: 0,
        duration: 700,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [fade, scale, rise]);

  // Once the persisted session is restored, route to the right place.
  useEffect(() => {
    if (authLoading) return;
    const t = setTimeout(() => {
      router.replace(user ? ROLE_META[user.role].home : '/role-select');
    }, 1400);
    return () => clearTimeout(t);
  }, [authLoading, user]);

  return (
    <View style={[styles.container, { backgroundColor: theme.primary }]}>
      <Animated.View style={{ opacity: fade, transform: [{ scale }] }}>
        <View style={[styles.logo, { backgroundColor: theme.onPrimary }]}>
          <ThemedText style={styles.logoEmoji}>🍔</ThemedText>
        </View>
      </Animated.View>

      <Animated.View style={{ opacity: fade, transform: [{ translateY: rise }], alignItems: 'center' }}>
        <ThemedText style={[styles.wordmark, { color: theme.onPrimary }]}>SmartBite</ThemedText>
        <View style={[styles.pill, { backgroundColor: theme.accent }]}>
          <ThemedText style={[styles.pillText, { color: theme.onAccent }]}>FUTO</ThemedText>
        </View>
        <ThemedText style={[styles.tagline, { color: theme.onPrimary }]}>
          Campus food, delivered.
        </ThemedText>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 28,
  },
  logo: {
    width: 104,
    height: 104,
    borderRadius: Radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoEmoji: {
    fontSize: 56,
    lineHeight: 60,
  },
  wordmark: {
    fontSize: 40,
    fontWeight: '800',
    letterSpacing: -0.5,
    lineHeight: 40,
  },
  pill: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: Radius.pill,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 2,
  },
  tagline: {
    marginTop: 16,
    fontSize: 15,
    opacity: 0.9,
  },
});
