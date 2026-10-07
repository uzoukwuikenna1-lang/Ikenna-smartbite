import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/**
 * Shared bottom-tab styling that respects the device's bottom safe area
 * (the iOS home indicator / Android gesture bar) so tab labels are never
 * clipped — important on iOS standalone PWAs and notched phones.
 */
export function useTabBarOptions(labelSize = 11) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const bottom = Math.max(insets.bottom, Spacing.two);

  return {
    tabBarActiveTintColor: theme.primary,
    tabBarInactiveTintColor: theme.textMuted,
    tabBarStyle: {
      backgroundColor: theme.card,
      borderTopColor: theme.border,
      height: 58 + bottom,
      paddingTop: Spacing.two,
      paddingBottom: bottom,
    },
    tabBarLabelStyle: { fontSize: labelSize, fontWeight: '600' as const },
  };
}
