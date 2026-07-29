import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Switch, View } from 'react-native';

import { Stars } from '@/components/stars';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { Radius, Spacing } from '@/constants/theme';
import { useAuth, useVendors } from '@/context/store';
import { formatNaira } from '@/data/mock';
import { useTheme } from '@/hooks/use-theme';

export default function VendorProfile() {
  const theme = useTheme();
  const { user, logout } = useAuth();
  const { getVendor } = useVendors();
  const vendor = user?.vendorId ? getVendor(user.vendorId) : undefined;
  const [online, setOnline] = useState(true);

  async function onLogout() {
    await logout();
    router.replace('/role-select');
  }

  return (
    <Screen edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <ThemedText type="subtitle" style={styles.title}>
          Profile
        </ThemedText>

        <View style={[styles.card, styles.vendorCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={[styles.avatar, { backgroundColor: vendor?.color ?? theme.primaryMuted }]}>
            <ThemedText style={{ fontSize: 34 }}>{vendor?.emoji ?? '🧑‍🍳'}</ThemedText>
          </View>
          <ThemedText style={styles.vendorName}>{vendor?.name}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {vendor?.tagline}
          </ThemedText>
          <View style={styles.ratingRow}>
            <Stars rating={vendor?.rating ?? 0} size={14} />
            <ThemedText type="smallBold">
              {vendor?.rating.toFixed(1)} ({vendor?.reviewCount})
            </ThemedText>
          </View>
        </View>

        <View style={[styles.onlineCard, { backgroundColor: theme.card, borderColor: online ? theme.primary : theme.border }]}>
          <View style={[styles.onlineIcon, { backgroundColor: online ? theme.primaryMuted : theme.backgroundElement }]}>
            <Ionicons name="storefront" size={22} color={online ? theme.primary : theme.textMuted} />
          </View>
          <View style={styles.flex}>
            <ThemedText style={styles.onlineTitle}>{online ? 'Accepting orders' : 'Not accepting orders'}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {online ? 'Customers can order from you now' : 'Your kitchen is offline'}
            </ThemedText>
          </View>
          <Switch
            value={online}
            onValueChange={setOnline}
            trackColor={{ false: theme.backgroundSelected, true: theme.primary }}
            thumbColor="#ffffff"
          />
        </View>

        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <InfoRow icon="person-outline" label="Manager" value={user?.name ?? 'Vendor'} />
          <InfoRow icon="mail-outline" label="Email" value={user?.email ?? '—'} last />
        </View>

        <View style={[styles.card, styles.metaCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Meta label="Delivery fee" value={formatNaira(vendor?.deliveryFee ?? 0)} />
          <Meta label="Prep time" value={`${vendor?.deliveryMins ?? 0} min`} />
          <Meta label="Min order" value={formatNaira(vendor?.minOrder ?? 0)} />
        </View>

        <Button label="Log out" variant="danger" onPress={onLogout} style={styles.logout} />
      </ScrollView>
    </Screen>
  );
}

function InfoRow({
  icon,
  label,
  value,
  last,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  last?: boolean;
}) {
  const theme = useTheme();
  return (
    <View style={[styles.infoRow, !last && { borderBottomWidth: 1, borderBottomColor: theme.border }]}>
      <View style={[styles.infoIcon, { backgroundColor: theme.backgroundElement }]}>
        <Ionicons name={icon} size={18} color={theme.text} />
      </View>
      <View style={styles.flex}>
        <ThemedText type="small" themeColor="textSecondary">
          {label}
        </ThemedText>
        <ThemedText style={styles.infoValue}>{value}</ThemedText>
      </View>
    </View>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.meta}>
      <ThemedText style={styles.metaValue}>{value}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { padding: Spacing.four, gap: Spacing.three, paddingBottom: Spacing.five },
  title: { marginBottom: Spacing.one },
  card: { borderWidth: 1, borderRadius: Radius.lg, overflow: 'hidden' },
  vendorCard: { alignItems: 'center', padding: Spacing.four, gap: Spacing.one },
  avatar: { width: 80, height: 80, borderRadius: Radius.lg, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.two },
  vendorName: { fontSize: 20, fontWeight: '800' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, marginTop: Spacing.one },
  onlineCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, borderWidth: 1.5, borderRadius: Radius.lg, padding: Spacing.three },
  onlineIcon: { width: 44, height: 44, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  onlineTitle: { fontSize: 15, fontWeight: '800' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, padding: Spacing.three },
  infoIcon: { width: 38, height: 38, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center' },
  infoValue: { fontSize: 15, fontWeight: '700' },
  metaCard: { flexDirection: 'row', padding: Spacing.four, justifyContent: 'space-around' },
  meta: { alignItems: 'center', gap: 2 },
  metaValue: { fontSize: 16, fontWeight: '800' },
  logout: { marginTop: Spacing.two },
});
