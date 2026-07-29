import { StyleSheet, View, type ViewStyle } from 'react-native';
import { Edge, SafeAreaView } from 'react-native-safe-area-context';

import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  children: React.ReactNode;
  /** adds default horizontal padding */
  padded?: boolean;
  edges?: Edge[];
  style?: ViewStyle;
};

/** Themed, safe-area-aware page container, centred with a max width on wide screens. */
export function Screen({ children, padded = false, edges = ['top', 'bottom'], style }: Props) {
  const theme = useTheme();
  return (
    <SafeAreaView edges={edges} style={[styles.safe, { backgroundColor: theme.background }]}>
      <View style={[styles.inner, padded && styles.padded, style]}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  inner: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  padded: {
    paddingHorizontal: Spacing.four,
  },
});
