import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { FlatList, Pressable, StyleSheet, Switch, View } from 'react-native';

import { FoodThumb } from '@/components/food-thumb';
import { ThemedText } from '@/components/themed-text';
import { Screen } from '@/components/ui/screen';
import { Radius, Spacing } from '@/constants/theme';
import { useAuth, useMenu } from '@/context/store';
import { formatNaira, type MenuItem } from '@/data/mock';
import { useTheme } from '@/hooks/use-theme';

export default function VendorMenu() {
  const theme = useTheme();
  const { user } = useAuth();
  const { menuForVendor, fetchMenu, toggleAvailability, removeMenuItem } = useMenu();
  const vendorId = user?.vendorId ?? '';
  const items = menuForVendor(vendorId);

  // Refresh whenever the screen regains focus (e.g. after adding/editing an item).
  useFocusEffect(
    useCallback(() => {
      if (vendorId) fetchMenu(vendorId);
    }, [vendorId, fetchMenu]),
  );

  return (
    <Screen edges={['top']}>
      <View style={styles.header}>
        <ThemedText type="subtitle">Menu</ThemedText>
        <Pressable
          onPress={() => router.push({ pathname: '/vendor-item/[id]', params: { id: 'new' } })}
          style={[styles.addBtn, { backgroundColor: theme.primary }]}>
          <Ionicons name="add" size={20} color={theme.onPrimary} />
          <ThemedText type="smallBold" style={{ color: theme.onPrimary }}>
            Add item
          </ThemedText>
        </Pressable>
      </View>

      <FlatList
        data={items}
        keyExtractor={(m) => m.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <MenuRow
            item={item}
            onToggle={() => toggleAvailability(item.id)}
            onEdit={() => router.push({ pathname: '/vendor-item/[id]', params: { id: item.id } })}
            onDelete={() => removeMenuItem(item.id)}
          />
        )}
        ListEmptyComponent={
          <ThemedText themeColor="textSecondary" style={styles.empty}>
            No menu items yet. Tap “Add item” to create one.
          </ThemedText>
        }
      />
    </Screen>
  );
}

function MenuRow({
  item,
  onToggle,
  onEdit,
  onDelete,
}: {
  item: MenuItem;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const theme = useTheme();
  const available = item.available !== false;

  return (
    <View style={[styles.row, { backgroundColor: theme.card, borderColor: theme.border }, !available && styles.dimmed]}>
      <FoodThumb image={item.image} emoji={item.emoji} size={56} radius={Radius.md} bg={theme.backgroundElement} emojiSize={26} />
      <View style={styles.flex}>
        <ThemedText style={styles.name} numberOfLines={1}>
          {item.name}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {formatNaira(item.price)} · {item.category}
        </ThemedText>
        <View style={styles.rowActions}>
          <View style={styles.availToggle}>
            <Switch
              value={available}
              onValueChange={onToggle}
              trackColor={{ false: theme.backgroundSelected, true: theme.primary }}
              thumbColor="#ffffff"
            />
            <ThemedText type="small" themeColor={available ? 'primary' : 'textMuted'}>
              {available ? 'Available' : 'Sold out'}
            </ThemedText>
          </View>
          <Pressable onPress={onEdit} hitSlop={6} style={styles.iconBtn}>
            <Ionicons name="create-outline" size={20} color={theme.textSecondary} />
          </Pressable>
          <Pressable onPress={onDelete} hitSlop={6} style={styles.iconBtn}>
            <Ionicons name="trash-outline" size={20} color={theme.danger} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.three,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.pill,
  },
  list: { paddingHorizontal: Spacing.four, paddingBottom: Spacing.five, gap: Spacing.three },
  row: { flexDirection: 'row', gap: Spacing.three, padding: Spacing.three, borderWidth: 1, borderRadius: Radius.lg },
  dimmed: { opacity: 0.6 },
  thumb: { width: 56, height: 56, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 15, fontWeight: '700' },
  rowActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, marginTop: Spacing.two },
  availToggle: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, flex: 1 },
  iconBtn: { padding: 2 },
  empty: { textAlign: 'center', paddingHorizontal: Spacing.four, paddingTop: Spacing.six },
});
