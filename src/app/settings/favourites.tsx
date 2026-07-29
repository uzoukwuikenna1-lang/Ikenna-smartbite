import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { SettingsScreen } from '@/components/settings-screen';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { VendorCard } from '@/components/vendor-card';
import { Radius, Spacing } from '@/constants/theme';
import { useFavourites, useVendors } from '@/context/store';
import { useTheme } from '@/hooks/use-theme';

export default function Favourites() {
  const theme = useTheme();
  const { favourites } = useFavourites();
  const { vendors } = useVendors();

  const favVendors = vendors.filter((v) => favourites.includes(v.id));

  return (
    <SettingsScreen title="Favourite vendors">
      {favVendors.length === 0 ? (
        <View style={styles.empty}>
          <View style={[styles.emptyIcon, { backgroundColor: theme.backgroundElement }]}>
            <Ionicons name="heart-outline" size={44} color={theme.textMuted} />
          </View>
          <ThemedText style={styles.emptyTitle}>No favourites yet</ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.emptyText}>
            Tap the heart on a vendor to save it here for quick access.
          </ThemedText>
          <Button label="Browse vendors" fullWidth={false} onPress={() => router.push('/(customer)')} style={styles.cta} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          {favVendors.map((v) => (
            <VendorCard key={v.id} vendor={v} />
          ))}
        </ScrollView>
      )}
    </SettingsScreen>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: Spacing.four, gap: Spacing.three },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.two, paddingHorizontal: Spacing.four, marginTop: -Spacing.six },
  emptyIcon: { width: 96, height: 96, borderRadius: Radius.xl, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.two },
  emptyTitle: { fontSize: 18, fontWeight: '800' },
  emptyText: { textAlign: 'center' },
  cta: { marginTop: Spacing.three, paddingHorizontal: Spacing.five },
});
