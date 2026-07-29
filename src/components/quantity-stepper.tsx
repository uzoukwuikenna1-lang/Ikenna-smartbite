import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  qty: number;
  onAdd: () => void;
  onRemove: () => void;
  size?: 'sm' | 'md';
};

export function QuantityStepper({ qty, onAdd, onRemove, size = 'md' }: Props) {
  const theme = useTheme();
  const dim = size === 'sm' ? 30 : 36;
  const icon = size === 'sm' ? 16 : 20;

  return (
    <View style={[styles.row, { backgroundColor: theme.primaryMuted, borderRadius: Radius.pill }]}>
      <Pressable
        onPress={onRemove}
        style={[styles.btn, { width: dim, height: dim }]}
        hitSlop={6}>
        <Ionicons name="remove" size={icon} color={theme.primary} />
      </Pressable>
      <ThemedText style={[styles.qty, { color: theme.primaryDark }]}>{qty}</ThemedText>
      <Pressable onPress={onAdd} style={[styles.btn, { width: dim, height: dim }]} hitSlop={6}>
        <Ionicons name="add" size={icon} color={theme.primary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  btn: { alignItems: 'center', justifyContent: 'center' },
  qty: { minWidth: 22, textAlign: 'center', fontWeight: '800', fontSize: 15 },
});
