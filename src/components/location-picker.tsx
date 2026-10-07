import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { CAMPUS_LOCATIONS } from '@/constants/locations';
import { useTheme } from '@/hooks/use-theme';

export function LocationPicker({
  visible,
  selected,
  onSelect,
  onClose,
}: {
  visible: boolean;
  selected: string;
  onSelect: (loc: string) => void;
  onClose: () => void;
}) {
  const theme = useTheme();

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={[styles.sheet, { backgroundColor: theme.background }]} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handleWrap}>
            <View style={[styles.handle, { backgroundColor: theme.border }]} />
          </View>
          <View style={styles.header}>
            <ThemedText type="subtitle">Deliver to</ThemedText>
            <Pressable onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={24} color={theme.textMuted} />
            </Pressable>
          </View>
          <ThemedText type="small" themeColor="textSecondary" style={styles.sub}>
            Choose where your order should be delivered on campus.
          </ThemedText>

          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {CAMPUS_LOCATIONS.map((loc) => {
              const active = loc === selected;
              return (
                <Pressable
                  key={loc}
                  onPress={() => {
                    onSelect(loc);
                    onClose();
                  }}
                  style={[
                    styles.row,
                    { backgroundColor: active ? theme.primaryMuted : theme.card, borderColor: active ? theme.primary : theme.border },
                  ]}>
                  <View style={[styles.pin, { backgroundColor: active ? theme.primary : theme.backgroundElement }]}>
                    <Ionicons name="location" size={18} color={active ? theme.onPrimary : theme.textMuted} />
                  </View>
                  <ThemedText style={[styles.rowText, active && { color: theme.primary, fontWeight: '800' }]}>
                    {loc}
                  </ThemedText>
                  {active && <Ionicons name="checkmark-circle" size={22} color={theme.primary} />}
                </Pressable>
              );
            })}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: Spacing.four, paddingBottom: Spacing.five, maxHeight: '80%' },
  handleWrap: { alignItems: 'center', paddingVertical: Spacing.two },
  handle: { width: 40, height: 5, borderRadius: 3 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sub: { marginTop: 2, marginBottom: Spacing.three },
  list: { flexGrow: 0 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: 1,
    marginBottom: Spacing.two,
  },
  pin: { width: 40, height: 40, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  rowText: { flex: 1, fontSize: 16, fontWeight: '600' },
});
