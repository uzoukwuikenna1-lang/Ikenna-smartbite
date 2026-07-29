import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Screen } from '@/components/ui/screen';
import { Radius, Spacing } from '@/constants/theme';
import { useAdmin } from '@/context/store';
import { STATUS_LABELS, formatNaira, type OrderStatus } from '@/data/mock';
import { useTheme } from '@/hooks/use-theme';

const BREAKDOWN: OrderStatus[] = ['placed', 'accepted', 'preparing', 'rider_assigned', 'delivering', 'delivered', 'rejected'];

export default function AdminDashboard() {
  const theme = useTheme();
  const { orders, stats } = useAdmin();

  const revenue = stats?.revenue ?? 0;
  const pendingVendors = stats?.pendingVendors ?? 0;
  const activeUsers = stats?.activeUsers ?? 0;
  const totalOrders = stats?.totalOrders ?? orders.length;
  const vendorCount = stats?.vendors ?? 0;

  const byStatus = BREAKDOWN.map((st) => ({ st, n: stats?.ordersByStatus?.[st] ?? 0 }));
  const maxN = Math.max(1, ...byStatus.map((b) => b.n));

  const recent = useMemo(
    () =>
      [...orders]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5),
    [orders],
  );

  return (
    <Screen edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <View>
            <ThemedText type="subtitle">Dashboard</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              SmartBite FUTO · Admin
            </ThemedText>
          </View>
          <View style={[styles.logo, { backgroundColor: theme.primary }]}>
            <ThemedText style={{ fontSize: 22 }}>🛠️</ThemedText>
          </View>
        </View>

        <View style={styles.statGrid}>
          <Stat icon="receipt-outline" label="Total orders" value={String(totalOrders)} tint={theme.primaryMuted} color={theme.primary} />
          <Stat icon="cash-outline" label="Transactions" value={formatNaira(revenue)} tint="#DBEAFE" color="#2563EB" />
          <Stat icon="storefront-outline" label="Vendors" value={String(vendorCount)} tint="#FEF3C7" color={theme.warning} />
          <Stat icon="people-outline" label="Active users" value={String(activeUsers)} tint="#FCE7F3" color="#DB2777" />
        </View>

        {pendingVendors > 0 && (
          <Pressable
            onPress={() => router.push('/(admin)/vendors')}
            style={[styles.alert, { backgroundColor: theme.card, borderColor: theme.warning }]}>
            <View style={[styles.alertIcon, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="alert-circle" size={22} color={theme.warning} />
            </View>
            <View style={styles.flex}>
              <ThemedText style={styles.alertTitle}>
                {pendingVendors} vendor{pendingVendors === 1 ? '' : 's'} awaiting verification
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Tap to review and verify
              </ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
          </Pressable>
        )}

        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <ThemedText style={styles.cardTitle}>Orders by status</ThemedText>
          {byStatus.map((b) => (
            <View key={b.st} style={styles.barRow}>
              <ThemedText type="small" themeColor="textSecondary" style={styles.barLabel} numberOfLines={1}>
                {STATUS_LABELS[b.st]}
              </ThemedText>
              <View style={[styles.barTrack, { backgroundColor: theme.backgroundElement }]}>
                <View
                  style={[
                    styles.barFill,
                    { backgroundColor: b.st === 'rejected' ? theme.danger : theme.primary, width: `${(b.n / maxN) * 100}%` },
                  ]}
                />
              </View>
              <ThemedText type="smallBold" style={styles.barValue}>
                {b.n}
              </ThemedText>
            </View>
          ))}
        </View>

        <ThemedText style={styles.sectionTitle}>Recent activity</ThemedText>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {recent.map((o, i) => (
            <View
              key={o.id}
              style={[styles.recentRow, i < recent.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border }]}>
              <View style={styles.flex}>
                <ThemedText type="smallBold">#{o.id.replace('ord-', '')} · {o.vendorName}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {o.customerName} · {STATUS_LABELS[o.status]}
                </ThemedText>
              </View>
              <ThemedText type="smallBold">{formatNaira(o.total)}</ThemedText>
            </View>
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}

function Stat({
  icon,
  label,
  value,
  tint,
  color,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  tint: string;
  color: string;
}) {
  const theme = useTheme();
  return (
    <View style={[styles.stat, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={[styles.statIcon, { backgroundColor: tint }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <ThemedText style={styles.statValue} numberOfLines={1}>
        {value}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { padding: Spacing.four, gap: Spacing.three, paddingBottom: Spacing.five },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  logo: { width: 48, height: 48, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.three },
  stat: { flexGrow: 1, flexBasis: '45%', borderWidth: 1, borderRadius: Radius.lg, padding: Spacing.three, gap: Spacing.one },
  statIcon: { width: 38, height: 38, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.one },
  statValue: { fontSize: 20, fontWeight: '800' },
  alert: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, borderWidth: 1.5, borderRadius: Radius.lg, padding: Spacing.three },
  alertIcon: { width: 40, height: 40, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  alertTitle: { fontSize: 15, fontWeight: '700' },
  card: { borderWidth: 1, borderRadius: Radius.lg, padding: Spacing.three },
  cardTitle: { fontSize: 16, fontWeight: '800', marginBottom: Spacing.three },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, marginBottom: Spacing.two },
  barLabel: { width: 110 },
  barTrack: { flex: 1, height: 10, borderRadius: Radius.pill, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: Radius.pill },
  barValue: { width: 20, textAlign: 'right' },
  sectionTitle: { fontSize: 17, fontWeight: '800', marginTop: Spacing.two },
  recentRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, paddingVertical: Spacing.three },
});
