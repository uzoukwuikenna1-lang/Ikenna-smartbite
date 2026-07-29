import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Screen } from '@/components/ui/screen';
import { VendorCard } from '@/components/vendor-card';
import { Radius, Spacing } from '@/constants/theme';
import { useAuth, useVendors } from '@/context/store';
import { useTheme } from '@/hooks/use-theme';

const CATEGORIES = ['All', 'Rice', 'Fast food', 'Suya', 'Swallow', 'Snacks', 'Healthy'];

export default function CustomerHome() {
  const theme = useTheme();
  const { user } = useAuth();
  const { vendors: allVendors, refreshVendors } = useVendors();
  const [category, setCategory] = useState('All');

  useEffect(() => {
    refreshVendors();
  }, [refreshVendors]);

  const vendors = useMemo(() => {
    const list =
      category === 'All'
        ? allVendors
        : allVendors.filter((v) => v.categories.some((c) => c === category));
    // Open vendors first.
    return [...list].sort((a, b) => Number(b.isOpen) - Number(a.isOpen));
  }, [category, allVendors]);

  const firstName = user?.name?.split(' ')[0] ?? 'there';

  return (
    <Screen edges={['top']}>
      <FlatList
        data={vendors}
        keyExtractor={(v) => v.id}
        renderItem={({ item }) => <VendorCard vendor={item} />}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.topRow}>
              <View style={styles.flex}>
                <ThemedText type="small" themeColor="textSecondary">
                  Deliver to
                </ThemedText>
                <View style={styles.locationRow}>
                  <Ionicons name="location" size={16} color={theme.primary} />
                  <ThemedText style={styles.location}>Hostel B, FUTO</ThemedText>
                  <Ionicons name="chevron-down" size={16} color={theme.textMuted} />
                </View>
              </View>
              <View style={[styles.avatar, { backgroundColor: theme.primaryMuted }]}>
                <ThemedText style={styles.avatarText}>
                  {firstName.charAt(0).toUpperCase()}
                </ThemedText>
              </View>
            </View>

            <ThemedText type="subtitle" style={styles.greeting}>
              Hey {firstName}, hungry? 🍽️
            </ThemedText>

            <ThemedText themeColor="textMuted">Search vendors or dishes…</ThemedText>

            <FlatList
              horizontal
              data={CATEGORIES}
              keyExtractor={(c) => c}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chips}
              renderItem={({ item }) => {
                const active = item === category;
                return (
                  <Pressable
                    onPress={() => setCategory(item)}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: active ? theme.primary : theme.card,
                        borderColor: active ? theme.primary : theme.border,
                      },
                    ]}>
                    <ThemedText
                      type="smallBold"
                      style={{ color: active ? theme.onPrimary : theme.textSecondary }}>
                      {item}
                    </ThemedText>
                  </Pressable>
                );
              }}
            />

            <ThemedText style={styles.sectionTitle}>
              {vendors.length} vendor{vendors.length === 1 ? '' : 's'} near you
            </ThemedText>
          </View>
        }
        ListEmptyComponent={
          <ThemedText themeColor="textSecondary" style={styles.empty}>
            No vendors in this category yet.
          </ThemedText>
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  list: { paddingHorizontal: Spacing.four, paddingBottom: Spacing.five, gap: Spacing.three },
  header: { gap: Spacing.three, paddingTop: Spacing.two },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  location: { fontWeight: '700', fontSize: 15 },
  avatar: { width: 44, height: 44, borderRadius: Radius.pill, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontWeight: '800', fontSize: 18 },
  greeting: { marginTop: Spacing.one },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    height: 52,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  chips: { gap: Spacing.two, paddingVertical: Spacing.one },
  chip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  sectionTitle: { fontSize: 17, fontWeight: '700', marginTop: Spacing.one },
  empty: { textAlign: 'center', paddingHorizontal: Spacing.four, paddingVertical: Spacing.five },
});
