import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { api } from '@/api/client';
import { ThemedText } from '@/components/themed-text';
import { Screen } from '@/components/ui/screen';
import { VendorCard } from '@/components/vendor-card';
import { Radius, Spacing } from '@/constants/theme';
import { useVendors } from '@/context/store';
import { formatNaira, type MenuItem, type Vendor } from '@/data/mock';
import { useTheme } from '@/hooks/use-theme';

export default function Search() {
  const theme = useTheme();
  const { getVendor } = useVendors();
  const [query, setQuery] = useState('');
  const q = query.trim();

  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [dishes, setDishes] = useState<MenuItem[]>([]);

  // Debounced server-side search.
  useEffect(() => {
    if (q.length === 0) {
      setVendors([]);
      setDishes([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const res = await api.get<{ vendors: Vendor[]; dishes: MenuItem[] }>(
          `/api/search?q=${encodeURIComponent(q)}`,
        );
        setVendors(res.vendors);
        setDishes(res.dishes.slice(0, 8));
      } catch {
        /* ignore */
      }
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <Screen edges={['top']} padded>
      <ThemedText type="subtitle" style={styles.pageTitle}>
        Search
      </ThemedText>

      <View style={[styles.searchBar, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Ionicons name="search" size={20} color={theme.textMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          autoFocus
          placeholder="Search vendors or dishes…"
          placeholderTextColor={theme.textMuted}
          style={{ flex: 1, fontSize: 16, color: theme.text, height: '100%' }}
        />
        {query.length > 0 && (
          <Pressable onPress={() => setQuery('')} hitSlop={8}>
            <Ionicons name="close-circle" size={20} color={theme.textMuted} />
          </Pressable>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {q.length === 0 ? (
          <View style={styles.hintWrap}>
            <ThemedText themeColor="textMuted" style={styles.hint}>
              Try “jollof”, “suya”, “burger” or a vendor name.
            </ThemedText>
          </View>
        ) : vendors.length === 0 && dishes.length === 0 ? (
          <View style={styles.hintWrap}>
            <ThemedText themeColor="textSecondary" style={styles.hint}>
              No results for “{query}”.
            </ThemedText>
          </View>
        ) : (
          <View style={styles.results}>
            {dishes.length > 0 && (
              <View style={styles.group}>
                <ThemedText style={styles.groupTitle}>Dishes</ThemedText>
                {dishes.map((d) => {
                  const v = getVendor(d.vendorId);
                  return (
                    <Pressable
                      key={d.id}
                      onPress={() =>
                        router.push({ pathname: '/(shop)/vendor/[id]', params: { id: d.vendorId } })
                      }
                      style={[styles.dish, { borderColor: theme.border }]}>
                      <View style={[styles.dishThumb, { backgroundColor: theme.backgroundElement }]}>
                        <ThemedText style={{ fontSize: 24 }}>{d.emoji}</ThemedText>
                      </View>
                      <View style={styles.flex}>
                        <ThemedText style={styles.dishName} numberOfLines={1}>
                          {d.name}
                        </ThemedText>
                        <ThemedText type="small" themeColor="textSecondary">
                          {v?.name}
                        </ThemedText>
                      </View>
                      <ThemedText type="smallBold" themeColor="primary">
                        {formatNaira(d.price)}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>
            )}

            {vendors.length > 0 && (
              <View style={styles.group}>
                <ThemedText style={styles.groupTitle}>Vendors</ThemedText>
                {vendors.map((v) => (
                  <VendorCard key={v.id} vendor={v} />
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  pageTitle: { paddingTop: Spacing.two, marginBottom: Spacing.three },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    height: 52,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: 1,
    marginBottom: Spacing.three,
  },
  hintWrap: { paddingTop: Spacing.six, alignItems: 'center' },
  hint: { textAlign: 'center' },
  results: { gap: Spacing.four, paddingBottom: Spacing.five },
  group: { gap: Spacing.three },
  groupTitle: { fontSize: 17, fontWeight: '800' },
  dish: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingBottom: Spacing.three, borderBottomWidth: 1 },
  dishThumb: { width: 52, height: 52, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  dishName: { fontWeight: '700', fontSize: 15 },
});
