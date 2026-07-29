/**
 * SmartBite FUTO design tokens.
 * Green campus brand + warm amber accent for prices / CTAs.
 * Both light and dark palettes share the exact same keys (see ThemeColor).
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#10231A',
    textSecondary: '#5B6B62',
    textMuted: '#8A968E',
    background: '#F5F8F4',
    card: '#FFFFFF',
    backgroundElement: '#EEF3EC',
    backgroundSelected: '#E1EADD',
    border: '#E4EAE1',
    primary: '#15803D',
    primaryDark: '#0F5C2E',
    primaryMuted: '#DCF3E4',
    onPrimary: '#FFFFFF',
    accent: '#F59E0B',
    onAccent: '#3A2600',
    success: '#16A34A',
    warning: '#D97706',
    danger: '#DC2626',
    star: '#F59E0B',
  },
  dark: {
    text: '#ECF5EE',
    textSecondary: '#9DB0A5',
    textMuted: '#6F8177',
    background: '#0E1512',
    card: '#16201B',
    backgroundElement: '#1C2A22',
    backgroundSelected: '#26362C',
    border: '#24332A',
    primary: '#22C55E',
    primaryDark: '#16A34A',
    primaryMuted: '#14301F',
    onPrimary: '#06210F',
    accent: '#FBBF24',
    onAccent: '#2A1C00',
    success: '#22C55E',
    warning: '#FBBF24',
    danger: '#F87171',
    star: '#FBBF24',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
